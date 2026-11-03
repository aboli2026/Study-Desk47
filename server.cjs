const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const distPath = path.join(__dirname, 'dist');
const indexPath = path.join(distPath, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.log('\n[1/2] در حال آماده‌سازی و ساخت اولیه فایل‌های آفلاین (Build)...');
  const { execSync } = require('child_process');
  try {
    if (!fs.existsSync(path.join(__dirname, 'node_modules'))) {
      console.log('نصب بسته‌ها...');
      execSync('npm install --legacy-peer-deps', { stdio: 'inherit', shell: true });
    }
    execSync('npm run build', { stdio: 'inherit', shell: true });
    console.log('[✓] فایل‌های آفلاین با موفقیت آماده شدند.\n');
  } catch (err) {
    console.error('\n❌ خطا در بیلد:', err.message);
    process.exit(1);
  }
}

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.mjs': 'application/javascript; charset=UTF-8',
  '.cjs': 'application/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm',
  '.pdf': 'application/pdf'
};

const server = http.createServer((req, res) => {
  try {
    const rawUrl = req.url.split('?')[0];
    let safePath = path.normalize(decodeURIComponent(rawUrl)).replace(/^(\.\.[\/\\])+/, '');
    if (safePath === '/' || safePath === '\\') safePath = '/index.html';

    let filePath = path.join(distPath, safePath);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = indexPath;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/javascript; charset=UTF-8';

    const content = fs.readFileSync(filePath);
    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': content.length,
      'Cache-Control': 'no-cache'
    });
    res.end(content);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=UTF-8' });
    res.end('خطای سرور: ' + err.message);
  }
});

function launch(port) {
  server.listen(port, '127.0.0.1', () => {
    const url = `http://127.0.0.1:${port}`;
    console.log('\n========================================================');
    console.log(`✅ برنامه با موفقیت اجرا شد: ${url}`);
    console.log('💡 این پنجره را تا زمانی که با برنامه کار دارید باز نگه دارید.');
    console.log('========================================================\n');
    exec(`start ${url}`);
  });
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    // If 4545 is busy, automatically pick any random free port!
    console.log('پورت ۴۵۴۵ مشغول بود، در حال جابجایی به پورت آزاد...');
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      const url = `http://127.0.0.1:${port}`;
      console.log(`✅ برنامه با موفقیت در پورت آزاد اجرا شد: ${url}`);
      exec(`start ${url}`);
    });
  } else {
    console.error('خطا در سرور:', err.message);
  }
});

launch(4545);
