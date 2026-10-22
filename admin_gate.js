/**
 * 後台登入遮罩（admin.html 與 interpreter_admin.html 共用）
 *
 * 密碼存在 Apps Script 的指令碼屬性 ADMIN_PASSWORD，前端只把輸入的密碼送去後端
 * 比對、拿回是或否，原始碼裡看不到密碼本身。
 *
 * 必須誠實看待這層保護的強度：這是純靜態網頁，「驗證通過就顯示畫面」這段邏輯
 * 跑在瀏覽器裡，懂技術的人可以從開發者工具繞過。它擋得住搜尋引擎、爬蟲與隨手
 * 點進網址的人，擋不住真的想進來的人。真正阻止資料被竄改的仍然是各自的寫入
 * 憑證：商品後台要 GitHub PAT 才發布得了，知識庫要 token 才寫得進試算表。
 *
 * 用法：在頁面載入 knowledge_base.js 之後呼叫
 *   adminGate({ title: '商品菜單後台' });
 */
(function () {
  'use strict';

  var PASS_KEY = 'diybc_admin_gate';
  var PASS_TTL = 7 * 24 * 60 * 60 * 1000;   // 通過後 7 天內不用重打
  var PW_KEY = 'diybc_admin_pw';            // 只放 sessionStorage，關掉分頁就消失

  /**
   * 會改到後端設定、或動用 GitHub 權杖的動作，後端都會要求附上管理密碼
   * （公開的 SECRET token 不能當成管理員身分）。所以登入時輸入的密碼要留著給那些
   * 動作用，放在 sessionStorage：同一個分頁內不用重打，分頁關掉就清掉。
   *
   * 7 天免登入期間若另開新分頁，sessionStorage 會是空的，這時才用 prompt 補問一次。
   */
  window.adminPassword = {
    get: function () {
      try { return sessionStorage.getItem(PW_KEY) || ''; } catch (e) { return ''; }
    },
    set: function (pw) {
      try { sessionStorage.setItem(PW_KEY, pw); } catch (e) {}
    },
    clear: function () {
      try { sessionStorage.removeItem(PW_KEY); } catch (e) {}
    },
    // 需要密碼時呼叫這個：有就直接回傳，沒有就問一次
    require: function (why) {
      var pw = window.adminPassword.get();
      if (pw) return pw;
      pw = window.prompt((why || '這個動作需要管理密碼') + '\n\n請輸入管理密碼：') || '';
      if (pw) window.adminPassword.set(pw);
      return pw;
    }
  };

  function unlocked() {
    try {
      var raw = localStorage.getItem(PASS_KEY);
      if (!raw) return false;
      return (Date.now() - parseInt(raw, 10)) < PASS_TTL;
    } catch (e) { return false; }
  }
  function remember() {
    try { localStorage.setItem(PASS_KEY, String(Date.now())); } catch (e) {}
  }

  function injectStyle() {
    if (document.getElementById('adminGateStyle')) return;
    var s = document.createElement('style');
    s.id = 'adminGateStyle';
    s.textContent = [
      'body.gate-locked > *:not(#adminGate){display:none !important}',
      'body.gate-locked{overflow:hidden}',
      '#adminGate{position:fixed; inset:0; z-index:99999; display:flex; align-items:center;',
      '  justify-content:center; padding:20px; background:#0c0e14;',
      "  font-family:'Plus Jakarta Sans','Noto Sans TC','PingFang TC',sans-serif}",
      '#adminGate .gate-box{width:100%; max-width:360px; background:#161925; color:#f3f4f6;',
      '  border:1px solid rgba(255,255,255,.09); border-radius:16px; padding:22px 20px}',
      '#adminGate h1{font-size:1.05rem; font-weight:700; margin:0 0 6px}',
      '#adminGate h1 span{color:#e88c5d}',
      '#adminGate p{font-size:.8rem; color:#9ca3af; line-height:1.65; margin:0 0 14px}',
      '#adminGate input{width:100%; box-sizing:border-box; background:#1e2230; color:#f3f4f6;',
      '  border:1px solid rgba(255,255,255,.09); border-radius:10px; padding:11px 12px;',
      '  font-size:.9rem; font-family:inherit; margin-bottom:10px}',
      '#adminGate button{width:100%; border:none; border-radius:10px; padding:11px;',
      '  font-size:.9rem; font-weight:700; color:#fff; background:#c2673a; cursor:pointer;',
      '  font-family:inherit}',
      '#adminGate button:disabled{opacity:.5; cursor:default}',
      '#adminGate .gate-msg{font-size:.78rem; margin-top:11px; line-height:1.5; min-height:1.1em;',
      '  color:#9ca3af}',
      '#adminGate .gate-msg.err{color:#fca5a5}',
      '#adminGate .gate-msg.warn{color:#fbbf24}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function postScript(payload) {
    var url = window.KB_SCRIPT_URL || '';
    if (!url) return Promise.reject(new Error('讀不到 Apps Script 網址（knowledge_base.js 沒載入？）'));
    if (window.KB_SCRIPT_TOKEN) url += '?token=' + encodeURIComponent(window.KB_SCRIPT_TOKEN);
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.text();
    }).then(function (text) {
      var data;
      try { data = JSON.parse(text); } catch (e) { throw new Error('回應格式錯誤'); }
      if (!data.ok) throw new Error(data.error || '驗證失敗');
      return data;
    });
  }

  window.adminGate = function (opts) {
    opts = opts || {};
    if (unlocked()) return;

    injectStyle();
    document.body.classList.add('gate-locked');

    var gate = document.createElement('div');
    gate.id = 'adminGate';
    gate.innerHTML =
      '<div class="gate-box">' +
      '<h1>🍰 <span>' + (opts.title || '後台') + '</span></h1>' +
      '<p>這是內部管理頁面，請輸入管理密碼。</p>' +
      '<input type="password" id="gatePass" placeholder="管理密碼" autocomplete="current-password">' +
      '<button type="button" id="gateBtn">進入</button>' +
      '<p class="gate-msg" id="gateMsg"></p>' +
      '</div>';
    document.body.appendChild(gate);

    var inp = document.getElementById('gatePass');
    var btn = document.getElementById('gateBtn');
    var msg = document.getElementById('gateMsg');

    function setMsg(text, cls) {
      msg.textContent = text;
      msg.className = 'gate-msg' + (cls ? ' ' + cls : '');
    }
    function open() {
      document.body.classList.remove('gate-locked');
      gate.remove();
      if (typeof opts.onUnlock === 'function') opts.onUnlock();
    }

    function submit() {
      var pw = inp.value;
      if (!pw) { inp.focus(); return; }
      btn.disabled = true;
      setMsg('驗證中…');
      postScript({ action: 'checkPassword', password: pw })
        .then(function (d) {
          if (d.noPassword) {
            // 後端還沒設密碼，先放行但要講清楚，不然會以為已經保護好了
            remember();
            alert('後端尚未設定管理密碼，目前任何人都能進入這個頁面。\n\n'
              + '請到 Apps Script →「專案設定」→「指令碼屬性」新增一組 ADMIN_PASSWORD。');
            open();
            return;
          }
          if (d.pass) { remember(); window.adminPassword.set(pw); open(); return; }
          setMsg('密碼不對。', 'err');
          inp.value = '';
          inp.focus();
        })
        .catch(function (e) {
          // 舊版後端沒有 checkPassword 這個動作，會掉到「要指定分頁名稱」那條路，
          // 直接寫出真正原因，免得以為是密碼打錯。
          if (/沒有指定分頁名稱/.test(e.message)) {
            setMsg('後端還是舊版（沒有 checkPassword 動作）。請先到 Apps Script 重新部署新版本。', 'warn');
          } else {
            setMsg('無法驗證：' + e.message, 'err');
          }
        })
        .then(function () { btn.disabled = false; });
    }

    btn.addEventListener('click', submit);
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
    setTimeout(function () { try { inp.focus(); } catch (e) {} }, 60);
  };
})();
