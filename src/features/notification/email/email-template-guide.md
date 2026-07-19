# Email Template Design Guide

This guide explains how to design templates, write reusable blocks, select branding themes, and utilize dynamic variables in **RishtaJodo Matrimony**.

---

## 1. Reusable Layout Blocks

The template renderer (`EmailRenderer`) compiles body blocks into inline-styled, client-compliant tables:

### A. General Card Block
Wrap content sections inside styled borders:
```typescript
import { EmailRenderer } from '../services/email-renderer'

const cardHtml = EmailRenderer.renderContentCard(`
  <h3>Profile Recommendation</h3>
  <p>Anjali Verma matches 95% of your partner preferences.</p>
`, isDarkTheme)
```

### B. Statistics Card
Display highlight values side-by-side:
```typescript
const statsHtml = EmailRenderer.renderStatisticsCard(
  'Weekly Matches',
  '24 New Profiles',
  '12 verified accounts',
  isDarkTheme
)
```

### C. Standard Dividers
Separate layout sections elegantly:
```typescript
const dividerHtml = EmailRenderer.renderDivider(isDarkTheme)
```

---

## 2. Branding Themes (`EmailTheme`)

The layout engine supports four distinct themes:
1.  **Brand Theme (`'brand'`)**: Embeds a premium hot-pink-to-indigo gradient hero header with the subject text and bold primary action buttons.
2.  **Light Theme (`'light'`)**: Clean, minimalist layout with dark gray text on a crisp white backdrop.
3.  **Dark Theme (`'dark'`)**: High-contrast, premium slate backdrop (`#0f172a`) with light gray text and bordered cards.
4.  **Auto Theme (`'auto'`)**: Generates media-query dark mode overrides.

---

## 3. Dynamic Variables

All templates support standard replacement tags:
*   `{{user_name}}` — Recipient's display name.
*   `{{profile_id}}` — RishtaJodo registered Profile ID (e.g. `RJ-89201`).
*   `{{otp}}` — Multi-factor token or registration codes.
*   `{{membership}}` — Subscription Tier name (e.g. `Super Premium Gold`).
*   `{{meeting_date}}` & `{{meeting_time}}` — Video/Audio match scheduling dates.
*   `{{invoice_number}}` & `{{payment_amount}}` — Billing transactions.
*   `{{support_email}}` & `{{company_name}}` — Corporate footer assets.
