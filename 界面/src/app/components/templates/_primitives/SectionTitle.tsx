import React from 'react';

/**
 * 栏目标题：三种装饰样式（可切换），默认下划线。
 * - line：主题色加粗 + 下划线
 * - bar：左侧 3px 色条 + 加粗
 * - plain：纯加粗无装饰（ATS 极简用）
 * 不作用于中文标题的 letter-spacing（禁止拉字距）。
 */
export const SectionTitle: React.FC<{
  title: string;
  variant?: 'line' | 'bar' | 'plain' | 'bg';
  sizePt?: number;
  colorVar?: string;
  className?: string;
  /** 是否渲染栏目标题（false 则完全省略标题） */
  showHeading?: boolean;
}> = ({ title, variant = 'line', sizePt = 12.5, colorVar = 'var(--color-primary)', className = '', showHeading = true }) => {
  if (!showHeading) return null;
  if (variant === 'bg') {
    // 浅底小色块标题（主题色 10% 透明度底 + 深色文字）
    return (
      <div className={`mb-2 ${className}`}>
        <h3
          className="font-bold inline-block"
          style={{
            fontSize: `${sizePt}pt`,
            color: '#111',
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
      <div className={`flex items-center gap-2 mb-1.5 ${className}`}>
        <span style={{ width: '3px', height: '0.9em', backgroundColor: colorVar, borderRadius: '1px' }} />
        <h3 className="font-bold" style={{ fontSize: `${sizePt}pt`, color: '#111' }}>{title}</h3>
      </div>
    );
  }
  if (variant === 'plain') {
    return (
      <div className={`mb-1.5 ${className}`}>
        <h3 className="font-bold" style={{ fontSize: `${sizePt}pt`, color: '#111' }}>{title}</h3>
      </div>
    );
  }
  return (
    <div className={`pb-1 mb-2 border-b ${className}`} style={{ borderColor: 'rgba(0,0,0,0.12)' }}>
      <h3
        className="font-bold inline"
        style={{ fontSize: `${sizePt}pt`, color: '#111', borderBottom: `2pt solid ${colorVar}`, paddingBottom: '1pt' }}
      >
        {title}
      </h3>
    </div>
  );
};
