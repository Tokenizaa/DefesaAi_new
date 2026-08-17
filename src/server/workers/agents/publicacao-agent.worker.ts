import { logger } from '../../../server/observability/logger';
import { eventBus, EventTopics } from '../../../core/events/topics';
import { marketingService } from '../../services/marketing-service';
import { metaPublisher } from '../meta-publisher.worker';


/**
 * Agente de Publicação - Responsável por publicar conteúdo nas plataformas
 */
export class PublicacaoAgent {
  private id = 'publicacao';
  private lastRun: Date | null = null;
  private isRunning = false;

  async run(): Promise<void> {
    if (this.isRunning) {
      logger.warn('marketing', 'agents', 'run', 'Publicação agent already running');
      return;
    }

    this.isRunning = true;
    const startTime = new Date();

    try {
      logger.info('marketing', 'agents', 'run', 'Publicação agent starting cycle');

      // Simulate publishing work
      await this.scheduleContentForPublishing();

      // Avança o pipeline real: aprovado_qualidade -> agendado -> publicado (fila Meta)
      const next = marketingService.getEditorialContents().find((c) => c.status === 'aprovado_qualidade');
      if (next) {
        marketingService.updateContent(next.id, { status: 'agendado' });
        metaPublisher.enqueue({
          destination: 'both',
          message: `${next.copyText}\n\n${next.hashtags.join(' ')}`,
          linkUrl: 'https://defesai.com.br',
        }, next.id);
        eventBus.publish(EventTopics.MARKETING_CONTENT_PUBLISHED, { contentId: next.id }, 'marketing_os');
        logger.info('marketing', 'agents', 'publish', `Conteúdo ${next.id} agendado e enfileirado na Meta`);
      }

      await this.publishToPlatforms();
      await this.trackPublicationPerformance();

      // Update agent status
      const agents = marketingService.getMarketingAgents();
      const agentIndex = agents.findIndex(a => a.id === this.id);
      if (agentIndex !== -1) {
        const updatedAgent = {
          ...agents[agentIndex],
          lastActivity: 'Agora mesmo',
          tasksCompleted: agents[agentIndex].tasksCompleted + 1,
          currentTask: 'Publicando e monitorando conteúdo nas plataformas'
        };
        marketingService.updateMarketingAgent(this.id, updatedAgent);
      }

      // Publish event for published content
      eventBus.publish(EventTopics.MARKETING_CONTENT_PUBLISHED, {
        agentId: this.id,
        timestamp: new Date().toISOString(),
        platform: 'instagram' // simulated
      }, 'marketing_os');

      this.lastRun = new Date();
      logger.info('marketing', 'agents', 'run', 'Publicação agent cycle completed', {
        durationMs: new Date().getTime() - startTime.getTime()
      });
    } catch (error) {
      logger.error('marketing', 'agents', 'run', 'Publicação agent cycle failed', { message: String(error) });
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  private async scheduleContentForPublishing(): Promise<void> {
    // Simulate scheduling content for publishing
    logger.debug('marketing', 'agents', 'run', 'Scheduling content for optimal publishing times');
    await new Promise(resolve => setTimeout(resolve, 150)); // Simulate work
  }

  private async publishToPlatforms(): Promise<void> {
    // Simulate publishing to platforms
    logger.debug('marketing', 'agents', 'run', 'Publishing content to Instagram, Facebook, etc.');
    await new Promise(resolve => setTimeout(resolve, 200)); // Simulate work
  }

  private async trackPublicationPerformance(): Promise<void> {
    // Simulate tracking publication performance
    logger.debug('marketing', 'agents', 'run', 'Tracking performance of published content');
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
export const publicacaoAgent = new PublicacaoAgent();
