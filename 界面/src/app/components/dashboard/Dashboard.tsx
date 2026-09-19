import React, { useState, useRef, useEffect, memo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FileText, Plus, Clock, Trash2, Pencil, Settings, Download, Upload,
  AlertTriangle, X, Copy, Layers, HelpCircle, Check,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { themes, FALLBACK_THEME } from '@/app/types/theme';
import {
  exportBackup, inspectBackup, applyBackup, clearAllData, BACKUP_ACCEPT,
  type BackupContents,
} from '@/app/utils/backup';
import { useToast } from '@/app/components/ui/toast';
import { ResumeRenderer } from '@/app/components/templates/ResumeRenderer';
import { useResumeStore } from '@/app/store/useResumeStore';
import { ResumeData } from '@/app/types/resume';

/** 相对时间（3 天前）；鼠标悬停给完整日期 */
function relativeTime(ts: number): string {
  try {
    return `更新于 ${formatDistanceToNow(ts, { locale: zhCN })}`;
  } catch {
    return '';
  }
}

// 简历卡片缩略图预览（真实渲染，不是示意图）
const ResumeCardPreview: React.FC<{ data: ResumeData }> = memo(({ data }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.2);

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setScale(width / 793); // 210mm ≈ 793px at 96dpi
      }
    };
    updateScale();
    // 使用 RAF 节流 resize，避免 N 个卡片 × 60fps 的 setState 导致卡顿
    let rafId = 0;
    const handleResize = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateScale);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden bg-white">
      <div
        className="absolute top-0 left-0 pointer-events-none"
        style={{
          width: '210mm',
          minHeight: '297mm',
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        <ResumeRenderer data={data} scale={1} />
      </div>
    </div>
  );
});
ResumeCardPreview.displayName = 'ResumeCardPreview';

/** 通用弹窗外壳：Esc 关闭、点遮罩关闭、焦点自动落到取消/主按钮 */
const Modal: React.FC<{
  title: string;
  description?: string;
  onClose: () => void;
  children?: React.ReactNode;
  footer: React.ReactNode;
  tone?: 'default' | 'danger';
}> = ({ title, description, onClose, children, footer, tone = 'default' }) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    // 打开后把焦点移进弹窗（优先输入框），键盘用户不必从头 Tab
    panelRef.current?.querySelector<HTMLElement>('input, button')?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="flex justify-between items-start p-5 border-b border-gray-100 gap-3">
          <div className="flex items-start gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              tone === 'danger' ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'
            }`}>
              {tone === 'danger' ? <AlertTriangle size={18} /> : <Settings size={18} />}
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">{title}</h3>
              {description && <p className="text-sm text-gray-500 mt-1 leading-relaxed">{description}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="关闭"
            className="p-1 hover:bg-gray-100 rounded-full transition-colors shrink-0"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>
        {children && <div className="px-5 py-4">{children}</div>}
        <div className="px-5 pb-5 flex gap-3">{footer}</div>
      </div>
    </div>
  );
};

/** 弹窗里的通用按钮 */
const DialogButton: React.FC<{
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'ghost' | 'danger';
  disabled?: boolean;
  type?: 'button' | 'submit';
}> = ({ onClick, children, variant = 'ghost', disabled, type = 'button' }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
      variant === 'primary' ? 'bg-blue-600 hover:bg-blue-700 text-white'
        : variant === 'danger' ? 'bg-red-600 hover:bg-red-700 text-white'
        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
    }`}
  >
    {children}
  </button>
);

// 卡片上的图标按钮：hover 或键盘聚焦时才出现（但仍然一直在 DOM 里，可用 Tab 到达）
const CardIconButton: React.FC<{
  label: string;
  onClick: (e: React.MouseEvent) => void;
  children: React.ReactNode;
  danger?: boolean;
}> = ({ label, onClick, children, danger }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    title={label}
    className={`p-2 rounded-lg bg-white/95 shadow-sm border transition-colors ${
      danger
        ? 'text-gray-600 hover:text-red-600 hover:border-red-200'
        : 'text-gray-600 hover:text-blue-600 hover:border-blue-200'
    }`}
  >
    {children}
  </button>
);

/** 单张简历卡片 */
const ResumeCard: React.FC<{
  resume: ResumeData;
  renaming: boolean;
  onStartRename: (id: string) => void;
  onCommitRename: (id: string, title: string) => void;
  onCancelRename: () => void;
  onOpen: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}> = ({ resume, renaming, onStartRename, onCommitRename, onCancelRename, onOpen, onDuplicate, onDelete }) => {
  const [draft, setDraft] = useState(resume.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renaming) {
      setDraft(resume.title);
      // 进入重命名时全选，直接打字就能替换
      requestAnimationFrame(() => { inputRef.current?.focus(); inputRef.current?.select(); });
    }
  }, [renaming, resume.title]);

  const commit = () => {
    const next = draft.trim();
    onCommitRename(resume.id, next || resume.title);
  };

  const primaryColor = (themes[resume.settings?.themeColor] || themes[FALLBACK_THEME])?.colors?.primary;
  const moduleCount = (resume.modules ?? []).filter((m) => m.visible !== false).length;

  return (
    <div className="group bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all overflow-hidden flex flex-col h-[300px]">
      {/* 缩略图：干净可见，整块可点/可 Tab 进入编辑 */}
      <div className="flex-1 relative bg-gray-100 overflow-hidden">
        <ResumeCardPreview data={resume} />
        <button
          type="button"
          onClick={() => onOpen(resume.id)}
          aria-label={`打开「${resume.title}」继续编辑`}
          className="absolute inset-0 z-[1] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
        />
        {/* 操作条：鼠标悬停或键盘聚焦时出现（键盘可达，不是 hover-only 的假可用） */}
        <div className="absolute right-2 bottom-2 z-10 flex gap-1 opacity-0 translate-y-1 transition-all duration-150 group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0">
          <CardIconButton label={`编辑「${resume.title}」`} onClick={() => onOpen(resume.id)}>
            <Pencil size={15} />
          </CardIconButton>
          <CardIconButton label={`复制「${resume.title}」`} onClick={() => onDuplicate(resume.id)}>
            <Copy size={15} />
          </CardIconButton>
          <CardIconButton label={`删除「${resume.title}」`} onClick={() => onDelete(resume.id)} danger>
            <Trash2 size={15} />
          </CardIconButton>
        </div>
      </div>

      {/* 信息区 */}
      <div className="p-3 border-t border-gray-100">
        <div className="flex items-center gap-1 mb-1">
          {renaming ? (
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); commit(); }
                if (e.key === 'Escape') { e.preventDefault(); onCancelRename(); }
              }}
              aria-label="简历名称"
              className="min-w-0 flex-1 px-2 py-1 text-sm font-bold text-gray-800 border border-blue-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          ) : (
            <>
              <button
                type="button"
                onClick={() => onOpen(resume.id)}
                className="min-w-0 flex-1 text-left truncate text-sm font-bold text-gray-800 hover:text-blue-600 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                title={`${resume.title}（双击改名）`}
                onDoubleClick={(e) => { e.stopPropagation(); onStartRename(resume.id); }}
              >
                {resume.title || '未命名简历'}
              </button>
              <button
                type="button"
                onClick={() => onStartRename(resume.id)}
                aria-label={`重命名「${resume.title}」`}
                title="重命名"
                className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 opacity-0 transition-all group-hover:opacity-100 focus:opacity-100 focus-visible:opacity-100"
              >
                <Pencil size={13} />
              </button>
              <span
                className="w-3 h-3 rounded-full border border-gray-200 shrink-0"
                style={{ backgroundColor: primaryColor }}
                title="主题色"
              />
            </>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1" title={new Date(resume.lastModified).toLocaleString('zh-CN')}>
            <Clock size={12} />
            {relativeTime(resume.lastModified)}
          </span>
          <span className="flex items-center gap-1">
            <Layers size={12} />
            {moduleCount} 个模块
          </span>
        </div>
      </div>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  // 细粒度 selector：只订阅需要的数据与 action
  const resumes = useResumeStore((s) => s.resumes);
  const addResume = useResumeStore((s) => s.addResume);
  const deleteResume = useResumeStore((s) => s.deleteResume);
  const duplicateResume = useResumeStore((s) => s.duplicateResume);
  const updateResume = useResumeStore((s) => s.updateResume);
  const setActiveResume = useResumeStore((s) => s.setActiveResume);
  const saveStatus = useResumeStore((s) => s.saveStatus);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const resumeList = Object.values(resumes).sort((a, b) => b.lastModified - a.lastModified);

  const [showSettings, setShowSettings] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [pendingImport, setPendingImport] = useState<BackupContents | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /** 新建简历：零中间步骤，直接进编辑器 */
  const handleCreateNew = useCallback(() => {
    addResume();
    navigate('/editor');
  }, [addResume, navigate]);

  const handleOpen = useCallback((id: string) => {
    setActiveResume(id);
    navigate('/editor');
  }, [setActiveResume, navigate]);

  /** 复制：留在列表，不把人踢走 */
  const handleDuplicate = useCallback((id: string) => {
    const source = useResumeStore.getState().resumes[id];
    duplicateResume(id);
    showToast('success', source ? `已复制「${source.title || '未命名简历'}」` : '简历已复制');
  }, [duplicateResume, showToast]);

  const handleDelete = useCallback(() => {
    if (!deleteTarget) return;
    const name = resumes[deleteTarget]?.title || '未命名简历';
    deleteResume(deleteTarget);
    setDeleteTarget(null);
    showToast('success', `已删除「${name}」`);
  }, [deleteTarget, deleteResume, resumes, showToast]);

  const handleCommitRename = useCallback((id: string, title: string) => {
    setRenamingId(null);
    const current = useResumeStore.getState().resumes[id];
    if (!current || current.title === title) return;
    updateResume(id, { title });
    showToast('success', '名称已更新');
  }, [showToast, updateResume]);

  const handleExport = useCallback(async () => {
    const result = await exportBackup();
    showToast(result.success ? 'success' : 'error', result.message);
  }, [showToast]);

  /** 导入：先解析校验 → 让用户确认「会覆盖现有 N 份」→ 再写入 */
  const handlePickImportFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = ''; // 允许重复选同一文件
    if (!file) return;
    const result = await inspectBackup(file);
    if (!result.success) {
      showToast('error', result.message);
      return;
    }
    setPendingImport(result.contents);
  }, [showToast]);

  const handleConfirmImport = useCallback(async () => {
    if (!pendingImport || importing) return;
    setImporting(true);
    const result = await applyBackup(pendingImport);
    setImporting(false);
    setPendingImport(null);
    showToast(result.success ? 'success' : 'error', result.message);
  }, [importing, pendingImport, showToast]);

  const handleClearAll = useCallback(async () => {
    const result = await clearAllData();
    showToast(result.success ? 'success' : 'error', result.message);
    setShowClearConfirm(false);
    setShowSettings(false);
  }, [showToast]);

  const deleteTargetName = deleteTarget ? (resumes[deleteTarget]?.title || '未命名简历') : '';
  const importCount = pendingImport ? pendingImport.resumeTitles.length : 0;
  const importPhotoCount = pendingImport ? pendingImport.avatars.size : 0;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* 顶栏 */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-gray-800 shrink-0">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <FileText size={18} />
            </div>
            ResumeX
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/about"
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <HelpCircle size={16} />
              帮助
            </Link>
            <button
              onClick={handleExport}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="导出备份"
              aria-label="导出备份"
            >
              <Download size={18} />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="导入备份"
              aria-label="导入备份"
            >
              <Upload size={18} />
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="设置"
              aria-label="设置"
            >
              <Settings size={18} />
            </button>
            <button
              onClick={handleCreateNew}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
            >
              <Plus size={16} />
              新建简历
            </button>
          </div>
        </div>
      </nav>

      {/* 保存失败必须可见（数据只存本机，写不进去就是最大的风险） */}
      {saveStatus === 'error' && (
        <div className="bg-red-50 border-b border-red-200 text-red-700 text-sm">
          <div className="container mx-auto px-6 py-2.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="flex items-center gap-1.5 font-medium">
              <AlertTriangle size={15} /> 刚才的修改没能存到本机
            </span>
            <span className="text-red-600/80">多半是空间满了。建议先「导出备份」，再删掉不用的简历。</span>
            <button onClick={handleExport} className="underline font-medium hover:text-red-900">
              立即导出备份
            </button>
          </div>
        </div>
      )}

      {/* 隐藏的备份文件选择框：只接受本软件导出的格式 */}
      <input
        ref={fileInputRef}
        type="file"
        accept={BACKUP_ACCEPT}
        onChange={handlePickImportFile}
        className="hidden"
        aria-hidden="true"
      />

      <div className="container mx-auto px-6 py-10">
        <div className="flex justify-between items-end mb-6">
          <h1 className="text-2xl font-bold text-gray-800">我的简历</h1>
          <span className="text-sm text-gray-500">共 {resumeList.length} 份</span>
        </div>

        {resumeList.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-16 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText size={40} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">还没有简历</h3>
            <p className="text-gray-500 mb-8">新建一份就能开始填写，全部内容只保存在这台电脑上。</p>
            <div className="flex justify-center gap-3 flex-wrap">
              <button
                onClick={handleCreateNew}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors inline-flex items-center gap-2"
              >
                <Plus size={18} />
                新建空白简历
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="border border-gray-300 hover:border-gray-400 text-gray-700 px-6 py-3 rounded-xl font-medium transition-colors inline-flex items-center gap-2"
              >
                <Upload size={18} />
                从备份文件导入
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <button
              onClick={handleCreateNew}
              className="group bg-white rounded-xl border border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all h-[300px] flex flex-col items-center justify-center gap-4"
            >
              <div className="w-12 h-12 bg-gray-100 group-hover:bg-blue-100 rounded-full flex items-center justify-center text-gray-400 group-hover:text-blue-600 transition-colors">
                <Plus size={24} />
              </div>
              <span className="font-medium text-gray-600 group-hover:text-blue-600">新建空白简历</span>
            </button>

            {resumeList.map((resume) => (
              <ResumeCard
                key={resume.id}
                resume={resume}
                renaming={renamingId === resume.id}
                onStartRename={setRenamingId}
                onCommitRename={handleCommitRename}
                onCancelRename={() => setRenamingId(null)}
                onOpen={handleOpen}
                onDuplicate={handleDuplicate}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        )}

        <p className="mt-8 text-xs text-gray-400">
          提示：双击卡片上的名字可以改名。简历只保存在这台电脑上，换电脑或重装系统前请先「导出备份」。
        </p>
      </div>

      {/* 设置 */}
      {showSettings && (
        <Modal
          title="设置"
          description="数据都保存在这台电脑上，不会上传到任何服务器。"
          onClose={() => setShowSettings(false)}
          footer={<DialogButton onClick={() => setShowSettings(false)}>完成</DialogButton>}
        >
          <div className="space-y-2">
            <button
              onClick={handleExport}
              className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                <Download size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-800">导出备份</p>
                <p className="text-xs text-gray-500">把全部简历和照片存成一个 .zip 文件</p>
              </div>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
            >
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                <Upload size={20} className="text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-800">导入备份</p>
                <p className="text-xs text-gray-500">用之前导出的 .zip 恢复（会先让你确认）</p>
              </div>
            </button>

            <button
              onClick={() => setShowClearConfirm(true)}
              className="w-full flex items-center gap-3 p-3 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-left"
            >
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
                <Trash2 size={20} className="text-red-600" />
              </div>
              <div>
                <p className="font-medium text-red-700">删除全部简历</p>
                <p className="text-xs text-red-500">清空本机上的所有简历与照片，无法撤销</p>
              </div>
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <Link to="/about" className="text-sm text-blue-600 hover:text-blue-700 inline-flex items-center gap-1.5">
              <HelpCircle size={15} /> 使用说明与常见问题
            </Link>
          </div>
        </Modal>
      )}

      {/* 删除单份简历（必须点名叫出是哪一份） */}
      {deleteTarget && (
        <Modal
          title="删除这份简历？"
          tone="danger"
          description="删除后无法恢复。"
          onClose={() => setDeleteTarget(null)}
          footer={
            <>
              <DialogButton onClick={() => setDeleteTarget(null)}>取消</DialogButton>
              <DialogButton onClick={handleDelete} variant="danger">删除</DialogButton>
            </>
          }
        >
          <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3">
            <p className="text-sm text-gray-500">将被删除</p>
            <p className="font-bold text-gray-900 truncate" title={deleteTargetName}>{deleteTargetName}</p>
          </div>
        </Modal>
      )}

      {/* 导入确认：说清楚会覆盖什么 */}
      {pendingImport && (
        <Modal
          title="导入这份备份？"
          tone="danger"
          description={`备份里有 ${importCount} 份简历${importPhotoCount > 0 ? `、${importPhotoCount} 张照片` : ''}。`}
          onClose={() => setPendingImport(null)}
          footer={
            <>
              <DialogButton onClick={handleExport}>先导出现在的</DialogButton>
              <DialogButton onClick={handleConfirmImport} variant="danger" disabled={importing}>
                {importing ? '导入中…' : '覆盖并导入'}
              </DialogButton>
            </>
          }
        >
          <p className="text-sm text-red-600 font-medium mb-3">
            导入会<strong>替换</strong>当前电脑上的 {resumeList.length} 份简历，不是追加。
          </p>
          <ul className="max-h-40 overflow-auto rounded-lg border border-gray-200 divide-y divide-gray-100 text-sm">
            {pendingImport.resumeTitles.slice(0, 8).map((t, i) => (
              <li key={`${t}-${i}`} className="px-3 py-2 text-gray-700 flex items-center gap-2">
                <FileText size={14} className="text-gray-400 shrink-0" />
                <span className="truncate">{t}</span>
              </li>
            ))}
            {pendingImport.resumeTitles.length > 8 && (
              <li className="px-3 py-2 text-gray-400">其余 {pendingImport.resumeTitles.length - 8} 份…</li>
            )}
          </ul>
        </Modal>
      )}

      {/* 删除全部：必须输入确认词 */}
      {showClearConfirm && (
        <ClearDataDialog
          count={resumeList.length}
          onCancel={() => setShowClearConfirm(false)}
          onConfirm={handleClearAll}
          onExport={handleExport}
        />
      )}
    </div>
  );
};

/** 「删除全部简历」二次确认：要手打确认词，防止一次误点毁掉所有数据 */
const ClearDataDialog: React.FC<{
  count: number;
  onCancel: () => void;
  onConfirm: () => void;
  onExport: () => void;
}> = ({ count, onCancel, onConfirm, onExport }) => {
  const [word, setWord] = useState('');
  const ok = word.trim() === '清空';
  return (
    <Modal
      title="删除全部简历"
      tone="danger"
      description={count > 0 ? `这会在本机永久删除 ${count} 份简历和所有照片，无法撤销。` : '本机目前没有简历。'}
      onClose={onCancel}
      footer={
        <>
          <DialogButton onClick={onCancel}>取消</DialogButton>
          <DialogButton onClick={onConfirm} variant="danger" disabled={!ok}>
            <span className="inline-flex items-center gap-1 justify-center">{ok && <Check size={14} />}确认删除</span>
          </DialogButton>
        </>
      }
    >
      <div className="space-y-3">
        <button
          onClick={onExport}
          className="w-full flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition-colors"
        >
          <Download size={18} className="text-blue-600 shrink-0" />
          <span className="text-sm text-blue-800">先导出备份再删除（推荐）</span>
        </button>
        <label className="block text-sm text-gray-600">
          请在下面输入 <code className="px-1.5 py-0.5 bg-gray-100 rounded font-mono text-gray-800">清空</code> 两个字：
          <input
            value={word}
            onChange={(e) => setWord(e.target.value)}
            placeholder="输入：清空"
            className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
          />
        </label>
      </div>
    </Modal>
  );
};
