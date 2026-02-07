import React, { useRef, useState, useEffect, useCallback, useMemo, useDeferredValue } from 'react';
import { useResumeStore } from '@/app/store/useResumeStore';
import { ResumeRenderer } from '@/app/components/templates/ResumeRenderer';
import { Sidebar } from './Sidebar';
import { ScoreBadge } from './ScoreBadge';
import { DiagnosticPanel } from './DiagnosticPanel';
import { TemplateModal } from './TemplateModal';
import { StyleSettingsPanel } from './StyleSettingsPanel';
import { OnboardingOverlay } from '@/app/components/OnboardingOverlay';
import { useToast } from '@/app/components/ui/toast';
import { useBreakpoint } from '@/app/hooks/useBreakpoint';
// PDF 导出使用 html2canvas + jspdf 直接生成文件下载
import { 
  Download, ChevronLeft, FileText, ZoomIn, ZoomOut, 
  Layout, CheckCircle2, Cloud, Keyboard, AlertTriangle,
  Settings, Image, ChevronDown, Eye, Edit3, Menu, FileType
} from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { cn } from '@/app/lib/utils';
import { exportToDocx } from '@/app/utils/exportDocx';
import { generateExportFilename } from '@/app/utils/exportFilename';

export const EditorLayout: React.FC = () => {
  const navigate = useNavigate();
  // 细粒度选择器，减少不必要的重渲染
  const resumeData = useResumeStore(state => state.resumes[state.activeResumeId]);
  const activeResumeId = useResumeStore(state => state.activeResumeId);
  const updateResume = useResumeStore(state => state.updateResume);
  const undo = useResumeStore(state => state.undo);
  const redo = useResumeStore(state => state.redo);
  const pushHistory = useResumeStore(state => state.pushHistory);
  const { showToast } = useToast();
  
  const [zoom, setZoom] = useState(0.75);
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showStyleSettings, setShowStyleSettings] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [contentOverflow, setContentOverflow] = useState(0); // 百分比
  const [isExporting, setIsExporting] = useState(false);
  const [contentDims, setContentDims] = useState({ width: 793, height: 1123 }); // 简历内容实际尺寸
  const [mobileView, setMobileView] = useState<'edit' | 'preview'>('edit');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  const { isMobile, isTablet } = useBreakpoint();

  // 如果没有活动简历（如所有简历已被删除），自动跳转到仪表盘
  useEffect(() => {
    if (!resumeData) {
      navigate('/dashboard', { replace: true });
    }
  }, [resumeData, navigate]);
  
  const printRef = useRef<HTMLDivElement>(null);
  const zoomContainerRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const isExportingRef = useRef(false); // ref 防连击（比 state 更可靠，无闭包过期问题）

  // 导出用字体 CSS：映射到系统本地字体，零网络请求，导出秒出
  const LOCAL_FONT_CSS = `
@font-face { font-family: 'Noto Sans SC'; src: local('Noto Sans SC'), local('Microsoft YaHei'), local('PingFang SC'), local('Helvetica Neue'), local('Arial'); font-weight: 100 900; font-display: swap; }
@font-face { font-family: 'Noto Serif SC'; src: local('Noto Serif SC'), local('Source Han Serif'), local('SimSun'), local('Georgia'); font-weight: 100 900; font-display: swap; }
@font-face { font-family: 'Playfair Display'; src: local('Playfair Display'), local('Georgia'), local('Times New Roman'); font-weight: 100 900; font-display: swap; }
@font-face { font-family: 'Microsoft YaHei'; src: local('Microsoft YaHei'), local('PingFang SC'); font-weight: 100 900; font-display: swap; }
  `.trim();

  // PDF 导出 - 使用 html-to-image + jspdf 直接生成文件下载
  const handleExportPdf = useCallback(async () => {
    if (!printRef.current || !resumeData || isExportingRef.current) return;
    isExportingRef.current = true;
    setIsExporting(true);
    try {
      const { toCanvas } = await import('html-to-image');
      const { jsPDF } = await import('jspdf');
      const element = printRef.current;

      // 临时重置父级 zoom 容器的 transform（截图需要原始 1:1 尺寸）
      const zoomEl = zoomContainerRef.current;
      const origZoom = zoomEl?.style.transform || '';
      if (zoomEl) zoomEl.style.transform = 'scale(1)';

      const canvas = await toCanvas(element, {
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        fontEmbedCSS: LOCAL_FONT_CSS,
      });

      // 恢复父级 zoom
      if (zoomEl) zoomEl.style.transform = origZoom;

      // A4 尺寸 (mm)
      const A4_W = 210;
      const A4_H = 297;
      const imgW = A4_W;
      const imgH = (canvas.height * A4_W) / canvas.width;

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      let yOffset = 0;
      let pageNum = 0;

      // 生成一次 DataURL，避免循环内重复调用（每次约 50-100ms）
      const canvasDataUrl = canvas.toDataURL('image/jpeg', 0.95);

      // 如果内容超出一页，分页处理（防护：限制最大页数，避免 imgH 异常导致死循环）
      const MAX_PAGES = 20;
      while (yOffset < imgH && pageNum < MAX_PAGES && isFinite(imgH) && imgH > 0) {
        if (pageNum > 0) pdf.addPage();
        pdf.addImage(
          canvasDataUrl,
          'JPEG',
          0,
          -yOffset,
          imgW,
          imgH,
        );
        yOffset += A4_H;
        pageNum++;
      }

      const filename = generateExportFilename(resumeData, 'pdf');
      pdf.save(filename);
      showToast('success', 'PDF 导出成功！');
    } catch (error) {
      console.error('PDF export failed:', error);
      showToast('error', 'PDF 导出失败，请重试');
    } finally {
      isExportingRef.current = false;
      setIsExporting(false);
    }
  }, [resumeData, showToast]);

  // 合并：内容溢出检测 + 自动保存状态 (防抖 300ms，减少频繁触发)
  useEffect(() => {
    setIsSaving(true);
    const timer = setTimeout(() => {
      if (printRef.current) {
        const A4_HEIGHT_PX = 297 * 3.78;
        const contentHeight = printRef.current.scrollHeight;
        setContentOverflow(Math.round((contentHeight / A4_HEIGHT_PX) * 100));
      }
      setIsSaving(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [resumeData]);

  // 读取 URL 参数，支持从落地页跳转时自动弹出模板选择（仅首次挂载执行）
  const [searchParams, setSearchParams] = useSearchParams();
  const hasCheckedParams = useRef(false);
  useEffect(() => {
    if (hasCheckedParams.current) return;
    hasCheckedParams.current = true;
    if (searchParams.get('showTemplates') === 'true') {
      setShowTemplateModal(true);
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('showTemplates');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Check for first time user
  useEffect(() => {
    const hasOnboarded = localStorage.getItem('hasOnboarded');
    if (!hasOnboarded) {
      setShowOnboarding(true);
    }
  }, []);

  // 点击外部关闭导出菜单
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 导出前验证
  const validateBeforeExport = useCallback((): boolean => {
    if (!resumeData?.profile.name?.trim()) {
      showToast('warning', '请先填写姓名再导出');
      return false;
    }
    return true;
  }, [resumeData?.profile.name, showToast]);

  // (不再需要导出确认弹窗)

  // PDF 导出入口（带验证）
  const handleExportPdfWithConfirm = useCallback(() => {
    if (!validateBeforeExport()) return;
    setShowExportMenu(false);
    handleExportPdf();
  }, [validateBeforeExport, handleExportPdf]);

  // 快捷键支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S 保存
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        showToast('success', '简历已保存');
      }
      // Ctrl/Cmd + Z 撤销
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      // Ctrl/Cmd + Shift + Z 重做
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
      }
      // Ctrl/Cmd + P 打印/导出
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        handleExportPdfWithConfirm();
      }
      // Escape 关闭弹窗
      if (e.key === 'Escape') {
        setShowTemplateModal(false);
        setShowDiagnostic(false);
        setShowStyleSettings(false);
        setShowExportMenu(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showToast, handleExportPdfWithConfirm, undo, redo]);

  // 在关键编辑操作前记录历史快照（防抖）
  const pushHistoryRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    if (!resumeData) return;
    if (pushHistoryRef.current) clearTimeout(pushHistoryRef.current);
    pushHistoryRef.current = setTimeout(() => {
      pushHistory();
    }, 1000);
    return () => { if (pushHistoryRef.current) clearTimeout(pushHistoryRef.current); };
  }, [resumeData, pushHistory]);

  // (handleExportPdf 已包含验证逻辑)

  // 导出 Word
  const handleExportDocx = async () => {
    if (!validateBeforeExport()) return;
    if (!resumeData || isExportingRef.current) return;
    isExportingRef.current = true;
    setIsExporting(true);
    setShowExportMenu(false);
    try {
      await exportToDocx(resumeData);
      showToast('success', 'Word 文档导出成功！');
    } catch (error) {
      console.error('Word export failed:', error);
      showToast('error', 'Word 导出失败');
    } finally {
      isExportingRef.current = false;
      setIsExporting(false);
    }
  };

  // 导出PNG - 使用 html2canvas 实现真正的截图导出
  const handleExportPng = async () => {
    if (!validateBeforeExport()) return;
    if (!printRef.current || isExportingRef.current) return;
    isExportingRef.current = true;
    setIsExporting(true);
    setShowExportMenu(false);

    try {
      const { toBlob } = await import('html-to-image');
      const element = printRef.current;

      // 临时重置父级 zoom 容器的 transform
      const zoomEl = zoomContainerRef.current;
      const origZoom = zoomEl?.style.transform || '';
      if (zoomEl) zoomEl.style.transform = 'scale(1)';

      const blob = await toBlob(element, {
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        fontEmbedCSS: LOCAL_FONT_CSS,
      });

      // 恢复父级 zoom
      if (zoomEl) zoomEl.style.transform = origZoom;

      if (!blob) {
        showToast('error', '图片生成失败');
        return;
      }

      // 生成下载链接
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = resumeData ? generateExportFilename(resumeData, 'png') : '简历.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('success', 'PNG 图片导出成功！');
    } catch (error) {
      console.error('PNG export failed:', error);
      showToast('error', '导出失败，请重试');
    } finally {
      isExportingRef.current = false;
      setIsExporting(false);
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    localStorage.setItem('hasOnboarded', 'true');
  };

  // 使用 useDeferredValue 延迟计算，避免每次按键都阻塞渲染
  const deferredResumeData = useDeferredValue(resumeData);

  // 计算完整性检查清单计数（轻量版，给 badge 用）
  const checklistCounts = useMemo(() => {
    if (!deferredResumeData) return { completed: 0, total: 0, requiredAllPassed: false };

    const { profile, modules } = deferredResumeData;
    const visibleModules = modules.filter(m => m.visible);
    const checks: boolean[] = [];

    // 必填项
    const r1 = !!profile.name?.trim();
    const r2 = !!(profile.phone?.trim() || profile.email?.trim());
    const r3 = visibleModules.some(m => m.type !== 'skills' && m.items.length > 0);
    checks.push(r1, r2, r3);
    const requiredAllPassed = r1 && r2 && r3;

    // 推荐填写
    checks.push(!!profile.title?.trim());
    checks.push(!!profile.phone?.trim());
    checks.push(!!profile.email?.trim());
    checks.push(!!profile.summary?.trim());
    visibleModules.forEach(mod => {
      if (mod.type !== 'skills') {
        (mod.items as import('@/app/types/resume').ResumeItem[]).forEach((item) => {
          checks.push(!!(item.description && item.description.trim()));
        });
      }
    });

    // 格式检查
    if (profile.phone?.trim()) {
      checks.push(/^1[3-9]\d{9}$/.test(profile.phone.replace(/\s/g, '')));
    }
    if (profile.email?.trim()) {
      checks.push(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email));
    }
    checks.push(contentOverflow <= 100);
    checks.push(!visibleModules.some(m => m.items.length === 0));

    return {
      completed: checks.filter(Boolean).length,
      total: checks.length,
      requiredAllPassed,
    };
  }, [deferredResumeData, contentOverflow]);

  // 计算页数
  const pageCount = useMemo(() => {
    return Math.max(1, Math.ceil(contentOverflow / 100));
  }, [contentOverflow]);

  // 智能一键适应一页：自动迭代调整，按视觉影响从小到大逐步压缩
  const [isFitting, setIsFitting] = useState(false);
  const handleFitOnePage = useCallback(async () => {
    if (!resumeData || !printRef.current || isFitting) return;
    setIsFitting(true);

    const A4_HEIGHT_PX = 297 * 3.78; // ~1122px
    const store = useResumeStore.getState();
    const waitForLayout = () => new Promise<void>(r => setTimeout(r, 80));

    // 先测一下当前是否真的超了
    let h = printRef.current.scrollHeight;
    if (h <= A4_HEIGHT_PX) {
      showToast('success', '当前内容已在一页内');
      setIsFitting(false);
      return;
    }

    // 收集当前值
    const currentSettings = store.resumes[store.activeResumeId].settings;
    let { fontSizeScale, lineHeight, pageMargin } = currentSettings;

    // 构建优化步骤队列（视觉影响从小到大）
    type Step = { label: string; apply: () => void };
    const steps: Step[] = [];

    // 1. 页边距压缩（影响最小）
    if (pageMargin === 'custom') {
      // 自定义页边距：逐步减小，每步 2mm，到 compact 等效值后切换预设
      const curMargin = currentSettings.customPageMargin ?? 20;
      for (let m = curMargin - 2; m >= 16; m -= 2) {
        const target = m;
        steps.push({ label: '页边距', apply: () => store.updateSettings({ customPageMargin: target }) });
      }
      steps.push({ label: '页边距', apply: () => store.updateSettings({ pageMargin: 'compact' }) });
    } else {
      if (pageMargin === 'relaxed') steps.push({ label: '页边距', apply: () => store.updateSettings({ pageMargin: 'standard' }) });
      if (pageMargin !== 'compact') steps.push({ label: '页边距', apply: () => store.updateSettings({ pageMargin: 'compact' }) });
    }

    // 2. 行间距压缩
    if (lineHeight === 'custom') {
      // 自定义行间距：逐步减小，每步 0.1，到 compact 等效值后切换预设
      const curLH = currentSettings.customLineHeight ?? 1.5;
      for (let lh = curLH - 0.1; lh >= 1.4; lh -= 0.1) {
        const target = Math.round(lh * 100) / 100;
        steps.push({ label: '行间距', apply: () => store.updateSettings({ customLineHeight: target }) });
      }
      steps.push({ label: '行间距', apply: () => store.updateSettings({ lineHeight: 'compact' }) });
    } else {
      if (lineHeight === 'relaxed') steps.push({ label: '行间距', apply: () => store.updateSettings({ lineHeight: 'standard' }) });
      if (lineHeight !== 'compact') steps.push({ label: '行间距', apply: () => store.updateSettings({ lineHeight: 'compact' }) });
    }

    // 3. 字体逐步缩小（每次 -0.02，最低到 0.80）
    const fontMin = 0.80;
    const fontStep = 0.02;
    for (let fs = fontSizeScale - fontStep; fs >= fontMin; fs -= fontStep) {
      const target = Math.round(fs * 100) / 100;
      steps.push({ label: '字体', apply: () => store.updateSettings({ fontSizeScale: target }) });
    }

    // 逐步执行，每步后实时测量
    let appliedCount = 0;
    for (const step of steps) {
      step.apply();
      appliedCount++;
      await waitForLayout();
      if (!printRef.current) break;
      h = printRef.current.scrollHeight;
      if (h <= A4_HEIGHT_PX) break;
    }

    // 最终检查
    await waitForLayout();
    const finalH = printRef.current?.scrollHeight ?? Infinity;
    if (finalH <= A4_HEIGHT_PX) {
      const finalSettings = store.resumes[store.activeResumeId].settings;
      const changes: string[] = [];
      if (finalSettings.pageMargin !== pageMargin) changes.push('页边距');
      if (finalSettings.lineHeight !== lineHeight) changes.push('行间距');
      if (finalSettings.fontSizeScale !== fontSizeScale) changes.push(`字体${Math.round(finalSettings.fontSizeScale * 100)}%`);
      showToast('success', `已适应一页（调整了${changes.join('、')}）`);
    } else {
      showToast('warning', '排版已最大程度压缩，建议精简部分内容后重试');
    }
    setIsFitting(false);
  }, [resumeData, showToast, isFitting]);

  // 导出前确认弹窗 (状态声明已移到组件顶部)

  // 监听简历内容尺寸变化，用于缩放时正确计算滚动区域
  useEffect(() => {
    const el = printRef.current;
    if (!el) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContentDims({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // 预览区容器 ref（用于计算适应宽度缩放）
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const handleFitWidth = useCallback(() => {
    if (previewContainerRef.current) {
      const containerWidth = previewContainerRef.current.clientWidth - 64; // 减去 padding
      const a4WidthPx = 210 * 3.78; // ~793px
      const fitZoom = Math.min(1.2, Math.max(0.3, containerWidth / a4WidthPx));
      setZoom(Math.round(fitZoom * 100) / 100);
    }
  }, []);

  if (!resumeData) return <div className="flex h-screen items-center justify-center">加载中...</div>;

  return (
    <div className="flex flex-col h-screen bg-gray-100 overflow-hidden font-sans text-gray-900">
      {/* Top Navigation */}
      <header className={cn(
        "bg-[#1A202C] text-white flex items-center justify-between flex-shrink-0 z-30 shadow-md",
        isMobile ? "h-14 px-3" : "h-16 px-6"
      )}>
        <div className="flex items-center gap-2 md:gap-4">
          <Link to="/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ChevronLeft size={isMobile ? 18 : 20} />
            {!isMobile && (
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                <FileText size={16} />
              </div>
            )}
          </Link>
          
          {!isMobile && <div className="h-6 w-px bg-gray-700 mx-2"></div>}
          
          <div className="flex flex-col">
            <input 
              value={resumeData.title}
              onChange={(e) => updateResume(activeResumeId, { title: e.target.value })}
              className={cn(
                "bg-transparent border-none text-white font-bold focus:ring-0 p-0 placeholder-gray-500",
                isMobile ? "text-xs w-32" : "text-sm w-48"
              )}
              placeholder="未命名简历"
            />
            {!isMobile && (
              <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                {isSaving ? (
                  <>
                    <Cloud size={10} className="animate-pulse" />
                    保存中...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={10} />
                    已保存
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-2 onboarding-export">
          <div className="hidden lg:flex items-center gap-2 text-xs text-gray-500 mr-2">
            <Keyboard size={14} />
            <span>Ctrl+S 保存 | Ctrl+Z 撤销 | Ctrl+P 导出</span>
          </div>
          
          {/* 移动端菜单按钮 */}
          {isMobile ? (
            <div className="relative" ref={exportMenuRef}>
              <button 
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2 text-gray-300 hover:text-white rounded-md hover:bg-gray-800"
              >
                <Menu size={20} />
              </button>
              
              {showMobileMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
                  <button
                    onClick={() => { setShowStyleSettings(true); setShowMobileMenu(false); }}
                    className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-3 text-gray-700"
                  >
                    <Settings size={16} className="text-gray-500" />
                    <span>样式设置</span>
                  </button>
                  <button
                    onClick={() => { setShowTemplateModal(true); setShowMobileMenu(false); }}
                    className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-3 text-gray-700 border-t border-gray-100"
                  >
                    <Layout size={16} className="text-gray-500" />
                    <span>切换模板</span>
                  </button>
                  <button
                    onClick={() => { handleExportPdfWithConfirm(); setShowMobileMenu(false); }}
                    className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-3 text-gray-700 border-t border-gray-100"
                  >
                    <Download size={16} className="text-blue-600" />
                    <span>导出 PDF</span>
                  </button>
                  <button
                    onClick={() => { handleExportPng(); setShowMobileMenu(false); }}
                    className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-3 text-gray-700 border-t border-gray-100"
                  >
                    <Image size={16} className="text-green-600" />
                    <span>导出图片</span>
                  </button>
                  <button
                    onClick={() => { handleExportDocx(); setShowMobileMenu(false); }}
                    className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-3 text-gray-700 border-t border-gray-100"
                  >
                    <FileType size={16} className="text-purple-600" />
                    <span>导出 Word</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <button 
                onClick={() => setShowStyleSettings(true)}
                className="flex items-center gap-2 text-gray-300 hover:text-white px-3 py-1.5 rounded-md text-sm transition-colors border border-gray-700 hover:bg-gray-800"
                title="样式设置"
              >
                <Settings size={16} />
                <span className="hidden md:inline">样式</span>
              </button>
              
              <button 
                onClick={() => setShowTemplateModal(true)}
                className="flex items-center gap-2 text-gray-300 hover:text-white px-3 py-1.5 rounded-md text-sm transition-colors border border-gray-700 hover:bg-gray-800"
              >
                <Layout size={16} />
                <span className="hidden md:inline">模板</span>
              </button>
              
              {/* 导出菜单 */}
              <div className="relative" ref={exportMenuRef}>
                <button 
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium transition-all shadow-lg hover:shadow-blue-500/20"
                >
                  <Download size={16} />
                  导出
                  <ChevronDown size={14} className={cn("transition-transform", showExportMenu && "rotate-180")} />
                </button>
                
                {showExportMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
                    <button
                      onClick={() => {
                        handleExportPdfWithConfirm();
                        setShowExportMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-3 text-gray-700"
                    >
                      <Download size={16} className="text-blue-600" />
                      <div>
                        <div className="font-medium">导出 PDF</div>
                        <div className="text-xs text-gray-400">高清打印版</div>
                      </div>
                    </button>
                    <button
                      onClick={handleExportPng}
                      className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-3 text-gray-700 border-t border-gray-100"
                    >
                      <Image size={16} className="text-green-600" />
                      <div>
                        <div className="font-medium">导出图片</div>
                        <div className="text-xs text-gray-400">PNG格式</div>
                      </div>
                    </button>
                    <button
                      onClick={handleExportDocx}
                      className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-3 text-gray-700 border-t border-gray-100"
                    >
                      <FileType size={16} className="text-purple-600" />
                      <div>
                        <div className="font-medium">导出 Word</div>
                        <div className="text-xs text-gray-400">纯文本格式，可编辑</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </header>

      {/* Mobile View Toggle (Bottom Tab Bar) */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 h-14 bg-white border-t border-gray-200 flex z-40 safe-area-inset-bottom">
          <button
            onClick={() => setMobileView('edit')}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-1 transition-colors",
              mobileView === 'edit' ? "text-blue-600 bg-blue-50" : "text-gray-500"
            )}
          >
            <Edit3 size={20} />
            <span className="text-xs font-medium">编辑</span>
          </button>
          <button
            onClick={() => setMobileView('preview')}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-1 transition-colors",
              mobileView === 'preview' ? "text-blue-600 bg-blue-50" : "text-gray-500"
            )}
          >
            <Eye size={20} />
            <span className="text-xs font-medium">预览</span>
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar - 移动端响应式 */}
        <div className={cn(
          "bg-white border-r border-gray-200 z-20 shadow-xl transition-all duration-300 overflow-hidden",
          isMobile 
            ? cn(
                "fixed inset-0 top-16",
                mobileView === 'edit' ? "translate-x-0" : "-translate-x-full"
              )
            : isTablet 
              ? "w-[320px] flex-shrink-0"
              : "w-[360px] flex-shrink-0"
        )}>
          <div className={cn("h-full", isMobile && "pb-14")}>
            <Sidebar />
          </div>
        </div>

        {/* Right Preview Area - 移动端响应式 */}
        <div 
          ref={previewContainerRef}
          className={cn(
            "flex-1 overflow-hidden relative flex flex-col items-center onboarding-preview",
            isMobile && mobileView !== 'preview' && "hidden"
          )}
          style={{ backgroundColor: '#e8eaed' }}
        >
          {/* 超出一页警告 */}
          {contentOverflow > 100 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 flex items-center gap-3 shadow-lg">
              <AlertTriangle size={16} className="text-yellow-600" />
              <span className="text-sm text-yellow-800 font-medium">
                内容超出一页（约 {pageCount} 页）
              </span>
              <button 
                className="text-xs bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded-full font-medium transition-colors disabled:opacity-50"
                onClick={handleFitOnePage}
                disabled={isFitting}
              >
                {isFitting ? '调整中...' : '智能适应一页'}
              </button>
            </div>
          )}

          {/* Toolbar */}
          <div className={cn(
            "absolute z-30 bg-white/90 backdrop-blur-sm shadow-lg border border-gray-200 rounded-full px-4 py-2 flex items-center gap-3 transition-transform hover:scale-105",
            isMobile ? "bottom-20" : "bottom-8"
          )}>
            <button 
              onClick={() => setZoom(Math.max(0.3, zoom - 0.1))}
              className="p-1.5 hover:bg-gray-100 rounded-full text-gray-600"
            >
              <ZoomOut size={18} />
            </button>
            <span className="text-xs font-medium w-12 text-center text-gray-700">{Math.round(zoom * 100)}%</span>
            <button 
              onClick={() => setZoom(Math.min(1.5, zoom + 0.1))}
              className="p-1.5 hover:bg-gray-100 rounded-full text-gray-600"
            >
              <ZoomIn size={18} />
            </button>
            {!isMobile && (
              <>
                <div className="w-px h-4 bg-gray-300" />
                <button 
                  onClick={handleFitWidth}
                  className="text-xs font-medium text-gray-600 hover:text-blue-600 transition-colors"
                >
                  适应宽度
                </button>
                <button 
                  onClick={() => setZoom(1)}
                  className="text-xs font-medium text-gray-600 hover:text-blue-600 transition-colors"
                >
                  100%
                </button>
              </>
            )}
            <div className="w-px h-4 bg-gray-300" />
            <span className="text-xs text-gray-400">
              {pageCount > 1 ? `${pageCount} 页` : '1 页'}
            </span>
          </div>

          {/* Checklist Badge */}
          <div className="absolute top-6 right-6 z-30">
            <ScoreBadge
              completed={checklistCounts.completed}
              total={checklistCounts.total}
              requiredAllPassed={checklistCounts.requiredAllPassed}
              onClick={() => setShowDiagnostic(true)}
            />
          </div>

          {/* Resume Canvas Container */}
          <div className="flex-1 w-full overflow-auto flex justify-center p-8 pb-32">
            {/* 尺寸包裹层：显式设置缩放后的宽高，让 overflow-auto 正确计算滚动区域 */}
            <div
              style={{
                width: contentDims.width * zoom,
                height: contentDims.height * zoom,
                flexShrink: 0,
                position: 'relative',
              }}
            >
              <div
                ref={zoomContainerRef}
                className="absolute top-0 left-0 origin-top-left"
                style={{ transform: `scale(${zoom})` }}
              >
                {/* 简历纸张 */}
                <div 
                  ref={printRef} 
                  className="shadow-2xl transition-shadow duration-300 ease-out bg-white"
                >
                  <ResumeRenderer data={deferredResumeData!} />
                </div>

                {/* A4 分页指示线 - 仅预览时显示，打印时隐藏 */}
                {contentOverflow > 100 && (
                  <div
                    className="absolute left-0 right-0 pointer-events-none print:hidden"
                    style={{ top: '297mm' }}
                  >
                    <div className="border-t-2 border-dashed border-red-400 relative">
                      <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap">
                        A4 页面底部 - 以下内容将在第2页
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overlays */}
      <DiagnosticPanel 
        isOpen={showDiagnostic} 
        onClose={() => setShowDiagnostic(false)} 
        resumeData={resumeData}
        contentOverflow={contentOverflow}
      />
      
      <TemplateModal 
        isOpen={showTemplateModal} 
        onClose={() => setShowTemplateModal(false)} 
      />
      
      <StyleSettingsPanel
        isOpen={showStyleSettings}
        onClose={() => setShowStyleSettings(false)}
      />
      
      {showOnboarding && <OnboardingOverlay onComplete={handleOnboardingComplete} />}

      {/* (PDF 导出确认弹窗已移除 —— jsPDF 直接生成文件下载，自动分页) */}

      {/* 导出加载遮罩 */}
      {isExporting && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center">
          <div className="bg-white rounded-xl p-8 shadow-2xl text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-700 font-medium">正在生成...</p>
          </div>
        </div>
      )}
    </div>
  );
};
