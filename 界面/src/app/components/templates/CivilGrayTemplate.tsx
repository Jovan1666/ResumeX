import React from 'react';
import { ResumeData, isSkillsModule, SkillItem, ResumeItem } from '@/app/types/resume';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';

interface TemplateProps {
  data: ResumeData;
}

const schoolTagKeywords = ['985', '211', '双一流', '985/211工程', 'C9', '本科', '硕士', '博士'];

const renderLocationWithTags = (location?: string) => {
  if (!location) return null;
  const parts = location.split(/[,，]/).map(t => t.trim());
  const tags = parts.filter(t => schoolTagKeywords.includes(t));
  const rest = parts.filter(t => !schoolTagKeywords.includes(t)).join('、');
  return (
    <span className="inline-flex items-center gap-1.5 flex-wrap">
      {rest && <span>{rest}</span>}
      {tags.map(tag => (
        <span key={tag} className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-blue-500 text-white">{tag}</span>
      ))}
    </span>
  );
};

export const CivilGrayTemplate: React.FC<TemplateProps> = ({ data }) => {
  const { profile, modules, settings } = data;
  const fontSize = settings.fontSizeScale || 1;

  return (
    <div
      className="w-full h-full bg-white font-sans"
      style={{ fontSize: `${12.5 * fontSize}px`, color: '#374151' }}
    >
      {/* Header */}
      <div className="px-6 pt-5 pb-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            {/* Name + Position */}
            <h1
              className="font-bold mb-1"
              style={{ fontSize: `${1.5 * fontSize}rem`, color: '#1f2937' }}
            >
              {profile.name}
            </h1>

            {/* Position */}
            {profile.title && (
              <div className="mb-2" style={{ fontSize: `${0.8 * fontSize}rem` }}>
                <span className="text-gray-500">意向岗位：</span>
                <span className="font-medium">{profile.title}</span>
              </div>
            )}

            {/* Contact Info - single line with pipes */}
            <div
              className="flex flex-wrap items-center gap-1.5 text-gray-500"
              style={{ fontSize: `${0.8 * fontSize}rem` }}
            >
              {profile.phone && <span>{profile.phone}</span>}
              {profile.phone && profile.email && <span className="text-gray-300">|</span>}
              {profile.email && <span>{profile.email}</span>}
              {(profile.phone || profile.email) && profile.location && <span className="text-gray-300">|</span>}
              {profile.location && <span>{profile.location}</span>}
              {(profile.phone || profile.email || profile.location) && profile.website && <span className="text-gray-300">|</span>}
              {profile.website && <span>{profile.website}</span>}
              {profile.wechat && <span className="text-gray-300">|</span>}
              {profile.wechat && <span>微信: {profile.wechat}</span>}
              {profile.customFields?.map((field, index) => (
                <React.Fragment key={index}>
                  <span className="text-gray-300">|</span>
                  <span>{field.label}: {field.value}</span>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Avatar - circular */}
          {profile.avatar && (
            <div className="ml-6 flex-shrink-0">
              <div
                className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-300"
              >
                <ImageWithFallback
                  src={profile.avatar}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modules */}
      <div className="px-6 pb-5 space-y-3">
        {modules.filter(m => m.visible).map((module) => (
          <div key={module.id}>
            {/* Section Header: dark gray bold, plain and formal */}
            <div className="mb-1.5 pb-1 border-b border-gray-300">
              <h3
                className="font-bold"
                style={{ fontSize: `${0.9 * fontSize}rem`, color: '#1f2937' }}
              >
                {module.title}
              </h3>
            </div>

            <div className="space-y-2">
              {isSkillsModule(module) ? (
                /* Skills as plain bullet list */
                <div className="space-y-0.5">
                  {module.items.map((item: SkillItem) => (
                    <div
                      key={item.id}
                      className="flex items-start"
                      style={{ fontSize: `${0.8 * fontSize}rem` }}
                    >
                      <span className="mr-2 text-gray-400 flex-shrink-0">•</span>
                      <span>{item.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                module.items.map((item: ResumeItem) => (
                  <div key={item.id} className="mb-2 last:mb-0">
                    {/* Item Header */}
                    <div className="flex justify-between items-start mb-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold" style={{ fontSize: `${0.85 * fontSize}rem`, color: '#1f2937' }}>
                          {item.title}
                        </h4>
                        {item.subtitle && (
                          <span className="text-gray-500" style={{ fontSize: `${0.75 * fontSize}rem` }}>
                            {item.subtitle}
                          </span>
                        )}
                        {/* School tags for education */}
                        {module.type === 'education' && renderLocationWithTags(item.location)}
                      </div>
                      {item.date && (
                        <span
                          className="text-gray-500 whitespace-nowrap ml-2"
                          style={{ fontSize: `${0.7 * fontSize}rem` }}
                        >
                          {item.date}
                        </span>
                      )}
                    </div>

                    {/* Location for non-education modules */}
                    {module.type !== 'education' && item.location && (
                      <div className="text-gray-500 mb-0.5" style={{ fontSize: `${0.75 * fontSize}rem` }}>
                        {item.location}
                      </div>
                    )}

                    {/* Description */}
                    {item.description && (
                      <div
                        className="text-gray-600 leading-snug whitespace-pre-line"
                        style={{ fontSize: `${0.8 * fontSize}rem` }}
                      >
                        {item.description}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        ))}

        {/* Summary section */}
        {profile.summary && (
          <div>
            <div className="mb-1.5 pb-1 border-b border-gray-300">
              <h3
                className="font-bold"
                style={{ fontSize: `${0.9 * fontSize}rem`, color: '#1f2937' }}
              >
                自我评价
              </h3>
            </div>
            <p
              className="text-gray-600 leading-snug"
              style={{ fontSize: `${0.8 * fontSize}rem` }}
            >
              {profile.summary}
            </p>
          </div>
        )}

        {/* 致谢 section - formal acknowledgement, always rendered */}
        <div>
          <div className="mb-1.5 pb-1 border-b border-gray-300">
            <h3
              className="font-bold"
              style={{ fontSize: `${0.9 * fontSize}rem`, color: '#1f2937' }}
            >
              致谢
            </h3>
          </div>
          <p
            className="text-gray-600 leading-relaxed"
            style={{ fontSize: `${0.8 * fontSize}rem` }}
          >
            感谢您在百忙之中审阅我的简历。我对贵单位的工作充满热情与期待，希望能有机会为贵单位的发展贡献自己的力量。期待您的回复，谢谢！
          </p>
        </div>
      </div>
    </div>
  );
};
