import React, { useState, memo } from 'react';
import { useResumeStore } from '@/app/store/useResumeStore';
import { User, ImageIcon, X, ChevronDown, ChevronRight, Upload, Crop } from 'lucide-react';
import { ImageCropper } from './ImageCropper';
import { ValidatedInput, ValidatedTextarea } from './ValidatedInput';
import { cn } from '@/app/lib/utils';
import { useToast } from '@/app/components/ui/toast';
import { useAvatarObjectUrl } from '@/app/hooks/useAvatarObjectUrl';
import { saveAvatar, deleteAvatar, isAvatarKey } from '@/app/store/avatar';

/**
 * 基本信息表单：
 * - 微信与网站分开（P1-7）
 * - 「更多信息」折叠：性别/出生年/政治面貌/籍贯/自定义字段（默认折叠，规格 §4.1）
 * - 照片：裁切 JPEG ≤150KB，存 blob（avatar.ts），profile.avatar 只存 key
 */
export const BasicInfoForm = memo(() => {
  const profile = useResumeStore(state => state.resumes[state.activeResumeId]?.profile);
  const updateProfile = useResumeStore(state => state.updateProfile);
  const [expanded, setExpanded] = useState(true);
  const [moreExpanded, setMoreExpanded] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [tempImage, setTempImage] = useState<string>('');
  const { showToast } = useToast();

  const avatarUrl = useAvatarObjectUrl(profile?.avatar || '');

  if (!profile) return null;

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // 允许再次选择同一文件（P0 清零 value）
    e.target.value = '';
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        showToast('error', '仅支持 JPG、PNG、WebP 格式的图片');
        return;
      }
      // 源文件限制 5MB（裁切后 ≤150KB）
      if (file.size > 5 * 1024 * 1024) {
        showToast('error', '照片大小不能超过5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setTempImage(result);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  /** 裁切结果（Canvas JPEG dataURL 295×413）→ 压缩 ≤150KB → 存 blob，key 写 profile.avatar */
  const handleCrop = (croppedImage: string) => {
    void compressToJpeg(croppedImage, 150 * 1024).then((compressed) => {
      const blob = dataUrlToBlob(compressed);
      if (!blob) {
        showToast('error', '照片处理失败，请重试');
        setTempImage('');
        return;
      }
      const resumeId = useResumeStore.getState().activeResumeId;
      // 先删旧 blob 再写新（避免孤儿）
      const oldKey = profile.avatar;
      if (oldKey && isAvatarKey(oldKey)) void deleteAvatar(oldKey);
      void saveAvatar(resumeId, blob).then((key) => {
        updateProfile('avatar', key);
        setTempImage('');
        showToast('success', '照片已上传');
      }).catch(() => {
        showToast('error', '照片保存失败，请重试');
      });
    }).catch(() => {
      showToast('error', '照片压缩失败，请重试');
    });
  };

  const handleDeleteAvatar = () => {
    const oldKey = profile.avatar;
    if (oldKey && isAvatarKey(oldKey)) void deleteAvatar(oldKey);
    updateProfile('avatar', '');
  };

  const updateCustomField = (id: string, label: string, value: string) => {
    const list = profile.customFields ?? [];
    const existing = list.find(f => f.id === id);
    if (existing) {
      updateProfile('customFields', undefined as never); // placeholder;实际走下面
    }
    // 直接通过 updater 更新（类型安全）
    useResumeStore.setState((s) => {
      const r = s.resumes[s.activeResumeId];
      if (!r) return s;
      const arr = r.profile.customFields ?? [];
      const idx = arr.findIndex(f => f.id === id);
      if (idx >= 0) {
        arr[idx] = { id, label, value };
      } else {
        arr.push({ id, label, value });
      }
      return s;
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-4">
      <div
        className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={() => setExpanded(!expanded)}
        data-section="basic-info"
      >
        <div className="flex items-center gap-2 font-medium text-gray-700">
          <User size={16} />
          基本信息
        </div>
        {expanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
      </div>

      {expanded && (
        <div className="p-4 space-y-5 animate-in slide-in-from-top-2 duration-200">
          {/* 照片 + 姓名/意向 */}
          <div className="flex items-start gap-4">
            <div className="relative group cursor-pointer w-20 h-[112px] flex-shrink-0">
              <div className={cn(
                "w-full h-full overflow-hidden bg-gray-50 border-2 border-dashed border-gray-300 group-hover:border-blue-400 flex flex-col items-center justify-center transition-colors rounded-lg"
              )}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="证件照" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <ImageIcon size={20} className="text-gray-400 mb-1" />
                    <span className="text-[10px] text-gray-400">上传照片</span>
                  </>
                )}
              </div>
              {!avatarUrl && (
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  aria-label="上传照片"
                />
              )}
              {avatarUrl && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-lg z-10 flex-col">
                  <label className="cursor-pointer text-white hover:text-blue-200 p-1" title="更换照片" aria-label="更换照片">
                    <Upload size={14} />
                    <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                  </label>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTempImage(avatarUrl);
                      setShowCropper(true);
                    }}
                    className="text-white hover:text-blue-200 p-1"
                    title="裁切照片"
                  >
                    <Crop size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteAvatar();
                    }}
                    className="text-white hover:text-red-300 p-1"
                    title="删除照片"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 space-y-3">
              <ValidatedInput
                label="姓名"
                required
                placeholder="请输入姓名"
                rules={{ minLength: 2, maxLength: 20 }}
                value={profile.name}
                onChange={(e) => updateProfile('name', e.target.value)}
              />
              <ValidatedInput
                label="求职意向"
                placeholder="例如：前端开发实习生"
                rules={{ maxLength: 30 }}
                value={profile.title}
                onChange={(e) => updateProfile('title', e.target.value)}
              />
              {/* 照片尺寸快捷设置（位置由模板决定：右上 / 横幅顶部居中） */}
              {avatarUrl && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-400">照片尺寸</span>
                  <select
                    value={useResumeStore.getState().resumes[useResumeStore.getState().activeResumeId]?.settings.photoSize || 'md'}
                    onChange={(e) => useResumeStore.getState().updateSettings({ photoSize: e.target.value as 'sm' | 'md' | 'lg' })}
                    className="border border-gray-200 rounded px-1.5 py-1 text-xs text-gray-600"
                  >
                    <option value="sm">小</option>
                    <option value="md">中（证件照）</option>
                    <option value="lg">大</option>
                  </select>
                  <span className="text-gray-300">·</span>
                  <span className="text-gray-400">形状在样式面板调</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <ValidatedInput
              label="电话"
              placeholder="11位手机号"
              rules={{ phone: true }}
              value={profile.phone}
              onChange={(e) => updateProfile('phone', e.target.value)}
            />
            <ValidatedInput
              label="邮箱"
              placeholder="your@email.com"
              rules={{ email: true }}
              value={profile.email}
              onChange={(e) => updateProfile('email', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <ValidatedInput
              label="所在城市"
              placeholder="城市名称"
              value={profile.location}
              onChange={(e) => updateProfile('location', e.target.value)}
              showSuccessIcon={false}
            />
            <ValidatedInput
              label="微信"
              placeholder="微信号（可选）"
              value={profile.wechat || ''}
              onChange={(e) => updateProfile('wechat', e.target.value)}
              showSuccessIcon={false}
            />
          </div>

          <ValidatedInput
            label="个人网站 / 作品集"
            placeholder="github.com/...（可选）"
            value={profile.website || ''}
            onChange={(e) => updateProfile('website', e.target.value)}
            showSuccessIcon={false}
          />

          <ValidatedTextarea
            label="自我评价"
            placeholder="简短描述你的核心优势..."
            rules={{ maxLength: 500 }}
            maxLength={500}
            className="h-24 resize-none"
            value={profile.summary || ''}
            onChange={(e) => updateProfile('summary', e.target.value)}
          />

          {/* 更多信息（默认折叠） */}
          <div className="border-t border-gray-100 pt-3">
            <button
              type="button"
              onClick={() => setMoreExpanded(!moreExpanded)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 font-medium"
            >
              {moreExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              更多信息（性别 / 出生年 / 政治面貌 / 籍贯）
            </button>
            {moreExpanded && (
              <div className="mt-3 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <ValidatedInput
                    label="性别"
                    placeholder="男 / 女"
                    value={profile.gender || ''}
                    onChange={(e) => updateProfile('gender', e.target.value)}
                    showSuccessIcon={false}
                  />
                  <ValidatedInput
                    label="出生年"
                    placeholder="如 2003"
                    value={profile.birthYear || ''}
                    onChange={(e) => updateProfile('birthYear', e.target.value)}
                    showSuccessIcon={false}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <ValidatedInput
                    label="政治面貌"
                    placeholder="中共党员 / 共青团员"
                    value={profile.politicalStatus || ''}
                    onChange={(e) => updateProfile('politicalStatus', e.target.value)}
                    showSuccessIcon={false}
                  />
                  <ValidatedInput
                    label="籍贯"
                    placeholder="如 浙江杭州"
                    value={profile.nativePlace || ''}
                    onChange={(e) => updateProfile('nativePlace', e.target.value)}
                    showSuccessIcon={false}
                  />
                </div>
                {/* 自定义字段 */}
                {(profile.customFields ?? []).map((f) => (
                  <div key={f.id} className="grid grid-cols-2 gap-3">
                    <ValidatedInput
                      placeholder="字段名"
                      value={f.label}
                      onChange={(e) => updateCustomField(f.id, e.target.value, f.value)}
                      showSuccessIcon={false}
                    />
                    <ValidatedInput
                      placeholder="内容"
                      value={f.value}
                      onChange={(e) => updateCustomField(f.id, f.label, e.target.value)}
                      showSuccessIcon={false}
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const id = `cf-${Date.now()}`;
                    useResumeStore.setState((s) => {
                      const r = s.resumes[s.activeResumeId];
                      if (r) {
                        const arr = r.profile.customFields ?? [];
                        arr.push({ id, label: '', value: '' });
                      }
                      return s;
                    });
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  + 添加自定义字段
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 照片裁切弹窗 */}
      <ImageCropper
        image={tempImage}
        isOpen={showCropper}
        onClose={() => {
          setShowCropper(false);
          setTempImage('');
        }}
        onCrop={handleCrop}
        aspectRatio="5:7"
      />
    </div>
  );
});
BasicInfoForm.displayName = 'BasicInfoForm';

/** dataURL → Blob */
function dataUrlToBlob(dataUrl: string): Blob | null {
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

/** 循环降低 JPEG 质量直到 ≤ maxBytes（规格 §6.4：裁切输出 JPEG 5:7 ≤150KB） */
function compressToJpeg(dataUrl: string, maxBytes: number): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      // 保持图片尺寸不变，仅调质量
      let quality = 0.92;
      const tryEncode = (): string => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return dataUrl;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        return canvas.toDataURL('image/jpeg', quality);
      };
      let out = tryEncode();
      while (out.length > maxBytes && quality > 0.35) {
        quality -= 0.08;
        out = tryEncode();
      }
      resolve(out);
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
