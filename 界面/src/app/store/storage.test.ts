import { describe, it, expect, beforeEach } from 'vitest';
import { createResumeStorage, isQuotaError, migrateLegacyToIdb, CorruptedDataError, PERSIST_VERSION, IDB_STORE_KEY } from './storage';
import { migratePersistedState, TEMPLATE_THEME } from './useResumeStore';
import { TEMPLATE_IDS } from '@/app/types/resume';
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
      resumes: { r1: { id: 'r1', title: '测试', lastModified: 1, profile: { name: '张三', title: '', email: '', phone: '', location: '' }, modules: [], template: 'classic', settings: { themeColor: 'ink', fontFamily: 'sans', fontSizeScale: 1, lineHeight: 'standard', pageMargin: 'standard', language: 'zh' } } },
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

  it('数据存在但无法解析时抛错，绝不返回 null 被当成空库', async () => {
    // 返回 null 会让上层显示「还没有简历」，用户新建后把空 state 写回 → 原数据被永久覆盖
    await idbSet(IDB_STORE_KEY, 'not-a-valid-state', customStore);
    const storage = createResumeStorage();
    await expect(storage.load()).rejects.toThrow(CorruptedDataError);
    // 原始坏数据仍在盘上，没有被清掉
    expect(await idbGet(IDB_STORE_KEY, customStore)).toBe('not-a-valid-state');
  });

  it('确实没有数据时才返回 null（首次使用）', async () => {
    const storage = createResumeStorage();
    expect(await storage.load()).toBeNull();
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

describe('persist 迁移必须幂等且非破坏（每次启动都会跑）', () => {
  const mk = (template: string, themeColor: string) => ({
    resumes: {
      r1: {
        id: 'r1', title: '简历', lastModified: 1, template,
        profile: { name: '张三', title: '', email: '', phone: '', location: '', customFields: [] },
        modules: [],
        settings: { themeColor, fontFamily: 'sans', fontSizeScale: 1, lineHeight: 'standard', pageMargin: 'standard', language: 'zh' },
      },
    },
    activeResumeId: 'r1',
  });
  const run = (state: unknown) => migratePersistedState(state).resumes['r1'];

  it('当前受支持的模板与配色原样保留，不被重置成 campusClean/campus', () => {
    // 回归：旧实现只查「旧 35 套 → 新 8 套」映射表，新 id 不在表内 → 每次重启模板+配色全丢
    for (const id of TEMPLATE_IDS) {
      const theme = TEMPLATE_THEME[id];
      const out = run(mk(id, theme));
      expect(out.template).toBe(id);
      expect(out.settings.themeColor).toBe(theme);
    }
  });

  it('用户自选的非默认配色不被模板默认值覆盖', () => {
    const out = run(mk('classic', 'rust'));
    expect(out.template).toBe('classic');
    expect(out.settings.themeColor).toBe('rust');
  });

  it('旧 id 与旧配色仍然被映射，未知 id 才退回默认', () => {
    expect(run(mk('javaDev', 'tech-orange')).template).toBe('classic');
    expect(run(mk('javaDev', 'tech-orange')).settings.themeColor).toBe('rust');
    expect(run(mk('不存在的模板', 'rust')).template).toBe('classic');
    // 14 套 → 7 套：被吸收的 id 必须落到最接近的新版式，不能退回默认
    expect(run(mk('campusClean', 'campus')).template).toBe('classic');
    expect(run(mk('navySidebar', 'navy')).template).toBe('sidebar');
    expect(run(mk('compactSplit', 'navy')).template).toBe('sidebar');
    expect(run(mk('twoColumnEqual', 'slate')).template).toBe('sidebar');
    expect(run(mk('bannerCampus', 'campus')).template).toBe('banner');
    expect(run(mk('greenFresh', 'pine')).template).toBe('frame');
  });

  it('跑两遍结果一致（幂等）', () => {
    const once = migratePersistedState(mk('navySidebar', 'pine'));
    const twice = migratePersistedState(once);
    expect(twice).toEqual(once);
  });
});
