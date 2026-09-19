import React, { memo } from 'react';
import { ResumeData, ResumeModule } from '@/app/types/resume';
import { ResumeChrome, SingleColumnLayout } from './_primitives/ResumeChrome';
import { HeaderBlock } from './_primitives/HeaderBlock';
import { ModuleList, SummaryBlock, filterVisible, moduleHeading } from './_primitives/ModuleBlocks';
import { resolveNameSize } from '@/app/types/theme';

/**
 * 英文简洁（enSimple）：仅这一套允许英文栏目标题；单栏、外企/留学；仍禁止 infographic。
 * 强调色走 var(--color-primary)（原实现写死 #000，换主题无反应）。
 */
const EN_TITLES: Record<string, string> = {
  '教育背景': 'Education',
  '工作经历': 'Experience',
  '实习经历': 'Internship',
  '项目经历': 'Projects',
  '项目经验': 'Projects',
  '校园经历': 'Campus Activities',
  '荣誉奖项': 'Honors & Awards',
  '技能特长': 'Skills',
  '专业技能': 'Skills',
  '自我评价': 'Profile',
};

/** 英文栏目名：用户自定义优先，其次按模块类型兜底，最后原样输出 */
function enHeading(module: ResumeModule): string {
  const custom = module.titleOverride;
  if (custom) return custom;
  if (EN_TITLES[module.title]) return EN_TITLES[module.title];
  const byType: Record<string, string> = {
    education: 'Education',
    experience: 'Experience',
    projects: 'Projects',
    campus: 'Campus Activities',
    honors: 'Honors',
    skills: 'Skills',
  };
  return byType[module.type] || module.title;
}

export const EnSimpleTemplate: React.FC<{ data: ResumeData }> = memo(({ data }) => {
  const { profile, modules, settings } = data;
  const gap = settings.moduleGap ?? 6;
  // 把英文标题注入模块（模板不改数据，只在渲染层替换文案）
  const enModules = filterVisible(modules).map((m) => ({ ...m, titleOverride: enHeading(m) || moduleHeading(m) }));

  return (
    <ResumeChrome data={data}>
      <SingleColumnLayout data={data}>
        <HeaderBlock
          profile={profile}
          showPhoto={settings.photoPosition === 'top' ? 'top' : 'right'}
          separator="|"
          nameSizePt={resolveNameSize(settings) - 2}
          privacyBlur={settings.privacyBlur}
          photoShape={settings.photoShape}
          photoSize={settings.photoSize}
        />

        <SummaryBlock summary={profile.summary} title="Profile" gapMm={gap} colorVar="var(--color-primary)" sizePt={12} />

        <ModuleList
          modules={enModules}
          variant="line"
          showLocation={settings.showItemLocation}
          gapMm={gap}
          titleSizePt={12}
          colorVar="var(--color-primary)"
          skillSeparator=", "
        />
      </SingleColumnLayout>
    </ResumeChrome>
  );
});
EnSimpleTemplate.displayName = 'EnSimpleTemplate';
