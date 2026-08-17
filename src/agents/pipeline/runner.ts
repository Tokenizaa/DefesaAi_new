/**
 * Pipeline Runner — módulo não implementado neste repositório.
 * Import pendurado em app.ts que impedia o boot do servidor.
 * Retorna erro honesto (501 equivalente) em vez de fingir sucesso.
 */
export async function runPipeline(_initialContext: unknown): Promise<never> {
  throw new Error('Pipeline de agentes não configurado neste servidor (módulo src/agents/pipeline/runner ausente).');
}