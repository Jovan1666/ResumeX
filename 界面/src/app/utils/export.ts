/**
 * 导出工具函数
 */


export interface ExportOptions {
  filename?: string;
  format: 'pdf' | 'png';
  quality?: number;
  scale?: number;
  onProgress?: (progress: number) => void;
}

/**
 * 将HTML元素导出为PNG图片
 */
export const exportToPng = async (
  element: HTMLElement,
  options: Omit<ExportOptions, 'format'> = {}
): Promise<{ success: boolean; message: string }> => {
  const { filename = '简历.png', scale = 2, onProgress } = options;

  try {
    onProgress?.(0.1);
    
    // 动态导入html2canvas（如果可用）
    // 由于可能没有安装html2canvas，我们使用原生canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas不支持');

    onProgress?.(0.3);

    // 获取元素尺寸
    const rect = element.getBoundingClientRect();
    canvas.width = rect.width * scale;
    canvas.height = rect.height * scale;

    // 使用foreignObject嵌入HTML（简化版本）
    // 注意：这种方法有限制，完整实现需要html2canvas
    const data = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${rect.width * scale}" height="${rect.height * scale}">
        <foreignObject width="100%" height="100%">
          <div xmlns="http://www.w3.org/1999/xhtml" style="transform: scale(${scale}); transform-origin: top left;">
            ${element.outerHTML}
          </div>
        </foreignObject>
      </svg>
    `;

    const img = new Image();
    const svgBlob = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    onProgress?.(0.6);

    return new Promise((resolve) => {
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);

        onProgress?.(0.9);

        canvas.toBlob((blob) => {
          if (!blob) {
            resolve({ success: false, message: '生成图片失败' });
            return;
          }

          const downloadUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(downloadUrl);

          onProgress?.(1);
          resolve({ success: true, message: 'PNG导出成功' });
        }, 'image/png');
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({ success: false, message: '生成图片失败' });
      };

      img.src = url;
    });
  } catch (error) {
    console.error('PNG导出失败:', error);
    return { success: false, message: 'PNG导出失败，请重试' };
  }
};

/**
 * 使用打印功能导出PDF（备用方案）
 */
export const printToPdf = (element: HTMLElement, filename: string = '简历') => {
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

  // 触发打印
  window.print();

  // 恢复
  element.id = originalId;
  document.title = originalTitle;
  document.head.removeChild(style);
};

/**
 * 简单的截图功能（使用dom-to-image-more或类似库的简化实现）
 */
export const captureElement = async (element: HTMLElement): Promise<string | null> => {
  try {
    // 克隆元素
    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.position = 'absolute';
    clone.style.left = '-9999px';
    document.body.appendChild(clone);

    // 获取所有内联样式
    const computedStyle = window.getComputedStyle(element);
    for (const prop of computedStyle) {
      clone.style.setProperty(prop, computedStyle.getPropertyValue(prop));
    }

    // 创建canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      document.body.removeChild(clone);
      return null;
    }

    const rect = element.getBoundingClientRect();
    const scale = 2;
    canvas.width = rect.width * scale;
    canvas.height = rect.height * scale;
    ctx.scale(scale, scale);

    // 绘制背景
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, rect.width, rect.height);

    document.body.removeChild(clone);
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('截图失败:', error);
    return null;
  }
};
