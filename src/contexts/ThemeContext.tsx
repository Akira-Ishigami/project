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
  toggleDarkMode: () => Promise<void>;
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
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [companyId, setCompanyId] = useState<string | null>(null);

  // Apply dark mode class to documentElement
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Apply custom color variables
  useEffect(() => {
    document.documentElement.style.setProperty('--color-primary', settings.primaryColor);
    document.documentElement.style.setProperty('--color-accent', settings.accentColor);
    document.documentElement.style.setProperty('--message-incoming-bg', settings.incomingMessageColor);
    document.documentElement.style.setProperty('--message-outgoing-bg', settings.outgoingMessageColor);
    document.documentElement.style.setProperty('--message-incoming-text', settings.incomingTextColor);
    document.documentElement.style.setProperty('--message-outgoing-text', settings.outgoingTextColor);
  }, [settings]);

  // Get company ID for current user
  const getCurrentCompanyId = async (): Promise<string | null> => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) return null;

      // Check if user is a company
      const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (company) return company.id;

      // Check if user is an attendant
      const { data: attendant } = await supabase
        .from('attendants')
        .select('company_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (attendant) return attendant.company_id;

      return null;
    } catch (error) {
      console.error('Error getting company ID:', error);
      return null;
    }
  };

  // Load theme from database
  const loadCompanyTheme = async (id: string) => {
    try {
      setCompanyId(id);

      const { data, error } = await supabase
        .from('companies')
        .select('display_name, logo_url, incoming_message_color, outgoing_message_color, incoming_text_color, outgoing_text_color, primary_color, accent_color, dark_mode')
        .eq('id', id)
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

        // Load dark mode from database
        setDarkMode(data.dark_mode || false);
      }
    } catch (error) {
      console.error('Error loading company theme:', error);
    }
  };

  // Toggle dark mode and save to database
  const toggleDarkMode = async () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);

    // Save to database
    try {
      let id = companyId;

      if (!id) {
        id = await getCurrentCompanyId();
      }

      if (id) {
        const { error } = await supabase
          .from('companies')
          .update({ dark_mode: newDarkMode })
          .eq('id', id);

        if (error) {
          console.error('Error saving dark mode:', error);
        }
      }
    } catch (error) {
      console.error('Error toggling dark mode:', error);
    }
  };

  // Update settings
  const updateSettings = async (newSettings: Partial<ThemeSettings>, saveToDb = false) => {
    const merged = { ...settings, ...newSettings };
    setSettings(merged);

    if (saveToDb) {
      try {
        let id = companyId;

        if (!id) {
          id = await getCurrentCompanyId();
        }

        if (!id) {
          console.error('Company ID not found');
          return;
        }

        const companyUpdate: any = {};
        if (newSettings.displayName !== undefined) companyUpdate.display_name = newSettings.displayName;
        if (newSettings.logoUrl !== undefined) companyUpdate.logo_url = newSettings.logoUrl;
        if (newSettings.incomingMessageColor !== undefined) companyUpdate.incoming_message_color = newSettings.incomingMessageColor;
        if (newSettings.outgoingMessageColor !== undefined) companyUpdate.outgoing_message_color = newSettings.outgoingMessageColor;
        if (newSettings.incomingTextColor !== undefined) companyUpdate.incoming_text_color = newSettings.incomingTextColor;
        if (newSettings.outgoingTextColor !== undefined) companyUpdate.outgoing_text_color = newSettings.outgoingTextColor;
        if (newSettings.primaryColor !== undefined) companyUpdate.primary_color = newSettings.primaryColor;
        if (newSettings.accentColor !== undefined) companyUpdate.accent_color = newSettings.accentColor;

        if (Object.keys(companyUpdate).length > 0) {
          const { error } = await supabase
            .from('companies')
            .update(companyUpdate)
            .eq('id', id);

          if (error) {
            console.error('Error updating company settings:', error);
          }
        }

        // Also update theme_settings table
        const themeUpdate: any = {
          primary_color: merged.primaryColor,
          secondary_color: merged.accentColor,
          accent_color: merged.accentColor,
          background_color: merged.incomingMessageColor,
          text_color: merged.incomingTextColor,
        };

        const { data: existingTheme } = await supabase
          .from('theme_settings')
          .select('id')
          .eq('company_id', id)
          .maybeSingle();

        if (existingTheme) {
          await supabase
            .from('theme_settings')
            .update(themeUpdate)
            .eq('company_id', id);
        } else {
          await supabase
            .from('theme_settings')
            .insert({
              company_id: id,
              ...themeUpdate
            });
        }
      } catch (error) {
        console.error('Error saving theme settings:', error);
      }
    }
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
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
