# TowerForge — Dual Path Defense

## Project Overview

**TowerForge** is a sophisticated tower defense game with a unique dual-path upgrade system. Players defend against waves of enemies across 5 themed maps, choosing strategic upgrade paths for each tower and leveraging synergies, research, and abilities to survive increasingly difficult waves.

---

## Architecture

### Core Technologies
- **Pure HTML5/CSS3/JavaScript** — No framework dependencies
- **Canvas API** — Game rendering at 60fps
- **ES6 Classes** — Modular game systems
- **LocalStorage** — Save/load progress

### File Structure

```
index.html          — Single-page application shell
css/style.css       — All UI styling
js/
├── config.js       — Game constants, tower definitions, enemy types, maps, research tree
├── gameState.js    — Central state management (singleton object)
├── main.js         — Game loop, initialization, screen management
├── canvas.js       — Canvas setup and render orchestration
├── map.js          — Grid system, path calculation, decorations
├── enemy.js        — Enemy class with status effects, AI, death handling
├── tower.js        — Tower class with dual-path upgrades, targeting, abilities
├── projectile.js   — Projectile physics and impact handling
├── wave.js         — Wave spawning and wave modifiers
├── abilities.js    — Player abilities (Air Strike, etc.)
├── synergy.js      — Tower synergy detection and bonuses
├── research.js     — Research tree and persistent bonuses
├── achievements.js — Achievement tracking and notifications
├── effects.js      — Visual effects (explosions, beams, floating text)
├── audio.js        — Sound management
├── save.js         — Save/load system
├── input.js        — Mouse/keyboard handling
├── menu.js         — UI menu screens
├── towerRendering.js — Tower visual rendering
├── enemyRendering.js — Enemy visual rendering
├── vfxRendering.js  — Particle and effect rendering
├── uiRendering.js   — HUD and sidebar rendering
├── towerIcons.js   — Tower icon generation
├── tutorial.js     — Tutorial system
├── debug.js        — Debug overlay
├── utils.js        — Math helpers (lerp, dist, angleBetween, etc.)
├── leaderboard.js  — Score submission
```

---

## Core Game Systems

### 1. Game State (`gameState.js`)

Central state container managing all runtime data:

```javascript
GameState = {
    screen: 'menu',           // Current screen
    gamePhase: 'idle',        // idle | playing | paused | gameover | victory
    mapIndex: 0,              // Selected map
    wave: 0,                  // Current wave number
    gold: 200,                // Currency
    lives: 20,                // Health
    score: 0,                 // Points
    
    towers: [],               // All placed towers
    enemies: [],               // Active enemies
    projectiles: [],           // In-flight projectiles
    particles: [],             // Visual particles
    floatingTexts: [],         // Damage numbers
    beams: [],                 // Laser beam effects
    
    settings: {},              // Volume, difficulty, etc.
    researchBonuses: {},       // Computed from purchased research
    purchasedResearch: Set,    // Purchased research IDs
    
    stats: {}                  // Tracking for achievements
}
```

### 2. Dual Path System (`tower.js`)

Each tower has **2 upgrade paths** that diverge at Tier 3:

```
Tier 1 → Tier 2 → [CHOOSE PATH] → Tier 3 → Tier 4 → Tier 5
```

**Path Selection Rules:**
- At Tier 2→3, a **permanent modal** forces path choice
- Each path has completely different abilities
- Once chosen, path cannot be changed
- Both paths can reach Tier 5 independently

**Tower Types:**

| Tower | Cost | Role | Path A | Path B |
|-------|------|------|--------|--------|
| Arrow | 50 | Single-target DPS | Marksman (crits) | Volley (multishot) |
| Cannon | 100 | AOE Splash | Siege (big explosions) | Cluster (rapid fire) |
| Ice | 75 | Crowd Control | Deep Freeze (freeze chain) | Frostbite (damage) |
| Lightning | 120 | Chain Damage | Chain Master (max chains) | Storm Caller (stun AOE) |
| Sniper | 150 | Long-range | Assassin (execute) | Spotter (debuff) |
| Laser | 200 | Continuous | Focused Beam (ramp) | Prism (split) |
| Missile | 175 | Homing | Warhead (nuke) | Cluster (swarm) |
| Boost | 250 | Buff Aura | Amplifier (power) | Armory (economy) |

**Tier 5 Ultimate Abilities:**

Each Path B Tier 5 has a unique auto-triggering ultimate:
- Arrow Volley: `Volley Storm` — 20 arrows rain down
- Cannon Cluster: `Barrage` — 15 rapid projectiles
- Ice Frostbite: `Glacial Lance` — Line-piercing ice spear
- Lightning Storm: `Thunderstorm` — Periodic area strikes
- Sniper Spotter: `Designate All` — Mark every enemy
- Laser Prism: `Solar Flare` — Blind + damage
- Missile Cluster: `Rocket Barrage` — 20 missiles everywhere
- Boost Amplifier: `Supernova` — 3x damage buff to nearby towers

### 3. Tower Stats Calculation

Tower damage/effects are computed from multiple stacking sources:

```javascript
effectiveDamage = baseDamage
    × (1 + researchDamageMult)
    × (1 + masteryBonus)
    × (1 + xpBonus)
    × (1 + comboBonus)
    × (1 + boostBuff)
    × (1 + synergyBonus)
    × (1 + overclockBoost)      // 1.5x for 10s
    × (1 + globalDamageBuff)    // from abilities
```

### 4. Mastery System

Towers accumulate kills toward mastery ranks:

| Kills | Title | Damage | Fire Rate | Range |
|-------|-------|--------|-----------|-------|
| 25 | Veteran | +5% | — | — |
| 75 | Elite | +10% | +5% | — |
| 150 | Master | +15% | +10% | +5% |
| 300 | Legend | +20% | +15% | +10% |
| 500 | Mythic | +25% | +20% | +15% |

### 5. XP System

Towers gain XP from kills:
- Base: 10 XP per kill
- Boss kills: +50 XP
- Elite kills: +25 XP
- Scales with enemy max HP

XP Level Bonuses:
- +1% damage per level
- +0.5% fire rate per level
- +0.3% range per level

### 6. Synergy System

When specific tower types are adjacent, they gain bonuses:

| Synergy | Types | Bonus |
|---------|-------|-------|
| Thermal Shock | Cannon + Ice | +10% damage |
| Overcharge | Sniper + Lightning | +8% fire rate |
| Crossfire | Arrow + Arrow | +5% damage, +5% range |
| Superconductor | Ice + Lightning | +12% lightning damage |
| Bombardment | Cannon + Missile | +15% splash radius |
| Focus Fire | Sniper + Arrow | +10% crit chance |
| Amplified Beam | Laser + Boost | +20% beam ramp rate |

### 7. Enemy System (`enemy.js`)

**Enemy Types:**

| Type | HP | Speed | Special |
|------|-----|-------|---------|
| Grunt | 40 | 1.2 | Basic |
| Scout | 25 | 2.2 | Fast |
| Brute | 120 | 0.7 | Heavy armor |
| Medic | 50 | 1.0 | Heals allies |
| Guardian | 60 | 0.9 | Shields allies |
| Swarmling | 12 | 1.8 | Weak but many |
| Shadow | 45 | 1.5 | Periodically invisible |
| Splitter | 80 | 1.0 | Splits on death |
| Phantom | 55 | 1.3 | Phases invisible |
| Berserker | 90 | 0.9 | Enrages at low HP |
| Buzzer | 8 | 2.8 | Extremely fast swarm |
| Overlord | 800 | 0.5 | Boss with abilities |

**Status Effects:**
- Slow (Ice)
- Freeze (Ice)
- Stun (Lightning)
- Burn (Cannon)
- Poison (future expansion)
- Mark (Sniper Spotter)
- Brittle (Ice Frostbite)
- Shield (Guardian)

**Boss Abilities:**
- Periodic shield generation
- Speed burst
- Minion summoning
- Enrage at 30% HP

### 8. Wave System (`wave.js`)

Waves are procedurally generated with scaling:

```javascript
hpScale = 1 + (wave - 1) * 0.12 + mapDifficulty * 0.15
countBase = 5 + wave * 1.2 + mapDifficulty * 2
```

**Wave Patterns:**
- Wave % 10: Boss wave
- Wave % 5: Mixed hard wave
- Wave % 7: Stealth wave
- Wave % 3: Swarm wave
- Wave % 11: Splitter wave (after wave 11)
- Wave % 13: Ghost wave
- Wave % 9: Berserker wave (after wave 15)
- Wave % 8: Buzzer wave (after wave 10)
- Default: Normal wave

### 9. Research System (`research.js`)

Four research branches with 25 total nodes:

**Offense Branch:**
- Damage/fire rate bonuses
- Range upgrades
- Elemental effects
- Armor pierce
- Dual Mastery (both paths to T3)
- Apex Predator (+75 mastery kills)

**Defense Branch:**
- Starting lives
- Tower immunity
- Last Stand (dmg boost at low lives)
- Second Chance (survive at 1 life)
- Second shield charges

**Economy Branch:**
- Starting gold
- Tower cost reduction
- Interest rate
- Sell value
- Gold Rush (periodic gold drops)

**Knowledge Branch:**
- Research points bonus
- See enemy stats
- Blueprint presets
- Achievement RP
- Tower DNA (stronger mastery)

### 10. Achievement System (`achievements.js`)

40+ achievements tracking:
- Wave milestones
- Map completions
- Enemy-specific kills
- Tower mastery
- Economy achievements
- No-damage wave clears

### 11. Maps

| Map | Waves | Difficulty | Theme |
|-----|-------|------------|-------|
| Green Valley | 30 | 1 | Forest |
| Desert Pass | 35 | 2 | Desert |
| Frozen Peak | 40 | 3 | Ice |
| Volcanic Rift | 45 | 4 | Volcano |
| Shadow Realm | 50 | 5 | Shadow |

Each map has:
- Unique path layout
- Theme-specific decorations
- Difficulty-scaled enemies
- Wave count appropriate to difficulty

### 12. Difficulty Presets

| Difficulty | HP Mult | Speed Mult | Gold Mult | Starting Lives |
|------------|---------|------------|-----------|----------------|
| Easy | 0.7 | 0.9 | 1.3 | 30 |
| Normal | 1.0 | 1.0 | 1.0 | 20 |
| Hard | 1.4 | 1.15 | 0.85 | 15 |
| Nightmare | 2.0 | 1.3 | 0.7 | 10 |

---

## Game Loop

```javascript
function gameLoop(timestamp) {
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    
    // Fixed timestep for physics
    const fixedDt = Math.min(dt, 0.05);
    
    if (GameState.gamePhase === 'playing') {
        // Update at game speed (1x, 2x, 3x)
        for (let i = 0; i < GameState.gameSpeed; i++) {
            updateTowers(fixedDt);
            updateEnemies(fixedDt);
            updateProjectiles(fixedDt);
            updateWaves(fixedDt);
            updateAbilities(fixedDt);
            checkCollisions();
        }
        
        // Effects update at normal speed
        updateEffects(dt);
        updateParticles(dt);
        updateFloatingText(dt);
    }
    
    // Render (always at normal speed)
    render();
    
    requestAnimationFrame(gameLoop);
}
```

---

## Save System (`save.js`)

Persistent data saved to LocalStorage:

```javascript
{
    version: 1,
    settings: { difficulty, musicVolume, sfxVolume, ... },
    purchasedResearch: ['sharp', 'quick', ...],
    achievementsUnlocked: ['first_blood', ...],
    unlockedMaps: [true, true, false, false, false],
    mapScores: [15000, 12000, 0, 0, 0],
    mapWaveRecords: [30, 25, 0, 0, 0],
    totalPlayTime: 3600,
    lastPlayed: timestamp
}
```

---

## Input Handling (`input.js`)

**Mouse:**
- Left click: Select tower, place tower, interact
- Right click: Cancel, deselect
- Hover: Tooltip, placement preview

**Keyboard:**
- 1-8: Quick-select tower type
- Space: Start wave
- P: Pause
- Esc: Cancel/menu
- Q: Air Strike ability
- W: Lightning ability
- E: Slow ability
- R: Reinforce ability
- T: Overclock selected tower

**Touch (mobile):**
- Tap: Select/place
- Long press: Context menu
- Pinch: Zoom (future)
- Drag: Pan (future)

---

## Rendering Pipeline (`canvas.js`)

```
1. Clear canvas
2. Draw map background and decorations
3. Draw path tiles
4. Draw placement preview (if placing)
5. Draw tower range circles (if enabled)
6. Draw towers
7. Draw enemies with health bars
8. Draw projectiles
9. Draw beams (laser towers)
10. Draw particles and effects
11. Draw floating text
12. Draw HUD elements
13. Draw sidebar UI
14. Draw tooltips and modals
```

---

## Audio System (`audio.js`)

Sound effects for:
- Tower placement
- Tower firing (per type)
- Crit hits
- Enemy death
- Wave start/end
- Abilities
- UI interactions

Volume controls:
- Music: Background ambient
- SFX: All game sounds
- Global mute option

---

## UI Screens

### Main Menu
- Play (→ Difficulty → Map)
- Continue (resume last game)
- Research Lab
- Achievements
- How to Play
- Settings

### In-Game HUD
- Wave counter
- Gold display
- Lives remaining
- Score
- Game speed controls
- Pause/menu buttons

### Tower Sidebar
- Tower selection buttons
- Ability bar
- Tower info panel (when selected)

### Modals
- Path choice (permanent)
- Pause menu
- Game over
- Victory
- Endless mode prompt

---

## Performance Considerations

1. **Object Pooling**: Reuse projectile/particle objects
2. **Spatial Partitioning**: Only check collisions in range
3. **Dirty Rectangles**: Only redraw changed regions (future)
4. **Offscreen Canvas**: Pre-render static elements
5. **requestAnimationFrame**: Smooth 60fps cap
6. **Fixed Timestep**: Consistent physics regardless of frame rate

---

## Extensibility

### Adding New Towers
1. Add to `TOWERS` in `config.js`
2. Define tiers, pathA, pathB
3. Add special abilities in `tower.js`
4. Add tower icon in `towerIcons.js`
5. Add sound in `audio.js`

### Adding New Enemies
1. Add to `ENEMIES` in `config.js`
2. Define stats and special behaviors
3. Add rendering in `enemyRendering.js`

### Adding New Maps
1. Add to `MAPS` in `config.js`
2. Define waypoints array
3. Add theme decorations
4. Set wave count

### Adding New Research
1. Add node to appropriate branch in `RESEARCH`
2. Implement effect in `computeResearchBonuses()`

---

## Future Expansion Ideas

1. **Co-op Mode**: Two players defending simultaneously
2. **Custom Maps**: User-created map editor
3. **Leaderboards**: Global score submission
4. **Daily Challenges**: Randomized modifiers
5. **Skin System**: Cosmetic tower skins
6. **Replay System**: Watch recorded games
7. **Tutorial System**: Interactive guides
8. **Achievement Rewards**: Bonus RP for achievements

---

## Development Commands

```bash
npm install       # Install dependencies
npm start        # Start dev server on port 3000
npm run dev      # Alias for start
```

---

## Credits

Developed with Claude AI assistance. All game logic, art (CSS), and design created from scratch.
