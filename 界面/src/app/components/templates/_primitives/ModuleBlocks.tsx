import React, { memo } from 'react';
import {
  ResumeModule,
  ResumeItem,
  SkillItem,
  isSkillsModule,
} from '@/app/types/resume';
import { SectionTitle } from './SectionTitle';
import { ExperienceItem, SkillGroups } from './ExperienceItem';
import { fs } from './ResumeChrome';

/** 纸面只渲染「可见且有内容」的模块；顺序完全由传入数组决定（模板不得自行排死） */
export function filterVisible(modules: ResumeModule[]): ResumeModule[] {
  return modules.filter((m) => m.visible && m.items.length > 0);
}

/** 模块标题：用户自定义优先 */
export function moduleHeading(m: ResumeModule): string {
  return m.titleOverride || m.title;
}

/** 项目描述里的「技术栈：…」单独提一行（研发模板用） */
function techStackOf(item: ResumeItem): string | null {
  const line = (item.description || '').split('\n').find((l) => /技术栈|技术：|工具[:：]/.test(l));
  if (!line) return null;
  const value = line
    .replace(/^.*?技术栈[:：]?/, '')
    .replace(/^.*?技术：/, '')
    .replace(/^.*?工具[:：]?/, '')
    .trim();
  return value || null;
}

/**
 * 模块列表：所有模板共用的正文渲染器。
 * 强调色一律走 CSS 变量（由 ThemeWrapper 注入），不得写死 hex。
 */
export const ModuleList: React.FC<{
  modules: ResumeModule[];
  /** 默认栏目头样式（模块自己的 titleStyle 优先） */
  variant?: 'line' | 'bar' | 'plain' | 'bg';
  /** 地点列：true 全部显示 / false 全部隐藏 / auto 仅校园经历显示 */
  showLocation?: boolean | 'auto';
  compact?: boolean;
  gapMm?: number;
  titleSizePt?: number;
  colorVar?: string;
  textColor?: string;
  titleAlign?: 'left' | 'center';
  skillSeparator?: string;
  /** 项目经历额外渲染「技术栈：」行 */
  showTechStack?: boolean;
  /** 是否让模块自己的 titleStyle 覆盖模板默认栏目头（ATS 模板需要固定 plain） */
  respectModuleTitleStyle?: boolean;
}> = memo(({
  modules,
  variant = 'line',
  showLocation = 'auto',
  compact = false,
  gapMm = 6,
  titleSizePt = 12.5,
  colorVar,
  textColor,
  titleAlign = 'left',
  skillSeparator,
  showTechStack = false,
  respectModuleTitleStyle = true,
}) => (
  <>
    {modules.map((module) => {
      const locationOn = showLocation === 'auto' ? module.type === 'campus' : showLocation;
      return (
        <div key={module.id} className="rx-section min-w-0" style={{ marginBottom: `${gapMm}mm` }}>
          <SectionTitle
            title={moduleHeading(module)}
            variant={respectModuleTitleStyle ? (module.titleStyle || variant) : variant}
            sizePt={titleSizePt}
            colorVar={colorVar}
            textColor={textColor}
            align={titleAlign}
          />
          {isSkillsModule(module) ? (
            <SkillGroups
              items={module.items as SkillItem[]}
              separator={skillSeparator}
              compact={compact}
              columns={module.columns}
              color={textColor}
            />
          ) : (
            <div className={module.columns === 2 ? 'grid grid-cols-2 gap-x-6 gap-y-2' : 'space-y-2'}>
              {(module.items as ResumeItem[]).map((item) => (
                <div key={item.id} className="min-w-0">
                  <ExperienceItem
                    item={item}
                    showLocation={locationOn}
                    compact={compact}
                    bulletStyle={module.bulletStyle || 'dot'}
                  />
                  {showTechStack && module.type === 'projects' && (() => {
                    const stack = techStackOf(item);
                    return stack ? (
                      <div className="min-w-0 break-words" style={{ fontSize: fs(9), color: '#444', marginTop: '1pt' }}>
                        <span className="font-bold" style={{ color: 'var(--color-primary)' }}>技术栈：</span>
                        {stack}
                      </div>
                    ) : null;
                  })()}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    })}
  </>
));
ModuleList.displayName = 'ModuleList';

/** 自我评价块（纸面上的独立小节；空内容不渲染，由调用方判断） */
export const SummaryBlock: React.FC<{
  summary?: string;
  title?: string;
  variant?: 'line' | 'bar' | 'plain' | 'bg';
  gapMm?: number;
  colorVar?: string;
  textColor?: string;
  titleAlign?: 'left' | 'center';
  sizePt?: number;
  marginTopMm?: number;
}> = ({ summary, title = '自我评价', variant = 'line', gapMm = 6, colorVar, textColor, titleAlign = 'left', sizePt, marginTopMm }) => {
  if (!summary) return null;
  return (
    <div
      className="rx-section min-w-0"
      style={{ marginBottom: `${gapMm}mm`, ...(marginTopMm ? { marginTop: `${marginTopMm}mm` } : {}) }}
    >
      <SectionTitle title={title} variant={variant} colorVar={colorVar} textColor={textColor} align={titleAlign} sizePt={sizePt} />
      <p className="min-w-0 break-words" style={{ fontSize: fs(10), color: textColor || '#333' }}>{summary}</p>
    </div>
  );
};

/** 联系方式行（侧栏用：一条一行；单栏用不到，HeaderBlock 已覆盖） */
export const ContactLines: React.FC<{
  rows: { label: string; value: string }[];
  color?: string;
  sizePt?: number;
}> = ({ rows, color = '#333', sizePt = 9 }) => {
  const list = rows.filter((r) => r.value);
  if (list.length === 0) return null;
  return (
    <div className="min-w-0" style={{ fontSize: fs(sizePt), color, lineHeight: 'var(--rx-lh, 1.6)' }}>
      {list.map((r) => (
        <p key={r.label} className="min-w-0 break-words">
          <span style={{ opacity: 0.75 }}>{r.label}：</span>{r.value}
        </p>
      ))}
    </div>
  );
};
