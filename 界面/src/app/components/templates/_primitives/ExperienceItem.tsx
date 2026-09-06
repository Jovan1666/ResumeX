import React from 'react';
import { ResumeItem } from '@/app/types/resume';

/**
 * 单条经历：标题（加粗）+ 机构（灰）+ 日期（右对齐）+ 描述（按行 split，行首已有 •/-/· 不重复加点）。
 */
export const ExperienceItem: React.FC<{
  item: ResumeItem;
  showLocation?: boolean;
  compact?: boolean;
}> = ({ item, showLocation = false, compact = false }) => {
  const descriptionLines = (item.description || '').split('\n').map(s => s.trim()).filter(Boolean);

  return (
    <div className="rx-item mb-2.5 last:mb-0">
      <div className="flex justify-between items-baseline gap-2">
        <div className="flex items-baseline gap-2 flex-wrap min-w-0">
          <h4 className="font-bold" style={{ fontSize: compact ? '10pt' : '10.5pt', color: '#111' }}>
            {item.title}
          </h4>
          {item.subtitle && (
            <span style={{ fontSize: '9.5pt', color: '#555' }}>{item.subtitle}</span>
          )}
          {showLocation && item.location && (
            <span style={{ fontSize: '9pt', color: '#666' }}>{item.location}</span>
          )}
        </div>
        {item.date && (
          <span className="whitespace-nowrap flex-shrink-0" style={{ fontSize: '9.5pt', color: '#444' }}>
            {item.date}
          </span>
        )}
      </div>
      {descriptionLines.length > 0 && (
        <div className="mt-0.5" style={{ fontSize: '10pt', color: '#333', lineHeight: 1.3 }}>
          {descriptionLines.map((line, i) => {
            const hasBullet = /^[•·\-–—*]/.test(line);
            return (
              <p key={i} className="leading-snug">
                {hasBullet ? line : `• ${line}`}
              </p>
            );
          })}
        </div>
      )}
    </div>
  );
};

/** 技能分组：组名 + 标签逗号连接（不渲染百分比条）。无 group 时直接显示列表，不加「技能:」前缀 */
export const SkillGroups: React.FC<{
  items: { id: string; name: string; group?: string }[];
  /** 分隔符 */
  separator?: string;
  compact?: boolean;
}> = ({ items, separator = '、', compact = false }) => {
  // 按 group 分组；无 group 的都归入「技能」（但渲染时去掉前缀，直接列）
  const groups = new Map<string, { id: string; name: string }[]>();
  const add = (g: string, item: { id: string; name: string }) => {
    const arr = groups.get(g) || [];
    arr.push(item);
    groups.set(g, arr);
  };
  items.forEach((it) => add(it.group || '技能', it));

  const style = { fontSize: compact ? '9.5pt' : '10pt', color: '#222', lineHeight: 1.4 };
  return (
    <div className="space-y-1">
      {Array.from(groups.entries()).map(([group, list]) => {
        // 无分组名（即默认「技能」）→ 直接显示标签列表
        const isPlain = group === '技能';
        return (
          <div key={group} className="flex items-baseline gap-1.5">
            {!isPlain && <span className="font-bold" style={{ fontSize: '10pt' }}>{group}:</span>}
            <span style={style}>{list.map(x => x.name).join(separator)}</span>
          </div>
        );
      })}
    </div>
  );
};
