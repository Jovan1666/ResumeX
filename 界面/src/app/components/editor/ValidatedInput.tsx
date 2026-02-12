import React, { useState, useCallback, useRef, useEffect } from 'react';
import { AlertCircle, Check } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { ValidationRule, validateField } from '@/app/hooks/useFormValidation';

const DEFAULT_DEBOUNCE = 300;

interface ValidatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  required?: boolean;
  rules?: ValidationRule;
  fieldLabel?: string;
  showSuccessIcon?: boolean;
  /** 防抖延迟 (ms)，0 表示不防抖。默认 300ms，避免每次击键都写 store 触发预览重渲染 */
  debounceMs?: number;
}

export const ValidatedInput: React.FC<ValidatedInputProps> = ({
  label,
  required,
  rules,
  fieldLabel,
  showSuccessIcon = true,
  debounceMs = DEFAULT_DEBOUNCE,
  className,
  onChange,
  onBlur,
  value,
  ...props
}) => {
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  // 防抖：本地 state 即时响应输入，延迟写入外部 store
  const [localValue, setLocalValue] = useState(String(value ?? ''));
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const isTypingRef = useRef(false);

  // 外部值变化时同步（undo/redo、外部重置）
  useEffect(() => {
    const externalStr = String(value ?? '');
    if (isTypingRef.current) {
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = undefined; }
      isTypingRef.current = false;
    }
    setLocalValue(externalStr);
  }, [value]);

  const combinedRules: ValidationRule = {
    required,
    ...rules
  };

  const validate = useCallback((val: string) => {
    const err = validateField(val, combinedRules, fieldLabel || label || '此字段');
    setError(err);
    return err === null;
  }, [combinedRules, fieldLabel, label]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setLocalValue(newVal);
    if (touched) validate(newVal);

    if (debounceMs > 0) {
      isTypingRef.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onChange?.(e);
        isTypingRef.current = false;
      }, debounceMs);
    } else {
      onChange?.(e);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // 失焦时立即提交，防止丢失内容
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = undefined; }
    if (isTypingRef.current && localValue !== String(value ?? '')) {
      onChange?.(e);
      isTypingRef.current = false;
    }
    setTouched(true);
    validate(e.target.value);
    onBlur?.(e);
  };

  // 组件卸载时清理定时器
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const showError = touched && error;
  const showSuccess = touched && !error && localValue;

  // 生成唯一ID用于关联label和input
  const inputId = props.id || `input-${label?.replace(/\s/g, '-').toLowerCase()}`;
  const errorId = `${inputId}-error`;

  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={inputId}
          className="text-xs text-gray-500 font-medium flex gap-1 mb-1"
        >
          {label}
          {required && <span className="text-red-500" aria-hidden="true">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          className={cn(
            "w-full p-2 border rounded text-sm outline-none transition-colors",
            showError
              ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 pr-8"
              : showSuccess
                ? "border-green-400 focus:border-green-500 focus:ring-1 focus:ring-green-500 pr-8"
                : "border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500",
            className
          )}
          value={localValue}
          onChange={handleChange}
          onBlur={handleBlur}
          aria-required={required}
          aria-invalid={showError ? true : undefined}
          aria-describedby={showError ? errorId : undefined}
          {...props}
        />
        {showError && (
          <AlertCircle 
            size={16} 
            className="absolute right-2 top-1/2 -translate-y-1/2 text-red-500" 
            aria-hidden="true"
          />
        )}
        {showSuccess && showSuccessIcon && (
          <Check 
            size={16} 
            className="absolute right-2 top-1/2 -translate-y-1/2 text-green-500" 
            aria-hidden="true"
          />
        )}
      </div>
      {showError && (
        <p id={errorId} className="text-xs text-red-500 mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

// 带验证的文本域
interface ValidatedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  required?: boolean;
  rules?: ValidationRule;
  fieldLabel?: string;
  showCount?: boolean;
  debounceMs?: number;
}

export const ValidatedTextarea: React.FC<ValidatedTextareaProps> = ({
  label,
  required,
  rules,
  fieldLabel,
  showCount = true,
  debounceMs = DEFAULT_DEBOUNCE,
  className,
  onChange,
  onBlur,
  value,
  maxLength,
  ...props
}) => {
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const [localValue, setLocalValue] = useState(String(value ?? ''));
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const isTypingRef = useRef(false);

  useEffect(() => {
    const externalStr = String(value ?? '');
    if (isTypingRef.current) {
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = undefined; }
      isTypingRef.current = false;
    }
    setLocalValue(externalStr);
  }, [value]);

  const combinedRules: ValidationRule = {
    required,
    maxLength,
    ...rules
  };

  const validate = useCallback((val: string) => {
    const err = validateField(val, combinedRules, fieldLabel || label || '此字段');
    setError(err);
    return err === null;
  }, [combinedRules, fieldLabel, label]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    setLocalValue(newVal);
    if (touched) validate(newVal);

    if (debounceMs > 0) {
      isTypingRef.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onChange?.(e);
        isTypingRef.current = false;
      }, debounceMs);
    } else {
      onChange?.(e);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = undefined; }
    if (isTypingRef.current && localValue !== String(value ?? '')) {
      onChange?.(e);
      isTypingRef.current = false;
    }
    setTouched(true);
    validate(e.target.value);
    onBlur?.(e);
  };

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const showError = touched && error;
  const currentLength = localValue.length;

  // 生成唯一ID
  const textareaId = props.id || `textarea-${label?.replace(/\s/g, '-').toLowerCase()}`;
  const errorId = `${textareaId}-error`;
  const countId = `${textareaId}-count`;

  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={textareaId}
          className="text-xs text-gray-500 font-medium flex gap-1 mb-1"
        >
          {label}
          {required && <span className="text-red-500" aria-hidden="true">*</span>}
        </label>
      )}
      <div className="relative">
        <textarea
          id={textareaId}
          className={cn(
            "w-full p-2 border rounded text-sm outline-none transition-colors resize-y",
            showError
              ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
              : "border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500",
            className
          )}
          value={localValue}
          onChange={handleChange}
          onBlur={handleBlur}
          maxLength={maxLength}
          aria-required={required}
          aria-invalid={showError ? true : undefined}
          aria-describedby={[
            showError ? errorId : null,
            showCount ? countId : null
          ].filter(Boolean).join(' ') || undefined}
          {...props}
        />
        {showCount && (
          <div 
            id={countId}
            className={cn(
              "text-[10px] text-right mt-1 transition-colors",
              maxLength && currentLength >= maxLength * 0.9 ? "text-orange-500" : "text-gray-400"
            )}
            aria-live="polite"
          >
            {currentLength}{maxLength ? ` / ${maxLength}` : ''} 字
          </div>
        )}
      </div>
      {showError && (
        <p id={errorId} className="text-xs text-red-500 mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
