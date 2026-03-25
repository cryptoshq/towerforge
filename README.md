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

Start a local PeerJS signaling server (for LAN/Radmin VPN multiplayer):

```bash
npm run peerserver
```

Primary local URL:

- `http://localhost:3000`

## Radmin VPN Multiplayer Setup

Use this when direct internet matchmaking is unstable and both players can join the same Radmin VPN network.

Host machine:

1. Join the same Radmin VPN network as your friend.
2. Run the game web server:

```bash
npm start
```

3. Run the signaling server in a second terminal:

```bash
npm run peerserver
```

4. Share your Radmin VPN IP with your friend.

Players:

1. Open the game from the host machine URL (not GitHub Pages):
   - `http://<HOST_RADMIN_IP>:3000`
2. Open **Multiplayer**.
3. In **Signaling** set mode to **Radmin VPN / LAN**.
4. Ensure server host is the host VPN IP, port is `9000`, path is `/peerjs`, and TLS is OFF for HTTP hosting.
5. Host creates room, friend joins by room code.

Important:

- If you are on `https://cryptoshq.github.io/towerforge/`, browsers block insecure `ws://` signaling. For Radmin mode, both players should use the host's `http://<HOST_RADMIN_IP>:3000` game URL.

## Test Coverage

Current regression suite includes:

- `tests/playwright-skipwave-ui-test.js`
- `tests/playwright-ui-alignment-test.js`
- `tests/playwright-keybind-settings-test.js`
- `tests/playwright-doctrine-flow-test.js`
- `tests/playwright-tactical-choice-test.js`
- `tests/playwright-bonus-objective-test.js`
- `tests/playwright-faction-captain-test.js`
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
- Pre-run doctrine selection for campaign and endless runs
- Between-wave tactical choice events with timed tradeoffs
- Objective-based bonus waves (survival and priority-target variants)
- First enemy faction package (Siege Foundry) with captain aura behavior
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
