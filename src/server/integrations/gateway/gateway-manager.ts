/**
 * @file gateway/gateway-manager.ts
 * GatewayManager — Resolvedor central do gateway de pagamento ativo.
 *
 * Responsabilidades:
 * 1. Manter registro de todos os gateways disponíveis (PagBank, GGPIXAPI, etc.)
 * 2. Resolver qual gateway está ativo com base na configuração (env / runtime)
 * 3. Fornecer acesso ao gateway ativo via getActiveGateway()
 * 4. Fornecer acesso a qualquer adapter por ID via getGateway(id)
 * 5. Prover informação para o Admin UI (status de cada gateway)
 *
 * REGRA FUNDAMENTAL:
 * - Trocar o gateway NÃO modifica pagamentos existentes
 * - Cada pagamento registra qual gateway o criou
 * - O GatewayManager NÃO persiste estado — a configuração vive em env/ConfigService
 *
 * FLUXO:
 *   Checkout → GatewayManager.getActiveGateway() → adapter.createPix(...)
 *   Admin UI → GatewayManager.getGatewayStatus() → exibe status dos gateways
 *   Webhook → GatewayManager.resolveByGatewayId(id) → adapter.processWebhook(...)
 */

import { PaymentGateway, GatewayId, GatewayStatus } from './types';
import { pagbankAdapter } from './pagbank-adapter';
import { ggpixAdapter } from './ggpix-adapter';
import { logger } from '../../observability/logger';

// ============================================================================
// Configuração do gateway ativo
// ============================================================================

/**
 * Determina o gateway ativo a partir de variáveis de ambiente.
 *
 * Prioridade:
 * 1. PAYMENT_ACTIVE_GATEWAY (env explicitamente definido)
 * 2. Fallback para 'pagbank' (comportamento atual preservado)
 *
 * O Admin UI pode alterar este valor via /api/admin/settings/payments,
 * mas a configuração efetiva vive no environment ou no ConfigService.
 */
function resolveActiveGatewayId(): GatewayId {
  const envValue = (process.env.PAYMENT_ACTIVE_GATEWAY || '').toLowerCase().trim();
  if (envValue === 'ggpixapi' || envValue === 'ggpix') return 'ggpixapi';
  if (envValue === 'pagbank') return 'pagbank';
  // Fallback: PagBank para manter compatibilidade com deploy atual
  return 'pagbank';
}

// ============================================================================
// Manager
// ============================================================================

export interface GatewayInfo {
  id: GatewayId;
  displayName: string;
  status: GatewayStatus;
  isActive: boolean;
  /** Se o gateway suporta cartão de crédito. */
  supportsCreditCard: boolean;
  /** Razão pela qual não está configurado (se aplicável). */
  notConfiguredReason?: string;
}

export class GatewayManager {
  private gateways: Map<GatewayId, PaymentGateway> = new Map();
  private activeGatewayId: GatewayId;

  constructor() {
    // Registrar todos os gateways conhecidos
    this.gateways.set('pagbank', pagbankAdapter);
    this.gateways.set('ggpixapi', ggpixAdapter);

    // Resolver gateway ativo
    this.activeGatewayId = resolveActiveGatewayId();

    logger.info('payments', 'gateway_manager', 'init', `Gateway manager initialized`, {
      activeGateway: this.activeGatewayId,
      availableGateways: Array.from(this.gateways.keys()),
    });
  }

  /**
   * Retorna o adapter do gateway ativo.
   * Se o gateway configurado não estiver disponível ou configurado,
   * faz fallback para PagBank (preserva comportamento existente).
   */
  getActiveGateway(): PaymentGateway {
    const active = this.gateways.get(this.activeGatewayId);
    if (active && active.isConfigured()) {
      return active;
    }

    // Fallback: tentar PagBank
    const pagbank = this.gateways.get('pagbank');
    if (pagbank && pagbank.isConfigured()) {
      logger.warn('payments', 'gateway_manager', 'get_active',
        `Configured gateway '${this.activeGatewayId}' not available, falling back to PagBank`
      );
      return pagbank;
    }

    // Último recurso: retornar o gateway configurado mesmo não validado
    // (deixa o adapter lançar erro descritivo)
    if (active) return active;

    // Nunca deveria chegar aqui, mas por segurança
    throw new Error('Nenhum gateway de pagamento disponível. Configure PAGBANK_TOKEN ou GGPIX_API_KEY.');
  }

  /**
   * Retorna um adapter específico por ID.
   * Usado pelo webhook handler quando o payload indica o gateway.
   */
  getGateway(id: GatewayId): PaymentGateway | undefined {
    return this.gateways.get(id);
  }

  /**
   * Registra um novo gateway (extensível para futuros gateways).
   */
  registerGateway(gateway: PaymentGateway): void {
    this.gateways.set(gateway.id, gateway);
    logger.info('payments', 'gateway_manager', 'register', `Gateway registered: ${gateway.id}`);
  }

  /**
   * Retorna informações sobre todos os gateways registrados.
   * Usado pelo Admin UI para exibir status e permitir alternância.
   */
  getGatewayStatus(): GatewayInfo[] {
    return Array.from(this.gateways.values()).map(gw => {
      const isConfigured = gw.isConfigured();
      let notConfiguredReason: string | undefined;
      if (!isConfigured) {
        if (gw.id === 'pagbank') {
          notConfiguredReason = 'PAGBANK_TOKEN não configurado';
        } else if (gw.id === 'ggpixapi') {
          notConfiguredReason = 'GGPIX_API_KEY ou GGPIX_ENABLED não configurado';
        }
      }

      return {
        id: gw.id,
        displayName: gw.displayName,
        status: isConfigured ? 'configured' : 'not_configured',
        isActive: gw.id === this.activeGatewayId,
        supportsCreditCard: gw.id === 'pagbank', // Apenas PagBank suporta cartão
        notConfiguredReason,
      };
    });
  }

  /**
   * Retorna o ID do gateway ativo.
   */
  getActiveGatewayId(): GatewayId {
    return this.activeGatewayId;
  }

  /**
   * Altera o gateway ativo (usado pelo Admin UI).
   * NÃO migra pagamentos existentes — apenas afeta novos pagamentos.
   *
   * IMPORTANTE: Em produção, esta alteração deve ser persistida em env
   * ou no ConfigService e refletir em todos os workers/instâncias.
   * Em memória, a alteração é imediata mas não persiste entre reinícios.
   */
  setActiveGateway(id: GatewayId): { success: boolean; message: string } {
    const gateway = this.gateways.get(id);
    if (!gateway) {
      return { success: false, message: `Gateway '${id}' não encontrado.` };
    }

    if (!gateway.isConfigured()) {
      return {
        success: false,
        message: `Gateway '${gateway.displayName}' não está configurado. Configure as credenciais antes de ativá-lo.`,
      };
    }

    const previousId = this.activeGatewayId;
    this.activeGatewayId = id;

    logger.info('payments', 'gateway_manager', 'set_active',
      `Gateway changed: ${previousId} → ${id}`,
      { previousGateway: previousId, newGateway: id }
    );

    return {
      success: true,
      message: `Gateway alterado para '${gateway.displayName}'. Novos pagamentos usarão este gateway.`,
    };
  }

  /**
   * Verifica se um gateway suporta cartão de crédito.
   * Usado pelo Checkout para decidir se exibe a aba Cartão.
   */
  supportsCreditCard(gatewayId?: GatewayId): boolean {
    const id = gatewayId || this.activeGatewayId;
    const gateway = this.gateways.get(id);
    return gateway?.createCreditCard !== undefined;
  }
}

// Singleton — uma única instância por processo
export const gatewayManager = new GatewayManager();
