export type ThemeColor = 'tech-orange' | 'business-blue' | 'minimal-bw' | 'vibrant-red' | 'pro-blue' | 'emerald-green' | 'creative-purple' | 'warm-amber' | 'elegant-gold' | 'fresh-teal' | 'indigo-data' | 'navy-compact';
export type FontFamily = 'sans' | 'serif' | 'mono';
export type SpacingLevel = 'compact' | 'standard' | 'relaxed';

export interface ThemeConfig {
  id: ThemeColor;
  name: string;
  nameZh: string;
  sceneHint: string;
  colors: {
    primary: string;
    secondary: string;
    text: string;
    background: string;
    accent: string;
  };
}

export const themes: Record<ThemeColor, ThemeConfig> = {
  'tech-orange': {
    id: 'tech-orange',
    name: 'Tech Orange',
    nameZh: '科技橙红',
    sceneHint: '适合技术、互联网岗位',
    colors: {
      primary: '#E53E3E',
      secondary: '#2D3748',
      text: '#2D3748',
      background: '#FFFFFF',
      accent: '#FFF5F5'
    }
  },
  'business-blue': {
    id: 'business-blue',
    name: 'Business Blue',
    nameZh: '商务浅蓝',
    sceneHint: '适合商务、金融、校招',
    colors: {
      primary: '#3182CE',
      secondary: '#EDF2F7',
      text: '#2D3748',
      background: '#FFFFFF',
      accent: '#EBF8FF'
    }
  },
  'minimal-bw': {
    id: 'minimal-bw',
    name: 'Minimal B&W',
    nameZh: '极简黑白',
    sceneHint: '适合财务、法务、传统行业',
    colors: {
      primary: '#1A202C',
      secondary: '#E2E8F0',
      text: '#1A202C',
      background: '#FFFFFF',
      accent: '#F7FAFC'
    }
  },
  'vibrant-red': {
    id: 'vibrant-red',
    name: 'Vibrant Red',
    nameZh: '活力红',
    sceneHint: '适合运营、市场、创意岗位',
    colors: {
      primary: '#C53030',
      secondary: '#FED7D7',
      text: '#2D3748',
      background: '#FFFFFF',
      accent: '#FFF5F5'
    }
  },
  'pro-blue': {
    id: 'pro-blue',
    name: 'Professional Blue',
    nameZh: '专业蓝',
    sceneHint: '适合管理、咨询、专业岗位',
    colors: {
      primary: '#2B6CB0',
      secondary: '#F7FAFC',
      text: '#2C5282',
      background: '#FFFFFF',
      accent: '#EBF8FF'
    }
  },
  'emerald-green': {
    id: 'emerald-green',
    name: 'Emerald Green',
    nameZh: '翡翠绿',
    sceneHint: '适合教育、环保、医疗',
    colors: {
      primary: '#059669',
      secondary: '#D1FAE5',
      text: '#1F2937',
      background: '#FFFFFF',
      accent: '#ECFDF5'
    }
  },
  'creative-purple': {
    id: 'creative-purple',
    name: 'Creative Purple',
    nameZh: '创意紫',
    sceneHint: '适合设计、艺术、创意行业',
    colors: {
      primary: '#7C3AED',
      secondary: '#EDE9FE',
      text: '#1F2937',
      background: '#FFFFFF',
      accent: '#F5F3FF'
    }
  },
  'warm-amber': {
    id: 'warm-amber',
    name: 'Warm Amber',
    nameZh: '暖琥珀',
    sceneHint: '适合运营、市场、文科',
    colors: {
      primary: '#D97706',
      secondary: '#FEF3C7',
      text: '#1F2937',
      background: '#FFFFFF',
      accent: '#FFFBEB'
    }
  },
  'elegant-gold': {
    id: 'elegant-gold',
    name: 'Elegant Gold',
    nameZh: '典雅金',
    sceneHint: '适合高管、总监、律师',
    colors: {
      primary: '#92400E',
      secondary: '#F5F5F4',
      text: '#1C1917',
      background: '#FFFFFF',
      accent: '#FAFAF9'
    }
  },
  'fresh-teal': {
    id: 'fresh-teal',
    name: 'Fresh Teal',
    nameZh: '清新蓝绿',
    sceneHint: '适合应届生、校招',
    colors: {
      primary: '#0D9488',
      secondary: '#CCFBF1',
      text: '#1F2937',
      background: '#FFFFFF',
      accent: '#F0FDFA'
    }
  },
  'indigo-data': {
    id: 'indigo-data',
    name: 'Indigo Data',
    nameZh: '靛蓝数据',
    sceneHint: '适合数据分析、产品经理',
    colors: {
      primary: '#4F46E5',
      secondary: '#E0E7FF',
      text: '#1F2937',
      background: '#FFFFFF',
      accent: '#EEF2FF'
    }
  },
  'navy-compact': {
    id: 'navy-compact',
    name: 'Navy Compact',
    nameZh: '海军蓝',
    sceneHint: '适合销售、商务、传统行业',
    colors: {
      primary: '#1E3A5F',
      secondary: '#E2E8F0',
      text: '#1E293B',
      background: '#FFFFFF',
      accent: '#F1F5F9'
    }
  }
};

export interface GlobalSettings {
  themeColor: ThemeColor;
  fontFamily: FontFamily;
  fontSizeScale: number; // 0.9 to 1.1
  lineHeight: SpacingLevel;
  pageMargin: SpacingLevel;
  language: 'zh' | 'en';
}
