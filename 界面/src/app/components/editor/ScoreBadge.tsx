import React from 'react';
import { ClipboardCheck } from 'lucide-react';
import { cn } from '@/app/lib/utils';

interface CheckBadgeProps {
  completed: number;
  total: number;
  requiredAllPassed: boolean;
  onClick: () => void;
  className?: string;
}

export const ScoreBadge: React.FC<CheckBadgeProps> = ({ completed, total, requiredAllPassed, onClick, className }) => {
  const pending = Math.max(0, total - completed);
  const allDone = pending === 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-full shadow-lg cursor-pointer transition-all hover:scale-105 hover:shadow-xl",
        allDone
          ? "bg-green-500 text-white"
          : requiredAllPassed
            ? "bg-white text-gray-700 border border-gray-200"
            : "bg-white text-orange-600 border border-orange-200",
        className
      )}
      title="查看完整性检查"
      aria-label={allDone ? '完整性检查：全部通过' : `完整性检查：还有 ${pending} 项待完善`}
    >
      <ClipboardCheck size={16} className={allDone ? 'text-white' : requiredAllPassed ? 'text-green-500' : 'text-orange-500'} />
      {/* 不显示「17/23」这类没有解释的数字，直接说还差几项、点进去能做什么 */}
      <span className="text-sm font-bold whitespace-nowrap">
        {allDone ? '检查通过' : `待完善 ${pending} 项`}
      </span>
      {!requiredAllPassed && (
        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
      )}
    </button>
  );
};
