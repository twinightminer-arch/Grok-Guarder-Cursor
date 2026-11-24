'use strict';

const channel = window.chrome.webview;
const send = (Type, data = {}) => channel.postMessage({ Type, ...data });

function destination(name, address) {
  if (!['notion', 'obsidian', 'onenote'].includes(name) || typeof address !== 'string' ||
    address.length > 2048 || /[\r\n]/.test(address)) return;
  if (!address.trim()) return '';
  try {
    const url = new URL(address.trim());
    if (!url.username && !url.password && (url.protocol === 'https:' ||
      (name !== 'notion' && url.protocol === name + ':'))) return url.href;
  } catch {
    return;
  }
}

window.guarderClose = () => send('close');
window.guarderDockChanged = geometry => send('slot', { Geometry: JSON.parse(geometry) });
window.guarderPreviewRequested = request => send('preview', { request: JSON.parse(request) });
window.guarderExternal = () => send('external');

const styles = Promise.all(['panel.css', 'desktop.css'].map(url => fetch(url).then(response => response.text())))
  .then(parts => parts.join('\n'));
let initialized = false;
let latest;

channel.addEventListener('message', async ({ data: message }) => {
  if (message.Type === 'state') {
    latest = message;
    if (initialized) {
      document.documentElement.lang = message.config.language;
      window.guarder.refresh(message.data, message.config);
      return;
    }
    const css = await styles;
    if (initialized) return;
    initialized = true;
    document.documentElement.lang = latest.config.language;
    installGuarder({ ...latest, dictionary: [], css, icon: 'grok.png', vocabIcon: 'vocabulary.png' }, destination);
    return;
  }
  const guarder = window.guarder;
  if (!guarder) return;
  switch (message.Type) {
    case 'poster': guarder.posterReady(message.id, message.url); break;
    case 'preview': guarder.previewReady(message.request, message.asset); break;
    case 'status': guarder.operationStatus(message.key); break;
    case 'siteError': guarder.siteError(); break;
    case 'browserSignIn': guarder.browserSignIn(); break;
    case 'importRead':
      try {
        const base64 = await guarder.importChunk(message.offset, message.length);
        send('chunk', { id: message.id, base64 });
      } catch {
        send('chunk', { id: message.id });
      }
      break;
    case 'importFinished': guarder.importFinished(message.key); break;
  }
});

setInterval(() => {
  const batch = window.guarder?.snapshot(true).commands;
  if (batch?.length) send('commands', { batch });
}, 80);

send('ready');
