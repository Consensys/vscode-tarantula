'use strict';
/** 
 * @author github.com/tintinweb
 * @license MIT
 * 
 * 
 * */
/** globals - const */
const vscode = require('vscode');

function extensionConfig() {
    return vscode.workspace.getConfiguration('vscode-tarantula');
}

function extension() {
    return vscode.extensions.getExtension('tintinweb.vscode-tarantula');
}

module.exports = {
    extensionConfig: extensionConfig,
    extension: extension,
};