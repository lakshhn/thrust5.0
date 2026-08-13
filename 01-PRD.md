# Product Requirements Document
## Thrust 5.0 — Live Leaderboard Platform

**Version:** 1.0
**Owner:** Lakshay
**Status:** Draft for review

---

## 1. Background & Problem Statement

Thrust 5.0 needs a public-facing scoreboard that stays trustworthy from the first round to the last. Judges will be entering scores on the fly, on venue Wi-Fi, in front of a projector — which means two things have to be true at once: the display has to look like it belongs to a real event brand, and the scoring pipeline can't go dark just because a laptop crashes or the admin panel throws an error mid-round.

That second point drives most of the non-obvious requirements in this doc. A leaderboard that looks great but loses ten minutes of Round 2 scores because someone's browser tab crashed is worse than no leaderboard at all — it's a live demo of the event's tech team failing in front of the audience. So this PRD treats the Excel fallback path as a first-class feature, not a "nice to have," and the rest of the system is designed around never letting the on-screen numbers and the source-of-truth spreadsheet drift apart.

## 2. Goals

1. Give the audience and organizers a live, auto-updating leaderboard for all teams across the event.
2. Let admins add/edit scores per round through a protected panel, with instant reflection on the public screen.
3. Guarantee score data survives an admin-panel outage via a linked, actively-synced Excel workbook.
4. Ship a UI that feels custom-built for Thrust 5.0 — brand-matched, motion-rich, fast — not a templated dashboard.
5. Keep the whole thing fast enough to run smoothly on a projector feed and on attendees' phones on congested venue Wi-Fi.

## 3. Non-Goals

- No public team self-registration flow (teams are seeded by admins pre-event).
- No payment, ticketing, or attendee check-in features.
- No multi-event / multi-tenant support — this is built for Thrust 5.0 specifically, though the architecture doc notes what it'd take to generalize later.
- No native mobile app — the web app is responsive and installable (PWA) instead.

## 4. Users & Roles

| Role | Access | Primary need |
|---|---|---|
| **Spectator / Team member** | Public leaderboard, no login | Fast, glanceable ranking; wants to see their team's rank and points-to-next-rank at a glance |
| **Judge / Scorekeeper (Admin)** | Admin panel, password-protected | Enter/edit round scores quickly between rounds, with zero ambiguity about what's already been saved |
| **Event Lead (Super Admin)** | Admin panel + team management + Excel resync controls | Manage the team list, resolve sync conflicts, trigger manual re-sync if something looks off |

## 5. Core Concepts

- **Teams** — each team has a name, team code/number, and optionally a logo/college tag.
- **Rounds** — the event has three scoring rounds (**Round 1, Round 2, Round 3**), each contributing points to a team's total.
- **Design Marks** — a separate, always-visible scoring category (not one of the three rounds) tracked alongside round scores. It gets its own mini-leaderboard in addition to feeding the total.
- **Total Score** — Round 1 + Round 2 + Round 3 + Design Marks. This is what the main leaderboard ranks by.

## 6. Functional Requirements

### 6.1 Public Leaderboard (no login required)

- **FR-1**: Display all teams ranked by total score, descending, updating live without a manual page refresh (real-time push, not polling every few seconds — see architecture doc for the sync mechanism).
- **FR-2**: Show a per-team breakdown: Round 1, Round 2, Round 3, Design Marks, and Total, in a clean column layout.
- **FR-3**: Provide a secondary, smaller **Design Marks leaderboard** — a compact widget/panel ranking teams by design score alone, separate from the main ranking table.
- **FR-4**: Rank changes animate (teams sliding to their new position) rather than the table just re-rendering flat — this is the single most important "wow" moment on a projector screen and should feel physical, not like a spreadsheet reload.
- **FR-5**: Highlight top 3 teams distinctly (podium treatment) above or within the main table.
- **FR-6**: Must be legible and functional on: a projector at distance, a laptop browser, and a phone screen on 4G.
- **FR-7**: Show a subtle "last updated" indicator and a connection-status indicator (live / reconnecting) so nobody mistakes a dropped connection for "the scores stopped changing."
- **FR-8**: Support filtering/search by team name for large team counts (useful once you're past ~20 teams).

### 6.2 Admin Panel

- **FR-9**: Login gate (see Section 8, Security) before any write access. No write endpoint is reachable without a valid session.
- **FR-10**: Admin can select a team + round and enter/update that round's score. Editing an already-scored round overwrites with a visible confirmation step (no silent overwrite).
- **FR-11**: Admin can enter/update Design Marks per team independently of the three rounds.
- **FR-12**: Admin sees a live view of what's already been entered per team/round, so two judges on two devices don't blindly double-enter or clash.
- **FR-13**: Every score write is logged with timestamp + admin identity (who entered/changed what, and when) — this is what makes the Excel reconciliation trustworthy later, and what settles disputes ("who changed Team 7's Round 2 score?").
- **FR-14**: Bulk-import path: admin can upload/paste a CSV or trigger a pull from the linked Excel sheet to seed or correct scores in bulk, instead of re-typing everything by hand if the panel comes back up after an outage.
- **FR-15**: Undo / revert to previous value for the last change on a given cell (fast recovery from fat-finger entry during a live round).

### 6.3 Excel Fallback & Sync (the resilience feature)

- **FR-16**: A linked Excel workbook (hosted on OneDrive/Google Sheets — see architecture doc for the concrete choice) mirrors the same schema as the app: Team, Round 1, Round 2, Round 3, Design Marks.
- **FR-17**: Under normal operation, the app is the source of truth and pushes to the sheet (one-way, app → sheet) so the sheet is always a live, human-readable backup — not a stale export.
- **FR-18**: If the admin panel is unreachable (hosting outage, deploy failure, judge's laptop can't reach the internet, etc.), an authorized person can edit scores directly in the Excel sheet, and the **public leaderboard keeps reading and updating from that same data source** — the display doesn't need the admin panel to be "up" to show current numbers, only for someone to be able to write new ones.
- **FR-19**: When the admin panel comes back online, there's a defined reconciliation step (see Design Doc, Section 5.4) — the system doesn't just blindly overwrite whichever source has "more recent" data, because clock skew and manual edits make "recent" ambiguous. The event lead resolves conflicts through a visible diff, not a silent merge.
- **FR-20**: The sync status (app→sheet, sheet→app, last successful sync time) is visible to admins, not just assumed to be working.

### 6.4 Branding & Visual Identity

- **FR-21**: Color palette, typography, and iconography should derive from the Thrust 5.0 event branding/logo. *(Logo asset not yet provided — Section 9 of the Design Doc specifies exactly what to extract from it once available, and ships a placeholder palette in the meantime so build can start immediately.)*
- **FR-22**: The UI must read as a bespoke, designed product for this specific event — not a generic admin-dashboard template with a logo pasted on top. See Design Doc Section 3 for the explicit anti-patterns being avoided.

## 7. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Performance** | First Contentful Paint < 1.5s on 4G; leaderboard update latency < 1s from score submission to public display; Lighthouse performance score ≥ 90 on the public leaderboard route |
| **Reliability** | Public leaderboard must render last-known-good data even if real-time sync briefly drops (never show a blank/broken screen) |
| **Availability** | Target 99.5% uptime during the live event window; Excel fallback is the explicit mitigation for the remaining 0.5% |
| **Security** | Admin routes fully gated; no scoring mutation possible without authenticated session; rate-limited login |
| **Accessibility** | WCAG AA color contrast even within a dark, graphic-heavy theme; keyboard-navigable admin forms |
| **Scalability** | Must comfortably handle the expected team count (design for up to 100 teams, 1000+ concurrent leaderboard viewers) without degrading update speed |
| **Device support** | Evergreen Chrome/Safari/Edge/Firefox, iOS/Android mobile browsers, and common projector-connected laptop browsers |

## 8. Security Requirements

- Admin authentication required for all write operations (score create/edit, team management, Excel resync triggers).
- Passwords hashed (never stored plain); session tokens short-lived and refreshed, not permanent.
- Rate limiting + lockout on repeated failed admin login attempts.
- Role separation between regular Admin (score entry) and Super Admin (team management, sync conflict resolution) so a compromised judge device can't rewrite team lists.
- All write actions audit-logged (who, what, when) — this also underpins FR-13 and the Excel reconciliation flow.
- Public leaderboard is read-only by design — there is no code path from the public route to a write endpoint.

## 9. Success Metrics

- Zero data-loss incidents across all three rounds (verified against the Excel audit trail).
- Public leaderboard update-to-display latency stays under 1 second, measured live during the event.
- No more than one manual Excel-fallback activation needed (i.e., the resilience feature is there because it must exist, not because it's expected to be used often).
- Positive informal feedback on "this doesn't feel like a hackathon dashboard" — i.e., the visual bar in Section 6.4 actually lands.

## 10. Open Questions

1. Final team count — affects table density decisions and whether search/filter (FR-8) ships as a nice-to-have or a must-have.
2. Confirm scoring is points-based and not time-based/penalty-based for any round — affects the score input UI (a simple number field vs. something more structured).
3. Logo/brand asset — needed to lock the final palette (placeholder in use until then).
4. Who holds Super Admin during the event, and do they have a phone with mobile data as an independent path to the Excel sheet if venue Wi-Fi fully drops?
