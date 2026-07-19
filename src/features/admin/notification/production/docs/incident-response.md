# Incident Response Playbook

Guides on resolving production alerts, system stalls, and communication outages.

## Severity Levels

- **Severity 1 (Critical):** Complete delivery outage (SMS/Email/WhatsApp fail).
- **Severity 2 (Warning):** High latency (average time > 60s) or partial provider failure.
- **Severity 3 (Info):** Missing webhooks, reporting delays, minor UI bugs.

## Step-by-Step Response Path
1. **Identify:** Acknowledge alert notifications on the dashboard.
2. **Mitigate:** Switch channels, enable backup gateways, or restrict marketing broadcasts.
3. **Resolve:** Identify root issue (gateway outage, expired tokens) and apply permanent fix.
4. **Document:** Compile postmortem summary report.
