# Preferences Center UI Integration Guide

This guide explains how to render and integrate the **Notification Preferences Center** dashboard into the user settings pages of **RishtaJodo Matrimony**.

---

## 1. UI Rendering

Import and render the unified settings wrapper component:

```tsx
import { NotificationSettingsCard } from '@/features/notification/preferences/components/NotificationSettingsCard'

export default function SettingsNotificationsPage() {
  return (
    <div className="container mx-auto py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage your personal profile and system alerts.
          </p>
        </div>

        {/* preference center card */}
        <NotificationSettingsCard />
      </div>
    </div>
  )
}
```

---

## 2. Interactive Features List

1.  **Channel Toggles**: Instantly activates/deactivates delivery channels.
2.  **Category Matrix Grid**: Displays channel categories toggles dynamically based on enabled channel flags.
3.  **Quiet Hours Picker**: Allows specifying sleep hours with responsive time selectors.
4.  **OTP Selector**: Configures preferred SMS vs WhatsApp verification channel, with automatic failover settings.
5.  **Language locale selectors**: Configures English/Hindi templates settings.
