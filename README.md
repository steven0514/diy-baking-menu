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
├── admin.html                  # 智慧後台上架管理系統
│
├── interpreter.html            # 隨身口譯（店員手機用，含 RAG 問答與寫回）
├── knowledge_base.js           # 口譯知識庫：門市清單、語言清單、預設問答
├── google_apps_script.gs       # 寫回 Google Sheets 的端點，貼進試算表的 Apps Script
├── presentation_mobile_ai.html # 手機 AI 服務動線簡報
└── AI_手機演示腳本.md           # 現場演示用的提示詞與流程小抄
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

### 部署後的各頁網址

| 用途 | 網址 | 給誰用 |
|---|---|---|
| 多語系菜單 | `/` | 顧客 |
| 隨身口譯 | `/interpreter.html` | 店員手機 |
| 後台上架管理 | `/admin.html` | 店長 |
| 簡報 | `/presentation_mobile_ai.html` | 報告用 |

### 為什麼一定要部署，不能只用本機檔案

- **麥克風**：瀏覽器只在 https 或 `http://localhost` 下允許錄音。用 `file://` 或區網 IP（如 `http://192.168.1.5:8000`）開啟時，語音輸入一定失效。GitHub Pages 是 https，所以可用。
- **QR 碼**：門市現場要讓店員掃碼即開，需要一個公開網址。
- **Claude Artifact 連結不適用**：Artifact 的安全政策會擋掉所有對外呼叫，Gemini 與 Google Sheets 都連不到，只能跑離線示範。

### 隨身口譯首次設定（部署完成後在手機上做一次）

1. 開 `/interpreter.html` → 右上角 ⚙️
2. 貼上 Gemini API Key（到 [Google AI Studio](https://aistudio.google.com/apikey) 免費申請）
3. 按「🔄 偵測可用模型」
4. 貼上知識庫試算表 ID，試算表需設為「知道連結的任何人可以檢視」
5. 依 `google_apps_script.gs` 開頭的步驟部署 Apps Script，把 `/exec` 網址貼進來，按「🔌 測試這個網址」
6. 按「🩺 連線診斷」與「🎤 語音測試」各跑一次確認

金鑰只存在該支手機的瀏覽器裡，不會上傳，也不會進版本庫。
