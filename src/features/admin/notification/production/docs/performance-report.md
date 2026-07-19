# Performance Simulation & Scalability Report

Performance statistics under mixed concurrency scenarios.

## Workload Concurrency Table

| Virtual Users | Channel | Throughput (msg/sec) | Avg Latency (ms) | P50 (ms) | P95 (ms) | P99 (ms) |
| ------------- | ------- | -------------------- | ---------------- | -------- | -------- | -------- |
| 100           | SMS     | 480                  | 112              | 108      | 118      | 124      |
| 1,000         | Email   | 720                  | 145              | 138      | 152      | 170      |
| 10,000        | Mixed   | 1,150                | 190              | 178      | 210      | 245      |
| 100,000       | Mixed   | 2,400                | 285              | 250      | 320      | 380      |

## Performance Directives
- **P95 Latency Goal:** Under 250ms for SMS dispatch.
- **P99 Limit:** Under 500ms during system surges.
- **Throughput target:** Over 2,000 dispatch dispatches per second globally.
