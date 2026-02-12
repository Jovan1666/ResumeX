const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

// 构建产物路径（electron-builder 打包后保持相对位置）
const WEBAPP_DIR = path.join(__dirname, '..', 'webapp');

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: 'ResumeX - 简历制作工具',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false,
  });

  win.loadFile(path.join(WEBAPP_DIR, 'index.html'));

  win.once('ready-to-show', () => {
    win.show();
  });

  // 外部链接用默认浏览器打开
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
