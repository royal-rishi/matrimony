# Production Deployment Checklist

Mandatory verification steps before releasing database migrations or server builds.

## Pre-deployment Tasks
- [ ] Run `npx tsc --noEmit` and confirm 0 errors.
- [ ] Run the complete Vitest test suite (`npm run test`).
- [ ] Confirm MSG91 credentials and API tokens are loaded into environments.
- [ ] Set up database connections and configure RLS access policies.

## Post-deployment Verification
- [ ] Perform a live connection health diagnostic check.
- [ ] Confirm background cron systems are running.
- [ ] Verify that real-time update subscriptions connect properly.
