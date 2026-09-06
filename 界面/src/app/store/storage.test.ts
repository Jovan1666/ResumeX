import { describe, it, expect, beforeEach } from 'vitest';
import { createResumeStorage, isQuotaError, migrateLegacyToIdb, PERSIST_VERSION, IDB_STORE_KEY } from './storage';
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';
import { customStore } from './storage';

// 提供 IndexedDB 与 localStorage 环境
import 'fake-indexeddb/auto';

// vitest node 环境无 localStorage：用内存实现
const memStorage = new Map<string, string>();
const mockLocalStorage = {
  getItem: (k: string) => memStorage.get(k) ?? null,
  setItem: (k: string, v: string) => { memStorage.set(k, v); },
  removeItem: (k: string) => { memStorage.delete(k); },
  clear: () => { memStorage.clear(); },
};
Object.defineProperty(globalThis, 'localStorage', {
  value: mockLocalStorage,
  configurable: true,
});

describe('storage（IndexedDB 存储层）', () => {
  beforeEach(async () => {
    await idbDel(IDB_STORE_KEY, customStore);
    try { localStorage.removeItem('resume-storage'); } catch { /* ignore */ }
    localStorage.clear();
  });

  it('save/load 往返一致', async () => {
    const storage = createResumeStorage();
    const state = {
      resumes: { r1: { id: 'r1', title: '测试', lastModified: 1, profile: { name: '张三', title: '', email: '', phone: '', location: '' }, modules: [], template: 'campusClean', settings: { themeColor: 'ink', fontFamily: 'sans', fontSizeScale: 1, lineHeight: 'standard', pageMargin: 'standard', language: 'zh' } } },
      activeResumeId: 'r1',
    };
    await storage.save(state as never);
    const loaded = await storage.load();
    expect(loaded).not.toBeNull();
    expect(loaded?.activeResumeId).toBe('r1');
    expect((loaded?.resumes as Record<string, { title: string }>)['r1'].title).toBe('测试');
  });

  it('isQuotaError 识别配额错误', () => {
    expect(isQuotaError(new DOMException('quota exceeded', 'QuotaExceededError'))).toBe(true);
    expect(isQuotaError(new Error('IndexedDB quota exceeded'))).toBe(true);
    expect(isQuotaError(new Error('network error'))).toBe(false);
  });

  it('hydrate 解析失败返回 null（不写盘）', async () => {
    await idbSet(IDB_STORE_KEY, 'not-a-valid-state', customStore);
    const storage = createResumeStorage();
    const loaded = await storage.load();
    expect(loaded).toBeNull();
  });

  it('迁移：旧 localStorage 信封 → idb，成功后删除旧 key', async () => {
    localStorage.setItem('resume-storage', JSON.stringify({
      state: { resumes: { r1: { id: 'r1', title: '旧简历', lastModified: 1 } }, activeResumeId: 'r1' },
      version: 1,
    }));
    const ok = await migrateLegacyToIdb();
    expect(ok).toBe(true);
    const stored = await idbGet(IDB_STORE_KEY, customStore);
    expect(stored).not.toBeNull();
    expect(localStorage.getItem('resume-storage')).toBeNull();
  });
});

describe('storage 常量', () => {
  it('persist version 是 3', () => {
    expect(PERSIST_VERSION).toBe(3);
  });
});
