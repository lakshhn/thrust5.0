# Architecture Document
## Thrust 5.0 — Live Leaderboard Platform

**Companion to:** 01-PRD.md, 02-Design-Doc.md

---

## 1. System Overview

```
                         ┌────────────────────┐
                         │   Public Viewers    │
                         │ (spectators, phones,│
                         │  projector browser) │
                         └──────────┬──────────┘
                                    │ WebSocket / realtime subscribe (read-only)
                                    ▼
┌──────────────┐   auth    ┌──────────────────┐   writes    ┌─────────────────┐
│ Admin Panel   │──────────▶│  App Backend /    │◀───────────│  Judges/Admins  │
│ (React SPA)   │           │  Realtime DB      │            │  (score entry)  │
└──────────────┘           │  (source of truth  │            └─────────────────┘
                            │  during normal ops)│
                            └─────────┬─────────┘
                                      │ one-way push (app → sheet)
                                      │ on every write
                                      ▼
                            ┌───────────────────┐
                            │  Linked Excel      │
                            │  Workbook          │
                            │  (Google Sheets /  │
                            │   OneDrive Excel)  │
                            └─────────┬─────────┘
                                      │ fallback write path
                                      │ (admin edits sheet directly
                                      │  if app backend is down)
                                      ▼
                     ┌─────────────────────────────────┐
                     │ Public leaderboard falls back to │
                     │ reading sheet directly if app    │
                     │ backend/API is unreachable        │
                     └─────────────────────────────────┘
```

**Core architectural decision:** the app backend is the primary source of truth and the thing that gives us sub-second live updates. The Excel workbook is a **continuously-synced mirror**, not a periodic export — that's what makes it a real fallback rather than a stale backup nobody trusts. The public frontend is built to degrade gracefully: if it can't reach the realtime backend, it falls back to polling the sheet directly (slower, but never blank).

## 2. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| **Frontend framework** | React (Vite) | Fast dev/build, no need for SSR here since this is a live dashboard, not SEO-sensitive content |
| **Styling** | Tailwind CSS | Utility-first, fast to keep visually consistent with the design tokens from the Design Doc; paired with a small custom `theme` config carrying the brand palette so it's not default Tailwind colors |
| **Animation** | Framer Motion | `layout` animations for rank reordering, spring transitions, `AnimatePresence` for enter/exit — matches every motion spec in the Design Doc |
| **Realtime data layer** | Firebase Realtime Database / Firestore **or** Supabase (Postgres + Realtime) | Either gives push-based updates to connected clients without building a custom WebSocket server; Supabase is preferable if the team wants SQL and row-level security policies, Firebase if speed-to-ship matters more. **Decision needed before build starts — Section 8.** |
| **Backend logic** | Serverless functions (Vercel/Netlify Functions or Supabase Edge Functions / Firebase Cloud Functions) | Handles: auth-gated writes, the app→sheet sync job, audit logging, CSV bulk import parsing |
| **Excel/Sheets integration** | Google Sheets API (if using Google Sheets) or Microsoft Graph API (if using OneDrive Excel) | Both support programmatic read/write with service-account auth; Google Sheets API is generally the lower-friction option for a service-account-driven integration |
| **Auth** | Backend-provider auth (Supabase Auth / Firebase Auth) with email+password or magic-link for admins, custom role claims for Admin vs Super Admin | Avoids hand-rolling session/password management |
| **Hosting** | Vercel or Netlify (frontend) | Fast global CDN, trivial preview deploys, generous free tier for an event-scale app |
| **Virtualization** | `@tanstack/react-virtual` or `react-window` | Keeps the table smooth at 50–100+ teams with animated rows |
| **State/data fetching** | React Query (TanStack Query) layered over the realtime subscription | Handles cache, retry, and the polling fallback path in one consistent model |

## 3. Data Model

### 3.1 Core tables/collections

**`teams`**
| Field | Type | Notes |
|---|---|---|
| `id` | uuid | primary key |
| `name` | string | |
| `code` | string | short display code, e.g. "T-07" |
| `logo_url` | string, nullable | optional per-team asset |
| `created_at` | timestamp | |

**`scores`**
| Field | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `team_id` | uuid | FK → teams |
| `category` | enum: `round_1`, `round_2`, `round_3`, `design` | |
| `value` | numeric | |
| `updated_by` | uuid | FK → admins, supports FR-13 |
| `updated_at` | timestamp | |
| `source` | enum: `app`, `excel_fallback` | tags where a value came from — critical for reconciliation (Section 5.4) |

**`score_audit_log`**
| Field | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `score_id` | uuid | FK → scores |
| `old_value` | numeric, nullable | |
| `new_value` | numeric | |
| `changed_by` | uuid | |
| `changed_at` | timestamp | |
| `source` | enum: `app`, `excel_fallback`, `reconciliation` | |

**`admins`**
| Field | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `name` | string | |
| `email` | string | |
| `role` | enum: `admin`, `super_admin` | |
| `password_hash` | string | handled by auth provider, not custom |

### 3.2 Derived data

- **`total_score`** per team = `round_1 + round_2 + round_3 + design` — computed, not stored redundantly, to avoid drift. Either a Postgres generated column (if Supabase) or computed client-side/in a Cloud Function on read (if Firebase).
- **Design Marks leaderboard** = same `scores` table filtered to `category = design`, ranked independently — no separate table needed.

## 4. Real-Time Update Flow

1. Admin submits a score change in the Admin Panel.
2. Request hits an auth-gated backend function → validates session + role → writes to `scores` table → writes an entry to `score_audit_log`.
3. Realtime layer (Firestore/Supabase Realtime) pushes the change to all subscribed clients — public leaderboard included — typically within a few hundred milliseconds.
4. The same backend function (or a queued follow-up job) pushes the updated row to the linked Excel workbook via the Sheets/Graph API.
5. Public frontend receives the push, updates local state, and Framer Motion handles the visual reflow (per Design Doc Section 5).

**Why push, not poll, for the primary path:** polling every 2–3 seconds is the naive way to get a "live" leaderboard and it's what makes most of these feel laggy and janky on a projector. A push-based subscription gets updates near-instantly and is what makes the rank-change animation actually land at the moment it happens rather than on the next poll tick.

## 5. Excel Fallback — Detailed Design

This is the feature that makes the PRD's resilience requirement real, so it gets the most detail.

### 5.1 Normal operation (app is source of truth)

- Every successful write to `scores` triggers an async push to the linked Excel workbook (Google Sheets recommended — faster API, simpler service-account auth than Microsoft Graph).
- The sheet is laid out to mirror the data model directly: one row per team, columns for `Round 1 | Round 2 | Round 3 | Design Marks | Total (formula)`.
- This push is **eventually consistent but fast** (target: under a few seconds) — the sheet is always close to real-time, not a nightly export, so an admin can trust it as an active mirror.

### 5.2 Failure mode: admin panel/backend is unreachable

- Public leaderboard frontend detects the realtime connection has dropped (heartbeat timeout) and switches its `LiveStatusPill` to "reconnecting."
- If the backend stays unreachable past a threshold (e.g., 30–60s), the frontend falls back to **directly polling the published Excel sheet** (via the Sheets API's read endpoint, or a published CSV export URL as a lower-effort fallback) at a slower interval (e.g., every 10–15s) — slower is fine here because we're in degraded mode by definition, and the priority is "never blank," not "still sub-second."
- A designated Super Admin (or backup judge) edits scores directly in the Excel sheet during this window. The sheet's formulas/validation (see 5.3) keep entries sane even without the app's UI guardrails.

### 5.3 Guardrails inside the sheet itself

Because the sheet may be edited directly with no app-level validation during an outage:
- Data validation rules on each score column (numeric only, sensible min/max range matching the event's scoring scale).
- A protected/locked "Total" column using a `SUM()` formula, not manually editable, so a fallback edit can't accidentally corrupt the total.
- Conditional formatting flags any row edited outside expected bounds, so the Super Admin visually spots fat-finger errors during the stressful outage window rather than after.

### 5.4 Reconciliation when the app comes back

This is the step most systems skip, and it's exactly where "the app auto-detects newer timestamps and merges" quietly loses or duplicates data — clock skew between a browser and the sheet API, plus the possibility that *both* sources were legitimately edited during the gap, makes blind auto-merge risky.

Instead:
1. On reconnect, the backend pulls the current sheet state and diffs it against the app's `scores` table, row by row.
2. Any row where the sheet value differs from the app's last-known value is flagged, not auto-resolved.
3. Super Admin sees a `ConflictResolutionModal` (Design Doc 6) — a side-by-side diff per flagged team/category: app value vs. sheet value vs. timestamps of each — and picks which one wins, per row. No global "accept all sheet" or "accept all app" shortcut for cases where both sides have some correct data.
4. Resolved values write back to `scores` with `source = reconciliation` and get an audit log entry, so there's a permanent record of exactly what was reconciled and by whom (ties back to FR-13/FR-19).
5. Once reconciliation is confirmed complete, the app resumes as sole source of truth and normal one-way push resumes.

### 5.5 Why one-way push (app → sheet) instead of two-way live sync

Two-way real-time sync between the app and the sheet sounds appealing but introduces a race condition risk during totally normal operation (a judge editing the app while someone else has the sheet open "just to check," causing overwrite loops). Keeping the sheet **read/write only during declared outage windows**, and otherwise treating it as an app-driven mirror, removes that failure mode entirely and keeps the mental model simple for the people running the event under time pressure.

## 6. Performance Strategy

- **Frontend**
  - Vite build, code-split so the Admin Panel bundle never loads on the public route.
  - Table virtualization (`react-virtual`) once team count is large enough that rendering all rows becomes a cost.
  - Framer Motion `layout` animations are GPU-accelerated (transform-based); avoid animating properties that force layout thrash (width/height directly — animate `transform`/`opacity` instead).
  - Images (team logos, event logo) served in modern formats (WebP/AVIF) with explicit dimensions to avoid layout shift.
  - `prefers-reduced-motion` respected (Design Doc 7) — also a small perf win on low-end devices, since it skips spring physics calculations.
- **Backend**
  - Realtime subscriptions scoped to exactly the fields the public view needs (don't push full admin-audit payloads to public clients).
  - Rate limiting on write endpoints (also a security requirement, Section 7).
  - Excel API calls batched/debounced — if five scores land in the same second, batch them into one sheet write rather than five separate API calls (Sheets/Graph APIs have rate limits worth respecting).
- **Targets** (from PRD Section 7): FCP < 1.5s on 4G, update latency < 1s app-to-display under normal operation, Lighthouse ≥ 90 on the public route.

## 7. Security Architecture

- All write-capable API routes require a valid session token; role (`admin` vs `super_admin`) checked server-side on every request — never trust a client-side role flag.
- Public leaderboard route only ever calls read-only endpoints/subscriptions — there is no code path, not even a hidden one, from that route to a write operation.
- Google Sheets/Graph API credentials (service account key / OAuth app secret) live server-side only (environment variables in the hosting platform's secret store), never shipped to the frontend bundle.
- Login rate-limited and lockout-backed (PRD FR/Security section) — implemented at the auth-provider level (Supabase/Firebase both support this) rather than hand-rolled.
- Audit log (`score_audit_log`) is append-only — no update/delete permission on that table for any role, so it stays a trustworthy record even during reconciliation.

## 8. Open Decisions Before Build Starts

1. **Supabase vs Firebase** — recommend Supabase if the team wants SQL, row-level security, and a generated `total_score` column; Firebase if the team wants the fastest possible time-to-first-realtime-update with less setup. Either satisfies the architecture above.
2. **Google Sheets vs OneDrive Excel** for the linked workbook — Google Sheets API is recommended for lower integration friction; switch to Microsoft Graph only if the event's institutional infra is Microsoft-first.
3. **Hosting** — Vercel recommended for the frontend given Vite + serverless function support in one deploy.
4. **Final brand palette** — pending logo asset (Design Doc Section 2.2 placeholder in use until then).

## 9. Deployment & Environments

- **`production`** — the live event URL, connected to the production Supabase/Firebase project and the real linked sheet.
- **`staging`** — a mirror environment with a separate database and a separate *test* sheet, used to rehearse the Excel-fallback flow (Section 5) before the event, not just build it and hope. Running a real fire-drill — killing the backend on purpose during a staging round and confirming the sheet fallback and reconciliation flow actually work end-to-end — is the single highest-value pre-event QA step given how central this feature is to the PRD.
