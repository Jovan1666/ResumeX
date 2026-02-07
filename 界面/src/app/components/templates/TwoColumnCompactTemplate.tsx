import React from 'react';
import { ResumeData, isSkillsModule, SkillItem, ResumeItem } from '@/app/types/resume';
import { Phone, Mail, MapPin, Globe, MessageCircle } from 'lucide-react';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';

interface TemplateProps {
  data: ResumeData;
}

export const TwoColumnCompactTemplate: React.FC<TemplateProps> = ({ data }) => {
  const { profile, modules, settings } = data;
  const fontSize = settings.fontSizeScale || 1;

  const skillModules = modules.filter(m => m.type === 'skills' && m.visible);
  const educationModules = modules.filter(m => m.type === 'education' && m.visible);
  const mainModules = modules.filter(m => m.type !== 'skills' && m.type !== 'education' && m.visible);

  return (
    <div 
      className="w-full h-full bg-white flex font-sans"
      style={{ fontSize: `${12.5 * fontSize}px` }}
    >
      {/* Left Sidebar - Light colored */}
      <div 
        className="w-[32%] p-4 flex flex-col"
        style={{ backgroundColor: 'var(--color-accent)' }}
      >
        {/* Avatar */}
        {profile.avatar && (
          <div className="flex justify-center mb-5">
            <div 
              className="w-28 h-28 rounded-full overflow-hidden"
              style={{ border: '4px solid var(--color-primary)' }}
            >
              <ImageWithFallback 
                src={profile.avatar} 
                alt={profile.name} 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* Name */}
        <h1 
          className="font-bold text-center mb-1"
          style={{ fontSize: `${1.4 * fontSize}rem`, color: 'var(--color-primary)' }}
        >
          {profile.name}
        </h1>
        <p 
          className="text-center mb-5 opacity-70"
          style={{ fontSize: `${0.75 * fontSize}rem` }}
        >
          {profile.title}
        </p>

        {/* Contact Info */}
        <div className="mb-3">
          <h3 
            className="font-bold uppercase tracking-wider mb-1.5 pb-1 border-b"
            style={{ 
              fontSize: `${0.68 * fontSize}rem`, 
              color: 'var(--color-primary)',
              borderColor: 'var(--color-secondary)'
            }}
          >
            联系方式
          </h3>
          <div className="space-y-2.5" style={{ fontSize: `${0.7 * fontSize}rem` }}>
            {profile.phone && (
              <div className="flex items-center gap-2">
                <Phone size={12} style={{ color: 'var(--color-primary)' }} />
                <span className="opacity-80">{profile.phone}</span>
              </div>
            )}
            {profile.email && (
              <div className="flex items-center gap-2">
                <Mail size={12} style={{ color: 'var(--color-primary)' }} />
                <span className="opacity-80 break-all">{profile.email}</span>
              </div>
            )}
            {profile.location && (
              <div className="flex items-center gap-2">
                <MapPin size={12} style={{ color: 'var(--color-primary)' }} />
                <span className="opacity-80">{profile.location}</span>
              </div>
            )}
            {profile.website && (
              <div className="flex items-center gap-2">
                <Globe size={12} style={{ color: 'var(--color-primary)' }} />
                <span className="opacity-80 break-all">{profile.website}</span>
              </div>
            )}
            {profile.wechat && (
              <div className="flex items-center gap-2">
                <MessageCircle size={12} style={{ color: 'var(--color-primary)' }} />
                <span className="opacity-80">{profile.wechat}</span>
              </div>
            )}
          </div>
        </div>

        {/* Skills */}
        {skillModules.map((module) => (
          <div key={module.id} className="mb-3">
            <h3 
              className="font-bold uppercase tracking-wider mb-1.5 pb-1 border-b"
              style={{ 
                fontSize: `${0.68 * fontSize}rem`, 
                color: 'var(--color-primary)',
                borderColor: 'var(--color-secondary)'
              }}
            >
              {module.title}
            </h3>
            <div className="space-y-2.5">
              {isSkillsModule(module) && module.items.map((item: SkillItem) => (
                <div key={item.id}>
                  <div className="flex justify-between mb-1" style={{ fontSize: `${0.7 * fontSize}rem` }}>
                    <span className="font-medium opacity-90">{item.name}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-secondary)' }}>
                    <div 
                      className="h-full rounded-full"
                      style={{ 
                        backgroundColor: 'var(--color-primary)',
                        width: `${(item.level || 80)}%`
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Custom Fields if any */}
        {profile.customFields && profile.customFields.length > 0 && (
          <div className="mb-3">
            <h3 
              className="font-bold uppercase tracking-wider mb-1.5 pb-1 border-b"
              style={{ 
                fontSize: `${0.68 * fontSize}rem`, 
                color: 'var(--color-primary)',
                borderColor: 'var(--color-secondary)'
              }}
            >
              其他信息
            </h3>
            <div className="space-y-1.5" style={{ fontSize: `${0.7 * fontSize}rem` }}>
              {profile.customFields.map((field, index) => (
                <div key={index} className="flex items-start gap-1">
                  <span className="opacity-50 flex-shrink-0">{field.label}:</span>
                  <span className="opacity-80">{field.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education in sidebar */}
        {educationModules.map((module) => (
          <div key={module.id} className="mb-3">
            <h3 
              className="font-bold uppercase tracking-wider mb-1.5 pb-1 border-b"
              style={{ 
                fontSize: `${0.68 * fontSize}rem`, 
                color: 'var(--color-primary)',
                borderColor: 'var(--color-secondary)'
              }}
            >
              {module.title}
            </h3>
            {!isSkillsModule(module) && module.items.map((item: ResumeItem) => (
              <div key={item.id} className="mb-3 last:mb-0">
                {item.subtitle && <h4 className="font-bold" style={{ fontSize: `${0.75 * fontSize}rem` }}>{item.subtitle}</h4>}
                <p className="opacity-80" style={{ fontSize: `${0.7 * fontSize}rem` }}>{item.title}</p>
                {item.date && <p className="opacity-50" style={{ fontSize: `${0.68 * fontSize}rem` }}>{item.date}</p>}
                {item.description && (
                  <p className="opacity-70 mt-1 leading-snug" style={{ fontSize: `${0.68 * fontSize}rem` }}>{item.description}</p>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Right Main Content */}
      <div className="flex-1 p-5 text-[var(--color-text)]">
        {/* Summary */}
        {profile.summary && (
          <div className="mb-7">
            <h3 
              className="font-bold uppercase tracking-wider mb-2 pb-1 border-b-2"
              style={{ 
                fontSize: `${0.85 * fontSize}rem`, 
                color: 'var(--color-primary)',
                borderColor: 'var(--color-primary)'
              }}
            >
              个人简介
            </h3>
            <p className="leading-snug opacity-80" style={{ fontSize: `${0.78 * fontSize}rem` }}>
              {profile.summary}
            </p>
          </div>
        )}

        {/* Main Modules */}
        <div className="space-y-3">
          {mainModules.map((module) => (
            <div key={module.id}>
              <h3 
                className="font-bold uppercase tracking-wider mb-1.5 pb-1 border-b-2"
                style={{ 
                  fontSize: `${0.85 * fontSize}rem`, 
                  color: 'var(--color-primary)',
                  borderColor: 'var(--color-primary)'
                }}
              >
                {module.title}
              </h3>

              <div className="space-y-2">
                {!isSkillsModule(module) && module.items.map((item: ResumeItem) => (
                  <div key={item.id}>
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h4 className="font-bold" style={{ fontSize: `${0.85 * fontSize}rem` }}>{item.title}</h4>
                      {item.date && <span className="opacity-50 whitespace-nowrap ml-3" style={{ fontSize: `${0.7 * fontSize}rem` }}>{item.date}</span>}
                    </div>
                    {(item.subtitle || item.location) && (
                      <div 
                        className="font-medium mb-1.5"
                        style={{ fontSize: `${0.75 * fontSize}rem`, color: 'var(--color-primary)' }}
                      >
                        {item.subtitle}
                        {item.location && <span className="opacity-50 font-normal ml-2" style={{ color: 'var(--color-text)' }}>| {item.location}</span>}
                      </div>
                    )}
                    {item.description && (
                      <div 
                        className="opacity-75 leading-snug whitespace-pre-line"
                        style={{ fontSize: `${0.75 * fontSize}rem` }}
                      >
                        {item.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
