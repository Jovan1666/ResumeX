import React from 'react';
import { ResumeData, isSkillsModule, SkillItem, ResumeItem } from '@/app/types/resume';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';
import { Phone, Mail } from 'lucide-react';

interface TemplateProps {
  data: ResumeData;
}

export const OperationsTemplate: React.FC<TemplateProps> = ({ data }) => {
  const { profile, modules, settings } = data;
  const fontSize = settings.fontSizeScale || 1;
  const primaryColor = 'var(--color-primary)'; // Red theme

  return (
    <div 
      className="w-full h-full bg-white font-sans"
      style={{ fontSize: `${12.5 * fontSize}px`, color: 'var(--color-text)' }}
    >
      {/* Header with colored top bar */}
      <div className="h-2" style={{ backgroundColor: primaryColor }}></div>
      
      <div className="px-6 pt-6 pb-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            {/* Title */}
            <h1 
              className="font-bold mb-3"
              style={{ fontSize: `${1.5 * fontSize}rem`, color: 'var(--color-text)' }}
            >
              {profile.title || '运营专员'}
            </h1>
            
            {/* Personal Info */}
            <div className="flex flex-wrap items-center gap-3 text-gray-600" style={{ fontSize: `${0.8 * fontSize}rem` }}>
              {profile.name && <span>{profile.name}</span>}
              {profile.phone && (
                <>
                  <span className="text-gray-300">|</span>
                  <Phone size={12} className="inline" />
                  <span>{profile.phone}</span>
                </>
              )}
              {profile.email && (
                <>
                  <span className="text-gray-300">|</span>
                  <Mail size={12} className="inline" />
                  <span>{profile.email}</span>
                </>
              )}
            </div>
          </div>

          {profile.avatar && (
            <div className="ml-6 flex-shrink-0">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2" style={{ borderColor: primaryColor }}>
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
            {/* Section Header with tag style */}
            <div className="flex items-center mb-1.5">
              <div 
                className="px-3 py-1 text-white text-sm font-bold rounded-sm"
                style={{ backgroundColor: primaryColor }}
              >
                {module.title}
              </div>
              <div className="flex-1 h-px bg-gray-200 ml-3"></div>
            </div>

            <div className="space-y-2 ml-1">
              {isSkillsModule(module) ? (
                <div className="flex flex-wrap gap-2">
                  {module.items.map((item: SkillItem) => (
                    <span 
                      key={item.id} 
                      className="px-2 py-0.5 border rounded text-xs"
                      style={{ borderColor: primaryColor, color: primaryColor }}
                    >
                      {item.name}
                    </span>
                  ))}
                </div>
              ) : (
                module.items.map((item: ResumeItem) => (
                  <div key={item.id} className="mb-2 last:mb-0">
                    {/* Item Header */}
                    <div className="flex items-start gap-3 mb-2">
                      {/* Company Tag */}
                      <span 
                        className="px-2 py-0.5 text-white text-xs font-medium rounded-sm flex-shrink-0"
                        style={{ backgroundColor: 'var(--color-text)' }}
                      >
                        {item.subtitle || '公司'}
                      </span>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold" style={{ fontSize: `${0.95 * fontSize}rem` }}>{item.title}</h4>
                          {item.date && (
                            <span className="text-gray-500 whitespace-nowrap ml-2" style={{ fontSize: `${0.7 * fontSize}rem` }}>
                              {item.date}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Responsibility Tags */}
                    {item.location && (
                      <div className="mb-2">
                        <span 
                          className="text-xs font-medium mr-2"
                          style={{ color: primaryColor }}
                        >
                          负责业务：
                        </span>
                        <span className="text-gray-600 text-xs">{item.location}</span>
                      </div>
                    )}

                    {/* Description */}
                    {item.description && (
                      <div className="text-gray-600 leading-snug ml-0 whitespace-pre-line" style={{ fontSize: `${0.8 * fontSize}rem` }}>
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
            <div className="flex items-center mb-1.5">
              <div 
                className="px-3 py-1 text-white text-sm font-bold rounded-sm"
                style={{ backgroundColor: primaryColor }}
              >
                个人简介
              </div>
              <div className="flex-1 h-px bg-gray-200 ml-3"></div>
            </div>
            <p className="text-gray-700 leading-snug ml-1" style={{ fontSize: `${0.8 * fontSize}rem` }}>
              {profile.summary}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
