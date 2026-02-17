import { useState } from 'react';
import { Settings, Palette, Moon, Sun, Check } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function SettingsPage() {
  const { settings, updateSettings } = useTheme();
  const [localSettings, setLocalSettings] = useState({
    primaryColor: settings.primaryColor || '#3b82f6',
    darkMode: settings.darkMode || false,
  });

  const colorPresets = [
    { name: 'Azul', value: '#3b82f6' },
    { name: 'Verde', value: '#10b981' },
    { name: 'Roxo', value: '#8b5cf6' },
    { name: 'Rosa', value: '#ec4899' },
    { name: 'Laranja', value: '#f97316' },
    { name: 'Vermelho', value: '#ef4444' },
  ];

  const handleColorChange = async (color: string) => {
    setLocalSettings({ ...localSettings, primaryColor: color });
    await updateSettings({ primaryColor: color });
  };

  const handleDarkModeToggle = async () => {
    const newDarkMode = !localSettings.darkMode;
    setLocalSettings({ ...localSettings, darkMode: newDarkMode });
    await updateSettings({ darkMode: newDarkMode });
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="animate-fadeIn mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Configurações</h1>
          <p className="text-slate-600 dark:text-slate-400">Personalize a aparência do seu sistema</p>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 animate-slideUp">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-lg flex items-center justify-center">
                <Palette className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Cor Principal</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">Escolha a cor do tema do sistema</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {colorPresets.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => handleColorChange(preset.value)}
                  className="relative group"
                >
                  <div
                    className={`w-full aspect-square rounded-xl transition-all duration-200 ${
                      localSettings.primaryColor === preset.value
                        ? 'ring-4 ring-offset-2 dark:ring-offset-slate-800 scale-95'
                        : 'hover:scale-105'
                    }`}
                    style={{
                      backgroundColor: preset.value,
                      ringColor: preset.value,
                    }}
                  >
                    {localSettings.primaryColor === preset.value && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Check className="w-8 h-8 text-white drop-shadow-lg" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mt-2 text-center">
                    {preset.name}
                  </p>
                </button>
              ))}
            </div>

            <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Ou escolha uma cor personalizada:
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={localSettings.primaryColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-16 h-10 rounded-lg cursor-pointer border-2 border-slate-300 dark:border-slate-600"
                />
                <input
                  type="text"
                  value={localSettings.primaryColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white"
                  placeholder="#3b82f6"
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 animate-slideUp">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 rounded-lg flex items-center justify-center">
                  {localSettings.darkMode ? (
                    <Moon className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                  ) : (
                    <Sun className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Modo Escuro</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {localSettings.darkMode ? 'Ativado' : 'Desativado'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleDarkModeToggle}
                className={`relative w-16 h-8 rounded-full transition-colors duration-200 ${
                  localSettings.darkMode ? 'bg-blue-600' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-200 ${
                    localSettings.darkMode ? 'translate-x-8' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">
                  Suas preferências são salvas automaticamente
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  Todas as alterações feitas aqui são aplicadas imediatamente em todo o sistema e sincronizadas com sua conta.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
