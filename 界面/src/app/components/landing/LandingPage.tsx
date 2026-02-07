import React, { useRef, useState, useEffect, useMemo, memo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, FileText, Zap, Download, Sparkles, Shield, Clock } from 'lucide-react';
import { ResumeRenderer } from '@/app/components/templates/ResumeRenderer';
import { initialResumeData } from '@/app/data/initialData';
import { TemplateId, ResumeData } from '@/app/types/resume';
import { ThemeColor } from '@/app/types/theme';

// 落地页模板预览缩略图
const LandingTemplatePreview: React.FC<{ templateId: TemplateId; themeColor: ThemeColor }> = memo(({ templateId, themeColor }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.25);

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setScale(width / 793);
      }
    };
    updateScale();
    // 防抖 resize 监听
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
  }, []);

  const previewData = useMemo<ResumeData>(() => ({
    ...initialResumeData,
    id: `landing-preview-${templateId}`,
    template: templateId,
    settings: {
      ...initialResumeData.settings,
      themeColor,
    },
  }), [templateId, themeColor]);

  return (
    <div
      ref={containerRef}
      className="aspect-[3/4] bg-gray-100 relative overflow-hidden"
    >
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
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
        <span className="bg-white text-black px-6 py-2 rounded-full font-bold transform translate-y-4 group-hover:translate-y-0 transition-transform">
          使用此模板
        </span>
      </div>
    </div>
  );
});
LandingTemplatePreview.displayName = 'LandingTemplatePreview';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      {/* Navbar */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <FileText size={18} />
            </div>
            简历制作
          </div>
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="text-gray-600 hover:text-gray-900 font-medium">
              我的简历
            </Link>
            <Link 
              to="/editor" 
              className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-2 rounded-full font-medium transition-colors"
            >
              开始制作
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50 -z-10"></div>
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-100/50 to-transparent -z-10"></div>
        
        {/* 装饰元素 */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-yellow-400/20 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 right-20 w-32 h-32 bg-purple-400/20 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-12 md:mb-0">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-sm font-semibold mb-6">
              <Sparkles size={14} />
              <span>专业简历制作工具</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6 tracking-tight">
              专业简历，<br/>
              <span className="text-blue-600">3分钟搞定</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-lg leading-relaxed">
              选模板 → 填内容 → 导出PDF，就这么简单。<br/>
              无需注册，免费使用，无水印导出。
            </p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Link 
                to="/editor" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
              >
                免费开始制作 <ArrowRight size={20} />
              </Link>
              <Link 
                to="/dashboard" 
                className="text-gray-600 hover:text-gray-900 font-medium flex items-center gap-2"
              >
                <Clock size={18} />
                继续上次编辑
              </Link>
            </div>
            
            {/* 信任标识 */}
            <div className="flex items-center gap-6 mt-8 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <CheckCircle size={16} className="text-green-500" />
                免费使用
              </div>
              <div className="flex items-center gap-1">
                <Shield size={16} className="text-blue-500" />
                数据本地存储
              </div>
              <div className="flex items-center gap-1">
                <Zap size={16} className="text-yellow-500" />
                无需注册
              </div>
            </div>
          </div>

          <div className="md:w-1/2 relative">
            <div className="relative z-10">
              <div className="transform rotate-3 hover:rotate-0 transition-transform duration-500 shadow-2xl rounded-lg overflow-hidden border-4 border-white bg-white">
                {/* 真实简历预览 */}
                <LandingTemplatePreview templateId="professional" themeColor="pro-blue" />
              </div>
            </div>
            {/* 装饰 */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold mb-4">为什么选择我们？</h2>
            <p className="text-gray-600">我们去除了所有复杂的功能，让你专注于内容，我们来处理设计和排版。</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-white border border-blue-100 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                <LayoutTemplate size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3">精美模板</h3>
              <p className="text-gray-600 leading-relaxed">
                5款专业设计的简历模板，覆盖技术、商务、创意等多种风格，通过ATS系统筛选。
              </p>
            </div>
            <div className="p-8 rounded-2xl bg-gradient-to-br from-green-50 to-white border border-green-100 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-6">
                <Zap size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3">实时预览</h3>
              <p className="text-gray-600 leading-relaxed">
                所见即所得，边填写边预览效果，不满意随时调整，简历修改从未如此简单。
              </p>
            </div>
            <div className="p-8 rounded-2xl bg-gradient-to-br from-purple-50 to-white border border-purple-100 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-6">
                <Download size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3">一键导出</h3>
              <p className="text-gray-600 leading-relaxed">
                支持高清PDF导出，适合打印和邮件发送。完全免费，无隐藏费用，无水印。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Template Showcase */}
      <section className="py-24 bg-gray-900 text-white">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
            <div>
              <h2 className="text-3xl font-bold mb-2">精选模板</h2>
              <p className="text-gray-400">选择适合你行业的设计风格</p>
            </div>
            <Link 
              to="/editor?showTemplates=true" 
              className="hidden md:flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
            >
              查看所有模板 <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {([
              { name: '科技橙红', tag: '技术岗', color: 'bg-orange-500', desc: '适合IT、互联网行业', templateId: 'tech' as TemplateId, themeColor: 'tech-orange' as ThemeColor },
              { name: '商务浅蓝', tag: '校招/商务', color: 'bg-blue-600', desc: '适合应届生、商务岗位', templateId: 'business' as TemplateId, themeColor: 'business-blue' as ThemeColor },
              { name: '活力红', tag: '创意/运营', color: 'bg-red-500', desc: '适合运营、市场岗位', templateId: 'vibrant' as TemplateId, themeColor: 'vibrant-red' as ThemeColor },
            ]).map((t, i) => (
              <Link 
                key={i} 
                to="/editor" 
                className="group block relative overflow-hidden rounded-xl bg-gray-800 border border-gray-700 hover:border-gray-600 transition-all"
              >
                {/* 真实模板预览 */}
                <LandingTemplatePreview templateId={t.templateId} themeColor={t.themeColor} />
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1">{t.name}</h3>
                  <p className="text-gray-400 text-sm mb-2">{t.desc}</p>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${t.color} text-white`}>
                    {t.tag}
                  </span>
                </div>
              </Link>
            ))}
          </div>
          
          <div className="text-center mt-12 md:hidden">
            <Link 
              to="/editor?showTemplates=true" 
              className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
            >
              查看所有模板 <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">准备好了吗？</h2>
          <p className="text-blue-100 mb-8 text-lg">现在就开始制作你的专业简历，完全免费！</p>
          <Link 
            to="/editor" 
            className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:scale-105"
          >
            立即开始 <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12">
        <div className="container mx-auto px-6 text-center text-gray-500">
          <div className="flex items-center justify-center gap-2 font-bold text-xl text-gray-900 mb-6">
            <div className="w-6 h-6 bg-gray-900 rounded flex items-center justify-center text-white">
              <FileText size={14} />
            </div>
            简历制作
          </div>
          <div className="flex flex-wrap justify-center gap-6 mb-8 text-sm">
            <span className="text-gray-400 flex items-center gap-1" title="数据完全本地存储，安全可靠">
              <Shield size={12} /> 数据本地存储
            </span>
            <span className="text-gray-400 flex items-center gap-1" title="所有数据仅保存在您的浏览器中，不会上传至服务器">
              隐私安全保障
            </span>
            <span className="text-gray-400 flex items-center gap-1" title="免费使用，无任何隐藏费用">
              完全免费使用
            </span>
            <span className="text-gray-400 flex items-center gap-1" title="MIT 开源许可证">
              开源项目
            </span>
          </div>
          <p className="text-sm">© {new Date().getFullYear()} 简历制作. 保留所有权利.</p>
        </div>
      </footer>
    </div>
  );
};

// Helper component for Icon
const LayoutTemplate = ({ size }: { size: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="9" y1="21" x2="9" y2="9" />
  </svg>
);
