import React, { useMemo } from 'react';
import { X, Check, Circle, ArrowRight, ClipboardCheck, AlertCircle, FileCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ResumeData, ResumeItem } from '@/app/types/resume';
import { requestLocate, LocateTarget } from './locateBus';

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
  detail?: string; // 未通过时「该怎么做」的中文说明
  locate?: LocateTarget; // 点「去填写」时精确展开并定位到这里
}

/**
 * 完整性检查面板。
 * 措辞原则（对应审计 E 组）：
 * - 不显示分数、不显示「1/9」这类无解释数字，只说「还差几项、差在哪」
 * - 每条都要能被用户行动解决；解决不了的不进列表（例如「每条经历是否都有描述」合并成模块级一条）
 * - 「去填写」用 locateBus 精确展开模块 / 聚焦输入框，而不是靠猜的选择器
 */

const CheckItemRow: React.FC<{ item: CheckItem; onClose: () => void }> = ({ item, onClose }) => {
  const locate = item.locate;
  return (
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
      {!item.passed && locate && (
        <button
          onClick={() => {
            requestLocate(locate);
            onClose();
          }}
          className="text-xs text-blue-500 hover:text-blue-700 font-medium shrink-0 flex items-center gap-0.5"
        >
          去填写 <ArrowRight size={11} />
        </button>
      )}
    </div>
  );
};

export const DiagnosticPanel: React.FC<DiagnosticPanelProps> = ({
  isOpen,
  onClose,
  resumeData,
  contentOverflow = 0,
}) => {
  const checklist = useMemo(() => {
    const required: CheckItem[] = [];
    const suggested: CheckItem[] = [];
    const issues: CheckItem[] = [];
    if (!resumeData) return { required, suggested, issues };

    const { profile, modules } = resumeData;
    const visibleModules = modules.filter(m => m.visible);
    const hasPhone = !!profile.phone?.trim();
    const hasEmail = !!profile.email?.trim();
    const hasContentModule = visibleModules.some(m => m.type !== 'skills' && m.items.length > 0);

    // --- 必填：缺任何一项都不建议投递 ---
    required.push({
      id: 'name',
      label: '写上姓名',
      passed: !!profile.name?.trim(),
      detail: 'HR 一天看几百份简历，姓名是唯一标识',
      locate: { kind: 'field', fieldId: 'field-name' },
    });
    required.push({
      id: 'contact',
      label: '至少留一种联系方式（电话或邮箱）',
      passed: hasPhone || hasEmail,
      detail: '只写微信容易漏掉面试通知',
      locate: { kind: 'field', fieldId: hasPhone ? 'field-email' : 'field-phone' },
    });
    required.push({
      id: 'content-module',
      label: '至少有一段经历（教育 / 工作 / 项目 / 校园）',
      passed: hasContentModule,
      detail: '点左栏「添加模块」新增，再点「添加一条」填写',
      locate: { kind: 'add-module' },
    });

    // --- 建议补充：不影响投递，但会明显提升通过率 ---
    suggested.push({
      id: 'title',
      label: '写清求职意向（想应聘什么岗位）',
      passed: !!profile.title?.trim(),
      detail: '同一份内容改个意向就能投不同岗位',
      locate: { kind: 'field', fieldId: 'field-title' },
    });
    suggested.push({
      id: 'phone',
      label: '填手机号',
      passed: hasPhone,
      detail: '最快联系到你方式',
      locate: { kind: 'field', fieldId: 'field-phone' },
    });
    suggested.push({
      id: 'email',
      label: '填邮箱',
      passed: hasEmail,
      detail: '面试通知、笔试链接一般走邮件',
      locate: { kind: 'field', fieldId: 'field-email' },
    });
    suggested.push({
      id: 'summary',
      label: '补一段自我评价（3～4 行）',
      passed: !!profile.summary?.trim(),
      detail: '写最能打的 2～3 个点，别写空话',
      locate: { kind: 'field', fieldId: 'field-summary' },
    });

    // 每个模块一条「有几条没写描述」，而不是每个条目一行（用户关心的是模块，不是条目 id）
    visibleModules.forEach(mod => {
      if (mod.type === 'skills') return;
      const missing = (mod.items as ResumeItem[]).filter(i => !(i.description && i.description.trim()));
      if (missing.length === 0) return;
      const first = missing[0];
      suggested.push({
        id: `${mod.id}:${first.id}`,
        label: `「${mod.title}」还有 ${missing.length} 条没写具体做了什么`,
        passed: false,
        detail: '用「做了什么 → 怎么做的 → 结果」写，可点「查看范例」找参考',
        locate: { kind: 'item', moduleId: mod.id, itemId: first.id },
      });
    });

    // --- 需要修正：格式 / 排版，都会影响观感 ---
    if (hasPhone && !/^1[3-9]\d{9}$/.test(profile.phone.replace(/\s/g, ''))) {
      issues.push({
        id: 'phone-format',
        label: '手机号看起来不是 11 位',
        passed: false,
        detail: `当前：${profile.phone}`,
        locate: { kind: 'field', fieldId: 'field-phone' },
      });
    }
    if (hasEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
      issues.push({
        id: 'email-format',
        label: '邮箱格式不完整（缺 @ 或域名）',
        passed: false,
        detail: `当前：${profile.email}`,
        locate: { kind: 'field', fieldId: 'field-email' },
      });
    }
    const emptyModules = visibleModules.filter(m => m.items.length === 0);
    if (emptyModules.length > 0) {
      issues.push({
        id: 'empty-modules',
        label: `「${emptyModules.map(m => m.title).join('」「')}」还没有内容`,
        passed: false,
        detail: '填内容，或点模块右上角的眼睛图标让纸面不显示它',
        locate: { kind: 'module', moduleId: emptyModules[0].id },
      });
    }
    if (contentOverflow > 100) {
      const pages = Math.max(1, Math.ceil(contentOverflow / 100));
      issues.push({
        id: 'page-overflow',
        label: `内容超出 1 页（约 ${pages} 页）`,
        passed: false,
        detail: '中文简历建议 1 页：点预览区上方「智能适应一页」，或精简早期经历',
      });
    }

    return { required, suggested, issues };
  }, [resumeData, contentOverflow]);

  const requiredLeft = checklist.required.filter(i => !i.passed).length;
  const suggestedLeft = checklist.suggested.filter(i => !i.passed).length;
  const issuesLeft = checklist.issues.filter(i => !i.passed).length;
  const totalLeft = requiredLeft + suggestedLeft + issuesLeft;
  const sections = [
    { key: 'required', title: '必填', hint: '这几项没写完不建议投递', icon: <AlertCircle size={14} />, tone: 'text-red-500', items: checklist.required },
    { key: 'suggested', title: '建议补充', hint: '写了会明显提升通过率', icon: <FileCheck size={14} />, tone: 'text-orange-400', items: checklist.suggested },
    { key: 'issues', title: '需要修正', hint: '排版与格式问题', icon: <ClipboardCheck size={14} />, tone: 'text-blue-400', items: checklist.issues },
  ].filter(s => s.items.length > 0);

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
            role="dialog"
            aria-label="简历完整性检查"
            className="fixed right-0 top-0 bottom-0 w-[400px] max-w-full bg-white shadow-2xl z-50 flex flex-col font-sans"
          >
            {/* Header */}
            <div className="p-5 border-b border-gray-100">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <ClipboardCheck size={20} className="text-blue-600" />
                  <h2 className="text-lg font-bold text-gray-800">完整性检查</h2>
                </div>
                <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors" aria-label="关闭">
                  <X size={18} className="text-gray-400" />
                </button>
              </div>

              <p className="text-sm font-medium text-gray-800">
                {requiredLeft > 0
                  ? `还有 ${requiredLeft} 项必填没完成`
                  : suggestedLeft + issuesLeft === 0
                    ? '检查全部通过，可以导出投递了'
                    : '必填项都完成了，可以再完善一下'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {requiredLeft > 0
                  ? '先把必填项补齐，再考虑排版'
                  : `建议补充 ${suggestedLeft} 项 · 需修正 ${issuesLeft} 项`}
              </p>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {sections.map(section => (
                <div key={section.key}>
                  <div className="flex items-start gap-2 mb-2">
                    <span className={section.tone}>{section.icon}</span>
                    <div>
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{section.title}</h3>
                      <p className="text-[11px] text-gray-400">{section.hint}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {section.items.map(item => (
                      <CheckItemRow key={item.id} item={item} onClose={onClose} />
                    ))}
                  </div>
                </div>
              ))}

              {totalLeft === 0 && (
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
              <p className="text-xs text-gray-400">这里只检查信息完整性和格式，不评价内容好坏</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
