---
name: towerforge-project-skill
description: Guidance for working effectively in the TowerForge codebase.
---

# TowerForge Project Skill

## Purpose

This document defines how to work effectively inside the TowerForge codebase.

TowerForge is not a toy prototype. It already contains a lot of gameplay systems, UI surfaces, progression layers, and persistence logic. Work on this project should preserve what already makes it strong while pushing the game toward three outcomes:

- better clarity,
- better strategic depth,
- better trust and stability.

When making decisions, prefer changes that make the game easier to understand, harder to master, and safer to maintain.

---

## Project Identity

TowerForge is a single-page HTML5 tower defense game built with plain JavaScript, Canvas, CSS, and LocalStorage.

The game's identity is built around:
- dual-path tower upgrades,
- readable but high-energy combat,
- strong wave-to-wave planning,
- persistent progression through research and achievements,
- replayability through maps, endless mode, and challenge systems,
- stylized UI with a polished arcade-strategy feel.

The game should feel:
- fast,
- legible,
- satisfying,
- intentional,
- strategically expressive.

It should not feel:
- generic,
- noisy,
- overcomplicated for no reason,
- unstable,
- visually messy.

---

## Technology and Architecture

### Stack

- `index.html` for the app shell
- `css/style.css` for all styling
- `js/*.js` for all gameplay and UI logic
- Canvas for active gameplay rendering
- DOM/CSS for menus, overlays, buttons, and panels
- LocalStorage for persistent and run-save data

### Architectural pattern

- There is no framework layer to hide mistakes.
- Systems are mostly organized by domain file.
- Shared runtime data flows through `GameState`.
- Many gameplay features span multiple files, so changes often require cross-system verification.

### Important files

- `index.html` - shell, screens, modal structure, core DOM nodes
- `css/style.css` - entire visual layer and layout logic
- `js/main.js` - init, loop, lifecycle, render orchestration
- `js/gameState.js` - global state container
- `js/config.js` - towers, enemies, maps, research definitions, constants
- `js/wave.js` - wave generation, spawning, skip-wave, banners, pacing
- `js/tower.js` - tower stats, upgrades, path logic, synergy interactions
- `js/enemy.js` - enemy logic, status effects, special behaviors
- `js/projectile.js` - projectile behavior and hit logic
- `js/research.js` - research tree layout, render, purchase flow
- `js/uiRendering.js` - HUD, wave progress, previews, canvas-space UI
- `js/menu.js` - menu screens, continue flow, navigation
- `js/save.js` - persistent data, run save/load, import/export, slots
- `js/audio.js` - Web Audio lifecycle and sound behavior
- `js/tutorial.js` - onboarding and guided teaching

---

## Context7 and External Docs

When work touches a library, framework, or browser API, fetch current docs through Context7 before making decisions that depend on API behavior.

Use this especially for:

- Web Storage and persistence behavior,
- Canvas or DOM APIs with browser-specific caveats,
- Web Audio lifecycle rules,
- Playwright testing patterns and waiting behavior.

Preferred references:

- MDN via Context7 (`/mdn/content`) for browser APIs such as `localStorage`, Canvas, DOM, Storage API, and Web Audio.
- Playwright via Context7 (`/microsoft/playwright`) for regression-testing behavior and wait-safe assertions.

Important current guidance already relevant to TowerForge:

- Web Storage data is string-based, so persistent structures should remain JSON-serializable.
- Persistence writes should stay wrapped in defensive error handling.
- Storage quota and availability failures are real edge cases, not theoretical ones.
- Playwright checks should prefer wait-aware patterns over brittle synchronous visibility snapshots.

Do not rely on stale memory for browser API behavior when the code change depends on exact API guarantees.

---

## Active Progression Direction

TowerForge's active progression direction is the hybrid `Command Marks` plus `Tower Licenses` model documented in `PROGRESSION_ROADMAP.md`.

Key rules:

- keep `Research Points` as the only spendable meta currency,
- use `Command Marks` as the visible, non-spend progression target,
- keep a starter roster always available,
- keep advanced towers visible but locked with exact requirements,
- make campaign maps, tower licenses, and difficulty bands point toward a clear next objective,
- retroactively backfill existing saves wherever current persistent data can safely prove progress.

If future progression work conflicts with `PROGRESSION_ROADMAP.md`, prefer the roadmap unless the user explicitly asks to revise the design direction.

---

## Product Priorities

Use this priority order when deciding what matters most:

1. Stability and save reliability
2. Gameplay clarity and UX
3. Strategic depth and encounter identity
4. Replayability and progression quality
5. Raw content expansion

If a proposed feature conflicts with one of the first three priorities, resolve that first.

---

## Core Design Principles

### 1. Preserve game feel

TowerForge should feel like a polished arcade-strategy defense game.

Preserve:
- clean combat readability,
- punchy but understandable feedback,
- dramatic UI moments,
- clear tower identity,
- clear enemy identity,
- satisfying between-wave planning.

### 2. Favor clarity over cleverness

If something is technically impressive but harder to understand, that is usually the wrong tradeoff.

Prefer clarity for:
- wave previews,
- enemy telegraphs,
- tower upgrades,
- research descriptions,
- tooltips,
- save/continue UI,
- ability availability,
- combat feedback.

### 3. Use existing systems before adding new ones

TowerForge already has many progression and combat layers:
- tower tiers,
- path choices,
- tower XP,
- mastery,
- synergies,
- abilities,
- research,
- achievements,
- challenge modifiers,
- endless mode.

Before inventing a new subsystem, ask whether the feature should plug into one of those instead.

### 4. Protect strategic identity

Avoid changes that flatten decision-making.

Good changes:
- stronger counters,
- clearer tradeoffs,
- better build expression,
- more meaningful path choices,
- better map identity,
- clearer enemy roles.

Bad changes:
- redundant towers,
- generic stat-bloat upgrades,
- mechanics that skip planning,
- visuals that obscure gameplay,
- systems that make all towers or enemies feel similar.

### 5. Player trust is a feature

Trust comes from:
- saves working,
- tooltips being truthful,
- upgrades doing what they say,
- UI matching game state,
- bugs not destroying progress or strategy.

When in doubt, choose the option that increases player trust.

---

## Gameplay Rules

### Towers

- Every tower must have a clear combat role.
- Path choices should feel meaningfully different, not cosmetically different.
- New tower mechanics should integrate with targeting, XP, mastery, and synergy systems when relevant.
- Upgrade descriptions must match real gameplay behavior.
- Avoid overlapping tower identities unless the overlap produces a different strategic use case.

### Enemies

- Enemy threat must be readable quickly.
- Special behaviors should be telegraphed through visuals, timing, motion, UI, or all three.
- New enemy types should create tactical pressure, not just bigger stats.
- Elite or boss variants should change player decision-making, not only time-to-kill.

### Waves

- Waves should remain understandable even when they become harder.
- Preview systems should communicate threat, not just contents.
- Skip-wave behavior must preserve combat integrity and not silently remove important strategic state.
- Wave pacing should create anticipation, not confusion.

### Bosses and elites

- Boss encounters should feel authored and memorable.
- Elites should signal danger clearly and justify their stronger mechanics.
- Bosses should create tactical questions, not only durability checks.

### Research and meta progression

- Every research node must do exactly what its description implies.
- Meta progression should encourage experimentation rather than passive accumulation.
- Avoid filler upgrades unless they serve pacing very intentionally.
- If a research upgrade is hard to notice, improve either the effect, the feedback, or both.

---

## UI and UX Rules

### General UI standards

- UI should be readable at a glance during active play.
- Important systems should be visible in UI, not only available through hidden controls or hotkeys.
- Notifications should animate in and out cleanly.
- Buttons should align correctly within the HUD/game/sidebar layout.
- Overlays should never accidentally block critical information without a reason.
- New UI should behave well on common desktop and smaller screen sizes.

### Layout rules

When editing layout, account for:
- sidebar width,
- HUD height,
- canvas scaling,
- fixed-position overlays,
- transformed canvas-space elements,
- overlap risk with wave banner, next-wave preview, and in-game action buttons.

### Visual rules

- Preserve the established TowerForge tone unless intentionally improving it.
- Effects should support readability, not compete with it.
- Use motion with purpose.
- Avoid flat or placeholder-looking UI additions.
- If a UI element becomes important to decision-making, give it strong hierarchy.

### Tooltip and explanation rules

- Tooltips should answer "what is this," "why does it matter," and "what is happening now."
- Avoid vague stat-only language where the player really needs behavioral explanation.
- For threat previews, favor actionable information over raw data overload.

---

## Save, Persistence, and Stability Rules

- Never casually break save compatibility.
- If save structure changes, add fallback handling when possible.
- Continue/resume flows should fail gracefully.
- Use defensive handling for malformed or partial saved data.
- Persistent progression changes should be treated as high-risk edits.

If working on save-sensitive systems, verify:
- map index,
- wave number,
- gold/lives/score,
- tower placement,
- tower tiers and paths,
- persistent bonuses,
- settings,
- challenge or endless state if relevant,
- any runtime stats that affect achievements or progression.

---

## Audio Rules

- Respect browser audio gesture rules.
- Do not start or resume Web Audio in a way that causes avoidable console warnings.
- Audio should support combat readability rather than overwhelm it.
- Important sounds should reinforce state changes: placement, upgrades, wave start, danger, boss events, unlocks.

---

## Testing Expectations

### Default testing approach

When changing behavior, verify with Playwright against the live local server when available.

Current dev server example:
- `http://localhost:52500`

### Current regression target

- `tests/playwright-skipwave-ui-test.js`

### What to verify after common change types

#### UI changes
- alignment,
- visibility,
- clipping,
- overlap,
- animation state,
- responsive safety.

#### Wave/combat changes
- correct state transitions,
- wave preview correctness,
- skip-wave behavior,
- enemy persistence,
- HUD/banner behavior,
- absence of obvious gameplay regressions.

#### Save/progression changes
- Continue button content,
- valid restore behavior,
- no malformed state after load,
- persistence compatibility,
- retroactive unlock or backfill behavior,
- locked tower gating across click, hotkey, and load paths,
- grandfather safety for old in-progress runs if progression rules changed.

#### Research changes
- no node overlap,
- valid layout,
- purchase gating,
- correct effect wiring,
- tooltip clarity.

#### Audio changes
- no console warnings,
- correct unlock behavior after user gesture,
- no broken sound start/stop state.

### Console policy

For touched features, try to leave the page with:
- no obvious console errors,
- no avoidable warnings,
- no repeated state spam unless intentionally debug-only.

---

## Working Workflow

Use this workflow for non-trivial changes.

1. inspect the relevant files,
2. identify adjacent systems that might also be affected,
3. make the smallest coherent change,
4. verify the visible behavior,
5. run Playwright or targeted checks,
6. check for console issues,
7. summarize what changed and what was verified.

For gameplay or UI changes, assume there is at least one adjacent system that can regress.

---

## Common High-Risk Areas

These areas deserve extra caution:

- save/load and Continue flow,
- wave transitions,
- canvas-space versus DOM-space positioning,
- research tree layout,
- audio context lifecycle,
- tower path logic,
- anything in `js/config.js` that changes IDs or progression structure,
- persistent stats tied to achievements or unlocks.

---

## Good Changes in TowerForge Usually Look Like

- making an existing feature clearer,
- improving the readability of enemy or wave behavior,
- preserving current mobs during skip-wave while forcing the next wave,
- fixing UI overlap, clipping, or misalignment,
- making research or progression more trustworthy,
- improving save confidence,
- making tower path decisions more meaningful,
- adding depth without making the game messier.

---

## Changes to Avoid

- duplicating existing progression layers,
- adding UI clutter that competes with combat,
- adding visual noise that obscures enemies, projectiles, or alerts,
- introducing content that weakens tower role identity,
- making quick fixes that ignore save/load or responsive layout,
- shipping hidden mechanics without clear player feedback,
- expanding content before stabilizing the systems it depends on.

---

## Roadmap-Aligned Development Advice

When choosing what to work on next, prefer features that support the current roadmap direction:

- first improve reliability and trust,
- then improve combat readability and boss identity,
- then improve replayability and challenge structure,
- then add more content.

This project benefits more from polishing and deepening the current systems than from uncontrolled feature growth.

---

## Short Summary

TowerForge is already feature-rich.

The best work on this project usually does one or more of the following:
- makes the game clearer,
- makes the game deeper,
- makes the game more trustworthy,
- makes the game more replayable without reducing readability.

When in doubt, prioritize clarity, strategic identity, and stability over surface complexity.
