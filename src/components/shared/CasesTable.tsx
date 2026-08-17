import React, { useState } from 'react';
import {
  FileText,
  PlusCircle,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Car,
  Calendar,
  Filter,
  Check,
  DollarSign,
  Eye,
  Terminal,
  RefreshCw,
  ExternalLink,
  Zap,
} from 'lucide-react';
import { CaseDomain } from '../../types';

interface CasesTableProps {
  cases: CaseDomain[];
  onSelectCase: (caseItem: CaseDomain) => void;
  onNewCase?: () => void;
  onRefreshCases?: () => void;
  showNewCaseButton?: boolean;
  showFilters?: boolean;
  showStats?: boolean;
  variant?: 'user' | 'admin';
  simulatePayment?: (caseId: string) => Promise<void>;
  
  // Controlled props for search and filters
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  statusFilter?: 'ALL' | 'PAID' | 'READY' | 'ANALYZED';
  onStatusFilterChange?: (filter: 'ALL' | 'PAID' | 'READY' | 'ANALYZED') => void;
}

interface Stats {
  totalFinesSaved: number;
  totalPointsAtRisk: number;
}

export const CasesTable: React.FC<CasesTableProps> = ({
  cases,
  onSelectCase,
  onNewCase,
  onRefreshCases,
  showNewCaseButton = true,
  showFilters = true,
  showStats = true,
  variant = 'user',
  simulatePayment,
  
  // Controlled props
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}) => {
  // Use controlled values if provided, otherwise use local state
  const [internalSearchTerm, setInternalSearchTerm] = useState(searchTerm ?? '');
  const [internalStatusFilter, setInternalStatusFilter] = useState<'ALL' | 'PAID' | 'READY' | 'ANALYZED'>(statusFilter ?? 'ALL');
  
  const effectiveSearchTerm = searchTerm ?? internalSearchTerm;
  const effectiveStatusFilter = statusFilter ?? internalStatusFilter;
  
  // Handle search change - update internal state or call back to parent
  const handleSearchChange = (term: string) => {
    if (!onSearchChange) {
      setInternalSearchTerm(term);
    }
    onSearchChange?.(term);
  };
  
  // Handle status filter change - update internal state or call back to parent
  const handleStatusFilterChange = (filter: 'ALL' | 'PAID' | 'READY' | 'ANALYZED') => {
    if (!onStatusFilterChange) {
      setInternalStatusFilter(filter);
    }
    onStatusFilterChange?.(filter);
  };

  // Calculate stats
  const stats: Stats = cases.reduce(
    (acc, c) => ({
      totalFinesSaved: acc.totalFinesSaved + (c.infraction?.fineAmount || 0),
      totalPointsAtRisk: acc.totalPointsAtRisk + (c.infraction?.points || 0),
    }),
    { totalFinesSaved: 0, totalPointsAtRisk: 0 }
  );

  // Filter cases based on variant and filters
  const filteredCases = cases.filter((c) => {
    // Text search
    const matchesSearch =
      c.title?.toLowerCase().includes(effectiveSearchTerm.toLowerCase()) ||
      c.vehicle?.plate?.toLowerCase().includes(effectiveSearchTerm.toLowerCase()) ||
      c.infraction?.aitNumber?.toLowerCase().includes(effectiveSearchTerm.toLowerCase()) ||
      c.clientName?.toLowerCase().includes(effectiveSearchTerm.toLowerCase()) ||
      c.id?.toLowerCase().includes(effectiveSearchTerm.toLowerCase()) ||
      c.infraction?.plate?.toLowerCase().includes(effectiveSearchTerm.toLowerCase()) ||
      c.infraction?.description?.toLowerCase().includes(effectiveSearchTerm.toLowerCase()) ||
      c.infraction?.organ?.toLowerCase().includes(effectiveSearchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // Status filter (for admin variant)
    if (variant === 'admin') {
      if (effectiveStatusFilter === 'PAID') return c.payment?.status === 'paid';
      if (effectiveStatusFilter === 'READY') return c.status === 'defense_ready';
      if (effectiveStatusFilter === 'ANALYZED') return c.status === 'analyzed';
      // 'ALL' returns true
    }

    return true;
  });

  const handleSimulatePayment = async (caseId: string) => {
    if (simulatePayment) {
      try {
        await simulatePayment(caseId);
        if (onRefreshCases) onRefreshCases();
      } catch (err) {
        console.error('Error simulating payment:', err);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {variant === 'user' ? (
            <>
              <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wider font-mono">
                Painel de Controle • Gestão de Recursos
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
                Processos & Defesas Administrativas
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Gerencie todas as defesas administrativas, prazos fatais e protocolos perante os órgãos autuadores.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-white font-mono">Gestão Operacional de Casos</h2>
              <p className="text-xs text-slate-400">
                Controle de diagnósticos, status de pagamento e geração de defesas do CTB.
              </p>
            </>
          )}
        </div>

        {showFilters && variant === 'admin' ? (
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg">
              Total: <strong className="text-white">{filteredCases.length}</strong> casos
            </span>
          </div>
        ) : null}

        <div className="flex items-center gap-2">
          {showNewCaseButton && onNewCase && (
            <button
              id="new-analysis-button-list"
              onClick={onNewCase}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs shadow-orange-200 transition-all uppercase tracking-tight"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Nova Análise Gratuita</span>
            </button>
          )}

          {showFilters && variant === 'admin' && (
            <div className="flex flex-col sm:flex-row gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por placa, AIT, órgão ou descrição..."
                  value={effectiveSearchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-orange-500 font-mono"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={effectiveStatusFilter}
                  onChange={(e) => handleStatusFilterChange(e.target.value as 'ALL' | 'PAID' | 'READY' | 'ANALYZED')}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-2 text-xs text-slate-300 outline-none focus:border-orange-500 font-mono"
                >
                  <option value="ALL">Todos os Status</option>
                  <option value="ANALYZED">Análise Concluída</option>
                  <option value="PAID">Pagos (Aguardando Minuta)</option>
                  <option value="READY">Defesas Prontas</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Section (User only) */}
      {showStats && variant === 'user' ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 font-mono">Processos Monitorados</p>
            <div className="text-2xl font-extrabold text-slate-900 font-mono">{cases.length}</div>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-semibold font-mono">
              100% monitorados com IA
            </span>
          </div>

          <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 font-mono">Pontos na CNH em Defesa</p>
            <div className="text-2xl font-extrabold text-amber-600 font-mono">{stats.totalPointsAtRisk} pts</div>
            <span className="text-[10px] text-slate-500 font-mono">Sob efeito suspensivo</span>
          </div>

          <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 font-mono">Economia Potencial</p>
            <div className="text-2xl font-extrabold text-emerald-700 font-mono">
              R$ {stats.totalFinesSaved.toFixed(2)}
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Valores em contestação</span>
          </div>
        </div>
      ) : null}

      {/* Search Input (User only when filters not shown) */}
      {!showFilters && variant === 'user' ? (
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por placa, número do auto (AIT) ou nome do motorista..."
            value={effectiveSearchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-orange-500 outline-none shadow-2xs font-medium"
          />
        </div>
      ) : null}

      {/* Cases List */}
      <div className="space-y-2.5">
        {filteredCases.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-2">
              {variant === 'user' ? <FileText className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5 text-orange-400" />}
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              {variant === 'user' ? 'Nenhum processo encontrado' : 'Nenhum caso encontrado para os filtros selecionados.'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {variant === 'user'
                ? 'Inicie uma nova análise enviando a foto ou PDF da notificação de autuação.'
                : 'Ajuste os filtros de busca ou simule um pagamento para ver casos.'}
            </p>
            {showNewCaseButton && onNewCase && (
              <button
                onClick={onNewCase}
                className="mt-3 px-4 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-bold hover:bg-orange-600 transition-colors shadow-xs shadow-orange-200"
              >
                {variant === 'user' ? 'Começar Agora' : 'Nova Análise'}
              </button>
            )}
          </div>
        ) : (
          variant === 'user' ? (
            <div className="space-y-2.5">
              {filteredCases.map((c) => (
                <div
                  key={c.id}
                  onClick={() => onSelectCase(c)}
                  className="bg-white border border-slate-200 hover:border-orange-500 rounded-xl p-4 shadow-2xs transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-orange-500 transition-colors">
                      <Car className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-xs group-hover:text-orange-600 transition-colors">
                          {c.title}
                        </h3>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase font-mono">
                          Estágio {c.currentStage}/5
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Placa: <span className="font-mono font-bold text-slate-900">{c.vehicle?.plate}</span> • {c.infraction?.autuadorBody}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Prazo fatal: {c.infraction?.defenseDeadline || 'Em análise'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      <span className="text-xs font-mono font-bold text-slate-900 block">
                        R$ {c.infraction?.fineAmount?.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-rose-600 font-bold block">
                        {c.infraction?.points} pontos na CNH
                      </span>
                    </div>

                    <div className="p-1.5 rounded-md bg-slate-50 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800 font-mono text-[10px] uppercase">
                    <tr>
                      <th className="py-3 px-4">Auto / AIT</th>
                      <th className="py-3 px-4">Placa</th>
                      <th className="py-3 px-4">Infração</th>
                      <th className="py-3 px-4">Órgão</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Pagamento</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 font-mono text-[11px] text-slate-300">
                    {filteredCases.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3 px-4 font-bold text-white">
                          {c.infraction.aitNumber || c.id}
                        </td>
                        <td className="py-3 px-4 text-orange-300 font-bold">
                          {c.infraction.plate || 'N/I'}
                        </td>
                        <td className="py-3 px-4 truncate max-w-xs font-sans">
                          {c.infraction.description || 'Infração de trânsito'}
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {c.infraction.organ || 'DETRAN'}
                        </td>
                        <td className="py-3 px-4">
                          {c.payment?.status === 'paid' ? (
                            <span className="text-emerald-400 flex items-center gap-1 font-bold text-[10px]">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Pago (R$ 89,90)
                            </span>
                          ) : (
                            <button
                              onClick={() => handleSimulatePayment(c.id)}
                              className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-orange-400 rounded text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <DollarSign className="w-3 h-3" /> Simular PIX
                            </button>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              onSelectCase(c);
                            }}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-orange-400 rounded-lg text-xs font-sans font-bold transition-colors cursor-pointer border border-slate-800 inline-flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" /> Inspecionar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};