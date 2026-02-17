import { useState, useEffect } from 'react';
import { Palette, Building2, Upload, X, RotateCcw, Check } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function SettingsPage() {
  const { settings, updateSettings, resetSettings } = useTheme();
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');

  const [formData, setFormData] = useState({
    companyName: settings.companyName || '',
    logoUrl: settings.logoUrl || '',
    backgroundColor: settings.backgroundColor || '#f8fafc',
    messageBubbleSentColor: settings.messageBubbleSentColor || '#3b82f6',
    messageBubbleSentTextColor: settings.messageBubbleSentTextColor || '#ffffff',
    messageBubbleReceivedColor: settings.messageBubbleReceivedColor || '#ffffff',
    messageBubbleReceivedTextColor: settings.messageBubbleReceivedTextColor || '#1e293b',
  });

  useEffect(() => {
    setFormData({
      companyName: settings.companyName || '',
      logoUrl: settings.logoUrl || '',
      backgroundColor: settings.backgroundColor || '#f8fafc',
      messageBubbleSentColor: settings.messageBubbleSentColor || '#3b82f6',
      messageBubbleSentTextColor: settings.messageBubbleSentTextColor || '#ffffff',
      messageBubbleReceivedColor: settings.messageBubbleReceivedColor || '#ffffff',
      messageBubbleReceivedTextColor: settings.messageBubbleReceivedTextColor || '#1e293b',
    });
  }, [settings]);

  const showSavedMessage = (message: string) => {
    setSavedMessage(message);
    setTimeout(() => setSavedMessage(''), 3000);
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('O arquivo deve ter no máximo 5MB');
      return;
    }

    setUploadingLogo(true);

    try {
      const base64Image = await convertToBase64(file);
      setFormData({ ...formData, logoUrl: base64Image });
      await updateSettings({ logoUrl: base64Image });
      showSavedMessage('Logo salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao processar o logo:', error);
      alert('Erro ao processar o logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    try {
      setFormData({ ...formData, logoUrl: '' });
      await updateSettings({ logoUrl: '' });
      showSavedMessage('Logo removido!');
    } catch (error) {
      console.error('Erro ao remover logo:', error);
    }
  };

  const handleCompanyNameChange = async (value: string) => {
    setFormData({ ...formData, companyName: value });
  };

  const handleCompanyNameBlur = async () => {
    try {
      await updateSettings({ companyName: formData.companyName });
      showSavedMessage('Nome salvo!');
    } catch (error) {
      console.error('Erro ao salvar nome:', error);
    }
  };

  const handleBackgroundColorChange = async (color: string) => {
    setFormData({ ...formData, backgroundColor: color });
    try {
      await updateSettings({ backgroundColor: color });
      showSavedMessage('Cor de fundo salva!');
    } catch (error) {
      console.error('Erro ao salvar cor:', error);
    }
  };

  const handleResetBackground = async () => {
    const defaultColor = '#f8fafc';
    setFormData({ ...formData, backgroundColor: defaultColor });
    try {
      await updateSettings({ backgroundColor: defaultColor });
      showSavedMessage('Cor de fundo resetada!');
    } catch (error) {
      console.error('Erro ao resetar:', error);
    }
  };

  const handleSentBubbleColorChange = async (color: string) => {
    setFormData({ ...formData, messageBubbleSentColor: color });
    try {
      await updateSettings({ messageBubbleSentColor: color });
      showSavedMessage('Cor da bolha enviada salva!');
    } catch (error) {
      console.error('Erro ao salvar cor:', error);
    }
  };

  const handleSentTextColorChange = async (color: string) => {
    setFormData({ ...formData, messageBubbleSentTextColor: color });
    try {
      await updateSettings({ messageBubbleSentTextColor: color });
      showSavedMessage('Cor do texto enviado salva!');
    } catch (error) {
      console.error('Erro ao salvar cor:', error);
    }
  };

  const handleReceivedBubbleColorChange = async (color: string) => {
    setFormData({ ...formData, messageBubbleReceivedColor: color });
    try {
      await updateSettings({ messageBubbleReceivedColor: color });
      showSavedMessage('Cor da bolha recebida salva!');
    } catch (error) {
      console.error('Erro ao salvar cor:', error);
    }
  };

  const handleReceivedTextColorChange = async (color: string) => {
    setFormData({ ...formData, messageBubbleReceivedTextColor: color });
    try {
      await updateSettings({ messageBubbleReceivedTextColor: color });
      showSavedMessage('Cor do texto recebido salva!');
    } catch (error) {
      console.error('Erro ao salvar cor:', error);
    }
  };

  const handleResetSentBubble = async () => {
    const defaultBubbleColor = '#3b82f6';
    const defaultTextColor = '#ffffff';
    setFormData({
      ...formData,
      messageBubbleSentColor: defaultBubbleColor,
      messageBubbleSentTextColor: defaultTextColor,
    });
    try {
      await updateSettings({
        messageBubbleSentColor: defaultBubbleColor,
        messageBubbleSentTextColor: defaultTextColor,
      });
      showSavedMessage('Cores das mensagens enviadas resetadas!');
    } catch (error) {
      console.error('Erro ao resetar:', error);
    }
  };

  const handleResetReceivedBubble = async () => {
    const defaultBubbleColor = '#ffffff';
    const defaultTextColor = '#1e293b';
    setFormData({
      ...formData,
      messageBubbleReceivedColor: defaultBubbleColor,
      messageBubbleReceivedTextColor: defaultTextColor,
    });
    try {
      await updateSettings({
        messageBubbleReceivedColor: defaultBubbleColor,
        messageBubbleReceivedTextColor: defaultTextColor,
      });
      showSavedMessage('Cores das mensagens recebidas resetadas!');
    } catch (error) {
      console.error('Erro ao resetar:', error);
    }
  };

  const handleResetAll = async () => {
    if (confirm('Tem certeza que deseja restaurar TODAS as configurações para o padrão? Esta ação não pode ser desfeita.')) {
      try {
        await resetSettings();
        showSavedMessage('Todas as configurações foram resetadas!');
      } catch (error) {
        console.error('Erro ao resetar configurações:', error);
        alert('Erro ao resetar configurações');
      }
    }
  };

  const backgroundPresets = [
    { name: 'Cinza Claro', value: '#f8fafc' },
    { name: 'Branco', value: '#ffffff' },
    { name: 'Azul Claro', value: '#eff6ff' },
    { name: 'Verde Claro', value: '#f0fdf4' },
    { name: 'Rosa Claro', value: '#fdf2f8' },
    { name: 'Amarelo Claro', value: '#fefce8' },
  ];

  const messageColorPresets = [
    { name: 'Azul', value: '#3b82f6' },
    { name: 'Verde', value: '#10b981' },
    { name: 'Roxo', value: '#8b5cf6' },
    { name: 'Rosa', value: '#ec4899' },
    { name: 'Laranja', value: '#f97316' },
    { name: 'Cinza', value: '#64748b' },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <div className="max-w-5xl mx-auto">
        {savedMessage && (
          <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slideUp">
            <Check className="w-5 h-5" />
            {savedMessage}
          </div>
        )}

        <div className="animate-fadeIn mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Configurações da Empresa</h1>
          <p className="text-slate-600">Personalize a aparência do seu sistema. As alterações são salvas automaticamente.</p>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 animate-slideUp">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Identidade da Empresa</h2>
                  <p className="text-sm text-slate-600">Logo e nome exibidos no sistema</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nome da Empresa
                </label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => handleCompanyNameChange(e.target.value)}
                  onBlur={handleCompanyNameBlur}
                  placeholder="Digite o nome da empresa"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Logo da Empresa <span className="text-slate-500">(Recomendado: 200x60px)</span>
                </label>

                {formData.logoUrl && (
                  <div className="mb-4 relative inline-block">
                    <img
                      src={formData.logoUrl}
                      alt="Logo"
                      className="h-16 object-contain border border-slate-200 rounded-lg p-2 bg-white"
                    />
                    <button
                      onClick={handleRemoveLogo}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer transition-all">
                  <Upload className="w-4 h-4" />
                  {uploadingLogo ? 'Enviando...' : 'Enviar Logo'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 animate-slideUp">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center">
                  <Palette className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Cor de Fundo do Chat</h2>
                  <p className="text-sm text-slate-600">Escolha a cor de fundo da área de mensagens</p>
                </div>
              </div>
              <button
                onClick={handleResetBackground}
                className="px-3 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-all flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Resetar
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Cores Predefinidas
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-4">
                  {backgroundPresets.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => handleBackgroundColorChange(preset.value)}
                      className="relative group"
                    >
                      <div
                        className={`w-full aspect-square rounded-lg transition-all duration-200 border-2 ${
                          formData.backgroundColor === preset.value
                            ? 'border-blue-500 scale-95'
                            : 'border-slate-300 hover:scale-105'
                        }`}
                        style={{ backgroundColor: preset.value }}
                      />
                      <p className="text-xs font-medium text-slate-700 mt-1 text-center">
                        {preset.name}
                      </p>
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.backgroundColor}
                    onChange={(e) => handleBackgroundColorChange(e.target.value)}
                    className="w-16 h-10 rounded-lg cursor-pointer border-2 border-slate-300"
                  />
                  <input
                    type="text"
                    value={formData.backgroundColor}
                    onChange={(e) => handleBackgroundColorChange(e.target.value)}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="#f8fafc"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 animate-slideUp">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center">
                <Palette className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Balões de Mensagem</h2>
                <p className="text-sm text-slate-600">Personalize as cores das mensagens</p>
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-900">Mensagens Enviadas</h3>
                  <button
                    onClick={handleResetSentBubble}
                    className="px-3 py-1.5 text-xs bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-all flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Resetar
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                      Cor do Balão
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-3">
                      {messageColorPresets.map((preset) => (
                        <button
                          key={preset.value}
                          onClick={() => handleSentBubbleColorChange(preset.value)}
                          className="relative group"
                        >
                          <div
                            className={`w-full aspect-square rounded-lg transition-all duration-200 border-2 ${
                              formData.messageBubbleSentColor === preset.value
                                ? 'border-blue-500 scale-95'
                                : 'border-slate-300 hover:scale-105'
                            }`}
                            style={{ backgroundColor: preset.value }}
                          />
                          <p className="text-xs font-medium text-slate-700 mt-1 text-center">
                            {preset.name}
                          </p>
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={formData.messageBubbleSentColor}
                        onChange={(e) => handleSentBubbleColorChange(e.target.value)}
                        className="w-16 h-10 rounded-lg cursor-pointer border-2 border-slate-300"
                      />
                      <input
                        type="text"
                        value={formData.messageBubbleSentColor}
                        onChange={(e) => handleSentBubbleColorChange(e.target.value)}
                        className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Cor do Texto
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={formData.messageBubbleSentTextColor}
                        onChange={(e) => handleSentTextColorChange(e.target.value)}
                        className="w-16 h-10 rounded-lg cursor-pointer border-2 border-slate-300"
                      />
                      <input
                        type="text"
                        value={formData.messageBubbleSentTextColor}
                        onChange={(e) => handleSentTextColorChange(e.target.value)}
                        className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: formData.messageBubbleSentColor }}>
                  <p style={{ color: formData.messageBubbleSentTextColor }} className="text-sm font-medium">
                    Exemplo de mensagem enviada
                  </p>
                </div>
              </div>

              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-900">Mensagens Recebidas</h3>
                  <button
                    onClick={handleResetReceivedBubble}
                    className="px-3 py-1.5 text-xs bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-all flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Resetar
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Cor do Balão
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={formData.messageBubbleReceivedColor}
                        onChange={(e) => handleReceivedBubbleColorChange(e.target.value)}
                        className="w-16 h-10 rounded-lg cursor-pointer border-2 border-slate-300"
                      />
                      <input
                        type="text"
                        value={formData.messageBubbleReceivedColor}
                        onChange={(e) => handleReceivedBubbleColorChange(e.target.value)}
                        className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Cor do Texto
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={formData.messageBubbleReceivedTextColor}
                        onChange={(e) => handleReceivedTextColorChange(e.target.value)}
                        className="w-16 h-10 rounded-lg cursor-pointer border-2 border-slate-300"
                      />
                      <input
                        type="text"
                        value={formData.messageBubbleReceivedTextColor}
                        onChange={(e) => handleReceivedTextColorChange(e.target.value)}
                        className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: formData.messageBubbleReceivedColor }}>
                  <p style={{ color: formData.messageBubbleReceivedTextColor }} className="text-sm font-medium">
                    Exemplo de mensagem recebida
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleResetAll}
              className="px-6 py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Restaurar Tudo ao Padrão
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
