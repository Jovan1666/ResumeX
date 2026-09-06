import { useEffect, useState } from 'react';
import { isAvatarKey, loadAvatar } from '@/app/store/avatar';

/**
 * 把头像 key（idb:avatar:<resumeId>）解析为 blob: URL。
 * - 通过 hook 管理生命周期，卸载时 revokeObjectURL
 * - 模板与表单只允许用这个 hook，禁止直接 src={profile.avatar}
 */
export function useAvatarObjectUrl(avatarKey: string | undefined | null): string {
  const [url, setUrl] = useState<string>('');

  useEffect(() => {
    if (!avatarKey || !isAvatarKey(avatarKey)) {
      setUrl('');
      return;
    }
    let cancelled = false;
    let objectUrl: string | null = null;

    loadAvatar(avatarKey)
      .then((blob) => {
        if (cancelled) return;
        if (!blob) {
          setUrl('');
          return;
        }
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch((e) => {
        console.error('[useAvatarObjectUrl] 加载照片失败：', e);
        if (!cancelled) setUrl('');
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [avatarKey]);

  return url;
}
