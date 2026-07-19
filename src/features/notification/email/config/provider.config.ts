const requiredEnvVars = [
  'MSG91_EMAIL_AUTH_KEY',
  'MSG91_EMAIL_BASE_URL',
  'MSG91_EMAIL_DOMAIN',
  'MSG91_EMAIL_FROM',
  'MSG91_EMAIL_REPLY_TO'
]

if (process.env.NODE_ENV === 'production') {
  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      throw new Error(`CRITICAL STARTUP ERROR: Missing required environment variable: ${varName}`)
    }
  }
}


export const PROVIDER_CONFIG = {
  msg91: {
    authKey: process.env.MSG91_EMAIL_AUTH_KEY || '',
    baseUrl: process.env.MSG91_EMAIL_BASE_URL || 'https://control.msg91.com/api/v5/email/send',
    domain: process.env.MSG91_EMAIL_DOMAIN || 'rishtajodo.com',
    webhookSecret: process.env.MSG91_EMAIL_WEBHOOK_SECRET || '',
  },
  googleWorkspace: {
    domain: process.env.GOOGLE_WORKSPACE_DOMAIN || 'rishtajodo.com',
    validationEnabled: true,
  }
}
