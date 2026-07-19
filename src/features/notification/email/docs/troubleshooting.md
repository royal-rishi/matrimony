# Troubleshooting & Runbook Guide

This runbook helps DevOps engineers diagnose and resolve common failure scenarios in the email notification service.

---

## 1. Emails Stuck in Pending Status
### Symptom
Count of `pending` or `scheduled` jobs in `email_queue` is growing, but no emails are sent.

### Solution
1. Verify if the database worker cron job is running. The worker should invoke the queue handler route:
   ```bash
   curl -X POST https://rishtajodo.com/api/notification/email/process
   ```
2. Verify that there is no database lock contention on `email_queue` tables. Look for locks:
   ```sql
   SELECT pid, query, state 
   FROM pg_stat_activity 
   WHERE query LIKE '%email_queue%';
   ```

---

## 2. High Webhook Signature Verification Failures
### Symptom
MSG91 webhook logs return HTTP `400` or `401` errors, or signature check warning logs are visible.

### Solution
1. Verify that `MSG91_EMAIL_WEBHOOK_SECRET` matches exactly the secret generated in the MSG91 dashboard.
2. Verify that the webhook request is not modified or stripped of header keys by external proxies or firewalls.

---

## 3. High Rate of 429 Rate-Limit Responses from MSG91
### Symptom
Database logs contain warnings: `MSG91 API Rate Limit Exceeded (HTTP 429)`.

### Solution
1. The exponential backoff system automatically schedules retries.
2. If this continues, verify the project's pricing tier and contact MSG91 support to increase API rate limits.
