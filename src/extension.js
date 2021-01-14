'use strict';
/** 
 * @author github.com/tintinweb
 * @license MIT
 * 
 * 
 * */



/** imports */
const vscode = require("vscode");
const {CancellationTokenSource} = require('vscode');

const settings = require('./settings');
const {Tarantula, TARGET_FILES} = require('./features/tarantula');
const {decoStyle, setDecorations} = require('./features/decorator');

const path = require("path");

const currentCancellationTokens = {
    onDidChange: new CancellationTokenSource(),
    onDidSave: new CancellationTokenSource()
};

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

    function decorate(editor, document, cancellationToken){
        //@todo - add cancellation checks
        console.log(document);
        let basename = path.basename(document.uri.fsPath); //@todo - basename matching, change this to match relative paths (rel to file?)
        console.log(basename)
        //find score for file
        if(cancellationToken.isCancellationRequested){
            //abort - new analysis running already
            return;
        }
        //@todo - change format of score object to reduce workload here. {path: score}
        t.score.filter(e => e.fileName && e.fileName.includes(basename)).forEach(e => {
            //all matching filenames
            let linedeco = e.lines.filter(l => l.suspiciousness >= 0).map(lobj => {
                //create linedecoration objects
                return {
                    range: new vscode.Range(
                        new vscode.Position(lobj.lineNumber -1, 0),
                        new vscode.Position(lobj.lineNumber -1, 0)
                    ),
                    decoStyle: decoStyle.redline
                };
                
            });

            console.log(linedeco);
            if(cancellationToken.isCancellationRequested){
                //abort - new analysis running already
                return;
            }
            setDecorations(editor, linedeco);
        });
    }

    function onDidChangeActiveTextEditor(editor){
        //editor changed
        let document = editor && editor.document ? editor.document : vscode.window.activeTextEditor ? vscode.window.activeTextEditor.document : undefined;
        if(!document){
            console.warn("change event on non-document");
            return;
        }
        
        if(document.languageId!="solidity"){
            console.log("ondidchange: wrong langid");
            return;
        }
        
        currentCancellationTokens.onDidChange.dispose();
        currentCancellationTokens.onDidChange = new CancellationTokenSource();
        try{
            decorate(editor, document, currentCancellationTokens.onDidChange);
        } catch (err){
            if (typeof err !== "object"){ //CancellationToken
                throw err;
            }
        }
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

    vscode.window.onDidChangeActiveTextEditor(editor => {
        if(editor && editor.document) { // &&  editor.document.languageId==type){
            onDidChangeActiveTextEditor(editor);
        }
    }, null, context.subscriptions);
    
    /** exec tarantula for all files in workspace */
    //@todo - this should be onworkspaceload, or when a solidity files is opened or something like that
    vscode.workspace.findFiles(`**/{${Object.values(TARGET_FILES).join(",")}}`, null, 100)
        .then(uris => uris.map(uri => processFsEvent(uri)));

}

/* exports */
exports.activate = onActivate;