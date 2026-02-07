import React from 'react';
import { ResumeData, isSkillsModule, SkillItem, ResumeItem } from '@/app/types/resume';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';
import { FileText, GraduationCap, Briefcase, Award } from 'lucide-react';

interface TemplateProps {
  data: ResumeData;
}

export const MediaTemplate: React.FC<TemplateProps> = ({ data }) => {
  const { profile, modules, settings } = data;
  const fontSize = settings.fontSizeScale || 1;
  const primaryColor = 'var(--color-primary)'; // Dark blue theme

  return (
    <div 
      className="w-full h-full bg-white font-sans"
      style={{ fontSize: `${12.5 * fontSize}px`, color: 'var(--color-text)' }}
    >
      {/* Header with title bar */}
      <div 
        className="px-6 py-3 flex justify-between items-center"
        style={{ backgroundColor: primaryColor }}
      >
        <span className="text-white/80" style={{ fontSize: `${0.75 * fontSize}rem` }}>
          个人简历/<span className="text-xs text-white/60">PERSONAL RESUME</span>
        </span>
      </div>

      {/* Main Header */}
      <div className="px-6 pt-4 pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            {/* Name and Title */}
            <div className="flex items-baseline gap-3 mb-2">
              <h1 
                className="font-bold"
                style={{ fontSize: `${1.5 * fontSize}rem`, color: 'var(--color-text)' }}
              >
                {profile.name}
              </h1>
              <span className="text-gray-500" style={{ fontSize: `${0.8 * fontSize}rem` }}>
                专业：{profile.title || '新闻传播学'}
              </span>
            </div>
            
            {/* Personal Info Grid */}
            <div className="grid grid-cols-3 gap-x-3 gap-y-2 text-gray-600" style={{ fontSize: `${0.75 * fontSize}rem` }}>
              {profile.customFields?.map((field, index) => (
                <div key={index}>
                  <span className="text-gray-400">{field.label}：</span>
                  <span>{field.value}</span>
                </div>
              ))}
              {profile.phone && (
                <div>
                  <span className="text-gray-400">手机：</span>
                  <span>{profile.phone}</span>
                </div>
              )}
              {profile.email && (
                <div>
                  <span className="text-gray-400">邮箱：</span>
                  <span>{profile.email}</span>
                </div>
              )}
              {profile.location && (
                <div>
                  <span className="text-gray-400">地址：</span>
                  <span>{profile.location}</span>
                </div>
              )}
            </div>
          </div>

          {profile.avatar && (
            <div className="ml-6 flex-shrink-0">
              <div className="w-24 h-28 overflow-hidden">
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

      {/* Modules */}
      <div className="px-6 pb-5">
        {modules.filter(m => m.visible).map((module) => (
          <div key={module.id} className="mb-3">
            {/* Section Header */}
            <div 
              className="flex items-center mb-1.5 py-1.5 px-3 rounded-sm"
              style={{ backgroundColor: primaryColor }}
            >
              <div className="flex items-center gap-2 text-white">
                {module.type === 'education' && <GraduationCap size={14} />}
                {module.type === 'experience' && <Briefcase size={14} />}
                {module.type === 'skills' && <Award size={14} />}
                {module.type === 'projects' && <FileText size={14} />}
                {module.type === 'custom' && <FileText size={14} />}
                <h3 
                  className="font-bold"
                  style={{ fontSize: `${0.9 * fontSize}rem` }}
                >
                  {module.title}
                </h3>
              </div>
            </div>

            <div className="space-y-1.5">
              {isSkillsModule(module) ? (
                <div className="text-gray-700 space-y-1" style={{ fontSize: `${0.8 * fontSize}rem` }}>
                  {module.items.map((item: SkillItem, idx) => (
                    <div key={item.id} className="flex items-start">
                      <span className="mr-2">{idx + 1}、</span>
                      <span>{item.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                module.items.map((item: ResumeItem) => (
                  <div key={item.id} className="mb-1.5 last:mb-0">
                    {/* Item Header */}
                    <div className="flex items-baseline mb-1">
                      {item.date && (
                        <span className="text-gray-500 w-32 flex-shrink-0" style={{ fontSize: `${0.75 * fontSize}rem` }}>
                          {item.date}
                        </span>
                      )}
                      {item.subtitle && (
                        <h4 className="font-bold" style={{ fontSize: `${0.9 * fontSize}rem` }}>
                          {item.subtitle}
                        </h4>
                      )}
                      {item.title && (
                        <span className="text-gray-600 ml-4" style={{ fontSize: `${0.8 * fontSize}rem` }}>
                          {item.title}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    {item.description && (
                      <div className="text-gray-600 leading-snug ml-32 whitespace-pre-line" style={{ fontSize: `${0.8 * fontSize}rem` }}>
                        {item.description}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        ))}

        {/* Exam Info Table - Special for Media template */}
        {modules.find(m => m.title.includes('报考')) && (
          <div className="mb-3">
            <div 
              className="flex items-center mb-1.5 py-1.5 px-3 rounded-sm"
              style={{ backgroundColor: primaryColor }}
            >
              <div className="flex items-center gap-2 text-white">
                <FileText size={14} />
                <h3 
                  className="font-bold"
                  style={{ fontSize: `${0.9 * fontSize}rem` }}
                >
                  报考信息
                </h3>
              </div>
            </div>
            <table className="w-full border-collapse" style={{ fontSize: `${0.75 * fontSize}rem` }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-accent)' }}>
                  <th className="border px-3 py-2 text-left">报考院校</th>
                  <th className="border px-3 py-2 text-left">报考专业</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border px-3 py-2">{profile.location || '××大学'}</td>
                  <td className="border px-3 py-2">{profile.title || '新闻传播学'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Self Evaluation */}
        {profile.summary && (
          <div className="mb-3">
            <div 
              className="flex items-center mb-1.5 py-1.5 px-3 rounded-sm"
              style={{ backgroundColor: primaryColor }}
            >
              <div className="flex items-center gap-2 text-white">
                <FileText size={14} />
                <h3 
                  className="font-bold"
                  style={{ fontSize: `${0.9 * fontSize}rem` }}
                >
                  自我评价
                </h3>
              </div>
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
