import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, ImageRun, TabStopPosition, TabStopType } from 'docx';
import { ResumeData, isSkillsModule, ResumeItem, SkillItem } from '@/app/types/resume';
import { themes } from '@/app/types/theme';
import { generateExportFilename } from './exportFilename';

/**
 * base64 data URL 转 Uint8Array（用于 docx ImageRun）
 */
function base64ToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1];
  if (!base64) return new Uint8Array(0);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * 将简历数据导出为 Word (.docx) 文件
 * 注意：Word 导出为纯文本格式，排版为通用简历样式，不完全复刻模板视觉效果
 */
export async function exportToDocx(data: ResumeData): Promise<void> {
  const { profile, modules, settings } = data;
  const children: Paragraph[] = [];

  // 读取主题色
  const themeConfig = themes[settings.themeColor] || themes['tech-orange'];
  const primaryHex = themeConfig.colors.primary.replace('#', '');

  // === 头部区域：姓名（左） + 头像（右） ===
  // 如果有头像，姓名行右侧放头像
  if (profile.name) {
    const nameRuns: (TextRun | ImageRun)[] = [
      new TextRun({ text: profile.name, bold: true, size: 32, font: 'Microsoft YaHei', color: primaryHex }),
    ];

    // 尝试插入头像
    if (profile.avatar && profile.avatar.startsWith('data:image')) {
      try {
        const imgData = base64ToUint8Array(profile.avatar);
        if (imgData.length > 0) {
          nameRuns.push(
            new TextRun({ text: '\t', font: 'Microsoft YaHei' }),
          );
          nameRuns.push(
            new ImageRun({
              data: imgData,
              transformation: { width: 60, height: 60 },
              type: 'jpg',
            }),
          );
        }
      } catch {
        // 头像插入失败，跳过
      }
    }

    children.push(
      new Paragraph({
        children: nameRuns,
        tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
        spacing: { after: 80 },
      })
    );
  }

  // === 求职意向 ===
  if (profile.title) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: profile.title, size: 22, color: '555555', font: 'Microsoft YaHei' }),
        ],
        spacing: { after: 60 },
      })
    );
  }

  // === 联系方式（一行，左对齐） ===
  const contactParts: string[] = [];
  if (profile.phone) contactParts.push(profile.phone);
  if (profile.email) contactParts.push(profile.email);
  if (profile.location) contactParts.push(profile.location);
  if (profile.website) contactParts.push(profile.website);
  if (profile.wechat) contactParts.push(`微信: ${profile.wechat}`);

  if (contactParts.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: contactParts.join('  |  '), size: 18, color: '888888', font: 'Microsoft YaHei' }),
        ],
        spacing: { after: 120 },
      })
    );
  }

  // === 分隔线（使用主题色） ===
  children.push(
    new Paragraph({
      border: { bottom: { color: primaryHex, space: 1, style: BorderStyle.SINGLE, size: 6 } },
      spacing: { after: 160 },
    })
  );

  // === 个人简介 ===
  if (profile.summary) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: '个人简介', bold: true, size: 24, color: primaryHex, font: 'Microsoft YaHei' }),
        ],
        border: { bottom: { color: primaryHex, space: 1, style: BorderStyle.SINGLE, size: 4 } },
        spacing: { after: 80 },
      })
    );
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: profile.summary, size: 20, font: 'Microsoft YaHei' }),
        ],
        spacing: { after: 160 },
      })
    );
  }

  // === 模块内容 ===
  for (const mod of modules.filter(m => m.visible)) {
    // 模块标题（主题色 + 下划线）
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: mod.title, bold: true, size: 24, color: primaryHex, font: 'Microsoft YaHei' }),
        ],
        heading: HeadingLevel.HEADING_2,
        border: { bottom: { color: primaryHex, space: 1, style: BorderStyle.SINGLE, size: 4 } },
        spacing: { before: 160, after: 100 },
      })
    );

    if (isSkillsModule(mod)) {
      // 技能标签
      const skillNames = mod.items.map((s: SkillItem) => s.name).filter(Boolean);
      if (skillNames.length > 0) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: skillNames.join('  |  '), size: 20, font: 'Microsoft YaHei' }),
            ],
            spacing: { after: 80 },
          })
        );
      }
    } else {
      // 经历条目
      for (const item of mod.items as ResumeItem[]) {
        // 标题行：职位/学历 + 日期（右对齐用 tab）
        const titleRuns: TextRun[] = [
          new TextRun({ text: item.title || '', bold: true, size: 21, font: 'Microsoft YaHei' }),
        ];
        if (item.date) {
          titleRuns.push(
            new TextRun({ text: '\t', font: 'Microsoft YaHei' }),
            new TextRun({ text: item.date, size: 19, color: '888888', font: 'Microsoft YaHei' }),
          );
        }
        children.push(new Paragraph({
          children: titleRuns,
          tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
          spacing: { before: 60 },
        }));

        // 副标题行：公司/学校 + 地点
        const subtitleParts: string[] = [];
        if (item.subtitle) subtitleParts.push(item.subtitle);
        if (item.location) subtitleParts.push(item.location);
        if (subtitleParts.length > 0) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: subtitleParts.join('  |  '), size: 19, color: '555555', font: 'Microsoft YaHei' }),
              ],
              spacing: { after: 40 },
            })
          );
        }

        // 描述（每行加 bullet）
        if (item.description) {
          const lines = item.description.split('\n').filter(l => l.trim());
          for (const line of lines) {
            const cleanLine = line.trim().replace(/^[•·\-–]\s*/, '');
            children.push(
              new Paragraph({
                children: [
                  new TextRun({ text: `•  ${cleanLine}`, size: 19, font: 'Microsoft YaHei' }),
                ],
                spacing: { after: 20 },
                indent: { left: 240 },
              })
            );
          }
        }

        // 条目间距
        children.push(new Paragraph({ spacing: { after: 60 } }));
      }
    }
  }

  // 生成文档
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 720, bottom: 720, left: 720, right: 720 },
          size: { width: 11906, height: 16838 }, // A4
        },
      },
      children,
    }],
  });

  // 导出
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = generateExportFilename(data, 'docx');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
