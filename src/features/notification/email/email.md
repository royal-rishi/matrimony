# Enterprise Email Operations Guide

This guide describes general operations, configurations, and layout control parameters of the **Enterprise Email Notification Module** in **RishtaJodo Matrimony**.

---

## 1. Module Overview
The Email Notification Module is designed to handle all platform transactional and marketing email communications using Clean Architecture principles:
*   **Decoupled Services**: Orchestration, Rendering, Validation, and Deliverability checks are partitioned.
*   **Database Queue**: Enqueues email jobs, handles priority scheduling, worker locks, and DLQ movements.
*   **Tracking**: Injects transparent pixels and wraps links for opens/clicks telemetry.

---

## 2. Configuration Settings (`src/features/notification/email/config/`)

### Email Defaults (`email.config.ts`)
*   `fromEmail`: Default outbound mailbox (`noreply@rishtajodo.com`).
*   `fromName`: Sender displayName (`RishtaJodo Matrimony`).
*   `replyTo`: Inbound support mailbox (`support@rishtajodo.com`).
*   `supportedLocales`: Handles `en` (English) and `hi` (Hindi) translations.

### Provider Settings (`provider.config.ts`)
*   `msg91.authKey`: Main API secret.
*   `msg91.webhookSecret`: Signing secret to verify webhook events.
*   `googleWorkspace.domain`: Validation filter ensuring sender belongs to `rishtajodo.com`.

### Retry Backoff Settings (`retry.config.ts`)
*   `maxAttempts`: Cap retries at 5.
*   `retryDelaysSeconds`: Backoff delays: 1 min, 5 min, 15 min, 30 min, 1 hour.

---

## 3. Operational CLI & Cron Commands

### Run Queue Worker
To process pending and scheduled email jobs, configure a cron job or background runner that calls the API route `/api/notification/email/send` or executes:
```bash
# Example polling cron execution script
curl -X POST https://rishtajodo.com/api/notification/email/send -H "Authorization: Bearer <CronToken>"
```

### Run Retry & DLQ Scheduler
To trigger failed job backoffs and DLQ archival:
```bash
# Triggers SMSRetryService processing
curl -X POST https://rishtajodo.com/api/notification/email/retry -H "Authorization: Bearer <CronToken>"
```
