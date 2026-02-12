// Design System - Cores e estilos padronizados

export const colors = {
  // Cores primárias
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },

  // Neutros
  neutral: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },

  // Status
  success: {
    50: '#f0fdf4',
    500: '#22c55e',
    600: '#16a34a',
  },

  warning: {
    50: '#fefce8',
    500: '#eab308',
    600: '#ca8a04',
  },

  error: {
    50: '#fef2f2',
    500: '#ef4444',
    600: '#dc2626',
  },

  // Chat específico
  chat: {
    received: '#ffffff',
    sent: '#3b82f6',
    system: '#e0f2fe',
    background: '#f8fafc',
  }
};

export const animations = {
  // Transições
  transition: {
    fast: 'transition-all duration-150 ease-in-out',
    normal: 'transition-all duration-200 ease-in-out',
    slow: 'transition-all duration-300 ease-in-out',
  },

  // Hover effects
  hover: {
    scale: 'hover:scale-105',
    lift: 'hover:-translate-y-0.5 hover:shadow-lg',
    brightness: 'hover:brightness-110',
    bg: 'hover:bg-opacity-90',
  },

  // Fade
  fadeIn: 'animate-in fade-in duration-200',
  fadeOut: 'animate-out fade-out duration-200',

  // Slide
  slideIn: 'animate-in slide-in-from-right duration-200',
  slideOut: 'animate-out slide-out-to-right duration-200',
};

export const shadows = {
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  card: 'shadow-[0_2px_8px_rgba(0,0,0,0.08)]',
  hover: 'hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)]',
};

export const spacing = {
  sidebar: 'w-80',
  header: 'h-16',
  chat: 'max-w-4xl',
};

export const rounded = {
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  full: 'rounded-full',
  message: 'rounded-2xl',
};
