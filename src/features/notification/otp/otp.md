# Enterprise OTP Authentication Engine

This document details the architecture, flows, security mechanisms, fallback logic, rate limiting, and operational best practices for the Enterprise OTP Authentication Engine in **RishtaJodo Matrimony**.

---

## 1. Directory Structure

All components of the OTP Authentication module are isolated inside `src/features/notification/otp/` utilizing Feature-First and Clean Architecture principles:

```
src/features/notification/otp/
├── actions/
│   └── otp.actions.ts           # Server Actions exposing OTP capability to client components
├── config/
│   ├── otp.config.ts            # Core configurations (lengths, expiry, channels)
│   └── security.config.ts       # Security & threshold configurations (rate limits, locks)
├── interfaces/
│   └── otp-provider.interface.ts # Interface definitions for delivery providers
├── providers/
│   ├── msg91-sms.provider.ts    # MSG91 SMS SendOTP Provider
│   ├── msg91-whatsapp.provider.ts# MSG91 WhatsApp OTP Provider
│   └── mock-otp.provider.ts     # Developer-friendly Console/Test Provider
├── services/
│   ├── fallback-resolver.ts     # Implements automatic channel fallback
│   ├── otp.service.ts           # Main orchestrator (hashing, database persistence, logs)
│   └── otp-service.factory.ts   # Dependency Injection Factory
├── tests/
│   └── otp.test.ts              # Unit and integration test suite
├── types/
│   ├── otp.types.ts             # Application domain DTOs
│   └── otp-database.types.ts    # Database-level entities
├── utils/
│   ├── otp.analytics.ts         # Tracks deliverability metrics and telemetry
│   └── otp.logger.ts            # Detailed audit logger for security tracing
└── validators/
    └── otp.validator.ts         # Validates E.164 phone numbers, active blocks, and rate limits
```

---

## 2. Authentication Flow

The end-to-end registration flow with OTP authentication executes as follows:

```mermaid
sequenceDiagram
    autonumber
    actor User as Client App
    participant SA as Server Actions (otp.actions)
    participant Service as OTP Orchestrator (otp.service)
    participant Validator as Validator (otp.validator)
    participant Resolver as Fallback Resolver
    participant Provider as MSG91 APIs
    participant DB as Supabase DB

    User->>SA: Request OTP (+91XXXXXXXXXX, purpose, channel)
    SA->>Service: sendOtp(input)
    Service->>Validator: checkBlocks & checkRateLimits
    alt Blocked or Rate Limited
        Validator-->>Service: Blocked/Limit Exceeded
        Service-->>SA: Return failure (cooldown/block message)
        SA-->>User: Show block/cooldown UI
    else Allowed
        Validator-->>Service: Allowed
        Service->>Service: Generate 6-digit code
        Service->>Service: Hash code (SHA-256)
        Service->>Resolver: sendWithFallback(mobile, rawCode, channel)
        Resolver->>Provider: Send via Primary (e.g., WhatsApp)
        alt Primary Succeeds
            Provider-->>Resolver: Success
        else Primary Fails & Fallback Enabled
            Resolver->>Provider: Send via Secondary (e.g., SMS)
            Provider-->>Resolver: Success
        end
        Resolver-->>Service: Delivery Results (channel used, msg ID)
        Service->>DB: Save hashed code, IP, device, and expiry
        Service->>DB: Write Audit Logs & Analytics
        Service-->>SA: Success Response
        SA-->>User: Proceed to Verification Screen
    end

    User->>SA: Submit Code
    SA->>Service: verifyOtp(input)
    Service->>Validator: checkBlocks
    alt Account/IP Blocked
        Validator-->>Service: Blocked
        Service-->>SA: Return Blocked Error
        SA-->>User: Show Blocked message
    else Allowed
        Service->>DB: Query active request (unexpired, unverified)
        alt No Request Found
            DB-->>Service: Empty
            Service-->>SA: Return Expired/Invalid Code
            SA-->>User: Show Error (Request new OTP)
        else Request Found
            Service->>Service: Hash input code (SHA-256)
            alt Code Matches
                Service->>DB: Mark verified_at = NOW() (expire request)
                Service->>DB: Write Audit logs & Analytics
                Service-->>SA: Verified = True
                SA-->>User: Redirect to Registration/Dashboard
            else Code Mismatches
                alt Attempts >= Max (3)
                    Service->>DB: Expire request immediately (expires_at = NOW)
                    Service->>Validator: applyBlock (brute_force) for Mobile, IP, Device
                    Service->>DB: Write Security logs
                    Service-->>SA: Blocked = True, Attempts Remaining = 0
                    SA-->>User: Show locked-out UI (15 min)
                else Attempts < Max
                    Service->>DB: Increment attempts in DB
                    Service-->>SA: Verified = False, Attempts Remaining = X
                    SA-->>User: Show Incorrect Code (X attempts left)
                end
            end
        end
    end
```

---

## 3. Core Security Controls

The OTP engine implements the following robust security measures:

*   **Zero-Plaintext Storage**: Plaintext codes are never stored in the database or logs. The code is immediately hashed using SHA-256. Verification is done by hashing the input code and matching it against the stored hash in the database.
*   **One-Time Use (Instant Expiry)**: A request is marked as expired (`expires_at` is set to `now()`) immediately upon successful verification to prevent replay attacks.
*   **Active Request Invalidation**: Whenever a new OTP is requested (or resent) for a specific mobile and purpose, all previous active (unverified) requests for that target are instantly expired in the database.
*   **Brute-Force Lockouts**: If a user submits incorrect codes 3 times (`SECURITY_CONFIG.maxAttempts`), the OTP request is deleted/expired, and a `brute_force` block is placed on the mobile number, IP address, and device fingerprint for 15 minutes.
*   **Anti-Spam Rate Limiting**:
    *   **Cooldown**: Users must wait 30 seconds between consecutive OTP requests (`OTP_CONFIG.cooldownSeconds`).
    *   **Daily Request Cap**: A maximum of 10 OTP requests is allowed per mobile number in a rolling 24-hour window. Reaching this limit automatically blocks the mobile number for 24 hours (`daily_limit`).
    *   **Rapid Request Checks**: If an IP address or device fingerprint makes 5 or more OTP requests within a 60-second window, it is flagged as a spam engine, and the IP/device is blocked for 30 minutes (`rapid_requests`).

---

## 4. Automatic Channel Fallback

*   **Primary Channel**: Defaults to WhatsApp (`whatsapp`) to minimize delivery cost and maximize speed.
*   **Secondary Channel (SMS)**: If the WhatsApp API returns a non-successful response or fails to respond, the `FallbackResolver` automatically intercepts the error and dispatches the code via MSG91 SendOTP SMS.
*   **Graceful Degradation**: If both providers fail, the transaction fails gracefully, and is logged in the `notification_logs` and `notification_analytics` tables for monitoring.

---

## 5. Developer & Testing Environment

*   **Mock Injection**: In development and test environments where `MSG91_AUTH_KEY` is not present in `.env.local`, the Dependency Injection factory (`createOtpService`) automatically wires `MockOtpProvider`.
*   **Local Console Logs**: Instead of making real API requests, mock providers output the generated 6-digit codes to the node console/logs to allow developers to retrieve and complete sign-up flows easily without cost.

---

## 6. Monitoring and Operations

*   **Logs**: All events are logged in the `notification_logs` table with statuses (`sent`, `delivered`, `failed`) and details like target, channel, provider name, and error messages.
*   **Telemetry**: Each event tracks performance metrics in the `notification_analytics` table, enabling dashboards to track delivery success rates, fallback triggers, and provider response times.
