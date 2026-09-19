import React from 'react';
import { ResumeItem } from '@/app/types/resume';
import { fs } from './ResumeChrome';

/**
 * 单条经历：标题（加粗）+ 机构（灰）+ 日期（右对齐）+ 描述（按行 split）。
 * 项目符号样式可切换（dot 圆点 / dash 短横线 / none 无）。
 *
 * 字号一律走 fs()，行距一律继承 --rx-lh：
 * 之前这里写死 pt 与 lineHeight 字面量，导致「字号」「行间距」两个设置完全无效。
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
          <h4 className="font-bold min-w-0 break-words" style={{ fontSize: fs(compact ? 10 : 10.5), color: '#111' }}>
            {item.title}
          </h4>
          {item.subtitle && (
            <span className="min-w-0 break-words" style={{ fontSize: fs(9.5), color: '#555' }}>{item.subtitle}</span>
          )}
          {showLocation && item.location && (
            <span style={{ fontSize: fs(9), color: '#666' }}>{item.location}</span>
          )}
        </div>
        {item.date && (
          <span className="whitespace-nowrap flex-shrink-0" style={{ fontSize: fs(9.5), color: '#444' }}>
            {item.date}
          </span>
        )}
      </div>
      {descriptionLines.length > 0 && (
        <div className="mt-0.5" style={{ fontSize: fs(10), color: '#333' }}>
          {descriptionLines.map((line, i) => {
            const hasBullet = /^[•·\-–—*]/.test(line);
            return (
              <p key={i}>
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
  /** 正文色（深色侧栏上需要浅色字） */
  color?: string;
  /** 组名色 */
  labelColor?: string;
}> = ({ items, separator = '、', compact = false, columns = 1, color = '#222', labelColor }) => {
  // 按 group 分组；无 group 的都归入「技能」
  const groups = new Map<string, { id: string; name: string }[]>();
  const add = (g: string, item: { id: string; name: string }) => {
    const arr = groups.get(g) || [];
    arr.push(item);
    groups.set(g, arr);
  };
  items.forEach((it) => add(it.group || '技能', it));

  const style = { fontSize: fs(compact ? 9.5 : 10), color };
  const labelStyle = { fontSize: fs(10), color: labelColor || color };
  const groupsList = Array.from(groups.entries());

  // 两列：按「组 → 组」并排（不足两组则单列）
  if (columns === 2) {
    return (
      <div className="space-y-1">
        {Array.from({ length: Math.ceil(groupsList.length / 2) }).map((_, i) => {
          const left = groupsList[i * 2];
          const right = groupsList[i * 2 + 1];
          return (
            <div key={i} className="flex gap-x-6">
              <div className="flex-1 min-w-0 flex items-baseline gap-1.5">
                {left && left[0] !== '技能' && <span className="font-bold flex-shrink-0" style={labelStyle}>{left[0]}:</span>}
                <span className="min-w-0 break-words" style={style}>{left ? left[1].map(x => x.name).join(separator) : ''}</span>
              </div>
              <div className="flex-1 min-w-0 flex items-baseline gap-1.5">
                {right && right[0] !== '技能' && <span className="font-bold flex-shrink-0" style={labelStyle}>{right[0]}:</span>}
                <span className="min-w-0 break-words" style={style}>{right ? right[1].map(x => x.name).join(separator) : ''}</span>
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
            {!isPlain && <span className="font-bold flex-shrink-0" style={labelStyle}>{group}:</span>}
            <span className="min-w-0 break-words" style={style}>{list.map(x => x.name).join(separator)}</span>
          </div>
        );
      })}
    </div>
  );
};
