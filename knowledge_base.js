// 自己做烘焙聚樂部 · 現場問答知識庫（RAG 來源）
// 答案一律只存繁體中文，外語在詢問當下即時翻譯。
// 理由：門市配置與規則會變動，維護 6 國語言的成本正是第一階段要消滅的問題。
window.KB_VERSION = 'v2026.10.21.1';

// 預設的 Google Sheets 知識庫（可在設定頁更換）
window.KB_SHEET_ID = '1gupMBpy3l4ThAfNdMiwsWEvlG3_siWDWAODxolgXK18';
window.KB_SHEET_COMMON = '共用';   // 全門市通用條目的分頁名稱

// sheet 欄位對應 Google Sheets 的分頁名稱
window.KB_STORES = [
  { id: 'xinyi',     zh: '台北信義店',   sheet: '台北信義' },
  { id: 'nanxi',     zh: '台北南西店',   sheet: '台北南西' },
  { id: 'shilin',    zh: '台北士林店',   sheet: '台北士林' },
  { id: 'zhongxiao', zh: '台北忠孝店',   sheet: '台北忠孝' },
  { id: 'banqiao',   zh: '新北板橋店',   sheet: '新北板橋' },
  { id: 'bigcity',   zh: '新竹巨城店',   sheet: '新竹巨城' },
  { id: 'dongmen',   zh: '新竹東門店',   sheet: '新竹東門' },
  { id: 'fengjia',   zh: '台中逢甲店',   sheet: '台中逢甲' },
  { id: 'lvyuandao', zh: '台中綠園道店', sheet: '台中綠園道' },
  { id: 'ximen',     zh: '台南西門店',   sheet: '台南西門' },
  { id: 'yuanfu',    zh: '高雄遠百店',   sheet: '高雄遠百' }
];

window.KB_LANGS = [
  // 先聚焦這六種：涵蓋門市實際遇到的絕大多數顧客，也讓店員選單按一下就選到
  // 要擴充時在這裡加一行即可，程式與提示詞都是讀這份清單，不必改其他地方
  { id: 'zh', zh: '中文',   native: '中文',       speech: 'zh-TW' },
  { id: 'en', zh: '英語',   native: 'English',    speech: 'en-US' },
  { id: 'ja', zh: '日語',   native: '日本語',      speech: 'ja-JP' },
  { id: 'ko', zh: '韓語',   native: '한국어',      speech: 'ko-KR' },
  { id: 'th', zh: '泰語',   native: 'ไทย',         speech: 'th-TH' },
  { id: 'vi', zh: '越南語', native: 'Tiếng Việt', speech: 'vi-VN' }
];

// store: 'ALL' 代表全門市通用；陣列代表只適用於特定門市
// needs_staff: true 代表不論是否命中都必須轉由店員回答（安全與金流類）
window.DEFAULT_KB = [
  // ── 器具位置（門市專屬，各店配置不同）──────────────────
  { id: 'tool-spatula-xinyi', store: ['xinyi'], cat: '器具位置',
    q: ['刮刀在哪', '抹刀在哪裡', '矽膠刮刀', '刮板', 'spatula', 'scraper'],
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

// ── 離線示範翻譯（僅在沒有 API 金鑰時使用）────────────────────
// AI 模式不會讀這份資料，答案一律即時翻譯。
// 這份只是為了讓沒設定金鑰的人（例如用分享連結打開）也能看到完整的雙語畫面。
window.KB_DEMO_I18N = {
  'tool-spatula-xinyi': {
    en: { t: 'The spatula is on the tool wall in Zone A, second shelf, the row with red handles.', s: 'en-US' },
    th: { t: 'ไม้พายอยู่ที่ผนังอุปกรณ์โซน A ชั้นที่ 2 แถวด้ามจับสีแดงค่ะ', s: 'th-TH' },
    vi: { t: 'Phới ở khu A, kệ tầng 2, hàng cán màu đỏ.', s: 'vi-VN' },
    id: { t: 'Spatula ada di dinding alat Zona A, rak kedua, baris gagang merah.', s: 'id-ID' }
  },
  'tool-bowl-xinyi': {
    en: { t: 'Mixing bowls are on the bottom shelf of Zone A, the stainless steel stack. Please take a dry one.', s: 'en-US' },
    th: { t: 'ชามผสมอยู่ชั้นล่างสุดของโซน A เป็นสเตนเลส กรุณาเลือกใบที่แห้งค่ะ', s: 'th-TH' },
    vi: { t: 'Tô trộn ở kệ dưới cùng khu A, loại inox, xin lấy tô khô.', s: 'vi-VN' }
  },
  'tool-whisk-xinyi': {
    en: { t: 'Hand whisks hang on the first shelf in Zone A. The stand mixer is on the right side of your workbench.', s: 'en-US' }
  },
  'tool-scale-xinyi': {
    en: { t: 'The scale and measuring cups are at the weighing counter in Zone B, one set shared per workbench.', s: 'en-US' }
  },
  'tool-piping-xinyi': {
    en: { t: 'Piping bags and tips are in the drawer at the decorating counter in Zone C. Please return used tips to the recycling box.', s: 'en-US' }
  },
  'tool-papertowel': {
    en: { t: 'Paper towels are on the wall rack at the side of each workbench.', s: 'en-US' },
    th: { t: 'กระดาษทิชชู่อยู่ที่ที่แขวนด้านข้างโต๊ะทำงานทุกตัวค่ะ', s: 'th-TH' }
  },
  'oven-preheat': {
    en: { t: 'Turn on the oven, set the temperature, and preheat for 10 minutes. When the panel light goes out, it is ready.', s: 'en-US' },
    th: { t: 'เปิดเตาอบ ตั้งอุณหภูมิ แล้วอุ่นไว้ 10 นาที ไฟดับคือพร้อมค่ะ', s: 'th-TH' },
    vi: { t: 'Bật lò, đặt nhiệt độ và làm nóng 10 phút, đèn tắt là đạt.', s: 'vi-VN' }
  },
  'oven-help': {
    en: { t: 'A staff member always handles putting things in and out of the oven. Please raise your hand and we will come right over. Please do not open the oven door yourself.', s: 'en-US' }
  },
  'mixer-speed': {
    en: { t: 'Start the mixer on low. Use medium-high for whipping egg whites. Do not start at top speed or it will splash.', s: 'en-US' }
  },
  'time-chiffon': {
    en: { t: 'A chiffon cake takes about 90 minutes including baking and cooling. After baking it must cool upside down before unmolding.', s: 'en-US' },
    th: { t: 'เค้กชิฟฟ่อนใช้เวลาประมาณ 90 นาที รวมอบและพักให้เย็นค่ะ', s: 'th-TH' },
    vi: { t: 'Bánh chiffon mất khoảng 90 phút, gồm nướng và để nguội.', s: 'vi-VN' }
  },
  'stiff-peaks': {
    en: { t: 'When you lift the whisk and the peak stands straight without drooping, that is stiff peaks. You can stop.', s: 'en-US' },
    th: { t: 'ยกหัวตีขึ้นแล้วยอดตั้งแข็งไม่ตก คือตีได้ที่แล้วค่ะ หยุดได้เลย', s: 'th-TH' }
  },
  'deflate-fix': {
    en: { t: 'For slight deflating, add a small spoon of fresh egg white and fold on low for 10 seconds. If it has separated badly, please raise your hand for a staff member.', s: 'en-US' }
  },
  'takeaway-box': {
    en: { t: 'Yes, you can take it with you. We provide a carry box when you finish. Please ask the counter if you need a cooler bag.', s: 'en-US' },
    th: { t: 'นำกลับได้ค่ะ เสร็จแล้วเรามีกล่องให้ ถ้าต้องการถุงเก็บความเย็นแจ้งที่เคาน์เตอร์ได้เลยค่ะ', s: 'th-TH' }
  },
  'keep-days': {
    en: { t: 'Chiffon and cheese cakes should be refrigerated and eaten within 3 days. Cookies keep 7 days sealed at room temperature.', s: 'en-US' },
    th: { t: 'ชิฟฟ่อนและชีสเค้กเก็บในตู้เย็น ทานภายใน 3 วันค่ะ คุกกี้เก็บในภาชนะปิดสนิทได้ 7 วัน', s: 'th-TH' }
  },
  'hotel-carry': {
    en: { t: 'At room temperature, please refrigerate within 2 hours. In summer, if you will be out more than an hour, please add a cooler bag.', s: 'en-US' }
  },
  'wifi': {
    en: { t: 'The Wi-Fi name and password are on the small sign at the side of each workbench.', s: 'en-US' }
  },
  'restroom-xinyi': {
    en: { t: 'For the restroom, turn left as you exit the shop, then go to the end, it is on the right-hand side.', s: 'en-US' },
    th: { t: 'ห้องน้ำออกจากร้านแล้วเลี้ยวซ้าย เดินไปสุดทาง อยู่ทางขวามือค่ะ', s: 'th-TH' },
    vi: { t: 'Nhà vệ sinh: ra khỏi cửa hàng rẽ trái, đi đến cuối, bên tay phải.', s: 'vi-VN' },
    id: { t: 'Toilet: keluar toko belok kiri, jalan sampai ujung, ada di sebelah kanan.', s: 'id-ID' }
  },
  'wash-hands': {
    en: { t: 'The sink is at the entrance of the work area. Please wash and dry your hands before you start.', s: 'en-US' }
  },
  'photo-ok': {
    en: { t: 'Photos and video are welcome. Feel free to shoot your own bake, but please avoid other customers.', s: 'en-US' }
  }
};
