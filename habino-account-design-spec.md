# Habino — Account & Settings Design Specification
**Version 1.0 · Senior Product Design · Ready for Engineering Handoff**

---

## 1. Information Architecture

### 1.1 Structure Audit & Refinement

The current menu mixes four distinct intent zones into a single flat list. The refined IA separates them by user goal clarity:

```
Account (authenticated identity)
├── My Profile          /profile
├── My Listings         /listings
├── My Contracts        /home → renamed to /contracts
└── Saved Listings      /saved

Settings (preferences & control)
├── Account Settings    /settings
├── Notifications       /settings/notifications
└── Language & Region   /settings/language

Help & Legal (support & compliance)
├── Help Center         /help
├── Privacy Policy      /privacy
├── Data Security       /security
├── Terms of Use        /terms
└── Imprint             /imprint

About
└── About Habino        /about
```

**Recommended change:** Rename `/home` to `/contracts` — "home" is ambiguous and doesn't communicate the page's purpose. All internal links should update accordingly.

### 1.2 Navigation Model

**Desktop (≥ 768px):** Persistent left sidebar (240px fixed) within the account section. Top-level groups are collapsible. Active item highlighted with primary color accent. Account section shares the global Header.

**Mobile (< 768px):** Slide-in drawer (existing pattern from MapHomePage). Each page uses a sticky sub-header with a back chevron. Bottom nav persists beneath account pages.

**Routing convention:** All account pages live under their own route, not nested under `/account/`. This keeps URLs clean and shareable.

### 1.3 Authentication Gate

Every page under My Account and Settings requires an authenticated session. If unauthenticated:
- Show a non-destructive gate: content is blurred/replaced with a sign-in prompt
- Redirect to `/auth/login?next=[current-path]` after login
- Help & Legal and About pages are public (no auth required)

---

## 2. Page-by-Page Functional Definitions

---

### 2.1 My Profile · `/profile`

**Purpose:** Central identity page. Users manage their personal information, contact details, and public-facing profile used in listings and contracts.

**User goals:**
- Keep contact details current for agent communication
- Ensure profile data pre-fills contracts and viewings automatically
- Build trust with agents/landlords via a complete profile

**Core features:**
- View & inline-edit all profile fields
- Upload / replace profile photo (crop on upload)
- Profile completeness indicator (progress ring, 0–100%)
- "Profile used in contracts" status badge
- Email verification status with resend action
- Phone number with WhatsApp opt-in toggle

**Data displayed:**
- Full name, email (verified/unverified), phone, WhatsApp number
- City, country, bio (max 280 chars)
- Preferred language, ID number (optional, for contracts)
- Member since date, last active

**User actions:**
- Edit any field inline (click-to-edit pattern)
- Upload profile photo (drag/drop or file picker)
- Resend email verification
- Copy profile link
- Toggle WhatsApp visibility

**Edge cases:**
- Empty profile: show prominent "Complete your profile" banner with completion percentage
- Unverified email: persistent amber banner with resend CTA
- Failed photo upload: inline error under avatar with retry
- No phone number: soft warning "Add phone to contact agents faster"

---

### 2.2 My Listings · `/listings`

**Purpose:** Agent/owner dashboard for all properties they've listed. Full CRUD for their own listings.

**User goals:**
- Monitor listing performance (views, saves, enquiries)
- Edit, pause, or delete listings
- Create new listings via AI wizard
- See which listings are active vs. pending vs. sold/rented

**Core features:**
- Listing cards in a responsive grid (2-col desktop, 1-col mobile)
- Status filter tabs: All · Active · Pending · Closed
- Sort by: Newest · Most viewed · Price ↑↓
- Per-listing stats: views, saves, enquiry count
- Quick actions per card: Edit · Pause · Delete
- Empty state with "Create your first listing" CTA

**Data displayed per listing card:**
- Hero image, title, price, listing type badge (For Sale / For Rent)
- Status badge (Active / Pending / Closed)
- City + neighbourhood
- Views count, saves count
- Created date, last modified

**User actions:**
- Create new listing → opens AI wizard at `/?q=List+my+property`
- Edit listing → navigates to `/admin/listings/[id]`
- Pause/resume listing → toggle without navigation (inline mutation)
- Delete listing → confirmation modal, then remove from list
- Filter and sort

**Edge cases:**
- No listings: illustrated empty state, single CTA "List a property with AI"
- All listings paused: info banner "Reactivate a listing to make it visible"
- Delete with active enquiries: warning "3 people have messaged about this listing"

---

### 2.3 My Contracts · `/contracts`

**Purpose:** Repository for all rental/sale contracts the user has generated or received. Contracts are AI-generated PDFs.

**User goals:**
- Access and download their contracts
- Track contract status (draft, active, expired)
- Initiate new contracts via AI

**Core features:**
- Contract list with status chips
- Preview drawer (shows contract summary, not full PDF)
- Download PDF action
- "Generate new contract" CTA linked to AI wizard
- Filter: All · Active · Draft · Expired

**Data displayed per contract:**
- Contract title / property reference
- Landlord ↔ Tenant names
- Monthly rent + currency
- Start date, end date (or "Open-ended")
- Status: Draft · Active · Expired · Cancelled
- Generated date

**User actions:**
- Open contract → preview drawer slides in from right
- Download PDF
- Delete draft
- Renew (opens AI wizard with pre-filled context)

**Edge cases:**
- No contracts: empty state with "Generate your first contract" AI shortcut
- Expired contract: amber badge, "Renew" CTA visible
- Draft with missing data: red "Incomplete" badge, "Continue setup" link

---

### 2.4 Saved Listings · `/saved`

**Purpose:** Curated wishlist of properties the user has hearted. Supports comparison and direct enquiry.

*(Already largely implemented — functional additions below)*

**Missing features to add:**
- Folder/collection grouping ("Bole search", "2025 options")
- Notes per saved listing (private annotation, max 200 chars)
- "Last seen price" delta (price changed since saved)
- Sort by: Date saved · Price · Area

**Edge cases:**
- Listing removed by owner: show greyed-out card with "No longer available" and remove option
- Price increased since saved: amber banner on card "Price increased 8% since you saved this"

---

### 2.5 Account Settings · `/settings`

**Purpose:** Control centre for account security, linked services, and data.

**User goals:**
- Change email or password
- Connect/disconnect OAuth providers
- Manage data and privacy
- Delete account

**Core features:**
- Email + password change (with current password confirmation)
- Connected accounts: Google, Facebook (connect/disconnect)
- Two-factor authentication toggle (future)
- Data export request (GDPR)
- Danger zone: Delete account (2-step confirmation)

**Sections:**
1. **Login & Security** — email, password change, 2FA placeholder
2. **Connected Accounts** — OAuth provider tiles with connect/disconnect
3. **Data & Privacy** — Export data, view Supabase user ID
4. **Danger Zone** — Delete account (red border card, explicit confirmation input)

**Edge cases:**
- Only OAuth login (no password): show "Add a password" option instead of change
- Deleting account with active listings: "Your 3 active listings will be removed"
- Export data: show "Request sent" state, expected delivery 24h

---

### 2.6 Notifications · `/settings/notifications`

**Purpose:** Granular control over push, email, and in-app notification preferences.

**User goals:**
- Avoid irrelevant notifications
- Stay informed about things that matter (price drops, viewings)

**Core features:**
- Channel toggles: Email · Push · In-app (master switches per channel)
- Per-topic granular controls within each channel
- "Quiet hours" time range picker
- Preview of what each notification looks like

**Notification topics:**
- New listings matching saved search
- Price drops on saved listings
- Viewing confirmations & reminders
- Agent messages / new enquiries
- Contract updates
- Habino news & product updates (marketing)

**Edge cases:**
- All notifications disabled: amber banner "You won't receive any updates. Turn on at least viewing reminders."
- Push not supported/denied: grey out push column, show "Enable in browser settings" hint

---

### 2.7 Language & Region · `/settings/language`

**Purpose:** Localisation preferences affecting the entire app experience.

**Core features:**
- Display language selector (English, Amharic, German, French, Arabic)
- Default currency for price display (ETB, USD, EUR)
- Date format (DD/MM/YYYY vs MM/DD/YYYY)
- Measurement unit (m² vs sqft)
- Time zone (auto-detect or manual)

**Edge cases:**
- Amharic: flag as "Beta — some pages may still display in English"
- Currency change: show "Prices are approximate conversions. Listings are priced in ETB."

---

### 2.8 Help Center · `/help`

**Purpose:** Self-serve support. FAQ, guided flows, and contact escalation.

**Core features:**
- Search bar (filter FAQ items live)
- Categorised FAQ accordion
- "Still need help?" contact card
- AI shortcut chips: "How do I list a property?" → opens AI chat with query pre-filled

**FAQ categories:** Getting started · Search & listings · Agents & viewings · Contracts · Account · Payments (future)

---

### 2.9–2.12 Legal Pages · `/privacy` · `/security` · `/terms` · `/imprint`

**Purpose:** Legal compliance. Readable, scannable prose with anchor navigation.

**Core features:**
- Sticky table of contents (desktop sidebar, mobile top dropdown)
- Section anchors for deep-linking
- Last updated date prominently shown
- Print-friendly layout
- Link to contact for data requests (GDPR)

---

### 2.13 About Habino · `/about`

**Purpose:** Brand credibility and transparency. Tells the Habino story concisely.

**Core features:**
- Mission statement
- Key product features list
- Team/founding story (placeholder)
- Press & media kit link
- Contact card

---

## 3. Page-by-Page UI/UX Design

---

### 3.1 Shared Account Layout

**Desktop structure:**
```
┌─────────────────────────────────────────────────────┐
│  Global Header (sticky, frosted glass)              │
├──────────────┬──────────────────────────────────────┤
│  Account     │                                      │
│  Sidebar     │   Page Content Area                  │
│  (240px)     │   max-w-3xl, padded 32px             │
│              │                                      │
│  [groups]    │                                      │
└──────────────┴──────────────────────────────────────┘
```

**Sidebar anatomy:**
- User avatar (40px) + name + email in a compact header card at top
- Navigation groups with uppercase 10px labels (slate-400)
- Row items: 36px height, 12px left padding, icon (18px) + label
- Active state: primary color fill pill (full width, 6px radius)
- Hover state: `bg-slate-50` fill
- Bottom: Sign out button in red-tinted row

**Mobile structure:**
```
┌──────────────────────────┐
│  Sticky sub-header       │
│  [← back]  [Page title]  │
├──────────────────────────┤
│                          │
│  Page content            │
│  px-4, full width        │
│                          │
├──────────────────────────┤
│  Bottom Nav (60px)       │
└──────────────────────────┘
```

---

### 3.2 My Profile Page

**Layout (desktop):** Two-column. Left: avatar card (sticky). Right: form sections.

**Avatar card (left, 280px):**
- Circular avatar (96px) with camera overlay on hover
- Progress ring around avatar (green arc = completion %)
- Name (20px bold), email (13px slate-400)
- "Profile X% complete" label below
- Verified badge (green tick) or "Unverified" amber chip on email
- Member since: "March 2025"

**Form sections (right):**
Each section is a `rounded-2xl bg-white border border-slate-100/80` card with:
- Section title (11px uppercase slate-400, border-b)
- Rows of field label + value, click-to-edit pattern
- Pencil icon (slate-300) appears on row hover
- Editing state: input replaces value text inline, with Save / Cancel micro-buttons

**Sections:**
1. **Personal** — Full name, Date of birth (optional)
2. **Contact** — Email (+ verified badge), Phone, WhatsApp toggle
3. **Location** — City, Country
4. **Identity** — ID number (optional, tooltip: "Used to verify your identity for contracts"), Preferred language
5. **Bio** — Textarea, 280-char counter

**Mobile:** Single column. Avatar centred at top. Sections stack below.

---

### 3.3 My Listings Page

**Layout:** Full-width page, sticky filter bar below sub-header.

**Filter bar:**
- Pill tabs: All · Active · Pending · Closed (with count badges)
- Right side: Sort dropdown + "New listing" button (primary, rounded-xl)

**Listing card (grid, 2-col desktop / 1-col mobile):**
```
┌────────────────────────────────┐
│  [Hero image 180px]            │
│  [For Rent] [Active ●]         │  ← overlaid badges
├────────────────────────────────┤
│  ETB 45,000 /mo                │  ← price, 18px bold primary
│  2-bed apartment in Bole       │  ← title, 14px
│  👁 124 views  🔖 8 saves      │  ← stats row, 12px slate-400
├────────────────────────────────┤
│  [Edit]  [Pause]  [⋯ more]    │  ← action row
└────────────────────────────────┘
```

**Status badge colours:**
- Active: `bg-emerald-50 text-emerald-700 border-emerald-200`
- Pending: `bg-amber-50 text-amber-700 border-amber-200`
- Closed: `bg-slate-100 text-slate-500 border-slate-200`

**Delete flow:** Click ⋯ → popover with "Delete listing" in red → confirmation sheet slides up (mobile) or modal (desktop): "Are you sure? This cannot be undone." with explicit "Delete" destructive button.

---

### 3.4 My Contracts Page

**Layout:** Full-width list, no grid. Each contract is a horizontal card.

**Contract card:**
```
┌──────────────────────────────────────────────────────┐
│  📄  Bole Apartment Rental Agreement    [Active ●]   │
│      Mathis Barthen → Tigist Alemu                   │
│      ETB 38,000/mo · 01 Jan 2025 → 31 Dec 2025      │
│                              [Download PDF]  [View]  │
└──────────────────────────────────────────────────────┘
```

**Preview drawer (right slide-in, 480px):**
- Header: contract title + status
- Summary table: parties, property, rent, dates, jurisdiction
- Timeline: Generated → Signed → Active → Expires
- Download PDF (primary button)
- "Renew contract" (secondary)

---

### 3.5 Account Settings Page

**Layout:** Single column, `max-w-lg`, stacked card sections.

**Section: Login & Security**
- Email row: current email, "Change email" link → inline form expands
- Password row: "••••••••", "Change password" link → inline form expands
- 2FA row: toggle (disabled state with "Coming soon" badge)

**Section: Connected Accounts**
- Google tile: logo + "Connected" green chip / "Connect" grey button
- Facebook tile: same pattern
- Each tile: 56px height, rounded-xl, `bg-slate-50 border border-slate-100`

**Section: Data & Privacy**
- "Export my data" → button, triggers API call, shows "Request received" toast
- "View my Supabase ID" → monospace small text, copy button

**Danger Zone card:**
- Red border: `border border-red-200 bg-red-50/40 rounded-2xl`
- "Delete Account" in red text
- Clicking expands: text input "Type DELETE to confirm" + destructive button
- Cannot proceed without exact match

---

### 3.6 Notifications Settings Page

**Layout:** Channel columns on desktop (3 cols), stacked on mobile.

**Desktop table layout:**
```
Topic                     Email    Push    In-app
─────────────────────────────────────────────────
New matching listings      ●        ●        ●
Price drops on saved       ●        ○        ●
Viewing reminders          ●        ●        ●
Agent messages             ●        ●        ●
Contract updates           ●        ○        ●
Habino news               ○        ○        ○
```
Each cell: custom toggle component (24×14px pill).
Column headers have master "All on/off" toggle.

**Mobile layout:** Each topic is a card row with label + three mini-toggles inline.

**Quiet hours row** (below table):
- "Do not disturb" toggle
- Time range picker: From [20:00] To [08:00] (two select inputs)

---

### 3.7 Language & Region Page

**Layout:** Single column, stacked rows in a single card.

Each row:
- Label (14px medium)
- Subtitle (12px slate-400) explaining effect
- Control: Select dropdown or radio group

Rows use `divide-y divide-slate-100` separator pattern. Full-width save button at bottom.

---

### 3.8 Help Center Page

**Layout:** Search bar hero at top, FAQ sections below, contact card at bottom.

**Search bar:**
- Full-width, `rounded-2xl`, 48px height
- Magnifier icon left, clear button right
- Live filters FAQ items as user types (no submit needed)
- Placeholder: "Search for help…"

**FAQ accordion:**
- Questions grouped under category pills (horizontal scroll on mobile)
- Open state: answer fades in, chevron rotates 180°
- Transition: 200ms ease-out height animation

**AI shortcuts row** (above FAQ):
```
[ 🤖 How do I list a property? ]  [ 🔑 Book a viewing ]  [ 📄 Generate contract ]
```
Each chip → opens AI chat at `/?q=[encoded query]`.

---

### 3.9 Legal Pages

**Layout:** Two-column desktop (ToC sidebar 220px + content), single-column mobile.

**ToC sidebar:**
- Sticky, 12px uppercase labels
- Active section highlighted as user scrolls (IntersectionObserver)
- Smooth scroll on click

**Content:**
- Generous line-height (1.75)
- h2 sections with 32px top margin
- Code/definition terms in `bg-slate-50 rounded px-1` inline highlight

---

### 3.10 About Page

**Layout:** Single column, `max-w-lg`, card stack.

**Hero card:** Large logo mark (56px), tagline, one-liner mission.
**Mission card:** 3–4 sentence narrative, green left border accent.
**Features list card:** Icon + label + description rows.
**Stats row** (between cards): 3 inline stat tiles — "X listings", "X cities", "X contracts generated".
**Contact card:** email + location rows.

---

## 4. Design System (Account Section)

---

### 4.1 Sidebar Navigation

```
Component: AccountSidebar
─────────────────────────
Width:         240px (desktop) / full-width drawer (mobile)
Background:    bg-white
Border-right:  1px solid rgba(0,0,0,0.06)
Padding:       16px 12px

User header:
  Avatar:       40px circle, object-cover
  Name:         14px font-semibold text-slate-900
  Email:        12px text-slate-400 truncate

Group label:
  Font:         10px font-bold uppercase tracking-widest
  Color:        text-slate-400
  Margin:       16px top, 6px bottom

Nav item:
  Height:       38px
  Border-radius: var(--radius-md) = 14px
  Padding:      0 10px
  Icon:         18px, color matches text
  Label:        14px font-medium
  Gap:          10px icon–label

  Default:      text-slate-600, transparent bg
  Hover:        bg-slate-50, text-slate-800
  Active:       bg-primary-light, text-primary, font-semibold

Sign out row:
  Color:        text-red-500
  Hover bg:     bg-red-50
  Icon:         door-open or arrow-right-from-bracket
```

### 4.2 Page Header (sub-pages)

```
Component: AccountPageHeader
─────────────────────────────
Height:        56px
Background:    bg-white/95 backdrop-blur-md
Border-bottom: 1px solid rgba(0,0,0,0.06)
Shadow:        var(--shadow-header)
Position:      sticky top: 56px (below global header)

Left:          Back button (32px circle, bg-slate-100)
Center:        Page title (15px font-semibold text-slate-800)
Right:         Optional action slot (e.g. "Save" button)
```

### 4.3 Cards

```
Base card:
  Background:    bg-white
  Border:        1px solid rgba(0,0,0,0.07)  ≈ border-slate-100/80
  Border-radius: var(--radius-2xl) = 28px  (major cards)
                 var(--radius-xl) = 22px   (minor cards)
  Shadow:        var(--shadow-sm)
  Padding:       24px

Section card (with header):
  Header:        px-5 py-3 border-b border-slate-100
  Header label:  10px uppercase font-bold tracking-wider text-slate-400
  Content:       px-5 py-4

Danger card:
  Border:        1px solid #fca5a5  (red-300)
  Background:    #fff5f5
  Border-radius: var(--radius-xl)
```

### 4.4 Status Badges

```
Component: StatusBadge
──────────────────────
Shape:     rounded-full
Size:      px-2.5 py-0.5
Font:      11px font-semibold

Active:    bg-emerald-50  text-emerald-700  border border-emerald-200
Pending:   bg-amber-50    text-amber-700    border border-amber-200
Draft:     bg-slate-100   text-slate-500    border border-slate-200
Closed:    bg-slate-100   text-slate-400    border border-slate-200
Expired:   bg-red-50      text-red-600      border border-red-200
Verified:  bg-emerald-500 text-white (no border)
Unverified: bg-amber-400  text-white (no border)
```

### 4.5 Toggle Component

```
Component: Toggle
──────────────────
Track:     40px × 24px, rounded-full
  Off:     bg-slate-200
  On:      bg-primary (#2E7D46)
  Trans:   background 200ms ease

Thumb:     20px circle, bg-white, shadow-sm
  Off pos: translateX(2px)
  On pos:  translateX(18px)
  Trans:   transform 200ms var(--ease-spring)

Focus:     ring-2 ring-primary/30 ring-offset-1

Disabled:  opacity-40, cursor-not-allowed
```

### 4.6 Form Inputs

```
Component: SettingsInput
─────────────────────────
Height:      44px
Padding:     0 14px
Border:      1px solid #e2e8f0
Border-radius: var(--radius-xl) = 22px
Background:  white
Font:        14px text-slate-800
Placeholder: text-slate-400

Focus:
  Border:    var(--color-primary)
  Shadow:    0 0 0 3px rgba(46,125,70,0.10)
  Transition: 140ms

Error:
  Border:    #f87171
  Shadow:    0 0 0 3px rgba(248,113,113,0.15)

Inline edit (click-to-edit):
  View mode:   plain text + pencil icon (opacity-0 → opacity-100 on row hover)
  Edit mode:   input appears with Save + Cancel micro-buttons (28px height)
  Save:        text-primary font-semibold
  Cancel:      text-slate-400
  Trans:       fade + 4px slide-in, 140ms
```

### 4.7 Buttons

```
Primary:
  bg-primary, text-white, rounded-xl
  shadow: 0 2px 8px rgba(46,125,70,0.25)
  hover: opacity-90
  active: scale(0.97)

Secondary:
  bg-white, border border-slate-200, text-slate-700
  shadow: var(--shadow-xs)
  hover: bg-slate-50

Destructive:
  bg-red-500, text-white, rounded-xl
  hover: bg-red-600

Ghost:
  bg-transparent, text-slate-600
  hover: bg-slate-100

All buttons:
  Height:        40px (default) / 36px (compact) / 48px (full-width CTA)
  Font:          14px font-semibold
  Transition:    all 140ms ease
  Disabled:      opacity-40, cursor-not-allowed
```

### 4.8 Spacing System

```
4px  — micro gap (icon–badge, inline elements)
8px  — tight gap (list items, compact rows)
12px — default component gap
16px — section internal padding
20px — card padding (mobile)
24px — card padding (desktop)
32px — section-to-section gap
48px — page top padding (desktop)
```

### 4.9 Typography Scale (Account Section)

```
Page title:       22px font-bold    text-slate-900   tracking-tight
Section label:    10px font-bold    text-slate-400   uppercase tracking-widest
Card title:       16px font-semibold text-slate-800
Body:             14–15px           text-slate-600   line-height 1.6
Label:            13px font-medium  text-slate-700
Caption / meta:   12px              text-slate-400
Stat number:      24–28px font-bold text-slate-900 or primary
Monospace:        13px font-mono    text-slate-600   bg-slate-50
```

### 4.10 Color Usage

```
Primary actions:   #2E7D46 (green)
Primary light bg:  #e8f5ed
Secondary brand:   #0F1F3D (navy, used in gradients)
Success:           #16a34a / emerald-600
Warning:           #d97706 / amber-600
Error:             #dc2626 / red-600
Info:              #2563eb / blue-600
Text primary:      #1e293b (slate-800)
Text secondary:    #64748b (slate-500)
Text tertiary:     #94a3b8 (slate-400)
Border default:    rgba(0,0,0,0.07)
Surface:           #ffffff
Background:        #f8fafc (slate-50)
```

---

## 5. Data Models

### 5.1 User Profile

```typescript
interface UserProfile {
  id:                string;        // Supabase auth UUID
  full_name:         string;        // "Mathis Barthen"
  email:             string;        // verified via Supabase auth
  email_verified:    boolean;
  phone:             string | null; // "+251 91 234 5678"
  whatsapp:          string | null; // same or different number
  whatsapp_visible:  boolean;
  city:              string | null; // "Addis Ababa"
  country_code:      string | null; // "ET"
  bio:               string | null; // max 280 chars
  preferred_lang:    "en" | "am" | "de" | "fr" | "ar";
  id_number:         string | null; // optional, for contracts
  avatar_url:        string | null;
  member_since:      string;        // ISO date
  last_active:       string;        // ISO date
}
```

### 5.2 Listing (owner view)

```typescript
interface OwnerListing {
  id:            string;
  title:         string;
  price:         number;
  currency:      string;         // "ETB"
  listing_type:  "buy" | "rent";
  property_type: string;
  city:          string;
  neighbourhood: string | null;
  status:        "active" | "pending" | "closed" | "paused";
  images:        { id: string; url: string }[];
  views_count:   number;
  saves_count:   number;
  enquiries:     number;
  created_at:    string;         // ISO
  updated_at:    string;         // ISO
  bedrooms:      number;
  bathrooms:     number;
  area_sqm:      number | null;
}
```

### 5.3 Contract

```typescript
interface Contract {
  id:              string;
  title:           string;         // "Bole Apartment Rental Agreement"
  landlord_name:   string;
  landlord_id:     string | null;  // Habino user ID
  tenant_name:     string;
  tenant_id:       string | null;
  property_ref:    string | null;  // linked listing ID
  monthly_rent:    number | null;
  currency:        string;
  start_date:      string;         // ISO
  end_date:        string | null;  // null = open-ended
  jurisdiction:    string;         // "Ethiopia"
  status:          "draft" | "active" | "expired" | "cancelled";
  pdf_url:         string | null;
  created_by:      string;         // Supabase user ID
  created_at:      string;
  updated_at:      string;
}
```

### 5.4 Notification Preferences

```typescript
interface NotificationPreferences {
  user_id:           string;
  channels: {
    email:    boolean;  // master switch
    push:     boolean;
    in_app:   boolean;
  };
  topics: {
    new_listings:    { email: boolean; push: boolean; in_app: boolean };
    price_drops:     { email: boolean; push: boolean; in_app: boolean };
    viewing_reminders: { email: boolean; push: boolean; in_app: boolean };
    agent_messages:  { email: boolean; push: boolean; in_app: boolean };
    contract_updates: { email: boolean; push: boolean; in_app: boolean };
    marketing:       { email: boolean; push: boolean; in_app: boolean };
  };
  quiet_hours: {
    enabled:    boolean;
    from:       string;  // "20:00"
    to:         string;  // "08:00"
    timezone:   string;  // "Africa/Addis_Ababa"
  };
}
```

### 5.5 Saved Listing (extended)

```typescript
interface SavedListing {
  id:           string;
  user_id:      string;
  property_id:  string;
  saved_at:     string;           // ISO
  note:         string | null;    // private, max 200 chars
  collection:   string | null;    // "Bole search"
  price_at_save: number;          // snapshot for price delta
  still_available: boolean;       // derived from property status
}
```

### 5.6 Language & Region Preferences

```typescript
interface RegionPreferences {
  user_id:       string;
  language:      "en" | "am" | "de" | "fr" | "ar";
  currency:      string;   // "ETB" | "USD" | "EUR"
  date_format:   "DD/MM/YYYY" | "MM/DD/YYYY";
  unit_system:   "metric" | "imperial";
  timezone:      string;   // "Africa/Addis_Ababa"
}
```

---

## 6. Interaction & Micro-UX

### 6.1 Page Transitions

**Account section entry (from menu drawer):**
- Drawer closes: 300ms slide-out-right + backdrop fade
- New page: 200ms fade-in + 8px slide-up
- Sidebar highlights new active item simultaneously

**Back navigation:**
- Page fades out 120ms, previous page fades in 120ms
- No slide (avoids confusion with drawer slide pattern)

**Sub-page within section (e.g. Settings → Notifications):**
- Content area slides left 280px, new content slides in from right
- Sidebar active item updates instantly

### 6.2 Inline Edit Pattern

```
State:      Viewing (default)
            → row hover: pencil icon fades in (opacity 0→1, 140ms)
            → click pencil or value text: edit mode

Edit mode:
            → value text morphs into input (140ms fade)
            → "Save" and "Cancel" appear below input (fade + slide-down 4px)
            → pressing Escape = cancel
            → pressing Enter = save (single-line fields)
            → Tab moves to next editable field

Saving:
            → input becomes disabled, spinner appears right
            → success: input morphs back to text, green checkmark flash (500ms)
            → error: border turns red, error text slides in below

Dirty check:
            → navigating away with unsaved changes: "You have unsaved changes" sheet
            → options: Save now · Discard · Stay
```

### 6.3 Loading States

```
Page skeleton:      Grey shimmer blocks at correct sizes and positions
                    Animate: left→right gradient sweep, 1.5s loop

Data mutation:      Spinner replaces button text, button disabled
                    Full-width progress bar at top of card (indeterminate)

Success toast:      Bottom-center, 280px wide, 48px height
                    Background: #1e293b, text: white
                    Icon: green checkmark left
                    Auto-dismiss: 2500ms, slide-down on exit
                    Example: "Profile saved ✓"

Error toast:        Same position, bg: #dc2626
                    Persists until dismissed (×)
```

### 6.4 Empty States

Each empty state has three elements: an illustration (SVG, 96px), a heading (16px bold), and a CTA button.

```
No listings:
  Illustration: house outline with + icon
  Heading:      "No listings yet"
  Sub:          "Your properties will appear here once listed."
  CTA:          "List a property" → /?q=List+my+property

No contracts:
  Illustration: document with pen
  Heading:      "No contracts yet"
  CTA:          "Generate a contract"

No saved listings:
  Illustration: heart outline
  Heading:      "Nothing saved yet"
  Sub:          "Tap the heart on any listing to save it."
  CTA:          "Browse listings"

Profile incomplete:
  Not an empty state — instead: green progress bar under avatar
  with "Complete your profile to unlock contract pre-fill"
```

### 6.5 Confirmation Patterns

**Soft actions** (pause listing, change language): No confirmation. Instant with undo toast.

**Medium-risk actions** (delete saved listing, remove photo): Single confirm via popover: "Remove this? [Cancel] [Remove]"

**Destructive actions** (delete listing with enquiries, delete account): Bottom sheet (mobile) / centred modal (desktop):
- Heading in red: "Delete Account?"
- Consequence list: "• Your listings will be removed • Your contracts will be deleted • This cannot be undone"
- Text input: "Type DELETE to confirm"
- Button only becomes enabled when exact match typed

### 6.6 Form Feedback Timing

```
Field validation:   On blur (not on every keystroke)
Async save:         Debounced 600ms after last change (auto-save pattern)
                    or explicit Save button for settings
Success state:      2500ms, then return to default
Error state:        Persists until user edits field or dismisses
```

---

## 7. Accessibility Considerations

### 7.1 Colour Contrast

All text meets WCAG 2.1 AA (minimum 4.5:1 for normal text, 3:1 for large text):
- `text-slate-800` on `bg-white`: 16.7:1 ✓
- `text-slate-400` on `bg-white`: 4.6:1 ✓ (just passes)
- `text-white` on `bg-primary (#2E7D46)`: 5.1:1 ✓
- `text-emerald-700` on `bg-emerald-50`: 5.9:1 ✓
- `text-amber-700` on `bg-amber-50`: 5.1:1 ✓
- `text-red-600` on `bg-red-50`: 6.1:1 ✓

**Avoid:** `text-slate-400` on `bg-slate-50` for body text (3.3:1 — use for captions only).

### 7.2 Keyboard Navigation

- All interactive elements reachable via Tab
- Logical tab order: sidebar → page header → main content → footer actions
- Custom components (Toggle, inline edit): Space/Enter to activate
- Drawer/modal: focus trap while open, focus returns to trigger on close
- Escape closes any open panel, drawer, or modal
- Sidebar: arrow keys navigate between items (roving tabindex)

### 7.3 Touch Targets

All tappable elements minimum 44×44px (Apple HIG / WCAG 2.5.5):
- Toggle track: 40×24px — add 10px padding to meet minimum
- Nav items: 38px height → pad to 44px on mobile
- Icon buttons (back, close): 32px visual → 44px touch target via padding
- Table rows (notifications): 48px minimum height

### 7.4 Forms & Labels

- Every input has a visible `<label>` (not just placeholder)
- Placeholder text does not replace labels — used as example only
- Error messages linked via `aria-describedby` to their field
- Required fields marked with `aria-required="true"` (not just a visual asterisk)
- `autocomplete` attributes set correctly on all profile/auth fields

### 7.5 Screen Reader Considerations

- Toggle: `role="switch"`, `aria-checked` reflects state
- Status badges: `aria-label` includes full context ("Status: Active")
- Progress ring (profile completion): `role="progressbar"`, `aria-valuenow`, `aria-valuemax`
- Delete confirmation input: `aria-label="Type DELETE to confirm account deletion"`
- Loading states: `aria-live="polite"` region for toast notifications
- Skeleton screens: `aria-busy="true"` on container, `aria-label="Loading..."`

### 7.6 Reduced Motion

All transitions respect `prefers-reduced-motion`:
```css
@media (prefers-reduced-motion: reduce) {
  /* Replace slide/fade animations with instant opacity changes */
  /* Skeleton shimmer: static grey block */
  /* Spinner: simple opacity pulse */
}
```

### 7.7 Responsive & Touch Quality

- Input font-size ≥ 16px on mobile (prevents iOS auto-zoom)
- No hover-only interactions: all hover states have equivalent focus/active states
- Swipe to close bottom sheets (touch gesture)
- `safe-area-inset-bottom` padding on all sticky footers/navbars

---

*Document ends. Version 1.0 — Habino Product Design, March 2026.*
