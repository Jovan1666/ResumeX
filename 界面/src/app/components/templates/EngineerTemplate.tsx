import React from 'react';
import { ResumeData, isSkillsModule, SkillItem, ResumeItem } from '@/app/types/resume';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';
import { Phone, Mail } from 'lucide-react';

interface TemplateProps {
  data: ResumeData;
}

export const EngineerTemplate: React.FC<TemplateProps> = ({ data }) => {
  const { profile, modules, settings } = data;
  const fontSize = settings.fontSizeScale || 1;
  const primaryColor = 'var(--color-primary)'; // Red theme

  return (
    <div 
      className="w-full h-full bg-white font-sans"
      style={{ fontSize: `${12.5 * fontSize}px`, color: 'var(--color-text)' }}
    >
      {/* Header with colored bar */}
      <div className="h-1" style={{ backgroundColor: primaryColor }}></div>
      
      <div className="px-6 pt-6 pb-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            {/* Title */}
            <h1 
              className="font-bold mb-3"
              style={{ fontSize: `${1.5 * fontSize}rem`, color: 'var(--color-text)' }}
            >
              {profile.title || '工程师'}
            </h1>
            
            {/* Contact Info */}
            <div className="flex flex-wrap items-center gap-3 text-gray-600" style={{ fontSize: `${0.8 * fontSize}rem` }}>
              {profile.phone && (
                <span className="flex items-center gap-1">
                  ( +86 ) {profile.phone}
                </span>
              )}
              {profile.email && (
                <>
                  <span className="text-gray-300">|</span>
                  <span>{profile.email}</span>
                </>
              )}
            </div>
          </div>

          {profile.avatar && (
            <div className="ml-6 flex-shrink-0">
              <div className="w-20 h-20 rounded-lg overflow-hidden">
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
            <div 
              className="flex items-center mb-1.5 pb-1.5 border-b"
              style={{ borderColor: primaryColor }}
            >
              <h3 
                className="font-bold"
                style={{ fontSize: `${0.9 * fontSize}rem`, color: primaryColor }}
              >
                {module.title}
              </h3>
            </div>

            <div className="space-y-2">
              {isSkillsModule(module) ? (
                <div className="flex flex-wrap gap-2">
                  {module.items.map((item: SkillItem) => (
                    <span 
                      key={item.id} 
                      className="px-3 py-1 text-xs font-medium border rounded"
                      style={{ borderColor: primaryColor, color: primaryColor }}
                    >
                      {item.name}
                    </span>
                  ))}
                </div>
              ) : (
                module.items.map((item: ResumeItem) => (
                  <div key={item.id} className="mb-2 last:mb-0">
                    {/* Item Header Row */}
                    <div className="flex items-start gap-3 mb-2">
                      {/* Company/Org */}
                      <div className="flex items-center gap-2">
                        {item.subtitle && (
                          <h4 className="font-bold" style={{ fontSize: `${0.95 * fontSize}rem` }}>
                            {item.subtitle}
                          </h4>
                        )}
                        {item.location && (
                          <span 
                            className="px-2 py-0.5 text-xs rounded"
                            style={{ backgroundColor: 'var(--color-accent)', color: primaryColor }}
                          >
                            {item.location}
                          </span>
                        )}
                      </div>
                      
                      {/* Position */}
                      <span className="text-gray-600" style={{ fontSize: `${0.8 * fontSize}rem` }}>
                        {item.title}
                      </span>

                      {/* Date */}
                      {item.date && (
                        <span className="text-gray-500 ml-auto whitespace-nowrap" style={{ fontSize: `${0.7 * fontSize}rem` }}>
                          {item.date}
                        </span>
                      )}
                    </div>

                    {/* Tags if any */}
                    {item.description && item.description.includes('负责模块') && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {['性能优化', '测试验证'].map((tag, i) => (
                          <span 
                            key={i}
                            className="px-2 py-0.5 text-xs rounded"
                            style={{ backgroundColor: 'var(--color-accent)', color: primaryColor }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Description */}
                    {item.description && (
                      <div className="text-gray-600 leading-snug whitespace-pre-line" style={{ fontSize: `${0.8 * fontSize}rem` }}>
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
            <div 
              className="flex items-center mb-1.5 pb-1.5 border-b"
              style={{ borderColor: primaryColor }}
            >
              <h3 
                className="font-bold"
                style={{ fontSize: `${0.9 * fontSize}rem`, color: primaryColor }}
              >
                自我评价
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
