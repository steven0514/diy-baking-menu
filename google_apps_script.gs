/**
 * 自己做烘焙聚樂部 · 隨身口譯知識庫寫回端點
 *
 * 部署步驟（只需做一次）：
 * 1. 打開知識庫試算表 → 擴充功能 → Apps Script
 * 2. 把這整份程式碼貼進去，存檔
 * 3. 右上角「部署」→「新增部署作業」→ 類型選「網頁應用程式」
 *    - 執行身分：我
 *    - 具有存取權的使用者：任何人
 * 4. 複製產生的 /exec 網址，貼進隨身口譯的設定頁「Apps Script 網址」
 *
 * 前端寫入一律用 POST（text/plain，避開預檢請求）。回應會先 302 轉址到
 * script.googleusercontent.com，瀏覽器不一定能跨網域讀到那個回應內容，
 * 但資料在 302 發生前就已經由 doPost 同步寫進試算表了，寫入本身不受影響，
 * 只是讀不讀得到「成功」訊息要看瀏覽器臉色（前端用 no-cors 容錯）。
 *
 * 這個端點支援幾種動作（都用 action 參數指定）：
 *   不帶 action 或 'append' → 新增或更新一列（同 id 覆蓋）
 *   action:'delete'         → 刪掉指定 id 那一列（店員按「答案不對」時用）
 *   action:'approve'        → 把待審分頁的一列移到正式分頁（後台核准時用）
 *   action:'setConfig'      → 更新「設定」分頁的一組 key/value（後台調整模型等非機密設定用）
 *   action:'setSecret'      → 設定 Gemini 金鑰，只存在 Script Properties，絕不讀回前端
 *   action:'hasSecret'      → 回報金鑰是否已設定（布林值），不洩漏內容
 *   action:'listModels'     → 伺服器端用已存的金鑰查可用模型清單，回傳模型名稱（非機密）
 *   action:'generate'       → 伺服器端用已存的金鑰呼叫 Gemini，回傳翻譯結果；金鑰全程不經過前端
 *
 * 另外 doGet 支援 ?action=sheets，回傳試算表目前所有分頁名稱（唯讀，後台核准頁用
 * 來判斷哪些 _待審_<店代號> 分頁真的存在 —— gviz 查詢不存在的分頁名稱時會默默
 * 回傳別的分頁內容，不能拿來判斷分頁存不存在，所以才加這個端點）。
 *
 * 改過這份程式碼後要重新「部署」→「管理部署作業」→ 編輯 → 版本選「新版本」，
 * 否則線上跑的還是舊版。
 *
 * 安全提醒：這個端點任何人都能寫入，SECRET 只是擋掉隨便亂爬網址的自動化腳本，
 * 擋不住真的去看網站原始碼的人（前端是純靜態網頁，沒有後端，token 勢必得跟著
 * 程式碼一起公開）。只放現場問答，不要放個資或機密資料。
 * 這裡的值要跟 knowledge_base.js 的 KB_SCRIPT_TOKEN 保持一致。
 *
 * Gemini 金鑰是唯一真正敏感的東西，所以不走上面這套「反正都是公開的」邏輯：
 * 金鑰只存在這支 Script 的 Script Properties（PropertiesService），前端、
 * 試算表、GitHub 原始碼裡都看不到實際內容，只能靠後台（interpreter_admin.html）
 * 的「設定金鑰」表單覆蓋寫入，寫入後連後台自己都讀不回來。
 */

var SECRET = 'L_z7ye9b6IKXMQhC_oQoh3liK3toQoHl';
var GEMINI_KEY_PROP = 'GEMINI_API_KEY';

function doGet(e) {
  if (e && e.parameter && e.parameter.action === 'sheets') {
    if (SECRET && (!e.parameter || e.parameter.token !== SECRET)) {
      return reply({ ok: false, error: 'token 不正確' });
    }
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var names = ss.getSheets().map(function (s) { return s.getName(); });
    return reply({ ok: true, sheets: names });
  }
  return reply({ ok: true, message: '隨身口譯知識庫寫回端點運作中' });
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    return handleRequest(e, body);
  } catch (err) {
    return reply({ ok: false, error: String(err) });
  }
}

function handleRequest(e, body) {
  try {
    if (SECRET && (!e.parameter || e.parameter.token !== SECRET)) {
      return reply({ ok: false, error: 'token 不正確' });
    }

    var action = String(body.action || 'append');

    // Gemini 金鑰與金鑰相關動作不需要指定分頁，所以放在 sheetName 檢查之前處理。
    if (action === 'setSecret') {
      var secKey = String(body.key || '').trim();
      var secVal = String(body.value != null ? body.value : '').trim();
      if (secKey !== 'gemini_api_key') return reply({ ok: false, error: '不支援的 key：' + secKey });
      if (!secVal) return reply({ ok: false, error: '沒有填金鑰內容' });
      PropertiesService.getScriptProperties().setProperty(GEMINI_KEY_PROP, secVal);
      clearLegacyGeminiKeyFromSheet_();
      return reply({ ok: true, mode: 'secret-set' });
    }
    if (action === 'hasSecret') {
      var has = !!PropertiesService.getScriptProperties().getProperty(GEMINI_KEY_PROP);
      return reply({ ok: true, hasKey: has });
    }
    if (action === 'listModels') {
      return reply(listGeminiModels_());
    }
    if (action === 'generate') {
      return reply(callGemini_(String(body.prompt || ''), String(body.model || '').trim()));
    }

    var sheetName = String(body.sheet || '').trim();
    var row = body.row;

    if (!sheetName) return reply({ ok: false, error: '沒有指定分頁名稱' });

    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 店員按「答案不對」時，把那一列從試算表刪掉
    if (action === 'delete') {
      var id = String(body.id || '').trim();
      if (!id) return reply({ ok: false, error: '沒有指定要刪除的 id' });
      var target = ss.getSheetByName(sheetName);
      if (!target) return reply({ ok: false, error: '找不到分頁 ' + sheetName });
      var last = target.getLastRow();
      if (last < 2) return reply({ ok: false, error: '分頁沒有資料列' });
      var col = target.getRange(1, 1, last, 1).getValues();
      for (var d = col.length - 1; d >= 1; d--) {
        if (String(col[d][0]).trim() === id) {
          target.deleteRow(d + 1);
          return reply({ ok: true, sheet: sheetName, mode: 'deleted', id: id });
        }
      }
      return reply({ ok: false, error: '分頁 ' + sheetName + ' 裡找不到 id ' + id });
    }

    // 更新「設定」分頁裡的一組 key/value（後台調整 AI 模型等設定用）。
    // 「設定」分頁支援兩種排版：橫式（欄位名稱在第1列、值在第2列同一欄）
    // 和直式（A 欄是 key、B 欄是 value），兩種都要能正確寫回。
    if (action === 'setConfig') {
      var cfgKey = String(body.key || '').trim();
      var cfgVal = String(body.value != null ? body.value : '');
      if (!cfgKey) return reply({ ok: false, error: '沒有指定要設定的 key' });
      var cfgSheet = ss.getSheetByName(sheetName);
      if (!cfgSheet) {
        cfgSheet = ss.insertSheet(sheetName);
        cfgSheet.appendRow([cfgKey, cfgVal]);
        return reply({ ok: true, mode: 'created' });
      }
      var lastCol = Math.max(cfgSheet.getLastColumn(), 1);
      var headers = cfgSheet.getRange(1, 1, 1, lastCol).getValues()[0];
      var colIdx = -1;
      for (var h = 0; h < headers.length; h++) {
        if (String(headers[h]).trim() === cfgKey) { colIdx = h + 1; break; }
      }
      if (colIdx > 0) {
        cfgSheet.getRange(2, colIdx).setValue(cfgVal);
        return reply({ ok: true, mode: 'updated-horizontal' });
      }
      var lastRow = Math.max(cfgSheet.getLastRow(), 1);
      var keys = cfgSheet.getRange(1, 1, lastRow, 1).getValues();
      var cfgRowIdx = -1;
      for (var r = 0; r < keys.length; r++) {
        if (String(keys[r][0]).trim() === cfgKey) { cfgRowIdx = r + 1; break; }
      }
      if (cfgRowIdx > 0) {
        cfgSheet.getRange(cfgRowIdx, 2).setValue(cfgVal);
        return reply({ ok: true, mode: 'updated-vertical' });
      }
      cfgSheet.appendRow([cfgKey, cfgVal]);
      return reply({ ok: true, mode: 'appended' });
    }

    // 核准待審條目，從 _待審_X 移到正式分頁
    if (action === 'approve') {
      var id = String(body.id || '').trim();
      var targetSheet = String(body.targetSheet || '').trim();
      if (!id || !targetSheet) return reply({ ok: false, error: '需要指定 id 和 targetSheet' });
      var approveSheet = ss.getSheetByName(sheetName);
      var formalSheet = ss.getSheetByName(targetSheet);
      if (!approveSheet) return reply({ ok: false, error: '找不到待審分頁 ' + sheetName });
      if (!formalSheet) return reply({ ok: false, error: '找不到正式分頁 ' + targetSheet });

      var last = approveSheet.getLastRow();
      if (last < 2) return reply({ ok: false, error: '待審分頁沒有資料列' });
      var col = approveSheet.getRange(1, 1, last, 1).getValues();
      var rowIdx = -1;
      for (var i = 1; i < col.length; i++) {
        if (String(col[i][0]).trim() === id) { rowIdx = i; break; }
      }
      if (rowIdx < 0) return reply({ ok: false, error: '待審分頁裡找不到 id ' + id });

      var rowData = approveSheet.getRange(rowIdx + 1, 1, 1, approveSheet.getLastColumn()).getValues()[0];
      formalSheet.appendRow(rowData);
      approveSheet.deleteRow(rowIdx + 1);
      return reply({ ok: true, action: 'approve', id: id, approved: true });
    }

    if (!row || !row.length) return reply({ ok: false, error: '沒有資料' });

    var sh = ss.getSheetByName(sheetName);

    // 分頁不存在就自動建立並補上標題列
    if (!sh) {
      sh = ss.insertSheet(sheetName);
      sh.appendRow(['id', '分類', '問題關鍵詞（用、分隔）', '中文答案', '需店員', '已審核', '更新日期', '建立者']);
      sh.setFrozenRows(1);
    }

    // 同 id 已存在就更新該列，否則新增一列
    var ids = sh.getRange(1, 1, Math.max(sh.getLastRow(), 1), 1).getValues();
    var found = -1;
    for (var i = 1; i < ids.length; i++) {
      if (String(ids[i][0]).trim() === String(row[0]).trim()) { found = i + 1; break; }
    }
    if (found > 0) {
      sh.getRange(found, 1, 1, row.length).setValues([row]);
    } else {
      sh.appendRow(row);
    }

    return reply({ ok: true, sheet: sheetName, mode: found > 0 ? 'updated' : 'appended' });
  } catch (err) {
    return reply({ ok: false, error: String(err) });
  }
}

// 「設定」分頁裡曾經放過明碼 gemini_api_key（透過 gviz 公開讀取，等於洩漏給所有顧客）。
// 金鑰改存 Script Properties 後，把分頁裡的舊值清掉，避免殘留的明碼繼續外流。
function clearLegacyGeminiKeyFromSheet_() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName('設定');
    if (!sh) return;
    var lastCol = Math.max(sh.getLastColumn(), 1);
    var headers = sh.getRange(1, 1, 1, lastCol).getValues()[0];
    for (var h = 0; h < headers.length; h++) {
      if (String(headers[h]).trim() === 'gemini_api_key') sh.getRange(2, h + 1).setValue('');
    }
    var lastRow = Math.max(sh.getLastRow(), 1);
    var keys = sh.getRange(1, 1, lastRow, 1).getValues();
    for (var r = 0; r < keys.length; r++) {
      if (String(keys[r][0]).trim() === 'gemini_api_key') sh.getRange(r + 1, 2).setValue('');
    }
  } catch (err) {
    // 清不掉也不影響金鑰本身已經存進 Script Properties，不擋主流程
  }
}

// 「設定」分頁裡的 gemini_model 不是機密，伺服器端自己也要讀，當 generate 動作沒指定
// model 時的預設值用。
function getConfiguredModel_() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName('設定');
    if (!sh) return '';
    var lastCol = Math.max(sh.getLastColumn(), 1);
    var headers = sh.getRange(1, 1, 1, lastCol).getValues()[0];
    for (var h = 0; h < headers.length; h++) {
      if (String(headers[h]).trim() === 'gemini_model') {
        var v = sh.getRange(2, h + 1).getValue();
        if (v) return String(v).trim();
      }
    }
    var lastRow = Math.max(sh.getLastRow(), 1);
    var rows = sh.getRange(1, 1, lastRow, 2).getValues();
    for (var r = 0; r < rows.length; r++) {
      if (String(rows[r][0]).trim() === 'gemini_model' && rows[r][1]) return String(rows[r][1]).trim();
    }
  } catch (err) {}
  return '';
}

function listGeminiModels_() {
  var key = PropertiesService.getScriptProperties().getProperty(GEMINI_KEY_PROP);
  if (!key) return { ok: false, error: '尚未設定 Gemini 金鑰' };
  try {
    var res = UrlFetchApp.fetch('https://generativelanguage.googleapis.com/v1beta/models', {
      headers: { 'x-goog-api-key': key },
      muteHttpExceptions: true
    });
    var code = res.getResponseCode();
    if (code !== 200) return { ok: false, error: 'HTTP ' + code + ' ' + res.getContentText().slice(0, 150) };
    var data = JSON.parse(res.getContentText());
    var usable = (data.models || [])
      .filter(function (m) { return (m.supportedGenerationMethods || []).indexOf('generateContent') >= 0; })
      .map(function (m) { return String(m.name || '').replace(/^models\//, ''); })
      .filter(Boolean);
    return { ok: true, models: usable };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

function callGemini_(prompt, model) {
  var key = PropertiesService.getScriptProperties().getProperty(GEMINI_KEY_PROP);
  if (!key) return { ok: false, error: '尚未設定 Gemini 金鑰' };
  if (!prompt) return { ok: false, error: '沒有內容可翻譯' };
  var useModel = model || getConfiguredModel_() || 'gemini-2.5-flash';
  try {
    var res = UrlFetchApp.fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(useModel) + ':generateContent',
      {
        method: 'post',
        contentType: 'application/json',
        headers: { 'x-goog-api-key': key },
        payload: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.2 }
        }),
        muteHttpExceptions: true
      }
    );
    var code = res.getResponseCode();
    if (code !== 200) return { ok: false, error: 'HTTP ' + code + ' ' + res.getContentText().slice(0, 150) };
    var data = JSON.parse(res.getContentText());
    var text = data.candidates[0].content.parts[0].text;
    return { ok: true, text: text, model: useModel };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

function reply(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
