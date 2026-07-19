// ============================================================
// SMS RETRY POLICY CONFIGURATION
// ============================================================

export const RETRY_CONFIG = {
  // Maximum number of retry attempts before moving to DLQ (failed_notifications)
  maxAttempts: 5,

  // Delay intervals (in seconds) between retry attempts
  // Index 0: 1st retry (after 1 min)
  // Index 1: 2nd retry (after 5 mins)
  // Index 2: 3rd retry (after 15 mins)
  // Index 3: 4th retry (after 30 mins)
  // Index 4: 5th retry (after 30 mins)
  retryDelaysSeconds: [60, 300, 900, 1800, 1800],
} as const
