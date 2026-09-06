import React, { memo } from 'react';
import { ResumeData, isSkillsModule, ResumeItem } from '@/app/types/resume';
import { ResumeChrome, SingleColumnLayout } from './_primitives/ResumeChrome';
import { HeaderBlock } from './_primitives/HeaderBlock';
import { SectionTitle } from './_primitives/SectionTitle';
import { ExperienceItem, SkillGroups } from './_primitives/ExperienceItem';

/**
 * 体制公文（civilFile）：单栏、矩形证件照、显示政治面貌/籍贯、无致谢。
 * 公务员/事业单位（02 §5.2）。
 */
export const CivilFileTemplate: React.FC<{ data: ResumeData }> = memo(({ data }) => {
  const { profile, modules } = data;
  const visibleModules = modules.filter((m) => m.visible && m.items.length > 0);

  return (
    <ResumeChrome data={data}>
      <SingleColumnLayout data={data}>
        <HeaderBlock profile={profile} showPhoto="right" showFormalFields nameSizePt={17} separator="|" />

        {profile.summary && (
          <div className="rx-section mb-3">
            <SectionTitle title="自我评价" variant="bar" colorVar="#1A1A1A" />
            <p style={{ fontSize: '10pt', color: '#333', lineHeight: 1.4 }}>{profile.summary}</p>
          </div>
        )}

        {visibleModules.map((module) => (
          <div key={module.id} className="rx-section mb-3">
            <SectionTitle title={module.title} variant="bar" colorVar="#1A1A1A" />
            {isSkillsModule(module) ? (
              <SkillGroups items={module.items as { id: string; name: string; group?: string }[]} separator="，" />
            ) : (
              <div className="space-y-2">
                {(module.items as ResumeItem[]).map((item) => (
                  <ExperienceItem key={item.id} item={item} showLocation={false} />
                ))}
              </div>
            )}
          </div>
        ))}

        {/* 自定义字段（政治面貌/籍贯 已在头部显示；此处防遗漏） */}
        {profile.customFields && profile.customFields.filter(f => f.label && f.value).length > 0 && (
          <div className="rx-section mb-3">
            <SectionTitle title="补充信息" variant="bar" colorVar="#1A1A1A" />
            <div style={{ fontSize: '10pt', color: '#333', lineHeight: 1.5 }}>
              {profile.customFields.filter(f => f.label && f.value).map((f) => (
                <p key={f.id}><span className="font-bold">{f.label}：</span>{f.value}</p>
              ))}
            </div>
          </div>
        )}
      </SingleColumnLayout>
    </ResumeChrome>
  );
});
CivilFileTemplate.displayName = 'CivilFileTemplate';
