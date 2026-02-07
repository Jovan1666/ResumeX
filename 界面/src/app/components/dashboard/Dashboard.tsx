import React, { useState, useRef, useEffect, memo } from 'react';
import { useResumeStore } from '@/app/store/useResumeStore';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, Plus, Clock, Trash2, Edit, Settings, Download, Upload, AlertTriangle, X, Copy } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { themes } from '@/app/types/theme';
import { exportBackup, importBackup, clearAllData } from '@/app/utils/backup';
import { useToast } from '@/app/components/ui/toast';
import { ResumeRenderer } from '@/app/components/templates/ResumeRenderer';
import { ResumeData } from '@/app/types/resume';
import { QuickStartWizard } from '@/app/components/QuickStartWizard';
import { QuickStartPreset } from '@/app/data/quickStartPresets';

// 简历卡片缩略图预览
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
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden">
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

export const Dashboard: React.FC = () => {
  const { resumes, addResume, addResumeFromPreset, deleteResume, duplicateResume, setActiveResume } = useResumeStore();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const resumeList = Object.values(resumes).sort((a, b) => b.lastModified - a.lastModified);
  
  const [showSettings, setShowSettings] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showQuickStart, setShowQuickStart] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreateNew = () => {
    setShowQuickStart(true);
  };

  const handleQuickStartComplete = (preset: QuickStartPreset) => {
    addResumeFromPreset(preset.templateId, preset.moduleOrder);
    setShowQuickStart(false);
    navigate('/editor');
  };

  const handleQuickStartSkip = () => {
    addResume();
    setShowQuickStart(false);
    navigate('/editor');
  };

  const handleEdit = (id: string) => {
    setActiveResume(id);
    navigate('/editor');
  };

  const handleDuplicate = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    duplicateResume(id);
    showToast('success', '简历已复制');
    navigate('/editor');
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setShowDeleteConfirm(id);
  };

  const confirmDelete = () => {
    if (showDeleteConfirm) {
      deleteResume(showDeleteConfirm);
      showToast('success', '简历已删除');
      setShowDeleteConfirm(null);
    }
  };

  const handleExport = () => {
    const result = exportBackup();
    if (result.success) {
      showToast('success', result.message);
    } else {
      showToast('error', result.message);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await importBackup(file);
    if (result.success) {
      showToast('success', result.message);
      setTimeout(() => window.location.reload(), 1000);
    } else {
      showToast('error', result.message);
    }
    
    // 清空input以便重复选择同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClearAll = () => {
    const result = clearAllData();
    if (result.success) {
      showToast('success', result.message);
      setTimeout(() => window.location.reload(), 1000);
    } else {
      showToast('error', result.message);
    }
    setShowClearConfirm(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-gray-800">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <FileText size={18} />
            </div>
            简历制作
          </Link>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowSettings(true)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="设置"
            >
              <Settings size={20} />
            </button>
            <button 
              onClick={handleCreateNew}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors flex items-center gap-2"
            >
              <Plus size={16} />
              新建简历
            </button>
          </div>
        </div>
      </nav>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        className="hidden"
      />

      {/* Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="flex justify-between items-end mb-8">
          <h1 className="text-2xl font-bold text-gray-800">我的简历</h1>
          <span className="text-sm text-gray-500">共 {resumeList.length} 份简历</span>
        </div>

        {resumeList.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-16 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText size={40} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">还没有简历</h3>
            <p className="text-gray-500 mb-8">创建你的第一份专业简历，开启职业新篇章</p>
            <button 
              onClick={handleCreateNew}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-medium transition-colors inline-flex items-center gap-2"
            >
              <Plus size={18} />
              立即创建
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Create New Card */}
            <button 
              onClick={handleCreateNew}
              className="group bg-white rounded-xl border border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all h-[280px] flex flex-col items-center justify-center gap-4"
            >
              <div className="w-12 h-12 bg-gray-100 group-hover:bg-blue-100 rounded-full flex items-center justify-center text-gray-400 group-hover:text-blue-600 transition-colors">
                <Plus size={24} />
              </div>
              <span className="font-medium text-gray-600 group-hover:text-blue-600">新建空白简历</span>
            </button>

            {/* Resume Cards */}
            {resumeList.map((resume) => (
              <div 
                key={resume.id}
                onClick={() => handleEdit(resume.id)}
                className="group bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all overflow-hidden cursor-pointer flex flex-col h-[280px]"
              >
                {/* Preview Area - 真实简历预览 */}
                <div className="flex-1 bg-gray-50 relative overflow-hidden">
                  <ResumeCardPreview data={resume} />
                  
                  {/* Overlay Actions */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 z-10">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleEdit(resume.id); }}
                      className="p-2 bg-white rounded-full text-gray-700 hover:text-blue-600 hover:shadow-md transition-all transform hover:scale-110"
                      title="编辑"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={(e) => handleDuplicate(e, resume.id)}
                      className="p-2 bg-white rounded-full text-gray-700 hover:text-green-600 hover:shadow-md transition-all transform hover:scale-110"
                      title="复制"
                    >
                      <Copy size={18} />
                    </button>
                    <button 
                      onClick={(e) => handleDelete(e, resume.id)}
                      className="p-2 bg-white rounded-full text-gray-700 hover:text-red-500 hover:shadow-md transition-all transform hover:scale-110"
                      title="删除"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Footer Info */}
                <div className="p-4 border-t border-gray-100">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-gray-800 truncate pr-2" title={resume.title}>{resume.title}</h3>
                    <div className="flex items-center gap-1">
                      <div 
                        className="w-3 h-3 rounded-full border border-gray-200" 
                        style={{ backgroundColor: themes[resume.settings.themeColor].colors.primary }}
                        title="主题色"
                      ></div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-400 mt-2">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {formatDistanceToNow(resume.lastModified, { addSuffix: true, locale: zhCN })}
                    </span>
                    <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-500">
                      {resume.template.charAt(0).toUpperCase() + resume.template.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 设置弹窗 */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">设置</h3>
              <button 
                onClick={() => setShowSettings(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-700">数据管理</h4>
                
                <button 
                  onClick={handleExport}
                  className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Download size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">导出备份</p>
                    <p className="text-xs text-gray-500">将所有简历数据导出为JSON文件</p>
                  </div>
                </button>
                
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
                >
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Upload size={20} className="text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">导入备份</p>
                    <p className="text-xs text-gray-500">从JSON文件恢复简历数据</p>
                  </div>
                </button>
                
                <button 
                  onClick={() => setShowClearConfirm(true)}
                  className="w-full flex items-center gap-3 p-3 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-left"
                >
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <Trash2 size={20} className="text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-red-700">清空所有数据</p>
                    <p className="text-xs text-red-500">删除所有简历，此操作不可恢复</p>
                  </div>
                </button>
              </div>
              
              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400 text-center">
                  数据存储在本地浏览器，清除浏览器数据会导致丢失
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={24} className="text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">确认删除</h3>
              <p className="text-sm text-gray-500 mb-6">删除后无法恢复，确定要删除这份简历吗？</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  取消
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 快速开始向导 */}
      <QuickStartWizard
        isOpen={showQuickStart}
        onClose={() => setShowQuickStart(false)}
        onComplete={handleQuickStartComplete}
        onSkip={handleQuickStartSkip}
      />

      {/* 清空数据确认弹窗 */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={24} className="text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">确认清空所有数据</h3>
              <p className="text-sm text-gray-500 mb-6">此操作将删除所有简历数据且无法恢复，建议先导出备份。</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  取消
                </button>
                <button 
                  onClick={handleClearAll}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                >
                  确认清空
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
