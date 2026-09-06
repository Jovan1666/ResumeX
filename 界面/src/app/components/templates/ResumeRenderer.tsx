import React, { memo, useMemo, Suspense, lazy } from 'react';
import { ResumeData, TemplateId } from '@/app/types/resume';
import { ThemeWrapper } from '@/app/components/ThemeWrapper';

/**
 * 模板加载器（阶段 3）：8 个新模板文件（_primitives + 少量变体）。
 * 旧 *Template.tsx 已 git 删除；moduleId 未知 → campusClean（禁止 fallback 到 tech）。
 */
const templateLoaders: Record<TemplateId, () => Promise<{ default: React.ComponentType<{ data: ResumeData }> }>> = {
  campusClean: () => import('./CampusCleanTemplate').then(m => ({ default: m.CampusCleanTemplate })),
  jobClean: () => import('./JobCleanTemplate').then(m => ({ default: m.JobCleanTemplate })),
  navyBiz: () => import('./NavyBizTemplate').then(m => ({ default: m.NavyBizTemplate })),
  civilFile: () => import('./CivilFileTemplate').then(m => ({ default: m.CivilFileTemplate })),
  techPlain: () => import('./TechPlainTemplate').then(m => ({ default: m.TechPlainTemplate })),
  atsMono: () => import('./AtsMonoTemplate').then(m => ({ default: m.AtsMonoTemplate })),
  compactSplit: () => import('./CompactSplitTemplate').then(m => ({ default: m.CompactSplitTemplate })),
  enSimple: () => import('./EnSimpleTemplate').then(m => ({ default: m.EnSimpleTemplate })),
};

// 缓存已创建的 lazy 组件，避免重复创建
const lazyComponentCache = new Map<TemplateId, React.LazyExoticComponent<React.ComponentType<{ data: ResumeData }>>>();

function getLazyTemplate(templateId: TemplateId) {
  if (!lazyComponentCache.has(templateId)) {
    const loader = templateLoaders[templateId] || templateLoaders.campusClean;
    lazyComponentCache.set(templateId, lazy(loader));
  }
  return lazyComponentCache.get(templateId)!;
}

/** 归一化模板 id：未知字符串 → campusClean（禁止 fallback 到 tech） */
export function normalizeTemplateId(id: string | undefined | null): TemplateId {
  if (id && id in templateLoaders) return id as TemplateId;
  return 'campusClean';
}

interface ResumeRendererProps {
  data: ResumeData;
  scale?: number;
}

// 使用 React.memo 优化，避免不必要的重渲染
export const ResumeRenderer: React.FC<ResumeRendererProps> = memo(({ data, scale = 1 }) => {
  const LazyTemplate = useMemo(() => getLazyTemplate(normalizeTemplateId(data.template)), [data.template]);

  // 稳定 style 引用，避免每次渲染都创建新对象触发不必要的 DOM diff
  const pageStyle = useMemo(() => ({
    transform: `scale(${scale})`,
    width: '210mm',
    minHeight: '297mm',
    ...(data.settings.lineHeight === 'custom' && data.settings.customLineHeight
      ? { '--custom-line-height': String(data.settings.customLineHeight) } : {}),
    ...(data.settings.pageMargin === 'custom' && data.settings.customPageMargin
      ? { '--custom-margin': `${data.settings.customPageMargin}mm` } : {}),
  } as React.CSSProperties), [scale, data.settings.lineHeight, data.settings.customLineHeight, data.settings.pageMargin, data.settings.customPageMargin]);

  return (
    <ThemeWrapper theme={data.settings.themeColor}>
      <div
        className="origin-top-left bg-white shadow-2xl print:shadow-none print:transform-none transition-transform duration-200 ease-out resume-page"
        data-font={data.settings.fontFamily || 'sans'}
        data-line-height={data.settings.lineHeight || 'standard'}
        data-margin={data.settings.pageMargin || 'standard'}
        style={pageStyle}
      >
        <Suspense fallback={
          <div className="w-full h-full flex items-center justify-center min-h-[297mm]">
            <div className="text-gray-400 text-sm">加载模板中...</div>
          </div>
        }>
          <LazyTemplate data={data} />
        </Suspense>
      </div>
    </ThemeWrapper>
  );
});

ResumeRenderer.displayName = 'ResumeRenderer';
