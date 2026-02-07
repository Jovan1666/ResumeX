import React from 'react';
import { ResumeData, isSkillsModule, SkillItem, ResumeItem } from '@/app/types/resume';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';
import { Phone, Mail, MapPin, Globe } from 'lucide-react';

interface TemplateProps {
  data: ResumeData;
}

export const ProfessionalTemplate: React.FC<TemplateProps> = ({ data }) => {
  const { profile, modules, settings } = data;
  const fontSize = settings.fontSizeScale || 1;

  const leftModules = modules.filter(m => m.type === 'skills' && m.visible);
  const rightModules = modules.filter(m => m.type !== 'skills' && m.visible);

  return (
    <div 
      className="w-full h-full bg-white flex font-sans"
      style={{ fontSize: `${12.5 * fontSize}px` }}
    >
      {/* Left Column */}
      <div 
        className="w-[30%] text-white p-4 flex flex-col"
        style={{ backgroundColor: 'var(--color-primary)' }}
      >
        {profile.avatar && (
          <div className="w-full aspect-square mb-4 rounded-lg overflow-hidden border-4 border-white/20">
            <ImageWithFallback 
              src={profile.avatar} 
              alt={profile.name} 
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="mb-4 space-y-2" style={{ fontSize: `${0.78 * fontSize}rem` }}>
          <h3 className="text-white/50 uppercase tracking-widest font-bold border-b border-white/20 pb-2 mb-2" style={{ fontSize: `${0.7 * fontSize}rem` }}>Contact</h3>
          
          {profile.phone && (
            <div className="flex items-center gap-3">
              <Phone size={16} className="shrink-0" />
              <span>{profile.phone}</span>
            </div>
          )}
          {profile.email && (
            <div className="flex items-center gap-3 break-all">
              <Mail size={16} className="shrink-0" />
              <span>{profile.email}</span>
            </div>
          )}
          {profile.location && (
            <div className="flex items-center gap-3">
              <MapPin size={16} className="shrink-0" />
              <span>{profile.location}</span>
            </div>
          )}
          {profile.website && (
            <div className="flex items-center gap-3 break-all">
              <Globe size={16} className="shrink-0" />
              <span>{profile.website}</span>
            </div>
          )}
        </div>

        {/* Skills in Left Column */}
        {leftModules.map((module) => (
          <div key={module.id} className="mb-4">
            <h3 
              className="text-white/50 uppercase tracking-widest font-bold border-b border-white/20 pb-2 mb-2"
              style={{ fontSize: `${0.7 * fontSize}rem` }}
            >
              {module.title}
            </h3>
            <div className="space-y-3">
              {isSkillsModule(module) && module.items.map((item: SkillItem) => (
                <div key={item.id}>
                  <div className="flex justify-between mb-1" style={{ fontSize: `${0.78 * fontSize}rem` }}>
                    <span>{item.name}</span>
                  </div>
                  {/* Fake progress bar for visual flair */}
                  <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-white h-full w-[85%] rounded-full"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Right Column */}
      <div className="flex-1 p-5" style={{ backgroundColor: 'var(--color-accent)' }}>
        <div 
          className="mb-4 border-b-2 pb-6"
          style={{ borderColor: 'var(--color-primary)' }}
        >
          <h1 
            className="font-bold uppercase tracking-tight mb-2"
            style={{ fontSize: `${1.5 * fontSize}rem`, color: 'var(--color-text)' }}
          >
            {profile.name}
          </h1>
          <p 
            className="opacity-80"
            style={{ fontSize: `${0.95 * fontSize}rem`, color: 'var(--color-text)' }}
          >
            {profile.title}
          </p>
        </div>

        {profile.summary && (
          <div className="mb-4">
            <h3 
              className="font-bold uppercase tracking-wider mb-1.5"
              style={{ color: 'var(--color-primary)' }}
            >
              Profile
            </h3>
            <p className="opacity-80 leading-snug text-[var(--color-text)]" style={{ fontSize: `${0.78 * fontSize}rem` }}>{profile.summary}</p>
          </div>
        )}

        <div className="space-y-4">
          {rightModules.map((module) => (
            <div key={module.id}>
              <h3 
                className="font-bold uppercase tracking-wider mb-1.5 flex items-center gap-3"
                style={{ color: 'var(--color-primary)' }}
              >
                <span 
                  className="w-6 h-6 flex items-center justify-center rounded-full text-xs text-white"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  {module.title.charAt(0)}
                </span>
                {module.title}
              </h3>

              <div className="space-y-2.5 border-l-2 ml-3 pl-6" style={{ borderColor: 'var(--color-secondary)' }}>
                {!isSkillsModule(module) && module.items.map((item: ResumeItem) => (
                  <div key={item.id} className="relative">
                    <div 
                      className="absolute -left-[31px] top-1.5 w-3 h-3 bg-white border-2 rounded-full"
                      style={{ borderColor: 'var(--color-primary)' }}
                    ></div>
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-[var(--color-text)]" style={{ fontSize: `${0.85 * fontSize}rem` }}>{item.title}</h4>
                      {item.date && <span className="font-bold" style={{ color: 'var(--color-primary)', fontSize: `${0.78 * fontSize}rem` }}>{item.date}</span>}
                    </div>
                    {(item.subtitle || item.location) && (
                      <div className="font-medium mb-2 opacity-60 text-[var(--color-text)]" style={{ fontSize: `${0.78 * fontSize}rem` }}>
                        {item.subtitle}
                        {item.location && <span className="font-normal opacity-60"> | {item.location}</span>}
                      </div>
                    )}
                    {item.description && (
                      <div className="opacity-80 leading-snug text-[var(--color-text)] whitespace-pre-line" style={{ fontSize: `${0.78 * fontSize}rem` }}>
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
