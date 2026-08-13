# Design Document
## Thrust 5.0 — Live Leaderboard Platform

**Companion to:** 01-PRD.md
**Scope:** Visual design system, UX flows, motion design, component inventory

---

## 1. Design Principles

1. **Look like it was designed for Thrust 5.0, not for "a leaderboard."** Every generic dashboard template makes the same choices — centered glassmorphic card, purple-to-blue gradient background, a Inter/Poppins pairing, glowing neon borders, floating blurred circles behind everything. We're explicitly avoiding all of that (see Section 3).
2. **The event brand drives the palette, not a color picker.** Once the Thrust 5.0 logo/branding is available, colors, gradients (if any), and iconographic language are extracted from it, not invented separately.
3. **Motion communicates meaning, not decoration.** A team moving from 4th to 2nd should *look* like it's moving — animate position changes with real physics (spring easing), not just cross-fade the numbers. Motion that doesn't communicate a state change gets cut.
4. **Legible from 20 feet and from a phone in someone's hand.** Design for the projector first — big type, strong contrast, clear hierarchy — then confirm it collapses gracefully to mobile.
5. **Fast is part of the design.** A beautiful frame that stutters when 40 teams re-sort is a broken design, not a performance bug to fix later.

## 2. Brand & Color System

### 2.1 Sourcing the palette

Once the Thrust 5.0 logo file is available, extract:
- **Primary brand color(s)** — the dominant color(s) in the logo mark itself.
- **Secondary/accent color** — a supporting color used sparingly for CTAs, live-indicators, and rank-up animations.
- **Neutral base** — a near-black or near-white derived from the logo's darkest/lightest tone, not a stock `#0F0F0F` — this is what keeps the UI from looking like every other dark-mode dashboard.
- **Logo typography cues** — if the logo uses a distinct type treatment (condensed, geometric, industrial), let that inform the display typeface pairing below, rather than defaulting to Inter/Poppins/Space Grotesk (the three fonts every AI-generated site reaches for).

### 2.2 Placeholder palette (build can start now, swap on logo delivery)

Given the "Thrust" name (rocket/propulsion theme is a reasonable bet pending the logo), a placeholder palette in that spirit:

| Token | Hex | Use |
|---|---|---|
| `--bg-base` | `#0B0E14` | Page background — a near-black with a slight blue undertone, not pure black |
| `--bg-surface` | `#12161F` | Card/panel surface |
| `--ignition-orange` | `#FF5A1F` | Primary accent — rank-up animations, live pulse, primary CTA |
| `--thrust-blue` | `#2E7DFF` | Secondary accent — links, round-tab active state |
| `--gold` | `#E8B84B` | Rank #1 / podium gold — used sparingly, not as a general accent |
| `--text-primary` | `#F4F5F7` | Primary text |
| `--text-muted` | `#8A93A6` | Secondary/meta text |
| `--success` | `#3ECF8E` | Sync-OK / live indicator |
| `--danger` | `#E5484D` | Sync error / disconnected state |

> **Action item:** replace this table wholesale once the logo arrives — don't just tint it. If the real brand is, say, teal-and-silver, this orange/blue rocket theme is wrong and should be discarded, not blended in.

### 2.3 What we're explicitly avoiding

To make sure the final product doesn't read as AI-generated or template-driven:

- ❌ Purple→blue or pink→orange linear gradients as a background wash
- ❌ Glassmorphism as the default card treatment (frosted blur + thin white border on everything)
- ❌ Generic glow/neon drop-shadows on every interactive element
- ❌ Floating blurred gradient blobs behind content
- ❌ Default Inter/Poppins/Space Grotesk pairing with no distinct display face
- ❌ Emoji used as icons instead of a real icon set
- ❌ Centered-everything layouts with no asymmetry or grid tension

Instead: a real grid system, one confident display typeface used sparingly for numbers/ranks, a restrained and deliberate use of accent color (not everywhere at once), and texture/depth from actual layering and shadow logic rather than blur filters.

## 3. Typography

- **Display face** (ranks, big numbers, team names on podium): a condensed or geometric sans with real character — e.g., something in the family of **Bebas Neue**, **Archivo Black**, or a variable font like **Space Grotesk's bolder cuts used deliberately, not as body text**. Final choice locks once the logo's type language is known.
- **Body/UI face**: a clean, highly legible workhorse — **Inter** is fine *here* (UI chrome, table labels, admin forms) precisely because nobody notices workhorse fonts in supporting roles; the mistake is using it for the hero numbers too.
- **Numerals**: tabular figures (`font-variant-numeric: tabular-nums`) everywhere scores appear, so digits don't jitter horizontally as they update.

## 4. Layout & Screens

### 4.1 Public Leaderboard (primary screen)

```
┌─────────────────────────────────────────────────────────┐
│  [Thrust 5.0 logo]      LIVE LEADERBOARD    ● LIVE  12:04│
├─────────────────────────────────────────────────────────┤
│                                                           │
│     🥈 TEAM RANK 2        🥇 TEAM RANK 1      🥉 RANK 3   │
│     [podium card]         [podium card, taller] [card]   │
│                                                           │
├─────────────────────────────────────────────────────────┤
│  Rank │ Team          │ R1  │ R2  │ R3  │ Design │ Total │
│  4    │ Team Falcon   │ 82  │ 91  │ 76  │  18    │ 267   │
│  5    │ Team Orbit    │ 78  │ 85  │ 80  │  20    │ 263   │
│  ...  │               │     │     │     │        │       │
├─────────────────────────────────────────┬───────────────┤
│                                          │ DESIGN MARKS   │
│                                          │ mini-leaderboard│
│                                          │ (top 5, compact)│
└──────────────────────────────────────────┴───────────────┘
```

- **Podium block**: top 3 teams get an elevated, visually distinct treatment (not just row 1-2-3 of the table) — this is the "hero" moment of the screen.
- **Main table**: remaining teams in a dense, scannable list — Round 1 / Round 2 / Round 3 / Design / Total as explicit columns per the PRD.
- **Design Marks panel**: a compact side panel (or, on mobile, a swipeable second tab) ranking teams by design score alone — separate ranking, same visual language, smaller footprint.
- **Header**: live/reconnecting status pill + last-updated timestamp, always visible, never buried.

### 4.2 Mobile behavior

- Podium collapses to a horizontal swipeable strip or stacks vertically (1st on top, larger).
- Table becomes a stacked card list per team (team name + total prominent, tap/expand to see the R1/R2/R3/Design breakdown) rather than a horizontally-scrolling table — horizontal scroll tables on mobile are a common pain point worth designing around explicitly.
- Design Marks panel becomes a second tab/segment control, not a squeezed sidebar.

### 4.3 Admin Login

- Minimal, on-brand, single-purpose screen. Team/password fields, no unnecessary chrome. Subtle motion on error (shake/pulse) rather than a jarring alert box.
- Rate-limit feedback shown inline ("too many attempts, try again in Xs") — never silent lockouts.

### 4.4 Admin Panel — Score Entry

- Team selector (searchable) + round tabs (Round 1 / Round 2 / Round 3 / Design Marks) rather than one long form — keeps a judge focused on entering the current round only, reduces mis-entry risk.
- Each team row shows: current score for the selected round (editable inline), who last edited it and when (FR-13), and a save state indicator (saving / saved / error).
- Explicit confirm-overwrite step when editing a non-empty score (FR-10).
- Bulk-import panel (CSV/Excel pull) as a secondary, clearly-separated action — not mixed into the per-team flow, so it's not accidentally triggered.
- Sync status strip: last successful push to Excel, last pull, any conflict flags (FR-20).

## 5. Motion Design

Motion is implemented with **Framer Motion**, driven by real state changes — not applied decoratively.

### 5.1 Rank change animation

- When the ordered team list changes, teams animate to their new vertical position using `layout` animations with a spring transition (`type: "spring", stiffness: ~300, damping: ~30`) rather than instant reflow.
- A team that moved up flashes a brief accent-colored glow/border pulse (using the ignition-orange token) and a small "+N" delta badge that fades out after ~1.5s.
- A team that moved down gets a more muted transition — no celebratory motion for a drop, keep it neutral.

### 5.2 Score update micro-interaction

- Total score digits use an odometer-style roll/count-up animation when they change (not a hard cut from old value to new).
- New score entries pulse the affected row once on the public display so viewers notice *which* team just got updated even without staring at deltas.

### 5.3 Podium entrance

- On initial load (or when the top 3 changes), podium cards animate in with a slight stagger (100–150ms offset per card) and a spring settle — communicates hierarchy without being gimmicky.

### 5.4 Connection state

- Live indicator pulses gently (steady heartbeat animation) when connected; switches to a distinct "reconnecting" animated state (different color + subtle shake or dashed pulse) rather than just changing a label — this needs to be noticeable from a distance since it's an operational signal, not decoration.

### 5.5 Restraint rule

No more than one "large" animation (podium reorder, rank swap) in flight at a time per section — simultaneous competing animations across the whole screen reads as chaotic rather than polished, especially at the moment right after a round closes and many scores land at once. Batch and stagger reorders rather than animating every affected row simultaneously.

## 6. Component Inventory

| Component | Notes |
|---|---|
| `PodiumCard` | Top-3 hero card, rank-aware styling (gold/silver/bronze accents, not full rainbow) |
| `LeaderboardTable` | Virtualized for large team counts; `layout`-animated rows |
| `DesignMarksPanel` | Compact secondary leaderboard, shared row component with main table where possible |
| `LiveStatusPill` | Connected / reconnecting / stale states |
| `ScoreDeltaBadge` | Transient "+N" indicator on row after an update |
| `AdminLoginForm` | Rate-limit aware, accessible error states |
| `RoundTabs` | Round 1 / Round 2 / Round 3 / Design Marks selector in admin panel |
| `TeamScoreRow` (admin) | Inline-editable score cell, last-edited-by metadata, save-state indicator |
| `SyncStatusStrip` | Excel push/pull status, conflict flag, manual resync trigger (Super Admin only) |
| `ConflictResolutionModal` | Side-by-side diff when app and Excel disagree after an outage (Super Admin only) |

## 7. Accessibility Notes

- Color is never the only signal for rank change or sync state — always paired with an icon/label (colorblind-safe).
- All interactive elements reachable by keyboard, visible focus states styled on-brand (not the default blue browser outline, but not removed either).
- Motion respects `prefers-reduced-motion` — rank changes still update instantly and correctly, just without the spring/slide, for users who've opted out of motion.
- Minimum contrast ratio AA (4.5:1 for body text) checked against the final palette once locked from the logo — dark, saturated accent colors are easy to get wrong on a dark base, so this gets checked explicitly, not assumed.
