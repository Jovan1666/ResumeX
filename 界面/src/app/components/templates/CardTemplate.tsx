import React from 'react';
import { ResumeData, isSkillsModule, SkillItem, ResumeItem } from '@/app/types/resume';
import { Phone, Mail, MapPin, Globe, Briefcase, GraduationCap, FolderOpen, Star } from 'lucide-react';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';

interface TemplateProps {
  data: ResumeData;
}

const moduleIcons: Record<string, React.ReactNode> = {
  experience: <Briefcase size={16} />,
  education: <GraduationCap size={16} />,
  projects: <FolderOpen size={16} />,
  skills: <Star size={16} />,
  custom: <Star size={16} />,
};

export const CardTemplate: React.FC<TemplateProps> = ({ data }) => {
  const { profile, modules, settings } = data;
  const fontSize = settings.fontSizeScale || 1;

  const visibleModules = modules.filter(m => m.visible);
  const smallModules = visibleModules.filter(m => m.type === 'skills' || m.items.length <= 1);
  const largeModules = visibleModules.filter(m => m.type !== 'skills' && m.items.length > 1);

  return (
    <div 
      className="w-full h-full font-sans text-[var(--color-text)] p-5"
      style={{ fontSize: `${12.5 * fontSize}px`, backgroundColor: 'var(--color-background)' }}
    >
      {/* Header Card */}
      <div 
        className="rounded-xl p-4 mb-4 shadow-sm flex items-center gap-5"
        style={{ backgroundColor: 'white', border: '1px solid var(--color-secondary)' }}
      >
        {profile.avatar && (
          <div 
            className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 shadow-sm"
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
            className="font-bold mb-0.5"
            style={{ fontSize: `${1.5 * fontSize}rem`, color: 'var(--color-primary)' }}
          >
            {profile.name}
          </h1>
          <p className="font-medium opacity-70 mb-2" style={{ fontSize: `${0.95 * fontSize}rem` }}>
            {profile.title}
          </p>
          <div className="flex flex-wrap gap-3" style={{ fontSize: `${0.7 * fontSize}rem` }}>
            {profile.phone && (
              <div className="flex items-center gap-1 opacity-60">
                <Phone size={11} />
                <span>{profile.phone}</span>
              </div>
            )}
            {profile.email && (
              <div className="flex items-center gap-1 opacity-60">
                <Mail size={11} />
                <span>{profile.email}</span>
              </div>
            )}
            {profile.location && (
              <div className="flex items-center gap-1 opacity-60">
                <MapPin size={11} />
                <span>{profile.location}</span>
              </div>
            )}
            {profile.website && (
              <div className="flex items-center gap-1 opacity-60">
                <Globe size={11} />
                <span>{profile.website}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Card */}
      {profile.summary && (
        <div 
          className="rounded-xl p-3.5 mb-4 shadow-sm"
          style={{ backgroundColor: 'var(--color-accent)', border: '1px solid var(--color-secondary)' }}
        >
          <p className="leading-snug opacity-85" style={{ fontSize: `${0.78 * fontSize}rem` }}>
            {profile.summary}
          </p>
        </div>
      )}

      {/* Small Modules in 2-Column Grid */}
      {smallModules.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          {smallModules.map((module) => (
            <div 
              key={module.id}
              className="rounded-xl p-3.5 shadow-sm"
              style={{ backgroundColor: 'white', border: '1px solid var(--color-secondary)' }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div 
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  {moduleIcons[module.type] || moduleIcons.custom}
                </div>
                <h3 
                  className="font-bold"
                  style={{ fontSize: `${0.85 * fontSize}rem`, color: 'var(--color-primary)' }}
                >
                  {module.title}
                </h3>
              </div>

              {isSkillsModule(module) ? (
                <div className="flex flex-wrap gap-1.5">
                  {module.items.map((item: SkillItem) => (
                    <span 
                      key={item.id}
                      className="px-2.5 py-1 rounded-md font-medium"
                      style={{ 
                        fontSize: `${0.68 * fontSize}rem`,
                        backgroundColor: 'var(--color-accent)',
                        color: 'var(--color-primary)'
                      }}
                    >
                      {item.name}
                    </span>
                  ))}
                </div>
              ) : (
                module.items.map((item: ResumeItem) => (
                  <div key={item.id} className="mb-2 last:mb-0">
                    <h4 className="font-bold" style={{ fontSize: `${0.78 * fontSize}rem` }}>{item.title}</h4>
                    {item.subtitle && <p className="opacity-70" style={{ fontSize: `${0.7 * fontSize}rem` }}>{item.subtitle}</p>}
                    {item.date && <p className="opacity-50" style={{ fontSize: `${0.68 * fontSize}rem` }}>{item.date}</p>}
                    {item.description && (
                      <p className="opacity-70 mt-1 leading-snug whitespace-pre-wrap" style={{ fontSize: `${0.68 * fontSize}rem` }}>
                        {item.description}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      )}

      {/* Large Modules - Full Width Cards */}
      {largeModules.map((module) => (
        <div 
          key={module.id}
          className="rounded-xl p-3.5 mb-4 shadow-sm"
          style={{ backgroundColor: 'white', border: '1px solid var(--color-secondary)' }}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <div 
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {moduleIcons[module.type] || moduleIcons.custom}
            </div>
            <h3 
              className="font-bold"
              style={{ fontSize: `${0.85 * fontSize}rem`, color: 'var(--color-primary)' }}
            >
              {module.title}
            </h3>
          </div>

          <div className="space-y-2">
            {!isSkillsModule(module) && module.items.map((item: ResumeItem) => (
              <div key={item.id} className="pl-4 border-l-2" style={{ borderColor: 'var(--color-secondary)' }}>
                <div className="flex justify-between items-baseline mb-0.5">
                  <h4 className="font-bold" style={{ fontSize: `${0.85 * fontSize}rem` }}>{item.title}</h4>
                  {item.date && <span className="opacity-40 whitespace-nowrap ml-3" style={{ fontSize: `${0.68 * fontSize}rem` }}>{item.date}</span>}
                </div>
                {(item.subtitle || item.location) && (
                  <div 
                    className="font-medium mb-1"
                    style={{ fontSize: `${0.75 * fontSize}rem`, color: 'var(--color-primary)' }}
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
        </div>
      ))}
    </div>
  );
};
