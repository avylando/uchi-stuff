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
    .addItem(msgs.menu.entries.auto, 'makeJsonSidebarAutoKeys_')
    .addItem(msgs.menu.entries.manual, 'makeJsonSidebar_')
    .addItem(msgs.menu.entries.help, 'showHelpSidebar_')
    .addToUi();
}

// ui
function makeSidebar_() {
  var htmlOutput = HtmlService.createHtmlOutput(getSidebarContent_()).setTitle(
    msgs.sidebar.title
  );
  SpreadsheetApp.getUi().showSidebar(htmlOutput);
}

var ISAUTOKEYS;
// accessible from 'Make JSON' menu
function makeJsonSidebar_() {
  ISAUTOKEYS = false;
  makeSidebar_();
}

// accessible from 'Make JSON autokeys' menu
function makeJsonSidebarAutoKeys_() {
  ISAUTOKEYS = true;
  makeSidebar_();
}

function showHelpSidebar_() {
  var htmlOutput = HtmlService.createHtmlOutput(
    getSidebarHelpContent_()
  ).setTitle(msgs.sidebar.help.title);
  SpreadsheetApp.getUi().showSidebar(htmlOutput);
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
// prettier-ignore
function getSidebarContent_() {
  var msg = { sidebar: { afterClick: msgs.sidebar.afterClick } };
  return ''
  + '<script> var msgs = ' + JSON.stringify(msg) + ';</script>'
  + '<script>' + getCopyScript_.toString() + '</script>'
  + '<button onclick="getCopyScript_()" id="copy-button">' + msgs.sidebar.click + '</button>'
  + '<pre id="jsonData">' + makeJson_() + '</pre>';
}

// s.e.
// prettier-ignore
function getSidebarHelpContent_() {
  return ''
  + '<style>table { border-collapse: collapse; } th, td { border: 1px solid black; text-align: left; font-style: italic }</style>'
  + '<p>Пункт меню <br><b>' + msgs.menu.entries.auto + '</b><br> используется для генерации JSON с созданием ключа на основе английского текста (столбец #1).</p>'
  + '<p>Для использования нужно предварительно выбрать диапазон ячеек с содержимым вида:</p>'
  + '<table>'
  //+ '<tr><th>Text ENG</th><th>Text SP</th><th>Voice file ENG</th><th>Voice file ESP</th></tr>'
  + '<tr><td>Solve</td><td>Resuelve</td><td>000048-en-ca.mp3</td><td>000042-sp-ca.mp3</td></tr>'
  + '</table>'
  + '<p>Количество строк - произвольное. Первый и второй столбцы должны содержать непустые и неошибочные (для формул) значения.</p>'
  + '<hr>'
  + '<p>Пункт меню <br><b>' + msgs.menu.entries.manual + '</b><br> используется для генерации JSON с созданием ключа на основе пользовательского столбца (#5).</p>'
  + '<p>Для использования нужно предварительно выбрать диапазон ячеек с содержимым вида:</p>'
  + '<table>'
  //+ '<tr><th>Text ENG</th><th>Text SP</th><th>Voice file ENG</th><th>Voice file ESP</th><th>JSON key</th></tr>'
  + '<tr><td>Solve</td><td>Resuelve</td><td>000048-en-ca.mp3</td><td>000042-sp-ca.mp3</td><td>solveText</td></tr>'
  + '</table>'
  + '<p>Количество строк - произвольное. Первый, второй и пятый столбцы должны содержать непустые и неошибочные (для формул) значения.</p>'
  + '<hr>'
  + '<p><i>Для обоих пунктов меню:</i><p>'
  + '<p>Если ячейки в столбцах с названием аудиофайлов (<i>\'voice file\'</i>) пусты или содержат ошибочные значения, они будут пропущены при формировании JSON.</p>'
  + '<p>Eсли среди JSON ключей найдены повторения, будет выведено уведомление.</p>'
  + '<p>Если диапазон содержит меньшее количество столбцов или значения ячеек в столбцах (указаны в описании пунктов меню) пусты или ошибочны, будет выведено сообщение об ошибке.</p>';
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
      : msgs.error.duplicates.before.manual) + ':\n\n';
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
  var textEng = escapeHtml_(row[0].trim());
  var textEsp = escapeHtml_(row[1].trim());
  var audioEng = voiceName_(row[2].trim());
  var audioEsp = voiceName_(row[3].trim());
  var jsonKey = ISAUTOKEYS
    ? varName_(row[0].trim())
    : escapeHtml_(row[4].trim());

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

// by Sergey Orlov
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
    '#DIV/0!',
    '#Н/Д',
    '#ИМЯ?',
    '#ОШИБКА!'
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
    label: 'Uchiru',
    entries: {
      auto: 'Сделать JSON',
      manual: 'Сделать JSON (пользовательские ключи)',
      help: 'Справка по использованию'
    }
  },
  sidebar: {
    title: 'JSON',
    click: 'Скопировать',
    afterClick: 'Скопировано!',
    help: {
      title: 'Справка'
    }
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
        auto: 'При генерации JSON ключей обнаружены повторения',
        manual: 'В столбце ключей JSON (#5) обнаружены повторения'
      },
      after:
        'JSON будет сформирован, но для избежания ошибок компиляции необходимо использовать уникальные значения.'
    },
    langPath: 'Не найден путь для языка'
  }
};
