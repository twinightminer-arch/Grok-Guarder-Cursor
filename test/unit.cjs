const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const { createBrowser, GROK_URL } = require('../lib/browser.cjs');
const { cleanTheme, destination, mergeDestinations, readLegacy } = require('../lib/legacy.cjs');
const { selectedText, translationPrompt, wallpaperItem } = require('../extension');

test('Cursor browser opens the official origin, reuses its tab, and creates a new one after closing', async () => {
  const calls = [];
  let tabs = [];
  const vscode = {
    Uri: { parse: value => new URL(value) },
    env: { openExternal: uri => { calls.push(['external', uri.href]); return true; } },
    commands: {
      getCommands: async () => ['cursor.browserView.newTab', 'cursor.browserView.focusOrShowTab'],
      async executeCommand(command, ...args) {
        calls.push([command, ...args]);
        if (command.endsWith('newTab')) {
          tabs.push('new-id');
          return { success: true, browserId: 'new-id' };
        }
        return { success: tabs.includes(args[0]) };
      },
    },
  };
  const browser = createBrowser(vscode);
  assert.deepEqual(await Promise.all([browser.open(), browser.open()]), ['cursor', 'cursor']);
  assert.deepEqual(calls, [['cursor.browserView.newTab', GROK_URL, { position: 'side' }]]);
  assert.equal(await browser.open(), 'cursor');
  assert.equal(calls.at(-1)[0], 'cursor.browserView.focusOrShowTab');
  tabs = [];
  assert.equal(await browser.open(), 'cursor');
  assert.equal(calls.at(-1)[0], 'cursor.browserView.newTab');
  assert.equal(await browser.openExternal(), 'external');
  assert.deepEqual(calls.at(-1), ['external', GROK_URL]);
});

test('missing or rejected Cursor browser commands fall back to the system browser', async () => {
  let launched;
  const vscode = {
    Uri: { parse: value => new URL(value) },
    env: { openExternal: (uri, options) => { launched = { url: uri.href, options }; return true; } },
    commands: { getCommands: async () => [] },
  };
  assert.equal(await createBrowser(vscode).open(), 'external');
  assert.deepEqual(launched, { url: GROK_URL, options: undefined });
  vscode.commands.getCommands = async () => ['cursor.browserView.newTab'];
  vscode.commands.executeCommand = async () => { throw Error('not available'); };
  assert.equal(await createBrowser(vscode).open(), 'external');
  vscode.env.openExternal = async () => false;
  assert.equal(await createBrowser(vscode, undefined, async () => true).open(), 'external');
  assert.equal(await createBrowser(vscode, undefined, async () => false).open(), 'failed');
});

test('fills a blank Cursor browser tab through its native navigation command', async () => {
  let url;
  let navigations = 0;
  const list = ['cursor.browserView.newTab', 'cursor.browserView.getURL', 'cursor.browserView.navigate'];
  const vscode = {
    commands: {
      getCommands: async () => list,
      async executeCommand(command, ...args) {
        if (command.endsWith('newTab')) return { success: true, browserId: 'new' };
        if (command.endsWith('getURL')) return url;
        assert.deepEqual(args, [GROK_URL, 'new']);
        url = args[0];
        navigations++;
      },
    },
  };
  assert.equal(await createBrowser(vscode).open(), 'cursor');
  assert.equal(navigations, 1);
});

test('selection and prompt preserve formatting, include only selected ranges, and respect language', () => {
  const editor = { selections: ['  Hello  ', ' ', '你好\n世界'], document: { getText: value => value } };
  assert.equal(selectedText(editor), 'Hello\n\n你好\n世界');
  assert.match(translationPrompt(selectedText(editor), 'Japanese'), /^Translate .* Japanese\./);
  assert.ok(translationPrompt(selectedText(editor), 'Japanese').endsWith('Hello\n\n你好\n世界'));
  assert.equal(selectedText(undefined), '');
});

test('migrates original settings without touching originals and validates local media and destination URIs', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'guarder-test-'));
  t.after(() => fs.rm(root, { force: true, recursive: true }));
  const shared = path.join(root, 'shared');
  const original = path.join(root, 'original');
  await Promise.all([fs.mkdir(shared), fs.mkdir(original)]);
  await fs.writeFile(path.join(shared, 'state.json'), JSON.stringify({
    wallpaper: { enabled: true, defaultId: 'shared-wallpaper', opacity: 0.5 },
  }));
  const settings = JSON.stringify({
    language: 'zh-TW', zoomModel: 2, wallpaper: null, favorites: ['one'], theme: { zoom: 0, volume: 0 },
    destinations: { notion: 'https://example.com/vocab', obsidian: 'obsidian://open', onenote: 'file:///C:/test' },
  });
  const settingsFile = path.join(original, 'settings.json');
  await fs.writeFile(settingsFile, settings);
  const result = await readLegacy(shared, original);
  assert.equal(result.language, 'zh-TW');
  assert.equal(result.wallpaper, null);
  assert.equal(result.theme.opacity, 0.5);
  assert.equal(result.theme.zoom, 0);
  assert.deepEqual(result.favorites, ['one']);
  assert.equal(result.destinations.notion, 'https://example.com/vocab');
  assert.equal(result.destinations.obsidian, 'obsidian://open');
  assert.equal(result.destinations.onenote, '');
  const defaultsFile = path.join(root, 'vocabulary-destinations.json');
  const defaults = JSON.stringify({
    notion: 'https://example.org/default', obsidian: 'obsidian://open?vault=Vocabulary',
    onenote: 'onenote:https://example.com/vocabulary',
  });
  await fs.writeFile(defaultsFile, defaults);
  const inherited = await readLegacy(shared, original, root);
  assert.deepEqual(mergeDestinations(inherited.destinations, { obsidian: '', notion: 'file:///private' }), {
    notion: 'https://example.com/vocab', obsidian: '', onenote: 'onenote:https://example.com/vocabulary',
  });
  assert.equal(await fs.readFile(defaultsFile, 'utf8'), defaults);
  assert.equal(await fs.readFile(settingsFile, 'utf8'), settings);
  assert.deepEqual(cleanTheme({ blurPx: -1, zoom: 500, fontColor: null, pageColor: 'invalid' }),
    { blurPx: 0, zoom: 100, fontColor: null });
  assert.equal(destination('notion', 'https://user:pass@example.com'), undefined);

  const inside = path.join(shared, 'wallpaper.mp4');
  const outside = path.join(original, 'preview.jpg');
  const resultItem = wallpaperItem({ projectRoot: shared, filePath: inside, previewPath: outside });
  assert.equal(resultItem.filePath, inside);
  assert.equal(resultItem.previewPath, undefined);
});

test('the Agents companion returns its updated app resource', async () => {
  const { spawnSync } = require('node:child_process');
  const calls = [
    { id: 1, method: 'initialize', params: { protocolVersion: '2025-11-25' } },
    { id: 2, method: 'tools/list' },
    { id: 3, method: 'tools/call', params: { name: 'open_guarder' } },
    { id: 4, method: 'resources/read', params: { uri: 'ui://groks-guarder/panel.html' } },
  ].map(row => JSON.stringify({ jsonrpc: '2.0', ...row })).join('\n') + '\n';
  const result = spawnSync(process.execPath, [path.join(__dirname, '../cursor-plugin/panel.mjs')], { input: calls, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const [init, tools, answer, resource] = result.stdout.trim().split('\n').map(line => JSON.parse(line).result);
  assert.equal(init.serverInfo.version, '0.1.0');
  assert.equal(tools.tools[0]._meta.ui.resourceUri, resource.contents[0].uri);
  assert.match(answer.content[0].text, /https:\/\/grok\.com\//);
  assert.match(resource.contents[0].text, />Grok Guarder<\/h1>/);
});
