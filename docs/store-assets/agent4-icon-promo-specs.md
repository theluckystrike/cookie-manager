# Zovo Cookie Manager: Icon Design & Promo Image Specifications

**Agent:** Icon & Promo Asset Design
**Date:** 2026-02-11
**Status:** Production-Ready Specs

---

## Table of Contents

1. [Icon Design Specifications](#1-icon-design-specifications)
   - [Cookie Manager Icon Concept](#11-cookie-manager-icon-concept)
   - [icon-16.png (16x16)](#12-icon-16png-16x16)
   - [icon-32.png (32x32)](#13-icon-32png-32x32)
   - [icon-48.png (48x48)](#14-icon-48png-48x48)
   - [icon-128.png (128x128)](#15-icon-128png-128x128)
   - [icon.svg (Vector Source)](#16-iconsvg-vector-source)
   - [AI Image Generation Prompts](#17-ai-image-generation-prompts)
   - [Icon Quality Checklist](#18-icon-quality-checklist)
   - [Manifest Integration](#19-manifest-integration)
2. [Promo Image Specifications](#2-promo-image-specifications)
   - [Small Promo Tile (440x280)](#21-small-promo-tile-440x280)
   - [Marquee Promo Tile (1400x560)](#22-marquee-promo-tile-1400x560)
   - [Social Share Image (1200x630)](#23-social-share-image-1200x630)
   - [Promo Image Quality Checklist](#24-promo-image-quality-checklist)
   - [Creation Tool Recommendations](#25-creation-tool-recommendations)

---

## 1. Icon Design Specifications

### 1.1 Cookie Manager Icon Concept

The Zovo Cookie Manager icon uses a **cookie with a bite taken out** -- the universally recognized cookie symbol. This makes the extension's purpose immediately obvious in the Chrome toolbar, Extensions page, and Web Store listing.

**Design philosophy:**

```
SHAPE:      Rounded square (iOS-style, 20-25% corner radius)
BACKGROUND: Linear gradient #6366f1 (top-left) to #4f46e5 (bottom-right)
FOREGROUND: White (#ffffff) cookie silhouette with bite mark
STYLE:      Modern, flat, minimal -- no 3D effects, no drop shadows on icon
SCALING:    Must remain recognizable and crisp from 16px to 128px
```

**Cookie Symbol Anatomy:**

```
         .-"""-.
       .'       '.        COOKIE ELEMENTS:
      /    o   o  \       1. Circular base shape
     |      o      |      2. Bite arc (upper-right, ~30% of diameter)
     |    o     o  |      3. Chocolate chip dots (circles, various sizes)
      \           /       4. Slightly irregular edge (subtle, not jagged)
       '.       .'
         '-...-'
              \
               \  <- bite mark
```

The cookie sits centered within the rounded-square background. The bite mark is positioned at the upper-right quadrant (approximately 1 o'clock to 3 o'clock) and removes roughly 25-30% of the cookie's circular silhouette.

---

### 1.2 icon-16.png (16x16)

**Usage:** Chrome toolbar icon, tab favicon context.

This is the most critical size. Users see this icon thousands of times in the toolbar. At 16px, fine details are invisible -- the icon must communicate "cookie" with absolute minimal geometry.

**Canvas & Background:**

```
DIMENSIONS:    16 x 16 pixels
COLOR SPACE:   sRGB
FORMAT:        PNG-24 with alpha transparency
BACKGROUND:    Solid #6366f1 (NO gradient -- gradient is imperceptible at 16px)
CORNER RADIUS: 3px (18.75% of width)
PADDING:       0px (background fills entire 16x16 canvas)
```

**Cookie Symbol at 16px:**

```
SAFE AREA:     2px inset from each edge = 12x12 pixel work area
COOKIE CIRCLE: 9px diameter, centered at (8, 8.5) -- shifted 0.5px down for optical centering
BITE ARC:      Single concave arc removing upper-right ~25% of the circle
               Arc radius: 4px, positioned at (12, 4) relative to canvas
CHIP DOTS:     2-3 solid white circles, each 1.5px diameter
               Positions: (6, 7), (8, 10), (10, 8) -- staggered for balance
LINE WEIGHT:   Not applicable (filled shapes only at this size)
FILL:          Solid white #ffffff
```

**Pixel Grid Alignment:**

```
  0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5
0 . . R R R R R R R R R R R . . .
1 . R P P P P P P P P P P P R . .
2 R P P P P P P P P P P P . . . .
3 R P P P P P P P P P . . . . R .
4 R P P P P P P P P . . . R R R .
5 R P P P P C P P P P P P P P R .
6 R P P P P P P P P P P P P P R .
7 R P P P P P P C P P P P P P R .
8 R P P P P P P P P P P P P P R .
9 R P P P C P P P P C P P P P R .
0 R P P P P P P P P P P P P P R .
1 R P P P P P P P P P P P P P R .
2 R P P P P P P P P P P P P R . .
3 . R P P P P P P P P P P R R . .
4 . . R R R R R R R R R R . . . .
5 . . . . . . . . . . . . . . . .

R = Rounded square background (#6366f1)
P = Cookie fill (white #ffffff)
C = Chip dot (background color showing through, #6366f1)
. = Transparent
```

**Critical rules for 16px:**

- No anti-aliased curves that create gray fringe -- use pixel-snapped shapes
- Chip dots must be at least 1px with sufficient spacing (minimum 2px between dots)
- The bite mark must be a clean arc, not a complex shape
- Test rendering on both light and dark browser chrome backgrounds
- Export at exactly 16x16 -- do not downscale from a larger render

---

### 1.3 icon-32.png (32x32)

**Usage:** Toolbar icon on high-DPI (2x Retina) displays, Windows taskbar.

At 32px the icon gains enough resolution for visible chocolate chips and a clearly defined bite arc. This is the primary toolbar icon for Retina/HiDPI screens.

**Canvas & Background:**

```
DIMENSIONS:    32 x 32 pixels
COLOR SPACE:   sRGB
FORMAT:        PNG-24 with alpha transparency
BACKGROUND:    Linear gradient #6366f1 (top-left corner) to #4f46e5 (bottom-right corner)
               Gradient angle: 135 degrees (top-left to bottom-right)
CORNER RADIUS: 7px (21.9% of width)
PADDING:       0px (background fills entire 32x32 canvas)
```

**Cookie Symbol at 32px:**

```
SAFE AREA:     3px inset from each edge = 26x26 pixel work area
COOKIE CIRCLE: 20px diameter, centered at (16, 16.5)
BITE ARC:      Concave arc at upper-right, arc radius 8px
               Arc center positioned at (24, 8) relative to canvas
               Removes approximately 25% of the cookie circle
CHIP DOTS:     3-4 solid circles punched out of the white cookie fill
               Each dot: 2.5px diameter
               Positions (relative to canvas center):
                 Dot 1: (-4, -2)  -- upper-left area
                 Dot 2: (0, 3)    -- center-low
                 Dot 3: (3, 0)    -- right-center
                 Dot 4: (-2, 4)   -- lower-left (optional, if space allows)
               Dots are "holes" in the white fill, revealing the purple background
FILL:          Solid white #ffffff
```

**Rendering notes for 32px:**

- Sub-pixel anti-aliasing is acceptable for the circle edge and bite arc
- Chip dots should have clean edges (no feathering beyond 0.5px)
- The gradient on the background should be subtle -- the 16px difference between the two purple values is barely visible at this size but adds polish on Retina displays
- Test at native 32px and confirm the bite mark reads as a "bite" not a "dent"

---

### 1.4 icon-48.png (48x48)

**Usage:** Chrome Extensions management page (`chrome://extensions`).

At 48px the icon can carry its full detail set. The cookie shape is clearly defined, chips are individually distinct, and the bite mark has a natural curvature.

**Canvas & Background:**

```
DIMENSIONS:    48 x 48 pixels
COLOR SPACE:   sRGB
FORMAT:        PNG-24 with alpha transparency
BACKGROUND:    Linear gradient #6366f1 (top-left) to #4f46e5 (bottom-right)
               Gradient angle: 135 degrees
CORNER RADIUS: 10px (20.8% of width)
PADDING:       0px
```

**Cookie Symbol at 48px:**

```
SAFE AREA:     5px inset from each edge = 38x38 pixel work area
COOKIE CIRCLE: 30px diameter, centered at (24, 24.5)
BITE ARC:      Concave arc at upper-right quadrant
               Arc radius: 11px
               Arc center: (36, 12) relative to canvas
               Removes ~25-28% of cookie circle
               Edge of bite should have 1-2 small irregularities (subtle bumps)
               to suggest a real bite, not a geometric cut
CHIP DOTS:     4-5 circles punched through the white fill
               Each dot: 3px diameter (vary between 2.5-3.5px for naturalness)
               Positions (relative to canvas origin):
                 Dot 1: (15, 17) -- 3px diameter
                 Dot 2: (21, 26) -- 2.5px diameter
                 Dot 3: (27, 20) -- 3px diameter
                 Dot 4: (18, 31) -- 3.5px diameter
                 Dot 5: (25, 30) -- 2.5px diameter
               Stagger dots asymmetrically -- avoid grid patterns
TEXTURE:       Optional: 2-3 tiny specks (1px each) near the bite edge
               to suggest cookie crumbs. Use white at 40% opacity.
FILL:          Solid white #ffffff
```

**Layout diagram (48x48):**

```
┌──────────────────────────────────────────────────┐
│                                                  │
│        GRADIENT BACKGROUND                       │
│        #6366f1 -> #4f46e5                        │
│                                                  │
│           .--------.                             │
│         .'    o     '. .                         │
│        /         o    X  <- bite arc             │
│       |     o         |                          │
│       |          o    |                          │
│        \    o        /                           │
│         '.         .'                            │
│           '-------'                              │
│                                                  │
│        o = chocolate chip dot                    │
│        X = bite mark cutout                      │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

### 1.5 icon-128.png (128x128)

**Usage:** Chrome Web Store listing tile, extension install dialog, high-visibility marketing.

This is the "hero" icon size. It appears in the Chrome Web Store search results, the extension detail page, and the install confirmation dialog. Maximum detail and polish.

**Canvas & Background:**

```
DIMENSIONS:    128 x 128 pixels
COLOR SPACE:   sRGB
FORMAT:        PNG-24 with alpha transparency
BACKGROUND:    Linear gradient #6366f1 (top-left) to #4f46e5 (bottom-right)
               Gradient angle: 135 degrees
               Optional: Very subtle radial highlight at center
                 - Radial gradient overlay: #818cf8 at 0% opacity center,
                   fading to 0% at 60% radius
                 - This adds a gentle "glow" behind the cookie, increasing depth
CORNER RADIUS: 28px (21.9% of width)
PADDING:       0px
```

**Cookie Symbol at 128px:**

```
SAFE AREA:      12px inset from each edge = 104x104 pixel work area
COOKIE CIRCLE:  80px diameter, centered at (64, 65)
                The 1px downward offset optically centers the cookie within
                the rounded square (compensating for the bite removal at top-right)
BITE ARC:       Primary concave arc at upper-right quadrant
                Arc radius: 28px
                Arc center: (96, 32) relative to canvas
                Removes ~25-28% of cookie circle
                Bite edge treatment:
                  - 2-3 small concave bumps along the bite edge (2-3px deep)
                  - These suggest tooth marks / cookie breakage
                  - Keeps the edge organic, not geometrically perfect
CHIP DOTS:      5-6 circles punched through the white cookie fill
                Varying diameters for natural look:
                  Dot 1: (38, 44)  -- 7px diameter
                  Dot 2: (56, 70)  -- 6px diameter
                  Dot 3: (72, 52)  -- 8px diameter
                  Dot 4: (46, 82)  -- 6px diameter
                  Dot 5: (66, 80)  -- 7px diameter
                  Dot 6: (52, 54)  -- 5px diameter
                Dots reveal the purple gradient underneath
CRUMB DETAILS:  2-3 small cookie fragments near the bite edge
                  Crumb 1: (90, 38) -- 4x3px irregular shape, white at 80% opacity
                  Crumb 2: (95, 45) -- 3x2px irregular shape, white at 60% opacity
                  Crumb 3: (85, 30) -- 2x2px dot, white at 50% opacity
                These suggest crumbs falling from the bite, adding life to the icon
SURFACE:        Subtle surface texture on the cookie body:
                  - 4-6 tiny dimples (1-2px circles) at 8% opacity darker than white
                  - Suggests the bumpy surface of a real cookie
                  - Do NOT overdo this -- keep it extremely subtle
DEPTH:          Optional subtle inner highlight on the cookie:
                  - 1px white stroke at 20% opacity on the top-left edge of the cookie
                  - Creates a very gentle sense of lighting from top-left
                  - Do NOT use drop shadow or outer glow
FILL:           Solid white #ffffff for the main cookie body
```

**Detailed layout diagram (128x128):**

```
    12px padding
    |
    v
    ┌────────────────────────────────────────────────────────────────────────┐
    │                                                                        │
    │     GRADIENT #6366f1 -> #4f46e5 (135deg)                              │
    │     Corner radius: 28px                                                │
    │                                                                        │
    │                   ·  <- crumb (2px, 50% opacity)                      │
    │                                                                        │
    │              .────────────.    · <- crumb (3x2, 60% opacity)          │
    │            .'   ●          '. ·   <- crumb (4x3, 80% opacity)        │
    │          .'        ●    ●    \                                         │
    │         /                 .'   <- bite arc (28px radius)              │
    │        /     ●          |                                              │
    │       |           ●      |                                             │
    │       |                  |     ● = chip dot (5-8px diameter)          │
    │        \    ●     ●     /                                              │
    │         \              /                                               │
    │          '.          .'                                                │
    │            '--------'                                                  │
    │                                                                        │
    │              Cookie diameter: 80px                                     │
    │              Center: (64, 65)                                          │
    │                                                                        │
    └────────────────────────────────────────────────────────────────────────┘
```

---

### 1.6 icon.svg (Vector Source)

**Usage:** Master source file from which all PNG sizes are exported. Also used directly in marketing materials and documentation.

**SVG Structure:**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Background gradient -->
    <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366f1" />
      <stop offset="100%" stop-color="#4f46e5" />
    </linearGradient>

    <!-- Cookie shape with bite taken out (clip path) -->
    <clipPath id="cookie-clip">
      <!-- Cookie circle minus bite arc -->
      <!-- Implementation: circle with a subtracted arc region -->
    </clipPath>
  </defs>

  <!-- Layer 1: Background rounded square -->
  <rect id="background" x="0" y="0" width="512" height="512"
        rx="112" ry="112" fill="url(#bg-gradient)" />

  <!-- Layer 2: Cookie body (white circle with bite) -->
  <g id="cookie-body">
    <!-- Main cookie circle with bite subtracted via path -->
    <path id="cookie-shape" d="[cookie path with bite cutout]"
          fill="#ffffff" />
  </g>

  <!-- Layer 3: Chocolate chip dots -->
  <g id="chip-dots" fill="#6366f1">
    <!-- Chips are filled with the gradient color to appear as "holes" -->
    <!-- In the white cookie context, we use the background color -->
    <circle cx="152" cy="176" r="14" />
    <circle cx="224" cy="280" r="12" />
    <circle cx="288" cy="208" r="16" />
    <circle cx="184" cy="328" r="12" />
    <circle cx="264" cy="320" r="14" />
    <circle cx="208" cy="216" r="10" />
  </g>

  <!-- Layer 4: Crumb details (near bite) -->
  <g id="crumbs" fill="#ffffff">
    <ellipse cx="376" cy="148" rx="8" ry="6" opacity="0.8" />
    <ellipse cx="392" cy="180" rx="6" ry="4" opacity="0.6" />
    <circle cx="360" cy="124" r="4" opacity="0.5" />
  </g>

  <!-- Layer 5: Surface texture (very subtle) -->
  <g id="texture" fill="#e0e0e0" opacity="0.08">
    <circle cx="180" cy="240" r="3" />
    <circle cx="240" cy="190" r="2" />
    <circle cx="200" cy="300" r="3" />
    <circle cx="270" cy="270" r="2" />
  </g>
</svg>
```

**Layer organization:**

```
LAYER STACK (bottom to top):
├── Layer 1: background      -- Rounded square with gradient fill
├── Layer 2: cookie-body     -- White cookie silhouette with bite path
├── Layer 3: chip-dots       -- Chocolate chip circles (reveal background)
├── Layer 4: crumbs          -- Small fragments near bite edge
└── Layer 5: texture         -- Ultra-subtle surface dimples (optional)
```

**Export settings per size:**

| Target         | Export from SVG                                                   |
| -------------- | ----------------------------------------------------------------- |
| icon-16.png    | Export at 16x16. Disable layers 4 (crumbs) and 5 (texture). Reduce chip-dots to 2-3. Simplify bite arc. |
| icon-32.png    | Export at 32x32. Disable layer 5 (texture). Reduce chip-dots to 3-4. Keep crumbs only if they render cleanly. |
| icon-48.png    | Export at 48x48. All layers active. Reduce crumb opacity by 50%. |
| icon-128.png   | Export at 128x128. All layers active at full detail. |
| 512x512 master | Full resolution for AI generation comparison and marketing use. |

**SVG best practices:**

- All paths use absolute coordinates (no relative `d` commands for the main shapes)
- No embedded raster images
- No external font references (all shapes are paths, not text)
- viewBox is set to `0 0 512 512` for a clean coordinate space
- Export PNGs using a tool that respects the SVG render exactly (Figma, Inkscape, or `resvg`)

---

### 1.7 AI Image Generation Prompts

#### Primary Prompt (Midjourney / DALL-E / Stable Diffusion)

```
Generate a minimal app icon for a Chrome extension called Cookie Manager:
- Style: Modern, flat design with subtle gradient, no 3D effects
- Shape: Rounded square with 22% corner radius (iOS-style)
- Background: Purple gradient from #6366f1 (top-left) to #4f46e5 (bottom-right)
- Symbol: A cookie with a bite taken out of the upper-right area, rendered in solid white, centered on the background
- The cookie should have 5 visible chocolate chip dots of slightly varying sizes
- The bite mark should remove about 25% of the cookie, with a natural curved edge
- Optional: 2-3 tiny crumb fragments floating near the bite
- Vibe: Professional, clean, developer-friendly, trustworthy
- Output: 512x512 PNG with transparency
- Do NOT include: text, letters, words, complex details, drop shadows, 3D effects, borders, outlines, photorealistic textures, glossy effects
```

#### Variant Prompt (Simpler -- for 16/32px optimization)

```
Generate a simple, minimal app icon:
- Shape: Rounded purple square (#6366f1)
- Symbol: White cookie with bite taken out, 3 chip dots
- Style: Flat, modern, ultra-simple
- Must be recognizable at 16x16 pixels
- No text, no shadows, no gradients, no fine details
- Output: 128x128 PNG with transparency
```

#### Figma / Manual Recreation Guide

For designers recreating the icon manually in Figma or Illustrator:

```
STEP 1: Create frame 512x512
STEP 2: Draw rounded rectangle 512x512, corner radius 112px
STEP 3: Apply linear gradient fill: #6366f1 at 0%, #4f46e5 at 100%, angle 135deg
STEP 4: Draw circle 320px diameter, centered at (256, 260)
STEP 5: Draw bite circle 112px diameter, centered at (384, 128)
STEP 6: Boolean subtract: cookie circle minus bite circle
STEP 7: Fill result with #ffffff
STEP 8: Add 5-6 circles (20-32px diameter) inside cookie area, fill with #6366f1
         (these are the chip dots -- they punch through the white to show purple)
STEP 9: Add 2-3 small ellipses near bite edge, fill #ffffff at 50-80% opacity (crumbs)
STEP 10: Export at 128, 48, 32, 16 -- simplify details for smaller sizes
```

---

### 1.8 Icon Quality Checklist

Run through every item before finalizing icons for submission.

**Recognizability:**

```
[ ] 16px icon is immediately identifiable as a cookie (not a circle, not a blob)
[ ] Bite mark is visible at 16px (the defining feature)
[ ] At least 2 chip dots are visible at 16px
[ ] Icon reads correctly at arm's length on a 1080p display
[ ] Icon is distinguishable from other browser toolbar icons at a glance
```

**Technical Quality:**

```
[ ] All 4 PNG sizes provided: 16, 32, 48, 128
[ ] SVG source file is clean vector (no embedded rasters)
[ ] PNGs have alpha transparency (no opaque white background)
[ ] No anti-aliasing artifacts creating gray halos on dark backgrounds
[ ] No anti-aliasing artifacts creating dark halos on light backgrounds
[ ] Pixel grid alignment verified at 16px and 32px (no blurry edges)
[ ] File sizes are reasonable: 16px <1KB, 32px <2KB, 48px <3KB, 128px <15KB
[ ] Color profile is sRGB (not Adobe RGB or Display P3)
```

**Brand Compliance:**

```
[ ] Background purple matches #6366f1 (primary) and #4f46e5 (hover/secondary)
[ ] Foreground is pure white #ffffff
[ ] Corner radius is 20-25% of icon dimension
[ ] Style is consistent with the Zovo icon system (rounded square + white symbol)
[ ] No text, letters, or wordmarks in the icon
[ ] No elements outside the rounded-square boundary
```

**Platform Testing:**

```
[ ] Looks correct on Chrome light theme toolbar (light gray background)
[ ] Looks correct on Chrome dark theme toolbar (dark gray background)
[ ] Looks correct on chrome://extensions page (white card background)
[ ] Looks correct in Chrome Web Store listing (white background)
[ ] Looks correct in macOS Dock (if pinned via Chrome app mode)
[ ] Looks correct on Windows taskbar (dark background)
[ ] No visual artifacts when displayed next to other extension icons
```

**Comparison Test:**

```
[ ] Side-by-side with other Zovo extension icons -- same visual weight and style
[ ] Side-by-side with competing cookie extensions -- clearly differentiated
[ ] Displayed in a toolbar with 5+ other extensions -- still stands out
```

---

### 1.9 Manifest Integration

The icons must be referenced correctly in `manifest.json` for Chrome to load them at all required sizes.

```json
{
  "manifest_version": 3,
  "name": "Zovo Cookie Manager",
  "icons": {
    "16": "assets/icons/icon-16.png",
    "32": "assets/icons/icon-32.png",
    "48": "assets/icons/icon-48.png",
    "128": "assets/icons/icon-128.png"
  },
  "action": {
    "default_icon": {
      "16": "assets/icons/icon-16.png",
      "32": "assets/icons/icon-32.png"
    },
    "default_title": "Zovo Cookie Manager"
  }
}
```

**File structure in the extension:**

```
assets/
└── icons/
    ├── icon-16.png     (16x16,   <1KB)
    ├── icon-32.png     (32x32,   <2KB)
    ├── icon-48.png     (48x48,   <3KB)
    ├── icon-128.png    (128x128, <15KB)
    └── icon.svg        (vector source, not shipped in extension)
```

Note: The `icon.svg` source file is kept in the repo for future edits but is NOT included in the extension package (add to `.extensionignore` or exclude from the build output). The performance spec budgets 60KB total for all assets, so keeping PNGs optimized through `pngquant` at build time is essential.

---

## 2. Promo Image Specifications

### 2.1 Small Promo Tile (440x280)

**Usage:** Appears in Chrome Web Store featured sections, category browsing, and collection pages. This tile is the primary visual a user sees when browsing extensions. It must communicate the extension's purpose and brand in under 2 seconds.

**Dimensions & Format:**

```
WIDTH:          440px
HEIGHT:         280px
FORMAT:         PNG (24-bit, no transparency required -- CWS renders on white)
COLOR SPACE:    sRGB
FILE SIZE:      Target <80KB (optimize with TinyPNG or pngquant)
```

**Background:**

```
TYPE:           Linear gradient
COLOR START:    #6366f1 (left edge)
COLOR END:      #4f46e5 (right edge)
ANGLE:          90 degrees (horizontal, left to right)
ALTERNATIVE:    Solid #6366f1 if gradient causes banding at this size
```

**Layout Grid:**

```
┌──────────────────────────────────────────────────────────────────────┐
│ 32px                                                           32px  │
│ ┌──────────┐                                                        │
│ │          │  "Zovo Cookie Manager"                                 │
│ │  COOKIE  │  Inter Semibold, 24px, #ffffff                        │
│ │   ICON   │                                                        │
│ │  128x128 │  "The modern cookie editor for Chrome"                │
│ │          │  Inter Regular, 14px, #ffffff at 80% opacity           │
│ └──────────┘                                                        │
│                                                                      │
│                                              ┌──────────────┐       │
│                                              │  by Zovo     │       │
│                                              │  badge       │       │
│                                              └──────────────┘       │
│ 32px                                                           32px  │
└──────────────────────────────────────────────────────────────────────┘
```

**Element Specifications:**

| Element | Position (x, y) | Size | Style |
|---------|------------------|------|-------|
| Cookie icon | (32, 56) top-left anchor | 128 x 128 px | White cookie on transparent (no background square -- the purple tile IS the background) |
| Extension name | (184, 80) | Auto width | Inter Semibold 600, 24px, #ffffff, letter-spacing: -0.3px |
| Tagline | (184, 112) | Max 220px wide | Inter Regular 400, 14px, #ffffff, opacity 0.8, line-height 1.4 |
| "by Zovo" badge | (340, 232) | Auto | Inter Medium 500, 11px, #ffffff, opacity 0.6. Optional: small Zovo logomark (16x16) to the left of text |

**Vertical rhythm:**

```
Top padding:        32px
Icon top:           56px (vertically centered in the 280px height minus badge)
Name baseline:      108px (aligned to icon vertical center - 12px)
Tagline baseline:   132px (24px below name baseline)
Badge bottom:       248px (32px from bottom edge)
Bottom padding:     32px
Left padding:       32px
Right padding:      32px
```

**Copy:**

```
HEADLINE:  Zovo Cookie Manager
TAGLINE:   The modern cookie editor for Chrome
BADGE:     by Zovo
```

**Alternative tagline options (choose one):**

```
- "See, control, and own every cookie instantly."
- "View, edit, and manage cookies like a pro."
- "The cookie editor developers actually want."
```

---

### 2.2 Marquee Promo Tile (1400x560)

**Usage:** Featured banner on the Chrome Web Store. Appears when the extension is promoted or featured in a collection. This is the highest-impact visual asset -- maximum real estate for communicating value.

**Dimensions & Format:**

```
WIDTH:          1400px
HEIGHT:         560px
FORMAT:         PNG (24-bit, no transparency required)
COLOR SPACE:    sRGB
FILE SIZE:      Target <200KB (optimize with TinyPNG or pngquant)
```

**Background:**

```
TYPE:           Linear gradient
COLOR START:    #6366f1 (left edge)
COLOR END:      #4f46e5 (right edge)
ANGLE:          90 degrees (horizontal)
TEXTURE:        Optional subtle dot grid pattern at 3% opacity over the gradient
                (adds visual interest without clutter)
                Dot size: 2px, spacing: 24px, color: #ffffff at 3% opacity
```

**Layout -- Two-Column Split:**

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                        │
│   LEFT SECTION (40% = 560px wide)          RIGHT SECTION (60% = 840px wide)           │
│                                                                                        │
│   ┌────────┐                               ┌──────────────────────────────────┐       │
│   │ COOKIE │                               │                                  │       │
│   │  ICON  │                               │     POPUP UI MOCKUP              │       │
│   │  96px  │                               │     (Cookies tab with            │       │
│   └────────┘                               │      sample data)               │       │
│                                             │                                  │       │
│   Zovo Cookie Manager                      │     400 x 420 px                │       │
│   Inter Bold, 36px, #fff                   │     with subtle shadow           │       │
│                                             │     and slight rotation          │       │
│   View, edit, and manage cookies           │                                  │       │
│   with profiles, auto-delete rules,        │                                  │       │
│   and developer tools.                     │                                  │       │
│   Inter Regular, 16px, #fff 80%            │                                  │       │
│                                             └──────────────────────────────────┘       │
│                                                                                        │
│                                                                    ┌────────────┐     │
│                                                                    │ Zovo logo  │     │
│                                                                    │ 80px wide  │     │
│                                                                    └────────────┘     │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

**Left Section Element Specifications:**

| Element | Position (x, y) | Size | Style |
|---------|------------------|------|-------|
| Cookie icon | (80, 120) top-left anchor | 96 x 96 px | White cookie silhouette (no background square) |
| Extension name | (80, 248) | Max 440px | Inter Bold 700, 36px, #ffffff, letter-spacing: -0.5px, line-height: 1.2 |
| Description | (80, 300) | Max 400px wide | Inter Regular 400, 16px, #ffffff, opacity: 0.8, line-height: 1.5 |
| Description wraps to 3 lines max | -- | -- | 3 lines x 16px x 1.5 line-height = 72px total height |

**Right Section Element Specifications:**

| Element | Position (x, y) | Size | Style |
|---------|------------------|------|-------|
| Popup mockup | (780, 60) center anchor | 400 x 420 px | Actual extension popup screenshot or high-fidelity mockup |
| Mockup shadow | Behind mockup | -- | `box-shadow: 0 24px 48px rgba(0,0,0,0.25)` |
| Mockup rotation | -- | -- | `transform: perspective(1200px) rotateY(-5deg)` -- slight 3D tilt toward the viewer. Optional; skip if it looks gimmicky. |
| Mockup border radius | -- | 12px | Matches popup UI corner radius |
| Zovo logo | (1280, 500) | 80px wide, auto height | White Zovo wordmark or logomark, opacity 0.6 |

**Popup Mockup Content (what the screenshot should show):**

The mockup displays the extension popup in its default state -- the Cookies tab with realistic sample data.

```
POPUP MOCKUP CONTENTS:
┌────────────────────────────────────────┐
│  [Cookie icon] Zovo Cookie Manager  ⚙  │  <- Header (56px)
├────────────────────────────────────────┤
│  🍪 Cookies  |  Profiles  |  Rules    │  <- Tab bar (40px), Cookies active
├────────────────────────────────────────┤
│  🔍 Search cookies...                 │  <- Search bar
├────────────────────────────────────────┤
│  github.com (12 cookies)              │  <- Domain header
│  ├─ _gh_sess        session  secure   │
│  ├─ logged_in       persistent        │
│  └─ dotcom_user     persistent        │
│                                        │
│  google.com (8 cookies)               │
│  ├─ NID              persistent       │
│  ├─ 1P_JAR           30 days         │
│  └─ CONSENT          2 years          │
│                                        │
│  stackoverflow.com (5 cookies)        │
│  ├─ prov             session          │
│  └─ acct             persistent       │
├────────────────────────────────────────┤
│  25 cookies  •  3 domains  •  Export  │  <- Footer (36px)
└────────────────────────────────────────┘
```

Use realistic developer-oriented domains (github.com, google.com, stackoverflow.com) to resonate with the target audience.

**Typography Summary for Marquee Tile:**

| Role | Font | Weight | Size | Color | Opacity |
|------|------|--------|------|-------|---------|
| Extension name (left) | Inter | Bold (700) | 36px | #ffffff | 100% |
| Description (left) | Inter | Regular (400) | 16px | #ffffff | 80% |
| Popup header text | Inter | Semibold (600) | 13px | #1a1d23 | 100% |
| Popup body text | Inter | Regular (400) | 12px | #475569 | 100% |
| Popup domain headers | Inter | Medium (500) | 12px | #1e293b | 100% |
| Zovo logo | Inter or Zovo custom | -- | 80px wide | #ffffff | 60% |

---

### 2.3 Social Share Image (1200x630)

**Usage:** Open Graph (OG) image for link previews when the Chrome Web Store listing URL is shared on Twitter/X, LinkedIn, Facebook, Slack, Discord, or any platform that renders link cards. Also used for blog posts, Product Hunt listings, and Hacker News submissions.

**Dimensions & Format:**

```
WIDTH:          1200px
HEIGHT:         630px
FORMAT:         PNG (24-bit) or JPG (quality 90+)
COLOR SPACE:    sRGB
FILE SIZE:      Target <150KB
ASPECT RATIO:   1.91:1 (standard OG image ratio)
```

**Background:**

```
TYPE:           Linear gradient
COLOR START:    #6366f1 (top-left)
COLOR END:      #4f46e5 (bottom-right)
ANGLE:          135 degrees (diagonal)
```

**Layout:**

```
┌────────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│   80px padding                                                   80px     │
│                                                                            │
│   ┌────────┐                                                              │
│   │ COOKIE │   Zovo Cookie Manager                                        │
│   │  ICON  │   Inter Bold, 44px, #ffffff                                  │
│   │  80px  │                                                              │
│   └────────┘   See, control, and own every cookie instantly.              │
│                Inter Regular, 20px, #ffffff 80%                            │
│                                                                            │
│   ─────────────────────────────────────────────────── (1px line, 10%)     │
│                                                                            │
│   ✦ View, edit, create & delete     ✦ Cookie profiles & rules            │
│   ✦ Export/import JSON              ✦ Cookie Health Score                 │
│   Inter Regular, 16px, #ffffff 70%                                        │
│                                                                            │
│                                                                            │
│                                                         zovo.one          │
│   80px padding                              Inter Medium, 14px, #fff 50% │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

**Element Specifications:**

| Element | Position (x, y) | Size | Style |
|---------|------------------|------|-------|
| Cookie icon | (80, 100) | 80 x 80 px | White cookie silhouette, no background |
| Extension name | (184, 112) | Auto | Inter Bold 700, 44px, #ffffff, letter-spacing: -0.5px |
| Tagline | (184, 168) | Max 800px | Inter Regular 400, 20px, #ffffff, opacity 0.8 |
| Divider line | (80, 230) to (1120, 230) | 1px | #ffffff, opacity 0.1 |
| Feature list (left column) | (80, 270) | Max 480px | Inter Regular 400, 16px, #ffffff, opacity 0.7, line-height 2.0 |
| Feature list (right column) | (600, 270) | Max 480px | Inter Regular 400, 16px, #ffffff, opacity 0.7, line-height 2.0 |
| Feature bullets | Prefix each line | -- | Use "diamond" character (U+2666) or simple bullet in #a5b4fc (light purple) |
| Website URL | (1040, 580) | Auto | Inter Medium 500, 14px, #ffffff, opacity 0.5 |

**Feature List Copy:**

```
LEFT COLUMN:
  ✦ View, edit, create & delete cookies
  ✦ Export & import JSON profiles
  ✦ Auto-delete rules

RIGHT COLUMN:
  ✦ Cookie profiles for testing
  ✦ Cookie Health Score
  ✦ Built for developers & QA
```

**Open Graph Meta Tag Recommendations:**

Include these tags on the extension's landing page (`https://zovo.one/tools/cookie-manager`) and in any blog posts or documentation that link to the CWS listing:

```html
<!-- Primary OG Tags -->
<meta property="og:title" content="Zovo Cookie Manager - The Modern Cookie Editor for Chrome" />
<meta property="og:description" content="View, edit, and manage cookies with profiles, auto-delete rules, and developer tools. Built for developers and QA engineers." />
<meta property="og:image" content="https://zovo.one/images/cookie-manager-og-1200x630.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="Zovo Cookie Manager icon and feature summary on purple gradient background" />
<meta property="og:url" content="https://chromewebstore.google.com/detail/zovo-cookie-manager/[extension-id]" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Zovo" />

<!-- Twitter Card Tags -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Zovo Cookie Manager - The Modern Cookie Editor for Chrome" />
<meta name="twitter:description" content="View, edit, and manage cookies with profiles, auto-delete rules, and developer tools." />
<meta name="twitter:image" content="https://zovo.one/images/cookie-manager-og-1200x630.png" />
<meta name="twitter:site" content="@zaborovnet" />
```

**Platform-specific preview testing:**

```
VERIFY ON:
[ ] Twitter/X card validator (cards-dev.twitter.com/validator or post a draft tweet)
[ ] Facebook Sharing Debugger (developers.facebook.com/tools/debug/)
[ ] LinkedIn Post Inspector (linkedin.com/post-inspector/)
[ ] Slack link preview (paste URL in a DM to yourself)
[ ] Discord embed preview (paste URL in a test channel)
[ ] iMessage / Messages link preview (send URL to yourself)
```

---

### 2.4 Promo Image Quality Checklist

**For ALL promo images (small tile, marquee, social share):**

**Visual Quality:**

```
[ ] No compression artifacts visible at 100% zoom
[ ] Text is sharp and readable at intended display size
[ ] Gradient has no visible banding (use dithering if needed)
[ ] Colors match brand palette exactly (#6366f1, #4f46e5, #ffffff)
[ ] Consistent visual weight -- no element dominates awkwardly
[ ] Whitespace is balanced and generous
```

**Content Accuracy:**

```
[ ] Extension name spelled correctly: "Zovo Cookie Manager"
[ ] Tagline matches approved copy
[ ] No typos in any text element
[ ] Popup mockup (marquee) shows realistic, developer-oriented data
[ ] No placeholder text ("Lorem ipsum", "test", "xxx")
[ ] No personal or sensitive data visible in mockups
```

**Technical Requirements:**

```
[ ] Small tile: exactly 440x280 pixels
[ ] Marquee tile: exactly 1400x560 pixels
[ ] Social share: exactly 1200x630 pixels
[ ] All files are PNG format (JPG acceptable for social only)
[ ] File sizes optimized (see individual specs for targets)
[ ] sRGB color space
[ ] No alpha transparency (CWS renders on white; avoid accidental semi-transparent areas)
```

**Brand Consistency:**

```
[ ] Purple gradient matches other Zovo extension tiles
[ ] Typography uses Inter font family exclusively
[ ] Zovo logo/badge present on all images
[ ] Visual style consistent with Zovo brand guidelines (clean, minimal, professional)
[ ] Cookie icon matches the icon-128.png design exactly
```

**CWS Compliance:**

```
[ ] No misleading imagery (tile represents actual extension functionality)
[ ] No prohibited content (violence, adult content, etc.)
[ ] No third-party trademarks or logos (except domain names in mockup data)
[ ] No claim of official affiliation with Chrome or Google
[ ] Text is legible at the display size CWS will render (small tile appears ~220px wide)
```

---

### 2.5 Creation Tool Recommendations

**Tier 1 -- Recommended (Professional):**

| Tool | Best For | Cost | Notes |
|------|----------|------|-------|
| **Figma** | All assets (icons, tiles, social images) | Free tier sufficient | Best option. Create a single Figma file with frames for each asset size. Use Auto Layout for the tile text. Export directly to PNG. Share the file for future edits. |
| **Affinity Designer 2** | SVG icon creation, precise vector work | $70 one-time | Excellent for the icon SVG source. Better vector tools than Figma. Export to SVG, then place in Figma for tile composition. |

**Tier 2 -- Fast & Good (Solo/Indie):**

| Tool | Best For | Cost | Notes |
|------|----------|------|-------|
| **Canva Pro** | Promo tiles and social images quickly | $13/month or free tier | Custom dimensions supported. Upload icon PNG, set brand colors, use Inter font (available in Canva). Quick but less precise than Figma. |
| **Photopea** | Quick PNG edits, resizing, optimization | Free (web-based) | Photoshop-compatible. Good for final touch-ups and format conversion. |

**Tier 3 -- AI-Assisted Generation:**

| Tool | Best For | Cost | Notes |
|------|----------|------|-------|
| **Midjourney** | Generating the initial cookie icon concept | $10/month | Use the prompt from Section 1.7. Generate 4 variants, pick the best, then refine in Figma/Affinity for pixel-perfect sizing. |
| **DALL-E 3 (via ChatGPT)** | Icon concepts with better prompt following | ChatGPT Plus ($20/month) | Better at following exact color hex values than Midjourney. May still need manual cleanup. |
| **Recraft.ai** | Icon generation with vector output | Free tier available | Can output SVG directly, reducing manual vectorization work. |

**Tier 4 -- Optimization & Export:**

| Tool | Best For | Cost | Notes |
|------|----------|------|-------|
| **TinyPNG / TinyJPG** | Final file size optimization | Free (web) | Run all final PNGs through this before upload. Typically saves 40-70% file size. |
| **pngquant** | Build-time PNG optimization | Free (CLI) | Integrate into the build pipeline: `pngquant --quality=80-95 --strip icon-*.png` |
| **SVGO** | SVG optimization | Free (CLI) | Clean up SVG source: remove editor metadata, optimize paths. `svgo icon.svg` |
| **Squoosh** | Visual comparison of compression levels | Free (web, by Google) | Side-by-side preview to find the optimal quality/size balance. |

**Recommended Workflow:**

```
1. ICON CREATION:
   AI tool (Midjourney/DALL-E) -> Generate 512x512 concept
   -> Import into Figma or Affinity Designer
   -> Manually redraw as clean vector paths (matching the SVG spec above)
   -> Export SVG source file
   -> Export PNGs at 128, 48, 32, 16 with per-size simplification
   -> Optimize PNGs with pngquant / TinyPNG

2. PROMO TILES:
   Figma -> Create frames at exact dimensions (440x280, 1400x560)
   -> Set gradient background
   -> Place white cookie icon (from SVG source, flattened to white)
   -> Add text layers with Inter font
   -> For marquee: capture popup screenshot, place in mockup frame
   -> Export as PNG
   -> Optimize with TinyPNG

3. SOCIAL IMAGE:
   Figma -> Create frame 1200x630
   -> Follow layout spec from Section 2.3
   -> Export as PNG or high-quality JPG
   -> Optimize
   -> Test with OG validators (Facebook Debugger, Twitter Card Validator)
```

---

## Appendix: Complete Asset File Manifest

```
ICONS (ship in extension + upload to CWS):
├── icon-16.png          16x16     <1KB      Toolbar icon
├── icon-32.png          32x32     <2KB      Toolbar @2x / HiDPI
├── icon-48.png          48x48     <3KB      Extensions management page
├── icon-128.png         128x128   <15KB     CWS listing, install dialog
└── icon.svg             vector    <5KB      Source file (repo only, not shipped)

PROMO TILES (upload to CWS):
├── promo-small-440x280.png        <80KB     CWS browsing, category pages
└── promo-marquee-1400x560.png     <200KB    CWS featured banner

SOCIAL (host on zovo.one):
└── cookie-manager-og-1200x630.png <150KB    OG image for link previews

TOTAL ICON BUDGET: <21KB (well within the 60KB asset budget from performance spec)
TOTAL PROMO BUDGET: <430KB (promo images are uploaded to CWS, not shipped in extension)
```

---

*Specification generated for Phase 06 (Store Assets Generator), Agent 4. These specs provide pixel-level guidance for creating all icon and promotional image assets for the Zovo Cookie Manager Chrome Web Store listing.*
