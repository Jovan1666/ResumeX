import React from 'react';

/**
 * SectionTitle：栏目标题，两种 variant：
 * - line：主题色加粗 + 下划线（推荐单栏）
 * - bar：左侧色条（3px） + 加粗文字（体制/商务）
 * 不作用于中文标题的 letter-spacing（禁止拉字距）。
 */
export const SectionTitle: React.FC<{
  title: string;
  variant?: 'line' | 'bar';
  sizePt?: number;
  colorVar?: string;
  className?: string;
}> = ({ title, variant = 'line', sizePt = 12.5, colorVar = 'var(--color-primary)', className = '' }) => {
  if (variant === 'bar') {
    return (
      <div className={`flex items-center gap-2 mb-1.5 ${className}`}>
        <span style={{ width: '3px', height: '0.9em', backgroundColor: colorVar, borderRadius: '1px' }} />
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
