// ============================================================
// WHATSAPP ANALYTICS CONFIGURATION
// ============================================================

export const ANALYTICS_CONFIG = {
  enabled: true,
  
  // Estimated nominal cost (USD) per business-initiated conversation session
  defaultCostPerMessage: 0.0075,
  
  alertThresholds: {
    dailyVolumeLimit: 10000,
    failedDeliveryRateAlertPercentage: 5.0, // Alert if failed delivery rate exceeds 5%
  }
}
