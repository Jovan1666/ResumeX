import React from 'react';
import { ResumeData, isSkillsModule, SkillItem, ResumeItem } from '@/app/types/resume';
import { Phone, Mail, MapPin, Globe } from 'lucide-react';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';

interface TemplateProps {
  data: ResumeData;
}

export const InfographicTemplate: React.FC<TemplateProps> = ({ data }) => {
  const { profile, modules, settings } = data;
  const fontSize = settings.fontSizeScale || 1;

  const skillModules = modules.filter(m => m.type === 'skills' && m.visible);
  const mainModules = modules.filter(m => m.type !== 'skills' && m.visible);

  // Generate stat cards from data
  const stats = [
    { 
      value: modules.find(m => m.type === 'experience')?.items.length || 0,
      label: '份工作'
    },
    {
      value: modules.find(m => m.type === 'projects')?.items.length || 0,
      label: '个项目'
    },
    {
      value: modules.find(m => m.type === 'skills')?.items.length || 0,
      label: '项技能'
    },
  ].filter(s => s.value > 0);

  return (
    <div 
      className="w-full h-full bg-white flex font-sans"
      style={{ fontSize: `${12.5 * fontSize}px` }}
    >
      {/* Left Column - Visual */}
      <div 
        className="w-[30%] text-white p-4 flex flex-col"
        style={{ backgroundColor: 'var(--color-primary)' }}
      >
        {/* Avatar */}
        {profile.avatar && (
          <div className="flex justify-center mb-5">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white/20">
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
          className="font-bold text-center mb-0.5"
          style={{ fontSize: `${1.5 * fontSize}rem` }}
        >
          {profile.name}
        </h1>
        <p className="text-center opacity-70 mb-5" style={{ fontSize: `${0.75 * fontSize}rem` }}>
          {profile.title}
        </p>

        {/* Contact */}
        <div className="mb-3 space-y-2" style={{ fontSize: `${0.68 * fontSize}rem` }}>
          <h3 className="uppercase tracking-wider font-bold opacity-50 mb-2" style={{ fontSize: `${0.65 * fontSize}rem` }}>
            联系方式
          </h3>
          {profile.phone && (
            <div className="flex items-center gap-2">
              <Phone size={11} className="opacity-60" />
              <span className="opacity-80">{profile.phone}</span>
            </div>
          )}
          {profile.email && (
            <div className="flex items-center gap-2">
              <Mail size={11} className="opacity-60" />
              <span className="opacity-80 break-all">{profile.email}</span>
            </div>
          )}
          {profile.location && (
            <div className="flex items-center gap-2">
              <MapPin size={11} className="opacity-60" />
              <span className="opacity-80">{profile.location}</span>
            </div>
          )}
          {profile.website && (
            <div className="flex items-center gap-2">
              <Globe size={11} className="opacity-60" />
              <span className="opacity-80 break-all">{profile.website}</span>
            </div>
          )}
        </div>

        {/* Skill Bars */}
        {skillModules.map((module) => (
          <div key={module.id} className="mb-3">
            <h3 className="uppercase tracking-wider font-bold opacity-50 mb-1.5" style={{ fontSize: `${0.65 * fontSize}rem` }}>
              {module.title}
            </h3>
            <div className="space-y-3">
              {isSkillsModule(module) && module.items.map((item: SkillItem, index: number) => {
                const level = item.level || (90 - index * 8);
                return (
                  <div key={item.id}>
                    <div className="flex justify-between mb-1">
                      <span style={{ fontSize: `${0.68 * fontSize}rem` }}>{item.name}</span>
                      <span className="opacity-50" style={{ fontSize: `${0.65 * fontSize}rem` }}>{Math.min(level, 99)}%</span>
                    </div>
                    <div className="w-full bg-white/15 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-white/80 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(level, 99)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Stat Cards */}
        {stats.length > 0 && (
          <div className="mt-auto">
            <h3 className="uppercase tracking-wider font-bold opacity-50 mb-1.5" style={{ fontSize: `${0.65 * fontSize}rem` }}>
              关键数据
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {stats.map((stat, index) => (
                <div 
                  key={index}
                  className="bg-white/10 rounded-lg p-3 text-center"
                >
                  <div className="font-bold" style={{ fontSize: `${1.5 * fontSize}rem` }}>
                    {stat.value}+
                  </div>
                  <div className="opacity-60" style={{ fontSize: `${0.65 * fontSize}rem` }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Column - Content */}
      <div className="flex-1 p-5 text-[var(--color-text)]">
        {/* Summary */}
        {profile.summary && (
          <div className="mb-7">
            <h3 
              className="font-bold uppercase tracking-wider mb-2 flex items-center gap-2"
              style={{ fontSize: `${0.85 * fontSize}rem`, color: 'var(--color-primary)' }}
            >
              <div className="w-5 h-0.5" style={{ backgroundColor: 'var(--color-primary)' }}></div>
              个人简介
            </h3>
            <p className="leading-snug opacity-80" style={{ fontSize: `${0.78 * fontSize}rem` }}>
              {profile.summary}
            </p>
          </div>
        )}

        {/* Main Content Modules */}
        <div className="space-y-3">
          {mainModules.map((module) => (
            <div key={module.id}>
              <h3 
                className="font-bold uppercase tracking-wider mb-1.5 flex items-center gap-2"
                style={{ fontSize: `${0.85 * fontSize}rem`, color: 'var(--color-primary)' }}
              >
                <div className="w-5 h-0.5" style={{ backgroundColor: 'var(--color-primary)' }}></div>
                {module.title}
              </h3>

              <div className="space-y-2 border-l-2 ml-2 pl-5" style={{ borderColor: 'var(--color-secondary)' }}>
                {!isSkillsModule(module) && module.items.map((item: ResumeItem) => (
                  <div key={item.id} className="relative">
                    {/* Dot on timeline */}
                    <div 
                      className="absolute -left-[25px] top-1.5 w-3 h-3 rounded-full border-2 bg-white"
                      style={{ borderColor: 'var(--color-primary)' }}
                    ></div>
                    <div className="flex justify-between items-start mb-0.5">
                      <h4 className="font-bold" style={{ fontSize: `${0.85 * fontSize}rem` }}>{item.title}</h4>
                      {item.date && (
                        <span 
                          className="font-medium whitespace-nowrap ml-3 px-2 py-0.5 rounded"
                          style={{ 
                            fontSize: `${0.68 * fontSize}rem`,
                            color: 'var(--color-primary)',
                            backgroundColor: 'var(--color-accent)'
                          }}
                        >
                          {item.date}
                        </span>
                      )}
                    </div>
                    {(item.subtitle || item.location) && (
                      <div 
                        className="font-medium mb-1.5 opacity-70"
                        style={{ fontSize: `${0.82 * fontSize}rem` }}
                      >
                        {item.subtitle}
                        {item.location && <span className="opacity-50 ml-2">| {item.location}</span>}
                      </div>
                    )}
                    {item.description && (
                      <div className="opacity-75 leading-snug whitespace-pre-line" style={{ fontSize: `${0.75 * fontSize}rem` }}>
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
