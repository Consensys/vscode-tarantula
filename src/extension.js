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
const {decoStyle, setDecorations, hueToDeco} = require('./features/decorator');
const {HighScoreView} = require('./features/views');

const path = require("path");

const currentCancellationTokens = {
    onDidChange: new CancellationTokenSource(),
    onDidSave: new CancellationTokenSource()
};

function outputChannel(text, noClear){
    if (!vscode.window.outputChannel) {
        vscode.window.outputChannel = vscode.window.createOutputChannel('Tarantula Fault Localization');
    }
    if (!vscode.window.outputChannel) return;
    if (!noClear) vscode.window.outputChannel.clear();
    vscode.window.outputChannel.appendLine(text);
    vscode.window.outputChannel.show();
}

function editorJumptoRange(editor, range) {
    let revealType = vscode.TextEditorRevealType.InCenter;
    let selection = new vscode.Selection(range.start.line, range.start.character, range.end.line, range.end.character);
    if (range.start.line === editor.selection.active.line) {
        revealType = vscode.TextEditorRevealType.InCenterIfOutsideViewport;
    }

    editor.selection = selection;
    editor.revealRange(selection, revealType);
}


/** event funcs */
function onActivate(context) {

    const t = new Tarantula();

    /** register views */
    const highScoreView = new HighScoreView(t);

    /** common functions */

    /**
     * 
     * @param {vscode.URI / event} e 
     */
    function processFsEvent(e){
        t.processFsEvent(e)
            .then(scoreData => {
                let humanReadable = JSON.stringify(scoreData.score, null, ' ');
                // show notification
                //vscode.window.showInformationMessage("tarantula updated :)");
                // show output channel haxx
                outputChannel(humanReadable);

                currentCancellationTokens.onDidChange.dispose();
                currentCancellationTokens.onDidChange = new CancellationTokenSource();
                vscode.window.visibleTextEditors.map(te => decorate(te, te.document, currentCancellationTokens.onDidChange));
                
                highScoreView.refresh(); //refresh from tarantula object
            })
            .catch(e => {
                console.error(e);
                vscode.window.showErrorMessage(e);
            });
    }

    function decorate(editor, document, cancellationToken){

        let basename = path.basename(document.uri.fsPath); //@todo - basename matching, change this to match relative paths (rel to file?)
        //find score for file
        if(cancellationToken.isCancellationRequested){
            //abort - new analysis running already
            return;
        }
        //@todo - change format of score object to reduce workload here. {path: score}
        t.scoreData.score.filter(e => e.fileName && e.fileName.includes(basename)).forEach(e => {
            //all matching filenames
            let linedeco = e.lines.filter(l => l.hue >= 0 && l.hue < 1).map(lobj => {
                //create linedecoration objects
                let style = hueToDeco((1-lobj.hue));
                if(!style){
                    return; // nothing to decorate
                }
                return {
                    range: new vscode.Range(
                        new vscode.Position(lobj.lineNumber -1, 0),
                        new vscode.Position(lobj.lineNumber -1, 0)
                    ),
                    decoStyle: style
                };
            });


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

    context.subscriptions.push(
        vscode.commands.registerCommand("vscode-tarantula.jumpToRange", (documentUri, range) => {
            vscode.workspace.openTextDocument(documentUri).then(doc => {
                vscode.window.showTextDocument(doc).then(editor => {
                    if(range) {
                        editorJumptoRange(editor, range);
                    }
                });
            });
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