import React, { memo } from 'react';
import { ResumeData, ResumeItem } from '@/app/types/resume';
import { ResumeChrome } from './_primitives/ResumeChrome';
import { SectionTitle } from './_primitives/SectionTitle';
import { ExperienceItem, SkillGroups } from './_primitives/ExperienceItem';
import { useAvatarObjectUrl } from '@/app/hooks/useAvatarObjectUrl';

/**
 * 右栏侧栏（sidebarRight）：主经历在左 70%，联系方式/技能/评价在右 30%（浅底 #F5F5F5）。
 * 与 compactSplit 相反的方向：主内容在左侧更符合阅读顺序（多数用户习惯左边看主信息）。
 */
export const SidebarRightTemplate: React.FC<{ data: ResumeData }> = memo(({ data }) => {
  const { profile, modules, settings } = data;
  const visibleModules = modules.filter((m) => m.visible && m.items.length > 0);
  const avatarUrl = useAvatarObjectUrl(profile.avatar || '');
  const gap = settings.moduleGap ?? 6;
  const mask = (v: string) => (settings.privacyBlur && v ? '***' : v);
  const accentColor = 'var(--color-primary, #2B6CB0)';

  const rightModules = visibleModules.filter((m) => m.type === 'skills');
  const leftModules = visibleModules.filter((m) => m.type !== 'skills');

  return (
    <ResumeChrome data={data}>
      <div className="flex w-full min-h-[297mm]" style={{ width: '210mm' }}>
        {/* 主经历 70% */}
        <div className="flex-1" style={{ padding: 'var(--rx-page-padding, 16mm) 7mm' }}>
          <div style={{ marginBottom: '4mm' }}>
            <h1 style={{ fontSize: '18pt', fontWeight: 700 }}>
              {settings.privacyBlur && profile.name ? '（已隐藏）' : (profile.name || '姓名')}
            </h1>
            {profile.title && <div style={{ fontSize: '11pt', color: '#444', marginTop: '1mm' }}>{profile.title}</div>}
            <div style={{ fontSize: '9pt', color: '#555', marginTop: '2mm' }}>
              {profile.phone && <span>{mask(profile.phone)}</span>}
              {profile.phone && profile.email && <span> · </span>}
              {profile.email && <span>{mask(profile.email)}</span>}
              {profile.email && profile.location && <span> · </span>}
              {profile.location && <span>{profile.location}</span>}
            </div>
          </div>

          {leftModules.map((module) => {
            const heading = module.titleOverride || module.title;
            return (
              <div key={module.id} className="rx-section" style={{ marginBottom: `${gap}mm` }}>
                <SectionTitle title={heading} variant={module.titleStyle || 'line'} colorVar={accentColor} />
                <div className={module.columns === 2 ? 'grid grid-cols-2 gap-x-6 gap-y-2' : 'space-y-2'}>
                  {(module.items as ResumeItem[]).map((item) => (
                    <ExperienceItem key={item.id} item={item} showLocation={false} bulletStyle={module.bulletStyle || 'dot'} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* 右栏 30% 浅底 */}
        <div
          className="flex-shrink-0 flex flex-col"
          style={{
            width: '30%',
            backgroundColor: '#F5F5F5',
            padding: 'var(--rx-page-padding, 16mm) 5mm',
          }}
        >
          {avatarUrl && (
            <img src={avatarUrl} alt="证件照" className="mb-3 mx-auto" style={{ width: '22mm', height: '30.8mm', objectFit: 'cover', borderRadius: '3px' }} />
          )}
          {(profile.phone || profile.email || profile.location || profile.wechat) && (
            <div className="rx-section" style={{ marginBottom: '4mm' }}>
              <SectionTitle title="联系方式" variant="bar" colorVar={accentColor} sizePt={11.5} />
              <div style={{ fontSize: '8.5pt', color: '#333', lineHeight: 1.7 }}>
                {profile.phone && <p>电话：{mask(profile.phone)}</p>}
                {profile.email && <p>邮箱：{mask(profile.email)}</p>}
                {profile.location && <p>城市：{profile.location}</p>}
                {profile.wechat && <p>微信：{mask(profile.wechat)}</p>}
              </div>
            </div>
          )}
          {profile.summary && (
            <div className="rx-section" style={{ marginBottom: '4mm' }}>
              <SectionTitle title="自我评价" variant="bar" colorVar={accentColor} sizePt={11.5} />
              <p style={{ fontSize: '8.5pt', color: '#333', lineHeight: 1.6 }}>{profile.summary}</p>
            </div>
          )}
          {rightModules.map((module) => (
            <div key={module.id} className="rx-section" style={{ marginBottom: '4mm' }}>
              <SectionTitle title={module.titleOverride || module.title} variant="bar" colorVar={accentColor} sizePt={11.5} />
              <SkillGroups items={module.items as { id: string; name: string; group?: string }[]} compact />
            </div>
          ))}
        </div>
      </div>
    </ResumeChrome>
  );
});
SidebarRightTemplate.displayName = 'SidebarRightTemplate';
