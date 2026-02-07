import React from 'react';
import { ResumeData, isSkillsModule, SkillItem, ResumeItem } from '@/app/types/resume';

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

export const EduDarkTemplate: React.FC<TemplateProps> = ({ data }) => {
  const { profile, modules, settings } = data;
  const fontSize = settings.fontSizeScale || 1;
  const primaryColor = 'var(--color-primary)';

  return (
    <div
      className="w-full h-full bg-white font-sans"
      style={{ fontSize: `${12.5 * fontSize}px`, color: 'var(--color-text)' }}
    >
      {/* Header - compact, no avatar */}
      <div className="px-6 pt-5 pb-3">
        {/* Name left, position right - same line */}
        <div className="flex justify-between items-baseline mb-1.5">
          <h1
            className="font-bold"
            style={{ fontSize: `${1.5 * fontSize}rem` }}
          >
            {profile.name}
          </h1>
          <span
            className="font-medium text-gray-600"
            style={{ fontSize: `${0.85 * fontSize}rem` }}
          >
            {profile.title || '教育培训专员'}
          </span>
        </div>

        {/* Contact Info - one line, compact */}
        <div
          className="flex flex-wrap items-center gap-1 text-gray-600"
          style={{ fontSize: `${0.75 * fontSize}rem` }}
        >
          {profile.phone && <span>{profile.phone}</span>}
          {profile.phone && profile.email && <span className="text-gray-300">|</span>}
          {profile.email && <span>{profile.email}</span>}
          {(profile.phone || profile.email) && profile.location && <span className="text-gray-300">|</span>}
          {profile.location && <span>{profile.location}</span>}
          {profile.website && (
            <>
              <span className="text-gray-300">|</span>
              <span>{profile.website}</span>
            </>
          )}
        </div>
      </div>

      {/* Thin divider */}
      <div className="px-6">
        <div className="h-px" style={{ backgroundColor: primaryColor }}></div>
      </div>

      {/* Modules - ultra compact */}
      <div className="px-6 pt-2 pb-5 space-y-1">
        {modules.filter(m => m.visible).map((module) => (
          <div key={module.id} className="mb-1">
            {/* Section Header: dark bold + thin bottom line */}
            <div className="mb-1 pb-0.5 border-b" style={{ borderColor: 'var(--color-secondary)' }}>
              <h3
                className="font-bold"
                style={{ fontSize: `${0.85 * fontSize}rem`, color: primaryColor }}
              >
                {module.title}
              </h3>
            </div>

            <div className="space-y-1">
              {isSkillsModule(module) ? (
                /* Skills in compact inline format */
                <div className="flex flex-wrap gap-1">
                  {module.items.map((item: SkillItem) => (
                    <span
                      key={item.id}
                      className="px-1.5 py-0.5 text-xs rounded"
                      style={{
                        backgroundColor: 'var(--color-accent)',
                        color: primaryColor,
                      }}
                    >
                      {item.name}
                    </span>
                  ))}
                </div>
              ) : (
                module.items.map((item: ResumeItem) => (
                  <div key={item.id} className="mb-1 last:mb-0">
                    {/* Item Header - compact */}
                    <div className="flex justify-between items-start mb-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold" style={{ fontSize: `${0.8 * fontSize}rem` }}>
                          {item.title}
                        </h4>
                        {item.subtitle && (
                          <span className="text-gray-500" style={{ fontSize: `${0.7 * fontSize}rem` }}>
                            {item.subtitle}
                          </span>
                        )}
                        {/* School tags for education */}
                        {module.type === 'education' && renderLocationWithTags(item.location)}
                      </div>
                      {item.date && (
                        <span
                          className="text-gray-500 whitespace-nowrap ml-2"
                          style={{ fontSize: `${0.65 * fontSize}rem` }}
                        >
                          {item.date}
                        </span>
                      )}
                    </div>

                    {/* Location for non-education */}
                    {module.type !== 'education' && item.location && (
                      <div className="text-gray-500 mb-0.5" style={{ fontSize: `${0.7 * fontSize}rem` }}>
                        {item.location}
                      </div>
                    )}

                    {/* Description */}
                    {item.description && (
                      <div
                        className="text-gray-700 leading-snug whitespace-pre-line"
                        style={{ fontSize: `${0.75 * fontSize}rem` }}
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

        {/* Summary - compact */}
        {profile.summary && (
          <div className="mb-1">
            <div className="mb-1 pb-0.5 border-b" style={{ borderColor: 'var(--color-secondary)' }}>
              <h3
                className="font-bold"
                style={{ fontSize: `${0.85 * fontSize}rem`, color: primaryColor }}
              >
                自我评价
              </h3>
            </div>
            <p
              className="text-gray-700 leading-snug"
              style={{ fontSize: `${0.75 * fontSize}rem` }}
            >
              {profile.summary}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
