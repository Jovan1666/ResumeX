import React from 'react';
import { ResumeData } from '@/app/types/resume';

/**
 * ResumeChrome：A4 纸面外壳。
 * - padding 由 --rx-page-padding 变量控制（模板原语自己读取）
 * - 根节点不额外垫 padding；宽度 210mm、最小高 297mm
 * - className rx-page 供 print.css 分页
 */
export const ResumeChrome: React.FC<{
  data: ResumeData;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}> = ({ data, children, className = '', style }) => {
  const fontSize = data.settings.fontSizeScale || 1;
  return (
    <div
      className={`rx-page w-full ${className}`}
      style={{
        width: '210mm',
        minHeight: '297mm',
        fontSize: `${10.5 * fontSize}pt`,
        color: '#222222',
        lineHeight: 1.25,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
/** 单栏原语：读取 --rx-page-padding 作为内边距 */
export const SingleColumnLayout: React.FC<{
  data: ResumeData;
  children: React.ReactNode;
  className?: string;
  paddingOverrides?: React.CSSProperties;
}> = ({ data, children, className = '', paddingOverrides }) => {
  // 字体缩放由 ResumeChrome 统一；这里仅占位（避免 TS 未使用参数）
  void data;
  return (
    <div
      className={`rx-single-column ${className}`}
      style={{
        padding: 'var(--rx-page-padding, 16mm)',
        background: '#fff',
        ...paddingOverrides,
      }}
    >
      {children}
    </div>
  );
};
