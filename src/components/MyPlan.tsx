import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { CreditCard, Calendar, Users, MessageSquare, Bot, Check, Loader2, Sparkles, ChevronDown, ChevronUp, Zap, ChevronLeft, ChevronRight } from 'lucide-react';

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
  payment_notification_day: number | null;
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
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isButtonClicked, setIsButtonClicked] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, [companyId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('plan_id, payment_day, payment_notification_day')
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

  const handleTogglePlans = () => {
    setIsButtonClicked(true);
    setTimeout(() => setIsButtonClicked(false), 300);
    setShowAllPlans(!showAllPlans);
    setCurrentSlide(0);
  };

  const getVisibleCards = () => {
    if (window.innerWidth >= 1024) return 3;
    if (window.innerWidth >= 768) return 2;
    return 1;
  };

  const nextSlide = () => {
    const visibleCards = getVisibleCards();
    const maxSlide = Math.max(0, allPlans.length - visibleCards);
    setCurrentSlide((prev) => Math.min(prev + 1, maxSlide));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => Math.max(prev - 1, 0));
  };

  const canGoNext = () => {
    const visibleCards = getVisibleCards();
    return currentSlide < allPlans.length - visibleCards;
  };

  const canGoPrev = () => {
    return currentSlide > 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full blur-xl opacity-20 animate-pulse"></div>
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 relative z-10" />
        </div>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="relative backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl shadow-2xl p-8 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-3xl"></div>
            <div className="relative z-10">
              <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                <CreditCard className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                {error || 'Nenhum plano encontrado'}
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Entre em contato com o administrador para associar um plano a esta empresa.
              </p>
            </div>
          </div>
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
    if (!company?.payment_notification_day) return null;

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    let nextPayment = new Date(currentYear, currentMonth, company.payment_notification_day);

    if (nextPayment < today) {
      nextPayment = new Date(currentYear, currentMonth + 1, company.payment_notification_day);
    }

    return nextPayment.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const nextPaymentDate = getNextPaymentDate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 rounded-3xl blur-xl opacity-25 group-hover:opacity-40 transition duration-1000 animate-pulse"></div>

          <div className="relative backdrop-blur-xl bg-white/80 border border-white/20 rounded-3xl shadow-2xl overflow-hidden mb-8">
            <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-tr from-cyan-400/10 to-blue-400/10 blur-3xl"></div>

            <div className="relative p-8 md:p-12">
              <div className="flex items-start justify-between flex-wrap gap-6 mb-8">
                <div className="flex-1 min-w-[280px]">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full text-white text-xs font-semibold mb-4 shadow-lg">
                    <Sparkles className="w-3.5 h-3.5" />
                    Plano Ativo
                  </div>
                  <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-900 mb-4">
                    {plan.name}
                  </h1>
                  {plan.description && (
                    <p className="text-slate-600 text-base md:text-lg leading-relaxed max-w-2xl">
                      {plan.description}
                    </p>
                  )}
                </div>

                <div className="text-right bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-2xl border border-blue-100/50 shadow-inner min-w-[200px]">
                  <div className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600 mb-2">
                    R$ {plan.price.toFixed(2)}
                  </div>
                  <div className="text-slate-600 flex items-center justify-end gap-2 mb-3 font-medium">
                    <Calendar className="w-4 h-4" />
                    {billingPeriodText}
                  </div>
                  {nextPaymentDate && (
                    <div className="text-sm text-slate-500 font-medium">
                      Vencimento: {nextPaymentDate}
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>
                  <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Recursos Incluídos</span>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  {features.map((feature, index) => {
                    const Icon = feature.icon;
                    const isEnabled = feature.enabled !== undefined ? feature.enabled : true;

                    return (
                      <div
                        key={index}
                        className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 ${
                          isEnabled
                            ? 'border-blue-200/50 bg-gradient-to-br from-blue-50/50 to-cyan-50/50 hover:shadow-lg hover:border-blue-300'
                            : 'border-slate-200/50 bg-slate-50/30 hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-2xl"></div>
                        <div className="relative p-5">
                          <div className="flex items-start gap-4">
                            <div
                              className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg transition-transform duration-300 group-hover:scale-110 ${
                                isEnabled
                                  ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white'
                                  : 'bg-gradient-to-br from-slate-300 to-slate-400 text-white'
                              }`}
                            >
                              <Icon className="w-6 h-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-slate-900 mb-1.5">
                                {feature.label}
                              </div>
                              <div
                                className={`text-sm font-medium ${
                                  isEnabled ? 'text-blue-700' : 'text-slate-500'
                                }`}
                              >
                                {feature.value}
                              </div>
                            </div>
                            {isEnabled && (
                              <div className="flex-shrink-0">
                                <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-green-500 rounded-full flex items-center justify-center shadow-lg">
                                  <Check className="w-4 h-4 text-white" strokeWidth={3} />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleUpgrade}
                  className="group relative flex-1 overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-500 p-[2px] hover:shadow-2xl hover:shadow-emerald-500/50 transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-400 opacity-0 group-hover:opacity-100 blur transition-opacity duration-300"></div>
                  <div className="relative bg-gradient-to-r from-emerald-500 to-green-500 px-8 py-4 rounded-2xl flex items-center justify-center gap-3">
                    <Zap className="w-5 h-5 text-white" />
                    <span className="font-bold text-white text-lg">Fazer Upgrade</span>
                  </div>
                </button>

                <button
                  onClick={handleTogglePlans}
                  className={`group relative flex-1 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 p-[2px] hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 ${
                    isButtonClicked ? 'scale-95' : 'scale-100'
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 opacity-0 group-hover:opacity-100 blur transition-opacity duration-300"></div>
                  <div className={`relative bg-white/95 backdrop-blur px-8 py-4 rounded-2xl flex items-center justify-center gap-3 transition-all duration-200 ${
                    isButtonClicked ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : ''
                  }`}>
                    {showAllPlans ? (
                      <>
                        <ChevronUp className={`w-5 h-5 transition-all duration-200 ${
                          isButtonClicked ? 'text-white rotate-180' : 'text-blue-600'
                        }`} />
                        <span className={`font-bold text-lg transition-all duration-200 ${
                          isButtonClicked ? 'text-white' : 'text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600'
                        }`}>Ocultar Planos</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className={`w-5 h-5 transition-all duration-200 ${
                          isButtonClicked ? 'text-white -rotate-180' : 'text-blue-600'
                        }`} />
                        <span className={`font-bold text-lg transition-all duration-200 ${
                          isButtonClicked ? 'text-white' : 'text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600'
                        }`}>Comparar Planos</span>
                      </>
                    )}
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>


        <div
          className={`transition-all duration-700 ease-in-out overflow-hidden ${
            showAllPlans ? 'max-h-[5000px] opacity-100 mt-8' : 'max-h-0 opacity-0 mt-0'
          }`}
        >
          {allPlans.length > 0 && (
            <div className="relative backdrop-blur-xl bg-white/80 border border-white/20 rounded-3xl shadow-2xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500"></div>

              <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
              </div>

              <div className="relative p-8 md:p-12">
                <div className="text-center mb-12 space-y-4">
                  <div className="inline-block">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-px w-12 bg-gradient-to-r from-transparent to-blue-500"></div>
                      <Sparkles className="w-6 h-6 text-blue-500 animate-pulse" />
                      <div className="h-px w-12 bg-gradient-to-l from-transparent to-blue-500"></div>
                    </div>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-900 mb-3">
                    Compare Todos os Planos
                  </h2>
                  <p className="text-slate-600 text-lg max-w-2xl mx-auto">
                    Escolha o plano ideal para o seu negócio e aproveite recursos exclusivos
                  </p>
                </div>

                <div className="relative">
                {canGoPrev() && (
                  <button
                    onClick={prevSlide}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-20 w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-full flex items-center justify-center shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-110"
                  >
                    <ChevronLeft className="w-6 h-6 text-white" />
                  </button>
                )}

                {canGoNext() && (
                  <button
                    onClick={nextSlide}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-20 w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-full flex items-center justify-center shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-110"
                  >
                    <ChevronRight className="w-6 h-6 text-white" />
                  </button>
                )}

                  <div className="overflow-hidden" ref={carouselRef}>
                    <div
                      className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 transition-transform duration-500 ease-out"
                      style={{
                        transform: `translateX(-${currentSlide * (100 / getVisibleCards())}%)`
                      }}
                    >
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
                            className={`group relative rounded-3xl overflow-hidden transition-all duration-500 ${
                              isCurrentPlan
                                ? 'ring-2 ring-blue-500 shadow-2xl shadow-blue-500/40 scale-105'
                                : 'hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.02]'
                            }`}
                          >
                            <div className={`absolute inset-0 transition-all duration-500 ${
                              isCurrentPlan
                                ? 'bg-gradient-to-br from-blue-500/15 via-cyan-500/10 to-blue-500/15'
                                : 'bg-gradient-to-br from-slate-50 via-white to-slate-50 group-hover:from-blue-50 group-hover:to-cyan-50'
                            }`}></div>

                            {isCurrentPlan && (
                              <>
                                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500"></div>
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/5 via-transparent to-cyan-400/5 animate-pulse"></div>
                              </>
                            )}

                            <div className="relative backdrop-blur-sm bg-white/95 border-2 border-slate-200/50 rounded-3xl p-8 group-hover:border-blue-300/50 transition-all duration-500">
                              {isCurrentPlan ? (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-6 py-2 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500 text-white text-sm font-black rounded-full shadow-2xl shadow-blue-500/50 flex items-center gap-2 animate-pulse">
                                  <Sparkles className="w-4 h-4" />
                                  Seu Plano Atual
                                  <Sparkles className="w-4 h-4" />
                                </div>
                              ) : (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-slate-700 to-slate-800 text-white text-xs font-bold rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300">
                                  Ver Detalhes
                                </div>
                              )}

                              <h3 className="text-2xl font-black text-slate-900 mb-3">{p.name}</h3>
                              {p.description && (
                                <p className="text-sm text-slate-600 mb-6 line-clamp-3 leading-relaxed">
                                  {p.description}
                                </p>
                              )}

                              <div className="mb-6 pb-6 border-b-2 border-gradient-to-r from-transparent via-slate-300 to-transparent relative">
                                <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <div className="flex items-baseline gap-2 mb-2">
                                  <span className="text-xl font-bold text-slate-500">R$</span>
                                  <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-900">
                                    {p.price.toFixed(2).split('.')[0]}
                                  </span>
                                  <span className="text-2xl font-bold text-slate-500">
                                    ,{p.price.toFixed(2).split('.')[1]}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-slate-400" />
                                  <span className="text-sm text-slate-500 font-semibold">
                                    {p.billing_period === 'monthly' ? 'Pagamento Mensal' : 'Pagamento Anual'}
                                  </span>
                                </div>
                              </div>

                              <div className="space-y-4 mb-8">
                                {planFeatures.map((feature, idx) => {
                                  const Icon = feature.icon;
                                  const isEnabled = feature.enabled !== undefined ? feature.enabled : true;

                                  return (
                                    <div key={idx} className="flex items-center gap-3">
                                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                        isEnabled
                                          ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg'
                                          : 'bg-slate-200 text-slate-400'
                                      }`}>
                                        <Icon className="w-4 h-4" />
                                      </div>
                                      <span className={`text-sm font-medium ${isEnabled ? 'text-slate-900' : 'text-slate-500'}`}>
                                        {feature.value}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>

                              {!isCurrentPlan ? (
                                <button
                                  onClick={handleUpgrade}
                                  className="group/btn relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500 p-[2px] hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-500"
                                >
                                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 opacity-0 group-hover/btn:opacity-100 blur transition-opacity duration-500"></div>
                                  <div className="relative bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500 px-8 py-4 rounded-2xl flex items-center justify-center gap-3 group-hover/btn:gap-4 transition-all duration-300">
                                    <Zap className="w-5 h-5 text-white animate-pulse" />
                                    <span className="font-black text-white text-lg">Escolher Este Plano</span>
                                    <Zap className="w-5 h-5 text-white animate-pulse" />
                                  </div>
                                </button>
                              ) : (
                                <div className="w-full py-4 px-6 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-2xl font-black text-center shadow-lg flex items-center justify-center gap-2">
                                  <Check className="w-5 h-5" strokeWidth={3} />
                                  Plano Ativo
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                  {allPlans.length > getVisibleCards() && (
                    <div className="flex items-center justify-center gap-3 mt-10">
                      <div className="flex items-center gap-2 px-4 py-2 bg-slate-100/80 backdrop-blur-sm rounded-full border border-slate-200/50">
                        {Array.from({ length: Math.ceil(allPlans.length - getVisibleCards() + 1) }).map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentSlide(index)}
                            className={`relative rounded-full transition-all duration-500 ${
                              currentSlide === index
                                ? 'w-10 h-3'
                                : 'w-3 h-3 hover:w-4'
                            }`}
                          >
                            <div className={`absolute inset-0 rounded-full transition-all duration-500 ${
                              currentSlide === index
                                ? 'bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500 shadow-lg shadow-blue-500/50'
                                : 'bg-slate-300 hover:bg-slate-400'
                            }`}></div>
                            {currentSlide === index && (
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full blur animate-pulse"></div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
