# Production Deployment Checklist & Rollback Plan

This runbook outlines the deployment checklist, configuration verification steps, and emergency rollback procedures for the RishtaJodo Matrimony Email Notification module.

---

## 1. Pre-Deployment Checklist
- [ ] **Environment Verification**: Ensure all required production variables are populated on the host platform (Vercel, AWS, or local docker-compose environment):
  - `MSG91_EMAIL_AUTH_KEY`
  - `MSG91_EMAIL_BASE_URL`
  - `MSG91_EMAIL_DOMAIN`
  - `MSG91_EMAIL_FROM`
  - `MSG91_EMAIL_REPLY_TO`
- [ ] **DNS Records Check**: Verify SPF, DKIM, and DMARC settings for the domain `rishtajodomatrimony.in` to prevent emails from being flagged as spam.
- [ ] **Database Migrations**: Check that tables `email_queue`, `notification_logs`, `failed_notifications`, and the analytics function `fn_upsert_daily_analytics` are correctly applied in the production PostgreSQL schema.
- [ ] **Vitest suite**: Execute `npx vitest run src/features/notification/email/tests/` to guarantee all unit and integration tests are passing.
- [ ] **Type safety check**: Run `npx tsc --noEmit` to confirm there are zero TypeScript compilation warnings in the codebase.

---

## 2. Deployment Steps
1. **Apply Configuration**: Set the production keys in Vercel/environment dashboard.
2. **Deploy Code**: Trigger build and release pipeline (Next.js production compile).
3. **Smoke Tests**:
   - Send a test email via GET or POST call to `/api/email/test` specifying a verification address.
   - Check the `email_queue` table to ensure jobs are created.
   - Verify that the tracking open pixel works and that the message delivered event is processed.
4. **Webhook Registration**: In the MSG91 dashboard, configure the webhook pointing to `/api/webhooks/msg91/email` and test signature headers.

---

## 3. Emergency Rollback Plan
In the event of delivery failures, high API latencies, or app crashes after deploying:

### Trigger Rollback
- Revert the git commit to the last stable release tag.
- Trigger deployment of the reverted version.
- **Fail-Safe Mode**: If the MSG91 API goes down entirely, switch the environment variable `NODE_ENV` or provider flag to fallback mode to temporarily direct outgoing mail through the mock provider, saving transactions in the queue without losing user events.

### Rollback Verification
- Confirm that the previous Next.js bundle is active.
- Verify health check endpoint `/api/email/health` returns standard status.
