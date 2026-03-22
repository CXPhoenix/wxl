## 1. buildBrowserRequest helper

- [ ] 1.1 在 `BrowserPanel.vue` 中定義 `buildBrowserRequest(url, options, context)` helper，實作 BrowserPanel sends realistic browser-like HTTP requests 所需的靜態 header 集合（靜態 header 集合（所有請求共用）：User-Agent、Accept-Language、Accept-Encoding、Connection、Sec-Ch-Ua、Sec-Ch-Ua-Mobile、Sec-Ch-Ua-Platform、Upgrade-Insecure-Requests）— 對應 design「buildBrowserRequest helper 集中管理 header」
- [ ] 1.2 實作動態 header 邏輯：依 `context.type`（navigation / link / form）加入 Host、Accept、Referer、Origin、Sec-Fetch-Dest、Sec-Fetch-Mode、Sec-Fetch-Site、Sec-Fetch-User、Content-Length — 對應 design「動態 header 依情境加入」

## 2. BrowserPanel 呼叫點替換

- [ ] 2.1 將網址列 GET（`new Request(url.value, { method: 'GET' })`）改用 `buildBrowserRequest`，context 為 `{ type: 'navigation' }`，滿足 Scenario「Address bar navigation includes full browser headers」
- [ ] 2.2 將 iframe 連結點擊 GET 改用 `buildBrowserRequest`，context 為 `{ type: 'link', referer: currentUrl }`，滿足 Scenario「Link click includes Referer and same-origin Sec-Fetch headers」
- [ ] 2.3 將 form GET 提交改用 `buildBrowserRequest`，context 為 `{ type: 'form', referer: formPageUrl, method: 'GET' }`，滿足 Scenario「Form GET submission includes Referer and navigation headers」
- [ ] 2.4 將 form POST（urlencoded）提交改用 `buildBrowserRequest`，context 為 `{ type: 'form', referer: formPageUrl, method: 'POST' }`，自動加入 Origin、Content-Length，滿足 Scenario「Form POST submission includes Origin, Referer, and Content-Length」
- [ ] 2.5 Form POST multipart 路徑不手動設 Content-Type（由 fetch 自動帶 boundary），改用 `buildBrowserRequest` 但跳過 Content-Type 注入

## 3. 測試

- [ ] 3.1 為 `buildBrowserRequest` 撰寫單元測試，驗證各 context 下的 header 集合（navigation、link、form GET、form POST urlencoded）
- [ ] 3.2 更新 `BrowserPanel.test.ts`，驗證 `dispatch` 被呼叫時 request header 包含完整的模擬瀏覽器 header，滿足 Scenario「NetworkPanel records complete headers from BrowserPanel requests」中 `trackedDispatch` 記錄完整 header 的行為
