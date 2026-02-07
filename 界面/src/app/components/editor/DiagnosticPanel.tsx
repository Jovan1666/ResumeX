import React, { useMemo } from 'react';
import { X, Check, Circle, ArrowRight, ClipboardCheck, AlertCircle, FileCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ResumeData } from '@/app/types/resume';

interface DiagnosticPanelProps {
  isOpen: boolean;
  onClose: () => void;
  resumeData?: ResumeData;
  contentOverflow: number; // 百分比，>100 表示超出一页
}

interface CheckItem {
  id: string;
  label: string;
  passed: boolean;
  detail?: string; // 未通过时的提示
}

// 根据诊断项 ID 定位到侧边栏对应区域
const scrollToField = (itemId: string, onClose: () => void) => {
  onClose();
  setTimeout(() => {
    let targetSelector = '';
    if (['name', 'phone', 'email', 'contact', 'title', 'summary'].some(k => itemId.startsWith(k))) {
      targetSelector = '[data-section="basic-info"]';
    } else if (itemId.startsWith('skills')) {
      targetSelector = '[data-module-type="skills"]';
    } else if (itemId.startsWith('module')) {
      targetSelector = '[data-section="modules"]';
    } else {
      const moduleId = itemId.split('-')[0];
      targetSelector = `[data-module-id="${moduleId}"]`;
    }
    const el = document.querySelector(targetSelector);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-blue-400', 'ring-offset-2', 'transition-all');
      setTimeout(() => el.classList.remove('ring-2', 'ring-blue-400', 'ring-offset-2'), 2000);
    }
  }, 300);
};

export const DiagnosticPanel: React.FC<DiagnosticPanelProps> = ({
  isOpen,
  onClose,
  resumeData,
  contentOverflow = 0,
}) => {
  const checklist = useMemo(() => {
    if (!resumeData) return { required: [], recommended: [], format: [] };

    const { profile, modules } = resumeData;
    const visibleModules = modules.filter(m => m.visible);
    const hasContact = !!(profile.phone?.trim() || profile.email?.trim());
    const hasContentModule = visibleModules.some(m => m.type !== 'skills' && m.items.length > 0);

    // --- 必填项 ---
    const required: CheckItem[] = [
      {
        id: 'name',
        label: '填写姓名',
        passed: !!profile.name?.trim(),
        detail: '姓名是简历的基本要素',
      },
      {
        id: 'contact',
        label: '至少填写一种联系方式（电话或邮箱）',
        passed: hasContact,
        detail: 'HR 需要能联系到您',
      },
      {
        id: 'module-content',
        label: '至少添加一个内容模块（经历/教育/项目）',
        passed: hasContentModule,
        detail: '空白简历无法投递',
      },
    ];

    // --- 推荐填写 ---
    const recommended: CheckItem[] = [
      {
        id: 'title',
        label: '填写求职意向 / 职位名称',
        passed: !!profile.title?.trim(),
        detail: '明确意向能提高 HR 筛选效率',
      },
      {
        id: 'phone',
        label: '填写手机号码',
        passed: !!profile.phone?.trim(),
        detail: '电话是最直接的联系方式',
      },
      {
        id: 'email',
        label: '填写电子邮箱',
        passed: !!profile.email?.trim(),
        detail: '用于接收面试通知',
      },
      {
        id: 'summary',
        label: '填写个人简介 / 自我介绍',
        passed: !!profile.summary?.trim(),
        detail: '帮助 HR 快速了解您',
      },
    ];

    // 检查每条经历是否有描述
    visibleModules.forEach(mod => {
      if (mod.type !== 'skills') {
        (mod.items as import('@/app/types/resume').ResumeItem[]).forEach((item, idx) => {
          const itemTitle = item.title || `第${idx + 1}条`;
          recommended.push({
            id: `${mod.id}-${item.id}-desc`,
            label: `${mod.title} - "${itemTitle}" 填写描述`,
            passed: !!(item.description && item.description.trim()),
            detail: '经历描述能展示您的具体贡献',
          });
        });
      }
    });

    // --- 格式检查 ---
    const format: CheckItem[] = [];

    // 手机号格式
    if (profile.phone?.trim()) {
      const phoneClean = profile.phone.replace(/\s/g, '');
      format.push({
        id: 'phone-format',
        label: '手机号格式正确（11位数字）',
        passed: /^1[3-9]\d{9}$/.test(phoneClean),
        detail: `当前: ${profile.phone}`,
      });
    }

    // 邮箱格式
    if (profile.email?.trim()) {
      format.push({
        id: 'email-format',
        label: '邮箱格式正确（包含 @）',
        passed: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email),
        detail: `当前: ${profile.email}`,
      });
    }

    // 是否超出一页
    format.push({
      id: 'page-overflow',
      label: '内容在 A4 一页以内',
      passed: contentOverflow <= 100,
      detail: contentOverflow > 100 ? `当前约 ${contentOverflow}%，超出 ${contentOverflow - 100}%` : undefined,
    });

    // 是否存在空白模块
    const emptyModules = visibleModules.filter(m => m.items.length === 0);
    format.push({
      id: 'empty-modules',
      label: '无空白模块（有标题无内容）',
      passed: emptyModules.length === 0,
      detail: emptyModules.length > 0 ? `"${emptyModules.map(m => m.title).join('"、"')}" 内容为空` : undefined,
    });

    return { required, recommended, format };
  }, [resumeData, contentOverflow]);

  const allItems = [...checklist.required, ...checklist.recommended, ...checklist.format];
  const completedCount = allItems.filter(i => i.passed).length;
  const totalCount = allItems.length;
  const requiredAllPassed = checklist.required.every(i => i.passed);

  const CheckItemRow: React.FC<{ item: CheckItem; showLocate?: boolean }> = ({ item, showLocate = true }) => (
    <div className={`flex items-start gap-3 py-2.5 px-3 rounded-lg ${item.passed ? 'bg-green-50/60' : 'bg-gray-50'}`}>
      <div className={`mt-0.5 shrink-0 ${item.passed ? 'text-green-500' : 'text-gray-300'}`}>
        {item.passed ? <Check size={16} strokeWidth={3} /> : <Circle size={16} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${item.passed ? 'text-gray-500 line-through' : 'text-gray-800 font-medium'}`}>
          {item.label}
        </p>
        {!item.passed && item.detail && (
          <p className="text-xs text-gray-400 mt-0.5">{item.detail}</p>
        )}
      </div>
      {!item.passed && showLocate && (
        <button
          onClick={() => scrollToField(item.id, onClose)}
          className="text-xs text-blue-500 hover:text-blue-700 font-medium shrink-0 flex items-center gap-0.5"
        >
          去填写 <ArrowRight size={11} />
        </button>
      )}
    </div>
  );

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
            className="fixed right-0 top-0 bottom-0 w-[400px] max-w-full bg-white shadow-2xl z-50 flex flex-col font-sans"
          >
            {/* Header */}
            <div className="p-5 border-b border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <ClipboardCheck size={20} className="text-blue-600" />
                  <h2 className="text-lg font-bold text-gray-800">完整性检查</h2>
                </div>
                <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={18} className="text-gray-400" />
                </button>
              </div>

              {/* 进度概览 */}
              <div className="flex items-center gap-4">
                <div className="flex items-baseline gap-1">
                  <span className={`text-3xl font-bold ${requiredAllPassed ? 'text-green-600' : 'text-gray-800'}`}>
                    {completedCount}
                  </span>
                  <span className="text-lg text-gray-400">/ {totalCount}</span>
                </div>
                <div className="flex-1">
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${requiredAllPassed ? 'bg-green-500' : 'bg-blue-500'}`}
                      style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {requiredAllPassed
                      ? completedCount === totalCount ? '所有项目已完成' : '必填项已完成，可继续完善'
                      : '请先完成必填项'}
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* 必填项 */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle size={14} className={checklist.required.every(i => i.passed) ? 'text-green-500' : 'text-red-500'} />
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    必填项（{checklist.required.filter(i => i.passed).length}/{checklist.required.length}）
                  </h3>
                </div>
                <div className="space-y-1">
                  {checklist.required.map(item => (
                    <CheckItemRow key={item.id} item={item} />
                  ))}
                </div>
              </div>

              {/* 推荐填写 */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FileCheck size={14} className="text-orange-400" />
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    推荐填写（{checklist.recommended.filter(i => i.passed).length}/{checklist.recommended.length}）
                  </h3>
                </div>
                <div className="space-y-1">
                  {checklist.recommended.map(item => (
                    <CheckItemRow key={item.id} item={item} />
                  ))}
                </div>
              </div>

              {/* 格式检查 */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <ClipboardCheck size={14} className="text-blue-400" />
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    格式检查（{checklist.format.filter(i => i.passed).length}/{checklist.format.length}）
                  </h3>
                </div>
                <div className="space-y-1">
                  {checklist.format.map(item => (
                    <CheckItemRow key={item.id} item={item} showLocate={false} />
                  ))}
                </div>
              </div>

              {/* 全部完成 */}
              {completedCount === totalCount && (
                <div className="text-center py-6">
                  <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Check size={28} className="text-green-500" strokeWidth={3} />
                  </div>
                  <h3 className="font-bold text-gray-800 mb-1">检查全部通过</h3>
                  <p className="text-sm text-gray-400">简历信息完整，可以放心导出</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 text-center">
              <p className="text-xs text-gray-400">仅检查信息完整性和格式，不对内容做主观评判</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
