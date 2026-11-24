const { spawn } = require('node:child_process');
const fs = require('node:fs/promises');
const path = require('node:path');

const shellPath = '/resources/app/out/vs/code/electron-sandbox/workbench/workbench.html';

function workbench(target, executable) {
  if (target?.type !== 'page') return false;
  try {
    const url = new URL(target.url);
    const requested = decodeURIComponent(url.pathname).replaceAll('\\', '/').toLowerCase();
    const directory = '/' + path.dirname(executable).replaceAll('\\', '/').toLowerCase();
    return url.protocol === 'vscode-file:' && url.host === 'vscode-app' && requested === directory + shellPath;
  } catch {
    return false;
  }
}

function createCursorPipe(executable, rendererFile, log, onStatus, onAnchor) {
  const sessions = new Map();
  const pending = new Map();
  let child;
  let messageId = 0;
  let activeState;
  let discovery;
  let renderer;
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;
  delete env.NODE_OPTIONS;

  function call(method, params = {}, sessionId) {
    if (!child?.stdio[3].writable) return Promise.reject(new Error('Cursor shell channel is not connected'));
    const id = ++messageId;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error(method + ' timed out'));
      }, 4000);
      pending.set(id, { resolve, reject, timer });
      child.stdio[3].write(JSON.stringify({ id, method, params, sessionId }) + '\0', error => {
        if (!error || !pending.delete(id)) return;
        clearTimeout(timer);
        reject(error);
      });
    });
  }

  async function evaluate(session, expression) {
    const result = await call('Runtime.evaluate', {
      expression, contextId: session.context, awaitPromise: true, returnByValue: true,
    }, session.id);
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || 'Cursor view update failed');
    return result.result.value;
  }

  async function configure(session) {
    const { frameTree } = await call('Page.getFrameTree', {}, session.id);
    if (!workbench({ type: 'page', url: frameTree.frame.url }, executable)) return;
    const { executionContextId } = await call('Page.createIsolatedWorld', {
      frameId: frameTree.frame.id, worldName: 'grok-guarder-cursor',
    }, session.id);
    session.context = executionContextId;
    await call('Runtime.enable', {}, session.id);
    await call('Runtime.addBinding', { name: 'grokGuarderAnchor', executionContextId }, session.id);
    renderer ??= await fs.readFile(rendererFile, 'utf8');
    await evaluate(session, renderer);
  }

  function push(session) {
    if (session.busy) {
      session.dirty = true;
      return;
    }
    if (!activeState) return;
    session.busy = true;
    const run = async () => {
      if (!session.context) await configure(session);
      if (session.context) {
        await evaluate(session, 'globalThis.grokGuarderHost?.apply(' + JSON.stringify(activeState) + ')');
      }
    };
    void run().catch(error => {
      session.context = undefined;
      if (!/Target closed|Cannot find context|Session with given id/.test(error.message)) log(error.message);
    }).finally(() => {
      session.busy = false;
      if (session.dirty) {
        session.dirty = false;
        push(session);
      }
    });
  }

  async function attach(target) {
    const known = sessions.get(target.targetId);
    if (known?.id && !known.context) push(known);
    if (known) return;
    const entry = {};
    sessions.set(target.targetId, entry);
    try {
      const { sessionId } = await call('Target.attachToTarget', { targetId: target.targetId, flatten: true });
      if (sessions.get(target.targetId) !== entry) return;
      entry.id = sessionId;
      await call('Page.enable', {}, sessionId);
      push(entry);
      onStatus();
    } catch {
      if (sessions.get(target.targetId) === entry) sessions.delete(target.targetId);
      onStatus();
    }
  }

  function receive(event) {
    if (event.id) {
      const handle = pending.get(event.id);
      if (!handle) return;
      pending.delete(event.id);
      clearTimeout(handle.timer);
      if (event.error) handle.reject(new Error(event.error.message));
      else handle.resolve(event.result);
      return;
    }
    if (event.method === 'Runtime.bindingCalled' && event.params.name === 'grokGuarderAnchor') {
      const session = [...sessions.values()].find(item => item.id === event.sessionId);
      if (session?.context !== event.params.executionContextId) return;
      try {
        const { event: action, X, Y } = JSON.parse(event.params.payload);
        if (!['toggle', 'move'].includes(action) || ![X, Y].every(n => Number.isSafeInteger(n) && n >= 0 && n <= 20000)) return;
        onAnchor(action, { X, Y });
      } catch { return; }
    }
    if (event.method === 'Target.targetCreated' || event.method === 'Target.targetInfoChanged') {
      const target = event.params.targetInfo;
      if (workbench(target, executable)) void attach(target);
    }
    if (event.method === 'Target.targetDestroyed') {
      if (sessions.delete(event.params.targetId)) onStatus();
    }
    if (event.method === 'Page.frameNavigated' && !event.params.frame.parentId) {
      const session = [...sessions.values()].find(item => item.id === event.sessionId);
      if (session) {
        session.context = undefined;
        push(session);
      }
    }
  }

  async function scan() {
    try {
      const { targetInfos } = await call('Target.getTargets');
      for (const target of targetInfos) if (workbench(target, executable)) void attach(target);
    } catch {
      // The regular discovery pass retries during Cursor startup.
    }
  }

  function launch(args = [], profile) {
    if (child) {
      const window = spawn(executable, [...(profile ? ['--user-data-dir=' + profile] : []), '--new-window', ...args], {
        detached: true, stdio: 'ignore', windowsHide: true, env,
      });
      window.on('error', error => log(error.message));
      window.unref();
      return;
    }
    const processHandle = spawn(executable, ['--remote-debugging-pipe', ...(profile ? ['--user-data-dir=' + profile] : []), ...args], {
      windowsHide: true, stdio: ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'], env,
    });
    child = processHandle;
    let buffer = '';
    processHandle.stdio[3].on('error', () => {});
    processHandle.stdio[4].setEncoding('utf8').on('data', data => {
      buffer += data;
      let end;
      while ((end = buffer.indexOf('\0')) !== -1) {
        const line = buffer.slice(0, end);
        buffer = buffer.slice(end + 1);
        try { receive(JSON.parse(line)); } catch (error) { log(error.message); }
      }
    });
    processHandle.on('error', error => log(error.message));
    processHandle.once('close', () => {
      if (child !== processHandle) return;
      clearInterval(discovery);
      child = undefined;
      sessions.clear();
      for (const task of pending.values()) {
        clearTimeout(task.timer);
        task.reject(new Error('Cursor shell channel closed'));
      }
      pending.clear();
      onStatus();
    });
    void call('Target.setDiscoverTargets', { discover: true }).catch(() => {});
    discovery = setInterval(scan, 1800);
    void scan();
  }

  return {
    launch,
    setState(state) {
      activeState = state;
      for (const session of sessions.values()) if (session.id) push(session);
    },
    get connected() { return [...sessions.values()].filter(session => session.context).length; },
    async inspect() {
      const states = await Promise.all([...sessions.values()].filter(session => session.context).map(session =>
        evaluate(session, 'globalThis.grokGuarderHost?.inspect()').catch(() => undefined)));
      return states.filter(Boolean);
    },
    async reloadRenderer() {
      renderer = await fs.readFile(rendererFile, 'utf8');
      await Promise.all([...sessions.values()].filter(session => session.context).map(async session => {
        await evaluate(session, 'globalThis.grokGuarderHost?.dispose()');
        await evaluate(session, renderer);
        push(session);
      }));
    },
    async quit() {
      if (child) await call('Browser.close').catch(() => {});
    },
  };
}

module.exports = { createCursorPipe, workbench };
