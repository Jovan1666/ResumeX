import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/app/lib/utils';

/**
 * 年月选择器（简历里所有日期都用 YYYY.MM）
 *
 * 两条输入路径（对应审计 D 组）：
 * 1. 左侧输入框直接敲键盘入「2026.12 / 2026-12 / 2026年12月 / 2026 / 至今」，回车或失焦即解析落盘
 * 2. 右侧真 `<button>`（aria-haspopup / aria-expanded）打开日历，键盘可达：Esc 关闭并把焦点还给触发按钮
 *
 * 年份范围放开到「当前年 + 6」：应届生要写 2027.06 毕业、合同到期、预计交付等未来时间，
 * 不能把当年之后的月份禁掉。
 */

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  allowPresent?: boolean;
  className?: string;
  id?: string;
  /** 屏幕阅读器标签（如「开始时间」） */
  ariaLabel?: string;
}

const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
const currentYear = new Date().getFullYear();
const YEAR_MIN = 1980;
const YEAR_MAX = currentYear + 6;
const years = Array.from({ length: YEAR_MAX - YEAR_MIN + 1 }, (_, i) => YEAR_MAX - i);

const PRESENT = '至今';

const pad2 = (n: number) => String(n).padStart(2, '0');

/**
 * 把用户输入解析为 `YYYY.MM`（或 `至今`）；无法解析返回 null。
 * 支持：2026.12 / 2026-12 / 2026/12 / 2026年12月 / 2026 12 / 2026 / 至今 / 现在
 */
export function parseYearMonth(raw: string, allowPresent: boolean): string | null {
  const text = raw.trim();
  if (!text) return '';
  if (allowPresent && (text === PRESENT || text === '现在' || text.toLowerCase() === 'present')) return PRESENT;

  const match = text.match(/^(\d{4})(?:\s*[.\-/年]\s*(\d{1,2})\s*月?)?$/);
  if (!match) return null;
  const year = Number(match[1]);
  if (year < YEAR_MIN || year > YEAR_MAX) return null;
  if (!match[2]) return `${year}`;
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return `${year}.${pad2(month)}`;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = '选择日期',
  allowPresent = true,
  className,
  id,
  ariaLabel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const [invalid, setInvalid] = useState(false);
  const [viewYear, setViewYear] = useState(() => {
    const y = Number(value.match(/^(\d{4})/)?.[1]);
    return Number.isFinite(y) && y >= YEAR_MIN && y <= YEAR_MAX ? y : currentYear;
  });
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const isPresent = value === PRESENT;
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const focusedRef = useRef(false);
  /**
   * 最新敲入的文本：onChange 里直接写，commit 一律读它。
   * 只用 draft state 的话，「输入后同一任务里立刻失焦」（脚本注入、部分输入法的 blur）
   * 会读到尚未重渲染的旧 draft，把刚敲的年月丢掉。
   */
  const draftRef = useRef(value);

  // 外部值变化（撤销 / 切换简历 / 日历选中）时回填输入框；用户正在输入时不打断
  useEffect(() => {
    if (!focusedRef.current) {
      draftRef.current = value;
      setDraft(value);
      setInvalid(false);
    }
  }, [value]);

  // 打开时同步视图年份
  useEffect(() => {
    if (!isOpen) return;
    const y = Number((value || String(new Date().getFullYear())).match(/^(\d{4})/)?.[1]);
    if (Number.isFinite(y) && y >= YEAR_MIN && y <= YEAR_MAX) setViewYear(y);
  }, [isOpen, value]);

  const updatePosition = useCallback(() => {
    const anchor = wrapRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const height = allowPresent ? 320 : 268;
    const width = 256;
    const openUpward = window.innerHeight - rect.bottom < height + 8 && rect.top > height + 8;
    let left = rect.left;
    if (left + width > window.innerWidth - 8) left = window.innerWidth - width - 8;
    if (left < 8) left = 8;
    setPos({ top: openUpward ? rect.top - height - 4 : rect.bottom + 4, left });
  }, [allowPresent]);

  const open = useCallback(() => {
    updatePosition();
    setIsOpen(true);
  }, [updatePosition]);

  const close = useCallback((refocus: boolean) => {
    setIsOpen(false);
    if (refocus) triggerRef.current?.focus();
  }, []);

  // 点击外部关闭
  useEffect(() => {
    if (!isOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t) || dropdownRef.current?.contains(t)) return;
      setIsOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); close(true); }
    };
    // 滚动时关闭，避免浮层与触发器错位（浮层自身滚动除外）
    const onScroll = (e: Event) => {
      if (dropdownRef.current?.contains(e.target as Node)) return;
      setIsOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKey, true);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [isOpen, close]);

  /**
   * 提交输入框内容：解析成功写 store；解析失败**保留用户敲的文本**并标红提示，
   * 绝不静默把输入吞回旧值（旧写法打完一个错格式直接蒸发）。
   */
  const commitDraft = useCallback(() => {
    const parsed = parseYearMonth(draftRef.current, allowPresent);
    if (parsed === null) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    draftRef.current = parsed;
    setDraft(parsed);
    if (parsed !== value) onChange(parsed);
  }, [value, allowPresent, onChange]);

  const handlePickMonth = (monthIndex: number) => {
    onChange(`${viewYear}.${pad2(monthIndex + 1)}`);
    setIsOpen(false);
  };

  const handlePickPresent = () => {
    onChange(PRESENT);
    setIsOpen(false);
  };

  const handleClear = () => {
    draftRef.current = '';
    setDraft('');
    setInvalid(false);
    if (value) onChange('');
    inputRef.current?.focus();
  };

  const displayValue = isPresent ? PRESENT : value;
  const selectedMonthIndex = (() => {
    const m = displayValue.match(/^\d{4}\.(\d{1,2})/);
    return m ? Number(m[1]) - 1 : -1;
  })();

  const dropdown = (
    <div
      ref={dropdownRef}
      role="dialog"
      aria-label="选择年月"
      className="fixed w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-[9999] overflow-hidden"
      style={{ top: pos.top, left: pos.left }}
    >
      {/* 年份导航：左箭头 = 更早年份 */}
      <div className="flex items-center justify-between p-2 bg-gray-50 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setViewYear((y) => Math.max(YEAR_MIN, y - 1))}
          disabled={viewYear <= YEAR_MIN}
          className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="上一年"
        >
          <ChevronLeft size={16} />
        </button>
        <select
          value={viewYear}
          onChange={(e) => setViewYear(Number(e.target.value))}
          className="font-medium text-center bg-transparent border-none focus:ring-0 cursor-pointer"
          aria-label="年份"
        >
          {years.map((year) => (
            <option key={year} value={year}>{year}年</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setViewYear((y) => Math.min(YEAR_MAX, y + 1))}
          disabled={viewYear >= YEAR_MAX}
          className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="下一年"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* 月份网格：未来年月同样可选（毕业 / 合同到期等场景） */}
      <div className="p-2 grid grid-cols-4 gap-1">
        {monthNames.map((month, index) => {
          const isSelected = displayValue === `${viewYear}.${pad2(index + 1)}`;
          return (
            <button
              key={month}
              type="button"
              onClick={() => handlePickMonth(index)}
              autoFocus={isSelected || (selectedMonthIndex === -1 && index === 0)}
              className={cn(
                "py-2 px-1 text-sm rounded transition-colors",
                isSelected ? "bg-blue-600 text-white font-medium" : "hover:bg-gray-100 text-gray-700"
              )}
            >
              {month}
            </button>
          );
        })}
      </div>

      {allowPresent && (
        <div className="p-2 border-t border-gray-200 flex items-center gap-2">
          <button
            type="button"
            onClick={handlePickPresent}
            className={cn(
              "flex-1 py-2 px-3 text-sm rounded-lg transition-colors flex items-center justify-center gap-2",
              isPresent ? "bg-green-100 text-green-700 font-medium" : "hover:bg-gray-100 text-gray-600"
            )}
          >
            {isPresent && <span className="w-2 h-2 bg-green-500 rounded-full" />}
            至今
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="py-2 px-3 text-sm rounded-lg text-gray-500 hover:bg-gray-100 border border-gray-200"
          >
            清空
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div ref={wrapRef} className={cn("relative flex items-center min-w-0", className)}>
      <input
        ref={inputRef}
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        aria-label={ariaLabel || placeholder}
        aria-invalid={invalid || undefined}
        title={invalid ? '格式：2026.12（年.月）' + (allowPresent ? ' 或「至今」' : '') : undefined}
        placeholder={placeholder}
        value={draft}
        onChange={(e) => {
          draftRef.current = e.target.value;
          setDraft(e.target.value);
          const parsed = parseYearMonth(e.target.value, allowPresent);
          setInvalid(e.target.value.trim() !== '' && parsed === null);
        }}
        onFocus={() => { focusedRef.current = true; }}
        onBlur={() => { focusedRef.current = false; commitDraft(); }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); commitDraft(); inputRef.current?.blur(); }
          if (e.key === 'Escape') { e.preventDefault(); draftRef.current = value; setDraft(value); setInvalid(false); setIsOpen(false); }
          if (e.key === 'ArrowDown') { e.preventDefault(); if (isOpen) close(true); else open(); }
        }}
        className={cn(
          "flex-1 min-w-0 px-2 py-2 bg-white border rounded-l-lg text-sm outline-none transition-colors",
          invalid
            ? "border-red-400 focus:border-red-500"
            : isOpen
              ? "border-blue-500"
              : "border-gray-300 focus:border-blue-500",
          !displayValue && "text-gray-400 placeholder:text-gray-400"
        )}
      />
      {displayValue && (
        <button
          type="button"
          tabIndex={-1}
          onClick={handleClear}
          aria-label="清空日期"
          className="absolute right-9 p-0.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100"
        >
          <X size={13} />
        </button>
      )}
      <button
        type="button"
        ref={triggerRef}
        onClick={() => (isOpen ? close(false) : open())}
        onKeyDown={(e) => { if (e.key === 'ArrowDown') { e.preventDefault(); open(); } }}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={`${placeholder}：打开日历选择`}
        className={cn(
          "flex-shrink-0 px-2 py-2 bg-white border border-l-0 rounded-r-lg transition-colors",
          isOpen ? "border-blue-500 text-blue-600" : "border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700"
        )}
      >
        <Calendar size={14} />
      </button>

      {isOpen && createPortal(dropdown, document.body)}
    </div>
  );
};
