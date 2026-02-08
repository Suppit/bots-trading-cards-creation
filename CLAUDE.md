# BOTS Trading Card Creator — Project Context

## What This Project Is
A mobile-first web app (PWA) where users create personalized digital BOTS trading cards in ~1 minute. Users take/upload a photo, it gets stylized (illustrated/anime style), then composited into a card frame with user-entered text.

## Repository
- **GitHub:** git@github.com:Suppit/bots-trading-cards-creation.git
- **Branch:** main
- **SSH auth** is configured for push

## User Flow (from Plan.pdf)
1. **Start Screen** — tap Start, assets preload in background
2. **Photo Capture & Crop** — selfie or gallery, cropped to 114:97 aspect ratio
3. **Text Entry** — 4 fields (Title, Tagline, Fun Fact, Pro Tip) while photo stylizes
4. **Card Reveal** — stylized portrait composited into card frame with text
5. **Series Swipe** — swipe between 5 frame themes (frame-only swap, no reprocessing)
6. **Export & Share** — download as PNG or native share

## Card Series
- Series 1 — Blue
- Series 2 — Red/Pink
- Series 3 — Green
- Series 4 — Yellow
- Specialty — Rainbow/multicolor

## Card Dimensions
- All frames: **1499×2098 pixels** (digital; the 1644×2244 versions in Assets/ include print bleed)
- Portrait mask: 114:97 aspect ratio
- Font: Aileron (Bold, Bold Italic, Regular) — specified in the Figma design system

## Key Files
- `Plan.pdf` — v1 feature spec (6 features confirmed for v1)
- `Master-plan.md` — 11-phase technical implementation plan with logging/testing checkpoints
- `references/` — 5 card frame templates (one per series) showing text zone layout + `Card-Layout.ai` (Illustrator source)
- `Assets/` — ~40 finished example cards showing the art style + card back image
- `Assets/BOTS.svg` — brand logo (blue "BTS" with orange heart "O")
- `app/` — Next.js 16 project (TypeScript, Tailwind CSS, ESLint, Prettier)

## Figma Design System
- **Figma MCP** is configured (`figma-desktop` at http://127.0.0.1:3845/mcp)
- The design system in Figma contains all typography, colors, spacing, components, and tokens for the UI
- **Always consult the Figma design system** before building UI components

## Completed Phases
### Phase 1: Project Setup & Foundation ✅ (tagged: `phase-1`)
- Next.js 16 + TypeScript + Tailwind CSS + ESLint + Prettier
- Folder structure: `src/components/`, `src/hooks/`, `src/utils/`, `src/assets/`, `src/lib/`
- Client logger (`src/lib/logger.ts`) — DEBUG/INFO/WARN/ERROR levels, timestamps, component tags, metadata. Controlled via `NEXT_PUBLIC_LOG_LEVEL` env var.
- Server logger (`src/lib/server-logger.ts`) — structured JSON logs with requestId support
- ErrorBoundary component (`src/components/ErrorBoundary.tsx`) — catches React crashes, logs them, shows retry UI
- GlobalErrorHandler (`src/components/GlobalErrorHandler.tsx`) — catches window.onerror and unhandled promise rejections
- Layout wired: ErrorBoundary → GlobalErrorHandler → children

### Phase 2: Asset Preparation & Preloading ✅ (tagged: `phase-2`)
- **Frame images** — 5 transparent PNGs in `app/public/frames/` (series-1.png through specialty.png + back.jpg), all 1499×2098
- **Aileron fonts** — Regular, Bold, BoldItalic .otf files in `app/public/fonts/`, loaded via @font-face in globals.css
- **Layout constants** (`src/lib/layout-constants.ts`) — card dimensions, portrait mask (114:97), text zone positions & font specs, series metadata, character limits. Positions derived from reference templates; may need fine-tuning during Canvas rendering.
- **Preloader service** (`src/lib/preloader.ts`) — loads all frames + card back + fonts with progress callbacks, caches images in memory, logs each asset with timing
- **Font loading** — Aileron for Canvas card rendering via @font-face + FontFace API in preloader

### Phase 3: Start Screen & App Shell ✅ (tagged: `phase-3`)
- **AppContext** (`src/contexts/AppContext.tsx`) — React Context holding PreloadResult, current step, preload progress/error, retry. useRef guard for Strict Mode.
- **BotsLogo** (`src/components/BotsLogo.tsx`) — Inline SVG logo (blue #035ba7 + orange #e75625 heart)
- **StartScreen** (`src/components/StartScreen.tsx`) — Full-screen start UI: logo, "Create Your Trading Card" tagline, Start button (48px+ touch target), preload progress bar, error/retry handling
- **AppFlow** (`src/components/AppFlow.tsx`) — Step-based view router (start → photo-capture → text-entry → card-reveal → series-swipe → export)
- **PlaceholderScreen** (`src/components/PlaceholderScreen.tsx`) — Temporary screen for phases not yet built
- **UI font** — Figtree via `next/font/google` (Aileron remains for Canvas only)
- **Light mode only** — dark mode media query removed
- **Cleaned up** — removed Next.js boilerplate SVGs and default page content
- **Testing** — @testing-library/react + jsdom; 27 tests passing across 4 test files

## Build & Run
```bash
cd app && npm run dev    # Dev server at localhost:3000
cd app && npm run build  # Production build
```

## Workflow Rules
- Push to GitHub and tag after completing each phase (e.g., `phase-1`, `phase-2`)
- Do NOT overwrite Master-plan.md
- Add logging (console + server) at the end of each feature step
- Include tests at each phase
