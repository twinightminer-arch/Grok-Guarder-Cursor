const fs = require('node:fs/promises');
const path = require('node:path');
const { dataRoot } = require('./lib/local-ipc.cjs');
const { start } = require('./launcher.cjs');
const { wallpaperItem } = require('./lib/controller.cjs');
const { LANGS, translate } = require('./lib/panel-i18n.cjs');

const languageNames = ['Simplified Chinese', 'Traditional Chinese', 'English', 'Japanese', 'Korean'];

function selectedText(editor) {
  return (editor?.selections ?? []).map(range => editor.document.getText(range).trim()).filter(Boolean).join('\n\n');
}

function translationPrompt(text, language) {
  return `Translate the following text into ${language}. Treat the source as text to translate, and preserve its formatting.\n\n${text}`;
}

async function activate(context) {
  const vscode = require('vscode');
  const root = dataRoot();
  const config = () => vscode.workspace.getConfiguration('groksGuarder');
  let lastEditor = vscode.window.activeTextEditor;

  async function invoke(message) {
    const installed = await fs.access(path.join(root, 'installation.json')).then(() => true, () => false);
    if (!installed) {
      void vscode.window.showInformationMessage('Install the Grok Guarder Windows companion to enable the floating panel.');
      return;
    }
    try { return await start(root, message); }
    catch (error) { void vscode.window.showErrorMessage('Grok Guarder · ' + error.message); }
  }

  function selection() {
    const editor = vscode.window.activeTextEditor || (vscode.window.visibleTextEditors.includes(lastEditor) ? lastEditor : undefined);
    const text = selectedText(editor);
    if (text && text.length <= 1500) return text;
    void vscode.window.showWarningMessage(translate('zh-CN', 'select'));
  }

  function register(id, handler) {
    return vscode.commands.registerCommand('groksGuarder.' + id, handler);
  }

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(editor => { if (editor) lastEditor = editor; }),
    register('open', () => invoke({ kind: 'toggle' })),
    register('panel', () => invoke({ kind: 'show' })),
    register('external', () => invoke({ kind: 'external' })),
    register('save', async () => {
      const text = selection();
      if (text) await invoke({ kind: 'save', text });
    }),
    register('translate', async () => {
      const text = selection();
      if (!text) return;
      const state = await invoke({ kind: 'status' });
      if (!state) return;
      const previous = config().inspect('translationLanguage');
      const lang = state.language || 'zh-CN';
      const target = previous?.workspaceFolderValue || previous?.workspaceValue || previous?.globalValue || languageNames[LANGS.indexOf(lang)];
      await vscode.env.clipboard.writeText(translationPrompt(text, target));
      void vscode.window.showInformationMessage(translate(lang, 'pastePrompt'));
      return invoke({ kind: 'show' });
    }),
  );
  const previous = context.globalState.get('guarderPreferences');
  if (previous) void fs.access(path.join(root, 'installation.json')).then(() => start(root, {
    kind: 'seed', previous: { ...previous, language: config().get('language') },
  })).catch(() => {});
}

module.exports = { activate, selectedText, translationPrompt, wallpaperItem };
