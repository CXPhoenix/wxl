## Context

BrowserPanel 目前透過 `dispatch()` 發送 HTTP request，但建立 `Request` 物件時僅帶有極少的 header（部分情況連 `Content-Type` 都沒有）。由於 `useTrafficLog.wrap()` 直接讀取 `request.headers.entries()`，Network Traffic 面板記錄的 header 自然也不完整。

此外，runtime（Flask/PHP ASGI bridge）實際接收到的 request 同樣缺乏標準瀏覽器 header，可能導致依賴 `User-Agent`、`Referer`、`Origin` 等 header 的挑戰設計無法正常運作。

受影響檔案：
- `.vitepress/theme/components/BrowserPanel.vue` — 所有 `new Request()` 呼叫點

## Goals / Non-Goals

**Goals:**

- 讓 BrowserPanel 發出的所有 request 攜帶完整的模擬瀏覽器 header
- 依請求情境（網址列導航、連結點擊、form 提交）動態組合正確的 header 集合
- 集中管理 header 邏輯，避免各呼叫點重複

**Non-Goals:**

- 不修改 `useTrafficLog.ts` — header 完整後自然解決
- 不修改 `RepeatPanel.vue` — 使用者手動編輯 raw request，已有完整 header
- 不模擬 Cookie（Cookie 由 runtime 的 Set-Cookie 控制，屬於另一層）
- 不模擬 `If-None-Match`、`If-Modified-Since` 等 cache-related header

## Decisions

### buildBrowserRequest helper 集中管理 header

在 `BrowserPanel.vue` 的 `<script setup>` 中定義一個 `buildBrowserRequest(url, options, context)` 函式，取代所有直接的 `new Request()` 呼叫。

`context` 參數描述請求來源：
```ts
type RequestContext =
  | { type: 'navigation' }          // 網址列 GET
  | { type: 'link'; referer: string }   // <a> 點擊
  | { type: 'form'; referer: string; method: string }  // form 提交
```

**理由**：BrowserPanel 有四個 `new Request()` 呼叫點，若各自加 header 會重複且難以維護。集中到一個 helper 確保一致性，也方便日後調整。

**替代方案**：在 `useTrafficLog.wrap()` 補 header — 但這樣 runtime 收到的 request 仍然缺少 header，與學習目的不符。

### 靜態 header 集合（所有請求共用）

```
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36
Accept-Language: en-US,en;q=0.9
Accept-Encoding: gzip, deflate, br
Connection: keep-alive
Sec-Ch-Ua: "Chromium";v="120", "Google Chrome";v="120", "Not-A.Brand";v="24"
Sec-Ch-Ua-Mobile: ?0
Sec-Ch-Ua-Platform: "macOS"
Upgrade-Insecure-Requests: 1
```

**理由**：固定模擬 Chrome 120 on macOS，與 RepeatPanel 預設值一致，讓兩個面板的請求看起來來自同一個「瀏覽器」。

### 動態 header 依情境加入

| 情境 | 額外 header |
|------|-------------|
| 所有請求 | `Host: challenge-<slug>.localhost`、`Accept: text/html,...` |
| 網址列 GET | `Sec-Fetch-Dest: document`、`Sec-Fetch-Mode: navigate`、`Sec-Fetch-Site: none`、`Sec-Fetch-User: ?1` |
| 連結點擊 GET | `Referer: <currentUrl>`、`Sec-Fetch-Dest: document`、`Sec-Fetch-Mode: navigate`、`Sec-Fetch-Site: same-origin` |
| Form GET | `Referer: <formPageUrl>`、`Sec-Fetch-Dest: document`、`Sec-Fetch-Mode: navigate`、`Sec-Fetch-Site: same-origin`、`Sec-Fetch-User: ?1` |
| Form POST（urlencoded）| 上述 + `Origin: http://challenge-<slug>.localhost`、`Content-Type: application/x-www-form-urlencoded`、`Content-Length: <n>` |
| Form POST（multipart）| 上述（`Content-Type` 由 `fetch` 自動帶 boundary，不手動設） |

**理由**：Sec-Fetch-* header 是現代 Chrome 的標準行為，學習者若嘗試在靶機端根據這些 header 做判斷（例如 CSRF 防護）應能得到正確回應。

## Risks / Trade-offs

- [Content-Length 計算] urlencoded body 需手動計算 byte length（`TextEncoder`）→ 影響不大，urlencoded body 通常是 ASCII
- [multipart Content-Type] multipart 的 boundary 由瀏覽器自動產生，不手動設定 Content-Type → 與真實瀏覽器一致，不是問題
- [Host header 與 Request 建構] 部分瀏覽器環境下 `Request` 物件會忽略 `Host` header（視為 forbidden header）→ runtime 端已透過 URL hostname 解析 host，影響僅在 Network Panel 的顯示
