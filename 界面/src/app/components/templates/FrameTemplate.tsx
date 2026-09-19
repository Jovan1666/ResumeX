import React, { memo } from 'react';
import { ResumeData } from '@/app/types/resume';
import { ResumeChrome } from './_primitives/ResumeChrome';
import { HeaderBlock } from './_primitives/HeaderBlock';
import { ModuleList, SummaryBlock, filterVisible } from './_primitives/ModuleBlocks';
import { resolveNameSize } from '@/app/types/theme';

/**
 * 线框档案（frame）：合并原 lineFrame（四周细线框 + 居中姓名）与
 * greenFresh（栏目浅底色块标题）。开关 settings.frameStyle：
 * - 'line'：整页 1.5pt 主题色细线框 + 居中标题（端庄、档案/公文感）
 * - 'band'：顶部一条主题浅底色带 + 栏目浅底色块标题（清新）
 * 姓名为中文，不做 letter-spacing（AGENTS 禁止中文拉字距）。
 */
export const FrameTemplate: React.FC<{ data: ResumeData }> = memo(({ data }) => {
  const { profile, modules, settings } = data;
  const gap = settings.moduleGap ?? 6;
  const style = settings.frameStyle === 'band' ? 'band' : 'line';
  const visible = filterVisible(modules);

  const header = (
    <HeaderBlock
      profile={profile}
      showPhoto={settings.photoPosition === 'top' ? 'top' : 'right'}
      align="center"
      nameSizePt={resolveNameSize(settings) + 1}
      separator="·"
      privacyBlur={settings.privacyBlur}
      photoShape={settings.photoShape}
      photoSize={settings.photoSize}
    />
  );

  const body = (
    <>
      {profile.summary && (
        <div style={{ marginTop: style === 'band' ? '5mm' : 0 }}>
          <SummaryBlock
            summary={profile.summary}
            variant={style === 'band' ? 'bg' : 'plain'}
            titleAlign={style === 'band' ? 'left' : 'center'}
            gapMm={gap}
          />
        </div>
      )}
      <ModuleList
        modules={visible}
        variant={style === 'band' ? 'bg' : 'plain'}
        titleAlign={style === 'band' ? 'left' : 'center'}
        showLocation={settings.showItemLocation}
        gapMm={gap}
        titleSizePt={12}
      />
    </>
  );

  if (style === 'band') {
    // 浅底色块版：顶部一条主题浅底色带承载姓名，无边框
    return (
      <ResumeChrome data={data}>
        <div
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-primary) 8%, white)',
            margin: 'calc(var(--rx-page-padding, 16mm) * -1) calc(var(--rx-page-padding, 16mm) * -1) 0',
            padding: '8mm var(--rx-page-padding, 16mm) 6mm',
          }}
        >
          {header}
        </div>
        <div style={{ padding: 'var(--rx-page-padding, 16mm)', paddingTop: '6mm' }}>
          {body}
        </div>
      </ResumeChrome>
    );
  }

  // 细线框版
  return (
    <ResumeChrome data={data}>
      <div style={{ padding: '3mm', width: '210mm', minHeight: '297mm', boxSizing: 'border-box' }}>
        <div
          className="rx-page-frame min-w-0"
          style={{
            border: '1.5pt solid var(--color-primary)',
            padding: 'calc(var(--rx-page-padding, 16mm) * 0.8)',
            minHeight: '291mm',
            boxSizing: 'border-box',
          }}
        >
          {header}
          <div style={{ height: '2mm', borderBottom: '0.75pt solid color-mix(in srgb, var(--color-primary) 35%, transparent)', marginBottom: `${gap}mm` }} />
          {body}
        </div>
      </div>
    </ResumeChrome>
  );
});
FrameTemplate.displayName = 'FrameTemplate';
