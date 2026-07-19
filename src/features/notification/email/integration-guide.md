# Provider Integration & Setup Guide

This guide describes how to configure the **MSG91 Email API** and **Google Workspace Domain Routing** for **RishtaJodo Matrimony**.

---

## 1. Required Environment Variables

Add the following keys to your project's `.env.local` or environment secrets:

```bash
# MSG91 Transactional Email API Key
MSG91_EMAIL_AUTH_KEY="your_msg91_auth_key_here"

# Default outbound mailbox email
MSG91_EMAIL_FROM="noreply@rishtajodo.com"

# Default reply-to support mailbox
MSG91_EMAIL_REPLY_TO="support@rishtajodo.com"

# MSG91 Webhook verification secret (signing check)
MSG91_EMAIL_WEBHOOK_SECRET="your_webhook_secret_here"

# Authorized Google Workspace domain
GOOGLE_WORKSPACE_DOMAIN="rishtajodo.com"
```

---

## 2. MSG91 Email Portal Setup

1.  **Domain Verification**:
    *   Log in to the MSG91 admin portal, navigate to the **Email** section, and add your domain `rishtajodo.com`.
    *   Add the requested DNS records (DKIM, SPF, and tracking CNAME records) in your domain registrar (e.g. Google Domains, Cloudflare) to ensure optimal email deliverability and avoid spam folders.
2.  **Webhook Configuration**:
    *   In the MSG91 Email Webhooks panel, add a new webhook destination:
        `https://rishtajodo.com/api/notification/email/webhook`
    *   Subscribe to the following events:
        *   `delivered`
        *   `opened`
        *   `clicked`
        *   `bounced`
        *   `spam` / `complained`
        *   `failed`
    *   Copy the Webhook Secret key and paste it as `MSG91_EMAIL_WEBHOOK_SECRET`.

---

## 3. Google Workspace Routing

*   Ensure that all outgoing transactional messages that use the custom domain `rishtajodo.com` conform to SPF guidelines.
*   **Enforcement**: The validator (`EmailValidator`) will reject outgoing emails when `fromEmail` has a domain other than `rishtajodo.com` if `googleWorkspace.validationEnabled` is active in `provider.config.ts`.
