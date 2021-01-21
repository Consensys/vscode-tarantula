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

class ScoreData {

    getScoreForTestData(mochaOutput, testMatrix){
        let data = {
            testResults: fl.fromMocha(mochaOutput),
            coverage: fl.fromSolCover(testMatrix)
        };
        this.score =  fl.tarantulaScore(data);
        this.ranks = fl.tarantulaRanking(this.score);
    }
}

class Tarantula {

    constructor(settings){
        this.settings = settings;
        this.testData = {
            testResults: null,
            coverage: null
        };
        this.scoreData = new ScoreData();
        this.fileWatcher = null; 
        this.directory = null;
    }

    processDir(basedir){
        return new Promise((resolve, reject) => {
            let mochaOutput = loadJSON(path.join(basedir, TARGET_FILES.mochaOutput));
            let testMatrix = loadJSON(path.join(basedir, TARGET_FILES.testMatrix));
            this.scoreData.getScoreForTestData(mochaOutput, testMatrix);
            this.scoreData.directory = basedir;
            return resolve(this.scoreData);
        });
    }
    
    processFsEvent(uri){
        return this.processDir(path.dirname(uri.fsPath));
    }

}


module.exports = {
    Tarantula,
    TARGET_FILES
};

