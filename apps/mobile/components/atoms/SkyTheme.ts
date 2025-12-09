import type { ShiftPeriod } from './PeriodBadge';

export interface SkyThemeConfig {
  gradient: {
    colors: string[];
    start: { x: number; y: number };
    end: { x: number; y: number };
  };
  accent: string;
  textColor: string;
  textShadow: string;
  iconConfig: {
    primary: string;
    glow: string;
  };
  statusBarStyle: 'light' | 'dark';
}

export const SKY_THEMES: Record<ShiftPeriod, SkyThemeConfig> = {
  morning: {
    gradient: {
      colors: ['#87CEEB', '#FB923C', '#F59E0B', '#FCD34D', '#FEF3C7'],
      start: { x: 0, y: 0 },
      end: { x: 0, y: 1 },
    },
    accent: '#F59E0B',
    textColor: '#78350F',
    textShadow: 'rgba(255, 255, 255, 0.5)',
    iconConfig: {
      primary: '#FCD34D',
      glow: 'rgba(252, 211, 77, 0.4)',
    },
    statusBarStyle: 'dark',
  },
  afternoon: {
    gradient: {
      colors: ['#1E40AF', '#3B82F6', '#60A5FA', '#93C5FD', '#DBEAFE'],
      start: { x: 0, y: 0 },
      end: { x: 0, y: 1 },
    },
    accent: '#F97316',
    textColor: '#FFFFFF',
    textShadow: 'rgba(0, 0, 0, 0.3)',
    iconConfig: {
      primary: '#FCD34D',
      glow: 'rgba(252, 211, 77, 0.5)',
    },
    statusBarStyle: 'light',
  },
  night: {
    gradient: {
      colors: ['#0F172A', '#1E293B', '#312E81', '#4338CA'],
      start: { x: 0, y: 0 },
      end: { x: 0, y: 1 },
    },
    accent: '#6366F1',
    textColor: '#E0E7FF',
    textShadow: 'rgba(0, 0, 0, 0.5)',
    iconConfig: {
      primary: '#F1F5F9',
      glow: 'rgba(99, 102, 241, 0.3)',
    },
    statusBarStyle: 'light',
  },
};

export function getSkyTheme(period: ShiftPeriod): SkyThemeConfig {
  return SKY_THEMES[period];
}
