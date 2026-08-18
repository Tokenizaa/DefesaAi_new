// Meta Integration - Canonical Implementation
// Exports all public interfaces and services for the Meta integration

export * from './types';
export * from './metaIntegrationService';

// Re-export commonly used interfaces for convenience
export type {
  MetaAppConfig,
  MetaUser,
  MetaPage,
  MetaConnectionState,
  MetaPublishParams,
  MetaPublishResult,
  MetaInsightsParams,
  MetaInsightsResult,
  MetaError
} from './types';