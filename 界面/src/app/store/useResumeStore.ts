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

// Undo/Redo 历史管理器（store 外部实例，不被持久化）
const historyManager = new UndoRedoManager<ResumeData>(30);
let _skipHistory = false;

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
          state.resumes[newId] = { 
            ...initialResumeData, 
            id: newId, 
            title: "未命名简历", 
            lastModified: Date.now() 
          };
          state.activeResumeId = newId;
        });
      },

      deleteResume: (id) => {
        set((state) => {
          delete state.resumes[id];
          
          // If active resume is deleted, switch to another one or create new
          if (state.activeResumeId === id) {
            const remainingIds = Object.keys(state.resumes);
            if (remainingIds.length > 0) {
              state.activeResumeId = remainingIds[0];
            } else {
              // Create new if all deleted
              const freshId = uuidv4();
              state.resumes[freshId] = { 
                ...initialResumeData, 
                id: freshId, 
                lastModified: Date.now() 
              };
              state.activeResumeId = freshId;
            }
          }
        });
      },

      duplicateResume: (id) => {
        const newId = uuidv4();
        set((state) => {
          const source = state.resumes[id];
          if (!source) return;
          const copy = structuredClone(source) as ResumeData;
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
          const base = structuredClone(initialResumeData) as ResumeData;
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
          Object.assign(state.resumes[id], data);
          state.resumes[id].lastModified = Date.now();
        });
      },

      // --- Helpers for Active Resume ---

      updateProfile: (field, value) => {
        set((state) => {
          const resume = state.resumes[state.activeResumeId];
          resume.profile[field] = value;
          resume.lastModified = Date.now();
        });
      },

      updateSettings: (settings) => {
        set((state) => {
          const resume = state.resumes[state.activeResumeId];
          Object.assign(resume.settings, settings);
          resume.lastModified = Date.now();
        });
      },

      setTemplate: (templateId) => {
        set((state) => {
          const resume = state.resumes[state.activeResumeId];
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
          resume.modules.push(newModule);
          resume.lastModified = Date.now();
        });
      },

      removeModule: (moduleId) => {
        set((state) => {
          const resume = state.resumes[state.activeResumeId];
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
          resume.modules = modules;
          resume.lastModified = Date.now();
        });
      },

      addModuleItem: (moduleId, item) => {
        const newItem = { ...item, id: (item as ModuleItemType).id || uuidv4() } as ModuleItemType;
        set((state) => {
          const resume = state.resumes[state.activeResumeId];
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
          const title = state.resumes[id].title;
          state.resumes[id] = { 
            ...initialResumeData, 
            id, 
            title, 
            lastModified: Date.now() 
          };
        });
      },

      // --- Undo/Redo ---
      pushHistory: () => {
        const state = get();
        const resume = state.resumes[state.activeResumeId];
        if (resume) {
          historyManager.push(structuredClone(resume) as ResumeData);
        }
      },

      undo: () => {
        const state = get();
        const current = state.resumes[state.activeResumeId];
        if (!current) return;
        const prev = historyManager.undo(structuredClone(current) as ResumeData);
        if (prev) {
          _skipHistory = true;
          set((s) => {
            s.resumes[s.activeResumeId] = prev as ResumeData;
          });
          _skipHistory = false;
        }
      },

      redo: () => {
        const state = get();
        const current = state.resumes[state.activeResumeId];
        if (!current) return;
        const next = historyManager.redo(structuredClone(current) as ResumeData);
        if (next) {
          _skipHistory = true;
          set((s) => {
            s.resumes[s.activeResumeId] = next as ResumeData;
          });
          _skipHistory = false;
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
