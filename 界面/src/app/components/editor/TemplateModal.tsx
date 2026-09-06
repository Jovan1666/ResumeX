import React, { useRef, useState, useEffect, useMemo, memo } from 'react';
import { useResumeStore, TEMPLATE_THEME } from '@/app/store/useResumeStore';
import { TemplateId, ResumeData } from '@/app/types/resume';
import { X, Check, FileText, Briefcase, Landmark, Code, GraduationCap, Columns2, Globe2, Layers, ArrowLeft, PanelLeft, PanelRight, Frame, Leaf, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/app/lib/utils';
import { ResumeRenderer } from '@/app/components/templates/ResumeRenderer';

/**
 * 模板选择器：8 张卡（02 §5.2），缩略图用 ScaledPreview 静态预览（低开销），
 * 大预览懒加载当前 hover 的那一套。选择模板时同时写入默认主题（§5.4）。
 */

// 8 套模板元数据
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
    id: 'campusClean',
    name: 'Campus Clean',
    nameZh: '校招通用',
    description: '单栏、教育在前、可选右上证件照；应届/实习首选',
    icon: <GraduationCap size={24} />,
    color: '#2B6CB0',
    tags: ['校招', '通用'],
  },
  {
    id: 'jobClean',
    name: 'Job Clean',
    nameZh: '社招通用',
    description: '单栏、工作在前、可选照片；互联网社招首选',
    icon: <Briefcase size={24} />,
    color: '#1E4E8C',
    tags: ['社招', '通用'],
  },
  {
    id: 'navyBiz',
    name: 'Navy Biz',
    nameZh: '商务深蓝',
    description: '深蓝标题线、可切换宋体；金融/商务/国企',
    icon: <FileText size={24} />,
    color: '#1E4E8C',
    tags: ['商务', '金融'],
  },
  {
    id: 'civilFile',
    name: 'Civil File',
    nameZh: '体制公文',
    description: '矩形证件照、可显示政治面貌/籍贯；公务员/事业单位',
    icon: <Landmark size={24} />,
    color: '#1A1A1A',
    tags: ['公务员', '体制内'],
  },
  {
    id: 'techPlain',
    name: 'Tech Plain',
    nameZh: '技术简洁',
    description: '单栏、技能分组、项目技术栈一行 tag；研发岗',
    icon: <Code size={24} />,
    color: '#4A5568',
    tags: ['技术', '研发'],
  },
  {
    id: 'atsMono',
    name: 'ATS Mono',
    nameZh: '极简黑白',
    description: '单栏纯黑、无图标、ATS/网申解析最友好',
    icon: <Layers size={24} />,
    color: '#1A1A1A',
    tags: ['极简', '网申'],
  },
  {
    id: 'compactSplit',
    name: 'Compact Split',
    nameZh: '双栏紧凑',
    description: '左栏浅底（≤28%）、右主经历；信息多但想一页时用',
    icon: <Columns2 size={24} />,
    color: '#1E4E8C',
    tags: ['进阶', '双栏'],
  },
  {
    id: 'enSimple',
    name: 'EN Simple',
    nameZh: '英文简洁',
    description: '英文栏目标题、单栏；外企/留学',
    icon: <Globe2 size={24} />,
    color: '#1A1A1A',
    tags: ['英文', '外企'],
  },
  {
    id: 'bannerCampus',
    name: 'Banner Campus',
    nameZh: '顶部横幅校招',
    description: '顶部主题色横幅 + 教育在前；校招辨识度高',
    icon: <Sparkles size={24} />,
    color: '#2B6CB0',
    tags: ['校招', '横幅'],
  },
  {
    id: 'navySidebar',
    name: 'Navy Sidebar',
    nameZh: '深蓝侧栏商务',
    description: '左 20% 深蓝侧栏（联系方式/技能白字）+ 右主经历；金融/商务',
    icon: <PanelLeft size={24} />,
    color: '#1E3A5F',
    tags: ['商务', '侧栏'],
  },
  {
    id: 'lineFrame',
    name: 'Line Frame',
    nameZh: '细线框档案',
    description: '四周细线框 + 姓名居中；公务员/事业单位端庄版',
    icon: <Frame size={24} />,
    color: '#1A1A1A',
    tags: ['体制内', '档案'],
  },
  {
    id: 'greenFresh',
    name: 'Green Fresh',
    nameZh: '浅底标题清新',
    description: '栏目标题浅底色块；教育/环保/医疗清新风',
    icon: <Leaf size={24} />,
    color: '#2F6F4E',
    tags: ['清新', '教育'],
  },
  {
    id: 'sidebarRight',
    name: 'Sidebar Right',
    nameZh: '右栏侧栏',
    description: '主经历在左 70% + 右 30% 浅底侧栏；阅读顺序友好',
    icon: <PanelRight size={24} />,
    color: '#2B6CB0',
    tags: ['双栏', '侧栏'],
  },
  {
    id: 'twoColumnEqual',
    name: 'Two Column Equal',
    nameZh: '等宽双列',
    description: '正文 50/50 两列并行；信息多但想一页',
    icon: <Columns2 size={24} />,
    color: '#4A5568',
    tags: ['双栏', '紧凑'],
  },
];

// 默认展示的模板（主列表干净）+「更多」进阶模板（双栏/侧栏类）
const MORE_ID_SET = new Set<string>(['compactSplit', 'navySidebar', 'sidebarRight', 'twoColumnEqual']);
const DEFAULT_TEMPLATES = templates.filter(t => !MORE_ID_SET.has(t.id));
const MORE_TEMPLATES = templates.filter(t => MORE_ID_SET.has(t.id));

// 静态预览数据（示例数据 + 占位中文「姓名」「意向」，避免空纸与李明）
function makePreviewData(templateId: TemplateId): ResumeData {
  return {
    id: `preview-${templateId}`,
    title: '示例简历',
    lastModified: Date.now(),
    template: templateId,
    profile: {
      name: '王小明',
      title: '前端开发工程师',
      email: 'wangxm@example.com',
      phone: '138 0000 1234',
      location: '北京',
      wechat: 'wangxm_dev',
      summary: '5 年 Web 开发经验，熟悉 React/TypeScript 与工程化。',
      avatar: '',
      customFields: [],
    },
    settings: {
      themeColor: TEMPLATE_THEME[templateId] ?? 'ink',
      fontFamily: 'sans',
      fontSizeScale: 1,
      lineHeight: 'standard',
      pageMargin: 'standard',
      language: 'zh',
    },
    modules: [
      { id: 'edu-1', type: 'education', title: '教育背景', visible: true, items: [
        { id: 'e1', title: '软件工程 / 本科', subtitle: '华北理工大学', date: '2016.09 - 2020.06', description: '主修：数据结构、操作系统。' } ] },
      { id: 'exp-1', type: 'experience', title: '工作经历', visible: true, items: [
        { id: 'x1', title: '前端工程师', subtitle: '某某科技', date: '2021.03 - 至今', description: '• 负责核心产品 Web 端开发。' } ] },
      { id: 'proj-1', type: 'projects', title: '项目经历', visible: true, items: [
        { id: 'p1', title: '可视化搭建平台', subtitle: '个人项目', date: '2022.01 - 2023.06', description: '• 基于 React + dnd-kit 实现拖拽编辑器。' } ] },
      { id: 'skills-1', type: 'skills', title: '专业技能', visible: true, items: [
        { id: 's1', name: 'React / Vue' }, { id: 's2', name: 'TypeScript' }, { id: 's3', name: 'Node.js' } ] },
    ],
  };
}

// 自适应缩放预览组件（缩略图 + 大预览通用，低成本）
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
    let timer: ReturnType<typeof setTimeout>;
    const debouncedUpdate = () => {
      clearTimeout(timer);
      timer = setTimeout(updateScale, 150);
    };
    window.addEventListener('resize', debouncedUpdate);
    return () => {
      window.removeEventListener('resize', debouncedUpdate);
      clearTimeout(timer);
    };
  }, [isVisible]);

  const previewData = useMemo(() => makePreviewData(templateId), [templateId]);

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

// 缩略图卡片（不是按钮——外层 TemplateCard 已是 button，避免嵌套）
const TemplatePreviewThumbnail: React.FC<{ templateId: TemplateId }> = memo(({ templateId }) => {
  return (
    <div className="mb-4 relative rounded-lg overflow-hidden shadow-sm border border-gray-100 w-full text-left">
      <ScaledPreview templateId={templateId} lazy={true} />
    </div>
  );
});
TemplatePreviewThumbnail.displayName = 'TemplatePreviewThumbnail';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// 模板卡组件
const TemplateCard: React.FC<{
  t: typeof templates[number];
  current: boolean;
  onPreview: () => void;
}> = memo(({ t, current, onPreview }) => (
  <button
    type="button"
    onClick={onPreview}
    className={cn(
      "group relative p-4 rounded-xl border-2 transition-all text-left hover:shadow-lg",
      current ? "border-blue-500 bg-blue-50 shadow-md" : "border-gray-200 hover:border-gray-300 bg-white"
    )}
  >
    {current && (
      <div className="absolute -top-2 -right-2 bg-blue-500 text-white p-1 rounded-full shadow-lg z-10">
        <Check size={14} />
      </div>
    )}
    <TemplatePreviewThumbnail templateId={t.id} />
    <div className="flex items-start justify-between">
      <div className="min-w-0 flex-1">
        <h3 className="font-bold text-gray-900">{t.nameZh}</h3>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{t.description}</p>
      </div>
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 ml-2"
        style={{ backgroundColor: t.color }}
      >
        {t.icon}
      </div>
    </div>
    <div className="flex gap-1 mt-2">
      {t.tags.map((tag) => (
        <span key={tag} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
          {tag}
        </span>
      ))}
    </div>
  </button>
));
TemplateCard.displayName = 'TemplateCard';

export const TemplateModal: React.FC<TemplateModalProps> = ({ isOpen, onClose }) => {
  const currentTemplate = useResumeStore(state => state.resumes[state.activeResumeId]?.template);
  const setTemplate = useResumeStore(state => state.setTemplate);
  const [showMore, setShowMore] = useState(false);
  const [previewTarget, setPreviewTarget] = useState<TemplateId | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setPreviewTarget(null);
      setShowMore(false);
    }
  }, [isOpen]);

  const previewInfo = previewTarget ? templates.find(t => t.id === previewTarget) : null;
  const isCurrentTemplate = previewTarget === currentTemplate;

  // 选择模板：setTemplate 内部会同时写默认主题（02 §5.4）
  const handleConfirmSwitch = () => {
    if (!previewTarget) return;
    setTemplate(previewTarget);
    setPreviewTarget(null);
    onClose();
  };

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

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                  <div className="flex-1 overflow-auto p-6 flex items-start justify-center bg-gray-50">
                    <div className="w-full max-w-[420px]">
                      <ScaledPreview templateId={previewTarget} lazy={false} />
                    </div>
                  </div>

                  <div className="w-full md:w-[260px] border-t md:border-t-0 md:border-l border-gray-100 p-5 flex flex-col gap-4 shrink-0 bg-white">
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
                    <div className="flex flex-wrap gap-1.5">
                      {previewInfo.tags.map((tag) => (
                        <span key={tag} className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                          {tag}
                        </span>
                      ))}
                    </div>
                    {isCurrentTemplate && (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 text-blue-700">
                        <Check size={16} />
                        <span className="text-sm font-medium">当前使用中</span>
                      </div>
                    )}
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
                      切换模板会自动配合同色主题，已填内容不丢失
                    </p>
                  </div>
                </div>
              </>
            ) : (
              /* ========== 列表模式 ========== */
              <>
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
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(showMore ? MORE_TEMPLATES : DEFAULT_TEMPLATES).map((template) => (
                      <TemplateCard
                        key={template.id}
                        t={template}
                        current={currentTemplate === template.id}
                        onPreview={() => setPreviewTarget(template.id)}
                      />
                    ))}
                  </div>

                  {/* 更多（进阶模板：双栏/侧栏类） */}
                  <button
                    type="button"
                    onClick={() => setShowMore(!showMore)}
                    className="mt-4 w-full py-2.5 rounded-lg border border-dashed border-gray-300 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
                  >
                    {showMore ? '← 返回常规模板' : '更多模板（双栏 / 侧栏 / 进阶）'}
                  </button>
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50 text-center text-xs text-gray-500">
                  提示：更换模板会自动切换配套主题，数据不丢失
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
