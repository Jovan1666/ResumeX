import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  ResumeData,
  ResumeModule,
  TemplateId,
  ModuleType,
  ResumeItem,
  SkillItem,
  NewModuleItemType,
  ModuleItemType,
} from '@/app/types/resume';
import { emptyResumeData } from '@/app/data/initialData';
import { v4 as uuidv4 } from 'uuid';
import { GlobalSettings, ThemeColor } from '@/app/types/theme';
import { UndoRedoManager } from '@/app/hooks/useUndoRedo';
import {
  createResumeStorage,
  PersistedState,
  PERSIST_VERSION,
  isQuotaError,
  clearAllStoredData,
} from './storage';
import { isAvatarKey, deleteAvatar, cloneAvatar, migrateDataUrlAvatar } from './avatar';

// 每个简历独立的历史管理器，避免切换简历后撤销数据覆盖
const historyManagers = new Map<string, UndoRedoManager<ResumeData>>();
const getHistoryManager = (resumeId: string): UndoRedoManager<ResumeData> => {
  let manager = historyManagers.get(resumeId);
  if (!manager) {
    manager = new UndoRedoManager<ResumeData>(30);
    historyManagers.set(resumeId, manager);
  }
  return manager;
};

// 水合门闩：idb 加载完成前禁止 persist 写盘（防止用空 state 覆盖已有数据）
let _hydrated = false;
// 最近一次保存失败信息（UI 显示）
let _lastSaveError: string | null = null;

// 安全的深拷贝（兼容 immer Proxy 对象）
export function safeDeepClone<T>(obj: T): T {
  try {
    return structuredClone(obj);
  } catch {
    return JSON.parse(JSON.stringify(obj));
  }
}

/** 判断输入焦点是否在 input/textarea/select/contenteditable（快捷键用） */
export function isEditableTarget(el: EventTarget | null): boolean {
  if (!el) return false;
  const t = el as HTMLElement;
  return (
    t.tagName === 'INPUT' ||
    t.tagName === 'TEXTAREA' ||
    t.tagName === 'SELECT' ||
    t.isContentEditable
  );
}

// ---------------- 迁移表（persist version 3，逐字来自 02 §5.1 / §5.4） ----------------

/** 旧 TemplateId → 新 TemplateId 全表 */
export const TEMPLATE_ID_MIGRATE: Record<string, TemplateId> = {
  tech: 'techPlain',
  javaDev: 'techPlain',
  aiDev: 'techPlain',
  engineer: 'techPlain',
  industry: 'techPlain',
  aiRed: 'techPlain',
  javaBlue: 'techPlain',
  fePurple: 'techPlain',
  feGreen: 'techPlain',
  business: 'jobClean',
  operations: 'jobClean',
  opsOrange: 'jobClean',
  sales: 'jobClean',
  media: 'jobClean',
  minimal: 'atsMono',
  academic: 'atsMono',
  recruitBk: 'atsMono',
  eduDark: 'atsMono',
  enBw: 'enSimple',
  vibrant: 'campusClean',
  freshGrad: 'campusClean',
  generalRed: 'campusClean',
  gradBlue: 'campusClean',
  professional: 'compactSplit',
  twoColumnCompact: 'compactSplit',
  hr: 'navyBiz',
  accountant: 'navyBiz',
  medical: 'navyBiz',
  teacher: 'navyBiz',
  civilService: 'civilFile',
  civilGray: 'civilFile',
  timeline: 'jobClean',
  card: 'jobClean',
  infographic: 'jobClean',
  creative: 'jobClean',
  executive: 'jobClean',
};

/** 旧主题色 → 新主题色 */
export const THEME_COLOR_MIGRATE: Record<string, ThemeColor> = {
  'tech-orange': 'rust',
  'vibrant-red': 'rust',
  'warm-amber': 'rust',
  'elegant-gold': 'rust',
  'creative-purple': 'rust',
  'indigo-data': 'rust',
  'business-blue': 'navy',
  'pro-blue': 'navy',
  'navy-compact': 'navy',
  'fresh-teal': 'navy',
  'minimal-bw': 'ink',
  'emerald-green': 'pine',
};

/** 8 套默认模板 → 主题（02 §5.4） */
export const TEMPLATE_THEME: Record<TemplateId, ThemeColor> = {
  campusClean: 'campus',
  jobClean: 'navy',
  navyBiz: 'navy',
  civilFile: 'ink',
  techPlain: 'slate',
  atsMono: 'ink',
  compactSplit: 'navy',
  enSimple: 'ink',
};

/** 单人简历数据迁移：模板、主题、字段补齐 */
function migrateResumeData(r: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...r };

  // 模板 id：旧 id → 新 id；未知/缺失 → campusClean
  const rawTemplate = out.template as string | undefined;
  out.template = (rawTemplate && TEMPLATE_ID_MIGRATE[rawTemplate]) || 'campusClean';

  // 主题：旧 → 新；未知 → 按模板默认
  const settings = { ...((out.settings ?? {}) as Record<string, unknown>) };
  const oldTheme = settings.themeColor as string | undefined;
  settings.themeColor =
    (oldTheme && THEME_COLOR_MIGRATE[oldTheme]) ||
    TEMPLATE_THEME[out.template as TemplateId] ||
    'ink';
  out.settings = settings;

  // profile 补齐
  const profile = { ...((out.profile ?? {}) as Record<string, unknown>) };
  if (!Array.isArray(profile.customFields)) profile.customFields = [];
  out.profile = profile;

  // 模块 items 补齐 + 新字段默认值（titleStyle/bulletStyle/columns/titleOverride 均可选）
  if (Array.isArray(out.modules)) {
    out.modules = (out.modules as Record<string, unknown>[]).map((m) => ({
      ...m,
      items: Array.isArray(m.items) ? m.items : [],
    }));
  } else {
    out.modules = [];
  }

  // 全局设置新字段默认值
  const st = (out.settings ?? {}) as Record<string, unknown>;
  if (typeof st.moduleGap !== 'number') st.moduleGap = 6;
  if (typeof st.privacyBlur !== 'boolean') st.privacyBlur = false;
  if (!st.photoPosition) st.photoPosition = 'right';
  if (!st.photoShape) st.photoShape = 'rect';
  if (!st.photoSize) st.photoSize = 'md';
  if (st.splitWidth !== 25 && st.splitWidth !== 30 && st.splitWidth !== 35) st.splitWidth = 25;
  if (!st.splitColor) st.splitColor = '#FAFAFA';
  out.settings = st;

  // 照片：> 20KB 的旧 dataURL 丢弃（避免撑爆存储并提示重新上传）
  const av = profile.avatar as string | undefined;
  if (av && !isAvatarKey(av) && av.startsWith('data:') && av.length > 20 * 1024) {
    profile.avatar = '';
    out.profile = profile;
  }

  return out;
}

/** persist migrate：把信封 state 升级到 version 3 */
function migratePersistedState(persisted: unknown): PersistedState {
  const state = persisted as Partial<PersistedState> | null;
  if (!state || typeof state !== 'object' || !state.resumes) {
    return { resumes: {}, activeResumeId: '' };
  }
  const resumes: Record<string, ResumeData> = {};
  for (const [id, raw] of Object.entries(state.resumes as Record<string, unknown>)) {
    if (!raw || typeof raw !== 'object') continue;
    resumes[id] = migrateResumeData(raw as unknown as Record<string, unknown>) as unknown as ResumeData;
  }
  let activeResumeId = typeof state.activeResumeId === 'string' ? state.activeResumeId : '';
  if (!activeResumeId || !resumes[activeResumeId]) {
    activeResumeId = Object.keys(resumes)[0] ?? '';
  }
  return { resumes, activeResumeId };
}

// ---------------- 自定义异步 storage（IndexedDB） ----------------

const resumeStorage = createResumeStorage();

const storageAdapter: StateStorage = {
  // 同步 getItem 不走：主入口手动 hydrate（异步 idb）
  getItem: () => null,
  setItem: async (_name, value) => {
    if (!_hydrated) return; // 水合门闩：未加载完成不写盘
    try {
      const parsed = JSON.parse(value) as { state: PersistedState };
      await resumeStorage.save(parsed.state);
      _lastSaveError = null;
      useResumeStore.setState({ saveStatus: 'saved' });
    } catch (e) {
      _lastSaveError = isQuotaError(e)
        ? '保存失败：存储空间不足，请导出备份'
        : `保存失败：${String((e as Error)?.message ?? e)}`;
      console.error('[persist] 保存失败：', e);
      useResumeStore.setState({ saveStatus: 'error' });
    }
  },
  removeItem: async () => {
    try {
      await clearAllStoredData();
    } catch {
      // 忽略
    }
  },
};

// ---------------- Store ----------------

interface ResumeState {
  resumes: Record<string, ResumeData>;
  activeResumeId: string;

  hydrationPending: boolean;
  hydrationError: string | null;
  saveStatus: 'idle' | 'dirty' | 'saving' | 'saved' | 'error';
  canUndo: boolean;
  canRedo: boolean;

  setActiveResume: (id: string) => void;
  addResume: () => void;
  deleteResume: (id: string) => void;
  updateResume: (id: string, data: Partial<ResumeData>) => void;

  duplicateResume: (id: string) => void;
  addResumeFromPreset: (templateId: TemplateId, moduleOrder?: { type: ModuleType; title: string }[]) => void;

  updateProfile: (field: keyof ResumeData['profile'], value: string) => void;
  updateSettings: (settings: Partial<GlobalSettings>) => void;
  setTemplate: (templateId: TemplateId) => void;
  addModule: (type: ModuleType, title: string) => void;
  removeModule: (moduleId: string) => void;
  updateModule: (moduleId: string, data: Partial<ResumeModule>) => void;
  reorderModules: (modules: ResumeModule[]) => void;
  addModuleItem: (moduleId: string, item: NewModuleItemType) => void;
  updateModuleItem: <K extends keyof ResumeItem | keyof SkillItem>(
    moduleId: string,
    itemId: string,
    field: K,
    value: string | number
  ) => void;
  removeModuleItem: (moduleId: string, itemId: string) => void;
  resetData: (id: string) => void;

  undo: () => void;
  redo: () => void;
  pushHistory: () => void;

  hydrate: () => Promise<void>;
  flushSave: () => Promise<boolean>;
}

/** 在变更前记录历史快照（与栈顶相等则跳过，防止重复），并同步 canUndo/canRedo */
function pushHistorySnapshot(get: () => ResumeState): boolean {
  const state = get();
  const resumeId = state.activeResumeId;
  const resume = state.resumes[resumeId];
  if (!resume) return false;
  const manager = getHistoryManager(resumeId);
  const snapshot = safeDeepClone(resume) as ResumeData;
  // 深比较（快照不大，30 条上限；JSON 字符串开销可接受）
  const snapshotJson = JSON.stringify(snapshot);
  if (manager.peekLastJson() === snapshotJson) return false;
  manager.push(snapshot);
  return true;
}

export const useResumeStore = create<ResumeState>()(
  persist(
    immer((set, get) => ({
      resumes: {},
      activeResumeId: '',
      hydrationPending: true,
      hydrationError: null,
      saveStatus: 'idle',
      canUndo: false,
      canRedo: false,

      setActiveResume: (id) => set((state) => {
        state.activeResumeId = id;
        state.canUndo = getHistoryManager(id).canUndo();
        state.canRedo = getHistoryManager(id).canRedo();
      }),

      addResume: () => {
        const newId = uuidv4();
        set((state) => {
          const fresh = emptyResumeData();
          fresh.id = newId;
          fresh.title = '未命名简历';
          fresh.lastModified = Date.now();
          state.resumes[newId] = fresh;
          state.activeResumeId = newId;
        });
      },

      deleteResume: (id) => {
        set((state) => {
          const resume = state.resumes[id];
          if (resume?.profile?.avatar && isAvatarKey(resume.profile.avatar)) {
            void deleteAvatar(resume.profile.avatar);
          }
          delete state.resumes[id];
          historyManagers.delete(id);

          if (state.activeResumeId === id) {
            const remainingIds = Object.keys(state.resumes);
            state.activeResumeId = remainingIds.length > 0 ? remainingIds[0] : '';
          }
          state.canUndo = getHistoryManager(state.activeResumeId).canUndo();
          state.canRedo = getHistoryManager(state.activeResumeId).canRedo();
        });
      },

      duplicateResume: (id) => {
        const state = get();
        const source = state.resumes[id];
        if (!source) return;
        const newId = uuidv4();
        const copy = safeDeepClone(source) as ResumeData;
        copy.id = newId;
        copy.title = `${source.title}（副本）`;
        copy.lastModified = Date.now();
        copy.modules.forEach((mod) => {
          mod.id = uuidv4();
          mod.items.forEach((item) => { (item as { id: string }).id = uuidv4(); });
        });
        // 照片 blob 克隆（异步，不阻塞内存写入）
        const srcAvatar = source.profile.avatar;
        if (srcAvatar && isAvatarKey(srcAvatar)) {
          void cloneAvatar(srcAvatar, newId).then((newKey) => {
            if (newKey) {
              useResumeStore.setState((s) => {
                const r = s.resumes[newId];
                if (r) (r.profile as { avatar: string }).avatar = newKey;
                return s;
              });
            }
          });
        }
        set((s) => {
          s.resumes[newId] = copy;
          s.activeResumeId = newId;
        });
      },

      addResumeFromPreset: (templateId, moduleOrder) => {
        const newId = uuidv4();
        set((state) => {
          const base = emptyResumeData();
          base.id = newId;
          base.title = '未命名简历';
          base.template = templateId;
          base.settings.themeColor = TEMPLATE_THEME[templateId] ?? 'ink';
          base.lastModified = Date.now();
          if (moduleOrder && moduleOrder.length > 0) {
            base.modules = moduleOrder.map((m) => ({
              id: uuidv4(),
              type: m.type,
              title: m.title,
              visible: true,
              items: [],
            } as ResumeModule));
          }
          state.resumes[newId] = base;
          state.activeResumeId = newId;
        });
      },

      updateResume: (id, data) => {
        set((state) => {
          const changed = pushHistorySnapshot(get);
          const resume = state.resumes[id];
          if (!resume) return;
          Object.assign(resume, data);
          resume.lastModified = Date.now();
          if (changed) {
            state.canUndo = getHistoryManager(state.activeResumeId).canUndo();
            state.canRedo = getHistoryManager(state.activeResumeId).canRedo();
          }
        });
      },

      updateProfile: (field, value) => {
        set((state) => {
          const changed = pushHistorySnapshot(get);
          const resume = state.resumes[state.activeResumeId];
          if (!resume) return;
          (resume.profile as Record<string, unknown>)[field as string] = value;
          resume.lastModified = Date.now();
          if (changed) {
            state.canUndo = getHistoryManager(state.activeResumeId).canUndo();
            state.canRedo = getHistoryManager(state.activeResumeId).canRedo();
          }
        });
      },

      updateSettings: (settings) => {
        set((state) => {
          const changed = pushHistorySnapshot(get);
          const resume = state.resumes[state.activeResumeId];
          if (!resume) return;
          Object.assign(resume.settings, settings);
          resume.lastModified = Date.now();
          if (changed) {
            state.canUndo = getHistoryManager(state.activeResumeId).canUndo();
            state.canRedo = getHistoryManager(state.activeResumeId).canRedo();
          }
        });
      },

      setTemplate: (templateId) => {
        set((state) => {
          const changed = pushHistorySnapshot(get);
          const resume = state.resumes[state.activeResumeId];
          if (!resume) return;
          resume.template = templateId;
          resume.settings.themeColor = TEMPLATE_THEME[templateId] ?? 'ink';
          resume.lastModified = Date.now();
          if (changed) {
            state.canUndo = getHistoryManager(state.activeResumeId).canUndo();
            state.canRedo = getHistoryManager(state.activeResumeId).canRedo();
          }
        });
      },

      addModule: (type, title) => {
        const newModule: ResumeModule = {
          id: uuidv4(),
          type,
          title,
          visible: true,
          items: [],
        } as ResumeModule;

        set((state) => {
          const changed = pushHistorySnapshot(get);
          const resume = state.resumes[state.activeResumeId];
          if (!resume) return;
          resume.modules.push(newModule);
          resume.lastModified = Date.now();
          if (changed) {
            state.canUndo = getHistoryManager(state.activeResumeId).canUndo();
            state.canRedo = getHistoryManager(state.activeResumeId).canRedo();
          }
        });
      },

      removeModule: (moduleId) => {
        set((state) => {
          const changed = pushHistorySnapshot(get);
          const resume = state.resumes[state.activeResumeId];
          if (!resume) return;
          const index = resume.modules.findIndex((m) => m.id === moduleId);
          if (index !== -1) resume.modules.splice(index, 1);
          resume.lastModified = Date.now();
          if (changed) {
            state.canUndo = getHistoryManager(state.activeResumeId).canUndo();
            state.canRedo = getHistoryManager(state.activeResumeId).canRedo();
          }
        });
      },

      updateModule: (moduleId, data) => {
        set((state) => {
          const changed = pushHistorySnapshot(get);
          const resume = state.resumes[state.activeResumeId];
          if (!resume) return;
          const module = resume.modules.find((m) => m.id === moduleId);
          if (module) Object.assign(module, data);
          resume.lastModified = Date.now();
          if (changed) {
            state.canUndo = getHistoryManager(state.activeResumeId).canUndo();
            state.canRedo = getHistoryManager(state.activeResumeId).canRedo();
          }
        });
      },

      reorderModules: (modules) => {
        set((state) => {
          const changed = pushHistorySnapshot(get);
          const resume = state.resumes[state.activeResumeId];
          if (!resume) return;
          resume.modules = modules;
          resume.lastModified = Date.now();
          if (changed) {
            state.canUndo = getHistoryManager(state.activeResumeId).canUndo();
            state.canRedo = getHistoryManager(state.activeResumeId).canRedo();
          }
        });
      },

      addModuleItem: (moduleId, item) => {
        const newItem = { ...item, id: (item as ModuleItemType).id || uuidv4() } as ModuleItemType;
        set((state) => {
          const changed = pushHistorySnapshot(get);
          const resume = state.resumes[state.activeResumeId];
          if (!resume) return;
          const module = resume.modules.find((m) => m.id === moduleId);
          if (module) (module.items as ModuleItemType[]).push(newItem);
          resume.lastModified = Date.now();
          if (changed) {
            state.canUndo = getHistoryManager(state.activeResumeId).canUndo();
            state.canRedo = getHistoryManager(state.activeResumeId).canRedo();
          }
        });
      },

      updateModuleItem: (moduleId, itemId, field, value) => {
        set((state) => {
          const changed = pushHistorySnapshot(get);
          const resume = state.resumes[state.activeResumeId];
          if (!resume) return;
          const module = resume.modules.find((m) => m.id === moduleId);
          if (!module) return;
          const item = module.items.find((i) => i.id === itemId);
          if (item) (item as Record<string, unknown>)[field as string] = value;
          resume.lastModified = Date.now();
          if (changed) {
            state.canUndo = getHistoryManager(state.activeResumeId).canUndo();
            state.canRedo = getHistoryManager(state.activeResumeId).canRedo();
          }
        });
      },

      removeModuleItem: (moduleId, itemId) => {
        set((state) => {
          const changed = pushHistorySnapshot(get);
          const resume = state.resumes[state.activeResumeId];
          if (!resume) return;
          const module = resume.modules.find((m) => m.id === moduleId);
          if (!module) return;
          const index = module.items.findIndex((i) => i.id === itemId);
          if (index !== -1) module.items.splice(index, 1);
          resume.lastModified = Date.now();
          if (changed) {
            state.canUndo = getHistoryManager(state.activeResumeId).canUndo();
            state.canRedo = getHistoryManager(state.activeResumeId).canRedo();
          }
        });
      },

      resetData: (id) => {
        set((state) => {
          if (!state.resumes[id]) return;
          const title = state.resumes[id].title;
          const fresh = emptyResumeData();
          state.resumes[id] = {
            ...fresh,
            id,
            title,
            lastModified: Date.now(),
          };
        });
        historyManagers.delete(id);
      },

      // --- Undo/Redo（每个简历独立历史栈） ---
      pushHistory: () => {
        pushHistorySnapshot(get);
      },

      undo: () => {
        const state = get();
        const resumeId = state.activeResumeId;
        const current = state.resumes[resumeId];
        if (!current) return;
        const manager = getHistoryManager(resumeId);
        const prev = manager.undo(safeDeepClone(current) as ResumeData);
        if (prev) {
          set((s) => {
            s.resumes[s.activeResumeId] = prev as ResumeData;
            s.canUndo = manager.canUndo();
            s.canRedo = manager.canRedo();
          });
        }
      },

      redo: () => {
        const state = get();
        const resumeId = state.activeResumeId;
        const current = state.resumes[resumeId];
        if (!current) return;
        const manager = getHistoryManager(resumeId);
        const next = manager.redo(safeDeepClone(current) as ResumeData);
        if (next) {
          set((s) => {
            s.resumes[s.activeResumeId] = next as ResumeData;
            s.canUndo = manager.canUndo();
            s.canRedo = manager.canRedo();
          });
        }
      },

      hydrate: async () => {
        try {
          const state = await resumeStorage.load();
          const migrated = migratePersistedState(state ?? { resumes: {}, activeResumeId: '' });

          // 旧 dataURL 头像 → idb blob（全部迁移完再写回，避免半截状态）
          const avatarMigrations: Promise<void>[] = [];
          for (const [id, resume] of Object.entries(migrated.resumes)) {
            const av = resume.profile?.avatar;
            if (av && !isAvatarKey(av)) {
              avatarMigrations.push(
                migrateDataUrlAvatar(av, id).then((newKey) => {
                  if (newKey) {
                    useResumeStore.setState((s) => {
                      const r = s.resumes[id];
                      if (r) (r.profile as { avatar: string }).avatar = newKey;
                      return s;
                    });
                  }
                })
              );
            }
          }

          set((s) => {
            s.resumes = migrated.resumes;
            s.activeResumeId = migrated.activeResumeId;
            s.hydrationPending = false;
            s.canUndo = getHistoryManager(s.activeResumeId).canUndo();
            s.canRedo = getHistoryManager(s.activeResumeId).canRedo();
          });
          _hydrated = true;

          await Promise.all(avatarMigrations);
        } catch (e) {
          console.error('[store] hydrate 失败：', e);
          set((s) => {
            s.hydrationError = String((e as Error)?.message ?? e);
            s.hydrationPending = false;
          });
        }
      },

      flushSave: async () => {
        const state = get();
        try {
          await resumeStorage.save({
            resumes: state.resumes,
            activeResumeId: state.activeResumeId,
          });
          set((s) => { s.saveStatus = 'saved'; });
          return true;
        } catch (e) {
          _lastSaveError = String((e as unknown as Error)?.message ?? e);
          set((s) => { s.saveStatus = 'error'; });
          return false;
        }
      },
    })),
    {
      name: 'resume-storage',
      version: PERSIST_VERSION,
      storage: createJSONStorage(() => storageAdapter),
      skipHydration: true,
      partialize: (state) => ({
        resumes: state.resumes,
        activeResumeId: state.activeResumeId,
      } as PersistedState),
    }
  )
);

/** 暴露最近一次保存错误（给 UI 顶栏红点） */
export function getLastSaveError(): string | null {
  return _lastSaveError;
}

/** 再导出一份（供测试） */
export { resumeStorage };
