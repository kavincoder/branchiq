# UI Flow & Design Specification Document
## BranchIQ — AI-Powered Branch Banking Management System

**Version:** 1.0 | **Date:** 2026-04-19 | **Status:** Draft  
**Target:** Claude Design — Full UI Generation Specification

---

## DOCUMENT PURPOSE

This document is a complete design specification for BranchIQ, an internal banking web application for single-branch bank staff. It includes the full design system, component specifications, screen-by-screen layouts, user flows, and responsive behavior. Every detail needed to generate a production-ready UI is defined here.

The app must look and feel like it was built by a senior product design team — premium fintech aesthetic, not a generic admin template. Think Razorpay Dashboard meets Stripe Atlas.

---

# PART 0 — DESIGN CONTEXT & REFERENCE DATA

---

## 0.1 Visual References (What the UI Should Look Like)

Claude Design must use the following real products as visual benchmarks. Match the quality and feel of these UIs exactly.

### Primary Reference: Razorpay Dashboard
**URL:** https://dashboard.razorpay.com  
**What to copy:**
- Top navigation bar with clean white background and subtle shadow
- Large bold metric numbers on summary cards with colored icon circles
- Clean data tables with hover states and action buttons on row hover
- Navy/dark blue as the primary brand color throughout
- Generous whitespace between sections — never cramped
- Typography that is crisp and highly readable at small sizes

### Secondary Reference: Stripe Dashboard
**URL:** https://dashboard.stripe.com  
**What to copy:**
- The way large financial numbers are displayed — monospace font, prominent, easy to scan
- Status badges — small, pill-shaped, softly colored backgrounds (not harsh colors)
- The overall "professional but not corporate" feel
- Smooth hover transitions on interactive elements
- Clean pagination style below tables

### Tertiary Reference: Linear App
**URL:** https://linear.app  
**What to copy:**
- Micro-interaction quality — everything feels smooth and intentional
- Keyboard-friendly UI feel
- Clean sidebar/nav hover states
- Minimal use of color — color is used for meaning, not decoration

### Anti-reference (Do NOT look like this):
- Generic Bootstrap admin templates (e.g. AdminLTE, CoreUI)
- Dark dashboard templates with neon accent colors
- Old-school banking portals (SBI/PNB net banking UI style)
- Tables with heavy black borders everywhere

---

## 0.2 Logo Specification

Since no logo file is provided, Claude Design should render it from this exact spec:

### Wordmark Logo (used in nav bar, login page)
```
Text:      BranchIQ
"Branch":  Font Inter, Weight 700, Color #1A3C6E, Size 20px
"IQ":      Font Inter, Weight 800, Color #2E6BE6, Size 20px
Spacing:   Letter-spacing -0.5px, no space between "Branch" and "IQ"
```

### Icon Mark (used in favicon, mobile nav, loading screen)
```
Shape:     32×32px rounded square (border-radius 8px)
Background: Linear gradient — #1A3C6E top-left to #2E6BE6 bottom-right
Content:   Letter "B" in white, Inter Bold, 18px, centered
Shadow:    0 2px 8px rgba(26, 60, 110, 0.3)
```

### Logo Usage Rules
- On white background: use full color wordmark
- On navy/dark background: use all-white wordmark
- Minimum clear space: 16px on all sides
- Never stretch, rotate, or change the colors

---

## 0.3 Realistic Sample Data (Use These in UI Mockups)

Claude Design should populate all screens with these realistic Indian banking values — not generic placeholder data like "Lorem Ipsum" or "$1,234".

### Summary Card Values (Dashboard)
| Card | Value | Trend |
|---|---|---|
| Total Deposits (this month) | ₹2,10,000 | +18.2% vs last month (green) |
| Total Withdrawals (this month) | ₹60,000 | -7.4% vs last month (green — lower is good) |
| Active Loans | 23 | +2 new this month (blue) |
| Loan Portfolio | ₹87,50,000 | +3.1% vs last month (green) |
| Total Investments | ₹18,50,000 | No change (gray) |

### Sample Account Numbers & Names
```
ACC-2026-0023  →  Ravi Kumar         (Active)
ACC-2026-0007  →  Meena Iyer         (Active)
ACC-2026-0015  →  Suresh Pillai      (Active)
ACC-2026-0031  →  Anita Rao          (Active)
ACC-2026-0042  →  Mohammed Farhan    (Active)
ACC-2026-0008  →  Kavitha Nair       (Closed)
```

### Sample Transaction Table Data (Recent Transactions)
```
TXN-2026-0145 | ACC-2026-0023 | Ravi Kumar       | Deposit        | ₹75,000    | 19 Apr 2026 09:15 | Priya S.
TXN-2026-0144 | ACC-2026-0007 | Meena Iyer       | Loan Repayment | ₹12,500    | 19 Apr 2026 08:45 | John D.
TXN-2026-0143 | ACC-2026-0015 | Suresh Pillai    | Withdrawal     | ₹25,000    | 18 Apr 2026 16:30 | Priya S.  ← ANOMALY FLAG
TXN-2026-0142 | ACC-2026-0031 | Anita Rao        | Deposit        | ₹1,50,000  | 18 Apr 2026 14:20 | John D.
TXN-2026-0141 | ACC-2026-0007 | Meena Iyer       | Transfer       | ₹30,000    | 18 Apr 2026 11:05 | Priya S.
TXN-2026-0140 | ACC-2026-0042 | Mohammed Farhan  | Deposit        | ₹50,000    | 17 Apr 2026 15:50 | John D.
TXN-2026-0139 | ACC-2026-0023 | Ravi Kumar       | Loan Repayment | ₹8,333     | 17 Apr 2026 10:00 | Priya S.
TXN-2026-0138 | ACC-2026-0015 | Suresh Pillai    | Withdrawal     | ₹7,50,000  | 17 Apr 2026 02:14 | Priya S.  ← ANOMALY (large + odd hour)
TXN-2026-0137 | ACC-2026-0031 | Anita Rao        | Deposit        | ₹20,000    | 16 Apr 2026 12:30 | John D.
TXN-2026-0136 | ACC-2026-0042 | Mohammed Farhan  | Loan Repayment | ₹15,000    | 16 Apr 2026 09:45 | Priya S.
```

### Sample Loan Records
```
LN-2026-0012 | ACC-2026-0023 | Ravi Kumar      | ₹2,00,000 | 12.5% | Outstanding: ₹1,87,450 | Active   | End: Apr 2029
LN-2026-0008 | ACC-2026-0007 | Meena Iyer      | ₹75,000   | 10.0% | Outstanding: ₹52,340   | Active   | End: Jan 2028
LN-2026-0003 | ACC-2026-0015 | Suresh Pillai   | ₹5,00,000 | 14.0% | Outstanding: ₹4,21,800 | Active   | End: Jun 2030
LN-2025-0019 | ACC-2026-0008 | Kavitha Nair    | ₹1,00,000 | 11.0% | Outstanding: ₹0        | Closed   | End: Mar 2026
LN-2026-0001 | ACC-2026-0042 | Mohammed Farhan | ₹3,50,000 | 13.5% | Outstanding: ₹3,12,900 | Defaulted| End: Dec 2027
```

### Sample Staff Users
```
USR-2026-0001 | Arjun Menon     | arjun.manager | Manager | Active
USR-2026-0002 | Priya Sharma    | priya.staff   | Staff   | Active
USR-2026-0003 | John David      | john.staff    | Staff   | Active
USR-2026-0004 | Sneha Kulkarni  | sneha.staff   | Staff   | Inactive
```

---

## 0.4 Sample Chart Datasets (Use Exact Values in Charts)

### Monthly Trend Chart (Line Chart — Dashboard)
6 months of Deposits vs Withdrawals vs Loan Repayments:

```
Month       | Deposits    | Withdrawals | Loan Repayments
------------|-------------|-------------|----------------
Nov 2025    | ₹3,20,000   | ₹95,000     | ₹72,000
Dec 2025    | ₹4,10,000   | ₹1,20,000   | ₹85,000
Jan 2026    | ₹3,80,000   | ₹88,000     | ₹79,000
Feb 2026    | ₹4,50,000   | ₹1,10,000   | ₹91,000
Mar 2026    | ₹5,00,000   | ₹1,30,000   | ₹90,000
Apr 2026    | ₹2,10,000   | ₹60,000     | ₹85,000  (partial month)
```
Deposits line color: #2E6BE6 | Withdrawals line color: #EF4444 | Repayments line color: #10B981

### Portfolio Breakdown (Donut Chart — Dashboard)
```
Loans:       ₹87,50,000  →  58.3%  →  Color: #2E6BE6
Deposits:    ₹45,00,000  →  30.0%  →  Color: #10B981
Investments: ₹18,50,000  →  12.3%  →  Color: #F59E0B  (missing ₹3L unallocated — show as gray "Other" if needed)
Center text: ₹1,51,00,000 (Total Portfolio)
```

### AI Insights — Monthly Comparison (Bar Chart)
This month (Apr 2026, partial) vs Last month (Mar 2026):
```
Category          | This Month  | Last Month  | Change
------------------|-------------|-------------|--------
Deposits          | ₹2,10,000   | ₹5,00,000   | -58% (partial month — add note)
Withdrawals       | ₹60,000     | ₹1,30,000   | -53.8%
Loan Repayments   | ₹85,000     | ₹90,000     | -5.6%
```
This month bars: #2E6BE6 | Last month bars: #E2E8F0 (light gray)

### Loan Repayment Performance (Donut Chart — AI Insights)
```
On-time payments:   78.3%  →  Color: #10B981 (green)
Late payments:      18.2%  →  Color: #F59E0B (amber)
Defaulted:           3.5%  →  Color: #EF4444 (red)
Center text: "78.3% On-Time"
```

### AI Anomaly Scores (Sample Flagged Transactions)
```
TXN-2026-0138 | Suresh Pillai | Withdrawal ₹7,50,000 at 02:14 | Score: 0.94 (RED)   | Reason: Unusually large amount at odd hours
TXN-2026-0143 | Suresh Pillai | Withdrawal ₹25,000 repeated   | Score: 0.71 (ORANGE)| Reason: Repeated withdrawals same account same day
TXN-2026-0102 | Anita Rao     | Transfer ₹2,80,000            | Score: 0.63 (ORANGE)| Reason: Amount 4x above account average
```

---

# PART 1 — DESIGN SYSTEM

---

## 1.1 Brand Identity

**Product Name:** BranchIQ  
**Tagline:** Smart Banking, Simplified  
**Logo:** Wordmark "BranchIQ" — "Branch" in Navy Bold, "IQ" in Bright Blue Bold  
**Logo Icon:** A small square icon with a subtle "B" monogram in white on navy — used in favicon and mobile  
**Personality:** Trustworthy, intelligent, fast, professional  
**Inspiration:** Razorpay Dashboard, Stripe Atlas, Linear App

---

## 1.2 Color Palette

### Primary Colors
| Name | Hex | Usage |
|---|---|---|
| Navy Primary | `#1A3C6E` | Main brand color, nav bar, headings, primary buttons |
| Bright Blue | `#2E6BE6` | Hover states, links, highlights, accent elements |
| Navy Dark | `#0F2547` | Pressed button states, dark text on light backgrounds |
| Navy Pale | `#E8EEF7` | Card backgrounds, table headers, section tints |

### Neutral Colors
| Name | Hex | Usage |
|---|---|---|
| Background | `#F8FAFC` | App background — very light cool gray |
| Surface White | `#FFFFFF` | Cards, panels, modals, nav bar |
| Border Light | `#E2E8F0` | Card borders, table borders, dividers |
| Border Medium | `#CBD5E1` | Form input borders |
| Text Primary | `#0F172A` | Main body text, headings |
| Text Secondary | `#475569` | Subtext, labels, descriptions |
| Text Muted | `#94A3B8` | Placeholder text, timestamps |

### Status Colors
| Name | Hex | Usage |
|---|---|---|
| Success Green | `#10B981` | Deposits, active status, success alerts |
| Success Pale | `#ECFDF5` | Success alert backgrounds |
| Warning Amber | `#F59E0B` | Pending status, warnings |
| Warning Pale | `#FFFBEB` | Warning alert backgrounds |
| Danger Red | `#EF4444` | Deletions, error messages, defaulted loans |
| Danger Pale | `#FEF2F2` | Error alert backgrounds |
| Anomaly Red | `#DC2626` | AI anomaly flags — strong red |
| Anomaly Pale | `#FEE2E2` | Anomaly row highlights |

### Chart Colors (Recharts)
`#2E6BE6` (Blue), `#10B981` (Green), `#F59E0B` (Amber), `#8B5CF6` (Purple), `#EF4444` (Red), `#06B6D4` (Cyan)

---

## 1.3 Typography

**Primary Font:** Inter (Google Fonts)  
**Monospace Font:** JetBrains Mono (for IDs, transaction codes, amounts in tables)  
**Font Import:** `https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap`

| Style | Size | Weight | Line Height | Usage |
|---|---|---|---|---|
| Display | 36px | 800 | 1.2 | Hero numbers on dashboard cards |
| Heading 1 | 28px | 700 | 1.3 | Page titles |
| Heading 2 | 22px | 700 | 1.35 | Section headings |
| Heading 3 | 18px | 600 | 1.4 | Card titles, panel headers |
| Heading 4 | 16px | 600 | 1.4 | Sub-section titles |
| Body Large | 16px | 400 | 1.6 | Important body copy |
| Body | 14px | 400 | 1.6 | Default text, table content |
| Body Small | 13px | 400 | 1.5 | Secondary info, captions |
| Label | 12px | 500 | 1.4 | Form labels, table column headers |
| Mono | 13px | 500 | 1.4 | IDs, amounts, codes (JetBrains Mono) |

---

## 1.4 Spacing System (8px Grid)

All spacing must follow the 8px grid system for visual consistency.

| Token | Value | Usage |
|---|---|---|
| space-1 | 4px | Icon gaps, tight inline spacing |
| space-2 | 8px | Small padding, compact elements |
| space-3 | 12px | Badge padding, small card padding |
| space-4 | 16px | Standard padding, form field gap |
| space-5 | 20px | Card internal padding |
| space-6 | 24px | Section spacing, large padding |
| space-8 | 32px | Between major sections |
| space-10 | 40px | Page top padding |
| space-12 | 48px | Large section breaks |

---

## 1.5 Border Radius

| Token | Value | Usage |
|---|---|---|
| radius-sm | 4px | Badges, status tags |
| radius-md | 8px | Buttons, form inputs, small cards |
| radius-lg | 12px | Main cards, panels |
| radius-xl | 16px | Modals, drawers, large cards |
| radius-full | 9999px | Pills, avatar circles |

---

## 1.6 Shadows & Elevation

| Level | CSS Shadow | Usage |
|---|---|---|
| Shadow XS | `0 1px 2px rgba(0,0,0,0.05)` | Table rows hover |
| Shadow SM | `0 2px 4px rgba(0,0,0,0.07)` | Buttons, badges |
| Shadow MD | `0 4px 12px rgba(0,0,0,0.08)` | Cards, nav bar |
| Shadow LG | `0 8px 24px rgba(0,0,0,0.10)` | Drawers, dropdowns |
| Shadow XL | `0 16px 40px rgba(0,0,0,0.12)` | Modals |

---

## 1.7 Icons

**Icon Library:** Lucide React (consistent, clean, open-source)  
**Icon Sizes:** 16px (inline), 20px (nav), 24px (card icons), 32px (empty states)  
**Icon Style:** Stroke icons, 1.5px stroke weight — never filled icons

---

# PART 2 — COMPONENT SPECIFICATIONS

---

## 2.1 Navigation Bar (Top)

**Position:** Fixed top, full width  
**Height:** 64px  
**Background:** `#FFFFFF` with `Shadow MD`  
**Border Bottom:** 1px `#E2E8F0`  
**Z-index:** 100

**Left Section:**
- BranchIQ logo — "Branch" in `#1A3C6E` Bold + "IQ" in `#2E6BE6` Bold
- Font size: 20px, letter-spacing: -0.5px

**Center Section (Navigation Links):**
- Dashboard
- Transactions
- Portfolio ▼ (dropdown: Loans / Deposits / Investments)
- AI Insights
- Export
- Link style: 14px, Medium, `#475569`
- Active link: 14px, SemiBold, `#1A3C6E`, with a 2px bottom border in `#2E6BE6`
- Hover: background `#F8FAFC`, rounded `radius-md`, color `#1A3C6E`
- Spacing between links: 4px

**Right Section:**
- Global Search Bar — 240px wide, `#F8FAFC` background, `#E2E8F0` border, `radius-md`, placeholder "Search anything..." with search icon
- Notification Bell icon — shows red badge with count when AI anomalies exist
- Divider line (1px `#E2E8F0`)
- User Avatar circle (32px, initials, `#1A3C6E` background, white text)
- User Name + Role in small text
- Chevron down → dropdown: My Profile / Logout (and for Manager: User Management / Audit Logs / Settings)

**Portfolio Dropdown:**
- Opens on click
- White background, `Shadow LG`, `radius-lg`
- Items: Loans, Deposits, Investments — each with icon + label
- Width: 180px

---

## 2.2 Buttons

**Primary Button:**
- Background: `#1A3C6E` → Hover: `#0F2547` → Active: `#2E6BE6`
- Text: White, 14px, SemiBold
- Padding: 10px 20px
- Border Radius: 8px (`radius-md`)
- Shadow: `Shadow SM`
- Transition: 150ms ease

**Secondary Button:**
- Background: White, Border: 1px `#E2E8F0`
- Text: `#1A3C6E`, 14px, SemiBold
- Hover: Background `#F8FAFC`, Border `#CBD5E1`
- Same padding and radius as primary

**Danger Button:**
- Background: `#EF4444` → Hover: `#DC2626`
- Text: White
- Used only for delete actions

**Ghost Button:**
- No background, no border
- Text: `#2E6BE6`, 14px, Medium
- Hover: Background `#E8EEF7`
- Used for cancel, back actions

**Icon Button:**
- 36px × 36px square, `radius-md`
- Ghost style with icon only
- Hover: `#F8FAFC` background

---

## 2.3 Form Elements

**Text Input:**
- Height: 40px
- Background: `#FFFFFF`
- Border: 1px `#CBD5E1`, `radius-md`
- Focus: Border `#2E6BE6`, box-shadow `0 0 0 3px #E8EEF7`
- Font: 14px, `#0F172A`
- Placeholder: 14px, `#94A3B8`
- Label: 12px, Medium, `#475569`, 6px above input

**Select Dropdown:**
- Same style as text input
- Arrow icon on right: `#94A3B8`

**Date Picker:**
- Same style as text input
- Calendar icon on right

**Textarea:**
- Min height: 80px
- Same style as text input
- Resize: vertical only

**Form Error State:**
- Border: `#EF4444`
- Error message below: 12px, `#EF4444`, with warning icon

**Amount Input (INR):**
- Left prefix "₹" in `#475569`, separated by border
- Monospace font for the number

---

## 2.4 Dashboard Cards (Summary Cards)

**Size:** Min height 120px, full width divided in 4 columns  
**Background:** `#FFFFFF`  
**Border:** 1px `#E2E8F0`  
**Border Radius:** `radius-lg` (12px)  
**Shadow:** `Shadow MD`  
**Padding:** 24px  
**Hover:** Shadow lifts to `Shadow LG`, subtle transform `translateY(-2px)`, transition 200ms

**Card Structure:**
- Top row: Icon (in colored circle, 40px) on left + Trend badge on right (e.g. "+12% this month" in green or red)
- Middle: Large display number (36px, 800 weight, `#0F172A`) — use JetBrains Mono
- Bottom: Label (14px, `#475569`)
- Bottom right: small sparkline mini-chart (optional but premium touch)

**Card Color Variants:**
- Total Deposits: Icon circle `#ECFDF5`, Icon `#10B981` (trending up arrow)
- Total Withdrawals: Icon circle `#FEF2F2`, Icon `#EF4444` (trending down arrow)
- Active Loans: Icon circle `#E8EEF7`, Icon `#1A3C6E` (file text icon)
- Total Investments: Icon circle `#FFFBEB`, Icon `#F59E0B` (chart icon)
- Loan Amount: Icon circle `#F5F3FF`, Icon `#8B5CF6` (bank icon)

---

## 2.5 Data Tables

**Table Container:** White background, `radius-lg`, `Shadow MD`, border `#E2E8F0`  
**Header Row:** Background `#F8FAFC`, height 44px, border-bottom 1px `#E2E8F0`  
**Header Text:** 12px, Medium (500), `#475569`, uppercase, letter-spacing 0.5px  
**Data Row Height:** 52px  
**Alternating Rows:** White / `#FAFBFC`  
**Row Hover:** Background `#F0F4FF`, transition 100ms  
**Border:** Bottom border on each row, `#F1F5F9`  
**Cell Padding:** 16px horizontal, 0 vertical (centered vertically)

**Special Cell Types:**
- Amount cells: JetBrains Mono, right-aligned, `#0F172A`
- ID cells: JetBrains Mono, `#2E6BE6`, clickable
- Date cells: 13px, `#475569`
- Staff name cells: 14px, `#0F172A` with small avatar circle prefix
- Action cells: Icon buttons (edit, delete) — visible on row hover only

**Table Footer:** Pagination controls — Previous / Page numbers / Next — right-aligned below table

---

## 2.6 Status Badges / Tags

**Active:** Background `#ECFDF5`, Text `#059669`, Font 12px Medium, Padding 4px 10px, `radius-full`  
**Closed:** Background `#F1F5F9`, Text `#475569`, same style  
**Defaulted:** Background `#FEF2F2`, Text `#DC2626`, same style  
**Pending:** Background `#FFFBEB`, Text `#D97706`, same style  
**Matured:** Background `#EFF6FF`, Text `#2563EB`, same style  
**Anomaly Flag:** Background `#FEE2E2`, Text `#DC2626`, with warning icon, `radius-sm`

---

## 2.7 Slide-In Drawer (Forms)

**Trigger:** Clicking "Add Transaction", "New Loan", "Add Deposit" etc.  
**Animation:** Slides in from right, 300ms ease-out  
**Width:** 480px (desktop), 100% (mobile)  
**Background:** `#FFFFFF`  
**Shadow:** `Shadow XL` on left edge  
**Overlay:** Semi-transparent black overlay `rgba(0,0,0,0.3)` on rest of page

**Drawer Structure:**
- Header (64px): Title left + X close button right, border-bottom `#E2E8F0`
- Body (scrollable): Form fields with 24px padding, 16px gap between fields
- Footer (72px): Cancel (Ghost) + Submit (Primary) buttons right-aligned, border-top `#E2E8F0`

---

## 2.8 Alert Banners

**AI Anomaly Banner (Dashboard top):**
- Full width, height 48px
- Background: `#FEE2E2`, left border 4px `#DC2626`
- Icon: Warning triangle `#DC2626`
- Text: "3 suspicious transactions detected. View Anomalies →"
- Dismissable (X button right)

**Success Toast:**
- Bottom right corner, 300px wide
- Background: White, left border 4px `#10B981`
- Icon: Check circle `#10B981`
- Auto-dismiss after 4 seconds

**Error Toast:** Same structure, border `#EF4444`, icon red X

---

## 2.9 Charts (Recharts)

**Line Chart (Monthly Trend):**
- Smooth curved lines (`type="monotone"`)
- Grid lines: `#F1F5F9`, horizontal only
- Axis text: 12px, `#94A3B8`
- Tooltip: White background, `Shadow LG`, `radius-md`
- Legend: Below chart, pill-style

**Bar Chart (Category Comparison):**
- Rounded top corners (`radius=[4,4,0,0]`)
- Bar gap: 4px
- Same grid + tooltip style

**Pie / Donut Chart (Portfolio Breakdown):**
- Donut style (inner radius 60%)
- Center text: total amount in large mono font
- Legend: Right side, stacked vertically

**Area Chart (Trend fills):**
- Gradient fill from color to transparent
- Used for investment growth visualization

---

# PART 3 — SCREENS & LAYOUTS

---

## Screen 1: Login Page

**Layout:** Split screen — 50% left / 50% right  
**Breakpoint:** Below 768px collapses to single centered card

**Left Panel (Brand Side):**
- Full height, background: Navy gradient `linear-gradient(135deg, #1A3C6E 0%, #0F2547 100%)`
- Top left: BranchIQ logo in white
- Center: Large headline "Banking Intelligence, Built for Your Branch" in white, 36px, Bold
- Below: 3 feature highlights with check icons (white) — "Real-time Transaction Tracking", "AI Anomaly Detection", "Instant Excel Reports"
- Bottom: Subtle geometric pattern or abstract wave — adds premium feel
- Bottom left: Small text "Secure internal portal — authorized staff only" in `rgba(255,255,255,0.5)`

**Right Panel (Form Side):**
- Background: `#F8FAFC`
- Center-aligned vertically
- Top: BranchIQ small logo + "Staff Portal"
- Heading: "Welcome back" (28px, Bold, `#0F172A`)
- Subtext: "Sign in to your branch dashboard" (`#475569`)
- Form:
  - Username input with user icon
  - Password input with lock icon + show/hide toggle
  - "Sign In" primary button (full width, 48px height)
- Bottom: "Having trouble signing in? Contact your branch manager"
- No "Forgot password" — passwords managed by manager only

---

## Screen 2: Dashboard

**Page Title:** "Dashboard" + today's date right-aligned  
**Top:** AI Anomaly banner (if anomalies exist)

**Row 1 — Summary Cards (5 cards in a row, responsive to 2-3 on smaller screens):**
1. Total Deposits (green icon)
2. Total Withdrawals (red icon)
3. Active Loans (navy icon)
4. Total Loan Portfolio (purple icon)
5. Total Investments (amber icon)

**Row 2 — Charts (2 columns: 60% + 40%):**
- Left (60%): Monthly Trend Line Chart — Deposits vs Withdrawals over last 6 months
- Right (40%): Portfolio Breakdown Donut Chart — Loans / Deposits / Investments

**Row 3 — Tables + Insights (2 columns: 65% + 35%):**
- Left (65%): Recent Transactions Table — last 10 transactions with columns: ID, Type, Account, Amount, Date, Staff, Status
- Right (35%): Quick Insights Panel — 3-4 AI insight bullets with trend arrows ("Withdrawals up 18% this month", "2 loans near maturity")

**Page Actions (top right):**
- "Run AI Analysis" button (primary) — triggers analysis, shows loading spinner
- "Export" button (secondary) — opens export options

---

## Screen 3: Transactions Page

**Page Header:** "Transactions" title + "Add Transaction" button (top right, primary)

**Filter Bar (below header):**
- Search input (left) — "Search by ID or account..."
- Type dropdown: All / Deposit / Withdrawal / Transfer / Loan Repayment
- Date range picker: From — To
- "Reset Filters" ghost button

**Transactions Table:**
Columns: Transaction ID | Account No. | Holder Name | Type (badge) | Amount | Date & Time | Logged By | Actions

- Type column: color-coded badges (Deposit=green, Withdrawal=red, Transfer=blue, Loan Repayment=purple)
- Amount: JetBrains Mono, right-aligned, green for deposits, red for withdrawals
- Anomaly rows: full row background `#FEE2E2` with warning icon in ID cell
- Actions (visible on hover): Edit icon (pencil) + Delete icon (trash) — Manager only

**Pagination:** Below table, showing "Showing 1-20 of 145 transactions"

**Add Transaction Drawer (slides in from right):**
Fields: Account Number (searchable dropdown) | Transaction Type | Amount (₹ prefix) | Date & Time | Loan ID (shows only if type = Loan Repayment) | Transfer To (shows only if type = Transfer) | Notes
Footer: Cancel + "Save Transaction"

---

## Screen 4: Loans Page

**Page Header:** "Loan Portfolio" + "Add Loan" button (top right)

**Summary Bar (below header, 3 stat cards inline):**
- Total Active Loans | Total Principal | Total Outstanding Balance

**Filter Bar:**
- Search input
- Status filter: All / Active / Closed / Defaulted
- Account number search

**Loans Table:**
Columns: Loan ID | Account No. | Holder Name | Principal | Interest Rate | Outstanding Balance | Start Date | End Date | Status | Actions

- Outstanding Balance: Auto-calculated, shown in JetBrains Mono
- Status badges: Active=green, Closed=gray, Defaulted=red
- Row click → navigates to Loan Detail Page

**Add Loan Drawer:**
Fields: Account Number (searchable) | Principal Amount | Annual Interest Rate (%) | Start Date | End Date | Purpose (textarea)
Auto-shows calculated quarterly compound interest formula result below interest rate field.

---

## Screen 5: Loan Detail Page

**Back button:** "← Back to Loans" top left

**Two-column layout:**

**Left Column (60%) — Loan Information Card:**
- Loan ID badge at top
- Grid of fields: Account Number, Holder Name, Principal, Interest Rate, Start Date, End Date, Purpose
- Status badge (large, prominent)
- Outstanding Balance (large display number, navy)
- Total Paid (smaller, green)
- Compound interest formula shown clearly: A = P(1 + r/4)^(4t)

**Right Column (40%) — Repayment History Card:**
- "Repayment History" heading
- Timeline-style list of all repayments: Date | Amount | Logged By
- Each entry has a green circle with check icon on left
- "No repayments yet" empty state if none

**Below — Repayment Progress Bar:**
- Horizontal progress bar: Total Paid vs Total Owed
- Color: Green fills from left to right
- Percentage label inside bar

---

## Screen 6: Deposits Page

**Page Header:** "Deposit Portfolio" + "Add Deposit" button

**Summary Bar:** Total Active Deposits | Total Deposit Amount | Total Fixed Deposits

**Filter Bar:** Search | Deposit Type: All/Fixed/Savings | Status filter

**Deposits Table:**
Columns: Deposit ID | Holder Name | Amount | Type (badge) | Interest Rate | Start Date | Maturity Date | Maturity Amount | Status | Actions

**Add Deposit Drawer:**
Fields: Holder Name | Phone | Deposit Amount (₹) | Deposit Type | Interest Rate | Start Date | Maturity Date
Auto-calculates Maturity Amount and shows preview below form.

---

## Screen 7: Investments Page

**Page Header:** "Investment Portfolio" + "Add Investment" button

**Summary Bar:** Total Invested | Expected Returns | Active Investments

**Filter Bar:** Search | Type filter | Status filter

**Investments Table:**
Columns: Investment ID | Type (badge) | Amount | Investment Date | Expected Return % | Expected Maturity Amount | Maturity Date | Status | Actions

**Investment Type Badges:**
- Govt Bond: Navy blue
- Mutual Fund: Purple
- Fixed Deposit: Amber

**Add Investment Drawer:**
Fields: Investment Type | Amount | Investment Date | Expected Return Rate (%) | Maturity Date | Notes

---

## Screen 8: AI Insights Page

**Page Header:** "AI Insights" + last analysis timestamp + "Run Analysis" button (primary, top right)

**Section 1 — Anomaly Detection (full width card):**
- Header with warning icon: "Transaction Anomalies"
- Sub-text: "X flagged transactions from last analysis on [date]"
- Anomaly transactions table: ID | Account | Type | Amount | Date | Reason | Score (0-1)
- Score shown as a colored progress bar: 0.0-0.5 yellow, 0.5-0.8 orange, 0.8-1.0 red
- "No anomalies detected" empty state with green check when clean

**Section 2 — Spending Insights (3 columns):**
- Column 1: Monthly Comparison Card — bar chart comparing this month vs last month (Deposits, Withdrawals, Repayments)
- Column 2: Loan Performance Card — donut chart showing on-time vs late repayments %
- Column 3: Trend Alerts Card — bulleted list of AI-generated text insights with trend arrows

**Section 3 — 6-Month Trend (full width):**
- Area chart: Deposits / Withdrawals / Loan Repayments over 6 months
- Gradient fills for each series

**Run Analysis State:**
- "Run Analysis" button shows loading spinner while running
- Progress indicator: "Scanning 512 transactions..."
- On complete: Success toast + page auto-refreshes with new data

---

## Screen 9: Export Page

**Page Header:** "Export Reports"

**4 Export Cards in 2×2 grid:**

Each card contains:
- Icon (relevant to data type)
- Title: "Export Transactions" / "Export Loans" / "Export Deposits" / "Export Investments"
- Description of what's included
- Filter options (for Transactions: date range + type filter)
- "Download Excel" button (primary, full width on card)
- File name preview: "BranchIQ_Transactions_2026-04-19.xlsx"
- On click: Loading state → instant download

---

## Screen 10: User Management Page (Manager Only)

**Page Header:** "User Management" + "Add Staff" button

**Staff Table:**
Columns: User ID | Full Name | Username | Role (badge) | Status (Active/Inactive) | Created Date | Actions (Edit / Deactivate)

**Add Staff Drawer:**
Fields: Full Name | Username | Password | Role (Staff only — manager role is fixed)

**Deactivate Confirmation Modal:**
- "Are you sure you want to deactivate [Name]? They will lose access immediately."
- Cancel + Deactivate buttons

---

## Screen 11: Audit Log Page (Manager Only)

**Page Header:** "Audit Log" (read-only badge next to title)

**Filter Bar:** Performed By (dropdown of staff) | Action type | Table | Date range

**Audit Table:**
Columns: Timestamp | Action (badge) | Table | Record ID | Performed By | IP Address | Details

**Action Badges:**
- Create: Green
- Update: Blue
- Delete: Red
- Login: Gray
- Export: Purple

**Row expand:** Clicking a row expands to show old_data vs new_data JSON side by side (before/after comparison)

---

# PART 4 — USER FLOWS

---

## Flow 1: Login

1. Staff opens app → Login page loads
2. Enters username + password → clicks "Sign In"
3. Loading spinner on button (500ms)
4. Success → Redirect to Dashboard
5. Error → Red error message appears below password field: "Invalid username or password"
6. After 5 failed attempts → "Account temporarily locked. Contact your manager."

---

## Flow 2: Add a Transaction

1. Staff clicks "Add Transaction" on Transactions page
2. Drawer slides in from right (300ms animation)
3. Staff types account number → dropdown shows matching accounts
4. Selects account → holder name auto-fills below
5. Selects transaction type → conditional fields appear (Loan ID for repayment, To Account for transfer)
6. Enters amount, date, notes
7. Clicks "Save Transaction"
8. Loading state on button
9. Success → Drawer closes, success toast bottom right, table refreshes
10. Error (e.g. invalid account) → Error message inside drawer

---

## Flow 3: Run AI Analysis

1. Staff or Manager clicks "Run Analysis" on Dashboard or AI Insights page
2. Button changes to spinner: "Analyzing..."
3. Progress text: "Scanning [X] transactions..."
4. Analysis completes (under 10 seconds)
5. Success toast: "Analysis complete. 3 anomalies found."
6. If anomalies exist: Red banner appears on Dashboard, badge count updates on nav bell icon
7. Page auto-refreshes insights data

---

## Flow 4: Export to Excel

1. Staff navigates to Export page
2. Selects export type (e.g. Transactions)
3. Optional: Sets date range and type filters
4. File name preview updates dynamically
5. Clicks "Download Excel"
6. Button shows loading state (1-2 seconds)
7. Browser triggers file download instantly
8. Success toast: "File downloaded successfully"

---

# PART 5 — RESPONSIVE BEHAVIOR

---

## Breakpoints

| Breakpoint | Width | Layout Behavior |
|---|---|---|
| Desktop XL | 1440px+ | Full layout as specified above |
| Desktop | 1280px | Same layout, slightly reduced padding |
| Laptop | 1024px | 5 dashboard cards → 3+2 grid |
| Tablet | 768px | Top nav collapses to hamburger menu, 2-column sections become 1 column |
| Mobile | 375px–767px | Single column layout, full-width tables scroll horizontally, drawer becomes bottom sheet |

## Responsive Rules

**Navigation:**
- Below 768px: Top nav items hidden, hamburger icon opens full-screen slide-in menu
- Logo remains visible always

**Dashboard Cards:**
- 1440px+: 5 in a row
- 1024px: 3 in row 1, 2 in row 2
- 768px: 2 in a row
- 375px: 1 in a row, stacked

**Tables:**
- Below 768px: Horizontal scroll enabled
- Key columns always visible: ID, Amount, Status
- Secondary columns (Notes, timestamps) hidden on mobile

**Drawer (Forms):**
- Below 768px: Drawer becomes full-screen bottom sheet, slides up from bottom

**Charts:**
- Below 768px: 2-column chart section becomes 1 column, full width

**Login Page:**
- Below 768px: Left brand panel hidden, right form panel becomes full screen centered card

---

# PART 6 — EMPTY STATES & LOADING STATES

---

## Empty States

Each empty table/section should show a centered illustration area with:
- Simple icon (64px, `#CBD5E1`)
- Primary message: e.g. "No transactions yet" (16px, `#475569`, SemiBold)
- Secondary message: e.g. "Add your first transaction to get started" (14px, `#94A3B8`)
- Action button if applicable: "Add Transaction"

## Loading States

**Page Load:** Skeleton screens — animated gray placeholder blocks where content will appear. Never use a spinner for full-page loads.

**Button Loading:** Spinner replaces button text, button width stays the same, button disabled.

**Table Loading:** 5 skeleton rows animate in place.

**Chart Loading:** Gray placeholder rectangle with subtle pulse animation.

---

# PART 7 — MICRO-INTERACTIONS & TRANSITIONS

---

| Element | Interaction | Duration |
|---|---|---|
| Page navigation | Fade in (opacity 0→1) | 150ms |
| Drawer open/close | Slide from right | 300ms ease-out |
| Card hover | Shadow lift + translateY(-2px) | 200ms |
| Button hover/press | Background color change | 150ms |
| Table row hover | Background tint | 100ms |
| Toast notification | Slide in from bottom-right | 250ms |
| Dropdown open | Fade + scale from 0.95 to 1 | 150ms |
| Badge pulse (anomaly alert) | Soft pulse animation on nav bell | Continuous loop |
| Success state | Check icon scales in | 200ms |

---

*End of UI Flow & Design Specification v1.0*
*This document is intended for direct upload to Claude Design for UI generation.*
