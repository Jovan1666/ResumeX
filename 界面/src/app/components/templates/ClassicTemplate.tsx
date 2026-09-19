import React, { memo } from 'react';
import { ResumeData } from '@/app/types/resume';
import { ResumeChrome, SingleColumnLayout } from './_primitives/ResumeChrome';
import { HeaderBlock } from './_primitives/HeaderBlock';
import { ModuleList, SummaryBlock, filterVisible } from './_primitives/ModuleBlocks';
import { resolveNameSize } from '@/app/types/theme';

/**
 * 简洁通用（classic）：合并原 campusClean / jobClean / navyBiz / techPlain。
 * 四者曾是「同一套排版换参数」，现在差别全部收敛成可配置项：
 * - 栏目头样式：由每个模块的 titleStyle 决定（line / bar / plain）
 * - 是否显示地点：settings.showItemLocation（true / false / 缺省跟随模块类型）
 * - 姓名字号：settings.nameSize
 * 模块顺序 = data.modules 顺序（校招教育在前、社招经历在前由用户/新建预设决定）。
 */
export const ClassicTemplate: React.FC<{ data: ResumeData }> = memo(({ data }) => {
  const { profile, modules, settings } = data;
  const gap = settings.moduleGap ?? 6;

  return (
    <ResumeChrome data={data}>
      <SingleColumnLayout data={data}>
        <HeaderBlock
          profile={profile}
          showPhoto={settings.photoPosition === 'top' ? 'top' : 'right'}
          nameSizePt={resolveNameSize(settings)}
          privacyBlur={settings.privacyBlur}
          photoShape={settings.photoShape}
          photoSize={settings.photoSize}
        />

        <SummaryBlock summary={profile.summary} gapMm={gap} />

        <ModuleList
          modules={filterVisible(modules)}
          variant="line"
          showLocation={settings.showItemLocation}
          gapMm={gap}
          showTechStack
        />
      </SingleColumnLayout>
    </ResumeChrome>
  );
});
ClassicTemplate.displayName = 'ClassicTemplate';
