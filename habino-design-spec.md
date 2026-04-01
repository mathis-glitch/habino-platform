# Habino — Figma-Ready UI/UX Design Specification
## Version 2.0 · March 2026

---

## 1. Product Design Direction

### Vision
Habino is the category-defining AI real estate platform for Africa and emerging markets — not a listing directory with a chatbot bolted on, but a true AI-native product where the agent *is* the core interaction.

**Product vision bullets:**
- AI-first: every screen surfaces AI reasoning, not just AI decoration
- Calm authority: feels like a premium wealth management tool, not a consumer portal
- Data density without noise: rich information presented at exactly the right hierarchy
- Contextual intelligence: the interface changes shape depending on what the user is doing (searching vs analysing vs deciding)
- Trust through transparency: AVM confidence levels, source attribution, market signal reasoning always visible
- Map as thinking tool: the map is not a decoration — it's a primary decision surface
- Multi-role ready: same design system serves buyers, investors, agents, and operators

**UX principles:**
1. Show reasoning, not just results — AI surfaces *why* something matches, not just that it does
2. Progressive depth — surface the key number first, let users drill into the full analysis
3. No dead ends — every screen has a clear next action
4. Spatial consistency — identical visual rhythm across all panels
5. Earn attention — alerts and signals only fire when genuinely actionable

**Visual style direction:**
- Premium proptech: forest green primary, deep navy surfaces, crisp white content areas
- Typography: Playfair Display for brand/hero moments; Inter for all UI — creates warmth without sacrificing legibility
- Spacing: 8px base grid, generous white space, never cramped
- Elevation: minimal — flat surfaces with subtle borders, shadows only for floating elements
- Colour restraint: green + neutrals only; amber and red reserved for signals; blue for informational states

---

## 2. Information Architecture

### Primary Sections
| Section | Purpose | Entry Point |
|---|---|---|
| Dashboard | AI recommendations + market overview | Default after login |
| Listings + Map | Search, filter, browse spatially | Sidebar nav / search |
| Property Detail | Deep-dive + AVM + contact | Listing card click |
| AI Agent | Full-screen conversation + history | Sidebar nav |
| Compare | Side-by-side property analysis | Property detail CTA |
| Market Intelligence | District data, charts, signals | Sidebar nav |
| Saved | Collections + price alerts | Sidebar nav |

### Secondary Sections
- Auth (Login / Register / Reset)
- Account / Profile
- Settings (search preferences, alert config)
- Landing (pre-login)

### Relationships
```
Landing ──► Auth ──► Dashboard
                        │
              ┌─────────┼──────────────┐
              ▼         ▼              ▼
           Map+List   AI Agent     Market Intel
              │
              ▼
         Property Detail
              │
         ┌────┴────┐
         ▼         ▼
       Compare    Saved
```

### Navigation model
- **Global nav:** Left sidebar (persistent, collapsible)
- **Contextual actions:** Topbar (changes content per screen)
- **AI Panel:** Right-side drawer (present on Dashboard, optional elsewhere)
- **Map controls:** Overlay within map surface

---

## 3. Navigation System — Figma-Level Spec

### Navigation Type
**Left sidebar + topbar hybrid.** Sidebar owns primary navigation. Topbar owns search, contextual actions, and user account. No bottom nav (desktop-first product).

---

### Frame: Sidebar (Expanded)

| Property | Value |
|---|---|
| Width | 240px |
| Height | 100vh |
| Background | `--n-900` (#0C1829) |
| Border-right | 1px solid rgba(255,255,255,0.06) |
| Layout | Vertical auto layout |
| Overflow | Y: scroll (hidden scrollbar), X: hidden |

**Sub-sections (top to bottom):**

**Logo area**
- Height: 60px (matches topbar)
- Padding: 0 16px
- Gap: 12px
- Border-bottom: 1px solid rgba(255,255,255,0.06)
- Logo mark: 36×36px, border-radius 10px, background `--p-500`
- Logo text: Playfair Display 18px, color white, letter-spacing −0.02em

**Nav groups**
- Section labels: 10px, font-weight 700, letter-spacing 0.08em, uppercase, color rgba(255,255,255,0.22)
- Label padding: 12px 20px 6px

**Nav items**
- Padding: 9px 16px
- Margin: 1px 8px (gives 8px outer gap from sidebar edge)
- Border-radius: 10px
- Gap between icon and label: 10px
- Icon size: 18×18px
- Label: 13px, font-weight 500
- Badge: 10px, font-weight 700, border-radius full, padding 1px 6px, background `--p-500`

**Nav item states:**

| State | Background | Text color | Icon |
|---|---|---|---|
| Default | transparent | rgba(255,255,255,0.5) | inherited |
| Hover | rgba(255,255,255,0.06) | rgba(255,255,255,0.85) | inherited |
| Active | rgba(42,110,66,0.2) | `--p-300` | `--p-300` |

**Dividers:** 1px, rgba(255,255,255,0.06), margin 8px 16px

**User area (bottom)**
- Padding: 12px 8px
- Border-top: 1px solid rgba(255,255,255,0.06)
- Avatar: 32×32px circle, gradient green, 12px label initials
- Collapse toggle: 28×28px, border-radius 6px, background rgba(255,255,255,0.06)

---

### Frame: Sidebar (Collapsed)

| Property | Value |
|---|---|
| Width | 68px |
| Transition | `width 0.22s cubic-bezier(0.4,0,0.2,1)` |

- Logo text → opacity 0 (not display:none, to allow smooth transition)
- Section labels → opacity 0
- Nav labels → opacity 0, width 0
- Badges → opacity 0
- User info → opacity 0, width 0
- Only icons remain visible, centered
- Toggle arrow reverses direction

---

### Frame: Topbar

| Property | Value |
|---|---|
| Height | 60px |
| Background | `--surface-0` (#FFFFFF) |
| Border-bottom | 1px solid `--surface-3` |
| Padding | 0 24px |
| Gap | 16px |
| Shadow | `--sh-xs` |

**Components:**
- Page title + subtitle (left, flex-column)
- Global search (center, max-width 440px, flex-grow 1)
- Action cluster (right, gap 8px, auto margin-left)

**Global search:**
- Height: 36px
- Border-radius: full (999px)
- Background: `--surface-1`
- Border: 1.5px solid `--surface-3`
- Left icon: 15×15px at x=12, y=center
- Padding-left: 38px
- Focus state: border-color `--p-400`, box-shadow 0 0 0 3px `--p-100`

**Topbar icon buttons:**
- 36×36px, border-radius 10px
- Background: `--surface-1`, border: 1.5px solid `--surface-3`
- Hover: background `--surface-2`, border-color `--n-200`
- Notification dot: 7×7px, red, border 1.5px white, top-right offset 6px

---

### Navigation Behavior

**Collapse/expand:** Toggle button in user area. Width transitions via CSS transition on `.sidebar`. Content elements use opacity + width transitions for smooth text fade.

**Responsive:** Below 1200px, sidebar auto-collapses. Below 960px, sidebar becomes a slide-out drawer with overlay.

**Contextual changes:**
- On Map screen: sidebar collapses by default to maximize map area
- On AI Agent: right panel expands to full conversation view; topbar shows "New conversation" only
- On Property Detail: topbar shows breadcrumb + share/compare actions
- On Compare: topbar shows AI Summary CTA

**Active state propagation:** Parent nav group highlights when any child is active. Breadcrumb in topbar reflects current location depth.

---

## 4. Screen Inventory

| # | Screen | Frame ID | Layout | AI Panel |
|---|---|---|---|---|
| 1 | Landing | `landing` | Full-bleed dark | None |
| 2 | Dashboard | `dashboard` | Sidebar + Topbar + Content + AI Panel | Right, 360px |
| 3 | Map + Listings | `map-listings` | Sidebar(collapsed) + List Panel(380px) + Map | None (AI button in topbar) |
| 4 | Property Detail | `property-detail` | Sidebar(collapsed) + 2-col content | None (AI button in CTAs) |
| 5 | AI Agent (Full) | `ai-agent` | Sidebar(collapsed) + History Panel + Chat | Full chat |
| 6 | Compare | `compare` | Sidebar(collapsed) + Full-width table | None |
| 7 | Market Intel | `market-intel` | Sidebar(expanded) + Content | None |
| 8 | Saved Listings | `saved` | Sidebar(expanded) + Content | None |
| 9 | Sign In | `auth-signin` | Split: dark left / white right | None |

---

## 5. Figma Mockups — Detailed Spec

### Screen 2: Dashboard

**Frame:** `Dashboard · 1440×900`
**Grid:** 12 columns, 24px margin, 16px gutter

**Layout structure:**
```
[Sidebar 240px] | [Main Area flex-1]
                    [Topbar 60px]
                    [Body flex]
                      [Scroll Content flex-1] | [AI Panel 360px]
```

**Content sections (top to bottom in scroll area):**

1. **Alert Banner** — full width, 48px height, border-radius 12px, amber/green surface
2. **Stat Grid** — 4 columns, gap 16px, cards are 168px tall
3. **Section Header** — flex row, space-between, mb-16px
4. **Filter Bar** — flex wrap, gap 8px, mb-20px
5. **Listing Grid** — 3 columns, gap 16px

**Listing card spec:**
- Border-radius: 18px (var(--r-xl))
- Border: 1.5px solid `--surface-3` (featured: `--p-300`)
- Hover: translateY(−2px), box-shadow `--sh-md`, border-color `--p-300`
- Image placeholder: 180px height
- Body padding: 14px 16px 16px
- Footer: 10px 16px, border-top `--surface-2`
- Price: 18px, font-weight 800, letter-spacing −0.02em
- Address: 12px, color `--n-400`, mt 2px, mb 10px

**AI Panel spec:**
- Width: 360px
- Background: `--surface-0`
- Border-left: 1px solid `--surface-3`
- Header: 60px, padding 16px 20px, border-bottom
- Messages: flex-1, scroll, padding 16px 20px, gap 12px
- Suggestion chips: flex wrap, gap 6px, padding 0 20px 12px
- Input area: padding 12px 16px, border-top

**AI message bubbles:**
- AI bubble: background `--surface-1`, border `--surface-3`, border-top-left-radius 4px (tail), max-width 240px
- User bubble: background `--p-500`, color white, border-top-right-radius 4px
- Font: 12px, line-height 1.55
- Avatar: 28×28px circle

**AI insight card (within AI bubble):**
- Background: `--p-50`, border `--p-100`, border-radius 12px, padding 12px
- Label: 10px, 700, uppercase, letter-spacing 0.06em, color `--p-500`
- Rows: flex space-between, font-size 11px

---

### Screen 3: Map + Listings

**Frame:** `Map · 1440×900`

**Layout:**
```
[Sidebar 68px collapsed] | [List Panel 380px] | [Map flex-1]
```

**List panel:**
- Background: `--surface-0`
- Header: 48px, padding 14px 16px, border-bottom
- Cards: list layout (horizontal), gap 10px, padding 12px
- Each card: 80×80px image thumbnail + text stack
- Selected card: background `--p-50`, border 2px `--p-300`

**Map surface:**
- Background: `#e8f0e9` (Mapbox light style)
- Grid lines: `rgba(200,215,200,0.5)` at 32px intervals (subtle)
- Block fills: `rgba(180,200,180,0.5)`, border-radius 3px

**Map marker — price bubble:**
- Background: `--n-900`, border 2px white, border-radius full
- Padding: 5px 11px, font 12px 700
- Tail: 0 border triangle, 8px height
- Hover: background `--p-500`, scale 1.05
- Selected: background `--p-500`, shadow `--sh-green`

**Map cluster:**
- Circle: 44×44px, border-radius 50%
- Background: `rgba(42,110,66,0.85)`, border 3px white
- Font: 13px 800 white, shadow `--sh-md`

**Map tooltip (on selected marker):**
- Width: 280px, border-radius 18px, shadow `--sh-xl`
- Image: 140px height
- Body padding: 14px
- Price: 17px 800, address: 11px, specs: 11px, CTA button full-width

**Map controls (top-right):**
- 36×36px white cards, border-radius 10px, shadow `--sh-sm`
- Gap: 4px vertical stack

**Bottom bar (bottom-right):**
- Draw area + Ask AI buttons
- Ask AI: primary green, shadow `--sh-green`

---

### Screen 4: Property Detail

**Frame:** `Property Detail · 1440×900`

**Layout:** Sidebar(68px) + Full content scroll
**Content grid:** Two columns: `1fr 320px`, gap 28px

**Photo hero:**
- Height: 320px, border-radius 24px
- Grid: 2fr 1fr, grid-rows 1fr 1fr, gap 4px
- First cell: spans 2 rows
- Photo count badge: absolute bottom-right, dark glass background

**AVM card (right column):**
- Background: linear-gradient `--n-900` → `--n-800`
- Border-radius: 18px, padding 20px, color white
- AVM value: 28px 800
- Range bar: 4px height, `--p-400` fill with thumb indicator
- "Below AVM" label: `#86efac` (light green)

**Spec row:**
- 6 items in flex row
- Each: flex-column, value 18px 800, label 11px muted
- Padding 16px 0, border-top + border-bottom `--surface-3`

**Feature chips:**
- Grid 3-col, gap 8px
- Each: 12px, background `--surface-1`, border-radius 10px, padding 8px 10px

**Tabs:**
- Border-bottom 2px `--surface-3`
- Active: border-bottom 2px `--p-500`, color `--p-500`
- Item: 13px 600, padding 10px 16px

---

### Screen 5: AI Agent

**Frame:** `AI Agent · 1440×900`

**Layout:** Sidebar(68px) + History Panel(260px) + Chat Area(flex-1)

**History panel:**
- Background: `--surface-0`, border-right 1px `--surface-3`
- Cards: padding 10px 12px, border-radius 10px
- Active card: background `--p-50`, border `--p-100`
- Title: 12px 600, timestamp: 11px muted

**Chat area (centered, max-width 760px):**
- Greeting header: centered, icon 52×52px green gradient
- Messages: flex-column, gap 16px, padding 32px 40px
- Full-width AI bubbles (vs narrow panel bubbles on Dashboard)
- AI avatar: 32×32px
- User bubble max-width: 420px, right-aligned
- Inline property cards: full-width, border-radius 18px, AI scored

**Ranked property cards (AI response inline):**
- Flex row: rank circle (36px) + text + score badge
- #1: border `--p-300`, score badge `--p-500`
- #2 #3: border `--surface-3`, score badge muted

**Input area:**
- Padding: 0 40px 24px
- Textarea: 14px font, 2 rows, auto-grows
- Send button: 36×36px, border-radius 10px
- Footer note: 10px muted, centered

---

### Screen 6: Compare

**Frame:** `Compare · 1440×900`

**Grid:** `180px 1fr 1fr 1fr` (label col + 3 property cols)

**AI Summary bar (top):**
- Dark gradient background `--n-900 → --n-800`
- Border-radius 18px, padding 18px 22px, flex row, gap 16px
- Recommendation text: 12px, 0.6 white opacity
- Highlight: `--p-300` for winning property name
- "Recommend" badge: `--p-500` pill, right-aligned

**Column header:**
- Winner column: `--p-50` background, `--p-100` border
- Image: 100px height, border-radius 10px
- "Top pick" badge: `--p-500` green pill

**Comparison rows:**
- Label cells: `--surface-1` background, 11px 600 uppercase, 0.05em letter-spacing
- Value cells: 13px 700
- Winner values: color `--p-600` with direction arrow
- Bar indicators in size row: 6px height, `--p-400` fill for winner, `--n-200` for others
- Border-bottom: 1px `--surface-2` on each row

**Add slot:** Dashed border, centered + icon, muted color

---

### Screen 7: Market Intelligence

**Frame:** `Market Intel · 1440×900`

**Layout:** Sidebar(240px expanded) + Full scroll content

**Chart area (price trend):**
- Background `--surface-0`, border `--surface-3`, border-radius 18px, height 240px
- Bar chart: 8 bars, gap proportional, bars rounded top
- Active bar: brighter green, ring outline 2px `--p-400`
- Bars: `--p-400 → --p-600` gradient, border-radius 4px top

**District ranking:**
- Background `--surface-0`, border `--surface-3`, border-radius 18px
- Each row: rank number + district name (80px) + bar (flex 1, 8px) + value
- `--p-400` fill for top, `--n-300` for lower ranks

**Insight cards grid:** 3 columns, gap 12px
- Top accent: 3px colored bar (positive=green, warning=amber, negative=red, neutral=blue)
- Icon: 20px emoji, padding-bottom 8px
- Title: 12px 700
- Body: 11px muted, line-height 1.5

---

### Screen 8: Saved Listings

**Frame:** `Saved · 1440×900`

**Collections row:** 3 cards in grid, gap 12px
- Active collection: `--p-50` background, `--p-300` border
- Image thumb: 56×56px, border-radius 10px
- Name: 14px 700, count: 12px muted

**Alert banner:** Full-width, amber surface, price-drop signal with CTA

**Grid:** Reuses listing card component from Dashboard

---

### Screen 9: Sign In

**Frame:** `Auth · 1440×900`

**Grid:** 2 equal columns (`1fr 1fr`)

**Left (brand):**
- Background: dark gradient `--n-950 → --n-800`
- Padding: 60px 64px
- Logo, H1 (Playfair 36px), sub-text, testimonial card, stats row

**Testimonial card:**
- Background: rgba(255,255,255,0.06)
- Border: rgba(255,255,255,0.1)
- Border-radius: 18px, padding 20px
- Quote text: 13px, 0.7 opacity, italic
- Author: avatar 32px + name + role

**Right (form):**
- Background: `--surface-0`
- Padding: 60px 64px
- Form width: 380px max, centered

**Form elements:**
- OAuth button: 42px height, `--surface-1`, hover `--surface-2`, gap 10px
- Divider: 1px `--surface-3` with center text label
- Input: 42px height, border-radius 10px, 1.5px border `--surface-3`
- Submit: 44px, full-width, `--p-500`, shadow `--sh-green`

---

## 6. Core Component System

### Buttons

**Primary (`btn-primary`)**
- Background: `--p-500`, color white
- Padding: 9px 18px, border-radius 10px
- Font: 13px 700
- Shadow: `0 4px 16px rgba(42,110,66,0.25)`
- Hover: background `--p-600`, shadow stronger, translateY(−1px)
- States: default | hover | active | disabled (opacity 0.4)

**Secondary (`btn-secondary`)**
- Background: `--surface-0`, color `--n-700`
- Border: 1.5px `--surface-3`
- Hover: border `--n-300`, background `--surface-1`

**Ghost (`btn-ghost`)**
- Background: none, color `--p-500`
- Hover: background `--p-50`
- No border

---

### Inputs

**Search input**
- Height: 36px, border-radius full
- Left-pad 38px for icon
- Focus ring: 3px `--p-100`

**Form input**
- Height: 42px, border-radius 10px
- 1.5px border `--surface-3`
- Focus: border `--p-400`, ring 3px `--p-100`

**AI textarea**
- Auto-grow (min 20px, max 80px)
- No border (contained inside input row)
- 13px, line-height 1.4

---

### Cards

**Listing Card**
- Border-radius: 18px
- Image: 180px height
- Featured: 2px `--p-300` border
- Hover: translateY(−2px), `--sh-md`
- AI score badge: dark glass, bottom-right of image, 10px 700
- Price: 18px 800, address: 12px muted, specs: 11px

**Stat Card**
- Border-radius: 18px, padding 20px
- Icon wrap: 40×40px, border-radius 14px, tinted background
- Value: 26px 800 letter-spacing −0.03em
- Delta: flex row, 11px coloured/muted

**AI Insight Card**
- 3px top accent bar (colour-coded by type)
- Emoji icon, 12px title 700, 11px body

**Compare Card (column)**
- Winner: `--p-50` background, `--p-100`/`--p-300` borders
- "Top pick" badge: `--p-500` pill inside header

---

### Chips / Filters

**Chip**
- Height: ~30px, border-radius full
- Border: 1.5px `--surface-3`
- Font: 12px 500
- Active: background `--n-900`, border `--n-900`, color white
- Hover: border `--n-300`, color `--n-900`

**AI suggestion chip**
- Background `--surface-1`, border `--n-200`
- Font: 11px
- Hover: background `--p-50`, border `--p-300`, color `--p-600`

---

### Map Markers

**Price bubble marker**
- Pill shape, dark background, 2px white border
- 12px 700 white price text
- Triangle tail below
- Selected: green background, green shadow
- Hover: scale 1.05

**Cluster circle**
- 44px diameter, green 85% opacity, 3px white border
- 13px 800 white count
- Shadow `--sh-md`

**Map tooltip card**
- 280px wide, 18px border-radius, `--sh-xl`
- 140px image area, 14px body padding
- Full-width CTA button, hover goes green

---

### AI Message Bubbles

**AI bubble:** `--surface-1` bg, `--surface-3` border, top-left radius flattened to 4px
**User bubble:** `--p-500` green bg, white text, top-right radius flattened to 4px
**Typing indicator:** 3 animated dots, `--n-300` colour, staggered pulse
**Inline insight card:** `--p-50` bg, nested inside AI bubble

---

## 7. Visual System

### Color System

```
Primary Green
--p-600: #1E5C35  (dark, pressed states)
--p-500: #2A6E42  (primary CTA)
--p-400: #3A8F57  (icons, accents)
--p-300: #5CAF77  (active states, highlights)
--p-100: #DCF0E4  (light tint)
--p-50:  #F0FAF3  (surface tint)

Navy / Dark
--n-950: #080F1A  (deepest bg)
--n-900: #0C1829  (sidebar, dark cards)
--n-800: #142236  (dark gradients)
--n-700: #1E3148
--n-600: #2D4A66
--n-500: #4A6785  (body text)
--n-400: #6B8BAA  (muted text)
--n-300: #9DB8CE  (placeholders)
--n-200: #C8D9E6  (borders light)
--n-100: #E8F0F6  (surface-3)
--n-50:  #F4F7FA

Surfaces
--surface-0: #FFFFFF
--surface-1: #F8FAFB
--surface-2: #F1F5F8
--surface-3: #E8EFF4

Semantic
--amber:    #F59E0B  (warnings)
--amber-bg: #FFFBEB
--red:      #DC2626  (errors, price-down)
--red-bg:   #FEF2F2
--blue:     #2563EB  (informational)
--blue-bg:  #EFF6FF
--teal:     #0D9488  (metrics)
--teal-bg:  #F0FDFA
```

### Typography

| Token | Font | Size | Weight | Line-height | Use |
|---|---|---|---|---|---|
| `--hero` | Playfair Display | 56px | 700 | 1.12 | Landing H1 |
| `--h1` | Playfair Display | 36px | 700 | 1.2 | Auth hero |
| `--h2` | Playfair Display | 28px | 700 | 1.25 | Section heroes |
| `--h3` | Inter | 18px | 800 | 1.3 | Logo text |
| `--page-title` | Inter | 16px | 700 | — | Topbar |
| `--card-price` | Inter | 18–26px | 800 | 1 | Prices |
| `--body` | Inter | 14px | 400 | 1.65 | Paragraphs |
| `--body-sm` | Inter | 13px | 400–500 | 1.55 | Card body, UI |
| `--label` | Inter | 12px | 500–600 | — | Labels, captions |
| `--micro` | Inter | 10–11px | 500–700 | — | Badges, chips |

Letter-spacing: −0.02em to −0.03em on large headings; +0.04em–0.08em on uppercase labels.

### Spacing System (base 8px)

| Token | Value | Use |
|---|---|---|
| `--sp-1` | 4px | Micro gaps (icon to dot) |
| `--sp-2` | 8px | Tight component gaps |
| `--sp-3` | 12px | Card body elements |
| `--sp-4` | 16px | Standard gaps |
| `--sp-5` | 20px | Section padding |
| `--sp-6` | 24px | Page padding start |
| `--sp-8` | 32px | Between major sections |
| `--sp-10` | 40px | Chat area padding |
| `--sp-12` | 48px | Auth padding |
| `--sp-16` | 64px | Auth side padding |

### Elevation (Shadows)

```
--sh-xs:  0 1px 2px rgba(12,24,41,0.05)              → Cards at rest
--sh-sm:  0 1px 4px rgba(12,24,41,0.06),
          0 2px 8px rgba(12,24,41,0.04)               → Hovered cards
--sh-md:  0 4px 12px rgba(12,24,41,0.08),
          0 2px 4px rgba(12,24,41,0.04)               → Floating CTAs
--sh-lg:  0 8px 24px rgba(12,24,41,0.10),
          0 4px 8px rgba(12,24,41,0.05)               → Tooltips, drawers
--sh-xl:  0 20px 48px rgba(12,24,41,0.12),
          0 8px 16px rgba(12,24,41,0.06)              → Map tooltip, modals
--sh-green: 0 4px 16px rgba(42,110,66,0.25)           → Primary buttons
```

### Border Radius

```
--r-xs:   4px   → Marker tail, small indicators
--r-sm:   6px   → Collapse toggle button
--r-md:   10px  → Inputs, chips, buttons, nav items
--r-lg:   14px  → Alert banners, AI insight cards
--r-xl:   18px  → Listing cards, panels
--r-2xl:  24px  → Hero images, photo grid
--r-full: 9999px → Pills, badges, search input
```

---

## 8. Map UI System

### Map Style
Minimal light: `#e8f0e9` base (muted sage green — feels like branded Mapbox Light). Road fills: white/off-white. Block fills: soft sage with 50% opacity. District labels: uppercase, 11px, 700, colour-coded by zone.

### Marker System

| Type | Component | Size | Interaction |
|---|---|---|---|
| Price bubble | Pill + triangle tail | Auto × 28px | Hover → green; click → tooltip + highlight list |
| Cluster | Circle | 44px | Hover → expand; click → zoom in |
| Area label | Text overlay | 11px uppercase | Static |
| Tooltip | Floating card | 280px | Click marker → show; click elsewhere → hide |

**Marker states:** default (dark) → hover (green scale-up) → selected (green + shadow + tooltip visible)

### Cluster Behavior
- Threshold: 3+ markers within ~80px radius → cluster
- Cluster expands on hover to show individual markers (radial burst animation)
- Click cluster → zoom to fit contained markers

### Overlays
- Price heatmap: linear gradient from `#bbf7d0` (low) to `#1E5C35` (high), 60% opacity layer
- District boundary: 2px dashed `--p-300`, 0.3 opacity fill
- Draw tool: freehand polygon, dashed `--p-500` stroke, fills `--p-100` at 0.3 opacity

### Split View (Map + List)
- List panel: 380px fixed, scroll independent
- Map: fills remaining width
- Marker hover highlights corresponding list card (border + background transition)
- List card click → map pans + marker selected + tooltip shown
- Mobile: list stacks above map, toggle button to switch

---

## 9. Motion & Interaction Principles

### Transitions
- **Navigation:** Sidebar collapse `width 0.22s cubic-bezier(0.4,0,0.2,1)`, content fade `opacity 0.15s`
- **Cards:** Hover lift `transform 0.2s ease, box-shadow 0.2s ease`
- **Buttons:** Background, shadow `0.15s`
- **Map markers:** Scale `0.2s`, background `0.2s`
- **Tab underline:** Width + left `0.2s ease`
- **AI typing indicator:** Pulse `2s infinite` (opacity 1 → 0.4 → 1)

### Screen Transitions
- Screens switch instantly (no cross-fade) in prototype — in production: `fade 0.15s` between routes

### Hover Feedback Rules
- All interactive surfaces: cursor pointer
- Cards: `−2px translateY` + shadow increase
- Buttons: background darken + slight lift (primary) or border darken (secondary)
- Nav items: immediate background change (no delay)
- Chips: border-color + text-color transition

### Panel Animations (production spec)
- AI panel opens: slides in from right, `transform translateX(360px) → 0, 0.25s ease-out`
- Sidebar collapse: width reduction with simultaneous content fade
- Map tooltip: `opacity 0 → 1, transform translateY(4px) → 0, 0.18s`
- Alert banners: `transform translateY(−100%) → 0, 0.2s` on mount; dismiss slides up

### AI Response Behavior
- Typing indicator: 3-dot pulse appears immediately after user sends message
- Text streams in (production): letter-by-letter at 20ms intervals
- Inline cards animate in: `opacity 0 → 1, translateY 8px → 0, staggered 0.1s per card`
- Suggestion chips appear after last message: 0.3s delay, fade in

### Map Interactions
- Zoom: scale transform, markers maintain screen size (CSS counter-scale)
- Pan: translate with momentum (ease-out deceleration)
- Marker click: map pans 200ms to center selected marker, tooltip appears 150ms after pan settles
- Cluster expand: radial burst of child markers, 0.25s spring

---

## Appendix: Figma File Structure Recommendation

```
Habino Design System
├── 🎨 Foundations
│   ├── Colors
│   ├── Typography
│   ├── Spacing & Grid
│   ├── Shadows
│   └── Border Radius
├── 🧩 Components
│   ├── Navigation
│   │   ├── Sidebar (Expanded)
│   │   ├── Sidebar (Collapsed)
│   │   ├── Topbar
│   │   └── Nav Item (states)
│   ├── Buttons (Primary / Secondary / Ghost)
│   ├── Inputs (Search / Form / AI)
│   ├── Cards
│   │   ├── Listing Card
│   │   ├── Stat Card
│   │   ├── Insight Card
│   │   └── AI Insight Card
│   ├── Map
│   │   ├── Markers (Default / Hover / Selected)
│   │   ├── Cluster
│   │   └── Tooltip
│   ├── AI
│   │   ├── Message Bubble (AI)
│   │   ├── Message Bubble (User)
│   │   ├── Typing Indicator
│   │   ├── Suggestion Chip
│   │   └── Ranked Property Card
│   ├── Chips & Filters
│   └── Alerts / Banners
└── 📱 Screens
    ├── 01 · Landing
    ├── 02 · Dashboard
    ├── 03 · Map + Listings
    ├── 04 · Property Detail
    ├── 05 · AI Agent
    ├── 06 · Compare
    ├── 07 · Market Intelligence
    ├── 08 · Saved
    └── 09 · Sign In
```

---

*Habino Design System v2.0 — Built for Figma, exported from prototype. All values are production-ready tokens.*
