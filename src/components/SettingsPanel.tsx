import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { RotateCcw, Palette, Save } from 'lucide-react';
import Toast from './Toast';

export default function SettingsPanel() {
  const { settings, updateSettings, resetSettings } = useTheme();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = async () => {
    await updateSettings(localSettings, true);
    setToastMessage('✅ Configurações salvas com sucesso!');
    setShowToast(true);
  };

  const handleReset = () => {
    resetSettings();
    setLocalSettings(settings);
    setToastMessage('✅ Configurações restauradas para o padrão');
    setShowToast(true);
  };

  const presetColors = {
    incoming: [
      { name: 'Cinza Claro', color: '#f1f5f9' },
      { name: 'Verde Claro', color: '#dcfce7' },
      { name: 'Azul Claro', color: '#dbeafe' },
      { name: 'Rosa Claro', color: '#fce7f3' },
      { name: 'Amarelo Claro', color: '#fef3c7' },
    ],
    outgoing: [
      { name: 'Azul', color: '#3b82f6' },
      { name: 'Verde', color: '#10b981' },
      { name: 'Roxo', color: '#8b5cf6' },
      { name: 'Rosa', color: '#ec4899' },
      { name: 'Laranja', color: '#f97316' },
    ],
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 to-blue-50 p-8 transition-colors duration-300">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="animate-fadeIn">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Configurações de Aparência</h1>
          <p className="text-slate-600">Personalize as cores das mensagens do seu sistema</p>
        </div>

        {/* Message Colors */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 animate-slideUp transition-colors duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Palette className="text-purple-600" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Cores das Mensagens</h2>
              <p className="text-sm text-slate-600">Personalize as cores das mensagens recebidas e enviadas</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Incoming Messages */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Mensagens Recebidas
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-600 mb-2">Cor de Fundo</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={localSettings.incomingMessageColor}
                      onChange={(e) => setLocalSettings((prev) => ({ ...prev, incomingMessageColor: e.target.value }))}
                      className="w-16 h-12 rounded-lg cursor-pointer border-2 border-slate-300"
                    />
                    <input
                      type="text"
                      value={localSettings.incomingMessageColor}
                      onChange={(e) => setLocalSettings((prev) => ({ ...prev, incomingMessageColor: e.target.value }))}
                      className="flex-1 px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg text-sm font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-5 gap-2 mt-2">
                    {presetColors.incoming.map((preset) => (
                      <button
                        key={preset.color}
                        onClick={() => setLocalSettings((prev) => ({ ...prev, incomingMessageColor: preset.color }))}
                        className="h-8 rounded-md border-2 border-slate-300 hover:scale-110 transition-transform"
                        style={{ backgroundColor: preset.color }}
                        title={preset.name}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-2">Cor do Texto</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={localSettings.incomingTextColor}
                      onChange={(e) => setLocalSettings((prev) => ({ ...prev, incomingTextColor: e.target.value }))}
                      className="w-16 h-12 rounded-lg cursor-pointer border-2 border-slate-300"
                    />
                    <input
                      type="text"
                      value={localSettings.incomingTextColor}
                      onChange={(e) => setLocalSettings((prev) => ({ ...prev, incomingTextColor: e.target.value }))}
                      className="flex-1 px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg text-sm font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Outgoing Messages */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Mensagens Enviadas
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-600 mb-2">Cor de Fundo</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={localSettings.outgoingMessageColor}
                      onChange={(e) => setLocalSettings((prev) => ({ ...prev, outgoingMessageColor: e.target.value }))}
                      className="w-16 h-12 rounded-lg cursor-pointer border-2 border-slate-300"
                    />
                    <input
                      type="text"
                      value={localSettings.outgoingMessageColor}
                      onChange={(e) => setLocalSettings((prev) => ({ ...prev, outgoingMessageColor: e.target.value }))}
                      className="flex-1 px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg text-sm font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-5 gap-2 mt-2">
                    {presetColors.outgoing.map((preset) => (
                      <button
                        key={preset.color}
                        onClick={() => setLocalSettings((prev) => ({ ...prev, outgoingMessageColor: preset.color }))}
                        className="h-8 rounded-md border-2 border-slate-300 hover:scale-110 transition-transform"
                        style={{ backgroundColor: preset.color }}
                        title={preset.name}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-2">Cor do Texto</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={localSettings.outgoingTextColor}
                      onChange={(e) => setLocalSettings((prev) => ({ ...prev, outgoingTextColor: e.target.value }))}
                      className="w-16 h-12 rounded-lg cursor-pointer border-2 border-slate-300"
                    />
                    <input
                      type="text"
                      value={localSettings.outgoingTextColor}
                      onChange={(e) => setLocalSettings((prev) => ({ ...prev, outgoingTextColor: e.target.value }))}
                      className="flex-1 px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg text-sm font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="border-2 border-slate-200 rounded-xl p-4 bg-slate-50">
              <p className="text-xs font-medium text-slate-600 mb-3">Pré-visualização</p>
              <div className="space-y-3">
                <div className="flex">
                  <div
                    className="max-w-xs px-4 py-2 rounded-2xl rounded-tl-sm shadow-sm"
                    style={{
                      backgroundColor: localSettings.incomingMessageColor,
                      color: localSettings.incomingTextColor,
                    }}
                  >
                    Mensagem recebida de exemplo
                  </div>
                </div>
                <div className="flex justify-end">
                  <div
                    className="max-w-xs px-4 py-2 rounded-2xl rounded-tr-sm shadow-sm"
                    style={{
                      backgroundColor: localSettings.outgoingMessageColor,
                      color: localSettings.outgoingTextColor,
                    }}
                  >
                    Mensagem enviada de exemplo
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 animate-slideUp" style={{ animationDelay: '0.1s' }}>
          <button
            onClick={handleSave}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/30 transition-all duration-200 hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            <Save size={20} />
            Salvar Configurações
          </button>
          <button
            onClick={handleReset}
            className="px-6 py-3 bg-slate-500 text-white rounded-xl font-medium hover:bg-slate-600 transition-all duration-200 hover:scale-[1.02] flex items-center gap-2"
          >
            <RotateCcw size={20} />
            Restaurar Padrão
          </button>
        </div>
      </div>

      {showToast && (
        <Toast
          message={toastMessage}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
}
