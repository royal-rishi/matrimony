# Operations Runbook: Notification Engine

Standard operating procedures for managing the live engine and diagnosing problems.

## Diagnosing Common Faults

### Queue Stalls
1. Check the live Queue Monitor dashboard.
2. If pending count exceeds 500, verify the pg_cron engine status:
   `SELECT cron.job_run_details WHERE status = 'failed';`
3. Restart failed database workers to clear backlogs.

### High SMS/Email Latency
1. Switch MSG91 provider priority settings to a secondary backup connection route.
2. Monitor real-time performance indicators to verify latency recovery.
