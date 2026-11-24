const fs = require('node:fs/promises');
const path = require('node:path');
const { dataRoot, listen } = require('./lib/local-ipc.cjs');
const { createController } = require('./lib/controller.cjs');

async function run() {
  const root = process.argv[2] || dataRoot();
  const install = __dirname;
  const configuration = JSON.parse(await fs.readFile(path.join(root, 'installation.json'), 'utf8'));
  const logfile = path.join(root, 'guarder.log');
  const log = message => {
    if (!message) return;
    void fs.appendFile(logfile, new Date().toISOString() + ' ' + message + '\n').catch(() => {});
  };
  let controller;
  try {
    await listen(root, async message => (await controller).invoke(message), async () => {
      if (controller) await (await controller).stop();
      process.exit(0);
    });
  } catch (error) {
    if (error.code === 'EADDRINUSE') return;
    throw error;
  }
  controller = createController({ root, install, ...configuration, log });
  try { await controller; } catch (error) { log(error.stack); process.exit(1); }
}

void run().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
