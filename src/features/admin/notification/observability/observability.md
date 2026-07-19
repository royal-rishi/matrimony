# Enterprise Observability & Monitoring Platform

The RishtaJodo Matrimony Notification Observability Platform aggregates systems telemetry, cost trackers, latency stats, health diagnostic tests, and forecasts into a centralized dashboard panel.

## Architecture Highlights
- **Stateless Services Layer**: Clean separation of database queries into discrete domain services.
- **Event-Driven Audit logging**: Fully tracks adjustments to templates, alerts rules, and campaigns dispatches.
- **Supabase Realtime Hook Integration**: Automatically pulls live queue adjustments and new delivery logs.
- **Diagnostics Alert Engine**: Automated metric checks evaluating failure rates, DLQs limits, queue bottlenecks, and budget ceilings.
