import React from 'react';
import { ResumeData, isSkillsModule, SkillItem, ResumeItem } from '@/app/types/resume';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';
import { Phone, Mail, User, Briefcase, Award, GraduationCap, Star } from 'lucide-react';

interface TemplateProps {
  data: ResumeData;
}

export const HRTemplate: React.FC<TemplateProps> = ({ data }) => {
  const { profile, modules, settings } = data;
  const fontSize = settings.fontSizeScale || 1;
  const primaryColor = 'var(--color-primary)'; // Blue-gray theme

  // Separate modules
  const educationModule = modules.find(m => m.type === 'education' && m.visible);
  const experienceModule = modules.find(m => m.type === 'experience' && m.visible);
  const skillsModule = modules.find(m => m.type === 'skills' && m.visible);
  const otherModules = modules.filter(m => 
    m !== educationModule && 
    m !== experienceModule && 
    m !== skillsModule && 
    m.visible
  );

  return (
    <div 
      className="w-full h-full bg-white font-sans flex"
      style={{ fontSize: `${12.5 * fontSize}px`, color: 'var(--color-text)' }}
    >
      {/* Left Sidebar */}
      <div 
        className="w-[35%] min-h-full text-white flex-shrink-0"
        style={{ backgroundColor: primaryColor }}
      >
        {/* Header with title */}
        <div 
          className="px-4 py-3 text-center"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <span className="text-white font-medium" style={{ fontSize: `${0.8 * fontSize}rem` }}>
            个人简历 <span className="text-white/70 text-xs">RESUME</span>
          </span>
        </div>

        {/* Avatar */}
        <div className="px-6 py-6">
          {profile.avatar && (
            <div className="w-28 h-28 mx-auto rounded overflow-hidden border-4 border-white/20">
              <ImageWithFallback 
                src={profile.avatar} 
                alt={profile.name} 
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>

        {/* Name */}
        <div className="text-center mb-3">
          <h1 
            className="font-bold text-white mb-1"
            style={{ fontSize: `${1.5 * fontSize}rem` }}
          >
            {profile.name}
          </h1>
          <p className="text-white/70" style={{ fontSize: `${0.8 * fontSize}rem` }}>
            求职意向：{profile.title || '人事专员'}
          </p>
        </div>

        {/* Personal Info Section */}
        <div className="px-6 mb-3">
          <div className="flex items-center gap-2 mb-1.5">
            <User size={14} className="text-white/60" />
            <span 
              className="text-white/80 font-medium"
              style={{ fontSize: `${0.8 * fontSize}rem` }}
            >
              个人信息
            </span>
          </div>
          <div className="space-y-2 text-white/90" style={{ fontSize: `${0.7 * fontSize}rem` }}>
            {profile.customFields?.map((field, index) => (
              <div key={index} className="flex">
                <span className="w-16 text-white/60">{field.label}</span>
                <span>{field.value}</span>
              </div>
            ))}
            {profile.location && (
              <div className="flex">
                <span className="w-16 text-white/60">现居</span>
                <span>{profile.location}</span>
              </div>
            )}
            {profile.phone && (
              <div className="flex">
                <span className="w-16 text-white/60">电话</span>
                <span>{profile.phone}</span>
              </div>
            )}
            {profile.email && (
              <div className="flex">
                <span className="w-16 text-white/60">邮箱</span>
                <span className="break-all">{profile.email}</span>
              </div>
            )}
          </div>
        </div>

        {/* Awards Section */}
        <div className="px-6 mb-3">
          <div className="flex items-center gap-2 mb-1.5">
            <Award size={14} className="text-white/60" />
            <span 
              className="text-white/80 font-medium"
              style={{ fontSize: `${0.8 * fontSize}rem` }}
            >
              奖励荣誉
            </span>
          </div>
          <div className="space-y-2" style={{ fontSize: `${0.7 * fontSize}rem` }}>
            {skillsModule && isSkillsModule(skillsModule) && skillsModule.items.map((item: SkillItem) => (
              <div key={item.id} className="flex items-start gap-2 text-white/90">
                <Star size={10} className="text-yellow-400 mt-1 flex-shrink-0" />
                <span>{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Content */}
      <div className="flex-1 p-5 bg-white">
        {/* Education Section */}
        {educationModule && (
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1.5">
              <div 
                className="w-7 h-7 rounded flex items-center justify-center text-white"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                <GraduationCap size={14} />
              </div>
              <h3 
                className="font-bold"
                style={{ fontSize: `${0.9 * fontSize}rem`, color: primaryColor }}
              >
                教育背景
              </h3>
            </div>
            
            {!isSkillsModule(educationModule) && educationModule.items.map((item: ResumeItem) => (
              <div key={item.id} className="mb-1.5">
                <div className="flex items-baseline justify-between mb-1">
                  {item.date && <span className="text-gray-500" style={{ fontSize: `${0.8 * fontSize}rem` }}>{item.date}</span>}
                  {item.subtitle && <span className="font-medium">{item.subtitle}</span>}
                </div>
                <p className="text-gray-600" style={{ fontSize: `${0.8 * fontSize}rem` }}>
                  {item.title}
                </p>
                {item.description && (
                  <p className="text-gray-500 mt-1" style={{ fontSize: `${0.7 * fontSize}rem` }}>
                    {item.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Work Experience Section */}
        {experienceModule && (
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1.5">
              <div 
                className="w-7 h-7 rounded flex items-center justify-center text-white"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                <Briefcase size={14} />
              </div>
              <h3 
                className="font-bold"
                style={{ fontSize: `${0.9 * fontSize}rem`, color: primaryColor }}
              >
                工作经历
              </h3>
            </div>

            {!isSkillsModule(experienceModule) && experienceModule.items.map((item: ResumeItem) => (
              <div key={item.id} className="mb-2 last:mb-0">
                <div className="flex justify-between items-start mb-1">
                  {item.date && <span className="text-gray-500" style={{ fontSize: `${0.8 * fontSize}rem` }}>{item.date}</span>}
                  <div className="text-right">
                    {item.subtitle && <span className="font-medium">{item.subtitle}</span>}
                    {item.title && (
                      <span className="text-gray-500 ml-2" style={{ fontSize: `${0.8 * fontSize}rem` }}>
                        {item.title}
                      </span>
                    )}
                  </div>
                </div>
                {item.description && (
                  <div className="text-gray-600 mt-2 whitespace-pre-line" style={{ fontSize: `${0.8 * fontSize}rem` }}>
                    {item.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Other Modules */}
        {otherModules.map((module) => (
          <div key={module.id} className="mb-3">
            <div className="flex items-center gap-2 mb-1.5">
              <div 
                className="w-7 h-7 rounded flex items-center justify-center text-white"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                <Star size={14} />
              </div>
              <h3 
                className="font-bold"
                style={{ fontSize: `${0.9 * fontSize}rem`, color: primaryColor }}
              >
                {module.title}
              </h3>
            </div>

            {!isSkillsModule(module) && module.items.map((item: ResumeItem) => (
              <div key={item.id} className="mb-1.5">
                {item.description && (
                  <div className="text-gray-600 whitespace-pre-line" style={{ fontSize: `${0.8 * fontSize}rem` }}>
                    {item.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}

        {/* Self Evaluation */}
        {profile.summary && (
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1.5">
              <div 
                className="w-7 h-7 rounded flex items-center justify-center text-white"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                <User size={14} />
              </div>
              <h3 
                className="font-bold"
                style={{ fontSize: `${0.9 * fontSize}rem`, color: primaryColor }}
              >
                个人评价
              </h3>
            </div>
            <p className="text-gray-600 leading-snug" style={{ fontSize: `${0.8 * fontSize}rem` }}>
              {profile.summary}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
