import { logger } from '../observability/logger';
import { INITIAL_MARKETING_AGENTS, INITIAL_EDITORIAL_CONTENTS, BRAND_IDENTITY } from '../../data/marketing-agents-data';
import { eventBus, EventTopics } from '../../core/events/topics';


/**
 * Service to manage marketing OS state - moved from global scope in server.ts
 */
export class MarketingService {
  private marketingAgents: any[];
  private editorialContents: any[];
  private cycleCount = 0;
  private contentVersions: Record<string, any[]> = {};

  constructor() {
    this.marketingAgents = [...INITIAL_MARKETING_AGENTS];
    this.editorialContents = [...INITIAL_EDITORIAL_CONTENTS];
  }

  // Getters
  getMarketingAgents() {
    return [...this.marketingAgents]; // Return copy to prevent direct mutation
  }

  getEditorialContents() {
    return [...this.editorialContents]; // Return copy to prevent direct mutation
  }

  getBrandIdentity() {
    return BRAND_IDENTITY;
  }

  getCycleCount() {
    return this.cycleCount;
  }

  incrementCycleCount() {
    this.cycleCount += 1;
  }

  // Marketing cycle tick
  cycleTick() {
    const randomAgentIdx = Math.floor(Math.random() * this.marketingAgents.length);
    this.marketingAgents[randomAgentIdx].tasksCompleted += 1;
    this.marketingAgents[randomAgentIdx].lastActivity = 'Agora mesmo';

    eventBus.publish(EventTopics.MARKETING_CYCLE_TICK, {
      agentId: this.marketingAgents[randomAgentIdx].id,
      task: this.marketingAgents[randomAgentIdx].currentTask,
    }, 'marketing_os');

    return {
      success: true,
      updatedAgent: this.marketingAgents[randomAgentIdx],
      agents: this.getMarketingAgents(),
    };
  }

  // Generate marketing content
  generateContent(theme: string, channel: string, format: string) {
    const newContent = {
      id: `cnt-${Date.now()}`,
      title: theme || 'Multas de Trânsito: Novos Prazos e Resoluções CONTRAN 2026',
      channel: channel || 'instagram',
      format: format || 'carrossel',
      legalTheme: theme || 'Prazos de Notificação e Ampla Defesa no CTB',
      status: 'aprovado_qualidade' as const,
      scheduledDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString().replace('T', ' ').substring(0, 16),
      estimatedReach: Math.floor(15000 + Math.random() * 25000),
      copyText: `🚦 MOTORISTA: Entenda os seus direitos garantidos pelo CTB!
      
O prazo máximo para expedição da notificação é de 30 dias. Qualquer atraso invalida o auto de infração!`,
      hashtags: ['#AdeusMulta', '#DireitoDeTransito', '#CTB', '#RecursoDeMulta'],
      visualPrompt: 'Visual elegante com paleta azul escuro e amarelo institucional.',
      authorAgent: '@marketing-criador',
      qualityReviewScore: 9.7,
    };

    this.editorialContents.unshift(newContent);

    eventBus.publish(EventTopics.MARKETING_CONTENT_DRAFTED, { contentId: newContent.id }, 'marketing_os');

    return { success: true, content: newContent };
  }

  // Update marketing agent (for external updates)
  updateMarketingAgent(agentId: string, updates: Partial<any>) {
    const agentIndex = this.marketingAgents.findIndex(agent => agent.id === agentId);
    if (agentIndex !== -1) {
      this.marketingAgents[agentIndex] = { ...this.marketingAgents[agentIndex], ...updates };
      return this.marketingAgents[agentIndex];
    }
    return null;
  }

  // Insere conteúdo no topo (duplicação/variação)
  // Histórico de versões (agent: humano | copywriting | seo | compliance)
  getContentVersions(contentId: string) {
    return [...(this.contentVersions[contentId] ?? [])];
  }

  addContentVersion(contentId: string, entry: { agent: string; author: string; changes: string }) {
    if (!this.contentVersions[contentId]) this.contentVersions[contentId] = [];
    const rec = {
      id: `ver_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      version: this.contentVersions[contentId].length + 1,
      ...entry,
      createdAt: new Date().toISOString(),
    };
    this.contentVersions[contentId].unshift(rec);
    return rec;
  }

  // Atualiza conteúdo (usado pelos agentes por status: aprovado_qualidade -> agendado -> publicado)
  updateContent(contentId: string, updates: Partial<any>) {
    const idx = this.editorialContents.findIndex(c => c.id === contentId);
    if (idx !== -1) {
      this.editorialContents[idx] = { ...this.editorialContents[idx], ...updates };
      return this.editorialContents[idx];
    }
    return null;
  }
}

// Export singleton instance
export const marketingService = new MarketingService();