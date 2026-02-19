import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CreditCard, Calendar, Users, MessageSquare, Bot, Check, Loader2 } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  billing_period: 'monthly' | 'annual';
  max_attendants: number | null;
  max_contacts: number | null;
  is_active: boolean;
  ai_enabled: boolean;
  created_at: string;
}

interface MyPlanProps {
  companyId: string;
}

export default function MyPlan({ companyId }: MyPlanProps) {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPlan();
  }, [companyId]);

  const loadPlan = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('plan_id')
        .eq('id', companyId)
        .maybeSingle();

      if (companyError) throw companyError;

      if (!company?.plan_id) {
        setError('Nenhum plano associado a esta empresa');
        setLoading(false);
        return;
      }

      const { data: planData, error: planError } = await supabase
        .from('plans')
        .select('*')
        .eq('id', company.plan_id)
        .maybeSingle();

      if (planError) throw planError;

      if (!planData) {
        setError('Plano não encontrado');
        setLoading(false);
        return;
      }

      setPlan(planData);
    } catch (err) {
      console.error('Error loading plan:', err);
      setError('Erro ao carregar informações do plano');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            {error || 'Nenhum plano encontrado'}
          </h3>
          <p className="text-slate-600">
            Entre em contato com o administrador para associar um plano a esta empresa.
          </p>
        </div>
      </div>
    );
  }

  const billingPeriodText = plan.billing_period === 'monthly' ? 'Mensal' : 'Anual';
  const features = [
    {
      icon: Users,
      label: 'Atendentes',
      value: plan.max_attendants ? `Até ${plan.max_attendants}` : 'Ilimitado',
    },
    {
      icon: MessageSquare,
      label: 'Contatos',
      value: plan.max_contacts ? `Até ${plan.max_contacts}` : 'Ilimitado',
    },
    {
      icon: Bot,
      label: 'Inteligência Artificial',
      value: plan.ai_enabled ? 'Disponível' : 'Não disponível',
      enabled: plan.ai_enabled,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{plan.name}</h1>
              {plan.description && (
                <p className="text-blue-100 text-lg">{plan.description}</p>
              )}
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold mb-1">
                R$ {plan.price.toFixed(2)}
              </div>
              <div className="text-blue-100 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {billingPeriodText}
              </div>
            </div>
          </div>
        </div>

        <div className="p-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">
            Recursos incluídos
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const isEnabled = feature.enabled !== undefined ? feature.enabled : true;

              return (
                <div
                  key={index}
                  className={`flex items-start gap-4 p-4 rounded-lg border ${
                    isEnabled
                      ? 'border-blue-200 bg-blue-50'
                      : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      isEnabled
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-300 text-slate-600'
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900 mb-1">
                      {feature.label}
                    </div>
                    <div
                      className={`text-sm ${
                        isEnabled ? 'text-blue-700' : 'text-slate-600'
                      }`}
                    >
                      {feature.value}
                    </div>
                  </div>
                  {isEnabled && (
                    <Check className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>

          {plan.is_active ? (
            <div className="mt-8 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center">
                  <Check className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-emerald-900">Plano Ativo</div>
                  <div className="text-sm text-emerald-700">
                    Seu plano está ativo e disponível para uso
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-600 rounded-full flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-amber-900">Plano Inativo</div>
                  <div className="text-sm text-amber-700">
                    Entre em contato com o administrador para reativar
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
