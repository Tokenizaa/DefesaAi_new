import { Router } from 'express';
import { metaIntegration } from '../integrations/meta';
import { eventBus, EventTopics } from '../../core/events/topics';

const router = Router();

// Official Meta Graph API Integration (Facebook & Instagram)
router.get('/integrations/meta/status', (req, res) => {
  const status = metaIntegration.getStatus();
  res.json(status);
});

router.get('/integrations/meta/auth-url', (req, res) => {
  const redirectUri = (req.query.redirectUri as string) || `${req.protocol}://${req.get('host')}/api/integrations/meta/callback`;
  const url = metaIntegration.getOAuthLoginUrl(redirectUri);
  res.json({ authUrl: url });
});

router.post('/integrations/meta/connect', async (req, res) => {
  try {
    const { accessToken, pageId, instagramAccountId } = req.body;
    const connection = await metaIntegration.connectWithToken(accessToken, pageId, instagramAccountId);
    res.json({ success: true, connection });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/integrations/meta/disconnect', (req, res) => {
  metaIntegration.disconnect();
  res.json({ success: true, message: 'Conta Meta desconectada' });
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
      instagramAccountId,
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
    console.error('[Meta API] Publish error:', error);
    res.status(500).json({ error: error.message || 'Erro ao publicar no Facebook/Instagram' });
  }
});

export default router;