# Article Uploader & Tracker

A backend system for uploading and tracking articles on your static blog site.

## Features

- **File Upload**: Upload HTML/MD files directly and automatically add them to articles.json
- **Manual Entry**: Add articles manually with custom metadata
- **Article Tracking**: View, edit, and delete tracked articles
- **Auto-Update**: Automatically updates articles.json with new entries
- **Category Support**: Organize articles by categories (计算机, 数学, 生活, 哲学, 未分类)

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   ```

3. Open the uploader interface:
   - Go to `http://localhost:3000/autouploader.html`

## Usage

### File Upload
1. Select an HTML or Markdown file
2. Fill in the article details (title, date, category, summary)
3. Click "Upload & Add to Tracker"
4. The file will be saved to the `article/` directory and added to `articles.json`

### Manual Entry
1. Fill in all required fields (title, date, category, summary)
2. Optionally specify a URL
3. Click "Add Article"
4. The article will be added to `articles.json`

### Article Management
- View all tracked articles in the "Article List" tab
- Delete articles using the × button on each card
- Articles are displayed with title, date, category, URL, and summary

## API Endpoints

- `GET /api/articles` - Get all articles
- `POST /api/articles` - Add a new article manually
- `POST /api/upload` - Upload a file and add article
- `DELETE /api/articles/:index` - Delete article by index

## File Structure

```
your-blog/
├── articles.json          # Article metadata
├── server.js             # Backend server
├── autouploader.html     # Upload interface
├── package.json          # Dependencies
└── article/              # Article files directory
    └── category/
        └── article-files.html
```

## Notes

- The server runs on `http://localhost:3000`
- Articles are added to the beginning of the list (newest first)
- File uploads are saved with sanitized filenames
- The system integrates with your existing blog structure</content>
<parameter name="filePath">/workspaces/2scotoyoumu.github.io/README-UPLOADER.md