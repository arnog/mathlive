//
// Local server to test CSP headers
//
const http = require('http');
const fs = require('fs');
const path = require('path');

// Directory where your esbuild output is located
const servedir = path.join(__dirname, '../');

// Generate a random nonce
const nonce = 'a=base-64=encoded=nonce';

// Content Security Policy header
const cspHeader = `default-src 'self'; script-src 'self' 'unsafe-inline' https://unpkg.com; style-src 'self' 'unsafe-inline'; img-src 'unsafe-inline'`;

// Create an HTTP server
const server = http.createServer((req, res) => {
  // Construct the file path
  let filePath = path.join(servedir, req.url === '/' ? 'dist/smoke/' : req.url);
  if (filePath.endsWith('/')) filePath += 'index.html';

  // Check if the file exists
  fs.exists(filePath, (exists) => {
    if (exists) {
      // Read and serve the file
      fs.readFile(filePath, (err, content) => {
        if (err) {
          res.writeHead(500);
          res.end('Server Error');
        } else {
          // Set the appropriate content type
          const ext = path.extname(filePath);
          const contentType = getContentType(ext);
          res.writeHead(200, {
            'Content-Type': contentType,
            'Content-Security-Policy': cspHeader,
          });
          res.end(content, 'utf-8');
        }
      });
    } else {
      // If the file doesn't exist, return 404
      res.writeHead(404);
      res.end(`${filePath} not found`);
    }
  });
});

// Function to determine the content type based on file extension
function getContentType(ext) {
  switch (ext) {
    case '.html':
      return 'text/html';
    case '.js':
    case '.mjs':
      return 'application/javascript';
    case '.css':
      return 'text/css';
    case '.json':
      return 'application/json';
    case '.png':
      return 'image/png';
    case '.jpg':
      return 'image/jpeg';
    default:
      return 'application/octet-stream';
  }
}

// Start the server
const PORT = 8080;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}/`);
});
