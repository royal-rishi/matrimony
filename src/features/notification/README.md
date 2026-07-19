# Notification Module — Architecture Overview

## Module Location
`src/features/notification/`

## Design Principles
- **Feature-First Architecture** — All notification code is self-contained under one directory
- **Clean Architecture** — Each layer (interface → service → repository → provider) depends inward
- **SOLID Principles** — Interface Segregation, Dependency Inversion, Single Responsibility
- **DRY** — Single template registry, single event routing config, single barrel export

---

## Directory Structure

```
src/features/notification/
├── index.ts                          ← Public barrel export (all consumers import from here)
│
├── interfaces/                       ← Abstract contracts (no implementation)
│   ├── notification-provider.interface.ts
│   ├── notification-service.interface.ts
│   └── notification-repository.interface.ts
│
├── types/                            ← Domain types and DTOs
│   └── notification.types.ts
│
├── constants/                        ← Event keys and channel metadata
│   ├── notification-events.constants.ts
│   └── notification-channels.constants.ts
│
├── config/                           ← Event routing, templates, runtime config
│   ├── notification.config.ts
│   └── notification-templates.config.ts
│
├── schemas/                          ← Zod validation schemas
│   └── notification.schemas.ts
│
├── services/                         ← Business logic and data access
│   ├── notification.service.ts       ← Core orchestration service
│   ├── notification.repository.ts    ← Supabase implementation of INotificationRepository
│   └── notification-service.factory.ts  ← DI factory (wires service + providers)
│
├── providers/                        ← Delivery channel implementations
│   ├── in-app.provider.ts            ← Phase 1 (Supabase Realtime) ✅
│   ├── email.provider.ts             ← Phase 2 stub (Resend / AWS SES)
│   └── sms.provider.ts               ← Phase 2 stub (MSG91 / Twilio)
│
├── actions/                          ← Next.js 15 Server Actions
│   └── notification.actions.ts
│
├── hooks/                            ← React client hooks
│   └── useNotifications.ts
│
├── components/                       ← React UI components
│   ├── notification-bell.tsx          ← Nav bell with badge + dropdown
│   └── notification-list.tsx          ← Full-page notification center
│
├── events/                           ← In-process event bus
│   └── notification.event-bus.ts
│
├── queues/                           ← Job queue (Phase 2: BullMQ/Inngest)
│   └── notification.queue.ts
│
├── otp/                              ← OTP service (Phase 2: MSG91)
│   └── otp.service.ts
│
├── email/                            ← Email templates (Phase 2: React Email)
│   └── email-template.renderer.ts
│
└── sms/                              ← SMS DLT templates (Phase 2)
    └── sms-template.registry.ts
```

---

## Data Flow (Phase 1 — In-App)

```
Feature Server Action (e.g. matching)
    │
    ▼
createNotificationAction(input)
    │
    ▼
NotificationService.createAndSend()
    │ 1. Resolve event routing config
    │ 2. De-duplication check (via repository)
    │ 3. Resolve template (title + body interpolation)
    │ 4. SupabaseNotificationRepository.create()  ←── DB INSERT
    │                                                      │
    │                                              Supabase Realtime
    │                                                      │
    │                                             Client browser receives
    │                                             INSERT event via
    │                                             postgres_changes subscription
    │
    │ 5. InAppNotificationProvider.send()  (no-op in Phase 1)
    │
    ▼
NotificationResult { success, notificationId, channelResults }
```

---

## Adding a New Event Type

1. Add the event key to `constants/notification-events.constants.ts`
2. Add the routing config in `config/notification.config.ts` (channels, priority, templateKey)
3. Add the template in `config/notification-templates.config.ts`
4. Call `createNotificationAction({ userId, eventType: YOUR_EVENT })` from your feature

---

## Adding a New Delivery Channel (e.g. Push — Phase 3)

1. Create `providers/push.provider.ts` implementing `INotificationProvider`
2. Set `pushEnabled: true` in `config/notification.config.ts`
3. Add it to the providers array in `services/notification-service.factory.ts`
4. Update `ACTIVE_CHANNELS` in `constants/notification-channels.constants.ts`
5. Run `ALTER PUBLICATION supabase_realtime ADD TABLE notifications` if not already done

---

## Database Tables

| Table | Purpose |
|-------|---------|
| `notifications` | Per-user notification records |
| `notification_preferences` | Per-user channel opt-in settings |

### RLS Policies
- Users can SELECT/UPDATE their own rows
- Service role (Server Actions) can INSERT for any user
- Admin roles can manage all notifications

---

## Phase Roadmap

| Phase | Channel | Provider | Status |
|-------|---------|----------|--------|
| 1 | In-App | Supabase Realtime | ✅ Complete |
| 2 | Email | Resend / AWS SES | 🔜 Stub created |
| 2 | SMS | MSG91 (DLT-compliant) | 🔜 Stub created |
| 2 | OTP | MSG91 OTP API | 🔜 Stub created |
| 3 | Push | FCM / APNs | 📋 Planned |
| 4 | WhatsApp | WhatsApp Business API | 📋 Planned |
