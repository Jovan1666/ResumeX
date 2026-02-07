import React from 'react';
import { ResumeData, isSkillsModule, SkillItem, ResumeItem } from '@/app/types/resume';
import { Phone, Mail, MapPin, Globe } from 'lucide-react';

interface TemplateProps {
  data: ResumeData;
}

export const BusinessTemplate: React.FC<TemplateProps> = ({ data }) => {
  const { profile, modules, settings } = data;
  const fontSize = settings.fontSizeScale || 1;

  return (
    <div 
      className="w-full h-full bg-white p-6 font-sans text-[var(--color-text)]"
      style={{ fontSize: `${12.5 * fontSize}px` }}
    >
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--color-primary)' }}></div>
          <h1 className="font-bold tracking-tight" style={{ fontSize: `${1.5 * fontSize}rem` }}>{profile.name}</h1>
        </div>
        <p className="font-medium mb-3 ml-6" style={{ fontSize: `${0.95 * fontSize}rem`, color: 'var(--color-primary)' }}>{profile.title}</p>
        
        <div className="flex flex-wrap gap-x-3 gap-y-2 opacity-80 ml-6" style={{ fontSize: `${0.8 * fontSize}rem` }}>
          {profile.phone && (
            <div className="flex items-center gap-2">
              <Phone size={14} style={{ color: 'var(--color-primary)' }} />
              <span>{profile.phone}</span>
            </div>
          )}
          {profile.email && (
            <div className="flex items-center gap-2">
              <Mail size={14} style={{ color: 'var(--color-primary)' }} />
              <span>{profile.email}</span>
            </div>
          )}
          {profile.location && (
            <div className="flex items-center gap-2">
              <MapPin size={14} style={{ color: 'var(--color-primary)' }} />
              <span>{profile.location}</span>
            </div>
          )}
          {profile.website && (
            <div className="flex items-center gap-2">
              <Globe size={14} style={{ color: 'var(--color-primary)' }} />
              <span>{profile.website}</span>
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      {profile.summary && (
        <div className="mb-3 ml-6">
          <p className="opacity-80 leading-snug max-w-2xl">{profile.summary}</p>
        </div>
      )}

      {/* Modules */}
      <div className="space-y-4">
        {modules.filter(m => m.visible).map((module) => (
          <div key={module.id}>
            <div 
              className="px-4 py-2 mb-2 rounded-r-lg border-l-4"
              style={{ backgroundColor: 'var(--color-accent)', borderColor: 'var(--color-primary)' }}
            >
              <h3 
                className="font-bold uppercase tracking-wider"
                style={{ fontSize: `${0.9 * fontSize}rem`, color: 'var(--color-primary)' }}
              >
                {module.title}
              </h3>
            </div>

            <div className="space-y-2.5 px-4">
              {isSkillsModule(module) ? (
                <div className="flex flex-wrap gap-3">
                  {module.items.map((item: SkillItem) => (
                    <span 
                      key={item.id} 
                      className="px-4 py-1.5 bg-white border rounded shadow-sm"
                      style={{ borderColor: 'var(--color-secondary)', fontSize: `${0.8 * fontSize}rem` }}
                    >
                      {item.name}
                    </span>
                  ))}
                </div>
              ) : (
                module.items.map((item: ResumeItem) => (
                  <div key={item.id} className="relative pl-4 border-l" style={{ borderColor: 'var(--color-secondary)' }}>
                    <div 
                      className="absolute -left-1.5 top-1.5 w-3 h-3 bg-white border-2 rounded-full"
                      style={{ borderColor: 'var(--color-primary)' }}
                    ></div>
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold" style={{ fontSize: `${0.9 * fontSize}rem` }}>{item.title}</h4>
                      {item.date && (
                        <span 
                          className="font-medium px-2 py-0.5 rounded"
                          style={{ 
                            fontSize: `${0.8 * fontSize}rem`,
                            color: 'var(--color-primary)',
                            backgroundColor: 'var(--color-accent)'
                          }}
                        >
                          {item.date}
                        </span>
                      )}
                    </div>
                    {(item.subtitle || item.location) && (
                      <div className="font-medium mb-2 opacity-80" style={{ fontSize: `${0.8 * fontSize}rem` }}>
                        {item.subtitle}
                        {item.location && <span className="opacity-60 font-normal ml-2">| {item.location}</span>}
                      </div>
                    )}
                    {item.description && (
                      <div className="opacity-80 leading-snug whitespace-pre-line" style={{ fontSize: `${0.8 * fontSize}rem` }}>
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
