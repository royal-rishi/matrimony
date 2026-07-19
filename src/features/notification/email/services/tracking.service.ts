// ============================================================
// EMAIL OPEN & CLICK TRACKING UTILITY
// ============================================================

import { EMAIL_CONFIG } from '../config/email.config'

export class TrackingService {
  /**
   * Scans HTML body and wraps all HTTP/HTTPS anchor tags to redirect through 
   * the click-tracking redirection API endpoint.
   */
  static wrapLinks(html: string, emailQueueId: string): string {
    const trackingBaseUrl = `${EMAIL_CONFIG.branding.websiteUrl}/api/notification/email/tracking/click`
    const hrefRegex = /href="([^"]+)"/gi

    return html.replace(hrefRegex, (match, url) => {
      // Exclude quiet links: mailto links, phone links, local hashes, or tracking routes
      if (
        url.startsWith('mailto:') ||
        url.startsWith('tel:') ||
        url.startsWith('#') ||
        url.includes('/api/notification/email/tracking')
      ) {
        return match
      }

      const wrappedUrl = `${trackingBaseUrl}?id=${emailQueueId}&url=${encodeURIComponent(url)}`
      return `href="${wrappedUrl}"`
    })
  }

  /**
   * Appends a hidden 1x1 transparent tracking pixel before the closing </body> tag.
   */
  static injectOpenTrackingPixel(html: string, emailQueueId: string): string {
    const pixelUrl = `${EMAIL_CONFIG.branding.websiteUrl}/api/notification/email/tracking/open?id=${emailQueueId}`
    const pixelTag = `<img src="${pixelUrl}" width="1" height="1" border="0" style="display:none !important; width:1px !important; height:1px !important;" alt="" />`

    if (html.includes('</body>')) {
      return html.replace('</body>', `${pixelTag}\n</body>`)
    }
    return html + pixelTag
  }
}
