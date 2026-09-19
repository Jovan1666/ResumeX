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

/** 是否仍是受支持的主题色（迁移用：合法值必须原样保留，不能退回默认） */
export function isThemeColor(id: unknown): id is ThemeColor {
  return typeof id === 'string' && Object.prototype.hasOwnProperty.call(themes, id);
}

/** 7 套默认模板 → 默认主题（02 §5.4 + 09 新增；store 的 TEMPLATE_THEME 直接取这份） */
export const TEMPLATE_THEME_DEFAULT: Record<TemplateId, ThemeColor> = {
  classic: 'campus',
  sidebar: 'navy',
  banner: 'campus',
  frame: 'ink',
  atsMono: 'ink',
  enSimple: 'ink',
  civilFile: 'ink',
};

export interface GlobalSettings {
  themeColor: ThemeColor;
  fontFamily: FontFamily;
  fontSizeScale: number; // 0.85 ~ 1.1（下限与「智能适应一页」一致）
  lineHeight: SpacingLevel;
  pageMargin: SpacingLevel;
  customLineHeight?: number;  // 自定义行高值，范围 1.0 ~ 2.0
  customPageMargin?: number;  // 自定义左右页边距，单位 mm，范围 10 ~ 30
  language: 'zh' | 'en';

  /** 模块上下间距（mm，全局；默认 6mm —— 对应「模块间距」滑杆） */
  moduleGap?: number;
  /** 打码模式：分享/预览时隐藏姓名、手机、邮箱、微信（仅渲染层，不动数据） */
  privacyBlur?: boolean;
  /**
   * 照片位置：右上（默认）/ 顶部居中 / 侧栏顶。
   * 单栏模板实现 right|top；侧栏模板固定用侧栏顶部（面板在该模板下不显示此开关）。
   */
  photoPosition?: 'right' | 'top' | 'sidebar';
  /** 照片形状：矩形（默认）/ 圆角 */
  photoShape?: 'rect' | 'rounded';
  /** 照片尺寸：小 / 中（证件照 22×30.8mm 默认） / 大（一寸 25×35mm） */
  photoSize?: 'sm' | 'md' | 'lg';

  /** 姓名基准字号（pt，仍随「字号」缩放）；默认 18 */
  nameSize?: 'sm' | 'md' | 'lg';
  /** 单栏模板：条目行是否显示地点 */
  showItemLocation?: boolean;

  /** 侧栏双栏：侧栏在左还是右（默认 left） */
  sidebarSide?: 'left' | 'right';
  /** 侧栏双栏：侧栏宽度 %（默认 30；50 = 等宽双列） */
  sidebarWidth?: 25 | 30 | 35 | 50;
  /** 侧栏双栏：侧栏底色（浅灰/主题浅底/纯白/主题色实底白字） */
  sidebarTone?: 'light' | 'tinted' | 'white' | 'primary';

  /** 线框档案：外框为整页细线框（默认）or 栏目浅底色块 */
  frameStyle?: 'line' | 'band';

  /** @deprecated 旧双栏模板宽度，sidebarWidth 缺省时回退读取 */
  splitWidth?: 25 | 30 | 35;
  /** @deprecated 旧双栏模板底色，sidebarTone 缺省时回退读取 */
  splitColor?: '#FAFAFA' | '#EFF4FB' | '#FFFFFF';
}

/** 双栏（侧栏）版式的模板 id：只有这些模板消费侧栏/双栏设置，面板据此显隐 */
export const TWO_COLUMN_TEMPLATE_IDS = ['sidebar'] as const;

/** 该模板是否为双栏版式（决定「侧栏排版」设置块是否出现） */
export function isTwoColumnTemplate(id: string | undefined | null): boolean {
  return !!id && (TWO_COLUMN_TEMPLATE_IDS as readonly string[]).includes(id);
}

/** 侧栏宽度（%）：新设置优先，缺省回退旧 splitWidth */
export function resolveSidebarWidth(st: GlobalSettings): 25 | 30 | 35 | 50 {
  if (st.sidebarWidth) return st.sidebarWidth;
  if (st.splitWidth) return st.splitWidth;
  return 30;
}

/** 侧栏底色（CSS 颜色值） */
export function resolveSidebarTone(st: GlobalSettings): string {
  const tone = st.sidebarTone
    ?? (st.splitColor === '#FFFFFF' ? 'white' : st.splitColor === '#EFF4FB' ? 'tinted' : 'light');
  switch (tone) {
    case 'white': return '#FFFFFF';
    case 'tinted': return 'var(--color-secondary)';
    case 'primary': return 'var(--color-primary)';
    default: return '#FAFAFA';
  }
}

/** 姓名字号（pt） */
export function resolveNameSize(st: GlobalSettings): number {
  return st.nameSize === 'sm' ? 15.5 : st.nameSize === 'lg' ? 21 : 18;
}
