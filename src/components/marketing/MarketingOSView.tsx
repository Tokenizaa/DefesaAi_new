import React, { useState } from 'react';
import {
  Bot, LayoutDashboard, Target, FileText, CalendarClock, Radio,
  Zap, BarChart3, Settings,
} from 'lucide-react';
import { useMarketingService } from './hooks/use-marketing-service';
import { MarketingDashboard } from './components/MarketingDashboard';
import { ContentKanban } from './components/ContentKanban';
import { PublicationsView } from './components/PublicationsView';
import { ContentEditor } from './components/ContentEditor';
import { ScheduleView } from './components/ScheduleView';
import { ChannelsView } from './components/ChannelsView';
import { AutomationsView } from './components/AutomationsView';
import { ResultsView } from './components/ResultsView';
import { MarketingSettings } from './components/MarketingSettings';

type ViewKey =
  | 'dashboard'
  | 'planning'
  | 'contents'
  | 'schedule'
  | 'channels'
  | 'automations'
  | 'results'
  | 'settings';

/**
 * Marketing OS — navegação por tabs (modelo v1: menu, sem sidebar lateral).
 * Conteúdos com biblioteca robusta (tabs/filtros/lista-cards/Menu IA real).
 */
export const MarketingOSView: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewKey>('dashboard');
  const {
    agents,
    contents,
    metaState,
    brandIdentity,
    updateContentFields,
    fetchContentVersions,
    cycleCount,
    lastCycleAt,
    metrics,
    publisherQueue,
    publisherJobs,
    isLoadingContents,
    isLoadingMeta,
updateContentStatus,
    showMetaConnectModal,
    setShowMetaConnectModal,
    manualToken,
    setManualToken,
    connectMeta,
    disconnectMeta,
  } = useMarketingService();

  const scheduledPosts = metrics?.scheduledPosts ?? 0;
  const [editingContent, setEditingContent] = useState<{ item: typeof contents[number] | null; open: boolean }>({ item: null, open: false });
  const metaConnected = metaState?.isConnected ?? false;

  const NAV: { key: ViewKey; label: string; icon: React.ElementType }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'planning', label: 'Planejamento', icon: Target },
    { key: 'contents', label: 'Conteúdos', icon: FileText },
    { key: 'schedule', label: 'Agendamento', icon: CalendarClock },
    { key: 'automations', label: 'Automações', icon: Zap },
    { key: 'channels', label: 'Canais', icon: Radio },
    { key: 'results', label: 'Resultados', icon: BarChart3 },
    { key: 'settings', label: 'Configurações', icon: Settings },
  ];

  const renderConnectModal = () =>
    showMetaConnectModal && (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-xl border border-slate-200 text-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-0.5">Conectar Meta (Facebook & Instagram)</h3>
          <p className="text-slate-500 mb-3 text-[11px]">
            Insira o token de acesso da página ou conta comercial da Meta Graph API.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              connectMeta(manualToken);
            }}
            className="space-y-3"
          >
            <div>
              <label className="font-bold text-slate-700 uppercase block text-[10px] font-mono">Page / System User Access Token</label>
              <input
                type="password"
                required
                placeholder="EAAB..."
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowMetaConnectModal(false)}
                className="px-3 py-1.5 text-slate-600 hover:text-slate-900 font-semibold"
              >
                Cancelar
              </button>
              <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700">
                Salvar Conexão
              </button>
            </div>
          </form>
        </div>
      </div>
    );

  const renderContents = () => (
    <PublicationsView
      contents={contents}
      loading={isLoadingContents}
      onSelect={(item) => setEditingContent({ item, open: true })}
    />
  );

  return (
    <>
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 space-y-5">
        <div>
          <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wider font-mono flex items-center gap-1">
            <Bot className="w-3.5 h-3.5 text-orange-500" />
            Organismo Autônomo • 7 Agentes de Aquisição
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">Marketing OS</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Ciclo autônomo, biblioteca de conteúdos e automações — modelo v1 (DefesAi).
          </p>
        </div>

        {/* Navegação */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-1.5 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1 min-w-max">
            {NAV.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                id={`marketing-tab-${key}`}
                onClick={() => setActiveView(key)}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 font-mono ${
                  activeView === key
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Conteúdo */}
        {activeView === 'dashboard' && (
          <MarketingDashboard
            agents={agents}
            metrics={metrics}
            cycleCount={cycleCount}
            lastCycleAt={lastCycleAt}
            publisherQueue={publisherQueue}
            scheduledPosts={scheduledPosts}
            metaConnected={metaConnected}
            onVerifyChannel={() => setShowMetaConnectModal(true)}
          />
        )}
        {activeView === 'planning' && (
          <ContentKanban contents={contents} onMove={(id, status) => updateContentStatus(id, status)} />
        )}
        {activeView === 'contents' && renderContents()}
        {activeView === 'schedule' && (
          <ScheduleView
            contents={contents}
            publisherQueue={publisherQueue}
            cycleCount={cycleCount}
            lastCycleAt={lastCycleAt}
          />
        )}
        {activeView === 'automations' && (
          <AutomationsView
            publisherQueue={publisherQueue}
            publisherJobs={publisherJobs}
            contents={contents}
            metrics={metrics}
            metaState={metaState}
            cycleCount={cycleCount}
          />
        )}
        {activeView === 'channels' && (
          <ChannelsView
            metaState={metaState}
            loading={isLoadingMeta}
            onConnect={() => setShowMetaConnectModal(true)}
            onDisconnect={disconnectMeta}
          />
        )}
        {activeView === 'results' && <ResultsView metrics={metrics} loading={isLoadingContents} />}
        {activeView === 'settings' && <MarketingSettings brand={brandIdentity} />}
      </div>

      {renderConnectModal()}

      {editingContent.open && (
        <ContentEditor
          content={editingContent.item}
          brand={brandIdentity}
          onClose={() => setEditingContent({ item: null, open: false })}
          onSave={updateContentFields}
          onStatus={updateContentStatus}
          onChannel={(id, ch) => updateContentFields(id, { channel: ch })}
          onFetchVersions={fetchContentVersions}
          contents={contents}
        />
      )}
    </>
  );
};