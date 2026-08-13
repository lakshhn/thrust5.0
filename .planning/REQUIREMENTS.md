# Requirements — Thrust 5.0 Live Leaderboard Platform

**Version:** 1.0
**Source:** 01-PRD.md (FR-1 through FR-22), 02-Design-Doc.md, 03-Architecture-Doc.md

---

## v1 Requirements

### Public Leaderboard

- [ ] **LB-01**: Viewer can see all teams ranked by total score in real time, auto-updating via WebSocket push without a manual page refresh
- [ ] **LB-02**: Viewer can see per-team score breakdown columns: Round 1, Round 2, Round 3, Design Marks, Total
- [ ] **LB-03**: Viewer can see a compact Design Marks mini-leaderboard (separate ranking panel, top teams by design score only)
- [ ] **LB-04**: Viewer sees rank changes animated — teams physically slide to their new vertical position with spring physics, not a flat table re-render
- [ ] **LB-05**: Viewer sees top 3 teams in a visually distinct podium block (above or within the table, elevated treatment, not just rows 1-2-3)
- [ ] **LB-06**: Viewer can use the leaderboard on: a projector at distance, a laptop browser, and a phone screen on 4G/congested venue Wi-Fi
- [ ] **LB-07**: Viewer can always see a "last updated" timestamp and a live/reconnecting connection-status indicator in the header
- [ ] **LB-08**: Viewer can search/filter teams by name (needed for 20+ teams)
- [ ] **LB-09**: Viewer on mobile sees a stacked card list per team (no horizontal-scroll table); tap/expand shows R1/R2/R3/Design breakdown
- [ ] **LB-10**: Viewer sees the podium collapse to a swipeable strip or stacked vertical layout on mobile

### Score Animations & Motion

- [ ] **ANIM-01**: Score digits use an odometer-style roll/count-up when they change, not a hard cut
- [ ] **ANIM-02**: A team that moved up gets a brief accent-colored pulse and a "+N" delta badge that fades after ~1.5s
- [ ] **ANIM-03**: A team that moved down gets a muted transition (no celebratory effect)
- [ ] **ANIM-04**: Podium cards animate in with staggered spring settle on initial load or top-3 change
- [ ] **ANIM-05**: Live indicator pulses steadily when connected; switches to distinct "reconnecting" animated state (different color + dashed pulse) when disconnected
- [ ] **ANIM-06**: All animations respect `prefers-reduced-motion` — position changes still happen, spring/slide is skipped
- [ ] **ANIM-07**: No more than one large animation (podium reorder, rank swap) in flight at a time — batch and stagger when multiple scores land at once

### Admin Panel

- [ ] **ADMIN-01**: Admin can log in with email/password through a rate-limited, lockout-backed login gate
- [ ] **ADMIN-02**: Admin can select a team and enter/update a score per round (Round 1, Round 2, Round 3, Design Marks) via round tabs
- [ ] **ADMIN-03**: Admin sees an explicit overwrite confirmation step when editing a non-empty score (no silent overwrite)
- [ ] **ADMIN-04**: Admin sees a live view of what's already been entered per team/round so two judges don't blindly double-enter
- [ ] **ADMIN-05**: Admin can see who last edited each score and when (last-edited-by metadata on every row)
- [ ] **ADMIN-06**: Every score write is audit-logged with timestamp + admin identity (who changed what, old value, new value)
- [ ] **ADMIN-07**: Admin can bulk-import scores via CSV upload or pull from the linked Google Sheet
- [ ] **ADMIN-08**: Admin can undo/revert the last change on a given cell (fast fat-finger recovery)
- [ ] **ADMIN-09**: Super Admin can manage the team list (add, edit, remove teams)
- [ ] **ADMIN-10**: Super Admin can view sync status: last push to sheet, last pull, any conflict flags

### Excel / Google Sheets Fallback

- [ ] **SYNC-01**: Every score write in the app triggers an async push to the linked Google Sheet (target: <5s lag, batch/debounce if multiple writes land in the same second)
- [ ] **SYNC-02**: The Google Sheet mirrors app schema: one row per team, columns for Round 1, Round 2, Round 3, Design Marks, Total (formula, locked)
- [ ] **SYNC-03**: If the realtime backend is unreachable (>30-60s), the public leaderboard falls back to polling the Google Sheet directly at a slower interval (10-15s) — display never goes blank
- [ ] **SYNC-04**: Super Admin (or designated person) can edit scores directly in the Google Sheet during an outage; the public leaderboard reads from it
- [ ] **SYNC-05**: On reconnect, the backend diffs sheet state vs. app state row by row; any divergence is flagged (not auto-resolved)
- [ ] **SYNC-06**: Super Admin resolves conflicts via a side-by-side ConflictResolutionModal — picks which value wins per row; no global "accept all" shortcut
- [ ] **SYNC-07**: Reconciled values write to `scores` with `source = reconciliation` and an audit log entry
- [ ] **SYNC-08**: The sheet has data validation (numeric only, sensible range), a locked Total formula column, and conditional formatting flagging out-of-range values

### Security & Auth

- [ ] **SEC-01**: All write endpoints require a valid authenticated session; role (admin vs super_admin) checked server-side on every request
- [ ] **SEC-02**: Public leaderboard route only calls read-only endpoints — no code path from public route to any write operation
- [ ] **SEC-03**: Admin passwords hashed by auth provider (Supabase Auth); session tokens short-lived and refreshed
- [ ] **SEC-04**: Login rate-limited and lockout-backed; rate-limit feedback shown inline ("try again in Xs"), never silent
- [ ] **SEC-05**: Role separation: Admin can enter/edit scores; Super Admin additionally manages teams, triggers sync, resolves conflicts
- [ ] **SEC-06**: Audit log (`score_audit_log`) is append-only — no update/delete permission for any role
- [ ] **SEC-07**: Google Sheets API credentials (service account key) server-side only — never shipped to the frontend bundle

### Branding & Visual

- [ ] **UI-01**: Color palette derived from the Thrust 5.0 logo (placeholder palette in use until logo is delivered)
- [ ] **UI-02**: "Thrust 5.0" and "Aero Fabrication Club" text use a distinctive condensed/geometric display typeface (not Inter/Poppins/Roboto/Space Grotesk for these two elements)
- [ ] **UI-03**: All score/number displays use `font-variant-numeric: tabular-nums` so digits don't jitter horizontally as they update
- [ ] **UI-04**: No purple-to-blue gradients, no glassmorphism card treatment as default, no neon glow shadows, no floating gradient blobs, no emoji icons, no centered-only layouts
- [ ] **UI-05**: All interactive elements reachable by keyboard with on-brand visible focus states
- [ ] **UI-06**: Color is never the only signal for rank change or sync state — always paired with an icon or label (colorblind-safe)
- [ ] **UI-07**: WCAG AA contrast (4.5:1 minimum for body text) verified against the actual palette

### Performance

- [ ] **PERF-01**: First Contentful Paint < 1.5s on 4G on the public leaderboard route
- [ ] **PERF-02**: Score-to-display latency < 1s from admin submission to public leaderboard update under normal operation
- [ ] **PERF-03**: Lighthouse performance score ≥ 90 on the public leaderboard route
- [ ] **PERF-04**: Admin Panel bundle is code-split and never loaded on the public route
- [ ] **PERF-05**: Table virtualization (`react-virtual`) active for large team counts so rendering all rows is not a performance cost
- [ ] **PERF-06**: Framer Motion layout animations use transform/opacity only — no width/height animations that force layout thrash
- [ ] **PERF-07**: Images (team logos, event logo) served in WebP/AVIF with explicit dimensions to prevent layout shift

---

## v2 Requirements (Deferred)

- PWA offline install prompt and service worker caching for spectators
- Per-team detail page (full score history + audit trail visible to spectators)
- Automatic tiebreaker logic (if total scores are equal, secondary sort by criteria TBD)
- Multi-language display (English-first, deferred)
- QR code generator for teams to share their own leaderboard position
- Generalization for multi-event / multi-tenant support

---

## Out of Scope

- Public team self-registration — teams seeded by admins pre-event; no self-registration flow
- Payment, ticketing, or attendee check-in — not an event-management platform
- Native mobile app — web app is responsive; PWA installable
- Multi-event / multi-tenant — Thrust 5.0 specific build
- Two-way live sync (app ↔ sheet during normal operation) — one-way push only to prevent race conditions
- Time-based or penalty-based scoring — scores are simple point values, straightforward number input
- Per-judge score weighting — all judges write to the same shared score per team/round

---

## Traceability

| PRD FR | Requirement(s) |
|--------|---------------|
| FR-1 | LB-01 |
| FR-2 | LB-02 |
| FR-3 | LB-03 |
| FR-4 | LB-04, ANIM-01, ANIM-02, ANIM-03 |
| FR-5 | LB-05 |
| FR-6 | LB-06 |
| FR-7 | LB-07, ANIM-05 |
| FR-8 | LB-08 |
| FR-9 | ADMIN-01, SEC-01, SEC-04 |
| FR-10 | ADMIN-02, ADMIN-03 |
| FR-11 | ADMIN-02 (Design Marks tab) |
| FR-12 | ADMIN-04 |
| FR-13 | ADMIN-05, ADMIN-06, SEC-06 |
| FR-14 | ADMIN-07 |
| FR-15 | ADMIN-08 |
| FR-16 | SYNC-01, SYNC-02 |
| FR-17 | SYNC-01 |
| FR-18 | SYNC-03, SYNC-04 |
| FR-19 | SYNC-05, SYNC-06, SYNC-07 |
| FR-20 | ADMIN-10, SYNC-05 |
| FR-21 | UI-01, UI-02 |
| FR-22 | UI-04 |
| Design Doc §5.1 | LB-04, ANIM-02, ANIM-03 |
| Design Doc §5.2 | ANIM-01 |
| Design Doc §5.3 | ANIM-04 |
| Design Doc §5.4 | ANIM-05 |
| Design Doc §5.5 | ANIM-07 |
| Design Doc §7 | ANIM-06, UI-05, UI-06, UI-07 |
| Arch Doc §6 | PERF-01–PERF-07, SEC-02 |
