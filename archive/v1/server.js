const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const multer = require('multer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 訪客計數器 API (兼容 Apache counter.php 與 Node.js)
app.get(['/counter.php', '/api/counter'], (req, res) => {
  const counterFile = path.join(__dirname, 'counter.txt');
  let count = 1337;
  try {
    if (fs.existsSync(counterFile)) {
      count = parseInt(fs.readFileSync(counterFile, 'utf8').trim(), 10) || 1337;
    }
  } catch (e) {}

  const action = req.query.action || 'hit';
  const format = req.query.format || 'json';

  if (action === 'hit') {
    count++;
    try {
      fs.writeFileSync(counterFile, String(count), 'utf8');
    } catch (e) {}
  }

  const padded = String(count).padStart(6, '0');

  if (format === 'text') {
    res.type('text/plain').send(padded);
  } else if (format === 'svg') {
    res.type('image/svg+xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="140" height="34" viewBox="0 0 140 34">
  <rect width="140" height="34" fill="#000000" stroke="#7dffbf" stroke-width="2"/>
  <line x1="23" y1="0" x2="23" y2="34" stroke="#223322" stroke-width="1"/>
  <line x1="46" y1="0" x2="46" y2="34" stroke="#223322" stroke-width="1"/>
  <line x1="69" y1="0" x2="69" y2="34" stroke="#223322" stroke-width="1"/>
  <line x1="92" y1="0" x2="92" y2="34" stroke="#223322" stroke-width="1"/>
  <line x1="115" y1="0" x2="115" y2="34" stroke="#223322" stroke-width="1"/>
  <text x="70" y="24" fill="#7dffbf" font-family="Courier New, monospace" font-size="20" font-weight="bold" letter-spacing="9" text-anchor="middle">${padded}</text>
</svg>`);
  } else {
    res.json({ status: 'ok', count, padded, server: 'Express/Node' });
  }
});

app.use(express.static(path.join(__dirname)));

const ARTICLES_FILE = path.join(__dirname, 'articles.json');
const MARKDOWN_DIR = path.join(__dirname, 'markdown');
const ARTICLE_DIR = path.join(__dirname, 'article');

fs.ensureDirSync(MARKDOWN_DIR);
fs.ensureDirSync(ARTICLE_DIR);

// 輔助函數：讀取所有文章
function getArticles() {
  try {
    if (fs.existsSync(ARTICLES_FILE)) {
      const data = fs.readFileSync(ARTICLES_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading articles.json:', err);
  }
  return [];
}

// 輔助函數：保存所有文章
function saveArticles(articles) {
  fs.writeFileSync(ARTICLES_FILE, JSON.stringify(articles, null, 2), 'utf8');
}

// 輔助函數：生成乾淨的 slug ID
function generateSlug(text) {
  if (!text) return 'post-' + Date.now();
  const slug = text
    .trim()
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5\-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'post-' + Date.now();
}

// 輔助函數：解析 Markdown FrontMatter
function parseFrontMatter(text) {
  const metadata = {};
  let body = text;
  if (text.startsWith('---')) {
    const endPos = text.indexOf('\n---', 3);
    if (endPos !== -1) {
      const rawMeta = text.substring(3, endPos).trim();
      body = text.substring(endPos + 4).trim();
      rawMeta.split('\n').forEach(line => {
        const colonIdx = line.indexOf(':');
        if (colonIdx !== -1) {
          const key = line.substring(0, colonIdx).trim().toLowerCase();
          let val = line.substring(colonIdx + 1).trim();
          if (val.startsWith('[') && val.endsWith(']')) {
            try {
              val = JSON.parse(val.replace(/'/g, '"'));
            } catch (e) {
              val = val.slice(1, -1).split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
            }
          } else {
            val = val.replace(/^['"]|['"]$/g, '');
          }
          metadata[key] = val;
        }
      });
    }
  }
  return { metadata, body };
}

// Multer 磁盤存儲配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const dest = ext === '.md' ? MARKDOWN_DIR : ARTICLE_DIR;
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const baseName = path.parse(file.originalname).name;
    const slug = generateSlug(req.body.title || baseName);
    cb(null, `${slug}${ext}`);
  }
});

const upload = multer({ storage });

// ==================== RESTful API 路由 ====================

// 1. 獲取所有文章列表
app.get('/api/articles', (req, res) => {
  const articles = getArticles();
  res.json(articles);
});

// 2. 獲取單個 Markdown 文件內容（用於在線編輯）
app.get('/api/article-content', (req, res) => {
  const { path: relPath } = req.query;
  if (!relPath) return res.status(400).json({ error: 'Missing path parameter' });

  const safePath = path.normalize(path.join(__dirname, relPath));
  if (!safePath.startsWith(__dirname)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    if (fs.existsSync(safePath)) {
      const content = fs.readFileSync(safePath, 'utf8');
      res.json({ content });
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. 上傳文件（.md 或 .html）
app.post('/api/upload', upload.single('articleFile'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const ext = path.extname(req.file.originalname).toLowerCase();
    const isMarkdown = ext === '.md';
    let fileContent = '';

    if (isMarkdown) {
      fileContent = fs.readFileSync(req.file.path, 'utf8');
    }

    const { metadata, body } = parseFrontMatter(fileContent);

    const title = req.body.title || metadata.title || path.parse(req.file.originalname).name;
    const date = req.body.date || metadata.date || new Date().toISOString().split('T')[0];
    const category = req.body.category || metadata.category || '未分类';
    const summary = req.body.summary || metadata.summary || (body ? body.substring(0, 150).replace(/[#*`\n]/g, ' ') : '文章上傳完成');
    const tags = req.body.tags ? req.body.tags.split(',').map(s => s.trim()).filter(Boolean) : (metadata.tags || [category]);

    const slug = generateSlug(title);
    let url = '';
    let source = '';

    if (isMarkdown) {
      source = `./markdown/${req.file.filename}`;
      url = `./markdown_reader.html?post=${slug}`;
    } else {
      source = `./article/${req.file.filename}`;
      url = source;
    }

    const newArticle = {
      id: slug,
      title,
      date,
      category,
      tags: Array.isArray(tags) ? tags : [tags],
      summary,
      url,
      type: isMarkdown ? 'markdown' : 'html',
      source
    };

    const articles = getArticles();
    // 檢查是否存在同名 id，有則更新，無則加到最前
    const existingIdx = articles.findIndex(a => a.id === slug || a.title === title);
    if (existingIdx !== -1) {
      articles[existingIdx] = newArticle;
    } else {
      articles.unshift(newArticle);
    }

    saveArticles(articles);
    res.json({ success: true, article: newArticle });
  } catch (err) {
    console.error('Upload processing error:', err);
    res.status(500).json({ error: 'Failed to process and save article: ' + err.message });
  }
});

// 4. 在線撰寫發布 Markdown
app.post('/api/publish', (req, res) => {
  const { title, date, category, tags, summary, markdownContent } = req.body;

  if (!title || !markdownContent) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  try {
    const slug = generateSlug(title);
    const pubDate = date || new Date().toISOString().split('T')[0];
    const pubCategory = category || '未分类';
    const tagList = Array.isArray(tags)
      ? tags
      : (typeof tags === 'string' ? tags.split(',').map(s => s.trim()).filter(Boolean) : [pubCategory]);
    const pubSummary = summary || markdownContent.substring(0, 150).replace(/[#*`\n]/g, ' ');

    // 格式化 FrontMatter
    const formattedContent = `---
title: ${title}
date: ${pubDate}
category: ${pubCategory}
tags: ${JSON.stringify(tagList)}
summary: ${pubSummary}
---

${markdownContent}
`;

    const fileName = `${slug}.md`;
    const targetFile = path.join(MARKDOWN_DIR, fileName);
    fs.writeFileSync(targetFile, formattedContent, 'utf8');

    const newArticle = {
      id: slug,
      title,
      date: pubDate,
      category: pubCategory,
      tags: tagList,
      summary: pubSummary,
      url: `./markdown_reader.html?post=${slug}`,
      type: 'markdown',
      source: `./markdown/${fileName}`
    };

    const articles = getArticles();
    const existingIdx = articles.findIndex(a => a.id === slug || a.title === title);
    if (existingIdx !== -1) {
      articles[existingIdx] = newArticle;
    } else {
      articles.unshift(newArticle);
    }

    saveArticles(articles);
    res.json({ success: true, article: newArticle });
  } catch (err) {
    console.error('Publish error:', err);
    res.status(500).json({ error: 'Failed to publish article: ' + err.message });
  }
});

// 5. 手動添加文章元數據
app.post('/api/articles', (req, res) => {
  const { title, date, category, tags, summary, url } = req.body;
  if (!title || !url) {
    return res.status(400).json({ error: 'Title and URL are required' });
  }

  const slug = generateSlug(title);
  const newArticle = {
    id: slug,
    title,
    date: date || new Date().toISOString().split('T')[0],
    category: category || '未分类',
    tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(s => s.trim())) : [category || '未分类'],
    summary: summary || '',
    url,
    type: url.includes('.html') && !url.includes('markdown_reader') ? 'html' : 'markdown'
  };

  const articles = getArticles();
  articles.unshift(newArticle);
  saveArticles(articles);
  res.json({ success: true, article: newArticle });
});

// 6. 刪除文章 (支持按 id 或索引刪除)
app.delete('/api/articles/:identifier', (req, res) => {
  const identifier = req.params.identifier;
  let articles = getArticles();

  let targetIndex = -1;
  if (/^\d+$/.test(identifier) && parseInt(identifier) < articles.length) {
    targetIndex = parseInt(identifier);
  } else {
    targetIndex = articles.findIndex(a => a.id === identifier || a.title === identifier);
  }

  if (targetIndex === -1) {
    return res.status(404).json({ error: 'Article not found' });
  }

  const [deletedArticle] = articles.splice(targetIndex, 1);
  saveArticles(articles);

  // 可選：如果請求帶有 deleteFile=true 參數，則同時刪除硬盤文件
  if (req.query.deleteFile === 'true' && deletedArticle.source) {
    const filePath = path.normalize(path.join(__dirname, deletedArticle.source));
    if (filePath.startsWith(__dirname) && fs.existsSync(filePath)) {
      try { fs.removeSync(filePath); } catch (e) { console.warn('Could not delete disk file:', e); }
    }
  }

  res.json({ success: true, deleted: deletedArticle });
});

app.listen(PORT, () => {
  console.log('====================================================');
  console.log(`✞ Blog Server running at http://localhost:${PORT}`);
  console.log(`✞ Home:     http://localhost:${PORT}/index.html`);
  console.log(`✞ Admin:    http://localhost:${PORT}/autouploader.html`);
  console.log('====================================================');
});