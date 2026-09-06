import React, { memo } from 'react';
import { ResumeData, isSkillsModule, ResumeItem } from '@/app/types/resume';
import { ResumeChrome, SingleColumnLayout } from './_primitives/ResumeChrome';
import { HeaderBlock } from './_primitives/HeaderBlock';
import { SectionTitle } from './_primitives/SectionTitle';
import { ExperienceItem, SkillGroups } from './_primitives/ExperienceItem';

/**
 * 等宽双列（twoColumnEqual）：正文分成左右 50/50 两列并行（不按「栏」分，而按模块分列：
 * 第 1、3、5…个模块在左列，第 2、4、6…在右列）。信息密度高，适合内容多但想一页。
 */
export const TwoColumnEqualTemplate: React.FC<{ data: ResumeData }> = memo(({ data }) => {
  const { profile, modules, settings } = data;
  const visibleModules = modules.filter((m) => m.visible && m.items.length > 0);
  const gap = settings.moduleGap ?? 6;

  const leftCol = visibleModules.filter((_, i) => i % 2 === 0);
  const rightCol = visibleModules.filter((_, i) => i % 2 === 1);

  const renderModule = (module: (typeof visibleModules)[number], key: string) => {
    const heading = module.titleOverride || module.title;
    return (
      <div key={key} className="rx-section" style={{ marginBottom: `${gap}mm` }}>
        <SectionTitle title={heading} variant={module.titleStyle || 'line'} />
        {isSkillsModule(module) ? (
          <SkillGroups items={module.items as { id: string; name: string; group?: string }[]} columns={module.columns} />
        ) : (
          <div className={module.columns === 2 ? 'grid grid-cols-2 gap-x-6 gap-y-2' : 'space-y-2'}>
            {(module.items as ResumeItem[]).map((item) => (
              <ExperienceItem key={item.id} item={item} showLocation={false} compact bulletStyle={module.bulletStyle || 'dot'} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <ResumeChrome data={data}>
      <SingleColumnLayout data={data}>
        <HeaderBlock
          profile={profile}
          showPhoto="right"
          privacyBlur={settings.privacyBlur}
          photoShape={settings.photoShape}
          photoSize={settings.photoSize}
        />

        {profile.summary && (
          <div className="rx-section" style={{ marginBottom: `${gap}mm` }}>
            <SectionTitle title="自我评价" />
            <p style={{ fontSize: '10pt', color: '#333', lineHeight: 1.4 }}>{profile.summary}</p>
          </div>
        )}

        {/* 左右 50/50 两列 */}
        <div className="flex gap-6">
          <div className="flex-1 min-w-0">{leftCol.map((m) => renderModule(m, `l-${m.id}`))}</div>
          <div className="flex-1 min-w-0">{rightCol.map((m) => renderModule(m, `r-${m.id}`))}</div>
        </div>
      </SingleColumnLayout>
    </ResumeChrome>
  );
});
TwoColumnEqualTemplate.displayName = 'TwoColumnEqualTemplate';
