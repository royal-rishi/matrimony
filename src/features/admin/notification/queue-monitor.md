# Queue & DLQ Monitor Operations Guide

This guide explains how to manage queues and handle delivery failures in **RishtaJodo Matrimony**.

---

## 1. Active Queues
Active queues are checked in real-time on the **Queue Monitor** tab:
*   **notification_queue**: Primary storage for delayed or scheduled notifications.
*   **Attempts**: Displays current try count vs maximum limit (e.g. `2 / 5`).
*   **Status**: `scheduled`, `processing`, or `pending`.

---

## 2. Dead Letter Queue (DLQ)
When a notification exhausts all automatic retries, it is moved to the `failed_notifications` table.

### Reviewing Failures
1.  Navigate to the **Queue Monitor** page.
2.  Scroll to the **Dead Letter Queue & Retry Center** list.
3.  Examine the **Failure Reason** and **Event Type** to diagnose issues (e.g. invalid phone number, provider auth failure).

### Manual Interventions
*   **Single Retry**: Click the **Retry** button next to a failed job to send it through the engine immediately.
*   **Bulk Retry**: Click **Retry All Failures** to run a complete retry sweep over all unresolved failures.
