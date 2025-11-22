import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const port = process.env.PORT || 4173;
const root = process.cwd();

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let pathname = url.pathname;

  if (pathname === '/') {
    pathname = '/benchmarks/browser-snapshot.html';
  }

  const filePath = path.join(root, pathname);
  const normalized = path.normalize(filePath);

  if (!normalized.startsWith(root)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.stat(normalized, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404);
      return res.end('Not found');
    }

    const ext = path.extname(normalized).toLowerCase();
    const type = mime[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type });
    fs.createReadStream(normalized).pipe(res);
  });
});

server.listen(port, () => {
  const indexPath = path.join(root, 'benchmarks', 'browser-snapshot.html');
  console.log(`Static server running on http://localhost:${port}`);
  console.log(`Open http://localhost:${port}/benchmarks/browser-snapshot.html`);
  console.log(`(or file://${indexPath})`);
});
