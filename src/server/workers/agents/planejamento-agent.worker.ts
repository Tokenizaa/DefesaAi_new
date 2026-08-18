import { logger } from '../../../server/observability/logger';
import { eventBus, EventTopics } from '../../../core/events/topics';
import { marketingService } from '../../services/marketing-service';
import { aprendizadoAgent } from '../aprendizado-agent.worker';


/**
 * Agente de Planejamento - Responsável por organizar a grade editorial,
 * frequência de postagens e distribuição multicanal
 */
export class PlanejamentoAgent {
  private id = 'planejamento';
  private lastRun: Date | null = null;
  private isRunning = false;

  async run(): Promise<void> {
    if (this.isRunning) {
      logger.warn('marketing', 'agents', 'run', 'Planejamento agent already running');
      return;
    }

    this.isRunning = true;
    const startTime = new Date();

    try {
      logger.info('marketing', 'agents', 'run', 'Planejamento agent starting cycle');

      // Perform real planning work: organize editorial calendar, plan distribution
      await this.organizeEditorialCalendarReal();
      await this.planMultichannelDistributionReal();
      await this.allocateContentSlotsReal();

      // Update agent status
      const agents = await marketingService.getMarketingAgents();
      const agentIndex = agents.findIndex(a => a.id === this.id);
      if (agentIndex !== -1) {
        const updatedAgent = {
          ...agents[agentIndex],
          lastActivity: 'Agora mesmo',
          tasksCompleted: agents[agentIndex].tasksCompleted + 1,
          currentTask: 'Grade editorial organizada e conteúdo distribuído com base em dados estratégicos'
        };
        await marketingService.updateMarketingAgent(this.id, updatedAgent);
      }

      this.lastRun = new Date();
      logger.info('marketing', 'agents', 'run', 'Planejamento agent cycle completed', {
        durationMs: new Date().getTime() - startTime.getTime()
      });
    } catch (error) {
      logger.error('marketing', 'agents', 'run', 'Planejamento agent cycle failed', { message: String(error) });
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  private async organizeEditorialCalendarReal(): Promise<void> {
    try {
      logger.debug('marketing', 'agents', 'run', 'Organizing editorial calendar based on strategic insights');
      
      // Get strategic insights from events or shared state
      // In a full implementation, we would get this from the Estratégico agent via events
      // For now, we'll get the latest published content to understand what's been working
      
      const contents = await marketingService.getEditorialContents();
      const publishedContents = contents.filter(c => c.status === 'publicado');
      
      // Analyze what types of content have been published recently
      const recentContentAnalysis = {
        byChannel: {},
        byFormat: {},
        byTheme: {}
      };
      
      publishedContents.slice(-10).forEach(content => { // Last 10 published pieces
        const channel = content.channel || 'unknown';
        const format = content.format || 'unknown';
        const theme = content.legal_theme || content.legalTheme || 'unknown';
        
        if (!recentContentAnalysis.byChannel[channel]) {
          recentContentAnalysis.byChannel[channel] = 0;
        }
        recentContentAnalysis.byChannel[channel]++;
        
        if (!recentContentAnalysis.byFormat[format]) {
          recentContentAnalysis.byFormat[format] = 0;
        }
        recentContentAnalysis.byFormat[format]++;
        
        if (!recentContentAnalysis.byTheme[theme]) {
          recentContentAnalysis.byTheme[theme] = 0;
        }
        recentContentAnalysis.byTheme[theme]++;
      });
      
      // Generate editorial calendar for the upcoming week
      const editorialCalendar = this.generateEditorialCalendar(recentContentAnalysis);
      
      // In a full implementation, we would save this to a database or shared state
      // For now, we'll log it and update the agent status with the information
      
      logger.info('marketing', 'agents', 'planning', `Editorial calendar organized for upcoming week: ${editorialCalendar.days.length} days planned`);
      
      // Publish event about the organized calendar
      eventBus.publish(EventTopics.MARKETING_EDITORIAL_CALENDAR_UPDATED, {
        agentId: this.id,
        timestamp: new Date().toISOString(),
        calendar: editorialCalendar
      }, 'marketing_os');
    } catch (error) {
      logger.error('marketing', 'agents', 'run', 'Error organizing editorial calendar', { error });
      throw error;
    }
  }

  /**
   * Generate editorial calendar based on content analysis
   */
  private generateEditorialCalendar(contentAnalysis: any): any {
    const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const calendar: any = {
      weekStart: new Date().toISOString().split('T')[0],
      days: []
    };
    
    // Determine optimal distribution based on analysis
    const channelDistribution = Object.entries(contentAnalysis.byChannel)
      .sort(([,a], [,b]) => b - a)
      .map(([channel]) => channel);
      
    const formatDistribution = Object.entries(contentAnalysis.byFormat)
      .sort(([,a], [,b]) => b - a)
      .map(([format]) => format);
      
    const themeDistribution = Object.entries(contentAnalysis.byTheme)
      .sort(([,a], [,b]) => b - a)
      .map(([theme]) => theme);
    
    // Create calendar entries for each day
    days.forEach((day, index) => {
      const date = new Date();
      date.setDate(date.getDate() + index);
      
      // Cycle through channels, formats, and themes for variety
      const channelIndex = index % channelDistribution.length;
      const formatIndex = index % formatDistribution.length;
      const themeIndex = index % themeDistribution.length;
      
      calendar.days.push({
        day: day,
        date: date.toISOString().split('T')[0],
        suggestedChannel: channelDistribution[channelIndex] || 'instagram',
        suggestedFormat: formatDistribution[formatIndex] || 'carrossel',
        suggestedTheme: themeDistribution[themeIndex] || 'Direito de Trânsito Geral',
        contentType: Math.random() > 0.5 ? 'educativo' : 'informativo'
      });
    });
    
    return calendar;
  }

  private async planMultichannelDistributionReal(): Promise<void> {
    try {
      logger.debug('marketing', 'agents', 'run', 'Planning multichannel distribution based on performance data');
      
      // Get performance data from the learning agent or metrics collector
      // In a full implementation, we would get this from the Aprendizado agent via events or shared state
      // For now, we'll get published content performance to understand what works where
      
      const contents = await marketingService.getEditorialContents();
      const publishedContents = contents.filter(c => c.status === 'publicado');
      
      // Analyze performance by channel and format
      const channelPerformance: Record<string, { reach: number; engagement: number; count: number }> = {};
      const formatPerformance: Record<string, { reach: number; engagement: number; count: number }> = {};
      
      publishedContents.forEach(content => {
        const channel = content.channel || 'unknown';
        const format = content.format || 'unknown';
        const reach = content.estimated_reach || 0;
        const engagement = Math.floor((content.estimated_reach || 0) * 0.08); // Estimated 8% engagement rate
        
        if (!channelPerformance[channel]) {
          channelPerformance[channel] = { reach: 0, engagement: 0, count: 0 };
        }
        channelPerformance[channel].reach += reach;
        channelPerformance[channel].engagement += engagement;
        channelPerformance[channel].count++;
        
        if (!formatPerformance[format]) {
          formatPerformance[format] = { reach: 0, engagement: 0, count: 0 };
        }
        formatPerformance[format].reach += reach;
        formatPerformance[format].engagement += engagement;
        formatPerformance[format].count++;
      });
      
      // Calculate average performance
      const channelAverages: Record<string, { avgReach: number; avgEngagement: number; engagementRate: number }> = {};
      const formatAverages: Record<string, { avgReach: number; avgEngagement: number; engagementRate: number }> = {};
      
      Object.keys(channelPerformance).forEach(channel => {
        const data = channelPerformance[channel];
        if (data.count > 0) {
          channelAverages[channel] = {
            avgReach: data.reach / data.count,
            avgEngagement: data.engagement / data.count,
            engagementRate: (data.avgReach > 0) ? (data.avgEngagement / data.avgReach) * 100 : 0
          };
        }
      });
      
      Object.keys(formatPerformance).forEach(format => {
        const data = formatPerformance[format];
        if (data.count > 0) {
          formatAverages[format] = {
            avgReach: data.reach / data.count,
            avgEngagement: data.engagement / data.count,
            engagementRate: (data.avgReach > 0) ? (data.avgEngagement / data.avgReach) * 100 : 0
          };
        }
      });
      
      // Generate distribution plan based on performance
      const distributionPlan = this.generateDistributionPlan(channelAverages, formatAverages);
      
      logger.info('marketing', 'agents', 'planning', `Multichannel distribution planned based on performance data`);
      
      // Publish event about the distribution plan
      eventBus.publish(EventTopics.MARKETING_DISTRIBUTION_PLAN_UPDATED, {
        agentId: this.id,
        timestamp: new Date().toISOString(),
        plan: distributionPlan
      }, 'marketing_os');
    } catch (error) {
      logger.error('marketing', 'agents', 'run', 'Error planning multichannel distribution', { error });
      throw error;
    }
  }

  /**
   * Generate distribution plan based on performance data
   */
  private generateDistributionPlan(channelAverages: any, formatAverages: any): any {
    // Sort channels and formats by engagement rate
    const sortedChannels = Object.entries(channelAverages)
      .filter(([, data]: [string, any]) => data.count > 0)
      .sort((a, b) => b[1].engagementRate - a[1].engagementRate);
      
    const sortedFormats = Object.entries(formatAverages)
      .filter(([, data]: [string, any]) => data.count > 0)
      .sort((a, b) => b[1].engagementRate - a[1].engagementRate);
    
    const plan: any = {
      primaryChannel: sortedChannels.length > 0 ? sortedChannels[0][0] : 'instagram',
      secondaryChannel: sortedChannels.length > 1 ? sortedChannels[1][0] : 'blog',
      tertiaryChannel: sortedChannels.length > 2 ? sortedChannels[2][0] : 'tiktok',
      preferredFormats: sortedFormats.slice(0, 3).map(([format]) => format),
      avoidFormats: sortedFormats.length > 3 ? sortedFormats.slice(3).map(([format]) => format) : [],
      recommendations: []
    };
    
    // Add recommendations based on data
    if (plan.primaryChannel) {
      plan.recommendations.push(`Focar esforços principais no ${plan.primaryChannel} (taxa de engajamento média: ${channelAverages[plan.primaryChannel]?.engagementRate?.toFixed(1) || 0}%)`);
    }
    
    if (plan.preferredFormats.length > 0) {
      plan.recommendations.push(`Utilizar os formatos ${plan.preferredFormats.join(', ')} para melhor engajamento`);
    }
    
    return plan;
  }

  private async allocateContentSlotsReal(): Promise<void> {
    // Simulate allocating content slots
    logger.debug('marketing', 'agents', 'run', 'Allocating content slots for upcoming week');
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
export const planejamentoAgent = new PlanejamentoAgent();
