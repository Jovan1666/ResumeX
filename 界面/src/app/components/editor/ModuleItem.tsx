import React, { useState, useRef, useEffect, memo } from 'react';
import { useResumeStore } from '@/app/store/useResumeStore';
import {
  ResumeModule,
  ResumeItem,
  SkillItem,
  ModuleItemType,
  ModuleType,
  isSkillsModule,
} from '@/app/types/resume';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical, ChevronDown, ChevronRight, Eye, EyeOff, Trash2,
  Briefcase, GraduationCap, Code, Folder, Layers, Plus, Copy, X,
  ArrowUp, ArrowDown, BookOpen, ChevronLeft, Award,
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
  campus: '请描述校园经历（社团、学生会、学术活动等）',
  honors: '请描述荣誉奖项（奖项名称、级别、时间）',
  skills: '',
  custom: '请填写相关内容',
};

// Icons map
const moduleIcons: Record<ModuleType, React.ReactNode> = {
  experience: <Briefcase size={16} />,
  education: <GraduationCap size={16} />,
  skills: <Code size={16} />,
  projects: <Folder size={16} />,
  campus: <GraduationCap size={16} />,
  honors: <Award size={16} />,
  custom: <Layers size={16} />,
};

/** 把 date 字段（兼容旧数据「2020.09 - 2024.06」）拆成起止 */
function splitDate(item: ResumeItem): { start: string; end: string } {
  if (item.startDate || item.endDate) {
    return { start: item.startDate ?? '', end: item.endDate ?? '' };
  }
  if (!item.date) return { start: '', end: '' };
  if (item.date.includes(' - ')) {
    const [s, e] = item.date.split(' - ');
    return { start: s?.trim() ?? '', end: e?.trim() ?? '' };
  }
  return { start: item.date, end: '' };
}

/** 起止 → date 文案（纸面渲染用） */
function joinDate(start: string, end: string): string {
  if (start && end) return `${start} - ${end}`;
  return start || end;
}

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

interface ModuleItemProps {
  module: ResumeModule;
  expanded: boolean;
  onExpand: () => void;
  /** 刚添加的模块：滚动定位并把焦点送到第一个输入框 */
  autoFocusFirst?: boolean;
}

export const ModuleItem = memo(({ module, expanded, onExpand, autoFocusFirst }: ModuleItemProps) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  // 条目删除二次确认（内联，不弹窗）
  const [confirmItemId, setConfirmItemId] = useState<string | null>(null);
  const [focusItemId, setFocusItemId] = useState<string | null>(null);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const itemsRef = useRef<HTMLDivElement>(null);

  const removeModule = useResumeStore(state => state.removeModule);
  const updateModule = useResumeStore(state => state.updateModule);
  const addModuleItem = useResumeStore(state => state.addModuleItem);
  const updateModuleItem = useResumeStore(state => state.updateModuleItem);
  const removeModuleItem = useResumeStore(state => state.removeModuleItem);

  const isSkill = isSkillsModule(module);

  // 新模块：滚动到视口 + 焦点进标题输入框（输入原语未套 forwardRef，用 DOM 查询）
  useEffect(() => {
    if (!autoFocusFirst || !expanded) return;
    rootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const timer = setTimeout(() => {
      rootRef.current?.querySelector<HTMLInputElement>('[data-autofocus="module-title"]')?.focus();
    }, 220);
    return () => clearTimeout(timer);
  }, [autoFocusFirst, expanded]);

  // 新增条目：焦点进该条目第一个输入框（用 DOM 查询，避免给输入原语套 forwardRef）
  useEffect(() => {
    if (!focusItemId) return;
    const el = itemsRef.current?.querySelector<HTMLElement>(
      `[data-item-id="${focusItemId}"] input, [data-item-id="${focusItemId}"] textarea`
    );
    el?.focus();
    setFocusItemId(null);
  }, [focusItemId, module.items]);

  const moveItem = (itemId: string, direction: 'up' | 'down') => {
    const currentItems = [...module.items] as ModuleItemType[];
    const index = currentItems.findIndex(item => item.id === itemId);
    if (index === -1) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= currentItems.length) return;
    [currentItems[index], currentItems[newIndex]] = [currentItems[newIndex], currentItems[index]];
    updateModule(module.id, { items: currentItems } as Partial<ResumeModule>);
  };

  const duplicateItem = (itemId: string) => {
    const item = module.items.find(i => i.id === itemId);
    if (!item) return;
    const { id: _drop, ...itemWithoutId } = item;
    addModuleItem(module.id, itemWithoutId as typeof item);
  };

  const addItem = () => {
    addModuleItem(
      module.id,
      isSkill ? { name: '' } : { title: '', subtitle: '', date: '', description: '' }
    );
    // 新条目 id 由 store 生成，从最新 state 里取最后一个
    const s = useResumeStore.getState();
    const latest = s.resumes[s.activeResumeId]?.modules.find(m => m.id === module.id);
    const lastItem = latest?.items[latest.items.length - 1];
    if (lastItem) setFocusItemId(lastItem.id);
  };

  /**
   * 起止日期合并为一次提交：同时写 startDate/endDate + date 文案。
   * （旧实现连着发两个 store action，用户撤销一次要点两下）
   */
  const commitDate = (item: ResumeItem, side: 'start' | 'end', value: string) => {
    const cur = splitDate(item);
    const next = side === 'start'
      ? { start: value, end: cur.end }
      : { start: cur.start, end: value };
    const items = (module.items as ModuleItemType[]).map(i =>
      i.id === item.id
        ? { ...i, startDate: next.start, endDate: next.end, date: joinDate(next.start, next.end) }
        : i
    );
    updateModule(module.id, { items } as Partial<ResumeModule>);
  };

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: module.id });

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
      ref={(node) => {
        setNodeRef(node);
        rootRef.current = node;
      }}
      style={style}
      data-module-id={module.id}
      data-module-type={module.type}
      className={cn(
        "bg-white rounded-lg border border-gray-200 shadow-sm transition-all mb-3",
        isDragging && "shadow-xl ring-2 ring-blue-500 bg-blue-50"
      )}
    >
      {/* Header */}
      <div className="flex items-center p-2 pl-1 bg-gray-50 rounded-t-lg">
        <div {...attributes} {...listeners} className="cursor-move text-gray-400 hover:text-gray-600 p-1.5" aria-label="拖拽排序模块">
          <GripVertical size={14} />
        </div>

        <button
          type="button"
          onClick={onExpand}
          aria-expanded={expanded}
          className="flex items-center gap-2 flex-1 min-w-0 text-left rounded px-1 py-1.5 hover:bg-gray-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        >
          <span className="text-gray-500 flex-shrink-0">
            {moduleIcons[module.type] || <Layers size={16} />}
          </span>
          <span className="font-medium text-gray-700 truncate">{module.title}</span>
          <span className="text-[10px] text-gray-400 flex-shrink-0">
            {module.items.length > 0 ? `${module.items.length} 条` : '未填写'}
          </span>
          <span className="ml-1 p-1.5 text-gray-400">
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </span>
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={handleToggleVisibility}
            className={cn("p-1.5 rounded hover:bg-gray-200 transition-colors", module.visible ? "text-gray-600" : "text-gray-400")}
            title={module.visible ? "隐藏模块（纸面不显示）" : "显示模块"}
            aria-label={module.visible ? "隐藏模块" : "显示模块"}
          >
            {module.visible ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>

          <button
            onClick={handleDeleteModule}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
            title="删除模块"
            aria-label="删除模块"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Body */}
      {expanded && (
        <div className="p-4 border-t border-gray-100 animate-in slide-in-from-top-2 duration-200">
          <div className="mb-4">
            <label className="text-xs text-gray-500 font-medium block mb-1" htmlFor={`module-title-${module.id}`}>模块标题</label>
            <DebouncedInput
              id={`module-title-${module.id}`}
              data-autofocus="module-title"
              className="w-full p-2 border border-gray-300 rounded text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              value={module.title}
              onChange={(val) => updateModule(module.id, { title: val })}
              delay={400}
            />
            {/* 模块排版设置：标题样式 / 项目符号 / 列数 */}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <label className="text-xs text-gray-400">标题样式</label>
              <div className="flex gap-1">
                {(['line', 'bar', 'plain'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => updateModule(module.id, { titleStyle: s })}
                    aria-pressed={(module.titleStyle || 'line') === s}
                    className={cn(
                      "px-2 py-1 rounded text-xs border transition-colors",
                      (module.titleStyle || 'line') === s ? "border-blue-500 bg-blue-50 text-blue-600" : "border-gray-200 text-gray-500 hover:border-gray-300"
                    )}
                    title={s === 'line' ? '下划线' : s === 'bar' ? '左侧色条' : '纯加粗'}
                  >
                    {s === 'line' ? '下划线' : s === 'bar' ? '色条' : '无装饰'}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <label className="text-xs text-gray-400">项目符号</label>
              <div className="flex gap-1">
                {(['dot', 'dash', 'none'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => updateModule(module.id, { bulletStyle: s })}
                    aria-pressed={(module.bulletStyle || 'dot') === s}
                    className={cn(
                      "px-2 py-1 rounded text-xs border transition-colors",
                      (module.bulletStyle || 'dot') === s ? "border-blue-500 bg-blue-50 text-blue-600" : "border-gray-200 text-gray-500 hover:border-gray-300"
                    )}
                  >
                    {s === 'dot' ? '圆点 •' : s === 'dash' ? '短横线 —' : '无'}
                  </button>
                ))}
              </div>
              {(module.type === 'education' || module.type === 'skills' || module.type === 'honors') && (
                <>
                  <label className="text-xs text-gray-400 ml-2">列数</label>
                  <div className="flex gap-1">
                    {([1, 2] as const).map((c) => (
                      <button
                        key={c}
                        onClick={() => updateModule(module.id, { columns: c })}
                        aria-pressed={(module.columns || 1) === c}
                        className={cn(
                          "px-2 py-1 rounded text-xs border transition-colors",
                          (module.columns || 1) === c ? "border-blue-500 bg-blue-50 text-blue-600" : "border-gray-200 text-gray-500 hover:border-gray-300"
                        )}
                      >
                        {c} 列
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="space-y-3" ref={itemsRef}>
            {(module.items as ModuleItemType[]).map((item, index) => {
              const resumeItem = item as ResumeItem;
              const { start, end } = isSkill ? { start: '', end: '' } : splitDate(resumeItem);
              return (
                <div
                  key={item.id}
                  data-item-id={item.id}
                  className="relative p-3 pl-3 border border-gray-200 rounded-md bg-gray-50 transition-colors focus-within:border-blue-300 hover:border-blue-300"
                >
                  {/* 条目操作：常驻可见（键盘 / 触屏用户也要能看见排序、复制、删除） */}
                  <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 rounded-md border border-gray-200 bg-white/90 px-1 py-0.5 shadow-sm">
                    <button
                      onClick={() => moveItem(item.id, 'up')}
                      disabled={index === 0}
                      className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded disabled:opacity-25 disabled:cursor-not-allowed"
                      title="上移此条"
                      aria-label="上移此条"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      onClick={() => moveItem(item.id, 'down')}
                      disabled={index === module.items.length - 1}
                      className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded disabled:opacity-25 disabled:cursor-not-allowed"
                      title="下移此条"
                      aria-label="下移此条"
                    >
                      <ArrowDown size={14} />
                    </button>
                    <button
                      onClick={() => duplicateItem(item.id)}
                      className="p-1 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded"
                      title="复制此条"
                      aria-label="复制此条"
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      onClick={() => setConfirmItemId(item.id)}
                      className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                      title="删除此条"
                      aria-label="删除此条"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {isSkill ? (
                    <div className="pr-28">
                      <DebouncedInput
                        className="w-full p-1.5 bg-white border border-gray-300 rounded text-sm focus:border-blue-500 outline-none"
                        placeholder="技能名称"
                        aria-label="技能名称"
                        value={(item as SkillItem).name}
                        onChange={(val) => updateModuleItem(module.id, item.id, 'name', val)}
                        delay={250}
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="pr-28">
                        <DebouncedInput
                          className="w-full p-1.5 bg-white border border-gray-300 rounded text-sm font-medium focus:border-blue-500 outline-none"
                          placeholder={module.type === 'education' ? '学历 / 专业' : '职位名称'}
                          aria-label={module.type === 'education' ? '学历或专业' : '职位名称'}
                          value={resumeItem.title}
                          onChange={(val) => updateModuleItem(module.id, item.id, 'title', val)}
                          delay={250}
                        />
                      </div>
                      <DebouncedInput
                        className="w-full p-1.5 bg-white border border-gray-300 rounded text-sm focus:border-blue-500 outline-none"
                        placeholder={module.type === 'education' ? '学校名称' : '公司名称'}
                        aria-label={module.type === 'education' ? '学校名称' : '公司名称'}
                        value={resumeItem.subtitle}
                        onChange={(val) => updateModuleItem(module.id, item.id, 'subtitle', val)}
                        delay={250}
                      />
                      <div className="flex gap-1 items-center">
                        <DatePicker
                          value={start}
                          onChange={(v) => commitDate(resumeItem, 'start', v)}
                          placeholder="开始时间"
                          ariaLabel="开始时间"
                          allowPresent={false}
                          className="flex-1 min-w-0"
                        />
                        <span className="text-gray-400 text-xs flex-shrink-0">-</span>
                        <DatePicker
                          value={end}
                          onChange={(v) => commitDate(resumeItem, 'end', v)}
                          placeholder="结束时间"
                          ariaLabel="结束时间"
                          allowPresent={true}
                          className="flex-1 min-w-0"
                        />
                      </div>
                      <DebouncedInput
                        className="w-full p-1.5 bg-white border border-gray-300 rounded text-sm focus:border-blue-500 outline-none"
                        placeholder="地点 (选填)"
                        aria-label="地点（选填）"
                        value={resumeItem.location || ''}
                        onChange={(val) => updateModuleItem(module.id, item.id, 'location', val)}
                        delay={250}
                      />
                      <DescriptionWithExamples
                        moduleType={module.type}
                        value={resumeItem.description ?? ''}
                        onChange={(val) => updateModuleItem(module.id, item.id, 'description', val)}
                      />
                    </div>
                  )}

                  {/* 条目删除内联二次确认 */}
                  {confirmItemId === item.id && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 rounded-md bg-white/95 border border-red-200 text-center px-3">
                      <p className="text-sm font-medium text-gray-800">删除这条{isSkill ? '技能' : '经历'}？</p>
                      <p className="text-[11px] text-gray-400">删除后仍可点顶栏「撤销」恢复</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setConfirmItemId(null)}
                          className="px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium"
                        >
                          取消
                        </button>
                        <button
                          onClick={() => { removeModuleItem(module.id, item.id); setConfirmItemId(null); }}
                          className="px-3 py-1 rounded-md bg-red-600 hover:bg-red-500 text-white text-xs font-medium"
                        >
                          确认删除
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {module.items.length === 0 && (
            <p className="mt-3 text-xs text-gray-400 text-center">
              还没有内容{isSkill ? '' : '，点下面的按钮添加第一条'}
            </p>
          )}

          <button
            onClick={addItem}
            className="w-full mt-3 py-2 border border-dashed border-blue-300 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
          >
            <Plus size={16} />
            添加{isSkill ? '技能' : '一条'}
          </button>
        </div>
      )}

      {/* 模块删除确认弹窗 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-white rounded-xl p-5 shadow-2xl max-w-xs mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-800 mb-2">确认删除模块</h3>
            <p className="text-sm text-gray-500 mb-1">
              确定要删除「{module.title}」模块（含 {module.items.length} 条内容）吗？
            </p>
            <p className="text-xs text-gray-400 mb-4">删除后点顶栏「撤销」即可恢复。</p>
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
