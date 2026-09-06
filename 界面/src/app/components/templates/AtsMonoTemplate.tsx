import React, { memo } from 'react';
import { ResumeData, isSkillsModule, ResumeItem } from '@/app/types/resume';
import { ResumeChrome, SingleColumnLayout } from './_primitives/ResumeChrome';
import { HeaderBlock } from './_primitives/HeaderBlock';
import { SectionTitle } from './_primitives/SectionTitle';
import { ExperienceItem, SkillGroups } from './_primitives/ExperienceItem';

/**
 * 极简黑白（atsMono）：单栏纯黑、无图标、ATS/网申解析最友好。
 * 标题用黑色加粗 + 黑下划线（无主题色强调）。
 */
export const AtsMonoTemplate: React.FC<{ data: ResumeData }> = memo(({ data }) => {
  const { profile, modules } = data;
  const visibleModules = modules.filter((m) => m.visible && m.items.length > 0);

  return (
    <ResumeChrome data={data}>
      <SingleColumnLayout data={data}>
        <HeaderBlock profile={profile} showPhoto="none" separator="|" nameSizePt={17} />

        {profile.summary && (
          <div className="rx-section mb-3">
            <SectionTitle title="自我评价" variant="line" colorVar="#000" />
            <p style={{ fontSize: '10pt', color: '#333', lineHeight: 1.4 }}>{profile.summary}</p>
          </div>
        )}

        {visibleModules.map((module) => (
          <div key={module.id} className="rx-section mb-3">
            <SectionTitle title={module.title} variant="line" colorVar="#000" />
            {isSkillsModule(module) ? (
              <SkillGroups items={module.items as { id: string; name: string; group?: string }[]} separator="，" />
            ) : (
              <div className="space-y-2">
                {(module.items as ResumeItem[]).map((item) => (
                  <ExperienceItem key={item.id} item={item} showLocation={false} compact />
                ))}
              </div>
            )}
          </div>
        ))}
      </SingleColumnLayout>
    </ResumeChrome>
  );
});
AtsMonoTemplate.displayName = 'AtsMonoTemplate';
