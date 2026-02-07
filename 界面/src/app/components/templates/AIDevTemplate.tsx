import React from 'react';
import { ResumeData, isSkillsModule, SkillItem, ResumeItem } from '@/app/types/resume';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';
import { Phone, Mail, MapPin } from 'lucide-react';

interface TemplateProps {
  data: ResumeData;
}

export const AIDevTemplate: React.FC<TemplateProps> = ({ data }) => {
  const { profile, modules, settings } = data;
  const fontSize = settings.fontSizeScale || 1;
  const primaryColor = 'var(--color-primary)'; // Dark red theme

  return (
    <div 
      className="w-full h-full bg-white font-sans"
      style={{ fontSize: `${12.5 * fontSize}px`, color: 'var(--color-text)' }}
    >
      {/* Header */}
      <div className="px-6 pt-5 pb-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="mb-2">
              <span 
                className="font-bold"
                style={{ fontSize: `${0.95 * fontSize}rem`, color: primaryColor }}
              >
                {profile.name || '我的简历'}
              </span>
            </div>
            
            {/* Title */}
            <div className="mb-3">
              <span className="text-gray-500" style={{ fontSize: `${0.8 * fontSize}rem` }}>意向岗位：</span>
              <span className="font-medium" style={{ fontSize: `${0.9 * fontSize}rem` }}>
                {profile.title || 'AI应用开发工程师'}
              </span>
            </div>
            
            {/* Personal Info */}
            <div className="flex flex-wrap items-center gap-3 text-gray-600" style={{ fontSize: `${0.8 * fontSize}rem` }}>
              {profile.location && (
                <>
                  <MapPin size={12} className="inline" style={{ color: primaryColor }} />
                  <span>{profile.location}</span>
                </>
              )}
              {profile.phone && (
                <>
                  <span className="text-gray-300">|</span>
                  <Phone size={12} className="inline" style={{ color: primaryColor }} />
                  <span>{profile.phone}</span>
                </>
              )}
              {profile.email && (
                <>
                  <span className="text-gray-300">|</span>
                  <Mail size={12} className="inline" style={{ color: primaryColor }} />
                  <span>{profile.email}</span>
                </>
              )}
            </div>
          </div>

          {profile.avatar && (
            <div className="ml-6 flex-shrink-0">
              <div className="w-20 h-20 rounded overflow-hidden">
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
          <div key={module.id} className="mb-2">
            {/* Section Header with underline */}
            <div className="mb-1.5 pb-1 border-b-2" style={{ borderColor: primaryColor }}>
              <h3 
                className="font-bold"
                style={{ fontSize: `${0.9 * fontSize}rem`, color: primaryColor }}
              >
                {module.title}
              </h3>
            </div>

            <div className="space-y-2">
              {isSkillsModule(module) ? (
                <div className="space-y-2">
                  {module.items.map((item: SkillItem) => (
                    <div key={item.id} className="flex items-start">
                      <span className="mr-2 mt-0.5" style={{ color: primaryColor }}>▸</span>
                      <span style={{ fontSize: `${0.8 * fontSize}rem` }}>{item.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                module.items.map((item: ResumeItem) => (
                  <div key={item.id} className="mb-2 last:mb-0">
                    {/* Item Header */}
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <h4 className="font-bold" style={{ fontSize: `${0.95 * fontSize}rem` }}>{item.title}</h4>
                        {item.subtitle && (
                          <span 
                            className="px-2 py-0.5 text-xs font-medium rounded"
                            style={{ backgroundColor: 'var(--color-accent)', color: primaryColor }}
                          >
                            {item.subtitle}
                          </span>
                        )}
                      </div>
                      {item.date && (
                        <span className="text-gray-500 whitespace-nowrap" style={{ fontSize: `${0.7 * fontSize}rem` }}>
                          {item.date}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    {item.description && (
                      <div className="text-gray-700 leading-snug whitespace-pre-line" style={{ fontSize: `${0.8 * fontSize}rem` }}>
                        {item.description}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        ))}

        {/* Summary */}
        {profile.summary && (
          <div className="mb-2">
            <div className="mb-1.5 pb-1 border-b-2" style={{ borderColor: primaryColor }}>
              <h3 
                className="font-bold"
                style={{ fontSize: `${0.9 * fontSize}rem`, color: primaryColor }}
              >
                个人总结
              </h3>
            </div>
            <p className="text-gray-700 leading-snug" style={{ fontSize: `${0.8 * fontSize}rem` }}>
              {profile.summary}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
