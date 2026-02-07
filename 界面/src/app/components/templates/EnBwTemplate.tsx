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
        <span key={tag} className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-gray-800 text-white">{tag}</span>
      ))}
    </span>
  );
};

export const EnBwTemplate: React.FC<TemplateProps> = ({ data }) => {
  const { profile, modules, settings } = data;
  const fontSize = settings.fontSizeScale || 1;

  return (
    <div
      className="w-full h-full bg-white px-6 pt-5 pb-5 font-serif"
      style={{ fontSize: `${12.5 * fontSize}px`, color: '#111827' }}
    >
      {/* Header – Name centered, ALL CAPS */}
      <div className="text-center mb-2">
        <h1
          className="font-bold uppercase tracking-wider mb-0.5"
          style={{ fontSize: `${1.5 * fontSize}rem`, letterSpacing: '0.15em' }}
        >
          {profile.name}
        </h1>

        {/* Job title / position */}
        {profile.title && (
          <p
            className="text-gray-600 italic mb-1.5"
            style={{ fontSize: `${0.9 * fontSize}rem` }}
          >
            {profile.title}
          </p>
        )}

        {/* Contact info – single centered line */}
        <div
          className="flex flex-wrap justify-center gap-x-1.5 text-gray-600"
          style={{ fontSize: `${0.8 * fontSize}rem` }}
        >
          {profile.email && <span>{profile.email}</span>}
          {profile.email && profile.phone && <span>|</span>}
          {profile.phone && <span>{profile.phone}</span>}
          {profile.phone && profile.location && <span>|</span>}
          {profile.location && <span>{profile.location}</span>}
          {profile.location && profile.website && <span>|</span>}
          {profile.website && <span>{profile.website}</span>}
        </div>
      </div>

      {/* Thin separator */}
      <div className="border-b border-gray-900 mb-3" />

      {/* Summary */}
      {profile.summary && (
        <div className="mb-3">
          <h2
            className="font-bold uppercase tracking-widest pb-1 mb-1.5 border-b border-gray-900"
            style={{ fontSize: `${0.9 * fontSize}rem`, letterSpacing: '0.12em' }}
          >
            SUMMARY
          </h2>
          <p
            className="leading-snug text-justify text-gray-700"
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
            {/* Section title – ALL CAPS + tracking-widest + bottom black underline */}
            <h2
              className="font-bold uppercase tracking-widest pb-1 mb-1.5 border-b border-gray-900"
              style={{ fontSize: `${0.9 * fontSize}rem`, letterSpacing: '0.12em' }}
            >
              {module.title}
            </h2>

            {isSkillsModule(module) ? (
              <div className="flex flex-wrap gap-x-4 gap-y-1" style={{ fontSize: `${0.8 * fontSize}rem` }}>
                {module.items.map((item: SkillItem) => (
                  <span key={item.id} className="text-gray-800">
                    <span className="mr-1.5 text-gray-400">–</span>
                    {item.name}
                  </span>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {module.items.map((item: ResumeItem) => (
                  <div key={item.id}>
                    {/* Title row: title/subtitle left, date right */}
                    <div className="flex justify-between items-baseline mb-0.5">
                      <div className="flex-1">
                        <span className="font-bold" style={{ fontSize: `${0.9 * fontSize}rem` }}>
                          {item.title}
                        </span>
                        {item.subtitle && (
                          <span className="italic text-gray-600 ml-2" style={{ fontSize: `${0.8 * fontSize}rem` }}>
                            {item.subtitle}
                          </span>
                        )}
                      </div>
                      {item.date && (
                        <span
                          className="text-gray-500 whitespace-nowrap ml-4 italic"
                          style={{ fontSize: `${0.8 * fontSize}rem` }}
                        >
                          {item.date}
                        </span>
                      )}
                    </div>

                    {/* Location with school tags */}
                    {item.location && (
                      <div className="text-gray-500 italic mb-0.5" style={{ fontSize: `${0.78 * fontSize}rem` }}>
                        {renderLocationWithTags(item.location)}
                      </div>
                    )}

                    {/* Description – bullet list with dash "–" */}
                    {item.description && (
                      <div
                        className="text-gray-700 leading-snug pl-4 whitespace-pre-line"
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
  );
};
