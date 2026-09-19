import React, { useState, useEffect, useCallback, memo } from 'react';
import { useResumeStore } from '@/app/store/useResumeStore';
import { ModuleItem } from './ModuleItem';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus, Briefcase, GraduationCap, Code, Folder, Layers, X, Award, Languages, Heart, Star, FileText, Users } from 'lucide-react';
import { ModuleType } from '@/app/types/resume';
import { cn } from '@/app/lib/utils';

const moduleTypes: { type: ModuleType; label: string; icon: React.ReactNode }[] = [
  { type: 'experience', label: '工作经历', icon: <Briefcase size={20} /> },
  { type: 'education', label: '教育背景', icon: <GraduationCap size={20} /> },
  { type: 'skills', label: '技能特长', icon: <Code size={20} /> },
  { type: 'projects', label: '项目经历', icon: <Folder size={20} /> },
  { type: 'campus', label: '校园经历', icon: <Award size={20} /> },
  { type: 'honors', label: '荣誉奖项', icon: <Star size={20} /> },
  { type: 'custom', label: '自定义', icon: <Layers size={20} /> },
];

// 常用自定义模块快速入口
const quickModules: { label: string; icon: React.ReactNode }[] = [
  { label: '荣誉证书', icon: <Award size={16} /> },
  { label: '语言能力', icon: <Languages size={16} /> },
  { label: '兴趣爱好', icon: <Heart size={16} /> },
  { label: '自我评价', icon: <Star size={16} /> },
  { label: '校园经历', icon: <Users size={16} /> },
  { label: '发表论文', icon: <FileText size={16} /> },
];

interface ModuleListProps {
  /** 当前展开的模块 id（状态由 Sidebar 持有，步骤条与诊断面板共用） */
  expandedId: string | null;
  onExpand: (id: string | null) => void;
  /** 刚添加完模块：让 Sidebar 展开它并做「滚动定位 + 焦点进输入框」 */
  onModuleAdded: (id: string) => void;
  /** 需要「滚动定位 + 焦点进输入框」的模块 id（刚添加的模块） */
  autoFocusId: string | null;
}

export const ModuleList = memo(({ expandedId, onExpand, onModuleAdded, autoFocusId }: ModuleListProps) => {
  // 细粒度选择器
  const modules = useResumeStore(state => state.resumes[state.activeResumeId]?.modules || []);
  const reorderModules = useResumeStore(state => state.reorderModules);
  const addModule = useResumeStore(state => state.addModule);
  const [showAddModal, setShowAddModal] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (!showAddModal) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowAddModal(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showAddModal]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = modules.findIndex((m) => m.id === active.id);
      const newIndex = modules.findIndex((m) => m.id === over.id);
      reorderModules(arrayMove(modules, oldIndex, newIndex));
    }
  };

  /**
   * 统一去重判据：同名（纸面会出现两个一样的栏目标题）或同类型的固定模块已存在，即视为已添加。
   * 旧实现基础模块按 type、快捷模块按 title，导致「校园经历」能被添加两份。
   */
  const isAdded = useCallback((label: string, type: ModuleType) => (
    modules.some(m => m.title === label || (type !== 'custom' && m.type === type))
  ), [modules]);

  const handleAddModule = (type: ModuleType, label: string) => {
    if (isAdded(label, type)) return;
    addModule(type, label);
    setShowAddModal(false);
    // addModule 把新模块追加到末尾；addModule 是同步写入，直接读最新 state 拿 id
    const s = useResumeStore.getState();
    const list = s.resumes[s.activeResumeId]?.modules ?? [];
    const newId = list[list.length - 1]?.id;
    if (newId) onModuleAdded(newId);
  };

  return (
    <div className="space-y-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={modules.map(m => m.id)}
          strategy={verticalListSortingStrategy}
        >
          {modules.map((module) => (
            <ModuleItem
              key={module.id}
              module={module}
              expanded={expandedId === module.id}
              autoFocusFirst={autoFocusId === module.id}
              onExpand={() => onExpand(expandedId === module.id ? null : module.id)}
            />
          ))}
        </SortableContext>
      </DndContext>

      {/* Add Module Button */}
      <button
        onClick={() => setShowAddModal(true)}
        data-add-module
        className="w-full py-3 bg-white hover:bg-gray-50 border border-dashed border-gray-300 hover:border-blue-400 hover:text-blue-500 text-gray-500 rounded-lg shadow-sm font-medium flex items-center justify-center gap-2 transition-all group"
      >
        <div className="bg-gray-100 group-hover:bg-blue-100 p-1 rounded-full transition-colors">
          <Plus size={16} />
        </div>
        添加模块
      </button>

      {/* Add Module Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-label="添加简历模块"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setShowAddModal(false); }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-bold text-lg">添加简历模块</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-100 rounded-full transition-colors" aria-label="关闭">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* 基础模块 */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">基础模块</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {moduleTypes.map((item) => {
                    const added = isAdded(item.label, item.type);
                    return (
                      <button
                        key={item.type}
                        onClick={() => handleAddModule(item.type, item.label)}
                        disabled={added}
                        className={cn(
                          "flex flex-col items-center justify-center p-3 rounded-xl border transition-all text-center",
                          added
                            ? "bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed"
                            : "bg-white border-gray-200 hover:border-blue-500 hover:shadow-md hover:bg-blue-50/50"
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors",
                          added ? "bg-gray-200 text-gray-400" : "bg-blue-100 text-blue-600"
                        )}>
                          {item.icon}
                        </div>
                        <span className="font-medium text-xs text-gray-700">{item.label}</span>
                        {added && <span className="text-[10px] text-gray-400">(已添加)</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 快速添加常用模块 */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">常用自定义模块</h4>
                <div className="grid grid-cols-2 gap-2">
                  {quickModules.map((item) => {
                    const added = isAdded(item.label, 'custom');
                    return (
                      <button
                        key={item.label}
                        onClick={() => handleAddModule('custom', item.label)}
                        disabled={added}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2.5 rounded-lg border text-left transition-all",
                          added
                            ? "bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed"
                            : "bg-white border-gray-200 hover:border-blue-500 hover:bg-blue-50/50"
                        )}
                      >
                        <span className={added ? "text-gray-400" : "text-blue-500"}>{item.icon}</span>
                        <span className="font-medium text-sm text-gray-700">{item.label}</span>
                        {added && <span className="text-[10px] text-gray-400 ml-auto">(已添加)</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
ModuleList.displayName = 'ModuleList';
