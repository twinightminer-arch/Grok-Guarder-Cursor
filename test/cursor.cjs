const assert = require('node:assert/strict');
const vscode = require('vscode');

exports.run = async () => {
  const extension = vscode.extensions.getExtension('guarder-local.groks-guarder');
  assert.equal(extension.packageJSON.version, '0.1.0');
  assert.equal(extension.packageJSON.contributes.viewsContainers, undefined);
  await extension.activate();
  assert.equal(await vscode.commands.executeCommand('groksGuarder.panel'), true);
  assert.equal(await vscode.commands.executeCommand('groksGuarder.open'), true);
};
