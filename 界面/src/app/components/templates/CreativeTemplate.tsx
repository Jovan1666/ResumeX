import React from 'react';
import { ResumeData, isSkillsModule, SkillItem, ResumeItem } from '@/app/types/resume';
import { Phone, Mail, MapPin, Globe } from 'lucide-react';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';

interface TemplateProps {
  data: ResumeData;
}

export const CreativeTemplate: React.FC<TemplateProps> = ({ data }) => {
  const { profile, modules, settings } = data;
  const fontSize = settings.fontSizeScale || 1;

  return (
    <div 
      className="w-full h-full bg-white font-sans text-[var(--color-text)] overflow-hidden"
      style={{ fontSize: `${12.5 * fontSize}px` }}
    >
      {/* Creative Header with gradient wave */}
      <div className="relative" style={{ minHeight: '140px' }}>
        {/* Gradient Background */}
        <div 
          className="absolute inset-0"
          style={{ 
            background: 'linear-gradient(135deg, var(--color-primary), #a855f7, #ec4899)',
            clipPath: 'polygon(0 0, 100% 0, 100% 75%, 0 100%)'
          }}
        ></div>
        
        {/* Header Content */}
        <div className="relative z-10 px-6 pt-5 pb-10 flex items-center gap-6">
          {profile.avatar && (
            <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-white/30 shadow-lg flex-shrink-0">
              <ImageWithFallback 
                src={profile.avatar} 
                alt={profile.name} 
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="text-white">
            <h1 
              className="font-extrabold mb-1 drop-shadow-sm"
              style={{ fontSize: `${1.5 * fontSize}rem` }}
            >
              {profile.name}
            </h1>
            <p className="font-medium opacity-90 mb-3" style={{ fontSize: `${0.95 * fontSize}rem` }}>
              {profile.title}
            </p>
            <div className="flex flex-wrap gap-3 opacity-90" style={{ fontSize: `${0.75 * fontSize}rem` }}>
              {profile.phone && (
                <div className="flex items-center gap-1.5 bg-white/15 px-2.5 py-1 rounded-full backdrop-blur-sm">
                  <Phone size={12} />
                  <span>{profile.phone}</span>
                </div>
              )}
              {profile.email && (
                <div className="flex items-center gap-1.5 bg-white/15 px-2.5 py-1 rounded-full backdrop-blur-sm">
                  <Mail size={12} />
                  <span>{profile.email}</span>
                </div>
              )}
              {profile.location && (
                <div className="flex items-center gap-1.5 bg-white/15 px-2.5 py-1 rounded-full backdrop-blur-sm">
                  <MapPin size={12} />
                  <span>{profile.location}</span>
                </div>
              )}
              {profile.website && (
                <div className="flex items-center gap-1.5 bg-white/15 px-2.5 py-1 rounded-full backdrop-blur-sm">
                  <Globe size={12} />
                  <span>{profile.website}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Body Content */}
      <div className="px-6 pt-1 pb-5">
        {/* Summary Card */}
        {profile.summary && (
          <div 
            className="mb-7 p-5 rounded-xl border-l-4 shadow-sm"
            style={{ 
              backgroundColor: 'var(--color-accent)',
              borderColor: 'var(--color-primary)'
            }}
          >
            <p className="leading-snug opacity-85" style={{ fontSize: `${0.78 * fontSize}rem` }}>
              {profile.summary}
            </p>
          </div>
        )}

        {/* Modules */}
        <div className="space-y-3">
          {modules.filter(m => m.visible).map((module) => (
            <div key={module.id}>
              {/* Section Title with decoration */}
              <div className="flex items-center gap-3 mb-1.5">
                <div 
                  className="w-2 h-8 rounded-full"
                  style={{ background: 'linear-gradient(to bottom, var(--color-primary), #a855f7)' }}
                ></div>
                <h3 
                  className="font-bold"
                  style={{ fontSize: `${1.15 * fontSize}rem`, color: 'var(--color-primary)' }}
                >
                  {module.title}
                </h3>
              </div>

              {isSkillsModule(module) ? (
                <div className="flex flex-wrap gap-2 ml-5">
                  {module.items.map((item: SkillItem) => (
                    <span 
                      key={item.id}
                      className="px-4 py-1.5 rounded-full font-semibold text-white shadow-sm"
                      style={{ 
                        fontSize: `${0.78 * fontSize}rem`,
                        background: 'linear-gradient(135deg, var(--color-primary), #a855f7)'
                      }}
                    >
                      {item.name}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="space-y-2 ml-5">
                  {module.items.map((item: ResumeItem) => (
                    <div 
                      key={item.id} 
                      className="p-3 rounded-lg border border-gray-100 hover:shadow-sm transition-shadow"
                      style={{ backgroundColor: '#FAFAFA' }}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold" style={{ fontSize: `${0.85 * fontSize}rem` }}>{item.title}</h4>
                        {item.date && (
                          <span 
                            className="px-2 py-0.5 rounded-full font-medium whitespace-nowrap ml-3"
                            style={{ 
                              fontSize: `${0.68 * fontSize}rem`,
                              backgroundColor: 'var(--color-accent)',
                              color: 'var(--color-primary)'
                            }}
                          >
                            {item.date}
                          </span>
                        )}
                      </div>
                      {(item.subtitle || item.location) && (
                        <div 
                          className="font-medium mb-2"
                          style={{ fontSize: `${0.82 * fontSize}rem`, color: 'var(--color-primary)' }}
                        >
                          {item.subtitle}
                          {item.location && <span className="opacity-50 font-normal ml-2" style={{ color: 'var(--color-text)' }}>| {item.location}</span>}
                        </div>
                      )}
                      {item.description && (
                        <div className="opacity-75 leading-snug whitespace-pre-line" style={{ fontSize: `${0.82 * fontSize}rem` }}>
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
