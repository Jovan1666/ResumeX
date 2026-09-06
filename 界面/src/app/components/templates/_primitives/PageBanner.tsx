import React from 'react';
import { ResumeProfile } from '@/app/types/resume';
import { useAvatarObjectUrl } from '@/app/hooks/useAvatarObjectUrl';

/**
 * 顶部横幅头（校招特征）：主题色底 + 白字姓名/意向居中 + 联系方式一行细白字。
 * 只占顶部 ~50mm，不用大渐变；横幅下方自然进入单栏内容。
 */
export const PageBanner: React.FC<{
  profile: ResumeProfile;
  accent?: string;
  privacyBlur?: boolean;
  nameSizePt?: number;
}> = ({ profile, accent = 'var(--color-primary)', privacyBlur = false, nameSizePt = 18 }) => {
  const avatarUrl = useAvatarObjectUrl(profile.avatar || '');
  const mask = (v: string) => (privacyBlur && v ? '***' : v);

  const parts: React.ReactNode[] = [];
  if (profile.phone) parts.push(<span key="p">{mask(profile.phone)}</span>);
  if (profile.email) parts.push(<span key="e">{mask(profile.email)}</span>);
  if (profile.location) parts.push(<span key="l">{profile.location}</span>);
  if (profile.wechat) parts.push(<span key="w">微信:{mask(profile.wechat)}</span>);

  return (
    <div
      style={{
        backgroundColor: accent,
        color: '#fff',
        margin: 'calc(var(--rx-page-padding, 16mm) * -1)',
        marginBottom: 0,
        padding: '10mm 0 8mm',
        textAlign: 'center',
      }}
    >
      {avatarUrl && (
        <img
          src={avatarUrl}
          alt="证件照"
          style={{ width: '20mm', height: '28mm', objectFit: 'cover', borderRadius: '3px', display: 'block', margin: '0 auto 4mm' }}
        />
      )}
      <div style={{ fontSize: `${nameSizePt}pt`, fontWeight: 700, letterSpacing: '0.05em' }}>
        {privacyBlur && profile.name ? '（已隐藏）' : (profile.name || '姓名')}
      </div>
      {profile.title && <div style={{ fontSize: '11pt', opacity: 0.92, marginTop: '1.5mm' }}>{profile.title}</div>}
      {parts.length > 0 && (
        <div style={{ fontSize: '9pt', opacity: 0.85, marginTop: '3mm', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '1.5mm 4mm', color: '#fff' }}>
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
