import React from 'react';
import { ResumeData, isSkillsModule, SkillItem, ResumeItem } from '@/app/types/resume';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';

interface TemplateProps {
  data: ResumeData;
}

export const MinimalTemplate: React.FC<TemplateProps> = ({ data }) => {
  const { profile, modules, settings } = data;
  const fontSize = settings.fontSizeScale || 1;

  return (
    <div 
      className="w-full h-full bg-white p-5 font-serif text-[var(--color-text)]"
      style={{ fontSize: `${12.5 * fontSize}px` }}
    >
      {/* Header */}
      <div 
        className="flex justify-between items-end border-b-2 pb-6 mb-3"
        style={{ borderColor: 'var(--color-text)' }}
      >
        <div>
          <h1 className="font-bold tracking-tight mb-2 uppercase" style={{ fontSize: `${1.5 * fontSize}rem` }}>{profile.name}</h1>
          <p className="opacity-60 italic" style={{ fontSize: `${0.95 * fontSize}rem` }}>{profile.title}</p>
        </div>
        <div className="text-right leading-snug opacity-80" style={{ fontSize: `${0.8 * fontSize}rem` }}>
          {profile.email && <p>{profile.email}</p>}
          {profile.phone && <p>{profile.phone}</p>}
          {profile.location && <p>{profile.location}</p>}
          {profile.website && <p>{profile.website}</p>}
        </div>
      </div>

      {/* Two Column Layout for Profile if Avatar exists */}
      <div className="flex gap-3 mb-3">
        <div className="flex-1">
           {profile.summary && (
            <p className="leading-snug text-justify mb-3 opacity-90">{profile.summary}</p>
          )}
        </div>
        {profile.avatar && (
          <div className="w-32 flex-shrink-0">
             <div 
               className="w-24 h-24 rounded-full overflow-hidden border ml-auto"
               style={{ borderColor: 'var(--color-secondary)' }}
             >
              <ImageWithFallback 
                src={profile.avatar} 
                alt={profile.name} 
                className="w-full h-full object-cover grayscale contrast-125"
              />
            </div>
          </div>
        )}
      </div>

      {/* Modules */}
      <div className="grid grid-cols-1 gap-4">
        {modules.filter(m => m.visible).map((module) => (
          <div key={module.id}>
            <h3 
              className="font-bold uppercase tracking-widest border-b pb-1 mb-1.5"
              style={{ fontSize: `${0.9 * fontSize}rem`, borderColor: 'var(--color-secondary)' }}
            >
              {module.title}
            </h3>

            <div className="space-y-2">
              {isSkillsModule(module) ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2">
                  {module.items.map((item: SkillItem) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-text)' }}></div>
                      <span className="font-medium" style={{ fontSize: `${0.8 * fontSize}rem` }}>{item.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                module.items.map((item: ResumeItem) => (
                  <div key={item.id} className="mb-1.5 last:mb-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h4 className="font-bold" style={{ fontSize: `${0.9 * fontSize}rem` }}>{item.title}</h4>
                      <span className="font-medium italic opacity-70" style={{ fontSize: `${0.8 * fontSize}rem` }}>{item.date}</span>
                    </div>
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="font-semibold" style={{ fontSize: `${0.8 * fontSize}rem` }}>{item.subtitle}</span>
                      {item.location && <span className="text-xs opacity-50">{item.location}</span>}
                    </div>
                    {item.description && (
                      <div 
                        className="leading-snug pl-4 border-l opacity-80 whitespace-pre-line"
                        style={{ fontSize: `${0.8 * fontSize}rem`, borderColor: 'var(--color-secondary)' }}
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
      </div>
    </div>
  );
};
