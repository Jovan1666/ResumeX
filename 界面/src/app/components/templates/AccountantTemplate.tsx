import React from 'react';
import { ResumeData, isSkillsModule, SkillItem, ResumeItem } from '@/app/types/resume';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';
import { Phone, Mail, MapPin } from 'lucide-react';

interface TemplateProps {
  data: ResumeData;
}

export const AccountantTemplate: React.FC<TemplateProps> = ({ data }) => {
  const { profile, modules, settings } = data;
  const fontSize = settings.fontSizeScale || 1;
  const primaryColor = 'var(--color-primary)'; // Teal blue theme

  // Separate modules - skills and summary go to left, rest to right
  const leftModules = modules.filter(m => m.type === 'skills' && m.visible);
  const rightModules = modules.filter(m => m.type !== 'skills' && m.visible);

  return (
    <div 
      className="w-full h-full bg-white font-sans flex"
      style={{ fontSize: `${12.5 * fontSize}px`, color: 'var(--color-text)' }}
    >
      {/* Left Sidebar */}
      <div 
        className="w-[32%] min-h-full text-white p-4 flex-shrink-0"
        style={{ backgroundColor: primaryColor }}
      >
        {/* Avatar */}
        {profile.avatar && (
          <div className="mb-3">
            <div className="w-full aspect-square rounded overflow-hidden border-4 border-white/20">
              <ImageWithFallback 
                src={profile.avatar} 
                alt={profile.name} 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* Name */}
        <div className="text-center mb-3">
          <h1 
            className="font-bold text-white mb-1"
            style={{ fontSize: `${1.5 * fontSize}rem` }}
          >
            {profile.name}
          </h1>
          <p className="text-white/70" style={{ fontSize: `${0.78 * fontSize}rem` }}>
            求职意向：{profile.title || '会计/财务专员'}
          </p>
        </div>

        {/* Personal Info */}
        <div className="mb-3">
          <h3 
            className="font-bold text-white/60 uppercase tracking-wider mb-1.5 pb-2 border-b border-white/20"
            style={{ fontSize: `${0.7 * fontSize}rem` }}
          >
            个人信息
          </h3>
          <div className="space-y-3" style={{ fontSize: `${0.75 * fontSize}rem` }}>
            {profile.location && (
              <div className="flex items-start gap-2">
                <span className="text-white/60 w-12 flex-shrink-0">现 居：</span>
                <span>{profile.location}</span>
              </div>
            )}
            {profile.customFields?.map((field, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="text-white/60 w-12 flex-shrink-0">{field.label}：</span>
                <span>{field.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="mb-3">
          <h3 
            className="font-bold text-white/60 uppercase tracking-wider mb-1.5 pb-2 border-b border-white/20"
            style={{ fontSize: `${0.7 * fontSize}rem` }}
          >
            联系方式
          </h3>
          <div className="space-y-2" style={{ fontSize: `${0.75 * fontSize}rem` }}>
            {profile.phone && (
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-white/60" />
                <span>{profile.phone}</span>
              </div>
            )}
            {profile.email && (
              <div className="flex items-center gap-2 break-all">
                <Mail size={14} className="text-white/60" />
                <span>{profile.email}</span>
              </div>
            )}
          </div>
        </div>

        {/* Awards/Certificates */}
        <div className="mb-3">
          <h3 
            className="font-bold text-white/60 uppercase tracking-wider mb-1.5 pb-2 border-b border-white/20"
            style={{ fontSize: `${0.7 * fontSize}rem` }}
          >
            奖励荣誉
          </h3>
          <div className="space-y-2" style={{ fontSize: `${0.7 * fontSize}rem` }}>
            {leftModules.map(module => (
              isSkillsModule(module) && module.items.map((item: SkillItem) => (
                <div key={item.id} className="flex items-start gap-2">
                  <span className="text-yellow-300">★</span>
                  <span>{item.name}</span>
                </div>
              ))
            ))}
          </div>
        </div>
      </div>

      {/* Right Content */}
      <div className="flex-1 p-5" style={{ backgroundColor: 'var(--color-accent)' }}>
        {/* Header for right side */}
        <div className="text-right mb-1.5">
          <h2 
            className="font-bold"
            style={{ fontSize: `${0.95 * fontSize}rem`, color: primaryColor }}
          >
            {profile.name}
            <span className="text-gray-400 font-normal ml-2" style={{ fontSize: `${0.78 * fontSize}rem` }}>
              求职意向：{profile.title || '产品运营'}
            </span>
          </h2>
        </div>

        {/* Modules */}
        <div className="space-y-2.5">
          {rightModules.map((module) => (
            <div key={module.id}>
              {/* Section Header */}
              <div 
                className="flex items-center mb-1.5 pb-2 border-b"
                style={{ borderColor: primaryColor }}
              >
                <div 
                  className="w-6 h-6 rounded flex items-center justify-center text-white mr-2"
                  style={{ backgroundColor: primaryColor, fontSize: `${0.68 * fontSize}rem` }}
                >
                  ✦
                </div>
                <h3 
                  className="font-bold"
                  style={{ fontSize: `${0.85 * fontSize}rem`, color: primaryColor }}
                >
                  {module.title}
                </h3>
              </div>

              <div className="space-y-2">
                {!isSkillsModule(module) && module.items.map((item: ResumeItem) => (
                  <div key={item.id} className="mb-4 last:mb-0">
                    {/* Item Header */}
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        {[
                          item.date && <span key="date" className="font-bold" style={{ fontSize: `${0.85 * fontSize}rem` }}>{item.date}</span>,
                          item.subtitle && <span key="subtitle" style={{ color: primaryColor }}>{item.subtitle}</span>,
                          item.title && <span key="title" className="text-gray-600">{item.title}</span>
                        ].filter(Boolean).map((el, i, arr) => (
                          <React.Fragment key={i}>
                            {i > 0 && <span className="mx-4 text-gray-300">|</span>}
                            {el}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>

                    {/* Description */}
                    {item.description && (
                      <div className="text-gray-600 leading-snug mt-2 whitespace-pre-line" style={{ fontSize: `${0.75 * fontSize}rem` }}>
                        {item.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Summary */}
          {profile.summary && (
            <div>
              <div 
                className="flex items-center mb-1.5 pb-2 border-b"
                style={{ borderColor: primaryColor }}
              >
                <div 
                  className="w-6 h-6 rounded flex items-center justify-center text-white mr-2"
                  style={{ backgroundColor: primaryColor, fontSize: `${0.68 * fontSize}rem` }}
                >
                  ✦
                </div>
                <h3 
                  className="font-bold"
                  style={{ fontSize: `${0.85 * fontSize}rem`, color: primaryColor }}
                >
                  自我评价
                </h3>
              </div>
              <p className="text-gray-600 leading-snug" style={{ fontSize: `${0.78 * fontSize}rem` }}>
                {profile.summary}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
