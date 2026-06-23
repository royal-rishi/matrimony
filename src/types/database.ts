// ============================================================
// DATABASE TYPES - Rishtajodo Matrimony
// Mirrors the PostgreSQL schema exactly for type safety
// ============================================================

export type UserRole =
  | 'user'
  | 'local_associate'
  | 'block_associate'
  | 'district_associate'
  | 'state_associate'
  | 'super_admin'

export type KycStatus = 'pending' | 'approved' | 'rejected'

export type TerritoryLevel = 'block' | 'district' | 'state'

export type MatchStatus = 'pending' | 'accepted' | 'rejected' | 'connected'

export type PaymentStatus = 'pending' | 'success' | 'failed' | 'refunded'

export type SubscriptionTier = 'free' | 'premium_gold' | 'premium_platinum' | 'elite'

export type CommissionStatus = 'calculated' | 'paid' | 'disputed'

export type LogSeverity = 'info' | 'warning' | 'critical'

export type Gender = 'male' | 'female' | 'other'

export type MaritalStatus =
  | 'never_married'
  | 'divorced'
  | 'widowed'
  | 'awaiting_divorce'

// ---- Chat System Types ----

export type ChatRoomType = 'user_to_user' | 'user_to_associate' | 'associate_to_admin'

export type MessageType =
  | 'text'
  | 'image'
  | 'document'
  | 'emoji'
  | 'system_message'
  | 'voice_message'
  | 'video_message'

export type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed' | 'recalled'

export type VirusScanStatus = 'pending' | 'clean' | 'flagged'

export type ChatReportReason =
  | 'spam'
  | 'abuse'
  | 'harassment'
  | 'fake_profile'
  | 'inappropriate_content'
  | 'scam'

export type ChatReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed'

export interface ChatRoom {
  id: string
  type: ChatRoomType
  created_by_id: string | null
  is_archived: boolean
  archived_at: string | null
  is_deleted: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface ChatParticipant {
  id: string
  room_id: string
  profile_id: string
  last_read_at: string
  is_muted: boolean
  is_pinned: boolean
  pinned_at: string | null
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  room_id: string
  sender_id: string
  message_type: MessageType
  content: string
  status: MessageStatus
  metadata: Record<string, unknown> | null
  is_deleted: boolean
  deleted_at: string | null
  recalled_at: string | null
  created_at: string
  updated_at: string
}

export interface MessageRead {
  id: string
  message_id: string
  profile_id: string
  read_at: string
}

export interface MessageAttachment {
  id: string
  message_id: string
  file_name: string
  file_path: string
  file_size: number
  mime_type: string
  virus_scan_status: VirusScanStatus
  created_at: string
}

export interface ChatBlock {
  id: string
  blocker_id: string
  blocked_id: string
  created_at: string
}

export interface ChatReport {
  id: string
  reporter_id: string
  reported_id: string
  room_id: string | null
  message_id: string | null
  message_created_at: string | null
  reason: ChatReportReason
  description: string | null
  status: ChatReportStatus
  reviewed_by_id: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
}

export interface ChatArchive {
  id: string
  profile_id: string
  room_id: string
  created_at: string
}

export interface ChatSettings {
  profile_id: string
  hide_online_status: boolean
  hide_last_seen: boolean
  restrict_media_download: boolean
  created_at: string
  updated_at: string
}

// Enriched types for UI rendering
export interface ChatRoomWithParticipants extends ChatRoom {
  participants: (ChatParticipant & { profile: Profile })[]
  last_message: Message | null
  unread_count: number
  other_participant: Profile | null
}

export interface MessageWithAttachments extends Message {
  attachments: MessageAttachment[]
  sender: Pick<Profile, 'id' | 'first_name' | 'last_name' | 'avatar_url' | 'is_verified' | 'is_premium'>
}

// ---- Table Row Types ----

export interface Profile {
  id: string
  role: UserRole
  first_name: string
  last_name: string
  gender: Gender
  date_of_birth: string
  marital_status: MaritalStatus
  religion: string
  caste: string | null
  mother_tongue: string
  education: string | null
  occupation: string | null
  annual_income: number | null
  city: string
  state: string
  country: string
  photos: string[]
  avatar_url: string | null
  is_premium: boolean
  is_verified: boolean
  subscription_tier: SubscriptionTier
  referral_code: string | null
  invited_by_id: string | null
  partner_preferences: PartnerPreferences
  mobile_number?: string | null
  photo_privacy_tier?: 'public' | 'verified_members' | 'connections'
  last_name_privacy?: boolean
  hide_phone?: boolean
  hide_income?: boolean
  hide_photos?: boolean
  hide_last_seen?: boolean
  hide_online?: boolean
  body_type?: string | null
  brothers_count?: number | null
  college?: string | null
  company?: string | null
  complexion?: string | null
  diet?: string | null
  drinking?: string | null
  family_type?: string | null
  family_values?: string | null
  father_occupation?: string | null
  height?: number | null
  hobbies?: string[] | null
  horoscope_available?: boolean | null
  interests?: string[] | null
  is_featured?: boolean | null
  manglik_status?: string | null
  mother_occupation?: string | null
  photo_visibility?: string | null
  private_photos?: string[] | null
  profile_created_by?: string | null
  profile_score?: number | null
  profile_visibility?: string | null
  sisters_count?: number | null
  smoking?: string | null
  sub_caste?: string | null
  weight?: number | null
  is_deleted: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface PartnerPreferences {
  age_min?: number
  age_max?: number
  marital_status?: string[]
  religion?: string | null
  mother_tongue?: string | null
  state?: string | null
  city?: string | null
  education?: string | null
}

export interface Associate {
  id: string
  parent_associate_id: string | null
  status: 'active' | 'suspended' | 'pending_kyc' | 'inactive'
  wallet_balance: number
  created_at: string
  updated_at: string
}

export interface AssociateKyc {
  id: string
  national_id_type: string
  national_id_number: string
  id_proof_url: string
  address_proof_url: string
  kyc_status: KycStatus
  verification_notes: string | null
  verified_by_id: string | null
  verified_at: string | null
  created_at: string
  updated_at: string
}

export interface TerritoryAssignment {
  id: string
  associate_id: string
  level: TerritoryLevel
  state: string
  district: string | null
  block: string | null
  created_at: string
}

export interface UserAssignment {
  id: string
  user_id: string
  local_associate_id: string
  assigned_at: string
  unassigned_at: string | null
  reason: string | null
}

export interface Referral {
  id: string
  referrer_id: string
  referred_email: string
  referred_user_id: string | null
  status: 'pending' | 'completed' | 'expired'
  created_at: string
  completed_at: string | null
}

export interface Commission {
  id: string
  associate_id: string
  referral_id: string | null
  amount: number
  status: CommissionStatus
  paid_at: string | null
  transaction_id: string | null
  created_at: string
}

export interface WalletTransaction {
  id: string
  associate_id: string
  amount: number
  type: 'referral_bonus' | 'commission' | 'payout' | 'adjustment'
  status: 'pending' | 'completed' | 'failed'
  description: string | null
  reference_id: string | null
  created_at: string
}

export interface Match {
  id: string
  profile_id_1: string
  profile_id_2: string
  status: MatchStatus
  initiated_by_id: string
  compatibility_score: number | null
  match_reasons: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface AiRecommendation {
  id: string
  user_id: string
  recommended_profile_id: string
  compatibility_score: number
  explanation: string | null
  is_viewed: boolean
  is_disliked: boolean
  generated_at: string
}

export interface Payment {
  id: string
  user_id: string
  razorpay_order_id: string
  razorpay_payment_id: string | null
  razorpay_signature: string | null
  amount: number
  currency: string
  status: PaymentStatus
  payment_gateway_response: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: string
  user_id: string
  payment_id: string | null
  tier: SubscriptionTier
  starts_at: string
  expires_at: string
  is_active: boolean
  created_at: string
}

export interface SystemAuditLog {
  id: string
  actor_id: string | null
  action: string
  target_id: string | null
  details: Record<string, unknown>
  ip_address: string | null
  severity: LogSeverity
  created_at: string
}

// ============================================================
// ASSOCIATE NETWORK PLATFORM TYPES
// ============================================================

export type CaseStage =
  | 'new'
  | 'requirement_collection'
  | 'searching'
  | 'profiles_shared'
  | 'interested'
  | 'family_discussion'
  | 'meeting_scheduled'
  | 'meeting_completed'
  | 'engagement'
  | 'marriage_completed'
  | 'closed'

export type CommissionEventType =
  | 'registration'
  | 'premium_subscription'
  | 'personal_matchmaking'
  | 'marriage_success'
  | 'adjustment'
  | 'refund'

export type WithdrawalStatus = 'pending' | 'approved' | 'rejected' | 'processed' | 'cancelled'

export type DisputeType =
  | 'poor_service'
  | 'no_response'
  | 'wrong_suggestions'
  | 'abusive_behaviour'
  | 'commission_fraud'

export type CasePriority = 'low' | 'normal' | 'high' | 'urgent'

export type MeetingType = 'virtual' | 'in_person' | 'phone'

export type ClientResponse = 'pending' | 'interested' | 'not_interested' | 'maybe'

export type AssociateNotificationType =
  | 'new_assignment'
  | 'case_update'
  | 'meeting_scheduled'
  | 'commission_released'
  | 'review_received'
  | 'marriage_completed'
  | 'dispute_opened'
  | 'withdrawal_approved'
  | 'withdrawal_rejected'
  | 'reminder_due'
  | 'system'

export interface AssociateCase {
  id: string
  case_number: string
  user_id: string
  associate_id: string
  status: CaseStage
  priority: CasePriority
  notes: string | null
  requirement_notes: string | null
  closed_reason: string | null
  last_activity_at: string
  target_match_by: string | null
  case_priority: CasePriority
  assigned_at: string
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface AssociateCaseActivity {
  id: string
  case_id: string
  associate_id: string
  activity_type: string
  description: string
  metadata: Record<string, unknown>
  created_at: string
}

export interface AssociateCaseNote {
  id: string
  case_id: string
  associate_id: string
  user_id: string
  note: string
  created_at: string
}

export interface AssociateCaseMeeting {
  id: string
  case_id: string
  associate_id: string
  title: string
  meeting_type: MeetingType
  scheduled_at: string
  duration_minutes: number
  attendees: { name: string; role: string; confirmed: boolean }[]
  meeting_link: string | null
  location: string | null
  outcome: string | null
  is_completed: boolean
  completed_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface AssociateCaseReminder {
  id: string
  case_id: string
  associate_id: string
  title: string
  body: string | null
  due_at: string
  is_completed: boolean
  completed_at: string | null
  created_at: string
}

export interface AssociateMatchShare {
  id: string
  case_id: string
  associate_id: string
  shared_profile_id: string
  shared_at: string
  client_response: ClientResponse
  client_response_at: string | null
  notes: string | null
}

export interface AssociateBankAccount {
  id: string
  associate_id: string
  account_holder_name: string
  bank_name: string
  account_number: string
  ifsc_code: string
  is_primary: boolean
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface AssociateWithdrawalRequest {
  id: string
  associate_id: string
  bank_account_id: string | null
  amount: number
  status: WithdrawalStatus
  requested_at: string
  reviewed_by_id: string | null
  reviewed_at: string | null
  rejection_reason: string | null
  processed_at: string | null
  transaction_reference: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface AssociateCommissionLedgerEntry {
  id: string
  associate_id: string
  event_type: CommissionEventType
  amount: number
  description: string
  referral_id: string | null
  case_id: string | null
  marriage_success_id: string | null
  withdrawal_id: string | null
  balance_before: number
  balance_after: number
  is_credit: boolean
  created_at: string
}

export interface AssociateReview {
  id: string
  case_id: string
  associate_id: string
  user_id: string
  rating: number
  review_text: string | null
  created_at: string
  updated_at: string
}

export interface AssociateDispute {
  id: string
  user_id: string
  associate_id: string
  case_id: string | null
  title: string
  description: string
  status: 'open' | 'in_review' | 'resolved' | 'dismissed'
  dispute_type: DisputeType | null
  resolution_notes: string | null
  resolved_by: string | null
  escalated_to: string | null
  escalated_at: string | null
  created_at: string
  updated_at: string
}

export interface MarriageSuccess {
  id: string
  groom_id: string
  bride_id: string
  associate_id: string
  case_id: string | null
  marriage_date: string | null
  engagement_date: string | null
  success_story: string | null
  photos: string[]
  verified_by_admin: boolean
  verified_by_id: string | null
  verified_at: string | null
  is_featured: boolean
  created_at: string
  updated_at: string
}

export interface AssociateNotification {
  id: string
  associate_id: string
  type: AssociateNotificationType
  title: string
  body: string
  action_url: string | null
  metadata: Record<string, unknown>
  is_read: boolean
  read_at: string | null
  created_at: string
}

// Enriched types for UI
export interface AssociateCaseWithClient extends AssociateCase {
  client: Pick<Profile, 'id' | 'first_name' | 'last_name' | 'avatar_url' | 'is_verified' | 'city' | 'state' | 'religion' | 'gender'>
  latest_activity: AssociateCaseActivity | null
  pending_reminders_count: number
  days_in_current_stage: number
}

export interface AssociateDashboardKPIs {
  assigned_users: number
  active_cases: number
  cases_completed_this_month: number
  marriage_successes: number
  average_rating: number
  wallet_balance: number
  referrals_this_month: number
  average_response_hours: number
  pending_reminders: number
  unread_notifications: number
}

export interface ReferralFunnelStats {
  total_referrals: number
  registered: number
  verified: number
  premium: number
  personal_matchmaking: number
  married: number
  total_commission_earned: number
}

export interface AdminRole {
  id: string
  name: string
  permissions: string[]
  description: string | null
  created_at: string
  updated_at: string
}

export interface AdminProfile {
  id: string
  role_id: string
  status: 'active' | 'suspended'
  assigned_departments: string[]
  created_at: string
  updated_at: string
}

export interface AdminSession {
  id: string
  admin_id: string
  ip_address: string | null
  user_agent: string | null
  token_hash: string | null
  mfa_verified: boolean
  last_active_at: string
  created_at: string
}

export interface AdminActivityLog {
  id: string
  admin_id: string | null
  action: string
  entity_type: string
  entity_id: string | null
  old_data: Record<string, any>
  new_data: Record<string, any>
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export interface AdminNotification {
  id: string
  role_id: string | null
  admin_id: string | null
  title: string
  message: string
  type: string
  is_read: boolean
  created_at: string
}

export interface UserVerification {
  id: string
  user_id: string
  national_id_type: string | null
  national_id_number: string | null
  id_proof_url: string | null
  education_proof_url: string | null
  occupation_proof_url: string | null
  status: KycStatus
  verification_notes: string | null
  verified_by_id: string | null
  verified_at: string | null
  created_at: string
  updated_at: string
}

export interface CMSPage {
  id: string
  title: string
  content: Record<string, any>
  status: 'draft' | 'published' | 'scheduled' | 'archived'
  published_at: string | null
  meta_title: string | null
  meta_description: string | null
  og_tags: Record<string, any>
  canonical_url: string | null
  sitemap_controls: Record<string, any>
  robots_controls: string | null
  version: number
  created_at: string
  updated_at: string
}

export interface CMSBlog {
  id: string
  slug: string
  title: string
  summary: string | null
  content: string
  featured_image: string | null
  status: 'draft' | 'published' | 'scheduled' | 'archived'
  published_at: string | null
  author_id: string | null
  category: string | null
  tags: string[]
  is_featured: boolean
  meta_title: string | null
  meta_description: string | null
  og_tags: Record<string, any>
  created_at: string
  updated_at: string
}

export interface CMSTemplate {
  id: string
  type: 'email' | 'sms' | 'push'
  subject: string | null
  body: string
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export interface CMSMedia {
  id: string
  file_name: string
  file_url: string
  file_type: 'image' | 'video' | 'document' | 'icon' | 'banner'
  size_bytes: number | null
  uploaded_by: string | null
  created_at: string
}

export interface CMSAnnouncement {
  id: string
  type: 'site_announcement' | 'maintenance_notice' | 'festival_banner' | 'marketing_banner'
  title: string
  message: string
  banner_url: string | null
  link_url: string | null
  starts_at: string | null
  ends_at: string | null
  is_active: boolean
  created_at: string
}

export interface CMSVersionHistory {
  id: string
  entity_type: 'page' | 'blog' | 'template'
  entity_id: string
  version: number
  content: Record<string, any>
  edited_by: string | null
  created_at: string
}

export interface CMSAnalytics {
  id: string
  entity_type: 'page' | 'blog'
  entity_id: string
  views: number
  clicks: number
  conversions: number
  date: string
}

export interface AdminFraudAlert {
  id: string
  user_id: string
  trigger_type: string
  risk_score: number
  details: Record<string, any>
  status: 'open' | 'under_investigation' | 'dismissed' | 'confirmed'
  resolved_by: string | null
  resolved_at: string | null
  created_at: string
}

export interface SupportTicket {
  id: string
  user_id: string | null
  name: string
  email: string
  subject: string
  message: string
  status: string
  created_at: string
}

export interface UserReport {
  id: string
  reporter_id: string
  reported_id: string
  reason: string
  description: string | null
  status: string
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> }
      associates: { Row: Associate; Insert: Partial<Associate>; Update: Partial<Associate> }
      associate_kyc: { Row: AssociateKyc; Insert: Partial<AssociateKyc>; Update: Partial<AssociateKyc> }
      territory_assignments: { Row: TerritoryAssignment; Insert: Partial<TerritoryAssignment>; Update: Partial<TerritoryAssignment> }
      user_assignments: { Row: UserAssignment; Insert: Partial<UserAssignment>; Update: Partial<UserAssignment> }
      referrals: { Row: Referral; Insert: Partial<Referral>; Update: Partial<Referral> }
      commissions: { Row: Commission; Insert: Partial<Commission>; Update: Partial<Commission> }
      wallet_transactions: { Row: WalletTransaction; Insert: Partial<WalletTransaction>; Update: Partial<WalletTransaction> }
      matches: { Row: Match; Insert: Partial<Match>; Update: Partial<Match> }
      ai_recommendations: { Row: AiRecommendation; Insert: Partial<AiRecommendation>; Update: Partial<AiRecommendation> }
      payments: { Row: Payment; Insert: Partial<Payment>; Update: Partial<Payment> }
      subscriptions: { Row: Subscription; Insert: Partial<Subscription>; Update: Partial<Subscription> }
      system_audit_logs: { Row: SystemAuditLog; Insert: Partial<SystemAuditLog>; Update: Partial<SystemAuditLog> }
      associate_cases: { Row: AssociateCase; Insert: Partial<AssociateCase>; Update: Partial<AssociateCase> }
      associate_activities: { Row: AssociateCaseActivity; Insert: Partial<AssociateCaseActivity>; Update: Partial<AssociateCaseActivity> }
      associate_notes: { Row: AssociateCaseNote; Insert: Partial<AssociateCaseNote>; Update: Partial<AssociateCaseNote> }
      associate_case_meetings: { Row: AssociateCaseMeeting; Insert: Partial<AssociateCaseMeeting>; Update: Partial<AssociateCaseMeeting> }
      associate_case_reminders: { Row: AssociateCaseReminder; Insert: Partial<AssociateCaseReminder>; Update: Partial<AssociateCaseReminder> }
      associate_match_shares: { Row: AssociateMatchShare; Insert: Partial<AssociateMatchShare>; Update: Partial<AssociateMatchShare> }
      associate_bank_accounts: { Row: AssociateBankAccount; Insert: Partial<AssociateBankAccount>; Update: Partial<AssociateBankAccount> }
      associate_withdrawal_requests: { Row: AssociateWithdrawalRequest; Insert: Partial<AssociateWithdrawalRequest>; Update: Partial<AssociateWithdrawalRequest> }
      associate_commission_ledger: { Row: AssociateCommissionLedgerEntry; Insert: Partial<AssociateCommissionLedgerEntry>; Update: Partial<AssociateCommissionLedgerEntry> }
      associate_reviews: { Row: AssociateReview; Insert: Partial<AssociateReview>; Update: Partial<AssociateReview> }
      associate_disputes: { Row: AssociateDispute; Insert: Partial<AssociateDispute>; Update: Partial<AssociateDispute> }
      marriage_successes: { Row: MarriageSuccess; Insert: Partial<MarriageSuccess>; Update: Partial<MarriageSuccess> }
      associate_notifications: { Row: AssociateNotification; Insert: Partial<AssociateNotification>; Update: Partial<AssociateNotification> }
      notifications: { Row: any; Insert: any; Update: any }
      admin_roles: { Row: AdminRole; Insert: Partial<AdminRole>; Update: Partial<AdminRole> }
      admin_profiles: { Row: AdminProfile; Insert: Partial<AdminProfile>; Update: Partial<AdminProfile> }
      admin_sessions: { Row: AdminSession; Insert: Partial<AdminSession>; Update: Partial<AdminSession> }
      admin_activity_logs: { Row: AdminActivityLog; Insert: Partial<AdminActivityLog>; Update: Partial<AdminActivityLog> }
      admin_notifications: { Row: AdminNotification; Insert: Partial<AdminNotification>; Update: Partial<AdminNotification> }
      user_verifications: { Row: UserVerification; Insert: Partial<UserVerification>; Update: Partial<UserVerification> }
      cms_pages: { Row: CMSPage; Insert: Partial<CMSPage>; Update: Partial<CMSPage> }
      cms_blogs: { Row: CMSBlog; Insert: Partial<CMSBlog>; Update: Partial<CMSBlog> }
      cms_templates: { Row: CMSTemplate; Insert: Partial<CMSTemplate>; Update: Partial<CMSTemplate> }
      cms_media: { Row: CMSMedia; Insert: Partial<CMSMedia>; Update: Partial<CMSMedia> }
      cms_announcements: { Row: CMSAnnouncement; Insert: Partial<CMSAnnouncement>; Update: Partial<CMSAnnouncement> }
      cms_version_history: { Row: CMSVersionHistory; Insert: Partial<CMSVersionHistory>; Update: Partial<CMSVersionHistory> }
      cms_analytics: { Row: CMSAnalytics; Insert: Partial<CMSAnalytics>; Update: Partial<CMSAnalytics> }
      admin_fraud_alerts: { Row: AdminFraudAlert; Insert: Partial<AdminFraudAlert>; Update: Partial<AdminFraudAlert> }
      support_tickets: { Row: SupportTicket; Insert: Partial<SupportTicket>; Update: Partial<SupportTicket> }
      user_reports: { Row: UserReport; Insert: Partial<UserReport>; Update: Partial<UserReport> }
    }
  }
}
