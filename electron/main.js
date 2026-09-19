const { app, BrowserWindow, shell, ipcMain, dialog, session, Notification } = require('electron');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');

// 构建产物路径（electron-builder 打包后保持相对位置）
const WEBAPP_DIR = path.join(__dirname, '..', 'webapp');
let mainWindow = null;

function getWebappIndex() {
  return path.join(WEBAPP_DIR, 'index.html');
}

/** 弹窗的宿主窗口：主窗口不存在/已销毁时退回焦点窗口，避免把 destroyed 窗口传进 dialog */
function dialogParent() {
  if (mainWindow && !mainWindow.isDestroyed()) return mainWindow;
  const focused = BrowserWindow.getFocusedWindow();
  return focused && !focused.isDestroyed() ? focused : undefined;
}

/** 统一封装：没有可用宿主窗口时按「无 parent」形式调用，避免传 undefined 进重载参数 */
function showSaveDialog(options) {
  const parent = dialogParent();
  return parent ? dialog.showSaveDialog(parent, options) : dialog.showSaveDialog(options);
}

function showSaveDialogSync(options) {
  const parent = dialogParent();
  return parent ? dialog.showSaveDialogSync(parent, options) : dialog.showSaveDialogSync(options);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    // 最小宽度 1024：编辑器是「左侧表单 + 右侧 A4 纸」，A4 纸本身 210mm ≈ 794px，
    // 再放侧栏就必然超过 800。原来 minWidth:800 既放不下完整布局，又让渲染进程里
    // <768px 的移动端分支变成永远走不到的死代码。
    minWidth: 1024,
    minHeight: 600,
    title: 'ResumeX',
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

// ---------- 下载：必须让用户选保存位置 ----------
/**
 * 渲染进程里 Word / PNG / 备份文件都是用 <a download> / file-saver 触发的。
 * Electron 默认会把它们静默丢进系统「下载」文件夹，用户根本不知道文件去哪了 ——
 * 这里统一改成弹原生「另存为」对话框：用户选哪儿就存哪儿，取消就中止下载。
 * （PDF 走 IPC printToPDF + showSaveDialog，不经过这里，不会弹两次。）
 */
function filtersFor(filename) {
  const ext = path.extname(String(filename || '')).replace('.', '').toLowerCase();
  const named = {
    pdf: 'PDF 文件',
    docx: 'Word 文档',
    doc: 'Word 文档',
    png: 'PNG 图片',
    jpg: 'JPEG 图片',
    jpeg: 'JPEG 图片',
    zip: 'ResumeX 备份',
    json: 'JSON 文件',
    txt: '文本文件',
  };
  if (ext && named[ext]) return [{ name: named[ext], extensions: [ext] }, { name: '所有文件', extensions: ['*'] }];
  return [{ name: '所有文件', extensions: ['*'] }];
}

function setupDownloads() {
  session.defaultSession.on('will-download', (_event, item) => {
    const suggested = item.getFilename() || `ResumeX-${new Date().toISOString().slice(0, 10)}`;
    const options = {
      title: '保存文件',
      defaultPath: path.join(app.getPath('downloads'), suggested),
      filters: filtersFor(suggested),
    };
    // 用同步版：在 will-download 里直接把保存路径定下来（最可靠的写法）。
    // 弹框期间主进程事件循环会等待，但这是模态框，用户本来也无法操作窗口。
    const savePath = showSaveDialogSync(options);

    if (!savePath) {
      item.cancel(); // 用户取消：明确中止，不留半截文件
      return;
    }

    item.setSavePath(savePath);
    item.once('done', (_e, state) => {
      if (state !== 'completed') {
        console.warn('下载未完成：', suggested, state);
        return;
      }
      // 告诉用户文件到底存哪儿了（系统通知被禁用时静默忽略）
      try {
        if (Notification.isSupported()) {
          new Notification({ title: '文件已保存', body: savePath }).show();
        }
      } catch (e) {
        console.warn('系统通知不可用：', e);
      }
    });
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
    const { canceled, filePath } = await showSaveDialog({
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

// 备份文件由渲染进程用 <a download> 下载（走上面的 will-download → 原生「另存为」）。
// 这里曾经的 resumex:save-backup-file（偷偷写到 userData/backups 的 JSON）已删除：
// 它是第二套备份真相，用户根本找不到那个目录，也导不回照片。

/**
 * 单实例锁。
 * 简历整库存在内存里、每次变更**整条覆盖**写入 IndexedDB。开第二个窗口 = 两份互不知情的
 * 内存副本，后写入的那一个会静默清掉前一个的全部简历。
 * 用户点两次图标（第一次没立刻看到反应时很常见）就会触发，因此第二次启动改为聚焦已有窗口。
 */
const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

app.whenReady().then(() => {
  if (!gotSingleInstanceLock) return;
  app.setAppUserModelId('com.resumex.app');
  setupAutoUpdater();
  setupDownloads();
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
