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

export const RecruitBkTemplate: React.FC<TemplateProps> = ({ data }) => {
  const { profile, modules, settings } = data;
  const fontSize = settings.fontSizeScale || 1;

  return (
    <div
      className="w-full h-full bg-white font-sans"
      style={{ fontSize: `${12.5 * fontSize}px`, color: '#111827' }}
    >
      {/* Header */}
      <div className="px-6 pt-5 pb-3">
        {/* Name + Position */}
        <div className="mb-2">
          <h1
            className="font-bold inline"
            style={{ fontSize: `${1.5 * fontSize}rem` }}
          >
            {profile.name}
          </h1>
          {profile.title && (
            <span
              className="ml-3 text-gray-500 font-normal"
              style={{ fontSize: `${0.9 * fontSize}rem` }}
            >
              {profile.title}
            </span>
          )}
        </div>

        {/* Contact Info - single line with pipes */}
        <div
          className="flex flex-wrap items-center gap-1.5 text-gray-600"
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

      {/* Modules */}
      <div className="px-6 pb-5 space-y-3">
        {modules.filter(m => m.visible).map((module) => (
          <div key={module.id}>
            {/* Section Header: black bold + gray underline */}
            <div className="mb-1.5 pb-1 border-b border-gray-300">
              <h3
                className="font-bold"
                style={{ fontSize: `${0.9 * fontSize}rem`, color: '#111827' }}
              >
                {module.title}
              </h3>
            </div>

            <div className="space-y-2">
              {isSkillsModule(module) ? (
                /* Skills as plain list */
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {module.items.map((item: SkillItem) => (
                    <span
                      key={item.id}
                      className="flex items-center gap-1.5"
                      style={{ fontSize: `${0.8 * fontSize}rem` }}
                    >
                      <span className="w-1 h-1 rounded-full bg-gray-400 flex-shrink-0" />
                      <span>{item.name}</span>
                    </span>
                  ))}
                </div>
              ) : (
                module.items.map((item: ResumeItem) => (
                  <div key={item.id} className="mb-2 last:mb-0">
                    {/* Item Header */}
                    <div className="flex justify-between items-start mb-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold" style={{ fontSize: `${0.85 * fontSize}rem` }}>
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

        {/* Summary at the end */}
        {profile.summary && (
          <div>
            <div className="mb-1.5 pb-1 border-b border-gray-300">
              <h3
                className="font-bold"
                style={{ fontSize: `${0.9 * fontSize}rem`, color: '#111827' }}
              >
                自我评价
              </h3>
            </div>
            <p
              className="text-gray-700 leading-snug"
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
