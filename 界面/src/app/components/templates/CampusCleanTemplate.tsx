import React, { memo } from 'react';
import { ResumeData, isSkillsModule, ResumeItem } from '@/app/types/resume';
import { ResumeChrome, SingleColumnLayout } from './_primitives/ResumeChrome';
import { HeaderBlock } from './_primitives/HeaderBlock';
import { SectionTitle } from './_primitives/SectionTitle';
import { ExperienceItem, SkillGroups } from './_primitives/ExperienceItem';

/**
 * 校招通用（campusClean）：单栏、教育在前、可选右上证件照。
 */
export const CampusCleanTemplate: React.FC<{ data: ResumeData }> = memo(({ data }) => {
  const { profile, modules, settings } = data;
  // 空模块不渲染标题（可见 + 有内容 才显示）
  const visibleModules = modules.filter((m) => m.visible && m.items.length > 0);
  const gap = settings.moduleGap ?? 6;

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
          <div className="rx-section mb-3" style={{ marginBottom: `${gap}mm` }}>
            <SectionTitle title="自我评价" />
            <p style={{ fontSize: '10pt', color: '#333', lineHeight: 1.4 }}>{profile.summary}</p>
          </div>
        )}

        {visibleModules.map((module) => {
          const heading = module.titleOverride || module.title;
          return (
            <div key={module.id} className="rx-section mb-3" style={{ marginBottom: `${gap}mm` }}>
              <SectionTitle
                title={heading}
                variant={module.titleStyle || 'line'}
                showHeading={module.visible !== false}
                sizePt={12.5}
              />
              {isSkillsModule(module) ? (
                <SkillGroups items={module.items as { id: string; name: string; group?: string }[]} columns={module.columns} />
              ) : (
                <div className={module.columns === 2 ? 'grid grid-cols-2 gap-x-6 gap-y-2' : 'space-y-2'}>
                  {(module.items as ResumeItem[]).map((item) => (
                    <ExperienceItem key={item.id} item={item} showLocation={module.type === 'campus'} bulletStyle={module.bulletStyle || 'dot'} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </SingleColumnLayout>
    </ResumeChrome>
  );
});
CampusCleanTemplate.displayName = 'CampusCleanTemplate';
