# Rishtajodo Matrimony — Enterprise Design System

**Dil Se Dil Ka Milan**  
*The Premium, Elegant, and Secure Matrimonial Design Specification.*

---

## 1. Brand Philosophy
Rishtajodo is a hybrid matrimonial ecosystem merging self-service exploration with human-assisted matchmaking. The design philosophy is centered around three pillars:
- **Trust & Safety:** Visual cues must emphasize security, background checks, and verification.
- **Modern Elegance:** A premium aesthetic that appeals to modern youth while remaining respectful of traditional Indian values.
- **Emotional Warmth:** Highlighting matchmaking as a sacred union ("Dil Se Dil Ka Milan") using soft rose tones, glassmorphism, and elegant typography.

---

## 2. Color Palette

### 2.1 Core Palette
| Category | Token | HEX | RGB | Purpose |
|---|---|---|---|---|
| **Primary** | `rose-600` | `#E91E63` | `rgb(233, 30, 99)` | Core branding, interactive states, CTA backgrounds |
| **Secondary** | `rose-400` | `#FF4081` | `rgb(255, 64, 129)` | Accent decorations, ratings, secondary interactive states |
| **Accent** | `deep-pink` | `#F50057` | `rgb(245, 0, 87)` | Highlights, special labels, active navigation icons |
| **Light BG** | `slate-50` | `#F8FAFC` | `rgb(248, 250, 252)` | Main body background in light mode |
| **Dark BG** | `zinc-950` | `#09090B` | `rgb(9, 9, 11)` | Main body background in dark mode |
| **Border** | `zinc-200` | `#E4E4E7` | `rgb(228, 228, 231)` | Divider lines, input border boundaries |

### 2.2 System States
| Category | Token | HEX | Purpose |
|---|---|---|---|
| **Success** | `emerald-600` | `#059669` | Verification checkmarks, success states, paid transactions |
| **Warning** | `amber-500` | `#F59E0B` | Pending KYC status, warning dialog highlights |
| **Error** | `rose-650` | `#DC2626` | Field errors, system failures, rejected transactions |
| **Info** | `sky-600` | `#0284C7` | Information callouts, system updates, guide tooltips |

---

## 3. Typography
Rishtajodo uses a two-font typography system to blend traditional warmth with modern structure.
- **Headings (Display):** `Outfit` or `Playfair Display` (serif style for elegant headers).
- **Body & Controls:** `Inter` (sans-serif style for readability).

### 3.1 Heading Scale
- **H1 (Hero Headers):** `2.5rem` / `40px` (Bold)
- **H2 (Section Titles):** `2.0rem` / `32px` (SemiBold)
- **H3 (Sub-sections):** `1.5rem` / `24px` (Medium)
- **H4 (Component Headers):** `1.25rem` / `20px` (Medium)

### 3.2 Body Scale
- **Body Large:** `1.125rem` / `18px` (Regular/Medium)
- **Body Regular:** `1.0rem` / `16px` (Regular)
- **Body Small (Muted/Captions):** `0.875rem` / `14px` (Regular)
- **Body Micro:** `0.75rem` / `12px` (Medium)

---

## 4. Border Radius System
To maintain a modern, friendly feel, the system relies on rounded edges.
- **`radius-none`:** `0px`
- **`radius-xs`:** `4px` (Badges, Checkboxes)
- **`radius-sm`:** `8px` (Inputs, Buttons, Tabs)
- **`radius-md`:** `12px` (Dropdown menus, Select panels)
- **`radius-lg`:** `16px` (Standard Cards, Dialog boxes)
- **`radius-xl`:** `24px` (Hero containers, large banner modules)
- **`radius-full`:** `9999px` (Avatars, pill indicators)

---

## 5. Shadow System
Premium look-and-feel relies on soft, diffused shadows. Avoid harsh dark lines.
- **`shadow-sm`:** `0 1px 2px rgba(233, 30, 99, 0.05)` (Inputs, buttons)
- **`shadow-md`:** `0 4px 6px -1px rgba(233, 30, 99, 0.03), 0 2px 4px -1px rgba(0, 0, 0, 0.02)`
- **`shadow-lg`:** `0 10px 25px -5px rgba(233, 30, 99, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.02)` (Cards, sidebars)
- **`shadow-xl`:** `0 20px 35px -5px rgba(233, 30, 99, 0.1), 0 12px 15px -8px rgba(0, 0, 0, 0.03)` (Modals, popovers)

---

## 6. Spacing System
Based on an 8px grid structure for proportional scalability.
- **`space-1`:** `4px`
- **`space-2`:** `8px`
- **`space-3`:** `12px`
- **`space-4`:** `16px`
- **`space-6`:** `24px`
- **`space-8`:** `32px`
- **`space-12`:** `48px`
- **`space-16`:** `64px`

---

## 7. Button Design
Buttons must feature a hover transition speed of `300ms` with ease-out timing curves.

- **Primary Button:**
  - Background: Gradient from `#E91E63` to `#FF4081`.
  - Text: White.
  - Hover: Background color shifts right with scale factor `1.02`. Shadow increases to `shadow-md`.
- **Secondary Button:**
  - Background: `#FDF2F8` (pink-50).
  - Text: `#E91E63` (rose-600).
  - Hover: Background changes to `#FCE7F3` (pink-100).
- **Outline Button:**
  - Background: Transparent. Border: `1px solid #E4E4E7` (zinc-200).
  - Text: `#18181B` (zinc-900).
  - Hover: Border changes to `#E91E63`, background becomes light pink/zinc.
- **Ghost Button:**
  - Background: Transparent. Text: `#71717A` (zinc-500).
  - Hover: Background becomes `#F4F4F5`, text becomes `#18181B`.
- **Danger Button:**
  - Background: `#DC2626` (red-600). Text: White.
  - Hover: Background changes to `#B91C1C` (red-700).

---

## 8. Form Design

### 8.1 Input & Textarea
- **State Normal:** Border `1px solid #E4E4E7`. Height `40px` (inputs). Background `#FFFFFF`.
- **State Active/Focus:** Border `1px solid #E91E63`, box-shadow `0 0 0 2px rgba(233, 30, 99, 0.1)`.
- **State Error:** Border `1px solid #DC2626`, label text changes to red.

### 8.2 Custom Checkbox & Radio
- Checked state must be filled with primary pink color (`#E91E63`) containing a white check icon or center circle.
- Size: `16px` x `16px`. Transition: `transform 150ms cubic-bezier(0.4, 0, 0.2, 1)`.

---

## 9. Card Design

### 9.1 Profile Card
- Floating layout with 16px radius.
- Large background avatar photo with subtle overlay gradient to make text readable.
- Displays match score (`Match compatibility %`) in a top right floating badge.
- Bottom details: First name, Age, Location, Religion, and CTA buttons (Send Interest, Chat).

### 9.2 Match Card
- Split-screen comparison card.
- User profile on the left, match candidate on the right, connected by a center heart animation.
- Highlights common fields (e.g. Caste, Location, Education) with light-pink checkmarks.

### 9.3 Associate Card
- Features associate's photo, name, territory level badge (e.g., Local Associate).
- Shows ratings (1-5 stars) and active case loads to users to build credibility.

### 9.4 Dashboard Card
- Modern card with high-contrast icon.
- Displays key metric (e.g., "12 Verified Matches", "₹ 2,400 Commission").
- Includes a bottom text indicator showing weekly progress.

---

## 10. Table Design
- Used primarily in Admin and Associate dashboards.
- Columns must be aligned logically: text columns left-aligned, monetary columns right-aligned, status badges centered.
- Table headers: Background `#F8FAFC`, uppercase label, font-size `0.75rem` (medium weight).
- Hover: Rows must fade to `#FCE7F3` (pink-50/5) on hover to provide visual cues.

---

## 11. Badge Design

- **Verified Badge:**
  - Style: Green background (`#ECFDF5`), Emerald-600 text, shield/checkmark icon.
- **Premium Badge:**
  - Style: Gold gradient background, Amber-800 text, crown icon.
- **Associate Badge:**
  - Style: Dark zinc background (`#F4F4F5`), text matching the level (e.g. Local/Block).

---

## 12. Dashboard Design

### 12.1 User Dashboard
- Visual highlight: Hero welcome message with name, subscription tier, and quick match count.
- Dynamic carousel of AI recommendations.
- Quick widgets: "Interests Received", "Messages Pending".

### 12.2 Associate Dashboard
- Left navigation sidebar containing: Cases CRM, Team management, Wallet transactions, Chat inbox.
- Focus is on case priority lists (urgent cases needing recommendations are flagged in red).

### 12.3 Admin Dashboard
- System health monitors, verification pipelines, disputes list, and audit logging table views.

---

## 13. Mobile Design Rules
- Bottom navigation bar (Home, Matches, Chat, Profile) must be fixed at `56px` height.
- Minimum tap target size: `48px` x `48px` to ensure touch comfort.
- Horizontal page padding: `16px` (space-4) to prevent text clippings on curved screens.

---

## 14. Dark Mode Rules
- Avoid pure pitch black (`#000000`) for surfaces; use zinc-950 (`#09090B`) or slate-900 (`#0F172A`).
- Primary pink `#E91E63` remains standard but increase opacity of transparent overlays to avoid wash-outs.
- Text: Pure white `#FFFFFF` for primary headers, `#A1A1AA` (zinc-400) for muted description body.

---

## 15. Accessibility Rules
- Color contrast ratio must hit **WCAG AAA** levels (contrast ratio `4.5:1` minimum for small text, `3.0:1` for headers).
- Interactive buttons and links must feature standard `aria-label` attributes.
- Screen readers must be supported by declaring logical HTML headings (`h1` to `h6`) chronologically.

---

## 16. Animation Rules
- **Hover Scale:** `transform: scale(1.02)` with duration `200ms` for cards.
- **Transitions:** Use `cubic-bezier(0.16, 1, 0.3, 1)` for clean page entries.
- **Page Entrance:** Soft slide-in from bottom (`y: 10px`, duration `300ms`).

---

## 17. Loading Skeleton Rules
- Use skeleton loaders instead of generic spinning indicators.
- Skeletons must feature a light gray/pink background pulse animation (`duration: 1.5s`, infinite).
- Match card skeleton must replicate card shapes exactly (circle for avatar, rounded rectangle for text blocks).

---

## 18. Empty State Rules
- Must feature a custom, romantic heart-based line-art illustration (no blank pages).
- Bold headline (e.g., "No Match Recommendations Today").
- Actionable suggestion (e.g., "Broaden your partner preferences to find more profiles").
- Primary CTA button (e.g., "Edit Preferences").

---

## 19. Notification Design
- Displayed as a floating drawer or drop-down.
- Type-based color branding: Interest received (pink indicator), chat messages (blue), verifications (green).
- Red badge dot on the notification icon indicates unread status.

---

## 20. Toast Design
- Utilizes `Sonner` toast engine.
- Floating container at top-right on desktop, bottom-center on mobile.
- Features custom iconography matching toast type (Success: green check, Error: red circle).

---

## 21. Branding Rules
- Logo must always maintain clear margins (minimum space `24px` on all sides).
- Do not skew, distort, or change the color profile of the logo.
- Font pairing of Outfit/Inter must be preserved on all official screens.

---

## 22. Iconography Rules
- Lucide React is the standard icon pack.
- Stroke width: `2px` for normal interface icons, `1.5px` for large dashboard hero banners.
- Icon dimensions: `20px` x `20px` (controls), `24px` x `24px` (headers/sidebar).

---

## 23. Image Style Rules
- Standard user photos must feature soft, rounded corners (`radius-lg`).
- Apply a glassmorphic blurred overlay for premium locked content.
- Photos must contain high-contrast drop-shadows to separate them from clean white backgrounds.

---

## 24. Profile Photo Rules
- Allowed formats: JPEG, PNG, WebP. Maximum file size: 5MB.
- Photos must be run through a standard moderation pipeline. Unverified photos are blurred with a "Pending Verification" badge.
- Main profile photo must clearly show the candidate's face.

---

## 25. Associate Branding Rules
- Local Associates are labeled "Matchmaker Associate" to users.
- Materialized performance badges (e.g., "Top Rated", "50+ Success Stories") are automatically shown on their public badges.
- All associate profiles must feature standard, verified professional avatars.
