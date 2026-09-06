import React, { memo } from 'react';
import { ResumeData, isSkillsModule, ResumeItem } from '@/app/types/resume';
import { ResumeChrome, SingleColumnLayout } from './_primitives/ResumeChrome';
import { HeaderBlock } from './_primitives/HeaderBlock';
import { SectionTitle } from './_primitives/SectionTitle';
import { ExperienceItem, SkillGroups } from './_primitives/ExperienceItem';

/**
 * 校招通用（campusClean）：单栏、教育在前、可选右上证件照。
 * 校招/实习场景的默认模板（02 §5.2）。
 */
export const CampusCleanTemplate: React.FC<{ data: ResumeData }> = memo(({ data }) => {
  const { profile, modules } = data;
  // 空模块不渲染标题（可见 + 有内容 才显示）
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
                  <ExperienceItem key={item.id} item={item} showLocation={module.type === 'campus'} />
                ))}
              </div>
            )}
          </div>
        ))}
      </SingleColumnLayout>
    </ResumeChrome>
  );
});
CampusCleanTemplate.displayName = 'CampusCleanTemplate';
