/**
 * 自己做烘焙聚樂部 - 智能菜單篩選 Vue 3 核心邏輯 (menu_app.js)
 * -------------------------------------------------------------
 * 包含：
 * 1. 12 間門市設定 (storeList)
 * 2. 6 國語言完整辭典 (i18n)
 * 3. 節慶設定 (seasonalConfig) 與即時雙向同步
 * 4. Vue 3 響應式應用實例，支援條件篩選、置頂排序、動態按鈕隱藏、富文本高亮與彈窗
 */

(function () {
    const STORE_STORAGE_KEY = 'diybc_selected_store';
    const SEASONAL_STORAGE_KEY = 'diybc_seasonal_config';
    const PRODUCTS_DB_KEY = 'diybc_products_db';

    // 12 間分店名單
    const storeList = [
        {
            id: "all",
            zh: "全部門市 (不限分店)",
            en: "All Branches (Any)",
            ja: "全店舗（指定なし）",
            th: "ทุกสาขา (ไม่จำกัด)",
            ko: "전체 매장 (무관)",
            vi: "Tất cả chi nhánh"
        },
        {
            id: "xinyi",
            zh: "台北遠百信義A13店 (吳寶春自己做)",
            en: "Taipei Xinyi A13 (Wu Pao Chun)",
            ja: "台北遠百信義A13店（呉宝春コラボ）",
            th: "สาขาไทเปซินอี้ A13 (อู๋เป่าชุน)",
            ko: "타이베이 신의 A13점 (우바오춘 콜라보)",
            vi: "Chi nhánh Tín Nghĩa A13 (Đài Bắc - Wu Pao Chun)"
        },
        {
            id: "shilin",
            zh: "台北士林店",
            en: "Taipei Shilin Store",
            ja: "台北士林店",
            th: "สาขาไทเปซื่อหลิน",
            ko: "타이베이 스린점",
            vi: "Chi nhánh Sĩ Lâm (Đài Bắc)"
        },
        {
            id: "banqiao",
            zh: "新北板橋店",
            en: "New Taipei Banqiao Store",
            ja: "新北板橋店",
            th: "สาขาป่านเฉียว (นิวไทเป)",
            ko: "신베이 반차오점",
            vi: "Chi nhánh Bản Kiều (Tân Bắc)"
        },
        {
            id: "xindian",
            zh: "新北新店店 (京站5F)",
            en: "New Taipei Xindian (Qsquare 5F)",
            ja: "新北新店店（京站5F）",
            th: "สาขาซินเตี้ยน (Qsquare 5F)",
            ko: "신베이 신뎬점 (Qsquare 5F)",
            vi: "Chi nhánh Tân Điếm (Qsquare 5F)"
        },
        {
            id: "zhongli",
            zh: "桃園中壢店 (SOGO旁)",
            en: "Taoyuan Zhongli (near SOGO)",
            ja: "桃園中壢店（SOGOそば）",
            th: "สาขาจงลี่ (ข้าง SOGO)",
            ko: "타오위안 중리점 (SOGO 옆)",
            vi: "Chi nhánh Trung Lịch (Cạnh SOGO)"
        },
        {
            id: "yiwen",
            zh: "桃園中正藝文店",
            en: "Taoyuan Arts Center Store",
            ja: "桃園中正藝文店",
            th: "สาขาเยว่อี้เหวินเถาหยวน",
            ko: "타오위안 예원점",
            vi: "Chi nhánh Nghệ Văn Đào Viên"
        },
        {
            id: "hsinchu",
            zh: "新竹文化店",
            en: "Hsinchu Wenhua Store",
            ja: "新竹文化店",
            th: "สาขาซินจู๋เหวินฮว่า",
            ko: "신주 문화점",
            vi: "Chi nhánh Văn Hóa Tân Trúc"
        },
        {
            id: "jingming",
            zh: "台中精明店",
            en: "Taichung Jingming Store",
            ja: "台中精明店",
            th: "สาขาจิงหมิงไถจง",
            ko: "타이중 징밍점",
            vi: "Chi nhánh Tinh Minh Đài Trung"
        },
        {
            id: "caowu",
            zh: "台中草悟道店",
            en: "Taichung Calligraphy Greenway",
            ja: "台中草悟道店",
            th: "สาขาเฉาอู้เต้าไถจง",
            ko: "타이중 차오우다오점",
            vi: "Chi nhánh Thảo Ngộ Đạo Đài Trung"
        },
        {
            id: "focus",
            zh: "台南Focus店 (3F)",
            en: "Tainan Focus Store (3F)",
            ja: "台南Focus店（3F）",
            th: "สาขาไถหนาน Focus (3F)",
            ko: "타이난 Focus점 (3F)",
            vi: "Chi nhánh Focus Đài Nam (3F)"
        },
        {
            id: "kaohsiung",
            zh: "高雄SKM Park店 (3F)",
            en: "Kaohsiung SKM Park (3F)",
            ja: "高雄SKM Park店（3F）",
            th: "สาขาเกาสง SKM Park (3F)",
            ko: "가오슝 SKM Park점 (3F)",
            vi: "Chi nhánh SKM Park Cao Hùng (3F)"
        }
    ];

    // 6 國語言辭典
    const i18n = {
        zh: {
            title: "自己做烘焙聚樂部 - 智能菜單篩選",
            subtitle: "輕鬆點選您的需求，立即找到今天最適合製作的手作甜點！",
            store_label: "📍 選擇分店:",
            lang_label: "🌐 語言 / Lang:",
            step1: "1. 您的烘焙經驗",
            step2: "2. 烘焙品相種類",
            step_tag: "3. 季節與特色限定",
            exp_beginner: "新手初體驗",
            exp_intermediate: "有過幾次經驗",
            exp_advanced: "烘焙達人挑戰",
            type_chiffon: "戚風與海綿蛋糕",
            type_tart: "塔派與乳酪類",
            type_cookie: "餅乾與常溫點心",
            type_bread: "麵包與手作點心",
            tag_all: "全部品項",
            tag_midautumn: "🥮 中秋節限定",
            tag_birthday: "🎂 生日限定",
            tag_store_limited: "🏠 門市限定",
            tag_midautumn_pill: "🥮 中秋限定",
            tag_birthday_pill: "🎂 壽星限定",
            tag_store_pill: "🏠 限店限定",
            reset_btn: "重設所有條件",
            count_prefix: "共找到 ",
            count_suffix: " 款符合的品項",
            no_result: "沒有找到符合條件的品項，請嘗試調整篩選條件！",
            detail_btn: "查看配方與細節",
            features_title: "產品特色",
            storage_title: "保存方式",
            close_btn: "關閉視窗"
        },
        en: {
            title: "DIY Baking Club - Smart Menu Selector",
            subtitle: "Select your preferences to find the perfect DIY bake for today!",
            store_label: "📍 Branch:",
            lang_label: "🌐 Language:",
            step1: "1. Your Baking Experience",
            step2: "2. Baking Category",
            step_tag: "3. Seasonal & Special Events",
            exp_beginner: "Beginner",
            exp_intermediate: "Intermediate",
            exp_advanced: "Master Challenge",
            type_chiffon: "Chiffon & Sponge Cake",
            type_tart: "Tart & Cheesecake",
            type_cookie: "Cookies & Pastries",
            type_bread: "Bread & Handmade Bakes",
            tag_all: "All Items",
            tag_midautumn: "🥮 Mid-Autumn Limited",
            tag_birthday: "🎂 Birthday Exclusive",
            tag_store_limited: "🏠 Store Exclusive",
            tag_midautumn_pill: "🥮 Mid-Autumn",
            tag_birthday_pill: "🎂 Birthday",
            tag_store_pill: "🏠 Exclusive",
            reset_btn: "Reset All Filters",
            count_prefix: "Found ",
            count_suffix: " matching items",
            no_result: "No matching baking items found. Please try adjusting your filters!",
            detail_btn: "View Details",
            features_title: "Product Features",
            storage_title: "Storage Method",
            close_btn: "Close"
        },
        ja: {
            title: "じぶんで作るお菓子教室 - スマートメニュー",
            subtitle: "お好みの条件を選んで、今日ぴったりの手作りスイーツを見つけよう！",
            store_label: "📍 店舗を選択:",
            lang_label: "🌐 語言 / Lang:",
            step1: "1. 製菓経験",
            step2: "2. メニューの種類",
            step_tag: "3. 季節限定・イベントタグ",
            exp_beginner: "初心者",
            exp_intermediate: "経験者",
            exp_advanced: "プロ級チャレンジ",
            type_chiffon: "シフォン・スポンジケーキ",
            type_tart: "タルト・チーズケーキ",
            type_cookie: "クッキー・焼き菓子",
            type_bread: "パン・手作りおやつ",
            tag_all: "すべてのメニュー",
            tag_midautumn: "🥮 中秋節限定",
            tag_birthday: "🎂 お誕生日限定",
            tag_store_limited: "🏠 店舗限定",
            tag_midautumn_pill: "🥮 中秋限定",
            tag_birthday_pill: "🎂 壽星限定",
            tag_store_pill: "🏠 店舗限定",
            reset_btn: "条件をリセット",
            count_prefix: "条件に合う商品： ",
            count_suffix: " 件",
            no_result: "条件に一致するメニューが見つかりませんでした。条件を変更してお試しください！",
            detail_btn: "詳細を見る",
            features_title: "商品の特徴",
            storage_title: "保存方法",
            close_btn: "閉じる"
        },
        th: {
            title: "DIY เบเกอรี่คลับ - ระบบเลือกเมนูอัจฉริยะ",
            subtitle: "เลือกความต้องการของคุณ เพื่อค้นหาขนมแฮนด์เมดที่เหมาะที่สุดสำหรับวันนี้!",
            store_label: "📍 เลือกสาขา:",
            lang_label: "🌐 語言 / Lang:",
            step1: "1. ประสบการณ์การทำเบเกอรี่",
            step2: "2. ประเภทของขนม",
            step_tag: "3. กิจกรรมจำกัดเวลา / แท็กพิเศษ",
            exp_beginner: "มือใหม่เริ่มต้น",
            exp_intermediate: "มีประสบการณ์บ้าง",
            exp_advanced: "ระดับเชฟท้าทาย",
            type_chiffon: "เค้กชิฟฟอน & เค้กสปันจ์",
            type_tart: "ทาร์ต & ชีสเค้ก",
            type_cookie: "คุกกี้ & ขนมอบทั่วไป",
            type_bread: "ขนมปัง & ของว่างแฮนด์เมด",
            tag_all: "เมนูทั้งหมด",
            tag_midautumn: "🥮 ลิมิเต็ดไหว้พระจันทร์",
            tag_birthday: "🎂 สิทธิพิเศษวันเกิด",
            tag_store_limited: "🏠 เฉพาะสาขาที่กำหนด",
            tag_midautumn_pill: "🥮 ไหว้พระจันทร์",
            tag_birthday_pill: "🎂 วันเกิด",
            tag_store_pill: "🏠 เฉพาะสาขา",
            reset_btn: "รีเซ็ตตัวกรองทั้งหมด",
            count_prefix: "พบทั้งหมด ",
            count_suffix: " รายการ",
            no_result: "ไม่พบเมนูที่ตรงกับเงื่อนไข โปรดลองปรับเปลี่ยนตัวกรอง!",
            detail_btn: "ดูรายละเอียด",
            features_title: "คุณสมบัติสินค้า",
            storage_title: "วิธีเก็บรักษา",
            close_btn: "ปิดหน้าต่าง"
        },
        ko: {
            title: "셀프 베이킹 클럽 - 스마트 메뉴 셀렉터",
            subtitle: "원하는 조건을 선택하여 오늘 나에게 딱 맞는 수제 디저트를 찾아보세요!",
            store_label: "📍 지점 선택:",
            lang_label: "🌐 語言 / Lang:",
            step1: "1. 베이킹 경험",
            step2: "2. 베이킹 품목 종류",
            step_tag: "3. 시즌 한정 및 특별 이벤트",
            exp_beginner: "초보자 첫 도전",
            exp_intermediate: "경험자",
            exp_advanced: "베이킹 마스터 도전",
            type_chiffon: "쉬폰 & 스펀지 케이크",
            type_tart: "타르트 & 치즈케이크",
            type_cookie: "쿠키 & 구움과자",
            type_bread: "빵 & 수제 베이킹",
            tag_all: "전체 메뉴",
            tag_midautumn: "🥮 추석 한정",
            tag_birthday: "🎂 생일자 특별 한정",
            tag_store_limited: "🏠 특정 지점 한정",
            tag_midautumn_pill: "🥮 추석한정",
            tag_birthday_pill: "🎂 생일한정",
            tag_store_pill: "🏠 지점한정",
            reset_btn: "모든 조건 초기화",
            count_prefix: "총 ",
            count_suffix: "개 상품 검색됨",
            no_result: "조건에 맞는 메뉴가 없습니다. 필터를 조정해 보세요!",
            detail_btn: "상세보기",
            features_title: "제품 특징",
            storage_title: "보관 방법",
            close_btn: "닫기"
        },
        vi: {
            title: "Câu lạc bộ Tự Làm Bánh - Bộ Lọc Thực Đơn Thông Minh",
            subtitle: "Dễ dàng chọn tiêu chí để tìm ngay món bánh thủ công phù hợp nhất hôm nay!",
            store_label: "📍 Chọn chi nhánh:",
            lang_label: "🌐 語言 / Lang:",
            step1: "1. Kinh nghiệm làm bánh",
            step2: "2. Loại sản phẩm làm bánh",
            step_tag: "3. Sự kiện mùa vụ & Giới hạn",
            exp_beginner: "Người mới bắt đầu",
            exp_intermediate: "Đã có kinh nghiệm",
            exp_advanced: "Thử thách chuyên gia",
            type_chiffon: "Bánh Chiffon & Bông lan",
            type_tart: "Tart & Phô mai",
            type_cookie: "Bánh quy & Bánh nướng",
            type_bread: "Bánh mì & Đồ ngọt thủ công",
            tag_all: "Tất cả món",
            tag_midautumn: "🥮 Giới hạn Trung Thu",
            tag_birthday: "🎂 Dành riêng sinh nhật",
            tag_store_limited: "🏠 Giới hạn chi nhánh",
            tag_midautumn_pill: "🥮 Trung Thu",
            tag_birthday_pill: "🎂 Sinh nhật",
            tag_store_pill: "🏠 Giới hạn",
            reset_btn: "Đặt lại tất cả",
            count_prefix: "Tìm thấy ",
            count_suffix: " sản phẩm phù hợp",
            no_result: "Không tìm thấy sản phẩm phù hợp. Vui lòng thử điều chỉnh lại bộ lọc!",
            detail_btn: "Xem chi tiết",
            features_title: "Đặc điểm sản phẩm",
            storage_title: "Cách bảo quản",
            close_btn: "Đóng"
        }
    };

    // 預設節慶配置
    const defaultSeasonalConfig = {
        tagKey: 'mid_autumn',
        icon: '🥮',
        dateRange: '8/20 - 9/29',
        name: {
            zh: '🥮 中秋節限定',
            en: '🥮 Mid-Autumn Special',
            ja: '🥮 中秋節限定',
            th: '🥮 เทศกาลไหว้พระจันทร์',
            ko: '🥮 추석 한정',
            vi: '🥮 Giới hạn Tết Trung Thu'
        },
        pill: {
            zh: '🥮 中秋限定',
            en: '🥮 Mid-Autumn',
            ja: '🥮 中秋限定',
            th: '🥮 ไหว้พระจันทร์',
            ko: '🥮 추석 한정',
            vi: '🥮 Trung Thu'
        },
        color: '#d97706',
        colorBg: '#fffbeb',
        colorBorder: '#fde68a'
    };

    // 健全性資料清洗，確保品項各欄位安全
    function sanitizeProducts(arr) {
        if (!Array.isArray(arr)) return [];
        arr.forEach(p => {
            if (!p) return;
            if (p.status === undefined) p.status = 'active';
            if (typeof p.name === 'string') p.name = { zh: p.name };
            if (!p.name || typeof p.name !== 'object') p.name = { zh: String(p.name || `品項 #${p.id}`) };
            if (typeof p.subtitle === 'string') p.subtitle = { zh: p.subtitle };
            if (!p.subtitle || typeof p.subtitle !== 'object') p.subtitle = { zh: '' };
            if (typeof p.features === 'string') p.features = { zh: p.features };
            if (!p.features || typeof p.features !== 'object') p.features = { zh: '' };
            if (typeof p.storage === 'string') p.storage = { zh: p.storage };
            if (!p.storage || typeof p.storage !== 'object') p.storage = { zh: '' };
            if (p.price === undefined || p.price === null || isNaN(Number(p.price))) p.price = 0;
            if (!p.price_display) p.price_display = `NT$ ${p.price}`;
        });
        return arr;
    }

    // 判斷商品是否在特定門市提供
    // 判斷商品是否在特定門市提供
    function isItemAvailableAtStore(p, storeId) {
        if (!storeId || storeId === 'all') return true;
        // 優先以自訂 stores 門市 ID 陣列判斷
        if (Array.isArray(p.stores) && p.stores.length > 0) {
            return p.stores.includes(storeId);
        }
        // 向下相容舊 stores_rule
        if (p.stores_rule === 'xinyi_kaohsiung_only') {
            return storeId === 'xinyi' || storeId === 'kaohsiung';
        }
        if (p.stores_rule === 'exclude_xinyi') {
            return storeId !== 'xinyi';
        }
        return true;
    }

    // 取得品項的經驗清單 (相容字串與陣列)
    function getProductExpList(p) {
        if (!p) return ['新手初體驗'];
        if (Array.isArray(p.exp)) {
            return p.exp.length > 0 ? p.exp : ['新手初體驗'];
        }
        if (typeof p.exp === 'string' && p.exp.trim()) {
            const parts = p.exp.split(/[,、/]/).map(s => s.trim()).filter(Boolean);
            const mapped = parts.map(s => s.includes('初學') ? '新手初體驗' : s);
            return mapped.length > 0 ? mapped : ['新手初體驗'];
        }
        return ['新手初體驗'];
    }

    // Vue 3 應用程式
    const app = Vue.createApp({
        data() {
            // 讀取快取或預設品項
            let initialData = [];
            if (window.DEFAULT_PRODUCTS && Array.isArray(window.DEFAULT_PRODUCTS)) {
                initialData = window.DEFAULT_PRODUCTS;
            }
            try {
                const saved = localStorage.getItem(PRODUCTS_DB_KEY);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        initialData = parsed;
                    }
                } else if (initialData.length > 0) {
                    localStorage.setItem(PRODUCTS_DB_KEY, JSON.stringify(initialData));
                }
            } catch (e) {
                console.warn('讀取 localStorage 失敗:', e);
            }

            // 讀取分店
            const savedStore = localStorage.getItem(STORE_STORAGE_KEY) || 'all';

            // 讀取節慶設定
            let initSeasonal = { ...defaultSeasonalConfig };
            try {
                const savedSeasonal = localStorage.getItem(SEASONAL_STORAGE_KEY);
                if (savedSeasonal) {
                    initSeasonal = JSON.parse(savedSeasonal);
                }
            } catch (e) {
                console.warn('讀取節慶設定失敗:', e);
            }

            return {
                currentLang: 'zh',
                availableLanguages: [
                    { code: 'zh', label: '中', title: '繁體中文' },
                    { code: 'en', label: 'EN', title: 'English' },
                    { code: 'ja', label: '日', title: '日本語' },
                    { code: 'ko', label: 'KR', title: '한국어' },
                    { code: 'th', label: 'TH', title: 'ไทย' },
                    { code: 'vi', label: 'VI', title: 'Tiếng Việt' }
                ],
                currentStore: savedStore,
                filters: {
                    experience: null,
                    type: null,
                    tag: null
                },
                products: sanitizeProducts(initialData),
                seasonalConfig: initSeasonal,
                selectedProduct: null,
                isModalOpen: false,
                storeList,
                i18n
            };
        },
        computed: {
            t() {
                return this.i18n[this.currentLang] || this.i18n.zh;
            },
            seasonalTagKey() {
                return this.seasonalConfig?.tagKey || 'mid_autumn';
            },
            seasonalButtonLabel() {
                return this.seasonalConfig?.name?.[this.currentLang] ||
                    this.seasonalConfig?.name?.zh ||
                    this.t.tag_midautumn;
            },
            seasonalButtonStyle() {
                if (!this.seasonalConfig?.color) return {};
                return {
                    '--seasonal-accent': this.seasonalConfig.color
                };
            },
            // 動態經驗選項與品項數量
            experienceOptions() {
                const defs = [
                    { value: '新手初體驗', labelKey: 'exp_beginner' },
                    { value: '有過幾次經驗', labelKey: 'exp_intermediate' },
                    { value: '烘焙達人挑戰', labelKey: 'exp_advanced' }
                ];
                return defs.map(opt => {
                    const count = this.products.filter(p =>
                        p.status !== 'draft' &&
                        isItemAvailableAtStore(p, this.currentStore) &&
                        getProductExpList(p).includes(opt.value) &&
                        (!this.filters.type || p.type === this.filters.type) &&
                        (!this.filters.tag || (this.isSeasonalTag(this.filters.tag) ? this.isSeasonalTag(p.tag) : p.tag === this.filters.tag))
                    ).length;
                    return {
                        value: opt.value,
                        label: this.t[opt.labelKey] || opt.value,
                        count
                    };
                });
            },
            // 動態品相選項與品項數量（若選烘焙達人挑戰，無匹配的類別數量為 0）
            typeOptions() {
                const defs = [
                    { value: '戚風與海綿蛋糕', labelKey: 'type_chiffon' },
                    { value: '塔派與乳酪類', labelKey: 'type_tart' },
                    { value: '餅乾與常溫點心', labelKey: 'type_cookie' },
                    { value: '麵包與手作點心', labelKey: 'type_bread' }
                ];
                return defs.map(opt => {
                    const count = this.products.filter(p =>
                        p.status !== 'draft' &&
                        isItemAvailableAtStore(p, this.currentStore) &&
                        p.type === opt.value &&
                        (!this.filters.experience || getProductExpList(p).includes(this.filters.experience)) &&
                        (!this.filters.tag || (this.isSeasonalTag(this.filters.tag) ? this.isSeasonalTag(p.tag) : p.tag === this.filters.tag))
                    ).length;
                    return {
                        value: opt.value,
                        label: this.t[opt.labelKey] || opt.value,
                        count
                    };
                });
            },
            // 動態活動標籤數量
            seasonalCount() {
                return this.products.filter(p =>
                    p.status !== 'draft' &&
                    isItemAvailableAtStore(p, this.currentStore) &&
                    this.isSeasonalTag(p.tag) &&
                    (!this.filters.experience || getProductExpList(p).includes(this.filters.experience)) &&
                    (!this.filters.type || p.type === this.filters.type)
                ).length;
            },
            birthdayCount() {
                return this.products.filter(p =>
                    p.status !== 'draft' &&
                    isItemAvailableAtStore(p, this.currentStore) &&
                    p.tag === 'birthday' &&
                    (!this.filters.experience || getProductExpList(p).includes(this.filters.experience)) &&
                    (!this.filters.type || p.type === this.filters.type)
                ).length;
            },
            storeLimitedCount() {
                return this.products.filter(p =>
                    p.status !== 'draft' &&
                    isItemAvailableAtStore(p, this.currentStore) &&
                    p.tag === 'store_limited' &&
                    (!this.filters.experience || getProductExpList(p).includes(this.filters.experience)) &&
                    (!this.filters.type || p.type === this.filters.type)
                ).length;
            },
            // 經篩選與置頂排序後的商品列表
            filteredProducts() {
                let list = this.products.filter(p => {
                    if (p.status === 'draft') return false;
                    if (!isItemAvailableAtStore(p, this.currentStore)) return false;
                    if (this.filters.experience && !getProductExpList(p).includes(this.filters.experience)) return false;
                    if (this.filters.type && p.type !== this.filters.type) return false;
                    if (this.filters.tag) {
                        const matchTag = this.isSeasonalTag(this.filters.tag)
                            ? this.isSeasonalTag(p.tag)
                            : p.tag === this.filters.tag;
                        if (!matchTag) return false;
                    }
                    return true;
                });

                // 置頂排序：節慶限定 (1) -> 生日限定 (2) -> 門市限定 (3) -> 一般品項 (4)
                return list.sort((a, b) => {
                    const getPriority = (item) => {
                        if (this.isSeasonalTag(item.tag)) return 1;
                        if (item.tag === 'birthday') return 2;
                        if (item.tag === 'store_limited') return 3;
                        return 4;
                    };
                    const diff = getPriority(a) - getPriority(b);
                    if (diff !== 0) return diff;
                    return a.id - b.id;
                });
            },
            resultCountText() {
                return `${this.t.count_prefix}<strong>${this.filteredProducts.length}</strong>${this.t.count_suffix}`;
            }
        },
        watch: {
            currentLang(newLang) {
                document.title = this.t.title;
            },
            currentStore(newStore) {
                try {
                    localStorage.setItem(STORE_STORAGE_KEY, newStore);
                } catch (e) {
                    console.warn(e);
                }
            },
            // 當篩選選項因連動隱藏時，自動重置被隱藏的選取項目
            experienceOptions: {
                handler(opts) {
                    if (this.filters.experience) {
                        const target = opts.find(o => o.value === this.filters.experience);
                        if (!target || target.count === 0) {
                            this.filters.experience = null;
                        }
                    }
                },
                deep: true
            },
            typeOptions: {
                handler(opts) {
                    if (this.filters.type) {
                        const target = opts.find(o => o.value === this.filters.type);
                        if (!target || target.count === 0) {
                            this.filters.type = null;
                        }
                    }
                },
                deep: true
            },
            seasonalCount(newVal) {
                if (this.filters.tag && this.isSeasonalTag(this.filters.tag) && newVal === 0) {
                    this.filters.tag = null;
                }
            },
            birthdayCount(newVal) {
                if (this.filters.tag === 'birthday' && newVal === 0) {
                    this.filters.tag = null;
                }
            },
            storeLimitedCount(newVal) {
                if (this.filters.tag === 'store_limited' && newVal === 0) {
                    this.filters.tag = null;
                }
            }
        },
        methods: {
            setLanguage(code) {
                this.currentLang = code;
            },
            isSeasonalTag(tag) {
                if (!tag) return false;
                const curKey = this.seasonalConfig?.tagKey || 'mid_autumn';
                return tag === curKey || ['mid_autumn', 'halloween', 'christmas', 'strawberry', 'sakura', 'seasonal'].includes(tag);
            },
            toggleExperience(val) {
                this.filters.experience = (this.filters.experience === val ? null : val);
            },
            toggleType(val) {
                this.filters.type = (this.filters.type === val ? null : val);
            },
            setTag(val) {
                if (!val) {
                    this.filters.tag = null;
                } else if (this.filters.tag === val) {
                    this.filters.tag = null;
                } else {
                    this.filters.tag = val;
                }
            },
            resetFilters() {
                this.filters.experience = null;
                this.filters.type = null;
                this.filters.tag = null;
            },
            getLocalizedName(p) {
                if (!p || !p.name) return '';
                if (typeof p.name === 'string') return p.name;
                const val = p.name[this.currentLang];
                if (val && typeof val === 'string' && val.trim() !== '') return val;
                // 若外語未設定名稱，退回中文名稱避免商品卡片無標題
                return p.name.zh || Object.values(p.name)[0] || '';
            },
            getLocalizedSub(p) {
                if (!p || !p.subtitle) return '';
                if (typeof p.subtitle === 'string') return (this.currentLang === 'zh' ? p.subtitle : '');
                if (p.subtitle[this.currentLang] !== undefined) {
                    return p.subtitle[this.currentLang] || '';
                }
                return this.currentLang === 'zh' ? (p.subtitle.zh || '') : '';
            },
            getLocalizedFeatures(p) {
                if (!p || !p.features) return '';
                if (typeof p.features === 'string') return (this.currentLang === 'zh' ? p.features : '');
                // 若英語等外語留空，絕不抓取中文內容！
                if (p.features[this.currentLang] !== undefined) {
                    return p.features[this.currentLang] || '';
                }
                return this.currentLang === 'zh' ? (p.features.zh || '') : '';
            },
            getLocalizedStorage(p) {
                if (!p || !p.storage) return '';
                if (typeof p.storage === 'string') return (this.currentLang === 'zh' ? p.storage : '');
                // 若英語等外語留空，絕不抓取中文內容！
                if (p.storage[this.currentLang] !== undefined) {
                    return p.storage[this.currentLang] || '';
                }
                return this.currentLang === 'zh' ? (p.storage.zh || '') : '';
            },
            getLocalizedText(obj) {
                if (!obj) return '';
                if (typeof obj === 'string') return (this.currentLang === 'zh' ? obj : '');
                if (obj[this.currentLang] !== undefined) {
                    return obj[this.currentLang] || '';
                }
                return this.currentLang === 'zh' ? (obj.zh || '') : '';
            },
            translateSingleExp(exp) {
                if (this.currentLang === 'zh') return exp;
                if (exp === '新手初體驗' || exp === '初學') return this.t.exp_beginner;
                if (exp === '有過幾次經驗' || exp === '有幾次經驗') return this.t.exp_intermediate;
                if (exp === '烘焙達人挑戰') return this.t.exp_advanced;
                return exp;
            },
            translateExp(exp) {
                if (!exp) return '';
                if (Array.isArray(exp)) {
                    return exp.map(e => this.translateSingleExp(e)).join(' / ');
                }
                if (typeof exp === 'string' && exp.includes(',')) {
                    return exp.split(',').map(e => this.translateSingleExp(e.trim())).join(' / ');
                }
                return this.translateSingleExp(exp);
            },
            getProductExpList(p) {
                return getProductExpList(p);
            },
            translateType(type) {
                if (this.currentLang === 'zh') return type;
                if (type === '戚風與海綿蛋糕') return this.t.type_chiffon;
                if (type === '塔派與乳酪類') return this.t.type_tart;
                if (type === '餅乾與常溫點心') return this.t.type_cookie;
                if (type === '麵包與手作點心') return this.t.type_bread;
                return type;
            },
            getTagPill(tag) {
                if (!tag) return null;
                if (this.isSeasonalTag(tag)) {
                    const pillTxt = this.seasonalConfig?.pill?.[this.currentLang] ||
                        this.seasonalConfig?.pill?.zh ||
                        this.t.tag_midautumn_pill || '限定';
                    const style = this.seasonalConfig?.color ? {
                        background: this.seasonalConfig.colorBg,
                        color: this.seasonalConfig.color,
                        border: `1px solid ${this.seasonalConfig.colorBorder}`
                    } : {};
                    return {
                        text: pillTxt,
                        className: 'card-tag-pill pill-midautumn',
                        style
                    };
                }
                if (tag === 'birthday') {
                    return {
                        text: this.t.tag_birthday_pill,
                        className: 'card-tag-pill pill-birthday',
                        style: {}
                    };
                }
                if (tag === 'store_limited') {
                    return {
                        text: this.t.tag_store_pill,
                        className: 'card-tag-pill pill-store',
                        style: {}
                    };
                }
                return null;
            },
            getTagBadge(tag) {
                if (!tag) return null;
                if (this.isSeasonalTag(tag)) {
                    const nameTxt = this.seasonalConfig?.name?.[this.currentLang] ||
                        this.seasonalConfig?.name?.zh ||
                        this.t.tag_midautumn;
                    const style = this.seasonalConfig?.color ? {
                        background: this.seasonalConfig.colorBg,
                        color: this.seasonalConfig.color,
                        borderColor: this.seasonalConfig.colorBorder,
                        fontWeight: '700'
                    } : {};
                    return {
                        text: nameTxt,
                        className: 'badge badge-midautumn',
                        style
                    };
                }
                if (tag === 'birthday') {
                    return {
                        text: this.t.tag_birthday,
                        className: 'badge badge-birthday',
                        style: {}
                    };
                }
                if (tag === 'store_limited') {
                    return {
                        text: this.t.tag_store_limited,
                        className: 'badge badge-store',
                        style: {}
                    };
                }
                return null;
            },
            // 需要注意的事項：粗體、調大2px、紅字高亮處理
            highlightNotice(text) {
                if (!text || typeof text !== 'string') return '';
                let t = text
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;');
                // 數字與時間單位（小時、天、週、分等跨語言正則匹配）：ex: 製作時間："2" 小時, 需"2"小時內冷藏, 請於"3"天內食用完
                t = t.replace(/(\d+(?:\.\d+)?)(?=\s*(?:小時|小时|天|星期|週|周|日|分|分鐘|分钟|hours?|days?|weeks?|mins?|minutes?|시간|일|주일|분|時間|日間|週間|ชั่วโมง|วัน|สัปดาห์|นาที|giờ|ngày|tuần|phút))/gi, '<span class="notice-highlight">$1</span>');
                // 日期區間：ex: 8/20 - 9/29
                t = t.replace(/(\d{1,2}\/\d{1,2}\s*[-–]\s*\d{1,2}\/\d{1,2})/g, '<span class="notice-highlight">$1</span>');
                return t;
            },
            openModal(product) {
                this.selectedProduct = product;
                this.isModalOpen = true;
                document.body.style.overflow = 'hidden';
            },
            closeModal() {
                this.isModalOpen = false;
                this.selectedProduct = null;
                document.body.style.overflow = '';
            },
            onKeydown(e) {
                if (e.key === 'Escape' && this.isModalOpen) {
                    this.closeModal();
                }
            },
            onStorage(e) {
                if (e.key === PRODUCTS_DB_KEY) {
                    try {
                        if (e.newValue) {
                            this.products = sanitizeProducts(JSON.parse(e.newValue));
                            if (this.selectedProduct) {
                                const updated = this.products.find(p => String(p.id) === String(this.selectedProduct.id));
                                if (updated) this.selectedProduct = updated;
                            }
                        }
                    } catch (err) {
                        console.error('即時同步品項失敗:', err);
                    }
                }
                if (e.key === SEASONAL_STORAGE_KEY) {
                    try {
                        if (e.newValue) {
                            this.seasonalConfig = JSON.parse(e.newValue);
                        }
                    } catch (err) {
                        console.error('即時同步節慶設定失敗:', err);
                    }
                }
            }
        },
        mounted() {
            document.title = this.t.title;
            window.addEventListener('keydown', this.onKeydown);
            window.addEventListener('storage', this.onStorage);
        },
        beforeUnmount() {
            window.removeEventListener('keydown', this.onKeydown);
            window.removeEventListener('storage', this.onStorage);
        }
    });

    app.mount('#app');
})();
