// ============================================================
// DEFAULT FALLBACK EMAIL TEMPLATE REGISTRY
// ============================================================

import type { EmailTheme } from '../types/email.types'

export interface RegisteredEmailTemplate {
  subject: string
  body: string
  ctaText?: string
  ctaUrl?: string
  theme?: EmailTheme
  templateId?: string
}

export const EMAIL_TEMPLATES_REGISTRY: Record<string, RegisteredEmailTemplate> = {
  // --- AUTHENTICATION & SECURITY ---
  'auth.welcome': {
    subject: 'Welcome to RishtaJodo Matrimony, {{user_name}}!',
    body: 'We are thrilled to help you begin your journey to find a perfect life partner. RishtaJodo combines personalized matchmaking with verified profiles to ensure a safe and premium experience.',
    ctaText: 'Complete Your Profile',
    ctaUrl: '{{dashboard_url}}/profile/edit',
    theme: 'brand',
  },
  'auth.verify_email': {
    subject: 'Verify Your Email Address — RishtaJodo',
    body: 'Thank you for signing up. Please verify your email address to activate your account and start searching for matches. Use the button below or enter the verification code: <strong>{{otp}}</strong>',
    ctaText: 'Verify Email',
    ctaUrl: '{{dashboard_url}}/auth/verify?code={{otp}}',
    theme: 'light',
  },
  'auth.password_reset': {
    subject: 'Reset Your Password — RishtaJodo',
    body: 'We received a request to reset the password for your account. If you did not make this request, you can safely ignore this email. Otherwise, use the button below to reset it. Your verification code is: <strong>{{otp}}</strong>',
    ctaText: 'Reset Password',
    ctaUrl: '{{dashboard_url}}/auth/reset-password?code={{otp}}',
    theme: 'light',
  },
  'auth.change_email': {
    subject: 'Verify New Email Address — RishtaJodo',
    body: 'You requested to change your account email. Please verify your new email address by using the verification code: <strong>{{otp}}</strong>',
    ctaText: 'Verify New Email',
    ctaUrl: '{{dashboard_url}}/auth/verify-change?code={{otp}}',
    theme: 'light',
  },
  'auth.email_changed_confirmation': {
    subject: 'Your RishtaJodo Email Has Been Updated',
    body: 'This is a confirmation that the email address associated with your RishtaJodo account has been successfully changed to {{new_email}}.',
    ctaText: 'Go to Dashboard',
    ctaUrl: '{{dashboard_url}}',
    theme: 'brand',
  },

  // --- REGISTRATION ---
  'registration.success': {
    subject: 'Registration Successful — RishtaJodo Matrimony',
    body: 'Congratulations! Your registration is successful. Your Profile ID is <strong>{{profile_id}}</strong>. Start exploring premium features on RishtaJodo today.',
    ctaText: 'Explore Matches',
    ctaUrl: '{{dashboard_url}}/matches',
    theme: 'brand',
  },
  'registration.complete_profile_reminder': {
    subject: 'Complete Your Profile to Get Premium Matches',
    body: 'Complete profiles receive 80% more interest and recommendations. Take 2 minutes to complete your profile details and upload your photos.',
    ctaText: 'Complete Profile Now',
    ctaUrl: '{{dashboard_url}}/profile/edit',
    theme: 'brand',
  },

  // --- PROFILE VERIFICATION ---
  'profile.submitted': {
    subject: 'Profile Submitted for Verification',
    body: 'Your profile details have been successfully submitted for verification. Our review team checks every profile to maintain an authentic community. We will notify you once approved.',
    ctaText: 'View Status',
    ctaUrl: '{{dashboard_url}}/profile',
    theme: 'light',
  },
  'profile.verified': {
    subject: 'Profile Verified! Verification Badge Added',
    body: 'Congratulations! Your profile has been verified successfully. A verification badge has been added to your profile card, increasing your profile visibility.',
    ctaText: 'Search Matches',
    ctaUrl: '{{dashboard_url}}/matches',
    theme: 'brand',
  },
  'profile.rejected': {
    subject: 'Profile Verification Action Required',
    body: 'Our verification team reviewed your profile and noticed some details do not meet our community guidelines. Please review and update your profile information.',
    ctaText: 'Review Guidelines',
    ctaUrl: '{{dashboard_url}}/profile/edit',
    theme: 'light',
  },
  'profile.photo_approved': {
    subject: 'Profile Photos Approved',
    body: 'Your uploaded profile photos have been approved and are now visible to matching profiles.',
    ctaText: 'Manage Photos',
    ctaUrl: '{{dashboard_url}}/profile/edit?tab=photos',
    theme: 'light',
  },
  'profile.photo_rejected': {
    subject: 'Profile Photo Upload Rejected',
    body: 'Your uploaded profile photo was rejected because it does not comply with our requirements (e.g. blurry, group photo, or background issues). Please upload a clear portrait.',
    ctaText: 'Upload Photo',
    ctaUrl: '{{dashboard_url}}/profile/edit?tab=photos',
    theme: 'light',
  },
  'profile.id_approved': {
    subject: 'Government ID Verified Successfully',
    body: 'Your government identity document verification is complete. Your trust rating has increased, and matches will see you as a trusted member.',
    ctaText: 'View Trust Rating',
    ctaUrl: '{{dashboard_url}}/profile',
    theme: 'brand',
  },
  'profile.id_rejected': {
    subject: 'Identity Document Verification Rejected',
    body: 'Your government ID document could not be verified because the document image was blurry or the name did not match your profile details. Please upload a clear photo of the ID.',
    ctaText: 'Re-upload Document',
    ctaUrl: '{{dashboard_url}}/profile/verify',
    theme: 'light',
  },

  // --- MATCHMAKING ---
  'matchmaking.daily_digest': {
    subject: 'Your Daily Match Digest — RishtaJodo',
    body: 'Here are your top handpicked matches for today based on your partner preferences. Log in to view detailed profiles and send interests.',
    ctaText: 'View Today\'s Matches',
    ctaUrl: '{{dashboard_url}}/matches/daily',
    theme: 'brand',
  },
  'matchmaking.weekly_digest': {
    subject: 'Your Weekly Match Digest — RishtaJodo',
    body: 'Here is your weekly summary of potential matches, profile views, and sent/received interest statistics.',
    ctaText: 'View Weekly Digest',
    ctaUrl: '{{dashboard_url}}/matches/weekly',
    theme: 'brand',
  },
  'matchmaking.ai_recommendation': {
    subject: 'AI Match Recommendation: A Perfect Match Found!',
    body: 'Our matching algorithm has discovered a profile with a 98% compatibility score matching your criteria.',
    ctaText: 'View Compatibility Profile',
    ctaUrl: '{{dashboard_url}}/matches/ai-match',
    theme: 'brand',
  },
  'matchmaking.interest_accepted': {
    subject: 'Match Request Accepted! Start Chatting',
    body: 'Good news! <strong>{{match_name}}</strong> has accepted your interest. You can now chat directly or share contact details.',
    ctaText: 'Open Chat Room',
    ctaUrl: '{{dashboard_url}}/chat',
    theme: 'brand',
  },
  'matchmaking.interest_rejected': {
    subject: 'Interest Request Closed',
    body: 'The match request you sent has been declined or closed by the profile. Don\'t worry, there are thousands of active verified profiles waiting for you.',
    ctaText: 'Search Other Matches',
    ctaUrl: '{{dashboard_url}}/matches',
    theme: 'light',
  },

  // --- ASSOCIATE / MATCHMAKER ---
  'associate.assigned': {
    subject: 'Personal Matchmaker Assigned — {{associate_name}}',
    body: 'Congratulations! A dedicated senior relationship manager, <strong>{{associate_name}}</strong>, has been assigned to guide you, review matches, and organize meetings.',
    ctaText: 'Contact Matchmaker',
    ctaUrl: '{{dashboard_url}}/matchmaker',
    theme: 'brand',
  },
  'associate.changed': {
    subject: 'Your Dedicated Matchmaker Has Been Changed',
    body: 'Your matchmaker has been updated. Your new dedicated matchmaker is <strong>{{associate_name}}</strong>, who will continue to handle your matchmaking journey.',
    ctaText: 'Meet Your Matchmaker',
    ctaUrl: '{{dashboard_url}}/matchmaker',
    theme: 'light',
  },
  'associate.plan_purchased': {
    subject: 'Premium Matchmaker Service Activated',
    body: 'Thank you for upgrading to our Assisted Matchmaking plan. Your matchmaker will arrange a kickoff call shortly.',
    ctaText: 'View Plan Details',
    ctaUrl: '{{dashboard_url}}/matchmaker',
    theme: 'brand',
  },
  'associate.shared_match': {
    subject: 'New Match Shared by {{associate_name}}',
    body: 'Your matchmaker, {{associate_name}}, has handpicked a profile for you and written custom notes on why it is a great match.',
    ctaText: 'View Handpicked Match',
    ctaUrl: '{{dashboard_url}}/matchmaker/shared',
    theme: 'brand',
  },
  'associate.meeting_scheduled': {
    subject: 'Meeting Scheduled: {{meeting_date}} at {{meeting_time}}',
    body: 'Your matchmaker has successfully scheduled a video/voice meeting with your matched profile. Meeting details are locked in.',
    ctaText: 'View Meeting Details',
    ctaUrl: '{{dashboard_url}}/matchmaker/meetings',
    theme: 'brand',
  },
  'associate.meeting_reminder': {
    subject: 'Reminder: Video Meeting with Match Upcoming',
    body: 'This is a reminder that your video meeting arranged by {{associate_name}} is scheduled on {{meeting_date}} at {{meeting_time}}.',
    ctaText: 'Join Meeting',
    ctaUrl: '{{dashboard_url}}/matchmaker/meetings/join',
    theme: 'brand',
  },
  'associate.case_progress': {
    subject: 'Matchmaking Case File Updated',
    body: 'Your assisted matchmaking progress file has been updated by {{associate_name}}. Log in to see status notes.',
    ctaText: 'View Case Progress',
    ctaUrl: '{{dashboard_url}}/matchmaker/progress',
    theme: 'light',
  },
  'associate.marriage_completed': {
    subject: 'Congratulations on Your Wedding! — RishtaJodo',
    body: 'We are overjoyed to hear that you found your life partner on RishtaJodo! Our team wishes you a wonderful life ahead.',
    ctaText: 'Share Your Story',
    ctaUrl: '{{dashboard_url}}/stories/new',
    theme: 'brand',
  },
  'associate.case_closed': {
    subject: 'Assisted Matchmaking Case Closed',
    body: 'Your assisted matchmaking case file has been closed by your relationship manager. We hope we helped you find your path.',
    ctaText: 'View Details',
    ctaUrl: '{{dashboard_url}}/matchmaker',
    theme: 'light',
  },
  'associate.rating_request': {
    subject: 'Rate Your Experience with {{associate_name}}',
    body: 'How did {{associate_name}} assist you? Please take a moment to rate their service and help us improve.',
    ctaText: 'Rate Now',
    ctaUrl: '{{dashboard_url}}/matchmaker/rate',
    theme: 'light',
  },

  // --- PAYMENTS & MEMBERSHIPS ---
  'payment.success': {
    subject: 'Payment Successful — Invoice {{invoice_number}}',
    body: 'Thank you for your payment of <strong>{{payment_amount}}</strong>. Your invoice details are recorded, and your premium access is activated.',
    ctaText: 'Download Invoice',
    ctaUrl: '{{dashboard_url}}/billing/invoices/{{invoice_number}}',
    theme: 'brand',
  },
  'payment.membership_activated': {
    subject: 'Membership Plan Activated — {{membership}}',
    body: 'Your upgrading request is complete. Welcome to the {{membership}} club. Premium benefits are unlocked.',
    ctaText: 'View Membership Benefits',
    ctaUrl: '{{dashboard_url}}/membership',
    theme: 'brand',
  },
  'payment.membership_renewed': {
    subject: 'Membership Plan Renewed Successfully',
    body: 'Your {{membership}} plan has been successfully renewed. Your next renewal date is {{renewal_date}}.',
    ctaText: 'Manage Subscription',
    ctaUrl: '{{dashboard_url}}/membership',
    theme: 'brand',
  },
  'payment.subscription_expiry_reminder': {
    subject: 'Warning: Your {{membership}} Plan is Expiring Soon',
    body: 'Your premium membership plan is expiring on {{renewal_date}}. Renew today to continue finding matches uninterrupted.',
    ctaText: 'Renew Subscription',
    ctaUrl: '{{dashboard_url}}/membership/renew',
    theme: 'brand',
  },
  'payment.refund_success': {
    subject: 'Refund Successful — RishtaJodo',
    body: 'We processed a refund of {{payment_amount}} back to your original payment method. The amount should reflect in 5-7 business days.',
    ctaText: 'Billing Dashboard',
    ctaUrl: '{{dashboard_url}}/billing',
    theme: 'light',
  },

  // --- SECURITY ALERTS ---
  'system.security_alert': {
    subject: 'Security Alert: Account Settings Updated',
    body: 'A security setting was changed on your RishtaJodo account. If you did this, no further action is required.',
    ctaText: 'Review Security Settings',
    ctaUrl: '{{dashboard_url}}/settings/security',
    theme: 'light',
  },
  'system.new_device_login': {
    subject: 'Security Alert: New Device Login Detected',
    body: 'We noticed a login to your RishtaJodo account from a new device/location. If this was not you, please secure your account.',
    ctaText: 'Secure My Account',
    ctaUrl: '{{dashboard_url}}/settings/security',
    theme: 'light',
  },
  'system.account_suspended': {
    subject: 'Urgent: Your Account Has Been Suspended',
    body: 'Your RishtaJodo account has been suspended due to policy violations or reported activities. Please contact our support team to resolve this issue.',
    ctaText: 'Contact Support',
    ctaUrl: 'mailto:support@rishtajodo.com',
    theme: 'light',
  },
  'system.account_reactivated': {
    subject: 'Your Account Has Been Reactivated',
    body: 'Welcome back! Your RishtaJodo account has been reactivated successfully. You can log in now.',
    ctaText: 'Log In Now',
    ctaUrl: '{{dashboard_url}}/login',
    theme: 'brand',
  },

  // --- SUPPORT TICKETS ---
  'support.ticket_created': {
    subject: 'Support Ticket Opened — Ticket #{{ticket_id}}',
    body: 'We received your help request. Our team will review the issue and respond shortly. Ticket #{{ticket_id}} is open.',
    ctaText: 'View Help Ticket',
    ctaUrl: '{{dashboard_url}}/support/tickets/{{ticket_id}}',
    theme: 'light',
  },
  'support.ticket_updated': {
    subject: 'Update: Support Ticket #{{ticket_id}} Reply',
    body: 'Your help ticket #{{ticket_id}} has been updated with a response from our customer support team.',
    ctaText: 'Read Reply',
    ctaUrl: '{{dashboard_url}}/support/tickets/{{ticket_id}}',
    theme: 'light',
  },
  'support.ticket_closed': {
    subject: 'Support Ticket #{{ticket_id}} Closed',
    body: 'Your support ticket #{{ticket_id}} has been closed. If you still need help, feel free to open a new ticket.',
    ctaText: 'Go to Help Desk',
    ctaUrl: '{{dashboard_url}}/support',
    theme: 'light',
  },

  // --- SUCCESS STORIES ---
  'stories.submitted': {
    subject: 'Success Story Submitted!',
    body: 'Thank you for sharing your marriage success story with the RishtaJodo community. Our editorial team will review it shortly.',
    ctaText: 'View Draft Story',
    ctaUrl: '{{dashboard_url}}/stories',
    theme: 'light',
  },
  'stories.published': {
    subject: 'Congratulations! Your Success Story is Published',
    body: 'Your success story is live on our platform. Hundreds of other members will find inspiration in your journey.',
    ctaText: 'View Published Story',
    ctaUrl: 'https://rishtajodo.com/success-stories',
    theme: 'brand',
  },

  // --- MARKETING & NEWSLETTER ---
  'marketing.marriage_tips': {
    subject: 'Pre-Marriage Compatibility Tips from Experts',
    body: 'Check out key topics to discuss with your partner before marriage, according to relationship experts.',
    ctaText: 'Read Blog Post',
    ctaUrl: 'https://rishtajodo.com/blog/marriage-tips',
    theme: 'brand',
  },
  'marketing.relationship_tips': {
    subject: 'Building Stronger Foundations in Relationships',
    body: 'Read our expert tips on communication, trust building, and family integration pre-wedding.',
    ctaText: 'Read Relationship Tips',
    ctaUrl: 'https://rishtajodo.com/blog/relationship-tips',
    theme: 'brand',
  },
  'marketing.premium_offers': {
    subject: 'Special 30% Discount on Premium Plans',
    body: 'Upgrade today to connect directly with unlimited profiles, access phone contacts, and hire matchmakers.',
    ctaText: 'Get 30% Discount',
    ctaUrl: '{{dashboard_url}}/membership/offers',
    theme: 'brand',
  },
  'marketing.referral_program': {
    subject: 'Refer a Friend, Earn Cash Rewards!',
    body: 'Share your unique referral link {{referral_link}} with friends and family. Earn cash payouts on every premium upgrade.',
    ctaText: 'Get Referral Link',
    ctaUrl: '{{dashboard_url}}/referrals',
    theme: 'brand',
  },
  'marketing.festival_wishes': {
    subject: 'Season Greetings from RishtaJodo Team',
    body: 'Wishing you and your family joy, health, and prosperity on this special festival occasion.',
    ctaText: 'Visit RishtaJodo',
    ctaUrl: 'https://rishtajodo.com',
    theme: 'brand',
  },
  'marketing.new_features': {
    subject: 'New Feature Release: AI Recommendations Live!',
    body: 'We launched a new AI search model to discover matches matching your preferences faster. Log in to try it.',
    ctaText: 'Try AI Matching',
    ctaUrl: '{{dashboard_url}}/matches/ai-match',
    theme: 'brand',
  },
  'marketing.newsletter': {
    subject: 'RishtaJodo Monthly Newsletter',
    body: 'Here is your monthly digest of matrimonial trends, success stories, premium tips, and matchmaking updates.',
    ctaText: 'Read Newsletter',
    ctaUrl: 'https://rishtajodo.com/newsletter',
    theme: 'brand',
  },
  'marketing.blog_updates': {
    subject: 'Matrimonial Trends & Partner Search Advice',
    body: 'Read the latest posts on our blog discussing matchmaking trends, online safety, and partner search checklists.',
    ctaText: 'Visit Blog',
    ctaUrl: 'https://rishtajodo.com/blog',
    theme: 'brand',
  },
}
