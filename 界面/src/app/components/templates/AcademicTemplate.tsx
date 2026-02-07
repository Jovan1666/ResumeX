import React from 'react';
import { ResumeData, isSkillsModule, SkillItem, ResumeItem } from '@/app/types/resume';

interface TemplateProps {
  data: ResumeData;
}

export const AcademicTemplate: React.FC<TemplateProps> = ({ data }) => {
  const { profile, modules, settings } = data;
  const fontSize = settings.fontSizeScale || 1;

  return (
    <div 
      className="w-full h-full bg-white px-6 py-5 text-[var(--color-text)]"
      style={{ fontSize: `${12.5 * fontSize}px`, fontFamily: '"Times New Roman", "SimSun", "Source Han Serif", serif' }}
    >
      {/* Header - Academic style centered */}
      <div className="text-center mb-3 pb-4 border-b-2" style={{ borderColor: 'var(--color-text)' }}>
        <h1 
          className="font-bold tracking-wide mb-2"
          style={{ fontSize: `${1.5 * fontSize}rem`, letterSpacing: '0.15em' }}
        >
          {profile.name}
        </h1>
        {profile.title && (
          <p className="opacity-70 mb-1.5" style={{ fontSize: `${0.95 * fontSize}rem` }}>
            {profile.title}
          </p>
        )}
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 opacity-70" style={{ fontSize: `${0.78 * fontSize}rem` }}>
          {profile.email && <span>{profile.email}</span>}
          {profile.phone && <span>| {profile.phone}</span>}
          {profile.location && <span>| {profile.location}</span>}
          {profile.website && <span>| {profile.website}</span>}
          {profile.customFields?.map((field, index) => (
            <span key={index}>| {field.label}: {field.value}</span>
          ))}
        </div>
      </div>

      {/* Summary */}
      {profile.summary && (
        <div className="mb-3">
          <h2 
            className="font-bold uppercase tracking-widest mb-1.5 pb-1 border-b"
            style={{ fontSize: `${0.9 * fontSize}rem`, borderColor: '#999' }}
          >
            PERSONAL SUMMARY / 个人简介
          </h2>
          <p className="leading-snug text-justify opacity-85" style={{ fontSize: `${0.8 * fontSize}rem` }}>
            {profile.summary}
          </p>
        </div>
      )}

      {/* Modules */}
      <div className="space-y-3">
        {modules.filter(m => m.visible).map((module) => {
          // Map module type to academic section title
          const sectionTitleMap: Record<string, string> = {
            'experience': 'WORK EXPERIENCE / 工作经历',
            'education': 'EDUCATION / 教育背景',
            'projects': 'RESEARCH & PROJECTS / 项目研究',
            'skills': 'SKILLS / 技能',
            'custom': module.title.toUpperCase(),
          };
          const sectionTitle = sectionTitleMap[module.type] || module.title.toUpperCase();

          return (
            <div key={module.id}>
              <h2 
                className="font-bold uppercase tracking-widest mb-1.5 pb-1 border-b"
                style={{ fontSize: `${0.9 * fontSize}rem`, borderColor: '#999' }}
              >
                {sectionTitle}
              </h2>

              {isSkillsModule(module) ? (
                <div className="space-y-1">
                  {module.items.map((item: SkillItem) => (
                    <span key={item.id} className="inline mr-4" style={{ fontSize: `${0.8 * fontSize}rem` }}>
                      <span className="opacity-70">&#8226;</span> {item.name}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {module.items.map((item: ResumeItem) => (
                    <div key={item.id}>
                      <div className="flex justify-between items-baseline mb-0.5">
                        <div className="flex-1">
                          {item.subtitle && <span className="font-bold" style={{ fontSize: `${0.9 * fontSize}rem` }}>{item.subtitle}</span>}
                          {item.location && (
                            <span className="opacity-60 ml-2" style={{ fontSize: `${0.8 * fontSize}rem` }}>
                              , {item.location}
                            </span>
                          )}
                        </div>
                        {item.date && (
                          <span className="italic opacity-60 whitespace-nowrap ml-4" style={{ fontSize: `${0.8 * fontSize}rem` }}>
                            {item.date}
                          </span>
                        )}
                      </div>
                      <p className="italic opacity-80 mb-1" style={{ fontSize: `${0.8 * fontSize}rem` }}>
                        {item.title}
                      </p>
                      {item.description && (
                        <div 
                          className="opacity-80 leading-snug pl-4 whitespace-pre-line"
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
          );
        })}
      </div>
    </div>
  );
};
