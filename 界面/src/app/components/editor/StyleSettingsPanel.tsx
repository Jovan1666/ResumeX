import React from 'react';
import { useResumeStore } from '@/app/store/useResumeStore';
import { Settings, Type, AlignJustify, Maximize2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/app/lib/utils';
import { SpacingLevel, FontFamily } from '@/app/types/theme';

interface StyleSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const fontSizeOptions = [
  { value: 0.85, label: '85%', desc: '紧凑' },
  { value: 0.9, label: '90%', desc: '较小' },
  { value: 0.95, label: '95%', desc: '适中' },
  { value: 1, label: '100%', desc: '标准' },
  { value: 1.05, label: '105%', desc: '较大' },
  { value: 1.1, label: '110%', desc: '大' },
];

const lineHeightOptions: { value: SpacingLevel; label: string; desc: string }[] = [
  { value: 'compact', label: '紧凑', desc: '适合内容多' },
  { value: 'standard', label: '标准', desc: '推荐' },
  { value: 'relaxed', label: '宽松', desc: '留白更多' },
];

const marginOptions: { value: SpacingLevel; label: string; desc: string }[] = [
  { value: 'compact', label: '窄', desc: '15mm' },
  { value: 'standard', label: '标准', desc: '20mm' },
  { value: 'relaxed', label: '宽', desc: '25mm' },
];

const fontFamilyOptions: { value: FontFamily; label: string; desc: string; previewFont: string }[] = [
  { value: 'sans', label: '思源黑体', desc: '现代无衬线 · 推荐', previewFont: "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif" },
  { value: 'yahei', label: '微软雅黑', desc: 'Windows 系统字体', previewFont: "'Microsoft YaHei', 'PingFang SC', sans-serif" },
  { value: 'heiti', label: '黑体', desc: '经典无衬线体', previewFont: "'SimHei', 'STHeiti', sans-serif" },
  { value: 'serif', label: '思源宋体', desc: '正式衬线体', previewFont: "'Noto Serif SC', 'SimSun', serif" },
  { value: 'kaiti', label: '楷体', desc: '优雅手写风格', previewFont: "'KaiTi', 'STKaiti', serif" },
  { value: 'fangsong', label: '仿宋', desc: '公文报告常用', previewFont: "'FangSong', 'STFangsong', serif" },
  { value: 'mono', label: '等宽字体', desc: '代码技术风格', previewFont: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace" },
];

export const StyleSettingsPanel: React.FC<StyleSettingsPanelProps> = ({ isOpen, onClose }) => {
  // 细粒度选择器：仅订阅 settings
  const settings = useResumeStore(state => state.resumes[state.activeResumeId]?.settings);
  const updateSettings = useResumeStore(state => state.updateSettings);

  if (!settings) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-[340px] bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Settings size={20} className="text-gray-600" />
                <h2 className="text-lg font-bold text-gray-900">样式设置</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Font Size */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Type size={16} className="text-gray-500" />
                  <h3 className="font-medium text-gray-800">字体大小</h3>
                  <span className="ml-auto text-sm text-blue-600 font-medium">
                    {Math.round((settings.fontSizeScale || 1) * 100)}%
                  </span>
                </div>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0.85"
                    max="1.1"
                    step="0.05"
                    value={settings.fontSizeScale || 1}
                    onChange={(e) => updateSettings({ fontSizeScale: parseFloat(e.target.value) })}
                    className="w-full accent-blue-600"
                  />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>85%</span>
                    <span>100%</span>
                    <span>110%</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {fontSizeOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => updateSettings({ fontSizeScale: opt.value })}
                      className={cn(
                        "px-3 py-1.5 text-xs rounded-lg border transition-colors",
                        settings.fontSizeScale === opt.value
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 hover:border-gray-300 text-gray-600"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Line Height */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <AlignJustify size={16} className="text-gray-500" />
                  <h3 className="font-medium text-gray-800">行间距</h3>
                  {settings.lineHeight === 'custom' && (
                    <span className="ml-auto text-sm text-blue-600 font-medium">
                      {(settings.customLineHeight ?? 1.5).toFixed(2)}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {lineHeightOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => updateSettings({ lineHeight: opt.value })}
                      className={cn(
                        "p-3 rounded-lg border transition-all text-center",
                        settings.lineHeight === opt.value
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <div className={cn(
                        "font-medium text-sm",
                        settings.lineHeight === opt.value ? "text-blue-700" : "text-gray-700"
                      )}>
                        {opt.label}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">{opt.desc}</div>
                    </button>
                  ))}
                  <button
                    onClick={() => updateSettings({ lineHeight: 'custom', customLineHeight: settings.customLineHeight ?? 1.5 })}
                    className={cn(
                      "p-3 rounded-lg border transition-all text-center",
                      settings.lineHeight === 'custom'
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <div className={cn(
                      "font-medium text-sm",
                      settings.lineHeight === 'custom' ? "text-blue-700" : "text-gray-700"
                    )}>
                      自定义
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">精确调节</div>
                  </button>
                </div>
                {settings.lineHeight === 'custom' && (
                  <div className="mt-3 space-y-1">
                    <input
                      type="range"
                      min="1.0"
                      max="2.0"
                      step="0.05"
                      value={settings.customLineHeight ?? 1.5}
                      onChange={(e) => updateSettings({ customLineHeight: parseFloat(e.target.value) })}
                      className="w-full accent-blue-600"
                    />
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>1.0 紧凑</span>
                      <span>1.5</span>
                      <span>2.0 宽松</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Page Margin */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Maximize2 size={16} className="text-gray-500" />
                  <h3 className="font-medium text-gray-800">页边距</h3>
                  {settings.pageMargin === 'custom' && (
                    <span className="ml-auto text-sm text-blue-600 font-medium">
                      {settings.customPageMargin ?? 20}mm
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {marginOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => updateSettings({ pageMargin: opt.value })}
                      className={cn(
                        "p-3 rounded-lg border transition-all text-center",
                        settings.pageMargin === opt.value
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <div className={cn(
                        "font-medium text-sm",
                        settings.pageMargin === opt.value ? "text-blue-700" : "text-gray-700"
                      )}>
                        {opt.label}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">{opt.desc}</div>
                    </button>
                  ))}
                  <button
                    onClick={() => updateSettings({ pageMargin: 'custom', customPageMargin: settings.customPageMargin ?? 20 })}
                    className={cn(
                      "p-3 rounded-lg border transition-all text-center",
                      settings.pageMargin === 'custom'
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <div className={cn(
                      "font-medium text-sm",
                      settings.pageMargin === 'custom' ? "text-blue-700" : "text-gray-700"
                    )}>
                      自定义
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">精确调节</div>
                  </button>
                </div>
                {settings.pageMargin === 'custom' && (
                  <div className="mt-3 space-y-1">
                    <input
                      type="range"
                      min="10"
                      max="30"
                      step="1"
                      value={settings.customPageMargin ?? 20}
                      onChange={(e) => updateSettings({ customPageMargin: parseInt(e.target.value) })}
                      className="w-full accent-blue-600"
                    />
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>10mm 窄</span>
                      <span>20mm</span>
                      <span>30mm 宽</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Font Family */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Type size={16} className="text-gray-500" />
                  <h3 className="font-medium text-gray-800">字体风格</h3>
                  <span className="ml-auto text-xs text-gray-400">
                    {fontFamilyOptions.find(f => f.value === settings.fontFamily)?.label || '思源黑体'}
                  </span>
                </div>
                <div className="space-y-2">
                  {fontFamilyOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => updateSettings({ fontFamily: opt.value })}
                      className={cn(
                        "w-full p-3 rounded-lg border transition-all text-left flex items-center justify-between",
                        settings.fontFamily === opt.value
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div
                          className={cn(
                            "font-medium text-[15px] truncate",
                            settings.fontFamily === opt.value ? "text-blue-700" : "text-gray-700"
                          )}
                          style={{ fontFamily: opt.previewFont }}
                        >
                          {opt.label}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">{opt.desc}</div>
                      </div>
                      {settings.fontFamily === opt.value && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reset */}
              <button
                onClick={() => updateSettings({
                  fontSizeScale: 1,
                  lineHeight: 'standard',
                  pageMargin: 'standard',
                  fontFamily: 'sans',
                  customLineHeight: undefined,
                  customPageMargin: undefined,
                })}
                className="w-full py-2.5 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                重置为默认值
              </button>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 text-center">
              <p className="text-xs text-gray-400">
                样式调整会实时应用到预览
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
