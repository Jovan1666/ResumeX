import React, { useRef, useState, useEffect, useMemo, memo } from 'react';
import { useResumeStore, TEMPLATE_THEME } from '@/app/store/useResumeStore';
import { TemplateId, ResumeData } from '@/app/types/resume';
import { themes, resolveSidebarWidth } from '@/app/types/theme';
import { emptyResumeData } from '@/app/data/initialData';
import { X, Check, Columns2, Sparkles, Frame, Layers, Globe2, Landmark, LayoutTemplate, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/app/lib/utils';
import { ResumeRenderer } from '@/app/components/templates/ResumeRenderer';

/**
 * 模板选择器：7 张卡（14 套合并后），无「更多」折叠。
 * - 卡片缩略图 = 结构示意 + 该模板默认主题的真实配色（0.34 缩放的真实排版在卡片里读不出差别，
 *   所以缩略图不渲染纸面，只画版式骨架）
 * - 点开卡片 = 用**当前简历的真实数据**渲染该模板（禁止王小明/某某科技之类的演示数据）
 * 选择模板时同时写入默认主题（§5.4）。
 */

/** 结构示意配置：每套模板的版式骨架 */
type Schematic = {
  header: 'left' | 'center' | 'banner';
  sidebar?: { side: 'left' | 'right'; width: number; dark: boolean };
  photo?: boolean;
  frame?: 'line' | 'band';
  title: 'line' | 'bar' | 'plain' | 'bg';
  /** 栏目名文案（enSimple 用英文；仅为版式说明，不是个人数据） */
  titles: [string, string, string];
  /** 头部第二行：公文式字段行 */
  formal?: boolean;
};

type TemplateMeta = {
  id: TemplateId;
  name: string;
  nameZh: string;
  description: string;
  icon: React.ReactNode;
  tags: string[];
  schematic: Schematic;
};

const templates: TemplateMeta[] = [
  {
    id: 'classic',
    name: 'Classic',
    nameZh: '简洁通用',
    description: '单栏通用版式；栏目头（下划线/色条/纯加粗）、地点、姓名字号均可调。校招与社招都合适',
    icon: <LayoutTemplate size={22} />,
    tags: ['校招', '社招', '通用'],
    schematic: { header: 'left', photo: true, title: 'line', titles: ['教育背景', '工作经历', '项目经历'] },
  },
  {
    id: 'sidebar',
    name: 'Sidebar',
    nameZh: '侧栏双栏',
    description: '侧栏可左可右、宽度 25/30/35/50%、底色可主题色实底；信息多也能排进一页',
    icon: <Columns2 size={22} />,
    tags: ['双栏', '紧凑'],
    schematic: { header: 'center', photo: true, sidebar: { side: 'left', width: 30, dark: false }, title: 'bar', titles: ['工作经历', '项目经历', '教育背景'] },
  },
  {
    id: 'banner',
    name: 'Banner',
    nameZh: '顶部横幅',
    description: '顶部主题色横幅（姓名/意向居中），下方单栏；校招辨识度高',
    icon: <Sparkles size={22} />,
    tags: ['校招', '横幅'],
    schematic: { header: 'banner', title: 'line', titles: ['教育背景', '实习经历', '校园经历'] },
  },
  {
    id: 'frame',
    name: 'Frame',
    nameZh: '线框档案',
    description: '居中姓名 + 整页细线框，或改为栏目浅底色块；端庄档案风',
    icon: <Frame size={22} />,
    tags: ['档案', '端庄'],
    schematic: { header: 'center', photo: true, frame: 'line', title: 'plain', titles: ['教育背景', '工作经历', '技能特长'] },
  },
  {
    id: 'atsMono',
    name: 'ATS Mono',
    nameZh: '极简黑白',
    description: '无照片、无装饰、纯文本层级；网申与 ATS 解析最友好',
    icon: <Layers size={22} />,
    tags: ['极简', '网申'],
    schematic: { header: 'left', photo: false, title: 'plain', titles: ['教育背景', '工作经历', '技能特长'] },
  },
  {
    id: 'enSimple',
    name: 'EN Simple',
    nameZh: '英文简洁',
    description: '英文栏目名（Education / Experience…）、单栏；外企与留学申请',
    icon: <Globe2 size={22} />,
    tags: ['英文', '外企'],
    schematic: { header: 'left', photo: true, title: 'line', titles: ['Education', 'Experience', 'Projects'] },
  },
  {
    id: 'civilFile',
    name: 'Civil File',
    nameZh: '体制公文',
    description: '默认宋体、居中抬头带政治面貌/籍贯、色条栏目头；公务员与事业单位',
    icon: <Landmark size={22} />,
    tags: ['体制内', '公文'],
    schematic: { header: 'center', photo: true, title: 'bar', formal: true, titles: ['教育背景', '工作经历', '技能特长'] },
  },
];

/** 该模板卡片的真实配色（来自主题表，不写死 hex） */
function schematicColors(id: TemplateId) {
  const theme = themes[TEMPLATE_THEME[id] ?? 'ink'];
  return {
    primary: theme.colors.primary,
    secondary: theme.colors.secondary,
    accent: theme.colors.accent,
  };
}

const Bar: React.FC<{ w: string; h?: number; color?: string; mt?: number; bold?: boolean }> = ({
  w, h = 4, color = '#DDE1E6', mt = 0, bold,
}) => (
  <div style={{ width: w, height: `${h}%`, minHeight: 2, backgroundColor: color, borderRadius: 1, marginTop: mt, opacity: bold ? 1 : 0.9 }} />
);

/** 栏目头示意（与 SectionTitle 的四种 variant 一一对应） */
const TitleMark: React.FC<{ title: string; variant: Schematic['title']; primary: string }> = ({ title, variant, primary }) => {
  const label = (
    <span style={{ fontSize: '7px', fontWeight: 700, color: '#2B2F36', lineHeight: 1.2, whiteSpace: 'nowrap' }}>{title}</span>
  );
  if (variant === 'bar') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 3 }}>
        <span style={{ width: 2, height: 8, backgroundColor: primary, borderRadius: 1 }} />
        {label}
      </div>
    );
  }
  if (variant === 'plain') return <div style={{ marginBottom: 3 }}>{label}</div>;
  if (variant === 'bg') {
    return (
      <div style={{ marginBottom: 3 }}>
        <span style={{ fontSize: '7px', fontWeight: 700, color: '#2B2F36', backgroundColor: `color-mix(in srgb, ${primary} 14%, white)`, padding: '1px 3px', borderRadius: 2 }}>{title}</span>
      </div>
    );
  }
  return (
    <div style={{ marginBottom: 3, borderBottom: `1px solid color-mix(in srgb, ${primary} 45%, transparent)`, paddingBottom: 1 }}>
      {label}
    </div>
  );
};

/** 一组正文占位条（不含任何个人数据） */
const BodyLines: React.FC<{ widths: string[] }> = ({ widths }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
    {widths.map((w, i) => <Bar key={i} w={w} h={3} mt={0} />)}
  </div>
);

/**
 * 卡片缩略图：结构示意 + 真实配色。
 * 不用真实排版缩放（scale≈0.34 时 10.5pt 正文只有 3.6px，肉眼只剩色块）。
 */
const TemplateSchematic: React.FC<{ meta: TemplateMeta }> = memo(({ meta }) => {
  const s = meta.schematic;
  const { primary, secondary } = schematicColors(meta.id);
  const sidebar = s.sidebar;

  const headerBlock = (
    <div style={{ marginBottom: 6 }}>
      {s.header === 'banner' ? (
        <div style={{ backgroundColor: primary, margin: '-6px -6px 6px', padding: '7px 6px', textAlign: 'center' }}>
          <div style={{ fontSize: '9px', fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>{s.photo ? '姓名' : '姓名'}</div>
          <div style={{ marginTop: 3, display: 'flex', justifyContent: 'center', gap: 3 }}>
            <span style={{ width: '22%', height: 3, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 1 }} />
            <span style={{ width: '28%', height: 3, backgroundColor: 'rgba(255,255,255,0.45)', borderRadius: 1 }} />
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: s.header === 'center' ? 'center' : 'space-between', gap: 4 }}>
          <div style={{ textAlign: s.header === 'center' ? 'center' : 'left', flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '9px', fontWeight: 700, color: '#1B1F24', lineHeight: 1.2 }}>{s.header === 'center' ? '姓名' : '姓名'}</div>
            <div style={{ marginTop: 2, display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: s.header === 'center' ? 'center' : 'flex-start' }}>
              <span style={{ width: 22, height: 3, backgroundColor: '#DDE1E6', borderRadius: 1 }} />
              <span style={{ width: 28, height: 3, backgroundColor: '#DDE1E6', borderRadius: 1 }} />
            </div>
            {s.formal && (
              <div style={{ marginTop: 2, display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: s.header === 'center' ? 'center' : 'flex-start' }}>
                <span style={{ width: 18, height: 3, backgroundColor: secondary, borderRadius: 1 }} />
                <span style={{ width: 24, height: 3, backgroundColor: secondary, borderRadius: 1 }} />
              </div>
            )}
          </div>
          {s.photo && <span style={{ width: 11, height: 15, backgroundColor: '#C9CFD7', borderRadius: 1, flexShrink: 0 }} />}
        </div>
      )}
    </div>
  );

  const sections = (
    <>
      <TitleMark title={s.titles[0]} variant={s.title} primary={primary} />
      <BodyLines widths={['92%', '78%']} />
      <div style={{ height: 5 }} />
      <TitleMark title={s.titles[1]} variant={s.title} primary={primary} />
      <BodyLines widths={['96%', '84%', '60%']} />
      <div style={{ height: 5 }} />
      <TitleMark title={s.titles[2]} variant={s.title} primary={primary} />
      <BodyLines widths={['80%', '52%']} />
    </>
  );

  const page = (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', background: '#fff' }}>
      {sidebar && (
        <div
          style={{
            width: `${sidebar.width}%`,
            order: sidebar.side === 'left' ? 1 : 2,
            backgroundColor: sidebar.dark ? primary : '#F5F6F8',
            padding: '6px 5px',
            borderRight: sidebar.side === 'left' ? '1px solid #E6E8EB' : undefined,
            borderLeft: sidebar.side === 'right' ? '1px solid #E6E8EB' : undefined,
            boxSizing: 'border-box',
          }}
        >
          <span style={{ display: 'block', width: 14, height: 19, backgroundColor: sidebar.dark ? 'rgba(255,255,255,0.45)' : '#C9CFD7', borderRadius: 1, margin: '0 auto 4px' }} />
          <div style={{ textAlign: 'center', fontSize: '8px', fontWeight: 700, color: sidebar.dark ? '#fff' : '#1B1F24', lineHeight: 1.2 }}>姓名</div>
          <div style={{ marginTop: 6 }}>
            <TitleMark title="联系方式" variant="bar" primary={sidebar.dark ? '#FFFFFF' : primary} />
            <BodyLines widths={['86%', '70%']} />
            <div style={{ height: 5 }} />
            <TitleMark title="技能" variant="bar" primary={sidebar.dark ? '#FFFFFF' : primary} />
            <BodyLines widths={['92%', '66%']} />
          </div>
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0, order: sidebar ? (sidebar.side === 'left' ? 2 : 1) : 1, padding: '6px' }}>
        {headerBlock}
        {sections}
      </div>
    </div>
  );

  return (
    <div
      className="w-full aspect-[210/297] rounded-md overflow-hidden bg-white border border-gray-200 shadow-inner"
      style={s.frame === 'line' ? { padding: 4 } : undefined}
    >
      {s.frame === 'line' ? (
        <div style={{ width: '100%', height: '100%', border: `1.5px solid ${primary}`, overflow: 'hidden' }}>{page}</div>
      ) : s.frame === 'band' ? (
        <div style={{ width: '100%', height: '100%', background: `color-mix(in srgb, ${primary} 8%, white)` }}>{page}</div>
      ) : (
        page
      )}
    </div>
  );
});
TemplateSchematic.displayName = 'TemplateSchematic';

/**
 * 真实预览：把当前简历的数据套到目标模板上渲染（无任何演示数据）。
 * 简历为空时纸面也是空白（空模块不渲染标题）—— 与用户实际新建后的效果一致。
 */
const RealPreview: React.FC<{ templateId: TemplateId }> = memo(({ templateId }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeResume = useResumeStore(state => state.resumes[state.activeResumeId]);
  const [scale, setScale] = useState(0.55);

  const previewData: ResumeData = useMemo(() => {
    const base = activeResume ? activeResume : emptyResumeData();
    return {
      ...base,
      id: `preview-${templateId}`,
      template: templateId,
      settings: { ...base.settings, themeColor: TEMPLATE_THEME[templateId] ?? base.settings.themeColor },
    };
  }, [activeResume, templateId]);

  useEffect(() => {
    const update = () => {
      if (containerRef.current) setScale(containerRef.current.offsetWidth / 794);
    };
    update();
    let timer: ReturnType<typeof setTimeout>;
    const debounced = () => { clearTimeout(timer); timer = setTimeout(update, 120); };
    window.addEventListener('resize', debounced);
    return () => { window.removeEventListener('resize', debounced); clearTimeout(timer); };
  }, []);

  return (
    <div ref={containerRef} className="w-full aspect-[210/297] relative overflow-hidden bg-gray-100 rounded-lg shadow-inner">
      <div
        className="absolute top-0 left-0 pointer-events-none"
        style={{ width: '210mm', minHeight: '297mm', transform: `scale(${scale})`, transformOrigin: 'top left' }}
      >
        <ResumeRenderer data={previewData} scale={1} />
      </div>
      {!activeResume && (
        <div className="absolute bottom-1 left-1 right-1 text-[10px] text-gray-500 text-center">
          当前没有可预览的简历，显示空白纸面
        </div>
      )}
    </div>
  );
});
RealPreview.displayName = 'RealPreview';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TemplateCard: React.FC<{ t: TemplateMeta; current: boolean; onPreview: () => void }> = memo(({ t, current, onPreview }) => (
  <button
    type="button"
    onClick={onPreview}
    className={cn(
      'group relative p-4 rounded-xl border-2 transition-all text-left hover:shadow-lg',
      current ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-200 hover:border-gray-300 bg-white'
    )}
  >
    {current && (
      <div className="absolute -top-2 -right-2 bg-blue-500 text-white p-1 rounded-full shadow-lg z-10">
        <Check size={14} />
      </div>
    )}
    <TemplateSchematic meta={t} />
    <div className="flex items-start justify-between mt-3">
      <div className="min-w-0 flex-1">
        <h3 className="font-bold text-gray-900">{t.nameZh}</h3>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{t.description}</p>
      </div>
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 ml-2"
        style={{ backgroundColor: schematicColors(t.id).primary }}
      >
        {t.icon}
      </div>
    </div>
    <div className="flex gap-1 mt-2 flex-wrap">
      {t.tags.map((tag) => (
        <span key={tag} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{tag}</span>
      ))}
    </div>
  </button>
));
TemplateCard.displayName = 'TemplateCard';

export const TemplateModal: React.FC<TemplateModalProps> = ({ isOpen, onClose }) => {
  const currentTemplate = useResumeStore(state => state.resumes[state.activeResumeId]?.template);
  const currentSidebarWidth = useResumeStore(state => state.resumes[state.activeResumeId]?.settings);
  const setTemplate = useResumeStore(state => state.setTemplate);
  const [previewTarget, setPreviewTarget] = useState<TemplateId | null>(null);

  useEffect(() => {
    if (!isOpen) setPreviewTarget(null);
  }, [isOpen]);

  const previewInfo = previewTarget ? templates.find(t => t.id === previewTarget) : null;
  const isCurrentTemplate = previewTarget === currentTemplate;

  // 侧栏模板的真实宽度（用户在样式面板调过就直接体现）
  const sidebarWidth = currentSidebarWidth ? resolveSidebarWidth(currentSidebarWidth) : 30;
  const displayTemplates = useMemo(
    () => templates.map(t => (t.id === 'sidebar' && t.schematic.sidebar
      ? { ...t, schematic: { ...t.schematic, sidebar: { ...t.schematic.sidebar, width: sidebarWidth } } }
      : t)),
    [sidebarWidth]
  );

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
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 bg-white rounded-2xl shadow-2xl z-50 md:w-[940px] md:max-h-[88vh] overflow-hidden flex flex-col"
          >
            {/* ========== 预览模式（真实数据） ========== */}
            {previewTarget && previewInfo ? (
              <>
                <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                  <button onClick={() => setPreviewTarget(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
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
                    <div className="w-full max-w-[520px]">
                      <RealPreview templateId={previewTarget} />
                      <p className="text-[11px] text-gray-400 mt-2 text-center">
                        以上为你当前简历的真实内容（未填写处保持空白）
                      </p>
                    </div>
                  </div>

                  <div className="w-full md:w-[260px] border-t md:border-t-0 md:border-l border-gray-100 p-5 flex flex-col gap-4 shrink-0 bg-white">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0"
                        style={{ backgroundColor: schematicColors(previewInfo.id).primary }}
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
                        <span key={tag} className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">{tag}</span>
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
                    <p className="text-[11px] text-gray-400 text-center">切换模板会自动配合同色主题，已填内容不丢失</p>
                  </div>
                </div>
              </>
            ) : (
              /* ========== 列表模式：7 张卡，无折叠 ========== */
              <>
                <div className="p-5 border-b border-gray-100">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">切换模板</h2>
                      <p className="text-sm text-gray-500 mt-0.5">卡片是版式示意，点击后用你的真实内容预览</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                      <X size={20} className="text-gray-500" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {displayTemplates.map((template) => (
                      <TemplateCard
                        key={template.id}
                        t={template}
                        current={currentTemplate === template.id}
                        onPreview={() => setPreviewTarget(template.id)}
                      />
                    ))}
                  </div>
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
