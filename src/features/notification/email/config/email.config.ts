// ============================================================
// EMAIL MODULE GLOBAL CONFIGURATION
// ============================================================

export const EMAIL_CONFIG = {
  fromEmail: process.env.MSG91_EMAIL_FROM || 'noreply@rishtajodo.com',
  fromName: 'RishtaJodo Matrimony',
  replyTo: process.env.MSG91_EMAIL_REPLY_TO || 'support@rishtajodo.com',
  supportedLocales: ['en', 'hi'] as const,
  defaultLocale: 'en' as const,

  branding: {
    logoUrl: 'https://rishtajodo.com/assets/logo.png',
    companyName: 'RishtaJodo Matrimony',
    websiteUrl: 'https://rishtajodo.com',
    dashboardUrl: 'https://rishtajodo.com/dashboard',
    colors: {
      primary: '#db2777', // Hot Pink
      secondary: '#4f46e5', // Indigo
      textLight: '#1f2937', // Dark Gray
      textDark: '#f3f4f6', // Light Gray
      bgLight: '#ffffff',
      bgDark: '#0f172a', // Slate 900
      cardLight: '#f9fafb',
      cardDark: '#1e293b', // Slate 800
      borderLight: '#e5e7eb',
      borderDark: '#334155',
    },
    typography: {
      fontFamily: "Outfit, Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    }
  },

  socialLinks: {
    twitter: 'https://twitter.com/rishtajodo',
    facebook: 'https://facebook.com/rishtajodo',
    instagram: 'https://instagram.com/rishtajodo',
    linkedin: 'https://linkedin.com/company/rishtajodo',
  },

  legal: {
    physicalAddress: 'RishtaJodo Matrimony Private Limited, 4th Floor, Tech Hub Sector 62, Noida, UP, 201301, India',
    copyright: `© ${new Date().getFullYear()} RishtaJodo Matrimony. All rights reserved.`,
  }
}
