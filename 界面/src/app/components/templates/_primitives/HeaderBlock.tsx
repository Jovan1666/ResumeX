import React from 'react';
import { ResumeProfile } from '@/app/types/resume';
import { useAvatarObjectUrl } from '@/app/hooks/useAvatarObjectUrl';

/** 照片尺寸设置 → 实际 mm */
const PHOTO_SIZES: Record<'sm' | 'md' | 'lg', { w: number; h: number }> = {
  sm: { w: 20, h: 28 },
  md: { w: 22, h: 30.8 },
  lg: { w: 25, h: 35 },
};

/**
 * 头部：姓名 / 求职意向 / 联系方式（`·` 或 `|` 分隔，无图标）/ 可选证件照（右上、5:7 矩形）。
 * 支持：
 * - 照片位置（right 右上 / top 顶部居中 / sidebar 左栏顶 —— sidebar 由双栏模板自行处理）
 * - 照片形状（rect 矩形 / rounded 圆角）
 * - 照片尺寸（sm/md/lg）
 * - 打码模式（privacyBlur：隐藏 phone/email/wechat 的展示，不动数据）
 */
export const HeaderBlock: React.FC<{
  profile: ResumeProfile;
  /** 照片位置：right = 右上（默认）；none = 无照片 */
  showPhoto?: 'right' | 'none';
  /** 联系字段的分隔符 */
  separator?: string;
  /** 是否显示政治面貌 / 籍贯（体制内模板） */
  showFormalFields?: boolean;
  nameSizePt?: number;
  /** 打码模式：显示 *** 替代手机/邮箱/微信 */
  privacyBlur?: boolean;
  /** 照片形状 */
  photoShape?: 'rect' | 'rounded';
  /** 照片尺寸 */
  photoSize?: 'sm' | 'md' | 'lg';
}> = ({ profile, showPhoto = 'right', separator = '·', showFormalFields = false, nameSizePt = 18, privacyBlur = false, photoShape = 'rect', photoSize = 'md' }) => {
  const avatarUrl = useAvatarObjectUrl(profile.avatar || '');
  const mask = (v: string) => (privacyBlur && v ? '***' : v);

  const contactParts: React.ReactNode[] = [];
  if (profile.phone) contactParts.push(<span key="phone">{mask(profile.phone)}</span>);
  if (profile.email) contactParts.push(<span key="email">{mask(profile.email)}</span>);
  if (profile.location) contactParts.push(<span key="loc">{profile.location}</span>);
  if (profile.wechat) contactParts.push(<span key="wechat">微信:{mask(profile.wechat)}</span>);
  if (profile.website) contactParts.push(<span key="site">{profile.website}</span>);
  if (showFormalFields) {
    if (profile.gender) contactParts.push(<span key="gender">{profile.gender}</span>);
    if (profile.politicalStatus) contactParts.push(<span key="poli">政治面貌:{profile.politicalStatus}</span>);
    if (profile.nativePlace) contactParts.push(<span key="place">籍贯:{profile.nativePlace}</span>);
  }

  // 尺寸
  const size = PHOTO_SIZES[photoSize] || PHOTO_SIZES.md;
  const radius = photoShape === 'rounded' ? '3px' : '1.5px';

  return (
    <div className="flex items-start justify-between gap-4 mb-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-3 flex-wrap">
          <h1
            className="font-bold"
            style={{ fontSize: `${nameSizePt}pt`, letterSpacing: '0.02em' }}
          >
            {privacyBlur && profile.name ? '（已隐藏）' : (profile.name || '姓名')}
          </h1>
          {profile.title && (
            <span style={{ fontSize: '11.5pt', color: '#444' }}>{profile.title}</span>
          )}
        </div>
        {contactParts.length > 0 && (
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5" style={{ fontSize: '9.5pt', color: '#333' }}>
            {contactParts.map((part, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span style={{ color: '#999' }}>{separator}</span>}
                {part}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
      {showPhoto !== 'none' && avatarUrl && (
        <img
          src={avatarUrl}
          alt="证件照"
          style={{ width: `${size.w}mm`, height: `${size.h}mm`, objectFit: 'cover', borderRadius: radius, flexShrink: 0 }}
        />
      )}
    </div>
  );
};
