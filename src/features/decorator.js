'use strict';
/** 
 * @author github.com/tintinweb
 * @license MIT
 * 
 * 
 * */
const vscode = require('vscode');

const lineDecoSettings = {
    prefix: "hue",
    resolution: 10,
    alphaStart: 0,
    alphaEnd: 60,
    backgroundColor: {light:"E86252", dark:"E9190F"}
};

const decoStyle = {
    ... {
        redline: vscode.window.createTextEditorDecorationType({
            isWholeLine: true,
            overviewRulerColor: 'blue',
            overviewRulerLane: vscode.OverviewRulerLane.Right,
            light: {
                // this color will be used in light color themes
                backgroundColor: `#${lineDecoSettings.backgroundColor.light}50`
            },
            dark: {
                // this color will be used in dark color themes
                backgroundColor: `#${lineDecoSettings.backgroundColor.dark}50`
            },
        }),
    },
    ...createDecoStyle(lineDecoSettings.prefix, lineDecoSettings.resolution, lineDecoSettings.alphaStart, lineDecoSettings.alphaEnd)
};

function hueToDeco(target){
    let step = Math.abs((lineDecoSettings.alphaStart-lineDecoSettings.alphaEnd)/lineDecoSettings.resolution);
    let steps = [];
    for(let i=lineDecoSettings.alphaStart; i<=lineDecoSettings.alphaEnd; i+=step){
        steps.push(i);
    }

    target =  lineDecoSettings.alphaStart + 10 * target * step;

    /*
    var closest = steps.reduce(function(prev, curr) {
        return (Math.abs(curr - target) < Math.abs(prev - target) ? curr : prev);
    });
    */
    var lesser = steps.filter(s => s >= target);
    var closest = Math.min.apply(null, lesser);
    
    return decoStyle[`${lineDecoSettings.prefix}_${closest}`];
}


function createDecoStyle(prefix, num, start, end){
    let result = {};

    let step = Math.abs((end-start)/num);


    for(let i=start; i<=end; i+=step){
        result[`${prefix}_${i}`] =  vscode.window.createTextEditorDecorationType({
                
                isWholeLine: true,
                overviewRulerColor: 'blue',
                overviewRulerLane: vscode.OverviewRulerLane.Right,
                light: {
                    // this color will be used in light color themes
                    backgroundColor: `#${lineDecoSettings.backgroundColor.light}${i.toString(16)}`
                },
                dark: {
                    // this color will be used in dark color themes
                    backgroundColor: `#${lineDecoSettings.backgroundColor.dark}${i.toString(16)}`
                },
            });
    }
    return result;
}


/**
 * 
 * @param {*} editor 
 * @param {*} decorations {styleKey: ranges}
 */
async function setDecorations(editor, decorations) {

    if (!editor) {
        return;
    }

    let seenDecoStyles = {};
    let deco_map = {};

    decorations.forEach(function(deco){
        if(!deco_map[deco.decoStyle.key]){
            deco_map[deco.decoStyle.key] = [];
            seenDecoStyles[deco.decoStyle.key] = deco.decoStyle;
        }
        deco_map[deco.decoStyle.key].push(deco.range);
    });

    for (let styleKey in deco_map){
        editor.setDecorations(seenDecoStyles[styleKey], deco_map[styleKey]);
    }
}



module.exports = {
    decoStyle,
    setDecorations,
    hueToDeco
};