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

export const OpsOrangeTemplate: React.FC<TemplateProps> = ({ data }) => {
  const { profile, modules, settings } = data;
  const fontSize = settings.fontSizeScale || 1;
  const primaryColor = 'var(--color-primary)';

  return (
    <div
      className="w-full h-full bg-white font-sans"
      style={{ fontSize: `${12.5 * fontSize}px`, color: 'var(--color-text)' }}
    >
      {/* Header */}
      <div className="px-6 pt-5 pb-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            {/* Name */}
            <h1
              className="font-bold mb-1"
              style={{ fontSize: `${1.5 * fontSize}rem` }}
            >
              {profile.name}
            </h1>

            {/* Position */}
            <div className="mb-2" style={{ fontSize: `${0.8 * fontSize}rem` }}>
              <span className="text-gray-500">意向岗位：</span>
              <span className="font-medium">{profile.title || '运营专员'}</span>
            </div>

            {/* Contact Info - one line with pipes */}
            <div
              className="flex flex-wrap items-center gap-1.5 text-gray-600"
              style={{ fontSize: `${0.8 * fontSize}rem` }}
            >
              {profile.phone && <span>{profile.phone}</span>}
              {profile.phone && profile.email && <span className="text-gray-300">|</span>}
              {profile.email && <span>{profile.email}</span>}
              {(profile.phone || profile.email) && profile.location && <span className="text-gray-300">|</span>}
              {profile.location && <span>{profile.location}</span>}
            </div>
          </div>

          {/* Avatar - circular */}
          {profile.avatar && (
            <div className="ml-6 flex-shrink-0">
              <div
                className="w-20 h-20 rounded-full overflow-hidden border-2"
                style={{ borderColor: primaryColor }}
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
            {/* Section Header: orange dot ● + bold text */}
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-lg leading-none" style={{ color: primaryColor }}>●</span>
              <h3
                className="font-bold"
                style={{ fontSize: `${0.9 * fontSize}rem` }}
              >
                {module.title}
              </h3>
            </div>

            <div className="space-y-2 ml-1">
              {isSkillsModule(module) ? (
                /* Skills as bordered tags */
                <div className="flex flex-wrap gap-1.5">
                  {module.items.map((item: SkillItem) => (
                    <span
                      key={item.id}
                      className="px-2 py-0.5 text-xs border rounded font-medium"
                      style={{ borderColor: primaryColor, color: primaryColor }}
                    >
                      {item.name}
                    </span>
                  ))}
                </div>
              ) : (
                module.items.map((item: ResumeItem) => (
                  <div key={item.id} className="mb-2 last:mb-0">
                    {/* Item Header */}
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold" style={{ fontSize: `${0.85 * fontSize}rem` }}>
                          {item.title}
                        </h4>
                        {item.subtitle && (
                          <span
                            className="px-1.5 py-0.5 text-xs rounded"
                            style={{ backgroundColor: 'var(--color-accent)', color: primaryColor }}
                          >
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

                    {/* Location for non-education */}
                    {module.type !== 'education' && item.location && (
                      <div className="text-gray-500 mb-1" style={{ fontSize: `${0.75 * fontSize}rem` }}>
                        {item.location}
                      </div>
                    )}

                    {/* Description with bullet points */}
                    {item.description && (
                      <div
                        className="text-gray-700 leading-snug whitespace-pre-line"
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

        {/* Summary */}
        {profile.summary && (
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-lg leading-none" style={{ color: primaryColor }}>●</span>
              <h3
                className="font-bold"
                style={{ fontSize: `${0.9 * fontSize}rem` }}
              >
                自我评价
              </h3>
            </div>
            <p
              className="text-gray-700 leading-snug ml-1"
              style={{ fontSize: `${0.8 * fontSize}rem` }}
            >
              {profile.summary}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
