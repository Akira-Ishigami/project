import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { CheckCircle2, Clock, AlertCircle, User, Calendar, Phone, FolderOpen } from 'lucide-react';
import Toast from './Toast';

interface TicketContact {
  id: string;
  phone_number: string;
  name: string;
  ticket_status: 'aberto' | 'em_processo' | 'finalizado';
  ticket_opened_at: string;
  ticket_closed_at: string | null;
  ticket_closed_by: string | null;
  department_id: string | null;
  department_name?: string;
  closed_by_name?: string;
}

export default function TicketHistory() {
  const { company, attendant } = useAuth();
  const [tickets, setTickets] = useState<TicketContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'todos' | 'aberto' | 'em_processo' | 'finalizado'>('todos');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    fetchTickets();
  }, [company?.id, attendant?.company_id]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const companyId = company?.id || attendant?.company_id;

      if (!companyId) return;

      const { data, error } = await supabase
        .from('contacts')
        .select(`
          id,
          phone_number,
          name,
          ticket_status,
          ticket_opened_at,
          ticket_closed_at,
          ticket_closed_by,
          department_id,
          departments(name)
        `)
        .eq('company_id', companyId)
        .order('ticket_opened_at', { ascending: false });

      if (error) throw error;

      const ticketsWithNames = await Promise.all(
        (data || []).map(async (ticket) => {
          let closedByName = null;

          if (ticket.ticket_closed_by) {
            const { data: attendantData } = await supabase
              .from('attendants')
              .select('name')
              .eq('user_id', ticket.ticket_closed_by)
              .maybeSingle();

            if (attendantData) {
              closedByName = attendantData.name;
            } else {
              const { data: companyData } = await supabase
                .from('companies')
                .select('name')
                .eq('user_id', ticket.ticket_closed_by)
                .maybeSingle();

              if (companyData) {
                closedByName = companyData.name;
              }
            }
          }

          return {
            ...ticket,
            department_name: ticket.departments?.name,
            closed_by_name: closedByName,
          };
        })
      );

      setTickets(ticketsWithNames as any);
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFinishTicket = async (ticketId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('contacts')
        .update({
          ticket_status: 'finalizado',
          ticket_closed_at: new Date().toISOString(),
          ticket_closed_by: user.id,
        })
        .eq('id', ticketId);

      if (error) throw error;

      setToastMessage('Chamado finalizado com sucesso!');
      setShowToast(true);
      fetchTickets();
    } catch (error) {
      console.error('Erro ao finalizar chamado:', error);
      setToastMessage('Erro ao finalizar chamado');
      setShowToast(true);
    }
  };

  const handleReopenTicket = async (ticketId: string) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .update({
          ticket_status: 'aberto',
          ticket_closed_at: null,
          ticket_closed_by: null,
        })
        .eq('id', ticketId);

      if (error) throw error;

      setToastMessage('Chamado reaberto com sucesso!');
      setShowToast(true);
      fetchTickets();
    } catch (error) {
      console.error('Erro ao reabrir chamado:', error);
      setToastMessage('Erro ao reabrir chamado');
      setShowToast(true);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 13) {
      return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
    }
    return phone;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aberto':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
            <AlertCircle className="w-4 h-4" />
            Aberto
          </span>
        );
      case 'em_processo':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
            <Clock className="w-4 h-4" />
            Em Processo
          </span>
        );
      case 'finalizado':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" />
            Finalizado
          </span>
        );
      default:
        return null;
    }
  };

  const filteredTickets = tickets.filter((ticket) => {
    if (filterStatus === 'todos') return true;
    return ticket.ticket_status === filterStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-slate-600">Carregando histórico...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="animate-fadeIn">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Histórico de Chamados</h1>
          <p className="text-slate-600">Acompanhe o status de todos os atendimentos</p>
        </div>

        <div className="flex gap-3 animate-slideUp">
          <button
            onClick={() => setFilterStatus('todos')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              filterStatus === 'todos'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            Todos ({tickets.length})
          </button>
          <button
            onClick={() => setFilterStatus('aberto')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              filterStatus === 'aberto'
                ? 'bg-red-500 text-white shadow-lg'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            Abertos ({tickets.filter((t) => t.ticket_status === 'aberto').length})
          </button>
          <button
            onClick={() => setFilterStatus('em_processo')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              filterStatus === 'em_processo'
                ? 'bg-yellow-500 text-white shadow-lg'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            Em Processo ({tickets.filter((t) => t.ticket_status === 'em_processo').length})
          </button>
          <button
            onClick={() => setFilterStatus('finalizado')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              filterStatus === 'finalizado'
                ? 'bg-green-500 text-white shadow-lg'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            Finalizados ({tickets.filter((t) => t.ticket_status === 'finalizado').length})
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden animate-slideUp" style={{ animationDelay: '0.1s' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Contato</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Telefone</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Departamento</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Aberto em</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Finalizado em</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Finalizado por</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                      Nenhum chamado encontrado
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {ticket.name ? ticket.name[0].toUpperCase() : <User className="w-5 h-5" />}
                          </div>
                          <span className="font-medium text-slate-900">{ticket.name || 'Sem nome'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Phone className="w-4 h-4" />
                          <span className="font-mono text-sm">{formatPhone(ticket.phone_number)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-700">{ticket.department_name || '-'}</span>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(ticket.ticket_status)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-600 text-sm">
                          <Calendar className="w-4 h-4" />
                          {formatDate(ticket.ticket_opened_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {ticket.ticket_closed_at ? (
                          <div className="flex items-center gap-2 text-slate-600 text-sm">
                            <Calendar className="w-4 h-4" />
                            {formatDate(ticket.ticket_closed_at)}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {ticket.closed_by_name ? (
                          <span className="text-slate-700">{ticket.closed_by_name}</span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {ticket.ticket_status === 'finalizado' ? (
                          <button
                            onClick={() => handleReopenTicket(ticket.id)}
                            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-blue-700 shadow-sm transition-all hover:scale-105 flex items-center gap-2 mx-auto"
                          >
                            <FolderOpen className="w-4 h-4" />
                            Abrir Chamado
                          </button>
                        ) : (
                          <button
                            onClick={() => handleFinishTicket(ticket.id)}
                            className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg text-sm font-medium hover:from-green-600 hover:to-green-700 shadow-sm transition-all hover:scale-105"
                          >
                            Finalizar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showToast && <Toast message={toastMessage} onClose={() => setShowToast(false)} />}
    </div>
  );
}
