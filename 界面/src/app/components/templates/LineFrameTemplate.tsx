import React, { memo } from 'react';
import { ResumeData, isSkillsModule, ResumeItem } from '@/app/types/resume';
import { ResumeChrome } from './_primitives/ResumeChrome';
import { SectionTitle } from './_primitives/SectionTitle';
import { ExperienceItem, SkillGroups } from './_primitives/ExperienceItem';

/**
 * 细线框档案（lineFrame）：页面四周 1.5px 主题色细线框（像档案/公文），
 * 姓名居中，栏目标题居中加粗（有细线分隔），内容左侧对齐。端庄、辨识度高。
 */
export const LineFrameTemplate: React.FC<{ data: ResumeData }> = memo(({ data }) => {
  const { profile, modules, settings } = data;
  const visibleModules = modules.filter((m) => m.visible && m.items.length > 0);
  const gap = settings.moduleGap ?? 6;

  return (
    <ResumeChrome data={data}>
      {/* 细线框：外衬 3mm 边距 + 1.5px 边框 */}
      <div style={{ padding: '3mm', width: '210mm', minHeight: '297mm', boxSizing: 'border-box' }}>
        <div
          className="rx-page-frame"
          style={{
            border: '1.5pt solid var(--color-primary, #1E3A5F)',
            padding: 'calc(var(--rx-page-padding, 16mm) * 0.8) calc(var(--rx-page-padding, 16mm) * 0.8)',
            minHeight: '291mm',
            boxSizing: 'border-box',
          }}
        >
          {/* 姓名居中（区别于右上的单栏模板） */}
          <div style={{ textAlign: 'center', marginBottom: '5mm' }}>
            <h1 style={{ fontSize: '19pt', fontWeight: 700, letterSpacing: '0.1em' }}>
              {settings.privacyBlur && profile.name ? '（已隐藏）' : (profile.name || '姓名')}
            </h1>
            {profile.title && <div style={{ fontSize: '11pt', color: '#444', marginTop: '1mm' }}>{profile.title}</div>}
            <div style={{ fontSize: '9pt', color: '#555', marginTop: '2mm' }}>
              {profile.phone && <span>{settings.privacyBlur ? '***' : profile.phone}</span>}
              {profile.phone && profile.email && <span> · </span>}
              {profile.email && <span>{settings.privacyBlur ? '***' : profile.email}</span>}
              {profile.email && profile.location && <span> · </span>}
              {profile.location && <span>{profile.location}</span>}
              {profile.location && profile.wechat && <span> · </span>}
              {profile.wechat && <span>微信:{settings.privacyBlur ? '***' : profile.wechat}</span>}
            </div>
          </div>

          {profile.summary && (
            <div className="rx-section" style={{ marginBottom: `${gap}mm` }}>
              <SectionTitle title="自我评价" variant="plain" />
              <p style={{ fontSize: '10pt', color: '#333', lineHeight: 1.4 }}>{profile.summary}</p>
            </div>
          )}

          {visibleModules.map((module) => {
            const heading = module.titleOverride || module.title;
            return (
              <div key={module.id} className="rx-section" style={{ marginBottom: `${gap}mm` }}>
                <SectionTitle title={heading} variant={module.titleStyle || 'plain'} />
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
        </div>
      </div>
    </ResumeChrome>
  );
});
LineFrameTemplate.displayName = 'LineFrameTemplate';
