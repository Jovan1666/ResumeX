/**
 * 简历数据备份与恢复工具
 */

// 与 store 中的持久化 key 保持一致，集中管理
const STORAGE_KEY = 'resume-storage';

// 导出数据为JSON文件
export const exportBackup = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
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

// 验证备份数据格式（增强版 - 检查关键字段完整性）
const validateBackupData = (data: unknown): boolean => {
  try {
    if (!data || typeof data !== 'object') return false;
    const obj = data as Record<string, unknown>;
    if (!obj.state || typeof obj.state !== 'object') return false;
    const state = obj.state as Record<string, unknown>;
    if (!state.resumes || typeof state.resumes !== 'object') return false;

    const resumes = state.resumes as Record<string, Record<string, unknown>>;
    const resumeIds = Object.keys(resumes);
    
    // 至少有一份简历
    if (resumeIds.length === 0) return false;

    for (const id in resumes) {
      const resume = resumes[id];
      // 检查核心字段存在性
      if (!resume.id || !resume.profile || !resume.modules) return false;
      
      // 检查 profile 基本结构
      const profile = resume.profile as Record<string, unknown>;
      if (typeof profile !== 'object' || profile === null) return false;
      if (typeof profile.name !== 'string') return false;
      
      // 检查 modules 是数组
      if (!Array.isArray(resume.modules)) return false;
      
      // 检查每个 module 的基本结构
      for (const mod of resume.modules as Record<string, unknown>[]) {
        if (!mod.id || typeof mod.type !== 'string' || !Array.isArray(mod.items)) {
          return false;
        }
      }
    }

    // 检查 activeResumeId 指向有效简历
    if (state.activeResumeId && !resumes[state.activeResumeId as string]) {
      // 自动修复：设为第一个可用的简历 ID
      (state as Record<string, unknown>).activeResumeId = resumeIds[0];
    }

    return true;
  } catch {
    return false;
  }
};

// 从JSON文件导入数据
export const importBackup = (file: File): Promise<{ success: boolean; message: string }> => {
  return new Promise((resolve) => {
    try {
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

        // 保存到 localStorage（使用校验后的 data 而非原始 content，
        // 因为 validateBackupData 可能修复了 activeResumeId 等字段）
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        
        // 自动刷新页面以确保 Zustand store 与 localStorage 同步
        resolve({ success: true, message: '数据恢复成功，页面即将刷新' });
        setTimeout(() => window.location.reload(), 500);
      } catch (error) {
        console.error('导入备份失败:', error);
        resolve({ success: false, message: '文件解析失败，请确认文件格式' });
      }
    };

    reader.onerror = () => {
      resolve({ success: false, message: '文件读取失败，请重试' });
    };

    reader.readAsText(file);
    } catch (error) {
      // readAsText 可能在特殊情况下同步抛出异常（如无效 Blob）
      console.error('文件读取异常:', error);
      resolve({ success: false, message: '文件读取异常，请重试' });
    }
  });
};

// 清空所有数据
export const clearAllData = (): { success: boolean; message: string } => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('hasOnboarded');
    // 自动刷新页面以确保状态同步
    setTimeout(() => window.location.reload(), 500);
    return { success: true, message: '数据已清空，页面即将刷新' };
  } catch (error) {
    console.error('清空数据失败:', error);
    return { success: false, message: '操作失败，请重试' };
  }
};
