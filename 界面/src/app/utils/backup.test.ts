/**
 * 备份链路回归测试（P0：曾经「自己导出的备份导不回来」）。
 * 覆盖：备份包含照片 → 同一个文件能被解析回来 → 能写回本机并恢复照片 → 坏文件不动现有数据。
 */
import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { get as idbGet } from 'idb-keyval';
import { customStore, IDB_STORE_KEY } from '@/app/store/storage';
import { loadAvatar, saveAvatar, avatarKeyFor } from '@/app/store/avatar';
import { useResumeStore } from '@/app/store/useResumeStore';
import { buildBackupZip, inspectBackup, applyBackup, clearAllData } from './backup';
import type { ResumeData } from '@/app/types/resume';

// vitest 的 node 环境没有 localStorage：给一个内存实现
const memStorage = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (k: string) => memStorage.get(k) ?? null,
    setItem: (k: string, v: string) => { memStorage.set(k, v); },
    removeItem: (k: string) => { memStorage.delete(k); },
    clear: () => memStorage.clear(),
  },
  configurable: true,
});

const photo = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

const sampleResume = (id: string, title: string): ResumeData => ({
  id,
  title,
  lastModified: 1,
  template: 'classic',
  settings: {
    themeColor: 'campus', fontFamily: 'sans', fontSizeScale: 1,
    lineHeight: 'standard', pageMargin: 'standard', language: 'zh',
  },
  profile: { name: '', title: '', email: '', phone: '', location: '', avatar: avatarKeyFor(id), customFields: [] },
  modules: [],
});

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function seedMachine(): Promise<void> {
  useResumeStore.setState({
    resumes: { r1: sampleResume('r1', '校招简历'), r2: sampleResume('r2', '社招简历') },
    activeResumeId: 'r2',
  });
  await saveAvatar('r1', new Blob([photo], { type: 'image/png' }));
  await settleDisk(2);
}

/**
 * 反复权威写盘直到磁盘内容稳定为 expect 份简历。
 * zustand persist 的写盘晚于调用点（前一步 clearAllData 会留下一次迟到的写入），
 * 所以每轮都从内存重写一遍再检查；最后一轮之后没有别的写入者，必然收敛。
 */
async function settleDisk(expect: number): Promise<void> {
  for (let i = 0; i < 40; i++) {
    await useResumeStore.getState().flushSave();
    await sleep(20);
    const raw = (await idbGet(IDB_STORE_KEY, customStore)) as { resumes?: Record<string, unknown> } | undefined;
    if (Object.keys(raw?.resumes ?? {}).length === expect) return;
  }
  throw new Error(`本机磁盘简历数没能稳定在 ${expect} 份`);
}

/** 备份文件的字节（node 环境没有 FileReader，用 uint8array 而不是 blob） */
async function backupBytes(): Promise<Uint8Array> {
  const built = await buildBackupZip();
  expect(built).not.toBeNull();
  return (await built!.zip.generateAsync({ type: 'uint8array' })) as Uint8Array;
}

describe('备份：导出 → 导入 必须自洽', () => {
  beforeEach(async () => {
    await clearAllData();
    await seedMachine();
  });

  it('备份包含全部简历与照片', async () => {
    const built = await buildBackupZip();
    expect(built).not.toBeNull();
    expect(built!.resumeCount).toBe(2);
    expect(built!.photoCount).toBe(1);
    expect(Object.keys(built!.zip.files)).toContain('avatars/r1.png');
  });

  it('导出的文件能原样读回来（含照片字节）', async () => {
    const inspected = await inspectBackup(await backupBytes());
    expect(inspected.success).toBe(true);
    if (!inspected.success) return;

    expect(inspected.contents.resumeTitles.slice().sort()).toEqual(['校招简历', '社招简历']);
    expect(inspected.contents.activeResumeId).toBe('r2');
    const restored = inspected.contents.avatars.get('r1');
    expect(restored).toBeDefined();
    expect(restored!.type).toBe('image/png');
    expect(new Uint8Array(await restored!.arrayBuffer())).toEqual(photo);
  });

  it('坏文件被拒绝，不碰现有数据', async () => {
    const before = await inspectBackup(new Uint8Array([1, 2, 3, 4]));
    expect(before.success).toBe(false);
    expect(Object.keys(useResumeStore.getState().resumes)).toHaveLength(2);
  });

  it('导入会覆盖本机数据并恢复照片', async () => {
    const inspected = await inspectBackup(await backupBytes());
    expect(inspected.success).toBe(true);
    if (!inspected.success) return;

    // 先把本机清空，模拟换电脑
    await clearAllData();
    expect(Object.keys(useResumeStore.getState().resumes)).toHaveLength(0);

    const applied = await applyBackup(inspected.contents);
    expect(applied.success).toBe(true);
    await settleDisk(2);

    const after = useResumeStore.getState().resumes;
    expect(Object.keys(after)).toHaveLength(2);
    expect(after.r1.title).toBe('校招简历');
    expect(after.r1.profile.avatar).toBe(avatarKeyFor('r1'));

    const blobBack = await loadAvatar(avatarKeyFor('r1'));
    expect(blobBack).not.toBeNull();
    expect(new Uint8Array(await blobBack!.arrayBuffer())).toEqual(photo);
  });
});
