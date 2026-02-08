import { describe, expect, it } from 'vitest';
import { generateExportFilename } from './exportFilename';
import type { ResumeData } from '@/app/types/resume';

const mockResumeData: ResumeData = {
  id: 'r1',
  title: '我的简历',
  lastModified: Date.now(),
  template: 'professional',
  profile: {
    name: '张/三',
    title: '前端:工程师',
    phone: '',
    email: '',
    location: '',
  },
  modules: [],
  settings: {
    themeColor: 'tech-orange',
    fontFamily: 'sans',
    fontSizeScale: 1,
    lineHeight: 'standard',
    pageMargin: 'standard',
    language: 'zh',
  },
};

describe('generateExportFilename', () => {
  it('removes invalid filename characters from name and title', () => {
    const filename = generateExportFilename(mockResumeData, 'pdf');

    expect(filename).toBe('张三_前端工程师_简历.pdf');
  });
});
