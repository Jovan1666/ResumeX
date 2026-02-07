import React, { useState, useEffect, useRef, memo } from 'react';

/**
 * 防抖输入框：内部维护 local state 实现即时响应，
 * 延迟 delay 毫秒后才写入外部 store，避免每次击键触发全局重渲染。
 */

interface DebouncedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  delay?: number;
}

export const DebouncedInput = memo<DebouncedInputProps>(({
  value: externalValue,
  onChange,
  delay = 300,
  ...props
}) => {
  const [localValue, setLocalValue] = useState(externalValue);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const isTypingRef = useRef(false);

  // 外部值变化时同步（非用户输入导致的变化，如 undo/redo）
  // 关键：即使正在输入，如果外部值变化（undo/redo），也要清除 pending 的 debounce
  // 否则 debounce 回调会将旧的本地值覆盖回 store，导致 undo 被吞掉
  useEffect(() => {
    if (isTypingRef.current) {
      // 正在输入期间外部值变了（undo/redo 触发）：取消 pending debounce 并同步
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = undefined;
      }
      isTypingRef.current = false;
    }
    setLocalValue(externalValue);
  }, [externalValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    isTypingRef.current = true;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onChange(newValue);
      isTypingRef.current = false;
    }, delay);
  };

  // 失焦时立即提交（防止用户输入后直接点导出时丢失内容）
  const handleBlur = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
    if (localValue !== externalValue) {
      onChange(localValue);
    }
    isTypingRef.current = false;
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <input
      {...props}
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  );
});

DebouncedInput.displayName = 'DebouncedInput';

/* ---- Textarea 版本 ---- */

interface DebouncedTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  delay?: number;
}

export const DebouncedTextarea = memo<DebouncedTextareaProps>(({
  value: externalValue,
  onChange,
  delay = 300,
  ...props
}) => {
  const [localValue, setLocalValue] = useState(externalValue);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const isTypingRef = useRef(false);

  useEffect(() => {
    if (isTypingRef.current) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = undefined;
      }
      isTypingRef.current = false;
    }
    setLocalValue(externalValue);
  }, [externalValue]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    isTypingRef.current = true;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onChange(newValue);
      isTypingRef.current = false;
    }, delay);
  };

  const handleBlur = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
    if (localValue !== externalValue) {
      onChange(localValue);
    }
    isTypingRef.current = false;
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <textarea
      {...props}
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  );
});

DebouncedTextarea.displayName = 'DebouncedTextarea';
