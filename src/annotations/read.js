const { stringToPDFString } = require('../../pdf.js/build/lib/shared/util');

const utils = require('../utils');
const putils = require('../putils');

function pdfDateToIso(str) {
  let m = str.match(/([0-9]{4})([0-9]{2}|)([0-9]{2}|)([0-9]{2}|)([0-9]{2}|)([0-9]{2}|)/);
  if (!m) (new Date()).toISOString();
  let d = [];
  for (let i = 1; i <= 6; i++) {
    if (!m[i]) break;
    d.push(parseInt(m[i]));
  }
  
  if (d[1]) {
    d[1] -= 1;
  }
  
  return (new Date(Date.UTC(...d))).toISOString();
}

function arrayColorToHex(color) {
  if (!color || color.length !== 3) return '';
  
  let result = '#';
  for (let c of color) {
    let hex = c.toString(16);
    result += hex.length === 1 ? '0' + hex : hex;
  }
  
  return result;
}

function getStr(value) {
  return value ? value.slice(1, -1) : '';
}

exports.readRawAnnotations = function (structure) {
  let annotations = [];
  let rawPages = structure['/Root']['/Pages']['/Kids'];
  for (let pageIndex = 0; pageIndex < rawPages.length; pageIndex++) {
    let rawAnnots = rawPages[pageIndex]['/Annots'];
    if (!rawAnnots) continue;
    for (let rawAnnotIdx = 0; rawAnnotIdx < rawAnnots.length; rawAnnotIdx++) {
      let rawAnnot = rawAnnots[rawAnnotIdx];
      if (!rawAnnot) continue;
      let type = rawAnnot['/Subtype'].slice(1);
      
      // Supported types
      if (!['Text', 'Highlight'].includes(type)) continue;
      let annotation = {};
      
      annotation.type = type.toLowerCase();
      // annotation.id = getStr(rawAnnot['/NM']);
      
      let rects;
      if (rawAnnot['/QuadPoints']) {
        rects = utils.quadPointsToRects(rawAnnot['/QuadPoints']);
      }
      else if (rawAnnot['/Rect']) {
        rects = [putils.normalizeRect(rawAnnot['/Rect'])];
      }
      else {
        continue;
      }
      
      annotation.position = {
        pageIndex,
        rects
      };
      
      annotation.dateModified = pdfDateToIso(getStr(rawAnnot['/M']));
      // annotation.authorName = stringToPDFString(getStr(rawAnnot['/T']));
      annotation.comment = stringToPDFString(getStr(rawAnnot['/Contents']));
      annotation.color = arrayColorToHex(putils.getColorArray(rawAnnot['/C']));
      
      annotations.push(annotation);
    }
  }
  
  return annotations;
}
