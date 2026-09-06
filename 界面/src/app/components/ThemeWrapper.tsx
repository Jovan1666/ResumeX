import React from 'react';
import { themes, ThemeColor, FALLBACK_THEME } from '@/app/types/theme';

interface ThemeWrapperProps {
  theme: ThemeColor;
  children: React.ReactNode;
  className?: string;
}

export const ThemeWrapper: React.FC<ThemeWrapperProps> = ({ theme, children, className }) => {
  // 未知主题 fallback 到 ink（禁止 tech-orange）
  const currentTheme = themes[theme] || themes[FALLBACK_THEME];

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
