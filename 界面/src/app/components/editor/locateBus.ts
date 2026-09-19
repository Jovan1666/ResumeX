/**
 * 「去填写」定位总线（编辑器内部，不碰 store）
 *
 * 诊断面板 / 左栏步骤条 只描述要定位到哪里，具体由拥有该区域状态的组件执行：
 * - kind: 'basic' / 'field' → BasicInfoForm（负责展开折叠、聚焦输入框）
 * - kind: 'module' / 'item' / 'add-module' → Sidebar + ModuleList（负责展开模块、滚动、高亮）
 */

export type LocateTarget =
  | { kind: 'basic' }
  | { kind: 'field'; fieldId: string }
  | { kind: 'module'; moduleId: string }
  | { kind: 'item'; moduleId: string; itemId: string }
  | { kind: 'add-module' };

type Listener = (target: LocateTarget) => void;

const listeners = new Set<Listener>();

/** 订阅定位请求，返回取消函数 */
export function subscribeLocate(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** 发起定位请求（同步广播给已挂载的订阅者） */
export function requestLocate(target: LocateTarget): void {
  listeners.forEach((l) => l(target));
}

/** 给目标元素加一圈临时高亮（2 秒后自动消失） */
export function flashHighlight(el: HTMLElement | null | undefined): void {
  if (!el) return;
  el.classList.add('ring-2', 'ring-blue-400', 'ring-offset-2', 'transition-all');
  setTimeout(() => el.classList.remove('ring-2', 'ring-blue-400', 'ring-offset-2'), 2000);
}
