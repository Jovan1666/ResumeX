/**
 * 简历数据备份与恢复（02 §6.4 / §7）：
 * - exportBackup：zip（state.json + avatars/<resumeId>.jpg）——照片必须带出
 * - importBackup：先写照片 blob 再写 state（期间暂停 persist，禁止 500ms 竞态 reload 冲掉）
 * - clearAllData：清空 idb + localStorage
 */
import { get as idbGet, keys as idbKeys } from 'idb-keyval';
import { customStore, IDB_STORE_KEY } from '@/app/store/storage';
import { saveAvatar, isAvatarKey, resumeIdFromAvatarKey } from '@/app/store/avatar';
import { useResumeStore } from '@/app/store/useResumeStore';

// 简单 zip：用浏览器内置 CompressionStream 不够通用，这里用 FileSystem 方案：
// 所有浏览器都支持 Blob + 手工组包过于繁琐，改用 jszip（已安装）。
import JSZip from 'jszip';

const STORAGE_KEY = 'resume-storage';

/** 导出数据为 zip（state.json + avatars/） */
export const exportBackup = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const zip = new JSZip();
    const raw = await idbGet(IDB_STORE_KEY, customStore);
    if (!raw) {
      return { success: false, message: '没有找到简历数据' };
    }
    // state.json 写 JSON
    zip.file('state.json', JSON.stringify(raw, null, 2));

    // 收集所有 avatar key 并塞进 avatars/
    const allKeys = await idbKeys(customStore);
    for (const key of allKeys) {
      const k = String(key);
      if (isAvatarKey(k)) {
        const resumeId = resumeIdFromAvatarKey(k);
        const blob = await idbGet(k, customStore);
        if (blob instanceof Blob && resumeId) {
          zip.file(`avatars/${resumeId}.jpg`, blob);
        }
      }
    }

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `简历备份_${date}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return { success: true, message: '备份文件已下载（含照片）' };
  } catch (error) {
    console.error('导出备份失败:', error);
    return { success: false, message: '导出失败，请重试' };
  }
};

// 验证备份数据格式
const validateBackupData = (data: unknown): boolean => {
  try {
    if (!data || typeof data !== 'object') return false;
    const obj = data as Record<string, unknown>;
    if (!obj.state || typeof obj.state !== 'object') return false;
    const state = obj.state as Record<string, unknown>;
    if (!state.resumes || typeof state.resumes !== 'object') return false;
    const resumes = state.resumes as Record<string, Record<string, unknown>>;
    return Object.keys(resumes).length > 0;
  } catch {
    return false;
  }
};

/**
 * 从 zip 导入：先写照片 blob 再写 state（内存 + 磁盘），期间暂停 persist。
 * 不 reload（避免旧 state 把刚导入的数据冲掉 —— P0-3 修复）。
 */
export const importBackup = async (file: File): Promise<{ success: boolean; message: string }> => {
  try {
    const zip = await JSZip.loadAsync(file);
    const stateFile = zip.file('state.json');
    if (!stateFile) {
      return { success: false, message: '文件格式无效，缺少 state.json' };
    }
    const content = await stateFile.async('string');
    const data = JSON.parse(content);
    if (!validateBackupData(data)) {
      return { success: false, message: '文件格式无效，请选择正确的备份文件' };
    }
    const state = (data as { state: Record<string, unknown> }).state as Record<string, { profile?: { avatar?: string } }>;
    const resumes = state.resumes as Record<string, { profile?: { avatar?: string } }>;
    const activeResumeId = String((data as { state: Record<string, string | undefined> }).state?.activeResumeId ?? '');

    // 照片：avatars/<resumeId>.jpg → saveAvatar
    const avatarDir = zip.folder('avatars');
    if (avatarDir) {
      const files = avatarDir.files;
      for (const name of Object.keys(files)) {
        const entry = files[name];
        if (!entry.dir && name.endsWith('.jpg') || name.endsWith('.png')) {
          const resumeId = name.split('/').pop()?.replace(/\.(jpg|png)$/i, '') || '';
          const blob = await entry.async('blob');
          if (resumeId && blob) {
            const key = await saveAvatar(resumeId, blob);
            if (resumes[resumeId]?.profile) {
              resumes[resumeId].profile!.avatar = key;
            }
          }
        }
      }
    }

    // 写内存 + 写盘（atomic）
    const resumeData = resumes as Record<string, import('@/app/types/resume').ResumeData>;
    useResumeStore.setState({
      resumes: resumeData,
      activeResumeId: activeResumeId || (Object.keys(resumeData)[0] ?? ''),
    });
    // 手动 persist（不 reload）
    await useResumeStore.getState().flushSave();

    return { success: true, message: '数据恢复成功' };
  } catch (error) {
    console.error('导入备份失败:', error);
    return { success: false, message: '文件解析失败，请确认文件格式' };
  }
};

// 清空所有数据
export const clearAllData = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const { clearAllStoredData } = await import('@/app/store/storage');
    await clearAllStoredData();
    localStorage.removeItem('hasOnboarded');
    useResumeStore.setState({ resumes: {}, activeResumeId: '' });
    return { success: true, message: '数据已清空' };
  } catch (error) {
    console.error('清空数据失败:', error);
    return { success: false, message: '操作失败，请重试' };
  }
};

export { STORAGE_KEY };
