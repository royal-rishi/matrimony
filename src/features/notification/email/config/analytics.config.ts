// ============================================================
// EMAIL TELEMETRY & ANALYTICS CONFIGURATION
// ============================================================

export const ANALYTICS_CONFIG = {
  enabled: true,
  
  // Nominal cost value (e.g. in USD) per email dispatched for financial auditing
  defaultCostPerEmail: 0.002, 
  
  // Alert thresholds to trigger operational warning hooks
  alertThresholds: {
    dailyVolumeLimit: 50000,
    bounceRateAlertPercentage: 5.0, // Alert if bounce rate exceeds 5%
    spamRateAlertPercentage: 0.1,    // Alert if spam rate exceeds 0.1%
  }
}
