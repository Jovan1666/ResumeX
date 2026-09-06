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
  const { profile, modules, settings } = data;
  const visibleModules = modules.filter((m) => m.visible && m.items.length > 0);
  const gap = settings.moduleGap ?? 6;

  return (
    <ResumeChrome data={data}>
      <SingleColumnLayout data={data}>
        {/* ATS 模板：无照片位（网申解析友好）、纯黑标题、无装饰 */}
        <HeaderBlock
          profile={profile}
          showPhoto="none"
          separator="|"
          nameSizePt={17}
          privacyBlur={settings.privacyBlur}
        />

        {profile.summary && (
          <div className="rx-section" style={{ marginBottom: `${gap}mm` }}>
            <SectionTitle title="自我评价" variant="plain" colorVar="#000" />
            <p style={{ fontSize: '10pt', color: '#333', lineHeight: 1.4 }}>{profile.summary}</p>
          </div>
        )}

        {visibleModules.map((module) => {
          const heading = module.titleOverride || module.title;
          return (
            <div key={module.id} className="rx-section" style={{ marginBottom: `${gap}mm` }}>
              <SectionTitle title={heading} variant="plain" colorVar="#000" />
              {isSkillsModule(module) ? (
                <SkillGroups items={module.items as { id: string; name: string; group?: string }[]} separator="，" columns={module.columns} />
              ) : (
                <div className={module.columns === 2 ? 'grid grid-cols-2 gap-x-6 gap-y-2' : 'space-y-2'}>
                  {(module.items as ResumeItem[]).map((item) => (
                    <ExperienceItem key={item.id} item={item} showLocation={false} compact bulletStyle={module.bulletStyle || 'dot'} />
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
AtsMonoTemplate.displayName = 'AtsMonoTemplate';
