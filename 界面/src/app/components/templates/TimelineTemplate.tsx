import React from 'react';
import { ResumeData, isSkillsModule, SkillItem, ResumeItem } from '@/app/types/resume';
import { Phone, Mail, MapPin, Globe, MessageCircle } from 'lucide-react';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';

interface TemplateProps {
  data: ResumeData;
}

export const TimelineTemplate: React.FC<TemplateProps> = ({ data }) => {
  const { profile, modules, settings } = data;
  const fontSize = settings.fontSizeScale || 1;

  return (
    <div 
      className="w-full h-full bg-white p-6 font-sans text-[var(--color-text)]"
      style={{ fontSize: `${12.5 * fontSize}px` }}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3 pb-3 border-b-2" style={{ borderColor: 'var(--color-primary)' }}>
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
          <h1 
            className="font-bold mb-1"
            style={{ fontSize: `${1.5 * fontSize}rem`, color: 'var(--color-primary)' }}
          >
            {profile.name}
          </h1>
          <p className="font-medium mb-1.5 opacity-70" style={{ fontSize: `${0.95 * fontSize}rem` }}>
            {profile.title}
          </p>
          <div className="flex flex-wrap gap-3 opacity-70" style={{ fontSize: `${0.75 * fontSize}rem` }}>
            {profile.phone && (
              <div className="flex items-center gap-1.5">
                <Phone size={13} style={{ color: 'var(--color-primary)' }} />
                <span>{profile.phone}</span>
              </div>
            )}
            {profile.email && (
              <div className="flex items-center gap-1.5">
                <Mail size={13} style={{ color: 'var(--color-primary)' }} />
                <span>{profile.email}</span>
              </div>
            )}
            {profile.location && (
              <div className="flex items-center gap-1.5">
                <MapPin size={13} style={{ color: 'var(--color-primary)' }} />
                <span>{profile.location}</span>
              </div>
            )}
            {profile.website && (
              <div className="flex items-center gap-1.5">
                <Globe size={13} style={{ color: 'var(--color-primary)' }} />
                <span>{profile.website}</span>
              </div>
            )}
            {profile.wechat && (
              <div className="flex items-center gap-1.5">
                <MessageCircle size={13} style={{ color: 'var(--color-primary)' }} />
                <span>{profile.wechat}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary */}
      {profile.summary && (
        <div className="mb-3 pl-8 border-l-3" style={{ borderLeft: '3px solid var(--color-primary)', opacity: 0.85 }}>
          <p className="leading-snug" style={{ fontSize: `${0.8 * fontSize}rem` }}>{profile.summary}</p>
        </div>
      )}

      {/* Timeline Modules */}
      <div className="space-y-4">
        {modules.filter(m => m.visible).map((module) => (
          <div key={module.id}>
            {/* Section Title */}
            <div className="flex items-center gap-3 mb-2">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                style={{ backgroundColor: 'var(--color-primary)', fontSize: `${0.75 * fontSize}rem` }}
              >
                {module.title.charAt(0)}
              </div>
              <h3 
                className="font-bold"
                style={{ fontSize: `${0.9 * fontSize}rem`, color: 'var(--color-primary)' }}
              >
                {module.title}
              </h3>
              <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-secondary)' }}></div>
            </div>

            {/* Timeline Content */}
            {isSkillsModule(module) ? (
              <div className="ml-4 pl-8 flex flex-wrap gap-2">
                {module.items.map((item: SkillItem) => (
                  <span 
                    key={item.id}
                    className="px-3 py-1 rounded-full font-medium"
                    style={{ 
                      fontSize: `${0.75 * fontSize}rem`,
                      backgroundColor: 'var(--color-accent)',
                      color: 'var(--color-primary)',
                      border: '1px solid var(--color-secondary)'
                    }}
                  >
                    {item.name}
                  </span>
                ))}
              </div>
            ) : (
              <div className="ml-4 relative">
                {/* Vertical Timeline Line */}
                <div 
                  className="absolute left-[7px] top-2 bottom-2 w-0.5"
                  style={{ backgroundColor: 'var(--color-secondary)' }}
                ></div>
                
                <div className="space-y-2">
                  {module.items.map((item: ResumeItem, _index: number) => (
                    <div key={item.id} className="relative pl-8">
                      {/* Timeline Dot */}
                      <div 
                        className="absolute left-0 top-1.5 w-[15px] h-[15px] rounded-full border-[3px] bg-white z-10"
                        style={{ borderColor: 'var(--color-primary)' }}
                      ></div>
                      
                      {/* Date Badge */}
                      {item.date && (
                        <span 
                          className="inline-block px-2 py-0.5 rounded font-semibold mb-1.5"
                          style={{ 
                            fontSize: `${0.75 * fontSize}rem`,
                            backgroundColor: 'var(--color-accent)',
                            color: 'var(--color-primary)'
                          }}
                        >
                          {item.date}
                        </span>
                      )}
                      
                      <h4 className="font-bold mb-0.5" style={{ fontSize: `${0.9 * fontSize}rem` }}>
                        {item.title}
                      </h4>
                      {(item.subtitle || item.location) && (
                        <div 
                          className="font-medium mb-1.5"
                          style={{ fontSize: `${0.8 * fontSize}rem`, color: 'var(--color-primary)' }}
                        >
                          {item.subtitle}
                          {item.location && <span className="opacity-50 font-normal ml-2" style={{ color: 'var(--color-text)' }}>| {item.location}</span>}
                        </div>
                      )}
                      {item.description && (
                        <div 
                          className="opacity-80 leading-snug whitespace-pre-line"
                          style={{ fontSize: `${0.8 * fontSize}rem` }}
                        >
                          {item.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
