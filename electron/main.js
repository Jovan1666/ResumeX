const { app, BrowserWindow, shell, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');

// 构建产物路径（electron-builder 打包后保持相对位置）
const WEBAPP_DIR = path.join(__dirname, '..', 'webapp');
let mainWindow = null;

function getWebappIndex() {
  return path.join(WEBAPP_DIR, 'index.html');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: 'ResumeX - 简历制作工具',
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false,
  });

  const index = getWebappIndex();
  if (fs.existsSync(index)) {
    mainWindow.loadFile(index);
    mainWindow.once('ready-to-show', () => {
      mainWindow.show();
    });
  } else {
    // 加载失败：显示错误页（不要永远 show:false 让用户以为程序没响应）
    mainWindow.loadURL(
      'data:text/html;charset=utf-8,' +
      encodeURIComponent(
        '<html><body style="font-family:sans-serif;text-align:center;padding-top:20vh">' +
        '<h2>ResumeX 无法找到应用文件</h2><p>请重新安装或联系开发者。</p></body></html>'
      )
    );
    mainWindow.once('ready-to-show', () => mainWindow.show());
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 外部链接（http/https）用系统浏览器打开；拒绝 file: 逃逸
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file://') && !/^https?:\/\//.test(url)) {
      event.preventDefault();
    }
  });
}

// ---------- 更新器 ----------
function setupAutoUpdater() {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.logger = require('electron-log');
  if (autoUpdater.logger) autoUpdater.logger.transports.file.level = 'info';

  autoUpdater.on('checking-for-update', () => {
    sendUpdateEvent({ type: 'checking' });
  });
  autoUpdater.on('update-available', (info) => {
    sendUpdateEvent({ type: 'available', data: { version: info.version, releaseNotes: info.releaseNotes, releaseDate: info.releaseDate } });
  });
  autoUpdater.on('update-not-available', () => {
    sendUpdateEvent({ type: 'none' });
  });
  autoUpdater.on('update-downloaded', (info) => {
    sendUpdateEvent({ type: 'ready', data: { version: info.version } });
  });
  autoUpdater.on('download-progress', (progress) => {
    sendUpdateEvent({ type: 'progress', data: { percent: progress.percent, bytesPerSecond: progress.bytesPerSecond } });
  });
  autoUpdater.on('error', (err) => {
    sendUpdateEvent({ type: 'error', data: { message: String(err?.message || err) } });
  });
}

function sendUpdateEvent(payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('resumex:update-event', payload);
  }
}

async function checkForUpdatesSilently() {
  if (!app.isPackaged) return; // 开发模式不检查或明确显示「开发模式无更新」
  try {
    await autoUpdater.checkForUpdates();
  } catch (e) {
    console.error('检查更新失败：', e);
    sendUpdateEvent({ type: 'error', data: { message: '检查更新失败（可能无网络或 GitHub 不可达），请打开下载页' } });
  }
}

// ---------- IPC ----------
ipcMain.handle('resumex:get-version', () => app.getVersion());

ipcMain.handle('resumex:check-updates', async () => {
  if (!app.isPackaged) return { ok: false, message: '开发模式无更新' };
  try {
    await autoUpdater.checkForUpdates();
    return { ok: true };
  } catch (e) {
    return { ok: false, message: String(e?.message || e) };
  }
});

ipcMain.handle('resumex:download-update', async () => {
  if (!app.isPackaged) return { ok: false, message: '开发模式无更新' };
  try {
    await autoUpdater.downloadUpdate();
    return { ok: true };
  } catch (e) {
    return { ok: false, message: String(e?.message || e) };
  }
});

ipcMain.handle('resumex:quit-and-install', async () => {
  if (!app.isPackaged) return { ok: false };
  autoUpdater.quitAndInstall(false, true);
  return { ok: true };
});

ipcMain.handle('resumex:open-external', async (_e, url) => {
  if (/^https?:\/\//.test(String(url))) {
    await shell.openExternal(String(url));
    return { ok: true };
  }
  return { ok: false, message: '仅支持 http/https 链接' };
});

// 将当前窗口（print-mode 只显示 .resume-page）printToPDF 为 Buffer 并另存为文件
ipcMain.handle('resumex:export-pdf', async () => {
  try {
    if (!mainWindow || mainWindow.isDestroyed()) return { ok: false, message: '窗口不可用' };
    // 主进程 printToPDF：margins 用英寸（top/bottom/left/right），不是 marginType
    const pdfData = await mainWindow.webContents.printToPDF({
      pageSize: 'A4',
      printBackground: true,
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      preferCSSPageSize: true,
      scale: 1,
      landscape: false,
      displayHeaderFooter: false,
    });
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      title: '导出 PDF',
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    });
    if (canceled || !filePath) return { ok: false, message: '已取消保存' };
    fs.writeFileSync(filePath, pdfData);
    return { ok: true, path: filePath };
  } catch (err) {
    console.error('导出 PDF 失败：', err);
    return { ok: false, message: String(err?.message || err) };
  }
});

// 备份文件写到 userData/backups（不会放安装目录）
ipcMain.handle('resumex:save-backup-file', async (_e, jsonData) => {
  try {
    const backupDir = path.join(app.getPath('userData'), 'backups');
    fs.mkdirSync(backupDir, { recursive: true });
    const filename = `resumex-backup-${new Date().toISOString().slice(0, 10)}.json`;
    fs.writeFileSync(path.join(backupDir, filename), String(jsonData ?? ''));
    return { ok: true, path: path.join(backupDir, filename) };
  } catch (err) {
    return { ok: false, message: String(err?.message || err) };
  }
});

app.whenReady().then(() => {
  app.setAppUserModelId('com.resumex.app');
  setupAutoUpdater();
  createWindow();
  // 启动后（仅 packaged）静默检查更新
  setTimeout(() => void checkForUpdatesSilently(), 3000);
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
