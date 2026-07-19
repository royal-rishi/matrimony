// ============================================================
// MSG91 EMAIL TEMPLATE ID MAPPING (DYNAMIC ENV LOADER)
// ============================================================

export const MSG91_TEMPLATE_MAP: Record<string, string | undefined> = {
  // Authentication & Security
  'auth.welcome': process.env.MSG91_TEMPLATE_WELCOME_EMAIL || 'WELCOME_EMAIL_ID',
  'auth.verify_email': process.env.MSG91_TEMPLATE_VERIFY_EMAIL || 'VERIFY_EMAIL_ID',
  'auth.password_reset': process.env.MSG91_TEMPLATE_PASSWORD_RESET || 'PASSWORD_RESET_ID',
  'auth.change_email': process.env.MSG91_TEMPLATE_CHANGE_EMAIL || 'CHANGE_EMAIL_ID',
  'auth.email_changed_confirmation': process.env.MSG91_TEMPLATE_EMAIL_CHANGED_CONFIRMATION || 'EMAIL_CHANGED_CONFIRMATION_ID',

  // Registration & Onboarding
  'registration.success': process.env.MSG91_TEMPLATE_REGISTRATION_SUCCESS || 'REGISTRATION_SUCCESS_ID',
  'registration.complete_profile_reminder': process.env.MSG91_TEMPLATE_COMPLETE_PROFILE_REMINDER || 'COMPLETE_PROFILE_REMINDER_ID',

  // Profile Verification & Guidelines
  'profile.submitted': process.env.MSG91_TEMPLATE_PROFILE_SUBMITTED || 'PROFILE_SUBMITTED_ID',
  'profile.verified': process.env.MSG91_TEMPLATE_PROFILE_VERIFIED || 'PROFILE_VERIFIED_ID',
  'profile.rejected': process.env.MSG91_TEMPLATE_PROFILE_REJECTED || 'PROFILE_REJECTED_ID',
  'profile.photo_approved': process.env.MSG91_TEMPLATE_PROFILE_PHOTO_APPROVED || 'PROFILE_PHOTO_APPROVED_ID',
  'profile.photo_rejected': process.env.MSG91_TEMPLATE_PROFILE_PHOTO_REJECTED || 'PROFILE_PHOTO_REJECTED_ID',
  'profile.id_approved': process.env.MSG91_TEMPLATE_PROFILE_ID_APPROVED || 'PROFILE_ID_APPROVED_ID',
  'profile.id_rejected': process.env.MSG91_TEMPLATE_PROFILE_ID_REJECTED || 'PROFILE_ID_REJECTED_ID',

  // Matchmaking digests & triggers
  'matchmaking.daily_digest': process.env.MSG91_TEMPLATE_DAILY_DIGEST || 'DAILY_DIGEST_ID',
  'matchmaking.weekly_digest': process.env.MSG91_TEMPLATE_WEEKLY_DIGEST || 'WEEKLY_DIGEST_ID',
  'matchmaking.ai_recommendation': process.env.MSG91_TEMPLATE_AI_RECOMMENDATION || 'AI_RECOMMENDATION_ID',
  'matchmaking.interest_accepted': process.env.MSG91_TEMPLATE_INTEREST_ACCEPTED || 'INTEREST_ACCEPTED_ID',
  'matchmaking.interest_rejected': process.env.MSG91_TEMPLATE_INTEREST_REJECTED || 'INTEREST_REJECTED_ID',

  // Associate & Matchmaker Operations
  'associate.assigned': process.env.MSG91_TEMPLATE_ASSOCIATE_ASSIGNED || 'ASSOCIATE_ASSIGNED_ID',
  'associate.changed': process.env.MSG91_TEMPLATE_ASSOCIATE_CHANGED || 'ASSOCIATE_CHANGED_ID',
  'associate.plan_purchased': process.env.MSG91_TEMPLATE_PLAN_PURCHASED || 'PLAN_PURCHASED_ID',
  'associate.shared_match': process.env.MSG91_TEMPLATE_SHARED_MATCH || 'SHARED_MATCH_ID',
  'associate.meeting_scheduled': process.env.MSG91_TEMPLATE_MEETING_SCHEDULED || 'MEETING_SCHEDULED_ID',
  'associate.meeting_reminder': process.env.MSG91_TEMPLATE_MEETING_REMINDER || 'MEETING_REMINDER_ID',
  'associate.case_progress': process.env.MSG91_TEMPLATE_CASE_PROGRESS || 'CASE_PROGRESS_ID',
  'associate.marriage_completed': process.env.MSG91_TEMPLATE_MARRIAGE_COMPLETED || 'MARRIAGE_COMPLETED_ID',
  'associate.case_closed': process.env.MSG91_TEMPLATE_CASE_CLOSED || 'CASE_CLOSED_ID',
  'associate.rating_request': process.env.MSG91_TEMPLATE_RATING_REQUEST || 'RATING_REQUEST_ID',

  // Billing & Subscriptions
  'payment.success': process.env.MSG91_TEMPLATE_PAYMENT_SUCCESS || 'PAYMENT_SUCCESS_ID',
  'payment.membership_activated': process.env.MSG91_TEMPLATE_MEMBERSHIP_ACTIVATED || 'MEMBERSHIP_ACTIVATED_ID',
  'payment.membership_renewed': process.env.MSG91_TEMPLATE_MEMBERSHIP_RENEWED || 'MEMBERSHIP_RENEWED_ID',
  'payment.subscription_expiry_reminder': process.env.MSG91_TEMPLATE_SUBSCRIPTION_EXPIRY_REMINDER || 'SUBSCRIPTION_EXPIRY_REMINDER_ID',
  'payment.refund_success': process.env.MSG91_TEMPLATE_REFUND_SUCCESS || 'REFUND_SUCCESS_ID',

  // Security & Account Status Alerts
  'system.security_alert': process.env.MSG91_TEMPLATE_SECURITY_ALERT || 'SECURITY_ALERT_ID',
  'system.new_device_login': process.env.MSG91_TEMPLATE_NEW_DEVICE_LOGIN || 'NEW_DEVICE_LOGIN_ID',
  'system.account_suspended': process.env.MSG91_TEMPLATE_ACCOUNT_SUSPENDED || 'ACCOUNT_SUSPENDED_ID',
  'system.account_reactivated': process.env.MSG91_TEMPLATE_ACCOUNT_REACTIVATED || 'ACCOUNT_REACTIVATED_ID',

  // Help Desk & Support
  'support.ticket_created': process.env.MSG91_TEMPLATE_TICKET_CREATED || 'TICKET_CREATED_ID',
  'support.ticket_updated': process.env.MSG91_TEMPLATE_TICKET_UPDATED || 'TICKET_UPDATED_ID',
  'support.ticket_closed': process.env.MSG91_TEMPLATE_TICKET_CLOSED || 'TICKET_CLOSED_ID',

  // Editorial & Marriage Success stories
  'stories.submitted': process.env.MSG91_TEMPLATE_STORIES_SUBMITTED || 'STORIES_SUBMITTED_ID',
  'stories.published': process.env.MSG91_TEMPLATE_STORIES_PUBLISHED || 'STORIES_PUBLISHED_ID',

  // Marketing, Engagement & Newsletters
  'marketing.marriage_tips': process.env.MSG91_TEMPLATE_MARRIAGE_TIPS || 'MARRIAGE_TIPS_ID',
  'marketing.relationship_tips': process.env.MSG91_TEMPLATE_RELATIONSHIP_TIPS || 'RELATIONSHIP_TIPS_ID',
  'marketing.premium_offers': process.env.MSG91_TEMPLATE_PREMIUM_OFFERS || 'PREMIUM_OFFERS_ID',
  'marketing.referral_program': process.env.MSG91_TEMPLATE_REFERRAL_PROGRAM || 'REFERRAL_PROGRAM_ID',
  'marketing.festival_wishes': process.env.MSG91_TEMPLATE_FESTIVAL_WISHES || 'FESTIVAL_WISHES_ID',
  'marketing.new_features': process.env.MSG91_TEMPLATE_NEW_FEATURES || 'NEW_FEATURES_ID',
  'marketing.newsletter': process.env.MSG91_TEMPLATE_NEWSLETTER || 'NEWSLETTER_ID',
  'marketing.blog_updates': process.env.MSG91_TEMPLATE_BLOG_UPDATES || 'BLOG_UPDATES_ID',
}
