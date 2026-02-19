import { useState } from 'react';
import { Package, Plus, Edit2, Trash2, Check, X, DollarSign, Users, Zap, Crown, Sparkles } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  billingPeriod: 'monthly' | 'yearly';
  maxAttendants: number;
  maxContacts: number;
  features: string[];
  isPopular: boolean;
  status: 'active' | 'inactive';
  color: string;
}

export default function PlansManagement() {
  const [plans] = useState<Plan[]>([
    {
      id: '1',
      name: 'Básico',
      description: 'Ideal para pequenos negócios começando',
      price: 49.90,
      billingPeriod: 'monthly',
      maxAttendants: 2,
      maxContacts: 500,
      features: [
        'Até 2 atendentes',
        '500 contatos',
        'WhatsApp integrado',
        'Suporte por email'
      ],
      isPopular: false,
      status: 'active',
      color: '#3b82f6'
    },
    {
      id: '2',
      name: 'Profissional',
      description: 'Para empresas em crescimento',
      price: 99.90,
      billingPeriod: 'monthly',
      maxAttendants: 5,
      maxContacts: 2000,
      features: [
        'Até 5 atendentes',
        '2.000 contatos',
        'WhatsApp + Telegram',
        'Relatórios avançados',
        'Suporte prioritário'
      ],
      isPopular: true,
      status: 'active',
      color: '#8b5cf6'
    },
    {
      id: '3',
      name: 'Empresarial',
      description: 'Solução completa para grandes equipes',
      price: 199.90,
      billingPeriod: 'monthly',
      maxAttendants: 20,
      maxContacts: 10000,
      features: [
        'Até 20 atendentes',
        '10.000 contatos',
        'Todas as integrações',
        'API completa',
        'IA avançada',
        'Suporte 24/7',
        'Gerente de conta dedicado'
      ],
      isPopular: false,
      status: 'active',
      color: '#f59e0b'
    }
  ]);

  const getPlanIcon = (planName: string) => {
    if (planName.includes('Básico')) return Package;
    if (planName.includes('Profissional')) return Zap;
    if (planName.includes('Empresarial')) return Crown;
    return Package;
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="flex-none border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-8 py-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Gestão de Planos</h1>
            <p className="text-slate-600 mt-1">Configure e gerencie os planos de assinatura</p>
          </div>
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 shadow-lg hover:shadow-xl">
            <Plus size={20} />
            Novo Plano
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 mb-8 text-white shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles size={32} />
              <h2 className="text-2xl font-bold">Tela em Desenvolvimento</h2>
            </div>
            <p className="text-blue-100 text-lg">
              Esta é a nova seção de gerenciamento de planos. Aqui você poderá criar, editar e gerenciar todos os planos de assinatura do sistema.
            </p>
            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-3xl font-bold">{plans.length}</div>
                <div className="text-blue-100 text-sm">Planos Cadastrados</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-3xl font-bold">{plans.filter(p => p.status === 'active').length}</div>
                <div className="text-blue-100 text-sm">Planos Ativos</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-3xl font-bold">R$ {plans.reduce((sum, p) => sum + p.price, 0).toFixed(2)}</div>
                <div className="text-blue-100 text-sm">Receita Potencial</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const IconComponent = getPlanIcon(plan.name);
              return (
                <div
                  key={plan.id}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-transparent hover:border-blue-200 relative"
                >
                  {plan.isPopular && (
                    <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                      <Sparkles size={12} />
                      POPULAR
                    </div>
                  )}

                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className="p-3 rounded-xl shadow-md"
                        style={{ backgroundColor: `${plan.color}20`, color: plan.color }}
                      >
                        <IconComponent size={28} />
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 hover:text-blue-600">
                          <Edit2 size={18} />
                        </button>
                        <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 hover:text-red-600">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                    <p className="text-slate-600 text-sm mb-4">{plan.description}</p>

                    <div className="flex items-baseline gap-2 mb-6">
                      <span className="text-4xl font-bold text-slate-900">
                        R$ {plan.price.toFixed(2)}
                      </span>
                      <span className="text-slate-500 text-sm">
                        /{plan.billingPeriod === 'monthly' ? 'mês' : 'ano'}
                      </span>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-3 text-sm">
                        <div className="p-1.5 bg-blue-100 rounded-lg">
                          <Users size={16} className="text-blue-600" />
                        </div>
                        <span className="text-slate-700">
                          <strong>{plan.maxAttendants}</strong> atendentes
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="p-1.5 bg-green-100 rounded-lg">
                          <DollarSign size={16} className="text-green-600" />
                        </div>
                        <span className="text-slate-700">
                          <strong>{plan.maxContacts.toLocaleString()}</strong> contatos
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-slate-200 pt-4 space-y-2">
                      {plan.features.map((feature, index) => (
                        <div key={index} className="flex items-start gap-2 text-sm">
                          <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-slate-700">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 flex items-center justify-between">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          plan.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {plan.status === 'active' ? 'Ativo' : 'Inativo'}
                      </span>
                      <button
                        className="px-4 py-2 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
                        style={{
                          backgroundColor: plan.color,
                          color: 'white'
                        }}
                      >
                        Editar Plano
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
            <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Sparkles className="text-yellow-500" size={24} />
              Funcionalidades Planejadas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Check size={20} className="text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Criar Novos Planos</h4>
                  <p className="text-sm text-slate-600">Adicionar planos personalizados com diferentes recursos</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Check size={20} className="text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Editar Planos Existentes</h4>
                  <p className="text-sm text-slate-600">Modificar preços, recursos e limites</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Check size={20} className="text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Ativar/Desativar Planos</h4>
                  <p className="text-sm text-slate-600">Controlar quais planos estão disponíveis</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Check size={20} className="text-orange-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Relatórios de Assinaturas</h4>
                  <p className="text-sm text-slate-600">Visualizar estatísticas e métricas de cada plano</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
