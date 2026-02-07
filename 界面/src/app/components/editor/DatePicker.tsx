import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/app/lib/utils';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  allowPresent?: boolean;
  className?: string;
}

const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 30 }, (_, i) => currentYear - i);

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = '选择日期',
  allowPresent = true,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [isPresent, setIsPresent] = useState(value === '至今');
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, openUpward: false });

  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 解析当前值
  useEffect(() => {
    if (value === '至今') {
      setIsPresent(true);
    } else if (value) {
      const match = value.match(/(\d{4})\.(\d{1,2})/);
      if (match) {
        setSelectedYear(parseInt(match[1]));
      }
    }
  }, [value]);

  // 计算下拉面板位置
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownHeight = allowPresent ? 310 : 260;
    const dropdownWidth = 256;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < dropdownHeight + 8 && rect.top > dropdownHeight + 8;

    let left = rect.left;
    // 防止右侧溢出屏幕
    if (left + dropdownWidth > window.innerWidth - 8) {
      left = window.innerWidth - dropdownWidth - 8;
    }
    // 防止左侧溢出
    if (left < 8) left = 8;

    setDropdownPos({
      top: openUpward ? rect.top - dropdownHeight - 4 : rect.bottom + 4,
      left,
      openUpward,
    });
  }, [allowPresent]);

  // 打开/关闭
  const handleToggle = () => {
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen(!isOpen);
  };

  // 点击外部关闭
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        (!dropdownRef.current || !dropdownRef.current.contains(target))
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // 滚动时关闭（避免位置错位）
  useEffect(() => {
    if (!isOpen) return;
    const handleScroll = (e: Event) => {
      // 忽略下拉面板自身的滚动
      if (dropdownRef.current?.contains(e.target as Node)) return;
      setIsOpen(false);
    };
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [isOpen]);

  const handleSelectMonth = (monthIndex: number) => {
    const month = String(monthIndex + 1).padStart(2, '0');
    onChange(`${selectedYear}.${month}`);
    setIsOpen(false);
    setIsPresent(false);
  };

  const handleSelectPresent = () => {
    onChange('至今');
    setIsPresent(true);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsPresent(false);
  };

  const displayValue = isPresent ? '至今' : value;

  // 下拉面板内容
  const dropdownContent = (
    <div
      ref={dropdownRef}
      className="fixed w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-[9999] overflow-hidden"
      style={{
        top: dropdownPos.top,
        left: dropdownPos.left,
      }}
    >
      {/* 年份选择 */}
      <div className="flex items-center justify-between p-2 bg-gray-50 border-b border-gray-200">
        <button
          onClick={() => setSelectedYear(Math.min(currentYear, selectedYear + 1))}
          disabled={selectedYear >= currentYear}
          className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={16} />
        </button>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          className="font-medium text-center bg-transparent border-none focus:ring-0 cursor-pointer"
        >
          {years.map((year) => (
            <option key={year} value={year}>{year}年</option>
          ))}
        </select>
        <button
          onClick={() => setSelectedYear(Math.max(currentYear - 29, selectedYear - 1))}
          disabled={selectedYear <= currentYear - 29}
          className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* 月份网格 */}
      <div className="p-2 grid grid-cols-4 gap-1">
        {months.map((month, index) => {
          const monthValue = `${selectedYear}.${String(index + 1).padStart(2, '0')}`;
          const isSelected = value === monthValue;
          const isFuture = selectedYear === currentYear && index > new Date().getMonth();
          
          return (
            <button
              key={month}
              onClick={() => !isFuture && handleSelectMonth(index)}
              disabled={isFuture}
              className={cn(
                "py-2 px-1 text-sm rounded transition-colors",
                isSelected
                  ? "bg-blue-600 text-white"
                  : isFuture
                    ? "text-gray-300 cursor-not-allowed"
                    : "hover:bg-gray-100 text-gray-700"
              )}
            >
              {month}
            </button>
          );
        })}
      </div>

      {/* 至今选项 */}
      {allowPresent && (
        <div className="p-2 border-t border-gray-200">
          <button
            onClick={handleSelectPresent}
            className={cn(
              "w-full py-2 px-3 text-sm rounded-lg transition-colors flex items-center justify-center gap-2",
              isPresent
                ? "bg-green-100 text-green-700 font-medium"
                : "hover:bg-gray-100 text-gray-600"
            )}
          >
            {isPresent && <span className="w-2 h-2 bg-green-500 rounded-full" />}
            至今
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div ref={triggerRef} className={cn("relative", className)}>
      {/* 触发按钮 */}
      <div
        onClick={handleToggle}
        className={cn(
          "flex items-center gap-2 px-3 py-2 bg-white border rounded-lg cursor-pointer transition-colors text-sm",
          isOpen ? "border-blue-500 ring-1 ring-blue-500" : "border-gray-300 hover:border-gray-400"
        )}
      >
        <Calendar size={14} className="text-gray-400" />
        <span className={cn("flex-1 truncate", displayValue ? "text-gray-900" : "text-gray-400")}>
          {displayValue || placeholder}
        </span>
        {displayValue && (
          <button
            onClick={handleClear}
            className="p-0.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* 通过 Portal 渲染到 body，避免被父容器 overflow 裁剪 */}
      {isOpen && createPortal(dropdownContent, document.body)}
    </div>
  );
};
