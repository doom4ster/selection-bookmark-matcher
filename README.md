<div align="center">

# Selection Bookmark Matcher

書籤即時匹配：選取任何網頁文字，立即顯示與之「精準或部分相符」的瀏覽器書籤。<br/>
（Firefox 為主，保留 Manifest V3 與 V2 雙構建，可擴展至 Chrome）

<!-- Badges (可自行替換) -->
<img alt="status" src="https://img.shields.io/badge/status-experimental-orange" />
<img alt="license" src="https://img.shields.io/badge/license-TBD-lightgrey" />

</div>

## ✨ 功能特色
* 選取 ≥ 指定字數（預設 5）即自動發送查詢，不需點按按鈕
* 書籤標題比對：
  * 精準相符 (Exact)
  * 部分包含 (Partial)
* 顯示前 8 筆並標示 `[=]` / `[~]`
* 自動位置面板（跟隨選取區域）
* 自動隱藏（延遲 2.5 秒）
* 去除多餘空白、大小寫不敏感
* MV3 (service worker) 與 MV2 (background page) 雙模式建置

## 📸 預計截圖 (尚未放)
> 可放置：選取後浮出面板、精準/部分結果示意。

## 🏗 專案結構
```
background.js        # 背景腳本 (MV3 service worker 或 MV2 background script)
contentScript.js     # 監聽使用者選取並傳訊息到背景
panel.css            # 漂浮結果面板樣式 (web accessible)
manifest.mv3.json    # 單一來源 (source of truth) 的 MV3 Manifest
scripts/build.js     # MV3 -> MV2 轉換與輸出工具
dist/                # build 輸出 (mv2 / mv3)
```

## 🔧 安裝 / 測試 (Firefox)
### A. 使用 MV2（Firefox 穩定版）
1. `npm run build:mv2`
2. 到 `about:debugging#/runtime/this-firefox`
3. Load Temporary Add-on → 選 `dist/mv2/manifest.json`

### B. 使用 MV3（Firefox Nightly）
1. 使用 Nightly 版本
2. `about:config` 設定：
	```
	extensions.manifestV3.enabled = true
	extensions.backgroundServiceWorker.enabled = true
	```
3. `npm run build:mv3`
4. 載入 `dist/mv3/manifest.json`

### C. Chrome (預備)
* `npm run build:mv3`
* 在 `chrome://extensions` 啟用開發者模式 → Load unpacked → 指向 `dist/mv3`
* （目前程式碼不依賴 Chrome 專屬 API，理論上可直接使用）

## ▶️ 使用方式
1. 安裝附加元件
2. 在任意頁面拖曳 / 鍵盤選取文字（≥5 字）
3. 右下（或選取附近）出現結果面板：
	* `[=]` 精準相符
	* `[~]` 部分相符
4. 點擊標題於新分頁開啟

## 🧠 技術重點
| 項目 | 說明 |
|------|------|
| 比對策略 | 透過 `browser.bookmarks.search({ query })` 取得粗略集合，再做標題正規化後篩選分類 |
| 正規化 | 去除多空白、trim、toLowerCase |
| 排序 | 精準優先，其次部份；同組內以 `localeCompare (zh-Hant)` |
| 通訊 | `contentScript` → `runtime.sendMessage` → `background` 回傳結果 |
| 面板 | 動態插入 `<link rel="stylesheet">` 或 fallback inline style |

## 🛠 建置指令
```bash
npm run build        # 預設 mv3 -> dist/mv3
npm run build:mv3    # 明確輸出 MV3
npm run build:mv2    # 輸出 MV2
```

## 🔄 MV3 → MV2 轉換規則
`scripts/build.js` 自動完成：
| MV3 | MV2 | 說明 |
|-----|-----|------|
| manifest_version=3 | 2 | 降版 |
| background.service_worker | background.scripts + persistent | 轉為傳統背景頁 |
| action | browser_action | MV2 命名 |
| web_accessible_resources (物件陣列) | 扁平陣列 | MV2 格式差異 |
| permissions 移除 scripting | (保留其他) | 未使用 `chrome.scripting` |
| 移除 host_permissions | 合併在 MV2 `permissions` 運作 |

## 🧪 後續可擴充（Roadmap）
- [ ] 加入 `web-ext` 自動重新載入 & 打包
- [ ] 書籤 URL 也做部分 / 網域權重評分
- [ ] 選單（右鍵）觸發手動搜尋
- [ ] 替換設定：最小字數 / 顯示筆數 / 面板位置
- [ ] TypeScript + ESLint + Prettier
- [ ] 單元測試（抽出 normalize / ranking）
- [ ] 發佈到 AMO（MV2 先行）

## 🤝 貢獻
歡迎提出 Issue / PR：
1. Fork & 建立分支
2. 提交變更（請描述用途）
3. 發 PR（標註類別：feat / fix / chore / docs）

## 📦 釋出建議流程（手動）
```bash
# MV2 套件 zip (Firefox AMO 目前仍接受 MV2)
npm run build:mv2
cd dist/mv2 && zip -r ../../selection-bookmark-matcher-mv2.zip . && cd -

# MV3 套件 zip (預備 / Chrome 用)
npm run build:mv3
cd dist/mv3 && zip -r ../../selection-bookmark-matcher-mv3.zip . && cd -
```
（可日後改成 `npm run release`）

## ⚖️ 授權 (License)
尚未指定。建議：MIT / Apache-2.0。若未指定即視為保留所有權利。

## ❓ 常見問題 (FAQ)
**Q:** 為什麼 MV3 在 Firefox 無法載入？  
**A:** 需 Nightly 且開啟 flags：`extensions.manifestV3.enabled` 與 `extensions.backgroundServiceWorker.enabled`。

**Q:** 面板擋住內容？  
**A:** 可後續加入偏移設定（尚未實作）。

**Q:** 可以搜尋書籤描述或 URL？  
**A:** 目前僅比對標題（取得列表後再做標題層級過濾）。

## 🗂 相關連結 (延伸參考)
- MDN WebExtensions Bookmarks API: https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/bookmarks
- MDN MV2 vs MV3 差異說明

---
歡迎試用、回饋與改進 🙌

