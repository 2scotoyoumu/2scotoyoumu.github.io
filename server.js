const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const multer = require('multer');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'article');
    fs.ensureDirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate filename based on title if provided, otherwise use original
    const title = req.body.title ? req.body.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase() : 'article';
    const ext = path.extname(file.originalname);
    cb(null, `${title}${ext}`);
  }
});

const upload = multer({ storage });

// Routes
app.get('/api/articles', (req, res) => {
  try {
    const articles = fs.readFileSync('articles.json', 'utf8');
    res.json(JSON.parse(articles));
  } catch (error) {
    res.json([]);
  }
});

app.post('/api/articles', (req, res) => {
  const { title, date, category, summary, url } = req.body;

  if (!title || !date || !category || !summary) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    let articles = [];
    if (fs.existsSync('articles.json')) {
      articles = JSON.parse(fs.readFileSync('articles.json', 'utf8'));
    }

    const newArticle = {
      title,
      date,
      category,
      summary,
      url: url || `./article/${category.toLowerCase()}/${title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.html`
    };

    articles.unshift(newArticle); // Add to beginning

    fs.writeFileSync('articles.json', JSON.stringify(articles, null, 2));
    res.json({ success: true, article: newArticle });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save article' });
  }
});

app.post('/api/upload', upload.single('articleFile'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const { title, date, category, summary } = req.body;
  const fileUrl = `./article/${req.file.filename}`;

  // Auto-add to articles.json
  const newArticle = {
    title: title || path.parse(req.file.originalname).name,
    date: date || new Date().toISOString().split('T')[0],
    category: category || '未分类',
    summary: summary || 'Article uploaded',
    url: fileUrl
  };

  try {
    let articles = [];
    if (fs.existsSync('articles.json')) {
      articles = JSON.parse(fs.readFileSync('articles.json', 'utf8'));
    }

    articles.unshift(newArticle);
    fs.writeFileSync('articles.json', JSON.stringify(articles, null, 2));

    res.json({ success: true, article: newArticle, file: req.file });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save article' });
  }
});

app.delete('/api/articles/:index', (req, res) => {
  const index = parseInt(req.params.index);

  try {
    let articles = JSON.parse(fs.readFileSync('articles.json', 'utf8'));
    if (index >= 0 && index < articles.length) {
      const deleted = articles.splice(index, 1);
      fs.writeFileSync('articles.json', JSON.stringify(articles, null, 2));
      res.json({ success: true, deleted });
    } else {
      res.status(404).json({ error: 'Article not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete article' });
  }
});

app.listen(PORT, () => {
  console.log(`Article uploader server running at http://localhost:${PORT}`);
  console.log(`Uploader interface: http://localhost:${PORT}/autouploader.html`);
});