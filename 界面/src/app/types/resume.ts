import { GlobalSettings } from './theme';

/**
 * 模板 id 的唯一真相来源。
 * 新增/删除模板只改这里：ResumeRenderer 的 loader 表、store 的校验与迁移都从这里取。
 *
 * 14 套 → 7 套：campusClean/jobClean/navyBiz/techPlain 合并为 classic；
 * navySidebar/sidebarRight/compactSplit/twoColumnEqual 合并为 sidebar；
 * bannerCampus → banner；lineFrame/greenFresh 合并为 frame。
 */
export const TEMPLATE_IDS = [
  'classic',    // 简洁通用（单栏，栏目头可切 line/bar/plain）
  'sidebar',    // 侧栏双栏（左右/宽度/底色可调，50% 即等宽双列）
  'banner',     // 顶部横幅
  'frame',      // 线框档案（细线框 or 浅底色块）
  'atsMono',    // 极简黑白
  'enSimple',   // 英文简洁
  'civilFile',  // 体制公文
] as const;

export type TemplateId = typeof TEMPLATE_IDS[number];

const TEMPLATE_ID_SET: ReadonlySet<string> = new Set(TEMPLATE_IDS);

/** 是否已经是当前受支持的模板 id */
export function isValidTemplateId(id: unknown): id is TemplateId {
  return typeof id === 'string' && TEMPLATE_ID_SET.has(id);
}

export type ModuleType = 'experience' | 'education' | 'projects' | 'campus' | 'honors' | 'skills' | 'custom';

export interface ResumeProfile {
  name: string;
  title: string;         // 求职意向
  email: string;
  phone: string;
  location: string;
  website?: string;
  wechat?: string;       // 独立字段，表单分开
  avatar?: string;       // 只存 blob key：idb:avatar:<resumeId>；禁止塞 5MB dataURL
  summary?: string;      // 自我评价
  gender?: string;
  birthYear?: string;
  politicalStatus?: string; // 体制内
  nativePlace?: string;
  customFields?: { id: string; label: string; value: string }[];
}

export interface ResumeItem {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  description: string; // HTML or Markdown
  location?: string;
  bullets?: string[]; // Optional for some templates
  startDate?: string; // 用于日期选择器
  endDate?: string;   // 用于日期选择器
}

export interface SkillItem {
  id: string;
  name: string;
  group?: string; // 分组名（技能组内标签）
  /** @deprecated 旧模板残留（阶段 3 删除旧模板后移除）；新 UI 禁止渲染百分比条 */
  level?: number;
}

// 新增条目输入类型（用于添加新条目时）
export interface NewResumeItem extends Omit<ResumeItem, 'id'> {
  id?: string;
}

export interface NewSkillItem extends Omit<SkillItem, 'id'> {
  id?: string;
}

export type ModuleItemType = ResumeItem | SkillItem;
export type NewModuleItemType = NewResumeItem | NewSkillItem;

// 使用泛型使模块类型更精确
export interface BaseResumeModule<T extends ModuleItemType> {
  id: string;
  type: ModuleType;
  title: string;
  items: T[];
  visible: boolean;
  /** 用户自定义标题文案（优先级高于 title；空则用默认 title） */
  titleOverride?: string;
  /** 标题装饰样式：下划线（默认）/ 左侧色条 / 纯加粗无装饰 */
  titleStyle?: 'line' | 'bar' | 'plain';
  /** 项目符号样式：圆点（默认）/ 短横线 / 无 */
  bulletStyle?: 'dot' | 'dash' | 'none';
  /** 内容列数：1（默认）/ 2（教育背景、技能常用两列） */
  columns?: 1 | 2;
}

export interface SkillsModule extends BaseResumeModule<SkillItem> {
  type: 'skills';
}

export interface ContentModule extends BaseResumeModule<ResumeItem> {
  type: 'experience' | 'education' | 'projects' | 'campus' | 'honors' | 'custom';
}

export type ResumeModule = SkillsModule | ContentModule;

// 类型守卫函数
export function isSkillItem(item: ModuleItemType): item is SkillItem {
  return 'name' in item && !('title' in item);
}

export function isResumeItem(item: ModuleItemType): item is ResumeItem {
  return 'title' in item && 'subtitle' in item;
}

export function isSkillsModule(module: ResumeModule): module is SkillsModule {
  return module.type === 'skills';
}

export function isContentModule(module: ResumeModule): module is ContentModule {
  return module.type !== 'skills';
}

export interface ResumeData {
  id: string;
  title: string; // For dashboard
  lastModified: number;
  profile: ResumeProfile;
  modules: ResumeModule[];
  template: TemplateId;
  settings: GlobalSettings;
}
