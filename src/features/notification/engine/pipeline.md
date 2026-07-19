# Central Notification pipeline Engine

This document explains the sequential stages, context, and middleware validation checks inside the **Notification Pipeline** in **RishtaJodo Matrimony**.

---

## 1. Pipeline execution Flow

When `orchestrator.orchestrate()` is called, it constructs a `PipelineContext` and executes the registered middleware stages sequentially:

```
Input Event Payload
      │
      ▼
┌──────────────┐
│  Validate    │ ──► (Invalid Payload?) ──► [Block Dispatch]
└──────────────┘
      │
      ▼
┌──────────────┐
│  De-dup Check│ ──► (Duplicate in 10s?) ──► [Suppress/De-duplicate]
└──────────────┘
      │
      ▼
┌──────────────┐
│  Rate Limit  │ ──► (Throttled limits?) ──► [Throttled/Blocked]
└──────────────┘
      │
      ▼
┌──────────────┐
│Preferences   │ ──► (Opt-outs/Quiet hours?) ──► [Filtered Channels]
└──────────────┘
      │
      ▼
┌──────────────┐
│ Fallbacks    │ ──► (Provider unhealthy?) ──► [WhatsApp <-> SMS Failovers]
└──────────────┘
      │
      ▼
Active Dispatch via Factory Providers
```

---

## 2. Pipeline Stages Details

### A. Validation Middleware (`ValidateStage`)
*   Syntactic checks verifying that `userId` and `eventType` are present.

### B. Duplicate Prevention Middleware (`DuplicateStage`)
*   Prevents identical events sent to the same user within 10 seconds.

### C. Rate Limiting Middleware (`RateLimitStage`)
*   Limits users to a maximum of 20 notifications per minute and 100 notifications per hour.

### D. Preferences Resolver (`ResolverStage`)
*   Fetches the user's registered phone, email, and opt-in settings.
*   Enforces quiet hours (e.g., suppressing SMS and WhatsApp unless the event is a critical security alert).

### E. Routing & Fallbacks Resolver (`RouterStage`)
*   Performs provider health checks.
*   Triggers automated fallbacks (e.g., routing a WhatsApp message to SMS if the WhatsApp provider is down).
