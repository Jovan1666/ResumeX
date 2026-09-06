import React, { memo } from 'react';
import { ResumeData, isSkillsModule, ResumeItem } from '@/app/types/resume';
import { ResumeChrome, SingleColumnLayout } from './_primitives/ResumeChrome';
import { HeaderBlock } from './_primitives/HeaderBlock';
import { SectionTitle } from './_primitives/SectionTitle';
import { ExperienceItem, SkillGroups } from './_primitives/ExperienceItem';

/**
 * 商务深蓝（navyBiz）：单栏、深蓝标题线、可切宋体（data-font=serif 生效）。
 * 金融、商务、国企（02 §5.2）。
 */
export const NavyBizTemplate: React.FC<{ data: ResumeData }> = memo(({ data }) => {
  const { profile, modules, settings } = data;
  const visibleModules = modules.filter((m) => m.visible && m.items.length > 0);
  const gap = settings.moduleGap ?? 6;

  return (
    <ResumeChrome data={data}>
      <SingleColumnLayout data={data}>
        <HeaderBlock
          profile={profile}
          showPhoto="right"
          nameSizePt={17}
          privacyBlur={settings.privacyBlur}
          photoShape={settings.photoShape}
          photoSize={settings.photoSize}
        />

        {profile.summary && (
          <div className="rx-section" style={{ marginBottom: `${gap}mm` }}>
            <SectionTitle title="自我评价" variant="bar" colorVar="#1E4E8C" />
            <p style={{ fontSize: '10pt', color: '#333', lineHeight: 1.4 }}>{profile.summary}</p>
          </div>
        )}

        {visibleModules.map((module) => {
          const heading = module.titleOverride || module.title;
          return (
            <div key={module.id} className="rx-section" style={{ marginBottom: `${gap}mm` }}>
              <SectionTitle title={heading} variant="bar" colorVar="#1E4E8C" />
              {isSkillsModule(module) ? (
                <SkillGroups items={module.items as { id: string; name: string; group?: string }[]} columns={module.columns} />
              ) : (
                <div className={module.columns === 2 ? 'grid grid-cols-2 gap-x-6 gap-y-2' : 'space-y-2'}>
                  {(module.items as ResumeItem[]).map((item) => (
                    <ExperienceItem key={item.id} item={item} showLocation={false} bulletStyle={module.bulletStyle || 'dot'} />
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
NavyBizTemplate.displayName = 'NavyBizTemplate';
