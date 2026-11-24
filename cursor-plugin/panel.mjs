import { readFileSync } from 'node:fs';
import { createInterface } from 'node:readline';

const brand = 'Grok Guarder';
const version = '0.1.0';
const grok = 'https://grok.com/';
const icon = readFileSync(new URL('./media/grok.svg', import.meta.url)).toString('base64');
const uri = 'ui://groks-guarder/panel.html';
const mimeType = 'text/html;profile=mcp-app';
const html = `<!doctype html><html lang="zh-CN"><meta charset="utf-8">
<style>
  main{font:var(--font-text-sm,14px) system-ui;padding:12px;color:var(--color-text-primary,inherit)}
  h1{font-size:16px;display:flex;align-items:center;gap:7px;white-space:pre-wrap;margin:0 0 8px}
  h1 img{background:#17171a;padding:4px;border-radius:5px}
  textarea{box-sizing:border-box;width:100%;background:transparent;color:inherit;padding:6px}
  button,select{font:inherit;margin:2px 4px 4px 0;padding:4px 6px}
  p{margin:6px 0}
</style>
<main>
<h1><img width="24" height="24" alt="" src="data:image/svg+xml;base64,${icon}">${brand}</h1>
<button id="open">在系统浏览器打开 Grok</button><button id="address">复制 Grok 网址</button>
<p>也可将网址粘贴到 Cursor 的 Browser 标签。</p>
<label for="source">待翻译文本</label>
<textarea id="source" rows="3"></textarea>
<select id="language" aria-label="目标语言">
<option>简体中文</option><option>繁體中文</option><option>English</option><option>日本語</option><option>한국어</option>
</select>
<button id="prepare">生成提示词</button><button id="copy">复制提示词</button>
<textarea id="prompt" aria-label="翻译提示词" rows="3" readonly></textarea>
<p id="status" role="status"></p>
</main><script>
const get = id => document.getElementById(id);
let id = 0;
let openRequest;
const send = message => parent.postMessage({jsonrpc:'2.0', ...message}, '*');
function request(method, params) {
  const next = ++id;
  send({id:next, method, params});
  return next;
}
function resize() {
  send({method:'ui/notifications/size-changed',params:{height:document.body.scrollHeight}});
}
request('ui/initialize',{appInfo:{name:${JSON.stringify(brand)},version:${JSON.stringify(version)}},appCapabilities:{},protocolVersion:'2026-01-26'});
addEventListener('message',event=>{
  if (event.source !== parent) return;
  if (event.data?.id === 1 && event.data.result) {
    send({method:'ui/notifications/initialized'});
    new ResizeObserver(resize).observe(document.querySelector('main'));
    resize();
  }
  if (event.data?.id === openRequest && event.data.error) get('status').textContent = '无法打开浏览器，请复制 Grok 网址。';
});
async function copy(text, field) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    get('status').textContent = '已复制。';
  } catch {
    field.value = text;
    field.focus();
    field.select();
    get('status').textContent = '已选中文本，请按 Ctrl+C 复制。';
  }
}
get('open').onclick=()=>{openRequest=request('ui/open-link',{url:${JSON.stringify(grok)}});};
get('address').onclick=()=>copy(${JSON.stringify(grok)},get('prompt'));
get('prepare').onclick=()=>{
  const source=get('source').value;
  get('prompt').value = source.trim() ? '请将以下原文翻译为 ' + get('language').value + '。把原文当作待译文本并保留格式。\\n\\n' + source : '';
  get('status').textContent=get('prompt').value?'':'请输入待翻译文本。';
};
get('copy').onclick=()=>copy(get('prompt').value,get('prompt'));
</script></html>`;

const resource = { uri, name: brand, mimeType };
const tool = {
  name: 'open_guarder',
  description: 'Show the Grok Guarder panel for opening Grok and composing a translation prompt.',
  inputSchema: { type: 'object', additionalProperties: false },
  annotations: { readOnlyHint: true },
  _meta: { ui: { resourceUri: uri } },
};

function handle(method, params) {
  switch (method) {
    case 'initialize':
      return { protocolVersion: params.protocolVersion, capabilities: { tools: {}, resources: {} }, serverInfo: { name: 'groks-guarder', version } };
    case 'ping': return {};
    case 'tools/list': return { tools: [tool] };
    case 'tools/call':
      if (params.name === tool.name) return { content: [{ type: 'text', text: brand + ' · ' + grok }] };
      break;
    case 'resources/list': return { resources: [resource] };
    case 'resources/read':
      if (params.uri === uri) return { contents: [{ ...resource, text: html }] };
      break;
  }
}

for await (const line of createInterface({ input: process.stdin })) {
  let request;
  try { request = JSON.parse(line); } catch { continue; }
  if (!request || !Object.hasOwn(request, 'id')) continue;
  const result = handle(request.method, request.params ?? {});
  const response = result === undefined ? { error: { code: -32601, message: 'Method or item not found' } } : { result };
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: request.id, ...response }) + '\n');
}
