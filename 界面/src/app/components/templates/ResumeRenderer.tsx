import React, { memo, useMemo, Suspense, lazy } from 'react';
import { ResumeData, TemplateId } from '@/app/types/resume';
import { ThemeWrapper } from '@/app/components/ThemeWrapper';
import { FontFamily } from '@/app/types/theme';

/**
 * 模板加载器：7 套版式（14 套合并后），全部走 _primitives 共享原语。
 * id 的真相来源是 types/resume.ts 的 TEMPLATE_IDS —— 这里必须逐一对应（Record 强制补齐）。
 * 未知 id → classic（禁止 fallback 到演示数据/旧 tech 模板）。
 */
const templateLoaders: Record<TemplateId, () => Promise<{ default: React.ComponentType<{ data: ResumeData }> }>> = {
  classic: () => import('./ClassicTemplate').then(m => ({ default: m.ClassicTemplate })),
  sidebar: () => import('./SidebarTemplate').then(m => ({ default: m.SidebarTemplate })),
  banner: () => import('./BannerTemplate').then(m => ({ default: m.BannerTemplate })),
  frame: () => import('./FrameTemplate').then(m => ({ default: m.FrameTemplate })),
  atsMono: () => import('./AtsMonoTemplate').then(m => ({ default: m.AtsMonoTemplate })),
  enSimple: () => import('./EnSimpleTemplate').then(m => ({ default: m.EnSimpleTemplate })),
  civilFile: () => import('./CivilFileTemplate').then(m => ({ default: m.CivilFileTemplate })),
};

// 缓存已创建的 lazy 组件，避免重复创建
const lazyComponentCache = new Map<TemplateId, React.LazyExoticComponent<React.ComponentType<{ data: ResumeData }>>>();

function getLazyTemplate(templateId: TemplateId) {
  if (!lazyComponentCache.has(templateId)) {
    const loader = templateLoaders[templateId] || templateLoaders.classic;
    lazyComponentCache.set(templateId, lazy(loader));
  }
  return lazyComponentCache.get(templateId)!;
}

/** 归一化模板 id：未知字符串 → classic */
export function normalizeTemplateId(id: string | undefined | null): TemplateId {
  if (id && id in templateLoaders) return id as TemplateId;
  return 'classic';
}

/**
 * 公文模板默认宋体：用户没显式改过字体（仍是 sans）时按 serif 渲染；
 * 一旦用户选了任意字体（含黑体）就完全尊重用户选择，模板不再插手。
 */
export function effectiveFont(template: TemplateId, fontFamily: FontFamily | undefined): FontFamily {
  const font = fontFamily || 'sans';
  if (template === 'civilFile' && font === 'sans') return 'serif';
  return font;
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
    // 字号缩放：所有纸面文字通过 fs() 乘上这个变量，字号滑块与「适应一页」才会真的改变排版
    '--rx-fs': String(data.settings.fontSizeScale || 1),
    ...(data.settings.lineHeight === 'custom' && data.settings.customLineHeight
      ? { '--custom-line-height': String(data.settings.customLineHeight) } : {}),
    ...(data.settings.pageMargin === 'custom' && data.settings.customPageMargin
      ? { '--custom-margin': `${data.settings.customPageMargin}mm` } : {}),
  } as React.CSSProperties), [scale, data.settings.fontSizeScale, data.settings.lineHeight, data.settings.customLineHeight, data.settings.pageMargin, data.settings.customPageMargin]);

  return (
    <ThemeWrapper theme={data.settings.themeColor}>
      <div
        className="origin-top-left bg-white shadow-2xl print:shadow-none print:transform-none transition-transform duration-200 ease-out resume-page"
        data-font={effectiveFont(normalizeTemplateId(data.template), data.settings.fontFamily)}
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
