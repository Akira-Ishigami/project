import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CreditCard, Calendar, Users, MessageSquare, Bot, Check, Loader2, ArrowUpCircle, ChevronDown, ChevronUp } from 'lucide-react';

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

interface Company {
  payment_day: number | null;
  plan_id: string | null;
}

interface MyPlanProps {
  companyId: string;
}

export default function MyPlan({ companyId }: MyPlanProps) {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [allPlans, setAllPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllPlans, setShowAllPlans] = useState(false);

  useEffect(() => {
    loadData();
  }, [companyId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('plan_id, payment_day')
        .eq('id', companyId)
        .maybeSingle();

      if (companyError) throw companyError;

      if (!companyData?.plan_id) {
        setError('Nenhum plano associado a esta empresa');
        setLoading(false);
        return;
      }

      setCompany(companyData);

      const { data: planData, error: planError } = await supabase
        .from('plans')
        .select('*')
        .eq('id', companyData.plan_id)
        .maybeSingle();

      if (planError) throw planError;

      if (!planData) {
        setError('Plano não encontrado');
        setLoading(false);
        return;
      }

      setPlan(planData);

      const { data: allPlansData, error: allPlansError } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (allPlansError) throw allPlansError;
      setAllPlans(allPlansData || []);
    } catch (err) {
      console.error('Error loading plan:', err);
      setError('Erro ao carregar informações do plano');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = () => {
    const message = encodeURIComponent(
      `Olá! Gostaria de fazer upgrade do meu plano. Atualmente estou no plano "${plan?.name}" e tenho interesse em conhecer outras opções.`
    );
    window.open(`https://wa.me/5511999999999?text=${message}`, '_blank');
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
      <div className="max-w-6xl mx-auto p-8">
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

  const getNextPaymentDate = () => {
    if (!company?.payment_day) return null;

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    let nextPayment = new Date(currentYear, currentMonth, company.payment_day);

    if (nextPayment < today) {
      nextPayment = new Date(currentYear, currentMonth + 1, company.payment_day);
    }

    return nextPayment.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const nextPaymentDate = getNextPaymentDate();

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-white">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex-1 min-w-[250px]">
              <h1 className="text-3xl font-bold mb-2">{plan.name}</h1>
              {plan.description && (
                <p className="text-blue-100 text-base leading-relaxed max-w-2xl">
                  {plan.description}
                </p>
              )}
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold mb-1">
                R$ {plan.price.toFixed(2)}
              </div>
              <div className="text-blue-100 flex items-center justify-end gap-2 mb-3">
                <Calendar className="w-4 h-4" />
                {billingPeriodText}
              </div>
              {nextPaymentDate && (
                <div className="text-sm text-blue-200">
                  Próximo vencimento: {nextPaymentDate}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">
            Recursos incluídos
          </h2>

          <div className="grid gap-4 md:grid-cols-3 mb-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const isEnabled = feature.enabled !== undefined ? feature.enabled : true;

              return (
                <div
                  key={index}
                  className={`flex items-start gap-3 p-4 rounded-lg border ${
                    isEnabled
                      ? 'border-blue-200 bg-blue-50'
                      : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isEnabled
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-300 text-slate-600'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 text-sm mb-1">
                      {feature.label}
                    </div>
                    <div
                      className={`text-xs ${
                        isEnabled ? 'text-blue-700' : 'text-slate-600'
                      }`}
                    >
                      {feature.value}
                    </div>
                  </div>
                  {isEnabled && (
                    <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleUpgrade}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md hover:shadow-lg font-semibold"
            >
              <ArrowUpCircle className="w-5 h-5" />
              Fazer Upgrade do Plano
            </button>

            <button
              onClick={() => setShowAllPlans(!showAllPlans)}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-all font-semibold"
            >
              {showAllPlans ? (
                <>
                  <ChevronUp className="w-5 h-5" />
                  Ocultar Outros Planos
                </>
              ) : (
                <>
                  <ChevronDown className="w-5 h-5" />
                  Comparar Planos
                </>
              )}
            </button>
          </div>

          {plan.is_active ? (
            <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
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
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-600 rounded-full flex items-center justify-center flex-shrink-0">
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

      {showAllPlans && allPlans.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900">Compare Todos os Planos</h2>
            <p className="text-slate-600 mt-1">Escolha o plano ideal para o seu negócio</p>
          </div>

          <div className="p-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {allPlans.map((p) => {
                const isCurrentPlan = p.id === plan.id;
                const planFeatures = [
                  {
                    icon: Users,
                    label: 'Atendentes',
                    value: p.max_attendants ? `Até ${p.max_attendants}` : 'Ilimitado',
                  },
                  {
                    icon: MessageSquare,
                    label: 'Contatos',
                    value: p.max_contacts ? `Até ${p.max_contacts}` : 'Ilimitado',
                  },
                  {
                    icon: Bot,
                    label: 'IA',
                    value: p.ai_enabled ? 'Disponível' : 'Não disponível',
                    enabled: p.ai_enabled,
                  },
                ];

                return (
                  <div
                    key={p.id}
                    className={`relative rounded-xl border-2 overflow-hidden transition-all ${
                      isCurrentPlan
                        ? 'border-blue-600 shadow-lg ring-2 ring-blue-200'
                        : 'border-slate-200 hover:border-blue-300 hover:shadow-md'
                    }`}
                  >
                    {isCurrentPlan && (
                      <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                        Plano Atual
                      </div>
                    )}

                    <div className="p-6">
                      <h3 className="text-xl font-bold text-slate-900 mb-2">{p.name}</h3>
                      {p.description && (
                        <p className="text-sm text-slate-600 mb-4 line-clamp-3">
                          {p.description}
                        </p>
                      )}

                      <div className="mb-4">
                        <div className="text-3xl font-bold text-slate-900">
                          R$ {p.price.toFixed(2)}
                        </div>
                        <div className="text-sm text-slate-600">
                          {p.billing_period === 'monthly' ? 'por mês' : 'por ano'}
                        </div>
                      </div>

                      <div className="space-y-3 mb-6">
                        {planFeatures.map((feature, idx) => {
                          const Icon = feature.icon;
                          const isEnabled = feature.enabled !== undefined ? feature.enabled : true;

                          return (
                            <div key={idx} className="flex items-center gap-2">
                              <Icon className={`w-4 h-4 flex-shrink-0 ${isEnabled ? 'text-blue-600' : 'text-slate-400'}`} />
                              <span className={`text-sm ${isEnabled ? 'text-slate-900' : 'text-slate-500'}`}>
                                {feature.value}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {!isCurrentPlan && (
                        <button
                          onClick={handleUpgrade}
                          className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all font-semibold text-sm"
                        >
                          Escolher Plano
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
