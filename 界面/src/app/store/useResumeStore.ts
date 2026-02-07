import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { 
  ResumeData, 
  ResumeModule, 
  TemplateId, 
  ModuleType,
  ResumeItem,
  SkillItem,
  NewModuleItemType,
  ModuleItemType
} from '@/app/types/resume';
import { initialResumeData } from '@/app/data/initialData';
import { v4 as uuidv4 } from 'uuid';
import { GlobalSettings } from '@/app/types/theme';
import { UndoRedoManager } from '@/app/hooks/useUndoRedo';

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
// 使用时间戳标记跳过历史记录：undo/redo 后 2 秒内的 pushHistory 被忽略
// 这比简单的 boolean 标志更可靠，因为 pushHistory 是 debounced 1 秒后触发的
let _skipHistoryUntil = 0;

// 安全的深拷贝（兼容 immer Proxy 对象）
function safeDeepClone<T>(obj: T): T {
  try {
    return structuredClone(obj);
  } catch {
    return JSON.parse(JSON.stringify(obj));
  }
}

interface ResumeState {
  resumes: Record<string, ResumeData>;
  activeResumeId: string;
  
  // Actions
  setActiveResume: (id: string) => void;
  addResume: () => void;
  deleteResume: (id: string) => void;
  updateResume: (id: string, data: Partial<ResumeData>) => void;
  
  // Resume Management
  duplicateResume: (id: string) => void;
  addResumeFromPreset: (templateId: TemplateId, moduleOrder?: { type: ModuleType; title: string }[]) => void;

  // Active Resume Helpers
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
  
  // Undo/Redo
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;
}

export const useResumeStore = create<ResumeState>()(
  persist(
    immer((set, get) => ({
      resumes: {
        [initialResumeData.id]: initialResumeData
      },
      activeResumeId: initialResumeData.id,

      setActiveResume: (id) => set((state) => {
        state.activeResumeId = id;
      }),

      addResume: () => {
        const newId = uuidv4();
        set((state) => {
          // 使用深拷贝避免嵌套对象共享引用
          const fresh = safeDeepClone(initialResumeData);
          fresh.id = newId;
          fresh.title = "未命名简历";
          fresh.lastModified = Date.now();
          state.resumes[newId] = fresh;
          state.activeResumeId = newId;
        });
      },

      deleteResume: (id) => {
        set((state) => {
          delete state.resumes[id];
          // 清理对应的历史管理器
          historyManagers.delete(id);
          
          // 如果删除的是当前活动简历，切换到另一份
          if (state.activeResumeId === id) {
            const remainingIds = Object.keys(state.resumes);
            if (remainingIds.length > 0) {
              state.activeResumeId = remainingIds[0];
            } else {
              // 所有简历都被删除了，清空 activeResumeId
              // 仪表盘会显示"还没有简历"的空状态
              state.activeResumeId = '';
            }
          }
        });
      },

      duplicateResume: (id) => {
        const newId = uuidv4();
        set((state) => {
          const source = state.resumes[id];
          if (!source) return;
          const copy = safeDeepClone(source) as ResumeData;
          copy.id = newId;
          copy.title = `${source.title}（副本）`;
          copy.lastModified = Date.now();
          // 为所有模块和条目生成新 ID，避免冲突
          copy.modules.forEach(mod => {
            mod.id = uuidv4();
            mod.items.forEach(item => { item.id = uuidv4(); });
          });
          state.resumes[newId] = copy;
          state.activeResumeId = newId;
        });
      },

      addResumeFromPreset: (templateId, moduleOrder) => {
        const newId = uuidv4();
        set((state) => {
          const base = safeDeepClone(initialResumeData) as ResumeData;
          base.id = newId;
          base.title = '未命名简历';
          base.template = templateId;
          base.lastModified = Date.now();
          // 如果提供了模块顺序，用预设替换默认模块
          if (moduleOrder && moduleOrder.length > 0) {
            base.modules = moduleOrder.map(m => ({
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
          const resume = state.resumes[id];
          if (!resume) return;
          Object.assign(resume, data);
          resume.lastModified = Date.now();
        });
      },

      // --- Helpers for Active Resume ---

      updateProfile: (field, value) => {
        set((state) => {
          const resume = state.resumes[state.activeResumeId];
          if (!resume) return;
          // 类型安全的赋值（profile 的字符串字段）
          (resume.profile as Record<string, unknown>)[field as string] = value;
          resume.lastModified = Date.now();
        });
      },

      updateSettings: (settings) => {
        set((state) => {
          const resume = state.resumes[state.activeResumeId];
          if (!resume) return;
          Object.assign(resume.settings, settings);
          resume.lastModified = Date.now();
        });
      },

      setTemplate: (templateId) => {
        set((state) => {
          const resume = state.resumes[state.activeResumeId];
          if (!resume) return;
          resume.template = templateId;
          resume.lastModified = Date.now();
        });
      },

      addModule: (type, title) => {
        const newModule: ResumeModule = {
          id: uuidv4(),
          type,
          title,
          visible: true,
          items: []
        } as ResumeModule;
        
        set((state) => {
          const resume = state.resumes[state.activeResumeId];
          if (!resume) return;
          resume.modules.push(newModule);
          resume.lastModified = Date.now();
        });
      },

      removeModule: (moduleId) => {
        set((state) => {
          const resume = state.resumes[state.activeResumeId];
          if (!resume) return;
          const index = resume.modules.findIndex(m => m.id === moduleId);
          if (index !== -1) {
            resume.modules.splice(index, 1);
          }
          resume.lastModified = Date.now();
        });
      },

      updateModule: (moduleId, data) => {
        set((state) => {
          const resume = state.resumes[state.activeResumeId];
          if (!resume) return;
          const module = resume.modules.find(m => m.id === moduleId);
          if (module) {
            Object.assign(module, data);
          }
          resume.lastModified = Date.now();
        });
      },

      reorderModules: (modules) => {
        set((state) => {
          const resume = state.resumes[state.activeResumeId];
          if (!resume) return;
          resume.modules = modules;
          resume.lastModified = Date.now();
        });
      },

      addModuleItem: (moduleId, item) => {
        const newItem = { ...item, id: (item as ModuleItemType).id || uuidv4() } as ModuleItemType;
        set((state) => {
          const resume = state.resumes[state.activeResumeId];
          if (!resume) return;
          const module = resume.modules.find(m => m.id === moduleId);
          if (module) {
            (module.items as ModuleItemType[]).push(newItem);
          }
          resume.lastModified = Date.now();
        });
      },

      updateModuleItem: (moduleId, itemId, field, value) => {
        set((state) => {
          const resume = state.resumes[state.activeResumeId];
          if (!resume) return;
          const module = resume.modules.find(m => m.id === moduleId);
          if (module) {
            const item = module.items.find(i => i.id === itemId);
            if (item) {
              (item as Record<string, unknown>)[field as string] = value;
            }
          }
          resume.lastModified = Date.now();
        });
      },

      removeModuleItem: (moduleId, itemId) => {
        set((state) => {
          const resume = state.resumes[state.activeResumeId];
          if (!resume) return;
          const module = resume.modules.find(m => m.id === moduleId);
          if (module) {
            const index = module.items.findIndex(i => i.id === itemId);
            if (index !== -1) {
              module.items.splice(index, 1);
            }
          }
          resume.lastModified = Date.now();
        });
      },

      resetData: (id) => {
        set((state) => {
          if (!state.resumes[id]) return;
          const title = state.resumes[id].title;
          const fresh = safeDeepClone(initialResumeData);
          state.resumes[id] = { 
            ...fresh, 
            id, 
            title, 
            lastModified: Date.now() 
          };
        });
        // 清空该简历的历史记录
        historyManagers.delete(id);
      },

      // --- Undo/Redo（每个简历独立历史栈） ---
      pushHistory: () => {
        // 如果当前在 undo/redo 的冷却期内（2秒），跳过 pushHistory
        // 这防止 undo/redo 导致的 resumeData 变化触发 debounced pushHistory 污染历史栈
        if (Date.now() < _skipHistoryUntil) return;
        const state = get();
        const resumeId = state.activeResumeId;
        const resume = state.resumes[resumeId];
        if (resume) {
          getHistoryManager(resumeId).push(safeDeepClone(resume) as ResumeData);
        }
      },

      undo: () => {
        const state = get();
        const resumeId = state.activeResumeId;
        const current = state.resumes[resumeId];
        if (!current) return;
        const manager = getHistoryManager(resumeId);
        const prev = manager.undo(safeDeepClone(current) as ResumeData);
        if (prev) {
          // 设置 2 秒冷却期，覆盖 EditorLayout 中 1 秒 debounce 的 pushHistory
          _skipHistoryUntil = Date.now() + 2000;
          set((s) => {
            s.resumes[s.activeResumeId] = prev as ResumeData;
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
          _skipHistoryUntil = Date.now() + 2000;
          set((s) => {
            s.resumes[s.activeResumeId] = next as ResumeData;
          });
        }
      }
    })),
    {
      name: 'resume-storage',
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // 校验 activeResumeId 是否指向存在的简历
        const resumeIds = Object.keys(state.resumes);
        if (resumeIds.length === 0) {
          // 没有简历，创建默认简历
          state.resumes = { [initialResumeData.id]: initialResumeData };
          state.activeResumeId = initialResumeData.id;
        } else if (!state.resumes[state.activeResumeId]) {
          // activeResumeId 指向不存在的简历，切换到第一个
          state.activeResumeId = resumeIds[0];
        }
      },
    }
  )
);
