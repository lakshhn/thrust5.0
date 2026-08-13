<!-- GSD:project-start source:PROJECT.md -->
## Project

**Thrust 5.0 — Live Leaderboard Platform**

A production-grade, real-time event leaderboard for **Thrust 5.0**, the flagship event of the **Aero Fabrication Club**. The platform gives audiences a live, auto-updating view of team rankings across three scoring rounds and a Design Marks category, while giving judges a protected admin panel to enter and edit scores in real time.

The critical differentiator is the Excel fallback/sync architecture: the app is not just a display layer but a resilient scoring system where the linked Google Sheet acts as a continuously-synced mirror — enabling the public leaderboard to keep showing live data even if the admin panel goes down, and enabling judges to write scores directly to the sheet during outages with full reconciliation on recovery.

**Core Value:** **Zero data-loss, always-on scoring display** — the audience never sees a blank or broken leaderboard, and no score is ever lost, even if the admin panel or hosting goes dark mid-event.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:STACK.md -->
## Technology Stack

Technology stack not yet documented. Will populate after codebase mapping or first phase.
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
