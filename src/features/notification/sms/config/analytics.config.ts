// ============================================================
// SMS ANALYTICS CONFIGURATION
// ============================================================

export const ANALYTICS_CONFIG = {
  // Flag to enable analytics reporting rollup
  enabled: true,

  // SMS unit cost defaults in INR (for MSG91 transactional route)
  defaultCostPerSms: 0.12, // 12 paise per SMS segment

  // Alerts/Warnings thresholds for daily/monthly volumes
  thresholds: {
    dailyVolumeAlert: 10000,   // alert admins if daily volume exceeds 10k SMS
    monthlyVolumeAlert: 200000 // alert if monthly volume exceeds 200k SMS
  }
} as const
