# ✞ 2's Complement Web Sanctuary — v2 ✞

**這是網站的 v2 藝術升級版**，基於 v1 存檔進行改造。

v2 主要變化：
- 背景改為 Tenor 像素 GIF 多重堆疊平鋪。
- 首頁添加多個 Tenor 動態 GIF 裝飾，強化 Web 1.0 個人站藝術感。
- 保留 v1 全部功能（計數器、留言板、BGM 文件夾、文章系統等）。

如需回滾，請參見上層目錄的 `archive/v1/`。

> 「感情は二進数、恋は未定義動作。」

## 🌸 核心功能

- **Apache + PHP 原生支持**：訪客計數器 (`counter.php`)、留言板 (`guestbook.php`)。
- **Markdown 閱讀器**：`markdown_reader.html`（Marked.js + MathJax 3）。
- **文章分類與搜索**：首頁、`article_nav.html`、`posts/posts.html` 均支持分類篩選與即時搜索。
- **BGM 播放器**：首頁內置 8-bit 合成器，支持本地音頻/MIDI 上傳與遠程 URL。
- **訪客留言板**：`contact/contact.html` 提供 PHP 留言板，Apache 環境下自動啟用。
- **管理後台**：`autouploader.html` 支持 Node.js 後端在線發布，純 Apache 環境下提供手動編輯模式。
- **站點地圖與 RSS**：`sitemap.html`、`rss.xml`。

## 🐍 本地快速啟動

項目根目錄提供了 `serve.py`，會自動檢測環境並啟動最合適的本地服務器：

```bash
python serve.py              # 自動選擇：首選 PHP，其次 Python 靜態服務器
python serve.py --port 8080  # 指定端口
python serve.py --static     # 強制使用 Python 靜態服務器（無 PHP 功能）
python serve.py --node       # 啟動 Node.js 後端（server.js）
python serve.py --no-browser # 不自動打開瀏覽器
```

- PHP 模式：完整支持計數器、留言板、BGM 文件夾掃描。
- Python 靜態模式：僅用於預覽頁面，PHP 功能不可用。
- Node 模式：啟動 `server.js`，支持在線發布/上傳/刪除（`PORT` 環境變量已生效）。

## 🚀 Apache 部署

1. 將本倉庫所有文件上傳到 Apache 文檔根目錄（例如 `/var/www/html` 或 `htdocs`）。
2. 確保已啟用 PHP 擴展（計數器、留言板與 BGM 文件夾掃描需要 PHP）。
3. 確保 Apache 用戶對以下文件/目錄有寫入權限：
   - `counter.txt`（計數器數據）
   - `messages.json`（留言板數據）
   - `markdown/`（若使用管理後台上傳）
   - `article/`（若使用管理後台上傳 HTML 文件）
4. 可選：啟用 `mod_rewrite` 以支持 `/post/<slug>` 與 `/category/<name>` 美化 URL。

```bash
# Linux / macOS 示例
sudo chown -R www-data:www-data counter.txt messages.json markdown article
sudo chmod 664 counter.txt messages.json
sudo chmod 775 markdown article
```

## 🖥️ 本地開發（可選 Node.js 後台）

若需要在本地使用在線發布、上傳、刪除功能，可啟動 Node.js 後端：

```bash
npm install
npm start
```

- 博客首頁：[http://localhost:3000/index.html](http://localhost:3000/index.html)
- 發布管理後台：[http://localhost:3000/autouploader.html](http://localhost:3000/autouploader.html)
- Markdown 閱讀器：[http://localhost:3000/markdown_reader.html](http://localhost:3000/markdown_reader.html)

## 📁 文件結構

```
.
├── index.html                  # 首頁
├── markdown_reader.html        # Markdown 閱讀器
├── autouploader.html           # 管理後台
├── sitemap.html                # 站點地圖
├── rss.xml                     # RSS 訂閱源
├── articles.json               # 文章索引
├── counter.php                 # PHP 訪客計數器
├── counter.txt                 # 計數器數據（需可寫）
├── guestbook.php               # PHP 留言板 API
├── messages.json               # 留言數據（需可寫）
├── bgm-list.php                # BGM 文件夾掃描 API
├── bgm/                        # BGM 音頻/MIDI 文件目錄
├── .htaccess                   # Apache 配置
├── css/style.css               # 公共復古樣式
├── js/script.js                # 公共腳本
├── about/about.html            # 關於頁面
├── contact/contact.html        # 聯繫與留言板
├── posts/posts.html            # 文章存檔
├── article/                    # HTML 文章目錄
├── markdown/                   # Markdown 文章目錄
└── vectorImages/               # SVG 圖標與 88x31 徽章
```

## 🎵 BGM 播放器使用

首頁的 BGM Player 會自動掃描 `bgm/` 文件夾中的音頻/MIDI 文件：

1. 把音頻文件放到 `bgm/` 目錄：
   - 支持格式：`.mp3`, `.ogg`, `.wav`, `.flac`, `.m4a`, `.aac`, `.mid`, `.midi`
2. 刷新首頁，下拉菜單會自動列出可用曲目。
3. 如果沒有 PHP，仍可通過「本地文件上傳」或「URL 輸入」播放。

## 📝 添加新文章（純 Apache 模式）

1. 在 `markdown/` 下新建 `.md` 文件，建議包含 FrontMatter：

```markdown
---
title: 你的文章標題
date: 2026-10-18
category: 算法
tags: ["算法", "示例"]
summary: 文章摘要...
---

# 正文
```

2. 將對應條目追加到 `articles.json`。
3. 更新 `rss.xml` 中的 `<item>` 列表。
4. 更新 `sitemap.html` 將自動從 `articles.json` 加載，無需手動修改。

## 💌 聯繫

- Telegram：[https://t.me/2scomplementblog](https://t.me/2scomplementblog)
- GitHub：[https://github.com/2scotoyoumu](https://github.com/2scotoyoumu)
- 留言板：[./contact/contact.html](./contact/contact.html)
