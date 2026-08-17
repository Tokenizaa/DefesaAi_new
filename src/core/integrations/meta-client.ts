import { MetaAccountState, MetaPublishRequest, MetaPublishResult } from '../../types';

export async function getMetaStatus(): Promise<MetaAccountState> {
  const res = await fetch('/api/integrations/meta/status');
  if (!res.ok) {
    throw new Error('Falha ao obter status da integração Meta');
  }
  return res.json();
}

export async function getMetaAuthUrl(redirectUri?: string): Promise<{ authUrl: string }> {
  const url = redirectUri
    ? `/api/integrations/meta/auth-url?redirectUri=${encodeURIComponent(redirectUri)}`
    : '/api/integrations/meta/auth-url';
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Falha ao obter URL de login Meta');
  }
  return res.json();
}

export async function connectMetaWithToken(
  accessToken: string,
  pageId?: string,
  instagramAccountId?: string
): Promise<{ success: boolean; connection: MetaAccountState }> {
  const res = await fetch('/api/integrations/meta/connect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessToken, pageId, instagramAccountId }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Falha ao conectar token Meta');
  }
  return res.json();
}

export async function disconnectMeta(): Promise<{ success: boolean }> {
  const res = await fetch('/api/integrations/meta/disconnect', { method: 'POST' });
  if (!res.ok) {
    throw new Error('Falha ao desconectar conta Meta');
  }
  return res.json();
}

export async function publishToMeta(params: MetaPublishRequest): Promise<MetaPublishResult> {
  const res = await fetch('/api/integrations/meta/publish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Falha na publicação Meta');
  }
  return res.json();
}
