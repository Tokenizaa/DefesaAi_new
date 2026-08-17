import { logger } from '../../../server/observability/logger';
import { eventBus, EventTopics } from '../../../core/events/topics';
import { marketingService } from '../../services/marketing-service';


/**
 * Agente de Qualidade - Responsável por revisar e aprovar conteúdo criado
 */
export class QualidadeAgent {
  private id = 'qualidade';
  private lastRun: Date | null = null;
  private isRunning = false;

  async run(): Promise<void> {
    if (this.isRunning) {
      logger.warn('marketing', 'agents', 'run', 'Qualidade agent already running');
      return;
    }

    this.isRunning = true;
    const startTime = new Date();

    try {
      logger.info('marketing', 'agents', 'run', 'Qualidade agent starting cycle');

      // Simulate quality review work
      await this.reviewContentForAccuracy();
      await this.checkLegalCompliance();
      await this.validateBrandGuidelines();

      // Update agent status
      const agents = marketingService.getMarketingAgents();
      const agentIndex = agents.findIndex(a => a.id === this.id);
      if (agentIndex !== -1) {
        const updatedAgent = {
          ...agents[agentIndex],
          lastActivity: 'Agora mesmo',
          tasksCompleted: agents[agentIndex].tasksCompleted + 1,
          currentTask: 'Revisando e aprovando conteúdo jurídico'
        };
        marketingService.updateMarketingAgent(this.id, updatedAgent);
      }

      // Publish event for approved content
      eventBus.publish(EventTopics.MARKETING_QUALITY_APPROVED, {
        agentId: this.id,
        timestamp: new Date().toISOString(),
        contentId: `cnt-${Date.now()}` // simulated
      }, 'marketing_os');

      this.lastRun = new Date();
      logger.info('marketing', 'agents', 'run', 'Qualidade agent cycle completed', {
        durationMs: new Date().getTime() - startTime.getTime()
      });
    } catch (error) {
      logger.error('marketing', 'agents', 'run', 'Qualidade agent cycle failed', { message: String(error) });
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  private async reviewContentForAccuracy(): Promise<void> {
    // Simulate reviewing content for accuracy
    logger.debug('marketing', 'agents', 'run', 'Reviewing content for legal accuracy');
    await new Promise(resolve => setTimeout(resolve, 200)); // Simulate work
  }

  private async checkLegalCompliance(): Promise<void> {
    // Simulate checking legal compliance
    logger.debug('marketing', 'agents', 'run', 'Checking legal compliance of content');
    await new Promise(resolve => setTimeout(resolve, 150)); // Simulate work
  }

  private async validateBrandGuidelines(): Promise<void> {
    // Simulate validating brand guidelines
    logger.debug('marketing', 'agents', 'run', 'Validating content against brand guidelines');
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
export const qualidadeAgent = new QualidadeAgent();
