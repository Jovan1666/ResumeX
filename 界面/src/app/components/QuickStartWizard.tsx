import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { identities, jobCategories, getPreset } from '@/app/data/quickStartPresets';
import { cn } from '@/app/lib/utils';

interface QuickStartWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (preset: ReturnType<typeof getPreset>) => void;
  onSkip: () => void;
}

export const QuickStartWizard: React.FC<QuickStartWizardProps> = ({
  isOpen,
  onClose,
  onComplete,
  onSkip,
}) => {
  const [step, setStep] = useState(0);
  const [selectedIdentity, setSelectedIdentity] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);

  const handleFinish = () => {
    if (selectedIdentity && selectedJob) {
      const preset = getPreset(selectedIdentity, selectedJob);
      onComplete(preset);
    }
  };

  const reset = () => {
    setStep(0);
    setSelectedIdentity(null);
    setSelectedJob(null);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Sparkles size={18} className="text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">快速开始</h2>
                <p className="text-xs text-gray-500">帮你选择最合适的模板和模块</p>
              </div>
            </div>
            <button
              onClick={() => { reset(); onClose(); }}
              className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={18} className="text-gray-400" />
            </button>
          </div>

          {/* Steps */}
          <div className="p-6">
            {/* Progress */}
            <div className="flex gap-2 mb-6">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors",
                    i <= step ? "bg-blue-600" : "bg-gray-200"
                  )}
                />
              ))}
            </div>

            {step === 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <h3 className="font-bold text-gray-800 mb-1">你的身份是？</h3>
                <p className="text-sm text-gray-500 mb-4">我们会根据身份推荐最适合的简历结构</p>
                <div className="space-y-2">
                  {identities.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => { setSelectedIdentity(item.id); setStep(1); }}
                      className={cn(
                        "w-full p-4 rounded-xl border-2 text-left flex items-center gap-4 transition-all hover:shadow-md",
                        selectedIdentity === item.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <span className="text-2xl">{item.icon}</span>
                      <div>
                        <div className="font-bold text-gray-800">{item.label}</div>
                        <div className="text-xs text-gray-500">{item.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <h3 className="font-bold text-gray-800 mb-1">目标岗位类别</h3>
                <p className="text-sm text-gray-500 mb-4">选择最接近的类别，我们推荐对应的模板风格</p>
                <div className="grid grid-cols-2 gap-2">
                  {jobCategories.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedJob(item.id)}
                      className={cn(
                        "p-3 rounded-xl border-2 text-left flex items-center gap-3 transition-all hover:shadow-md",
                        selectedJob === item.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span className="font-medium text-gray-700 text-sm">{item.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 flex items-center justify-between">
            <button
              onClick={() => { reset(); onSkip(); }}
              className="text-sm text-gray-500 hover:text-gray-700 font-medium"
            >
              跳过，创建空白简历
            </button>
            <div className="flex gap-2">
              {step > 0 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-1"
                >
                  <ArrowLeft size={14} />
                  上一步
                </button>
              )}
              {step === 1 && selectedJob && (
                <button
                  onClick={handleFinish}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-1"
                >
                  开始制作
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
