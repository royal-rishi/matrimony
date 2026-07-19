# Notification Preferences Architecture

This document describes the technical architecture, JSONB schema mapping, and synchronization flow of the **User Notification Preferences** in **RishtaJodo Matrimony**.

---

## 1. Technical Components & Dependencies

```
src/features/notification/preferences/
├── config/
│   └── preferences.config.ts   # Defaults, timezones, and locks config
├── services/
│   ├── preferences.service.ts  # Core preferences manager service
│   └── preference-sync.service.ts # Publishes sync updates to Event Bus
├── components/
│   ├── ChannelSelector.tsx     # Master channel toggles
│   ├── CategoryMatrix.tsx      # Channel vs categories matrices grid
│   ├── DigestScheduler.tsx     # Email digests scheduling selectors
│   ├── QuietHoursPicker.tsx    # DND time windows and timezones pickers
│   ├── OTPMethodSelector.tsx   # Preferred OTP channels selectors
│   └── NotificationSettingsCard.tsx # Main settings dashboard wrapper card
├── utils/
│   └── preferences.logger.ts   # DB audit logs changes sink
├── validators/
│   └── preferences.validator.ts# Enforces locked fields and time limits
├── types/
│   └── preferences.types.ts    # Types declarations
└── tests/
    └── preferences.test.ts     # Vitest suite
```

---

## 2. Extensible JSONB Schema Mapping

To prevent polluting the database schemas with dozens of column toggles (digests, locales, privacy flags, and specific category switches), granular options are stored inside the `event_preferences` JSONB column of the `notification_preferences` table:

```json
{
  "language": "en",
  "timezone": "Asia/Kolkata",
  "privacy": {
    "hideProfileViewed": false,
    "hideMatchRecommendations": false,
    "receiveAnonymousVisitor": true
  },
  "digest": {
    "dailyTime": "morning",
    "dailyCustomTime": "09:00",
    "weeklyDays": ["Friday"],
    "weeklyCustomTime": "18:00"
  },
  "categories": {
    "email": {
      "security": true,
      "authentication": true,
      "payment": true,
      "verification": true,
      "associate": true,
      "support": true,
      "marketing": true,
      "blog": false,
      "newsletter": true,
      "matchDigest": true,
      "weeklyDigest": true
    },
    "sms": {
      "payment": true,
      "verification": true,
      "security": true,
      "associate": true,
      "meetingReminder": true
    },
    "whatsapp": {
      "otp": true,
      "payment": true,
      "associate": true,
      "meeting": true,
      "support": true,
      "marketing": false
    }
  }
}
```

---

## 3. Real-Time Engine Synchronization

*   **Synchronizer Stage**: Whenever settings are saved, the `PreferenceSyncService` publishes the updated configuration details to the central Event Bus under the `'user.preferences_updated'` event.
*   **Decoupled Delivery**: The `NotificationEngine` resolves preferences in real-time on subsequent notification requests by reading the updated values, ensuring that quiet hours and channel preferences are immediately respected.
