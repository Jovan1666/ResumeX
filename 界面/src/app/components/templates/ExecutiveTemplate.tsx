import React from 'react';
import { ResumeData, isSkillsModule, SkillItem, ResumeItem } from '@/app/types/resume';

interface TemplateProps {
  data: ResumeData;
}

export const ExecutiveTemplate: React.FC<TemplateProps> = ({ data }) => {
  const { profile, modules, settings } = data;
  const fontSize = settings.fontSizeScale || 1;

  return (
    <div 
      className="w-full h-full bg-white px-10 py-8 text-[var(--color-text)]"
      style={{ fontSize: `${12.5 * fontSize}px`, fontFamily: '"Playfair Display", "Source Han Serif", "Noto Serif SC", Georgia, serif' }}
    >
      {/* Header - Executive style with lots of whitespace */}
      <div className="text-center mb-5">
        <h1 
          className="font-bold mb-3 tracking-widest"
          style={{ 
            fontSize: `${1.8 * fontSize}rem`,
            letterSpacing: '0.15em',
            color: 'var(--color-text)'
          }}
        >
          {profile.name}
        </h1>
        <p 
          className="font-light italic opacity-60 mb-3"
          style={{ fontSize: `${0.95 * fontSize}rem`, letterSpacing: '0.1em' }}
        >
          {profile.title}
        </p>
        
        {/* Gold Divider */}
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="w-16 h-px" style={{ backgroundColor: '#C9A96E' }}></div>
          <div className="w-2 h-2 rotate-45" style={{ backgroundColor: '#C9A96E' }}></div>
          <div className="w-16 h-px" style={{ backgroundColor: '#C9A96E' }}></div>
        </div>

        {/* Contact - Subtle */}
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 opacity-50" style={{ fontSize: `${0.75 * fontSize}rem`, fontFamily: '"Source Han Sans", system-ui, sans-serif' }}>
          {profile.email && <span>{profile.email}</span>}
          {profile.phone && <span>{profile.phone}</span>}
          {profile.location && <span>{profile.location}</span>}
          {profile.website && <span>{profile.website}</span>}
        </div>
      </div>

      {/* Executive Summary */}
      {profile.summary && (
        <div className="mb-5">
          <h2 
            className="text-center font-semibold uppercase tracking-[0.2em] mb-4"
            style={{ fontSize: `${0.85 * fontSize}rem`, color: '#C9A96E' }}
          >
            职业概述
          </h2>
          <p 
            className="leading-normal text-center opacity-80 max-w-[90%] mx-auto"
            style={{ fontSize: `${0.78 * fontSize}rem`, fontFamily: '"Source Han Sans", system-ui, sans-serif' }}
          >
            {profile.summary}
          </p>
        </div>
      )}

      {/* Modules */}
      <div className="space-y-5">
        {modules.filter(m => m.visible).map((module) => (
          <div key={module.id}>
            {/* Section Title */}
            <div className="text-center mb-3">
              <h2 
                className="font-semibold uppercase tracking-[0.2em] mb-2"
                style={{ fontSize: `${0.85 * fontSize}rem`, color: '#C9A96E' }}
              >
                {module.title}
              </h2>
              <div className="w-10 h-px mx-auto" style={{ backgroundColor: '#C9A96E' }}></div>
            </div>

            {isSkillsModule(module) ? (
              <div className="flex flex-wrap justify-center gap-4">
                {module.items.map((item: SkillItem) => (
                  <span 
                    key={item.id}
                    className="font-medium opacity-70"
                    style={{ 
                      fontSize: `${0.78 * fontSize}rem`,
                      fontFamily: '"Source Han Sans", system-ui, sans-serif'
                    }}
                  >
                    {item.name}
                  </span>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {module.items.map((item: ResumeItem) => (
                  <div key={item.id}>
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className="font-bold" style={{ fontSize: `${1.05 * fontSize}rem` }}>
                        {item.title}
                      </h3>
                      {item.date && (
                        <span 
                          className="font-light italic opacity-50 whitespace-nowrap ml-4"
                          style={{ fontSize: `${0.78 * fontSize}rem` }}
                        >
                          {item.date}
                        </span>
                      )}
                    </div>
                    {(item.subtitle || item.location) && (
                      <p 
                        className="font-medium opacity-60 mb-2"
                        style={{ 
                          fontSize: `${0.78 * fontSize}rem`,
                          fontFamily: '"Source Han Sans", system-ui, sans-serif'
                        }}
                      >
                        {item.subtitle}
                        {item.location && <span> | {item.location}</span>}
                      </p>
                    )}
                    {item.description && (
                      <div 
                        className="opacity-70 leading-snug whitespace-pre-line"
                        style={{ 
                          fontSize: `${0.78 * fontSize}rem`,
                          fontFamily: '"Source Han Sans", system-ui, sans-serif'
                        }}
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

      {/* Footer Decoration */}
      <div className="mt-6 flex items-center justify-center gap-3">
        <div className="w-16 h-px" style={{ backgroundColor: '#C9A96E' }}></div>
        <div className="w-2 h-2 rotate-45" style={{ backgroundColor: '#C9A96E' }}></div>
        <div className="w-16 h-px" style={{ backgroundColor: '#C9A96E' }}></div>
      </div>
    </div>
  );
};
