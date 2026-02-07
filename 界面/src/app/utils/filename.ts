import { ResumeProfile } from '@/app/types/resume';

/**
 * 生成专业的导出文件名
 * 格式：姓名_求职意向_简历.格式
 * 如果求职意向为空：姓名_简历.格式
 * 如果姓名也为空：简历_日期.格式
 */
export function generateExportFilename(
  profile: ResumeProfile,
  format: 'pdf' | 'png' | 'docx'
): string {
  const name = profile.name?.trim();
  const title = profile.title?.trim();

  let filename: string;

  if (name && title) {
    filename = `${name}_${title}_简历`;
  } else if (name) {
    filename = `${name}_简历`;
  } else {
    const date = new Date().toLocaleDateString('zh-CN').replace(/\//g, '-');
    filename = `简历_${date}`;
  }

  // 去除文件名中的非法字符
  filename = filename.replace(/[\\/:*?"<>|]/g, '_');

  return `${filename}.${format}`;
}
