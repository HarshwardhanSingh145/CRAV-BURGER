const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 4567;
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  // Handle /_next/image optimizer endpoint
  if (pathname === '/_next/image') {
    const imgUrl = parsedUrl.query.url;
    if (imgUrl) {
      const decodedImgUrl = decodeURIComponent(imgUrl);
      const cleanImgPath = decodedImgUrl.startsWith('/') ? decodedImgUrl.slice(1) : decodedImgUrl;
      const targetPath = path.join(__dirname, cleanImgPath);
      if (fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()) {
        const ext = path.extname(targetPath).toLowerCase();
        res.writeHead(200, {
          'Content-Type': MIME_TYPES[ext] || 'image/webp',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=31536000',
        });
        fs.createReadStream(targetPath).pipe(res);
        return;
      }
    }
    // Fallback: 404
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Image Not Found: ' + req.url);
    return;
  }

  // Normalize default path
  if (pathname === '/') {
    pathname = '/index.html';
  }

  let filePath = path.join(__dirname, pathname.startsWith('/') ? pathname.slice(1) : pathname);

  // Check if file exists directly
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    // If it's a route like /menu or /spices or /contact
    if (fs.existsSync(filePath + '.html')) {
      filePath = filePath + '.html';
    } else {
      // Fallback to index.html if not found
      if (!pathname.startsWith('/_next') && !pathname.startsWith('/img')) {
        filePath = path.join(__dirname, 'index.html');
      }
    }
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache',
    });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found: ' + pathname);
  }
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
