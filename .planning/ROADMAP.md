# Roadmap — Thrust 5.0 Live Leaderboard Platform

**Milestone:** 1.0 — Full production launch
**Total phases:** 7
**Requirements coverage:** 40/40 v1 requirements

---

## Phase 1 — Project Foundation & Design System

**Goal:** Initialize the Vite + React + Tailwind + Framer Motion project with the full design system (tokens, typography, placeholder palette) and set up Supabase project with schema and auth.

**Requirements:** UI-01, UI-02, UI-03, UI-04, UI-05, UI-06, UI-07, SEC-03
**UI hint:** yes

**Plans:**
1. Scaffold Vite + React project in `thrust5.0/` with Tailwind CSS configured, custom `theme` block in `tailwind.config.js` carrying all design tokens from the placeholder palette as named CSS variables
2. Set up Google Fonts: display face (Bebas Neue or Archivo Black for "Thrust 5.0" / "Aero Fabrication Club") + Inter as the body/UI workhorse
3. Create global CSS: `font-variant-numeric: tabular-nums` on all score contexts, base reset, dark background using `--bg-base` token
4. Initialize Supabase project, create schema: `teams`, `scores`, `score_audit_log`, `admins` tables with all fields from Architecture Doc §3; enable Row Level Security
5. Set up Supabase Auth with email+password, Admin and Super Admin roles via custom claims

**Success criteria:**
1. `npm run dev` serves a blank page with correct dark background (`#0B0E14`), correct fonts loaded from Google Fonts
2. Tailwind theme config has all named tokens (bg-base, bg-surface, ignition-orange, thrust-blue, gold, etc.) — no raw hex in component files
3. Supabase tables exist with all columns, RLS policies enabled, and a test admin account can be created
4. `font-variant-numeric: tabular-nums` visually confirmed on a sample number element

---

## Phase 2 — Public Leaderboard UI (Static)

**Goal:** Build the complete public leaderboard UI with real layout, podium block, main table, Design Marks panel, and header — using static/mock data, all animations implemented and verified before wiring to realtime.

**Requirements:** LB-01 (static), LB-02, LB-03, LB-05, LB-06, LB-07, LB-09, LB-10, ANIM-01, ANIM-02, ANIM-03, ANIM-04, ANIM-05, ANIM-06, ANIM-07
**UI hint:** yes

**Plans:**
1. Build `PodiumCard` component: rank-aware styling (gold/silver/bronze accents), elevated visual treatment for top 3, staggered spring entrance animation (Framer Motion `AnimatePresence` + `layout`)
2. Build `LeaderboardTable` component: virtualized (`@tanstack/react-virtual`), `layout`-animated rows, columns for Rank/Team/R1/R2/R3/Design/Total
3. Build `ScoreDeltaBadge`: transient "+N" badge on rank-up with fade-out after ~1.5s; muted transition for rank-down
4. Build `DesignMarksPanel`: compact secondary leaderboard, shared row component with main table, side panel layout on desktop
5. Build `LiveStatusPill`: connected (steady pulse animation) / reconnecting (dashed pulse, different color) / stale states — always visible in header
6. Build `Header` with event branding ("Thrust 5.0" in display font, "Aero Fabrication Club" attribution, live pill, last-updated timestamp)
7. Implement odometer-style score count-up animation using Framer Motion on score digits in the table
8. Implement mobile layouts: podium collapses to swipeable strip or stacked vertical; table becomes stacked card list with tap-to-expand; Design Marks panel becomes second tab
9. Add team search/filter input connected to mock data
10. Verify `prefers-reduced-motion` disables all spring/slide animations (position changes still happen instantly)

**Success criteria:**
1. Static leaderboard renders with 20 mock teams; podium block visually distinct from table rows
2. Manually changing mock data triggers rank-change animation with spring physics — teams slide to new positions
3. Score count-up animation plays on value change (not a hard-cut)
4. "+N" delta badge appears and fades after ~1.5s on a rank-up; no badge on rank-down
5. Mobile (375px viewport): no horizontal scroll, card list renders, podium collapses
6. LiveStatusPill shows two distinct states (connected vs reconnecting) with different animations
7. `prefers-reduced-motion: reduce` in system settings eliminates spring animations but updates still display

---

## Phase 3 — Realtime Data Layer

**Goal:** Wire the public leaderboard to live Supabase Realtime subscriptions, implement the full fallback path to Google Sheets polling, and connect all components to real data.

**Requirements:** LB-01 (live), LB-07 (live), ANIM-05 (live), SYNC-01, SYNC-02, SYNC-03, SYNC-04, SYNC-08, PERF-02, PERF-04, PERF-06, PERF-07
**UI hint:** no

**Plans:**
1. Set up Supabase Realtime subscription on `scores` table — scoped to public-facing fields only (no admin audit payloads pushed to public clients)
2. Implement React Query (TanStack Query) data layer: primary path uses Supabase Realtime subscription; fallback path polls Google Sheets published CSV/API at 10-15s interval
3. Implement heartbeat timeout detection (30-60s): on timeout, switch `LiveStatusPill` to "reconnecting" state, activate Google Sheets polling fallback
4. Set up Google Sheets integration: create linked spreadsheet with team rows, R1/R2/R3/Design Marks columns, locked Total formula column, data validation (numeric, range), conditional formatting for out-of-range values (SYNC-08)
5. Set up Supabase Edge Function for Google Sheets write (one-way push): triggered on every `scores` table write, batched/debounced if multiple writes land within 2s
6. Seed Supabase with sample teams and scores; confirm end-to-end: Supabase write → Realtime push → UI update → Google Sheet updated
7. Implement code-splitting: admin bundle never imported on public route (dynamic import + route-level split)

**Success criteria:**
1. Score written to Supabase appears in the leaderboard within 1s (measured with browser DevTools network tab)
2. Google Sheet row updates within ~5s of a score write
3. Disconnecting from Supabase (DevTools network throttle) triggers LiveStatusPill "reconnecting" state and fallback to sheet polling within 30-60s — leaderboard still shows last-known data, not blank
4. Public route Lighthouse audit shows admin bundle not included in JS chunks
5. Lighthouse performance score ≥ 90 on public route (run after code-splitting)

---

## Phase 4 — Admin Panel: Score Entry

**Goal:** Build the complete admin score-entry UI: login gate, team selector, round tabs, inline score editing with overwrite confirmation, last-edited-by metadata, undo, and save state indicators.

**Requirements:** ADMIN-01, ADMIN-02, ADMIN-03, ADMIN-04, ADMIN-05, ADMIN-06, ADMIN-08, SEC-01, SEC-02, SEC-04
**UI hint:** yes

**Plans:**
1. Build `AdminLoginForm`: email/password fields, rate-limit feedback inline ("too many attempts, try again in Xs"), shake/pulse motion on error, on-brand styling (not a generic white card)
2. Implement Supabase Auth session management: short-lived JWT, refresh on activity, logout from any page
3. Build admin panel shell: round tabs (Round 1 / Round 2 / Round 3 / Design Marks), team search/selector
4. Build `TeamScoreRow` (admin): inline-editable score cell, save-state indicator (saving/saved/error), last-edited-by and timestamp metadata displayed per row
5. Implement overwrite confirmation: when admin edits a non-empty score, show explicit confirm step before writing (modal or inline inline expand — not a browser confirm() dialog)
6. Wire score writes to Supabase via auth-gated Edge Function: validates session + role → writes `scores` → writes `score_audit_log` entry (team_id, category, old_value, new_value, changed_by, changed_at, source=app)
7. Implement undo: store previous value in component state; "Undo" button (visible for ~10s after save) reverts to previous value with another audit log entry
8. Implement live view: admin panel subscribes to same Supabase Realtime channel for scores — if another judge saves a score for the same team/round, the row updates without page refresh

**Success criteria:**
1. Login with wrong password 5 times → rate-limit message shown inline, further attempts blocked
2. Admin logs in → sees round tabs; selecting a round shows all teams with current scores for that round
3. Editing an empty score field → save immediately; editing a non-empty score → confirmation step required
4. After save, row shows "Saved" state + last-edited-by with timestamp
5. After save, "Undo" button visible; clicking it reverts to previous value and a new audit log row is written
6. Two browser tabs with two admin accounts: judge A saves a score → judge B's open admin panel updates that row within 1s (Realtime)

---

## Phase 5 — Admin Panel: Team Management, Bulk Import & Sync Status

**Goal:** Add Super Admin capabilities: team CRUD, bulk import (CSV/sheet pull), sync status strip, and manual resync trigger.

**Requirements:** ADMIN-07, ADMIN-09, ADMIN-10, SYNC-01 (manual trigger), SYNC-05, SYNC-06, SYNC-07, SEC-05, SEC-06, SEC-07
**UI hint:** yes

**Plans:**
1. Build team management UI (Super Admin only): add team (name, code, optional logo URL), edit team, remove team — guarded by role check both client-side and server-side (Edge Function)
2. Build `SyncStatusStrip`: displays last successful push to sheet (timestamp), last pull, any conflict flags, manual resync button (Super Admin only)
3. Build bulk import panel: CSV file upload → parse → preview diff → confirm import (writes to `scores` with `source=app`, full audit log); clearly separated from per-team score entry flow
4. Build Google Sheet pull path: Super Admin triggers "Pull from Sheet" → Edge Function reads current sheet state → compares vs app `scores` → if no divergence, imports; if divergence, triggers conflict flow
5. Build `ConflictResolutionModal`: side-by-side diff per flagged team/category (app value + timestamp vs sheet value + timestamp), Super Admin picks which wins per row, no global "accept all" shortcut
6. Wire resolved values to write to `scores` with `source=reconciliation` + `score_audit_log` entry (source=reconciliation, changed_by=resolving super admin)
7. Verify Google Sheets API credentials are server-side only (environment variable in Vercel, never in frontend bundle)
8. Implement append-only enforcement on `score_audit_log`: RLS policy that allows INSERT but denies UPDATE/DELETE for all roles including service role

**Success criteria:**
1. Regular Admin role cannot access team management UI routes (server returns 403, client shows error, not blank page)
2. Super Admin can add a new team → appears in leaderboard immediately via Realtime
3. CSV with 10 rows uploads → preview shows diff → confirm → scores written to Supabase + audit log entries created
4. SyncStatusStrip shows last push timestamp; manual resync triggers a new push and updates the timestamp
5. Simulating a conflict (edit sheet directly while app has different value) → ConflictResolutionModal appears on next pull with correct side-by-side diff
6. Resolved conflict writes `source=reconciliation` in `score_audit_log`; audit log table has no UPDATE/DELETE permission

---

## Phase 6 — Performance Hardening & Accessibility Audit

**Goal:** Hit all performance targets (FCP < 1.5s, Lighthouse ≥ 90), complete WCAG AA accessibility audit, and verify all non-functional requirements.

**Requirements:** PERF-01, PERF-02, PERF-03, PERF-05, UI-05, UI-06, UI-07
**UI hint:** no

**Plans:**
1. Run Lighthouse audit on public route; identify and fix any score < 90 issues (bundle size, render-blocking, image optimization)
2. Implement image optimization: all team logos and event logo served as WebP/AVIF with explicit width/height attributes to prevent layout shift (CLS = 0)
3. Verify table virtualization is active and functioning: render 100 mock teams, confirm only visible rows are in DOM, measure FPS during animated rank reorder
4. Run WCAG AA contrast check on all text/surface pairs using the placeholder palette; fix any failing combinations
5. Audit keyboard navigation: tab through all interactive elements on public leaderboard and admin panel; verify all reachable and focus state is styled on-brand
6. Verify colorblind-safe design: sync state and rank change signals all have text/icon labels alongside color
7. Measure actual score-to-display latency with DevTools: admin submits score → time to visible update on public leaderboard → must be < 1s
8. Audit Framer Motion animations: confirm all use `transform`/`opacity` only (no width/height thrash); check `will-change` is set appropriately

**Success criteria:**
1. Lighthouse performance score ≥ 90 on public route in incognito, mobile throttled profile
2. FCP < 1.5s on simulated 4G (Lighthouse or WebPageTest)
3. 100 mock teams: virtual list renders only visible rows; animated rank reorder maintains 60fps in Chrome DevTools performance panel
4. All text/background pairs pass WCAG AA (4.5:1 for body, 3:1 for large text) — checked with axe DevTools or similar
5. Entire admin panel navigable by keyboard; no focus traps; all focus states visible
6. Color-only signals eliminated: every status (connected/reconnecting, rank up/down) has a text or icon label

---

## Phase 7 — Deployment, End-to-End QA & Fallback Fire Drill

**Goal:** Deploy to Vercel production and staging, run end-to-end QA against all functional requirements, and conduct a live fallback fire drill (kill the backend, verify the sheet fallback and reconciliation flow work under real conditions).

**Requirements:** All remaining verification of SYNC-03, SYNC-04, SYNC-05, SYNC-06, SYNC-07, SEC-01 through SEC-07, LB-06, PERF-01, PERF-03
**UI hint:** no

**Plans:**
1. Set up Vercel project: production environment (live event URL) + staging environment (separate Supabase project + separate test Google Sheet)
2. Configure all environment variables in Vercel (Supabase keys, Google Sheets service account, auth secrets) — verify none are exposed in client bundle
3. Deploy to staging; run full functional QA against every FR-1 through FR-22 and every requirement in this doc — log pass/fail
4. **Fallback fire drill on staging:** (a) seed staging with 10 teams and scores; (b) deliberately take down Supabase (disable project or revoke keys); (c) confirm public leaderboard switches to "reconnecting" state and falls back to sheet polling within 30-60s; (d) edit a score directly in the staging test sheet; (e) confirm public leaderboard picks up the change within 15s; (f) re-enable Supabase; (g) trigger reconciliation; (h) resolve conflict via modal; (i) confirm resolved value in Supabase + audit log
5. Fix any issues found in QA and fire drill; re-run affected checks
6. Deploy to production; smoke test all features against production Supabase project and real Google Sheet
7. Document: event-day runbook (how to trigger fallback, how to run reconciliation, who holds Super Admin, emergency contacts)

**Success criteria:**
1. All FR-1 through FR-22 pass QA on staging — no open blockers
2. Fallback fire drill completes end-to-end: disconnect → reconnecting pill → sheet polling active → score visible within 15s → reconnect → conflict modal → resolution → audit log entry confirmed
3. Production Lighthouse score ≥ 90, FCP < 1.5s confirmed on production URL
4. Environment variable audit: `grep` of production frontend bundle shows no Supabase service keys or Google Sheets credentials
5. Event-day runbook written and reviewed

---

## Requirement Coverage

| Category | Requirements | Phase(s) |
|----------|-------------|----------|
| Public Leaderboard | LB-01–10 | 2 (static), 3 (live) |
| Animations | ANIM-01–07 | 2 |
| Admin Panel | ADMIN-01–10 | 4, 5 |
| Sync/Fallback | SYNC-01–08 | 3, 5 |
| Security | SEC-01–07 | 1, 3, 4, 5 |
| Branding/Visual | UI-01–07 | 1, 2 |
| Performance | PERF-01–07 | 3, 6, 7 |

**All 40 v1 requirements mapped. ✓**
