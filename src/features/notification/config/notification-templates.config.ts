// ============================================================
// NOTIFICATION TEMPLATE REGISTRY
// Maps event type keys to their default title/body templates.
// Supports simple {{placeholder}} interpolation.
// Phase 2 will replace this with CMS-backed templates from
// the cms_templates table.
// ============================================================

export interface NotificationTemplate {
  title: string
  body: string
}

/**
 * Template registry — all keys must match a templateKey in notification.config.ts
 */
export const NOTIFICATION_TEMPLATES: Record<string, NotificationTemplate> = {
  // ---- Match Templates ----
  'match.interest_received': {
    title: '💌 New Interest Received',
    body: '{{senderName}} has sent you an interest request. Check their profile!',
  },
  'match.interest_accepted': {
    title: '🎉 Interest Accepted!',
    body: '{{senderName}} accepted your interest. You can now start a conversation.',
  },
  'match.interest_rejected': {
    title: 'Interest Update',
    body: 'Your interest request has been reviewed.',
  },
  'match.connected': {
    title: '🤝 You are Connected!',
    body: 'You and {{partnerName}} are now connected. Start a conversation!',
  },
  'match.profile_viewed': {
    title: '👀 Profile View',
    body: '{{viewerName}} viewed your profile.',
  },
  'match.shortlisted': {
    title: '⭐ You have been Shortlisted',
    body: '{{senderName}} added you to their shortlist.',
  },
  'match.profile_liked': {
    title: '❤️ Profile Liked',
    body: '{{senderName}} liked your profile.',
  },

  // ---- Chat Templates ----
  'chat.new_message': {
    title: '💬 New Message',
    body: '{{senderName}}: {{messagePreview}}',
  },
  'chat.request': {
    title: '💬 Chat Request',
    body: '{{senderName}} wants to start a conversation with you.',
  },
  'chat.request_accepted': {
    title: '✅ Chat Request Accepted',
    body: '{{senderName}} accepted your chat request.',
  },

  // ---- Profile Templates ----
  'profile.verified': {
    title: '✅ Profile Verified',
    body: 'Congratulations! Your profile has been verified. You now have a verified badge.',
  },
  'profile.rejected': {
    title: 'Verification Update',
    body: 'Your profile verification needs some corrections. {{reason}}',
  },
  'profile.photo_approved': {
    title: '✅ Photo Approved',
    body: 'Your profile photo has been approved and is now visible.',
  },
  'profile.photo_rejected': {
    title: 'Photo Update Required',
    body: 'Your profile photo was rejected. Please upload a clear, recent photo.',
  },

  // ---- Payment Templates ----
  'payment.subscription_started': {
    title: '🌟 Welcome to {{tierName}}!',
    body: 'Your {{tierName}} membership is now active. Enjoy unlimited connections!',
  },
  'payment.subscription_expiring': {
    title: '⏰ Membership Expiring Soon',
    body: 'Your membership expires in {{daysLeft}} days. Renew now to keep enjoying premium benefits.',
  },
  'payment.subscription_expired': {
    title: '🔔 Membership Expired',
    body: 'Your premium membership has expired. Upgrade to continue connecting.',
  },
  'payment.payment_failed': {
    title: '❌ Payment Failed',
    body: 'Your payment of ₹{{amount}} could not be processed. Please try again.',
  },
  'payment.payment_refunded': {
    title: '💰 Refund Processed',
    body: '₹{{amount}} has been refunded to your account.',
  },

  // ---- Associate Templates ----
  'associate.new_assignment': {
    title: '👤 New Client Assigned',
    body: '{{clientName}} has been assigned to you. Review their case and begin outreach.',
  },
  'associate.case_updated': {
    title: '📋 Case Updated',
    body: 'Case #{{caseNumber}} has been updated to stage: {{stage}}.',
  },
  'associate.meeting_scheduled': {
    title: '📅 Meeting Scheduled',
    body: 'A meeting with {{clientName}} is scheduled for {{meetingTime}}.',
  },
  'associate.commission_released': {
    title: '💰 Commission Released',
    body: '₹{{amount}} commission has been credited to your wallet.',
  },
  'associate.review_received': {
    title: '⭐ New Review',
    body: '{{clientName}} rated you {{rating}}/5 stars.',
  },
  'associate.marriage_completed': {
    title: '🎊 Marriage Success!',
    body: 'Congratulations on facilitating the marriage of {{groomName}} & {{brideName}}!',
  },
  'associate.dispute_opened': {
    title: '⚠️ Dispute Opened',
    body: 'A dispute has been opened for case #{{caseNumber}}. Please review.',
  },
  'associate.withdrawal_approved': {
    title: '✅ Withdrawal Approved',
    body: 'Your withdrawal of ₹{{amount}} has been approved and will be processed soon.',
  },
  'associate.withdrawal_rejected': {
    title: '❌ Withdrawal Rejected',
    body: 'Your withdrawal request was rejected. Reason: {{reason}}',
  },
  'associate.reminder_due': {
    title: '⏰ Reminder Due',
    body: '{{reminderTitle}} for case #{{caseNumber}} is due now.',
  },

  // ---- System Templates ----
  'system.announcement': {
    title: '📢 {{title}}',
    body: '{{message}}',
  },
  'system.maintenance': {
    title: '🔧 Scheduled Maintenance',
    body: 'RishtaJodo will be under maintenance on {{date}} from {{startTime}} to {{endTime}}.',
  },
  'system.account_suspended': {
    title: '🚫 Account Suspended',
    body: 'Your account has been temporarily suspended. Contact support for assistance.',
  },
  'system.account_restored': {
    title: '✅ Account Restored',
    body: 'Your account has been restored. Welcome back!',
  },
  'system.fraud_alert': {
    title: '⚠️ Security Alert',
    body: 'Unusual activity detected on your account. Please review and secure your account.',
  },
  'system.kyc_required': {
    title: '📋 Verification Required',
    body: 'Please complete your KYC verification to continue using all features.',
  },
  'system.support_reply': {
    title: '💬 Support Reply',
    body: 'You have a new reply to your support ticket #{{ticketId}}.',
  },
}

/**
 * Interpolate a template string by replacing {{key}} with values.
 *
 * @example
 * interpolateTemplate('Hello {{name}}!', { name: 'Priya' })
 * // => 'Hello Priya!'
 */
export function interpolateTemplate(
  template: string,
  data: Record<string, string | number | boolean> = {}
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const value = data[key]
    return value !== undefined ? String(value) : `{{${key}}}`
  })
}

/**
 * Resolve a template by key and interpolate it with the given data.
 * Falls back to the provided title/body if no template is found.
 */
export function resolveTemplate(
  templateKey: string,
  data: Record<string, string | number | boolean> = {},
  overrides?: { title?: string; body?: string }
): { title: string; body: string } {
  const template = NOTIFICATION_TEMPLATES[templateKey]

  const rawTitle = overrides?.title ?? template?.title ?? templateKey
  const rawBody = overrides?.body ?? template?.body ?? ''

  return {
    title: interpolateTemplate(rawTitle, data),
    body: interpolateTemplate(rawBody, data),
  }
}
