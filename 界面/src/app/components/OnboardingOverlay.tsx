import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { X, ArrowRight, Check } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

const steps = [
  {
    target: '.onboarding-basic',
    title: '第一步：完善基本信息',
    description: '填写姓名、联系方式等核心信息，这是简历的基础。',
    position: 'right'
  },
  {
    target: '.onboarding-modules',
    title: '第二步：添加内容模块',
    description: '通过拖拽排序模块，点击展开编辑详细经历。',
    position: 'right'
  },
  {
    target: '.onboarding-preview',
    title: '第三步：实时预览',
    description: '所见即所得，随时查看简历的最终效果。',
    position: 'left'
  },
  {
    target: '.onboarding-export',
    title: '第四步：一键导出',
    description: '完成后点击这里，生成高清PDF文件。',
    position: 'bottom-right'
  }
];

export const OnboardingOverlay: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const updateRect = () => {
      const element = document.querySelector(steps[currentStep].target);
      if (element) {
        setRect(element.getBoundingClientRect());
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    updateRect();
    window.addEventListener('resize', updateRect);
    // Slight delay to allow UI to settle
    const timer = setTimeout(updateRect, 500);

    return () => {
      window.removeEventListener('resize', updateRect);
      clearTimeout(timer);
    };
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  if (!rect) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden pointer-events-none">
      {/* Background Mask using SVG for hole punching */}
      <svg className="absolute inset-0 w-full h-full pointer-events-auto">
        <defs>
          <mask id="overlay-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect 
              x={rect.left - 8} 
              y={rect.top - 8} 
              width={rect.width + 16} 
              height={rect.height + 16} 
              rx="8" 
              fill="black" 
            />
          </mask>
        </defs>
        <rect 
          x="0" 
          y="0" 
          width="100%" 
          height="100%" 
          fill="rgba(0,0,0,0.7)" 
          mask="url(#overlay-mask)" 
        />
        {/* Highlight Border */}
        <rect 
          x={rect.left - 8} 
          y={rect.top - 8} 
          width={rect.width + 16} 
          height={rect.height + 16} 
          rx="8"
          fill="none"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="2"
          strokeDasharray="8 4"
          className="animate-pulse"
        />
      </svg>

      {/* Popover Card */}
      <div 
        className="absolute pointer-events-auto transition-all duration-500 ease-in-out"
        style={{
          top: steps[currentStep].position.includes('bottom') 
            ? rect.bottom + 24 
            : rect.top,
          left: steps[currentStep].position === 'right' 
            ? rect.right + 24 
            : steps[currentStep].position === 'left'
              ? rect.left - 320 - 24
              : rect.left,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          key={currentStep}
          className="bg-white p-5 rounded-xl shadow-2xl w-80 font-sans"
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-gray-900 text-lg">{steps[currentStep].title}</h3>
            <button onClick={onComplete} className="text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            {steps[currentStep].description}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {steps.map((_, i) => (
                <div 
                  key={i} 
                  className={`w-2 h-2 rounded-full transition-colors ${i === currentStep ? 'bg-blue-600' : 'bg-gray-200'}`}
                />
              ))}
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={onComplete}
                className="text-xs font-medium text-gray-500 hover:text-gray-800"
              >
                跳过
              </button>
              <button 
                onClick={handleNext}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors"
              >
                {currentStep === steps.length - 1 ? (
                  <>开始使用 <Check size={14} /></>
                ) : (
                  <>下一步 <ArrowRight size={14} /></>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
