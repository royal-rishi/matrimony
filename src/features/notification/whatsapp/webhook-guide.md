# WhatsApp Webhooks Event Structures

This guide outlines webhook event JSON payloads received from **MSG91** at `/api/notification/whatsapp/webhook` and how they map to delivery tracking in **RishtaJodo Matrimony**.

---

## 1. Webhook Payloads Reference

### A. Message Delivered
Triggered when the message successfully lands on the recipient's handset.
```json
{
  "event": "delivered",
  "message_id": "wamid.HBgLOTExOTk5OTk5OTkVAgASGBQ1NTU4NjAwODMwNjIxODU1MzkxAA==",
  "recipient": "919876543210",
  "timestamp": 1782295941
}
```

### B. Message Read
Triggered when the recipient opens the chat and views the template.
```json
{
  "event": "read",
  "message_id": "wamid.HBgLOTExOTk5OTk5OTkVAgASGBQ1NTU4NjAwODMwNjIxODU1MzkxAA==",
  "recipient": "919876543210",
  "timestamp": 1782295995
}
```

### C. Message Failed / Rejected
Triggered when delivery fails (e.g. number not on WhatsApp, expired template, or carrier timeout).
```json
{
  "event": "failed",
  "message_id": "wamid.HBgLOTExOTk5OTk5OTkVAgASGBQ1NTU4NjAwODMwNjIxODU1MzkxAA==",
  "recipient": "919876543210",
  "error_message": "User is not registered on WhatsApp.",
  "error_code": "131026",
  "timestamp": 1782295941
}
```

---

## 2. Webhook Event Processing Flow

1.  **POST Route Listener**: Webhooks are captured at `/api/notification/whatsapp/webhook`.
2.  **Database Correlation**: The system queries the `whatsapp_queue` using the unique `provider_message_id` (WhatsApp `wamid`).
3.  **Logs & Delivery Synchronization**:
    *   Marks `delivered_at` or `read_at` in the queue.
    *   Invokes PostgreSQL functions `fn_mark_delivered` or `fn_mark_failed` to sync delivery logs for real-time dashboards.
