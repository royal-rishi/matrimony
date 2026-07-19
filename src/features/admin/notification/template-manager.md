# Message Templates Management Guide

This guide explains how to configure, edit, and test message templates in the **RishtaJodo Matrimony** admin portal.

---

## 1. Creating Templates

To register a new alert template:
1.  Navigate to the **Message Templates** tab.
2.  Input a template name, target channel (Email, SMS, WhatsApp), locale language (English, Hindi), and event key (e.g. `auth.register_otp`).
3.  Design the body body, referencing dynamic variable placeholders.
4.  Click **Create Template** to save.

---

## 2. Dynamic Variables Browser

Templates support unlimited dynamic placeholder variables. The layout parser substitutes placeholders in real-time before dispatch:

| Variable | Example | Usage |
| :--- | :--- | :--- |
| `{{user_name}}` | Rishi Rohan | Member's display name. |
| `{{otp}}` | 554411 | Authentication security codes. |
| `{{associate_name}}` | Priya Sharma | Matchmaker advisor display name. |
| `{{membership}}` | Gold Premium | Active membership tier. |
| `{{payment_amount}}` | INR 4,999 | Transaction billing amounts. |
| `{{invoice_number}}` | INV-2026-045 | Billing reference. |
| `{{meeting_date}}` | July 20, 2026 | Scheduled matchmaker meeting date. |

---

## 3. Sandbox Test Sends

1.  Select a template from the list and click **Test**.
2.  A sandbox form opens below the list.
3.  Enter a test recipient (email address or phone number) and key in mock variables in JSON format:
    ```json
    {
      "user_name": "Tester",
      "otp": "998811"
    }
    ```
4.  Click **Send Test Notification** to dispatch a live test message.
