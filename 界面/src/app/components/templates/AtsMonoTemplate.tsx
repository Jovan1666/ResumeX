import React, { memo } from 'react';
import { ResumeData } from '@/app/types/resume';
import { ResumeChrome, SingleColumnLayout } from './_primitives/ResumeChrome';
import { HeaderBlock } from './_primitives/HeaderBlock';
import { ModuleList, SummaryBlock, filterVisible } from './_primitives/ModuleBlocks';

/**
 * 极简黑白（atsMono）：单栏、无照片、无装饰、纯文本 —— 网申/ATS 解析最友好。
 * 标题固定 plain（黑色加粗），不受模块 titleStyle 影响（解析器只认纯文本层级）。
 */
export const AtsMonoTemplate: React.FC<{ data: ResumeData }> = memo(({ data }) => {
  const { profile, modules, settings } = data;
  const gap = settings.moduleGap ?? 6;

  return (
    <ResumeChrome data={data}>
      <SingleColumnLayout data={data}>
        <HeaderBlock
          profile={profile}
          showPhoto="none"
          separator="|"
          nameSizePt={17}
          privacyBlur={settings.privacyBlur}
        />

        <SummaryBlock summary={profile.summary} variant="plain" gapMm={gap} />

        <ModuleList
          modules={filterVisible(modules)}
          variant="plain"
          respectModuleTitleStyle={false}
          showLocation={false}
          gapMm={gap}
          compact
          skillSeparator="，"
        />
      </SingleColumnLayout>
    </ResumeChrome>
  );
});
AtsMonoTemplate.displayName = 'AtsMonoTemplate';
