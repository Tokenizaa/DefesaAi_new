import React from 'react';
import { Bot, CheckCircle2 } from 'lucide-react';
import { MarketingAgentState } from '../../../types';
import { ExceptionAlert } from './ExceptionAlert';
import { MarketingOverallMetrics, PublisherQueueItem } from '../hooks/use-marketing-service';

export const MarketingDashboard: React.FC<{
  agents: MarketingAgentState[];
  metrics: MarketingOverallMetrics | null;
  cycleCount: number;
  lastCycleAt: string | null;
  publisherQueue: PublisherQueueItem[];
  scheduledPosts: number;
  metaConnected: boolean;
  onVerifyChannel: () => void;
}> = ({ agents, metrics, cycleCount, lastCycleAt, publisherQueue, scheduledPosts, metaConnected, onVerifyChannel }) => {
  const activeAgents = agents.filter((a) => a.status === 'running').length;
  const inAlert = agents.filter((a) => a.status === 'alert').length;

  return (
    <div className="space-y-4">
      {/* Supervisão: estado real do organismo */}
      <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono">
        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {activeAgents}/{agents.length} agentes ativos
        </span>
        <span className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
          Ciclos: {cycleCount}
        </span>
        {lastCycleAt && (
          <span className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-500">
            Último ciclo: {new Date(lastCycleAt).toLocaleString('pt-BR')}
          </span>
        )}
        {inAlert > 0 ? (
          <span className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700">⚠ {inAlert} em alerta</span>
        ) : (
          <span className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-400">Sem alertas</span>
        )}
      </div>

      {/* Exceções — só aparecem quando existem (4.8) */}
      <ExceptionAlert
        agents={agents}
        publisherQueue={publisherQueue}
        metrics={metrics}
        scheduledPosts={scheduledPosts}
        metaConnected={metaConnected}
        onRetry={onVerifyChannel}
      />

      {/* KPIs resumidos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-white">
          <span className="text-slate-400 text-[11px] font-medium block">Alcance Mensal</span>
          <span className="text-xl font-black font-mono mt-1 block">
            {metrics ? (metrics.monthlyReach / 1000).toFixed(1) + 'k' : '—'}
          </span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-white">
          <span className="text-slate-400 text-[11px] font-medium block">Novos Casos</span>
          <span className="text-xl font-black font-mono mt-1 block">{metrics?.newCasesGenerated ?? '—'}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-white">
          <span className="text-slate-400 text-[11px] font-medium block">Conversão</span>
          <span className="text-xl font-black font-mono mt-1 block">
            {metrics ? metrics.conversionRate.toFixed(1) + '%' : '—'}
          </span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-white">
          <span className="text-slate-400 text-[11px] font-medium block">Publicados</span>
          <span className="text-xl font-black font-mono mt-1 block">
            {metrics?.publishedPosts ?? '—'}
            <span className="text-xs text-slate-400"> / {metrics?.scheduledPosts ?? 0} agendados</span>
          </span>
        </div>
      </div>

      <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
        <Bot className="w-3 h-3" />
        Organismo autônomo — nenhuma intervenção manual necessária. Exceções reais aparecem acima.
      </p>
    </div>
  );
};