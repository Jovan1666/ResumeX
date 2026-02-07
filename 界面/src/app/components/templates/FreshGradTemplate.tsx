import React from 'react';
import { ResumeData, isSkillsModule, SkillItem, ResumeItem } from '@/app/types/resume';
import { Phone, Mail, MapPin, Globe, GraduationCap } from 'lucide-react';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';

interface TemplateProps {
  data: ResumeData;
}

export const FreshGradTemplate: React.FC<TemplateProps> = ({ data }) => {
  const { profile, modules, settings } = data;
  const fontSize = settings.fontSizeScale || 1;

  // Reorder: education first, then experience, projects, skills, custom
  const orderedModules = [...modules.filter(m => m.visible)].sort((a, b) => {
    const order: Record<string, number> = { education: 0, experience: 1, projects: 2, skills: 3, custom: 4 };
    return (order[a.type] ?? 5) - (order[b.type] ?? 5);
  });

  return (
    <div 
      className="w-full h-full bg-white font-sans text-[var(--color-text)]"
      style={{ fontSize: `${12.5 * fontSize}px` }}
    >
      {/* Top Banner */}
      <div 
        className="px-6 py-5 flex items-center gap-5"
        style={{ backgroundColor: 'var(--color-accent)' }}
      >
        {profile.avatar && (
          <div 
            className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0"
            style={{ border: '3px solid var(--color-primary)' }}
          >
            <ImageWithFallback 
              src={profile.avatar} 
              alt={profile.name} 
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 
              className="font-bold"
              style={{ fontSize: `${1.5 * fontSize}rem`, color: 'var(--color-primary)' }}
            >
              {profile.name}
            </h1>
            <span 
              className="px-3 py-0.5 rounded-full text-white font-medium"
              style={{ fontSize: `${0.7 * fontSize}rem`, backgroundColor: 'var(--color-primary)' }}
            >
              应届生
            </span>
          </div>
          <p className="opacity-70 mb-2" style={{ fontSize: `${0.95 * fontSize}rem` }}>
            {profile.title}
          </p>
          <div className="flex flex-wrap gap-3" style={{ fontSize: `${0.78 * fontSize}rem` }}>
            {profile.phone && (
              <div className="flex items-center gap-1.5 opacity-65">
                <Phone size={12} style={{ color: 'var(--color-primary)' }} />
                <span>{profile.phone}</span>
              </div>
            )}
            {profile.email && (
              <div className="flex items-center gap-1.5 opacity-65">
                <Mail size={12} style={{ color: 'var(--color-primary)' }} />
                <span>{profile.email}</span>
              </div>
            )}
            {profile.location && (
              <div className="flex items-center gap-1.5 opacity-65">
                <MapPin size={12} style={{ color: 'var(--color-primary)' }} />
                <span>{profile.location}</span>
              </div>
            )}
            {profile.website && (
              <div className="flex items-center gap-1.5 opacity-65">
                <Globe size={12} style={{ color: 'var(--color-primary)' }} />
                <span>{profile.website}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-5">
        {/* Summary */}
        {profile.summary && (
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap size={18} style={{ color: 'var(--color-primary)' }} />
              <h3 
                className="font-bold"
                style={{ fontSize: `${0.9 * fontSize}rem`, color: 'var(--color-primary)' }}
              >
                个人简介
              </h3>
            </div>
            <p className="leading-snug opacity-80 pl-7" style={{ fontSize: `${0.8 * fontSize}rem` }}>
              {profile.summary}
            </p>
          </div>
        )}

        {/* Modules - Education first */}
        <div className="space-y-3">
          {orderedModules.map((module) => (
            <div key={module.id}>
              {/* Section Title */}
              <div className="flex items-center gap-2 mb-1.5">
                <div 
                  className="h-5 w-1 rounded-full"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                ></div>
                <h3 
                  className="font-bold"
                  style={{ fontSize: `${0.9 * fontSize}rem`, color: 'var(--color-primary)' }}
                >
                  {module.title}
                </h3>
                <div className="flex-1 h-px ml-2" style={{ backgroundColor: 'var(--color-secondary)' }}></div>
              </div>

              {isSkillsModule(module) ? (
                <div className="flex flex-wrap gap-2 pl-3">
                  {module.items.map((item: SkillItem) => (
                    <span 
                      key={item.id}
                      className="px-3 py-1 rounded-full font-medium border"
                      style={{ 
                        fontSize: `${0.78 * fontSize}rem`,
                        borderColor: 'var(--color-primary)',
                        color: 'var(--color-primary)',
                        backgroundColor: 'var(--color-accent)'
                      }}
                    >
                      {item.name}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="space-y-1.5 pl-3">
                  {module.items.map((item: ResumeItem) => (
                    <div key={item.id} className="relative pl-5">
                      {/* Small dot */}
                      <div 
                        className="absolute left-0 top-2 w-2 h-2 rounded-full"
                        style={{ backgroundColor: 'var(--color-primary)' }}
                      ></div>
                      <div className="flex justify-between items-baseline mb-0.5">
                        <h4 className="font-bold" style={{ fontSize: `${0.95 * fontSize}rem` }}>{item.title}</h4>
                        {item.date && (
                          <span className="opacity-50 whitespace-nowrap ml-3" style={{ fontSize: `${0.75 * fontSize}rem` }}>
                            {item.date}
                          </span>
                        )}
                      </div>
                      {(item.subtitle || item.location) && (
                        <div 
                          className="font-medium mb-1"
                          style={{ fontSize: `${0.78 * fontSize}rem`, color: 'var(--color-primary)' }}
                        >
                          {item.subtitle}
                          {item.location && <span className="opacity-50 font-normal ml-2" style={{ color: 'var(--color-text)' }}>| {item.location}</span>}
                        </div>
                      )}
                      {item.description && (
                        <div className="opacity-75 leading-snug whitespace-pre-line" style={{ fontSize: `${0.78 * fontSize}rem` }}>
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
