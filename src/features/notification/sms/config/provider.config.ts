// ============================================================
// MSG91 SMS PROVIDER CONFIGURATION
// ============================================================

export const PROVIDER_CONFIG = {
  // MSG91 configuration
  msg91: {
    authKey: process.env.MSG91_SMS_AUTH_KEY || '',
    senderId: process.env.MSG91_SMS_SENDER_ID || 'RSTJDO',
    defaultFlowId: process.env.MSG91_SMS_FLOW_ID || '',
    baseUrl: 'https://control.msg91.com/api/v5',
    endpoints: {
      sendFlow: '/flow',
      getSmsStatus: '/webhooks/getSmsStatus',
    },
  },
} as const
