// A/B Testing Utility for DefesAi
// Simple implementation that can be expanded with analytics integration

const STORAGE_KEY = 'defesai_ab_test_variant';
const VARIANTS = ['A', 'B'];

// Get or assign a variant for the user
export const getABTestVariant = (): 'A' | 'B' => {
  if (typeof window === 'undefined') return 'A'; // SSR safety
  
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && VARIANTS.includes(stored as 'A' | 'B')) {
    return stored as 'A' | 'B';
  }
  
  // Randomly assign variant (weighted equally)
  const variant = VARIANTS[Math.floor(Math.random() * VARIANTS.length)];
  localStorage.setItem(STORAGE_KEY, variant);
  return variant;
};

// Track an event (in a real app, this would send to analytics)
export const trackABTestEvent = (variant: 'A' | 'B', eventName: string, properties?: Record<string, any>) => {
  if (typeof window === 'undefined') return;
  
  // In a real implementation, this would send to your analytics service
  console.log(`[AB Test] Variant ${variant} - Event: ${eventName}`, properties || {});
  
  // For demo purposes, we'll store in localStorage (not recommended for production)
  const eventsKey = 'defesai_ab_test_events';
  const events = JSON.parse(localStorage.getItem(eventsKey) || '[]');
  events.push({
    variant,
    eventName,
    timestamp: new Date().toISOString(),
    ...properties
  });
  localStorage.setItem(eventsKey, JSON.stringify(events));
};

// Get success message variant for A/B testing
export const getSuccessMessageVariant = (baseMessage: string): string => {
  const variant = getABTestVariant();
  
  switch (variant) {
    case 'A':
      // Original message
      return baseMessage;
    case 'B':
      // Alternative message with more urgency/social proof
      return baseMessage.replace(
        'Link de recuperação enviado!',
        'Seu link de recuperação está a caminho! ✨'
      ).replace(
        'Verifique sua caixa de entrada. O link expira em 1 hora.',
        'Acesse seu e-mail agora e redefina sua senha antes que o link expire em 60 minutos.'
      );
    default:
      return baseMessage;
  }
};

export default {
  getABTestVariant,
  trackABTestEvent,
  getSuccessMessageVariant
};