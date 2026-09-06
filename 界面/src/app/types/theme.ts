import { TemplateId } from './resume';

export type ThemeColor = 'ink' | 'navy' | 'campus' | 'rust' | 'pine' | 'slate';
export type FontFamily = 'sans' | 'serif' | 'mono' | 'kaiti' | 'fangsong' | 'yahei' | 'heiti';
export type SpacingLevel = 'compact' | 'standard' | 'relaxed' | 'custom';

export interface ThemeConfig {
  id: ThemeColor;
  name: string;
  nameZh: string;
  sceneHint: string;
  colors: {
    primary: string;
    secondary: string;
    text: string;
    background: string;
    accent: string;
  };
}

// 6 个主题色（02 §5.4，R1/R2 只许改 hex 不许改默认倾向）
export const themes: Record<ThemeColor, ThemeConfig> = {
  ink: {
    id: 'ink',
    name: 'Ink',
    nameZh: '墨黑',
    sceneHint: '极简黑白，网申 ATS 友好',
    colors: {
      primary: '#1A1A1A',
      secondary: '#E5E5E5',
      text: '#222222',
      background: '#FFFFFF',
      accent: '#F7F7F7',
    },
  },
  navy: {
    id: 'navy',
    name: 'Navy',
    nameZh: '商务藏蓝',
    sceneHint: '金融、商务、社招通用',
    colors: {
      primary: '#1E4E8C',
      secondary: '#E8EEF6',
      text: '#222222',
      background: '#FFFFFF',
      accent: '#F0F4FA',
    },
  },
  campus: {
    id: 'campus',
    name: 'Campus',
    nameZh: '校招蓝',
    sceneHint: '校招、实习、通用',
    colors: {
      primary: '#2B6CB0',
      secondary: '#E7EFF8',
      text: '#222222',
      background: '#FFFFFF',
      accent: '#F1F6FC',
    },
  },
  rust: {
    id: 'rust',
    name: 'Rust',
    nameZh: '砖红',
    sceneHint: '运营、市场、互联网',
    colors: {
      primary: '#B42318',
      secondary: '#FBE9E8',
      text: '#222222',
      background: '#FFFFFF',
      accent: '#FCF3F2',
    },
  },
  pine: {
    id: 'pine',
    name: 'Pine',
    nameZh: '松绿',
    sceneHint: '教育、环保、医疗',
    colors: {
      primary: '#2F6F4E',
      secondary: '#E6F0EA',
      text: '#222222',
      background: '#FFFFFF',
      accent: '#F0F6F2',
    },
  },
  slate: {
    id: 'slate',
    name: 'Slate',
    nameZh: '岩青灰',
    sceneHint: '技术、研发、工程师',
    colors: {
      primary: '#4A5568',
      secondary: '#E9ECF1',
      text: '#222222',
      background: '#FFFFFF',
      accent: '#F3F5F8',
    },
  },
};

// 未知主题 fallback ink（禁止 tech-orange）
export const FALLBACK_THEME: ThemeColor = 'ink';

/** 8 套默认模板 → 默认主题（02 §5.4） */
export const TEMPLATE_THEME_DEFAULT: Record<TemplateId, ThemeColor> = {
  campusClean: 'campus',
  jobClean: 'navy',
  navyBiz: 'navy',
  civilFile: 'ink',
  techPlain: 'slate',
  atsMono: 'ink',
  compactSplit: 'navy',
  enSimple: 'ink',
};

export interface GlobalSettings {
  themeColor: ThemeColor;
  fontFamily: FontFamily;
  fontSizeScale: number; // 0.80 to 1.1（一键适应可压到 0.80）
  lineHeight: SpacingLevel;
  pageMargin: SpacingLevel;
  customLineHeight?: number;  // 自定义行高值，范围 1.0 ~ 2.0
  customPageMargin?: number;  // 自定义左右页边距，单位 mm，范围 10 ~ 30
  language: 'zh' | 'en';

  /** 模块上下间距（mm，全局；默认 6mm —— 对应「模块间距」滑杆） */
  moduleGap?: number;
  /** 打码模式：分享/预览时隐藏姓名、手机、邮箱、微信（仅渲染层，不动数据） */
  privacyBlur?: boolean;
  /** 照片位置：右上（默认）/ 顶部居中 / 左栏顶（双栏模板） */
  photoPosition?: 'right' | 'top' | 'sidebar';
  /** 照片形状：矩形（默认）/ 圆角 */
  photoShape?: 'rect' | 'rounded';
  /** 照片尺寸：小 / 中（证件照 22×30.8mm 默认） / 大（一寸 25×35mm） */
  photoSize?: 'sm' | 'md' | 'lg';
  /** 双栏模板：左栏宽度（%） */
  splitWidth?: 25 | 30 | 35;
  /** 双栏模板：左栏底色 */
  splitColor?: '#FAFAFA' | '#EFF4FB' | '#FFFFFF';
}
