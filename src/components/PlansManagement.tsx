import { Sparkles, Rocket, Settings, TrendingUp } from 'lucide-react';

export default function PlansManagement() {
  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-purple-50">
      <div className="flex-none border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-8 py-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Gestão de Planos</h1>
            <p className="text-slate-600 mt-1">Configure e gerencie os planos de assinatura</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 flex items-center justify-center">
        <div className="max-w-4xl w-full">
          <div className="bg-gradient-to-br from-purple-500 via-blue-500 to-teal-500 rounded-3xl p-12 text-white shadow-2xl">
            <div className="flex items-center justify-center gap-4 mb-6">
              <Sparkles size={48} className="animate-pulse" />
              <Rocket size={48} />
              <Settings size={48} className="animate-spin" style={{ animationDuration: '3s' }} />
            </div>

            <h2 className="text-4xl font-bold text-center mb-4">
              Tela em Desenvolvimento
            </h2>

            <p className="text-xl text-center text-white/90 mb-8">
              Esta seção está sendo construída e em breve terá funcionalidades completas para gerenciamento de planos
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles size={32} />
                </div>
                <h3 className="text-lg font-semibold mb-2">Criar Planos</h3>
                <p className="text-sm text-white/80">Defina planos personalizados com preços e recursos</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Settings size={32} />
                </div>
                <h3 className="text-lg font-semibold mb-2">Gerenciar</h3>
                <p className="text-sm text-white/80">Edite e configure limites e permissões</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp size={32} />
                </div>
                <h3 className="text-lg font-semibold mb-2">Analisar</h3>
                <p className="text-sm text-white/80">Acompanhe métricas e estatísticas de uso</p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-4 text-center">Recursos Planejados</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-white rounded-full mt-2 flex-shrink-0"></div>
                  <p>Criação e edição de planos com preços flexíveis</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-white rounded-full mt-2 flex-shrink-0"></div>
                  <p>Definição de limites de atendentes e contatos</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-white rounded-full mt-2 flex-shrink-0"></div>
                  <p>Configuração de recursos inclusos por plano</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-white rounded-full mt-2 flex-shrink-0"></div>
                  <p>Ativação e desativação de planos</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-white rounded-full mt-2 flex-shrink-0"></div>
                  <p>Dashboard com estatísticas de assinaturas</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-white rounded-full mt-2 flex-shrink-0"></div>
                  <p>Gestão de upgrades e downgrades</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
