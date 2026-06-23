# Rishtajodo Matrimony

**Dil se Dil ka Milan** — India's premium matrimonial platform.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (Strict Mode) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Payments | Razorpay |
| AI | Gemini + OpenAI |
| Email | Resend |
| Analytics | PostHog |
| Monitoring | Sentry |
| Hosting | Vercel |

## Project Structure

```
src/
├── app/                        # Next.js App Router routes
│   ├── (auth)/                 # Login, Register, Forgot Password
│   ├── admin/                  # Super Admin Panel (role-guarded)
│   ├── associate/              # Associate Panel (role-guarded)
│   ├── api/                    # API Route Handlers
│   │   ├── webhooks/razorpay/  # Razorpay webhook handler
│   │   └── ai/match/           # AI match generation endpoint
│   ├── unauthorized/           # 403 page
│   ├── robots.ts               # Dynamic robots.txt
│   ├── sitemap.ts              # Dynamic XML sitemap
│   ├── not-found.tsx           # 404 page
│   └── global-error.tsx        # Global error boundary
│
├── components/
│   └── ui/                     # shadcn/ui primitives
│
├── features/                   # Feature-based business modules
│   ├── auth/                   # Authentication flows
│   ├── admin/                  # Admin panel modules
│   ├── associate/              # Associate panel modules
│   ├── profiles/               # Matrimonial profiles
│   ├── matching/               # AI matchmaking
│   └── payments/               # Razorpay billing
│
├── hooks/                      # Shared React hooks
│   ├── use-user.ts
│   └── use-document-title.ts
│
├── lib/
│   ├── supabase/               # Supabase clients (browser, server, middleware)
│   ├── seo/                    # Metadata generators
│   ├── utils.ts                # Shared utilities (cn, formatCurrency, etc.)
│   └── constants.ts            # App-wide constants
│
├── providers/
│   └── theme-provider.tsx      # next-themes dark mode wrapper
│
├── styles/
│   └── globals.css             # Design system tokens + Tailwind
│
└── types/                      # TypeScript definitions
    ├── database.ts             # DB table row types
    ├── auth.ts                 # Auth types
    └── api.ts                  # API response types

supabase/
└── migrations/
    └── 0001_initial_schema.sql # Full DB schema + RLS policies
```

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env.local
# Fill in your Supabase, Razorpay, and other API keys
```

### 3. Run Database Migration

In your Supabase project SQL editor, run:
```
supabase/migrations/0001_initial_schema.sql
```

### 4. Start Development Server

```bash
npm run dev
```

## Associate Hierarchy

```
State Associate
  └── District Associate
        └── Block Associate
              └── Local Associate ← Only level that interacts with users
```

## Subscription Plans

| Plan | Price | Features |
|---|---|---|
| Free | ₹0 | 10 profiles/day, 5 interests/month |
| Gold | ₹2,999 | Unlimited profiles, contact details |
| Platinum | ₹4,999 | AI Matchmaking, dedicated associate |
| Elite | ₹9,999 | Personal matchmaker, background verification |
