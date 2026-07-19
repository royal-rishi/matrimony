# Operational & Maintenance Runbook

This operations guide defines daily maintenance procedures, analytics review processes, and health check monitoring specifications for the RishtaJodo Matrimony Email Notification module.

---

## 1. Monitor Queue Backlog
To monitor the email delivery performance, verify the backlog size in the PostgreSQL database.
Execute the following query to fetch pending and failed jobs:
```sql
SELECT status, count(*) 
FROM email_queue 
GROUP BY status;
```

If the count of `failed` jobs is growing, trigger the retry scheduler manually:
```bash
curl -X POST https://rishtajodo.com/api/email/retry
```

---

## 2. Check Provider Status & Health
Access the health check endpoint to verify connectivity and gateway latency:
* **URL**: `GET /api/email/health`
* **Response Payload Example**:
```json
{
  "status": "healthy",
  "provider": {
    "id": "msg91-email",
    "status": "healthy",
    "latencyMs": 0
  },
  "queue": {
    "total": 12,
    "pending": 0,
    "processing": 0,
    "completed": 10,
    "failed": 2,
    "cancelled": 0
  }
}
```

---

## 3. Daily Analytics Rollup
The webhook automatically triggers the daily analytics rollup. However, if the analytics data appears outdated, run the rollup query:
```sql
SELECT fn_upsert_daily_analytics(
  current_date,
  'email',
  'msg91-email',
  1,  -- Sent count increment
  0,  -- Delivered increment
  0   -- Failed increment
);
```
