import React from 'react';
import { themes, ThemeColor } from '@/app/types/theme';

interface ThemeWrapperProps {
  theme: ThemeColor;
  children: React.ReactNode;
  className?: string;
}

export const ThemeWrapper: React.FC<ThemeWrapperProps> = ({ theme, children, className }) => {
  const currentTheme = themes[theme] || themes['tech-orange'];

  return (
    <div 
      className={className}
      style={{
        '--color-primary': currentTheme.colors.primary,
        '--color-secondary': currentTheme.colors.secondary,
        '--color-text': currentTheme.colors.text,
        '--color-background': currentTheme.colors.background,
        '--color-accent': currentTheme.colors.accent,
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
};
