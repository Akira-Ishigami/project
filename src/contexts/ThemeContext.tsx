import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface ThemeSettings {
  companyName: string;
  logoUrl: string;
  backgroundType: 'color' | 'image';
  backgroundColor: string;
  backgroundImageUrl: string;
  messageBubbleSentColor: string;
  messageBubbleSentTextColor: string;
  messageBubbleReceivedColor: string;
  messageBubbleReceivedTextColor: string;
  primaryColor: string;
}

interface ThemeContextType {
  settings: ThemeSettings;
  companyId: string | null;
  updateSettings: (newSettings: Partial<ThemeSettings>) => Promise<void>;
  resetSettings: () => void;
  loadCompanyTheme: (companyId: string) => Promise<void>;
}

const defaultSettings: ThemeSettings = {
  companyName: '',
  logoUrl: '',
  backgroundType: 'color',
  backgroundColor: '#f8fafc',
  backgroundImageUrl: '',
  messageBubbleSentColor: '#3b82f6',
  messageBubbleSentTextColor: '#ffffff',
  messageBubbleReceivedColor: '#ffffff',
  messageBubbleReceivedTextColor: '#1e293b',
  primaryColor: '#3b82f6',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ThemeSettings>(defaultSettings);
  const [companyId, setCompanyId] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.style.setProperty('--color-primary', settings.primaryColor);
    document.documentElement.style.setProperty('--color-outgoing-bg', settings.messageBubbleSentColor);
    document.documentElement.style.setProperty('--color-outgoing-text', settings.messageBubbleSentTextColor);
    document.documentElement.style.setProperty('--color-incoming-bg', settings.messageBubbleReceivedColor);
    document.documentElement.style.setProperty('--color-incoming-text', settings.messageBubbleReceivedTextColor);
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

      if (themeData) {
        setSettings({
          companyName: themeData.company_name || defaultSettings.companyName,
          logoUrl: themeData.logo_primary_url || defaultSettings.logoUrl,
          backgroundType: themeData.background_type || defaultSettings.backgroundType,
          backgroundColor: themeData.background_color || defaultSettings.backgroundColor,
          backgroundImageUrl: themeData.background_image_url || defaultSettings.backgroundImageUrl,
          messageBubbleSentColor: themeData.message_bubble_sent_color || defaultSettings.messageBubbleSentColor,
          messageBubbleSentTextColor: themeData.message_bubble_sent_text_color || defaultSettings.messageBubbleSentTextColor,
          messageBubbleReceivedColor: themeData.message_bubble_received_color || defaultSettings.messageBubbleReceivedColor,
          messageBubbleReceivedTextColor: themeData.message_bubble_received_text_color || defaultSettings.messageBubbleReceivedTextColor,
          primaryColor: themeData.primary_color || defaultSettings.primaryColor,
        });
      } else {
        setSettings(defaultSettings);
      }

      console.log('Theme loaded successfully');
    } catch (error) {
      console.error('Error loading company theme:', error);
    }
  };

  const updateSettings = async (newSettings: Partial<ThemeSettings>) => {
    const merged = { ...settings, ...newSettings };
    setSettings(merged);

    try {
      let id = companyId;

      if (!id) {
        id = await getCurrentCompanyId();
      }

      if (!id) {
        console.error('Company ID not found');
        throw new Error('Company ID not found');
      }

      const themeUpdate: any = {};
      if (newSettings.companyName !== undefined) themeUpdate.company_name = newSettings.companyName;
      if (newSettings.logoUrl !== undefined) themeUpdate.logo_primary_url = newSettings.logoUrl;
      if (newSettings.backgroundType !== undefined) themeUpdate.background_type = newSettings.backgroundType;
      if (newSettings.backgroundColor !== undefined) themeUpdate.background_color = newSettings.backgroundColor;
      if (newSettings.backgroundImageUrl !== undefined) themeUpdate.background_image_url = newSettings.backgroundImageUrl;
      if (newSettings.messageBubbleSentColor !== undefined) themeUpdate.message_bubble_sent_color = newSettings.messageBubbleSentColor;
      if (newSettings.messageBubbleSentTextColor !== undefined) themeUpdate.message_bubble_sent_text_color = newSettings.messageBubbleSentTextColor;
      if (newSettings.messageBubbleReceivedColor !== undefined) themeUpdate.message_bubble_received_color = newSettings.messageBubbleReceivedColor;
      if (newSettings.messageBubbleReceivedTextColor !== undefined) themeUpdate.message_bubble_received_text_color = newSettings.messageBubbleReceivedTextColor;
      if (newSettings.primaryColor !== undefined) themeUpdate.primary_color = newSettings.primaryColor;

      const { data: existingTheme, error: checkError } = await supabase
        .from('theme_settings')
        .select('id')
        .eq('company_id', id)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking theme settings:', checkError);
        throw checkError;
      }

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

      console.log('Theme settings saved successfully');
    } catch (error) {
      console.error('Error saving theme settings:', error);
      throw error;
    }
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  return (
    <ThemeContext.Provider value={{ settings, companyId, updateSettings, resetSettings, loadCompanyTheme }}>
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
