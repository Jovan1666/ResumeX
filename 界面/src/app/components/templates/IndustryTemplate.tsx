import React from 'react';
import { ResumeData, isSkillsModule, SkillItem, ResumeItem } from '@/app/types/resume';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';

interface TemplateProps {
  data: ResumeData;
}

export const IndustryTemplate: React.FC<TemplateProps> = ({ data }) => {
  const { profile, modules, settings } = data;
  const fontSize = settings.fontSizeScale || 1;
  const primaryColor = 'var(--color-primary)'; // Dark red theme

  // Separate modules by type
  const summaryModule = modules.find(m => m.type === 'custom' && m.title.includes('目标') && m.visible);
  const otherModules = modules.filter(m => m !== summaryModule && m.visible);

  return (
    <div 
      className="w-full h-full bg-white font-sans"
      style={{ fontSize: `${12.5 * fontSize}px`, color: 'var(--color-text)' }}
    >
      {/* Header */}
      <div className="px-6 pt-5 pb-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            {/* Name with style */}
            <div className="mb-2">
              <span 
                className="font-bold"
                style={{ fontSize: `${0.95 * fontSize}rem`, color: primaryColor }}
              >
                {profile.name || '我的简历'}
              </span>
              <span className="text-gray-500 ml-3" style={{ fontSize: `${0.8 * fontSize}rem` }}>
                - {profile.title || '各行业通用简历模板'}
              </span>
            </div>
            
            {/* Personal Info Row */}
            <div className="flex flex-wrap items-center gap-3 text-gray-600 mt-3" style={{ fontSize: `${0.8 * fontSize}rem` }}>
              {profile.name && <span>{profile.name}</span>}
              {profile.location && (
                <>
                  <span className="text-gray-300">|</span>
                  <span>{profile.location}</span>
                </>
              )}
              {profile.phone && (
                <>
                  <span className="text-gray-300">|</span>
                  <span>{profile.phone}</span>
                </>
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

        {/* Summary Box */}
        {(profile.summary || summaryModule) && (
          <div 
            className="mt-4 p-4 rounded border-l-4"
            style={{ backgroundColor: 'var(--color-accent)', borderColor: primaryColor }}
          >
            <h3 
              className="font-bold mb-2"
              style={{ fontSize: `${0.9 * fontSize}rem`, color: primaryColor }}
            >
              自我目标
            </h3>
            <p className="text-gray-700 leading-snug" style={{ fontSize: `${0.8 * fontSize}rem` }}>
              {profile.summary || (summaryModule && !isSkillsModule(summaryModule) && summaryModule.items[0]?.description)}
            </p>
          </div>
        )}
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="px-6 pb-5">
        {otherModules.map((module) => (
          <div key={module.id} className="mb-2">
            {/* Section Header */}
            <div className="flex items-center mb-1.5">
              <div 
                className="w-1.5 h-5 rounded-sm mr-2"
                style={{ backgroundColor: primaryColor }}
              ></div>
              <h3 
                className="font-bold"
                style={{ fontSize: `${0.9 * fontSize}rem`, color: primaryColor }}
              >
                {module.title}
              </h3>
              <div className="flex-1 h-px bg-gray-200 ml-3"></div>
            </div>

            <div className="space-y-2">
              {isSkillsModule(module) ? (
                <div className="grid grid-cols-2 gap-2">
                  {module.items.map((item: SkillItem) => (
                    <div key={item.id} className="flex items-center">
                      <span className="w-1.5 h-1.5 rounded-full mr-2" style={{ backgroundColor: primaryColor }}></span>
                      <span style={{ fontSize: `${0.8 * fontSize}rem` }}>{item.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                module.items.map((item: ResumeItem) => (
                  <div key={item.id} className="mb-2 last:mb-0 pl-4 border-l" style={{ borderColor: 'var(--color-secondary)' }}>
                    {/* Item Header */}
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <h4 className="font-bold inline" style={{ fontSize: `${0.95 * fontSize}rem` }}>{item.title}</h4>
                        {item.subtitle && (
                          <span className="text-gray-500 ml-2" style={{ fontSize: `${0.8 * fontSize}rem` }}>
                            {item.subtitle}
                          </span>
                        )}
                      </div>
                      {item.date && (
                        <span className="text-gray-500 whitespace-nowrap ml-4" style={{ fontSize: `${0.7 * fontSize}rem` }}>
                          {item.date}
                        </span>
                      )}
                    </div>

                    {item.location && (
                      <div className="text-gray-500 mb-1" style={{ fontSize: `${0.8 * fontSize}rem` }}>
                        {item.location}
                      </div>
                    )}

                    {/* Description */}
                    {item.description && (
                      <div className="text-gray-600 leading-snug mt-2 whitespace-pre-line" style={{ fontSize: `${0.8 * fontSize}rem` }}>
                        {item.description}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
