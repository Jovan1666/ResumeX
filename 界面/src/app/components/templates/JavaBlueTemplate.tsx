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

export const JavaBlueTemplate: React.FC<TemplateProps> = ({ data }) => {
  const { profile, modules, settings } = data;
  const fontSize = settings.fontSizeScale || 1;
  const primaryColor = 'var(--color-primary)';

  // Build personal info items from customFields or default fields
  const infoItems: string[] = [];
  if (profile.customFields && profile.customFields.length > 0) {
    profile.customFields.forEach(f => {
      if (f.value) infoItems.push(f.value);
    });
  }

  return (
    <div
      className="w-full h-full bg-white font-sans"
      style={{ fontSize: `${12.5 * fontSize}px`, color: 'var(--color-text)' }}
    >
      {/* Header */}
      <div className="px-6 pt-5 pb-4">
        {/* Job title as big heading */}
        <h1
          className="font-bold mb-1"
          style={{ fontSize: `${1.5 * fontSize}rem`, color: primaryColor }}
        >
          {profile.title || 'Java 后端开发实习生'}
        </h1>

        {/* Name – smaller, below title */}
        <p
          className="font-semibold mb-2 text-gray-800"
          style={{ fontSize: `${1 * fontSize}rem` }}
        >
          {profile.name}
        </p>

        {/* Personal info – one line */}
        <div
          className="flex flex-wrap items-center gap-x-2 gap-y-1 text-gray-600"
          style={{ fontSize: `${0.8 * fontSize}rem` }}
        >
          {profile.phone && <span>{profile.phone}</span>}
          {profile.phone && profile.email && <span className="text-gray-300">|</span>}
          {profile.email && <span>{profile.email}</span>}
          {(profile.phone || profile.email) && profile.location && <span className="text-gray-300">|</span>}
          {profile.location && <span>{profile.location}</span>}
          {profile.wechat && (
            <>
              <span className="text-gray-300">|</span>
              <span>微信: {profile.wechat}</span>
            </>
          )}
          {profile.customFields?.map((field, idx) => (
            <React.Fragment key={idx}>
              <span className="text-gray-300">|</span>
              <span>{field.label}: {field.value}</span>
            </React.Fragment>
          ))}
        </div>

        {profile.website && (
          <div className="text-gray-500 mt-1" style={{ fontSize: `${0.78 * fontSize}rem` }}>
            {profile.website}
          </div>
        )}

        {/* Bottom blue line */}
        <div className="mt-3 border-b-2" style={{ borderColor: primaryColor }} />
      </div>

      {/* Body */}
      <div className="px-6 pb-5">
        {/* Summary */}
        {profile.summary && (
          <div className="mb-3">
            <h3
              className="font-bold pb-1 mb-1.5 border-b"
              style={{ fontSize: `${0.9 * fontSize}rem`, color: primaryColor, borderColor: primaryColor }}
            >
              自我评价
            </h3>
            <p
              className="leading-snug text-gray-700"
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
              {/* Section title – blue bold + bottom blue underline */}
              <h3
                className="font-bold pb-1 mb-1.5 border-b"
                style={{ fontSize: `${0.9 * fontSize}rem`, color: primaryColor, borderColor: primaryColor }}
              >
                {module.title}
              </h3>

              {isSkillsModule(module) ? (
                /* Tech tags – blue pill (blue border + blue text, light blue bg) */
                <div className="flex flex-wrap gap-2">
                  {module.items.map((item: SkillItem) => (
                    <span
                      key={item.id}
                      className="px-2.5 py-0.5 rounded font-medium border"
                      style={{
                        fontSize: `${0.78 * fontSize}rem`,
                        color: primaryColor,
                        borderColor: primaryColor,
                        backgroundColor: 'var(--color-accent)',
                      }}
                    >
                      {item.name}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {module.items.map((item: ResumeItem) => (
                    <div key={item.id}>
                      {/* Item header */}
                      <div className="flex justify-between items-baseline mb-0.5">
                        <div className="flex items-baseline gap-2 flex-1 min-w-0">
                          <h4 className="font-bold flex-shrink-0" style={{ fontSize: `${0.9 * fontSize}rem` }}>
                            {item.title}
                          </h4>
                          {item.subtitle && (
                            <span className="text-gray-600" style={{ fontSize: `${0.8 * fontSize}rem` }}>
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
