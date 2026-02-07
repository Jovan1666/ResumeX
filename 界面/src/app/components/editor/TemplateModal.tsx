import React, { useRef, useState, useEffect, useMemo, memo } from 'react';
import { useResumeStore } from '@/app/store/useResumeStore';
import { TemplateId, ResumeData } from '@/app/types/resume';
import { ThemeColor } from '@/app/types/theme';
import { X, Check, Palette, Briefcase, FileText, Sparkles, Award, Building2, Code, TrendingUp, Bot, Factory, Wrench, Calculator, Users, Stethoscope, ShoppingCart, Newspaper, GraduationCap, Clock, Columns2, Wand2, BookOpen, LayoutGrid, Crown, Rocket, BarChart3, Cpu, Megaphone, Monitor, BookMarked, Globe2, Target, Coffee, ScrollText, UserCheck, Leaf, Landmark, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/app/lib/utils';
import { ResumeRenderer } from '@/app/components/templates/ResumeRenderer';
import { initialResumeData } from '@/app/data/initialData';

// 模板ID → 主题色映射
const templateThemeMap: Record<TemplateId, ThemeColor> = {
  tech: 'tech-orange',
  business: 'business-blue',
  minimal: 'minimal-bw',
  vibrant: 'vibrant-red',
  professional: 'pro-blue',
  civilService: 'minimal-bw',
  javaDev: 'tech-orange',
  operations: 'vibrant-red',
  aiDev: 'tech-orange',
  industry: 'tech-orange',
  engineer: 'tech-orange',
  accountant: 'business-blue',
  hr: 'pro-blue',
  medical: 'business-blue',
  sales: 'pro-blue',
  media: 'vibrant-red',
  teacher: 'pro-blue',
  timeline: 'emerald-green',
  twoColumnCompact: 'navy-compact',
  creative: 'creative-purple',
  academic: 'minimal-bw',
  card: 'warm-amber',
  executive: 'elegant-gold',
  freshGrad: 'fresh-teal',
  infographic: 'indigo-data',
  aiRed: 'vibrant-red',
  opsOrange: 'warm-amber',
  fePurple: 'creative-purple',
  eduDark: 'minimal-bw',
  enBw: 'minimal-bw',
  generalRed: 'vibrant-red',
  javaBlue: 'business-blue',
  gradBlue: 'business-blue',
  recruitBk: 'minimal-bw',
  feGreen: 'emerald-green',
  civilGray: 'minimal-bw',
};

// 自适应缩放预览组件（缩略图 + 大预览通用）
const ScaledPreview: React.FC<{ templateId: TemplateId; lazy?: boolean }> = memo(({ templateId, lazy = true }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.25);
  const [isVisible, setIsVisible] = useState(!lazy);

  useEffect(() => {
    if (!lazy) return;
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.disconnect(); } },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [lazy]);

  useEffect(() => {
    if (!isVisible) return;
    const updateScale = () => {
      if (containerRef.current) {
        setScale(containerRef.current.offsetWidth / 793);
      }
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [isVisible]);

  const previewData = useMemo<ResumeData>(() => ({
    ...initialResumeData,
    id: `preview-${templateId}`,
    template: templateId,
    settings: {
      ...initialResumeData.settings,
      themeColor: templateThemeMap[templateId],
    },
  }), [templateId]);

  return (
    <div ref={containerRef} className="w-full aspect-[210/297] relative overflow-hidden bg-gray-50 rounded-lg">
      {isVisible ? (
        <div
          className="absolute top-0 left-0 pointer-events-none"
          style={{
            width: '210mm',
            minHeight: '297mm',
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          <ResumeRenderer data={previewData} scale={1} />
        </div>
      ) : (
        <div className="w-full h-full animate-pulse bg-gray-200/50" />
      )}
    </div>
  );
});
ScaledPreview.displayName = 'ScaledPreview';

// 缩略图卡片（列表模式用）
const TemplatePreviewThumbnail: React.FC<{ templateId: TemplateId }> = memo(({ templateId }) => {
  return (
    <div className="mb-4 relative rounded-lg overflow-hidden shadow-sm border border-gray-100">
      <ScaledPreview templateId={templateId} lazy={true} />
      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
        <span className="bg-white text-gray-900 px-4 py-2 rounded-full text-sm font-medium transform translate-y-2 group-hover:translate-y-0 transition-transform">
          预览此模板
        </span>
      </div>
    </div>
  );
});
TemplatePreviewThumbnail.displayName = 'TemplatePreviewThumbnail';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const templates: {
  id: TemplateId;
  name: string;
  nameZh: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  tags: string[];
}[] = [
  {
    id: 'tech',
    name: 'Tech Orange',
    nameZh: '科技橙红',
    description: '适合IT、互联网、技术岗位',
    icon: <Palette size={24} />,
    color: '#E53E3E',
    tags: ['技术', '互联网']
  },
  {
    id: 'business',
    name: 'Business Blue',
    nameZh: '商务浅蓝',
    description: '适合商务、金融、管理岗位',
    icon: <Briefcase size={24} />,
    color: '#3182CE',
    tags: ['商务', '校招']
  },
  {
    id: 'minimal',
    name: 'Minimal B&W',
    nameZh: '极简黑白',
    description: '适合财务、法务、传统行业',
    icon: <FileText size={24} />,
    color: '#1A202C',
    tags: ['极简', '传统']
  },
  {
    id: 'vibrant',
    name: 'Vibrant Red',
    nameZh: '活力红',
    description: '适合运营、市场、创意岗位',
    icon: <Sparkles size={24} />,
    color: '#C53030',
    tags: ['创意', '运营']
  },
  {
    id: 'professional',
    name: 'Professional',
    nameZh: '双栏专业',
    description: '适合资深人士、管理层',
    icon: <Award size={24} />,
    color: '#2B6CB0',
    tags: ['专业', '高端']
  },
  {
    id: 'civilService',
    name: 'Civil Service',
    nameZh: '公务员/事业单位',
    description: '适合公务员、事业单位、政府机关',
    icon: <Building2 size={24} />,
    color: '#4A5568',
    tags: ['公务员', '事业单位']
  },
  {
    id: 'javaDev',
    name: 'Java Developer',
    nameZh: 'Java后端开发',
    description: '适合Java、后端、服务端开发',
    icon: <Code size={24} />,
    color: '#E67E22',
    tags: ['后端', 'Java']
  },
  {
    id: 'operations',
    name: 'Operations',
    nameZh: '运营专员',
    description: '适合用户运营、内容运营、活动运营',
    icon: <TrendingUp size={24} />,
    color: '#E74C3C',
    tags: ['运营', '增长']
  },
  {
    id: 'aiDev',
    name: 'AI Developer',
    nameZh: 'AI应用开发',
    description: '适合AI工程师、算法工程师、大模型开发',
    icon: <Bot size={24} />,
    color: '#C0392B',
    tags: ['AI', '算法']
  },
  {
    id: 'industry',
    name: 'Industry General',
    nameZh: '各行业通用',
    description: '适合各行业通用，风格简洁专业',
    icon: <Factory size={24} />,
    color: '#C0392B',
    tags: ['通用', '简洁']
  },
  {
    id: 'engineer',
    name: 'Engineer',
    nameZh: '工程师',
    description: '适合车辆工程、机械工程、硬件研发',
    icon: <Wrench size={24} />,
    color: '#E74C3C',
    tags: ['工程', '研发']
  },
  {
    id: 'accountant',
    name: 'Accountant',
    nameZh: '会计财务',
    description: '适合会计、财务、审计岗位',
    icon: <Calculator size={24} />,
    color: '#1E6B7B',
    tags: ['财务', '会计']
  },
  {
    id: 'hr',
    name: 'HR Specialist',
    nameZh: '人事专员',
    description: '适合人事、行政、招聘岗位',
    icon: <Users size={24} />,
    color: '#667EEA',
    tags: ['人事', '行政']
  },
  {
    id: 'medical',
    name: 'Medical',
    nameZh: '医疗专业',
    description: '适合医生、护士、医疗技术人员',
    icon: <Stethoscope size={24} />,
    color: '#1E5B7B',
    tags: ['医疗', '医学']
  },
  {
    id: 'sales',
    name: 'Sales',
    nameZh: '销售岗位',
    description: '适合销售、业务、商务拓展',
    icon: <ShoppingCart size={24} />,
    color: '#1E3A5F',
    tags: ['销售', '商务']
  },
  {
    id: 'media',
    name: 'Media',
    nameZh: '新闻传播',
    description: '适合新闻、传媒、编辑、记者',
    icon: <Newspaper size={24} />,
    color: '#1E3A5F',
    tags: ['传媒', '新闻']
  },
  {
    id: 'teacher',
    name: 'Teacher',
    nameZh: '教师',
    description: '适合教师、培训师、教育工作者',
    icon: <GraduationCap size={24} />,
    color: '#1E3A5F',
    tags: ['教育', '教师']
  },
  {
    id: 'timeline',
    name: 'Timeline',
    nameZh: '时间线风格',
    description: '垂直时间线布局，清晰展示职业轨迹',
    icon: <Clock size={24} />,
    color: '#059669',
    tags: ['时间线', '清晰']
  },
  {
    id: 'twoColumnCompact',
    name: 'Two Column Compact',
    nameZh: '经典双栏紧凑',
    description: '左栏侧边信息+右栏主内容，信息密度高',
    icon: <Columns2 size={24} />,
    color: '#1E3A5F',
    tags: ['双栏', '紧凑']
  },
  {
    id: 'creative',
    name: 'Creative',
    nameZh: '创意设计',
    description: '渐变色彩头部+卡片式内容，设计感强',
    icon: <Wand2 size={24} />,
    color: '#7C3AED',
    tags: ['创意', '设计']
  },
  {
    id: 'academic',
    name: 'Academic',
    nameZh: '学术简约',
    description: '衬线字体、密集信息，适合学术/留学申请',
    icon: <BookOpen size={24} />,
    color: '#374151',
    tags: ['学术', '留学']
  },
  {
    id: 'card',
    name: 'Card Module',
    nameZh: '卡片模块',
    description: '模块化卡片网格布局，清新活泼',
    icon: <LayoutGrid size={24} />,
    color: '#D97706',
    tags: ['卡片', '模块化']
  },
  {
    id: 'executive',
    name: 'Executive',
    nameZh: '高端精英',
    description: '大量留白+衬线字体+金色点缀，高管风格',
    icon: <Crown size={24} />,
    color: '#92400E',
    tags: ['高端', '精英']
  },
  {
    id: 'freshGrad',
    name: 'Fresh Graduate',
    nameZh: '应届生专属',
    description: '教育背景优先，专为应届毕业生设计',
    icon: <Rocket size={24} />,
    color: '#0D9488',
    tags: ['应届生', '校招']
  },
  {
    id: 'infographic',
    name: 'Infographic',
    nameZh: '信息图表',
    description: '技能柱状图+数据卡片+时间线，数据可视化',
    icon: <BarChart3 size={24} />,
    color: '#4F46E5',
    tags: ['图表', '可视化']
  },
  {
    id: 'aiRed',
    name: 'AI Red',
    nameZh: 'AI应用开发·红',
    description: '红色主题+头像，适合AI/算法/大模型工程师',
    icon: <Cpu size={24} />,
    color: '#DC2626',
    tags: ['AI', '技术']
  },
  {
    id: 'opsOrange',
    name: 'Ops Orange',
    nameZh: '运营·橙',
    description: '橙色主题+头像，适合用户/内容/活动运营',
    icon: <Megaphone size={24} />,
    color: '#EA580C',
    tags: ['运营', '增长']
  },
  {
    id: 'fePurple',
    name: 'Frontend Purple',
    nameZh: '前端工程师·紫',
    description: '紫色主题+照片，适合前端/全栈工程师',
    icon: <Monitor size={24} />,
    color: '#7C3AED',
    tags: ['技术', '前端']
  },
  {
    id: 'eduDark',
    name: 'Education Dark',
    nameZh: '教育培训·深灰',
    description: '深灰主题无头像，极度紧凑高信息密度',
    icon: <BookMarked size={24} />,
    color: '#1F2937',
    tags: ['教育', '通用']
  },
  {
    id: 'enBw',
    name: 'English B&W',
    nameZh: '英文简历·黑白',
    description: '经典黑白学术风格，LaTeX排版感，适合留学/外企',
    icon: <Globe2 size={24} />,
    color: '#111827',
    tags: ['英文', '学术']
  },
  {
    id: 'generalRed',
    name: 'General Red',
    nameZh: '行业通用·红',
    description: '红色主题无头像，自我评价置顶，各行业通用',
    icon: <Target size={24} />,
    color: '#DC2626',
    tags: ['通用', '简洁']
  },
  {
    id: 'javaBlue',
    name: 'Java Blue',
    nameZh: 'Java实习·蓝',
    description: '蓝色主题无头像，岗位名大标题，适合后端实习',
    icon: <Coffee size={24} />,
    color: '#2563EB',
    tags: ['技术', 'Java']
  },
  {
    id: 'gradBlue',
    name: 'Grad Exam Blue',
    nameZh: '研究生复试·蓝',
    description: '蓝色主题+头像+初试成绩表，适合考研复试',
    icon: <ScrollText size={24} />,
    color: '#2563EB',
    tags: ['学术', '考研']
  },
  {
    id: 'recruitBk',
    name: 'Recruit Black',
    nameZh: '校招社招·黑',
    description: '纯黑极简无装饰，最干净简约，校招社招通用',
    icon: <UserCheck size={24} />,
    color: '#111827',
    tags: ['校招', '极简']
  },
  {
    id: 'feGreen',
    name: 'Frontend Green',
    nameZh: '前端工程师·绿',
    description: '绿色背景色块标题+照片，技术栈标签展示',
    icon: <Leaf size={24} />,
    color: '#16A34A',
    tags: ['技术', '前端']
  },
  {
    id: 'civilGray',
    name: 'Civil Gray',
    nameZh: '公务员·灰',
    description: '深灰主题+照片，庄重正式，附致谢段落',
    icon: <Landmark size={24} />,
    color: '#374151',
    tags: ['公务员', '事业单位']
  }
];

// 标签筛选分类
const filterTags = [
  { label: '全部', value: '' },
  { label: '技术', value: '技术' },
  { label: '商务', value: '商务' },
  { label: '创意', value: '创意' },
  { label: '学术', value: '学术' },
  { label: '校招', value: '校招' },
  { label: '通用', value: '通用' },
];

export const TemplateModal: React.FC<TemplateModalProps> = ({ isOpen, onClose }) => {
  const { resumes, activeResumeId, setTemplate } = useResumeStore();
  const currentTemplate = resumes[activeResumeId]?.template;
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  // null = 列表模式，有值 = 预览模式
  const [previewTarget, setPreviewTarget] = useState<TemplateId | null>(null);

  // 关闭弹窗时重置
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setActiveFilter('');
      setPreviewTarget(null);
    }
  }, [isOpen]);

  const previewInfo = previewTarget ? templates.find(t => t.id === previewTarget) : null;
  const isCurrentTemplate = previewTarget === currentTemplate;

  const handleConfirmSwitch = () => {
    if (!previewTarget) return;
    setTemplate(previewTarget);
    setPreviewTarget(null);
    onClose();
  };

  // 过滤模板
  const filteredTemplates = templates.filter(t => {
    const matchesSearch = !searchQuery || 
      t.nameZh.includes(searchQuery) || 
      t.description.includes(searchQuery) ||
      t.tags.some(tag => tag.includes(searchQuery));
    const matchesFilter = !activeFilter || t.tags.some(tag => tag.includes(activeFilter));
    return matchesSearch && matchesFilter;
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 bg-white rounded-2xl shadow-2xl z-50 md:w-[900px] md:max-h-[85vh] overflow-hidden flex flex-col"
          >
            {/* ========== 预览模式 ========== */}
            {previewTarget && previewInfo ? (
              <>
                {/* 预览模式 Header */}
                <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                  <button
                    onClick={() => setPreviewTarget(null)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <ArrowLeft size={20} className="text-gray-600" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-gray-900 truncate">预览：{previewInfo.nameZh}</h2>
                    <p className="text-sm text-gray-500 truncate">{previewInfo.description}</p>
                  </div>
                  <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors shrink-0">
                    <X size={20} className="text-gray-500" />
                  </button>
                </div>

                {/* 预览主体：左侧大预览 + 右侧信息面板 */}
                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                  {/* 左侧：大预览图 */}
                  <div className="flex-1 overflow-auto p-6 flex items-start justify-center bg-gray-50">
                    <div className="w-full max-w-[420px]">
                      <ScaledPreview templateId={previewTarget} lazy={false} />
                    </div>
                  </div>

                  {/* 右侧：信息 + 操作按钮 */}
                  <div className="w-full md:w-[260px] border-t md:border-t-0 md:border-l border-gray-100 p-5 flex flex-col gap-4 shrink-0 bg-white">
                    {/* 模板信息 */}
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0"
                        style={{ backgroundColor: previewInfo.color }}
                      >
                        {previewInfo.icon}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-gray-900 text-base">{previewInfo.nameZh}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{previewInfo.name}</p>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 leading-relaxed">{previewInfo.description}</p>

                    {/* 标签 */}
                    <div className="flex flex-wrap gap-1.5">
                      {previewInfo.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* 当前状态 */}
                    {isCurrentTemplate && (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 text-blue-700">
                        <Check size={16} />
                        <span className="text-sm font-medium">当前使用中</span>
                      </div>
                    )}

                    {/* 操作按钮 */}
                    <div className="mt-auto flex flex-col gap-2">
                      {!isCurrentTemplate && (
                        <button
                          onClick={handleConfirmSwitch}
                          className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
                        >
                          使用此模板
                        </button>
                      )}
                      <button
                        onClick={() => setPreviewTarget(null)}
                        className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                      >
                        返回模板列表
                      </button>
                    </div>

                    <p className="text-[11px] text-gray-400 text-center">
                      切换模板不会丢失已填写的内容
                    </p>
                  </div>
                </div>
              </>
            ) : (
              /* ========== 列表模式 ========== */
              <>
                {/* Header + Search + Filter */}
                <div className="p-5 border-b border-gray-100 space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">切换模板</h2>
                      <p className="text-sm text-gray-500 mt-0.5">点击模板卡片可预览效果</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                      <X size={20} className="text-gray-500" />
                    </button>
                  </div>
                  {/* 搜索框 */}
                  <input
                    type="text"
                    placeholder="搜索模板名称、描述或标签..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none"
                  />
                  {/* 标签筛选 */}
                  <div className="flex flex-wrap gap-2">
                    {filterTags.map(tag => (
                      <button
                        key={tag.value}
                        onClick={() => setActiveFilter(activeFilter === tag.value ? '' : tag.value)}
                        className={cn(
                          "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                          activeFilter === tag.value
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        )}
                      >
                        {tag.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 模板卡片列表 */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTemplates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => setPreviewTarget(template.id)}
                        className={cn(
                          "group relative p-4 rounded-xl border-2 transition-all text-left hover:shadow-lg",
                          currentTemplate === template.id
                            ? "border-blue-500 bg-blue-50 shadow-md"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        )}
                      >
                        {/* 当前模板标记 */}
                        {currentTemplate === template.id && (
                          <div className="absolute -top-2 -right-2 bg-blue-500 text-white p-1 rounded-full shadow-lg z-10">
                            <Check size={14} />
                          </div>
                        )}

                        {/* 缩略图 */}
                        <TemplatePreviewThumbnail templateId={template.id} />

                        {/* 信息 */}
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-gray-900">{template.nameZh}</h3>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{template.description}</p>
                          </div>
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 ml-2"
                            style={{ backgroundColor: template.color }}
                          >
                            {template.icon}
                          </div>
                        </div>

                        {/* 标签 */}
                        <div className="flex gap-1 mt-2">
                          {template.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 text-center text-xs text-gray-500">
                  提示：更换模板不会丢失任何数据，您可以随时切换回来
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
