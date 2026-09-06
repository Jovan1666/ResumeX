/**
 * 简历存储层：IndexedDB 为主，负责持久化、迁移与错误上报。
 *
 * 设计目标（规格 02 §7）：
 * - load(): Promise<PersistedState | null> —— hydrate 解析失败返回 null（不把演示数据写盘）
 * - save(state): Promise<void> —— 配额不足等失败必须 reject，由 UI 显示「保存失败」
 * - 从旧 localStorage `resume-storage`（Zustand persist 信封）一次性迁移；成功删旧 key，失败保留
 * - 不依赖 DOM 的 JSON 序列化，避免在 persist 中误存 Blob
 */

import { get, set, del, createStore } from 'idb-keyval';

// IndexedDB 库名（与 localStorage key 区分）
export const IDB_DATABASE = 'resumex-db';
export const IDB_STORE_KEY = 'resumex-state';
// 旧 localStorage key（Zustand persist 信封）
export const LEGACY_STORAGE_KEY = 'resume-storage';
// persist 版本（阶段 2 升到 3；迁移时以信封内 version 为准）
export const PERSIST_VERSION = 3;

// idb-keyval 默认库名为 keyval-store，这里显式建一个独立库
const customStore = createStore(IDB_DATABASE, IDB_STORE_KEY);

// 兼容实现：Electron file:// 下 IndexedDB 应可用；若不可用则降级 localStorage，
// 但会抛出错误让 UI 提示（绝不静默丢弃）
export interface PersistedState {
  resumes: Record<string, import('@/app/types/resume').ResumeData>;
  activeResumeId: string;
  [key: string]: unknown;
}

/** 把 Zustand persist 信封拆成裸 state（迁移用） */
export interface PersistEnvelope {
  state: PersistedState;
  version?: number;
}

/** 判断 IndexedDB 是否可用 */
export function idbAvailable(): boolean {
  try {
    return typeof indexedDB !== 'undefined' && !!indexedDB;
  } catch {
    return false;
  }
}

/** 分析错误：是否为配额/持久化失败 */
export function isQuotaError(e: unknown): boolean {
  const name = (e as { name?: string })?.name || '';
  const msg = String((e as { message?: string })?.message || e || '');
  return (
    name === 'QuotaExceededError' ||
    name === 'QuotaExceeded' ||
    /quota/i.test(msg) ||
    /exceed/i.test(msg)
  );
}

/** 把 idb 存的 JSON 解析成 PersistedState（信封 state 或裸 state 均可） */
function parseStoredState(raw: unknown): PersistedState | null {
  if (raw == null) return null;
  // Zustand persist 信封：{ state: {...}, version: n }
  if (typeof raw === 'object' && 'state' in (raw as object)) {
    const env = raw as PersistEnvelope;
    if (env.state && typeof env.state === 'object') {
      return env.state;
    }
    return null;
  }
  if (typeof raw === 'object') {
    if ('resumes' in (raw as object) && typeof (raw as PersistedState).resumes === 'object') {
      return raw as PersistedState;
    }
  }
  // 字符串则尝试 JSON.parse
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return parseStoredState(parsed) as PersistedState | null;
    } catch {
      return null;
    }
  }
  return null;
}

/** 从旧 localStorage 读取信封（不存在返回 null） */
export function readLegacyEnvelope(): PersistEnvelope | null {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistEnvelope;
    if (!parsed || typeof parsed !== 'object' || !parsed.state) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * 一次性迁移：localStorage 信封 → IndexedDB。
 * 成功：写入 idb 并删除旧 key，返回 true。
 * 失败：保留旧 key 供恢复，返回 false。
 */
export async function migrateLegacyToIdb(): Promise<boolean> {
  const legacy = readLegacyEnvelope();
  if (!legacy) return true; // 没有旧数据，无需迁移
  try {
    await set(IDB_STORE_KEY, legacy.state, customStore);
    try {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      // 删除失败不影响迁移成功
    }
    return true;
  } catch (e) {
    console.error('[storage] 迁移旧数据到 IndexedDB 失败：', e);
    return false;
  }
}

/**
 * 创建符合规格 §7 的存储对象。
 * save 失败会 throw（由 persist onError / UI 捕获显示「保存失败」）。
 */
export interface ResumeStorage {
  load(): Promise<PersistedState | null>;
  save(state: PersistedState): Promise<void>;
  exportBackup(): Promise<Blob>;
  importBackup(file: File): Promise<{ success: boolean; message: string }>;
}

export function createResumeStorage(): ResumeStorage {
  return {
    async load(): Promise<PersistedState | null> {
      // 优先读 idb
      try {
        const raw = await get(IDB_STORE_KEY, customStore);
        const state = parseStoredState(raw);
        if (state) return state;
        // idb 空 → 尝试迁移旧 localStorage
        const migrated = await migrateLegacyToIdb();
        if (migrated) {
          const after = await get(IDB_STORE_KEY, customStore);
          const s2 = parseStoredState(after);
          if (s2) return s2;
        }
        return null;
      } catch (e) {
        // idb 读取失败：尝试从 localStorage 信封兜底（只读恢复场景）
        console.error('[storage] 读取 IndexedDB 失败：', e);
        const legacy = readLegacyEnvelope();
        return legacy?.state ?? null;
      }
    },

    async save(state: PersistedState): Promise<void> {
      await set(IDB_STORE_KEY, state, customStore);
    },

    async exportBackup(): Promise<Blob> {
      const state = await get(IDB_STORE_KEY, customStore);
      const parsed = parseStoredState(state) ?? {};
      const payload = { state: parsed, version: PERSIST_VERSION, exportedAt: new Date().toISOString() };
      return new Blob([JSON.stringify(payload)], { type: 'application/json' });
    },

    async importBackup(file: File): Promise<{ success: boolean; message: string }> {
      try {
        const text = await file.text();
        const data = JSON.parse(text) as PersistEnvelope | PersistedState;
        const state: PersistedState | null = parseStoredState(data);
        if (!state || !state.resumes || typeof state.resumes !== 'object') {
          return { success: false, message: '文件格式无效，请选择正确的备份文件' };
        }
        if (Object.keys(state.resumes).length === 0) {
          return { success: false, message: '备份文件里没有简历数据' };
        }
        if (!state.resumes[state.activeResumeId]) {
          state.activeResumeId = Object.keys(state.resumes)[0];
        }
        // 写盘（先写 idb）
        await set(IDB_STORE_KEY, state, customStore);
        return { success: true, message: '数据恢复成功' };
      } catch (e) {
        console.error('[storage] 导入备份失败：', e);
        return { success: false, message: '文件解析失败，请确认文件格式' };
      }
    },
  };
}

/** 清空全部数据（恢复屏「清空并新建」用） */
export async function clearAllStoredData(): Promise<void> {
  await del(IDB_STORE_KEY, customStore);
  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // ignore
  }
}

// 导出 idb-keyval 的 store 供 avatar.ts 复用（同库同 store）
export { customStore };
