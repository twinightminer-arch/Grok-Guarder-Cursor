const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');

const destinationNames = ['notion', 'obsidian', 'onenote'];
const themeDefaults = {
  opacity: 0.72, sidebarOpacity: 0.72, scrimOpacity: 0.2, blurPx: 12, zoom: 35, volume: 0,
  fontColor: null, composerBackgroundColor: null, pageColor: null,
  titlebarMode: 'smart', titlebarColor: '#181528',
};
const themeBounds = {
  opacity: [0, 1], sidebarOpacity: [0, 1], scrimOpacity: [0, 1],
  blurPx: [0, 100], zoom: [0, 100], volume: [0, 1],
};

async function readJSON(file) {
  try {
    return JSON.parse((await fs.readFile(file, 'utf8')).replace(/^\uFEFF/, '')) || {};
  } catch (error) {
    if (error.code === 'ENOENT' || error instanceof SyntaxError) return {};
    throw error;
  }
}

function cleanTheme(raw) {
  const theme = {};
  for (const [key, [min, max]] of Object.entries(themeBounds)) {
    if (Number.isFinite(raw?.[key])) theme[key] = Math.max(min, Math.min(raw[key], max));
  }
  for (const key of ['fontColor', 'composerBackgroundColor', 'pageColor']) {
    if (raw?.[key] === null || /^#[a-f\d]{6}$/i.test(raw?.[key] || '')) theme[key] = raw[key];
  }
  if (['system', 'smart', 'custom'].includes(raw?.titlebarMode)) theme.titlebarMode = raw.titlebarMode;
  if (/^#[a-f\d]{6}$/i.test(raw?.titlebarColor || '')) theme.titlebarColor = raw.titlebarColor;
  return theme;
}

function destination(name, input) {
  if (!destinationNames.includes(name) || typeof input !== 'string' || input.length > 2048 || /[\r\n]/.test(input)) return;
  if (!input.trim()) return '';
  try {
    const url = new URL(input.trim());
    if (url.username || url.password) return;
    if (url.protocol === 'https:' || (name !== 'notion' && url.protocol === name + ':')) return url.href;
  } catch {
    return;
  }
}

function mergeDestinations(...sources) {
  const result = Object.fromEntries(destinationNames.map(name => [name, '']));
  for (const source of sources) {
    for (const name of destinationNames) {
      const url = destination(name, source?.[name]);
      if (url !== undefined) result[name] = url;
    }
  }
  return result;
}

async function readLegacy(dataRoot, antigravityRoot, localRoot) {
  const [oldState, antigravity, destinations, catalog, localDefaults] = await Promise.all([
    readJSON(path.join(dataRoot, 'state.json')),
    readJSON(path.join(antigravityRoot, 'settings.json')),
    readJSON(path.join(antigravityRoot, 'legacy-destinations.json')),
    readJSON(path.join(dataRoot, 'catalog-cache.json')),
    localRoot ? readJSON(path.join(localRoot, 'vocabulary-destinations.json')) : {},
  ]);
  const oldWallpaper = oldState.wallpaper || {};
  const originalTheme = { ...antigravity.theme };
  if (Number.isFinite(originalTheme.zoom) && antigravity.zoomModel !== 2) originalTheme.zoom -= 65;
  return {
    language: antigravity.language,
    wallpaper: Object.hasOwn(antigravity, 'wallpaper')
      ? antigravity.wallpaper
      : oldWallpaper.enabled ? oldWallpaper.id ?? oldWallpaper.defaultId : null,
    theme: {
      ...themeDefaults,
      ...cleanTheme({ ...oldWallpaper, zoom: undefined, pageColor: oldState.ui?.pageColor }),
      ...cleanTheme({ ...originalTheme, pageColor: antigravity.pageColor }),
    },
    favorites: Array.isArray(antigravity.favorites) ? antigravity.favorites.filter(id => typeof id === 'string') : [],
    destinations: mergeDestinations(localDefaults, oldState.destinations, destinations, antigravity.destinations),
    catalog: catalog.schemaVersion === 2 && Array.isArray(catalog.wallpapers)
      ? catalog.wallpapers.filter(item => typeof item?.id === 'string' && typeof item.projectRoot === 'string')
      : [],
  };
}

function legacyRoots(settings) {
  const local = process.env.LOCALAPPDATA || os.tmpdir();
  return {
    shared: settings.get('legacyDataRoot') || process.env.GPTDADDY_DATA_ROOT || path.join(local, 'GPTDaddy'),
    antigravity: path.join(local, 'Guarder-Antigravity'),
  };
}

module.exports = { cleanTheme, destination, destinationNames, mergeDestinations, legacyRoots, readLegacy, themeDefaults };
