import React from 'react';
import { ResumeProfile } from '@/app/types/resume';
import { useAvatarObjectUrl } from '@/app/hooks/useAvatarObjectUrl';
import { fs } from './ResumeChrome';

/**
 * 顶部横幅头（校招特征）：主题色底 + 白字姓名/意向居中 + 联系方式一行细白字。
 * 只占顶部 ~50mm，不用大渐变；横幅下方自然进入单栏内容。
 * 强调色来自 var(--color-primary)（ThemeWrapper 注入），不写死 hex。
 */
export const PageBanner: React.FC<{
  profile: ResumeProfile;
  accent?: string;
  privacyBlur?: boolean;
  nameSizePt?: number;
  photoShape?: 'rect' | 'rounded';
  photoSize?: 'sm' | 'md' | 'lg';
}> = ({ profile, accent = 'var(--color-primary)', privacyBlur = false, nameSizePt = 18, photoShape = 'rect', photoSize = 'md' }) => {
  const avatarUrl = useAvatarObjectUrl(profile.avatar || '');
  const mask = (v: string) => (privacyBlur && v ? '***' : v);
  const sizes = { sm: { w: 20, h: 28 }, md: { w: 22, h: 30.8 }, lg: { w: 25, h: 35 } } as const;
  const size = sizes[photoSize] || sizes.md;

  const parts: React.ReactNode[] = [];
  if (profile.phone) parts.push(<span key="p" className="break-words">{mask(profile.phone)}</span>);
  if (profile.email) parts.push(<span key="e" className="break-words">{mask(profile.email)}</span>);
  if (profile.location) parts.push(<span key="l" className="break-words">{profile.location}</span>);
  if (profile.wechat) parts.push(<span key="w" className="break-words">微信:{mask(profile.wechat)}</span>);

  return (
    <div
      style={{
        backgroundColor: accent,
        color: '#fff',
        margin: 'calc(var(--rx-page-padding, 16mm) * -1)',
        marginBottom: 0,
        padding: '10mm 12mm 8mm',
        textAlign: 'center',
      }}
    >
      {avatarUrl && (
        <img
          src={avatarUrl}
          alt="证件照"
          style={{
            width: `${size.w}mm`,
            height: `${size.h}mm`,
            objectFit: 'cover',
            borderRadius: photoShape === 'rounded' ? '3px' : '1.5px',
            display: 'block',
            margin: '0 auto 4mm',
          }}
        />
      )}
      <div className="min-w-0 break-words" style={{ fontSize: fs(nameSizePt), fontWeight: 700 }}>
        {privacyBlur && profile.name ? '（已隐藏）' : (profile.name || '姓名')}
      </div>
      {profile.title && <div className="min-w-0 break-words" style={{ fontSize: fs(11), opacity: 0.92, marginTop: '1.5mm' }}>{profile.title}</div>}
      {parts.length > 0 && (
        <div style={{ fontSize: fs(9), opacity: 0.85, marginTop: '3mm', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '1.5mm 4mm', color: '#fff' }}>
          {parts.map((p, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span style={{ opacity: 0.6 }}>·</span>}
              {p}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};
