const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const DIST_DIR = path.join(__dirname, 'frontend', 'dist');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json'
};

const server = http.createServer((req, res) => {
  let filePath = path.join(DIST_DIR, req.url === '/' ? 'index.html' : req.url);
  
  // For SPA routing, always serve index.html for non-asset requests
  if (!path.extname(filePath) && req.url !== '/') {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        // File not found, serve index.html for SPA
        fs.readFile(path.join(DIST_DIR, 'index.html'), (error, content) => {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(content, 'utf-8');
        });
      } else {
        res.writeHead(500);
        res.end('Server error: ' + error.code);
      }
    } else {
      const ext = path.extname(filePath);
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n✅ Frontend server running at http://localhost:${PORT}`);
  console.log('\n⚠️  IMPORTANT: Deploy the backend to EC2 first!');
  console.log('\nBackend deployment instructions are above.');
  console.log('Backend URL: http://3.148.227.249:3001');
  console.log('\nLogin credentials:');
  console.log('  Email: admin@macal.cl');
  console.log('  Password: MacalAdmin2024\n');
});