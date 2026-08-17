import { Router } from 'express';
import { commercialService } from '../commercial/commercial-service';

const router = Router();

// =========================================================================
// PRICING ENDPOINTS
// =========================================================================

// GET /api/admin/commercial/prices - Get all service pricings
router.get('/prices', (req, res) => {
  try {
    const pricings = commercialService.getPricings();
    res.json(pricings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/commercial/prices/:id - Get pricing by ID
router.get('/prices/:id', (req, res) => {
  try {
    const { id } = req.params;
    const pricing = commercialService.getPricingById(id);
    if (!pricing) {
      return res.status(404).json({ error: 'Pricing not found' });
    }
    res.json(pricing);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/commercial/prices - Create new pricing
router.post('/prices', (req, res) => {
  try {
    const pricingData = req.body;
    // Remove fields that shouldn't be set by client
    const { id, history, updatedAt, updatedBy, ...dataForCreate } = pricingData;
    const createdPricing = commercialService.createPricing(dataForCreate);
    res.status(201).json(createdPricing);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/commercial/prices/:id - Update pricing
router.put('/prices/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    // Ensure we don't allow changing the ID
    const { id: _, ...safeUpdates } = updates;
    const updatedPricing = commercialService.updatePricing(id, safeUpdates);
    res.json(updatedPricing);
  } catch (error) {
    if (error.message.includes('não encontrada')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

// =========================================================================
// PROMOTIONS ENDPOINTS
// =========================================================================

// GET /api/admin/commercial/promotions - Get all promotions
router.get('/promotions', (req, res) => {
  try {
    const promotions = commercialService.getPromotions();
    res.json(promotions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/commercial/promotions - Create new promotion
router.post('/promotions', (req, res) => {
  try {
    const promotionData = req.body;
    // Remove fields that shouldn't be set by client
    const { id, usageCount, createdAt, ...dataForCreate } = promotionData;
    const createdPromotion = commercialService.createPromotion(dataForCreate);
    res.status(201).json(createdPromotion);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/commercial/promotions/:id - Update promotion
router.put('/promotions/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    // Ensure we don't allow changing protected fields
    const { id: _id, usageCount: _usageCount, createdAt: _createdAt, ...safeUpdates } = updates;
    const updatedPromotion = commercialService.updatePromotion(id, safeUpdates);
    res.json(updatedPromotion);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =========================================================================
// COUPONS ENDPOINTS
// =========================================================================

// GET /api/admin/commercial/coupons - Get all coupons
router.get('/coupons', (req, res) => {
  try {
    const coupons = commercialService.getCoupons();
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/commercial/coupons - Create new coupon
router.post('/coupons', (req, res) => {
  try {
    const couponData = req.body;
    // Remove fields that shouldn't be set by client
    const { id, usedCount, createdAt, usageHistory, ...dataForCreate } = couponData;
    const createdCoupon = commercialService.createCoupon(dataForCreate);
    res.status(201).json(createdCoupon);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/commercial/coupons/:code - Update coupon
router.put('/coupons/:code', (req, res) => {
  try {
    const { code } = req.params;
    const updates = req.body;
    // Ensure we don't allow changing protected fields
    const { id: _id, usedCount: _usedCount, createdAt: _createdAt, usageHistory: _usageHistory, ...safeUpdates } = updates;
    const updatedCoupon = commercialService.updateCoupon(code, safeUpdates);
    res.json(updatedCoupon);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/commercial/coupons/:code/validate - Validate coupon
router.post('/coupons/:code/validate', (req, res) => {
  try {
    const { code } = req.params;
    const { orderAmount, serviceType, userId } = req.body ?? {};
    const result = commercialService.validateCoupon(code, orderAmount ?? 0, serviceType ?? 'defesa_previa', userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/commercial/coupons/:code/redeem - Redeem coupon
router.post('/coupons/:code/redeem', (req, res) => {
  try {
    const { code } = req.params;
    const { userId, userName, caseId, orderAmount, serviceType } = req.body ?? {};
    const result = commercialService.redeemCoupon(code, userId, userName, caseId, orderAmount ?? 0, serviceType ?? 'defesa_previa');
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =========================================================================
// BONUS ENDPOINTS
// =========================================================================

// GET /api/admin/commercial/bonus-ledger - Get bonus ledger
router.get('/bonus-ledger', (req, res) => {
  try {
    const { userId } = req.query;
    const ledger = commercialService.getBonusLedger(userId as string | undefined);
    res.json(ledger);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/commercial/bonus-balance/:userId - Get user bonus balance
router.get('/bonus-balance/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const balance = commercialService.getUserBonusBalance(userId);
    res.json({ balance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/commercial/bonus/credit - Credit bonus
router.post('/bonus/credit', (req, res) => {
  try {
    const params = req.body;
    const result = commercialService.creditBonus(params);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/commercial/bonus/debit - Debit bonus
router.post('/bonus/debit', (req, res) => {
  try {
    const params = req.body;
    const result = commercialService.debitBonus(params);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/commercial/bonus/adjust - Adjust bonus manually
router.post('/bonus/adjust', (req, res) => {
  try {
    const params = req.body;
    const result = commercialService.manualAdjustmentBonus(params);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =========================================================================
// REFERRAL ENDPOINTS
// =========================================================================

// GET /api/admin/commercial/referral-config - Get referral config
router.get('/referral-config', (req, res) => {
  try {
    const config = commercialService.getReferralConfig();
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/commercial/referral-config - Update referral config
router.put('/referral-config', (req, res) => {
  try {
    const updates = req.body;
    // Ensure we don't allow changing protected fields
    const { updatedAt: _updatedAt, updatedBy: _updatedBy, ...safeUpdates } = updates;
    const updatedConfig = commercialService.updateReferralConfig(safeUpdates);
    res.json(updatedConfig);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/commercial/referral/register - Register new referral
router.post('/referral/register', (req, res) => {
  try {
    const { newUserId, referrerCodeOrId } = req.body;
    if (!newUserId || !referrerCodeOrId) {
      return res.status(400).json({ error: 'newUserId and referrerCodeOrId are required' });
    }
    const result = commercialService.registerReferral(newUserId, referrerCodeOrId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/commercial/referral-tree/:userId - Get referral tree for user
router.get('/referral-tree/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const tree = commercialService.getReferralTree(userId);
    res.json(tree);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =========================================================================
// COMMISSIONS ENDPOINTS
// =========================================================================

// GET /api/admin/commercial/commissions - Get commissions ledger
router.get('/commissions', (req, res) => {
  try {
    const { beneficiaryId } = req.query;
    const ledger = commercialService.getCommissionsLedger(beneficiaryId as string | undefined);
    res.json(ledger);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/commercial/commissions/:id/pay - Mark commission as paid
router.put('/commissions/:id/pay', (req, res) => {
  try {
    const { id } = req.params;
    const updatedEntry = commercialService.markCommissionPaid(id);
    res.json(updatedEntry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/commercial/commissions/reverse - Reverse commissions for payment
router.post('/commissions/reverse', (req, res) => {
  try {
    const { paymentId, reason, author } = req.body;
    if (!paymentId) {
      return res.status(400).json({ error: 'paymentId is required' });
    }
    const result = commercialService.reverseCommissionsForPayment(
      paymentId,
      reason ?? 'Cancelamento de pagamento / Estorno PagBank',
      author ?? 'Admin Financeiro'
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =========================================================================
// OVERVIEW & AUDIT ENDPOINTS
// =========================================================================

// GET /api/admin/commercial/overview - Get commercial overview metrics
router.get('/overview', (req, res) => {
  try {
    const metrics = commercialService.getCommercialMetrics();
    res.json({ metrics });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/commercial/audit - Get commercial audit logs
router.get('/audit', (req, res) => {
  try {
    const logs = commercialService.getCommercialAuditLogs();
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =========================================================================
// TESTS ENDPOINT
// =========================================================================

// GET /api/admin/commercial/tests - Run commercial test suite
router.get('/tests', (req, res) => {
  try {
    // Import and run the test suite
    const { runCommercialTestSuite } = require('../commercial/commercial-test-suite');
    const result = runCommercialTestSuite();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
