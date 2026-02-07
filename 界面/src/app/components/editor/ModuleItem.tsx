import React, { useState, memo } from 'react';
import { useResumeStore } from '@/app/store/useResumeStore';
import { 
  ResumeModule, 
  ModuleType, 
  isSkillsModule, 
  SkillItem, 
  ResumeItem,
  ModuleItemType
} from '@/app/types/resume';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  GripVertical, ChevronDown, ChevronRight, Eye, EyeOff, Trash2, 
  Briefcase, GraduationCap, Code, Folder, Layers, Plus, Copy, X,
  ArrowUp, ArrowDown, BookOpen, ChevronLeft
} from 'lucide-react';
import { DatePicker } from './DatePicker';
import { DebouncedInput, DebouncedTextarea } from './DebouncedInput';
import { cn } from '@/app/lib/utils';
import { getExamplesForModule } from '@/app/data/contentExamples';

// 描述输入框 placeholder 按模块类型分类
const descriptionPlaceholders: Record<ModuleType, string> = {
  experience: '请描述工作职责和成果，如:\n• 主导XX系统开发，日均处理XX请求\n• 优化XX性能，提升XX%',
  projects: '请描述项目背景、你的角色和技术成果',
  education: '可填写 GPA、奖学金、主修课程、社团活动等',
  skills: '',
  custom: '请填写相关内容',
};

// 描述输入框 + 范例查看组件
const DescriptionWithExamples: React.FC<{
  moduleType: ModuleType;
  value: string;
  onChange: (val: string) => void;
}> = ({ moduleType, value, onChange }) => {
  const [showExamples, setShowExamples] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const examples = getExamplesForModule(moduleType);

  const handleInsert = (text: string) => {
    onChange(value ? `${value}\n${text}` : text);
    setShowExamples(false);
    setSelectedCategory(null);
  };

  return (
    <div className="relative">
      <DebouncedTextarea 
        className="w-full p-2 bg-white border border-gray-300 rounded text-sm h-24 resize-y focus:border-blue-500 outline-none"
        placeholder={descriptionPlaceholders[moduleType] || '请填写相关内容'}
        value={value}
        onChange={onChange}
        delay={250}
      />
      <div className="flex justify-between items-center mt-1">
        <div className="text-[10px] text-gray-400">
          {value?.length || 0} 字
        </div>
        {examples.length > 0 && (
          <button
            type="button"
            onClick={() => { setShowExamples(!showExamples); setSelectedCategory(null); }}
            className="text-[10px] text-blue-500 hover:text-blue-700 font-medium flex items-center gap-0.5"
          >
            <BookOpen size={10} />
            {showExamples ? '收起范例' : '查看范例'}
          </button>
        )}
      </div>

      {/* 范例面板 */}
      {showExamples && (
        <div className="mt-2 border border-blue-200 rounded-lg bg-blue-50/50 overflow-hidden">
          {!selectedCategory ? (
            // 分类列表
            <div className="p-2 space-y-1">
              <p className="text-[10px] text-gray-500 font-medium px-1 mb-1">选择岗位分类查看参考范文：</p>
              {examples.map((cat) => (
                <button
                  key={cat.category}
                  onClick={() => setSelectedCategory(cat.category)}
                  className="w-full text-left px-2.5 py-1.5 text-xs text-gray-700 hover:bg-blue-100 rounded flex justify-between items-center"
                >
                  <span>{cat.category}</span>
                  <ChevronRight size={12} className="text-gray-400" />
                </button>
              ))}
            </div>
          ) : (
            // 范文列表
            <div className="p-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-[10px] text-blue-500 hover:text-blue-700 flex items-center gap-0.5 mb-2"
              >
                <ChevronLeft size={10} />
                返回分类
              </button>
              <div className="space-y-2">
                {examples
                  .find((c) => c.category === selectedCategory)
                  ?.examples.map((ex, idx) => (
                    <div key={idx} className="bg-white rounded border border-gray-200 p-2">
                      <pre className="text-[11px] text-gray-600 whitespace-pre-wrap leading-relaxed mb-2 max-h-32 overflow-y-auto">
                        {ex}
                      </pre>
                      <button
                        onClick={() => handleInsert(ex)}
                        className="text-[10px] bg-blue-500 hover:bg-blue-600 text-white px-2 py-0.5 rounded font-medium"
                      >
                        插入此范例
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Icons map
const moduleIcons: Record<ModuleType, React.ReactNode> = {
  experience: <Briefcase size={16} />,
  education: <GraduationCap size={16} />,
  skills: <Code size={16} />,
  projects: <Folder size={16} />,
  custom: <Layers size={16} />,
};

interface ModuleItemProps {
  module: ResumeModule;
  expanded: boolean;
  onExpand: () => void;
}

export const ModuleItem = memo(({ module, expanded, onExpand }: ModuleItemProps) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  // 细粒度选择器：仅订阅 actions，不订阅 resumes 数据
  const removeModule = useResumeStore(state => state.removeModule);
  const updateModule = useResumeStore(state => state.updateModule);
  const addModuleItem = useResumeStore(state => state.addModuleItem);
  const updateModuleItem = useResumeStore(state => state.updateModuleItem);
  const removeModuleItem = useResumeStore(state => state.removeModuleItem);

  // 移动条目顺序
  const moveItem = (itemId: string, direction: 'up' | 'down') => {
    const currentItems = [...module.items] as ModuleItemType[];
    const index = currentItems.findIndex(item => item.id === itemId);
    if (index === -1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= currentItems.length) return;
    
    // 交换位置
    [currentItems[index], currentItems[newIndex]] = [currentItems[newIndex], currentItems[index]];
    updateModule(module.id, { items: currentItems } as Partial<ResumeModule>);
  };

  // 复制条目
  const duplicateItem = (itemId: string) => {
    const item = module.items.find(i => i.id === itemId);
    if (item) {
      // 移除 id 以便生成新的
      const { id: _, ...itemWithoutId } = item;
      addModuleItem(module.id, itemWithoutId as typeof item);
    }
  };

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: module.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleToggleVisibility = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateModule(module.id, { visible: !module.visible });
  };

  const handleDeleteModule = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={cn(
        "bg-white rounded-lg border border-gray-200 shadow-sm transition-all mb-3",
        isDragging && "shadow-xl ring-2 ring-blue-500 bg-blue-50"
      )}
    >
      {/* Header */}
      <div 
        className="flex items-center p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors rounded-t-lg"
        onClick={onExpand}
      >
        <div {...attributes} {...listeners} className="cursor-move text-gray-400 hover:text-gray-600 mr-2 p-1">
          <GripVertical size={14} />
        </div>
        
        <div className="text-gray-500 mr-2">
          {moduleIcons[module.type] || <Layers size={16} />}
        </div>
        
        <span className="font-medium text-gray-700 flex-1">{module.title}</span>

        <div className="flex items-center gap-1">
          <button 
            onClick={handleToggleVisibility}
            className={cn("p-1.5 rounded hover:bg-gray-200 transition-colors", module.visible ? "text-gray-600" : "text-gray-400")}
            title={module.visible ? "隐藏模块" : "显示模块"}
          >
            {module.visible ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
          
          <button 
            onClick={handleDeleteModule}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
            title="删除模块"
          >
            <Trash2 size={14} />
          </button>

          <div className="p-1.5 text-gray-400">
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>
        </div>
      </div>

      {/* Body */}
      {expanded && (
        <div className="p-4 border-t border-gray-100 animate-in slide-in-from-top-2 duration-200">
          <div className="mb-4">
            <label className="text-xs text-gray-500 font-medium block mb-1">模块标题</label>
            <DebouncedInput 
              className="w-full p-2 border border-gray-300 rounded text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" 
              value={module.title}
              onChange={(val) => updateModule(module.id, { title: val })}
              delay={300}
            />
          </div>

          <div className="space-y-3">
            {module.items.map((item: ModuleItemType, index: number) => (
              <div key={item.id} className="relative p-3 border border-gray-200 rounded-md bg-gray-50 group hover:border-blue-300 transition-colors">
                {/* 操作按钮 */}
                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => moveItem(item.id, 'up')}
                    disabled={index === 0}
                    className="p-1 text-gray-400 hover:text-blue-500 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="上移"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button 
                    onClick={() => moveItem(item.id, 'down')}
                    disabled={index === module.items.length - 1}
                    className="p-1 text-gray-400 hover:text-blue-500 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="下移"
                  >
                    <ArrowDown size={14} />
                  </button>
                  <button 
                    onClick={() => duplicateItem(item.id)}
                    className="p-1 text-gray-400 hover:text-green-500"
                    title="复制"
                  >
                    <Copy size={14} />
                  </button>
                  <button 
                    onClick={() => removeModuleItem(module.id, item.id)}
                    className="p-1 text-gray-400 hover:text-red-500"
                    title="删除"
                  >
                    <X size={14} />
                  </button>
                </div>

                {isSkillsModule(module) ? (
                  <div className="pr-24">
                    <DebouncedInput 
                      className="w-full p-1.5 bg-white border border-gray-300 rounded text-sm focus:border-blue-500 outline-none" 
                      placeholder="技能名称"
                      value={(item as SkillItem).name}
                      onChange={(val) => updateModuleItem(module.id, item.id, 'name', val)}
                      delay={250}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(() => {
                      const resumeItem = item as ResumeItem;
                      return (
                        <>
                          <div className="pr-24">
                            <DebouncedInput 
                              className="w-full p-1.5 bg-white border border-gray-300 rounded text-sm font-medium focus:border-blue-500 outline-none" 
                              placeholder={module.type === 'education' ? '学历 / 专业' : '职位名称'}
                              value={resumeItem.title}
                              onChange={(val) => updateModuleItem(module.id, item.id, 'title', val)}
                              delay={250}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <DebouncedInput 
                              className="w-full p-1.5 bg-white border border-gray-300 rounded text-sm focus:border-blue-500 outline-none" 
                              placeholder={module.type === 'education' ? '学校名称' : '公司名称'}
                              value={resumeItem.subtitle}
                              onChange={(val) => updateModuleItem(module.id, item.id, 'subtitle', val)}
                              delay={250}
                            />
                            <div className="flex gap-1">
                              <DatePicker
                                value={resumeItem.startDate || (resumeItem.date ? resumeItem.date.split(' - ')[0] : '') || ''}
                                onChange={(v) => {
                                  const endDate = resumeItem.endDate || (resumeItem.date ? resumeItem.date.split(' - ')[1] : '') || '';
                                  const newDate = endDate ? `${v} - ${endDate}` : v;
                                  updateModuleItem(module.id, item.id, 'date', newDate);
                                  updateModuleItem(module.id, item.id, 'startDate', v);
                                }}
                                placeholder="开始"
                                allowPresent={false}
                                className="flex-1"
                              />
                              <span className="self-center text-gray-400 text-xs">-</span>
                              <DatePicker
                                value={resumeItem.endDate || (resumeItem.date ? resumeItem.date.split(' - ')[1] : '') || ''}
                                onChange={(v) => {
                                  const startDate = resumeItem.startDate || (resumeItem.date ? resumeItem.date.split(' - ')[0] : '') || '';
                                  const newDate = startDate ? `${startDate} - ${v}` : v;
                                  updateModuleItem(module.id, item.id, 'date', newDate);
                                  updateModuleItem(module.id, item.id, 'endDate', v);
                                }}
                                placeholder="结束"
                                allowPresent={true}
                                className="flex-1"
                              />
                            </div>
                          </div>
                          <DebouncedInput 
                            className="w-full p-1.5 bg-white border border-gray-300 rounded text-sm focus:border-blue-500 outline-none" 
                            placeholder="地点 (选填)"
                            value={resumeItem.location || ''}
                            onChange={(val) => updateModuleItem(module.id, item.id, 'location', val)}
                            delay={250}
                          />
                          <DescriptionWithExamples
                            moduleType={module.type}
                            value={resumeItem.description}
                            onChange={(val) => updateModuleItem(module.id, item.id, 'description', val)}
                          />
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            ))}
          </div>

          <button 
            onClick={() => addModuleItem(module.id, module.type === 'skills' ? { name: '' } : { title: '', subtitle: '', date: '', description: '' })}
            className="w-full mt-4 py-2 border border-dashed border-blue-300 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
          >
            <Plus size={16} />
            添加{module.type === 'skills' ? '技能' : '一条'}
          </button>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-white rounded-xl p-5 shadow-2xl max-w-xs mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-800 mb-2">确认删除</h3>
            <p className="text-sm text-gray-500 mb-4">
              确定要删除「{module.title}」模块吗？此操作不可撤销。
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium">取消</button>
              <button onClick={() => { removeModule(module.id); setShowDeleteConfirm(false); }} className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium">删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
ModuleItem.displayName = 'ModuleItem';
