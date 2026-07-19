# Gateway Provider Health Guide

This guide describes how to monitor and review provider health check status for Email, SMS, and WhatsApp integrations in **RishtaJodo Matrimony**.

---

## 1. Outbound Provider Status Dashboard

To view provider health statuses:
1.  Navigate to the **Provider Health** tab.
2.  Click **Check Health** to trigger a live API query to the `/api/admin/notification/provider` route.
3.  The dashboard displays details for active adapters (MSG91 SMS, MSG91 Email, MSG91 WhatsApp, Mock Providers).

---

## 2. Telemetry Details

Each card shows:
*   **Provider Name**: e.g., `MSG91 SMS Provider`.
*   **Outbound Channel**: SMS, Email, or WhatsApp.
*   **Health Status Indicator**:
    *   **Healthy**: API keys are active, network is reachable, and the mock/live gateway responded successfully.
    *   **Error**: Gateway returned authentication errors or connection timeouts.
*   **Gateway Message**: Status text returned by the provider adapter's local `healthCheck()` implementation.
