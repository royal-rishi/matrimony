// ============================================================
// SECURITY & ABUSE PROTECTION CONFIGURATION
// ============================================================

export const SECURITY_CONFIG = {
  // Maximum attempt limits before locking
  maxAttempts: 5,            // Brute force: block after 5 failed code checks
  maxDailyOtp: 10,           // Daily limit: max 10 OTP requests per mobile per 24h

  // Blocking Durations (seconds)
  blockDurations: {
    bruteForce: 900,         // 15 minutes block on mobile/IP/device
    dailyLimit: 86400,       // 24 hours block on mobile
    rapidRequests: 600,      // 10 minutes block for rapid request spam
  },

  // Rapid request detection
  rapidRequestWindow: 60,    // 1 minute window
  rapidRequestLimit: 3,      // Max 3 requests per mobile/IP/device in 1 minute

  // Fingerprint salt (for extra hashing protection on server side)
  fingerprintSalt: process.env.OTP_SECURITY_SALT || 'rishtajodo_otp_secure_salt'
}
