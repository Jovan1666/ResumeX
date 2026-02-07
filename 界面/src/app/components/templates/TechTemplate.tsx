import React from 'react';
import { ResumeData, isSkillsModule, SkillItem, ResumeItem } from '@/app/types/resume';
import { Phone, Mail, MapPin, Globe } from 'lucide-react';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';

interface TemplateProps {
  data: ResumeData;
}

export const TechTemplate: React.FC<TemplateProps> = ({ data }) => {
  const { profile, modules, settings } = data;
  const fontSize = settings.fontSizeScale || 1;

  return (
    <div 
      className="w-full h-full bg-white p-6 text-[var(--color-text)] font-sans" 
      style={{ fontSize: `${12.5 * fontSize}px` }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 text-center md:text-left">
          <h1 
            className="font-bold mb-2"
            style={{ fontSize: `${1.5 * fontSize}rem`, color: 'var(--color-secondary)' }}
          >
            {profile.name}
          </h1>
          <p 
            className="font-medium mb-1.5"
            style={{ fontSize: `${0.95 * fontSize}rem`, color: 'var(--color-primary)' }}
          >
            {profile.title}
          </p>
          
          <div className="flex flex-wrap justify-center md:justify-start gap-3 opacity-80" style={{ fontSize: `${0.8 * fontSize}rem` }}>
            {profile.phone && (
              <div className="flex items-center gap-1.5">
                <Phone size={14} style={{ color: 'var(--color-primary)' }} />
                <span>{profile.phone}</span>
              </div>
            )}
            {profile.email && (
              <div className="flex items-center gap-1.5">
                <Mail size={14} style={{ color: 'var(--color-primary)' }} />
                <span>{profile.email}</span>
              </div>
            )}
            {profile.location && (
              <div className="flex items-center gap-1.5">
                <MapPin size={14} style={{ color: 'var(--color-primary)' }} />
                <span>{profile.location}</span>
              </div>
            )}
            {profile.website && (
              <div className="flex items-center gap-1.5">
                <Globe size={14} style={{ color: 'var(--color-primary)' }} />
                <span>{profile.website}</span>
              </div>
            )}
          </div>
        </div>

        {profile.avatar && (
          <div className="ml-6 hidden md:block">
            <div 
              className="w-24 h-24 rounded-lg overflow-hidden border-2"
              style={{ borderColor: 'var(--color-primary)' }}
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

      {/* Summary */}
      {profile.summary && (
        <div className="mb-3">
          <p className="leading-snug opacity-90">{profile.summary}</p>
        </div>
      )}

      {/* Modules */}
      <div className="space-y-4">
        {modules.filter(m => m.visible).map((module) => (
          <div key={module.id}>
            <div className="flex items-center gap-2 mb-1.5 border-b pb-2" style={{ borderColor: 'var(--color-secondary)', opacity: 0.2 }}>
              <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: 'var(--color-primary)' }}></div>
              <h3 
                className="font-bold uppercase tracking-wide"
                style={{ fontSize: `${0.9 * fontSize}rem`, color: 'var(--color-primary)' }}
              >
                {module.title}
              </h3>
            </div>

            <div className="space-y-2">
              {isSkillsModule(module) ? (
                <div className="flex flex-wrap gap-2">
                  {module.items.map((item: SkillItem) => (
                    <span 
                      key={item.id} 
                      className="px-3 py-1 rounded-full font-medium border"
                      style={{ 
                        fontSize: `${0.8 * fontSize}rem`,
                        backgroundColor: 'var(--color-accent)',
                        borderColor: 'var(--color-primary)',
                        color: 'var(--color-text)'
                      }}
                    >
                      {item.name}
                    </span>
                  ))}
                </div>
              ) : (
                module.items.map((item: ResumeItem) => (
                  <div key={item.id} className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                    <div className="sm:w-1/4 pt-1">
                      {item.date && (
                        <p className="font-semibold opacity-70 text-right sm:text-left" style={{ fontSize: `${0.8 * fontSize}rem` }}>
                          {item.date}
                        </p>
                      )}
                    </div>
                    <div className="sm:w-3/4">
                      <div className="flex justify-between items-baseline mb-1">
                        <h4 className="font-bold opacity-90">{item.title}</h4>
                      </div>
                      {(item.subtitle || item.location) && (
                        <div className="font-medium mb-2" style={{ fontSize: `${0.8 * fontSize}rem`, color: 'var(--color-primary)' }}>
                          {item.subtitle}
                          {item.location && <span className="opacity-60 font-normal ml-2 text-black">• {item.location}</span>}
                        </div>
                      )}
                      {item.description && (
                        <div className="opacity-80 leading-snug whitespace-pre-line" style={{ fontSize: `${0.8 * fontSize}rem` }}>
                          {item.description}
                        </div>
                      )}
                    </div>
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
