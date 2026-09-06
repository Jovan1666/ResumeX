/**
 * Electron preload：通过 contextBridge 暴露最小 API（更新、导出、版本、外链、备份）。
 * contextIsolation: true 下运行；渲染进程仅通过 window.resumex 访问。
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('resumex', {
  isDesktop: true,
  getVersion: () => ipcRenderer.invoke('resumex:get-version'),
  checkForUpdates: () => ipcRenderer.invoke('resumex:check-updates'),
  downloadUpdate: () => ipcRenderer.invoke('resumex:download-update'),
  quitAndInstall: () => ipcRenderer.invoke('resumex:quit-and-install'),
  onUpdate: (cb) => {
    const listener = (_event, payload) => cb(payload);
    ipcRenderer.on('resumex:update-event', listener);
    return () => ipcRenderer.removeListener('resumex:update-event', listener);
  },
  exportPdf: () => ipcRenderer.invoke('resumex:export-pdf'),
  openExternal: (url) => ipcRenderer.invoke('resumex:open-external', url),
  saveBackupFile: () => ipcRenderer.invoke('resumex:save-backup-file'),
});
