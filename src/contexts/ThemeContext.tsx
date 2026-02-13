import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ThemeSettings {
  displayName: string;
  logoUrl: string;
  incomingMessageColor: string;
  outgoingMessageColor: string;
  incomingTextColor: string;
  outgoingTextColor: string;
  primaryColor: string;
  accentColor: string;
}

interface ThemeContextType {
  settings: ThemeSettings;
  updateSettings: (newSettings: Partial<ThemeSettings>) => void;
  resetSettings: () => void;
}

const defaultSettings: ThemeSettings = {
  displayName: '',
  logoUrl: '',
  incomingMessageColor: '#f1f5f9', // slate-100
  outgoingMessageColor: '#3b82f6', // blue-500
  incomingTextColor: '#1e293b', // slate-800
  outgoingTextColor: '#ffffff', // white
  primaryColor: '#3b82f6', // blue-500
  accentColor: '#06b6d4', // cyan-500
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ThemeSettings>(() => {
    const saved = localStorage.getItem('theme-settings');
    if (saved) {
      try {
        return { ...defaultSettings, ...JSON.parse(saved) };
      } catch {
        return defaultSettings;
      }
    }
    return defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem('theme-settings', JSON.stringify(settings));

    // Aplicar cores CSS customizadas
    document.documentElement.style.setProperty('--color-primary', settings.primaryColor);
    document.documentElement.style.setProperty('--color-accent', settings.accentColor);
    document.documentElement.style.setProperty('--color-incoming-bg', settings.incomingMessageColor);
    document.documentElement.style.setProperty('--color-outgoing-bg', settings.outgoingMessageColor);
    document.documentElement.style.setProperty('--color-incoming-text', settings.incomingTextColor);
    document.documentElement.style.setProperty('--color-outgoing-text', settings.outgoingTextColor);
  }, [settings]);

  const updateSettings = (newSettings: Partial<ThemeSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('theme-settings');
  };

  return (
    <ThemeContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
