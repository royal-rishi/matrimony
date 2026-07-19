# WhatsApp template Design Guide

This guide explains how to design WhatsApp templates, map dynamic variables, and configure interactive buttons in **RishtaJodo Matrimony**.

---

## 1. Positional Parameter Mapping

WhatsApp templates approved by Meta utilize positional variables (e.g. `{{1}}`, `{{2}}`). In contrast, our platform uses descriptive named keys (e.g. `user_name`, `otp`).

The mapping is defined in the templates registry (`WHATSAPP_TEMPLATES_REGISTRY`):
```typescript
  'auth.register_otp': {
    templateName: 'rj_auth_otp',
    variablesMapping: ['user_name', 'otp'],
  }
```

*   When dispatching `rj_auth_otp`, the resolver automatically generates:
    *   `{{1}}` $\rightarrow$ `user_name` value.
    *   `{{2}}` $\rightarrow$ `otp` value.

---

## 2. Interactive CTA & URL Buttons

WhatsApp templates can hold Call-to-Action (CTA) and Quick Reply buttons.

### URL Redirection Link Buttons
To pass dynamic URL extensions (e.g. dynamic invoice numbers or profile links):
```typescript
  'payment.success': {
    templateName: 'rj_payment_success',
    variablesMapping: ['user_name', 'invoice_number', 'payment_amount'],
    buttonVariablesMapping: [{ index: 0, type: 'url', valueKey: 'invoice_number' }],
  }
```
*   `index: 0` maps to the first button configured in the template.
*   The value of `invoice_number` (e.g. `INV-12345`) is appended to the base URL configured in the Meta developer portal (e.g. `https://rishtajodo.com/billing/invoices/{{1}}` becomes `https://rishtajodo.com/billing/invoices/INV-12345`).

### OTP Copy Code Buttons
autofills OTP parameters on the button to allow users to copy the code in one tap:
*   `type: 'url'` or `'quick_reply'` with value mapping of `'otp'`.
