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

// ************************ making gsheets menu ********************************
// creates a custom menu in Google Sheets when the spreadsheet opens
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu(msgs.menu.label)
    .addItem(msgs.menu.entry, 'makeJsonSidebar_')
    .addItem(msgs.menu.entryAuto, 'makeJsonSidebarAutoKeys_')
    .addToUi();
}

// ui
function makeSidebar() {
  var htmlOutput = HtmlService.createHtmlOutput(getSidebarContent_()).setTitle(
    msgs.sidebar.title
  );
  SpreadsheetApp.getUi().showSidebar(htmlOutput);
}

var ISAUTOKEYS;
// accessible from 'Make JSON' menu
function makeJsonSidebar_() {
  ISAUTOKEYS = false;
  makeSidebar();
}

// accessible from 'Make JSON autokeys' menu
function makeJsonSidebarAutoKeys_() {
  ISAUTOKEYS = true;
  makeSidebar();
}

// ************************ sidebar constructing ********************************
// this function is used in sidebar to copy json to clipboard
function getCopyScript_() {
  var dummy = document.createElement('textarea');
  document.body.appendChild(dummy);
  dummy.setAttribute('id', 'dummy_id');
  document.getElementById('dummy_id').value = document.getElementById(
    'jsonData'
  ).textContent;
  dummy.select();
  document.execCommand('copy');
  document.body.removeChild(dummy);
  document.getElementById('copy-button').innerHTML = msgs.sidebar.afterClick;
  document.getElementById('copy-button').disabled = true;
}

// s.e.
function getSidebarContent_() {
  var msg = { sidebar: { afterClick: msgs.sidebar.afterClick } };
  return (
    '' +
    '<script>' +
    'var msgs = ' +
    JSON.stringify(msg) +
    ';</script>' +
    '<script>' +
    getCopyScript_.toString() +
    '</script>' +
    '<button onclick="getCopyScript_()" id="copy-button">' +
    msgs.sidebar.click +
    '</button>' +
    '<pre id="jsonData">' +
    makeJson_() +
    '</pre>'
  );
}

// ************************ main function ***************************
// assert current selected range and makes json string from it
function makeJson_() {
  var rangeValues = SpreadsheetApp.getActiveSheet()
    .getActiveRange()
    .getValues();
  ISAUTOKEYS ? assertAuto_(rangeValues) : assert_(rangeValues);
  return rangeValues.map(jsonStringFromRow_).join(',\n');
}

// assert range and values in columns 1,2,5 (texts and json key)
function assert_(range) {
  var isErrorInRange = !range || range.length < 1 || range[0].length < 5;
  if (isErrorInRange) throw new Error(msgs.error.badRange.manual);
  var isErrorInValues = range.some(function(row) {
    return (
      isErrorOrEmpty_(row[0]) ||
      isErrorOrEmpty_(row[1]) ||
      isErrorOrEmpty_(row[4])
    );
  });
  if (isErrorInValues) throw new Error(msgs.error.badValues.manual);
  assertJsonKeysDuplicates_(
    range.map(function(row) {
      return row[4];
    })
  );
}

// assert range and values in columns 1,2 (texts)
function assertAuto_(range) {
  var isErrorInRange = !range || range.length < 1 || range[0].length < 4;
  if (isErrorInRange) throw new Error(msgs.error.badRange.auto);
  var isErrorInValues = range.some(function(row) {
    return isErrorOrEmpty_(row[0]) || isErrorOrEmpty_(row[1]);
  });
  if (isErrorInValues) throw new Error(msgs.error.badValues.auto);
  assertJsonKeysDuplicates_(
    range.map(function(row) {
      return varName_(row[0]);
    })
  );
}

// find and notify user about duplicates in json keys column
function assertJsonKeysDuplicates_(array) {
  var duplicates = [];
  for (var i = 0; i < array.length; i++) {
    var val = array[i];
    array.indexOf(val, i + 1) > -1 &&
      duplicates.indexOf(val) === -1 &&
      duplicates.push(val);
  }
  duplicates.length > 0 && notifyAboutDuplicates_(duplicates);
}

// s.e.
function notifyAboutDuplicates_(duplicates) {
  var msg =
    (ISAUTOKEYS
      ? msgs.error.duplicates.before.auto
      : msgs.error.duplicates.before.manual) + '\n\n';
  for (var i = 0; i < duplicates.length; i++) {
    msg += duplicates[i] + '\n';
  }
  msg += '\n' + msgs.error.duplicates.after;
  SpreadsheetApp.getUi().alert(msg);
}

// ************************ json object construct ***************************
// convert json to string
// remove leading and ending curly brackets,
// remove two leading spaces in each line
// remove backslash escaping
function jsonStringFromRow_(row) {
  return JSON.stringify(jsonFromRow_(row), null, 2)
    .split('\n')
    .slice(1, -1)
    .map(function(str) {
      return str.replace(/\s{2}/, '').replace(/\\\\/g, '\\');
    })
    .join('\n');
}

// row is 5-item array
function jsonFromRow_(row) {
  var textEng = escapeHtml_(row[0]);
  var textEsp = escapeHtml_(row[1]);
  var audioEng = voiceName_(row[2]);
  var audioEsp = voiceName_(row[3]);
  var jsonKey = ISAUTOKEYS ? varName_(row[0]) : escapeHtml_(row[4]);

  var json = {};
  json[jsonKey] = {
    base: { speaker_say: 'every_time' },
    en: makeLangEntry_('en', textEng, audioEng),
    es: makeLangEntry_('es', textEsp, audioEsp)
  };
  return json;
}

// text/audio entry
function makeLangEntry_(lang, text, audioFilename) {
  var currentPaths = audioPaths[lang];
  if (!currentPaths) throw new Error(msgs.error.langPath + ': ' + lang);
  var result = {
    text: text
  };
  if (!isErrorOrEmpty_(audioFilename)) {
    result.audio = {
      mp3: currentPaths.mp3 + audioFilename + '.mp3',
      ogg: currentPaths.ogg + audioFilename + '.ogg'
    };
  }
  return result;
}

// ************************ helpers ***************************
// audio file name without extension
function voiceName_(filename) {
  return filename.split('.')[0];
}

// by sergey orlov
function varName_(str) {
  str = str.toLowerCase();
  str = str.replace(/\W/gim, '_');
  if (str[str.length - 1] == '_') {
    str = str.substr(0, str.length - 1);
  }
  return str;
}

// s.e.
function isErrorOrEmpty_(cell) {
  var errorValues = [
    '',
    '#N/A',
    '#ERROR!',
    '#NULL!',
    '#NAME?',
    '#REF!',
    '#NUM!',
    '#VALUE!',
    '#DIV/0!'
  ];
  return errorValues.indexOf(cell) !== -1;
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

// i18n
var msgs = {
  menu: {
    label: 'Tools',
    entry: 'Сделать JSON',
    entryAuto: 'Сделать JSON (автоматическая генерация JSON ключей)'
  },
  sidebar: {
    title: 'JSON',
    click: 'Скопировать',
    afterClick: 'Скопировано!'
  },
  error: {
    badRange: {
      auto: 'Выберите диапазон из 4 столбцов',
      manual: 'Выберите диапазон из 5 столбцов'
    },
    badValues: {
      auto:
        'Значения в столбцах 1, 2 должны содержать непустые и неошибочные (для формул) значения',
      manual:
        'Значения в столбцах 1, 2, 5 должны содержать непустые и неошибочные (для формул) значения'
    },
    duplicates: {
      before: {
        auto: 'При генерации JSON ключей обнаружены повторения:',
        manual: 'В столбце ключей JSON (#5) обнаружены повторения:'
      },
      after:
        'JSON будет сформирован, но для избежания ошибок компиляции JSON файла необходимо использовать уникальные значения.'
    },
    langPath: 'Не найден путь для языка'
  }
};
