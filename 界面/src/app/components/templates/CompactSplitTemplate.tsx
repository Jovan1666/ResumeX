import React, { memo } from 'react';
import { ResumeData, ResumeItem } from '@/app/types/resume';
import { ResumeChrome } from './_primitives/ResumeChrome';
import { SectionTitle } from './_primitives/SectionTitle';
import { ExperienceItem, SkillGroups } from './_primitives/ExperienceItem';
import { useAvatarObjectUrl } from '@/app/hooks/useAvatarObjectUrl';

/**
 * 双栏紧凑（compactSplit）：左 ≤28% 浅底（不是满色），右主经历；色条贴纸边。
 * 外层 padding: 0；左栏背景铺满纸边；左右内文各自 padding。
 * 网申解析较差（R5）→ 默认列表藏「更多」。
 */
export const CompactSplitTemplate: React.FC<{ data: ResumeData }> = memo(({ data }) => {
  const { profile, modules } = data;
  const visibleModules = modules.filter((m) => m.visible && m.items.length > 0);
  const avatarUrl = useAvatarObjectUrl(profile.avatar || '');

  // 左栏：联系方式 + 技能 + 自我评价；右栏：经历（自动过滤已放左栏的内容：不按类型分，直接去除 skills 和 summary）
  const leftModules = visibleModules.filter((m) => m.type === 'skills');
  const rightModules = visibleModules.filter((m) => m.type !== 'skills');

  return (
    <ResumeChrome data={data}>
      {/* 外层 padding 0，双栏满出血 */}
      <div className="flex w-full min-h-[297mm]" style={{ width: '210mm' }}>
        {/* 左栏 ≤25% 浅底，色条贴纸边（V1 审查：不取满屏深色块，用浅色底+左缘细色条） */}
        <div
          className="rx-left-column flex-shrink-0 flex flex-col relative"
          style={{
            width: '25%',
            backgroundColor: '#FAFAFA',
            padding: 'var(--rx-page-padding, 16mm) 5mm',
          }}
        >
          {/* 左缘细色条（贴纸边，不占满色块） */}
          <span
            className="absolute left-0 top-0 bottom-0"
            style={{ width: '2mm', backgroundColor: 'var(--color-primary, #B85858)' }}
          />
          {avatarUrl && (
            <img
              src={avatarUrl}
              alt="证件照"
              className="mb-3 mx-auto"
              style={{ width: '24mm', height: '33.6mm', objectFit: 'cover', borderRadius: '1px' }}
            />
          )}
          {/* 姓名/意向 */}
          <h1 style={{ fontSize: '16pt', fontWeight: 700, color: '#111', textAlign: 'center' }}>
            {profile.name || '姓名'}
          </h1>
          {profile.title && (
            <p style={{ fontSize: '10pt', color: '#444', textAlign: 'center', marginTop: '1.5mm' }}>
              {profile.title}
            </p>
          )}

          {/* 联系 */}
          {(profile.phone || profile.email || profile.location || profile.wechat) && (
            <div className="mt-4 rx-section">
              <SectionTitle title="联系方式" variant="bar" colorVar="#B85858" sizePt={11.5} />
              <div style={{ fontSize: '9pt', color: '#333', lineHeight: 1.6 }}>
                {profile.phone && <p>电话：{profile.phone}</p>}
                {profile.email && <p>邮箱：{profile.email}</p>}
                {profile.location && <p>城市：{profile.location}</p>}
                {profile.wechat && <p>微信：{profile.wechat}</p>}
              </div>
            </div>
          )}

          {profile.summary && (
            <div className="mt-4 rx-section">
              <SectionTitle title="自我评价" variant="bar" colorVar="#B85858" sizePt={11.5} />
              <p style={{ fontSize: '9pt', color: '#333', lineHeight: 1.5 }}>{profile.summary}</p>
            </div>
          )}

          {leftModules.map((module) => (
            <div key={module.id} className="mt-4 rx-section">
              <SectionTitle title={module.title} variant="bar" colorVar="#B85858" sizePt={11.5} />
              <SkillGroups items={module.items as { id: string; name: string; group?: string }[]} compact />
            </div>
          ))}
        </div>

        {/* 右栏：主经历，白底（色条已由左栏左缘承担，保持克制） */}
        <div className="flex-1 relative" style={{ padding: 'var(--rx-page-padding, 16mm) 8mm' }}>
          {rightModules.map((module) => (
            <div key={module.id} className="rx-section mb-3">
              <SectionTitle title={module.title} variant="line" colorVar="#B85858" />
              <div className="space-y-2">
                {(module.items as ResumeItem[]).map((item) => (
                  <ExperienceItem key={item.id} item={item} showLocation={false} compact />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </ResumeChrome>
  );
});
CompactSplitTemplate.displayName = 'CompactSplitTemplate';
