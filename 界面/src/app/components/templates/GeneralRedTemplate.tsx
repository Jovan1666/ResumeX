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

export const GeneralRedTemplate: React.FC<TemplateProps> = ({ data }) => {
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
        {/* Name + Title */}
        <div className="flex items-baseline gap-3 mb-2">
          <h1
            className="font-bold"
            style={{ fontSize: `${1.5 * fontSize}rem`, color: primaryColor }}
          >
            {profile.name}
          </h1>
          {profile.title && (
            <span
              className="font-medium text-gray-600"
              style={{ fontSize: `${0.9 * fontSize}rem` }}
            >
              {profile.title}
            </span>
          )}
        </div>

        {/* Contact info – one line */}
        <div
          className="flex flex-wrap items-center gap-x-2 gap-y-1 text-gray-600"
          style={{ fontSize: `${0.8 * fontSize}rem` }}
        >
          {profile.phone && <span>{profile.phone}</span>}
          {profile.phone && profile.email && <span className="text-gray-300">|</span>}
          {profile.email && <span>{profile.email}</span>}
          {profile.email && profile.location && <span className="text-gray-300">|</span>}
          {profile.location && <span>{profile.location}</span>}
          {profile.location && profile.website && <span className="text-gray-300">|</span>}
          {profile.website && <span>{profile.website}</span>}
          {profile.wechat && (
            <>
              <span className="text-gray-300">|</span>
              <span>微信: {profile.wechat}</span>
            </>
          )}
        </div>

        {/* Separator */}
        <div className="mt-3 border-b" style={{ borderColor: primaryColor }} />
      </div>

      <div className="px-6 pb-5">
        {/* Summary – placed at the very top before modules */}
        {profile.summary && (
          <div className="mb-3">
            <div className="flex items-center mb-1.5">
              <div
                className="w-[3px] h-5 mr-2.5 rounded-sm"
                style={{ backgroundColor: primaryColor }}
              />
              <h3
                className="font-bold"
                style={{ fontSize: `${0.9 * fontSize}rem`, color: primaryColor }}
              >
                自我评价
              </h3>
            </div>
            <p
              className="leading-snug text-gray-700 pl-[14px]"
              style={{ fontSize: `${0.8 * fontSize}rem` }}
            >
              {profile.summary}
            </p>
          </div>
        )}

        {/* Modules */}
        <div className="space-y-3">
          {modules.filter(m => m.visible).map((module) => (
            <div key={module.id}>
              {/* Section title – red bold + left red vertical bar */}
              <div className="flex items-center mb-1.5">
                <div
                  className="w-[3px] h-5 mr-2.5 rounded-sm"
                  style={{ backgroundColor: primaryColor }}
                />
                <h3
                  className="font-bold"
                  style={{ fontSize: `${0.9 * fontSize}rem`, color: primaryColor }}
                >
                  {module.title}
                </h3>
              </div>

              {isSkillsModule(module) ? (
                /* Skill tags – red rounded pill (light red bg + red text) */
                <div className="flex flex-wrap gap-2 pl-[14px]">
                  {module.items.map((item: SkillItem) => (
                    <span
                      key={item.id}
                      className="px-2.5 py-0.5 rounded-full font-medium"
                      style={{
                        fontSize: `${0.78 * fontSize}rem`,
                        color: primaryColor,
                        backgroundColor: 'var(--color-accent)',
                        border: '1px solid',
                        borderColor: primaryColor,
                      }}
                    >
                      {item.name}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="space-y-2 pl-[14px]">
                  {module.items.map((item: ResumeItem) => (
                    <div key={item.id}>
                      {/* Company + Position + Date – same line */}
                      <div className="flex justify-between items-baseline mb-0.5">
                        <div className="flex items-baseline gap-2 flex-1 min-w-0">
                          <h4 className="font-bold flex-shrink-0" style={{ fontSize: `${0.9 * fontSize}rem` }}>
                            {item.title}
                          </h4>
                          {item.subtitle && (
                            <span
                              className="text-gray-600 truncate"
                              style={{ fontSize: `${0.8 * fontSize}rem` }}
                            >
                              {item.subtitle}
                            </span>
                          )}
                        </div>
                        {item.date && (
                          <span
                            className="text-gray-500 whitespace-nowrap ml-3"
                            style={{ fontSize: `${0.8 * fontSize}rem` }}
                          >
                            {item.date}
                          </span>
                        )}
                      </div>

                      {/* Location with school tags */}
                      {item.location && (
                        <div className="text-gray-500 mb-0.5" style={{ fontSize: `${0.78 * fontSize}rem` }}>
                          {renderLocationWithTags(item.location)}
                        </div>
                      )}

                      {/* Description – bullet list */}
                      {item.description && (
                        <div
                          className="text-gray-700 leading-snug whitespace-pre-line"
                          style={{ fontSize: `${0.8 * fontSize}rem` }}
                        >
                          {item.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
