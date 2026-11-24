const fs = require('node:fs/promises');
const { existsSync } = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { pathToFileURL } = require('node:url');
const { spawn } = require('node:child_process');
const { Readable } = require('node:stream');
const { createFloating } = require('./floating.cjs');
const { createCursorPipe } = require('./cursor-pipe.cjs');
const { cleanTheme, destination, mergeDestinations, legacyRoots, readLegacy } = require('./legacy.cjs');
const { LANGS, translate } = require('./panel-i18n.cjs');
const { labelsFor } = require('./host-language.cjs');

const labels = [
  'externalGrok', 'pastePrompt', 'previewError', '壁纸 · 划词翻译 · 本地生词本', '关闭面板', '壁纸库', '生词本', '主题', '设置',
  'Wallpaper Engine 与本地壁纸库', '搜索标题或标签', '全部', '可应用视频', '本地导入', '其他', '仅收藏', '按名称', '按大小',
  '无预览', '暂不可应用', '预览视频', '取消收藏', '收藏', '应用', '没有符合条件的壁纸。', '我的生词本', '搜索词条',
  '刷新词条', '编辑笔记', '归档', '尚无词条', 'Notion 生词本地址', 'Obsidian 生词本地址', 'OneNote 生词本地址',
  '打开 Notion 生词本', '打开 Obsidian 生词本', '打开 OneNote 生词本', '地址已配置', '未配置地址', '地址格式无效',
  '播放状态', '正在准备壁纸', '继续播放', '暂停', '恢复原界面', '导入本地壁纸', '画面与可读性', '顶栏颜色', '跟随系统背景',
  '智能识别', '自定义选择', '字体颜色', '自动跟随宿主', '输入框背景颜色', '使用宿主原色', '内容背板不透明度',
  '侧边栏不透明度', '背景遮罩', '背景模糊', '画面缩放', '壁纸音量', '拖动时立即预览，设置自动保存。',
  '语言设置', '外观', 'Guarder 面板颜色', 'Guarder 面板颜色 HEX', '恢复默认', '操作失败', '导入大小限制',
  '正在导入壁纸', '壁纸导入完成', '加入生词本', '划词翻译', '复制选中文本', 'Google 搜索', '已加入生词本', '已复制',
  '控制通道未连接',
];
const sync = [
  '同步 Cursor 界面语言', '同步 Cursor 介面語言', 'Sync Cursor interface language', 'Cursor の表示言語と同期', 'Cursor 표시 언어 동기화',
];
const hostUnavailable = [
  '从「Cursor · Grok Guarder」启动后，壁纸和界面语言会应用到 Cursor 窗口。',
  '從「Cursor · Grok Guarder」啟動後，桌布和介面語言會套用到 Cursor 視窗。',
  'Start Cursor from “Cursor · Grok Guarder” to apply the wallpaper and interface language.',
  '「Cursor · Grok Guarder」から起動すると、壁紙と表示言語が Cursor に適用されます。',
  '“Cursor · Grok Guarder”로 실행하면 배경화면과 표시 언어가 Cursor에 적용됩니다.',
];
const translated = Object.fromEntries(LANGS.map((lang, index) => [lang, {
  ...Object.fromEntries(labels.map(key => [key, translate(lang, key)])),
  sync: sync[index], hostUnavailable: hostUnavailable[index],
}]));

function wallpaperItem(item) {
  function inside(file) {
    if (typeof file !== 'string' || !path.isAbsolute(file) || !path.isAbsolute(item.projectRoot || '')) return;
    const relative = path.relative(item.projectRoot, file);
    if (relative && relative !== '..' && !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative)) return file;
  }
  return { ...item, filePath: inside(item.filePath), playablePath: inside(item.playablePath), previewPath: inside(item.previewPath) };
}

function openHTTPS(url) {
  const browser = spawn('rundll32.exe', ['url.dll,FileProtocolHandler', url], {
    windowsHide: true, detached: true, stdio: 'ignore',
  });
  browser.on('error', () => {});
  browser.unref();
}

function text(value) {
  return typeof value === 'string' && value.length <= 1500 ? value.trim() : '';
}

async function createController({ root, executable, install, profile, vocabularyRoot, dataRoot, log }) {
  const [{ VocabularyStore }, { LocalWallpaperStore }, { backgroundMedia, poster, preview, stopMediaJobs }, { allowMediaOrigin }] = await Promise.all([
    import('./vocabulary.mjs'), import('./local-imports.mjs'), import('./wallpaper-media.mjs'), import('./media-server.mjs'),
  ]);
  allowMediaOrigin('https://guarder-panel.invalid');
  const directories = legacyRoots({ get: key => key === 'legacyDataRoot' ? dataRoot : undefined });
  const old = await readLegacy(directories.shared, directories.antigravity, root);
  const settingsFile = path.join(root, 'settings.json');
  let stored = {};
  try { stored = JSON.parse(await fs.readFile(settingsFile, 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const defaultLanguage = LANGS.includes(old.language) ? old.language : 'zh-CN';
  let settings = {
    language: defaultLanguage, wallpaper: old.wallpaper ?? null, favorites: old.favorites, sync: true,
    ...stored, destinations: mergeDestinations(old.destinations, stored.destinations),
    theme: { ...old.theme, ...cleanTheme(stored.theme) },
  };
  const cache = path.join(root, 'wallpaper-cache');
  const local = new LocalWallpaperStore(root, {
    ffmpeg: process.env.GUARDER_FFMPEG, ffprobe: process.env.GUARDER_FFPROBE,
  });
  const vocabulary = new VocabularyStore(vocabularyRoot || path.join(os.homedir(), 'Documents', 'GPT Salad Vocabulary'));
  const floating = createFloating({
    extensionUri: { fsPath: install }, globalStorageUri: { fsPath: root },
  }, fromPanel, log);
  const pipe = createCursorPipe(executable, path.join(install, 'floating', 'host-renderer.js'), log, () => {
    floating.send('managed', { Active: pipe.connected > 0 });
    sendPanel();
  }, (event, geometry) => {
    floating.send(event === 'toggle' ? 'domToggle' : 'domMove', { Geometry: geometry });
  });
  let operation = Promise.resolve();
  let panelReady = false;
  let revision = 0;
  let asset;
  let rendering;
  let mediaFailed = false;
  let catalog = new Map();
  const posterQueue = [];
  const posters = new Map();
  let workers = 0;

  function enqueue(task) {
    const next = operation.then(task);
    operation = next.catch(error => log(error.message));
    return next;
  }

  async function save(delta) {
    settings = { ...settings, ...delta };
    const temporary = settingsFile + '.pending';
    await fs.writeFile(temporary, JSON.stringify(settings, null, 2) + '\n', 'utf8');
    await fs.rename(temporary, settingsFile);
  }

  function loadCatalog() {
    const sources = [new LocalWallpaperStore(directories.shared), new LocalWallpaperStore(directories.antigravity), local];
    const imports = sources.flatMap(item => item.list()).filter(item => !item.missing);
    catalog = new Map([...old.catalog, ...imports].map(item => [item.id, wallpaperItem(item)]));
  }

  function sendPanel() {
    if (!panelReady) return;
    const entries = existsSync(vocabulary.entries) ? vocabulary.list().filter(item => !item.archived) : [];
    floating.send('state', {
      panel: translated,
      config: { language: settings.language, favorites: settings.favorites, pageColor: settings.theme.pageColor, sync: settings.sync },
      data: {
        hostConnected: pipe.connected > 0, selected: settings.wallpaper, mediaPending: Boolean(rendering),
        mediaFailed, media: asset && { type: asset.type, url: asset.url }, entries, entryCount: entries.length,
        theme: settings.theme, destinations: settings.destinations,
        wallpapers: [...catalog.values()].map(item => ({
          id: item.id, title: item.title || item.id, tags: item.tags || [],
          size: Number(item.bytes ?? item.sizeBytes) || 0, local: item.id.startsWith('import:'),
          video: item.type === 'video' || item.kind === 'video', unsupported: !item.filePath && !item.playablePath && !item.previewPath,
        })),
      },
    });
  }

  function publish() {
    const media = asset && {
      kind: asset.type.split('/')[0], url: 'vscode-file://vscode-app' + pathToFileURL(asset.localFile).pathname,
    };
    pipe.setState({ locale: settings.sync ? settings.language : '', labels: settings.sync ? labelsFor(settings.language) : [],
      theme: settings.theme, media, icon: 'vscode-file://vscode-app' + pathToFileURL(path.join(install, 'floating', 'grok.png')).pathname });
    sendPanel();
  }

  function updateWallpaper() {
    const current = ++revision;
    const chosen = catalog.get(settings.wallpaper);
    mediaFailed = Boolean(settings.wallpaper && !chosen);
    asset = null;
    rendering = chosen && backgroundMedia(chosen, cache);
    publish();
    if (!rendering) return;
    void rendering.catch(error => { log(error.message); }).then(next => {
      if (revision !== current) return;
      rendering = undefined;
      asset = next;
      mediaFailed = !next;
      publish();
    });
  }

  async function refreshCatalog() {
    loadCatalog();
    if (settings.wallpaper && !asset && !rendering) updateWallpaper();
    else sendPanel();
  }

  function runPosters() {
    while (workers < 3 && posterQueue.length) {
      const [item, resolve] = posterQueue.shift();
      workers++;
      void poster(item, path.join(cache, 'posters')).catch(() => undefined).then(resolve).finally(() => {
        workers--;
        runPosters();
      });
    }
  }

  async function previewRequest(request) {
    const item = catalog.get(request?.id);
    if (!item) return;
    if (request.poster) {
      if (!posters.has(item.id)) posters.set(item.id, new Promise(resolve => {
        posterQueue.push([item, resolve]); runPosters();
      }));
      floating.send('poster', { id: item.id, url: (await posters.get(item.id))?.url });
    } else if (Number.isSafeInteger(request.sequence)) {
      const media = await preview(item, path.join(cache, 'previews'), request.convert === true).catch(() => undefined);
      floating.send('preview', { request, asset: media && { type: media.type, url: media.url, canConvert: media.canConvert } });
    }
  }

  async function configure(change) {
    if (!change || typeof change !== 'object') return;
    const next = {};
    if (LANGS.includes(change.language)) next.language = change.language;
    if (typeof change.sync === 'boolean') next.sync = change.sync;
    if (change.theme || Object.hasOwn(change, 'pageColor')) next.theme = {
      ...settings.theme, ...cleanTheme(change.theme), ...cleanTheme({ pageColor: change.pageColor }),
    };
    if (change.wallpaper === null || catalog.has(change.wallpaper)) next.wallpaper = change.wallpaper;
    if (catalog.has(change.favorite)) {
      const favorites = new Set(settings.favorites);
      if (!favorites.delete(change.favorite)) favorites.add(change.favorite);
      next.favorites = [...favorites];
    }
    if (change.destination) {
      const { name, value } = change.destination;
      const url = destination(name, value);
      if (url !== undefined) next.destinations = { ...settings.destinations, [name]: url };
    }
    if (!Object.keys(next).length) return;
    await save(next);
    if (Object.hasOwn(next, 'wallpaper')) updateWallpaper();
    else publish();
  }

  function saveSelection(value) {
    const clean = text(value);
    if (!clean) return false;
    if (!existsSync(vocabulary.entries) || !vocabulary.list().some(item => item.source_text === clean)) vocabulary.save(clean);
    floating.send('status', { key: '已加入生词本' });
    sendPanel();
    return true;
  }

  async function fromCommand(message) {
    switch (message?.type) {
      case 'refresh': return sendPanel();
      case 'config': return configure(message.change);
      case 'save': return saveSelection(message.text);
      case 'searchSelection': {
        const selected = text(message.text);
        if (selected) openHTTPS('https://www.google.com/search?q=' + encodeURIComponent(selected));
        return;
      }
      case 'destination': {
        const url = destination(message.name, message.value ?? settings.destinations[message.name]);
        if (url) openHTTPS(url);
        return;
      }
      case 'entry': {
        const item = vocabulary.list().find(entry => entry.id === message.id);
        if (!item) return;
        if (message.action === 'favorite') vocabulary.update(item.id, item.revision, { favorite: !item.favorite });
        if (message.action === 'archive') vocabulary.update(item.id, item.revision, { archived: true });
        if (message.action === 'notes' && typeof message.notes === 'string') vocabulary.update(item.id, item.revision, { notes: message.notes });
        return sendPanel();
      }
      case 'import': {
        const { size, name } = message;
        if (!Number.isSafeInteger(size) || size < 1 || size > 1024 ** 3 || typeof name !== 'string') return;
        try {
          const chunks = async function* () {
            const chunk = 512 * 1024;
            for (let offset = 0; offset < size; offset += chunk) {
              yield await floating.readChunk(offset, Math.min(chunk, size - offset));
            }
          };
          const item = await local.importStream(Readable.from(chunks()), path.basename(name));
          loadCatalog();
          await configure({ wallpaper: item.id });
          floating.send('importFinished', { key: '壁纸导入完成' });
        } catch (error) {
          log(error.message);
          floating.send('importFinished', { key: '操作失败' });
        }
      }
    }
  }

  function fromPanel(message) {
    if (message.Type === 'ready') { panelReady = true; sendPanel(); }
    if (message.Type === 'external') openHTTPS('https://grok.com/');
    if (message.Type === 'preview') void previewRequest(message.request).catch(error => log(error.message));
    if (message.Type === 'commands' && Array.isArray(message.batch)) {
      for (const command of message.batch) void enqueue(() => fromCommand(command)).catch(() => {});
    }
  }

  async function seed(previous) {
    if (settings.seeded || !previous || typeof previous !== 'object') return;
    const next = { seeded: true };
    if (LANGS.includes(previous.language)) next.language = previous.language;
    if (Array.isArray(previous.favorites)) next.favorites = previous.favorites.filter(id => typeof id === 'string');
    if (catalog.has(previous.wallpaper) || previous.wallpaper === null) next.wallpaper = previous.wallpaper;
    next.theme = { ...settings.theme, ...cleanTheme(previous.theme) };
    next.destinations = mergeDestinations(settings.destinations, previous.destinations);
    await save(next);
    updateWallpaper();
  }

  local.onChange = () => { void enqueue(refreshCatalog).catch(() => {}); };
  loadCatalog();
  updateWallpaper();
  local.resumePending();
  floating.start();

  return {
    invoke(message) {
      return enqueue(async () => {
        switch (message.kind) {
          case 'status': return { language: settings.language, connected: pipe.connected, wallpaper: settings.wallpaper };
          case 'inspect': return pipe.inspect();
          case 'refreshRenderer': await pipe.reloadRenderer(); return true;
          case 'launch': pipe.launch([message.mode === 'classic' ? '--classic' : '--glass'], profile); return true;
          case 'toggle':
          case 'show': floating.start(); return floating.send(message.kind);
          case 'save': return saveSelection(message.text);
          case 'seed': return seed(message.previous);
          case 'external': openHTTPS('https://grok.com/'); return true;
          case 'quitCursor': await pipe.quit(); return true;
          case 'stop': return 'stop';
          default: throw new Error('Unknown Guarder action');
        }
      });
    },
    async stop() {
      floating.dispose();
      local.onChange = null;
      local.stop();
      await stopMediaJobs();
    },
  };
}

module.exports = { createController, wallpaperItem };
