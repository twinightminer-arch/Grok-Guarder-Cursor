const fs = require('node:fs/promises');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { dataRoot, request } = require('./lib/local-ipc.cjs');

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

async function start(root, message) {
  const available = await request(root, { kind: 'status' }, 1000).catch(() => null);
  if (!available) {
    const env = { ...process.env };
    if (/cursor\.exe$/i.test(process.execPath)) env.ELECTRON_RUN_AS_NODE = '1';
    const child = spawn(process.execPath, [path.join(__dirname, 'resident.cjs'), root], {
      windowsHide: true, detached: true, stdio: 'ignore', env,
    });
    child.unref();
    for (let attempts = 0; attempts < 35; attempts++) {
      const ready = await request(root, { kind: 'status' }, 500).catch(() => null);
      if (ready) return message.kind === 'status' ? ready : request(root, message);
      await wait(180);
    }
    throw new Error('The Grok Guarder companion could not start.');
  }
  return message.kind === 'status' ? available : request(root, message);
}

if (require.main === module) {
  const mode = process.argv[2];
  const root = process.argv[3] || dataRoot();
  const message = mode === '--resident' ? { kind: 'status' }
    : { kind: 'launch', mode: mode === '--classic' ? 'classic' : 'glass' };
  void start(root, message).catch(async error => {
    await fs.appendFile(path.join(root, 'guarder.log'), error.message + '\n').catch(() => {});
    process.exitCode = 1;
  });
}

module.exports = { start };
