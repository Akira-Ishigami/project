import { useState, useEffect } from 'react';
import { Settings, Palette, Image as ImageIcon, Building2, Upload, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';

export default function SettingsPage() {
  const { settings, updateSettings, companyId } = useTheme();
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBackground, setUploadingBackground] = useState(false);

  const [formData, setFormData] = useState({
    companyName: settings.companyName || '',
    logoUrl: settings.logoUrl || '',
    backgroundType: settings.backgroundType || 'color',
    backgroundColor: settings.backgroundColor || '#f8fafc',
    backgroundImageUrl: settings.backgroundImageUrl || '',
    messageBubbleSentColor: settings.messageBubbleSentColor || '#3b82f6',
    messageBubbleSentTextColor: settings.messageBubbleSentTextColor || '#ffffff',
    messageBubbleReceivedColor: settings.messageBubbleReceivedColor || '#ffffff',
    messageBubbleReceivedTextColor: settings.messageBubbleReceivedTextColor || '#1e293b',
  });

  useEffect(() => {
    setFormData({
      companyName: settings.companyName || '',
      logoUrl: settings.logoUrl || '',
      backgroundType: settings.backgroundType || 'color',
      backgroundColor: settings.backgroundColor || '#f8fafc',
      backgroundImageUrl: settings.backgroundImageUrl || '',
      messageBubbleSentColor: settings.messageBubbleSentColor || '#3b82f6',
      messageBubbleSentTextColor: settings.messageBubbleSentTextColor || '#ffffff',
      messageBubbleReceivedColor: settings.messageBubbleReceivedColor || '#ffffff',
      messageBubbleReceivedTextColor: settings.messageBubbleReceivedTextColor || '#1e293b',
    });
  }, [settings]);

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
      const fileExt = file.name.split('.').pop();
      const fileName = `${companyId}/logo-${Date.now()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from('company-branding')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('company-branding')
        .getPublicUrl(fileName);

      setFormData({ ...formData, logoUrl: publicUrl });
      await updateSettings({ logoUrl: publicUrl });
    } catch (error) {
      console.error('Erro ao fazer upload do logo:', error);
      alert('Erro ao fazer upload do logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setUploadingBackground(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${companyId}/background-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('company-branding')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('company-branding')
        .getPublicUrl(fileName);

      setFormData({ ...formData, backgroundImageUrl: publicUrl, backgroundType: 'image' });
      await updateSettings({ backgroundImageUrl: publicUrl, backgroundType: 'image' });
    } catch (error) {
      console.error('Erro ao fazer upload da imagem de fundo:', error);
      alert('Erro ao fazer upload da imagem de fundo');
    } finally {
      setUploadingBackground(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings(formData);
      alert('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      alert('Erro ao salvar configurações');
    } finally {
      setSaving(false);
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
        <div className="animate-fadeIn mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Configurações da Empresa</h1>
          <p className="text-slate-600">Personalize a aparência do seu sistema</p>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 animate-slideUp">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Identidade da Empresa</h2>
                <p className="text-sm text-slate-600">Logo e nome exibidos no sistema</p>
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
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
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
                      onClick={() => {
                        setFormData({ ...formData, logoUrl: '' });
                        updateSettings({ logoUrl: '' });
                      }}
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
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Fundo do Chat</h2>
                <p className="text-sm text-slate-600">Escolha uma cor ou imagem de fundo</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex gap-4">
                <button
                  onClick={() => setFormData({ ...formData, backgroundType: 'color' })}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                    formData.backgroundType === 'color'
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Cor Sólida
                </button>
                <button
                  onClick={() => setFormData({ ...formData, backgroundType: 'image' })}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                    formData.backgroundType === 'image'
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Imagem
                </button>
              </div>

              {formData.backgroundType === 'color' ? (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    Cores Predefinidas
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-4">
                    {backgroundPresets.map((preset) => (
                      <button
                        key={preset.value}
                        onClick={() => setFormData({ ...formData, backgroundColor: preset.value })}
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
                      onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                      className="w-16 h-10 rounded-lg cursor-pointer border-2 border-slate-300"
                    />
                    <input
                      type="text"
                      value={formData.backgroundColor}
                      onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="#f8fafc"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Imagem de Fundo <span className="text-slate-500">(Recomendado: 1920x1080px - Full HD)</span>
                  </label>

                  {formData.backgroundImageUrl && (
                    <div className="mb-4 relative inline-block">
                      <img
                        src={formData.backgroundImageUrl}
                        alt="Fundo"
                        className="h-32 object-cover border border-slate-200 rounded-lg"
                      />
                      <button
                        onClick={() => {
                          setFormData({ ...formData, backgroundImageUrl: '' });
                          updateSettings({ backgroundImageUrl: '' });
                        }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer transition-all">
                    <Upload className="w-4 h-4" />
                    {uploadingBackground ? 'Enviando...' : 'Enviar Imagem'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBackgroundUpload}
                      disabled={uploadingBackground}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
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
                <h3 className="text-sm font-semibold text-slate-900 mb-4">Mensagens Enviadas</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                      Cor do Balão
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-3">
                      {messageColorPresets.map((preset) => (
                        <button
                          key={preset.value}
                          onClick={() => setFormData({ ...formData, messageBubbleSentColor: preset.value })}
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
                        onChange={(e) => setFormData({ ...formData, messageBubbleSentColor: e.target.value })}
                        className="w-16 h-10 rounded-lg cursor-pointer border-2 border-slate-300"
                      />
                      <input
                        type="text"
                        value={formData.messageBubbleSentColor}
                        onChange={(e) => setFormData({ ...formData, messageBubbleSentColor: e.target.value })}
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
                        onChange={(e) => setFormData({ ...formData, messageBubbleSentTextColor: e.target.value })}
                        className="w-16 h-10 rounded-lg cursor-pointer border-2 border-slate-300"
                      />
                      <input
                        type="text"
                        value={formData.messageBubbleSentTextColor}
                        onChange={(e) => setFormData({ ...formData, messageBubbleSentTextColor: e.target.value })}
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
                <h3 className="text-sm font-semibold text-slate-900 mb-4">Mensagens Recebidas</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Cor do Balão
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={formData.messageBubbleReceivedColor}
                        onChange={(e) => setFormData({ ...formData, messageBubbleReceivedColor: e.target.value })}
                        className="w-16 h-10 rounded-lg cursor-pointer border-2 border-slate-300"
                      />
                      <input
                        type="text"
                        value={formData.messageBubbleReceivedColor}
                        onChange={(e) => setFormData({ ...formData, messageBubbleReceivedColor: e.target.value })}
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
                        onChange={(e) => setFormData({ ...formData, messageBubbleReceivedTextColor: e.target.value })}
                        className="w-16 h-10 rounded-lg cursor-pointer border-2 border-slate-300"
                      />
                      <input
                        type="text"
                        value={formData.messageBubbleReceivedTextColor}
                        onChange={(e) => setFormData({ ...formData, messageBubbleReceivedTextColor: e.target.value })}
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

          <div className="flex justify-end gap-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
            >
              {saving ? 'Salvando...' : 'Salvar Configurações'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
