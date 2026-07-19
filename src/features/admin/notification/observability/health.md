# Telemetry Diagnostics & Health Checks

Validates critical core dependencies regularly and reports connection status.

## Component Checks
- **Database Connection**: Tests query latencies.
- **Queue stuck items limit**: Monitors for blocked/stuck jobs.
- **Engine worker state**: Audits eventBus emitter queues.
- **Provider API pings**: Measures roundtrip latencies for MSG91 SMS, Email, and WhatsApp endpoints.
