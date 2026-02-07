/**
 * 导出工具函数 - 使用 html-to-image 库实现高质量导出
 */

import { toPng } from 'html-to-image';

export interface ExportOptions {
  filename?: string;
  format: 'pdf' | 'png';
  quality?: number;
  scale?: number;
  onProgress?: (progress: number) => void;
}

/**
 * 将HTML元素导出为PNG图片（使用 html-to-image 实现完整样式捕获）
 */
export const exportToPng = async (
  element: HTMLElement,
  options: Omit<ExportOptions, 'format'> = {}
): Promise<{ success: boolean; message: string }> => {
  const { filename = '简历.png', scale = 2, onProgress } = options;

  try {
    onProgress?.(0.1);

    // 使用 html-to-image 库生成高质量 PNG
    const dataUrl = await toPng(element, {
      pixelRatio: scale,
      cacheBust: true,
      backgroundColor: '#ffffff',
      // 过滤掉非必要元素（如隐藏的辅助元素）
      filter: (node: HTMLElement) => {
        // 排除打印辅助类
        if (node.classList?.contains?.('no-export')) return false;
        return true;
      },
    });

    onProgress?.(0.7);

    // 将 Data URL 转换为 Blob 并下载
    const response = await fetch(dataUrl);
    const blob = await response.blob();

    if (!blob || blob.size === 0) {
      return { success: false, message: '生成图片失败' };
    }

    const downloadUrl = URL.createObjectURL(blob);
    try {
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      URL.revokeObjectURL(downloadUrl);
    }

    onProgress?.(1);
    return { success: true, message: 'PNG导出成功' };
  } catch (error) {
    console.error('PNG导出失败:', error);
    return { success: false, message: 'PNG导出失败，请重试' };
  }
};

/**
 * 使用打印功能导出PDF（备用方案）
 */
let _isPrinting = false;

export const printToPdf = (element: HTMLElement, filename: string = '简历') => {
  // 防重入：避免快速多次调用导致 listener 堆积
  if (_isPrinting) return;
  _isPrinting = true;

  // 创建打印样式
  const style = document.createElement('style');
  style.innerHTML = `
    @media print {
      body * {
        visibility: hidden;
      }
      #print-content, #print-content * {
        visibility: visible;
      }
      #print-content {
        position: absolute;
        left: 0;
        top: 0;
        width: 210mm;
        min-height: 297mm;
      }
    }
  `;
  document.head.appendChild(style);

  // 设置打印元素ID
  const originalId = element.id;
  element.id = 'print-content';

  // 设置文档标题（会成为PDF文件名）
  const originalTitle = document.title;
  document.title = filename;

  // 监听 afterprint 事件来恢复状态（兼容异步打印对话框）
  const restoreState = () => {
    if (!_isPrinting) return; // 防止兜底 setTimeout 重复执行
    _isPrinting = false;
    element.id = originalId;
    document.title = originalTitle;
    if (style.parentNode) document.head.removeChild(style);
    window.removeEventListener('afterprint', restoreState);
  };
  window.addEventListener('afterprint', restoreState);

  // 触发打印
  window.print();

  // 兜底恢复（某些浏览器不触发 afterprint）
  setTimeout(restoreState, 5000);
};

/**
 * 截图功能（使用 html-to-image 实现正确截图）
 */
export const captureElement = async (element: HTMLElement): Promise<string | null> => {
  try {
    const dataUrl = await toPng(element, {
      pixelRatio: 2,
      cacheBust: true,
      backgroundColor: '#ffffff',
    });
    return dataUrl;
  } catch (error) {
    console.error('截图失败:', error);
    return null;
  }
};
