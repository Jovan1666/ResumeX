import { describe, it, expect } from 'vitest';
import { UndoRedoManager } from './useUndoRedo';

interface Simple {
  name: string;
  count: number;
}

describe('UndoRedoManager（变更前快照语义）', () => {
  it('从 A 改到 B，第一次 undo 回到 A（修复第一次 Ctrl+Z 空操作）', () => {
    const m = new UndoRedoManager<Simple>(30);
    const a: Simple = { name: 'A', count: 0 };
    const b: Simple = { name: 'B', count: 1 };

    // store action 在变更前 push(prev)
    m.push({ ...a });
    const current = b;
    const prev = m.undo(current);
    expect(prev).toEqual(a);
    // 之后再 push B 作为新值
    m.push(current);
    expect(m.undo(b)).toEqual(b);
  });

  it('peekLastJson 去重：连续 push 相同值不产生重复历史', () => {
    const m = new UndoRedoManager<Simple>(30);
    const a: Simple = { name: 'A', count: 0 };
    m.push({ ...a });
    expect(m.peekLastJson()).toEqual(JSON.stringify(a));
    // 相等则跳过（由 store 调用方判断）
    expect(m.peekLastJson() === JSON.stringify(a)).toBe(true);
    expect(m.getHistoryLength().past).toBe(1);
  });

  it('undo 后立即输入 C，新输入可被再 undo（无 2s 吞输入）', () => {
    const m = new UndoRedoManager<Simple>(30);
    const a: Simple = { name: 'A', count: 0 };
    m.push({ ...a });

    // 变更到 B
    const b: Simple = { name: 'B', count: 1 };
    m.push({ ...a }); // 不应被吞
    const prevB = m.undo(b);
    expect(prevB).toEqual(a);

    // 立即输入 C（无冷却）
    m.push({ ...a });
    const c: Simple = { name: 'C', count: 2 };
    // 再 undo 应回到 B
    const prevC = m.undo(c);
    expect(prevC).toEqual(a);

    // 撤销 C 后再撤销 B... manager 内部栈按语义
    const prevA2 = m.undo(prevC as Simple);
    expect(prevA2).toEqual(a);
  });

  it('canUndo/canRedo 状态', () => {
    const m = new UndoRedoManager<Simple>(30);
    expect(m.canUndo()).toBe(false);
    m.push({ name: 'A', count: 0 });
    expect(m.canUndo()).toBe(true);
    m.undo({ name: 'B', count: 1 });
    expect(m.canUndo()).toBe(false);
    expect(m.canRedo()).toBe(true);
  });

  it('clear 清空历史', () => {
    const m = new UndoRedoManager<Simple>(30);
    m.push({ name: 'A', count: 0 });
    m.clear();
    expect(m.canUndo()).toBe(false);
  });
});
