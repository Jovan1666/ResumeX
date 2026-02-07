import React from 'react';
import { ResumeData, isSkillsModule, SkillItem, ResumeItem } from '@/app/types/resume';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';

interface TemplateProps {
  data: ResumeData;
}

export const CivilServiceTemplate: React.FC<TemplateProps> = ({ data }) => {
  const { profile, modules, settings } = data;
  const fontSize = settings.fontSizeScale || 1;

  return (
    <div 
      className="w-full h-full bg-white p-6 font-sans"
      style={{ fontSize: `${12.5 * fontSize}px`, color: 'var(--color-text)' }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h1 
            className="font-bold mb-2"
            style={{ fontSize: `${1.5 * fontSize}rem`, color: 'var(--color-text)' }}
          >
            {profile.name}
            {profile.title && (
              <span className="font-normal text-gray-500 ml-3" style={{ fontSize: `${0.9 * fontSize}rem` }}>
                - {profile.title}
              </span>
            )}
          </h1>
          
          <div className="flex flex-wrap gap-3 text-gray-600" style={{ fontSize: `${0.8 * fontSize}rem` }}>
            {profile.phone && (
              <span>{profile.phone}</span>
            )}
            {profile.email && (
              <span>{profile.email}</span>
            )}
            {profile.location && (
              <span>{profile.location}</span>
            )}
            {profile.customFields?.map((field, index) => (
              <span key={index}>{field.value}</span>
            ))}
          </div>
        </div>

        {profile.avatar && (
          <div className="ml-6 flex-shrink-0">
            <div className="w-24 h-28 overflow-hidden border border-gray-200">
              <ImageWithFallback 
                src={profile.avatar} 
                alt={profile.name} 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}
      </div>

      {/* Modules */}
      <div className="space-y-4">
        {modules.filter(m => m.visible).map((module) => (
          <div key={module.id}>
            <h3 
              className="font-bold pb-2 mb-1.5 border-b-2"
              style={{ fontSize: `${0.9 * fontSize}rem`, borderColor: 'var(--color-primary)' }}
            >
              {module.title}
            </h3>

            <div className="space-y-2">
              {isSkillsModule(module) ? (
                <div className="space-y-2">
                  {module.items.map((item: SkillItem) => (
                    <div key={item.id} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span style={{ fontSize: `${0.8 * fontSize}rem` }}>{item.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                module.items.map((item: ResumeItem) => (
                  <div key={item.id} className="mb-1.5 last:mb-0">
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <h4 className="font-bold inline" style={{ fontSize: `${0.9 * fontSize}rem` }}>{item.title}</h4>
                        {item.subtitle && (
                          <span className="text-gray-600 ml-2" style={{ fontSize: `${0.8 * fontSize}rem` }}>
                            {item.subtitle}
                          </span>
                        )}
                      </div>
                      {item.date && (
                        <span className="text-gray-500 whitespace-nowrap ml-4" style={{ fontSize: `${0.8 * fontSize}rem` }}>
                          {item.date}
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <div className="mt-2 text-gray-700 leading-snug whitespace-pre-line" style={{ fontSize: `${0.8 * fontSize}rem` }}>
                        {item.description}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        ))}

        {/* Self Evaluation Section - if summary exists */}
        {profile.summary && (
          <div>
            <h3 
              className="font-bold pb-2 mb-1.5 border-b-2"
              style={{ fontSize: `${0.9 * fontSize}rem`, borderColor: 'var(--color-primary)' }}
            >
              自我评价
            </h3>
            <div className="text-gray-700 leading-snug whitespace-pre-wrap" style={{ fontSize: `${0.8 * fontSize}rem` }}>
              {profile.summary.split('\n').map((line, idx) => (
                <div key={idx} className="flex items-start">
                  {line.trim() && <span className="mr-2">•</span>}
                  <span>{line}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-gray-200 text-gray-500 text-center" style={{ fontSize: `${0.7 * fontSize}rem` }}>
        感谢您花时间阅读我的简历，期望未来能与您一起共事
      </div>
    </div>
  );
};
