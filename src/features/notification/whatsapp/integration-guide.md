# WhatsApp API Integration & Setup Guide

This guide describes how to configure the **MSG91 WhatsApp Business API** for **RishtaJodo Matrimony**.

---

## 1. Environment Keys Configuration

Add the following credentials to your project's `.env.local` or environment secrets:

```bash
# MSG91 WhatsApp API Authentication Key
MSG91_WHATSAPP_AUTH_KEY="your_msg91_auth_key_here"

# Verified WhatsApp Business Outbound Phone Number (E.164 format)
MSG91_WHATSAPP_NUMBER="+919999999999"

# Webhook signing verification secret
MSG91_WHATSAPP_WEBHOOK_SECRET="your_webhook_secret_here"

# MSG91 Outbound WhatsApp Endpoint
MSG91_WHATSAPP_API_URL="https://api.msg91.com/api/v5/whatsapp/send"
```

---

## 2. MSG91 Webhook Setup

To receive real-time delivery reports and read receipts:
1.  Navigate to the **WhatsApp Business** tab in the MSG91 admin console.
2.  Add a new webhook URL pointing to:
    `https://rishtajodo.com/api/notification/whatsapp/webhook`
3.  Subscribe to the following events:
    *   `delivered` (triggered when the message hits the user's phone)
    *   `read` (triggered when the user opens the WhatsApp chat)
    *   `failed` (triggered on network failure or invalid phone)
4.  Copy the signing secret into `MSG91_WHATSAPP_WEBHOOK_SECRET`.
