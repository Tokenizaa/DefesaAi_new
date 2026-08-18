import { Router } from 'express';
import { metaIntegration } from '../../integrations/meta';
import { eventBus, EventTopics } from '../../core/events/topics';

const router = Router();

// Official Meta Graph API Integration (Facebook & Instagram)
// Using canonical implementation

router.get('/integrations/meta/status', (req, res) => {
  const status = metaIntegration.getConnectionState();
  res.json(status);
});

router.get('/integrations/meta/auth-url', (req, res) => {
  const redirectUri = (req.query.redirectUri as string) || `${req.protocol}://${req.get('host')}/api/integrations/meta/callback`;
  const url = metaIntegration.getAuthUrl(redirectUri);
  res.json({ authUrl: url });
});

router.post('/integrations/meta/connect', async (req, res) => {
  try {
    const { accessToken, pageId, instagramAccountId } = req.body;
    const connection = await metaIntegration.connectWithPageToken(accessToken, pageId, instagramAccountId);
    res.json({ success: true, connection });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/integrations/meta/connect/oauth-callback', async (req, res) => {
  try {
    const { code, redirectUri } = req.body;
    const connection = await metaIntegration.handleOAuthCallback(code, redirectUri);
    res.json({ success: true, connection });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/integrations/meta/disconnect', (req, res) => {
  metaIntegration.disconnect();
  res.json({ success: true, message: 'Meta account disconnected' });
});

router.post('/integrations/meta/refresh', async (req, res) => {
  try {
    const connection = await metaIntegration.refreshConnection();
    res.json({ success: true, connection });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/integrations/meta/publish', async (req, res) => {
  try {
    const { destination, message, mediaUrl, linkUrl, pageId, instagramAccountId } = req.body;
    const publishResult = await metaIntegration.publishContent({
      destination: destination || 'both',
      message,
      mediaUrl,
      linkUrl,
      pageId,
      instagramAccountId
    });

    eventBus.publish(
      EventTopics.MARKETING_CONTENT_DRAFTED,
      {
        channel: destination,
        publishedAt: publishResult.publishedAt,
        facebookPostId: publishResult.facebookPostId,
        instagramMediaId: publishResult.instagramMediaId,
      },
      'meta_integration'
    );

    res.json(publishResult);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao publicar no Facebook/Instagram' });
  }
});

// Webhook endpoint for Meta
router.get('/integrations/meta/webhook', (req, res) => {
  const verificationResult = metaIntegration.verifyWebhookRequest(req.query as Record<string, string>);
  
  if (verificationResult.verified) {
    res.send(verificationResult.challenge);
  } else {
    res.status(400).json({ error: verificationResult.reason });
  }
});

router.post('/integrations/meta/webhook', async (req, res) => {
  try {
    // Verify the request signature (in a real implementation)
    // For now, we'll process the payload directly
    const result = await metaIntegration.processWebhook(req.body);
    
    if (result.success) {
      res.json({ received: true, ...result });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao processar webhook do Meta' });
  }
});

export default router;