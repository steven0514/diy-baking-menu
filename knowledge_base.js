// 自己做烘焙聚樂部 · 現場問答知識庫（RAG 來源）
// 答案一律只存繁體中文，外語在詢問當下即時翻譯。
// 理由：門市配置與規則會變動，維護 6 國語言的成本正是第一階段要消滅的問題。
window.KB_VERSION = 'v2026.10.21.1';

window.KB_STORES = [
  { id: 'xinyi',     zh: '台北信義店' },
  { id: 'nanxi',     zh: '台北南西店' },
  { id: 'shilin',    zh: '台北士林店' },
  { id: 'zhongxiao', zh: '台北忠孝店' },
  { id: 'banqiao',   zh: '新北板橋店' },
  { id: 'bigcity',   zh: '新竹巨城店' },
  { id: 'dongmen',   zh: '新竹東門店' },
  { id: 'fengjia',   zh: '台中逢甲店' },
  { id: 'lvyuandao', zh: '台中綠園道店' },
  { id: 'ximen',     zh: '台南西門店' },
  { id: 'yuanfu',    zh: '高雄遠百店' }
];

window.KB_LANGS = [
  // 東南亞（在台主要客群與移工語言）
  { id: 'th',    zh: '泰語',       native: 'ไทย',              speech: 'th-TH' },
  { id: 'vi',    zh: '越南語',     native: 'Tiếng Việt',       speech: 'vi-VN' },
  { id: 'id',    zh: '印尼語',     native: 'Bahasa Indonesia', speech: 'id-ID' },
  { id: 'tl',    zh: '菲律賓語',   native: 'Tagalog',          speech: 'fil-PH' },
  { id: 'ms',    zh: '馬來語',     native: 'Bahasa Melayu',    speech: 'ms-MY' },
  { id: 'my',    zh: '緬甸語',     native: 'မြန်မာ',              speech: 'my-MM' },
  { id: 'km',    zh: '柬埔寨語',   native: 'ភាសាខ្មែរ',            speech: 'km-KH' },
  // 東北亞與英語系
  { id: 'en',    zh: '英語',       native: 'English',          speech: 'en-US' },
  { id: 'ja',    zh: '日語',       native: '日本語',            speech: 'ja-JP' },
  { id: 'ko',    zh: '韓語',       native: '한국어',            speech: 'ko-KR' },
  { id: 'yue',   zh: '粵語',       native: '粵語',              speech: 'zh-HK' },
  // 歐美與其他觀光客
  { id: 'es',    zh: '西班牙語',   native: 'Español',          speech: 'es-ES' },
  { id: 'fr',    zh: '法語',       native: 'Français',         speech: 'fr-FR' },
  { id: 'de',    zh: '德語',       native: 'Deutsch',          speech: 'de-DE' },
  { id: 'it',    zh: '義大利語',   native: 'Italiano',         speech: 'it-IT' },
  { id: 'pt',    zh: '葡萄牙語',   native: 'Português',        speech: 'pt-BR' },
  { id: 'ru',    zh: '俄語',       native: 'Русский',          speech: 'ru-RU' },
  { id: 'ar',    zh: '阿拉伯語',   native: 'العربية',           speech: 'ar-SA' },
  { id: 'hi',    zh: '印地語',     native: 'हिन्दी',              speech: 'hi-IN' },
  { id: 'tr',    zh: '土耳其語',   native: 'Türkçe',           speech: 'tr-TR' }
];

// store: 'ALL' 代表全門市通用；陣列代表只適用於特定門市
// needs_staff: true 代表不論是否命中都必須轉由店員回答（安全與金流類）
window.DEFAULT_KB = [
  // ── 器具位置（門市專屬，各店配置不同）──────────────────
  { id: 'tool-spatula-xinyi', store: ['xinyi'], cat: '器具位置',
    q: ['刮刀在哪', '抹刀在哪裡', '矽膠刮刀', 'spatula'],
    a_zh: '刮刀在 A 區工具牆第二層，紅色握把那一排。', verified: true, updated: '2026-10-21', by: '系統預設' },
  { id: 'tool-bowl-xinyi', store: ['xinyi'], cat: '器具位置',
    q: ['工作盆在哪', '攪拌盆', 'mixing bowl', '鋼盆'],
    a_zh: '工作盆在 A 區層架最下層，不鏽鋼的那一疊，請拿乾的。', verified: true, updated: '2026-10-21', by: '系統預設' },
  { id: 'tool-whisk-xinyi', store: ['xinyi'], cat: '器具位置',
    q: ['打蛋器在哪', '手持打蛋器', 'whisk'],
    a_zh: '手持打蛋器在 A 區第一層掛鉤上；電動攪拌機在你的工作檯右側。', verified: true, updated: '2026-10-21', by: '系統預設' },
  { id: 'tool-scale-xinyi', store: ['xinyi'], cat: '器具位置',
    q: ['電子秤在哪', '磅秤', 'scale', '量杯在哪'],
    a_zh: '電子秤與量杯都在 B 區秤料檯，一個工作檯共用一台。', verified: true, updated: '2026-10-21', by: '系統預設' },
  { id: 'tool-piping-xinyi', store: ['xinyi'], cat: '器具位置',
    q: ['擠花袋在哪', '花嘴', 'piping bag'],
    a_zh: '擠花袋與花嘴在 C 區裝飾檯的抽屜，花嘴用完請放回回收盒。', verified: true, updated: '2026-10-21', by: '系統預設' },
  { id: 'tool-papertowel', store: 'ALL', cat: '器具位置',
    q: ['廚房紙巾在哪', '紙巾', 'paper towel', '擦手'],
    a_zh: '廚房紙巾在每個工作檯側邊的壁掛架上。', verified: true, updated: '2026-10-21', by: '系統預設' },

  // ── 設備操作 ────────────────────────────────────────
  { id: 'oven-preheat', store: 'ALL', cat: '設備操作',
    q: ['烤箱怎麼預熱', '預熱幾分鐘', 'preheat', '烤箱溫度'],
    a_zh: '烤箱請先按電源，設定好溫度後預熱 10 分鐘，面板燈熄了才代表到溫。', verified: true, updated: '2026-10-21', by: '系統預設' },
  { id: 'oven-help', store: 'ALL', cat: '設備操作',
    q: ['烤箱打不開', '烤箱怎麼用', '進烤箱', '可以幫我放進去嗎'],
    a_zh: '進出烤箱一律由夥伴協助，請舉手，我們馬上過去。請不要自己開烤箱門。', verified: true, updated: '2026-10-21', by: '系統預設' },
  { id: 'mixer-speed', store: 'ALL', cat: '設備操作',
    q: ['攪拌機怎麼調速', '幾段', 'mixer speed'],
    a_zh: '攪拌機從低速開始，打發蛋白用中高速，不要一開始就用最高速，會噴出來。', verified: true, updated: '2026-10-21', by: '系統預設' },

  // ── 製作流程 ────────────────────────────────────────
  { id: 'time-chiffon', store: 'ALL', cat: '製作流程',
    q: ['戚風蛋糕要做多久', '多久可以好', '需要多少時間', 'how long'],
    a_zh: '戚風蛋糕含烘烤與冷卻大約 90 分鐘，烤好後要倒扣放涼才能脫模。', verified: true, updated: '2026-10-21', by: '系統預設' },
  { id: 'stiff-peaks', store: 'ALL', cat: '製作流程',
    q: ['打發好了嗎', '要打多久', '硬性發泡', 'stiff peaks'],
    a_zh: '提起打蛋器時蛋白霜尖端挺立不垂下，就是硬性發泡，可以停了。', verified: true, updated: '2026-10-21', by: '系統預設' },
  { id: 'deflate-fix', store: 'ALL', cat: '製作流程',
    q: ['消泡了', '麵糊變稀', '失敗了', '打過頭'],
    a_zh: '輕微消泡可以加一小匙新鮮蛋白，低速拌 10 秒救回；若已嚴重出水請舉手找夥伴。', verified: true, updated: '2026-10-21', by: '系統預設' },

  // ── 帶走與保存 ──────────────────────────────────────
  { id: 'takeaway-box', store: 'ALL', cat: '帶走與保存',
    q: ['可以帶走嗎', '有盒子嗎', 'takeaway', '包裝'],
    a_zh: '可以帶走，完成後我們會提供提盒；需要保冷袋請跟櫃檯說。', verified: true, updated: '2026-10-21', by: '系統預設' },
  { id: 'keep-days', store: 'ALL', cat: '帶走與保存',
    q: ['可以放多久', '保存期限', '要冷藏嗎', 'how long can I keep'],
    a_zh: '戚風與乳酪類請冷藏並於 3 天內食用；餅乾類常溫密封可放 7 天。', verified: true, updated: '2026-10-21', by: '系統預設' },
  { id: 'hotel-carry', store: 'ALL', cat: '帶走與保存',
    q: ['帶回飯店', '可以撐多久', '會壞掉嗎'],
    a_zh: '常溫下建議 2 小時內放進冰箱；夏天外出超過 1 小時請加購保冷袋。', verified: true, updated: '2026-10-21', by: '系統預設' },

  // ── 門市資訊 ────────────────────────────────────────
  { id: 'wifi', store: 'ALL', cat: '門市資訊',
    q: ['wifi', '無線網路', '密碼'],
    a_zh: 'Wi-Fi 名稱與密碼貼在每個工作檯邊的立牌上。', verified: true, updated: '2026-10-21', by: '系統預設' },
  { id: 'restroom-xinyi', store: ['xinyi'], cat: '門市資訊',
    q: ['廁所在哪', '洗手間', 'restroom', 'toilet'],
    a_zh: '洗手間出店門左轉，走到底右手邊。', verified: true, updated: '2026-10-21', by: '系統預設' },
  { id: 'wash-hands', store: 'ALL', cat: '門市資訊',
    q: ['洗手台在哪', '可以洗手嗎', 'wash hands'],
    a_zh: '洗手台在工作區入口處，開始製作前請先洗手並擦乾。', verified: true, updated: '2026-10-21', by: '系統預設' },
  { id: 'photo-ok', store: 'ALL', cat: '門市資訊',
    q: ['可以拍照嗎', '可以錄影嗎', 'photo', 'can I take pictures'],
    a_zh: '歡迎拍照錄影，拍自己的作品沒問題，但請避免拍到其他顧客。', verified: true, updated: '2026-10-21', by: '系統預設' },

  // ── 必須轉店員（安全與金流）──────────────────────────
  { id: 'allergy', store: 'ALL', cat: '特殊需求', needs_staff: true,
    q: ['過敏', '堅果', '不能吃', 'allergy', 'allergic', '素食', '清真', 'halal', '豬肉', '乳糖'],
    a_zh: '涉及過敏與飲食禁忌，必須由店員確認並產出書面工作卡，不可由系統自動回答。', verified: true, updated: '2026-10-21', by: '系統預設' },
  { id: 'price-change', store: 'ALL', cat: '價格與付款', needs_staff: true,
    q: ['多少錢', '可以換嗎', '退費', '折扣', 'price', 'refund', 'discount'],
    a_zh: '價格、改單、退費與折扣一律由店員與櫃檯確認。', verified: true, updated: '2026-10-21', by: '系統預設' },
  { id: 'injury', store: 'ALL', cat: '安全', needs_staff: true,
    q: ['燙到', '割到', '受傷', '不舒服', 'burn', 'cut', 'hurt'],
    a_zh: '顧客表示受傷或身體不適，請店員立即到場處理並依門市安全流程回報。', verified: true, updated: '2026-10-21', by: '系統預設' }
];
