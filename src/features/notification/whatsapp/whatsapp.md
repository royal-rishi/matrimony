# Enterprise WhatsApp Operations Guide

This guide describes general operations, configurations, and variables of the **Enterprise WhatsApp Notification Module** in **RishtaJodo Matrimony**.

---

## 1. Module Overview
The WhatsApp module enables sending Meta-approved interactive and media-rich template notifications (such as image recommendation cards, invoice PDFs, quick replies, and CTA buttons) using Clean Architecture principles:
*   **Decoupled Services**: Orchestration, Validators, Queue Locking Workers, and Analytics are separated.
*   **Mappers**: Automatically translates flat dynamic named variables into positional array parameters expected by Meta/MSG91 APIs.

---

## 2. Configuration Settings (`src/features/notification/whatsapp/config/`)

### WhatsApp Defaults (`whatsapp.config.ts`)
*   `senderNumber`: Outbound verified Business phone number (`+919999999999`).
*   `supportedLanguages`: Resolves `en` (English) and `hi` (Hindi) templates.

### Provider Settings (`provider.config.ts`)
*   `msg91.authKey`: Outbound API key.
*   `msg91.apiUrl`: Endpoints gateway (`https://api.msg91.com/api/v5/whatsapp/send`).
*   `msg91.webhookSecret`: Signing secret to verify delivery reports.

### Retry Backoff Settings (`retry.config.ts`)
*   `maxAttempts`: Retries cap at 5.
*   `retryDelaysSeconds`: Backoff delays: 1 min, 5 min, 15 min, 30 min, 1 hour.

---

## 3. Operational Cron Commands

### Run Queue Worker
To process scheduled or pending WhatsApp jobs:
```bash
# Triggers WhatsAppQueueService
curl -X POST https://rishtajodo.com/api/notification/whatsapp/send -H "Authorization: Bearer <CronToken>"
```

### Run Retry & DLQ Scheduler
To trigger failed job backoffs and DLQ archival:
```bash
# Triggers WhatsAppRetryService
curl -X POST https://rishtajodo.com/api/notification/whatsapp/retry -H "Authorization: Bearer <CronToken>"
```
