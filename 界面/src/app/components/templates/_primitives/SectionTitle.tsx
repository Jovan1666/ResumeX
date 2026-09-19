import React from 'react';
import { fs } from './ResumeChrome';

/**
 * 栏目标题：三种装饰样式（可切换），默认下划线。
 * - line：主题色加粗 + 下划线
 * - bar：左侧 3px 色条 + 加粗
 * - plain：纯加粗无装饰（ATS 极简用）
 * 不作用于中文标题的 letter-spacing（禁止拉字距）。
 * rx-section-title 供 print.css 的 break-after:avoid 使用（标题不得孤悬页尾）。
 */
export const SectionTitle: React.FC<{
  title: string;
  variant?: 'line' | 'bar' | 'plain' | 'bg';
  sizePt?: number;
  colorVar?: string;
  className?: string;
  /** 是否渲染栏目标题（false 则完全省略标题） */
  showHeading?: boolean;
  /** 标题文字色（深色侧栏上需要白字；默认 #111） */
  textColor?: string;
  /** 标题居中（档案式版式） */
  align?: 'left' | 'center';
}> = ({ title, variant = 'line', sizePt = 12.5, colorVar = 'var(--color-primary)', className = '', showHeading = true, textColor = '#111', align = 'left' }) => {
  if (!showHeading) return null;
  const isCenter = align === 'center';
  if (variant === 'bg') {
    // 浅底小色块标题（主题色 12% 透明度底 + 深色文字）
    return (
      <div className={`rx-section-title mb-2 ${isCenter ? 'text-center' : ''} ${className}`}>
        <h3
          className="font-bold inline-block"
          style={{
            fontSize: fs(sizePt),
            color: textColor,
            backgroundColor: `color-mix(in srgb, ${colorVar} 12%, white)`,
            padding: '1.5pt 5pt',
            borderRadius: '2pt',
          }}
        >
          {title}
        </h3>
      </div>
    );
  }
  if (variant === 'bar') {
    return (
      <div className={`rx-section-title flex items-center gap-2 mb-1.5 ${isCenter ? 'justify-center' : ''} ${className}`}>
        <span style={{ width: '3px', height: '0.9em', backgroundColor: colorVar, borderRadius: '1px', flexShrink: 0 }} />
        <h3 className="font-bold min-w-0" style={{ fontSize: fs(sizePt), color: textColor }}>{title}</h3>
      </div>
    );
  }
  if (variant === 'plain') {
    return (
      <div className={`rx-section-title mb-1.5 ${isCenter ? 'text-center' : ''} ${className}`}>
        <h3 className="font-bold min-w-0 break-words" style={{ fontSize: fs(sizePt), color: textColor }}>{title}</h3>
      </div>
    );
  }
  return (
    <div className={`rx-section-title pb-1 mb-2 border-b ${className}`} style={{ borderColor: 'color-mix(in srgb, ' + textColor + ' 14%, transparent)' }}>
      <h3
        className="font-bold inline min-w-0 break-words"
        style={{ fontSize: fs(sizePt), color: textColor, borderBottom: `2pt solid ${colorVar}`, paddingBottom: '1pt' }}
      >
        {title}
      </h3>
    </div>
  );
};
