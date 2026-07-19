# User Notification Preferences Operations Guide

This guide describes how to manage and configure user-facing communication settings in **RishtaJodo Matrimony**.

---

## 1. Preferences Overview
The User Preference Center gives members fine-grained control over how and when they receive notifications (In-App, SMS, Email, WhatsApp, Push).
*   **Opt-In Policy**: Users manually enable communication channels.
*   **Mandatory Alerts Lock**: Security alerts (fraud, device logins, suspends) and OTPs are locked and cannot be disabled.

---

## 2. Server Actions

Exported Server Actions (`src/features/notification/preferences/actions/preferences.actions.ts`):

```typescript
import {
  getPreferences,
  updatePreferences,
  resetPreferences,
  updateOTPPreference,
  updateQuietHours,
  updateDigestSettings,
} from '@/features/notification/preferences/actions/preferences.actions'

// 1. Fetch current user settings
const { success, data } = await getPreferences()

// 2. Reset back to defaults
await resetPreferences()

// 3. Update quiet hours (e.g. DND between 10 PM and 8 AM in IST timezone)
await updateQuietHours(true, '22:00', '08:00', 'Asia/Kolkata')
```

---

## 3. Operational REST Endpoints

### Fetch Preferences
*   **GET** `/api/notification/preferences`
*   **Headers**: Bearer User Session Token
*   **Response**: `UserPreferencesData` JSON structure.

### Update Preferences
*   **POST** `/api/notification/preferences`
*   **Body**: Partial updates JSON.

### Reset Defaults
*   **POST** `/api/notification/preferences/reset`
