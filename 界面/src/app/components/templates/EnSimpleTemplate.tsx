import React, { memo } from 'react';
import { ResumeData, isSkillsModule, ResumeItem } from '@/app/types/resume';
import { ResumeChrome, SingleColumnLayout } from './_primitives/ResumeChrome';
import { HeaderBlock } from './_primitives/HeaderBlock';
import { SectionTitle } from './_primitives/SectionTitle';
import { SkillGroups } from './_primitives/ExperienceItem';

/**
 * 英文简洁（enSimple）：仅这一套允许英文栏目标题；单栏、外企/留学；仍禁止 infographic。
 */
// 中文标题 → 英文栏目标题
const EN_TITLES: Record<string, string> = {
  '教育背景': 'Education',
  '工作经历': 'Experience',
  '实习经历': 'Internship',
  '项目经历': 'Projects',
  '校园经历': 'Campus Activities',
  '荣誉奖项': 'Honors & Awards',
  '技能特长': 'Skills',
  '专业技能': 'Skills',
  '自我评价': 'Profile',
  '项目经验': 'Projects',
};

export const EnSimpleTemplate: React.FC<{ data: ResumeData }> = memo(({ data }) => {
  const { profile, modules } = data;
  const visibleModules = modules.filter((m) => m.visible && m.items.length > 0);

  return (
    <ResumeChrome data={data}>
      <SingleColumnLayout data={data}>
        <HeaderBlock profile={profile} showPhoto="right" separator="|" nameSizePt={16} />

        {profile.summary && (
          <div className="rx-section mb-3">
            <SectionTitle title="Profile" variant="line" colorVar="#000" sizePt={12} />
            <p style={{ fontSize: '10pt', color: '#333', lineHeight: 1.4 }}>{profile.summary}</p>
          </div>
        )}

        {visibleModules.map((module) => {
          const enTitle = EN_TITLES[module.title] || module.title;
          return (
            <div key={module.id} className="rx-section mb-3">
              <SectionTitle title={enTitle} variant="line" colorVar="#000" sizePt={12} />
              {isSkillsModule(module) ? (
                <SkillGroups items={module.items as { id: string; name: string; group?: string }[]} separator=", " />
              ) : (
                <div className="space-y-2">
                  {(module.items as ResumeItem[]).map((item) => (
                    <div key={item.id} className="rx-item mb-2.5 last:mb-0">
                      <div className="flex justify-between items-baseline gap-2">
                        <div className="min-w-0">
                          <h4 className="font-bold" style={{ fontSize: '10.5pt', color: '#111' }}>
                            {item.title}
                          </h4>
                          {item.subtitle && <span style={{ fontSize: '9.5pt', color: '#555' }}>{item.subtitle}</span>}
                        </div>
                        {item.date && <span style={{ fontSize: '9.5pt', color: '#444', whiteSpace: 'nowrap' }}>{item.date}</span>}
                      </div>
                      <div className="mt-0.5 whitespace-pre-line" style={{ fontSize: '10pt', color: '#333', lineHeight: 1.3 }}>
                        {item.description}
                      </div>
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
EnSimpleTemplate.displayName = 'EnSimpleTemplate';
