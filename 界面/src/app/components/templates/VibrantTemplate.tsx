import React from 'react';
import { ResumeData, isSkillsModule, SkillItem, ResumeItem } from '@/app/types/resume';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';

interface TemplateProps {
  data: ResumeData;
}

export const VibrantTemplate: React.FC<TemplateProps> = ({ data }) => {
  const { profile, modules, settings } = data;
  const fontSize = settings.fontSizeScale || 1;

  return (
    <div 
      className="w-full h-full bg-white flex font-sans text-[var(--color-text)]"
      style={{ fontSize: `${12.5 * fontSize}px` }}
    >
      {/* Sidebar Decor */}
      <div 
        className="w-[20px] h-full flex-shrink-0"
        style={{ background: 'linear-gradient(to bottom, var(--color-primary), var(--color-accent))' }}
      ></div>

      <div className="flex-1 p-5 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 mb-4">
          {profile.avatar && (
            <div 
              className="w-28 h-28 rounded-full border-4 p-1 flex-shrink-0"
              style={{ borderColor: 'var(--color-primary)' }}
            >
              <div className="w-full h-full rounded-full overflow-hidden">
                <ImageWithFallback 
                  src={profile.avatar} 
                  alt={profile.name} 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
          <div className="text-center sm:text-left flex-1">
            <h1 
              className="font-extrabold mb-1"
              style={{ fontSize: `${1.5 * fontSize}rem`, color: 'var(--color-primary)' }}
            >
              {profile.name}
            </h1>
            <p className="font-medium mb-3 opacity-80" style={{ fontSize: `${0.95 * fontSize}rem` }}>{profile.title}</p>
            <div className="opacity-60 space-y-1" style={{ fontSize: `${0.8 * fontSize}rem` }}>
              <p>{[profile.email, profile.phone].filter(Boolean).join(' • ')}</p>
              <p>{[profile.location, profile.website].filter(Boolean).join(' • ')}</p>
            </div>
          </div>
        </div>

        {/* Summary */}
        {profile.summary && (
          <div 
            className="mb-3 p-6 rounded-lg border-l-4"
            style={{ backgroundColor: 'var(--color-accent)', borderColor: 'var(--color-primary)' }}
          >
            <p className="leading-snug italic opacity-80" style={{ fontSize: `${0.8 * fontSize}rem` }}>{profile.summary}</p>
          </div>
        )}

        {/* Modules */}
        <div className="space-y-4">
          {modules.filter(m => m.visible).map((module) => (
            <div key={module.id}>
              <h3 
                className="font-bold mb-1.5 flex items-center gap-3"
                style={{ fontSize: `${0.95 * fontSize}rem`, color: 'var(--color-primary)' }}
              >
                {module.title}
                <span className="flex-1 h-px" style={{ backgroundColor: 'var(--color-secondary)', opacity: 0.2 }}></span>
              </h3>

              <div className="space-y-2.5">
                {isSkillsModule(module) ? (
                  <div className="flex flex-wrap gap-2">
                    {module.items.map((item: SkillItem) => (
                      <span 
                        key={item.id} 
                        className="px-3 py-1.5 bg-white border rounded-full text-xs font-bold uppercase"
                        style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
                      >
                        {item.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  module.items.map((item: ResumeItem) => (
                    <div key={item.id} className="group">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold opacity-90 transition-colors group-hover:text-[var(--color-primary)]">{item.title}</h4>
                        <span className="font-semibold opacity-40 whitespace-nowrap ml-4" style={{ fontSize: `${0.7 * fontSize}rem` }}>{item.date}</span>
                      </div>
                      <div className="font-medium mb-2" style={{ fontSize: `${0.8 * fontSize}rem`, color: 'var(--color-primary)' }}>
                        {item.subtitle}
                        {item.location && <span className="opacity-60 font-normal ml-1" style={{ color: 'var(--color-text)' }}>• {item.location}</span>}
                      </div>
                      {item.description && (
                        <div className="opacity-80 leading-snug text-sm whitespace-pre-line">
                          {item.description}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
