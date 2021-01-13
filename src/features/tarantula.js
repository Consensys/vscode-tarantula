'use strict';
/** 
 * @author github.com/tintinweb
 * @license MIT
 * 
 * 
 * */
const fl = require('tarantula-fl');
const fs = require('fs');
const path = require('path');

const TARGET_FILES = {
    mochaOutput :"mochaOutput.json",
    testMatrix: "testMatrix.json"
};

function loadJSON(path){
    return JSON.parse(fs.readFileSync(path).toString('utf-8'));
}

class Tarantula {

    constructor(settings){
        this.settings = settings;
        this.testData = {
            testResults: null,
            coverage: null
        };
        this.score = null;
        this.fileWatcher = null; 
    }

    getScoreForTestData(mochaOutput, testMatrix){
        let data = {
            testResults: fl.fromMocha(mochaOutput),
            coverage: fl.fromSolCover(testMatrix)
        };
        return fl.tarantulaScore(data);
    }

    processDir(basedir){
        return new Promise((resolve, reject) => {
            let mochaOutput = loadJSON(path.join(basedir, TARGET_FILES.mochaOutput));
            let testMatrix = loadJSON(path.join(basedir, TARGET_FILES.testMatrix));
            let score = this.getScoreForTestData(mochaOutput, testMatrix);
            return resolve(score);
        });
    }
    
    processFsEvent(uri){
        console.log(uri);
        console.log(path.dirname(uri.fsPath));
        return this.processDir(path.dirname(uri.fsPath));
    }

}

module.exports = {
    Tarantula,
    TARGET_FILES
};

