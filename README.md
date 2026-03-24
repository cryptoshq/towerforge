# TowerForge

TowerForge is a browser-based tower defense game focused on readable combat, dual-path tower upgrades, boss archetypes, research progression, endless runs, weekly challenges, and high-replayability strategy.

## Highlights

- Dual-path tower upgrades with mastery and synergy systems
- Scenario-driven waves, elite enemies, and boss telegraphs
- Research tree and persistent meta progression
- Endless mode with milestone rewards and mutator drafting
- Weekly seeded challenge runs
- Playwright regression coverage for gameplay and UI

## Play Online

Once GitHub Pages finishes deploying, the live build is available at:

- `https://cryptoshq.github.io/towerforge/`

## Run Locally

Requirements:

- Node.js 18+

Install dependencies:

```bash
npm install
```

Start the local server:

```bash
npm start
```

Primary local URL:

- `http://localhost:3000`

## Test Coverage

Current regression suite includes:

- `tests/playwright-skipwave-ui-test.js`
- `tests/playwright-ui-alignment-test.js`
- `tests/playwright-keybind-settings-test.js`
- `tests/playwright-weekly-endless-meta-test.js`
- `tests/playwright-audio-stress-test.js`

Run a test directly with Node after the local server is running:

```bash
node tests/playwright-ui-alignment-test.js
```

## Project Structure

```text
assets/   Static assets
css/      Game and UI styles
js/       Core gameplay systems
tests/    Playwright regression scripts
```

## Current Gameplay Systems

- Campaign progression across difficulty bands and maps
- Endless mode with persistent best-depth tracking
- Weekly challenge generation and records
- Boss archetypes, map pressure, and scenario wave identities
- Research lab and persistent unlock-style progression
- Remappable hotkeys for core actions and abilities

## Roadmap

The execution roadmap lives in `ROADMAP.md` and currently focuses on:

- run variety and between-wave decisions
- enemy factions and captain units
- map mechanics and spatial gameplay
- tower combo/buildcraft depth
- stronger endless and weekly endgame loops

## Contributing

Use Issues for bug reports, balance feedback, and feature proposals.

When contributing:

- verify changes on `http://localhost:3000`
- keep gameplay readable under pressure
- add or update Playwright coverage for non-trivial changes
- preserve save/load stability and meta progression integrity

## License

No license file is included yet. Treat the repository as all rights reserved until a license is added.
