import React, { memo } from 'react';
import { ResumeData } from '@/app/types/resume';
import { ResumeChrome, SingleColumnLayout } from './_primitives/ResumeChrome';
import { HeaderBlock } from './_primitives/HeaderBlock';
import { SectionTitle } from './_primitives/SectionTitle';
import { ModuleList, SummaryBlock, filterVisible } from './_primitives/ModuleBlocks';
import { fs } from './_primitives/ResumeChrome';
import { resolveNameSize } from '@/app/types/theme';

/**
 * 体制公文（civilFile）：单栏、矩形证件照、头部显示政治面貌/籍贯、无致谢。
 * 默认宋体（见 ResumeRenderer 的 effectiveFont：用户没显式选字体时按 serif 渲染）。
 * 原实现把标题色写死 #1A1A1A → 现在走 var(--color-primary)（ink 主题下视觉不变，换色即跟手）。
 */
export const CivilFileTemplate: React.FC<{ data: ResumeData }> = memo(({ data }) => {
  const { profile, modules, settings } = data;
  const gap = settings.moduleGap ?? 6;
  const extraFields = (profile.customFields || []).filter((f) => f.label && f.value);

  return (
    <ResumeChrome data={data}>
      <SingleColumnLayout data={data}>
        <HeaderBlock
          profile={profile}
          showPhoto={settings.photoPosition === 'top' ? 'top' : 'right'}
          showFormalFields
          align="center"
          nameSizePt={resolveNameSize(settings) - 1}
          separator="|"
          privacyBlur={settings.privacyBlur}
          photoShape={settings.photoShape ?? 'rect'}
          photoSize={settings.photoSize}
        />

        <SummaryBlock summary={profile.summary} variant="bar" gapMm={gap} />

        <ModuleList
          modules={filterVisible(modules)}
          variant="bar"
          showLocation={settings.showItemLocation}
          gapMm={gap}
          skillSeparator="，"
        />

        {/* 自定义字段（政治面貌/籍贯已在头部显示；此处兜底展示用户自填项） */}
        {extraFields.length > 0 && (
          <div className="rx-section min-w-0" style={{ marginBottom: `${gap}mm` }}>
            <SectionTitle title="补充信息" variant="bar" />
            <div className="min-w-0" style={{ fontSize: fs(10), color: '#333' }}>
              {extraFields.map((f) => (
                <p key={f.id} className="min-w-0 break-words">
                  <span className="font-bold">{f.label}：</span>{f.value}
                </p>
              ))}
            </div>
          </div>
        )}
      </SingleColumnLayout>
    </ResumeChrome>
  );
});
CivilFileTemplate.displayName = 'CivilFileTemplate';
