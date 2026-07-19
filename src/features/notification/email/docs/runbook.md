# Quick-Start Maintenance Runbook

This document contains a quick overview of manual trigger commands to run in emergency scenarios.

---

## 1. Quick Diagnostics
Run a diagnostic health check:
```bash
curl -i GET https://rishtajodo.com/api/email/health
```

---

## 2. Trigger Batch Retry Processes
Force the retry scheduler to re-process all transient failures and log permanent ones to the Dead Letter Queue:
```bash
curl -i -X POST https://rishtajodo.com/api/email/retry
```

---

## 3. Dispatched Test Emails
Verify overall deliverability by sending a test email (Welcome Template) directly to an admin email address:
```bash
curl -i -X POST https://rishtajodo.com/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"toEmail": "admin@rishtajodomatrimony.in", "variables": {"user_name": "Administrator"}}'
```

---

## 4. Render Layout Preview
Preview the welcome email structure:
```bash
curl -i GET "https://rishtajodo.com/api/email/preview?eventType=auth.welcome&theme=brand"
```
