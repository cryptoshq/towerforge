# TowerForge Roadmap (Execution Plan)

## Why This Rewrite Exists

This roadmap is rewritten to align with the current direction of TowerForge development and recent feedback:

- preserve the current gameplay feel while increasing depth,
- improve progression quality and long-term retention,
- fix real-world quality issues like background simulation behavior and SFX spam fatigue,
- keep every change testable on the live local server,
- use Context7 + Playwright as standard quality tooling during implementation.

This is not just a feature wishlist. It is a build plan with priorities, sequencing, and verification standards.

---

## Development Environment Standards

### Local Runtime Target

Primary dev runtime:

- `http://localhost:3000`

All behavior changes should be verified against this local server, not `file://` execution.

Reason:

- browser security restrictions and scheduling behavior differ on `file://`,
- game-loop timing, asset behavior, and console warnings are more reliable on localhost,
- Playwright automation is stable and reproducible with HTTP base URLs.

### Context7 Requirement

When tooling/library usage is involved (especially Playwright), use Context7 documentation as source-of-truth.

Use Context7 for:

- Playwright best practices,
- stable assertion strategy,
- waiting patterns and anti-flake patterns,
- API usage confirmation before introducing structural test changes.

### Playwright Requirement

Every non-trivial change should be validated with regression tests.

Current suite expectations:

- run gameplay regression,
- run UI alignment regression,
- run targeted smoke checks for newly introduced systems,
- ensure no new console errors for changed features.

Do not rely on visual assumptions only.

---

## Product Priorities (Global)

Use this order for engineering decisions:

1. Stability and trust
2. Readability and UX clarity
3. Strategic depth
4. Retention and progression quality
5. Content expansion

When priorities conflict, higher priority wins.

---

## Master Goals

TowerForge should become:

- easy to read under pressure,
- deep enough for repeat strategic experimentation,
- rewarding across short and long sessions,
- stable under real usage conditions (including focus changes and intense combat load),
- polished enough that players trust progression and keep returning.

---

## Phase 1 - Foundation, Reliability, and Trust

### Goal

Eliminate trust-breaking behavior and polish rough edges that reduce confidence in the game.

### Phase 1 Scope

#### 1) Save/Load Fidelity

Ensure restore parity for active-run state.

Includes:

- towers, tiers, paths, targeting modes,
- mastery/xp/runtime tower modifiers,
- wave and progression context,
- challenge/endless flags,
- robust fallback for malformed or older saves.

#### 2) Continue Flow Clarity

Continue should clearly communicate what will be resumed:

- map,
- wave,
- difficulty,
- mode (campaign/endless),
- challenge modifiers,
- run time,
- recency.

#### 3) Ability UX Baseline

Abilities must be visible and understandable in the sidebar/HUD with cooldown clarity.

#### 4) Research Wiring Reliability

High-impact research effects must be fully implemented, visible, and testable.

#### 5) New: Background Execution Reliability (Critical)

Issue observed: game appears to stop when window is unfocused.

Root context:

- no explicit focus pause is intended,
- but simulation currently relies on `requestAnimationFrame`,
- browsers throttle/suspend frame scheduling when tab/window is not focused or hidden.

Plan:

- split rendering and simulation timing responsibilities,
- implement safe simulation catch-up model on refocus,
- clamp catch-up delta to avoid one huge unstable update,
- preserve deterministic progression and avoid reward duplication,
- verify behavior across blur/focus and hidden-tab return scenarios.

Important note:

- full guaranteed real-time hidden-tab execution is browser-limited,
- practical target is: no focus-loss soft-pause + consistent state advancement/recovery.

#### 6) New: SFX Rework / Mix Stability Pass (Critical)

Problem statement:

- current SFX character is good,
- but high event density causes harsh, nervous, fatiguing sound due to overlap spam.

Non-goal:

- do not change core tonal identity.

Goal:

- keep current sound feel for normal play,
- prevent unlistenable stacked transients in dense combat.

Design approach:

- per-sound cooldown/rate limiting for spam-heavy events,
- per-category voice caps (polyphony budget),
- repeat-aware attenuation/filtering,
- preserve high-priority cues (boss, leak, milestones, alerts),
- avoid global blanket volume reduction.

Success criteria:

- normal gameplay sounds like current TowerForge,
- spam scenes remain readable and less fatiguing,
- important cues still cut through mix.

### Phase 1 Verification

- Playwright regression passes on `http://localhost:3000`,
- no save corruption on migration paths,
- no critical console errors in core flows,
- blur/focus timing checks pass,
- audio spam stress check subjectively and technically improved.

---

## Phase 2 - Combat Depth and Encounter Identity

### Goal

Make each run feel strategically distinct and behaviorally legible.

### Phase 2 Scope

#### 1) Boss Identity Program

Implement multiple boss archetypes with unique behavior cycles, telegraphs, and counters.

#### 2) Enemy Intent Telegraph System

Enemies should communicate dangerous actions before execution.

Examples:

- healer pulse windup,
- shield aura charge,
- stealth phase prep,
- disruptor EMP charge,
- toxic pulse prep.

#### 3) Scenario Wave Identity

Wave-level scenario tags and behavior shaping:

- rush,
- armored,
- support convoy,
- stealth ambush,
- siege push.

#### 4) Map Pressure Layer

Map themes influence enemy behavior with clear pressure identity.

Examples:

- rootsnare grounds,
- heat haze,
- black ice lanes,
- ember front,
- void drift.

#### 5) Path Readability Rework

Path style should be orthogonal with rounded corners (90-degree logic with smooth turn transitions),
not full spline curves that reduce lane readability.

### Phase 2 Verification

- Wave preview and HUD show meaningful threat context,
- no overlap/misalignment regressions,
- telegraphs trigger before ability resolution,
- boss behavior and previews remain consistent,
- full regression passes on localhost.

---

## Phase 3 - Replayability and Retention

### Goal

Turn repeated play into meaningful progression instead of repetitive score chasing.

### Phase 3 Scope

#### 1) Endless Progression Ladder

Implement persistent endless depth records and milestone rewards.

Requirements:

- one-time milestone claiming per map,
- visible reward feedback,
- persistent storage and migration-safe structure.

#### 2) Challenge Progression Tracking

Track challenge streaks and challenge victories as persistent meta signals.

#### 3) Menu-Level Progress Visibility

Add command/meta summary on main menu:

- best endless depth,
- milestones claimed,
- challenge streak metrics.

#### 4) Leaderboard Metadata Expansion

Store mode-aware context in leaderboard entries:

- mode,
- endless depth,
- challenge count.

#### 5) Next Retention Step (Planned)

Introduce structured challenge progression tiers and seeded challenge cadence:

- daily/weekly challenge tracks,
- challenge medal tiers,
- challenge-specific progression rewards.

### Phase 3 Verification

- milestone rewards are not duplicated,
- persistent meta remains valid across save/load/export/import,
- menu summaries match persisted data,
- regression passes on localhost.

---

## Phase 4 - Content Expansion and Advanced Progression

### Goal

Expand content without diluting identity, readability, or system cohesion.

### Phase 4 Scope

#### 1) New Enemy Packs (Behaviorally Distinct)

Current additions include disruptive control enemies and corrosion debuff archetypes.

Principles:

- every new enemy introduces a strategic problem,
- every dangerous action has telegraph readability,
- wave preview reflects new threat types.

#### 2) Next Expansion Track

Planned:

- additional enemy micro-factions,
- one new tower with unique role and non-redundant identity,
- map-mechanic expansions tied to existing pressure framework,
- advanced progression hooks connected to content (boss/map/tower-specific unlock paths).

#### 3) Research UI/Tree Readability Stabilization

Ongoing requirement:

- section labels must never occlude active node/line readability,
- section label placement should be geometry-aware and viewport-safe,
- visual hierarchy should favor interactive research content over section decoration.

### Phase 4 Verification

- new enemy behavior + telegraph tests pass,
- no readability regressions in research tree,
- alignment suite remains green,
- no new render/runtime errors under stress.

---

## Gameplay Expansion Roadmap (Next Major Track)

### Current Baseline

The game now has a solid foundation for deeper gameplay loops:

- scenario-tagged waves,
- boss archetypes,
- endless milestone persistence,
- weekly challenge seeding,
- endless mutator draft foundation,
- challenge modifier support,
- research-driven meta hooks.

The next roadmap should focus less on raw stat growth and more on meaningful decisions during a run.

### Design Rules For New Gameplay

Every new mechanic should follow these rules:

- create a player decision, not just a number increase,
- be readable in HUD/preview/tooltips,
- interact with existing wave, tower, and research systems,
- be testable on localhost with deterministic setup where possible,
- improve replayability without bloating cognitive load.

---

## Phase 5 - Run Variety and Mid-Run Decisions

### Goal

Make each run branch based on player choices, not only tower placement order.

### Scope

#### 1) Pre-Run Doctrine System

Before a run starts, choose one doctrine with an upside and a tradeoff.

Examples:

- `Fortress` - more lives and stronger defenses, weaker economy,
- `Tempo` - faster ability cycling, lower starting gold,
- `Greed` - stronger income and milestone rewards, weaker early combat,
- `Execution` - stronger boss and elite damage, weaker swarm handling.

#### 2) Between-Wave Tactical Choice Events

At key breakpoints, offer one of several choices instead of passive pacing.

Examples:

- gain gold now but next wave gains a mutator,
- gain RP now but lose interest for 2 waves,
- reinforce one tower class for 3 waves,
- call a supply drop with random tower/ability bonuses.

#### 3) Objective-Based Bonus Waves

Expand bonus waves beyond kill-everything goals.

Examples:

- survive for a timer,
- protect a convoy drone,
- assassinate one marked elite,
- prevent support enemies from completing casts,
- destroy a shield relay before the wave ends.

#### 4) Temporary Tower Augments

Introduce mid-run augments that apply to one tower, one tower family, or one path.

Examples:

- Arrow towers chain one extra target,
- one selected tower gains boss-break ammo,
- support towers pulse short haste buffs,
- a tower can be rebuilt for free once.

### Verification

- each choice is visible in run UI and save data,
- no duplicate reward claims,
- bonus wave objectives are surfaced in preview/HUD,
- regression coverage includes at least one tactical-choice path.

---

## Phase 6 - Enemy Factions, Captains, and Wave Arcs

### Goal

Make waves feel authored and learnable instead of only scaled.

### Scope

#### 1) Enemy Micro-Factions

Group enemies into themed sub-factions with shared pressure identity.

Examples:

- `Siege Foundry` - armored heavies, disruptors, shield escorts,
- `Veil Swarm` - stealth, ghosts, rush units,
- `Blight Caravan` - toxic spread, healer chains, attrition pressure,
- `Storm Cell` - speed, chain damage, cast-heavy units.

#### 2) Captain Units

Some waves include a captain enemy that buffs nearby units until killed.

Examples:

- speed captain,
- armor captain,
- heal-link captain,
- death-burst captain.

#### 3) Wave Arc Scripting

Every 5-wave block should have a pressure arc:

- opener,
- stress spike,
- support wave,
- mixed test,
- climax wave.

#### 4) Reinforcement Moments

Allow some waves to add a second pulse after the player believes the wave is stabilizing.

This should be previewed as:

- `REINFORCEMENT WAVE`,
- `LATE RUSH`,
- `CAPTAIN ESCORT`,
- `DOUBLE FRONT`.

### Verification

- faction/captain tags appear in preview and HUD,
- captain buffs disappear correctly on death,
- wave arcs are reflected in preview text and threat tags,
- tests validate reinforcement and captain behavior.

---

## Phase 7 - Map Mechanics and Spatial Gameplay

### Goal

Make maps matter beyond path shape and theme color.

### Scope

#### 1) Interactive Map Nodes

Add map-specific interactables players can spend on or trigger.

Examples:

- barricades,
- artillery switches,
- coolant vents,
- signal beacons,
- corruption seals.

#### 2) Terrain Event Windows

Maps periodically enter a temporary state that changes tactics for a short time.

Examples:

- desert heat shimmer buffs fast enemies,
- volcanic vents disable build spots temporarily,
- forest roots slow heavies but block certain placements,
- shadow fog reduces targeting certainty unless revealed.

#### 3) Zone Control Rewards

Give certain build areas extra meaning.

Examples:

- hold a relay tile to reduce ability cooldowns,
- build on a focus pad to improve one tower class,
- secure an extraction zone for extra end-of-wave gold.

### Verification

- map mechanics are readable before and during activation,
- interactables are not confused with decoration,
- mechanics remain stable across save/load and viewport sizes,
- map-specific tests cover at least one event per themed map family.

---

## Phase 8 - Tower Identity, Combo Play, and Buildcraft

### Goal

Push towers toward unique strategic roles and stronger cross-tower combos.

### Scope

#### 1) One New Non-Redundant Tower Class

Candidate roles:

- trap/control engineer,
- beam support/relay tower,
- summon/drone commander,
- debuff alchemist.

Rule:

- new tower must solve a different problem than existing DPS towers.

#### 2) Keystone Path Upgrades

At key tiers, path choices should unlock new play patterns, not only stronger stats.

Examples:

- convert attacks into burst windows,
- mark targets for ally focus fire,
- create temporary denial zones,
- build around delayed payoff mechanics.

#### 3) Formation Combos

Expand synergy beyond simple same-type triangles.

Examples:

- sniper + slow tower execution combo,
- cannon + mark combo,
- relay + laser beam amplification,
- support ring around one anchor tower.

#### 4) Mastery Active Perks

High-mastery towers should unlock one active or passive specialization choice.

This gives long-run tower attachment more meaning.

### Verification

- each new combo/mechanic is visible in tower info and path preview,
- mastery choices persist correctly,
- build diversity increases instead of collapsing into one dominant tower.

---

## Phase 9 - Endgame Loops and Competitive Retention

### Goal

Turn endless + weekly into durable long-term goals.

### Scope

#### 1) Mutator Families and Draft Branching

Organize endless mutators into categories so players can steer their run.

Examples:

- `Swarm`,
- `Elite`,
- `Economy Pressure`,
- `Boss Pressure`,
- `Map Instability`.

#### 2) Endless Boss Contracts

At major depths, choose a contract boss modifier for extra rewards.

Examples:

- boss gains more shields but drops relic currency,
- boss spawns escorts but milestone rewards improve,
- boss enrages faster but tower cooldowns refresh on kill.

#### 3) Weekly Challenge Reward Ladder

Weekly should support:

- first-clear reward,
- score medal tiers,
- endless extension reward thresholds,
- weekly leaderboard visibility.

#### 4) Post-Run Build Analysis

Give players actionable feedback after losses or wins.

Examples:

- most effective tower,
- weak matchup tags,
- leak cause summary,
- boss danger recap,
- mutator pressure recap.

### Verification

- weekly rewards cannot be duplicated,
- mutator family choices persist through saves,
- endless bosses and contracts remain readable,
- post-run analysis reflects real run data.

---

## Tooling and Test Strategy

### Local Server Baseline

Use:

- `http://localhost:3000`

### Regression Baseline

Core suites:

- gameplay regression,
- UI alignment regression,
- targeted smoke checks for newly introduced systems.

### Playwright Principles (Context7-Aligned)

- Prefer web-first assertions and auto-wait behavior.
- Avoid hardcoded sleeps where state assertions can be used.
- Keep tests deterministic and resistant to frame timing jitter.
- Validate both behavior and layout when UI is touched.

### Quality Gate for Each Change

No feature is considered complete unless:

- behavior works,
- readability is preserved,
- regression suite passes on localhost,
- no critical console/runtime errors are introduced.

---

## Execution Backlog (Next)

Ordered next actions:

1. Build pre-run doctrine system with save/load + menu UI integration (Phase 5).
2. Expand bonus waves into objective-based encounters with HUD/preview support (Phase 5).
3. Add first enemy micro-faction + captain system with threat tags and tests (Phase 6).
4. Add one map-interactable mechanic to validate spatial gameplay pattern (Phase 7).
5. Prototype one non-redundant tower class and one formation combo package (Phase 8).
6. Expand endless mutator draft into family-based branching choices (Phase 9).
7. Add weekly reward ladder + score medal tiers + weekly leaderboard panel (Phase 9).

---

## Definition of Success

TowerForge succeeds when:

- it remains readable under chaos,
- it retains strategic identity as content grows,
- progression meaningfully rewards repeat play,
- audio remains pleasant and informative under load,
- simulation behavior is consistent across focus changes,
- and every major change is validated through local-server Playwright regression.
