const fs = require('node:fs/promises');
const net = require('node:net');
const path = require('node:path');
const { createHash, randomBytes } = require('node:crypto');

const dataRoot = () => process.env.GROK_GUARDER_ROOT || path.join(process.env.LOCALAPPDATA, 'Grok Guarder Cursor');
const address = root => '\\\\.\\pipe\\GrokGuarder-' + createHash('sha256').update(path.resolve(root).toLowerCase()).digest('hex').slice(0, 28);
const secretPath = root => path.join(root, 'control-token');

async function token(root, create = false) {
  const file = secretPath(root);
  if (create) {
    await fs.mkdir(root, { recursive: true });
    await fs.writeFile(file, randomBytes(32).toString('hex'), { flag: 'wx', mode: 0o600 }).catch(error => {
      if (error.code !== 'EEXIST') throw error;
    });
  }
  const value = await fs.readFile(file, 'utf8');
  if (!/^[a-f0-9]{64}$/.test(value)) throw new Error('Invalid local Guarder control token');
  return value;
}

async function request(root, message, timeout = 5000) {
  const key = await token(root);
  return new Promise((resolve, reject) => {
    const socket = net.createConnection(address(root));
    let output = '';
    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error('Guarder service did not respond'));
    }, timeout);
    socket.setEncoding('utf8');
    socket.once('connect', () => socket.write(JSON.stringify({ ...message, token: key }) + '\n'));
    socket.on('data', chunk => { output += chunk; });
    socket.once('error', error => { clearTimeout(timer); reject(error); });
    socket.once('end', () => {
      clearTimeout(timer);
      try {
        const reply = JSON.parse(output);
        if (reply.error) reject(new Error(reply.error));
        else resolve(reply.value);
      } catch (error) { reject(error); }
    });
  });
}

async function listen(root, handler, onStop) {
  const key = await token(root, true);
  const server = net.createServer({ allowHalfOpen: true }, socket => {
    let input = '';
    let handled = false;
    socket.setEncoding('utf8');
    socket.on('error', () => {});
    socket.on('data', async part => {
      if (handled) return;
      input += part;
      if (input.length > 65536) { socket.destroy(); return; }
      if (!input.includes('\n')) return;
      handled = true;
      let response;
      let stop = false;
      try {
        const value = JSON.parse(input.slice(0, input.indexOf('\n')));
        if (value.token !== key) throw new Error('Guarder control authentication failed');
        response = { value: await handler(value) };
        stop = value.kind === 'stop';
      } catch (error) { response = { error: error.message }; }
      socket.end(JSON.stringify(response), () => {
        if (stop) {
          server.close();
          void onStop();
        }
      });
    });
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(address(root), resolve);
  });
  return server;
}

module.exports = { dataRoot, request, listen };
