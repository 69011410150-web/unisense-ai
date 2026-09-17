# Design Brief

## Direction

**Daylight Campus** — a calm, deep-ocean-blue campus companion that turns a student's schedule into a clear next step, with the AI assistant as the visual center of gravity.

## Tone

Refined minimalism with soft, friendly geometry — restrained enough to read in 3 seconds, warm enough that a first-year student trusts it. No decoration that does not carry information.

## Differentiation

The **"sense pulse" halo** — a layered, breathing blue ring around the AI affordance (home input, assistant avatar, scan trigger) that makes the assistant feel alive and present on every screen without a single extra ornament.

## Color Palette

| Token      | OKLCH         | Role                                                        |
| ---------- | ------------- | ----------------------------------------------------------- |
| background | 0.982 0.006 232 | Cool off-white paper; desktop canvas behind cards         |
| foreground | 0.205 0.022 258 | Primary text; slate-navy, never pure black                |
| card       | 1 0 0         | Elevated white surfaces — the dominant UI material          |
| primary    | 0.485 0.192 258 | Deep ocean blue: CTAs, active nav, focus ring, countdown  |
| accent     | 0.62 0.132 195  | Calm teal — sparing: "arrives on time", EV, scan success  |
| muted      | 0.958 0.01 244  | Section alternation, chips, inert surfaces                |
| success    | 0.585 0.148 158 | On-time / low crowd status                                |
| warning    | 0.735 0.152 76  | Crowded shuttle, tight timing                             |
| viewfinder | 0.238 0.032 258 | AI Scan camera stage — dark in BOTH modes, never inverts  |
| viewfinder-border | 0.365 0.034 258 | Bracket frame at rest; teal (`accent`) once detected |

Dark mode ("Night Library"): background `0.168 0.022 258`, card `0.216 0.026 258`, primary `0.712 0.148 252` — intentional navy depth, not inverted grey.

## Typography

- Display: **Space Grotesk** — headings, greeting, subject names, countdown numerals, brand wordmark
- Body: **Figtree** — Thai UI copy, labels, buttons, paragraphs (best Thai legibility of the bundled set)
- Mono: **Geist Mono** — room codes, student ID, times in dense rows
- Scale: hero `text-3xl md:text-5xl font-bold tracking-tight`, h2 `text-xl md:text-2xl font-bold tracking-tight`, label `text-xs font-semibold tracking-widest uppercase text-muted-foreground`, body `text-base leading-relaxed`

## Elevation & Depth

Three-step blue-tinted shadow ladder on white cards over a cool off-white canvas: `shadow-soft` (resting cards) → `shadow-elevated` (next-class hero, active nav) → `shadow-floating` (bottom nav, sheets). Depth comes from layered surfaces and one ambient radial blue wash, never from full-page gradients.

## Structural Zones

| Zone            | Background          | Border                            | Notes                                                                 |
| --------------- | ------------------- | --------------------------------- | --------------------------------------------------------------------- |
| App header      | `bg-card`           | `border-b border-border`          | Sticky, logo + wordmark + profile; blurs on scroll                     |
| Mobile bottom nav | `bg-card/95` backdrop-blur | `border-t border-border`   | Floating rounded bar, 5 Thai tabs, active = primary pill + label       |
| Desktop sidebar | `bg-card`           | `border-r border-border`          | Logo top, 5 nav items, profile pinned bottom; active = `bg-primary/8` |
| Content         | `bg-background`     | —                                 | `max-w-5xl` centered, `px-4 md:px-8`; hero cards use `bg-gradient-sheen` |
| Section alt     | `bg-muted/40`       | —                                 | Alternating bands for schedule / EV list grouping                      |
| Footer / notice | `bg-muted/40`       | `border-t border-border`          | Prototype "demo data" notice, small muted text                         |

## Spacing & Rhythm

Mobile-first: `gap-4` between cards, `gap-6 md:gap-8` between sections, `p-5` inside cards (never below `p-4`); 4px base scale, `py-6` section padding. Generous whitespace, controlled density inside schedule rows.

## Component Patterns

- Buttons: pill / `rounded-full` for primary CTAs (`bg-primary` + `bg-gradient-primary` hover), `rounded-xl` for secondary (`bg-secondary`), `rounded-full` icon buttons 40–44px; hover lifts to `shadow-elevated`, press scales to `0.97`
- Cards: `rounded-2xl` (24px) white, `border border-border`, `shadow-soft`, `p-5`; hero cards `rounded-3xl` with a 3px `bg-gradient-primary` top edge
- Badges: `rounded-full` pills, `text-xs font-semibold`; status uses `bg-success/12 text-success` (on time), `bg-warning/14 text-warning` (crowded), `bg-primary/10 text-primary` (info)
- Inputs: `rounded-2xl`, `bg-muted/50`, focus ring `ring-2 ring-ring/40` with a soft halo

## Motion

- Entrance: content fades + rises 8px, `300ms` ease-out, staggered `40ms` per card; page transitions `200ms` cross-fade
- Hover: `--transition-snappy` (180ms) on cards, chips, nav items; icon buttons scale `1.06`
- Decorative: `pulse-halo` (3s breathing ring on AI affordances), `float` (6s ambient drift on the scan frame), `scan-line` (1.6s sweep during AI scan), `typing-dot` (1.2s staggered bounce in the assistant), `fade-rise` (0.3s result-card entrance)

## AI Scan

Simulated signage scan. No camera permission, no real camera, no GPS — the viewfinder is a styled stage and the result is fixed demo data (อาคารวิทยาศาสตร์ 2 / ชั้น 2 / SC-204). Thai-only copy.

| State           | Visual                                                              | Tokens / utilities                                                    |
| --------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Idle viewfinder | Dark camera stage, neutral bracket frame, Thai hint "ส่องกล้องไปที่ป้ายอาคาร", scan button with breathing halo | `viewfinder` + `-foreground`, `viewfinder-frame`, `halo-primary` + `animate-pulse-halo` |
| Analyzing       | Sweeping scan line, "AI กำลังวิเคราะห์สถานที่...", button disabled   | `animate-scan-line`, `viewfinder-muted`, `animate-typing-dot`, `bg-primary/50` |
| Detected result | Brackets turn teal, "✦ AI ตรวจพบ" badge on stage, result card fades up | `viewfinder-frame-detected`, `bg-accent/12 text-accent`, `animate-fade-rise`, `shadow-elevated` |
| Route hand-off  | "🧭 พาฉันไป" pill CTA hands off to `/navigate`, auto-planned SC-204  | `bg-gradient-primary` + `rounded-full`, `shadow-soft` → `shadow-elevated` |

Result rows: 📍 อาคารวิทยาศาสตร์ 2 · 🏢 ชั้น 2 · 🚪 ห้อง SC-204 — room code `font-mono` in a `bg-muted` chip; muted Thai footnote marks the scan as simulated demo data.

## Constraints

- All visible UI text in Thai; "UniSense AI" stays English — Space Grotesk display + Figtree body both cover Latin; Thai falls back to Figtree/system Thai sans
- Demo/simulated data only: no real university systems, no real student data, no live GPS
- No campus map imagery with live position tracking; navigation is a schematic route plan
- No push or email class reminders anywhere in the UI
- Token-only styling: no hex/rgb literals, no arbitrary Tailwind color classes, no inline colors
- Mobile-first: bottom nav < `md`, sidebar ≥ `md`; every tap target ≥ 44px

## Signature Detail

The **"sense pulse" halo** (`halo-primary` + `pulse-halo`) — a breathing concentric blue ring that marks every AI touchpoint (home input, assistant avatar, scan trigger), giving the assistant a physical presence and giving the app one instantly recognizable visual signature.
