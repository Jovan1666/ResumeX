import React from 'react';
import { ResumeData, isSkillsModule, SkillItem, ResumeItem } from '@/app/types/resume';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';
import { Phone, Mail, MapPin, Github } from 'lucide-react';

interface TemplateProps {
  data: ResumeData;
}

export const JavaDevTemplate: React.FC<TemplateProps> = ({ data }) => {
  const { profile, modules, settings } = data;
  const fontSize = settings.fontSizeScale || 1;
  const primaryColor = 'var(--color-primary)'; // Orange theme

  return (
    <div 
      className="w-full h-full bg-white font-sans"
      style={{ fontSize: `${12.5 * fontSize}px`, color: 'var(--color-text)' }}
    >
      {/* Header */}
      <div className="px-6 pt-5 pb-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            {/* Name and Title */}
            <div className="flex items-center gap-4 mb-3">
              <h1 
                className="font-bold"
                style={{ fontSize: `${1.5 * fontSize}rem`, color: primaryColor }}
              >
                {profile.title || 'Java后端开发工程师'}
              </h1>
            </div>
            
            {/* Personal Info */}
            <div className="flex flex-wrap items-center gap-3 text-gray-600" style={{ fontSize: `${0.8 * fontSize}rem` }}>
              {profile.name && <span>{profile.name}</span>}
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
              {profile.location && (
                <>
                  <span className="text-gray-300">|</span>
                  <span>{profile.location}</span>
                </>
              )}
            </div>

            {profile.website && (
              <div className="flex items-center gap-2 mt-2 text-gray-600" style={{ fontSize: `${0.8 * fontSize}rem` }}>
                <Github size={14} />
                <span>{profile.website}</span>
              </div>
            )}
          </div>

          {profile.avatar && (
            <div className="ml-6 flex-shrink-0">
              <div className="w-20 h-20 rounded-lg overflow-hidden border-2" style={{ borderColor: primaryColor }}>
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
              className="flex items-center mb-1.5 pb-1 border-b"
              style={{ borderColor: primaryColor }}
            >
              <div 
                className="w-1 h-5 mr-3 rounded-sm"
                style={{ backgroundColor: primaryColor }}
              ></div>
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
                      className="px-3 py-1 text-white rounded text-xs font-medium"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {item.name}
                    </span>
                  ))}
                </div>
              ) : (
                module.items.map((item: ResumeItem) => (
                  <div key={item.id} className="mb-2 last:mb-0">
                    {/* Item Header */}
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <h4 className="font-bold" style={{ fontSize: `${0.9 * fontSize}rem` }}>{item.title}</h4>
                        {item.subtitle && (
                          <span className="text-gray-600" style={{ fontSize: `${0.8 * fontSize}rem` }}>
                            {item.subtitle}
                          </span>
                        )}
                      </div>
                      {item.date && (
                        <span className="text-gray-500 whitespace-nowrap" style={{ fontSize: `${0.8 * fontSize}rem` }}>
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

        {/* Summary as Profile Section */}
        {profile.summary && (
          <div className="mb-3">
            <div 
              className="flex items-center mb-1.5 pb-1 border-b"
              style={{ borderColor: primaryColor }}
            >
              <div 
                className="w-1 h-5 mr-3 rounded-sm"
                style={{ backgroundColor: primaryColor }}
              ></div>
              <h3 
                className="font-bold"
                style={{ fontSize: `${0.9 * fontSize}rem`, color: primaryColor }}
              >
                个人简介
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
