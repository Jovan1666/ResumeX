import { ModuleType } from '@/app/types/resume';

/**
 * 「一键预置模块」的纯数据源（供编辑器调用）。
 *
 * 背景：快速开始向导（QuickStartWizard）已删除 —— 新建简历零中间步骤，
 * 直接进编辑器。需要「按身份预置模块顺序」时，由编辑器里的按钮调用 getPresetModules()。
 *
 * 注意：本文件只保留模块数据，不再包含任何 TemplateId 字面量
 * （模板与主题的选择属于编辑器/模板系统的职责）。
 */

/** 预置角色：只保留真正会改变模块顺序的三个身份 */
export type PresetRole = 'fresh' | 'working' | 'freelance';

export interface PresetModule {
  type: ModuleType;
  title: string;
}

export interface PresetRoleOption {
  id: PresetRole;
  label: string;
  description: string;
}

/** 角色选项（纯数据，编辑器自己决定怎么展示） */
export const presetRoles: PresetRoleOption[] = [
  { id: 'fresh', label: '应届生', description: '教育背景优先，含实习与校园经历' },
  { id: 'working', label: '在职跳槽', description: '工作与项目经历优先' },
  { id: 'freelance', label: '自由职业', description: '项目作品优先' },
];

/** 各身份的模块顺序（02 §4.6） */
const PRESET_MODULES: Record<PresetRole, PresetModule[]> = {
  // 应届生：教育 → 实习 → 项目 → 校园 → 技能 → 荣誉
  fresh: [
    { type: 'education', title: '教育背景' },
    { type: 'experience', title: '实习经历' },
    { type: 'projects', title: '项目经历' },
    { type: 'campus', title: '校园经历' },
    { type: 'skills', title: '技能特长' },
    { type: 'honors', title: '荣誉奖项' },
  ],
  // 社招：工作 → 项目 → 教育 → 技能 → 荣誉
  working: [
    { type: 'experience', title: '工作经历' },
    { type: 'projects', title: '项目经历' },
    { type: 'education', title: '教育背景' },
    { type: 'skills', title: '技能特长' },
    { type: 'honors', title: '荣誉奖项' },
  ],
  // 自由职业：项目优先
  freelance: [
    { type: 'projects', title: '项目经历' },
    { type: 'experience', title: '工作经历' },
    { type: 'skills', title: '技能特长' },
    { type: 'education', title: '教育背景' },
  ],
};

/** 判断任意字符串是否为合法预置角色 */
export function isPresetRole(value: unknown): value is PresetRole {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(PRESET_MODULES, value);
}

/**
 * 取某角色的预置模块顺序。
 * 返回浅拷贝，调用方可以安全地增删改（不会污染模块级常量）。
 */
export function getPresetModules(role: PresetRole): PresetModule[] {
  return (PRESET_MODULES[role] ?? []).map((m) => ({ type: m.type, title: m.title }));
}
