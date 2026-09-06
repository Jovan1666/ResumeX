import { memo, useRef, useCallback } from 'react';
import { useResumeStore } from '@/app/store/useResumeStore';
import { BasicInfoForm } from './BasicInfoForm';
import { ModuleList } from './ModuleList';
import { User, BookOpen, Briefcase, Folder, Code, MoreHorizontal } from 'lucide-react';

/**
 * 左栏 = 填写区（重做后不再放配色）：
 * - 顶部「步骤条」：点击滚动到对应区块（基本信息 / 教育 / 工作 / 项目 / 技能 / 更多）
 * - 配色 / 模板 / 样式移入「样式」抽屉与顶栏（StyleSettingsPanel）
 */
const SECTION_TABS = [
  { id: 'basic', label: '基本信息', icon: <User size={14} /> },
  { id: 'edu', label: '教育', icon: <BookOpen size={14} /> },
  { id: 'exp', label: '工作', icon: <Briefcase size={14} /> },
  { id: 'proj', label: '项目', icon: <Folder size={14} /> },
  { id: 'skill', label: '技能', icon: <Code size={14} /> },
  { id: 'more', label: '更多', icon: <MoreHorizontal size={14} /> },
];

export const Sidebar = memo(() => {
  // 模块名 → 步骤条 tab id 映射
  const modules = useResumeStore(state => state.resumes[state.activeResumeId]?.modules || []);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 类型 → tab id（自定义与荣誉归「更多」）
  const typeToTab: Record<string, string> = {
    education: 'edu',
    experience: 'exp',
    projects: 'proj',
    skills: 'skill',
    campus: 'more',
    honors: 'more',
    custom: 'more',
  };

  const scrollToSection = useCallback((tabId: string) => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    let target: HTMLElement | null = null;
    if (tabId === 'basic') {
      target = scroller.querySelector('[data-section="basic-info"]');
    } else {
      // 找该 tab 对应类型的第一个模块卡片
      const wantedId = Object.keys(typeToTab).find(t => typeToTab[t] === tabId);
      const firstModule = modules.find(m => m.type === wantedId);
      if (firstModule) {
        target = scroller.querySelector(`[data-module-id="${firstModule.id}"]`);
      }
    }
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [modules]);

  return (
    <div className="flex flex-col h-full bg-white text-sm border-r border-gray-200">
      {/* 步骤条（导航到区块） */}
      <div className="p-3 border-b border-gray-200 bg-white z-10 sticky top-0">
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {SECTION_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => scrollToSection(tab.id)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 whitespace-nowrap transition-colors"
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 表单区（可滚动） */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-200">
        {/* 基本信息 */}
        <div className="onboarding-basic" data-section="basic-info">
          <BasicInfoForm />
        </div>

        {/* 模块列表（给每个模块打 data-module-id 供滚动定位） */}
        <div className="onboarding-modules">
          <ModuleList />
        </div>
      </div>
    </div>
  );
});

Sidebar.displayName = 'Sidebar';
