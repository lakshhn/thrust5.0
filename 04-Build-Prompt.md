# Build Prompt — Thrust 5.0 Live Leaderboard Website

Paste this prompt as-is into the build tool (Claude Code, Google Stitch MCP, or equivalent), with the **Thrust 5.0 / Aero Fabrication Club logo image attached to the same message**. Also attach the three reference docs: `01-PRD.md`, `02-Design-Doc.md`, `03-Architecture-Doc.md`.

---

## PROMPT START

You are building the production website for **Thrust 5.0**, a live event leaderboard platform, for the **Aero Fabrication Club**. Three documents are attached and are the binding spec for this build: `01-PRD.md`, `02-Design-Doc.md`, `03-Architecture-Doc.md`. Follow them strictly — every functional requirement (FR-1 through FR-22), every non-functional requirement, the full data model, the real-time sync flow, and the Excel fallback/reconciliation logic in the Architecture Doc are all in scope, not just the visual layer. If anything in this prompt and the docs ever conflicts, the docs win.

### 1. Color palette — extract from the attached logo, don't invent one

An image of the Thrust 5.0 / Aero Fabrication Club logo is attached to this message.

- Extract the **actual dominant colors** from that logo — the primary brand color(s), any secondary/accent color present in the mark, and the darkest and lightest tones used in it. Build the entire site's color system from those extracted values as the foundation.
- You are allowed to introduce **supporting colors beyond what's literally in the logo** (for states like success/error/live-indicator, for depth/shadow, for subtle secondary accents) — but every added color must read as belonging to the same family as the extracted palette: same general temperature, same saturation logic, same "world." Don't bolt on an unrelated color just because a component needed *a* color for something — pick a shade that could plausibly have shipped with the original brand kit.
- Pick **whatever shades (tints/tones/darker or lighter variants) of the extracted colors suit the interface best** — you don't have to use the literal logo hex exactly everywhere (e.g., pure logo-orange at 100% saturation may be too loud as a full background wash; use a deeper or desaturated variant for large surfaces and reserve the punchiest, purest tone for small high-signal moments like the live indicator, rank-up flashes, and primary buttons).
- If for any reason no logo image is actually present in this conversation when you run this prompt, **stop and ask for it** rather than defaulting to a generic palette guess — do not proceed with placeholder purple/blue gradients as a substitute for real brand extraction. (The Design Doc's placeholder palette is a fallback for planning only, not for this build.)
- Do a real accessibility pass once the palette is set: text-on-surface contrast must hit WCAG AA, checked against the actual extracted/derived colors, not assumed.

### 2. Typography — no basic/default fonts, especially for the two hero moments

Two specific pieces of text carry the most visual weight on this site and need dedicated typographic treatment, not whatever the framework defaults to:

- **"Thrust 5.0"** (site title/wordmark, wherever it appears prominently — header, hero, loading states)
- **"Aero Fabrication Club"** (club attribution/branding, wherever it appears)

For both:
- Choose a **distinctive, characterful display typeface** — something with real presence (condensed industrial sans, geometric display face, a face with mechanical/aerospace character given the club's domain) — not Inter, not Poppins, not Roboto, not the default font of whatever framework or template you're working from. If the logo has its own type treatment baked into the mark, take cues from that letterform style for these two pieces of text specifically.
- These two text elements should look **considered and custom**, ideally with intentional letter-spacing/tracking, weight, and sizing choices — not just "large bold text in the body font."
- Everywhere else (table labels, form fields, body copy, admin UI chrome) — use a clean, highly legible workhorse sans for actual readability. The point isn't to make everything decorative; it's to make sure the two identity-carrying pieces of text don't look like afterthoughts, while the functional UI stays legible and fast to scan.
- Use `font-variant-numeric: tabular-nums` on every place a score/number appears so digits don't jitter as they update — this is a hard requirement from the Design Doc, not optional polish.

### 3. Absolute bans — this must not look AI-generated or templated

Do not produce, under any circumstance:

- Purple-to-blue, pink-to-orange, or any generic diagonal linear gradient as a page/section background wash
- Glassmorphism as a default card treatment (frosted blur + thin semi-transparent white border slapped on every panel)
- Glowing neon drop-shadows applied to buttons/cards by default "for style"
- Floating blurred gradient blobs/orbs behind content
- Placeholder/lorem-ipsum gibberish text left in any shipped screen — every string of copy must be real, event-appropriate content (team names can be sample data, but labels, headers, empty states, and error messages must be final, human-written copy)
- Centered-everything layouts with no grid structure or asymmetry
- Emoji used in place of a real icon set
- Stock AI-tool default fonts (Inter/Poppins/Space Grotesk) used for the two hero text elements from Section 2
- Any component that looks copy-pasted from a generic admin dashboard template with the brand colors swapped in and nothing else changed

If you notice yourself defaulting to any of the above because it's the fastest path to "looks finished," stop and make a more deliberate choice instead — bland-but-fast is the failure mode to actively design against here, per the Design Doc's stated principles.

### 4. Tech stack — build with this exact stack per the Architecture Doc

- **React** (Vite) as the frontend framework
- **Tailwind CSS** for styling, with a custom theme config carrying the extracted palette as named tokens (not raw hex scattered through components)
- **Framer Motion** for all animation — rank-reorder `layout` animations with spring easing, odometer-style score count-ups, staggered podium entrance, live-status pulse states — exactly as specified in Design Doc Section 5. Motion must be tied to real state changes, never purely decorative.
- Respect `prefers-reduced-motion` throughout
- Realtime data layer and Excel fallback/sync/reconciliation logic per Architecture Doc Sections 4–5 — this is not just a static frontend, the live-update and fallback behavior are core requirements
- Table virtualization for the leaderboard once team count is non-trivial (per Architecture Doc Section 6)
- If Google Stitch MCP or another design-generation tool is available in this environment, use it to accelerate layout/component generation — but every output it produces must still be checked against Sections 1–3 above before being accepted; don't ship a Stitch-default output un-audited.

### 5. Scope checklist — confirm all of these are present before considering the build done

- [ ] Public live leaderboard: podium (top 3), full ranked table with **Round 1 / Round 2 / Round 3 / Design Marks / Total** columns (PRD FR-1, FR-2)
- [ ] Separate compact **Design Marks mini-leaderboard** (PRD FR-3)
- [ ] Rank-change animations (teams physically reorder, not flat re-render) (PRD FR-4, Design Doc 5.1)
- [ ] Live/reconnecting status indicator + last-updated timestamp (PRD FR-7)
- [ ] Admin login gate, fully separate bundle from public route (PRD FR-9, Architecture Doc 6)
- [ ] Admin score entry per team/round with overwrite confirmation, last-edited-by metadata, undo (PRD FR-10–FR-15)
- [ ] Linked Excel workbook, one-way app→sheet push, fallback read/write path, and the full reconciliation flow with conflict modal — not a silent auto-merge (PRD FR-16–FR-20, Architecture Doc Section 5 in full)
- [ ] Mobile-responsive with the specific mobile adaptations called out in Design Doc 4.2 (no horizontal-scroll tables)
- [ ] Performance targets from PRD Section 7 (FCP < 1.5s, Lighthouse ≥ 90 on public route)
- [ ] Accessibility: AA contrast, keyboard navigation, colorblind-safe status indicators (Design Doc Section 7)

### 6. Final output expectation

Deliver a site that someone looking at it would assume was custom-designed by a professional agency specifically for an aerospace/engineering club's flagship event — grounded in that club's actual brand colors and carrying real typographic identity — not a leaderboard template with a logo dropped on top. When in doubt on any visual decision not explicitly specified above, default to the principles in Design Doc Section 1, not to whatever is fastest to generate.

## PROMPT END
