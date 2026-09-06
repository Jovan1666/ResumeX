/**
 * 照片 Blob 存储：头像以 Blob 单独存 IndexedDB（resumex-db / avatars），
 * profile.avatar 只存 key（如 idb:avatar:<resumeId>），禁止把 5MB dataURL 塞进 JSON。
 */

import { get, set, del } from 'idb-keyval';
import { customStore } from './storage';

// avatar key 前缀（与 localStorage 旧格式区分）
const AVATAR_PREFIX = 'idb:avatar:';

/** 生成 resumex 简历对象的头像存储 key */
export function avatarKeyFor(resumeId: string): string {
  return `${AVATAR_PREFIX}${resumeId}`;
}

/** 判断 profile.avatar 是否为新格式 key */
export function isAvatarKey(value: string | undefined | null): boolean {
  return !!value && value.startsWith(AVATAR_PREFIX);
}

/** 解析 key 得到 resumeId */
export function resumeIdFromAvatarKey(key: string): string | null {
  if (!key.startsWith(AVATAR_PREFIX)) return null;
  return key.slice(AVATAR_PREFIX.length);
}

export async function saveAvatar(resumeId: string, blob: Blob): Promise<string> {
  const key = avatarKeyFor(resumeId);
  await set(key, blob, customStore);
  return key;
}

export async function loadAvatar(key: string): Promise<Blob | null> {
  if (!isAvatarKey(key)) return null;
  const blob = await get(key, customStore);
  return blob instanceof Blob ? blob : null;
}

export async function deleteAvatar(key: string): Promise<void> {
  if (!isAvatarKey(key)) return;
  await del(key, customStore);
}

/** 复制照片：duplicateResume 用（旧 key 里的 blob 复制到新 key） */
export async function cloneAvatar(sourceKey: string, targetResumeId: string): Promise<string | undefined> {
  if (!isAvatarKey(sourceKey)) return undefined;
  const blob = await loadAvatar(sourceKey);
  if (!blob) return undefined;
  return await saveAvatar(targetResumeId, blob);
}

/**
 * 把旧 dataURL 迁移为 Blob：
 * - 长度 > 20KB 的 dataURL：丢掉（撑爆存储），返回 null 并提示
 * - 合法 dataURL：转 Blob 存 idb，返回新 key
 */
export async function migrateDataUrlAvatar(avatar: string | undefined | null, resumeId: string): Promise<string | null> {
  if (!avatar) return null;
  if (isAvatarKey(avatar)) return avatar; // 已是新格式
  if (!avatar.startsWith('data:')) return null;
  if (avatar.length > 20 * 1024) {
    console.warn('[avatar] 旧 dataURL 超过 20KB，迁移时丢弃', avatar.length);
    return null;
  }
  try {
    const blob = dataUrlToBlob(avatar);
    if (!blob) return null;
    return await saveAvatar(resumeId, blob);
  } catch (e) {
    console.error('[avatar] 迁移 dataURL 失败：', e);
    return null;
  }
}

export function dataUrlToBlob(dataUrl: string): Blob | null {
  const match = /^data:([^;]+);base64,(.*)$/s.exec(dataUrl);
  if (!match) return null;
  try {
    const binary = atob(match[2]);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: match[1] || 'image/jpeg' });
  } catch {
    return null;
  }
}
