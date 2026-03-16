## Context

ChallengeLayout.vue 在 `onMounted` 時初始化 WASM 虛擬 FS，再根據 `backend` 啟動對應 runtime。目前有兩個獨立問題：

1. **Flask 解密失敗**：`wasm_fs_init` 的 Rust 實作在 store 非空時直接 return，不重新載入資料。由於 ES module 快取，WASM 模組在同一 SPA session 中是單一實體，跨挑戰頁面切換後 store 仍保有前一個挑戰的加密 blob。使用新挑戰的 key 解前一個挑戰的 blob 必定失敗。

2. **PHP loader 未接入**：ChallengeLayout 的 PHP 分支目前用一個 stub callback（直接 throw）。`php-wasm`（v0.0.8）已安裝，但其 `PhpWeb` API 與 `PhpInstance` 介面不相容，需要寫 adapter：
   - `PhpBase.run(code)` 回傳 `Promise<number>`（exit code），output 透過 DOM 事件（`output`）非同步發送
   - `writeFile` 需要透過 Emscripten FS (`php.FS.writeFile`) 操作
   - `header()` 呼叫無法從 WASM 側捕捉（已知限制）

## Goals / Non-Goals

**Goals:**
- 修復 Flask 挑戰跨頁面切換後的解密錯誤
- 讓 PHP 挑戰可以正常執行 PHP 程式碼並回傳 output
- 維持 `PhpRuntime` 的公開 API 不變

**Non-Goals:**
- 不實作 PHP `header()` 捕捉（php-wasm 無此能力，回傳空陣列）
- 不修改 WASM Rust 原始碼
- 不支援 PHP session / cookie 持久化

## Decisions

### 使用 wasm_fs_reset 取代 wasm_fs_init

`wasm_fs_reset` 已存在於 WASM API，行為是先 `delete_all` 再重新填入。每次掛載挑戰頁面時必須強制重置，確保 store 內容與當前挑戰的 frontmatter 一致。

替代方案：在 `onUnmounted` 時呼叫 reset 清除 store，缺點是若用戶重新整理或直接導覽，mount 時 store 仍可能有舊資料。主動在 mount 時 reset 更可靠。

### PhpWeb adapter 放在 ChallengeLayout.vue，不改動 usePhpRuntime.ts

`PhpRuntime` 接受 `LoadPhpFn = () => Promise<PhpInstance>` callback，設計即為 DI。adapter 邏輯屬於「如何載入 php-wasm」，是平台層責任，放在 ChallengeLayout 比放在 composable 更合理。`usePhpRuntime.ts` 的公開 API 保持不變。

### output 捕捉策略：事前掛 listener，事後移除

`php-wasm` 的 `EventBuffer` 在每個 `\n` 後同步 flush（呼叫 `dispatchEvent('output', ...)`）。在 `run()` 前掛上 `output` listener，`run()` resolve 後移除，可完整捕捉一次 PHP 執行的所有 stdout。

### headers 暫時回傳空陣列

`PhpBase` 不提供捕捉 PHP `header()` 的機制。`PhpRuntime.handleRequest` 目前對空 headers 陣列能正常運作（loop 不執行）。後續若需要 header 支援，可改用 PHP 端包裝層（`ob_get_clean` + 解析 HTTP header 格式）。

### 測試 mock 需同步更新

實作過程中發現 5 個 pre-existing 測試失敗，根因為 mock 與實作不同步：

1. **`virtual-fs.ts` mock 缺少 `wasm_fs_reset`**：ChallengeLayout 改用 `wasm_fs_reset` 後，若測試 import ChallengeLayout 會報錯。需補 no-op export。

2. **`usePythonRuntime-packages` mock 缺少 `loadPackage`**：`PythonRuntime._init()` 在安裝 micropip 前先呼叫 `this.pyodide.loadPackage('micropip')`，但 mock 物件沒有此方法。需補 `loadPackage: vi.fn().mockResolvedValue(undefined)`。

3. **`usePythonRuntime-request` 與 `flask-sqli` mock 使用舊 ASGI API**：`handleRequest()` 改用 `globals.get('_asgi_bridge')` 取得橋接函式（回傳 JSON 字串），但 mock 仍對 `globals.get('app')` 提供舊式 ASGI callable。需更新 mock 對 `'_asgi_bridge'` 回傳符合 `(method, path, qs, headers, body) => Promise<JSON string>` 簽名的函式。

這些測試 mock 屬於**測試程式碼層的修改**，不涉及生產邏輯，只需更新 mock 使其與實作保持一致。

## Risks / Trade-offs

- **[風險] php-wasm 首次載入時間長**：`PhpWeb` 需要載入 ~10 MB 的 WASM binary。緩解：已有 loading 狀態 UI，用戶在 runtime ready 前無法送出請求。
- **[限制] PHP header() 無法捕捉**：目前所有 PHP 挑戰回應都會是 `Content-Type: text/html`（PhpRuntime 的 fallback）。對現有 CTF 題目影響有限，未來可改進。
- **[風險] wasm_fs_reset 的 import**：ChallengeLayout 目前只 import `wasm_fs_init` 和 `wasm_fs_read`，需要補上 `wasm_fs_reset`。若 WASM 的 TypeScript bindings 未 export 此函式，需確認 `.vitepress/wasm/virtual-fs/virtual_fs.d.ts`。
