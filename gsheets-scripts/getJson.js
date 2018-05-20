// Creates a custom menu in Google Sheets when the spreadsheet opens.
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Tools')
    .addItem('Make JSON const entries', 'makeJsonSidebar_')
    .addToUi();
}

// accessible from 'Make JSON const entries' menu
function makeJsonSidebar_() {
  Logger.log(makeJson_());
  var htmlOutput = HtmlService.createHtmlOutput(getSidebarContent_()).setTitle(
    'Chunk json const entries'
  );
  SpreadsheetApp.getUi().showSidebar(htmlOutput);
}

// this function is used in sidebar to copy json to clipboard
function getCopyScript_() {
  var dummy = document.createElement('textarea');
  document.body.appendChild(dummy);
  dummy.setAttribute('id', 'dummy_id');
  document.getElementById('dummy_id').value = unescapeHtml_(
    document.getElementById('jsonData').innerHTML
  );
  dummy.select();
  document.execCommand('copy');
  document.body.removeChild(dummy);
  document.getElementById('copy-button').innerHTML = 'Copied!';
}

function getSidebarContent_() {
  return (
    '' +
    '<script>' +
    unescapeHtml_.toString() +
    '</script>' +
    '<script>' +
    getCopyScript_.toString() +
    '</script>' +
    '<button onclick="getCopyScript_()" id="copy-button">Copy to clipboard</button>' +
    '<pre id="jsonData">' +
    makeJson_() +
    '</pre>'
  );
}

// assert current selected range and makes json string from it
function makeJson_() {
  var rangeValues = SpreadsheetApp.getActiveSheet()
    .getActiveRange()
    .getValues();
  assertRange_(rangeValues);
  return rangeValues.map(jsonStringFromRow_).join(',\n');
}

// assert
function assertRange_(range) {
  var isErrorInRange = !range || range.length < 1 || range[0].length < 5;
  if (isErrorInRange)
    throw new Error('Please select range of cells with 5 columns or more');
}

// paths to audio files in repository for different languages
var audioPaths = {
  en: {
    mp3: '/share/happy_numbers/assets/sound/all/English-All/Mp3_128kbps/',
    ogg: '/share/happy_numbers/assets/sound/all/English-All/Ogg/'
  },
  es: {
    mp3: '/share/happy_numbers/assets/sound/all/Spanish-All/Mp3_128kbps/',
    ogg: '/share/happy_numbers/assets/sound/all/Spanish-All/Ogg/'
  }
};

// text/audio entry
function makeLangEntry_(lang, text, audioFilename) {
  var currentPaths = audioPaths[lang];
  if (!currentPaths) throw new Error('Cant find paths for language: ' + lang);
  var r = {
    text: text,
    audio: {
      mp3: currentPaths.mp3 + audioFilename + '.mp3',
      ogg: currentPaths.ogg + audioFilename + '.ogg'
    }
  };
  return r;
}

// audio file name without extension
function voiceName_(filename) {
  return filename.split('.')[0];
}

// row is 5-item array
function jsonFromRow_(row) {
  var textEng = escapeHtml_(row[0]);
  var textEsp = escapeHtml_(row[1]);
  var audioEng = voiceName_(row[2]);
  var audioEsp = voiceName_(row[3]);
  var jsonKey = escapeHtml_(row[4]);

  var json = {};
  json[jsonKey] = {
    base: { speaker_say: 'every_time' },
    en: makeLangEntry_('en', textEng, audioEng),
    es: makeLangEntry_('es', textEsp, audioEsp)
  };
  return json;
}

// convert json to string
// and removing leading and ending curly brackets,
// and removing two leading spaces in each line
function jsonStringFromRow_(row) {
  return JSON.stringify(jsonFromRow_(row), null, 2)
    .split('\n')
    .slice(1, -1)
    .map(function(str) {
      return str.replace(/\s{2}/, '').replace(/\\\\/g, '\\');
    })
    .join('\n');
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

// reversed by me
function unescapeHtml_(string) {
  var entityMap = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&#x2F;': '/',
    '&#x60;': '`',
    '&#x3D;': '='
  };
  return String(string).replace(
    /&amp;|&lt;|&gt;|&quot;|&#39;|&#x2F;|&#x60;|&#x3D;/g,
    function(s) {
      return entityMap[s];
    }
  );
}