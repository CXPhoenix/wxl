# Usage Guide

本文件涵蓋三種使用角色的完整操作指南。

## 目錄

- [挑戰者操作指南](#挑戰者操作指南)
- [出題者指南](#出題者指南)
- [部署者指南](#部署者指南)

---

## 挑戰者操作指南

### 進入挑戰

1. 前往挑戰列表頁面（`/challenges/`），選擇想練習的挑戰
2. 挑戰頁面左側為題目描述，右側為互動工具面板

### Browser 面板

模擬瀏覽器的網頁互動。在 URL 列輸入路徑後按下 Go，即可觀察網頁回應。支援 GET / POST 表單提交，模擬真實瀏覽器行為（包含模擬的 User-Agent、Sec-Fetch-* 等 headers）。

### Network 面板

即時顯示所有 HTTP 請求與回應記錄，類似瀏覽器開發者工具的 Network tab。每筆記錄可展開查看完整 request / response headers 與 body。支援「Send to Repeater」功能，將選定的請求轉送至 Repeater 面板進行修改與重送。

### Repeater 面板

手動編輯 HTTP 請求的 raw text（method、path、headers、body），點擊 Send 即可發送並查看回應。適合測試注入攻擊 payload。

- **儲存快照**：點擊「+ Save」開啟命名對話框，輸入名稱後按 Save 儲存當前請求內容
- **載入快照**：在右側 Saved Snapshots 列表點擊任一快照即可還原
- **刪除快照**：hover 快照名稱後點擊 × 按鈕

### Flag 提交

在左下方的 Flag 輸入框中貼上找到的 flag（格式：`CTF{...}`），按下 Submit Flag 進行驗證。

### 攻擊紀錄匯出

Flag 正確後，成功訊息旁會出現「下載攻擊紀錄」按鈕。點擊後將下載一份 JSON 檔案，包含：

- 挑戰開始時間
- 所有 HTTP 請求記錄（含來源標記：browser / repeater）
- Flag 嘗試記錄
- 挑戰完成時間

此檔案可作為 Writeup 素材或學習記錄。攻擊 session 會在 IndexedDB 中持久化，跨頁面重新整理後自動恢復（直到 flag 正確為止）。

---

## 出題者指南

### Challenge Frontmatter 格式

每個挑戰是一個 Markdown 檔案（位於 `docs/challenge/` 下），透過 YAML frontmatter 宣告設定：

```yaml
---
layout: challenge
title: SQL Injection Demo
backend: flask           # flask | fastapi | php
app: ./app.py            # 後端應用程式入口
flag_verifier: <hash>    # 由 keygen 自動產生
fs:
  /flag.txt: ./flag.txt  # 虛擬檔案系統映射
difficulty: easy          # easy | medium | hard | mystery
category: web
source_visible: false     # true = 白箱（顯示原始碼），false = 黑箱
packages: []              # 額外 Python 套件（micropip install）
---

挑戰描述內容（Markdown）
```

### 使用 `create-challenge` 腳本

互動式建立新挑戰的完整目錄結構：

```bash
pnpm create:challenge --name <slug> [--title <title>] \
  [--backend flask|fastapi|php] [--difficulty easy|medium|hard] \
  [--flag <flag>]
```

此腳本會自動：
1. 在 `docs/challenge/` 下建立挑戰目錄與 Markdown 檔案
2. 產生對應 backend 的 app 骨架
3. 建立 `flag.txt` 並寫入指定 flag
4. 執行 `pnpm challenge:keygen` 產生加密 WASM 模組

### 使用 `challenge-keygen` 腳本

為挑戰產生加密 WASM payload：

```bash
pnpm challenge:keygen                 # 處理所有挑戰
pnpm challenge:keygen <slug>          # 處理指定挑戰
pnpm challenge:keygen --force <slug>  # 強制重新產生
```

此腳本執行以下流程：
1. 讀取挑戰 frontmatter 與檔案系統定義
2. 產生隨機 AES-256 金鑰，加密所有 FS 項目
3. 推導 flag verifier（PBKDF2-HMAC-SHA256）
4. 打包為 WASM custom section，注入模板 WASM 二進位
5. 更新 frontmatter 中的 `wasmModule` 路徑

---

## 部署者指南

### 建置流程

```bash
# 1. 安裝依賴
pnpm install

# 2. 完整建置（WASM + keygen + VitePress）
pnpm build
```

建置產物位於 `.vitepress/dist/`，為純靜態檔案。

### 前置需求

- **Node.js** >= 18
- **pnpm** >= 10
- **Rust** toolchain + **wasm-pack**（用於建置 WASM 模組）

### 部署至 GitHub Pages

```yaml
# .github/workflows/deploy.yml 範例
name: Deploy
on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - uses: dtolnay/rust-toolchain@stable
      - run: cargo install wasm-pack
      - run: pnpm install
      - run: pnpm build
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: .vitepress/dist
```

### 部署至 Cloudflare Pages

1. 在 Cloudflare Pages 建立新專案，連結 GitHub repository
2. 設定建置指令：

   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal \
     && . "$HOME/.cargo/env" \
     && cargo install wasm-tools \
     && pnpm install \
     && pnpm build
   ```

3. 設定輸出目錄：`.vitepress/dist`
4. 環境變數中加入 `NODE_VERSION=22`

> **說明**：Cloudflare Pages 預設不含 Rust toolchain，上述建置指令會自動安裝 minimal Rust toolchain 與 `wasm-tools`。`wasm-pack` 已宣告為 devDependency，`pnpm install` 時會自動安裝。
