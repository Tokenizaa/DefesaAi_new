import { logger } from '../../../server/observability/logger';
import { eventBus, EventTopics } from '../../../core/events/topics';
import { marketingService } from '../../services/marketing-service';


/**
 * Agente Criador - Responsável por criar conteúdo jurídico baseado em temas estratégicos
 */
export class CriadorAgent {
  private id = 'criador';
  private lastRun: Date | null = null;
  private isRunning = false;

  async run(): Promise<void> {
    if (this.isRunning) {
      logger.warn('marketing', 'agents', 'run', 'Criador agent already running');
      return;
    }

    this.isRunning = true;
    const startTime = new Date();

    try {
      logger.info('marketing', 'agents', 'run', 'Criador agent starting cycle');

      // Simulate content creation work
      await this.researchLegalTopic();
      await this.createContentDraft();
      await this.optimizeForPlatform();

      // Geração autônoma real: cria pauta apenas se houver menos de 2 rascunhos pendentes
      const pending = marketingService.getEditorialContents().filter(
        (c) => c.status === 'rascunho' || c.status === 'aprovado_qualidade'
      ).length;
      if (pending < 2) {
        const themes = [
          'Prazos de Notificação e Ampla Defesa no CTB',
          'Radares Portáteis: Falta de Estudo Técnico do Órgão',
          'Notificação Vencida Invalida o Auto de Infração',
          'Direito de Recurso à JARI e suas Garantias',
        ];
        const theme = themes[Math.floor(Math.random() * themes.length)];
        const result = marketingService.generateContent(theme, 'instagram', 'carrossel');
        if (result.success) {
          eventBus.publish(EventTopics.MARKETING_CONTENT_DRAFTED, { contentId: result.content.id }, 'marketing_os');
          logger.info('marketing', 'agents', 'generate', `Pauta gerada: ${result.content.id}`);
        }
      }

      // Update agent status
      const agents = marketingService.getMarketingAgents();
      const agentIndex = agents.findIndex(a => a.id === this.id);
      if (agentIndex !== -1) {
        const updatedAgent = {
          ...agents[agentIndex],
          lastActivity: 'Agora mesmo',
          tasksCompleted: agents[agentIndex].tasksCompleted + 1,
          currentTask: 'Criando conteúdo jurídico para redes sociais'
        };
        marketingService.updateMarketingAgent(this.id, updatedAgent);
      }

      this.lastRun = new Date();
      logger.info('marketing', 'agents', 'run', 'Criador agent cycle completed', {
        durationMs: new Date().getTime() - startTime.getTime()
      });
    } catch (error) {
      logger.error('marketing', 'agents', 'run', 'Criador agent cycle failed', { message: String(error) });
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  private async researchLegalTopic(): Promise<void> {
    // Simulate researching legal topic
    logger.debug('marketing', 'agents', 'run', 'Researching legal topic for content creation');
    await new Promise(resolve => setTimeout(resolve, 200)); // Simulate work
  }

  private async createContentDraft(): Promise<void> {
    // Simulate creating content draft
    logger.debug('marketing', 'agents', 'run', 'Creating content draft');
    await new Promise(resolve => setTimeout(resolve, 200)); // Simulate work
  }

  private async optimizeForPlatform(): Promise<void> {
    // Simulate optimizing for platform
    logger.debug('marketing', 'agents', 'run', 'Optimizing content for target platform');
    await new Promise(resolve => setTimeout(resolve, 150)); // Simulate work
  }

  getStatus() {
    return {
      id: this.id,
      isRunning: this.isRunning,
      lastRun: this.lastRun
    };
  }
}

// Export singleton instance
export const criadorAgent = new CriadorAgent();
