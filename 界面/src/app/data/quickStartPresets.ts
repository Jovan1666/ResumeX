import { TemplateId, ModuleType } from '@/app/types/resume';

export interface IdentityOption {
  id: string;
  label: string;
  icon: string;
  description: string;
}

export interface JobCategoryOption {
  id: string;
  label: string;
  icon: string;
}

export interface QuickStartPreset {
  templateId: TemplateId;
  moduleOrder: { type: ModuleType; title: string }[];
}

export const identities: IdentityOption[] = [
  { id: 'fresh', label: '应届生', icon: '🎓', description: '应届毕业生或在校生' },
  { id: 'working', label: '在职跳槽', icon: '💼', description: '有工作经验，寻找新机会' },
  { id: 'freelance', label: '自由职业', icon: '🚀', description: '自由职业者或创业者' },
];

export const jobCategories: JobCategoryOption[] = [
  { id: 'tech', label: '技术开发', icon: '💻' },
  { id: 'product', label: '产品运营', icon: '📊' },
  { id: 'finance', label: '金融财务', icon: '📈' },
  { id: 'education', label: '教育医疗', icon: '📚' },
  { id: 'admin', label: '行政人事', icon: '👥' },
  { id: 'design', label: '设计创意', icon: '🎨' },
  { id: 'sales', label: '销售商务', icon: '🤝' },
  { id: 'other', label: '其他', icon: '📋' },
];

// 新模板 id → 身份/岗位映射（只指向 8 套，禁止 creative/infographic/tech）
const freshTemplateMap: Record<string, TemplateId> = {
  tech: 'techPlain',
  product: 'campusClean',
  finance: 'navyBiz',
  education: 'campusClean',
  admin: 'civilFile',
  design: 'campusClean',
  sales: 'campusClean',
  other: 'campusClean',
};

const workingTemplateMap: Record<string, TemplateId> = {
  tech: 'techPlain',
  product: 'jobClean',
  finance: 'navyBiz',
  education: 'navyBiz',
  admin: 'civilFile',
  design: 'jobClean',
  sales: 'jobClean',
  other: 'jobClean',
};

// 根据身份+岗位类别返回推荐配置（02 §4.6）
export function getPreset(identity: string, jobCategory: string): QuickStartPreset {
  // 应届生：教育 → 实习 → 项目 → 校园 → 技能 → 荣誉 → 评价
  if (identity === 'fresh') {
    const base: { type: ModuleType; title: string }[] = [
      { type: 'education', title: '教育背景' },
      { type: 'experience', title: '实习经历' },
      { type: 'projects', title: '项目经历' },
      { type: 'campus', title: '校园经历' },
      { type: 'skills', title: '技能特长' },
      { type: 'honors', title: '荣誉奖项' },
    ];
    return {
      templateId: freshTemplateMap[jobCategory] || 'campusClean',
      moduleOrder: base,
    };
  }

  // 社招：工作 → 项目 → 教育 → 技能 → 荣誉 → 评价
  const workingBase: { type: ModuleType; title: string }[] = [
    { type: 'experience', title: '工作经历' },
    { type: 'projects', title: '项目经历' },
    { type: 'education', title: '教育背景' },
    { type: 'skills', title: '技能特长' },
    { type: 'honors', title: '荣誉奖项' },
  ];

  // 自由职业：项目优先
  if (identity === 'freelance') {
    return {
      templateId: workingTemplateMap[jobCategory] || 'jobClean',
      moduleOrder: [
        { type: 'projects', title: '项目经历' },
        { type: 'experience', title: '工作经历' },
        { type: 'skills', title: '技能特长' },
        { type: 'education', title: '教育背景' },
      ],
    };
  }

  return {
    templateId: workingTemplateMap[jobCategory] || 'jobClean',
    moduleOrder: workingBase,
  };
}
