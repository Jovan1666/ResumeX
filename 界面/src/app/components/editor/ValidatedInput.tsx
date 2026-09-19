import React, { useState, useCallback, useRef } from 'react';
import { AlertCircle, Check } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { ValidationRule, validateField } from '@/app/hooks/useFormValidation';
import { useDebouncedField } from './DebouncedInput';

const DEFAULT_DEBOUNCE = 300;

/**
 * 带校验的输入框：**只是 DebouncedInput 原语（useDebouncedField）外面的一层「标签 + 校验」皮肤**，
 * 防抖 / IME / 失焦 flush / 卸载 flush 全部由原语负责，这里绝不重复实现。
 */

interface ValidatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  required?: boolean;
  rules?: ValidationRule;
  fieldLabel?: string;
  showSuccessIcon?: boolean;
  /** 防抖延迟 (ms)，0 表示不防抖。默认 300ms，避免每次击键都写 store 触发预览重渲染 */
  debounceMs?: number;
}

/** 原语以「字符串」提交，这里适配成 onChange(合成事件)，保持对外 API 不变 */
function changeEvent(value: string): React.ChangeEvent<HTMLInputElement> {
  return { target: { value }, currentTarget: { value } } as unknown as React.ChangeEvent<HTMLInputElement>;
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

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const commit = useCallback((val: string) => {
    onChangeRef.current?.(changeEvent(val));
  }, []);

  const field = useDebouncedField({ value: String(value ?? ''), onCommit: commit, delay: debounceMs });

  const runValidation = useCallback((val: string) => {
    setError(validateField(val, { required, ...rules }, fieldLabel || label || '此字段'));
  }, [required, rules, fieldLabel, label]);

  const showError = Boolean(touched && error);
  const showSuccess = Boolean(touched && !error && field.localValue);

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
          value={field.localValue}
          onChange={(e) => {
            field.onChange(e);
            if (touched) runValidation(e.target.value);
          }}
          onBlur={(e) => {
            field.flush();
            setTouched(true);
            runValidation(field.localValue);
            onBlur?.(e);
          }}
          onCompositionStart={field.onCompositionStart}
          onCompositionEnd={(e) => {
            field.onCompositionEnd(e);
            runValidation(e.currentTarget.value);
          }}
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

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const commit = useCallback((val: string) => {
    onChangeRef.current?.({ target: { value: val }, currentTarget: { value: val } } as unknown as React.ChangeEvent<HTMLTextAreaElement>);
  }, []);

  const field = useDebouncedField({ value: String(value ?? ''), onCommit: commit, delay: debounceMs });

  const runValidation = useCallback((val: string) => {
    setError(validateField(val, { required, maxLength, ...rules }, fieldLabel || label || '此字段'));
  }, [required, maxLength, rules, fieldLabel, label]);

  const showError = Boolean(touched && error);
  const currentLength = field.localValue.length;

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
          value={field.localValue}
          onChange={(e) => {
            field.onChange(e);
            if (touched) runValidation(e.target.value);
          }}
          onBlur={(e) => {
            field.flush();
            setTouched(true);
            runValidation(field.localValue);
            onBlur?.(e);
          }}
          onCompositionStart={field.onCompositionStart}
          onCompositionEnd={(e) => {
            field.onCompositionEnd(e);
            runValidation(e.currentTarget.value);
          }}
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
