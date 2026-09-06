import React from 'react';
import { ResumeProfile } from '@/app/types/resume';
import { useAvatarObjectUrl } from '@/app/hooks/useAvatarObjectUrl';

/**
 * HeaderBlock：姓名 / 求职意向 / 联系方式（一行或两行，`·` 分隔，无图标）/ 可选证件照（右上、5:7 矩形）。
 * 主题色只用于姓名点缀；正文近黑。
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
}> = ({ profile, showPhoto = 'right', separator = '·', showFormalFields = false, nameSizePt = 18 }) => {
  const avatarUrl = useAvatarObjectUrl(profile.avatar || '');

  const contactParts: React.ReactNode[] = [];
  if (profile.phone) contactParts.push(<span key="phone">{profile.phone}</span>);
  if (profile.email) contactParts.push(<span key="email">{profile.email}</span>);
  if (profile.location) contactParts.push(<span key="loc">{profile.location}</span>);
  if (profile.wechat) contactParts.push(<span key="wechat">微信:{profile.wechat}</span>);
  if (profile.website) contactParts.push(<span key="site">{profile.website}</span>);
  if (showFormalFields) {
    if (profile.gender) contactParts.push(<span key="gender">{profile.gender}</span>);
    if (profile.politicalStatus) contactParts.push(<span key="poli">政治面貌:{profile.politicalStatus}</span>);
    if (profile.nativePlace) contactParts.push(<span key="place">籍贯:{profile.nativePlace}</span>);
  }

  return (
    <div className="flex items-start justify-between gap-4 mb-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-3 flex-wrap">
          <h1
            className="font-bold"
            style={{ fontSize: `${nameSizePt}pt`, letterSpacing: '0.02em' }}
          >
            {profile.name || '姓名'}
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
          style={{ width: '22mm', height: '30.8mm', objectFit: 'cover', borderRadius: '1.5px' }}
        />
      )}
    </div>
  );
};
