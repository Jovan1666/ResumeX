import React, { useMemo, memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, FileText, Download, Shield, Palette } from 'lucide-react';
import { ResumeRenderer } from '@/app/components/templates/ResumeRenderer';
import { useResumeStore } from '@/app/store/useResumeStore';
import { TemplateId, ResumeData } from '@/app/types/resume';
import { ThemeColor } from '@/app/types/theme';

/** 落地页模板预览（真实数据渲染，非空白） */
function makePreviewData(templateId: TemplateId, themeColor: ThemeColor): ResumeData {
  return {
    id: `landing-${templateId}`,
    title: '示例',
    lastModified: Date.now(),
    template: templateId,
    settings: { themeColor, fontFamily: 'sans', fontSizeScale: 1, lineHeight: 'standard', pageMargin: 'standard', language: 'zh' },
    profile: {
      name: '王小明', title: '前端开发工程师', email: 'wang@example.com', phone: '13800001234', location: '北京', wechat: '',
      summary: '5 年 Web 开发经验，熟悉 React / TypeScript 与工程化，主导过 3 个百万级用户前端项目。', avatar: '', customFields: [],
    },
    modules: [
      { id: 'e1', type: 'education', title: '教育背景', visible: true, items: [{ id: 'ee1', title: '软件工程 / 本科', subtitle: '华北理工大学', date: '2016.09 - 2020.06', description: '主修：数据结构、操作系统。' }] },
      { id: 'x1', type: 'experience', title: '工作经历', visible: true, items: [
        { id: 'xx1', title: '前端工程师', subtitle: '某某科技', date: '2021.03 - 至今', description: '• 负责核心产品 Web 端架构与开发。' },
        { id: 'xx2', title: '初级前端', subtitle: '某某网络', date: '2020.07 - 2021.02', description: '• 参与营销活动页开发。' }] },
      { id: 'p1', type: 'projects', title: '项目经历', visible: true, items: [{ id: 'pp1', title: '可视化搭建平台', subtitle: '个人开源项目', date: '2022.01 - 2023.06', description: '• 基于 React + dnd-kit 实现拖拽低代码编辑器。' }] },
      { id: 'sk1', type: 'skills', title: '专业技能', visible: true, items: [{ id: 's1', name: 'React / Vue' }, { id: 's2', name: 'TypeScript' }, { id: 's3', name: 'Node.js' }] },
    ],
  };
}

const PreviewCard: React.FC<{ templateId: TemplateId; themeColor: ThemeColor; name: string }> = memo(({ templateId, themeColor, name }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(0.3);
  React.useEffect(() => {
    const update = () => {
      if (ref.current) setScale(ref.current.offsetWidth / 793);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  const data = useMemo(() => makePreviewData(templateId, themeColor), [templateId, themeColor]);
  return (
    <div ref={ref} className="aspect-[210/297] bg-white border border-gray-200 rounded-lg overflow-hidden relative">
      <div className="absolute top-0 left-0 pointer-events-none" style={{ width: '210mm', minHeight: '297mm', transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <ResumeRenderer data={data} scale={1} />
      </div>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-[11px] px-2 py-0.5 rounded-full">{name}</div>
    </div>
  );
});
PreviewCard.displayName = 'PreviewCard';

const TEMPLATE_SHOWCASE: { id: TemplateId; theme: ThemeColor; name: string }[] = [
  { id: 'campusClean', theme: 'campus', name: '校招通用' },
  { id: 'bannerCampus', theme: 'campus', name: '横幅校招' },
  { id: 'navySidebar', theme: 'navy', name: '深蓝侧栏' },
  { id: 'atsMono', theme: 'ink', name: '极简黑白' },
];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const addResumeFromPreset = useResumeStore(state => state.addResumeFromPreset);

  const handleUseTemplate = (templateId: TemplateId) => {
    addResumeFromPreset(templateId);
    navigate('/editor');
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      {/* 顶栏 */}
      <nav className="border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-base">
            <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center text-white">
              <FileText size={15} />
            </div>
            ResumeX 简历
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link to="/dashboard" className="text-gray-600 hover:text-gray-900">我的简历</Link>
            <Link to="/dashboard" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg font-medium transition-colors">开始制作</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
            免费的中文简历工具
          </h1>
          <p className="text-lg text-gray-600 mt-4 max-w-xl mx-auto">
            本地运行、无需注册。选模板 → 填内容 → 导出 PDF / Word / PNG，3 分钟一份顺手简历。
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link to="/dashboard" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors flex items-center gap-2">
              开始做简历 <ArrowRight size={18} />
            </Link>
            <Link to="/dashboard" className="border border-gray-300 hover:border-gray-400 text-gray-700 px-6 py-3 rounded-xl font-medium transition-colors">
              导入备份
            </Link>
          </div>

          {/* 信任行 */}
          <div className="flex justify-center gap-8 mt-10 text-sm text-gray-500">
            <div className="flex items-center gap-1.5"><Shield size={15} className="text-green-600" /> 数据仅存本机</div>
            <div className="flex items-center gap-1.5"><Download size={15} className="text-blue-600" /> 多格式导出</div>
            <div className="flex items-center gap-1.5"><Palette size={15} className="text-gray-700" /> 14 套国内模板</div>
          </div>

          {/* 模板预览 */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-5 max-w-4xl mx-auto">
            {TEMPLATE_SHOWCASE.map((t) => (
              <button key={t.id} onClick={() => handleUseTemplate(t.id)} className="text-left group">
                <PreviewCard templateId={t.id} themeColor={t.theme} name={t.name} />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 编辑器截图（模拟） */}
      <section className="pb-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="rounded-xl border border-gray-200 shadow-lg overflow-hidden bg-white">
            {/* 模拟 Top bar */}
            <div className="flex items-center gap-3 px-4 h-10 border-b border-gray-100 text-xs text-gray-500">
              <span className="w-2 h-2 rounded-full bg-gray-300" />
              <span className="w-2 h-2 rounded-full bg-gray-300" />
              <span className="w-2 h-2 rounded-full bg-gray-300" />
              <span className="ml-2">简历工具编辑器</span>
              <span className="ml-auto text-gray-400">Ctrl+S 保存 · Ctrl+Z 撤销</span>
            </div>
            <div className="flex">
              {/* 左栏（表单） */}
              <div className="w-1/3 p-4 border-r border-gray-100 space-y-3">
                <div className="h-2 w-2/3 bg-gray-200 rounded-full" />
                <div className="h-2 w-full bg-gray-100 rounded-full" />
                <div className="h-2 w-3/4 bg-gray-100 rounded-full" />
                <div className="h-8 w-full bg-gray-50 border border-gray-200 rounded-md flex items-center px-2">
                  <span className="text-[10px] text-gray-400">姓名</span>
                </div>
                <div className="h-2 w-1/2 bg-gray-200 rounded-full" />
                <div className="h-8 w-full bg-gray-50 border border-gray-200 rounded-md flex items-center px-2">
                  <span className="text-[10px] text-gray-400">学校 / 公司</span>
                </div>
              </div>
              {/* 右栏（A4 预览） */}
              <div className="flex-1 p-6 bg-gray-50 flex justify-center">
                <div className="w-48 bg-white shadow rounded-sm p-4 space-y-2">
                  <div className="h-3 w-20 bg-gray-800 rounded-sm" />
                  <div className="h-1.5 w-32 bg-gray-200 rounded-full" />
                  <div className="pt-2 space-y-1">
                    <div className="h-1.5 w-24 bg-blue-200 rounded-full" />
                    <div className="h-1.5 w-40 bg-gray-100 rounded-full" />
                    <div className="h-1.5 w-36 bg-gray-100 rounded-full" />
                  </div>
                  <div className="pt-2 space-y-1">
                    <div className="h-1.5 w-20 bg-blue-200 rounded-full" />
                    <div className="h-1.5 w-40 bg-gray-100 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <p className="text-center text-xs text-gray-400 mt-3">左填内容 · 右实时预览 · 所见即所得</p>
        </div>
      </section>

      {/* 特性 */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-8">
          {[
            { icon: <FileText size={22} />, title: '14 套国内模板', desc: '校招/社招/体制内/外企都有对应布局，单栏可解析，网申友好。' },
            { icon: <Download size={22} />, title: 'PDF / Word / PNG', desc: '桌面端 PDF 文字可选中；Word 版可继续编辑，网申系统兼容。' },
            { icon: <Shield size={22} />, title: '数据本地存储', desc: '简历与照片存本机 IndexedDB，不上传服务器；支持备份导入。' },
          ].map((f, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-4">{f.icon}</div>
              <h3 className="font-semibold text-base">{f.title}</h3>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center mb-8">常见问题</h2>
          <div className="space-y-3">
            {[
              { q: '需要注册或登录吗？', a: '不需要。所有数据本地存储，打开即用。' },
              { q: '数据会同步到云端吗？', a: '不会。简历与照片只存在你本机，不上传服务器；建议定期导出备份。' },
              { q: '能导出哪些格式？', a: 'PDF（桌面端文字可选中）、Word（可继续编辑、网申兼容）、PNG 图片。' },
              { q: '模板和设置可以自定义吗？', a: '可以。每套模板支持模块标题/项目符号/列数/双栏宽度等排版设置。' },
            ].map((f, i) => (
              <details key={i} className="bg-white border border-gray-200 rounded-lg px-5 py-4 group">
                <summary className="font-medium text-sm text-gray-800 cursor-pointer list-none flex justify-between items-center">
                  {f.q}
                  <span className="text-gray-300 group-open:rotate-45 transition-transform text-lg leading-none">+</span>
                </summary>
                <p className="text-sm text-gray-500 mt-3 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 text-center">
        <h2 className="text-2xl font-bold">准备好了就开始</h2>
        <p className="text-gray-500 mt-2 text-sm">完全免费，无水印，无次数限制</p>
        <Link to="/dashboard" className="inline-flex items-center gap-2 mt-6 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold transition-colors">
          立即开始 <ArrowRight size={18} />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 text-center text-xs text-gray-400">
        ResumeX · 开源免费简历工具 · 本地运行
      </footer>
    </div>
  );
};
