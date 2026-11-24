const { spawn } = require('node:child_process');
const { existsSync } = require('node:fs');
const path = require('node:path');

const GROK_URL = 'https://grok.com/';
const NEW_TAB = 'cursor.browserView.newTab';
const SHOW_TAB = 'cursor.browserView.focusOrShowTab';
const GET_URL = 'cursor.browserView.getURL';
const NAVIGATE = 'cursor.browserView.navigate';

async function openWindowsBrowser() {
  if (process.platform !== 'win32') return false;
  const roots = [process.env.ProgramFiles, process.env['ProgramFiles(x86)'], process.env.LOCALAPPDATA].filter(Boolean);
  const find = relative => roots.map(root => path.join(root, relative)).find(file => existsSync(file));
  const installed = [find('Microsoft/Edge/Application/msedge.exe'), find('Google/Chrome/Application/chrome.exe')];
  for (const executable of installed.filter(Boolean)) {
    const launched = await new Promise(resolve => {
      const child = spawn(executable, [GROK_URL], { detached: true, stdio: 'ignore', windowsHide: true });
      child.once('error', () => resolve(false));
      child.once('spawn', () => { child.unref(); resolve(true); });
    });
    if (launched) return true;
  }
  return false;
}

function createBrowser(vscode, workspaceState, openInstalled = openWindowsBrowser) {
  const browserKey = 'grokBrowserTab';
  let browserId = workspaceState?.get(browserKey);
  let verified = false;
  let opening;

  async function openExternal() {
    try {
      if (await vscode.env.openExternal(vscode.Uri.parse(GROK_URL))) return 'external';
    } catch {
      // Cursor may reject the system opener while starting up or in a restricted window.
    }
    return (await openInstalled()) ? 'external' : 'failed';
  }

  async function openOfficialPage(commands, id) {
    if (!commands.includes(GET_URL)) return true;
    let current = await vscode.commands.executeCommand(GET_URL, id);
    if ((!current || current === 'about:blank') && commands.includes(NAVIGATE)) {
      await vscode.commands.executeCommand(NAVIGATE, GROK_URL, id);
      current = await vscode.commands.executeCommand(GET_URL, id);
    }
    return Boolean(current && current !== 'about:blank');
  }

  async function openInCursor() {
    try {
      const commands = await vscode.commands.getCommands(true);
      if (!commands.includes(NEW_TAB)) return openExternal();
      if (browserId && commands.includes(SHOW_TAB)) {
        if (!verified) {
          try {
            const url = new URL(await vscode.commands.executeCommand(GET_URL, browserId));
            verified = url.protocol === 'https:' && ['grok.com', 'accounts.x.ai'].includes(url.hostname);
          } catch {
            verified = false;
          }
        }
        const shown = verified && await vscode.commands.executeCommand(SHOW_TAB, browserId).catch(() => undefined);
        if (shown?.success && await openOfficialPage(commands, browserId)) return 'cursor';
      }
      const opened = await vscode.commands.executeCommand(NEW_TAB, GROK_URL, { position: 'side' });
      if (opened?.success && typeof opened.browserId === 'string' && await openOfficialPage(commands, opened.browserId)) {
        browserId = opened.browserId;
        verified = true;
        void workspaceState?.update(browserKey, browserId).then(undefined, () => {});
        return 'cursor';
      }
    } catch {
      // Cursor can change or disable its integrated browser commands.
    }
    browserId = undefined;
    return openExternal();
  }

  return {
    openExternal,
    open() {
      opening ??= openInCursor().finally(() => { opening = undefined; });
      return opening;
    },
  };
}

module.exports = { createBrowser, GROK_URL };
