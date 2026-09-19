/**
 * 简历备份与恢复 —— 全应用**唯一**对用户可见的备份入口。
 *
 * 备份格式只有一种，导出与导入严格自洽（本文件写出的文件必须能被本文件读回）：
 *   ResumeX备份_YYYY-MM-DD.zip
 *   ├── state.json    { app:"ResumeX", formatVersion:1, exportedAt, state:{ resumes, activeResumeId } }
 *   ├── avatars/<简历id>.<jpg|png|webp>   照片（Blob 单独存 idb，备份必须带出，否则恢复后照片全丢）
 *   └── 说明.txt      给不懂技术的用户看的一句人话说明
 *
 * 读入时兼容两种历史写法（老版本 zip 里 state.json 是裸 state，没有 app 信封），
 * 但**写出**永远只用上面这一种格式。
 *
 * ⚠️ store/storage.ts 里还有一对 createResumeStorage().exportBackup()/importBackup()
 *    （纯 JSON、不含照片）。那是第二套真相，目前已无任何 UI 调用，等负责清理的同学删除；
 *    新增备份相关功能请一律走本文件，不要再回到那个 JSON 版本。
 */
import { get as idbGet, keys as idbKeys, del as idbDel } from 'idb-keyval';
import JSZip from 'jszip';
import { customStore, IDB_STORE_KEY } from '@/app/store/storage';
import { saveAvatar, isAvatarKey, resumeIdFromAvatarKey } from '@/app/store/avatar';
import { useResumeStore } from '@/app/store/useResumeStore';
import type { ResumeData } from '@/app/types/resume';

/** 备份文件扩展名（Dashboard 的 <input accept> 与提示文案都用它，避免两处说辞） */
export const BACKUP_EXTENSION = 'zip';
export const BACKUP_ACCEPT = `.zip`;

export const BACKUP_APP_MARK = 'ResumeX';
export const BACKUP_FORMAT_VERSION = 1;

// ---------------- 工具 ----------------

const MIME_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
};

function extFromMime(type: string): string {
  if (type.includes('png')) return 'png';
  if (type.includes('webp')) return 'webp';
  if (type.includes('gif')) return 'gif';
  return 'jpg';
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Electron 里 <a download> 会触发主进程的保存对话框，浏览器里直接下载；
  // 两种环境都必须留一点时间让下载真正开始，再释放 objectURL
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** 把 idb 里的裸 state / 老的 persist 信封统一成 { resumes, activeResumeId } */
function normalizeState(raw: unknown): { resumes: Record<string, ResumeData>; activeResumeId: string } | null {
  if (!raw || typeof raw !== 'object') return null;
  let obj = raw as Record<string, unknown>;
  // 新格式信封：{ app, formatVersion, state:{...} }；老 persist 信封：{ state:{...}, version }
  if ('state' in obj && obj.state && typeof obj.state === 'object') {
    obj = obj.state as Record<string, unknown>;
  }
  if (!obj.resumes || typeof obj.resumes !== 'object') return null;
  const resumes: Record<string, ResumeData> = {};
  for (const [id, value] of Object.entries(obj.resumes as Record<string, unknown>)) {
    if (value && typeof value === 'object') {
      // 修正 id 与 map key 不一致（手改过的备份 / 老数据）
      resumes[id] = { ...(value as object), id } as ResumeData;
    }
  }
  const activeRaw = typeof obj.activeResumeId === 'string' ? obj.activeResumeId : '';
  return {
    resumes,
    activeResumeId: resumes[activeRaw] ? activeRaw : (Object.keys(resumes)[0] ?? ''),
  };
}

// ---------------- 导出 ----------------

/**
 * 组装备份压缩包（不落盘、不下载），exportBackup 与测试共用。
 * 返回 null 表示本机没有简历可备份。
 */
export const buildBackupZip = async (): Promise<{ zip: JSZip; resumeCount: number; photoCount: number } | null> => {
  const raw = await idbGet(IDB_STORE_KEY, customStore);
  const state = normalizeState(raw);
  if (!state || Object.keys(state.resumes).length === 0) return null;

  const zip = new JSZip();
  zip.file(
    'state.json',
    JSON.stringify(
      {
        app: BACKUP_APP_MARK,
        formatVersion: BACKUP_FORMAT_VERSION,
        exportedAt: new Date().toISOString(),
        state,
      },
      null,
      2
    )
  );
  zip.file('说明.txt', '这是 ResumeX 导出的简历备份，请整体保存、不要修改里面的文件。\n恢复方式：打开 ResumeX → 简历列表右上角「设置」→「导入备份」→ 选择本文件。');

  // 照片：逐个从 idb 取出塞进 avatars/（没有照片的备份恢复出来会丢照片，所以必须在包里）
  // 注意：先转成 Uint8Array 再交给 JSZip —— 直接塞 Blob 时 jszip 依赖 FileReader，
  // 在非浏览器环境（测试/未来的 Node 端工具）会读取失败。
  const allKeys = await idbKeys(customStore);
  let photoCount = 0;
  for (const key of allKeys) {
    const k = String(key);
    if (!isAvatarKey(k)) continue;
    const resumeId = resumeIdFromAvatarKey(k);
    if (!resumeId) continue;
    const blob = await idbGet(k, customStore);
    if (blob instanceof Blob) {
      zip.file(`avatars/${resumeId}.${extFromMime(blob.type)}`, new Uint8Array(await blob.arrayBuffer()));
      photoCount += 1;
    }
  }

  return { zip, resumeCount: Object.keys(state.resumes).length, photoCount };
};

/** 导出备份（.zip，含照片） */
export const exportBackup = async (): Promise<{ success: boolean; message: string }> => {
  try {
    // 先把内存里的最新改动落盘，保证备份内容 == 用户当前看到的内容
    await useResumeStore.getState().flushSave();

    const built = await buildBackupZip();
    if (!built) return { success: false, message: '还没有简历可备份' };

    const out = await built.zip.generateAsync({ type: 'blob' });
    const date = new Date().toISOString().slice(0, 10);
    triggerDownload(out, `ResumeX备份_${date}.${BACKUP_EXTENSION}`);

    return {
      success: true,
      message: built.photoCount > 0
        ? `已导出 ${built.resumeCount} 份简历和 ${built.photoCount} 张照片`
        : `已导出 ${built.resumeCount} 份简历`,
    };
  } catch (error) {
    console.error('导出备份失败:', error);
    return { success: false, message: '备份没导出成功，请重试' };
  }
};

// ---------------- 导入 ----------------

/** 解析出来的备份内容（先解析给用户看，确认后才写入） */
export interface BackupContents {
  resumes: Record<string, ResumeData>;
  activeResumeId: string;
  /** 简历 id → 照片 Blob */
  avatars: Map<string, Blob>;
  resumeTitles: string[];
  exportedAt?: string;
}

export type BackupInspection =
  | { success: true; contents: BackupContents }
  | { success: false; message: string };

/** 备份来源：界面上永远是用户选的 File（.zip）；测试/工具里允许直接的字节 */
export type BackupInput = File | Blob | Uint8Array | ArrayBuffer;

/** 只做校验和解析，不写任何数据（用于「将覆盖现有 N 份简历」的确认弹窗） */
export const inspectBackup = async (file: BackupInput): Promise<BackupInspection> => {
  try {
    const zip = await JSZip.loadAsync(file);
    const stateFile = zip.file('state.json');
    if (!stateFile) {
      return { success: false, message: '这个压缩包里没有找到简历数据，请选择 ResumeX 导出的备份文件' };
    }
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(await stateFile.async('string'));
    } catch {
      return { success: false, message: '备份文件内容读不懂，可能已经损坏' };
    }
    const state = normalizeState(parsedJson);
    if (!state) {
      return { success: false, message: '备份文件里没有简历数据，或格式不是 ResumeX 备份' };
    }
    const ids = Object.keys(state.resumes);
    if (ids.length === 0) {
      return { success: false, message: '备份文件里没有简历' };
    }

    // 照片：avatars/<简历id>.<ext>
    const avatars = new Map<string, Blob>();
    const avatarDir = zip.folder('avatars');
    if (avatarDir) {
      for (const [name, entry] of Object.entries(avatarDir.files)) {
        if (entry.dir) continue;
        const base = name.split('/').pop() ?? '';
        const dot = base.lastIndexOf('.');
        if (dot <= 0) continue;
        const resumeId = base.slice(0, dot);
        const ext = base.slice(dot + 1).toLowerCase();
        if (!state.resumes[resumeId]) continue; // 照片对应的简历不在备份里
        const buf = await entry.async('arraybuffer');
        avatars.set(resumeId, new Blob([buf], { type: MIME_BY_EXT[ext] ?? 'image/jpeg' }));
      }
    }

    return {
      success: true,
      contents: {
        ...state,
        avatars,
        resumeTitles: ids.map((id) => state.resumes[id].title || '未命名简历'),
        exportedAt: typeof (parsedJson as { exportedAt?: unknown }).exportedAt === 'string'
          ? (parsedJson as { exportedAt: string }).exportedAt
          : undefined,
      },
    };
  } catch (error) {
    console.error('读取备份文件失败:', error);
    return { success: false, message: '这个文件打不开，请确认它是 ResumeX 导出的 .zip 备份' };
  }
};

/**
 * 写入已解析的备份：先写照片，再写内存 + 落盘，最后从磁盘重新读一遍（hydrate），
 * 保证「内存 / 磁盘 / 界面」三者一致（旧实现靠 500ms 后 reload，会冲掉刚导入的数据）。
 */
export const applyBackup = async (
  contents: BackupContents
): Promise<{ success: boolean; message: string }> => {
  try {
    const resumes: Record<string, ResumeData> = {};
    for (const [id, resume] of Object.entries(contents.resumes)) {
      const clone: ResumeData = JSON.parse(JSON.stringify(resume)) as ResumeData;
      const blob = contents.avatars.get(id);
      if (blob) {
        try {
          const key = await saveAvatar(id, blob);
          clone.profile = { ...(clone.profile ?? {}), avatar: key };
        } catch (e) {
          // 单张照片写失败不阻断整份恢复
          console.warn('[backup] 照片恢复失败，已跳过：', id, e);
        }
      }
      resumes[id] = clone;
    }

    const activeId = resumes[contents.activeResumeId] ? contents.activeResumeId : (Object.keys(resumes)[0] ?? '');

    // 1) 内存 → 2) 立即落盘 → 3) 从磁盘重新水合（三步内容一致，任何写入竞态都不会回退到旧数据）
    const write = async () => {
      useResumeStore.setState({ resumes, activeResumeId: activeId });
      const ok = await useResumeStore.getState().flushSave();
      await useResumeStore.getState().hydrate();
      return ok;
    };
    /** 内存与磁盘是否真的是刚导入的这批简历 */
    const landed = () => {
      const now = useResumeStore.getState().resumes;
      const ids = Object.keys(now);
      return ids.length === Object.keys(resumes).length && Object.keys(resumes).every((id) => !!now[id]);
    };

    const saved = await write();
    // 兜底：如果更早排队的某次写盘姗姗来迟把导入结果覆盖了，再权威地写一次；仍然不行就如实报错
    if (!landed() && !(await write())) return { success: false, message: '本机存储空间不足，导入没写进去' };
    if (!landed()) {
      return { success: false, message: '导入没有生效，请重试（你的旧数据可能还在，请先导出备份）' };
    }
    if (!saved) {
      return { success: false, message: '简历已读入，但保存到本机时失败：存储空间可能不足' };
    }
    return { success: true, message: `已导入 ${Object.keys(resumes).length} 份简历` };
  } catch (error) {
    console.error('导入备份失败:', error);
    return { success: false, message: '导入失败，请重试或换一个备份文件' };
  }
};

// ---------------- 恢复屏（数据损坏时的急救） ----------------

/**
 * 恢复屏专用（数据损坏时）：探测本机是否还读得到原始内容。
 * 读不到就返回 false，界面据此**不显示**导出按钮 —— 避免出现「已导出」这种骗人的提示。
 */
export const probeRescueData = async (): Promise<boolean> => {
  try {
    const raw = await idbGet(IDB_STORE_KEY, customStore);
    if (raw != null) return true;
    const keys = await idbKeys(customStore);
    return keys.some((k) => isAvatarKey(String(k)));
  } catch {
    return false;
  }
};

/**
 * 恢复屏专用：把本机**原样**内容（可能是半损坏的）打包下载，供用户自行留档或发给作者排查。
 * 注意：这个压缩包不是标准备份，不保证能导回 ResumeX。
 */
export const exportRescueArchive = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const raw = await idbGet(IDB_STORE_KEY, customStore);
    const allKeys = await idbKeys(customStore);
    const zip = new JSZip();
    zip.file(
      '原始数据.json',
      typeof raw === 'string' ? raw : JSON.stringify(raw ?? null, null, 2)
    );
    zip.file('说明.txt', '这是 ResumeX 在数据读取失败时导出的本机原始内容，仅用于留档或反馈问题，不能直接导入。');

    let photoCount = 0;
    for (const key of allKeys) {
      const k = String(key);
      if (!isAvatarKey(k)) continue;
      const resumeId = resumeIdFromAvatarKey(k);
      const blob = await idbGet(k, customStore);
      if (resumeId && blob instanceof Blob) {
        zip.file(`avatars/${resumeId}.${extFromMime(blob.type)}`, new Uint8Array(await blob.arrayBuffer()));
        photoCount += 1;
      }
    }

    const out = await zip.generateAsync({ type: 'blob' });
    triggerDownload(out, `ResumeX原始数据_${new Date().toISOString().slice(0, 10)}.${BACKUP_EXTENSION}`);
    return {
      success: true,
      message: photoCount > 0
        ? `已保存原始数据（含 ${photoCount} 张照片），请到下载目录查看`
        : '已保存原始数据，请到下载目录查看',
    };
  } catch (error) {
    console.error('导出原始数据失败:', error);
    return { success: false, message: '没能导出，请重试' };
  }
};

// ---------------- 清空 ----------------

/** 清空全部数据（简历 state + 照片 blob） */
export const clearAllData = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const { clearAllStoredData } = await import('@/app/store/storage');
    await clearAllStoredData();

    // 照片是独立 key，clearAllStoredData 不会碰它们 —— 在这里一起删掉，避免留下孤儿数据
    try {
      const allKeys = await idbKeys(customStore);
      for (const key of allKeys) {
        const k = String(key);
        if (isAvatarKey(k)) await idbDel(k, customStore);
      }
    } catch (e) {
      console.warn('[backup] 清理照片失败：', e);
    }

    try {
      localStorage.removeItem('hasOnboarded');
    } catch {
      // 浏览器隐私模式下 localStorage 可能不可用，忽略
    }
    useResumeStore.setState({ resumes: {}, activeResumeId: '' });
    await useResumeStore.getState().flushSave();
    return { success: true, message: '本机上的简历已全部删除' };
  } catch (error) {
    console.error('清空数据失败:', error);
    return { success: false, message: '删除失败，请重试' };
  }
};
