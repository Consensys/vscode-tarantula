'use strict';
/** 
 * @author github.com/tintinweb
 * @license MIT
 * 
 * 
 * */



/** imports */
const vscode = require("vscode");
const settings = require('./settings');
const {Tarantula, TARGET_FILES} = require('./features/tarantula');

/** event funcs */
function onActivate(context) {

    const t = new Tarantula();
    /**
     * 
     * @param {vscode.URI / event} e 
     */
    function processFsEvent(e){
        t.processFsEvent(e)
            .then(score => {
                let humanReadable = JSON.stringify(score, null, ' ');
                console.log(humanReadable);

                // show notification
                vscode.window.showInformationMessage("tarantula updated :)");
                // show output channel haxx
                if (!vscode.window.outputChannel) {
                    vscode.window.outputChannel = vscode.window.createOutputChannel('tarantula');
                }
                if (!vscode.window.outputChannel) return;
                vscode.window.outputChannel.clear();
                vscode.window.outputChannel.appendLine(humanReadable);
                vscode.window.outputChannel.show();
            })
            .catch(e => {
                console.error(e);
                vscode.window.showErrorMessage(e);
            });
    }

    /* commands */
    context.subscriptions.push(
        // in case one wants to trigger this manually
        vscode.commands.registerCommand("vscode-tarantula.processDir", async (filepathOrDir) => {
            processFsEvent(filepathOrDir || ".");
        })
    );

    /** events */
    t.fileWatcher = vscode.workspace.createFileSystemWatcher(`**/{${Object.values(TARGET_FILES).join(",")}}`);
    t.fileWatcher.onDidChange((e) => processFsEvent(e)); 
	t.fileWatcher.onDidCreate((e) => processFsEvent(e));
    //t.fileWatcher.onDidDelete((e) => t.processDir(e));
    
    /** exec tarantula for all files in workspace */
    //@todo - this should be onworkspaceload, or when a solidity files is opened or something like that
    vscode.workspace.findFiles(`**/{${Object.values(TARGET_FILES).join(",")}}`, null, 100)
        .then(uris => uris.map(uri => processFsEvent(uri)));

}

/* exports */
exports.activate = onActivate;