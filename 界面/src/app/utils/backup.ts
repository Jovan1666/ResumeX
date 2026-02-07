/**
 * 简历数据备份与恢复工具
 */

// 导出数据为JSON文件
export const exportBackup = () => {
  try {
    const data = localStorage.getItem('resume-storage');
    if (!data) {
      throw new Error('没有找到简历数据');
    }

    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    
    a.href = url;
    a.download = `简历备份_${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return { success: true, message: '备份文件已下载' };
  } catch (error) {
    console.error('导出备份失败:', error);
    return { success: false, message: '导出失败，请重试' };
  }
};

// 验证备份数据格式
const validateBackupData = (data: unknown): boolean => {
  try {
    // 检查基本结构
    if (!data || typeof data !== 'object') return false;
    const obj = data as Record<string, unknown>;
    if (!obj.state || typeof obj.state !== 'object') return false;
    const state = obj.state as Record<string, unknown>;
    if (!state.resumes || typeof state.resumes !== 'object') return false;

    // 检查每份简历的基本结构
    const resumes = state.resumes as Record<string, Record<string, unknown>>;
    for (const id in resumes) {
      const resume = resumes[id];
      if (!resume.id || !resume.profile || !resume.modules) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
};

// 从JSON文件导入数据
export const importBackup = (file: File): Promise<{ success: boolean; message: string }> => {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        // 验证数据格式
        if (!validateBackupData(data)) {
          resolve({ success: false, message: '文件格式无效，请选择正确的备份文件' });
          return;
        }

        // 保存到localStorage
        localStorage.setItem('resume-storage', content);
        
        resolve({ success: true, message: '数据恢复成功，页面将刷新' });
      } catch (error) {
        console.error('导入备份失败:', error);
        resolve({ success: false, message: '文件解析失败，请确认文件格式' });
      }
    };

    reader.onerror = () => {
      resolve({ success: false, message: '文件读取失败，请重试' });
    };

    reader.readAsText(file);
  });
};

// 清空所有数据
export const clearAllData = (): { success: boolean; message: string } => {
  try {
    localStorage.removeItem('resume-storage');
    localStorage.removeItem('hasOnboarded');
    return { success: true, message: '数据已清空，页面将刷新' };
  } catch (error) {
    console.error('清空数据失败:', error);
    return { success: false, message: '操作失败，请重试' };
  }
};
