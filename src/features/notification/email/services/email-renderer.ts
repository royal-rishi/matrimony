// ============================================================
// EMAIL RENDERING ENGINE (HTML LAYOUT & BLOCKS)
// ============================================================

import { EMAIL_CONFIG } from '../config/email.config'
import type { EmailTheme } from '../types/email.types'

export class EmailRenderer {
  /**
   * Compiles layout and blocks into a single responsive, inline-styled HTML string.
   * Leverages tables for maximum email client compatibility (Outlook, Gmail, Apple Mail).
   */
  static render(
    bodyContent: string,
    subject: string,
    options: {
      theme?: EmailTheme
      ctaText?: string
      ctaUrl?: string
      unsubscribeUrl?: string
    } = {}
  ): string {
    const theme = options.theme || 'brand'
    const colors = EMAIL_CONFIG.branding.colors
    const branding = EMAIL_CONFIG.branding
    const legal = EMAIL_CONFIG.legal
    
    // Resolve theme colors
    const isDark = theme === 'dark'
    const isBrand = theme === 'brand'
    
    const bgColor = isDark ? colors.bgDark : colors.bgLight
    const textColor = isDark ? colors.textDark : colors.textLight
    const cardBg = isDark ? colors.cardDark : colors.cardLight
    const borderColor = isDark ? colors.borderDark : colors.borderLight
    const primaryColor = colors.primary
    const secondaryColor = colors.secondary
    const fontFamily = branding.typography.fontFamily

    // Build CTA Button HTML if available
    let ctaButtonHtml = ''
    if (options.ctaText && options.ctaUrl) {
      ctaButtonHtml = `
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 25px 0 10px 0;">
          <tr>
            <td align="center">
              <table border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" bgcolor="${primaryColor}" style="border-radius: 8px;">
                    <a href="${options.ctaUrl}" target="_blank" style="font-family: ${fontFamily}; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; padding: 12px 30px; display: inline-block; border-radius: 8px; border: 1px solid ${primaryColor}; transition: background-color 0.2s ease-in-out;">
                      ${options.ctaText}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `
    }

    // Build Brand Header HTML
    const headerHtml = `
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-bottom: 1px solid ${borderColor}; padding-bottom: 20px; margin-bottom: 25px;">
        <tr>
          <td align="left" style="vertical-align: middle;">
            <img src="${branding.logoUrl}" alt="${branding.companyName}" width="40" height="40" style="display: block; border: 0; outline: none; text-decoration: none;" />
          </td>
          <td align="left" style="vertical-align: middle; padding-left: 10px;">
            <span style="font-family: ${fontFamily}; font-size: 20px; font-weight: 700; color: ${isDark ? '#ffffff' : primaryColor}; letter-spacing: -0.5px;">
              ${branding.companyName}
            </span>
          </td>
        </tr>
      </table>
    `

    // Build Hero Highlight Banner if brand theme
    let heroHtml = ''
    if (isBrand) {
      heroHtml = `
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%); border-radius: 12px; margin-bottom: 25px; overflow: hidden;">
          <tr>
            <td align="center" style="padding: 30px 20px;">
              <h2 style="font-family: ${fontFamily}; font-size: 24px; font-weight: 800; color: #ffffff; margin: 0; letter-spacing: -0.5px;">
                ${subject}
              </h2>
            </td>
          </tr>
        </table>
      `
    }

    // Build Social Links HTML
    const socialLinksHtml = `
      <table border="0" cellpadding="0" cellspacing="0" style="margin: 20px auto 10px auto;">
        <tr>
          <td style="padding: 0 10px;">
            <a href="${EMAIL_CONFIG.socialLinks.twitter}" target="_blank" style="color: ${primaryColor}; text-decoration: none; font-size: 14px; font-weight: 600;">Twitter</a>
          </td>
          <td style="padding: 0 10px;">
            <a href="${EMAIL_CONFIG.socialLinks.facebook}" target="_blank" style="color: ${primaryColor}; text-decoration: none; font-size: 14px; font-weight: 600;">Facebook</a>
          </td>
          <td style="padding: 0 10px;">
            <a href="${EMAIL_CONFIG.socialLinks.instagram}" target="_blank" style="color: ${primaryColor}; text-decoration: none; font-size: 14px; font-weight: 600;">Instagram</a>
          </td>
          <td style="padding: 0 10px;">
            <a href="${EMAIL_CONFIG.socialLinks.linkedin}" target="_blank" style="color: ${primaryColor}; text-decoration: none; font-size: 14px; font-weight: 600;">LinkedIn</a>
          </td>
        </tr>
      </table>
    `

    // Build Support and Legal Footer
    const footerHtml = `
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-top: 1px solid ${borderColor}; margin-top: 30px; padding-top: 20px;">
        <tr>
          <td align="center" style="font-family: ${fontFamily}; font-size: 14px; color: ${isDark ? '#94a3b8' : '#64748b'}; line-height: 1.6; text-align: center;">
            <p style="margin: 0 0 10px 0;">
              Need help? Contact our support team at <a href="mailto:${EMAIL_CONFIG.replyTo}" style="color: ${primaryColor}; text-decoration: none;">${EMAIL_CONFIG.replyTo}</a>
            </p>
            <p style="margin: 0 0 10px 0; font-size: 12px;">
              ${legal.physicalAddress}
            </p>
            <p style="margin: 0; font-size: 12px;">
              ${legal.copyright}
            </p>
            <p style="margin: 15px 0 0 0; font-size: 12px;">
              You received this transactional email because you registered on our platform. 
              <br/>
              <a href="${options.unsubscribeUrl || branding.websiteUrl + '/unsubscribe'}" target="_blank" style="color: ${primaryColor}; text-decoration: underline;">Unsubscribe</a> or <a href="${branding.websiteUrl + '/settings'}" target="_blank" style="color: ${primaryColor}; text-decoration: underline;">Manage Preferences</a>.
            </p>
          </td>
        </tr>
      </table>
    `

    // Unify everything into the responsive HTML template
    return `
      <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml" lang="en">
        <head>
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta name="color-scheme" content="${isDark ? 'dark' : 'light'}" />
          <meta name="supported-color-schemes" content="${isDark ? 'dark' : 'light'}" />
          <title>${subject}</title>
          <style type="text/css">
            /* Client-specific styles */
            body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
            table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
            img { -ms-interpolation-mode: bicubic; }

            /* Reset styles */
            img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
            table { border-collapse: collapse !important; }
            body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: ${isDark ? '#020617' : '#f8fafc'}; }

            /* Responsive styles */
            @media screen and (max-width: 600px) {
              .main-container { width: 100% !important; padding: 10px !important; }
              .content-card { padding: 20px !important; }
            }
          </style>
        </head>
        <body style="margin: 0 !important; padding: 0 !important; background-color: ${isDark ? '#020617' : '#f8fafc'};">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td align="center" style="padding: 20px 0;">
                <!-- Main Container -->
                <table border="0" cellpadding="0" cellspacing="0" width="600" class="main-container" style="width: 600px; max-width: 600px;">
                  <tr>
                    <td class="content-card" align="left" bgcolor="${bgColor}" style="padding: 40px; border-radius: 16px; border: 1px solid ${borderColor}; background-color: ${bgColor}; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                      
                      <!-- Header -->
                      ${headerHtml}

                      <!-- Hero Highlight Banner -->
                      ${heroHtml}

                      <!-- Content Body -->
                      <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td style="font-family: ${fontFamily}; font-size: 16px; line-height: 1.7; color: ${textColor};">
                            ${bodyContent}
                          </td>
                        </tr>
                      </table>

                      <!-- Call to Action Button -->
                      ${ctaButtonHtml}

                      <!-- Footer & Legal -->
                      ${socialLinksHtml}
                      ${footerHtml}

                    </td>
                  </tr>
                </table>
                <!-- /Main Container -->
              </td>
            </tr>
          </table>
        </body>
      </html>
    `.trim()
  }

  /**
   * Helper to render custom blocks.
   */
  static renderContentCard(html: string, isDark: boolean = false): string {
    const colors = EMAIL_CONFIG.branding.colors
    const cardBg = isDark ? colors.cardDark : colors.cardLight
    const borderColor = isDark ? colors.borderDark : colors.borderLight
    return `
      <div style="background-color: ${cardBg}; border: 1px solid ${borderColor}; border-radius: 12px; padding: 20px; margin: 15px 0;">
        ${html}
      </div>
    `.trim()
  }

  static renderStatisticsCard(title: string, value: string, description?: string, isDark: boolean = false): string {
    const colors = EMAIL_CONFIG.branding.colors
    const textColor = isDark ? colors.textDark : colors.textLight
    const cardBg = isDark ? colors.cardDark : colors.cardLight
    const borderColor = isDark ? colors.borderDark : colors.borderLight
    const fontFamily = EMAIL_CONFIG.branding.typography.fontFamily

    return `
      <div style="background-color: ${cardBg}; border: 1px solid ${borderColor}; border-radius: 12px; padding: 20px; text-align: center; display: inline-block; min-width: 150px; margin: 10px;">
        <span style="font-family: ${fontFamily}; font-size: 14px; color: ${isDark ? '#94a3b8' : '#64748b'}; display: block; margin-bottom: 5px;">${title}</span>
        <span style="font-family: ${fontFamily}; font-size: 28px; font-weight: 800; color: ${colors.primary}; display: block;">${value}</span>
        ${description ? `<span style="font-family: ${fontFamily}; font-size: 12px; color: ${isDark ? '#64748b' : '#94a3b8'}; display: block; margin-top: 5px;">${description}</span>` : ''}
      </div>
    `.trim()
  }

  static renderDivider(isDark: boolean = false): string {
    const colors = EMAIL_CONFIG.branding.colors
    const borderColor = isDark ? colors.borderDark : colors.borderLight
    return `<hr style="border: 0; border-top: 1px solid ${borderColor}; margin: 20px 0;" />`
  }
}
