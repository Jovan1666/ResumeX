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

// 根据身份+岗位类别返回推荐配置
export function getPreset(identity: string, jobCategory: string): QuickStartPreset {
  // 应届生：教育优先
  if (identity === 'fresh') {
    const base: { type: ModuleType; title: string }[] = [
      { type: 'education', title: '教育背景' },
      { type: 'projects', title: '项目经历' },
      { type: 'experience', title: '实习经历' },
      { type: 'skills', title: '技能特长' },
    ];

    const templateMap: Record<string, TemplateId> = {
      tech: 'freshGrad',
      product: 'freshGrad',
      finance: 'business',
      education: 'freshGrad',
      admin: 'business',
      design: 'creative',
      sales: 'freshGrad',
      other: 'freshGrad',
    };

    return {
      templateId: templateMap[jobCategory] || 'freshGrad',
      moduleOrder: base,
    };
  }

  // 在职跳槽：工作经历优先
  const workingBase: { type: ModuleType; title: string }[] = [
    { type: 'experience', title: '工作经历' },
    { type: 'projects', title: '项目经历' },
    { type: 'education', title: '教育背景' },
    { type: 'skills', title: '技能特长' },
  ];

  const workingTemplateMap: Record<string, TemplateId> = {
    tech: 'tech',
    product: 'vibrant',
    finance: 'accountant',
    education: 'teacher',
    admin: 'hr',
    design: 'creative',
    sales: 'sales',
    other: 'industry',
  };

  // 自由职业：项目优先
  if (identity === 'freelance') {
    return {
      templateId: workingTemplateMap[jobCategory] || 'creative',
      moduleOrder: [
        { type: 'projects', title: '项目经历' },
        { type: 'experience', title: '工作经历' },
        { type: 'skills', title: '技能特长' },
        { type: 'education', title: '教育背景' },
      ],
    };
  }

  return {
    templateId: workingTemplateMap[jobCategory] || 'professional',
    moduleOrder: workingBase,
  };
}
