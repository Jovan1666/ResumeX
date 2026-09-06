import React, { memo } from 'react';
import { ResumeData, isSkillsModule, ResumeItem } from '@/app/types/resume';
import { ResumeChrome, SingleColumnLayout } from './_primitives/ResumeChrome';
import { HeaderBlock } from './_primitives/HeaderBlock';
import { SectionTitle } from './_primitives/SectionTitle';
import { ExperienceItem, SkillGroups } from './_primitives/ExperienceItem';

/**
 * 技术简洁（techPlain）：单栏；技能分组；项目含技术栈一行文字 tag。
 * 研发岗（02 §5.2）。
 */
export const TechPlainTemplate: React.FC<{ data: ResumeData }> = memo(({ data }) => {
  const { profile, modules, settings } = data;
  const visibleModules = modules.filter((m) => m.visible && m.items.length > 0);
  const gap = settings.moduleGap ?? 6;

  // 项目经历里如果有技术栈标签（description 最后一行「技术栈：...」），以 plain 文本追加
  const renderTechStack = (item: ResumeItem) => {
    const lines = (item.description || '').split('\n');
    const stackLine = lines.find((l) => /技术栈|技术：|工具:/.test(l));
    if (!stackLine) return null;
    return (
      <div style={{ fontSize: '9pt', color: '#444', marginTop: '1pt' }}>
        <span className="font-bold" style={{ color: 'var(--color-primary)' }}>技术栈：</span>
        {stackLine.replace(/^.*?技术栈[:：]?/, '').replace(/^.*?技术：/, '').replace(/^.*?工具[:：]?/, '')}
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
            <SectionTitle title="自我评价" variant="line" colorVar="var(--color-primary)" />
            <p style={{ fontSize: '10pt', color: '#333', lineHeight: 1.4 }}>{profile.summary}</p>
          </div>
        )}

        {visibleModules.map((module) => {
          const heading = module.titleOverride || module.title;
          return (
            <div key={module.id} className="rx-section" style={{ marginBottom: `${gap}mm` }}>
              <SectionTitle title={heading} variant={module.titleStyle || 'line'} />
              {isSkillsModule(module) ? (
                <SkillGroups items={module.items as { id: string; name: string; group?: string }[]} columns={module.columns} />
              ) : (
                <div className={module.columns === 2 ? 'grid grid-cols-2 gap-x-6 gap-y-2' : 'space-y-2'}>
                  {(module.items as ResumeItem[]).map((item) => (
                    <div key={item.id}>
                      <ExperienceItem item={item} showLocation={false} bulletStyle={module.bulletStyle || 'dot'} />
                      {module.type === 'projects' && renderTechStack(item)}
                    </div>
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
TechPlainTemplate.displayName = 'TechPlainTemplate';
