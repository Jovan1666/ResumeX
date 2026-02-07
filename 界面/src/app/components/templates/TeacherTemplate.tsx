import React from 'react';
import { ResumeData, isSkillsModule, SkillItem, ResumeItem } from '@/app/types/resume';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';
import { Phone, Mail, Award, User } from 'lucide-react';

interface TemplateProps {
  data: ResumeData;
}

export const TeacherTemplate: React.FC<TemplateProps> = ({ data }) => {
  const { profile, modules, settings } = data;
  const fontSize = settings.fontSizeScale || 1;
  const primaryColor = 'var(--color-primary)'; // Dark blue theme

  // Separate modules
  const skillsModule = modules.find(m => m.type === 'skills' && m.visible);
  const educationModule = modules.find(m => m.type === 'education' && m.visible);
  const experienceModule = modules.find(m => m.type === 'experience' && m.visible);
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
        className="w-[32%] min-h-full text-white flex-shrink-0"
        style={{ backgroundColor: primaryColor }}
      >
        {/* Avatar with decorative frame */}
        <div className="px-6 pt-5 pb-3 flex justify-center">
          {profile.avatar && (
            <div className="relative">
              <div 
                className="w-28 h-28 rounded-full overflow-hidden border-4"
                style={{ borderColor: 'rgba(255,255,255,0.3)' }}
              >
                <ImageWithFallback 
                  src={profile.avatar} 
                  alt={profile.name} 
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Decorative corner */}
              <div 
                className="absolute -top-2 -left-2 w-8 h-8 border-l-2 border-t-2"
                style={{ borderColor: 'rgba(255,255,255,0.5)' }}
              ></div>
              <div 
                className="absolute -bottom-2 -right-2 w-8 h-8 border-r-2 border-b-2"
                style={{ borderColor: 'rgba(255,255,255,0.5)' }}
              ></div>
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
          <p className="text-white/70" style={{ fontSize: `${0.75 * fontSize}rem` }}>
            求职意向：{profile.title || '教师'}
          </p>
        </div>

        {/* Personal Info */}
        <div className="px-6 mb-3">
          <div className="flex items-center gap-2 mb-1.5 pb-2 border-b border-white/20">
            <User size={14} className="text-white/60" />
            <span className="text-white/80" style={{ fontSize: `${0.8 * fontSize}rem` }}>个人信息</span>
          </div>
          <div className="space-y-2" style={{ fontSize: `${0.75 * fontSize}rem` }}>
            {profile.customFields?.map((field, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-white/40"></span>
                <span>{field.label}：{field.value}</span>
              </div>
            ))}
            {profile.location && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-white/40"></span>
                <span>现居：{profile.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Contact */}
        <div className="px-6 mb-3">
          <div className="space-y-2" style={{ fontSize: `${0.75 * fontSize}rem` }}>
            {profile.phone && (
              <div className="flex items-center gap-2">
                <Phone size={12} className="text-white/60" />
                <span>{profile.phone}</span>
              </div>
            )}
            {profile.email && (
              <div className="flex items-center gap-2 break-all">
                <Mail size={12} className="text-white/60" />
                <span>{profile.email}</span>
              </div>
            )}
          </div>
        </div>

        {/* Skills/Certificates */}
        <div className="px-6 mb-3">
          <div className="flex items-center gap-2 mb-1.5 pb-2 border-b border-white/20">
            <Award size={14} className="text-white/60" />
            <span className="text-white/80" style={{ fontSize: `${0.8 * fontSize}rem` }}>技能证书</span>
          </div>
          <div className="space-y-2" style={{ fontSize: `${0.75 * fontSize}rem` }}>
            {skillsModule && isSkillsModule(skillsModule) && skillsModule.items.map((item: SkillItem) => (
              <div key={item.id} className="flex items-start gap-2">
                <span className="text-yellow-400 mt-0.5">•</span>
                <span>{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Awards */}
        <div className="px-6 mb-3">
          <div className="flex items-center gap-2 mb-1.5 pb-2 border-b border-white/20">
            <Award size={14} className="text-white/60" />
            <span className="text-white/80" style={{ fontSize: `${0.8 * fontSize}rem` }}>奖项荣誉</span>
          </div>
          <div className="space-y-2" style={{ fontSize: `${0.75 * fontSize}rem` }}>
            {otherModules.filter(m => m.type === 'custom').slice(0, 1).map(module => (
              !isSkillsModule(module) && module.items.map((item: ResumeItem) => (
                <div key={item.id} className="text-white/90">
                  {item.title}
                </div>
              ))
            ))}
          </div>
        </div>
      </div>

      {/* Right Content */}
      <div className="flex-1 p-5 bg-white">
        {/* Education */}
        {educationModule && (
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-gray-400">▶</span>
              <h3 
                className="font-bold"
                style={{ fontSize: `${0.9 * fontSize}rem`, color: primaryColor }}
              >
                教育背景
              </h3>
            </div>

            {!isSkillsModule(educationModule) && educationModule.items.map((item: ResumeItem) => (
              <div key={item.id} className="mb-1.5 last:mb-0 ml-5">
                <div className="flex items-baseline gap-3 mb-1">
                  {item.date && <span className="text-gray-500" style={{ fontSize: `${0.75 * fontSize}rem` }}>{item.date}</span>}
                  {item.subtitle && <span className="font-bold" style={{ color: primaryColor }}>{item.subtitle}</span>}
                </div>
                <p className="text-gray-600 ml-28" style={{ fontSize: `${0.8 * fontSize}rem` }}>
                  {item.title}
                </p>
                {item.description && (
                  <p className="text-gray-500 ml-28 mt-1" style={{ fontSize: `${0.75 * fontSize}rem` }}>
                    {item.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Experience */}
        {experienceModule && (
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-gray-400">▶</span>
              <h3 
                className="font-bold"
                style={{ fontSize: `${0.9 * fontSize}rem`, color: primaryColor }}
              >
                实践经验
              </h3>
            </div>

            {!isSkillsModule(experienceModule) && experienceModule.items.map((item: ResumeItem) => (
              <div key={item.id} className="mb-2 last:mb-0 ml-5">
                <div className="flex items-baseline justify-between mb-1">
                  <div className="flex items-baseline gap-3">
                    {item.date && <span className="text-gray-500" style={{ fontSize: `${0.75 * fontSize}rem` }}>{item.date}</span>}
                    {item.subtitle && <span className="font-bold" style={{ color: primaryColor }}>{item.subtitle}</span>}
                  </div>
                  {item.title && <span className="text-gray-600" style={{ fontSize: `${0.8 * fontSize}rem` }}>{item.title}</span>}
                </div>
                {item.description && (
                  <div className="text-gray-600 mt-2 ml-28 whitespace-pre-line" style={{ fontSize: `${0.8 * fontSize}rem` }}>
                    {item.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Other modules */}
        {otherModules.filter(m => m.type !== 'custom').map((module) => (
          <div key={module.id} className="mb-3">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-gray-400">▶</span>
              <h3 
                className="font-bold"
                style={{ fontSize: `${0.9 * fontSize}rem`, color: primaryColor }}
              >
                {module.title}
              </h3>
            </div>

            {!isSkillsModule(module) && module.items.map((item: ResumeItem) => (
              <div key={item.id} className="mb-1.5 last:mb-0 ml-5">
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
              <span className="text-gray-400">▶</span>
              <h3 
                className="font-bold"
                style={{ fontSize: `${0.9 * fontSize}rem`, color: primaryColor }}
              >
                自我评价
              </h3>
            </div>
            <p className="text-gray-600 leading-snug ml-5" style={{ fontSize: `${0.8 * fontSize}rem` }}>
              {profile.summary}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
