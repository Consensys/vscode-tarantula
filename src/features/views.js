'use strict';
/** 
 * @author github.com/tintinweb
 * @license MIT
 * 
 * 
 * */
const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

function workspaceRelativePath(uri){
    let workspacePath = vscode.workspace.getWorkspaceFolder(uri).uri.fsPath;
    return path.relative(workspacePath, uri.fsPath);
}

 /** views */

class BaseView {
    async refresh(value) {
        this.treeView.message = undefined;  // clear the treeview message
        return this.dataProvider.refresh(value);
    }
    async onDidSelectionChange(event) { }
}

class BaseDataProvider {
    async dataGetRoot() {
        return [];
    }

    dataGetChildren(element) {
        return null;
    }

    /** tree methods */
    getChildren(element) {
        return element ? this.dataGetChildren(element) : this.dataGetRoot();
    }

    getParent(element) {
        return element.parent;
    }

    getTreeItem(element) {
        return {
            resourceUri: element.resource,
            label: element.label,
            iconPath: element.iconPath,
            collapsibleState: element.collapsibleState,
            children: element.children,
            command: element.command || {
                command: 'vscode-tarantula.jumpToRange',
                arguments: [element.resource],
                title: 'JumpTo'
            }
        };
    }

    /** other methods */
    refresh() {
        return new Promise((resolve, reject) => {
            this._onDidChangeTreeData.fire();
            resolve();
        });
    }
}

class HighScoreViewDataProvider extends BaseDataProvider {

    constructor(treeView) {
        super();
        this.treeView = treeView;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;

        this.data = null;
        this.documentUri = null;
    }

    async dataGetRoot() {
        if (this.data === null && this.documentUri === null) {
            return [];
        }
        return this.data.map(entry => {
            let element = {
                "rank": entry[0],
                "path": entry[1],
                "resource": vscode.Uri.file(entry[1]),
                "lineStart": entry[2] -1,
                "lineEnd": entry[3] -1
            };
            let label = `(${element.rank}) ${workspaceRelativePath(element.resource)} (${element.lineStart}-${element.lineEnd})`;

            let range = new vscode.Range(element.lineStart, 0, element.lineEnd, 100000);
            let item = {
                resource: element.resource,
                contextValue: element.resource.fsPath,
                range: range,
                label: label,
                tooltip: label,
                name: label,
                iconPath: vscode.ThemeIcon.File,
                collapsibleState: 0,// vscode.TreeItemCollapsibleState.Collapsed,
                parent: null,
                children: null,
                command: {
                    command: 'vscode-tarantula.jumpToRange',
                    arguments: [element.resource, range],
                    title: 'JumpTo'
                },
            };
            return item;
        });
    }

    dataGetChildren(element) {
        return element.children;
    }

    /** events */

    refresh() {
        console.warn("-<-<-<-<-<-< REFRESH")
        return new Promise((resolve, reject) => {
            if(!this.treeView.tarantula.scoreData || !this.treeView.tarantula.scoreData.ranks){
                return reject();
            }
            this.data = this.treeView.tarantula.scoreData.ranks.map(entry => {
                if(!fs.existsSync(entry[1])){
                    entry[1] = path.join(this.treeView.tarantula.scoreData.directory, entry[1]);
                }
                return entry;
            });

            this._onDidChangeTreeData.fire();
            resolve();
        });
    }
    /** tree methods */
    // inherited.
}

class HighScoreView extends BaseView {
    constructor(tarantula) {
        super();
        this.tarantula = tarantula;
        this.id = "highScore";
        this.dataProvider = new HighScoreViewDataProvider(this);
        this.treeView = vscode.window.createTreeView(`vscode-tarantula-${this.id}`, { treeDataProvider: this.dataProvider });
        this.treeView.message = "waiting for tarantula data to be processed...";
    }

    async onDidSelectionChange(event) {

        let documentUri = event.textEditor._documentData._uri;
        let focus = event.selections[0].anchor;
        let commands = this.cockpit.commands;

        let contractObj = commands.g_parser.sourceUnits[documentUri.fsPath];


        if (!contractObj) {
            console.warn("cockpit.methods: not a file: " + documentUri.fsPath);
            return;
        }

        let focusSolidityElement = contractObj.getFunctionAtLocation(focus.line, focus.character);
        if (!focusSolidityElement) {
            console.warn("cockpit.methods: contract not found: " + documentUri.fsPath);
            return;
        }

        let filterNotVisibility = ["private", "internal"];
        let filterNotStateMutability = ["view", "pure", "constant"];

        let publicFunctions = Object.keys(focusSolidityElement.contract.functions)
            .filter(f => {
                let node = focusSolidityElement.contract.functions[f]._node;
                //filter only for state changing public functions
                return !filterNotVisibility.includes(node.visibility) && !filterNotStateMutability.includes(node.stateMutability);
            })
            .reduce((obj, key) => {
                let newKey = key;
                let func = focusSolidityElement.contract.functions[key];

                if (key === null || func._node.isConstructor) {
                    newKey = "<Constructor>";
                } else if (key === "" || func._node.isFallback) {
                    newKey = "<Fallback>";
                }
                func.resource = documentUri;
                obj[newKey] = func;
                return obj;
            }, {});
        //  contract::func, all, files 
        this.dataProvider.documentUri = documentUri;
        this.dataProvider.data = publicFunctions;
        this.refresh();
    }
}

module.exports = {
    HighScoreView
};