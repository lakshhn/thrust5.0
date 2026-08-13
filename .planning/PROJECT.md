# Thrust 5.0 — Live Leaderboard Platform

## What This Is

A production-grade, real-time event leaderboard for **Thrust 5.0**, the flagship event of the **Aero Fabrication Club**. The platform gives audiences a live, auto-updating view of team rankings across three scoring rounds and a Design Marks category, while giving judges a protected admin panel to enter and edit scores in real time.

The critical differentiator is the Excel fallback/sync architecture: the app is not just a display layer but a resilient scoring system where the linked Google Sheet acts as a continuously-synced mirror — enabling the public leaderboard to keep showing live data even if the admin panel goes down, and enabling judges to write scores directly to the sheet during outages with full reconciliation on recovery.

## Core Value

**Zero data-loss, always-on scoring display** — the audience never sees a blank or broken leaderboard, and no score is ever lost, even if the admin panel or hosting goes dark mid-event.

## Context

- **Event:** Thrust 5.0, organized by the Aero Fabrication Club
- **Scale:** Up to 100 teams, 1000+ concurrent leaderboard viewers on venue Wi-Fi
- **Live environment:** Projected on a large screen + viewed on attendee phones on congested venue Wi-Fi
- **Roles:** Spectators (read-only), Judges/Admins (score entry), Event Lead/Super Admin (team management, conflict resolution)
- **Scoring:** Round 1, Round 2, Round 3, Design Marks → Total Score
- **Tech stack (locked):** React (Vite) + Tailwind CSS + Framer Motion + Supabase (Postgres + Realtime) + Google Sheets API + Vercel hosting

## Requirements

### Validated

(None yet — ship to validate)

### Active

**Public Leaderboard**
- [ ] Display all teams ranked by total score, live updating via WebSocket push (no manual refresh)
- [ ] Per-team score breakdown: Round 1, Round 2, Round 3, Design Marks, Total
- [ ] Podium block for top 3 teams with distinct elevated visual treatment
- [ ] Rank-change animations: teams physically reorder with spring physics, not flat re-render
- [ ] Design Marks mini-leaderboard as a separate compact panel
- [ ] Live/reconnecting status indicator + last-updated timestamp always visible
- [ ] Team search/filter for large team counts
- [ ] Mobile-responsive: stacked card view per team, no horizontal scroll tables

**Admin Panel**
- [ ] Password-protected login gate (rate-limited, locked out on repeated failures)
- [ ] Score entry: team selector + round tabs (R1/R2/R3/Design Marks)
- [ ] Overwrite confirmation when editing a non-empty score
- [ ] Live view of current scores per team/round with last-edited-by metadata
- [ ] Full audit log: every write tagged with timestamp + admin identity
- [ ] Bulk import: CSV upload or pull from linked Google Sheet
- [ ] Undo/revert last change per cell
- [ ] Role separation: Admin (score entry) vs Super Admin (team management + sync controls)

**Excel/Sheets Fallback**
- [ ] One-way push from app to Google Sheet on every score write (eventually consistent, target <5s)
- [ ] Public leaderboard falls back to polling Google Sheet if realtime backend is unreachable
- [ ] Conflict resolution modal on reconnect: side-by-side diff, no silent auto-merge
- [ ] Sync status visible to admins: last push time, last pull, conflict flags

**Branding & Performance**
- [ ] Color palette derived from Thrust 5.0 logo (placeholder palette used until logo delivered)
- [ ] Display typeface: distinctive condensed/geometric sans for "Thrust 5.0" and "Aero Fabrication Club" text
- [ ] tabular-nums on all score digits
- [ ] FCP < 1.5s on 4G, Lighthouse ≥ 90 on public route
- [ ] WCAG AA contrast on all text/surface pairings
- [ ] prefers-reduced-motion respected throughout

### Out of Scope

- Public team self-registration — teams are seeded by admins pre-event
- Payment, ticketing, or attendee check-in — not an event-management platform
- Multi-event / multi-tenant support — Thrust 5.0 specific
- Native mobile app — web app is responsive and PWA-installable instead
- Two-way live sync between app and Google Sheet — one-way push only to avoid race conditions

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Supabase over Firebase | SQL, row-level security, Postgres generated columns for total_score, built-in Auth | Selected |
| Google Sheets over OneDrive Excel | Lower API integration friction, service-account auth simpler | Selected |
| Vercel for hosting | Vite + serverless functions in one deploy, fast global CDN | Selected |
| Push-based realtime (not polling) | Polling creates visible lag on projector; sub-second push makes rank animations land at the right moment | Selected |
| One-way sync (app→sheet), reconciliation on reconnect | Prevents race conditions from two-way live sync during normal operation | Selected |
| Code-split admin bundle from public route | Admin JS never loads for spectators; keeps public route fast and eliminates accidental write paths | Pending |
| Table virtualization (react-virtual) | Required for smooth animated rows at 50-100+ teams | Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-08-13 after initialization*
