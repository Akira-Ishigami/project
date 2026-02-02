import { useState } from 'react';
import { useTransferencia } from '../hooks/useTransferencia';

interface BotaoTransferenciaProps {
  numeroContato: number;
  nomeContato: string;
  departamentoAtual: string;
  departamentos: string[];
  apiKey: string;
  onSucesso?: () => void;
}

export function BotaoTransferencia({
  numeroContato,
  nomeContato,
  departamentoAtual,
  departamentos,
  apiKey,
  onSucesso
}: BotaoTransferenciaProps) {
  const [mostraOpcoes, setMostraOpcoes] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const { adicionarTransferencia } = useTransferencia(apiKey);

  const handleTransferir = async (departamentoDestino: string) => {
    // Validações
    if (!apiKey || apiKey.trim() === '') {
      alert('❌ Erro: API Key não foi configurada!');
      console.error('API Key vazia:', apiKey);
      return;
    }

    if (!numeroContato || numeroContato === 0) {
      alert('❌ Erro: Número do contato inválido!');
      return;
    }

    if (!nomeContato || nomeContato.trim() === '') {
      alert('❌ Erro: Nome do contato inválido!');
      return;
    }

    if (!departamentoAtual || departamentoAtual.trim() === '') {
      alert('❌ Erro: Departamento atual não definido!');
      return;
    }

    if (departamentoDestino === departamentoAtual) {
      alert('⚠️ Selecione um departamento diferente!');
      return;
    }

    if (!departamentoDestino || departamentoDestino.trim() === '') {
      alert('❌ Erro: Departamento de destino inválido!');
      return;
    }

    setCarregando(true);

    const dados = {
      api_key: apiKey,
      numero_contato: numeroContato,
      nome_contato: nomeContato,
      departamento_origem: departamentoAtual,
      departamento_destino: departamentoDestino
    };

    console.log('🔄 Enviando transferência:', dados);

    const resultado = await adicionarTransferencia(dados);

    console.log('📨 Resposta:', resultado);

    if (resultado.sucesso) {
      console.log('✅ Sucesso - Dados:', resultado.data);
      setMostraOpcoes(false);
      alert(`✅ Contato #${numeroContato} transferido com sucesso para ${departamentoDestino}!`);
      onSucesso?.();
    } else {
      console.error('❌ Erro completo:', resultado);
      alert(`❌ Erro ao transferir: ${resultado.erro}\n\nAbra o console (F12) para mais detalhes.`);
    }

    setCarregando(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setMostraOpcoes(!mostraOpcoes)}
        disabled={carregando}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
      >
        📤 Transferir
      </button>

      {mostraOpcoes && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-10 min-w-56">
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <p className="text-sm font-semibold text-gray-700">
              Contato: <strong>#{numeroContato}</strong> - {nomeContato}
            </p>
            <p className="text-xs text-gray-600 mt-1">Departamento atual: {departamentoAtual}</p>
          </div>

          <div className="max-h-60 overflow-y-auto">
            {departamentos.length === 0 ? (
              <div className="px-4 py-3 text-xs text-gray-500">Nenhum departamento disponível</div>
            ) : (
              departamentos
                .filter((d) => d !== departamentoAtual)
                .map((dept) => (
                  <button
                    key={dept}
                    onClick={() => handleTransferir(dept)}
                    disabled={carregando}
                    className="w-full text-left px-4 py-2 hover:bg-blue-50 transition text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    → {dept}
                  </button>
                ))
            )}
          </div>

          <button
            onClick={() => setMostraOpcoes(false)}
            className="w-full px-4 py-2 border-t border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}

export default BotaoTransferencia;
