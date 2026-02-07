import React, { memo, useMemo, Suspense, lazy } from 'react';
import { ResumeData, TemplateId } from '@/app/types/resume';
import { ThemeWrapper } from '@/app/components/ThemeWrapper';

// 懒加载所有模板，只有当前使用的模板才会被加载到内存
const templateLoaders: Record<TemplateId, () => Promise<{ default: React.ComponentType<{ data: ResumeData }> }>> = {
  tech: () => import('./TechTemplate').then(m => ({ default: m.TechTemplate })),
  business: () => import('./BusinessTemplate').then(m => ({ default: m.BusinessTemplate })),
  minimal: () => import('./MinimalTemplate').then(m => ({ default: m.MinimalTemplate })),
  vibrant: () => import('./VibrantTemplate').then(m => ({ default: m.VibrantTemplate })),
  professional: () => import('./ProfessionalTemplate').then(m => ({ default: m.ProfessionalTemplate })),
  civilService: () => import('./CivilServiceTemplate').then(m => ({ default: m.CivilServiceTemplate })),
  javaDev: () => import('./JavaDevTemplate').then(m => ({ default: m.JavaDevTemplate })),
  operations: () => import('./OperationsTemplate').then(m => ({ default: m.OperationsTemplate })),
  aiDev: () => import('./AIDevTemplate').then(m => ({ default: m.AIDevTemplate })),
  industry: () => import('./IndustryTemplate').then(m => ({ default: m.IndustryTemplate })),
  engineer: () => import('./EngineerTemplate').then(m => ({ default: m.EngineerTemplate })),
  accountant: () => import('./AccountantTemplate').then(m => ({ default: m.AccountantTemplate })),
  hr: () => import('./HRTemplate').then(m => ({ default: m.HRTemplate })),
  medical: () => import('./MedicalTemplate').then(m => ({ default: m.MedicalTemplate })),
  sales: () => import('./SalesTemplate').then(m => ({ default: m.SalesTemplate })),
  media: () => import('./MediaTemplate').then(m => ({ default: m.MediaTemplate })),
  teacher: () => import('./TeacherTemplate').then(m => ({ default: m.TeacherTemplate })),
  timeline: () => import('./TimelineTemplate').then(m => ({ default: m.TimelineTemplate })),
  twoColumnCompact: () => import('./TwoColumnCompactTemplate').then(m => ({ default: m.TwoColumnCompactTemplate })),
  creative: () => import('./CreativeTemplate').then(m => ({ default: m.CreativeTemplate })),
  academic: () => import('./AcademicTemplate').then(m => ({ default: m.AcademicTemplate })),
  card: () => import('./CardTemplate').then(m => ({ default: m.CardTemplate })),
  executive: () => import('./ExecutiveTemplate').then(m => ({ default: m.ExecutiveTemplate })),
  freshGrad: () => import('./FreshGradTemplate').then(m => ({ default: m.FreshGradTemplate })),
  infographic: () => import('./InfographicTemplate').then(m => ({ default: m.InfographicTemplate })),
  aiRed: () => import('./AiRedTemplate').then(m => ({ default: m.AiRedTemplate })),
  opsOrange: () => import('./OpsOrangeTemplate').then(m => ({ default: m.OpsOrangeTemplate })),
  fePurple: () => import('./FePurpleTemplate').then(m => ({ default: m.FePurpleTemplate })),
  eduDark: () => import('./EduDarkTemplate').then(m => ({ default: m.EduDarkTemplate })),
  enBw: () => import('./EnBwTemplate').then(m => ({ default: m.EnBwTemplate })),
  generalRed: () => import('./GeneralRedTemplate').then(m => ({ default: m.GeneralRedTemplate })),
  javaBlue: () => import('./JavaBlueTemplate').then(m => ({ default: m.JavaBlueTemplate })),
  gradBlue: () => import('./GradBlueTemplate').then(m => ({ default: m.GradBlueTemplate })),
  recruitBk: () => import('./RecruitBkTemplate').then(m => ({ default: m.RecruitBkTemplate })),
  feGreen: () => import('./FeGreenTemplate').then(m => ({ default: m.FeGreenTemplate })),
  civilGray: () => import('./CivilGrayTemplate').then(m => ({ default: m.CivilGrayTemplate })),
};

// 缓存已创建的 lazy 组件，避免重复创建
const lazyComponentCache = new Map<TemplateId, React.LazyExoticComponent<React.ComponentType<{ data: ResumeData }>>>();

function getLazyTemplate(templateId: TemplateId) {
  if (!lazyComponentCache.has(templateId)) {
    const loader = templateLoaders[templateId] || templateLoaders.tech;
    lazyComponentCache.set(templateId, lazy(loader));
  }
  return lazyComponentCache.get(templateId)!;
}

interface ResumeRendererProps {
  data: ResumeData;
  scale?: number;
}

// 使用 React.memo 优化，避免不必要的重渲染
export const ResumeRenderer: React.FC<ResumeRendererProps> = memo(({ data, scale = 1 }) => {
  const LazyTemplate = useMemo(() => getLazyTemplate(data.template), [data.template]);

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
