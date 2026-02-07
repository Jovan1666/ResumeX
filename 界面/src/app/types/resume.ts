import { ThemeColor, GlobalSettings } from './theme';

export type TemplateId = 
  | 'tech' 
  | 'business' 
  | 'minimal' 
  | 'vibrant' 
  | 'professional'
  | 'civilService'    // 公务员/事业单位
  | 'javaDev'         // Java后端开发
  | 'operations'      // 运营专员
  | 'aiDev'           // AI应用开发
  | 'industry'        // 各行业通用
  | 'engineer'        // 工程师
  | 'accountant'      // 会计财务
  | 'hr'              // 人事专员
  | 'medical'         // 医疗专业
  | 'sales'           // 销售岗位
  | 'media'           // 新闻传播
  | 'teacher'         // 教师
  | 'timeline'        // 时间线风格
  | 'twoColumnCompact' // 经典双栏紧凑
  | 'creative'        // 创意设计
  | 'academic'        // 学术简约
  | 'card'            // 卡片模块
  | 'executive'       // 高端精英
  | 'freshGrad'       // 应届生专属
  | 'infographic'     // 信息图表
  | 'aiRed'              // AI应用开发（红色+头像）
  | 'opsOrange'          // 运营（橙色+头像）
  | 'fePurple'           // 前端工程师（紫色+照片）
  | 'eduDark'            // 教育培训（深灰无头像）
  | 'enBw'               // 英文简历（黑白学术）
  | 'generalRed'         // 各行业通用（红色无头像）
  | 'javaBlue'           // Java实习（蓝色无头像）
  | 'gradBlue'           // 研究生复试（蓝色+头像）
  | 'recruitBk'          // 校招社招（黑色极简）
  | 'feGreen'            // 前端工程师（绿色+照片）
  | 'civilGray';         // 公务员（深灰+照片）

export interface ResumeProfile {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  website?: string;
  wechat?: string;
  avatar?: string;
  summary?: string;
  customFields?: { label: string; value: string }[];
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

export type ModuleType = 'experience' | 'education' | 'projects' | 'skills' | 'custom';

// 使用泛型使模块类型更精确
export interface BaseResumeModule<T extends ModuleItemType> {
  id: string;
  type: ModuleType;
  title: string;
  items: T[];
  visible: boolean;
}

export interface SkillsModule extends BaseResumeModule<SkillItem> {
  type: 'skills';
}

export interface ContentModule extends BaseResumeModule<ResumeItem> {
  type: 'experience' | 'education' | 'projects' | 'custom';
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
