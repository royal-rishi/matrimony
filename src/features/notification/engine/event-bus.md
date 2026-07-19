# Enterprise Event Bus catalog

This document lists the supported event types, variables, and subscription protocols in the **RishtaJodo Matrimony Event Bus**.

---

## 1. Event Registration Protocol

Events are published to the system-wide Event Bus using `eventBus.publish(eventType, payload)`. Handlers subscribe using `eventBus.subscribe(eventType, callback)`.

---

## 2. Event Types & Placeholders catalog

| Event Type (Key) | Channel Context | Variables | Description |
| :--- | :--- | :--- | :--- |
| **Authentication** | | | |
| `auth.register_otp` | WhatsApp, SMS | `{{user_name}}`, `{{otp}}` | Outbound registration verification codes. |
| `auth.login_otp` | WhatsApp, SMS | `{{user_name}}`, `{{otp}}` | Outbound login verification codes. |
| `auth.forgot_password_otp` | WhatsApp, SMS | `{{user_name}}`, `{{otp}}` | Password reset codes. |
| `auth.change_mobile_otp` | WhatsApp, SMS | `{{user_name}}`, `{{otp}}` | Mobile number update verification codes. |
| **Associate Matchmaker** | | | |
| `associate.assigned` | WhatsApp, Email, In-App | `{{user_name}}`, `{{associate_name}}` | Triggered when a matchmaker is assigned. |
| `associate.changed` | WhatsApp, In-App | `{{user_name}}`, `{{associate_name}}` | Triggered when a matchmaker is reassigned. |
| `associate.shared_match` | WhatsApp, In-App | `{{user_name}}`, `{{associate_name}}`, `{{profile_link}}` | Triggered when matching profiles are shared. |
| `associate.meeting_scheduled`| WhatsApp, In-App | `{{user_name}}`, `{{meeting_date}}`, `{{meeting_time}}` | Meeting scheduling details. |
| `associate.meeting_reminder` | WhatsApp, SMS | `{{user_name}}`, `{{meeting_date}}`, `{{meeting_time}}` | Reminders prior to scheduled meetings. |
| `associate.case_progress` | WhatsApp, In-App | `{{user_name}}`, `{{associate_name}}` | Progress report notifications. |
| `associate.marriage_completed`| WhatsApp, In-App | `{{user_name}}` | Marriage completion congratulations. |
| `associate.case_closed` | WhatsApp, In-App | `{{user_name}}` | Account archiving/resolution details. |
| `associate.rating_request` | WhatsApp, In-App | `{{user_name}}`, `{{associate_name}}` | Feedback request. |
| **Payments** | | | |
| `payment.success` | WhatsApp, Email, In-App | `{{user_name}}`, `{{invoice_number}}`, `{{payment_amount}}` | Successful payment confirmation + PDF invoice. |
| `payment.membership_activated`| WhatsApp, Email, In-App | `{{user_name}}`, `{{membership}}` | Membership upgrades details. |
| `payment.subscription_expiry_reminder`| WhatsApp, SMS, In-App | `{{user_name}}`, `{{membership}}`, `{{renewal_date}}` | Expiry warning alerts. |
| `payment.refund_success` | WhatsApp, Email, In-App | `{{user_name}}`, `{{payment_amount}}` | Successful refund logs. |
| `payment.invoice_download_link` | WhatsApp, Email, In-App | `{{user_name}}`, `{{invoice_number}}` | Invoice link sharing. |
| **Verification & Support** | | | |
| `profile.verified` | WhatsApp, Email, In-App | `{{user_name}}` | Profile verification completed successfully. |
| `profile.id_approved` | WhatsApp, In-App | `{{user_name}}` | KYC document approval. |
| `support.ticket_created` | WhatsApp, Email, In-App | `{{user_name}}`, `{{ticket_id}}` | Ticket submission logs. |
| `support.ticket_updated` | WhatsApp, Email, In-App | `{{user_name}}`, `{{ticket_id}}` | Ticket response/progress warning. |
| `support.ticket_closed` | WhatsApp, Email, In-App | `{{user_name}}`, `{{ticket_id}}` | Ticket resolved. |
| **Marketing (Optional)** | | | |
| `marketing.premium_offers` | WhatsApp, Email, In-App | `{{user_name}}` | Promotional upgrades. |
| `marketing.festival_wishes` | WhatsApp, Email, In-App | `{{user_name}}` | Wishes and seasonal greetings. |
| `marketing.referral_program` | WhatsApp, In-App | `{{user_name}}` | referral code campaigns. |
| `marketing.new_features` | WhatsApp, Email, In-App | `{{user_name}}` | Feature updates. |
