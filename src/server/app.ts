import express from 'express';
import { caseRepository } from './db/case-repository';
import type { AuditLogEntry } from '../types';

// Create Express app
const app = express();

// Add middleware
app.use(express.json());

// Export the shared instances
export { app };
export const databaseRows = caseRepository;

// Shared audit log array
export const auditLogs: AuditLogEntry[] = [];

// Start server function
const startServer = (callback: () => void) => {
  const port = process.env.PORT || 8080;
  return app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    callback();
  });
};

export { startServer };