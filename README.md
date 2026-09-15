# 🍰 自己做烘焙聚樂部 - 智能菜單篩選系統 (DIY Baking Club Smart Menu)

> 專為「自己做烘焙聚樂部」打造之全方位智慧菜單篩選與 AI 多語系後台管理系統。  
> 採用純前端架構（Vue 3 + Vanilla CSS + SheetJS），具備 100% 離線運行能力與 GitHub Pages 一鍵靜態託管部署。

---

## 🌟 核心特色

### 1. 🌐 六國語系即時切換 (Multilingual Support)
- 支援 **繁體中文 (ZH)**、**English (EN)**、**日本語 (JA)**、**한국어 (KR)**、**ไทย (TH)**、**Tiếng Việt (VI)**。
- 頂部單鍵藥丸按鈕組（Pill Buttons），一秒快速切換，全站文案、品項名稱、經驗分類、特色說明與保存方式同步更新。

### 2. 📱 全裝置與 iPad 完美響應式排版 (iPad & Mobile Friendly)
- 針對 iPad 768px ~ 1024px（直向 2 欄、橫向 3 欄）進行專業媒體查詢設計。
- 彈窗高度自適應與 iOS 觸控滑動優化，**保證零破版、零水平溢出滾動條**。

### 3. 👨‍🍳 經驗與種類多維度動態篩選
- 支援「新手初體驗」、「有過幾次經驗」、「烘焙達人挑戰」單選/複選相容。
- 結合戚風海綿蛋糕、塔派乳酪、常溫餅乾、手作麵包分類及節慶/門市限定即時動態計數。

### 4. 📊 智慧後台管理系統 (`admin.html`)
- **Excel 雙向匯出/匯入**：支援一鍵下載與上傳 `.xlsx` 試算表（自動對應 13 個中文關鍵欄位）。
- **AI 一鍵多語系翻譯**：整合 Google Gemini API，填寫中文品項或上傳 Excel 後自動批次生成英、日、泰、韓、越五國語言，無須手動翻譯。
- **北中南 11 間門市規則勾選**：智慧識別「全門市供應」、「限特定門市」或「全門市(除某店)」。

---

## 📁 檔案結構

```
├── index.html                  # 前台主頁（GitHub Pages 預設入口）
├── homepage.html               # 前台主頁備援
├── menu_selector_final.html    # 相容性歷史入口
├── menu_selector.css           # 現代化響應式樣式表（含 iPad 與行動端適配）
├── menu_app.js                 # Vue 3 前端核心邏輯與多語系字典
├── products_data.js            # 預設商品資料庫（支援 44 款品項）
├── products_multilingual.json  # 完整多語系商品資料庫 JSON
├── vue.global.prod.js          # Vue 3 核心庫（離線支援）
├── xlsx.full.min.js            # SheetJS Excel 解析庫（離線支援）
└── admin.html                  # 智慧後台上架管理系統
```

---

## 🚀 部署至 GitHub Pages 教學

1. 在 GitHub 建立新儲存庫（Repository），例如 `diy-baking-menu`。
2. 將此資料夾推送至遠端儲存庫：
   ```bash
   git remote add origin https://github.com/<您的GitHub帳號>/<儲存庫名稱>.git
   git branch -M main
   git push -u origin main
   ```
3. 開啟儲存庫頁面 ➔ 進入 **Settings** ➔ 側邊欄點擊 **Pages**。
4. 在 **Build and deployment** 下方的 **Source** 選擇 **Deploy from a branch**：
   - Branch: `main` / `root`
   - 點擊 **Save**。
5. 稍等約 1~2 分鐘，即可透過專屬網址瀏覽成果：
   `https://<您的GitHub帳號>.github.io/<儲存庫名稱>/`
