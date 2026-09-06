import React, { useState } from 'react';
import { X, ArrowRight, User, FileText, Download } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

// 轻引导步骤（右下角小卡片，不遮挡、可跳过）
const steps = [
  { icon: <User size={16} />, title: '填基本信息', desc: '姓名、电话、邮箱、微信，右上可传证件照。' },
  { icon: <FileText size={16} />, title: '加内容模块', desc: '点左侧「+ 添加模块」选教育/工作/项目/技能，可拖拽排序。' },
  { icon: <Download size={16} />, title: '导出简历', desc: '完成后点右上「导出」，PDF/Word/PNG 都有。' },
];

export const OnboardingOverlay: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  return (
    <div className="fixed bottom-6 right-6 z-[100] w-72 bg-white rounded-xl shadow-2xl border border-gray-200 font-sans overflow-hidden">
      {/* 进度点 */}
      <div className="flex gap-1 px-4 pt-3">
        {steps.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full ${i <= currentStep ? 'bg-blue-600' : 'bg-gray-200'}`}
          />
        ))}
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">{step.icon}</div>
            <h3 className="font-semibold text-gray-900 text-sm">{step.title}</h3>
          </div>
          <button onClick={() => setDismissed(true)} className="text-gray-300 hover:text-gray-500">
            <X size={14} />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2 leading-relaxed">{step.desc}</p>

        <div className="flex justify-between items-center mt-3">
          <span className="text-[10px] text-gray-300">{currentStep + 1} / {steps.length}</span>
          <div className="flex gap-2">
            {currentStep === 0 && (
              <button onClick={() => setDismissed(true)} className="text-[11px] text-gray-400 hover:text-gray-600">
                跳过
              </button>
            )}
            <button
              onClick={() => { if (isLast) onComplete(); else setCurrentStep(currentStep + 1); }}
              className="text-[11px] flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md font-medium transition-colors"
            >
              {isLast ? '开始使用' : '下一步'}
              <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
