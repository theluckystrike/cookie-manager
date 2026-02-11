# Screenshot Specifications: Zovo Cookie Manager

## Phase 06 | Agent 3 | Generated 2026-02-11

---

## Screenshot Style Guide (Consistent Across All 5)

### Canvas & Background

- **Dimensions:** 1280x800 PNG, sRGB color profile, 72 DPI
- **Background gradient:** Linear from `#f0f3ff` (top-left) to `#f8fafc` (bottom-right), angle 135 degrees
- **Safe margin:** 40px inset on all four edges -- no critical content within this zone

### Typography

| Element | Font | Size | Weight | Color | Alignment |
|---------|------|------|--------|-------|-----------|
| Headline | Inter | 42px | 600 (Semibold) | `#1e293b` | Center-horizontal, top 12-16% of canvas |
| Subtext | Inter | 20px | 400 (Regular) | `#475569` | Center-horizontal, 8px below headline |
| Feature callout | Inter | 16px | 500 (Medium) | `#475569` | Left-aligned, next to callout arrow |
| Badge text | Inter | 11px | 700 (Bold) | `#FFFFFF` | Center within badge pill |

### Popup Rendering

- **Popup dimensions within screenshot:** 400px wide x 520px tall (1:1 pixel ratio with actual extension)
- **Popup position:** Center-horizontal, vertically centered in the lower 65% of the canvas (top edge ~200px from top of canvas)
- **Popup shadow:** `0 20px 40px rgba(0, 0, 0, 0.15)` -- cast downward to create floating depth
- **Popup border radius:** 8px (matches Chrome popup rendering)
- **Popup border:** 1px solid `#E0E2E6`
- **Background within popup:** `#FFFFFF` (light mode for all screenshots)

### Branding

- **Zovo logo:** Placed at bottom-right of canvas, 80px wide, `60%` opacity
- **Position:** 40px from right edge, 32px from bottom edge
- **Logo variant:** Zovo wordmark in `#6366f1` (primary purple), not the icon-only mark

### Badges & Overlays

- **Pro badge:** 36x16px rounded pill, `border-radius: 16px`, background linear gradient `#7C3AED` to `#6D28D9`, text "PRO" in 9px/700 white uppercase, letter-spacing 0.5px
- **Free badge (where applicable):** 42x16px rounded pill, background `#10b981`, text "FREE" in 9px/700 white uppercase
- **Callout arrows:** 2px stroke, `#6366f1`, with a small filled circle at the origin (6px diameter) pointing to the feature being highlighted

### Tools for Creation

**Primary method:** Build each screenshot in Figma (preferred) or Canva.

1. Create a 1280x800 frame with the gradient background.
2. Render the extension popup as a high-fidelity mockup at 400x520px using the actual design system components. Alternatively, take a real browser screenshot of the built extension with sample data pre-loaded, crop to popup bounds, and drop into the frame.
3. Apply the shadow and position the popup.
4. Add headline, subtext, callout annotations, and Zovo branding.
5. Export as PNG with maximum quality (no lossy compression).

**Alternative method:** Screenshot the running extension in Chrome, paste into a Figma/Canva template with pre-configured background, headline, and branding layers.

---

## Screenshot 1: Hero Shot -- "All Your Cookies, One Click"

### Purpose

Instant comprehension. The user scrolling the Chrome Web Store sees the popup and immediately understands: this extension lets me view, search, and manage cookies for any website.

### Headline & Subtext

- **Headline:** "All Your Cookies, One Click"
- **Headline position:** Center-horizontal, top of canvas at y=80px
- **Subtext:** "View, edit, search, and export cookies for any site instantly."
- **Subtext position:** Center-horizontal, y=132px

### Layout Description

The popup is positioned center-horizontal, with its top edge at y=180px. It shows the **Cookies tab** active, populated with realistic cookie data for `github.com`.

**Popup contents from top to bottom:**

1. **Header (56px):**
   - Left: Zovo logo mark (24x24px, `#2563EB`) + "Zovo Cookie Manager" in 14px/600 `#1A1D23`
   - Right: Gear icon (20x20px, `#5F6368`)
   - Second line: "github.com  ·  23 cookies" in 13px/400 `#5F6368`
   - Bottom border: 1px solid `#E0E2E6`

2. **Tab bar (40px):**
   - Four tabs evenly spaced at 100px each: **Cookies** (active, `#1A1D23`, 2px bottom border `#2563EB`), Profiles (`#5F6368`), Rules (`#5F6368`), Health (`#5F6368`)
   - Tab icons: 16px cookie icon (active), user icon, list icon, heart icon -- all inline left of label

3. **Search bar (36px):**
   - Search icon (16px, `#9AA0A6`) left-aligned inside input
   - Placeholder text: "Search cookies..." in 13px/400 `#9AA0A6`
   - Filter button right-aligned: 28x28px square with chevron-down icon

4. **Filter chips row (28px):**
   - Four toggle chips: "Session" (active, `#2563EB` text on `rgba(37, 99, 235, 0.1)` background with `#2563EB` border), "Persistent" (inactive, `#5F6368` text on `#EDEEF2` background), "Secure" (inactive), "Third-party" (inactive)
   - Chip height: 24px, border-radius: 16px, font: 11px/500

5. **Cookie count badge:**
   - "23 cookies on github.com" in 11px/400 `#9AA0A6`, left-aligned, 8px below filter chips

6. **Cookie list (scrollable area, showing 8 visible rows):**

   | # | Name | Value (truncated) | Domain | Flags | Expiry |
   |---|------|-------------------|--------|-------|--------|
   | 1 | `_gh_sess` | `a8K2dLP9x...` | `.github.com` | Secure, HttpOnly | Session |
   | 2 | `dotcom_user` | `mikedev` | `.github.com` | Secure, HttpOnly | 365d |
   | 3 | `logged_in` | `yes` | `.github.com` | Secure, HttpOnly | 365d |
   | 4 | `_octo` | `GH1.1.178...` | `.github.com` | Secure | 365d |
   | 5 | `_device_id` | `e7f2a91b4...` | `.github.com` | Secure, HttpOnly | 365d |
   | 6 | `color_mode` | `%7B%22col...` | `.github.com` | Secure | 365d |
   | 7 | `preferred_color_mode` | `dark` | `.github.com` | Secure | 365d |
   | 8 | `tz` | `America%2F...` | `.github.com` | Secure | Session |

   **Row rendering per spec:** Each row is 44px tall, two-line layout.
   - **Line 1:** Expand chevron (12px, `#9AA0A6`) + Cookie name (13px/500, `#1A1D23`, truncated at 120px) + Value (12px mono `SF Mono`, `#9AA0A6`, truncated at 100px) + Domain (12px, `#5F6368`, truncated at 80px)
   - **Line 2:** Security flag pills (10px/500) -- "Secure" pill (green bg 10%, `#16A34A` text), "HttpOnly" pill (blue bg 10%, `#0EA5E9` text) + Expiry text (11px/400, `#9AA0A6`) + Delete X icon (16px, hidden by default -- show on row 3 as if hovered, `#DC2626`)
   - Alternating row backgrounds: `#FFFFFF` and `#F7F8FA`

7. **Action bar (40px, fixed above footer):**
   - Four buttons evenly spaced, each 28px height, 6px radius, 12px/500:
     - "+ Add" -- `#2563EB` outline, brand primary text
     - "Export" -- `#5F6368` text with download icon
     - "Import" -- `#5F6368` text with upload icon
     - "Delete All" -- `#DC2626` outline, danger text

8. **Footer (36px):**
   - Left: "2/2 profiles used" in 11px/500, `#16A34A` (green, 0-50% capacity)
   - Right: "Powered by" + Zovo logo mark (16px) in 11px/400 `#9AA0A6`
   - Background: `#F7F8FA`, top border 1px solid `#E0E2E6`

### Callout Annotations (outside popup)

- **Left side, pointing to search bar:** Small callout arrow from left with text "Instant search across name, value, and domain" in 16px/500 `#475569`
- **Right side, pointing to filter chips:** Callout arrow with text "Filter by type" in 16px/500 `#475569`

### Colors Used

| Element | Color |
|---------|-------|
| Canvas gradient start | `#f0f3ff` |
| Canvas gradient end | `#f8fafc` |
| Headline text | `#1e293b` |
| Subtext | `#475569` |
| Popup background | `#FFFFFF` |
| Active tab underline | `#2563EB` |
| Secure pill | `#16A34A` on `rgba(22, 163, 74, 0.1)` |
| HttpOnly pill | `#0EA5E9` on `rgba(14, 165, 233, 0.1)` |

---

## Screenshot 2: Key Feature -- Cookie Profiles

### Purpose

Show the profile management workflow. A developer sees that they can save, name, and switch between cookie states -- the feature that distinguishes this extension from every competitor.

### Headline & Subtext

- **Headline:** "Switch Environments in Seconds"
- **Headline position:** Center-horizontal, y=80px
- **Subtext:** "Save and restore cookie profiles for dev, staging, and production."
- **Subtext position:** Center-horizontal, y=132px

### Layout Description

The popup is positioned center-horizontal, top edge at y=180px. The **Profiles tab** is active.

**Popup contents from top to bottom:**

1. **Header (56px):**
   - Same as Screenshot 1 but domain reads: "app.example.com  ·  31 cookies"

2. **Tab bar (40px):**
   - "Profiles" is the active tab (`#1A1D23`, 2px bottom border `#2563EB`), others inactive

3. **"Save Current as Profile" button:**
   - Full-width button inside 12px horizontal padding
   - Height: 36px, border-radius: 6px
   - Background: `#2563EB`, text: "Save Current as Profile" in 13px/500 `#FFFFFF`
   - 8px margin-top from tab bar, 12px margin-bottom

4. **Profile card 1 -- "Dev Environment":**
   - Card: Full-width minus 12px horizontal padding, 80px height, white background, 8px border-radius, shadow `0 1px 2px rgba(0, 0, 0, 0.05)`
   - **Line 1:** "Dev Environment" in 13px/600 `#1A1D23` + green circle dot (8px, `#16A34A`) indicating user-assigned color
   - **Line 2:** "localhost:3000  ·  14 cookies" in 12px/400 `#5F6368`
   - **Line 3:** "Last used: 2 hours ago" in 11px/400 `#9AA0A6`
   - **Action buttons (right-aligned on Line 1):** "Load" (12px/500, `#2563EB`), "Edit" (12px/500, `#5F6368`), "Delete" (12px/500, `#DC2626`, slightly dimmed)
   - 8px margin-bottom

5. **Profile card 2 -- "Staging Login":**
   - Same card structure as above
   - **Line 1:** "Staging Login" + blue circle dot (8px, `#2563EB`)
   - **Line 2:** "staging.example.com  ·  22 cookies"
   - **Line 3:** "Last used: Yesterday"
   - Same action buttons
   - 8px margin-bottom

6. **Profile card 3 -- "QA Session":**
   - Same card structure
   - **Line 1:** "QA Session" + amber circle dot (8px, `#D97706`)
   - **Line 2:** "qa.example.com  ·  18 cookies"
   - **Line 3:** "Last used: 3 days ago"
   - Same action buttons
   - 8px margin-bottom

7. **Locked profile card -- "Unlock Unlimited Profiles":**
   - Card: Full-width, 72px height, background `#EDEEF2` with `filter: blur(0px)` on the card itself but a 4px blur on a faux content area inside
   - Lock icon: 16px padlock in `#7C3AED` (Pro purple), top-left of card interior
   - Text: "[lock] Production Cookies" in 13px/500 `#7C3AED`, partially blurred
   - Below text: "Unlock unlimited profiles" in 12px/400 `#5F6368`
   - Button: "Upgrade to Pro" -- 90px wide, 28px height, `border-radius: 16px`, background gradient `#7C3AED` to `#6D28D9`, text "Upgrade to Pro" in 10px/600 `#FFFFFF`
   - **Pro badge** (36x16px) positioned inline next to the lock icon

8. **Footer (36px):**
   - Left: "2/2 profiles used" in 11px/500, `#DC2626` (danger red, 100% capacity)
   - Right: "Powered by" + Zovo logo mark

### Callout Annotations (outside popup)

- **Right side, pointing to profile card 1:** Arrow with text "One-click restore" in 16px/500 `#475569`
- **Left side, pointing to locked card:** Arrow with text "Unlimited with Pro" in 16px/500 `#7C3AED`

### Sample Data Rationale

The three profile names reflect real developer workflows: local development, staging environment, and QA testing. The cookie counts (14, 22, 18) are realistic for web apps. The "Last used" timestamps show active recent usage to convey the profiles feature as something used daily.

### Colors Used

| Element | Color |
|---------|-------|
| Save button background | `#2563EB` |
| Active profile dot (green) | `#16A34A` |
| Active profile dot (blue) | `#2563EB` |
| Active profile dot (amber) | `#D97706` |
| Pro purple (lock, badge) | `#7C3AED` |
| Pro gradient end | `#6D28D9` |
| Limit reached text | `#DC2626` |

---

## Screenshot 3: Key Feature -- Auto-Delete Rules

### Purpose

Demonstrate the rules engine for automatic cookie cleanup. This is the second differentiator and a strong Pro conversion driver. The screenshot must make the user think "I need this."

### Headline & Subtext

- **Headline:** "Automatic Cookie Cleanup"
- **Headline position:** Center-horizontal, y=80px
- **Subtext:** "Set rules to delete tracking cookies on tab close or timer."
- **Subtext position:** Center-horizontal, y=132px

### Layout Description

The popup is positioned center-horizontal, top edge at y=180px. The **Rules tab** is active.

**Popup contents from top to bottom:**

1. **Header (56px):**
   - Domain: "amazon.com  ·  58 cookies"

2. **Tab bar (40px):**
   - "Rules" is the active tab

3. **Section header:**
   - "Auto-Delete Rules" in 14px/600 `#1A1D23`
   - "Automatically clean cookies based on your rules." in 12px/400 `#5F6368`
   - 8px top margin, 12px bottom margin

4. **Rule card 1 -- Active rule (tracking cookies):**
   - Card: Full-width minus 12px padding, 72px height, white background, 8px border-radius, shadow `0 1px 2px rgba(0, 0, 0, 0.05)`, left border 3px solid `#16A34A` (green, indicating active)
   - **Line 1:** `*.doubleclick.net` in 13px/500 monospace `SF Mono` `#1A1D23`
   - **Line 2:** "Trigger: On tab close" in 12px/400 `#5F6368`
   - **Line 3:** "Exceptions: none" in 11px/400 `#9AA0A6`
   - **Toggle switch (right-aligned, vertically centered):** 36x20px, background `#16A34A` (green, ON state), white circle 16px slid to right
   - 8px margin-bottom

5. **Rule card 2 -- Active rule (social media cookies):**
   - Same card structure with 3px left border `#16A34A`
   - **Line 1:** `*.facebook.com, *.instagram.com` in monospace
   - **Line 2:** "Trigger: After 1 hour"
   - **Line 3:** "Exceptions: login_token"
   - Toggle: ON (green)
   - 8px margin-bottom

6. **Rule card 3 -- Active rule (analytics cleanup):**
   - Same card structure with 3px left border `#16A34A`
   - **Line 1:** `_ga*, _gid, _gcl_*` in monospace
   - **Line 2:** "Trigger: On tab close"
   - **Line 3:** "Exceptions: none"
   - Toggle: ON (green)
   - 8px margin-bottom

7. **Locked "Add Rule" area:**
   - Card: Full-width, 56px height, background `#EDEEF2`, 8px border-radius, dashed 1px border `#9AA0A6`
   - Lock icon (12px, `#7C3AED` at 70%) inline with text
   - Text: "[lock] Add another rule" in 12px/500 `#7C3AED`
   - **Pro badge** (36x16px) inline after text
   - Hover tooltip (shown as a static callout in the screenshot): "Unlimited rules automate cleanup across every site. Available with Zovo Pro."

8. **"+ Add Rule" button:**
   - Full-width, 36px, `#2563EB` outline border, text: "+ Add Rule" in 13px/500 `#2563EB`
   - Visually dimmed (opacity 0.5) to indicate the free limit is reached

9. **Footer (36px):**
   - Left: "1/1 rule created" in 11px/500, `#DC2626` (danger red -- but for the screenshot we show 3 rules to demonstrate the feature, so display "3 rules active" in `#16A34A` -- this is a Pro state preview)
   - Right: "Powered by" + Zovo logo mark

**Note on rule count:** The screenshot deliberately shows 3 active rules to demonstrate the full power of the feature, even though free tier allows only 1. This is acceptable because screenshots show the product at its best. The locked "Add Rule" area below the 3 cards makes the Pro boundary clear.

### Callout Annotations (outside popup)

- **Right side, pointing to the toggle switch on rule 1:** Arrow with text "Enable/disable per rule" in 16px/500 `#475569`
- **Left side, pointing to rule 2 Line 2:** Arrow with text "Timer-based or tab close" in 16px/500 `#475569`
- **Bottom-left, pointing to locked area:** Arrow with text "Free: 1 rule  |  Pro: Unlimited" in 16px/500 `#7C3AED`

### Sample Data Rationale

The three rules represent the most common cookie cleanup scenarios:
- **doubleclick.net:** Google ad tracking -- every developer recognizes this domain
- **facebook.com + instagram.com:** Social media tracking -- universally understood privacy concern
- **_ga*, _gid, _gcl_*:** Google Analytics cookies -- the most commonly encountered tracking cookies on the web

Using glob patterns (`*`) demonstrates the pattern matching capability.

### Colors Used

| Element | Color |
|---------|-------|
| Active rule left border | `#16A34A` |
| Toggle ON background | `#16A34A` |
| Monospace domain pattern | `#1A1D23` (on `SF Mono`) |
| Locked text / Pro elements | `#7C3AED` |
| Dimmed add button | `#2563EB` at 50% opacity |

---

## Screenshot 4: Export & Developer Tools

### Purpose

Appeal to the primary audience (developers, QA engineers) by showing the export/cURL workflow. This screenshot proves the extension is built for technical users, not just casual cookie viewers.

### Headline & Subtext

- **Headline:** "Developer-Friendly Cookie Tools"
- **Headline position:** Center-horizontal, y=80px
- **Subtext:** "Export as JSON, generate cURL commands, copy values instantly."
- **Subtext position:** Center-horizontal, y=132px

### Layout Description

This screenshot uses a **split layout** to show two things at once: the popup with the export dropdown open, and a floating code preview panel showing the generated output.

**Left element -- Popup (reduced width for composition):**

Popup positioned at x=120, y=190. Shows the Cookies tab with the **export dropdown open**.

1. **Header (56px):**
   - Domain: "api.stripe.com  ·  12 cookies"

2. **Tab bar (40px):**
   - "Cookies" is the active tab

3. **Cookie list (showing 5 visible rows):**

   | # | Name | Value (truncated) | Domain |
   |---|------|-------------------|--------|
   | 1 | `__stripe_mid` | `f8c2b7e4-...` | `.stripe.com` |
   | 2 | `__stripe_sid` | `a1d9c3e8-...` | `.stripe.com` |
   | 3 | `machine_identifier` | `b23f91a0...` | `.stripe.com` |
   | 4 | `merchant-config` | `pk_live_...` | `api.stripe.com` |
   | 5 | `locale` | `en-US` | `.stripe.com` |

   Rows use the standard 44px two-line format from Screenshot 1.

4. **Action bar with Export dropdown OPEN:**
   - "Export" button is in pressed/active state (background `#2563EB` at 10%, `#2563EB` text)
   - **Dropdown menu** floats below the Export button:
     - Menu: 180px wide, white background, 8px border-radius, shadow `0 4px 16px rgba(0, 0, 0, 0.12)`, 1px solid `#E0E2E6`
     - Menu items (each 36px tall, 13px/400 `#1A1D23`, 12px horizontal padding):
       - "JSON" -- no icon, checkmark indicator showing it as default
       - "Netscape" + lock icon (12px, `#7C3AED` at 70%) + **PRO** pill badge
       - "CSV" + lock icon + PRO badge
       - "Header String" + lock icon + PRO badge
     - Separator line (1px `#E0E2E6`) between JSON and Netscape
     - "JSON" item has a subtle `#F7F8FA` background (selected/default state)

5. **Footer (36px):** Standard footer

**Right element -- Code preview panel:**

Floating panel positioned at x=620, y=220. Dimensions: 520px wide x 420px tall. White background, 8px border-radius, shadow `0 20px 40px rgba(0, 0, 0, 0.15)`.

**Panel contents:**

1. **Panel header (40px):**
   - Left: Tab toggles -- "JSON" (active, `#2563EB` underline) | "cURL" (inactive, `#5F6368`)
   - Right: Copy button -- 32x32px square, `#5F6368` clipboard icon, 6px border-radius, `#F7F8FA` background
   - Below: "Copied!" success toast shown in green (`#16A34A`) floating above the copy button to demonstrate the copy-to-clipboard interaction
   - Bottom border: 1px solid `#E0E2E6`

2. **Code area (JSON view shown):**
   - Background: `#1A1D23` (dark, code editor style)
   - Font: `SF Mono` / `Fira Code`, 12px/400, `#E8EAED`
   - Syntax highlighting:
     - Keys: `#60A5FA` (light blue)
     - Strings: `#34D399` (light green)
     - Braces/brackets: `#9AA0A6` (gray)
     - Numbers: `#F59E0B` (amber)

   ```
   {
     "url": "https://api.stripe.com",
     "cookies": [
       {
         "name": "__stripe_mid",
         "value": "f8c2b7e4-92a1-4d3e-...",
         "domain": ".stripe.com",
         "path": "/",
         "secure": true,
         "httpOnly": false,
         "sameSite": "lax",
         "expirationDate": 1772467200
       },
       {
         "name": "__stripe_sid",
         "value": "a1d9c3e8-7b5f-48c2-...",
         "domain": ".stripe.com",
   ```

   (JSON trails off at bottom edge to show there is more content, suggesting scrollability)

3. **cURL alternative (not shown but described for reference):**
   When the "cURL" tab is selected, the code area would show:
   ```
   curl -b "__stripe_mid=f8c2b7e4-92a1-4d3e-...;\
   __stripe_sid=a1d9c3e8-7b5f-48c2-...;\
   machine_identifier=b23f91a0...;\
   merchant-config=pk_live_...;\
   locale=en-US" \
   https://api.stripe.com
   ```

### Callout Annotations

- **Top-right of code panel:** Small badge "Copy to Clipboard" with arrow pointing to the copy button
- **Between popup and code panel:** A thin curved arrow (2px, `#6366f1`) from the Export button to the code panel, implying "click Export -> see this"

### Sample Data Rationale

Stripe is chosen because:
- Every developer recognizes Stripe
- API cookies are a realistic debugging scenario
- The cookie names (`__stripe_mid`, `__stripe_sid`) are actual Stripe cookie names
- It demonstrates a professional, developer-centric use case

### Colors Used

| Element | Color |
|---------|-------|
| Code background | `#1A1D23` |
| JSON keys | `#60A5FA` |
| JSON strings | `#34D399` |
| JSON numbers | `#F59E0B` |
| JSON structural chars | `#9AA0A6` |
| Copy success toast | `#16A34A` |
| Pro-locked items | `#7C3AED` |

---

## Screenshot 5: Cookie Health Dashboard (Pro)

### Purpose

Show the Health tab with the cookie health score, risk breakdown, and GDPR scan -- while demonstrating the free-to-Pro presell via blurred content. This screenshot must make the user think "I want to know what those blurred cards say."

### Headline & Subtext

- **Headline:** "Know Your Cookie Health"
- **Headline position:** Center-horizontal, y=80px
- **Subtext:** "Detect trackers, insecure cookies, and privacy risks at a glance."
- **Subtext position:** Center-horizontal, y=132px

### Layout Description

The popup is positioned center-horizontal, top edge at y=180px. The **Health tab** is active.

**Popup contents from top to bottom:**

1. **Header (56px):**
   - Domain: "nytimes.com  ·  67 cookies"

2. **Tab bar (40px):**
   - "Health" is the active tab (`#1A1D23`, 2px bottom border `#2563EB`)
   - Small text label "Popular with Pro members" in 10px/400 `#9AA0A6` floats above the Health tab (visible only to free users -- included here to demonstrate presell)

3. **Health Score Badge (centered, 80px vertical space):**
   - **Score container:** 64x64px rounded square, 12px border-radius
   - **Grade:** "B+" in 28px/700 `#FFFFFF`
   - **Background:** `#22C55E` (B+ grade = green-good)
   - **Domain below:** "nytimes.com" in 12px/400 `#5F6368`, centered, 8px below badge
   - 16px top margin from tab bar, 12px bottom margin

4. **Risk card 1 -- Tracking Cookies (UNBLURRED -- first card reveal):**
   - Card: Full-width minus 12px padding, 96px height, white background, 8px radius, shadow subtle
   - **Header row (inside card):** Warning icon (16px, `#DC2626`) + "3 Tracking Cookies Detected" in 13px/500 `#1A1D23` + count badge "3" in 11px/600 `#FFFFFF` on `#DC2626` circle
   - **Detail text (fully visible, not blurred):**
     - "doubleclick.net `_drt_`: Ad targeting cookie used by Google Ads network." in 12px/400 `#5F6368`
     - "facebook.com `_fbp`: Tracks browsing activity across sites using Facebook Pixel." in 12px/400 `#5F6368`
     - "nytimes.com `_cb`: Third-party analytics tracking cookie." in 12px/400 `#5F6368`
   - This card is the "taste of premium" -- shown unblurred to demonstrate the quality of the analysis

5. **Risk card 2 -- Insecure Cookies (BLURRED):**
   - Card: Same dimensions as card 1, 88px height
   - **Header row (visible):** Warning icon (16px, `#D97706` amber) + "5 Insecure Cookies" in 13px/500 `#1A1D23`
   - **Detail text area:** `filter: blur(4px)` CSS applied. Behind the blur, faint text reading cookie names and recommendations (not legible, creating the curiosity gap)
   - **Overlay:** Semi-transparent white `rgba(255, 255, 255, 0.6)` positioned over blurred area
   - **CTA button centered on overlay:** "Unlock Details" in 12px/500 `#7C3AED`, no background, text-only with underline on hover
   - **PRO badge** (36x16px) inline next to "Unlock Details"
   - 8px margin-bottom

6. **Risk card 3 -- Oversized Cookies (BLURRED):**
   - Card: 64px height (shorter, less content)
   - **Header row (visible):** Info icon (16px, `#D97706`) + "2 Oversized Cookies" in 13px/500 `#1A1D23`
   - **Detail area:** Blurred with same treatment as card 2
   - **Overlay with "Unlock Details" + PRO badge**
   - 8px margin-bottom

7. **Risk card 4 -- Expired Cookies (clean):**
   - Card: 40px height (collapsed, minimal)
   - **Header row:** Check icon (16px, `#16A34A`) + "0 Expired Cookies" in 13px/500 `#1A1D23`
   - No detail area needed -- green checkmark indicates no issues
   - 8px margin-bottom

8. **GDPR Scan button:**
   - Full-width, 36px, `#2563EB` outline border
   - Shield icon (16px) left of text: "Run GDPR Scan" in 13px/500 `#2563EB`
   - Below button: "1 free scan remaining" in 11px/400 `#9AA0A6`, left-aligned

9. **Footer (36px):**
   - Left: "0/1 GDPR scans used" in 11px/500 `#16A34A`
   - Right: "Powered by" + Zovo logo mark

### Visual Emphasis on Blur-to-Clear Contrast

The key visual trick in this screenshot: Card 1 (tracking cookies) is crystal clear with full detail text, while Cards 2 and 3 are blurred. This side-by-side contrast creates an immediate visual "curiosity gap" -- the viewer has read one analysis and can see that two more exist but are obscured. The psychological pull is strong because the viewer knows exactly what kind of content is behind the blur.

### Callout Annotations

- **Right side, pointing to the B+ badge:** Arrow with text "Instant health score" in 16px/500 `#475569`
- **Left side, pointing to the blurred card 2:** Arrow with text "Full details with Pro" in 16px/500 `#7C3AED`
- **Bottom-right, near GDPR button:** Small text "Includes GDPR compliance scan" in 14px/400 `#475569`

### Sample Data Rationale

The New York Times (nytimes.com) is chosen because:
- It is a well-known, non-controversial website
- Major news sites are notorious for having many tracking cookies (ad-supported business model)
- 67 cookies is realistic for a major media site
- A B+ score is credible: good but not perfect, with room for improvement
- The tracking cookies listed (doubleclick.net, facebook.com) are real trackers present on most news sites

### Colors Used

| Element | Color |
|---------|-------|
| Health badge background (B+) | `#22C55E` |
| Health badge text | `#FFFFFF` |
| Tracking warning icon | `#DC2626` |
| Insecure/oversized warning icon | `#D97706` |
| Clean check icon | `#16A34A` |
| Blur overlay | `rgba(255, 255, 255, 0.6)` |
| Pro CTA text | `#7C3AED` |
| GDPR button | `#2563EB` |

---

## Production Checklist

Before finalizing all 5 screenshots, verify:

| Check | Requirement |
|-------|-------------|
| Dimensions | All 5 are exactly 1280x800 PNG |
| Background | Same gradient `#f0f3ff` to `#f8fafc` at 135 degrees on all 5 |
| Headline font | Inter Semibold 42px `#1e293b` on all 5, center-aligned |
| Subtext font | Inter Regular 20px `#475569` on all 5, center-aligned |
| Popup shadow | `0 20px 40px rgba(0,0,0,0.15)` on all 5 |
| Popup size | 400x520px on all 5 (except Screenshot 4 which may crop the popup slightly narrower for the split layout) |
| Zovo logo | Bottom-right, 80px wide, 60% opacity on all 5 |
| No placeholder text | Every piece of text in the popup is realistic and specific |
| No empty states | Every tab shown is populated with data |
| No personal data | Sample data uses recognizable domains but no real user info |
| Pro badges | Consistent 36x16px purple gradient pill wherever Pro features are indicated |
| Light mode only | All screenshots use the light color scheme for maximum readability on the Chrome Web Store listing page |
| File naming | `screenshot-1-hero.png`, `screenshot-2-profiles.png`, `screenshot-3-rules.png`, `screenshot-4-export.png`, `screenshot-5-health.png` |

---

## File Naming & Delivery

```
docs/store-assets/screenshots/
  screenshot-1-hero.png          -- All Your Cookies, One Click
  screenshot-2-profiles.png      -- Switch Environments in Seconds
  screenshot-3-rules.png         -- Automatic Cookie Cleanup
  screenshot-4-export.png        -- Developer-Friendly Cookie Tools
  screenshot-5-health.png        -- Know Your Cookie Health
```

Upload order on Chrome Web Store: 1 through 5 in sequence. Screenshot 1 (hero) is the one shown in search results and must carry the strongest instant comprehension.

---

*Specifications complete. All 5 screenshots defined with exact layout, sample data, typography, colors, annotations, and production notes. Ready for design execution in Figma or Canva.*
