import React, { memo } from 'react';
import { ResumeData, isSkillsModule, ResumeItem } from '@/app/types/resume';
import { ResumeChrome, SingleColumnLayout } from './_primitives/ResumeChrome';
import { HeaderBlock } from './_primitives/HeaderBlock';
import { SectionTitle } from './_primitives/SectionTitle';
import { ExperienceItem, SkillGroups } from './_primitives/ExperienceItem';

/**
 * 社招通用（jobClean）：单栏、工作在前、可选照片。
 * 互联网社招场景（02 §5.2）。
 */
export const JobCleanTemplate: React.FC<{ data: ResumeData }> = memo(({ data }) => {
  const { profile, modules } = data;
  const visibleModules = modules.filter((m) => m.visible && m.items.length > 0);

  return (
    <ResumeChrome data={data}>
      <SingleColumnLayout data={data}>
        <HeaderBlock profile={profile} showPhoto="right" />

        {profile.summary && (
          <div className="rx-section mb-3">
            <SectionTitle title="自我评价" />
            <p style={{ fontSize: '10pt', color: '#333', lineHeight: 1.4 }}>{profile.summary}</p>
          </div>
        )}

        {visibleModules.map((module) => (
          <div key={module.id} className="rx-section mb-3">
            <SectionTitle title={module.title} variant="line" />
            {isSkillsModule(module) ? (
              <SkillGroups items={module.items as { id: string; name: string; group?: string }[]} />
            ) : (
              <div className="space-y-2">
                {(module.items as ResumeItem[]).map((item) => (
                  <ExperienceItem key={item.id} item={item} showLocation={false} />
                ))}
              </div>
            )}
          </div>
        ))}
      </SingleColumnLayout>
    </ResumeChrome>
  );
});
JobCleanTemplate.displayName = 'JobCleanTemplate';
