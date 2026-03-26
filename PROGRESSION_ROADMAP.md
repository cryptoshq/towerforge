# Progression Roadmap

## Purpose

This document defines the next progression pass for TowerForge.

The current game already has many progression-adjacent systems:

- campaign map unlocks,
- research points and research tree purchases,
- doctrines,
- achievements,
- endless milestones,
- weekly challenges,
- in-run tower XP and mastery.

The problem is not lack of systems. The problem is lack of directed goals.

Today the player can:

- access the full tower roster immediately in `js/uiRendering.js:282`,
- reach the first map of every difficulty band immediately through `GameState.unlockedMaps` in `js/gameState.js:64`,
- earn research points, but without a strong campaign ladder that says what to chase next,
- earn in-run tower mastery in `js/tower.js:233`, but without a durable tower-specific meta chase.

This roadmap fixes that by introducing a hybrid progression model that creates targets without bloating the game with too many currencies or menus.

## High-Level Goals

The progression pass must do all of the following at the same time:

1. Give every run a visible target beyond simple survival.
2. Give the campaign a clear ladder from easy to nightmare.
3. Make the tower roster feel earned instead of dumped on the player at once.
4. Preserve readability by keeping unlock logic visible and explicit.
5. Preserve existing player progress through retroactive backfill.
6. Avoid turning progression into a second economy that competes with research points.

## Non-Negotiable Constraints

The system must obey these rules.

### Currency rules

- `Research Points` remain the only spendable meta currency.
- The new target layer must not become another spend currency.
- The only new campaign metric is `Command Marks`.

### Unlock rules

- Only advanced towers are license-locked.
- Core roles must be available from the start.
- Locked towers must remain visible in the tower sidebar.
- Every locked tower must show exact requirements and current progress.
- Hotkeys, click-to-build, drag placement, save restore, and continue flow must all respect the same unlock rules.

### Objective rules

- Each map grants exactly 3 permanent marks.
- Marks must be permanent, one-time, and easy to explain.
- No map objective should require a tower that the player could not reasonably unlock before reaching that map.
- Objectives should teach systems the game already has instead of inventing unrelated gimmicks.

### Backfill rules

- Existing persistent saves must be backfilled.
- Backfill should grant everything that can be proven by existing data.
- Unprovable historical progress should not be guessed unless there is a clearly safe fallback rule.
- If an existing continue save contains a tower whose license is now locked, that license should be grandfathered on restore.

### UI rules

- The player should always know their next meaningful target.
- Map select, tower sidebar, and victory screen must all reinforce the same progression ladder.
- Unlocks should feel celebrated, but the UI should stay compact and readable.

## Final Progression Model

The final loop has four layers.

### Layer 1 - Run-level targets

Every campaign map gives 3 permanent `Command Marks`:

- `Clear Mark` - clear the map once.
- `Perfect Mark` - clear with no leaks.
- `Directive Mark` - complete the authored map-specific objective.

### Layer 2 - Campaign ladder

`Command Marks` unlock:

- advanced tower licenses,
- higher difficulty band entry,
- campaign milestones shown in map select.

### Layer 3 - Spend layer

`Research Points` still unlock permanent research in `js/research.js:1`.

Research is not replaced. It becomes the spend layer that sits on top of a clearer campaign ladder.

### Layer 4 - Endgame proof

Hard and nightmare completion, endless depth, faction/captain kills, and mastery achievements become high-grade proof requirements for the final licenses.

This keeps late progression aspirational without making the early campaign grindy.

## New Persistent Systems

### 1. Command Marks

`Command Marks` are permanent and non-spendable.

They exist to answer a single player question:

`What should I do next to unlock more of the game?`

#### Rules

- Every map has 3 marks.
- Marks are awarded once.
- Replay only awards missing marks.
- Marks should be visible in map select and victory.
- Marks are never spent.

#### Proposed persistent data

Add to `GameState.metaProgress` in `js/gameState.js:73`:

```js
metaProgress: {
  ...existingFields,
  progressionVersion: 1,
  commandMarks: 0,
  mapMarkBits: new Array(20).fill(0),
  towerLicenses: {},
  legacyProgressionBackfillDone: false,
  lifetimeMapsCleared: 0,
  lifetimePerfectClears: 0,
  lifetimeDirectiveClears: 0,
  lifetimeBossClears: 0,
  lifetimeCaptainKills: 0,
}
```

`mapMarkBits[i]` uses a bitmask:

- bit `1` = clear mark
- bit `2` = perfect mark
- bit `4` = directive mark

Why use bitmasks:

- easy to persist in LocalStorage,
- easy to migrate,
- easy to compare during backfill,
- easy to display as 3 pips per map.

### 2. Tower Licenses

Tower licenses are permanent progression gates for advanced towers.

They are not bought. They are awarded when requirements are met.

Each license should support:

- exact rule checks,
- exact progress display,
- alternate backfill proofs,
- a single unlock toast when first awarded.

#### Proposed config shape

Add a `CONFIG.PROGRESSION` block in `js/config.js`.

```js
PROGRESSION: {
  STARTER_TOWERS: ['arrow', 'cannon', 'ice', 'lightning', 'sniper'],
  BAND_GATES: { ... },
  TOWER_LICENSES: {
    flame: {
      label: 'Flame Tower License',
      requires: { and: [...] },
      legacyProof: { or: [...] },
    },
  },
  MAP_DIRECTIVES: [ ... ],
}
```

#### Requirement DSL

Use a small requirement language so the UI, runtime checks, and backfill all share one source of truth.

Supported predicates should include:

- `marksAtLeast`
- `clearMap`
- `clearDifficultyBand`
- `mapsClearedAtLeast`
- `researchNodesAtLeast`
- `achievementUnlocked`
- `endlessDepthAtLeast`
- `captainKillsAtLeast`
- `bossClearsAtLeast`
- `directiveMarksAtLeast`
- `licenseUnlocked`
- `and`
- `or`

This is important because hardening requirements only works if the checks are centralized and inspectable.

## Starter Roster and License Ladder

## Starter towers

These towers should always be available:

- `arrow`
- `cannon`
- `ice`
- `lightning`
- `sniper`

Why this set:

- `arrow` teaches fast single-target basics.
- `cannon` teaches splash and center-hit value.
- `ice` teaches control.
- `lightning` teaches multi-target and chain identity.
- `sniper` teaches boss and long-range pressure.

This gives the player answers to the major early problems without overwhelming them.

## Advanced tower licenses

These requirements are intentionally harder than a flat mark threshold.

They should feel earned, visible, and mechanically meaningful.

| Tower | Unlock requirements | Why this gate exists |
| --- | --- | --- |
| `flame` | `2 total marks` AND `clear Green Valley` | First elemental DOT unlock. Comes early, but only after the player has actually cleared the tutorial map. |
| `venom` | `5 total marks` AND `clear Desert Pass` | Introduces damage-over-time stacking and corrosion after the player has seen two early map themes. |
| `boost` | `6 total marks` AND `clear any map using at least 3 tower types` | Support tower should unlock after the player proves they understand roster mixing instead of mono-spamming. |
| `missile` | `10 total marks` AND `clear 3 maps` AND `defeat 3 bosses total` | Homing burst/AOE hybrid is mid-game power. Boss proof keeps it from arriving too early. |
| `mortar` | `14 total marks` AND `clear any Normal difficulty map` AND `reach 2 linked towers at once in a winning run` | Ultra-range siege should unlock once players engage with spacing and link systems. |
| `laser` | `18 total marks` AND `clear 3 Normal maps` AND `purchase 6 research nodes` | Beam tower is mechanically advanced and fits better once campaign and research understanding both exist. |
| `necro` | `24 total marks` AND (`clear any Hard map` OR `reach endless depth 10 on any map`) AND (`achievement: mythic_tower` OR `captainKillsAtLeast: 5`) | Necro is the late, high-complexity reward. The gate intentionally requires campaign proof plus either mastery or faction competence. |

### Why these requirements are hardened

The requirements are harder because each one now asks for a mix of:

- campaign breadth,
- victory proof,
- system understanding,
- and sometimes long-tail mastery.

That does three useful things:

1. It gives every license a story.
2. It prevents the roster from unlocking through passive grinding alone.
3. It naturally points players toward systems that currently feel optional.

## Difficulty Band Gates

The current data grants the first map of every band up front in `js/gameState.js:64`.

That should be replaced with explicit band entry gates.

### Proposed band entry rules

- `Easy` band opener remains unlocked.
- `Normal` band opener unlocks at `9 total marks` AND `clear Shadow Realm`.
- `Hard` band opener unlocks at `22 total marks` AND `clear Twilight Marsh`.
- `Nightmare` band opener unlocks at `38 total marks` AND `clear Dragon's Spine`.

### Within-band unlock rule

Inside a band, each next map unlocks by clearing the previous map.

This keeps the campaign readable:

- a clear horizontal path inside a band,
- a clear prestige gate into the next band.

### Why these gates are harder than current flow

- They stop players from jumping to higher bands without finishing the intended learning arc.
- They make marks matter immediately.
- They make the campaign feel curated instead of accidentally open.

## Map Directive Catalog

Each map gets one authored directive that awards the directive mark.

These directives should map to mechanics the game already has.

### Easy band

| Map | Directive | Rule type | Reason |
| --- | --- | --- | --- |
| `Green Valley` | Combined Arms | Build at least 3 unique tower types and clear | Teaches roster mixing immediately. |
| `Desert Pass` | Reserve Discipline | Reach 500 banked gold at any point and clear | Teaches economy pacing and interest awareness. |
| `Frozen Peak` | Control Layer | Apply 150 slow or freeze effects in one win | Teaches control value through Ice and status systems. |
| `Volcanic Rift` | Splash School | Deal 6000 total splash damage in one win | Teaches AOE and Cannon identity. |
| `Shadow Realm` | First Crown | Clear with no leaks | Converts the band finale into a clean mastery target. |

### Normal band

| Map | Directive | Rule type | Reason |
| --- | --- | --- | --- |
| `Iron Crossing` | Relay Net | Finish the map with at least 1 active tower link | Introduces links as a real strategic target. |
| `Dusty Trail` | Overclock Drill | Use overclock 3 times in a winning run | Forces interaction with tower commands and timing. |
| `Storm Coast` | Tempo Clear | Clear in under 14 minutes of game time | Introduces speed and build efficiency as a goal. |
| `Ember Canyon` | Burn Line | Deal 9000 total burn damage in one win | Gives the newly unlocked Flame tower a concrete target. |
| `Twilight Marsh` | Corrosion Pit | Remove 120 total enemy armor or deal 8000 poison damage | Gives Venom a visible campaign purpose. |

### Hard band

| Map | Directive | Rule type | Reason |
| --- | --- | --- | --- |
| `Crimson Fortress` | Battle Group | Win with 2 active links and 5 tower types used | Forces mid-game buildcraft breadth. |
| `Blizzard Peak` | Cold Logic | Clear with no more than 2 leaks and 40 freeze applications | Raises control-play precision. |
| `Inferno Depths` | Siege Test | Reach 2 tier-5 towers and clear | Makes economy and upgrade pacing explicit. |
| `Phantom Gates` | Captain Hunt | Kill 2 captains in one clear | Brings factions and captain targeting into progression. |
| `Dragon's Spine` | Boss Line | Clear with no sells and no leaks | Tests planning discipline before nightmare entry. |

### Nightmare band

| Map | Directive | Rule type | Reason |
| --- | --- | --- | --- |
| `Void Nexus` | Triple Apex | Reach 3 tier-5 towers and clear | Establishes nightmare as a full-build exam. |
| `Abyssal Maw` | Austerity | Clear while placing no more than 8 towers | Forces high-value tower choices. |
| `Eldritch Spiral` | Tactical Grid | Finish with 3 active links and use 4 abilities | Tests cross-system execution. |
| `Death's Corridor` | Clean Sweep | Kill every captain spawned in the run and clear | Demands faction awareness under pressure. |
| `The Final Oblivion` | Final Exam | Clear with no leaks, 3 tier-5 towers, and all map objectives completed in the nightmare band except this one | Final campaign mastery target. |

## Required Runtime Tracking

Several directives need persistent or run-level counters that do not fully exist today.

Add these to run stats in `GameState.stats` or a dedicated progression run tracker:

- `towerTypesSet.size` already exists and can power Combined Arms.
- `maxGold` already exists and can power Reserve Discipline.
- `slowApplyCount`
- `freezeApplyCount`
- `splashDamageDealt`
- `burnDamageDealt`
- `poisonDamageDealt`
- `armorRemovedTotal`
- `overclockUses`
- `maxActiveLinks`
- `tier5CountPeak`
- `captainsKilledThisRun`
- `towerSellCount`
- `abilityUses`
- `towersPlacedThisRun`

When possible, reuse existing systems instead of duplicating logic.

Examples:

- link counts should reuse the live link validation already in `js/tower.js`.
- captain detection should reuse faction/captain tagging from `js/wave.js`.
- damage-type counters should be updated where status or projectile damage is already resolved, not via a second passive scanner.

## UI Plan

## Map select

Update `js/menu.js:1380` and related DOM/CSS so each map card shows:

- 3 mark pips,
- current directive summary,
- whether the next map is locked by a band gate,
- the next major tower unlock,
- band-wide command mark totals.

Suggested header summary:

- `Command Marks: 13`
- `Next unlock: Mortar Tower at 14 marks`
- `Next band gate: Hard at 22 marks + clear Twilight Marsh`

## Tower sidebar

Update `js/uiRendering.js:282` so locked towers still render.

Locked sidebar cards should show:

- lock badge,
- role/name,
- exact requirement summary,
- progress text,
- disabled hotkey state.

Example copy:

- `LOCKED - 10/14 Marks`
- `Also requires: Clear 1 Normal map`

## Victory screen

Update `victory()` in `js/main.js:1087` to include a progression panel:

- newly earned marks,
- newly completed directive,
- newly unlocked tower licenses,
- current total marks,
- next target.

Example:

- `+2 Command Marks`
- `Directive complete: Combined Arms`
- `Unlocked: Flame Tower`
- `Next target: 3 more marks for Venom Tower`

## In-run feedback

During a run, keep feedback lightweight.

Recommended surfaces:

- pause menu directive text,
- optional small progress text in the tower or HUD region,
- no persistent top-of-screen clutter during active combat.

## Placement and Input Gating

The tower lock system must gate all entry points.

### Required touch points

- `js/uiRendering.js:282` - render lock state in the sidebar.
- `js/tower.js:2218` - reject build placement if the license is missing.
- `js/input.js` - reject direct hotkey selection of a locked tower.
- `js/save.js` - grant or grandfather licenses when loading old saves or continuing old runs.

### Failure feedback

If the player clicks or hotkeys a locked tower:

- keep the tower visible,
- do not select placement mode,
- show a short error toast or floating text,
- include exact progress in the message.

Example:

- `Laser locked: 18/18 marks, need 6 research nodes`

## Save, Migration, and Backfill Plan

This is the highest-risk part of the change.

The implementation must follow MDN Web Storage guidance via Context7:

- `localStorage` stores strings, so progression data should remain JSON-serializable.
- persistence writes should use defensive `try/catch` handling.
- storage-availability and quota failures should be treated as real runtime concerns, not impossible edge cases.

### Save additions

Extend persistent save data in `js/save.js:294` and cloud payload save data in `js/save.js:734` with:

- `metaProgress.progressionVersion`
- `metaProgress.commandMarks`
- `metaProgress.mapMarkBits`
- `metaProgress.towerLicenses`
- `metaProgress.legacyProgressionBackfillDone`
- new lifetime progression counters as needed

### Backfill strategy

Backfill should run once on persistent load.

#### Safe direct backfills

- `clear mark` if `mapScores[i] > 0`
- `maps cleared` from `mapScores`
- `band clears` from fully cleared bands
- `researchNodesAtLeast` from `purchasedResearch.size`
- `endlessDepthAtLeast` from `metaProgress.endlessBestDepthByMap`
- `achievementUnlocked` from `achievementsUnlocked`

#### Things that should not be guessed from old data

- per-map perfect clears
- per-map directive completions
- exact lifetime burn/poison/freeze counters
- exact lifetime boss or captain totals if not already stored

#### Legacy license proof rules

Every advanced tower should also define a `legacyProof` clause so old saves still receive reasonable unlocks.

Examples:

- `flame` legacy proof: clear any map in easy band
- `venom` legacy proof: clear 2 maps
- `boost` legacy proof: `researchCount >= 5` OR clear 3 maps
- `missile` legacy proof: achievement `boss5` OR clear 1 Normal map
- `mortar` legacy proof: clear 2 Normal maps
- `laser` legacy proof: clear 1 Hard map OR `researchCount >= 10`
- `necro` legacy proof: achievement `mythic_tower` OR hard-band completion OR endless depth 10

#### Grandfather rule for continue saves

If a loaded in-progress run contains a tower type the player no longer has a license for, grant the missing license during load and log it as a grandfathered unlock.

This avoids invalid continue saves.

## Detailed Implementation Phases

## Phase 0 - Data contract and migration

Deliverables:

- add `CONFIG.PROGRESSION`
- add new `metaProgress` fields
- add normalize/migration logic in `js/save.js`
- add backfill runner
- add tower license evaluator

Exit criteria:

- old saves load without errors
- new fields default correctly
- backfill runs once only
- cloud restore keeps progression intact

## Phase 1 - Command marks and directives

Deliverables:

- map directive catalog
- run-time objective tracker
- mark award logic in victory flow
- victory progression summary panel

Exit criteria:

- each easy-band map can award 3 marks
- replay only awards missing marks
- directive progress can be surfaced in pause/victory

## Phase 2 - Tower licenses and sidebar locks

Deliverables:

- starter roster gating
- locked tower UI in sidebar
- exact requirement copy
- placement/hotkey block logic

Exit criteria:

- locked towers are visible but unusable
- requirements are readable and truthful
- existing advanced towers unlock correctly after backfill

## Phase 3 - Band gates and map-select targets

Deliverables:

- band opener lock rules
- map card mark pips
- next unlock banner in map select
- directive summary on each map card

Exit criteria:

- easy to nightmare ladder is explicit
- player always sees the next unlock target

## Phase 4 - Hard-mode directives and captain/boss hooks

Deliverables:

- hard-band directive counters
- captain kill tracking
- boss-clear tracking
- no-sell and low-build directives

Exit criteria:

- advanced map directives are reliable
- late-game targets test system mastery rather than raw grind

## Phase 5 - Nightmare completion pass

Deliverables:

- nightmare directives
- final campaign mark flow
- necro unlock proof logic
- polished unlock celebration and next-target messaging

Exit criteria:

- the full campaign has a complete progression ladder
- the final unlocks feel like a meaningful reward

## Regression Coverage Plan

When implementing the roadmap, add or extend tests for:

- persistent save migration for progression fields
- one-time backfill behavior
- cloud restore preserving marks and licenses
- locked tower sidebar state
- locked tower hotkey rejection
- locked tower placement rejection
- victory mark awards only once per condition
- directive completion for representative maps
- band gate locking and unlocking
- grandfathered continue save handling

Playwright guidance should follow official Playwright best practices via Context7:

- prefer locator-based checks when validating DOM surfaces,
- prefer wait-aware assertions instead of immediate synchronous state reads,
- keep tests resilient to animation and delayed render states.

## Design Guardrails

Do not do any of the following during implementation:

- add a second spend currency,
- hide towers entirely instead of showing requirements,
- lock basic single-target, splash, control, and boss-range roles all at once,
- tie every unlock to raw grind numbers only,
- create directives that require a license the player cannot realistically have before that map,
- break old saves to simplify the code,
- make progression so hard that players stop experimenting.

## Final Product Test

The progression rework is successful only if a new player can answer these questions at any moment:

- What am I trying to do on this map besides just survive?
- How many marks do I have?
- What tower or band unlocks next?
- Why is this tower locked?
- What do I need to do to unlock it?
- Did this run move my account forward?

If the game cannot answer those questions clearly, the progression pass is not done.
