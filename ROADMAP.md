# TowerForge Roadmap

## Product Direction

TowerForge is being reshaped into a polished single-player tower defense game built around three core promises:

- memorable boss encounters
- trustworthy and readable combat rules
- curated replayability built on top of a strong core game

This roadmap intentionally rejects breadth for breadth's sake. The current codebase already contains a large number of systems, including doctrines, research, tactical events, objective bonus waves, endless mutators, weekly challenges, a multiplayer layer, and tier-6 ultimate upgrades. The next stage of development is not about adding more systems. It is about deciding which systems deserve to survive, making the best ones excellent, and cutting or freezing the rest.

This roadmap is phase-gated, not feature-hoarding and not deadline-driven. A later phase should not begin just because a calendar says so. A later phase should begin only when the earlier phase has met clear quality gates.

## Strategic Principles

1. Bosses are the product anchor.
Bosses already have visible scaffolding in the current game through archetypes, intros, previews, and cast logic in `js/enemy.js:46`, `js/enemy.js:310`, `js/enemy.js:731`, and `js/wave.js:1805`. They should become the strongest part of the game, not just the most advertised part.

2. Combat truth comes before expansion.
If a status effect, tower special, or enemy mechanic exists in config but is not fully trustworthy in runtime behavior, it is a liability. Combat must be mechanically honest before the game earns the right to expand.

3. Fewer better systems beats many partial systems.
Every retained system must improve either moment-to-moment combat, boss identity, or long-term replay value in a way the player can clearly feel.

4. Campaign clarity beats tuning noise.
The current game can stack many encounter identity layers at once through modifiers, scenarios, factions, wave arcs, map pressure, tactical modifiers, endless mutators, and captain auras in `js/wave.js:18`, `js/wave.js:43`, `js/wave.js:52`, `js/wave.js:77`, `js/wave.js:161`, `js/wave.js:331`, and `js/wave.js:408`. The campaign should use fewer layers more intentionally.

5. Replayability should be built on mastery, not confusion.
Endless mode, weekly challenges, and meta progression are valuable only if the core combat loop is already readable, reliable, and worth replaying.

## Current Reality

### What is already strong

TowerForge is already a real game with broad coverage across core systems.

- Core run flow, menu flow, and game state are established in `js/main.js`, `js/menu.js`, and `js/gameState.js:1`.
- Twenty maps across four difficulty bands are defined in `js/config.js:1102`, with custom pathing, terrain themes, and decoration logic supported by `js/map.js:1`.
- A broad tower roster and upgrade framework exists in `js/config.js` and `js/tower.js`.
- Boss intros, wave preview intel, doctrines, research, tactical events, endless draft, and weekly challenges are already implemented in visible form.
- There is meaningful automated coverage for several higher-level flows in `tests/playwright-faction-captain-test.js:1`, `tests/playwright-weekly-endless-meta-test.js:1`, `tests/playwright-doctrine-flow-test.js:1`, `tests/playwright-tactical-choice-test.js:1`, and `tests/playwright-bonus-objective-test.js:1`.

### What is holding the game back

The project's breadth is now larger than its current level of mechanical trust and product coherence.

- Bosses exist, but they still sit on top of a generic enemy chassis. Boss identity is defined mostly through profile swaps in `js/enemy.js:46` and `js/enemy.js:310`, while the base boss type is still a single generic `ENEMIES.boss` entry in `js/config.js:887`.
- Boss summons appear to bypass the normal spawn-time modification pipeline. `_bossSpawnMinions()` in `js/enemy.js:829` creates minions directly instead of routing them through the same wave-spawn processing used elsewhere in `js/wave.js`.
- Several combat-status interactions look incomplete or broken. The clearest example is the `frozenTimer` / `freezeTimer` mismatch between `js/tower.js:654`, `js/tower.js:685`, and `js/enemy.js:151`.
- Some tower specials appear defined in config but only partially supported in stable combat logic.
- The game's UI and documentation are not fully synchronized with the actual mechanics. The difficulty screen sells specific boss fantasies in `js/menu.js:1121`, but those descriptions do not cleanly align with the implemented boss behavior in `js/enemy.js:46`.
- The codebase has accumulated feature-spike architecture, especially in `js/juiceFeatures.js`, where permanent game behavior is added through monkey-patching and grab-bag integration hooks.

## Strategic Cuts and Freezes

This section is not optional. The roadmap only works if scope reduction is treated as real work.

### Remove from active product scope

- Multiplayer is removed from the active roadmap.
- The multiplayer code in `js/multiplayer.js:1` is large, real, and technically impressive, but it is effectively a second product. It competes directly with the chosen goal of making TowerForge a polished single-player game.
- The existence of the system does not justify continued roadmap investment.
- Multiplayer should not receive major feature work, polish work, or design attention during Phases I or II.
- If keeping the code creates UI or maintenance drag, it should be hidden from the main product surface until the single-player game is mature enough to justify revisiting it.

### Freeze until the core game is excellent

- Tier-6 ultimates are frozen.
- The ultimate system in `js/juiceFeatures.js:948` and the upgrade hook in `js/tower.js:1194` add power fantasy and content breadth on top of a combat layer that is not yet fully trustworthy.
- Ultimates should not be expanded, balanced, or treated as core product surface until the base tower roster is clean, the boss layer is strong, and the core T5 ecosystem is stable.
- If necessary, ultimates should be hidden behind a debug or experimental label rather than presented as fully supported content.

### Simplify aggressively

- Campaign wave identity layering should be reduced.
- The campaign should not regularly combine too many simultaneous identity layers. A future target should be one primary identity layer plus one secondary accent, not five overlapping systems.
- Save-system complexity should be deprioritized.
- Multiple save slots, export/import, undo snapshots, and cloud payload preparation exist in `js/save.js:455`, `js/save.js:540`, `js/save.js:664`, and `js/save.js:704`. These features are not the limiting factor in product quality right now.
- Any late-tier tower special that cannot be proven fully implemented should be either simplified or removed from the active design surface.
- New enemy gimmicks added through `js/juiceFeatures.js:776` should be treated as optional candidates, not guaranteed permanent features.

### Scope rule

No major new gameplay system should be added until bosses, combat correctness, and roster parity are solved.

## Phase I - Bosses and Combat Truth

### Goal

Make TowerForge mechanically trustworthy and make bosses feel like authored encounters rather than enlarged standard enemies.

### Why this phase comes first

Bosses are currently the clearest gap between promise and payoff.

- The game already frames bosses as tentpole content through previews, names, and difficulty storytelling.
- Bosses have archetypes, cast labels, intro abilities, telegraphs, and a dedicated intro sequence.
- But they still inherit too much from a shared generic boss base and are still too tied to the standard enemy system.
- At the same time, combat correctness problems undermine both bosses and the wider tower roster.

This phase exists to solve both problems at once: bosses become the headline feature, and combat truth becomes the supporting foundation that makes those encounters reliable.

### Workstream 1 - Rebuild bosses as authored encounters

Bosses should move from "profiled enemy type" to "encounter definition."

Detailed goals:

- Separate each boss into a fully authored encounter definition rather than relying on one shared `ENEMIES.boss` baseline in `js/config.js:887`.
- Preserve the current archetype names and themes from `js/enemy.js:46`, but deepen them into proper fight identities.
- Give each boss:
  - a persistent passive identity
  - a clear cast cycle
  - at least one phase threshold
  - at least one lane-control mechanic
  - at least one summoning, shielding, or positional mechanic
  - an enrage state that changes the texture of the fight, not just the speed number
- Align boss preview text, difficulty-screen storytelling, and boss-intro UI with the real mechanics.

Engineering goals:

- Replace or rework `setBossProfile()` in `js/enemy.js:310` so boss configuration is not just a shallow object copy.
- Rebuild `_updateBossAbilities()` and `_executeBossAbility()` in `js/enemy.js:731` around encounter definitions that support:
  - phases
  - threshold-driven behavior shifts
  - telegraph tuning
  - minion-spawn policy
  - unique reward or scoring hooks
- Route boss summons through the same scaling and modifier pipeline as normal spawns, rather than spawning raw `new Enemy()` objects in `js/enemy.js:829`.
- Ensure boss adds correctly participate in:
  - difficulty scaling
  - map pressure
  - faction logic where appropriate
  - scenario logic where appropriate
  - tactical modifiers where appropriate
  - wave completion accounting
  - reward accounting

Design goals by boss:

- Grub King should become the clearest swarm-pressure boss, focused on board clutter, lane tempo, and low-cost overwhelm.
- Stone Colossus should become the clearest durability/control boss, focused on shield windows, anti-burst pressure, and deliberate pacing.
- Infernal Lord should become the clearest aggression/spike boss, focused on burst tempo, support disruption, and pressure swings.
- Void Emperor should become the clearest endgame trickster boss, focused on spatial disruption, teleport threats, summon pressure, and phase manipulation that remains fair and readable.

### Workstream 2 - Establish a combat truth contract

The combat layer should move away from scattered one-off flags and toward a single, predictable status model.

Detailed goals:

- Audit every enemy status and every tower-applied status path.
- Build a single contract for every status effect:
  - identifier
  - apply behavior
  - stack or refresh rules
  - update tick behavior
  - expiration behavior
  - visual indicator behavior
  - damage interaction rules
- Fix the current known mismatches and suspicious fields, including:
  - `frozenTimer` vs `freezeTimer` in `js/tower.js:654`, `js/tower.js:685`, and `js/enemy.js:151`
  - `vulnerableMult` assignment in `js/tower.js:657` without obvious use in `js/enemy.js:921`
  - `blinded` / `blindTimer` in `js/tower.js:809`
  - `energyFieldSlowed` in `js/tower.js:907`
- Remove any status field that does not have a reliable full lifecycle.

Design goals:

- Slow, freeze, stun, mark, brittle, poison, burn, shield, stealth, blind, corruption, vulnerability, and boss-only effects should all obey consistent rules.
- Players should be able to understand why an enemy is moving slowly, why it is taking bonus damage, why a boss is protected, and when that state will end.
- Bosses may have special resistances or immunities, but those rules must be explicit and readable.

### Workstream 3 - Audit and reduce tower special sprawl

The current tower content should be treated as a truth exercise, not a content trophy cabinet.

Detailed goals:

- Create a full audit matrix for every late-tier tower special defined in `js/config.js`.
- For every special, record:
  - where it is defined
  - where it is implemented
  - what UI advertises it
  - what effects and audio support it
  - whether it is tested
  - whether it should be retained, simplified, or removed
- The outcome of the audit should be decisive. No special survives in a vague "probably works" state.

Priority focus:

- All T5 signature abilities
- all new-path tower specials
- special flags added by later expansion work
- any special that interacts with bosses or crowd-control rules
- any special that changes economy, cooldowns, or global modifiers

Important examples that need explicit disposition:

- freeze-related tower specials in `js/tower.js:648`
- Solar Flare blind logic in `js/tower.js:800`
- passive field-slow logic in `js/tower.js:902`
- special-heavy config entries in `js/config.js:668`, `js/config.js:686`, `js/config.js:711`, `js/config.js:726`, `js/config.js:751`, `js/config.js:766`, `js/config.js:791`, `js/config.js:806`, and `js/config.js:846`

Strategic product rule:

- A smaller number of fully reliable tower fantasies is better than a larger number of half-supported tower fantasies.

### Workstream 4 - Make all player-facing boss and combat messaging truthful

Current UI fiction and actual game behavior must match.

Detailed goals:

- Update boss preview, boss-intro, and difficulty-screen language to describe real mechanics.
- Ensure every threat tag in wave preview corresponds to actual mechanical pressure.
- Improve pre-wave intel so the player knows what kind of decision they are being asked to make.
- Ensure visual telegraphs are strong enough to support boss counterplay.

Targets:

- `js/menu.js:1121`
- `js/wave.js` wave preview and boss-preview paths
- `js/uiRendering.js`
- `js/enemyRendering.js`
- any boss-intro or preview surfaces tied to `GameState.bossIntro` in `js/gameState.js:152`

### Workstream 5 - Build stronger mechanical regression coverage

The current test suite is strongest on product flow and system presence. It now needs to become stronger on combat truth.

Detailed goals:

- Preserve the current high-value Playwright coverage for meta systems and wave identity.
- Add dedicated boss tests beyond the current lightweight boss-depth checks in `tests/playwright-skipwave-ui-test.js:442`.
- Add deterministic combat verification for:
  - status application
  - status expiration
  - boss phase transitions
  - boss summon accounting
  - tower special activation
  - boss resist or immunity rules if added
- If Playwright alone is too heavy for this, introduce a lightweight deterministic combat harness for local logic validation.

### Deliverables

By the end of Phase I, TowerForge should have:

- four fully authored boss encounters
- one trustworthy status-effect contract
- a cleaned T5 ability ecosystem
- a documented decision on which tower specials are real, which are simplified, and which are gone
- truthful boss and threat preview UI
- stronger regression coverage around boss mechanics and combat correctness

### Not in scope

Phase I should not include:

- new towers
- new boss archetypes beyond the existing four anchors
- major multiplayer work
- tier-6 expansion
- major new research branches
- more new enemy gimmick types
- campaign-content expansion purely for map count

### Exit criteria

Phase I is complete only when all of the following are true:

- boss summons use the correct spawn and scaling pipeline
- all retained status effects have a verified apply, tick, and expire path
- all retained boss preview text matches real mechanics
- all retained T5 abilities are implemented, readable, and testable
- bosses are the strongest-feeling content in the game
- there are no known "config says yes, gameplay says maybe" mechanics on the critical combat path

## Phase II - Polished Core Campaign

### Goal

Turn a trustworthy combat foundation into a complete, coherent, highly polished single-player campaign.

### Why this phase comes second

Once bosses and combat truth are solved, the next highest-value problem is overall campaign coherence.

The game already contains substantial content:
- 20 maps in `js/config.js:1102`
- doctrines in `js/config.js:47`
- research in `js/research.js:1`
- map-select and doctrine-select presentation in `js/menu.js`
- a large tower roster and progression economy

What it does not yet fully guarantee is that the overall campaign feels intentional from beginning to end.

### Workstream 1 - Decide and finalize the real tower roster

The game currently behaves like a 12-tower game in input space, but the surrounding UX still shows signs of a smaller, older roster.

Evidence:

- tower selection hotkeys support 12 slots in `js/input.js:483`
- reserved-key logic still only blocks `Digit1-8` in `js/input.js:691`
- the settings hint still says tower slots are `1-8` in `index.html:179`
- tower attack sound mapping in `js/tower.js:1106` does not fully reflect the expanded roster

This phase must force a final roster decision:

- Option A: fully support all 12 towers with complete parity
- Option B: ship a smaller curated roster and shelve weaker additions until later

Whichever option is chosen, the result must include:

- input parity
- audio parity
- tooltip parity
- path identity parity
- balancing parity
- upgrade UX parity
- documentation parity
- tutorial and onboarding parity

### Workstream 2 - Simplify campaign wave identity and improve readability

The campaign should feel legible, not over-layered.

Detailed goals:

- Reduce the number of overlapping wave-identity systems that are active in the campaign at once.
- Keep the strongest wave-identity layers, but use them deliberately.
- Reserve the most complex stacking for endless or high-end mastery content later.

Recommended campaign structure rule:

- each campaign wave should have one primary identity
- it may have one secondary accent if needed
- anything beyond that should be rare, previewed, and heavily justified

This workstream should refine the use of:

- base wave composition
- scenarios in `js/wave.js:43`
- factions and captains in `js/wave.js:52` and `js/wave.js:110`
- wave arcs in `js/wave.js:77`
- map pressures in `js/wave.js:161`

Design goals:

- easy should teach the language of the game cleanly
- normal should emphasize adaptable play
- hard should emphasize pressure and execution
- nightmare should feel like an earned final exam, not simply a noisier stack of modifiers

### Workstream 3 - Rebalance research, doctrines, and progression around the cleaned core game

Meta systems should be reshaped to support the polished core, not complicate it.

Detailed execution spec:

- `PROGRESSION_ROADMAP.md` - hybrid Command Marks plus Tower Licenses plan, band gates, backfill strategy, and regression roadmap

Targets:

- doctrines in `js/config.js:47` and `js/gameState.js:268`
- research bonuses in `js/gameState.js:241`
- research presentation and purchase flow in `js/research.js:1`
- persistent progression data in `js/save.js`

Detailed goals:

- ensure doctrines meaningfully change run strategy without becoming balance patches for weak core design
- ensure research rewards support mastery and replay without making the base game unclear
- remove or compress low-impact bonuses
- reduce bonuses that exist mainly to patch pacing issues that should instead be fixed in the core systems

### Workstream 4 - Polish map, HUD, and between-wave planning UX

The campaign should make players feel informed and in control.

Detailed goals:

- improve map-select clarity and difficulty messaging
- improve doctrine-selection meaning and legibility
- improve pre-wave threat preview usefulness
- improve boss-warning presentation
- improve post-wave feedback so players understand why a wave was easy or difficult
- improve failure readability so losses feel fair and learnable

Important design rule:

The game should increasingly answer these questions clearly:
- what is about to happen
- why this wave is dangerous
- what the boss is trying to do
- what my build is currently good or bad at
- why I lost

### Deliverables

By the end of Phase II, TowerForge should have:

- a finalized and fully supported tower roster
- a coherent campaign identity across all difficulty bands
- cleaner and more intentional wave identity design
- doctrines and research reshaped around the polished combat core
- improved UX for planning, anticipation, and post-wave understanding

### Not in scope

Phase II should not include:

- reopening multiplayer as an active product track
- restoring every frozen feature by default
- expanding the game via more maps or more towers before parity is finished
- adding new major progression systems just because the current game already has many menus

### Exit criteria

Phase II is complete only when all of the following are true:

- every retained tower has full parity across gameplay, input, UI, and audio
- the campaign difficulty bands feel distinct and readable
- players can understand wave identity without reading code-level rules
- doctrines and research enhance strategy rather than compensate for weak core design
- the campaign feels like a curated game, not a feature collection

## Phase III - Aspirational Endgame

### Goal

Build a high-replayability mastery layer on top of the polished single-player game.

### Why this phase comes last

Endgame systems are only worth deep investment when the core game is already something players want to master repeatedly.

The codebase already contains promising replay scaffolding:
- tactical events in `js/wave.js:331`
- endless mutator draft in `js/wave.js:408`
- weekly challenge flow in `js/menu.js:690`
- meta progression and weekly records in `js/gameState.js:73` and `js/save.js:75`

The purpose of Phase III is not to preserve all of that complexity blindly. The purpose is to rebuild the best pieces into a coherent mastery ecosystem.

### Workstream 1 - Rebuild endless mode around curated escalation

Endless mode should become a mastery format, not a stack of noise.

Detailed goals:

- audit the current endless mutator system
- reduce low-value mutators
- organize mutators into cleaner families
- ensure endless escalation remains readable, even as depth rises
- tie endless identity back to the polished combat and boss foundations created in earlier phases

Endless should emphasize:
- informed tradeoffs
- meaningful mutation picks
- escalating encounter identity
- boss remixes that still respect clarity
- strong run-end storytelling through final depth and final failure

### Workstream 2 - Rebuild weekly challenges around curation and identity

Weekly challenges should be a showcase mode for the polished single-player game.

Detailed goals:

- curate weekly rulesets rather than relying purely on broad system stacking
- use weekly runs to spotlight strong bosses, meaningful map identity, and fun strategic restrictions
- ensure weekly challenges feel authored and worth returning to
- keep weekly runs understandable at a glance from the menu surface

Weekly mode should answer:
- what is special this week
- what decision pattern this run rewards
- what boss or encounter identity makes this week memorable

### Workstream 3 - Build a true mastery endgame

Once the core game and replay loops are strong, TowerForge can support a more ambitious mastery layer.

Candidates include:

- apex boss variants
- advanced campaign acts or challenge chains
- curated endgame doctrine sets
- high-end solo challenge ladders
- special score or mastery medals tied to real strategic excellence

Important guardrail:

Endgame should deepen mastery, not replace it with spreadsheet complexity.

### Workstream 4 - Reevaluate deferred systems using strict re-entry criteria

Deferred systems should not return automatically.

A deferred system should only re-enter roadmap consideration if it can prove all of the following:
- it supports the polished single-player identity
- it does not weaken readability
- it does not demand a second product's worth of engineering attention
- it meaningfully improves long-term mastery or delight
- it can be supported without reopening core-combat instability

### Deliverables

By the end of Phase III, TowerForge should have:

- a clean and compelling endless mode
- curated weekly challenges that highlight the game's best design
- a meaningful mastery endgame
- a replay ecosystem that feels deep because the game is strong, not because the system count is large

### Not in scope

Phase III should not assume:

- multiplayer must return
- all frozen systems must be restored
- every existing codepath deserves permanent support
- endgame complexity is automatically good

### Exit criteria

Phase III is complete only when all of the following are true:

- replay value comes from strategic depth and encounter variety rather than rule confusion
- bosses remain the emotional and mechanical anchor of the game
- weekly and endless content feel curated and intentional
- the game still reads clearly even at high mastery levels

## Engineering Strategy

### Architecture cleanup

The codebase should be reorganized to support permanent features with permanent architecture.

Priority targets:

- break apart `js/juiceFeatures.js`
- stop relying on monkey-patching for core permanent systems where possible
- move permanent enemy behavior into the enemy system
- move permanent tower progression systems into tower- or progression-owned modules
- either give ultimates a proper architecture or keep them frozen

`js/juiceFeatures.js:776`, `js/juiceFeatures.js:817`, `js/juiceFeatures.js:948`, and `js/juiceFeatures.js:1089` are the clearest signs that feature spikes have outgrown their original temporary role.

### Combat contracts and data ownership

Combat behavior should have obvious ownership.

Recommended ownership targets:

- enemy statuses belong to the enemy/status layer
- boss abilities belong to the boss encounter layer
- tower specials belong to the tower ability or passive layer
- wave identity modifiers belong to one consistent wave-processing pipeline
- preview UI should consume the same data that gameplay uses, not a parallel fantasy description

### Spawn-pipeline unification

Every enemy that enters the battlefield should go through a unified spawn pipeline unless there is a very strong reason not to.

That includes:
- normal wave enemies
- boss-spawned adds
- bonus-wave enemies
- endless-mode spawns
- any captain or elite injection path

This is necessary because the current code already applies many kinds of transformations at spawn time, and bypassing that pipeline creates inconsistency.

### Testing strategy

Testing should move from "the feature appears" toward "the mechanic is true."

Keep:
- flow and UI coverage already present in the current Playwright suite

Add:
- deterministic boss behavior tests
- deterministic status lifecycle tests
- deterministic tower-special contract tests
- spawn-pipeline consistency tests
- regression tests for any combat bug fixed in Phase I

### Balance process

Balance work should happen after truth work, not before.

Recommended order:
- prove the mechanic
- prove the UI truth
- prove the counterplay
- then tune the numbers

The game should stop trying to balance around features that are not yet mechanically trustworthy.

## Quality Gates

A feature or system should only be considered "kept" if it passes all relevant quality gates.

### Mechanical gate

- the feature works reliably
- its runtime behavior matches its config and UI description
- it has clear ownership in code
- it has either automated coverage or a short manual verification checklist

### UX gate

- the player can understand what the feature is doing
- the feature produces readable feedback
- the feature helps decision-making rather than obscuring it

### Product gate

- the feature strengthens single-player TowerForge
- the feature earns its complexity
- the feature does not behave like a second product

### Boss gate

- the boss has a strong identity
- the boss has readable telegraphs
- the boss has counterplay
- the boss changes the strategic texture of the run
- the boss is more interesting than a stat spike

## Deferred / Removed

The following are not part of the active product roadmap unless they pass re-entry criteria later:

- multiplayer as an active development pillar
- tier-6 ultimate expansion
- further save/cloud complexity work
- additional feature-spike enemy gimmicks without strong product proof
- any campaign-layer complexity that weakens readability
- any tower special that cannot be verified and supported at full quality

## Evidence Anchors

These references are included so the roadmap remains grounded in the current codebase rather than drifting into abstract planning.

### Bosses and combat

- boss archetypes: `js/enemy.js:46`
- boss profile assignment: `js/enemy.js:310`
- boss cast and ability pipeline: `js/enemy.js:731`
- boss minion spawning: `js/enemy.js:829`
- generic boss base entry: `js/config.js:887`
- enemy status state: `js/enemy.js:146`
- freeze expiration path: `js/enemy.js:364`
- tower freeze mismatch: `js/tower.js:648`
- Solar Flare blind path: `js/tower.js:800`
- passive field slow path: `js/tower.js:902`

### Campaign and progression

- doctrines: `js/config.js:47`
- game-state doctrine application: `js/gameState.js:86`
- research bonus computation: `js/gameState.js:241`
- research UI system: `js/research.js:1`
- tactical events: `js/wave.js:331`
- endless mutator draft: `js/wave.js:408`
- factions and captains: `js/wave.js:52`, `js/wave.js:110`, `js/wave.js:609`
- maps: `js/config.js:1102`
- map path and placement logic: `js/map.js:1`

### Scope reduction targets

- multiplayer system: `js/multiplayer.js:1`
- save slots, export/import, undo, cloud payloads: `js/save.js:455`, `js/save.js:540`, `js/save.js:664`, `js/save.js:704`
- tier-6 ultimate system and hooks: `js/juiceFeatures.js:948`, `js/tower.js:1194`
- feature-spike integration hooks: `js/juiceFeatures.js:1089`

### Roster parity evidence

- 12-slot tower hotkeys: `js/input.js:483`
- reserved keys still only 1-8: `js/input.js:691`
- settings hint still says 1-8: `index.html:179`
- incomplete tower sound map: `js/tower.js:1106`

### Existing regression coverage to preserve and extend

- factions and captain auras: `tests/playwright-faction-captain-test.js:1`
- weekly challenge and endless meta flow: `tests/playwright-weekly-endless-meta-test.js:1`
- doctrine flow: `tests/playwright-doctrine-flow-test.js:1`
- tactical choice flow: `tests/playwright-tactical-choice-test.js:1`
- bonus objective flow: `tests/playwright-bonus-objective-test.js:1`
- current boss presence check baseline: `tests/playwright-skipwave-ui-test.js:442`

## Final Rule

TowerForge will not add major new systems until bosses, combat correctness, and roster parity are solved.
