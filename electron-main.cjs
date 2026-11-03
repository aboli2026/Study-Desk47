const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
  const win = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    title: 'میز مطالعه (Study Space)',
    backgroundColor: '#09090b',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: false // allows local pdf loading and offline assets smoothly
    }
  });

  Menu.setApplicationMenu(null);

  const indexPath = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    win.loadFile(indexPath);
  } else {
    // If dist hasn't been built yet, show instructions
    win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`
      <html dir="rtl" style="background:#18181b;color:#f4f4f5;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;">
        <div style="text-align:center;padding:24px;border:1px solid #3f3f46;border-radius:12px;background:#27272a;">
          <h2>پوشه dist یافت نشد</h2>
          <p>لطفاً ابتدا دستور <code>npm run build</code> را اجرا کنید تا برنامه ساخته شود.</p>
        </div>
      </html>
    `)}`);
  }

  win.once('ready-to-show', () => {
    win.show();
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
