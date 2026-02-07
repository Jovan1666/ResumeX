import React from 'react';
import { ResumeData, isSkillsModule, SkillItem, ResumeItem } from '@/app/types/resume';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';

interface TemplateProps {
  data: ResumeData;
}

const schoolTagKeywords = ['985', '211', '双一流', '985/211工程', 'C9', '本科', '硕士', '博士'];

/** This template uses RED pills for school tags instead of blue */
const renderLocationWithTags = (location?: string) => {
  if (!location) return null;
  const parts = location.split(/[,，]/).map(t => t.trim());
  const tags = parts.filter(t => schoolTagKeywords.includes(t));
  const rest = parts.filter(t => !schoolTagKeywords.includes(t)).join('、');
  return (
    <span className="inline-flex items-center gap-1.5 flex-wrap">
      {rest && <span>{rest}</span>}
      {tags.map(tag => (
        <span key={tag} className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-red-500 text-white">{tag}</span>
      ))}
    </span>
  );
};

export const GradBlueTemplate: React.FC<TemplateProps> = ({ data }) => {
  const { profile, modules, settings } = data;
  const fontSize = settings.fontSizeScale || 1;
  const primaryColor = 'var(--color-primary)';

  // Parse customFields for exam scores table
  // Expected format: customFields with label like "数学", "英语", "政治", "专业课" and numeric values
  const scoreFields = profile.customFields?.filter(f => f.value && /^\d+/.test(f.value.trim())) || [];
  const hasScores = scoreFields.length > 0;
  const totalScore = scoreFields.reduce((sum, f) => {
    const num = parseInt(f.value, 10);
    return sum + (isNaN(num) ? 0 : num);
  }, 0);

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
              style={{ fontSize: `${1.5 * fontSize}rem`, color: primaryColor }}
            >
              {profile.name}
            </h1>

            {/* Direction / Specialty */}
            {profile.title && (
              <p
                className="font-medium text-gray-700 mb-2"
                style={{ fontSize: `${0.95 * fontSize}rem` }}
              >
                {profile.title}
              </p>
            )}

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
              {profile.website && (
                <>
                  <span className="text-gray-300">|</span>
                  <span>{profile.website}</span>
                </>
              )}
            </div>
          </div>

          {/* Avatar – top-right circular */}
          {profile.avatar && (
            <div className="ml-5 flex-shrink-0">
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

        {/* Bottom blue line */}
        <div className="mt-3 border-b-2" style={{ borderColor: primaryColor }} />
      </div>

      <div className="px-6 pb-5">
        {/* Exam scores table – only if customFields has numeric scores */}
        {hasScores && (
          <div className="mb-3">
            <h3
              className="font-bold pb-1 mb-1.5 border-b"
              style={{ fontSize: `${0.9 * fontSize}rem`, color: primaryColor, borderColor: primaryColor }}
            >
              初试成绩
            </h3>
            <div className="overflow-hidden rounded border" style={{ borderColor: primaryColor }}>
              <table className="w-full text-center" style={{ fontSize: `${0.8 * fontSize}rem` }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-accent)' }}>
                    {scoreFields.map((f, idx) => (
                      <th
                        key={idx}
                        className="py-1.5 px-2 font-semibold border-r last:border-r-0"
                        style={{ borderColor: primaryColor, color: primaryColor }}
                      >
                        {f.label}
                      </th>
                    ))}
                    <th
                      className="py-1.5 px-2 font-bold"
                      style={{ color: primaryColor }}
                    >
                      总分
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {scoreFields.map((f, idx) => (
                      <td
                        key={idx}
                        className="py-1.5 px-2 font-semibold border-r border-t last:border-r-0"
                        style={{ borderColor: primaryColor }}
                      >
                        {f.value}
                      </td>
                    ))}
                    <td
                      className="py-1.5 px-2 font-bold border-t"
                      style={{ borderColor: primaryColor, color: primaryColor }}
                    >
                      {totalScore}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Summary */}
        {profile.summary && (
          <div className="mb-3">
            <h3
              className="font-bold pb-1 mb-1.5 border-b"
              style={{ fontSize: `${0.9 * fontSize}rem`, color: primaryColor, borderColor: primaryColor }}
            >
              个人简介
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
              {/* Section title – blue bold + bottom underline */}
              <h3
                className="font-bold pb-1 mb-1.5 border-b"
                style={{ fontSize: `${0.9 * fontSize}rem`, color: primaryColor, borderColor: primaryColor }}
              >
                {module.title}
              </h3>

              {isSkillsModule(module) ? (
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

                      {/* Location with school tags (RED pills) */}
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
