import React from 'react';
import { ResumeData, isSkillsModule, SkillItem, ResumeItem } from '@/app/types/resume';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';
import { Phone, Mail, MapPin, Award, GraduationCap, Briefcase, Heart } from 'lucide-react';

interface TemplateProps {
  data: ResumeData;
}

export const MedicalTemplate: React.FC<TemplateProps> = ({ data }) => {
  const { profile, modules, settings } = data;
  const fontSize = settings.fontSizeScale || 1;
  const primaryColor = 'var(--color-primary)'; // Medical blue theme

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
        {/* Avatar */}
        <div className="px-6 pt-5 pb-4">
          {profile.avatar && (
            <div className="w-28 h-32 mx-auto overflow-hidden rounded border-4 border-white/30">
              <ImageWithFallback 
                src={profile.avatar} 
                alt={profile.name} 
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>

        {/* Name & Title */}
        <div className="text-center px-6 mb-3">
          <h1 
            className="font-bold text-white mb-2"
            style={{ fontSize: `${1.5 * fontSize}rem` }}
          >
            {profile.name}
          </h1>
          <p className="text-white/80" style={{ fontSize: `${0.8 * fontSize}rem` }}>
            求职意向：{profile.title || '医生'}
          </p>
        </div>

        {/* Basic Info Section */}
        <div className="px-6 mb-3">
          <div className="flex items-center gap-2 mb-1.5 pb-2 border-b border-white/20">
            <span className="text-yellow-400">▶</span>
            <span 
              className="text-white font-medium"
              style={{ fontSize: `${0.8 * fontSize}rem` }}
            >
              基本信息
            </span>
          </div>
          <div className="space-y-2" style={{ fontSize: `${0.8 * fontSize}rem` }}>
            {profile.phone && (
              <div className="flex items-center gap-2">
                <Phone size={12} className="text-white/60" />
                <span>{profile.phone}</span>
              </div>
            )}
            {profile.email && (
              <div className="flex items-center gap-2">
                <Mail size={12} className="text-white/60" />
                <span className="break-all">{profile.email}</span>
              </div>
            )}
            {profile.location && (
              <div className="flex items-center gap-2">
                <MapPin size={12} className="text-white/60" />
                <span>{profile.location}</span>
              </div>
            )}
            {profile.customFields?.map((field, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-white/60 text-xs">{field.label}:</span>
                <span>{field.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Skills/Certificates Section */}
        <div className="px-6 mb-3">
          <div className="flex items-center gap-2 mb-1.5 pb-2 border-b border-white/20">
            <span className="text-yellow-400">▶</span>
            <span 
              className="text-white font-medium"
              style={{ fontSize: `${0.8 * fontSize}rem` }}
            >
              技能证书
            </span>
          </div>
          <div className="space-y-2" style={{ fontSize: `${0.7 * fontSize}rem` }}>
            {skillsModule && isSkillsModule(skillsModule) && skillsModule.items.map((item: SkillItem) => (
              <div key={item.id} className="flex items-start gap-2">
                <span className="text-yellow-400 mt-0.5">•</span>
                <span>{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Awards Section */}
        <div className="px-6 mb-3">
          <div className="flex items-center gap-2 mb-1.5 pb-2 border-b border-white/20">
            <span className="text-yellow-400">▶</span>
            <span 
              className="text-white font-medium"
              style={{ fontSize: `${0.8 * fontSize}rem` }}
            >
              荣誉证书
            </span>
          </div>
          <div className="space-y-2" style={{ fontSize: `${0.7 * fontSize}rem` }}>
            {otherModules.filter(m => m.type === 'custom').map(module => (
              !isSkillsModule(module) && module.items.map((item: ResumeItem) => (
                <div key={item.id} className="flex items-start gap-2">
                  <Award size={12} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span>{item.title}</span>
                </div>
              ))
            ))}
          </div>
        </div>
      </div>

      {/* Right Content */}
      <div className="flex-1 p-5 bg-white">
        {/* Education Background */}
        {educationModule && (
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1.5">
              <GraduationCap size={18} style={{ color: primaryColor }} />
              <h3 
                className="font-bold"
                style={{ fontSize: `${0.9 * fontSize}rem`, color: primaryColor }}
              >
                教育背景
              </h3>
            </div>

            {!isSkillsModule(educationModule) && educationModule.items.map((item: ResumeItem) => (
              <div key={item.id} className="mb-2 last:mb-0 pl-6">
                <div className="flex justify-between items-start mb-1">
                  {item.date && <span className="text-gray-500" style={{ fontSize: `${0.8 * fontSize}rem` }}>{item.date}</span>}
                  <div className="text-right">
                    {item.subtitle && <span className="font-bold">{item.subtitle}</span>}
                    <span className="text-gray-600 ml-2" style={{ fontSize: `${0.8 * fontSize}rem` }}>
                      {item.title}
                    </span>
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

        {/* Work Experience */}
        {experienceModule && (
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1.5">
              <Briefcase size={18} style={{ color: primaryColor }} />
              <h3 
                className="font-bold"
                style={{ fontSize: `${0.9 * fontSize}rem`, color: primaryColor }}
              >
                实习经历
              </h3>
            </div>

            {!isSkillsModule(experienceModule) && experienceModule.items.map((item: ResumeItem) => (
              <div key={item.id} className="mb-2 last:mb-0 pl-6">
                <div className="flex justify-between items-start mb-1">
                  {item.date && <span className="text-gray-500" style={{ fontSize: `${0.8 * fontSize}rem` }}>{item.date}</span>}
                  <div className="text-right">
                    {item.subtitle && <span className="font-bold">{item.subtitle}</span>}
                    <span className="text-gray-600 ml-2" style={{ fontSize: `${0.8 * fontSize}rem` }}>
                      {item.title}
                    </span>
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

        {/* Other Experience */}
        {otherModules.filter(m => m.type === 'projects').map((module) => (
          <div key={module.id} className="mb-3">
            <div className="flex items-center gap-2 mb-1.5">
              <Heart size={18} style={{ color: primaryColor }} />
              <h3 
                className="font-bold"
                style={{ fontSize: `${0.9 * fontSize}rem`, color: primaryColor }}
              >
                {module.title}
              </h3>
            </div>

            {!isSkillsModule(module) && module.items.map((item: ResumeItem) => (
              <div key={item.id} className="mb-2 last:mb-0 pl-6">
                <div className="flex justify-between items-start mb-1">
                  {item.date && <span className="text-gray-500" style={{ fontSize: `${0.8 * fontSize}rem` }}>{item.date}</span>}
                  <div className="text-right">
                    {item.subtitle && <span className="font-bold">{item.subtitle}</span>}
                    <span className="text-gray-600 ml-2" style={{ fontSize: `${0.8 * fontSize}rem` }}>
                      {item.title}
                    </span>
                  </div>
                </div>
                {item.description && (
                  <div className="text-gray-600 mt-2" style={{ fontSize: `${0.8 * fontSize}rem` }}>
                    {item.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}

        {/* Awards */}
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1.5">
            <Award size={18} style={{ color: primaryColor }} />
            <h3 
              className="font-bold"
              style={{ fontSize: `${0.9 * fontSize}rem`, color: primaryColor }}
            >
              获奖情况
            </h3>
          </div>
          <div className="pl-6 text-gray-600" style={{ fontSize: `${0.8 * fontSize}rem` }}>
            {profile.summary && profile.summary.split('\n').map((line, idx) => (
              <p key={idx} className="mb-1">{line}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
