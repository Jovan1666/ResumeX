import React, { memo } from 'react';
import { ResumeData, ResumeItem } from '@/app/types/resume';
import { ResumeChrome } from './_primitives/ResumeChrome';
import { SectionTitle } from './_primitives/SectionTitle';
import { ExperienceItem, SkillGroups } from './_primitives/ExperienceItem';
import { useAvatarObjectUrl } from '@/app/hooks/useAvatarObjectUrl';

/**
 * 深蓝侧栏商务（navySidebar）：左栏 20% 深蓝底（白字联系方式+技能），右栏 80% 主经历。
 * 深蓝侧栏 ≤20%（避开 30% 满屏色块红线），栏目全中文，无英文 Contact。
 */
export const NavySidebarTemplate: React.FC<{ data: ResumeData }> = memo(({ data }) => {
  const { profile, modules, settings } = data;
  const visibleModules = modules.filter((m) => m.visible && m.items.length > 0);
  const avatarUrl = useAvatarObjectUrl(profile.avatar || '');
  const gap = settings.moduleGap ?? 6;
  const mask = (v: string) => (settings.privacyBlur && v ? '***' : v);

  const leftModules = visibleModules.filter((m) => m.type === 'skills');
  const rightModules = visibleModules.filter((m) => m.type !== 'skills');

  return (
    <ResumeChrome data={data}>
      <div className="flex w-full min-h-[297mm]" style={{ width: '210mm' }}>
        {/* 左栏 20% 深蓝底（≤30% 红线），白字 */}
        <div
          className="rx-left-column flex-shrink-0 flex flex-col"
          style={{
            width: '20%',
            backgroundColor: '#1E3A5F',
            color: '#fff',
            padding: 'var(--rx-page-padding, 16mm) 4mm',
          }}
        >
          {avatarUrl && (
            <img
              src={avatarUrl}
              alt="证件照"
              className="mb-3 mx-auto"
              style={{ width: '22mm', height: '30.8mm', objectFit: 'cover', borderRadius: '3px' }}
            />
          )}
          <h1 style={{ fontSize: '15pt', fontWeight: 700, textAlign: 'center' }}>
            {settings.privacyBlur && profile.name ? '（已隐藏）' : (profile.name || '姓名')}
          </h1>
          {profile.title && (
            <p style={{ fontSize: '9.5pt', opacity: 0.9, textAlign: 'center', marginTop: '1mm' }}>{profile.title}</p>
          )}

          {(profile.phone || profile.email || profile.location || profile.wechat) && (
            <div className="mt-4 rx-section">
              <div style={{ fontSize: '10pt', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.4)', paddingBottom: '1mm', marginBottom: '2mm' }}>
                联系方式
              </div>
              <div style={{ fontSize: '8.5pt', lineHeight: 1.7, opacity: 0.95 }}>
                {profile.phone && <p>电话：{mask(profile.phone)}</p>}
                {profile.email && <p>邮箱：{mask(profile.email)}</p>}
                {profile.location && <p>城市：{profile.location}</p>}
                {profile.wechat && <p>微信：{mask(profile.wechat)}</p>}
              </div>
            </div>
          )}

          {profile.summary && (
            <div className="mt-4 rx-section">
              <div style={{ fontSize: '10pt', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.4)', paddingBottom: '1mm', marginBottom: '2mm' }}>
                自我评价
              </div>
              <p style={{ fontSize: '8.5pt', lineHeight: 1.6, opacity: 0.95 }}>{profile.summary}</p>
            </div>
          )}

          {leftModules.map((module) => (
            <div key={module.id} className="mt-4 rx-section">
              <div style={{ fontSize: '10pt', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.4)', paddingBottom: '1mm', marginBottom: '2mm' }}>
                {module.titleOverride || module.title}
              </div>
              <SkillGroups items={module.items as { id: string; name: string; group?: string }[]} compact />
            </div>
          ))}
        </div>

        {/* 右栏 80% 主经历（白底、淡灰下划线标题） */}
        <div className="flex-1" style={{ padding: 'var(--rx-page-padding, 16mm) 8mm' }}>
          {rightModules.map((module) => {
            const heading = module.titleOverride || module.title;
            return (
              <div key={module.id} className="rx-section" style={{ marginBottom: `${gap}mm` }}>
                <SectionTitle title={heading} variant={module.titleStyle || 'line'} colorVar="#1E3A5F" />
                <div className={module.columns === 2 ? 'grid grid-cols-2 gap-x-6 gap-y-2' : 'space-y-2'}>
                  {(module.items as ResumeItem[]).map((item) => (
                    <ExperienceItem key={item.id} item={item} showLocation={false} bulletStyle={module.bulletStyle || 'dot'} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ResumeChrome>
  );
});
NavySidebarTemplate.displayName = 'NavySidebarTemplate';
