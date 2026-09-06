import React from 'react';
import { ResumeItem } from '@/app/types/resume';

/**
 * 单条经历：标题（加粗）+ 机构（灰）+ 日期（右对齐）+ 描述（按行 split）。
 * 项目符号样式可切换（dot 圆点 / dash 短横线 / none 无）。
 */
export const ExperienceItem: React.FC<{
  item: ResumeItem;
  showLocation?: boolean;
  compact?: boolean;
  /** 项目符号样式（来自模块设置） */
  bulletStyle?: 'dot' | 'dash' | 'none';
}> = ({ item, showLocation = false, compact = false, bulletStyle = 'dot' }) => {
  const descriptionLines = (item.description || '').split('\n').map(s => s.trim()).filter(Boolean);
  const bullet = bulletStyle === 'dash' ? '—' : bulletStyle === 'none' ? '' : '•';

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
                {bulletStyle === 'none' ? line : hasBullet ? line : `${bullet} ${line}`}
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
  /** 两列显示（教育/技能常用） */
  columns?: 1 | 2;
}> = ({ items, separator = '、', compact = false, columns = 1 }) => {
  // 按 group 分组；无 group 的都归入「技能」
  const groups = new Map<string, { id: string; name: string }[]>();
  const add = (g: string, item: { id: string; name: string }) => {
    const arr = groups.get(g) || [];
    arr.push(item);
    groups.set(g, arr);
  };
  items.forEach((it) => add(it.group || '技能', it));

  const style = { fontSize: compact ? '9.5pt' : '10pt', color: '#222', lineHeight: 1.4 };
  const groupsList = Array.from(groups.entries());

  // 两列：按「组 → 组」并排（不足两组则单列）
  if (columns === 2) {
    const rows: [string, { id: string; name: string }[]][] = [];
    for (let i = 0; i < groupsList.length; i += 2) {
      rows.push([groupsList[i][0], groupsList[i][1]]);
      if (groupsList[i + 1]) rows.push([groupsList[i + 1][0], groupsList[i + 1][1]]);
      // 用占位表示两列布局（这里直接渲染两个段）
    }
    // 简化：每行两个组
    return (
      <div className="space-y-1">
        {Array.from({ length: Math.ceil(groupsList.length / 2) }).map((_, i) => {
          const left = groupsList[i * 2];
          const right = groupsList[i * 2 + 1];
          return (
            <div key={i} className="flex gap-x-6">
              <div className="flex-1 flex items-baseline gap-1.5">
                {left && left[0] !== '技能' && <span className="font-bold" style={{ fontSize: '10pt' }}>{left[0]}:</span>}
                <span style={style}>{left ? left[1].map(x => x.name).join(separator) : ''}</span>
              </div>
              <div className="flex-1 flex items-baseline gap-1.5">
                {right && right[0] !== '技能' && <span className="font-bold" style={{ fontSize: '10pt' }}>{right[0]}:</span>}
                <span style={style}>{right ? right[1].map(x => x.name).join(separator) : ''}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {groupsList.map(([group, list]) => {
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
