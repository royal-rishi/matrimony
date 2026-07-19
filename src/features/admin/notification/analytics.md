# Outbound Telemetry & Analytics Guide

This guide describes how to read, monitor, and interpret communication performance metrics in **RishtaJodo Matrimony**.

---

## 1. Dashboard Metrics

*   **Today's Alerts**: Total outbound requests dispatched since midnight UTC.
*   **Success Rate**: Percentage of successfully delivered messages.
*   **Active Queue Size**: Number of pending retry or future scheduled dispatches.
*   **Dead Letter Queue**: Total number of failed, unresolved notifications.
*   **Est. Spend Today**: Calculated billing cost based on provider cost units.

---

## 2. Channel Distribution

Tracks percentage breakdown of outbound volume:
*   **Email**: Lowest cost, highest character capacity. Recommended for newsletters and digests.
*   **SMS**: Medium cost, high urgency. Recommended for fallback authentications.
*   **WhatsApp**: High cost, interactive features. Recommended for primary OTPs and partner match alerts.

---

## 3. Provider Cost Allocation

Costs are audited based on standard gateway unit costs:
*   **MSG91 SMS**: Tracked per SMS credit unit.
*   **MSG91 Email**: Flat rate per thousand emails.
*   **MSG91 WhatsApp**: Conversation-based pricing depending on template category (Authentication vs Utility).
