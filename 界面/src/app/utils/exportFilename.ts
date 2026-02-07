import { ResumeData } from '@/app/types/resume';

/**
 * 生成规范化的导出文件名
 * 格式：姓名_求职意向_简历.格式
 * 例如：李明_高级前端工程师_简历.pdf
 */
export function generateExportFilename(
  data: ResumeData,
  format: 'pdf' | 'png' | 'docx'
): string {
  const name = data.profile.name?.trim() || '简历';
  const title = data.profile.title?.trim();

  const parts = [name];
  if (title) {
    // 清理特殊字符，避免文件名非法
    parts.push(title.replace(/[\\/:*?"<>|]/g, ''));
  }
  parts.push('简历');

  return `${parts.join('_')}.${format}`;
}
