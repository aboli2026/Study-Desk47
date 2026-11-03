const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

console.log('\n========================================================');
console.log('   در حال اجرای نسخه دسکتاپ آفلاین میز مطالعه (Study Desk)');
console.log('========================================================\n');

// 1. Check if dist exists, build if not
const distPath = path.join(__dirname, 'dist');
const indexPath = path.join(distPath, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.log('[1/2] در حال کامپایل اولیه فایل‌های پروژه (Build)...');
  try {
    if (!fs.existsSync(path.join(__dirname, 'node_modules'))) {
      console.log('نصب بسته‌های پیش‌نیاز...');
      execSync('npm install --legacy-peer-deps', { stdio: 'inherit', shell: true });
    }
    execSync('npm run build', { stdio: 'inherit', shell: true });
    console.log('[✓] کامپایل با موفقیت انجام شد.');
  } catch (err) {
    console.error('خطا در بیلد پروژه:', err.message);
    process.exit(1);
  }
} else {
  console.log('[✓] فایل‌های برنامه آماده و کامپایل شده هستند.');
}

// 2. MIME Types dictionary
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
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.wasm': 'application/wasm',
  '.bcmap': 'application/octet-stream',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.pdf': 'application/pdf'
};

// 3. Start lightweight local offline HTTP server (Zero dependencies)
const PORT = 4545;
const server = http.createServer((req, res) => {
  try {
    const parsedUrl = new URL(req.url, `http://127.0.0.1:${PORT}`);
    let safePath = path.normalize(decodeURIComponent(parsedUrl.pathname)).replace(/^(\.\.[\/\\])+/, '');
    if (safePath === '/' || safePath === '\\') safePath = '/index.html';

    let filePath = path.join(distPath, safePath);

    // If file doesn't exist, SPA fallback to index.html
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = indexPath;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    const content = fs.readFileSync(filePath);
    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': content.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Frame-Options': 'SAMEORIGIN'
    });
    res.end(content);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Server Error: ' + err.message);
  }
});

server.listen(PORT, '127.0.0.1', () => {
  const appUrl = `http://127.0.0.1:${PORT}`;
  console.log(`[✓] سرور محلی آفلاین فعال شد: ${appUrl}`);
  console.log('[2/2] در حال باز کردن پنجره اختصاصی نرم‌افزار (Desktop Mode)...\n');

  // Look for Microsoft Edge (installed on 100% of Windows 10 & 11) or Chrome
  const localAppData = process.env.LOCALAPPDATA || '';
  const programFiles = process.env['ProgramFiles'] || 'C:\\Program Files';
  const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';

  const candidateBrowsers = [
    path.join(programFilesX86, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join(programFiles, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join(localAppData, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join(programFiles, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(programFilesX86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(localAppData, 'Google', 'Chrome', 'Application', 'chrome.exe'),
  ];

  const browserPath = candidateBrowsers.find(p => fs.existsSync(p));
  const userDataDir = path.join(process.env.TEMP || '.', 'StudyDeskAppProfile');

  if (browserPath) {
    // Launch as a pure, native desktop application (frameless/tabless app window)
    const appProcess = spawn(browserPath, [
      `--app=${appUrl}`,
      '--window-size=1280,820',
      `--user-data-dir=${userDataDir}`,
      '--no-first-run',
      '--no-default-browser-check'
    ], {
      detached: true,
      stdio: 'ignore'
    });

    appProcess.unref();
    console.log('✨ نرم‌افزار دسکتاپ میز مطالعه با موفقیت در یک پنجره مستقل باز شد!');
    console.log('📌 برای بستن برنامه می‌توانید این پنجره سیاه را ببندید یا پنجره نرم‌افزار را ببندید.\n');
  } else {
    // Fallback: open default browser
    console.log('در حال باز کردن در مرورگر پیش‌فرض سیستم...');
    execSync(`start ${appUrl}`, { shell: true });
  }
});

// Graceful exit on Ctrl+C or kill
process.on('SIGINT', () => {
  console.log('\nدر حال بستن سرور برنامه...');
  server.close(() => {
    process.exit(0);
  });
});
