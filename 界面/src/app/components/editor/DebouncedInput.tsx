import React, { useState, useEffect, useRef, useCallback, memo } from 'react';

/**
 * 编辑器统一输入原语（全项目只有这一套「受控 + 防抖」文本输入实现）。
 * ValidatedInput.tsx 只是在本原语外包了「标签 + 校验」，不再重复实现防抖逻辑。
 *
 * 规则（对应审计 A 组）：
 * - 本地 state 即时响应，防抖 delay 后才写 store，避免每次击键整页重渲染
 * - IME 合成期间（compositionstart → compositionend）绝不提交；compositionend **真·立即**提交
 * - 失焦 / 卸载都必须 flush 最后一次输入：一律通过 ref 读取最新值与最新回调，
 *   杜绝「cleanup 闭包捕获首帧值」把用户刚打的字回退掉的 bug
 * - 与外部值（撤销/重做、切换简历）同步时不回弹自己写回的 echo，也不重复提交同值
 *   （重复提交同值会往历史栈里推进一条「改完后」快照，导致第一次撤销看起来无效果）
 */

interface DebouncedFieldOptions {
  /** 外部（store）值 */
  value: string;
  /** 提交回调：防抖结束 / 失焦 / 合成结束 / 卸载时调用 */
  onCommit: (value: string) => void;
  /** 防抖毫秒，0 表示不防抖 */
  delay?: number;
}

export interface DebouncedFieldApi {
  localValue: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onCompositionStart: () => void;
  onCompositionEnd: (e: React.CompositionEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  /** 失焦：立即提交（不需要事件对象） */
  onBlur: () => void;
  /** 立即提交未落盘的输入（失焦、导出前、点折叠头前调用） */
  flush: () => void;
}

type FlushEntry = () => void;

/** 在飞输入的登记表（不靠抢焦点来 flush） */
const pendingFlush = new Set<FlushEntry>();

/**
 * 供外部（导出 / 保存 / 打印 / 重启安装前）强制提交所有在飞的防抖输入。
 * 遍历登记表而不是 blur：blur 只能覆盖当前聚焦的那一个输入，还会打断用户焦点。
 * commitValue 内部「同值不提交」，所以这里对没改过的输入是空操作。
 */
export function flushAllInputs(): void {
  pendingFlush.forEach((entry) => entry());
}

export function useDebouncedField({ value, onCommit, delay = 300 }: DebouncedFieldOptions): DebouncedFieldApi {
  const [localValue, setLocalValue] = useState(value);

  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const composingRef = useRef(false);
  /** 本地实时值（cleanup / 定时器回调一律读它，避免闭包捕获首帧） */
  const localRef = useRef(value);
  /** 最近一次写进 store 的值：同值不重复提交，也用于区分外部 echo */
  const committedRef = useRef(value);
  const commitRef = useRef(onCommit);

  // 关键：每次渲染刷新 ref，cleanup / 定时器回调永远读到最新值与最新回调
  localRef.current = localValue;
  commitRef.current = onCommit;

  const cancelTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
  }, []);

  const commitValue = useCallback((val: string) => {
    cancelTimer();
    if (val === committedRef.current) return; // 同值不重复提交（避免污染撤销历史）
    committedRef.current = val;
    commitRef.current(val);
  }, [cancelTimer]);

  const flush = useCallback(() => {
    commitValue(localRef.current);
  }, [commitValue]);

  // 外部值变化：echo 不回弹；真的外部改动（撤销 / 切简历）则丢弃在飞的防抖并同步
  useEffect(() => {
    if (value === localRef.current) return;
    cancelTimer();
    committedRef.current = value;
    setLocalValue(value);
  }, [value, cancelTimer]);

  // 卸载：flush 最后一次输入（读 ref，不是首帧闭包），并退出登记表
  useEffect(() => {
    const entry: FlushEntry = () => commitValue(localRef.current);
    pendingFlush.add(entry);
    return () => {
      pendingFlush.delete(entry);
      cancelTimer();
      entry();
    };
    // commitValue / cancelTimer 都是稳定引用：这里只在挂载与卸载各跑一次
  }, [cancelTimer, commitValue]);

  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const next = e.target.value;
    localRef.current = next;
    setLocalValue(next);
    // 中文拼音合成期间：只更新显示，绝不提交
    if (composingRef.current) return;
    if (delay <= 0) {
      commitValue(next);
      return;
    }
    cancelTimer();
    timerRef.current = setTimeout(() => commitValue(next), delay);
  }, [cancelTimer, commitValue, delay]);

  const onCompositionStart = useCallback(() => {
    composingRef.current = true;
  }, []);

  // 合成结束：立即提交（不等防抖），这样中文用户打完字就能导出 / 撤销
  const onCompositionEnd = useCallback((e: React.CompositionEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    composingRef.current = false;
    const next = (e.currentTarget as HTMLInputElement | HTMLTextAreaElement).value;
    localRef.current = next;
    setLocalValue(next);
    commitValue(next);
  }, [commitValue]);

  const onBlur = useCallback(() => {
    composingRef.current = false;
    flush();
  }, [flush]);

  return { localValue, onChange, onBlur, onCompositionStart, onCompositionEnd, flush };
}

/* ---------------- input ---------------- */

interface DebouncedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string;
  onChange: (value: string) => void;
  delay?: number;
}

export const DebouncedInput = memo<DebouncedInputProps>(({
  value,
  onChange,
  delay = 300,
  onBlur,
  ...props
}) => {
  const field = useDebouncedField({ value, onCommit: onChange, delay });
  return (
    <input
      {...props}
      value={field.localValue}
      onChange={field.onChange}
      onBlur={(e) => {
        field.onBlur();
        onBlur?.(e);
      }}
      onCompositionStart={field.onCompositionStart}
      onCompositionEnd={field.onCompositionEnd}
    />
  );
});
DebouncedInput.displayName = 'DebouncedInput';

/* ---------------- textarea ---------------- */

interface DebouncedTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'value'> {
  value: string;
  onChange: (value: string) => void;
  delay?: number;
}

export const DebouncedTextarea = memo<DebouncedTextareaProps>(({
  value,
  onChange,
  delay = 300,
  onBlur,
  ...props
}) => {
  const field = useDebouncedField({ value, onCommit: onChange, delay });
  return (
    <textarea
      {...props}
      value={field.localValue}
      onChange={field.onChange}
      onBlur={(e) => {
        field.onBlur();
        onBlur?.(e);
      }}
      onCompositionStart={field.onCompositionStart}
      onCompositionEnd={field.onCompositionEnd}
    />
  );
});
DebouncedTextarea.displayName = 'DebouncedTextarea';
