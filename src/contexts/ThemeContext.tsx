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
  updateSettings: (newSettings: Partial<ThemeSettings>, saveToDb?: boolean) => Promise<void>;
  resetSettings: () => void;
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
  const [companyId, setCompanyId] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.style.setProperty('--color-primary', settings.primaryColor);
    document.documentElement.style.setProperty('--color-accent', settings.accentColor);
    document.documentElement.style.setProperty('--color-incoming-bg', settings.incomingMessageColor);
    document.documentElement.style.setProperty('--color-outgoing-bg', settings.outgoingMessageColor);
    document.documentElement.style.setProperty('--color-incoming-text', settings.incomingTextColor);
    document.documentElement.style.setProperty('--color-outgoing-text', settings.outgoingTextColor);
  }, [settings]);

  const getCurrentCompanyId = async (): Promise<string | null> => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) return null;

      const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (company) return company.id;

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

  const loadCompanyTheme = async (id: string) => {
    try {
      setCompanyId(id);

      const { data: themeData, error: themeError } = await supabase
        .from('theme_settings')
        .select('*')
        .eq('company_id', id)
        .maybeSingle();

      if (themeError && themeError.code !== 'PGRST116') {
        console.error('Error loading theme settings:', themeError);
      }

      const { data: companyData } = await supabase
        .from('companies')
        .select('display_name, logo_url')
        .eq('id', id)
        .maybeSingle();

      if (themeData || companyData) {
        setSettings({
          displayName: themeData?.display_name || companyData?.display_name || '',
          logoUrl: themeData?.logo_url || companyData?.logo_url || '',
          incomingMessageColor: themeData?.incoming_message_color || defaultSettings.incomingMessageColor,
          outgoingMessageColor: themeData?.outgoing_message_color || defaultSettings.outgoingMessageColor,
          incomingTextColor: themeData?.incoming_text_color || defaultSettings.incomingTextColor,
          outgoingTextColor: themeData?.outgoing_text_color || defaultSettings.outgoingTextColor,
          primaryColor: themeData?.primary_color || defaultSettings.primaryColor,
          accentColor: themeData?.accent_color || defaultSettings.accentColor,
        });
      }
    } catch (error) {
      console.error('Error loading company theme:', error);
    }
  };

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

        const themeUpdate: any = {};
        if (newSettings.displayName !== undefined) themeUpdate.display_name = newSettings.displayName;
        if (newSettings.logoUrl !== undefined) themeUpdate.logo_url = newSettings.logoUrl;
        if (newSettings.incomingMessageColor !== undefined) themeUpdate.incoming_message_color = newSettings.incomingMessageColor;
        if (newSettings.outgoingMessageColor !== undefined) themeUpdate.outgoing_message_color = newSettings.outgoingMessageColor;
        if (newSettings.incomingTextColor !== undefined) themeUpdate.incoming_text_color = newSettings.incomingTextColor;
        if (newSettings.outgoingTextColor !== undefined) themeUpdate.outgoing_text_color = newSettings.outgoingTextColor;
        if (newSettings.primaryColor !== undefined) themeUpdate.primary_color = newSettings.primaryColor;
        if (newSettings.accentColor !== undefined) themeUpdate.accent_color = newSettings.accentColor;

        const { data: existingTheme } = await supabase
          .from('theme_settings')
          .select('id')
          .eq('company_id', id)
          .maybeSingle();

        if (existingTheme) {
          const { error } = await supabase
            .from('theme_settings')
            .update(themeUpdate)
            .eq('company_id', id);

          if (error) {
            console.error('Error updating theme settings:', error);
            throw error;
          }
        } else {
          const { error } = await supabase
            .from('theme_settings')
            .insert({
              company_id: id,
              ...themeUpdate
            });

          if (error) {
            console.error('Error inserting theme settings:', error);
            throw error;
          }
        }

        const companyUpdate: any = {};
        if (newSettings.displayName !== undefined) companyUpdate.display_name = newSettings.displayName;
        if (newSettings.logoUrl !== undefined) companyUpdate.logo_url = newSettings.logoUrl;

        if (Object.keys(companyUpdate).length > 0) {
          const { error: companyError } = await supabase
            .from('companies')
            .update(companyUpdate)
            .eq('id', id);

          if (companyError) {
            console.error('Error updating company:', companyError);
          }
        }

        console.log('Theme settings saved successfully');
      } catch (error) {
        console.error('Error saving theme settings:', error);
        throw error;
      }
    }
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  return (
    <ThemeContext.Provider value={{ settings, updateSettings, resetSettings, loadCompanyTheme }}>
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
