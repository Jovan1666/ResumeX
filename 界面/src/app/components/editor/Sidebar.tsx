import { memo, useRef, useCallback, useEffect, useState } from 'react';
import { useResumeStore } from '@/app/store/useResumeStore';
import { ModuleType } from '@/app/types/resume';
import { BasicInfoForm } from './BasicInfoForm';
import { ModuleList } from './ModuleList';
import { subscribeLocate, flashHighlight } from './locateBus';
import { cn } from '@/app/lib/utils';
import { User, BookOpen, Briefcase, Folder, Code, MoreHorizontal } from 'lucide-react';

/**
 * 左栏 = 填写区（不放配色）：
 * - 顶部步骤条：点击展开并定位到该区块的第一个模块；没有该模块时禁用并说明原因
 * - 步骤条高亮当前滚动到的区块
 * - 展开态由本组件持有（步骤条 / 添加模块 / 诊断面板「去填写」共用同一份）
 * - 配色 / 模板 / 样式在「样式」抽屉与顶栏（StyleSettingsPanel）
 */
const SECTION_TABS: { id: string; label: string; icon: React.ReactNode; types: ModuleType[] }[] = [
  { id: 'basic', label: '基本信息', icon: <User size={14} />, types: [] },
  { id: 'edu', label: '教育', icon: <BookOpen size={14} />, types: ['education'] },
  { id: 'exp', label: '工作', icon: <Briefcase size={14} />, types: ['experience'] },
  { id: 'proj', label: '项目', icon: <Folder size={14} />, types: ['projects'] },
  { id: 'skill', label: '技能', icon: <Code size={14} />, types: ['skills'] },
  { id: 'more', label: '更多', icon: <MoreHorizontal size={14} />, types: ['campus', 'honors', 'custom'] },
];

export const Sidebar = memo(() => {
  const modules = useResumeStore(state => state.resumes[state.activeResumeId]?.modules || []);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [autoFocusId, setAutoFocusId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('basic');

  // 切简历时收起展开态
  const activeResumeId = useResumeStore(state => state.activeResumeId);
  useEffect(() => {
    setExpandedId(null);
    setAutoFocusId(null);
    setActiveTab('basic');
  }, [activeResumeId]);

  /** 展开某个模块（同一模块再点则收起），并清掉「刚添加」定位标记 */
  const handleExpand = useCallback((id: string | null) => {
    setAutoFocusId(null);
    setExpandedId(prev => (id && prev === id ? null : id));
  }, []);

  /** 刚添加的模块：展开 + 标记定位（1.5s 后清除标记，避免再次展开时被劫持焦点） */
  const focusTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const handleModuleAdded = useCallback((id: string) => {
    if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
    setExpandedId(id);
    setAutoFocusId(id);
    focusTimerRef.current = setTimeout(() => setAutoFocusId(null), 1500);
  }, []);
  useEffect(() => () => {
    if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
  }, []);

  const tabOfModule = useCallback((type: ModuleType) => (
    SECTION_TABS.find(t => t.types.includes(type))?.id ?? 'more'
  ), []);

  // 定位请求（诊断面板「去填写」/ 步骤条以外的入口）
  useEffect(() => subscribeLocate((target) => {
    if (target.kind === 'add-module') {
      setTimeout(() => {
        const el = scrollRef.current?.querySelector<HTMLElement>('[data-add-module]');
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        flashHighlight(el);
      }, 60);
      return;
    }
    if (target.kind !== 'module' && target.kind !== 'item') return;

    setAutoFocusId(null);
    setExpandedId(target.moduleId);
    setActiveTab(tabOfModule(
      useResumeStore.getState().resumes[useResumeStore.getState().activeResumeId]
        ?.modules.find(m => m.id === target.moduleId)?.type ?? 'custom'
    ));
    // 等一帧，让刚展开的模块体渲染出来再滚动 / 聚焦
    setTimeout(() => {
      const card = scrollRef.current?.querySelector<HTMLElement>(`[data-module-id="${target.moduleId}"]`);
      if (!card) return;
      const el = target.kind === 'item'
        ? card.querySelector<HTMLElement>(`[data-item-id="${target.itemId}"]`) ?? card
        : card;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      flashHighlight(el);
      if (target.kind === 'item') el.querySelector<HTMLElement>('input, textarea')?.focus();
    }, 90);
  }), [tabOfModule]);

  const scrollToTab = useCallback((tabId: string) => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    setActiveTab(tabId);
    if (tabId === 'basic') {
      scroller.querySelector<HTMLElement>('[data-section="basic-info"]')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const tab = SECTION_TABS.find(t => t.id === tabId);
    const target = modules.find(m => tab?.types.includes(m.type));
    if (!target) return;
    setExpandedId(target.id);
    setTimeout(() => {
      scroller.querySelector<HTMLElement>(`[data-module-id="${target.id}"]`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 30);
  }, [modules]);

  // 滚动时同步「当前所在区块」高亮
  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const top = scroller.getBoundingClientRect().top;
        const basic = scroller.querySelector<HTMLElement>('[data-section="basic-info"]');
        const basicBottom = basic ? basic.getBoundingClientRect().bottom - top : 0;
        if (basicBottom > 24) { setActiveTab('basic'); return; }
        const cards = Array.from(scroller.querySelectorAll<HTMLElement>('[data-module-id]'));
        let current = 'more';
        for (const card of cards) {
          if (card.getBoundingClientRect().top - top <= 12) {
            const type = (card.getAttribute('data-module-type') ?? 'custom') as ModuleType;
            current = tabOfModule(type);
          } else break;
        }
        setActiveTab(current);
      });
    };
    scroller.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      if (raf) cancelAnimationFrame(raf);
      scroller.removeEventListener('scroll', onScroll);
    };
  }, [modules, tabOfModule]);

  return (
    <div className="flex flex-col h-full bg-white text-sm border-r border-gray-200">
      {/* 步骤条（导航到区块） */}
      <div className="p-3 border-b border-gray-200 bg-white z-10 sticky top-0">
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {SECTION_TABS.map((tab) => {
            const count = tab.types.reduce((n, t) => n + modules.filter(m => m.type === t).length, 0);
            const disabled = tab.id !== 'basic' && count === 0;
            return (
              <button
                key={tab.id}
                onClick={() => !disabled && scrollToTab(tab.id)}
                disabled={disabled}
                aria-current={activeTab === tab.id ? 'true' : undefined}
                title={disabled ? `还没有${tab.label}模块，点下方「添加模块」新增` : `定位到${tab.label}`}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors",
                  disabled
                    ? "text-gray-300 cursor-not-allowed"
                    : activeTab === tab.id
                      ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                {tab.icon}
                {tab.label}
                {count > 0 && <span className="text-[10px] text-gray-400">{count}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* 表单区（可滚动） */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-200">
        {/* 基本信息 */}
        <div className="onboarding-basic" data-section="basic-info">
          <BasicInfoForm />
        </div>

        {/* 模块列表（每个模块带 data-module-id / data-module-type 供滚动定位） */}
        <div className="onboarding-modules">
          <ModuleList
            expandedId={expandedId}
            onExpand={handleExpand}
            onModuleAdded={handleModuleAdded}
            autoFocusId={autoFocusId}
          />
        </div>
      </div>
    </div>
  );
});

Sidebar.displayName = 'Sidebar';
