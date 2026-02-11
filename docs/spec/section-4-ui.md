# Section 4: User Interface Specification

## Zovo Cookie Manager Chrome Extension

**Version:** 1.0
**Date:** 2026-02-11
**Status:** Draft

---

## 4.1 Extension Popup

### 4.1.1 Dimensions and Layout

- **Default size:** 400px wide x 520px tall
- **Minimum size:** 400px wide x 400px tall
- **Maximum size:** 400px wide x 600px tall (user-resizable via drag handle at bottom edge)
- **Layout model:** Flexbox column with fixed header (56px), fixed tab bar (40px), scrollable content area (flexible), and fixed footer (36px)

### 4.1.2 Design System

**Typography:**
- Font stack: `Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- Header title: 14px / 600 weight
- Tab labels: 12px / 500 weight
- Body text: 13px / 400 weight
- Small text (badges, counters): 11px / 500 weight
- Monospace (cookie values): `'SF Mono', 'Fira Code', 'Consolas', monospace` at 12px

**Color Palette (Light Mode):**
- Background primary: `#FFFFFF`
- Background secondary: `#F7F8FA`
- Background tertiary: `#EDEEF2`
- Text primary: `#1A1D23`
- Text secondary: `#5F6368`
- Text tertiary: `#9AA0A6`
- Border: `#E0E2E6`
- Brand primary: `#2563EB` (Zovo blue)
- Brand hover: `#1D4ED8`
- Success: `#16A34A`
- Warning: `#D97706`
- Danger: `#DC2626`
- Info: `#0EA5E9`
- Pro accent: `#7C3AED` (purple) with `#F59E0B` (gold) for badges

**Color Palette (Dark Mode):**
- Background primary: `#1A1D23`
- Background secondary: `#23272F`
- Background tertiary: `#2D3139`
- Text primary: `#E8EAED`
- Text secondary: `#9AA0A6`
- Text tertiary: `#5F6368`
- Border: `#3C4049`
- Brand primary: `#60A5FA`
- All semantic colors shift to lighter variants for contrast

**Spacing Scale:**
- 4px (xs), 8px (sm), 12px (md), 16px (lg), 20px (xl), 24px (2xl)

**Border Radius:**
- Small elements (badges, chips): 4px
- Medium elements (buttons, inputs): 6px
- Large elements (cards, modals): 8px
- Pill shapes (filter chips, tab pills): 16px

**Shadows:**
- Subtle: `0 1px 2px rgba(0, 0, 0, 0.05)`
- Medium: `0 2px 8px rgba(0, 0, 0, 0.08)`
- Elevated: `0 4px 16px rgba(0, 0, 0, 0.12)`

### 4.1.3 Popup Structure Wireframe

```
+------------------------------------------+
|  [Z] Zovo Cookie Manager    [PRO] [gear] |  <- Header (56px)
|  example.com  ·  47 cookies              |
+------------------------------------------+
|  [Cookies] [Profiles] [Rules] [Health]   |  <- Tab Bar (40px)
+------------------------------------------+
|                                          |
|  +------------------------------------+  |
|  | [Search cookies...]  [v Filters]   |  |  <- Search (36px)
|  +------------------------------------+  |
|  | Session | Persistent | Secure | 3P  | |  <- Filter chips
|  +------------------------------------+  |
|  |                                    |  |
|  |  [cookie list rows]               |  |  <- Scrollable area
|  |  ...                              |  |
|  |  ...                              |  |
|  |  ...                              |  |
|  |                                    |  |
|  +------------------------------------+  |
|  | [+ Add] [Export] [Import] [Delete] |  |  <- Action bar (40px)
+------------------------------------------+
|  2/2 profiles used         Powered by Z  |  <- Footer (36px)
+------------------------------------------+
```

### 4.1.4 Header (56px height)

```
+------------------------------------------+
|  [Z]  Zovo Cookie Manager      [PRO] [O] |
|        example.com  ·  47 cookies        |
+------------------------------------------+

[Z]    = 24x24px Zovo logo mark, brand primary color
[PRO]  = Gold pill badge "PRO" (only visible for Pro users)
         Background: #F59E0B, text: #FFFFFF, 11px/600
         Hidden for free users
[O]    = 20x20px gear icon, text secondary color
         Opens settings/options page in new tab
```

- **Line 1:** Logo + extension name (14px/600) + action icons, right-aligned
- **Line 2:** Current domain (13px/400, text secondary) + separator dot + cookie count (13px/400, text secondary)
- **Bottom border:** 1px solid border color
- **Padding:** 12px horizontal, 8px vertical

### 4.1.5 Tab Navigation Bar (40px height)

```
+------------------------------------------+
|  [ Cookies ]  Profiles   Rules   Health  |
+------------------------------------------+
```

- **Style:** Underline tab indicator, not pill-shaped
- **Active tab:** Text primary color, 2px bottom border in brand primary, 500 weight
- **Inactive tabs:** Text secondary color, no bottom border, 400 weight
- **Tab width:** Evenly distributed across 400px (100px each)
- **Hover state:** Text darkens to primary, background shifts to secondary
- **Transition:** Border slides left/right (150ms ease-out) when switching tabs
- **Tab icons:** Optional 16px icon to the left of each label (cookie icon, user icon, list icon, heart icon). Visible if space allows. Hidden below 360px.

### 4.1.6 Cookies Tab (Default)

**Search Bar (36px):**

```
+------------------------------------------+
|  [Q] Search cookies...        [v Filter] |
+------------------------------------------+
|  [Session] [Persistent] [Secure] [3rd P] |
+------------------------------------------+
```

- **Input:** Full width minus filter button. 13px placeholder text. Icon left-aligned.
- **Filter dropdown button:** 28px square, chevron-down icon. Opens filter chip row.
- **Filter chips:** Horizontal scroll if overflowing. Each chip is a toggle.
  - Inactive: Background tertiary, text secondary, border color border
  - Active: Brand primary background at 10% opacity, brand primary text, brand primary border
  - Chips: "Session", "Persistent", "Secure", "Third-party"
- **Search behavior:** Filters as-you-type with 150ms debounce. Matches cookie name, value, and domain.

**Cookie List:**

Each cookie row is 44px tall in collapsed state. Rows alternate between background primary and background secondary for readability.

```
+------------------------------------------+
|  [>] session_id   s3k...f9a   .examp...  |
|      Secure HttpOnly  Expires: 30d  [x]  |
+------------------------------------------+
|  [>] _ga           UA-123...   .googl... |
|      --------      Expires: 2y   [x]     |
+------------------------------------------+
|  [>] csrf_token    abc12...    .examp...  |
|      Secure HttpOnly  Session    [x]      |
+------------------------------------------+
```

- **Row layout (collapsed, 2-line):**
  - **Line 1:** Expand chevron (12px) + Name (13px/500, truncate at 120px) + Value (12px mono, text tertiary, truncate at 100px) + Domain (12px, text secondary, truncate at 80px)
  - **Line 2:** Security flags as tiny colored pills + Expiry text + Delete button (16px X icon, danger red on hover)
- **Security flag pills (inline, 10px/500):**
  - `Secure`: Green background at 10%, green text
  - `HttpOnly`: Blue background at 10%, blue text
  - `SameSite`: Purple background at 10%, purple text
  - Missing flags show no pill (absence communicates the gap)
- **Hover state:** Row background lightens, delete button becomes visible (hidden by default, except on hover)
- **Click to expand:** Chevron rotates 90 degrees. Row expands to show all cookie fields inline.

**Expanded Cookie Row (inline edit):**

```
+------------------------------------------+
|  [v] session_id                    [x]   |
|  +----------------------------------+    |
|  | Name:    [session_id           ] |    |
|  | Value:   [s3kd8f...full value  ] |    |
|  | Domain:  [.example.com         ] |    |
|  | Path:    [/                     ] |    |
|  | Expires: [2026-03-15 14:30     ] |    |
|  | Secure:  [x]  HttpOnly: [x]     |    |
|  | SameSite:[Lax  v]               |    |
|  |                                  |    |
|  | [Save]  [Cancel]  [Protect: o]  |    |
|  +----------------------------------+    |
+------------------------------------------+
```

- **Fields:** Editable text inputs with 12px mono font. Full value shown (not truncated).
- **Checkboxes:** For Secure, HttpOnly boolean flags.
- **Dropdown:** SameSite (None, Lax, Strict).
- **Date picker:** For Expires field. "Session" option to clear expiry.
- **Save button:** Brand primary, 12px/500. Calls `chrome.cookies.set()`.
- **Cancel button:** Text secondary, 12px/400. Collapses row.
- **Protect toggle:** Slider toggle. On = cookie is "protected" (read-only, extension re-sets if site modifies). Free limit: 5 protected cookies. Lock icon appears after limit.
- **Background:** Background secondary with left border 3px brand primary.

**Cookie Count Badge:**

```
  47 cookies on example.com
```

- Located directly below the filter chips, left-aligned.
- 11px/400, text tertiary.
- Updates in real time as filters are applied: "12 of 47 cookies (filtered)".

**Action Bar (40px, fixed above footer):**

```
+------------------------------------------+
|  [+ Add]  [Export]  [Import]  [Delete All]|
+------------------------------------------+
```

- **Four buttons**, evenly spaced, icon + text.
- **Style:** 28px height, 6px radius, 12px/500 text.
  - `+ Add`: Brand primary outline. Opens a blank expanded row at top of list.
  - `Export`: Text secondary with download icon. Dropdown on click: JSON (free), Netscape [PRO], CSV [PRO], Header [PRO].
  - `Import`: Text secondary with upload icon. Opens file picker (JSON free, others [PRO]).
  - `Delete All`: Danger red outline. Confirmation dialog before executing.
- **Pro-locked formats:** Show lock icon (12px padlock glyph) next to format name. Clicking opens inline upgrade nudge (not a modal).

### 4.1.7 Profiles Tab

```
+------------------------------------------+
|                                          |
|  [Save Current as Profile]               |
|                                          |
|  +------------------------------------+  |
|  |  Admin Login                       |  |
|  |  example.com · 12 cookies          |  |
|  |  Last used: 2 hours ago            |  |
|  |  [Load]  [Edit]  [Delete]          |  |
|  +------------------------------------+  |
|  +------------------------------------+  |
|  |  Staging Environment               |  |
|  |  staging.example.com · 8 cookies   |  |
|  |  Last used: Yesterday              |  |
|  |  [Load]  [Edit]  [Delete]          |  |
|  +------------------------------------+  |
|  +------------------------------------+  |
|  |  [lock] Production (PRO)           |  |
|  |  ....................................  |
|  |  Unlock unlimited profiles         |  |
|  |  [Upgrade to Pro]                  |  |
|  +------------------------------------+  |
|                                          |
+------------------------------------------+
```

- **"Save Current" button:** Full width, brand primary, 36px height. Saves all cookies for the current domain. Opens a name input overlay (inline, not modal).
- **Profile cards:** 80px height each. White card with subtle shadow. 8px radius.
  - **Line 1:** Profile name (13px/600) + optional colored dot (user-assigned color)
  - **Line 2:** Domain(s) + cookie count (12px/400, text secondary)
  - **Line 3:** "Last used: relative time" (11px/400, text tertiary)
  - **Action buttons:** `Load` (brand primary text), `Edit` (text secondary), `Delete` (danger, only on hover)
- **Free limit display:** First 2 profiles are fully interactive. 3rd profile slot shows as a locked card:
  - Background: Background tertiary with 4px blur overlay
  - Lock icon: 16px padlock in Pro purple
  - Text: "Unlock unlimited profiles" (12px/400)
  - Button: "Upgrade to Pro" pill, Pro purple background, white text
- **Empty state (no profiles saved):**

```
+------------------------------------------+
|                                          |
|          [illustration: cookie           |
|           with a bookmark tag]           |
|                                          |
|     Save your cookies as profiles        |
|     to switch between accounts,          |
|     environments, or test states         |
|     with one click.                      |
|                                          |
|     [Save Current Cookies]               |
|                                          |
+------------------------------------------+
```

  - Illustration: 64x64px line-art style, brand primary color
  - Heading: 14px/600, text primary
  - Description: 12px/400, text secondary, centered, max-width 280px
  - CTA button: Brand primary, 36px height

### 4.1.8 Rules Tab

```
+------------------------------------------+
|                                          |
|  Auto-Delete Rules                       |
|  Automatically clean cookies based       |
|  on your rules.                          |
|                                          |
|  +------------------------------------+  |
|  |  *.tracking.com                    |  |
|  |  Trigger: On tab close             |  |
|  |  Exceptions: none                  |  |
|  |                          [ON/off]  |  |
|  +------------------------------------+  |
|  +------------------------------------+  |
|  |  [lock] Add another rule (PRO)     |  |
|  |  [Upgrade to Pro]                  |  |
|  +------------------------------------+  |
|                                          |
|  [+ Add Rule]                            |
|                                          |
+------------------------------------------+
```

- **Section header:** "Auto-Delete Rules" (14px/600) + description (12px/400, text secondary)
- **Rule cards:** Similar style to profile cards. 72px height.
  - **Line 1:** Domain pattern in monospace (13px/500). Glob syntax: `*.example.com`
  - **Line 2:** Trigger type (12px/400): "On tab close" | "After 30 min" | "Manual only"
  - **Line 3:** Exceptions count or "none" (11px/400, text tertiary)
  - **Toggle switch:** Right-aligned, 36x20px. Green when active, background tertiary when off.
- **"Add Rule" button:** Brand primary outline, full width, 36px.
  - Free tier: 1 rule allowed. After 1 rule, button shows lock icon and "Add another rule (PRO)" text.
  - Clicking locked button shows inline upgrade prompt (not a modal).

**Rule Editor (expanded inline):**

```
+------------------------------------------+
|  +------------------------------------+  |
|  | Domain Pattern:                    |  |
|  | [*.example.com                   ] |  |
|  | Supports glob: *, ?, [abc]        |  |
|  |                                    |  |
|  | Trigger:                           |  |
|  | ( ) On tab close                   |  |
|  | ( ) After timer: [30] minutes      |  |
|  | ( ) Manual only                    |  |
|  |                                    |  |
|  | Exceptions (optional):             |  |
|  | [login_token, session_id         ] |  |
|  | Comma-separated cookie names       |  |
|  |                                    |  |
|  | [Save Rule]  [Cancel]              |  |
|  +------------------------------------+  |
+------------------------------------------+
```

- Appears inline below the "Add Rule" button or below the rule being edited.
- **Domain pattern input:** Monospace, with helper text showing glob syntax.
- **Trigger radio buttons:** Three options with sub-inputs (timer has a number input).
- **Exceptions:** Comma-separated text input for cookie names to exclude from the rule.

### 4.1.9 Health Tab

```
+------------------------------------------+
|                                          |
|          Cookie Health Score             |
|                                          |
|             +--------+                   |
|             |   B+   |                   |
|             +--------+                   |
|          example.com                     |
|                                          |
|  +------------------------------------+  |
|  |  [!] 3 Tracking Cookies           |  |
|  |  ////////////////////////////////  |  |
|  |  ░░░░ Blurred details ░░░░░░░░░░  |  |
|  |  [Unlock Details - Pro]           |  |
|  +------------------------------------+  |
|  +------------------------------------+  |
|  |  [!] 5 Insecure Cookies           |  |
|  |  ////////////////////////////////  |  |
|  |  ░░░░ Blurred details ░░░░░░░░░░  |  |
|  |  [Unlock Details - Pro]           |  |
|  +------------------------------------+  |
|  +------------------------------------+  |
|  |  [i] 2 Oversized Cookies          |  |
|  +------------------------------------+  |
|  +------------------------------------+  |
|  |  [ok] 0 Expired Cookies           |  |
|  +------------------------------------+  |
|                                          |
|  [Run GDPR Scan]  1 free scan remaining  |
|                                          |
+------------------------------------------+
```

- **Health Score Badge:**
  - Centered, 64x64px rounded square (12px radius)
  - Grade letter: 28px/700, white text on colored background
  - Grade colors: A+/A = success green, B+/B = `#22C55E`, B-/C+ = warning amber, C/C- = `#F97316`, D/F = danger red
  - Domain name below: 12px/400, text secondary
  - Always visible for free users (the score itself is the hook)

- **Risk Breakdown Cards:**
  - 4 cards, each 56px collapsed height
  - **Card layout:** Icon (16px) + risk title (13px/500) + count badge
  - **Icon colors:** Danger red for tracking/insecure, warning amber for oversized, success green for zero-risk items
  - **Free tier treatment:** Title and count are visible. Detail text below title is blurred:
    - CSS: `filter: blur(4px)` on the detail paragraph
    - Overlay text: "Unlock Details" in Pro purple, centered over blur
    - Clicking "Unlock Details" triggers the Pro upgrade flow
  - **Pro tier treatment:** Full detail text visible, listing specific cookie names and recommendations

- **GDPR Scan Button:**
  - Full width, brand primary outline, 36px
  - "Run GDPR Scan" text with shield icon
  - Below button: "1 free scan remaining" (11px/400, text tertiary)
  - After free scan used: Button changes to "Run GDPR Scan (PRO)" with lock icon
  - **Compliance summary** (appears after scan): Blurred specifics on free, full detail on Pro
    - Categories found: Necessary, Functional, Analytics, Marketing
    - Count per category
    - Free: Category names and counts visible. Individual cookie assignments blurred.
    - Pro: Full breakdown with cookie-to-category mapping

### 4.1.10 Footer (36px height)

```
+------------------------------------------+
|  2/2 profiles used           Powered by Z|
+------------------------------------------+
```

- **Left side:** Usage counter (see Section 4.4)
- **Right side:** "Powered by" + Zovo logo mark (16px), text tertiary, 11px
- **Background:** Background secondary
- **Top border:** 1px solid border color
- **Padding:** 8px horizontal, 0 vertical (vertically centered)

**Free user footer variant:**

```
+------------------------------------------+
|  Limit reached  [Upgrade]    Powered by Z|
+------------------------------------------+
```

- "Upgrade" is a small text button in Pro purple (not a full button).

**Pro user footer variant:**

```
+------------------------------------------+
|  [PRO badge]                 Powered by Z|
+------------------------------------------+
```

- No usage counter. Gold "PRO" pill badge replaces counter.

---

## 4.2 Settings / Options Page

Opens in a new Chrome tab at `chrome-extension://[id]/options.html`. Full-page layout.

### 4.2.1 Layout Structure

```
+-----------------------------------------------------------+
|  [Z] Zovo Cookie Manager Settings              [v1.0.0]  |
+-----------------------------------------------------------+
|          |                                                |
|  General |  General Settings                              |
|  Export  |  +-----------------------------------------+   |
|  Profiles|  | Theme                                   |   |
|  Rules   |  | ( ) Light  ( ) Dark  (x) System         |   |
|  Sync    |  +-----------------------------------------+   |
|  Account |  | Default Tab                              |   |
|  About   |  | [Cookies  v]                             |   |
|          |  +-----------------------------------------+   |
|          |  | Popup Size                               |   |
|          |  | Height: [520px v]  (400-600)             |   |
|          |  +-----------------------------------------+   |
|          |  | Cookie Display                           |   |
|          |  | [x] Show security flag pills             |   |
|          |  | [x] Show cookie size                     |   |
|          |  | [x] Truncate long values                 |   |
|          |  +-----------------------------------------+   |
|          |                                                |
+-----------------------------------------------------------+
```

- **Left sidebar:** 200px wide. Navigation links with 12px left border accent on active item. Sticky positioning.
- **Right content area:** Max-width 640px, centered. Section cards with 8px radius, subtle shadow.
- **Page width:** Max 960px, centered on screen.
- **Background:** Background secondary. Cards on background primary.

### 4.2.2 Settings Sections

**General:**
- Theme toggle: Light / Dark / System (radio group)
- Default tab: Dropdown (Cookies, Profiles, Rules, Health)
- Popup height: Number input with range slider (400-600px, step 20)
- Cookie display preferences: Checkboxes for display options

**Export / Import:**
- Default export format: Dropdown (JSON, Netscape [PRO], CSV [PRO], Header [PRO])
- Include metadata on export: Checkbox
- Export scope default: Current site / All sites [PRO]
- Import conflict resolution: Replace existing / Skip duplicates / Ask each time

**Profiles:**
- List of saved profiles with edit/delete actions
- Profile name editing inline
- Encryption toggle [PRO]: "Encrypt stored profiles with a master password"
  - Master password input (shown when toggle is on)
  - 12px helper text: "Profiles are encrypted locally with AES-256"
- Import/export profiles as file

**Rules:**
- List of auto-delete rules (same card format as popup)
- Full rule editor with more space than popup version
- Rule import/export
- [PRO] badge on "Add Rule" button after 1 rule

**Sync:**
- Cross-device sync toggle [PRO]
  - Off state: Toggle disabled appearance with lock icon and "Requires Zovo Pro" label
  - On state (Pro): Toggle active, green indicator
- Sync status: "Last synced: 3 min ago" or "Not connected"
- Sync scope: Checkboxes for what to sync (Profiles, Rules, Settings)
- "Sync Now" manual button

**Account:**
- Zovo membership status card:
  - Free: "Free Plan" with usage summary and "Upgrade to Pro" button (brand primary, prominent)
  - Pro: "Zovo Pro" badge in gold with renewal date and "Manage Subscription" link
- Sign in / Sign out button
- Email display (if signed in)
- "Manage Subscription" link to zovo.app

**About:**
- Version number with build date
- "What's New" link to changelog (opens in new tab)
- "Support & Feedback" link to support page
- "Rate on Chrome Web Store" link
- **"More Zovo Tools" cross-promotion section:**

```
  +---------------------------------------------+
  |  More Zovo Tools                             |
  |  +--------+ +--------+ +--------+           |
  |  |Clipbrd | |JSON Fmt| |Tab Susp|           |
  |  |History | |  Pro   | |  Pro   |           |
  |  |[Install]| [Install]| [Install]|           |
  |  +--------+ +--------+ +--------+           |
  |  View all 18 tools at zovo.app/tools  ->    |
  +---------------------------------------------+
```

  - Shows 3 recommended extensions (not yet installed) with small icons and install buttons
  - "View all" link to Zovo website
  - Cards: 100px wide, 80px tall, 6px radius, background secondary

---

## 4.3 Pro Feature Indicators

### 4.3.1 Lock Icon Style

Two variants used throughout the interface:

**Variant A: Padlock Glyph**
- 12x12px padlock icon
- Color: Pro purple (`#7C3AED`) at 70% opacity
- Used inline next to individual feature labels (e.g., export format names, toggle labels)
- On hover: Opacity increases to 100%, tooltip appears: "Requires Zovo Pro"

**Variant B: PRO Pill Badge**
- 28x14px rounded pill (16px border-radius)
- Background: Linear gradient from `#7C3AED` to `#6D28D9`
- Text: "PRO" in 9px/700 white, uppercase, letter-spacing 0.5px
- Used next to section headers, button labels, and tab items for Pro-only sections
- On hover: Subtle glow effect (`box-shadow: 0 0 8px rgba(124, 58, 237, 0.3)`)

### 4.3.2 Blur Treatment (Grammarly-Style)

Applied to premium content that is partially visible to free users:

```
+------------------------------------+
|  3 Tracking Cookies Detected       |   <- Visible (hook)
|  ////////////////////////////////  |
|  ░░ facebook.com _fbp: This co ░░  |   <- Blurred content
|  ░░ google.com _ga: Tracks use ░░  |
|  ░░ doubleclick.net: Advertisin░░  |
|  ////////////////////////////////  |
|                                    |
|      [Unlock with Pro]             |   <- CTA overlay
|      See the full analysis  ->     |
+------------------------------------+
```

- **CSS implementation:** `filter: blur(4px)` on the content container
- **Overlay:** Semi-transparent white/dark background (`rgba(255, 255, 255, 0.6)` light / `rgba(26, 29, 35, 0.6)` dark) positioned absolutely over blurred content
- **CTA button:** Pro purple background, white text, 32px height, centered
- **Secondary link:** "See the full analysis" in Pro purple text, 12px, below button
- **Interaction:** Clicking anywhere on the blurred area or overlay opens the upgrade flow

### 4.3.3 Extension Icon Badge

- **Badge:** Small colored dot overlay on the extension toolbar icon (using `chrome.action.setBadgeBackgroundColor` and `chrome.action.setBadgeText`)
- **Conditions:**
  - Health score D or F: Red dot with count of critical issues (e.g., "3")
  - Health score C: Amber dot with "!"
  - No issues: No badge
- **Badge text:** Max 3 characters. Uses the risk count number.
- **Badge background:** Matches severity color (danger red or warning amber)

### 4.3.4 Post-Upgrade Transition

When a user upgrades to Pro:

1. **Lock icons:** Animate out with a 300ms fade + slight upward translate (4px). Replaced by a brief green checkmark that fades after 1 second.
2. **PRO badge in header:** Slides in from right with a 300ms ease-out. Gold background with subtle shimmer animation on first appearance (one-time, 2 seconds).
3. **Blur overlays:** Dissolve with a 500ms transition (`filter: blur(4px)` to `filter: blur(0)`). Content behind becomes readable in a satisfying reveal.
4. **Footer:** Usage counter cross-fades to "PRO" badge (300ms).
5. **Pro-only features:** Subtle gold left-border (3px) accent on cards/rows that were previously locked, visible for the first session after upgrade. Fades to normal styling after that.

---

## 4.4 Usage Counter UI

### 4.4.1 Location and Layout

- **Position:** Bottom-left of popup footer, vertically centered within 36px footer height
- **Font:** 11px/500, tabular-nums for consistent width as numbers change

### 4.4.2 Display Format

The counter is **contextual to the active tab:**

| Active Tab | Counter Text | Example |
|-----------|-------------|---------|
| Cookies | Protected cookie count | "3/5 cookies protected" |
| Profiles | Profile count | "2/2 profiles used" |
| Rules | Rule count | "1/1 rule created" |
| Health | Scan count | "0/1 GDPR scans used" |

### 4.4.3 Color States

- **0-50% capacity** (e.g., 0/2 or 1/2): Success green (`#16A34A`)
- **51-80% capacity** (e.g., rounded -- applies at next threshold): Warning amber (`#D97706`)
- **81-100% capacity** (e.g., 2/2): Danger red (`#DC2626`)

### 4.4.4 Limit Reached Behavior

When the user hits 100% of a free tier limit:

1. Counter text pulses once (scale 1.0 to 1.05 to 1.0 over 600ms)
2. Text changes to: **"Limit reached -- Upgrade"** in danger red
3. "Upgrade" portion is clickable (text-decoration underline on hover), opens upgrade flow
4. After 5 seconds, settles back to the static count (e.g., "2/2 profiles used") to avoid being annoying
5. On subsequent popup opens, shows the static count in danger red (no repeat pulse)

### 4.4.5 Pro User State

- Counter is replaced entirely by a gold "PRO" pill badge (same style as header PRO badge but 24x12px)
- No usage numbers displayed for Pro users

---

## 4.5 Context Menu Integration

Right-clicking on any web page adds a "Zovo Cookie Manager" submenu to the browser context menu.

### 4.5.1 Menu Structure

```
+----------------------------------+
|  Zovo Cookie Manager          >  |
|  +----------------------------+  |
|  |  View cookies for this site|  |
|  |  Quick delete all cookies  |  |
|  |  ----------------------    |  |
|  |  Save as profile           |  |
|  |  Copy cookies as cURL      |  |
|  +----------------------------+  |
+----------------------------------+
```

### 4.5.2 Menu Items

| Item | Icon | Action | Notes |
|------|------|--------|-------|
| View cookies for this site | Cookie icon | Opens popup to Cookies tab for current domain | Always available |
| Quick delete all cookies | Trash icon | Deletes all cookies for current domain after confirmation | Confirmation via Chrome notification (not a dialog). "Deleted 23 cookies from example.com. [Undo]" |
| Save as profile | Bookmark icon | Saves current cookies as new profile, prompts for name via notification input | Free: Only if under 2 profile limit. Otherwise: shows "Upgrade to save more profiles" notification |
| Copy cookies as cURL | Terminal icon | Copies `curl -b "name=value; ..."` command to clipboard | Free: current site only. Notification: "cURL command copied to clipboard" |

### 4.5.3 Visual Style

- Uses Chrome's native context menu styling (no custom rendering)
- Separator line between "view/delete" group and "save/copy" group
- Icons: 16x16px, monochrome, matching system context menu icon style
- Disabled items (when limit reached): Grayed out text with "(Pro)" suffix

---

## 4.6 DevTools Panel (P1 Feature)

A dedicated "Cookies" panel in Chrome DevTools, accessible alongside Elements, Console, Network, etc.

### 4.6.1 Panel Layout

```
+-----------------------------------------------------------+
|  Elements | Console | Sources | Network | [Cookies]       |
+-----------------------------------------------------------+
|                                                           |
|  +-------------------------+  +-----------------------+   |
|  | Cookie List             |  | Cookie Detail / Log   |   |
|  | (left pane, 50%)        |  | (right pane, 50%)     |   |
|  |                         |  |                       |   |
|  | [Search...]             |  | [Detail] [Changes]    |   |
|  |                         |  |                       |   |
|  | > example.com (23)      |  | Name: session_id      |   |
|  |   session_id            |  | Value: s3kd8f9a       |   |
|  |   csrf_token            |  | Domain: .example.com  |   |
|  |   _theme                |  | Path: /               |   |
|  | > google.com (15)       |  | Expires: 2026-03-15   |   |
|  |   _ga                   |  | Size: 128 bytes       |   |
|  |   _gid                  |  | Secure: Yes           |   |
|  |   NID                   |  | HttpOnly: Yes         |   |
|  |                         |  | SameSite: Lax         |   |
|  |                         |  |                       |   |
|  |                         |  | [Edit] [Delete] [Copy]|   |
|  +-------------------------+  +-----------------------+   |
|                                                           |
|  +-----------------------------------------------------+  |
|  | Real-Time Change Log (PRO)                          |  |
|  | 14:32:01  + _ga  added     google.com    [PRO]      |  |
|  | 14:32:03  ~ NID  modified  google.com    [PRO]      |  |
|  | 14:33:15  - temp removed   example.com   [PRO]      |  |
|  +-----------------------------------------------------+  |
+-----------------------------------------------------------+
```

### 4.6.2 Panel Specifications

**Left Pane (Cookie List):**
- Domain tree view with collapsible groups. Domain name + cookie count in parentheses.
- Search bar at top filters across all domains.
- Click a cookie to show details in right pane.
- Multi-select with Ctrl/Cmd+Click for bulk operations.
- Right-click context menu: Edit, Delete, Copy Value, Copy as cURL, Add to Profile.

**Right Pane (Cookie Detail):**
- Two sub-tabs: "Detail" (default) and "Changes" [PRO]
- Detail view: All cookie properties in a key-value list. Editable fields (same as popup inline edit but with more space).
- Changes sub-tab [PRO]: History of modifications to the selected cookie. Timestamped log entries.

**Bottom Pane (Real-Time Change Log) [PRO]:**
- Collapsible bottom panel, default 150px height, resizable.
- Scrolling log of cookie changes via `chrome.cookies.onChanged`.
- Columns: Timestamp (HH:MM:SS) | Change type icon (+/-/~) | Cookie name | Domain | Cause
- Change type colors: Added = success green, Modified = warning amber, Removed = danger red
- Free tier: Bottom pane visible but shows 3 blurred sample entries with "Unlock real-time monitoring with Pro" overlay.
- Pro tier: Live, scrolling, filterable log.

**Bulk Operations Toolbar (visible when multi-selecting):**

```
+-----------------------------------------------------------+
|  3 cookies selected  [Delete] [Export] [Add to Profile]   |
+-----------------------------------------------------------+
```

- Appears at top of left pane when 2+ cookies are selected.
- Delete: Bulk delete with confirmation count.
- Export: Download selected cookies in chosen format.
- Add to Profile: Save selected cookies to a new or existing profile.

**Snapshot Diff View [PRO]:**

```
+-----------------------------------------------------------+
|  Snapshot A: "Before login"    |  Snapshot B: "After login"|
|  Taken: 14:25:03              |  Taken: 14:26:15         |
+-------------------------------+---------------------------+
|  session_id                   |  session_id               |
|  (not present)        [RED]   |  s3kd8f9a         [GRN]  |
|                               |                           |
|  csrf_token                   |  csrf_token               |
|  abc123              [AMBER]  |  xyz789            [AMBER]|
|                               |                           |
|  _ga                          |  _ga                      |
|  UA-12345             [GRAY]  |  UA-12345          [GRAY] |
+-------------------------------+---------------------------+
|  Summary: +1 added, 1 modified, 0 removed                |
+-----------------------------------------------------------+
```

- Side-by-side view with synchronized scrolling.
- Color coding: Green = added, Red = removed, Amber = modified, Gray = unchanged.
- Summary bar at bottom with counts.
- Accessible via: Select two snapshots from the Snapshots list and click "Compare".

### 4.6.3 DevTools Panel Free vs Pro

| Feature | Free | Pro |
|---------|------|-----|
| Cookie list with domain tree | Yes | Yes |
| Search and filter | Yes | Yes |
| View cookie details | Yes | Yes |
| Edit individual cookies | Yes | Yes |
| Delete individual cookies | Yes | Yes |
| Multi-select and bulk operations | No | Yes |
| Real-time change log | Preview (blurred) | Full |
| Snapshot diff view | No | Yes |
| Export from DevTools | JSON only | All formats |

---

## 4.7 Component States Reference

### 4.7.1 Button States

| State | Style |
|-------|-------|
| Default | Background per variant, text color per variant, border per variant |
| Hover | Background darkens 8%. Cursor pointer. Transition 150ms. |
| Active/Pressed | Background darkens 12%. Scale 0.98. |
| Disabled | Opacity 0.5. Cursor not-allowed. No hover effect. |
| Loading | Text replaced by 14px spinner (circular, 2px stroke). Button width preserved. |

### 4.7.2 Input States

| State | Style |
|-------|-------|
| Default | 1px border color. Background primary. |
| Focus | 2px brand primary border. Subtle blue glow (`box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1)`). |
| Error | 2px danger red border. Red glow. Helper text in danger red below. |
| Disabled | Background tertiary. Text tertiary. Cursor not-allowed. |

### 4.7.3 Toggle Switch States

- **Off:** 36x20px. Background tertiary. Circle (16px) left-aligned, white.
- **On:** Background success green. Circle slides right (150ms ease-out).
- **Disabled:** Opacity 0.5.

### 4.7.4 Toast Notifications

- Appear at top-center of popup, 12px below header.
- 320px wide, 40px height, 6px radius, medium shadow.
- Auto-dismiss after 3 seconds. Slide-down entrance (200ms), fade-out exit (300ms).
- Variants: Success (green left border), Error (red left border), Info (blue left border).

### 4.7.5 Feature Discovery Indicator

- **Pulsing blue dot:** 8px circle, brand primary color.
- Animation: Scale 1.0 to 1.4 to 1.0 with opacity 1.0 to 0.6 to 1.0, repeating every 2 seconds.
- Positioned top-right of untried features (tab labels, buttons).
- Disappears permanently after the user clicks the feature once.
- Maximum 1 pulsing dot visible at any time (prioritize the most valuable feature to discover).
- Stored in `chrome.storage.local` to track which features have been discovered.
