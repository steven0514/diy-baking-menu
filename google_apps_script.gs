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
 *   action:'checkPassword'  → 比對後台登入密碼（存在指令碼屬性 ADMIN_PASSWORD），只回傳對或不對
 *
 * 另外 doGet 支援 ?action=sheets，回傳試算表目前所有分頁名稱（唯讀，後台核准頁用
 * 來判斷哪些 _待審_<中文店名> 分頁真的存在 —— gviz 查詢不存在的分頁名稱時會默默
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
var GEMINI_MODEL_PROP = 'GEMINI_MODEL';
var ADMIN_PASS_PROP = 'ADMIN_PASSWORD';
var GITHUB_TOKEN_PROP = 'GITHUB_TOKEN';

// 商品菜單要發布到哪個 repo。這兩個不是機密，寫在這裡就好。
var GITHUB_REPO = 'steven0514/diy-baking-menu';
var GITHUB_BRANCH = 'main';

/**
 * 敏感動作的第二道關卡。
 *
 * SECRET 寫在公開的 knowledge_base.js 裡（純靜態網頁沒有後端，token 勢必得公開），
 * 所以「有 token」不能當成「是管理員」。會改金鑰、動知識庫、或拿 GitHub 權杖去寫
 * repo 的動作，一律要再附上管理密碼，否則任何看過原始碼的人都能照樣呼叫。
 *
 * 店員端會用到的動作（寫待審、翻譯）不能要求密碼，維持只驗 token。
 */
function adminOk_(body) {
  var stored = PropertiesService.getScriptProperties().getProperty(ADMIN_PASS_PROP);
  if (!stored) return true;   // 還沒設密碼就不擋，否則等於把自己鎖在外面
  return String(body.password || '') === stored;
}

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
      if (!adminOk_(body)) return reply({ ok: false, error: '需要管理密碼' });
      var secKey = String(body.key || '').trim();
      var secVal = String(body.value != null ? body.value : '').trim();
      if (!secVal) return reply({ ok: false, error: '沒有填內容' });
      var propMap = {
        gemini_api_key: GEMINI_KEY_PROP,
        gemini_model: GEMINI_MODEL_PROP,
        github_token: GITHUB_TOKEN_PROP
      };
      var prop = propMap[secKey];
      if (!prop) return reply({ ok: false, error: '不支援的 key：' + secKey });
      PropertiesService.getScriptProperties().setProperty(prop, secVal);
      if (prop === GEMINI_KEY_PROP) clearLegacyGeminiKeyFromSheet_();
      return reply({ ok: true, mode: 'secret-set', key: secKey });
    }
    // 發布商品菜單到 GitHub。權杖只存在指令碼屬性，不會送到前端。
    // 這個動作等於「可以改 repo 內容」，一定要管理密碼，不能只靠公開的 token。
    if (action === 'publishGitHub') {
      if (!adminOk_(body)) return reply({ ok: false, error: '需要管理密碼' });
      return reply(publishToGitHub_(body.files, String(body.message || 'chore(menu): update from admin')));
    }
    if (action === 'hasSecret') {
      var props = PropertiesService.getScriptProperties();
      return reply({
        ok: true,
        hasKey: !!props.getProperty(GEMINI_KEY_PROP),          // 沿用舊欄位名，店員端在看這個
        hasGithubToken: !!props.getProperty(GITHUB_TOKEN_PROP),
        hasPassword: !!props.getProperty(ADMIN_PASS_PROP),
        model: getConfiguredModel_(),                           // 模型名稱不是機密，可以回報
        modelSource: modelSource_()                             // 讓人看得出來設定是從哪裡來的
      });
    }
    // 後台登入用。密碼只能在 Apps Script「專案設定 → 指令碼屬性」手動設定 ADMIN_PASSWORD，
    // 不開放任何線上頁面修改，否則公開的後台網址等於可以自己改密碼。
    if (action === 'checkPassword') {
      var stored = PropertiesService.getScriptProperties().getProperty(ADMIN_PASS_PROP);
      if (!stored) return reply({ ok: true, noPassword: true });
      return reply({ ok: true, pass: String(body.password || '') === stored });
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

/**
 * 授權用。第一次部署這版程式碼後，要在編輯器手動執行這個函式一次，
 * 同意「連線到外部服務」權限（UrlFetchApp），listModels / generate 才有權呼叫 Gemini。
 * 執行後看「執行紀錄」：出現 models 清單就是成功，出現「尚未設定 Gemini 金鑰」
 * 代表權限已經給了、只差還沒到後台貼金鑰，一樣算完成。
 *
 * 其他輔助函式名稱結尾都有底線（Apps Script 的私有函式慣例），不會出現在
 * 執行下拉選單裡，所以才需要這個沒有底線的函式當入口。
 */
function authorizeExternalRequest() {
  var result = listGeminiModels_();
  Logger.log(JSON.stringify(result));
  return result;
}

// 「設定」分頁裡曾經放過明碼 gemini_api_key（透過 gviz 公開讀取，等於洩漏給所有顧客）。
// 金鑰改存 Script Properties 後，把分頁裡的舊值清掉，避免殘留的明碼繼續外流。
function clearLegacyGeminiKeyFromSheet_() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName('設定');
    if (!sh) return;
    // 橫式與直式只能擇一處理。兩種都跑的話，橫式表的 A1 是欄位名稱 gemini_api_key，
    // 直式邏輯會誤判成「key 在 A 欄」而把 B1（隔壁欄位的名稱）當成值清掉。
    var lastCol = Math.max(sh.getLastColumn(), 1);
    var headers = sh.getRange(1, 1, 1, lastCol).getValues()[0];
    for (var h = 0; h < headers.length; h++) {
      if (String(headers[h]).trim() === 'gemini_api_key') {
        sh.getRange(2, h + 1).setValue('');
        return;
      }
    }
    var lastRow = Math.max(sh.getLastRow(), 1);
    var keys = sh.getRange(1, 1, lastRow, 1).getValues();
    for (var r = 0; r < keys.length; r++) {
      if (String(keys[r][0]).trim() === 'gemini_api_key') {
        sh.getRange(r + 1, 2).setValue('');
        return;
      }
    }
  } catch (err) {
    // 清不掉也不影響金鑰本身已經存進 Script Properties，不擋主流程
  }
}

/**
 * 模型設定目前是從哪裡來的。用來判斷「設定」分頁還能不能刪：
 *   'property' → 來自指令碼屬性，「設定」分頁可以安全刪除
 *   'sheet'    → 還在靠「設定」分頁，刪了會掉回預設模型
 *   'default'  → 兩邊都沒設，用程式內建的預設值
 */
function modelSource_() {
  if (PropertiesService.getScriptProperties().getProperty(GEMINI_MODEL_PROP)) return 'property';
  return getConfiguredModel_() ? 'sheet' : 'default';
}

// 模型名稱以指令碼屬性 GEMINI_MODEL 為準，跟金鑰放在同一個地方管理。
// 舊版放在「設定」分頁的 gemini_model 還是讀得到，當作沒設指令碼屬性時的後備。
function getConfiguredModel_() {
  var fromProp = PropertiesService.getScriptProperties().getProperty(GEMINI_MODEL_PROP);
  if (fromProp) return String(fromProp).trim();
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

/**
 * 測試用：在編輯器執行這個函式，確認後端真的能用指令碼屬性裡的 GitHub 權杖寫入 repo。
 * 在編輯器執行不必輸入管理密碼（能打開這個專案的人本來就是擁有者）。
 *
 * 成功的話 repo 根目錄會多出 _publish_test.txt，看執行紀錄會是
 * {"ok":true,"results":[{"path":"_publish_test.txt","ok":true,"commit":"xxxxxxx"}]...}
 * 那個測試檔確認完就可以刪掉，不影響網站。
 */
function testPublish() {
  var r = publishToGitHub_(
    [{ path: '_publish_test.txt', content: '發布代理測試 ' + new Date().toISOString() + '\n確認後可刪除此檔。\n' }],
    'test: 確認 Apps Script 能代為寫入 GitHub'
  );
  Logger.log(JSON.stringify(r));
  return r;
}

/**
 * 代替商品後台把檔案寫進 GitHub。權杖只存在指令碼屬性，前端拿不到。
 *
 * files 格式：[{ path: 'products_data.js', content: '檔案內容' }, ...]
 * 一次寫多個檔案時逐一處理，其中一個失敗就把錯誤一起回報，不中斷其他檔案，
 * 免得前兩個寫成功、第三個失敗卻看不出來哪個成功了。
 */
function publishToGitHub_(files, message) {
  var token = PropertiesService.getScriptProperties().getProperty(GITHUB_TOKEN_PROP);
  if (!token) return { ok: false, error: '尚未設定 GitHub 權杖（指令碼屬性 GITHUB_TOKEN）' };
  if (!files || !files.length) return { ok: false, error: '沒有要發布的檔案' };

  var results = [];
  var failed = 0;
  for (var i = 0; i < files.length; i++) {
    var path = String((files[i] && files[i].path) || '').trim();
    var content = (files[i] && files[i].content) != null ? String(files[i].content) : '';
    if (!path) { results.push({ path: '(未指定)', ok: false, error: '沒有指定檔案路徑' }); failed++; continue; }
    try {
      results.push(putGitHubFile_(token, path, content, message));
      if (!results[results.length - 1].ok) failed++;
    } catch (err) {
      results.push({ path: path, ok: false, error: String(err) });
      failed++;
    }
  }
  return { ok: failed === 0, results: results, repo: GITHUB_REPO, branch: GITHUB_BRANCH };
}

function putGitHubFile_(token, path, content, message) {
  var base = 'https://api.github.com/repos/' + GITHUB_REPO + '/contents/' + path;
  var headers = {
    'Authorization': 'Bearer ' + token,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'diy-baking-menu-apps-script'
  };

  // 覆寫既有檔案必須帶上目前的 sha，沒有就是新增檔案
  var sha = null;
  var getRes = UrlFetchApp.fetch(base + '?ref=' + encodeURIComponent(GITHUB_BRANCH), {
    headers: headers, muteHttpExceptions: true
  });
  if (getRes.getResponseCode() === 200) {
    sha = JSON.parse(getRes.getContentText()).sha;
  }

  var payload = {
    message: message,
    content: Utilities.base64Encode(content, Utilities.Charset.UTF_8),
    branch: GITHUB_BRANCH
  };
  if (sha) payload.sha = sha;

  var putRes = UrlFetchApp.fetch(base, {
    method: 'put',
    contentType: 'application/json',
    headers: headers,
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
  var code = putRes.getResponseCode();
  if (code !== 200 && code !== 201) {
    return { path: path, ok: false, error: 'HTTP ' + code + ' ' + putRes.getContentText().slice(0, 200) };
  }
  var data = JSON.parse(putRes.getContentText());
  return { path: path, ok: true, commit: (data.commit && data.commit.sha || '').slice(0, 7) };
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
