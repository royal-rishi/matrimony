// ============================================================
// WHATSAPP TEMPLATES REGISTRY & VARIABLE INDEX MAPPINGS
// ============================================================

import type { WhatsAppTemplateSchema } from '../types/whatsapp.types'

export const WHATSAPP_TEMPLATES_REGISTRY: Record<string, WhatsAppTemplateSchema> = {
  // --- AUTHENTICATION ---
  'auth.register_otp': {
    templateName: 'rj_auth_otp',
    variablesMapping: ['user_name', 'otp'],
    buttonVariablesMapping: [{ index: 0, type: 'url', valueKey: 'otp' }], // autofill OTP parameter
  },
  'auth.login_otp': {
    templateName: 'rj_auth_otp',
    variablesMapping: ['user_name', 'otp'],
    buttonVariablesMapping: [{ index: 0, type: 'url', valueKey: 'otp' }],
  },
  'auth.forgot_password_otp': {
    templateName: 'rj_auth_otp',
    variablesMapping: ['user_name', 'otp'],
    buttonVariablesMapping: [{ index: 0, type: 'url', valueKey: 'otp' }],
  },
  'auth.change_mobile_otp': {
    templateName: 'rj_auth_otp',
    variablesMapping: ['user_name', 'otp'],
    buttonVariablesMapping: [{ index: 0, type: 'url', valueKey: 'otp' }],
  },

  // --- ASSOCIATE MODULE ---
  'associate.assigned': {
    templateName: 'rj_associate_assign',
    variablesMapping: ['user_name', 'associate_name'],
  },
  'associate.changed': {
    templateName: 'rj_associate_change',
    variablesMapping: ['user_name', 'associate_name'],
  },
  'associate.shared_match': {
    templateName: 'rj_match_shared',
    variablesMapping: ['user_name', 'associate_name'],
    mediaType: 'image',
    buttonVariablesMapping: [{ index: 0, type: 'url', valueKey: 'profile_link' }],
  },
  'associate.meeting_scheduled': {
    templateName: 'rj_meeting_schedule',
    variablesMapping: ['user_name', 'meeting_date', 'meeting_time'],
  },
  'associate.meeting_reminder': {
    templateName: 'rj_meeting_remind',
    variablesMapping: ['user_name', 'meeting_date', 'meeting_time'],
    buttonVariablesMapping: [{ index: 0, type: 'url', valueKey: 'meeting_link' }],
  },
  'associate.case_progress': {
    templateName: 'rj_progress_update',
    variablesMapping: ['user_name', 'associate_name'],
  },
  'associate.marriage_completed': {
    templateName: 'rj_wedding_congrats',
    variablesMapping: ['user_name'],
  },
  'associate.case_closed': {
    templateName: 'rj_case_close',
    variablesMapping: ['user_name'],
  },
  'associate.rating_request': {
    templateName: 'rj_rating_request',
    variablesMapping: ['user_name', 'associate_name'],
  },

  // --- PAYMENTS ---
  'payment.success': {
    templateName: 'rj_payment_success',
    variablesMapping: ['user_name', 'invoice_number', 'payment_amount'],
    mediaType: 'document',
    buttonVariablesMapping: [{ index: 0, type: 'url', valueKey: 'invoice_number' }],
  },
  'payment.membership_activated': {
    templateName: 'rj_membership_active',
    variablesMapping: ['user_name', 'membership'],
  },
  'payment.subscription_expiry_reminder': {
    templateName: 'rj_membership_expiry',
    variablesMapping: ['user_name', 'membership', 'renewal_date'],
  },
  'payment.refund_success': {
    templateName: 'rj_refund_complete',
    variablesMapping: ['user_name', 'payment_amount'],
  },
  'payment.invoice_download_link': {
    templateName: 'rj_invoice_download',
    variablesMapping: ['user_name', 'invoice_number'],
    buttonVariablesMapping: [{ index: 0, type: 'url', valueKey: 'invoice_number' }],
  },

  // --- VERIFICATION ---
  'profile.verified': {
    templateName: 'rj_profile_verified',
    variablesMapping: ['user_name'],
  },
  'profile.id_approved': {
    templateName: 'rj_kyc_approved',
    variablesMapping: ['user_name'],
  },

  // --- SUPPORT ---
  'support.ticket_created': {
    templateName: 'rj_ticket_create',
    variablesMapping: ['user_name', 'ticket_id'],
  },
  'support.ticket_updated': {
    templateName: 'rj_ticket_update',
    variablesMapping: ['user_name', 'ticket_id'],
  },
  'support.ticket_closed': {
    templateName: 'rj_ticket_close',
    variablesMapping: ['user_name', 'ticket_id'],
  },

  // --- MARKETING (OPTIONAL) ---
  'marketing.premium_offers': {
    templateName: 'rj_marketing_offer',
    variablesMapping: ['user_name'],
    mediaType: 'image',
  },
  'marketing.festival_wishes': {
    templateName: 'rj_festival_wish',
    variablesMapping: ['user_name'],
    mediaType: 'image',
  },
  'marketing.referral_program': {
    templateName: 'rj_referral_campaign',
    variablesMapping: ['user_name'],
  },
  'marketing.new_features': {
    templateName: 'rj_feature_launch',
    variablesMapping: ['user_name'],
    mediaType: 'image',
  },
}
