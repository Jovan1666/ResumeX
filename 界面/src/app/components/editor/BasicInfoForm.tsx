import React, { useState, memo } from 'react';
import { useResumeStore } from '@/app/store/useResumeStore';
import { User, ImageIcon, X, ChevronDown, ChevronRight, Upload, Crop } from 'lucide-react';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';
import { ImageCropper } from './ImageCropper';
import { ValidatedInput, ValidatedTextarea } from './ValidatedInput';
import { cn } from '@/app/lib/utils';
import { useToast } from '@/app/components/ui/toast';

export const BasicInfoForm = memo(() => {
  // 细粒度选择器：仅订阅 profile，避免 modules/settings 变更触发重渲染
  const profile = useResumeStore(state => state.resumes[state.activeResumeId]?.profile);
  const updateProfile = useResumeStore(state => state.updateProfile);
  const [expanded, setExpanded] = useState(true);
  const [showCropper, setShowCropper] = useState(false);
  const [tempImage, setTempImage] = useState<string>('');
  const { showToast } = useToast();

  if (!profile) return null;

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 检查文件类型
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        showToast('error', '仅支持 JPG、PNG、WebP、GIF 格式的图片');
        return;
      }

      // 检查文件大小（限制5MB）
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

  const handleCrop = (croppedImage: string) => {
    updateProfile('avatar', croppedImage);
    setTempImage('');
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-4">
      <div 
        className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 font-medium text-gray-700">
          <User size={16} />
          基本信息 (必填)
        </div>
        {expanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
      </div>
      
      {expanded && (
        <div className="p-4 space-y-5 animate-in slide-in-from-top-2 duration-200">
          {/* Avatar Upload */}
          <div className="flex items-start gap-4">
            <div className="relative group cursor-pointer w-20 h-20 flex-shrink-0">
              <div className={cn(
                "w-full h-full overflow-hidden bg-gray-50 border-2 border-dashed border-gray-300 group-hover:border-blue-400 flex flex-col items-center justify-center transition-colors",
                profile.avatar ? "rounded-lg" : "rounded-full"
              )}>
                {profile.avatar ? (
                  <ImageWithFallback src={profile.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <ImageIcon size={20} className="text-gray-400 mb-1" />
                    <span className="text-[10px] text-gray-400">上传照片</span>
                  </>
                )}
              </div>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleAvatarChange} 
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              {profile.avatar && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-lg">
                  <label className="cursor-pointer text-white hover:text-blue-200 p-1" title="更换照片">
                    <Upload size={14} />
                    <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                  </label>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setTempImage(profile.avatar || '');
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
                      updateProfile('avatar', '');
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
                required
                placeholder="例如：高级前端工程师"
                rules={{ minLength: 2, maxLength: 30 }}
                value={profile.title}
                onChange={(e) => updateProfile('title', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <ValidatedInput
              label="电话"
              required
              placeholder="11位手机号"
              rules={{ phone: true }}
              value={profile.phone}
              onChange={(e) => updateProfile('phone', e.target.value)}
            />
            <ValidatedInput
              label="邮箱"
              required
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
              label="个人网站 / 微信"
              placeholder="github.com/..."
              value={profile.website || ''}
              onChange={(e) => updateProfile('website', e.target.value)}
              showSuccessIcon={false}
            />
          </div>

          <ValidatedTextarea
            label="个人总结"
            placeholder="简短描述你的核心优势..."
            rules={{ maxLength: 500 }}
            maxLength={500}
            className="h-24 resize-none"
            value={profile.summary || ''}
            onChange={(e) => updateProfile('summary', e.target.value)}
          />
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
        aspectRatio="1:1"
      />
    </div>
  );
});
BasicInfoForm.displayName = 'BasicInfoForm';
