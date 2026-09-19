import React, { memo } from 'react';
import { ResumeData } from '@/app/types/resume';
import { ResumeChrome, SingleColumnLayout } from './_primitives/ResumeChrome';
import { PageBanner } from './_primitives/PageBanner';
import { ModuleList, SummaryBlock, filterVisible } from './_primitives/ModuleBlocks';
import { resolveNameSize } from '@/app/types/theme';

/**
 * 顶部横幅（banner）：原 bannerCampus。
 * 顶部主题色横幅（姓名+意向居中、联系细行），下方单栏；横幅底色跟随主题色变量。
 */
export const BannerTemplate: React.FC<{ data: ResumeData }> = memo(({ data }) => {
  const { profile, modules, settings } = data;
  const gap = settings.moduleGap ?? 6;

  return (
    <ResumeChrome data={data}>
      <SingleColumnLayout data={data}>
        <PageBanner
          profile={profile}
          privacyBlur={settings.privacyBlur}
          nameSizePt={resolveNameSize(settings)}
          photoShape={settings.photoShape}
          photoSize={settings.photoSize}
        />

        <div style={{ marginTop: `${gap}mm` }}>
          <SummaryBlock summary={profile.summary} gapMm={gap} />
          <ModuleList
            modules={filterVisible(modules)}
            variant="line"
            showLocation={settings.showItemLocation}
            gapMm={gap}
          />
        </div>
      </SingleColumnLayout>
    </ResumeChrome>
  );
});
BannerTemplate.displayName = 'BannerTemplate';
