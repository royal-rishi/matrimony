# Enterprise Notification Engine Operations Guide

This guide describes how to interact with the centralized **Enterprise Notification Engine** in **RishtaJodo Matrimony**.

---

## 1. Engine Overview

No project features should trigger individual delivery channels (SMS, Email, WhatsApp) directly. Instead, all outbound communications are routed through the `NotificationEngine`.

---

## 2. Public API Usage

```typescript
import { notificationEngine } from '@/features/notification/engine/services/notification-engine'

// 1. Dispatch a notification instantly
const result = await notificationEngine.dispatch({
  userId: 'user-uuid-123',
  eventType: 'payment.success',
  variables: {
    user_name: 'Rishi Rohan',
    invoice_number: 'INV-2026-0091',
    payment_amount: 'INR 4,999',
  },
  channels: ['whatsapp', 'email'],
  priority: 'high',
})

// 2. Schedule a notification for a future date
const scheduleResult = await notificationEngine.schedule(
  {
    userId: 'user-uuid-123',
    eventType: 'associate.meeting_reminder',
    variables: {
      user_name: 'Rishi Rohan',
      meeting_date: 'July 20, 2026',
      meeting_time: '11:00 AM',
    },
    channels: ['whatsapp', 'sms'],
  },
  new Date('2026-07-20T10:30:00Z') // Run 30 mins before the meeting
)

// 3. Cancel a pending scheduled notification
await notificationEngine.cancel(scheduleResult.notificationId)

// 4. Broadcast a marketing message to multiple user IDs
await notificationEngine.broadcast(
  {
    eventType: 'marketing.premium_offers',
    variables: { offer_details: 'Get 20% off Premium packages this week!' },
    channels: ['whatsapp', 'email', 'in_app'],
  },
  ['user-uuid-1', 'user-uuid-2', 'user-uuid-3']
)
```

---

## 3. Server Actions

Use the provided Server Actions directly inside React Server Components and Client forms:

*   `dispatchNotification(userId, eventType, variables, options)`
*   `scheduleNotification(userId, eventType, variables, scheduledFor, options)`
*   `cancelNotification(notificationId)`
*   `retryNotification(whatsappQueueId)`
