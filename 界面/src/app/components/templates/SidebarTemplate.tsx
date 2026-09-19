import React, { memo } from 'react';
import { ResumeData, SkillItem, isSkillsModule } from '@/app/types/resume';
import { ResumeChrome, fs } from './_primitives/ResumeChrome';
import { SectionTitle } from './_primitives/SectionTitle';
import { SkillGroups } from './_primitives/ExperienceItem';
import { ModuleList, ContactLines, filterVisible, moduleHeading } from './_primitives/ModuleBlocks';
import { useAvatarObjectUrl } from '@/app/hooks/useAvatarObjectUrl';
import { resolveSidebarWidth, resolveSidebarTone, resolveNameSize } from '@/app/types/theme';

/**
 * 侧栏双栏（sidebar）：合并原 navySidebar / sidebarRight / compactSplit / twoColumnEqual。
 * 可配置：侧栏在左/右、宽度 25|30|35|50（50 = 等宽双列）、底色（浅灰/主题浅底/纯白/主题色实底白字）。
 *
 * 跨页处理：侧栏底色不画在 flex 列上（Chromium 分页时侧栏色常只铺第 1 页），
 * 而是作为 .rx-page 的背景图层按 297mm 平铺（repeat-y）→ 每一页都有连续的侧栏色带。
 *
 * 字号一律 fs()；文本节点一律 min-w-0 + break-words（长邮箱/网址在 25% 窄栏也不会溢出）。
 */
export const SidebarTemplate: React.FC<{ data: ResumeData }> = memo(({ data }) => {
  const { profile, modules, settings } = data;
  const visible = filterVisible(modules);
  const avatarUrl = useAvatarObjectUrl(profile.avatar || '');
  const gap = settings.moduleGap ?? 6;
  const mask = (v: string) => (settings.privacyBlur && v ? '***' : v);

  const side = settings.sidebarSide === 'right' ? 'right' : 'left';
  const width = resolveSidebarWidth(settings);
  const tone = resolveSidebarTone(settings);
  const dark = settings.sidebarTone === 'primary';
  const dir = side === 'left' ? 'to right' : 'to left';
  // 色带尾端一丝发丝分隔线：浅灰/纯白底色时也能看出两栏边界
  const band = `linear-gradient(${dir}, ${tone} 0px, ${tone} calc(100% - 0.6pt), rgba(0,0,0,0.14) calc(100% - 0.6pt), rgba(0,0,0,0.14) 100%)`;

  const skillModules = visible.filter((m) => isSkillsModule(m));
  const mainModules = visible.filter((m) => !isSkillsModule(m));

  const titleColor = dark ? '#FFFFFF' : '#111';
  const bodyColor = dark ? 'rgba(255,255,255,0.95)' : '#333';
  // 深底侧栏用纯加粗标题（色条在白字下没有意义），浅底用左侧色条；模块自身 titleStyle 仍可覆盖
  const fixedVariant: 'plain' | 'bar' = dark ? 'plain' : 'bar';

  const contactRows = [
    { label: '电话', value: mask(profile.phone) },
    { label: '邮箱', value: mask(profile.email) },
    { label: '城市', value: profile.location },
    { label: '微信', value: profile.wechat ? mask(profile.wechat) : '' },
    { label: '主页', value: profile.website || '' },
  ];

  return (
    <ResumeChrome
      data={data}
      style={{
        backgroundImage: band,
        backgroundSize: `${width}% 297mm`,
        backgroundRepeat: 'repeat-y',
        backgroundPosition: side === 'left' ? 'left top' : 'right top',
      }}
    >
      <div className="flex w-full min-h-[297mm]">
        {/* 侧栏：照片 + 姓名 + 联系方式 + 自我评价 + 技能 */}
        <div
          className="flex-shrink-0 min-w-0 flex flex-col"
          style={{
            width: `${width}%`,
            order: side === 'left' ? 1 : 2,
            color: dark ? '#fff' : undefined,
            padding: 'var(--rx-page-padding, 16mm) 5mm',
          }}
        >
          {avatarUrl && (
            <img
              src={avatarUrl}
              alt="证件照"
              className="mx-auto"
              style={{
                width: '22mm',
                height: '30.8mm',
                objectFit: 'cover',
                borderRadius: settings.photoShape === 'rounded' ? '3px' : '1px',
                marginBottom: '3mm',
              }}
            />
          )}
          <h1
            className="font-bold min-w-0 break-words text-center"
            style={{ fontSize: fs(width <= 25 ? Math.min(resolveNameSize(settings), 15) : resolveNameSize(settings)) }}
          >
            {settings.privacyBlur && profile.name ? '（已隐藏）' : (profile.name || '姓名')}
          </h1>
          {profile.title && (
            <p className="min-w-0 break-words text-center" style={{ fontSize: fs(10), marginTop: '1mm', opacity: 0.92 }}>
              {profile.title}
            </p>
          )}

          <div className="min-w-0" style={{ marginTop: '5mm', marginBottom: `${gap}mm` }}>
            <SectionTitle title="联系方式" variant={fixedVariant} textColor={titleColor} colorVar={dark ? '#FFFFFF' : undefined} sizePt={11.5} />
            <ContactLines rows={contactRows} color={bodyColor} sizePt={9} />
          </div>

          {profile.summary && (
            <div className="min-w-0" style={{ marginBottom: `${gap}mm` }}>
              <SectionTitle title="自我评价" variant={fixedVariant} textColor={titleColor} colorVar={dark ? '#FFFFFF' : undefined} sizePt={11.5} />
              <p className="min-w-0 break-words" style={{ fontSize: fs(9), color: bodyColor }}>{profile.summary}</p>
            </div>
          )}

          {skillModules.map((module) => (
            <div key={module.id} className="min-w-0 rx-section" style={{ marginBottom: `${gap}mm` }}>
              <SectionTitle
                title={moduleHeading(module)}
                variant={dark ? 'plain' : (module.titleStyle || 'bar')}
                textColor={titleColor}
                colorVar={dark ? '#FFFFFF' : undefined}
                sizePt={11.5}
              />
              <SkillGroups
                items={module.items as SkillItem[]}
                compact
                columns={module.columns}
                color={bodyColor}
                labelColor={dark ? '#FFFFFF' : undefined}
              />
            </div>
          ))}
        </div>

        {/* 主栏：教育 / 经历 / 项目 / 荣誉…（顺序仍由 data.modules 决定） */}
        <div
          className="flex-1 min-w-0"
          style={{ order: side === 'left' ? 2 : 1, padding: 'var(--rx-page-padding, 16mm) 7mm' }}
        >
          <ModuleList
            modules={mainModules}
            variant="line"
            gapMm={gap}
            compact={width >= 50}
            showTechStack
          />
        </div>
      </div>
    </ResumeChrome>
  );
});
SidebarTemplate.displayName = 'SidebarTemplate';
