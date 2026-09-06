/** Electron 渲染进程可用的 window.resumex API（主进程 preload contextBridge 提供） */

export interface UpdateEventData {
  type: 'checking' | 'available' | 'none' | 'progress' | 'ready' | 'error';
  data?: unknown;
}

export interface ResumexDesktop {
  isDesktop: true;
  getVersion: () => Promise<string>;
  checkForUpdates: () => Promise<{ ok: boolean; message?: string }>;
  downloadUpdate: () => Promise<{ ok: boolean; message?: string }>;
  quitAndInstall: () => Promise<{ ok: boolean; message?: string }>;
  onUpdate: (cb: (e: UpdateEventData) => void) => () => void;
  exportPdf: () => Promise<{ ok: boolean; path?: string; message?: string }>;
  openExternal: (url: string) => Promise<{ ok: boolean; message?: string }>;
  saveBackupFile: (jsonData: string) => Promise<{ ok: boolean; path?: string; message?: string }>;
}

declare global {
  interface Window {
    resumex?: ResumexDesktop;
  }
}

export {};
