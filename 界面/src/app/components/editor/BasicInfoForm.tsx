import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { useResumeStore } from '@/app/store/useResumeStore';
import { ResumeProfile } from '@/app/types/resume';
import { User, ImageIcon, ChevronDown, ChevronRight, Upload, Crop, Plus, Trash2 } from 'lucide-react';
import { ImageCropper } from './ImageCropper';
import { ValidatedInput, ValidatedTextarea } from './ValidatedInput';
import { subscribeLocate, flashHighlight } from './locateBus';
import { cn } from '@/app/lib/utils';
import { useToast } from '@/app/components/ui/toast';
import { useAvatarObjectUrl } from '@/app/hooks/useAvatarObjectUrl';
import { saveAvatar, deleteAvatar, isAvatarKey } from '@/app/store/avatar';

type CustomField = NonNullable<ResumeProfile['customFields']>[number];

/** 「更多信息」里的字段 id（定位到这些字段要先展开折叠区） */
const MORE_SECTION_FIELDS = new Set([
  'field-gender', 'field-birthYear', 'field-politicalStatus', 'field-nativePlace',
]);

/**
 * 基本信息表单：
 * - 微信与网站分开（P1-7）
 * - 「更多信息」折叠：性别/出生年/政治面貌/籍贯/自定义字段（默认折叠，规格 §4.1）
 * - 照片：裁切 JPEG ≤150KB，存 blob（avatar.ts），profile.avatar 只存 key
 * - 每个字段带 id="field-*"，供诊断面板「去填写」精确聚焦
 */
export const BasicInfoForm = memo(() => {
  const profile = useResumeStore(state => state.resumes[state.activeResumeId]?.profile);
  const photoSize = useResumeStore(state => state.resumes[state.activeResumeId]?.settings?.photoSize ?? 'md');
  const updateProfile = useResumeStore(state => state.updateProfile);
  const updateSettings = useResumeStore(state => state.updateSettings);
  const updateResume = useResumeStore(state => state.updateResume);
  const [expanded, setExpanded] = useState(true);
  const [moreExpanded, setMoreExpanded] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [tempImage, setTempImage] = useState<string>('');
  const sectionRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  const avatarUrl = useAvatarObjectUrl(profile?.avatar || '');

  /**
   * 自定义字段整体写回：走公开的 updateResume（会 push 变更前历史快照、会落盘），
   * 不再用「updateProfile('customFields', undefined) + setState 改游离数组」那种写法
   * （旧写法把已有字段清空，且新数组从未挂回 state，编辑完全不落盘）。
   */
  const writeCustomFields = useCallback((mutate: (list: CustomField[]) => CustomField[]) => {
    const s = useResumeStore.getState();
    const resume = s.resumes[s.activeResumeId];
    if (!resume) return;
    updateResume(resume.id, {
      profile: { ...resume.profile, customFields: mutate([...(resume.profile.customFields ?? [])]) },
    });
  }, [updateResume]);

  const updateCustomField = useCallback((id: string, label: string, value: string) => {
    writeCustomFields(list => list.map(f => (f.id === id ? { ...f, label, value } : f)));
  }, [writeCustomFields]);

  // 诊断面板「去填写」：需要时展开折叠区，再聚焦对应输入框
  useEffect(() => subscribeLocate((target) => {
    if (target.kind !== 'basic' && target.kind !== 'field') return;
    const fieldId = target.kind === 'field' ? target.fieldId : 'field-name';
    setExpanded(true);
    if (MORE_SECTION_FIELDS.has(fieldId)) setMoreExpanded(true);
    setTimeout(() => {
      const el = document.getElementById(fieldId);
      const anchor = el ?? sectionRef.current;
      if (!anchor) return;
      anchor.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (anchor instanceof HTMLInputElement || anchor instanceof HTMLTextAreaElement) anchor.focus();
      flashHighlight(anchor);
    }, 140);
  }), []);

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

  /**
   * 裁切结果（Canvas JPEG）→ 压缩 ≤150KB → 先写新 blob，成功后才删旧 blob。
   * 旧顺序「先删后写」在配额失败时会把用户照片永久删掉。
   */
  const handleCrop = (croppedImage: string) => {
    void compressToJpeg(croppedImage, 150 * 1024).then((compressed) => {
      const blob = dataUrlToBlob(compressed);
      if (!blob) {
        showToast('error', '照片处理失败，请重试');
        setTempImage('');
        return;
      }
      const s = useResumeStore.getState();
      const resumeId = s.activeResumeId;
      const oldKey = s.resumes[resumeId]?.profile.avatar ?? '';
      void saveAvatar(resumeId, blob).then((key) => {
        updateProfile('avatar', key);
        setTempImage('');
        showToast('success', '照片已上传');
        // 只有 key 真的变了才删旧（同一简历覆盖写时 key 相同，删它会连新图一起删掉）
        if (oldKey && isAvatarKey(oldKey) && oldKey !== key) {
          void deleteAvatar(oldKey).catch(() => undefined);
        }
      }).catch(() => {
        showToast('error', '照片保存失败：本地存储空间不足，原照片仍保留');
      });
    }).catch(() => {
      showToast('error', '照片压缩失败，请重试');
    });
  };

  const handleDeleteAvatar = () => {
    const oldKey = profile.avatar;
    updateProfile('avatar', '');
    if (oldKey && isAvatarKey(oldKey)) {
      void deleteAvatar(oldKey).catch(() => undefined);
    }
  };

  return (
    <div ref={sectionRef} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-4">
      <button
        type="button"
        className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        data-section="basic-info"
      >
        <div className="flex items-center gap-2 font-medium text-gray-700">
          <User size={16} />
          基本信息
        </div>
        {expanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
      </button>

      {expanded && (
        <div className="p-4 space-y-5 animate-in slide-in-from-top-2 duration-200">
          {/* 照片 + 姓名/意向 */}
          <div className="flex items-start gap-4">
            <div className="w-20 flex-shrink-0">
              <div className={cn(
                "relative group w-20 h-[112px] overflow-hidden bg-gray-50 border-2 border-dashed border-gray-300 hover:border-blue-400 flex flex-col items-center justify-center transition-colors rounded-lg"
              )}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="证件照" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <ImageIcon size={20} className="text-gray-400 mb-1" />
                    <span className="text-[10px] text-gray-400">上传照片</span>
                  </>
                )}
                {!avatarUrl && (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    aria-label="上传照片"
                  />
                )}
              </div>

              {/* 照片操作：常驻可见（触屏与键盘没有 hover，旧写法把按钮藏在悬停遮罩里根本找不到） */}
              {avatarUrl && (
                <div className="mt-1 flex items-center justify-between gap-1">
                  <label
                    className="flex-1 flex items-center justify-center gap-1 py-1 rounded border border-gray-200 text-[10px] text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 cursor-pointer transition-colors"
                    title="换一张照片"
                  >
                    <Upload size={11} /> 更换
                    <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      // 用当前 blob URL 重新进入裁切（compressToJpeg 输出 dataURL，不会写回 blob URL）
                      setTempImage(avatarUrl);
                      setShowCropper(true);
                    }}
                    className="p-1 rounded border border-gray-200 text-gray-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
                    title="重新裁切照片"
                    aria-label="重新裁切照片"
                  >
                    <Crop size={11} />
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteAvatar}
                    className="p-1 rounded border border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                    title="删除照片"
                    aria-label="删除照片"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 space-y-3">
              <ValidatedInput
                id="field-name"
                label="姓名"
                required
                placeholder="请输入姓名"
                rules={{ minLength: 2, maxLength: 20 }}
                value={profile.name}
                onChange={(e) => updateProfile('name', e.target.value)}
              />
              <ValidatedInput
                id="field-title"
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
                    value={photoSize}
                    onChange={(e) => updateSettings({ photoSize: e.target.value as 'sm' | 'md' | 'lg' })}
                    className="border border-gray-200 rounded px-1.5 py-1 text-xs text-gray-600"
                    aria-label="照片尺寸"
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
              id="field-phone"
              label="电话"
              placeholder="手机号或座机"
              rules={{ phone: true }}
              value={profile.phone}
              onChange={(e) => updateProfile('phone', e.target.value)}
            />
            <ValidatedInput
              id="field-email"
              label="邮箱"
              placeholder="your@email.com"
              rules={{ email: true }}
              value={profile.email}
              onChange={(e) => updateProfile('email', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <ValidatedInput
              id="field-location"
              label="所在城市"
              placeholder="城市名称"
              value={profile.location}
              onChange={(e) => updateProfile('location', e.target.value)}
              showSuccessIcon={false}
            />
            <ValidatedInput
              id="field-wechat"
              label="微信"
              placeholder="微信号（可选）"
              value={profile.wechat || ''}
              onChange={(e) => updateProfile('wechat', e.target.value)}
              showSuccessIcon={false}
            />
          </div>

          <ValidatedInput
            id="field-website"
            label="个人网站 / 作品集"
            placeholder="github.com/...（可选）"
            value={profile.website || ''}
            onChange={(e) => updateProfile('website', e.target.value)}
            showSuccessIcon={false}
          />

          <ValidatedTextarea
            id="field-summary"
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
              aria-expanded={moreExpanded}
            >
              {moreExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              更多信息（性别 / 出生年 / 政治面貌 / 籍贯 / 自定义字段）
            </button>
            {moreExpanded && (
              <div className="mt-3 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <ValidatedInput
                    id="field-gender"
                    label="性别"
                    placeholder="男 / 女"
                    value={profile.gender || ''}
                    onChange={(e) => updateProfile('gender', e.target.value)}
                    showSuccessIcon={false}
                  />
                  <ValidatedInput
                    id="field-birthYear"
                    label="出生年"
                    placeholder="如 2003"
                    value={profile.birthYear || ''}
                    onChange={(e) => updateProfile('birthYear', e.target.value)}
                    showSuccessIcon={false}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <ValidatedInput
                    id="field-politicalStatus"
                    label="政治面貌"
                    placeholder="中共党员 / 共青团员"
                    value={profile.politicalStatus || ''}
                    onChange={(e) => updateProfile('politicalStatus', e.target.value)}
                    showSuccessIcon={false}
                  />
                  <ValidatedInput
                    id="field-nativePlace"
                    label="籍贯"
                    placeholder="如 浙江杭州"
                    value={profile.nativePlace || ''}
                    onChange={(e) => updateProfile('nativePlace', e.target.value)}
                    showSuccessIcon={false}
                  />
                </div>

                {/* 自定义字段（体制内简历常需「政治面貌/身高/英语等级」等，允许自由加） */}
                {(profile.customFields ?? []).length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs text-gray-500 font-medium">自定义字段</span>
                    {(profile.customFields ?? []).map((f) => (
                      <div key={f.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-start">
                        <ValidatedInput
                          placeholder="字段名"
                          aria-label="自定义字段名"
                          value={f.label}
                          onChange={(e) => updateCustomField(f.id, e.target.value, f.value)}
                          showSuccessIcon={false}
                        />
                        <ValidatedInput
                          placeholder="内容"
                          aria-label="自定义字段内容"
                          value={f.value}
                          onChange={(e) => updateCustomField(f.id, f.label, e.target.value)}
                          showSuccessIcon={false}
                        />
                        <button
                          type="button"
                          onClick={() => writeCustomFields(list => list.filter(item => item.id !== f.id))}
                          className="mt-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                          title="删除此字段"
                          aria-label="删除此字段"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => writeCustomFields(list => [...list, { id: `cf-${Date.now()}`, label: '', value: '' }])}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  <Plus size={12} /> 添加自定义字段
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
