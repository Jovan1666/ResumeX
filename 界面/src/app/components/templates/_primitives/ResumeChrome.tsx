import React from 'react';
import { ResumeData } from '@/app/types/resume';

/**
 * 纸面字号换算：把绝对 pt 变成随用户「字号」设置缩放的值。
 *
 * 旧实现里 ResumeChrome 只在根节点写了 fontSize，而所有原语都用绝对 pt 字面量，
 * 没有任何继承者 → fontSizeScale 对纸面 0 影响，字号滑块与「智能适应一页」是假按钮。
 * 现在统一走 --rx-fs（由 ResumeRenderer 注入在 .resume-page 上）。
 */
export const fs = (pt: number): string => `calc(${pt}pt * var(--rx-fs, 1))`;

/**
 * ResumeChrome：A4 纸面外壳。
 * - padding 由 --rx-page-padding 变量控制（模板原语自己读取）
 * - 根节点不额外垫 padding；宽度 210mm、最小高 297mm
 * - className rx-page 供 print.css 分页
 * - 不再内联 lineHeight：行距必须交给 fonts.css 的 .resume-page[data-line-height]，
 *   否则内联样式优先级更高，「行间距」设置永远不生效
 */
export const ResumeChrome: React.FC<{
  data: ResumeData;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}> = ({ data, children, className = '', style }) => {
  void data;
  return (
    <div
      className={`rx-page w-full min-w-0 break-words ${className}`}
      style={{
        width: '210mm',
        minHeight: '297mm',
        color: '#222222',
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
