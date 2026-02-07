import React from 'react';
import { ResumeData, isSkillsModule, SkillItem, ResumeItem } from '@/app/types/resume';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';
import { Phone, Mail, MapPin, Cake, GraduationCap, BookOpen, Briefcase } from 'lucide-react';

interface TemplateProps {
  data: ResumeData;
}

export const SalesTemplate: React.FC<TemplateProps> = ({ data }) => {
  const { profile, modules, settings } = data;
  const fontSize = settings.fontSizeScale || 1;
  const primaryColor = 'var(--color-primary)'; // Dark blue theme

  return (
    <div 
      className="w-full h-full bg-white font-sans"
      style={{ fontSize: `${12.5 * fontSize}px`, color: 'var(--color-text)' }}
    >
      {/* Header */}
      <div className="relative">
        {/* Top decorative corners */}
        <div 
          className="absolute top-0 right-0 w-32 h-32"
          style={{
            background: `linear-gradient(135deg, transparent 50%, ${primaryColor} 50%)`,
          }}
        ></div>

        <div className="px-6 pt-5 pb-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              {/* Name and Job Intent */}
              <h1 
                className="font-bold mb-2"
                style={{ fontSize: `${1.5 * fontSize}rem`, color: primaryColor }}
              >
                {profile.name}
              </h1>
              <p 
                className="mb-1.5"
                style={{ fontSize: `${0.95 * fontSize}rem`, color: primaryColor }}
              >
                求职意向：{profile.title || '销售类岗位'}
              </p>
              
              {/* Personal Info Grid */}
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-gray-600" style={{ fontSize: `${0.75 * fontSize}rem` }}>
                {profile.customFields?.map((field, index) => (
                  <div key={index} className="flex items-center gap-2">
                    {field.label === '出生' && <Cake size={12} style={{ color: primaryColor }} />}
                    {field.label === '籍贯' && <MapPin size={12} style={{ color: primaryColor }} />}
                    {field.label === '学历' && <GraduationCap size={12} style={{ color: primaryColor }} />}
                    {field.label === '工龄' && <Briefcase size={12} style={{ color: primaryColor }} />}
                    <span className="text-gray-500">{field.label}：</span>
                    <span>{field.value}</span>
                  </div>
                ))}
                {profile.location && (
                  <div className="flex items-center gap-2">
                    <MapPin size={12} style={{ color: primaryColor }} />
                    <span className="text-gray-500">地址：</span>
                    <span>{profile.location}</span>
                  </div>
                )}
                {profile.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={12} style={{ color: primaryColor }} />
                    <span className="text-gray-500">电话：</span>
                    <span>{profile.phone}</span>
                  </div>
                )}
                {profile.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={12} style={{ color: primaryColor }} />
                    <span className="text-gray-500">邮箱：</span>
                    <span>{profile.email}</span>
                  </div>
                )}
              </div>
            </div>

            {profile.avatar && (
              <div className="ml-6 flex-shrink-0 z-10">
                <div className="w-24 h-28 overflow-hidden border-2" style={{ borderColor: primaryColor }}>
                  <ImageWithFallback 
                    src={profile.avatar} 
                    alt={profile.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modules */}
      <div className="px-6 pb-5">
        {modules.filter(m => m.visible).map((module) => (
          <div key={module.id} className="mb-3">
            {/* Section Header */}
            <div className="flex items-center mb-1.5">
              <div 
                className="w-6 h-6 rounded flex items-center justify-center text-white mr-2"
                style={{ backgroundColor: primaryColor }}
              >
                {module.type === 'education' && <GraduationCap size={14} />}
                {module.type === 'experience' && <Briefcase size={14} />}
                {module.type === 'skills' && <BookOpen size={14} />}
                {module.type === 'projects' && <Briefcase size={14} />}
                {module.type === 'custom' && <BookOpen size={14} />}
              </div>
              <h3 
                className="font-bold"
                style={{ fontSize: `${0.9 * fontSize}rem`, color: primaryColor }}
              >
                {module.title}
              </h3>
              <div className="flex-1 h-px ml-3" style={{ backgroundColor: primaryColor }}></div>
            </div>

            <div className="space-y-2">
              {isSkillsModule(module) ? (
                <div className="text-gray-700" style={{ fontSize: `${0.8 * fontSize}rem` }}>
                  {module.items.map((item: SkillItem, idx) => (
                    <span key={item.id}>
                      {item.name}
                      {idx < module.items.length - 1 && '；'}
                    </span>
                  ))}
                </div>
              ) : (
                module.items.map((item: ResumeItem) => (
                  <div key={item.id} className="mb-2 last:mb-0">
                    {/* Item Header */}
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-3">
                        {item.date && (
                          <span 
                            className="font-bold px-2 py-0.5 rounded"
                            style={{ backgroundColor: 'var(--color-accent)', color: primaryColor, fontSize: `${0.8 * fontSize}rem` }}
                          >
                            {item.date}
                          </span>
                        )}
                        {item.subtitle && <h4 className="font-bold" style={{ fontSize: `${0.95 * fontSize}rem` }}>{item.subtitle}</h4>}
                        {item.title && (
                          <span 
                            className="px-2 py-0.5 text-white text-xs rounded"
                            style={{ backgroundColor: primaryColor }}
                          >
                            {item.title}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    {item.description && (
                      <div className="text-gray-600 leading-snug ml-2 whitespace-pre-line" style={{ fontSize: `${0.8 * fontSize}rem` }}>
                        {item.description}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        ))}

        {/* Self Evaluation */}
        {profile.summary && (
          <div className="mb-3">
            <div className="flex items-center mb-1.5">
              <div 
                className="w-6 h-6 rounded flex items-center justify-center text-white mr-2"
                style={{ backgroundColor: primaryColor }}
              >
                <BookOpen size={14} />
              </div>
              <h3 
                className="font-bold"
                style={{ fontSize: `${0.9 * fontSize}rem`, color: primaryColor }}
              >
                自我评价
              </h3>
              <div className="flex-1 h-px ml-3" style={{ backgroundColor: primaryColor }}></div>
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
