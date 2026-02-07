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
  const allDone = completed === total;

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
      title="完整性检查"
    >
      <ClipboardCheck size={16} className={allDone ? 'text-white' : requiredAllPassed ? 'text-green-500' : 'text-orange-500'} />
      <span className="text-sm font-bold whitespace-nowrap">
        {completed}/{total}
      </span>
      {!requiredAllPassed && (
        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
      )}
    </button>
  );
};
