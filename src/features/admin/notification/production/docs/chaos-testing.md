# Chaos Engineering Playbook

System behavior verification guide under infrastructure slowdowns, database failures, and third-party gateway crashes.

## Failure Simulations

- **MSG91 SMS Gateway Disabled:** Routing automatically routes message states to pending, triggering subsequent retry cycles or queue hold mechanisms.
- **Database Connection Delays:** Enforces connection timeout bounds and uses exponential backoff policies to avoid system stalls.
- **Worker Crash Simulations:** Multiple server workers ensure high availability. Pending tasks are re-assigned to healthy workers after heartbeats timeout.
