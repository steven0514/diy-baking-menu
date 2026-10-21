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
 * 這個端點支援兩種動作：
 *   不帶 action      → 新增或更新一列（同 id 覆蓋）
 *   action:'delete'  → 刪掉指定 id 那一列（店員按「答案不對」時用）
 *
 * 改過這份程式碼後要重新「部署」→「管理部署作業」→ 編輯 → 版本選「新版本」，
 * 否則線上跑的還是舊版，刪除功能不會生效。
 *
 * 安全提醒：這個端點任何人都能寫入。只放現場問答，不要放個資或金鑰。
 * 需要更嚴格時，在下方 SECRET 填一組通行碼，並在前端設定頁網址後面加上 ?token=你的通行碼
 */

var SECRET = '';   // 留空代表不檢查；要加強時填一組自訂字串

function doPost(e) {
  try {
    if (SECRET && (!e.parameter || e.parameter.token !== SECRET)) {
      return reply({ ok: false, error: 'token 不正確' });
    }

    var body = JSON.parse(e.postData.contents);
    var sheetName = String(body.sheet || '').trim();
    var row = body.row;
    var action = String(body.action || 'append');

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

function doGet() {
  return reply({ ok: true, message: '隨身口譯知識庫寫回端點運作中' });
}

function reply(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
