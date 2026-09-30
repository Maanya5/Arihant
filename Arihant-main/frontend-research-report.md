You are a Senior Frontend Engineer upgrading the Arihant Store — a Next.js 15 / React 19 / Tailwind CSS v4 / Framer Motion v11 / Zustand v5 e-commerce application for school uniforms and casual clothing in India.

EXISTING STACK:
- Framework: Next.js 15.2.0 (App Router)
- Styling: Tailwind CSS v4.0.0 (uses @import "tailwindcss" and @theme directives in globals.css)
- Animation: Framer Motion v11.18.0
- State: Zustand v5.0.0 + React Context (AuthContext, CartContext)
- Auth: Firebase v10 + custom JWT backend
- Payment: Razorpay

EXISTING BRAND IDENTITY (DO NOT CHANGE):
- Background: #F4F0E4 (warm bone/cream)
- Primary: #44A194 (editorial soft teal)
- Secondary: #537D96 (muted blue)
- Accent: #EC8F8D (salmon peach)
- Gold: #B8860B (goldenrod eyebrow)
- Ink: #1A1A1A (deep charcoal text)
- Bone: #FAF7F2 (card cream)
- Fonts: Playfair Display (headers) + Plus Jakarta Sans (body)
- Border radius: 0px everywhere (enforced via globals.css reset)

UPGRADE PHILOSOPHY:
- Preserve the warm editorial identity — do NOT make it cold or dark-themed
- Add cinematic motion without heaviness
- Every change must be production-safe (no breaking existing functionality)
- Mobile performance is critical — no parallax or heavy scroll effects on mobile
- All animations must respect prefers-reduced-motion
- Preserve all existing state, auth, cart, and payment logic exactly as-is


# FRONTEND RESEARCH REPORT
## Premium Reference Deconstruction: Renault Duster India × H&M India
### Compiled by: Principal Frontend Architect + Motion Design Division
### Date: May 2026 | Classification: Engineering Intelligence

---

# ════════════════════════════════════════
# PART I — WEBSITE DECONSTRUCTION
# ════════════════════════════════════════

---

## ▶ SITE 01 — RENAULT DUSTER INDIA
### `renault.co.in/cars/renault-duster.html`

---

### A. BRAND EXPERIENCE

**Emotional Feel**
Adventure confidence meets urban sophistication. The Duster's 2026 page communicates rugged capability through controlled visual tension — dark/deep palettes punctuated by the brand's signature yellow accent, offset by expansive hero imagery of terrain and sky. The emotional register is "I've arrived" — aspirational but accessible, commanding without arrogance. The brand positions the Duster as a re-entry statement after a hiatus; storytelling leans into nostalgia-meets-reinvention.

**Visual Identity**
- Renault's updated diamond logo is prominently anchored throughout
- Typography: bold condensed sans-serif for headlines, creating mechanical authority
- Dominant blacks, charcoal, and deep greys with yellow-gold (#F5C518-adjacent) as the sole brand accent
- Jade Mountain Green featured prominently as the hero colour of this generation
- Fighter-jet-inspired interior motifs translated to UI through sharp angular dividers and geometric section transitions

**Premium Perception**
Premium is built not through ornamentation but through restraint + scale. Full-bleed imagery at extreme resolution. Negative space used generously between feature callouts. Typography sized aggressively large for spec numbers (163 PS, 280 Nm) — letting the numbers speak. 5-star NCAP badge rendered as a high-trust credibility anchor near CTA.

**Storytelling Strategy**
- Chapter-based vertical narrative: Hero → Identity → Performance → Technology → Safety → Configuration → Pricing
- "Visualise in 3D" section breaks the 2D web convention — AR viewer embedded for mobile
- Each scroll chapter introduces one key selling idea, never two simultaneously
- Feature reveal uses the "benefit-first, spec-second" pattern: emotional headline ("Feel the thrill") before numerical proof ("163 PS / 280 Nm")
- India-specific localization cues (Bharat NCAP, 212mm ground clearance for Indian roads) woven as trust signals

**Conversion Strategy**
- Dual CTA structure: "Book Now" (primary, high-intent) + "Request Callback" (lower-commitment fallback)
- Sticky persistent navigation bar with price anchor visible after scrolling past hero
- Color selector module converts passive browsing into active engagement (personalization hook)
- EMI/finance calculator embedded to dissolve price anxiety
- WhatsApp CTA alongside traditional form — market-specific conversion path for Indian consumer behavior

---

### B. DESIGN SYSTEM EXTRACTION

**Color Palette**
```
Primary Dark:      #0D0D0D / #141414   (background, section fills)
Brand Accent:      #FFD700 / #F2C200   (Renault yellow, CTA highlights)
Jade Green:        #3D6B4F             (hero vehicle colour, accent sections)
Off-White:         #F5F5F0             (light section backgrounds)
Text Primary:      #FFFFFF             (on dark backgrounds)
Text Secondary:    #A0A0A0             (specs, captions)
UI Red:            #CC0000             (error states, urgency badges)
```

**Contrast Ratios** *(Estimated)*
```
White on #0D0D0D:   ~18:1   (AAA pass)
Yellow on #0D0D0D:  ~10.5:1 (AAA pass)
Grey #A0A0A0 on dark: ~4.5:1 (AA pass)
```

**Typography Hierarchy**
```
Display / Hero H1:   Bold Condensed / ~72–96px / tracking -2px to -4px
Section H2:          Semibold / ~48–56px / tracking -1px
Feature H3:          Medium / ~28–32px
Spec Numbers:        Extra-Bold Tabular / ~40–64px (stand-alone callouts)
Body Copy:           Regular / ~16–18px / line-height 1.6
Captions / Labels:   Regular / ~12–14px / uppercase + tracking +1px
Legal / Disclaimers: Light / ~11px
```
*Font stack: Renault likely uses a licensed version of Renault Sans or a corporate variant of a geometric sans. In practice, Neue Haas Grotesk or ABC Diatype are strong approximations.*

**Spacing Scale**
```
4px  → micro gaps (icon-to-label)
8px  → tight groupings
16px → component internal padding
24px → card padding
32px → element separation
48px → section sub-grouping
64px → section starts
96px → hero padding / section breathing
128px → major section breaks
```

**Border Radius**
```
Buttons:       4px (sharp, mechanical — automotive aesthetic)
Cards:         8px (slight softening)
Badge/Pills:   24px (fully rounded)
Image frames:  0px (bleed, borderless — premium standard)
Input fields:  2–4px
```

**Shadow System**
```
Elevation 1 (cards):   0 4px 16px rgba(0,0,0,0.25)
Elevation 2 (modals):  0 16px 48px rgba(0,0,0,0.5)
Glow accent:           0 0 32px rgba(242,194,0,0.3)  ← brand yellow glow
Image overlays:        linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.8))
```

**Card Styles**
```
Feature Card:  Dark bg (#1A1A1A), 1px border (#2A2A2A), icon top, headline, short description
Spec Card:     Borderless, number-dominant, label below in smaller weight
Color Swatch:  Circular (48px), with active ring state (2px brand yellow offset ring)
Variant Card:  Full-width image bleed top, trim name, price, CTA inline
```

**Layout Rules**
- Max content width: 1440px, centered
- Text columns: max 680px to preserve readability
- Images: Always full-bleed on mobile; 60–70% viewport on desktop for hero
- Feature grids: 3-col on desktop, 1-col on mobile, 2-col on tablet
- Alternating layout: text-left/image-right ↔ image-left/text-right per section

**Grid System**
```
Desktop: 12-column, 24px gutters, 80px outer margin
Tablet:  8-column, 16px gutters, 32px outer margin
Mobile:  4-column, 16px gutters, 16px outer margin
```

**Responsive Principles**
- Mobile-first for interactive elements (CTA, form)
- Desktop-first for cinematic/visual sections
- Feature image aspect ratios shift: 16:9 → 4:3 → 1:1 across breakpoints
- Typography scales via clamp(): `clamp(36px, 6vw, 96px)` pattern
- Sticky CTA bar collapses to bottom-sheet on mobile

---

### C. MOTION SYSTEM REVERSE ENGINEERING

#### HERO SECTION

**01 — Full-Bleed Video/Image Hero**
- Observed: Large vehicle shot fades in on load with subtle Ken Burns zoom-out
- Trigger: Page load, immediate
- Entry: opacity 0 → 1, scale 1.08 → 1.0
- Timing: 800ms fade, 1200ms scale
- Easing: `cubic-bezier(0.22, 1, 0.36, 1)` (exponential ease-out)
- Classification: **(Strong inference)**
- Implementation: GSAP `gsap.from('.hero-image', { scale: 1.08, opacity: 0, duration: 1.2, ease: 'power3.out' })`

**02 — Hero Headline Stagger**
- Observed: Title text appears word-by-word or line-by-line after image loads
- Trigger: 300ms delay after hero image completes
- Entry: `translateY(30px) opacity(0)` → neutral, per line
- Stagger: 80–120ms between each text line
- Duration: 600ms per element
- Easing: `power2.out`
- Classification: **(Observed)**
- Implementation: GSAP SplitText + stagger timeline

**03 — Hero CTA Entrance**
- Observed: CTA buttons slide up after headline settles
- Delay: ~1200ms from page load
- Entry: `translateY(20px) opacity(0)` → neutral
- Duration: 400ms
- Classification: **(Observed)**

#### SCROLL-BASED ANIMATIONS

**04 — Section Reveal (Universal Pattern)**
- Observed: Every content section fades + rises as it enters viewport
- Trigger: Intersection Observer / ScrollTrigger at `top 80%` of viewport
- Entry: `translateY(48px) opacity(0)` → neutral
- Duration: 700ms
- Easing: `power2.out`
- Stagger on siblings: 100ms
- Classification: **(Observed)**
- Implementation Hypothesis: GSAP ScrollTrigger with `once: true`

**05 — Feature Numbers Count-Up**
- Observed: Spec numbers (163 PS, 280 Nm, 17 ADAS) animate from 0 to final value when scrolled into view
- Trigger: ScrollTrigger enter
- Duration: 1000–1500ms
- Easing: Ease-out
- Classification: **(Strong inference)**
- Implementation: Custom counter function or GSAP `snap` modifier

**06 — Parallax — Hero Vehicle**
- Observed: Vehicle image moves at ~0.6x scroll speed relative to background
- Trigger: Continuous scroll
- Transform: `translateY(scrollY * -0.3)`
- Performance: `will-change: transform` + RAF loop or GSAP ScrollTrigger scrub
- Classification: **(Strong inference)**

**07 — Horizontal Scroll / Carousel — Color Picker**
- Observed: Color variants scroll horizontally; selected color transitions the hero image
- Trigger: Click / tap
- Transition: Cross-fade between vehicle images, 400ms, `ease-in-out`
- Swatch: Scale 1.0 → 1.15 on select + ring animation (stroke-dashoffset CSS or GSAP)
- Classification: **(Observed)**

**08 — Sticky Section Pin — Feature Deep-Dive**
- Observed: Large feature section pins while content panels scroll through
- Implementation: GSAP ScrollTrigger `pin: true` or CSS `position: sticky`
- Duration: ~300vh of scroll
- Content change: Fade between feature panels while car image remains
- Classification: **(Strong inference)**

**09 — 3D Viewer Interaction**
- Observed: "Visualise in 3D" — interactive 360° rotation of vehicle
- Technology: Three.js / model-viewer web component / embedded iframe
- Interaction: Drag-to-rotate, pinch-to-zoom on mobile
- Performance: LOD (Level of Detail) management, lazy loaded
- Classification: **(Observed)**

**10 — Navbar Scroll State Transition**
- Observed: Transparent navbar on hero → solid dark navbar on scroll
- Trigger: `scrollY > 60`
- Transition: `background-color` + `backdrop-filter: blur(12px)` animated over 300ms
- Classification: **(Observed)**
- Implementation: CSS transition on class toggle via scroll event

**11 — Image Sequence / Film-Strip**
- Observed (inference): Automotive sites of this tier frequently use scroll-scrubbed image sequences (Apple-style) for engine or feature storytelling
- Technology: Canvas rendering of JPEG sequences, GSAP scrub
- Classification: **(Speculation)**

**12 — Hover States — Feature Cards**
- Observed: Cards elevate (translateY -4px) + shadow deepens on hover
- Trigger: mouseenter
- Duration: 250ms
- Easing: `ease-out`
- Plus: subtle image scale 1.0 → 1.04 within card
- Classification: **(Strong inference)**

**13 — CTA Button Hover**
- Observed: Yellow CTA uses fill-sweep or underline-sweep animation on hover
- Trigger: hover
- Transform: Pseudo-element width 0 → 100% or background-position shift
- Duration: 300ms
- Classification: **(Strong inference)**

**14 — Loading Sequence**
- Observed: Brief branded preloader (Renault diamond) before main content
- Duration: 800–1200ms
- Exit: Fade out, main content fades in beneath
- Classification: **(Strong inference)**

---

### D. COMPONENT LIBRARY INVENTORY

| Component | Visual Pattern | Complexity | Recreation Approach |
|-----------|---------------|------------|---------------------|
| **Hero Module** | Full-bleed video/image, overlay text, dual CTA, scroll indicator | High | React + GSAP timeline, lazy video |
| **Sticky Navbar** | Transparent → frosted glass on scroll, logo + nav links + CTA | Medium | CSS transition + scroll listener |
| **Color Picker** | Horizontal swatch row, active ring, hero image crossfade | High | React state + CSS transition |
| **Spec Grid** | 3-col, icon + number + label, count-up on scroll | Medium | Intersection Observer + counter |
| **Feature Panel** | Pinned scroll, left fixed image, right scrolling panels | High | GSAP ScrollTrigger pin |
| **3D Viewer** | Interactive vehicle 360° rotate | Very High | Three.js / model-viewer |
| **Feature Cards** | Dark card, icon, headline, copy, hover elevate | Low | CSS hover transitions |
| **CTA Bar (Sticky)** | Fixed bottom on mobile, contains price + Book CTA | Medium | CSS sticky + media query |
| **Accordion / FAQ** | Expand/collapse, smooth height transition | Low | CSS max-height transition |
| **Image Gallery** | Masonry or grid, lightbox on click | Medium | CSS grid + modal |
| **Variant Selector** | Tab-style switcher for trim levels | Medium | React tabs |
| **Price / EMI Block** | Prominent number, toggle monthly/ex-showroom | Medium | React state toggle |
| **AR Viewer CTA** | Badge + deep link to AR experience | Low | Link + badge component |
| **Footer** | Multi-column links, social icons, legal | Low | Static layout |

---
---

## ▶ SITE 02 — H&M INDIA
### `hm.com/en_in`

---

### A. BRAND EXPERIENCE

**Emotional Feel**
Accessible fashion confidence. H&M communicates aspiration without exclusion — "fashion for all" translated into a clean, bright, editorial-magazine interface. The emotional register is discovery-joy: the excitement of browsing a new seasonal collection. In 2026, the India-specific homepage emphasizes summer vibrancy (Summer 2026: Vibrant Edit campaign), linen textures, and pricing anchors in INR prominently placed to signal value without cheapness.

**Visual Identity**
- Strict two-color brand identity: Red (#E50010) + Black on White
- All photography art-directed with consistent colour temperature (warm, lifestyle-forward)
- Typographic simplicity: one font family (H&M Sans or equivalent grotesque), weight variations only
- Campaign imagery: full-screen editorial shots, no illustrated or illustrated elements
- Navigation: industry-standard mega-menu, but executed with unusual restraint and white space

**Premium Perception**
Premium perception is earned through editorial photography quality, not decoration. The site uses "empty" white space aggressively — large margins around product cards create a gallery feeling. Campaign headers use oversized type at confident scale. The word "Premium" is used as an explicit category label (Premium Selection, Premium Accessories) to signal internal tier differentiation.

**Storytelling Strategy**
- Category-first storytelling: landing page is structured as a curated editorial ("Summer 2026: Vibrant Edit", "Linen in Focus") rather than a product catalogue dump
- Discount/promotion framed editorially: "Flat 15% Off: Selected Items" reads like a curated offering, not a clearance
- Campaign imagery drives emotional buy-in before the product grid
- Seasonal rhythm: new drops communicated as cultural moments, not just inventory updates

**Conversion Strategy**
- Navigation mega-menu with 50+ category links removes all friction to finding a product
- "Favourites" heart system creates low-commitment engagement loop
- Shopping bag counter visible always — persistent reminder of intent
- Mini cart (collapsed by default) reduces friction to checkout
- App download CTAs in footer + nav — conversion to higher-LTV channel
- "Sign in" persistent — member pricing and personalisation upsell

---

### B. DESIGN SYSTEM EXTRACTION

**Color Palette**
```
Brand Red:       #E50010   (logo, selected states, sale badges, key CTAs)
Pure Black:      #222222   (primary text)
Pure White:      #FFFFFF   (backgrounds, card fill)
Light Grey:      #F5F5F5   (alternate section background)
Mid Grey:        #767676   (secondary text, borders)
Border:          #DEDEDE   (card outlines, dividers)
Sale Red:        #CC0000   (price reduction indicators)
Success Green:   #2E7D32   (in-stock, confirmation)
```

**Contrast Ratios** *(Estimated)*
```
Black #222222 on White:    ~14.5:1 (AAA)
Red #E50010 on White:      ~4.7:1  (AA — border compliance)
Grey #767676 on White:     ~4.5:1  (AA minimum)
White on Red:              ~4.7:1  (AA)
```

**Typography Hierarchy**
```
Campaign Headline:    Bold / ~64–96px / tracking -1px (editorial hero)
Section Title:        Bold / ~32–48px
Category Label:       Semibold / ~20–24px / uppercase
Product Name:         Regular or Medium / ~14–16px
Price:                Bold or Semibold / ~14–18px
Secondary Price:      Regular strikethrough / ~12–14px / mid grey
Caption/Badge:        Regular / ~11–13px / uppercase + tracked
Navigation:           Medium / ~13–15px
```
*Font: H&M uses a proprietary custom typeface ("H&M Sans") that is a clean geometric grotesque — approximately equivalent to Söhne, Aktiv Grotesk, or Suisse Int'l for replication purposes.*

**Spacing Scale**
```
4px   → icon padding, badge gap
8px   → tight button padding, chip gap
12px  → small component internal
16px  → standard component padding
24px  → card padding, form fields
32px  → section padding (mobile)
48px  → section padding (desktop)
64px  → major section gap
96px  → campaign hero padding
```

**Border Radius**
```
Product Cards:   0px (zero radius — fashion editorial standard, images bleed to edge)
Buttons (CTA):   0px (flat/square — intentionally unfussy)
Input fields:    0px
Badges/Pills:    2–4px (minimal softening for small UI elements)
```
*Note: The consistent 0-radius choice is a strong brand signal — it reads as editorial/fashion, not tech/startup.*

**Shadow System**
```
Cards at rest:     No shadow (flat, editorial)
Cards on hover:    Barely perceptible: 0 2px 8px rgba(0,0,0,0.08)
Modal/Drawer:      0 0 32px rgba(0,0,0,0.2)
Nav bar:           0 2px 4px rgba(0,0,0,0.1)
```

**Card Styles**
```
Product Card:
  - Aspect ratio: 3:4 (portrait, fashion standard)
  - Image: object-fit cover, zero radius
  - Hover: "Quick Add" button slides up from bottom
  - Heart icon: top-right, toggle favourite
  - Below image: product name (1-2 lines), price, colour count

Campaign Card:
  - Full-width editorial image
  - Overlay text at bottom: headline + CTA link
  - No border, no shadow

Category Card:
  - Square aspect, category name centred or bottom-left
  - Hover: subtle scale 1.03
```

**Layout Rules**
- Max content width: 1360–1440px
- Product grid: 4-col desktop, 3-col tablet, 2-col mobile (strictly maintained)
- Campaign hero: Full viewport width, 60–80vh height
- Typography text blocks: max 600px
- Whitespace-first: generous margins between editorial sections

**Grid System**
```
Desktop: 12-col, 16px gutters, 48px outer margin
Tablet:  8-col, 16px gutters, 24px outer margin
Mobile:  4-col (effectively 2-col for products), 8px gutters, 16px margin
```

**Responsive Principles**
- Product grid collapses gracefully: 4→3→2
- Navigation collapses to hamburger at <768px
- Campaign imagery crops to portrait on mobile (art direction shifts)
- CTA text truncation: abbreviated on mobile
- Filter/sort collapses to bottom sheet on mobile

---

### C. MOTION SYSTEM REVERSE ENGINEERING

#### NAVIGATION

**01 — Mega Menu Expand**
- Observed: Hover on top-level nav item → sub-menu expands downward
- Trigger: mouseenter (desktop), tap (mobile)
- Entry: `height 0 → auto` + `opacity 0 → 1`
- Duration: 200–250ms
- Easing: `ease-out`
- Mobile: Slides in from right (full-screen panel) with `translateX(100%) → 0`
- Classification: **(Observed)**
- Implementation: CSS transition + JS height calculation (or GSAP to avoid height:auto issues)

**02 — Mobile Nav Panel**
- Observed: Hamburger → full-screen overlay slides from right
- Trigger: Tap hamburger
- Entry: `translateX(100%)` → `translateX(0)`
- Backdrop: `opacity 0 → 0.5` fade
- Duration: 300ms
- Easing: `cubic-bezier(0.4, 0, 0.2, 1)` (Material Design standard — likely used here)
- Classification: **(Strong inference)**

#### HOMEPAGE

**03 — Campaign Hero Image**
- Observed: Large campaign image loads with a gentle fade-in (no dramatic entrance)
- Trigger: Page load
- Duration: 400ms fade
- No zoom/parallax — fashion sites prioritize image fidelity over motion drama
- Classification: **(Observed)**

**04 — Product Card Grid Reveal**
- Observed: Cards fade in as page scrolls — subtle, not aggressive
- Trigger: Intersection Observer
- Entry: `opacity 0 → 1` (no translate — clean, editorial)
- Stagger: 40–60ms between cards in same row
- Duration: 300ms
- Classification: **(Strong inference)**

**05 — Product Card Hover — "Quick Add" Reveal**
- Observed: On hover, a "Add to Bag" button slides up from the bottom of the product card
- Trigger: mouseenter
- Entry: `translateY(100%) → 0` for the button panel
- Duration: 220ms
- Easing: `ease-out`
- Simultaneous: Product image may shift up slightly (`translateY(-4px)`)
- Classification: **(Observed)**
- Implementation:
```css
.card-overlay {
  transform: translateY(100%);
  transition: transform 220ms ease-out;
}
.card:hover .card-overlay {
  transform: translateY(0);
}
```

**06 — Favourite Heart Toggle**
- Observed: Heart icon fills with red on click
- Trigger: click
- Animation: Scale pulse 1.0 → 1.3 → 1.0 + fill colour transition
- Duration: 300ms total
- Easing: Spring-like (bounce)
- Classification: **(Observed)**
- Implementation: CSS keyframe or Framer Motion spring

**07 — Mini Cart Drawer**
- Observed: Cart icon click → side drawer slides in from right
- Trigger: click
- Entry: `translateX(100%) → 0` with backdrop fade
- Duration: 350ms
- Easing: `cubic-bezier(0.4, 0, 0.2, 1)`
- Classification: **(Observed)**

**08 — Image Hover — Color Alternate**
- Observed: Hovering a product card swaps the image to show alternate colour/angle after short delay
- Trigger: mouseenter + ~300ms debounce
- Transition: Crossfade, 200ms
- Classification: **(Strong inference)**

**09 — Sticky Header Compression**
- Observed: On scroll, header compresses slightly — search/utility icons may condense
- Trigger: `scrollY > 40`
- Transition: height reduction + opacity changes on secondary elements
- Duration: 200ms
- Classification: **(Strong inference)**

**10 — Category Filter Slide**
- Observed: Applying a filter causes the product grid to re-render with a brief fade/reflow
- Trigger: Filter selection click
- Transition: Grid fade out → data load → fade in
- Duration: 150–300ms
- Classification: **(Observed)**

**11 — Toast/Notification**
- Observed: "Added to bag" confirmation appears briefly at top or bottom
- Trigger: Add to bag action
- Entry: `translateY(-100%) → 0` (top) or `translateY(100%) → 0` (bottom)
- Duration: 300ms in, auto-dismiss after 2500ms, 200ms out
- Classification: **(Strong inference)**

**12 — Image Lazy Load**
- Observed: Product images load with a light placeholder (grey/white shimmer) that dissolves as the real image loads
- Implementation: `loading="lazy"` + CSS skeleton shimmer animation
- Classification: **(Observed)**

---

### D. COMPONENT LIBRARY INVENTORY

| Component | Visual Pattern | Complexity | Recreation Approach |
|-----------|---------------|------------|---------------------|
| **Hero Campaign Banner** | Full-width editorial image, overlay text + CTA | Low-Medium | CSS background-size:cover + absolute text |
| **Mega Nav** | Hover-expand multi-column link grid | High | CSS + JS, accessible keyboard nav |
| **Mobile Slide Nav** | Full-screen slide-from-right panel | Medium | CSS transform + JS toggle |
| **Product Card** | Portrait 3:4 image, name, price, heart, hover reveal | Medium | React component + CSS hover |
| **Product Grid** | 4-col responsive CSS grid | Low | CSS Grid, simple |
| **Quick Add Panel** | Slides up on card hover, size selector + CTA | Medium | CSS transform + React state |
| **Favourite Toggle** | Heart icon with spring animation | Low | CSS keyframe or Framer Motion |
| **Cart Drawer** | Right-slide panel, item list, total, checkout CTA | High | React portal + CSS transform |
| **Filter Sidebar** | Collapsible accordion categories | Medium | React state + CSS transition |
| **Size Selector** | Grid of size buttons, disabled + sold-out states | Low | React state buttons |
| **Skeleton Loader** | Shimmer placeholder for images/cards | Low | CSS animation + `@keyframes shimmer` |
| **Badge/Label** | Sale %, "New", "Members Only" — overlay on card | Low | Absolute positioned CSS |
| **Toast Notification** | Slide-in confirmation message | Low | React portal + CSS transition |
| **Search Overlay** | Full-width search bar expands on icon click | Medium | CSS max-width transition + JS focus |
| **Footer** | 4-col links, social, app store badges, legal | Low | Static grid layout |

---

# ════════════════════════════════════════
# PART II — ENGINEERING EXTRACTION
# ════════════════════════════════════════

---

## FRONTEND ARCHITECTURE PATTERNS

### Renault-Style Automotive Product Page Architecture

```
/src
├── /components
│   ├── /ui                        # Primitives
│   │   ├── Button.tsx
│   │   ├── Badge.tsx
│   │   ├── Icon.tsx
│   │   └── Typography.tsx
│   ├── /motion                    # Reusable animation wrappers
│   │   ├── FadeInUp.tsx           # Scroll-triggered fade+rise
│   │   ├── StaggerGroup.tsx       # Stagger children
│   │   ├── ParallaxContainer.tsx  # Scroll-linked parallax
│   │   ├── CountUp.tsx            # Number count-up on enter
│   │   └── PinSection.tsx         # GSAP scroll pin wrapper
│   └── /product                   # Domain-specific
│       ├── ColorPicker.tsx
│       ├── VariantSelector.tsx
│       ├── SpecCard.tsx
│       ├── FeaturePanel.tsx
│       └── ARViewer.tsx
├── /sections                      # Page-level sections (composition)
│   ├── HeroSection.tsx
│   ├── PerformanceSection.tsx
│   ├── TechnologySection.tsx
│   ├── SafetySection.tsx
│   ├── DesignSection.tsx
│   ├── ColorSection.tsx
│   ├── VariantsSection.tsx
│   └── CTASection.tsx
├── /layout
│   ├── Navbar.tsx                 # Scroll-aware sticky nav
│   ├── StickyPriceBar.tsx         # Fixed mobile CTA
│   └── Footer.tsx
├── /hooks
│   ├── useScrollProgress.ts       # Scroll position tracker
│   ├── useInView.ts               # Intersection Observer hook
│   ├── useNavbarState.ts          # Transparent/solid nav logic
│   ├── useCountUp.ts              # Number animation hook
│   └── useSmoothScroll.ts         # Lenis integration
├── /animations
│   ├── variants.ts                # Framer Motion variant library
│   ├── gsapTimelines.ts           # Reusable GSAP timelines
│   ├── easings.ts                 # Custom easing definitions
│   └── scrollTriggers.ts          # ScrollTrigger config presets
├── /utils
│   ├── cn.ts                      # Class name utility (clsx/cn)
│   ├── formatCurrency.ts
│   └── lazyLoad.ts
└── /styles
    ├── globals.css                # CSS variables, resets
    ├── typography.css
    └── animations.css             # Keyframe definitions
```

### H&M-Style E-Commerce Architecture

```
/src
├── /components
│   ├── /ui
│   │   ├── Button.tsx
│   │   ├── Badge.tsx
│   │   └── Skeleton.tsx           # Loading placeholder
│   ├── /navigation
│   │   ├── MegaNav.tsx
│   │   ├── MobileNav.tsx
│   │   └── SearchOverlay.tsx
│   ├── /product
│   │   ├── ProductCard.tsx        # With hover reveal
│   │   ├── ProductGrid.tsx        # Responsive grid
│   │   ├── QuickAdd.tsx           # Slide-up panel
│   │   ├── SizeSelector.tsx
│   │   └── FavouriteButton.tsx
│   └── /commerce
│       ├── CartDrawer.tsx
│       ├── FilterSidebar.tsx
│       ├── SortDropdown.tsx
│       └── Toast.tsx
├── /sections
│   ├── CampaignHero.tsx
│   ├── CategoryGrid.tsx
│   ├── ProductListing.tsx
│   └── EditorialBanner.tsx
└── /hooks
    ├── useCart.ts
    ├── useFavourites.ts
    ├── useFilter.ts
    └── useToast.ts
```

---

## CODE EXAMPLES

### 1. Hero Animation (GSAP — Automotive Style)
```tsx
// HeroSection.tsx
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useRef } from 'react';

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline({ delay: 0.2 });

    tl.from('.hero-image', {
      scale: 1.08,
      opacity: 0,
      duration: 1.4,
      ease: 'power3.out',
    })
    .from('.hero-eyebrow', {
      y: 20,
      opacity: 0,
      duration: 0.5,
      ease: 'power2.out',
    }, '-=0.6')
    .from('.hero-title span', {
      y: 60,
      opacity: 0,
      duration: 0.7,
      stagger: 0.08,
      ease: 'power3.out',
    }, '-=0.3')
    .from('.hero-cta', {
      y: 20,
      opacity: 0,
      duration: 0.5,
      stagger: 0.1,
      ease: 'power2.out',
    }, '-=0.3');
  }, { scope: containerRef });

  return (
    <section ref={containerRef} className="relative h-screen overflow-hidden">
      <img className="hero-image absolute inset-0 w-full h-full object-cover" />
      <div className="relative z-10 flex flex-col justify-end pb-24 px-12">
        <p className="hero-eyebrow text-yellow-400 text-sm tracking-widest uppercase">New Generation</p>
        <h1 className="hero-title text-8xl font-black text-white">
          <span>Renault</span><br />
          <span>Duster</span>
        </h1>
        <div className="flex gap-4 mt-8">
          <button className="hero-cta bg-yellow-400 text-black px-8 py-4 font-bold">Book Now</button>
          <button className="hero-cta border border-white text-white px-8 py-4">Explore</button>
        </div>
      </div>
    </section>
  );
}
```

### 2. Scroll Reveal — Universal Wrapper
```tsx
// FadeInUp.tsx — reusable scroll-triggered reveal
import { motion } from 'framer-motion';

interface FadeInUpProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function FadeInUp({ children, delay = 0, className }: FadeInUpProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 48 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{
        duration: 0.7,
        delay,
        ease: [0.22, 1, 0.36, 1],  // Custom exponential ease-out
      }}
    >
      {children}
    </motion.div>
  );
}
```

### 3. Stagger Group
```tsx
// StaggerGroup.tsx
import { motion } from 'framer-motion';

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 32 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

export function StaggerGroup({ children }: { children: React.ReactNode[] }) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-100px' }}
    >
      {children.map((child, i) => (
        <motion.div key={i} variants={item}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
```

### 4. Parallax Container
```tsx
// ParallaxContainer.tsx
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

export function ParallaxContainer({
  children,
  speed = 0.3,
}: {
  children: React.ReactNode;
  speed?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', `${speed * 100}%`]);

  return (
    <div ref={ref} className="overflow-hidden">
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
}
```

### 5. Premium Product Card (H&M Pattern)
```tsx
// ProductCard.tsx
import { motion } from 'framer-motion';
import { useState } from 'react';

export function ProductCard({ product }: { product: Product }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="group relative cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative overflow-hidden aspect-[3/4] bg-gray-100">
        <motion.img
          src={isHovered ? product.hoverImage : product.image}
          className="w-full h-full object-cover"
          animate={{ scale: isHovered ? 1.04 : 1.0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
        {/* Quick Add Panel */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 bg-white p-3"
          initial={{ y: '100%' }}
          animate={{ y: isHovered ? '0%' : '100%' }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          <button className="w-full bg-black text-white py-3 text-sm font-medium">
            Quick Add
          </button>
        </motion.div>

        {/* Favourite */}
        <button className="absolute top-3 right-3 z-10">
          <motion.div
            whileTap={{ scale: 1.3 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          >
            ♡
          </motion.div>
        </button>
      </div>

      <div className="pt-2">
        <p className="text-sm text-gray-900">{product.name}</p>
        <p className="text-sm font-semibold mt-0.5">₹{product.price}</p>
      </div>
    </div>
  );
}
```

### 6. Animated Navbar (Scroll-Aware)
```tsx
// Navbar.tsx
import { motion, useScroll } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setIsScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 px-8 py-4 flex items-center justify-between"
      animate={{
        backgroundColor: isScrolled ? 'rgba(10,10,10,0.92)' : 'transparent',
        backdropFilter: isScrolled ? 'blur(12px)' : 'blur(0px)',
      }}
      transition={{ duration: 0.3 }}
    >
      <Logo />
      <NavLinks />
      <CTAButton />
    </motion.nav>
  );
}
```

### 7. Smooth Scrolling Setup (Lenis)
```tsx
// app/providers.tsx
import Lenis from 'lenis';
import { useEffect } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
    });

    // Sync Lenis with GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    return () => lenis.destroy();
  }, []);

  return <>{children}</>;
}
```

### 8. Count-Up Hook
```tsx
// useCountUp.ts
import { useEffect, useRef, useState } from 'react';
import { useInView } from './useInView';

export function useCountUp(target: number, duration: number = 1500) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref);

  useEffect(() => {
    if (!isInView) return;

    let start = 0;
    const step = target / (duration / 16);

    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [isInView, target, duration]);

  return { count, ref };
}
```

---

# ════════════════════════════════════════
# PART III — KNOWLEDGE TRANSFER
# ════════════════════════════════════════

---

## 1. RENAULT LEARNINGS

### ✅ DO — Patterns Worth Copying

**Cinematic Hero Entry**
- Always start with scale + opacity entrance for hero images (scale 1.08 → 1.0, opacity 0 → 1)
- Stagger headline text lines with 80–100ms between each
- Use `power3.out` easing — it has an automotive "engine smoothness"

**Spec Number Callouts**
- Isolate hero numbers (power, torque, clearance) at 64px+, bold weight
- Pair with count-up animation on scroll enter — the number "revealing itself" creates drama
- Use tabular numeric font variant to prevent layout shift during count-up

**Sticky CTA Bar**
- Always implement a persistent floating CTA bar for mobile
- Include price anchor ("Starting ₹X.XX L") + primary CTA in the bar
- Appears after hero scrolls out of view — not on initial load

**Pinned Feature Sections**
- Use GSAP ScrollTrigger `pin: true` for technology deep-dives
- Left panel stays fixed (vehicle image), right panel scrolls through feature panels
- Creates high-perceived-value interaction with modest implementation cost

**Dark-Background Sections**
- Alternate dark (#0D0D0D) and light sections rhythmically
- Dark sections create cinematic contrast and rest periods for the eye
- Yellow accents on dark backgrounds: extremely high impact, zero over-design

**3D / AR Integration**
- Even a basic model-viewer web component elevates perceived premium enormously
- Lazy-load it — don't block page load for the viewer

**Section Chapter Structure**
- Never show more than one major idea per scroll section
- Each section = one headline, one supporting visual, one CTA or spec block
- Prevents cognitive overload; maintains narrative momentum

### ❌ AVOID

- Autoplay video without user consent (accessibility + performance penalty)
- Parallax on mobile — causes jank and layout issues on iOS Safari
- Running all animations simultaneously on page load (creates chaos, not drama)
- Custom cursor on mobile (zero benefit, often breaks touch events)
- Cursor-following effects that require `mousemove` throttling — expensive

---

## 2. H&M LEARNINGS

### ✅ DO — Patterns Worth Copying

**Product Card Hover Reveal**
- The "Quick Add" slide-up on hover is one of the highest-ROI e-commerce patterns
- Implementation cost: trivially low (`translateY` CSS transition)
- Conversion impact: significant (reduces clicks to purchase intent)

**Portrait Aspect Ratio (3:4)**
- Always use 3:4 for fashion product cards — this is the industry standard for a reason
- It shows the human wearing the product at natural scale
- Never use 1:1 (Instagram ratio) for fashion product grids

**Zero Border Radius**
- `border-radius: 0` on cards and buttons signals fashion/editorial authority
- Immediately distinguishes from "startup" or "tech" aesthetic
- One of the cheapest brand upgrades available

**Skeleton Loading**
- CSS shimmer skeleton loaders before image load = perceived performance gain
- Implementation: 5 lines of CSS, massive UX improvement

**Mega Navigation Restraint**
- H&M's mega menu has 50+ links but feels clean — because categories are grouped with headers, sub-items are smaller weight, and whitespace is generous
- Don't mistake "many links" for "bad navigation" — structure saves it

**Editorial Framing of Promotions**
- "Linen in Focus" reads better than "Linen Category"
- "Flat 15% Off: Selected Items" reads better than "SALE 15% OFF"
- Copywriting choices convert navigation links into editorial invitations

**Heart/Favourite Micro-interaction**
- Spring animation on favourite toggle: `scale 1 → 1.3 → 1.0`
- Creates tactile satisfaction that drives engagement
- Implementation: Framer Motion `whileTap={{ scale: 1.3 }}`

### ❌ AVOID

- Over-filtering interactions that force full page reload (should be client-side)
- Bottom navigation on desktop (mobile-only pattern)
- Adding border/shadow to fashion product cards — kills editorial feel
- Auto-playing carousels on homepage — disorienting, conversion-negative

---

## 3. COMBINED PREMIUM SYSTEM

### The Unified Premium Stack

Combining both sites, a premium frontend system emerges built on these non-negotiables:

**Visual**
- Dark/light alternating sections (Renault) + pure white product zones (H&M)
- One accent colour used sparingly (yellow for automotive, red for brand marks)
- Typography at aggressive scale for hero moments, restrained for body
- Zero or near-zero border radius on interactive elements

**Motion**
- Every element has exactly ONE entrance animation (not multiple properties animating independently)
- Stagger groups: 80–120ms between siblings (never more)
- All scroll animations: `once: true` — they do not replay
- Hover states: max 250ms, always ease-out
- Page load: max 3 elements animate simultaneously

**Performance**
- Smooth scroll: Lenis + GSAP ticker sync (non-negotiable for automotive; optional for e-commerce)
- Images: WebP format, `loading="lazy"`, correct `aspect-ratio` to prevent CLS
- Animations: `will-change: transform` on elements known to animate
- No JS animations on mobile for performance-critical paths — CSS only

---

## 4. REUSABLE ANIMATION LIBRARY

### Core Primitives (Copy-Paste Ready)

```ts
// animations/easings.ts
export const easings = {
  smooth:     [0.22, 1, 0.36, 1],      // Exponential ease-out (cinema quality)
  snappy:     [0.4, 0, 0.2, 1],         // Material standard
  spring:     { type: 'spring', stiffness: 300, damping: 25 },
  springFast: { type: 'spring', stiffness: 500, damping: 30 },
  linear:     'linear',
};

// animations/variants.ts
export const fadeInUp = {
  hidden: { opacity: 0, y: 48 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: easings.smooth } },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.5 } },
};

export const slideFromRight = {
  hidden: { x: '100%' },
  show: { x: 0, transition: { duration: 0.35, ease: easings.snappy } },
};

export const scaleIn = {
  hidden: { scale: 0.92, opacity: 0 },
  show: { scale: 1, opacity: 1, transition: { duration: 0.5, ease: easings.smooth } },
};

export const staggerContainer = (stagger = 0.1, delayChildren = 0.2) => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren } },
});

export const heartPop = {
  tap: { scale: 1.3 },
  transition: { type: 'spring', stiffness: 400, damping: 12 },
};
```

---

## 5. IMPLEMENTATION PRIORITY

### Phase 1 — Foundation (Week 1)
1. Lenis smooth scroll setup + GSAP sync
2. FadeInUp scroll-reveal wrapper component
3. Scroll-aware navbar (transparent → solid)
4. CSS skeleton loaders for all image containers

### Phase 2 — High Impact (Week 2)
5. Hero entrance animation (image scale + headline stagger)
6. Stagger group wrapper
7. Count-up hook for numbers/stats
8. Product card hover reveal (Quick Add pattern)

### Phase 3 — Premium Polish (Week 3)
9. Parallax containers for hero images
10. Pinned feature section (GSAP ScrollTrigger)
11. Cart/modal drawer slide-in
12. Toast notification system

### Phase 4 — Advanced (Week 4+)
13. 3D model viewer integration
14. Image sequence scroll animation (canvas)
15. Custom page transitions
16. AR deeplink integration

---

## 6. FRONTEND MATURITY SCORE

| Dimension | Renault India | H&M India | Industry Best |
|-----------|:----------:|:-------:|:----------:|
| Motion Design | 8.5 / 10 | 6.5 / 10 | 9.5 / 10 |
| Design System Consistency | 7.5 / 10 | 8.5 / 10 | 9.0 / 10 |
| Performance | 7.0 / 10 | 7.5 / 10 | 9.0 / 10 |
| Accessibility | 6.5 / 10 | 7.0 / 10 | 9.0 / 10 |
| Mobile Experience | 7.5 / 10 | 8.0 / 10 | 9.5 / 10 |
| Component Reusability | 7.0 / 10 | 8.0 / 10 | 9.0 / 10 |
| Typography System | 8.0 / 10 | 8.5 / 10 | 9.5 / 10 |
| Conversion Architecture | 8.0 / 10 | 9.0 / 10 | 9.5 / 10 |
| **Overall** | **7.5 / 10** | **7.9 / 10** | **9.4 / 10** |

**Key Gap Identified:** Both sites underinvest in accessibility (ARIA, keyboard nav, motion reduction `prefers-reduced-motion`). This is the lowest-hanging differentiation opportunity for a new build.

---

## 7. BUILD BLUEPRINT FOR FUTURE WEBSITE

### The Premium Synthesis System

**Stack**
```
Framework:       Next.js 14+ (App Router)
Styling:         Tailwind CSS v4 + CSS Variables
Animation:       Framer Motion (component-level) + GSAP (scroll/complex)
Scroll:          Lenis (smooth scroll) synced with GSAP ticker
3D:              Three.js / React Three Fiber (if needed)
State:           Zustand (global) + React state (local)
Forms:           React Hook Form
CMS:             Contentful / Sanity (structured content)
Images:          Next.js <Image> component (WebP, lazy, blur placeholder)
Deployment:      Vercel (Edge Network)
```

**Design Tokens (CSS Variables — Master System)**
```css
:root {
  /* Colors */
  --color-bg:          #0A0A0A;
  --color-bg-alt:      #141414;
  --color-surface:     #1A1A1A;
  --color-accent:      #FFD700;     /* Renault yellow / brand colour */
  --color-text:        #FFFFFF;
  --color-text-muted:  #888888;
  --color-border:      #2A2A2A;

  /* Typography */
  --font-display:      'YourBrandFont', system-ui;
  --font-body:         'YourBodyFont', system-ui;

  /* Spacing */
  --space-xs:   4px;
  --space-sm:   8px;
  --space-md:   16px;
  --space-lg:   24px;
  --space-xl:   48px;
  --space-2xl:  96px;
  --space-3xl:  128px;

  /* Radii */
  --radius-sm:  4px;
  --radius-md:  8px;
  --radius-full: 9999px;

  /* Transitions */
  --ease-out-expo: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
  --duration-fast:   200ms;
  --duration-base:   350ms;
  --duration-slow:   700ms;
  --duration-cinema: 1200ms;
}
```

**Page Structure (Automotive Product Page)**
```
<SmoothScrollProvider>           ← Lenis
  <Navbar />                     ← Scroll-aware, sticky
  <main>
    <HeroSection />              ← Full-bleed, GSAP entrance
    <IntroSection />             ← Identity / story
    <DesignSection />            ← Exterior/interior showcase
    <PerformanceSection />       ← Specs + count-up
    <TechnologySection />        ← Pinned scroll feature panels
    <SafetySection />            ← ADAS, credibility badges
    <ColorSection />             ← Interactive picker
    <VariantsSection />          ← Pricing / trim levels
    <CTASection />               ← Final conversion push
  </main>
  <Footer />
  <StickyPriceCTA />             ← Mobile only, fixed bottom
</SmoothScrollProvider>
```

**Animation Architecture Rules**
1. All scroll animations use `once: true` — never loop on scroll
2. Motion respects `prefers-reduced-motion` — always provide CSS fallback
3. Page load sequence: image → eyebrow → headline → CTA (never simultaneous)
4. Hover animations: always `ease-out`, never exceed 300ms
5. Stagger sibling elements: 80–120ms, max 6 items in a stagger group
6. Heavy animations (parallax, pinned scroll) disabled on mobile via `matchMedia`
7. All GSAP instances cleaned up in `useGSAP` return or component unmount

---

## HIGH ROI EFFECTS (Effort vs Impact Matrix)

| Effect | Implementation Cost | Premium Impact | Priority |
|--------|:------------------:|:--------------:|:--------:|
| Hero image scale entrance | Low | Very High | 🔴 Must |
| Scroll-triggered fade+rise | Very Low | High | 🔴 Must |
| Stagger text lines | Low | Very High | 🔴 Must |
| Scroll-aware navbar | Low | Medium | 🔴 Must |
| Count-up numbers | Low | High | 🟡 High |
| Product card hover reveal | Very Low | Very High | 🔴 Must |
| Lenis smooth scroll | Low | Very High | 🔴 Must |
| Skeleton loading | Very Low | High | 🟡 High |
| Pinned scroll section | Medium | Very High | 🟡 High |
| Parallax hero | Medium | High | 🟢 Medium |
| 3D model viewer | Very High | High | 🟢 Medium |
| Image sequence scroll | Very High | Very High | ⚪ Later |
| Custom cursor | Medium | Low | ⚪ Skip |

---

*Report compiled from live site analysis, browser DevTools inference, industry pattern recognition, and known technology signatures. Classification levels: (Observed) = directly confirmed; (Strong inference) = technically consistent + industry-standard; (Speculation) = plausible based on visual output and technology context.*

*End of Report — Frontend Research Division*
