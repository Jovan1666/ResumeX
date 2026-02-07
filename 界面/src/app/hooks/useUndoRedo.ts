import { useState, useCallback, useRef, useMemo } from 'react';

interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

interface UseUndoRedoReturn<T> {
  state: T;
  setState: (newState: T, skipHistory?: boolean) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  clearHistory: () => void;
}

const MAX_HISTORY_LENGTH = 50;

export function useUndoRedo<T>(initialState: T): UseUndoRedoReturn<T> {
  const [history, setHistory] = useState<HistoryState<T>>({
    past: [],
    present: initialState,
    future: []
  });

  const skipHistoryRef = useRef(false);

  const setState = useCallback((newState: T, skipHistory = false) => {
    if (skipHistory) {
      skipHistoryRef.current = true;
    }

    setHistory(prevHistory => {
      if (skipHistoryRef.current) {
        skipHistoryRef.current = false;
        return {
          ...prevHistory,
          present: newState
        };
      }

      // 引用相等快速判断（如果是同一对象则直接跳过）
      if (prevHistory.present === newState) {
        return prevHistory;
      }

      const newPast = [...prevHistory.past, prevHistory.present];
      
      // 限制历史记录长度
      if (newPast.length > MAX_HISTORY_LENGTH) {
        newPast.shift();
      }

      return {
        past: newPast,
        present: newState,
        future: [] // 清空重做历史
      };
    });
  }, []);

  const undo = useCallback(() => {
    setHistory(prevHistory => {
      if (prevHistory.past.length === 0) {
        return prevHistory;
      }

      const previous = prevHistory.past[prevHistory.past.length - 1];
      const newPast = prevHistory.past.slice(0, -1);

      return {
        past: newPast,
        present: previous,
        future: [prevHistory.present, ...prevHistory.future]
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory(prevHistory => {
      if (prevHistory.future.length === 0) {
        return prevHistory;
      }

      const next = prevHistory.future[0];
      const newFuture = prevHistory.future.slice(1);

      return {
        past: [...prevHistory.past, prevHistory.present],
        present: next,
        future: newFuture
      };
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory(prevHistory => ({
      past: [],
      present: prevHistory.present,
      future: []
    }));
  }, []);

  return {
    state: history.present,
    setState,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    clearHistory
  };
}

// 简化版：直接在store中使用的撤销重做管理器
export class UndoRedoManager<T> {
  private past: T[] = [];
  private future: T[] = [];
  private maxLength: number;

  constructor(maxLength = MAX_HISTORY_LENGTH) {
    this.maxLength = maxLength;
  }

  push(state: T): void {
    this.past.push(state);
    if (this.past.length > this.maxLength) {
      this.past.shift();
    }
    this.future = [];
  }

  undo(currentState: T): T | null {
    if (this.past.length === 0) return null;
    
    const previous = this.past.pop()!;
    this.future.unshift(currentState);
    return previous;
  }

  redo(currentState: T): T | null {
    if (this.future.length === 0) return null;
    
    const next = this.future.shift()!;
    this.past.push(currentState);
    return next;
  }

  canUndo(): boolean {
    return this.past.length > 0;
  }

  canRedo(): boolean {
    return this.future.length > 0;
  }

  clear(): void {
    this.past = [];
    this.future = [];
  }

  getHistoryLength(): { past: number; future: number } {
    return { past: this.past.length, future: this.future.length };
  }
}
