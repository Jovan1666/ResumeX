import React, { useState, useEffect, useRef, memo, useCallback } from 'react';

/**
 * 防抖输入框：内部维护 local state 实现即时响应，
 * 延迟 delay 毫秒后才写入外部 store，避免每次击键触发全局重渲染。
 *
 * 修复点（P1-4 / 6.1）：
 * - IME 合成期间（compositionstart → compositionend）不启动 debounce
 * - 外部 value 与本地相同（自己 debounce 写回产生的 echo）时不清 timer、不弹回
 * - 卸载/失焦必须 flush 最后输入
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
  const composingRef = useRef(false);
  const lastCommittedRef = useRef(externalValue); // 上次写到 store 的值（用于 echo 判断）

  // 用于 cleanup 闭包中读取最新值（避免 stale closure）
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const localValueRef = useRef(localValue);
  localValueRef.current = localValue;
  const externalValueRef = useRef(externalValue);
  externalValueRef.current = externalValue;

  const commit = useCallback((val: string) => {
    onChangeRef.current(val);
    lastCommittedRef.current = val;
  }, []);

  // 外部值变化时同步（非用户输入导致的变化，如 undo/redo）
  // 关键：只有当外部值 !== 本地值（且不是自己写回的 echo）才覆盖本地
  useEffect(() => {
    if (externalValue === localValueRef.current) {
      // echo：自己 debounce 写回的值与外部相同，无需处理
      return;
    }
    if (isTypingRef.current) {
      // 正在输入期间外部值变了（undo/redo 触发）：取消 pending debounce 并同步
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = undefined;
      }
    }
    setLocalValue(externalValue);
  }, [externalValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    // IME 合成中：只更新本地显示，不启动 debounce（等 compositionend 再提交）
    if (composingRef.current) return;
    isTypingRef.current = true;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      commit(newValue);
      isTypingRef.current = false;
    }, delay);
  };

  // IME 结束：立即提交当前值（不清 debounce，保留最后一次输入）
  const handleCompositionEnd = () => {
    composingRef.current = false;
    if (localValueRef.current !== lastCommittedRef.current) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        commit(localValueRef.current);
        isTypingRef.current = false;
      }, delay);
    }
  };

  // 失焦时立即提交（防止用户输入后直接点导出时丢失内容）
  const handleBlur = () => {
    composingRef.current = false;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
    if (localValueRef.current !== lastCommittedRef.current) {
      commit(localValueRef.current);
    }
    isTypingRef.current = false;
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      // 组件卸载时提交未保存的值，防止数据丢失
      if (localValueRef.current !== lastCommittedRef.current) {
        commit(localValueRef.current);
      }
    };
  }, []);

  return (
    <input
      {...props}
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onCompositionStart={() => { composingRef.current = true; }}
      onCompositionEnd={handleCompositionEnd}
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
  const composingRef = useRef(false);
  const lastCommittedRef = useRef(externalValue);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const localValueRef = useRef(localValue);
  localValueRef.current = localValue;
  const externalValueRef = useRef(externalValue);
  externalValueRef.current = externalValue;

  const commit = useCallback((val: string) => {
    onChangeRef.current(val);
    lastCommittedRef.current = val;
  }, []);

  useEffect(() => {
    if (externalValue === localValueRef.current) return;
    if (isTypingRef.current) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = undefined;
      }
    }
    setLocalValue(externalValue);
  }, [externalValue]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    if (composingRef.current) return;
    isTypingRef.current = true;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      commit(newValue);
      isTypingRef.current = false;
    }, delay);
  };

  const handleCompositionEnd = () => {
    composingRef.current = false;
    if (localValueRef.current !== lastCommittedRef.current) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        commit(localValueRef.current);
        isTypingRef.current = false;
      }, delay);
    }
  };

  const handleBlur = () => {
    composingRef.current = false;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
    if (localValueRef.current !== lastCommittedRef.current) {
      commit(localValueRef.current);
    }
    isTypingRef.current = false;
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (localValueRef.current !== lastCommittedRef.current) {
        commit(localValueRef.current);
      }
    };
  }, []);

  return (
    <textarea
      {...props}
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onCompositionStart={() => { composingRef.current = true; }}
      onCompositionEnd={handleCompositionEnd}
    />
  );
});

DebouncedTextarea.displayName = 'DebouncedTextarea';
