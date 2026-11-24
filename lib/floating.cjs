const path = require('node:path');
const { spawn } = require('node:child_process');
const { createInterface } = require('node:readline');

function createFloating(context, onMessage, log) {
  let child;
  const reads = new Map();
  let requestId = 0;

  function send(Type, data = {}) {
    if (!child?.stdin.writable) return false;
    child.stdin.write(JSON.stringify({ Type, ...data }) + '\n');
    return true;
  }

  function start() {
    if (child) return true;
    if (process.platform !== 'win32' || process.arch !== 'x64') return false;
    const extension = context.extensionUri.fsPath;
    const profile = path.join(context.globalStorageUri.fsPath, 'grok-browser');
    const exe = path.join(extension, 'native', 'bin', 'GrokGuarderFloating.exe');
    const processHandle = spawn(exe, [path.join(extension, 'floating'), profile], {
      windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'],
    });
    child = processHandle;
    processHandle.stdin.on('error', error => log(error.message));
    processHandle.stderr.setEncoding('utf8').on('data', chunk => log(chunk.trim()));
    processHandle.on('error', error => log(error.message));
    processHandle.on('close', () => {
      if (child === processHandle) child = undefined;
      for (const reject of reads.values()) reject();
      reads.clear();
    });
    createInterface({ input: processHandle.stdout }).on('line', line => {
      let message;
      try { message = JSON.parse(line); } catch { return; }
      if (message.Type === 'chunk') reads.get(message.id)?.(message.base64);
      else onMessage(message);
    });
    return true;
  }

  function readChunk(offset, length) {
    return new Promise((resolve, reject) => {
      const id = ++requestId;
      const timer = setTimeout(() => reads.get(id)?.(), 10000);
      reads.set(id, base64 => {
        clearTimeout(timer);
        reads.delete(id);
        const bytes = base64 ? Buffer.from(base64, 'base64') : null;
        if (bytes?.length === length) resolve(bytes);
        else reject(new Error('Incomplete wallpaper file'));
      });
      if (!send('importRead', { id, offset, length })) reads.get(id)?.();
    });
  }

  return {
    start, send, readChunk,
    dispose() {
      send('quit');
      child?.stdin.end();
    },
  };
}

module.exports = { createFloating };
