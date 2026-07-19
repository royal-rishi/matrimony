// ============================================================
// WHATSAPP RETRY & DLQ CONFIGURATION
// ============================================================

export const RETRY_CONFIG = {
  maxAttempts: 5,
  
  // Retry interval delays: 1 min, 5 mins, 15 mins, 30 mins, 1 hour
  retryDelaysSeconds: [60, 300, 900, 1800, 3600],
  
  // DLQ archival settings
  dlqRetentionDays: 90,
}
