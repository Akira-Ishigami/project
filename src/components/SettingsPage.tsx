import { Settings, Wrench } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="animate-fadeIn mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Configurações</h1>
          <p className="text-slate-600">Personalize seu sistema</p>
        </div>

        <div className="bg-white rounded-2xl p-12 shadow-lg border border-slate-200 animate-slideUp">
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Wrench className="w-12 h-12 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Em Desenvolvimento</h2>
            <p className="text-slate-600 max-w-md mx-auto leading-relaxed">
              Esta seção está sendo desenvolvida e em breve estará disponível com diversas opções de personalização e configuração do sistema.
            </p>
            <div className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-blue-50 text-blue-700 rounded-lg font-medium">
              <Settings className="w-5 h-5" />
              Novidades em breve
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
