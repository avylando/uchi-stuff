// TODO
// #NA or empty audio paths
// styling

// Creates a custom menu in Google Sheets when the spreadsheet opens.
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Tools')
    .addItem('Make JSON const entries', 'makeJsonSidebar_')
    .addToUi();
}

// prettier-ignore
function getStyles_() {
  var result =
        '<style>'
      + '.json-key { color: brown; }'
      + '.json-value { color: navy; }'
      + '.json-string { color: olive; }'
      + '</style>';
  return result;
}

// accessible from 'Make JSON const entries' menu
function makeJsonSidebar_() {
  var htmlOutput = HtmlService
    //.createHtmlOutput(getStyles_() + '<pre>' + jsonPrettyPrint.process(makeJson_()) + '</pre>')
    .createHtmlOutput(getStyles_() + '<pre>' + makeJson_() + '</pre>')
    .setTitle('JSON data');
  SpreadsheetApp.getUi().showSidebar(htmlOutput);
}

// assert current selected range
function makeJson_() {
  var rangeValues = SpreadsheetApp.getActiveSheet()
    .getActiveRange()
    .getValues();
  assertRange_(rangeValues);
  var jsonData = toJson_(rangeValues);
  return jsonData;
}

// assert
function assertRange_(range) {
  var isError = !range || range.length < 1 || range[0].length < 5;
  if (isError)
    throw new Error('Please select range of cells with 5 columns or more');
}

// audio file name without extension
function voiceName_(filename) {
  return filename.split('.')[0];
}

// copyright by mustache.js
function escapeHtml_(string) {
  var entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };
  return String(string).replace(/[&<>"'`=\/]/g, function(s) {
    return entityMap[s];
  });
}

// speakerEntry
// prettier-ignore
function makeSpeakerEntry_() {
  var result =
        '  "base": {\n'
      + '    "speaker_say": "every_time"\n'
      + '  }';
  return result;
}

// audio entry for specified extension
// prettier-ignore
function makeAudioEntry_(extension, pathPrefix, filename) {
  var result =
        '      "' + extension + '":\n'
      + '        "' + pathPrefix + filename + '.' + extension + '"';
  return result;
}

// text/audio entry
// prettier-ignore
function makeLangEntry_(lang, text, audioFilename) {
  var paths = {
    'en': {
      mp3: '/share/happy_numbers/assets/sound/all/English-All/Mp3_128kbps/',
      ogg: '/share/happy_numbers/assets/sound/all/English-All/Ogg/'
    },
    'es': {
      mp3: '/share/happy_numbers/assets/sound/all/Spanish-All/Mp3_128kbps/',
      ogg: '/share/happy_numbers/assets/sound/all/Spanish-All/Ogg/'
    }
  };
  var currentPaths = paths[lang];
  if(!currentPaths) throw new Error('Cant find paths for language ' + lang);

  var pathMp3 = currentPaths.mp3;
  var pathOgg = currentPaths.ogg;
  var result =
        '  "' + lang + '": {\n'
      + '    "text":\n'
      + '      "' + text + '",\n'
      + '    "audio": {\n'
      +      makeAudioEntry_('mp3', pathMp3, audioFilename) + ',\n'
      +      makeAudioEntry_('ogg', pathOgg, audioFilename) + '\n'
      + '    }\n'
      + '  }';
  return result;
}

// row is 5-item array
// prettier-ignore
function rowToJson_(row) {
  var textEng  = escapeHtml_(row[0]);
  var textEsp  = escapeHtml_(row[1]);
  var audioEng = voiceName_(row[2]);
  var audioEsp = voiceName_(row[3]);
  var jsonKey  = escapeHtml_(row[4]);
  var result =
        '"' + jsonKey + '": {\n'
      + makeSpeakerEntry_() + ',\n'
      + makeLangEntry_('en', textEng, audioEng) + ',\n'
      + makeLangEntry_('es', textEsp, audioEsp) + '\n'
      + '}';
  return result;
}

// range is already asserted, it is two-dim array and each in-array length' is 5
function toJson_(range) {
  var result = range.map(rowToJson_).join(',\n');
  return result;
}

// json prettifier
// copyright by Dem Pilafian
var jsonPrettyPrint = {
  replacer: function(match, pIndent, pKey, pVal, pEnd) {
    var key = '<span class=json-key>';
    var val = '<span class=json-value>';
    var str = '<span class=json-string>';
    var r = pIndent || '';
    if (pKey) r = r + key + pKey.replace(/[": ]/g, '') + '</span>: ';
    if (pVal) r = r + (pVal[0] == '"' ? str : val) + pVal + '</span>';
    return r + (pEnd || '');
  },
  toHtml: function(obj) {
    var jsonLine = /^( *)("[\w]+": )?("[^"]*"|[\w.+-]*)?([,[{])?$/gm;
    return JSON.stringify(obj, null, 3)
      .replace(/&/g, '&amp;')
      .replace(/\\"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(jsonLine, jsonPrettyPrint.replacer);
  },
  process: function(str) {
    var jsonLine = /^( *)("[\w]+": )?("[^"]*"|[\w.+-]*)?([,[{])?$/gm;
    return str
      .replace(/&/g, '&amp;')
      .replace(/\\"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(jsonLine, jsonPrettyPrint.replacer);
  }
};
