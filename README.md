# Selection Bookmark Matcher

Firefox / (未來可擴展到 Chrome) 書籤比對選取文字的擴充功能。

## 雙 manifest 構建

原始開發檔案：`manifest.mv3.json` (作為單一來源)。

使用 build 腳本輸出：

- MV3 版本：`dist/mv3/manifest.json`
- MV2 版本：`dist/mv2/manifest.json`

### 為什麼要 MV2?
Firefox 穩定版目前對 MV3 `background.service_worker` 尚未完全開放；若需要在穩定版測試可用 MV2。Nightly + flags 則可載入 MV3。

### 建置指令

```bash
npm run build:mv3   # 輸出 MV3 (dist/mv3)
npm run build:mv2   # 輸出 MV2 (dist/mv2)
npm run build       # 預設 mv3
```

### 在 Firefox 載入
1. 進入 `about:debugging#/runtime/this-firefox`
2. 選擇：Load Temporary Add-on
3. 指向：`dist/mv2/manifest.json` 或 `dist/mv3/manifest.json`

### 啟用 MV3 (Nightly)
在 `about:config` 設定：
```
extensions.manifestV3.enabled = true
extensions.backgroundServiceWorker.enabled = true
```
重新啟動再載入 `dist/mv3/manifest.json`。

## 結構轉換邏輯 (MV3 -> MV2)
腳本 `scripts/build.js` 會：
- `manifest_version: 3 -> 2`
- `background.service_worker` -> `background.scripts + persistent: true`
- `action` -> `browser_action`
- `web_accessible_resources` 物件陣列 -> 扁平陣列
- 移除 `scripting` 權限與 `host_permissions`

## 後續可考慮
- 加入 ESLint / TypeScript 改寫
- 在 MV3 下使用 ES Module（待 Firefox 完整支援後）
- 加入測試（例如使用 `web-ext` 做 lint / run）

## 授權
自訂/未指定（可自行補充）。
