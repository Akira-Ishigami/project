import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

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
  darkMode: boolean;
  updateSettings: (newSettings: Partial<ThemeSettings>, saveToDb?: boolean) => Promise<void>;
  resetSettings: () => void;
  toggleDarkMode: () => void;
  loadCompanyTheme: (companyId: string) => Promise<void>;
}

const defaultSettings: ThemeSettings = {
  displayName: '',
  logoUrl: '',
  incomingMessageColor: '#f1f5f9',
  outgoingMessageColor: '#3b82f6',
  incomingTextColor: '#1e293b',
  outgoingTextColor: '#ffffff',
  primaryColor: '#3b82f6',
  accentColor: '#06b6d4',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ThemeSettings>(defaultSettings);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('dark-mode');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('dark-mode', String(darkMode));

    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    document.documentElement.style.setProperty('--color-primary', settings.primaryColor);
    document.documentElement.style.setProperty('--color-accent', settings.accentColor);
    document.documentElement.style.setProperty('--color-incoming-bg', settings.incomingMessageColor);
    document.documentElement.style.setProperty('--color-outgoing-bg', settings.outgoingMessageColor);
    document.documentElement.style.setProperty('--color-incoming-text', settings.incomingTextColor);
    document.documentElement.style.setProperty('--color-outgoing-text', settings.outgoingTextColor);
  }, [settings]);

  const loadCompanyTheme = async (companyId: string) => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('display_name, logo_url, incoming_message_color, outgoing_message_color, incoming_text_color, outgoing_text_color, primary_color, accent_color')
        .eq('id', companyId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings({
          displayName: data.display_name || '',
          logoUrl: data.logo_url || '',
          incomingMessageColor: data.incoming_message_color || defaultSettings.incomingMessageColor,
          outgoingMessageColor: data.outgoing_message_color || defaultSettings.outgoingMessageColor,
          incomingTextColor: data.incoming_text_color || defaultSettings.incomingTextColor,
          outgoingTextColor: data.outgoing_text_color || defaultSettings.outgoingTextColor,
          primaryColor: data.primary_color || defaultSettings.primaryColor,
          accentColor: data.accent_color || defaultSettings.accentColor,
        });
      }
    } catch (error) {
      console.error('Erro ao carregar tema da empresa:', error);
    }
  };

  const updateSettings = async (newSettings: Partial<ThemeSettings>, saveToDb = false) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));

    if (saveToDb) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: company } = await supabase
          .from('companies')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (company) {
          const dbUpdate: any = {};
          if (newSettings.displayName !== undefined) dbUpdate.display_name = newSettings.displayName;
          if (newSettings.logoUrl !== undefined) dbUpdate.logo_url = newSettings.logoUrl;
          if (newSettings.incomingMessageColor !== undefined) dbUpdate.incoming_message_color = newSettings.incomingMessageColor;
          if (newSettings.outgoingMessageColor !== undefined) dbUpdate.outgoing_message_color = newSettings.outgoingMessageColor;
          if (newSettings.incomingTextColor !== undefined) dbUpdate.incoming_text_color = newSettings.incomingTextColor;
          if (newSettings.outgoingTextColor !== undefined) dbUpdate.outgoing_text_color = newSettings.outgoingTextColor;
          if (newSettings.primaryColor !== undefined) dbUpdate.primary_color = newSettings.primaryColor;
          if (newSettings.accentColor !== undefined) dbUpdate.accent_color = newSettings.accentColor;

          await supabase
            .from('companies')
            .update(dbUpdate)
            .eq('id', company.id);
        }
      } catch (error) {
        console.error('Erro ao salvar tema no banco:', error);
      }
    }
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  return (
    <ThemeContext.Provider value={{ settings, darkMode, updateSettings, resetSettings, toggleDarkMode, loadCompanyTheme }}>
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
