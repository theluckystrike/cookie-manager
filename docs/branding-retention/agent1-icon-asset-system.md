# Zovo Icon & Asset System

**Phase:** 08 - Branding & Retention System
**Agent:** 1 - Icon & Asset System
**Date:** 2026-02-11
**Status:** Production-Ready Specification

---

## Table of Contents

1. [Master Icon Template System](#1-master-icon-template-system)
2. [Cookie Manager Icon (Primary Focus)](#2-cookie-manager-icon-primary-focus)
3. [All 16 Zovo Extension Icons](#3-all-16-zovo-extension-icons)
4. [Icon Quality Checklist](#4-icon-quality-checklist)
5. [Promo Asset Specifications](#5-promo-asset-specifications)

---

## 1. Master Icon Template System

### 1.1 Zovo Base Icon Design

Every icon in the Zovo portfolio shares an identical outer shell. Only the white foreground symbol changes per extension. This creates immediate visual family recognition across the Chrome Web Store, toolbar, and extensions management page.

**Design Principles:**

```
IDENTITY:    A user who installs one Zovo extension should instantly
             recognize another Zovo extension by its icon shape,
             color, and layout -- before reading the name.

HIERARCHY:   Background shape > Gradient color > White symbol.
             The symbol differentiates; everything else unifies.

SIMPLICITY:  Every symbol MUST read at 16x16 pixels. If it does not,
             simplify further. The 16px version is the truth test.
             If you cannot tell what the symbol is at 16px, redesign it.

RESTRAINT:   No text in icons. No outlines. No 3D effects. No drop
             shadows on the icon itself. No secondary colors.
             White on purple. That is the entire palette.
```

**Base Shape Specification:**

```
SHAPE:           Rounded square (squircle / iOS-style superellipse)
CORNER RADIUS:   20-25% of icon dimension (see size-specific values below)
FILL:            Linear gradient, 135 degrees (top-left to bottom-right)
                   Start: #6366f1 (Indigo 500)
                   End:   #4f46e5 (Indigo 600)
BOUNDARY:        The rounded square fills 100% of the canvas. No padding
                 between the shape edge and the canvas edge.
FOREGROUND:      Single white (#ffffff) symbol, centered within the shape.
                 The symbol occupies 55-65% of the icon's width/height
                 (the "safe area" inside the rounded square).
```

**Visual Template:**

```
    ┌──────────────────────────────────────┐
    │                                      │
    │   GRADIENT BACKGROUND                │
    │   #6366f1 -> #4f46e5                 │
    │   135deg angle                       │
    │   Corner radius: 20-25%              │
    │                                      │
    │          ┌──────────┐                │
    │          │          │                │
    │          │  WHITE   │                │
    │          │  SYMBOL  │                │
    │          │          │                │
    │          └──────────┘                │
    │          Safe area: ~60%             │
    │          of icon dimension           │
    │                                      │
    │                                      │
    └──────────────────────────────────────┘
```

**Consistency Rules:**

1. ALL 16 extensions use the identical rounded-square background shape.
2. ALL 16 extensions use the identical gradient (#6366f1 to #4f46e5 at 135 degrees).
3. ALL 16 extensions use the identical corner radius percentage (scaled per size).
4. ONLY the white symbol in the center changes between extensions.
5. No extension may add borders, outlines, secondary color accents, or text to its icon.
6. The white symbol must be a filled shape (not line art) at 16px and 32px. Line art is acceptable only at 48px and 128px where stroke weight can be maintained.

---

### 1.2 Size-Specific Guidelines

#### 16x16 Pixels

**Usage:** Chrome toolbar, tab favicon context.

This is the most critical size. Users see the toolbar icon thousands of times. At 16px, the icon must communicate its function with absolute minimal geometry.

```
DIMENSIONS:       16 x 16 pixels
FORMAT:           PNG-24, alpha transparency
BACKGROUND:       Solid #6366f1 (NO gradient -- gradient is invisible at 16px)
CORNER RADIUS:    3px (18.75%)
SAFE AREA:        2px inset from each edge = 12x12 pixel work area
SYMBOL:           Ultra-simplified. Maximum 3-4 distinct shapes.
                  No fine detail, no thin lines, no subtle curves.
PIXEL ALIGNMENT:  All edges snapped to the pixel grid. No sub-pixel rendering
                  for the primary shape. Anti-aliasing only on diagonal or
                  curved edges where pixel-snapping is impossible.
EXPORT:           Render natively at 16x16. Never downscale from a larger size.
                  Every pixel must be intentional.
```

**Design constraints at 16px:**
- No line thinner than 1px
- No gap narrower than 1px
- Maximum 2-3 detail elements (e.g., chip dots on the cookie)
- Shapes must have at least 2px separation from each other
- The symbol must be identifiable without context (not just "a white blob")

#### 32x32 Pixels

**Usage:** Toolbar on HiDPI/Retina (2x) displays, Windows taskbar.

```
DIMENSIONS:       32 x 32 pixels
FORMAT:           PNG-24, alpha transparency
BACKGROUND:       Linear gradient #6366f1 to #4f46e5, 135 degrees
CORNER RADIUS:    7px (21.9%)
SAFE AREA:        3px inset = 26x26 pixel work area
SYMBOL:           Simplified but recognizable. 3-5 distinct shapes.
                  Sub-pixel anti-aliasing is acceptable.
EXPORT:           Render natively at 32x32 or export from SVG at this size.
```

**Design constraints at 32px:**
- Minimum line weight: 1.5px
- Detail elements (dots, notches) should be at least 2px diameter
- The symbol should clearly communicate its function without the extension name

#### 48x48 Pixels

**Usage:** Chrome Extensions management page (`chrome://extensions`).

```
DIMENSIONS:       48 x 48 pixels
FORMAT:           PNG-24, alpha transparency
BACKGROUND:       Linear gradient #6366f1 to #4f46e5, 135 degrees
CORNER RADIUS:    10px (20.8%)
SAFE AREA:        5px inset = 38x38 pixel work area
SYMBOL:           Full detail. All intended design elements visible.
                  Fine curves and diagonal lines render cleanly.
EXPORT:           Export from SVG source at 48x48.
```

**Design constraints at 48px:**
- All symbol details should be present
- Optional: subtle texture or secondary detail elements
- Minimum feature size: 2.5px

#### 128x128 Pixels

**Usage:** Chrome Web Store listing, install dialog, hero placement.

```
DIMENSIONS:       128 x 128 pixels
FORMAT:           PNG-24, alpha transparency
BACKGROUND:       Linear gradient #6366f1 to #4f46e5, 135 degrees
                  Optional: subtle radial highlight overlay
                    - #818cf8 at center, 0% opacity, fading to 0% at 60% radius
                    - Adds gentle depth without changing the brand color
CORNER RADIUS:    28px (21.9%)
SAFE AREA:        12px inset = 104x104 pixel work area
SYMBOL:           Maximum detail. Micro-textures, crumbs, subtle highlights.
                  This is the "hero" size for marketing.
EXPORT:           Export from SVG source at 128x128.
```

**Design opportunities at 128px:**
- Add subtle surface texture or fine detail
- Optional: 1px highlight on the top-left edge of the symbol (light from top-left)
- Optional: micro-details that reinforce the metaphor (crumbs, reflections, etc.)
- Detail elements can be as small as 3px

#### SVG Source

**Usage:** Master vector from which all PNG sizes are exported. Also used in marketing.

```
VIEWBOX:          0 0 512 512
FORMAT:           SVG 1.1
COORDINATE SPACE: 512x512 for clean math (512 / 128 = 4x, easy scaling)
CORNER RADIUS:    112px (21.9% of 512)

LAYER STRUCTURE:
├── Layer 1: background        Rounded square with gradient fill
├── Layer 2: symbol-body       Primary white shape(s) of the symbol
├── Layer 3: symbol-details    Secondary elements (dots, notches, accents)
├── Layer 4: micro-details     128px-only details (crumbs, textures)
└── Layer 5: highlight         Optional top-left edge highlight

EXPORT RULES PER SIZE:
  16px  → Layers 1-2 only. Simplify Layer 2 geometry.
  32px  → Layers 1-3. Reduce detail count in Layer 3.
  48px  → Layers 1-4. Full detail.
  128px → All layers. Maximum detail.
```

**SVG best practices:**
- All paths use absolute coordinates
- No embedded raster images
- No external font references
- No editor-specific metadata (clean with SVGO before committing)
- Separate `<g>` groups for each layer with descriptive `id` attributes
- Use `<defs>` for the gradient definition so it is declared once

---

## 2. Cookie Manager Icon (Primary Focus)

### 2.1 Detailed Icon Specification

The Cookie Manager icon is a **cookie with a bite taken out**. This is the universally recognized cookie symbol. The bite mark is the defining visual feature -- it is what transforms a circle into a cookie at a glance.

**Cookie Symbol Anatomy:**

```
         .-"""-.
       .'       '.        ELEMENTS:
      /    o   o  \       1. Circular base shape (the cookie body)
     |      o      |      2. Bite arc (upper-right, ~25-30% of diameter)
     |    o     o   \     3. Chocolate chip dots (circles cut through white)
      \           .'      4. Bite edge irregularities (128px only)
       '.       .'        5. Crumb fragments near bite (128px only)
         '-...-'          6. Surface texture dimples (128px only)
```

**Color Values:**

```
BACKGROUND GRADIENT START:   #6366f1  (Indigo 500)
BACKGROUND GRADIENT END:     #4f46e5  (Indigo 600)
COOKIE BODY:                 #ffffff  (White, 100% opacity)
CHOCOLATE CHIP DOTS:         Transparent cutouts revealing the background gradient
CRUMBS (128px only):         #ffffff at 50-80% opacity
SURFACE DIMPLES (128px only): #e5e5e5 at 8% opacity (barely visible)
TOP-LEFT HIGHLIGHT (128px):  #ffffff at 20% opacity, 1px stroke
```

---

#### 16x16: Ultra-Simplified Cookie

```
BACKGROUND:     Solid #6366f1 (no gradient)
CORNER RADIUS:  3px
COOKIE CIRCLE:  9px diameter, centered at (8, 8.5)
                Shifted 0.5px down for optical centering (bite removes mass
                from the top-right, so the visual center shifts down-left)
BITE ARC:       Single concave arc, upper-right quadrant
                Arc radius: 4px, arc center at (12, 4) relative to canvas
                Removes approximately 25% of the cookie circle
CHIP DOTS:      2-3 solid circles, each 1.5px diameter
                Positions: (6, 7), (8, 10), (10, 8)
                Dots are "holes" in the white fill revealing the purple background
FILL:           Solid white #ffffff
DETAILS:        None. No crumbs, no texture, no bite irregularities.
```

**Pixel Grid (16x16):**

```
  0 1 2 3 4 5 6 7 8 9 A B C D E F
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
A R P P P P P P P P P P P P P R .
B R P P P P P P P P P P P P P R .
C R P P P P P P P P P P P P R . .
D . R P P P P P P P P P P R R . .
E . . R R R R R R R R R R . . . .
F . . . . . . . . . . . . . . . .

R = Rounded square background (#6366f1)
P = Cookie fill (white #ffffff)
C = Chip dot (background color showing through)
. = Transparent
```

**Critical rules for 16px:**
- No anti-aliased curves that create gray fringe
- Chip dots must be at least 1px with minimum 2px spacing between dots
- Bite mark is a clean arc, not a complex shape
- Export at exactly 16x16, never downscaled

---

#### 32x32: Simplified Cookie

```
BACKGROUND:     Linear gradient #6366f1 to #4f46e5, 135 degrees
CORNER RADIUS:  7px
COOKIE CIRCLE:  20px diameter, centered at (16, 16.5)
BITE ARC:       Concave arc, upper-right quadrant
                Arc radius: 8px, arc center at (24, 8)
                Removes approximately 25% of the cookie circle
CHIP DOTS:      3-4 solid circles punched out of the white fill
                Each dot: 2.5px diameter
                Positions (relative to canvas center):
                  Dot 1: (-4, -2)  upper-left area
                  Dot 2: (0, 3)    center-low
                  Dot 3: (3, 0)    right-center
                  Dot 4: (-2, 4)   lower-left (optional)
                Dots reveal the purple background
FILL:           Solid white #ffffff
DETAILS:        None. No crumbs, no texture. Clean shapes only.
```

**Rendering notes for 32px:**
- Sub-pixel anti-aliasing is acceptable for curves
- Chip dots should have clean edges (no feathering beyond 0.5px)
- The bite mark must read as a "bite" not a "dent" -- the arc must be deep enough
- Test on both light and dark browser chrome backgrounds

---

#### 48x48: Full Detail Cookie

```
BACKGROUND:     Linear gradient #6366f1 to #4f46e5, 135 degrees
CORNER RADIUS:  10px
COOKIE CIRCLE:  30px diameter, centered at (24, 24.5)
BITE ARC:       Concave arc, upper-right quadrant
                Arc radius: 11px, arc center at (36, 12)
                Removes approximately 25-28% of the cookie circle
                Bite edge: 1-2 small irregularities (subtle bumps, ~1px deep)
                to suggest a real bite rather than a geometric cut
CHIP DOTS:      4-5 circles, varying diameters for natural look
                  Dot 1: (15, 17) -- 3.0px diameter
                  Dot 2: (21, 26) -- 2.5px diameter
                  Dot 3: (27, 20) -- 3.0px diameter
                  Dot 4: (18, 31) -- 3.5px diameter
                  Dot 5: (25, 30) -- 2.5px diameter
                Stagger dots asymmetrically -- no grid patterns
TEXTURE:        Optional: 2-3 tiny specks (1px) near the bite edge
                White at 40% opacity, suggesting crumbs
FILL:           Solid white #ffffff
```

---

#### 128x128: Maximum Detail Cookie

```
BACKGROUND:     Linear gradient #6366f1 to #4f46e5, 135 degrees
                Optional radial highlight: #818cf8 at 0% opacity center,
                fading to 0% at 60% radius (subtle glow behind the cookie)
CORNER RADIUS:  28px
COOKIE CIRCLE:  80px diameter, centered at (64, 65)
                The 1px downward offset optically centers the cookie
                (compensating for mass removed by the bite at top-right)
BITE ARC:       Primary concave arc, upper-right quadrant
                Arc radius: 28px, arc center at (96, 32)
                Removes approximately 25-28% of the cookie circle
                Bite edge treatment:
                  2-3 small concave bumps along the bite edge (2-3px deep)
                  These suggest tooth marks / cookie breakage
                  Keeps the edge organic, not geometrically perfect
CHIP DOTS:      5-6 circles, varying diameters:
                  Dot 1: (38, 44)  -- 7px diameter
                  Dot 2: (56, 70)  -- 6px diameter
                  Dot 3: (72, 52)  -- 8px diameter
                  Dot 4: (46, 82)  -- 6px diameter
                  Dot 5: (66, 80)  -- 7px diameter
                  Dot 6: (52, 54)  -- 5px diameter
                Dots reveal the purple gradient underneath
CRUMBS:         2-3 small cookie fragments near the bite edge:
                  Crumb 1: (90, 38) -- 4x3px irregular shape, white at 80% opacity
                  Crumb 2: (95, 45) -- 3x2px irregular shape, white at 60% opacity
                  Crumb 3: (85, 30) -- 2x2px dot, white at 50% opacity
SURFACE:        4-6 tiny dimples (1-2px circles) at 8% opacity darker than white
                Suggests the bumpy surface of a real cookie. Extremely subtle.
HIGHLIGHT:      1px white stroke at 20% opacity on the top-left edge of the cookie
                Gentle sense of lighting from top-left. No drop shadow or outer glow.
FILL:           Solid white #ffffff for the main cookie body
```

**Layout diagram (128x128):**

```
    12px
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
    │            .'   *          '. ·   <- crumb (4x3, 80% opacity)        │
    │          .'        *    *    \                                         │
    │         /                 .'   <- bite arc (28px radius)              │
    │        /     *          |                                              │
    │       |           *      |                                             │
    │       |                  |     * = chip dot (5-8px diameter)          │
    │        \    *     *     /                                              │
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

### 2.2 SVG Source File Structure

```xml
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Background gradient -->
    <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366f1" />
      <stop offset="100%" stop-color="#4f46e5" />
    </linearGradient>
  </defs>

  <!-- Layer 1: Background rounded square -->
  <rect id="background" x="0" y="0" width="512" height="512"
        rx="112" ry="112" fill="url(#bg-gradient)" />

  <!-- Layer 2: Cookie body (white circle with bite subtracted via path) -->
  <g id="cookie-body">
    <path id="cookie-shape"
          d="M256,420 C166,420 92,346 92,256 C92,166 166,92 256,92
             C290,92 322,103 348,122
             C320,140 300,172 300,208
             C300,260 340,300 392,300
             C406,300 418,296 428,290
             C422,318 420,340 420,356
             C420,394 342,420 256,420 Z"
          fill="#ffffff" />
    <!-- Note: The path above is illustrative. The actual cookie path should be
         a circle with a boolean-subtracted bite arc at the upper-right. The
         exact path must be generated in a vector editor (Figma/Illustrator)
         using:
           1. Circle: 320px diameter, center at (256, 260)
           2. Bite circle: 112px diameter, center at (384, 128)
           3. Boolean subtract: cookie circle minus bite circle
    -->
  </g>

  <!-- Layer 3: Chocolate chip dots (reveal background gradient) -->
  <g id="chip-dots" fill="#6366f1">
    <circle cx="152" cy="176" r="14" />
    <circle cx="224" cy="280" r="12" />
    <circle cx="288" cy="208" r="16" />
    <circle cx="184" cy="328" r="12" />
    <circle cx="264" cy="320" r="14" />
    <circle cx="208" cy="216" r="10" />
  </g>

  <!-- Layer 4: Crumb details (near bite edge, 128px only) -->
  <g id="crumbs" fill="#ffffff">
    <ellipse cx="376" cy="148" rx="8" ry="6" opacity="0.8" />
    <ellipse cx="392" cy="180" rx="6" ry="4" opacity="0.6" />
    <circle cx="360" cy="124" r="4" opacity="0.5" />
  </g>

  <!-- Layer 5: Surface texture (ultra-subtle, 128px only) -->
  <g id="texture" fill="#e0e0e0" opacity="0.08">
    <circle cx="180" cy="240" r="3" />
    <circle cx="240" cy="190" r="2" />
    <circle cx="200" cy="300" r="3" />
    <circle cx="270" cy="270" r="2" />
  </g>
</svg>
```

**Export rules per size from SVG:**

| Target | Layers Active | Modifications |
|--------|---------------|---------------|
| 16px | 1, 2, 3 | Reduce chip-dots to 2-3. Simplify cookie path. Use solid #6366f1 background (disable gradient). |
| 32px | 1, 2, 3 | Reduce chip-dots to 3-4. Keep gradient. Omit crumbs and texture. |
| 48px | 1, 2, 3, 4 | All chip-dots. Crumbs at 50% reduced opacity. Omit texture. |
| 128px | 1, 2, 3, 4, 5 | Full detail. All layers at full fidelity. |

---

### 2.3 AI Generation Prompts

#### Primary Prompt (Midjourney / DALL-E 3)

```
Generate a minimal app icon for a Chrome browser extension called Cookie Manager:
- Style: Modern, flat design with a subtle gradient background, absolutely no 3D effects
- Shape: Rounded square with 22% corner radius (iOS app icon style)
- Background: Purple gradient from #6366f1 (top-left) to #4f46e5 (bottom-right), 135 degree angle
- Symbol: A cookie with a bite taken out of the upper-right area, rendered as a solid white silhouette, centered on the purple background
- The cookie should have 5 visible chocolate chip dots that appear as small circles cut out of the white cookie shape, revealing the purple background underneath
- The bite mark should remove about 25% of the cookie's circular shape, with a natural curved edge and 2-3 tiny irregularities suggesting tooth marks
- Add 2-3 tiny white crumb fragments floating near the bite area at reduced opacity
- The cookie must be the ONLY element -- no text, no letters, no words anywhere in the image
- Vibe: Professional, clean, developer-friendly, trustworthy
- Output: 512x512 PNG with transparency outside the rounded square
- Do NOT include: text, letters, words, complex backgrounds, drop shadows, 3D effects, borders, outlines, photorealistic textures, glossy effects, any element outside the rounded square boundary
```

#### Simplified Variant (for Small Sizes)

```
Generate a simple, ultra-minimal app icon:
- Shape: Rounded purple square, solid color #6366f1, 20% corner radius
- Symbol: White cookie with a bite taken out of the upper-right, 3 small chip dots
- Style: Flat, modern, pixel-perfect, ultra-simplified -- must be clear at 16x16 pixels
- No text, no shadows, no gradients, no fine details, no crumbs, no texture
- White on purple only, nothing else
- Output: 128x128 PNG with transparency outside the rounded square
```

#### Manual Recreation Guide (Figma / Illustrator)

```
STEP 1:  Create frame 512x512
STEP 2:  Draw rounded rectangle 512x512, corner radius 112px
STEP 3:  Apply linear gradient fill:
           Color 1: #6366f1 at position 0% (top-left)
           Color 2: #4f46e5 at position 100% (bottom-right)
           Angle: 135 degrees
STEP 4:  Draw circle 320px diameter, center at (256, 260)
STEP 5:  Draw bite circle 112px diameter, center at (384, 128)
STEP 6:  Boolean subtract: cookie circle MINUS bite circle
         Result is the cookie-with-bite shape
STEP 7:  Fill result with #ffffff (white)
STEP 8:  Add 5-6 circles inside the cookie area for chocolate chips:
           Sizes: 20-32px diameter each, varying
           Fill: #6366f1 (matching background, so they look like "holes")
           Position them asymmetrically -- no grid pattern
STEP 9:  Add 2-3 small ellipses near the bite edge:
           Fill: #ffffff at 50-80% opacity
           Sizes: 8-16px width
           These are the crumb fragments
STEP 10: (Optional, 128px only) Add bite edge irregularities:
           Draw 2-3 small bumps along the bite arc edge (2-3px deep)
           These suggest tooth marks / natural cookie breakage
STEP 11: Group all layers. Name them: background, cookie-body, chip-dots,
         crumbs, texture
STEP 12: Export:
           128x128 -- all layers visible
           48x48  -- hide texture layer, reduce crumb opacity by 50%
           32x32  -- hide crumbs and texture, reduce to 3-4 chip dots
           16x16  -- hide crumbs and texture, reduce to 2-3 chip dots,
                     replace gradient with solid #6366f1
```

---

### 2.4 Icon File Structure

```
cookie-manager/
├── assets/
│   ├── icons/
│   │   ├── icon-16.png         16x16    <1KB     Toolbar icon
│   │   ├── icon-32.png         32x32    <2KB     Toolbar @2x / HiDPI
│   │   ├── icon-48.png         48x48    <3KB     Extensions management page
│   │   ├── icon-128.png        128x128  <15KB    CWS listing, install dialog
│   │   └── icon.svg            vector   <5KB     Source file (repo only, not shipped)
│   ├── promo/
│   │   ├── marquee-1400x560.png         <200KB   CWS featured banner
│   │   ├── tile-small-440x280.png       <80KB    CWS browsing, category pages
│   │   └── tile-large-920x680.png       <150KB   CWS large promo tile
│   └── screenshots/
│       └── (see Phase 06 screenshot specs)
```

**Notes:**
- `icon.svg` is kept in the repository for future edits but is NOT shipped in the extension package. Add to `.extensionignore` or exclude from build output.
- All PNGs should be optimized through `pngquant --quality=80-95 --strip` at build time.
- Total icon budget: less than 21KB (well within the 60KB asset budget from the performance spec).
- Promo images are uploaded to CWS directly, not shipped in the extension.

---

### 2.5 manifest.json Icon Configuration

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

**Why only 16 and 32 in `action.default_icon`:** Chrome uses `action.default_icon` for the toolbar button. At standard DPI it uses 16px; at 2x Retina/HiDPI it uses 32px. The 48px and 128px sizes are never needed for the toolbar -- they are for the extensions page and CWS listing respectively, which Chrome pulls from the top-level `icons` object.

---

## 3. All 16 Zovo Extension Icons

Each extension below follows the Master Icon Template (Section 1). The background shape, gradient, and corner radius are identical. Only the white symbol changes.

---

### 3.1 Tab Suspender Pro

**Symbol:** Moon with Zs (sleep/suspend metaphor)

**Design:** A crescent moon facing right, with two small "Z" letterforms stacked diagonally above the moon's open side. The moon communicates "sleep" and the Zs reinforce "suspended/inactive."

**Detailed notes:**
- Moon: A circle with a smaller circle boolean-subtracted from the upper-right, creating a crescent. The crescent opens toward the upper-right.
- Zs: Two "Z" shapes, each approximately 30% the height of the moon, positioned in a loose diagonal stack in the space above the moon's opening. Upper Z is smaller than lower Z (perspective effect suggesting floating away).
- At 128px: Both Zs are clearly legible. Moon has smooth anti-aliased edges.
- At 48px: Both Zs visible but simplified to basic geometry.
- At 16px: Moon only. Remove the Zs entirely -- the crescent alone communicates "sleep" at this size. The Zs would be illegible blobs.

**AI prompt variant:**
```
Minimal app icon: rounded purple (#6366f1) square, white crescent moon
facing right with two small Z letters floating near it, flat design,
no text, no shadows, 512x512 PNG with transparency.
```

---

### 3.2 Clipboard History

**Symbol:** Layered clipboard (stacked rectangles)

**Design:** Two overlapping rectangles suggesting a clipboard or layered pages. The front rectangle has a small horizontal line across the top (the clipboard clip). The back rectangle peeks out from behind at the upper-right, offset by about 15%.

**Detailed notes:**
- Front rectangle: Rounded corners (4% radius), vertical orientation (taller than wide). A small horizontal bar at the top center represents the clipboard clip.
- Back rectangle: Same proportions, offset diagonally behind and to the right.
- At 128px: Both rectangles clearly visible with the clip detail on the front one. Optional: 2-3 tiny horizontal lines inside the front rectangle suggesting text content.
- At 48px: Both rectangles visible, clip visible, no text lines.
- At 16px: Single rectangle with clip bar only. Remove the back rectangle -- the overlap creates visual noise at this size.

**AI prompt variant:**
```
Minimal app icon: rounded purple (#6366f1) square, white clipboard icon
with two overlapping rectangles and a clip at the top, flat design,
no text, no shadows, 512x512 PNG with transparency.
```

---

### 3.3 JSON Formatter Pro

**Symbol:** Curly braces `{ }`

**Design:** A pair of curly braces facing each other with a small dot or colon between them. The braces are rendered with consistent stroke weight, slightly stylized with rounded terminals.

**Detailed notes:**
- Left brace: Standard curly brace shape, vertically centered, positioned in the left portion of the safe area.
- Right brace: Mirror of the left brace, positioned in the right portion.
- Between them: A small dot or two stacked dots (colon) to suggest JSON key-value syntax.
- At 128px: Braces have refined curves with consistent stroke weight. The colon dots are clearly visible.
- At 48px: Braces and dots all visible.
- At 16px: Simplified braces without the colon. The braces alone are recognizable as "code" or "JSON." Braces rendered as filled shapes rather than stroked paths to maintain weight.

**AI prompt variant:**
```
Minimal app icon: rounded purple (#6366f1) square, white curly braces
{ } symbol with a small dot between them, flat design, developer tool
aesthetic, no text, no shadows, 512x512 PNG with transparency.
```

---

### 3.4 Screenshot Annotate

**Symbol:** Camera viewfinder / capture frame

**Design:** A rounded rectangle outline representing a screen capture frame, with crop marks at two diagonal corners (upper-left and lower-right). A small pencil or pen tip touches the lower-right corner, suggesting annotation capability.

**Detailed notes:**
- Viewfinder frame: Rounded rectangle outline (stroke, not filled), taking up about 70% of the safe area.
- Corner crops: L-shaped marks at the upper-left and lower-right corners of the frame, extending slightly beyond the frame boundary.
- Pencil indicator: A small diagonal line with a pointed tip at the lower-right, overlapping the frame corner.
- At 128px: Frame, corner marks, and pencil all clearly visible.
- At 48px: Frame and corner marks visible. Pencil simplified to a diagonal line.
- At 16px: Frame outline only, with corner marks at two corners. Remove pencil -- too small to render.

**AI prompt variant:**
```
Minimal app icon: rounded purple (#6366f1) square, white screen capture
viewfinder frame with corner crop marks, flat design, no text, no shadows,
512x512 PNG with transparency.
```

---

### 3.5 Form Filler Pro

**Symbol:** Checkbox list (completed form)

**Design:** Three horizontal rows representing form fields. The top two rows have a small checked checkbox (square with checkmark) on the left and a horizontal line on the right. The third row has an empty checkbox and a shorter line.

**Detailed notes:**
- Each row: A small square (checkbox) on the left followed by a horizontal line (field label/value) to the right.
- Top two checkboxes: Contain a small checkmark (V or tick shape), suggesting completed fields.
- Bottom checkbox: Empty square, suggesting a field still to fill.
- At 128px: All three rows clearly visible. Checkmarks are detailed.
- At 48px: Three rows visible. Checkmarks simplified to diagonal strokes.
- At 16px: Two rows only (remove the third). Checkmarks are single pixels or tiny marks. Lines are 1px solid.

**AI prompt variant:**
```
Minimal app icon: rounded purple (#6366f1) square, white checklist icon
with three rows showing checkboxes and horizontal lines, two checked and
one empty, flat design, no text, no shadows, 512x512 PNG with transparency.
```

---

### 3.6 Web Scraper Lite

**Symbol:** Download/extract arrow emerging from a bracket

**Design:** A downward-pointing arrow emerging from between two angle brackets (< >), suggesting data extraction from HTML. The arrow points down toward a small horizontal line (representing a container or output).

**Detailed notes:**
- Angle brackets: Two chevrons (< >) flanking the center, representing HTML/code.
- Arrow: A bold downward arrow between the brackets, its shaft starting from the space between the brackets and pointing down past them.
- Base line: A short horizontal line below the arrow tip, suggesting "extracted to."
- At 128px: Brackets, arrow, and base line all clearly visible.
- At 48px: Brackets and arrow visible. Base line optional.
- At 16px: Downward arrow only with a single line below it. Remove brackets -- they create clutter at this size.

**AI prompt variant:**
```
Minimal app icon: rounded purple (#6366f1) square, white download arrow
between HTML angle brackets with a line below, flat design, no text,
no shadows, 512x512 PNG with transparency.
```

---

### 3.7 Quick Notes

**Symbol:** Note with corner fold

**Design:** A rectangle with the upper-right corner folded down (the classic "sticky note" or "document" metaphor). Two or three short horizontal lines inside the rectangle suggest written content.

**Detailed notes:**
- Note body: Vertical rectangle with a triangular fold at the upper-right corner. The fold creates a small triangle that appears to peel back.
- Content lines: 2-3 horizontal lines of varying length inside the note body, centered vertically.
- At 128px: Fold detail is clear with a subtle shadow line along the fold crease. Three content lines visible.
- At 48px: Fold visible, two content lines.
- At 16px: Rectangle with fold corner. One content line or none. The fold corner is the identifying feature at this size.

**AI prompt variant:**
```
Minimal app icon: rounded purple (#6366f1) square, white note/document
icon with a folded corner and horizontal text lines inside, flat design,
no text, no shadows, 512x512 PNG with transparency.
```

---

### 3.8 Base64 Encoder

**Symbol:** "01" with bidirectional arrows

**Design:** The characters "0" and "1" (representing binary/encoding) with a small bidirectional horizontal arrow below them, suggesting encode/decode conversion.

**Detailed notes:**
- "01": Rendered as simple geometric numerals (not a font -- constructed from basic shapes). The "0" is an oval, the "1" is a vertical stroke with a small serif or angled top.
- Arrow: A horizontal line with arrowheads on both ends, positioned below the numerals. Represents the bidirectional nature of encoding/decoding.
- At 128px: Both numerals and the double arrow clearly readable.
- At 48px: Numerals and arrow visible.
- At 16px: "01" only, simplified to minimal pixel geometry. Remove the arrow -- it becomes a smudge at this size. The "01" alone communicates "binary/encoding."

**AI prompt variant:**
```
Minimal app icon: rounded purple (#6366f1) square, white "01" text with
a bidirectional arrow below it representing encode/decode, flat design,
no shadows, 512x512 PNG with transparency.
```

---

### 3.9 QR Generator

**Symbol:** Mini QR grid pattern

**Design:** A simplified QR code pattern -- a small grid of filled and empty squares arranged in the recognizable QR code layout. Three corners have the characteristic QR code finder patterns (nested squares), and the remaining cells have a scattered fill pattern.

**Detailed notes:**
- Grid: 5x5 or 6x6 grid of small squares within the safe area.
- Finder patterns: Three corners (upper-left, upper-right, lower-left) have the nested-square QR finder pattern (filled square inside an empty square inside a filled square, simplified to 3x3 blocks at icon scale).
- Data cells: The remaining cells are randomly filled/empty to suggest QR data.
- At 128px: Grid is clearly a QR code with identifiable finder patterns and data squares.
- At 48px: Grid readable, finder patterns visible as solid blocks.
- At 16px: 3x3 or 4x4 grid with two filled corner blocks. The grid pattern alone suggests "QR code" at this size. Do not attempt to show finder pattern detail.

**AI prompt variant:**
```
Minimal app icon: rounded purple (#6366f1) square, white simplified QR
code pattern with three corner finder squares and scattered data squares,
flat design, no text, no shadows, 512x512 PNG with transparency.
```

---

### 3.10 Timestamp Converter

**Symbol:** Clock face

**Design:** A simple analog clock face -- a circle with two hands (hour and minute) pointing at different positions. No numerals on the face. A small triangular indicator or arrow at the 12 o'clock position marks the top.

**Detailed notes:**
- Circle: Clean circular outline (stroke, not filled body) representing the clock bezel.
- Hands: Two lines from the center -- shorter hour hand and longer minute hand. Position them at an easily readable angle (e.g., 10:10 or 2:50 -- hands form a V shape, which is visually balanced).
- 12 o'clock marker: A small tick mark or triangle at the top of the circle.
- At 128px: Circle, both hands, and tick mark clearly visible. Optional: 4 small tick marks at 12, 3, 6, 9 positions.
- At 48px: Circle and both hands visible. Single tick mark at 12.
- At 16px: Filled circle with two lines from center (hands). No tick marks. The hands should be at least 1px wide.

**AI prompt variant:**
```
Minimal app icon: rounded purple (#6366f1) square, white analog clock face
with hour and minute hands, no numbers, flat design, no text, no shadows,
512x512 PNG with transparency.
```

---

### 3.11 Color Palette

**Symbol:** Paint droplet / color swatch trio

**Design:** Three overlapping circles in a triangular arrangement, suggesting a color palette or color mixing. Since the icon is monochrome white, the overlapping regions use the background color to show through, creating a Venn diagram effect that reads as "colors."

**Detailed notes:**
- Three circles: Arranged in a loose triangular cluster, each slightly overlapping the other two. Where circles overlap, the intersection is "cut out" (background shows through), creating the Venn diagram effect.
- At 128px: All three circles and their intersections clearly visible. The Venn diagram pattern is the identifying feature.
- At 48px: Three circles visible with intersection cutouts.
- At 16px: Single paint droplet shape (teardrop pointing upward). The three-circle arrangement is too complex at this size. A single droplet communicates "color/paint" effectively.

**AI prompt variant:**
```
Minimal app icon: rounded purple (#6366f1) square, three overlapping white
circles in a Venn diagram arrangement suggesting color mixing, flat design,
no text, no shadows, 512x512 PNG with transparency.
```

---

### 3.12 Word Counter

**Symbol:** Hashtag / number sign with text line

**Design:** A bold hashtag (#) symbol with a short horizontal line to its right, suggesting "counting text" or "number of words." The hashtag is the primary element and the line suggests the text being counted.

**Detailed notes:**
- Hashtag: Constructed from two vertical and two horizontal parallel lines, slightly tilted (5-10 degrees) for visual interest. The lines have consistent stroke weight.
- Text line: A short horizontal bar to the right of the hashtag, vertically centered, representing counted text.
- At 128px: Hashtag with refined line weight and the text bar visible.
- At 48px: Hashtag and text bar visible.
- At 16px: Hashtag only, rendered as a solid simplified glyph. Remove the text bar.

**AI prompt variant:**
```
Minimal app icon: rounded purple (#6366f1) square, white hashtag symbol
with a short text line next to it, flat design, no shadows,
512x512 PNG with transparency.
```

---

### 3.13 Unit Converter

**Symbol:** Bidirectional arrows (conversion)

**Design:** Two horizontal arrows pointing in opposite directions -- one arrow above the other. The top arrow points right, the bottom arrow points left. This universally communicates "conversion" or "exchange."

**Detailed notes:**
- Top arrow: Pointing right, positioned in the upper portion of the safe area.
- Bottom arrow: Pointing left, positioned in the lower portion of the safe area.
- The arrows are vertically stacked with consistent spacing. They are the same length and weight.
- Optional: A small vertical divider line or equals sign between the arrows at 128px.
- At 128px: Both arrows with refined arrowhead shapes. Optional divider.
- At 48px: Both arrows clearly visible.
- At 16px: Both arrows, simplified to minimal geometry. Arrowheads are simple triangles. No divider.

**AI prompt variant:**
```
Minimal app icon: rounded purple (#6366f1) square, two white horizontal
arrows pointing in opposite directions stacked vertically, representing
conversion, flat design, no text, no shadows, 512x512 PNG with transparency.
```

---

### 3.14 Bookmark Search

**Symbol:** Bookmark with magnifying glass

**Design:** A bookmark ribbon shape (vertical rectangle with a V-notch at the bottom) with a small magnifying glass overlapping its lower-right area. The bookmark is the primary shape; the magnifying glass is the modifier.

**Detailed notes:**
- Bookmark: Vertical rectangle, slightly narrower than tall, with a triangular V-notch cut from the bottom center (the classic bookmark ribbon shape).
- Magnifying glass: A small circle with a diagonal handle line, positioned at the lower-right of the bookmark, partially overlapping it.
- At 128px: Both elements clearly visible. The magnifying glass has a clean circle and handle.
- At 48px: Both visible. Magnifying glass simplified.
- At 16px: Bookmark shape only. Remove the magnifying glass -- it becomes an unreadable blob at this size. The bookmark ribbon with V-notch is sufficient to communicate "bookmark."

**AI prompt variant:**
```
Minimal app icon: rounded purple (#6366f1) square, white bookmark ribbon
shape with a small magnifying glass overlapping the lower corner, flat
design, no text, no shadows, 512x512 PNG with transparency.
```

---

### 3.15 Lorem Ipsum

**Symbol:** Text block (paragraph lines)

**Design:** Four or five horizontal lines of varying length, arranged vertically, representing a paragraph of text. The first line is the longest, and subsequent lines get progressively shorter or alternate in length to suggest natural text flow.

**Detailed notes:**
- Lines: 4-5 horizontal bars, left-aligned, with decreasing or varying lengths. Each line has rounded ends.
- Spacing: Consistent vertical spacing between lines (equal to approximately half the line height).
- The pattern should immediately read as "text paragraph" or "content block."
- At 128px: 5 lines with varying lengths and rounded ends.
- At 48px: 4 lines.
- At 16px: 3 lines only. Each line is 1px tall with clear spacing. The varying lengths communicate "text" at this size.

**AI prompt variant:**
```
Minimal app icon: rounded purple (#6366f1) square, white horizontal text
lines of varying length representing a paragraph/text block, flat design,
no text, no shadows, 512x512 PNG with transparency.
```

---

### 3.16 Cookie Manager

**Symbol:** Cookie with bite (detailed in Section 2)

Refer to Section 2 for the complete specification. This is the most detailed icon spec in the portfolio because it is the primary focus of this document.

**Summary for cross-reference:**
- Circle with concave bite arc at upper-right
- 2-6 chocolate chip dots (count varies by size)
- Crumbs near bite (128px only)
- Surface texture (128px only)
- 16px: Circle + bite + 2-3 dots
- 128px: Full detail with crumbs, texture, bite irregularities

---

## 4. Icon Quality Checklist

### 4.1 Universal Checklist (All Zovo Extensions)

**Recognizability:**

- [ ] 16px icon is immediately identifiable as its intended symbol at actual size
- [ ] Symbol reads correctly without the extension name visible
- [ ] Icon is distinguishable from other Zovo extension icons at a glance
- [ ] Icon is distinguishable from competing extensions in the same category
- [ ] At arm's length on a 1080p display, the icon is identifiable
- [ ] Displayed in a toolbar with 5+ other extensions, the icon still stands out

**Technical Quality:**

- [ ] All 4 PNG sizes provided: 16, 32, 48, 128
- [ ] SVG source file is clean vector (no embedded rasters, no editor metadata)
- [ ] PNGs have alpha transparency (no opaque white background)
- [ ] No anti-aliasing artifacts creating gray halos on dark backgrounds
- [ ] No anti-aliasing artifacts creating dark halos on light backgrounds
- [ ] Pixel grid alignment verified at 16px and 32px (no blurry edges)
- [ ] File sizes are within budget: 16px <1KB, 32px <2KB, 48px <3KB, 128px <15KB
- [ ] Color profile is sRGB (not Adobe RGB, not Display P3)
- [ ] PNGs optimized with pngquant or TinyPNG before shipping

**Brand Compliance:**

- [ ] Background purple matches #6366f1 (gradient start) and #4f46e5 (gradient end)
- [ ] 16px uses solid #6366f1 (no gradient at this size)
- [ ] 32px, 48px, 128px use gradient at 135 degrees
- [ ] Foreground is pure white #ffffff
- [ ] Corner radius is 20-25% of icon dimension
- [ ] No text, letters, or wordmarks in the icon
- [ ] No elements outside the rounded-square boundary
- [ ] No secondary colors (only white and purple)
- [ ] No outlines, borders, drop shadows, or 3D effects
- [ ] Style is consistent with the Zovo Master Icon Template

**Platform Testing:**

- [ ] Looks correct on Chrome light theme toolbar (light gray background)
- [ ] Looks correct on Chrome dark theme toolbar (dark gray background)
- [ ] Looks correct on chrome://extensions page (white card background)
- [ ] Looks correct in Chrome Web Store listing (white background)
- [ ] Looks correct on macOS Dock (if pinned via Chrome app mode)
- [ ] Looks correct on Windows taskbar (dark background)
- [ ] No visual artifacts when displayed adjacent to other extension icons

**Consistency Check:**

- [ ] Side-by-side with all other Zovo extension icons -- same visual weight
- [ ] Same perceived brightness (white symbol occupies similar % of safe area)
- [ ] Background gradient direction and colors match exactly across all icons
- [ ] Corner radius matches exactly across all icons at the same size

---

### 4.2 Cookie Manager-Specific Checks

In addition to the universal checklist above:

- [ ] Cookie shape is recognizable as a cookie (not a circle, not a blob, not a moon)
- [ ] Bite mark is visible at all four sizes (this is the defining feature)
- [ ] Bite mark reads as a "bite" not a "dent" or "chip" -- the arc must be deep enough
- [ ] Chocolate chip dots are visible as distinct dots (not blurred together)
- [ ] At 16px: 2-3 chip dots minimum, each at least 1px with 2px spacing
- [ ] At 32px: 3-4 chip dots, each at least 2px
- [ ] At 48px: 4-5 chip dots, varying sizes (2.5-3.5px)
- [ ] At 128px: 5-6 chip dots, varying sizes (5-8px)
- [ ] Chip dots reveal the purple background (they are holes, not colored fills)
- [ ] At 128px: Crumb fragments are visible near the bite edge
- [ ] At 128px: Crumbs do not draw more attention than the cookie itself
- [ ] At 128px: Bite edge has subtle irregularities (not a perfect geometric arc)
- [ ] At 128px: Surface texture is barely perceptible (8% opacity maximum)
- [ ] Cookie is centered within the rounded square (optically, accounting for bite)
- [ ] Cookie does not touch the edges of the safe area (minimum 2px margin)
- [ ] Competing cookie extensions: icon is clearly differentiated from Cookie-Editor (green background), J2Team Cookies (blue/teal), and EditThisCookie (multicolor)

---

## 5. Promo Asset Specifications

### 5.1 Marquee Tile (1400x560)

**Usage:** Chrome Web Store featured banner. Appears when the extension is promoted or featured. Highest-impact visual asset.

**Dimensions & Format:**

```
WIDTH:          1400px
HEIGHT:         560px
FORMAT:         PNG-24 (no transparency -- CWS renders on white)
COLOR SPACE:    sRGB
FILE SIZE:      Target <200KB (optimize with TinyPNG or pngquant)
```

**Background:**

```
TYPE:           Linear gradient
COLOR START:    #6366f1 (left edge)
COLOR END:      #4f46e5 (right edge)
ANGLE:          90 degrees (horizontal, left to right)
TEXTURE:        Optional subtle dot grid at 3% opacity
                Dot size: 2px, spacing: 24px, color: #ffffff at 3%
```

**Layout -- Two-Column Split:**

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                                                                                │
│   LEFT SECTION (40% = 560px)              RIGHT SECTION (60% = 840px)         │
│                                                                                │
│   ┌────────┐                              ┌──────────────────────────────┐    │
│   │ COOKIE │                              │                              │    │
│   │  ICON  │                              │     POPUP UI MOCKUP          │    │
│   │  96px  │                              │     (Cookies tab with        │    │
│   └────────┘                              │      sample data)           │    │
│                                            │                              │    │
│   Zovo Cookie Manager                     │     400 x 420 px            │    │
│   Inter Bold, 36px, #fff                  │     12px border-radius      │    │
│                                            │     Subtle drop shadow      │    │
│   View, edit, and manage cookies          │                              │    │
│   with profiles, auto-delete rules,       └──────────────────────────────┘    │
│   and developer tools.                                                        │
│   Inter Regular, 16px, #fff 80%                                    Zovo logo │
│                                                                     80px wide│
│                                                                     #fff 60% │
└────────────────────────────────────────────────────────────────────────────────┘
```

**Element Specifications:**

| Element | Position (x, y) | Size | Style |
|---------|------------------|------|-------|
| Cookie icon | (80, 120) top-left anchor | 96x96 px | White cookie silhouette (no background square -- the purple tile IS the background) |
| Extension name | (80, 248) baseline | Max 440px | Inter Bold 700, 36px, #ffffff, letter-spacing: -0.5px, line-height: 1.2 |
| Description | (80, 300) baseline | Max 400px wide | Inter Regular 400, 16px, #ffffff, opacity: 0.8, line-height: 1.5, max 3 lines |
| Popup mockup | (780, 60) center anchor | 400x420 px | Actual extension popup screenshot or high-fidelity mockup |
| Mockup shadow | Behind mockup | -- | box-shadow: 0 24px 48px rgba(0,0,0,0.25) |
| Mockup rotation | -- | -- | Optional: perspective(1200px) rotateY(-5deg) -- slight 3D tilt. Skip if gimmicky. |
| Mockup border radius | -- | 12px | Matches popup UI corner radius |
| Zovo logo | (1280, 500) | 80px wide | White Zovo wordmark, opacity 0.6 |

**Popup Mockup Content:**

Show the extension popup in its default Cookies tab state with realistic developer-oriented data:

```
┌────────────────────────────────────────┐
│  [Cookie icon] Zovo Cookie Manager  ⚙  │
├────────────────────────────────────────┤
│  Cookies  |  Profiles  |  Rules       │
├────────────────────────────────────────┤
│  Search cookies...                    │
├────────────────────────────────────────┤
│  github.com (12 cookies)              │
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
│  25 cookies  ·  3 domains  ·  Export  │
└────────────────────────────────────────┘
```

**Typography Summary:**

| Role | Font | Weight | Size | Color | Opacity |
|------|------|--------|------|-------|---------|
| Extension name | Inter | Bold (700) | 36px | #ffffff | 100% |
| Description | Inter | Regular (400) | 16px | #ffffff | 80% |
| Popup header | Inter | Semibold (600) | 13px | #1a1d23 | 100% |
| Popup body | Inter | Regular (400) | 12px | #475569 | 100% |
| Popup domain headers | Inter | Medium (500) | 12px | #1e293b | 100% |
| Zovo logo | Inter or custom | -- | 80px wide | #ffffff | 60% |

**Copy:**

```
HEADLINE:    Zovo Cookie Manager
DESCRIPTION: View, edit, and manage cookies with profiles,
             auto-delete rules, and developer tools.
```

---

### 5.2 Small Tile (440x280)

**Usage:** CWS featured sections, category browsing, collection pages. Renders at approximately 220x140 on screen -- everything must be readable at 50% reduction.

**Dimensions & Format:**

```
WIDTH:          440px
HEIGHT:         280px
FORMAT:         PNG-24 (no transparency)
COLOR SPACE:    sRGB
FILE SIZE:      Target <80KB
```

**Background:**

```
TYPE:           Linear gradient
COLOR START:    #6366f1 (left edge)
COLOR END:      #4f46e5 (right edge)
ANGLE:          90 degrees (horizontal)
ALTERNATIVE:    Solid #6366f1 if gradient causes banding
```

**Layout -- Centered Vertical Stack:**

Based on the Phase 07 visual optimization recommendation, the small tile uses a centered vertical layout rather than a left-right split. This reads better at the 50% reduction CWS renders.

```
┌──────────────────────────────────────────┐
│                                          │
│           [Cookie Icon - 72x72]          │
│                                          │
│        Zovo Cookie Manager               │
│        Inter Bold, 28px, #fff            │
│                                          │
│        See every cookie instantly         │
│        Inter Regular, 16px, #fff 80%     │
│                                          │
│                                by Zovo   │
└──────────────────────────────────────────┘
```

**Element Specifications:**

| Element | Position | Size | Style |
|---------|----------|------|-------|
| Cookie icon | Centered horizontally, 48px from top | 72x72 px | White cookie silhouette (no background square) |
| Extension name | Centered, 12px below icon bottom | Auto | Inter Bold 700, 28px, #ffffff, letter-spacing: -0.3px |
| Tagline | Centered, 8px below name baseline | Max 340px | Inter Regular 400, 16px, #ffffff, opacity 0.8 |
| "by Zovo" badge | Right-aligned, 24px from bottom, 24px from right | Auto | Inter Medium 500, 11px, #ffffff, opacity 0.6 |

**Copy options (pick one):**

```
PRIMARY:      "See every cookie instantly"
ALTERNATIVE:  "The modern cookie editor for Chrome"
ALTERNATIVE:  "Cookie control for developers"
```

---

### 5.3 Large Tile (920x680)

**Usage:** CWS large promotional tile format. Higher-impact than the small tile, used in curated collections and editorial features.

**Dimensions & Format:**

```
WIDTH:          920px
HEIGHT:         680px
FORMAT:         PNG-24 (no transparency)
COLOR SPACE:    sRGB
FILE SIZE:      Target <150KB
```

**Background:**

```
TYPE:           Linear gradient
COLOR START:    #6366f1 (top-left)
COLOR END:      #4f46e5 (bottom-right)
ANGLE:          135 degrees (diagonal)
TEXTURE:        Optional dot grid at 3% opacity (same as marquee)
```

**Layout -- Hero with Feature Highlights:**

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│   48px                                                    48px   │
│                                                                  │
│   ┌────────┐                                                    │
│   │ COOKIE │   Zovo Cookie Manager                              │
│   │  ICON  │   Inter Bold, 32px, #fff                           │
│   │  80px  │                                                    │
│   └────────┘   The modern cookie editor for Chrome              │
│                Inter Regular, 18px, #fff 80%                    │
│                                                                  │
│   ────────────────────────────────────────── (1px, 10% opacity) │
│                                                                  │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│   │  View &     │  │  Cookie     │  │  Auto-      │           │
│   │  Edit       │  │  Profiles   │  │  Delete     │           │
│   │  Cookies    │  │             │  │  Rules      │           │
│   │             │  │             │  │             │           │
│   │  See every  │  │  Switch     │  │  Set rules  │           │
│   │  cookie on  │  │  between    │  │  to clean   │           │
│   │  any site   │  │  dev/stage  │  │  cookies    │           │
│   │  instantly  │  │  /prod envs │  │  on close   │           │
│   └─────────────┘  └─────────────┘  └─────────────┘           │
│                                                                  │
│                                                     by Zovo     │
│   48px                                                    48px   │
└──────────────────────────────────────────────────────────────────┘
```

**Element Specifications:**

| Element | Position | Size | Style |
|---------|----------|------|-------|
| Cookie icon | (48, 48) top-left anchor | 80x80 px | White cookie silhouette |
| Extension name | (148, 72) baseline | Auto | Inter Bold 700, 32px, #ffffff |
| Tagline | (148, 104) baseline | Max 600px | Inter Regular 400, 18px, #ffffff, opacity 0.8 |
| Divider | (48, 160) to (872, 160) | 1px | #ffffff, opacity 0.1 |
| Feature cards | 3-column grid below divider | Each ~260x200 px | White at 8% opacity background, 8px border-radius |
| Feature card titles | Inside each card, top | -- | Inter Semibold 600, 16px, #ffffff |
| Feature card descriptions | Inside each card, below title | -- | Inter Regular 400, 13px, #ffffff, opacity 0.7 |
| "by Zovo" badge | Bottom-right, 48px from edges | Auto | Inter Medium 500, 12px, #ffffff, opacity 0.5 |

**Feature Card Content:**

```
CARD 1:                         CARD 2:                     CARD 3:
Title: View & Edit Cookies      Title: Cookie Profiles       Title: Auto-Delete Rules
Desc:  See every cookie on      Desc:  Switch between        Desc:  Set rules to clean
       any site instantly.             dev, staging, and            cookies automatically
                                       production with             when you close a tab.
                                       one click.
```

---

### 5.4 Promo Image Quality Checklist

**Visual Quality:**

- [ ] No compression artifacts visible at 100% zoom
- [ ] Text is sharp and readable at intended display size AND at 50% reduction
- [ ] Gradient has no visible banding (use dithering if needed)
- [ ] Colors match brand palette exactly (#6366f1, #4f46e5, #ffffff)
- [ ] Consistent visual weight -- no element dominates awkwardly
- [ ] Whitespace is balanced and generous

**Content Accuracy:**

- [ ] Extension name spelled correctly: "Zovo Cookie Manager"
- [ ] Tagline matches approved copy
- [ ] No typos in any text element
- [ ] Popup mockup (marquee) shows realistic, developer-oriented data
- [ ] No placeholder text ("Lorem ipsum", "test", "xxx")
- [ ] No personal or sensitive data visible in mockups

**Technical Requirements:**

- [ ] Small tile: exactly 440x280 pixels
- [ ] Large tile: exactly 920x680 pixels
- [ ] Marquee tile: exactly 1400x560 pixels
- [ ] All files are PNG format
- [ ] File sizes optimized (small <80KB, large <150KB, marquee <200KB)
- [ ] sRGB color space
- [ ] No alpha transparency (CWS renders on white)

**Brand Consistency:**

- [ ] Purple gradient matches other Zovo extension tiles
- [ ] Typography uses Inter font family exclusively
- [ ] Zovo logo/badge present on all images
- [ ] Visual style consistent with Zovo brand guidelines
- [ ] Cookie icon matches the icon-128.png design exactly
- [ ] Layout is consistent with other Zovo extension promo tiles

**CWS Compliance:**

- [ ] No misleading imagery
- [ ] No prohibited content
- [ ] No third-party trademarks or logos (except domain names in mockup data)
- [ ] No claim of official affiliation with Chrome or Google
- [ ] Text is legible at the display size CWS renders (small tile at ~220px wide)

---

## Appendix A: Complete Asset File Manifest

```
ICONS (ship in extension + upload to CWS):
├── icon-16.png          16x16     <1KB      Toolbar icon
├── icon-32.png          32x32     <2KB      Toolbar @2x / HiDPI
├── icon-48.png          48x48     <3KB      Extensions management page
├── icon-128.png         128x128   <15KB     CWS listing, install dialog
└── icon.svg             vector    <5KB      Source file (repo only, not shipped)

PROMO TILES (upload to CWS):
├── tile-small-440x280.png         <80KB     CWS browsing, category pages
├── tile-large-920x680.png         <150KB    CWS large promo tile
└── marquee-1400x560.png           <200KB    CWS featured banner

TOTAL ICON BUDGET:  <21KB (within the 60KB asset budget from performance spec)
TOTAL PROMO BUDGET: <430KB (uploaded to CWS, not shipped in extension)
```

---

## Appendix B: Recommended Workflow

```
1. ICON CREATION:
   AI tool (Midjourney/DALL-E) -> Generate 512x512 concept
   -> Import into Figma or Affinity Designer
   -> Manually redraw as clean vector paths matching the SVG spec
   -> Export SVG source file
   -> Export PNGs at 128, 48, 32, 16 with per-size simplification
   -> Optimize PNGs with pngquant / TinyPNG
   -> Run through the Icon Quality Checklist (Section 4)

2. PROMO TILES:
   Figma -> Create frames at exact dimensions
   -> Set gradient background
   -> Place white cookie icon (from SVG source, flattened to white)
   -> Add text layers with Inter font
   -> For marquee: capture popup screenshot, place in mockup frame
   -> Export as PNG
   -> Optimize with TinyPNG
   -> Run through the Promo Image Quality Checklist (Section 5.4)

3. PORTFOLIO CONSISTENCY:
   After Cookie Manager icons are finalized:
   -> Use the same Figma file / template
   -> Duplicate the background layer
   -> Replace only the white symbol layer for each extension
   -> Export all 16 extensions with identical sizing and optimization
   -> Side-by-side comparison of all 16 icons at each size
   -> Verify visual weight consistency across the portfolio
```

---

## Appendix C: Icon Variant Testing (from Phase 07)

Phase 07 identified three icon variants for A/B testing. These remain relevant for Cookie Manager:

**Variant A (Current/Control):** Solid purple background, white cookie. Clean and brand-consistent.

**Variant B (Warm Accent):** Gradient from #7C3AED to #4F46E5. Cookie in warm off-white (#FEF3C7) instead of pure white. Subtle warm glow along bite arc. More eye-catching in CWS search results but diverges from the portfolio color system.

**Variant C (Edge Outline):** Same as Variant A plus a 2px stroke outline in #A5B4FC (light lavender, 60% opacity) on the rounded-square boundary. Solves the dark-background contrast problem.

**Recommendation:** Launch with Variant A for brand consistency. Test Variant B after 2 weeks if CWS CTR data is available. Adopt Variant C if dark-mode users report poor visibility.

**Important:** If Variant B (warm accent) is adopted for Cookie Manager, it MUST NOT be applied to other Zovo extensions. The warm cookie accent is specific to the cookie metaphor. All other extensions remain pure white on purple gradient.

---

*Specification generated for Phase 08 (Branding & Retention System), Agent 1. This document defines the complete Zovo icon design system, detailed Cookie Manager icon specifications across all sizes, icon specs for all 16 portfolio extensions, quality checklists, and promotional asset layouts -- all following the unified Zovo brand guidelines.*
