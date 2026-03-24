// ===== TOWER DEFENSE CONFIG — ALL GAME DATA =====
const CONFIG = {
    TILE_SIZE: 40,
    TOWER_FOOTPRINT: 14, // radius in pixels for free placement collision
    CANVAS_TILES_X: 30,
    CANVAS_TILES_Y: 18,
    STARTING_GOLD: 200,
    STARTING_LIVES: 20,
    INTEREST_RATE: 0.05,
    INTEREST_CAP: 50,
    SELL_REFUND: 0.7,
    DISMANTLE_REFUND: 0.5,
    LINK_COST: 50,
    MOVE_COST_RATIO: 0.25,
    OVERCLOCK_BOOST: 1.5,
    OVERCLOCK_DURATION: 10,
    OVERCLOCK_COOLDOWN: 5,
    WAVE_BONUS_BASE: 20,
    MASTERY: [
        { kills: 25, title: 'Veteran', dmgBonus: 0.05, rateBonus: 0, rangeBonus: 0, color: '#cd7f32' },
        { kills: 75, title: 'Elite', dmgBonus: 0.10, rateBonus: 0.05, rangeBonus: 0, color: '#c0c0c0' },
        { kills: 150, title: 'Master', dmgBonus: 0.15, rateBonus: 0.10, rangeBonus: 0.05, color: '#ffd700' },
        { kills: 300, title: 'Legend', dmgBonus: 0.20, rateBonus: 0.15, rangeBonus: 0.10, color: '#b9f2ff' },
        { kills: 500, title: 'Mythic', dmgBonus: 0.25, rateBonus: 0.20, rangeBonus: 0.15, color: '#a040ff' },
    ],
    COMBO_BONUSES: [
        { count: 2, dmg: 0.03, rate: 0 },
        { count: 3, dmg: 0.05, rate: 0 },
        { count: 5, dmg: 0.08, rate: 0.05 },
        { count: 8, dmg: 0.10, rate: 0.08 },
    ],
    TARGETING_MODES: ['closest', 'strongest', 'weakest', 'first', 'last', 'fastest'],
    GAME_SPEEDS: [1, 2, 3, 5],

    // ===== CHALLENGE MODIFIERS =====
    CHALLENGE_MODIFIERS: [
        { id: 'no_sell', name: 'No Selling', desc: 'Cannot sell towers once placed', icon: '\u{1F6AB}', rpBonus: 0.5 },
        { id: 'half_gold', name: 'Poverty', desc: 'Start with 50% less gold', icon: '\u{1F4B0}', rpBonus: 0.5 },
        { id: 'glass_cannon', name: 'Glass Cannon', desc: 'Towers deal 2x damage but have only 5 lives', icon: '\u{1F4A5}', rpBonus: 1.0 },
        { id: 'speed_run', name: 'Speed Demon', desc: 'Game runs at minimum 2x speed', icon: '\u26A1', rpBonus: 0.5 },
        { id: 'one_type', name: 'Specialist', desc: 'Can only build one type of tower', icon: '\u{1F3AF}', rpBonus: 1.0 },
        { id: 'no_upgrade', name: 'Base Only', desc: 'Cannot upgrade towers past Tier 2', icon: '\u26D4', rpBonus: 1.5 },
    ],

    // ===== PRE-RUN DOCTRINES (Phase 5) =====
    DOCTRINES: [
        {
            id: 'fortress',
            name: 'Fortress Doctrine',
            icon: '\u{1F6E1}',
            summary: 'Stabilize defense at the cost of early economy.',
            bonusText: '+8 starting lives',
            drawbackText: '-100 starting gold',
            style: {
                accent: '#5ec4ff',
                gradient: 'linear-gradient(135deg, rgba(20, 44, 78, 0.95), rgba(18, 30, 58, 0.94))',
            },
            effects: {
                startLives: 8,
                startGold: -100,
            },
        },
        {
            id: 'tempo',
            name: 'Tempo Doctrine',
            icon: '\u26A1',
            summary: 'Accelerate ability rotation for tactical momentum.',
            bonusText: '-25% ability cooldowns',
            drawbackText: '-2 starting lives, -50 starting gold',
            style: {
                accent: '#f4d06f',
                gradient: 'linear-gradient(135deg, rgba(78, 58, 20, 0.95), rgba(52, 36, 16, 0.92))',
            },
            effects: {
                abilityCooldownMult: 0.75,
                startLives: -2,
                startGold: -50,
            },
        },
        {
            id: 'greed',
            name: 'Greed Doctrine',
            icon: '\u{1F4B0}',
            summary: 'Scale income faster while surviving with fewer margins.',
            bonusText: '+2% interest, +25 interest cap',
            drawbackText: '-3 starting lives',
            style: {
                accent: '#7ee08a',
                gradient: 'linear-gradient(135deg, rgba(24, 72, 38, 0.95), rgba(18, 48, 28, 0.92))',
            },
            effects: {
                interestRateDelta: 0.02,
                interestCapDelta: 25,
                startLives: -3,
            },
        },
        {
            id: 'execution',
            name: 'Execution Doctrine',
            icon: '\u{1F3AF}',
            summary: 'Improve elite and boss takedowns while losing baseline efficiency.',
            bonusText: '+25% damage vs elite and boss enemies',
            drawbackText: '-10% global damage',
            style: {
                accent: '#ff8a8a',
                gradient: 'linear-gradient(135deg, rgba(82, 24, 24, 0.95), rgba(56, 18, 18, 0.92))',
            },
            effects: {
                eliteBossDamageMult: 1.25,
                globalDamageMult: 0.9,
            },
        },
    ],

    // ===== TOWER UPGRADE COST SCALING FORMULA CONSTANTS =====
    UPGRADE_COST_BASE_MULT: 1.5,
    UPGRADE_COST_TIER_EXP: 1.15,
    UPGRADE_COST_PATH_PENALTY: 0.1,
    UPGRADE_DISCOUNT_CAP: 0.5,
    TIER3_COST_MULT: 1.0,
    TIER4_COST_MULT: 1.5,
    TIER5_COST_MULT: 2.5,

    // ===== DIFFICULTY PRESETS =====
    DIFFICULTY_PRESETS: {
        easy: {
            name: 'Easy',
            description: 'Relaxed gameplay for new players',
            enemyHpMult: 0.7,
            enemySpeedMult: 0.9,
            enemyArmorMult: 0.5,
            goldIncomeMult: 1.3,
            startingLives: 30,
            startingGold: 300,
            waveDelayMult: 1.2,
            bossHpMult: 0.6,
            interestRateMult: 1.2,
            sellRefundMult: 1.1,
            scoreMultiplier: 0.5,
            rpMultiplier: 0.75,
            color: '#40e080',
        },
        normal: {
            name: 'Normal',
            description: 'The standard tower defense experience',
            enemyHpMult: 1.0,
            enemySpeedMult: 1.0,
            enemyArmorMult: 1.0,
            goldIncomeMult: 1.0,
            startingLives: 20,
            startingGold: 200,
            waveDelayMult: 1.0,
            bossHpMult: 1.0,
            interestRateMult: 1.0,
            sellRefundMult: 1.0,
            scoreMultiplier: 1.0,
            rpMultiplier: 1.0,
            color: '#e0c040',
        },
        hard: {
            name: 'Hard',
            description: 'Punishing difficulty for experienced players',
            enemyHpMult: 1.4,
            enemySpeedMult: 1.15,
            enemyArmorMult: 1.3,
            goldIncomeMult: 0.85,
            startingLives: 15,
            startingGold: 150,
            waveDelayMult: 0.85,
            bossHpMult: 1.5,
            interestRateMult: 0.9,
            sellRefundMult: 0.9,
            scoreMultiplier: 1.5,
            rpMultiplier: 1.3,
            color: '#e06040',
        },
        nightmare: {
            name: 'Nightmare',
            description: 'Nearly impossible — only the best survive',
            enemyHpMult: 2.0,
            enemySpeedMult: 1.3,
            enemyArmorMult: 1.8,
            goldIncomeMult: 0.7,
            startingLives: 10,
            startingGold: 100,
            waveDelayMult: 0.7,
            bossHpMult: 2.5,
            interestRateMult: 0.75,
            sellRefundMult: 0.8,
            scoreMultiplier: 3.0,
            rpMultiplier: 2.0,
            color: '#c020e0',
        },
    },

    // ===== COLOR PALETTE CONSTANTS =====
    COLORS: {
        // UI colors
        uiBackground: '#1a1a2e',
        uiBackgroundLight: '#222244',
        uiPanel: '#16213e',
        uiBorder: '#333366',
        uiBorderLight: '#4a4a7a',
        uiText: '#ddddee',
        uiTextDim: '#888899',
        uiTextBright: '#ffffff',
        uiAccent: '#60d0e0',
        uiAccentHover: '#80e0f0',
        uiWarning: '#e0a030',
        uiDanger: '#e04040',
        uiSuccess: '#40e080',

        // Gold display colors
        goldText: '#ffd700',
        goldDark: '#b8960f',
        goldGlow: '#ffe44d',

        // Health bar colors
        hpFull: '#40e040',
        hpMid: '#e0e040',
        hpLow: '#e04040',
        hpBackground: '#1a1a1a',
        hpBorder: '#333333',

        // Damage type colors
        physicalDamage: '#e04040',
        iceDamage: '#60d0e0',
        lightningDamage: '#e0e040',
        fireDamage: '#ff6020',
        poisonDamage: '#40e040',

        // Status effect colors
        frozen: '#80e0ff',
        stunned: '#ffe040',
        slowed: '#6090e0',
        burning: '#ff4020',
        marked: '#ff60a0',
        shielded: '#4080e0',
        healed: '#40ff80',
        berserking: '#ff2020',

        // Mastery colors
        mastery_veteran: '#cd7f32',
        mastery_elite: '#c0c0c0',
        mastery_master: '#ffd700',
        mastery_legend: '#b9f2ff',
        mastery_mythic: '#a040ff',

        // Map theme base colors
        theme_forest: '#243824',
        theme_desert: '#3a3525',
        theme_ice: '#202838',
        theme_volcano: '#301818',
        theme_shadow: '#181028',
    },

    // ===== ANIMATION TIMING CONSTANTS =====
    ANIMATION: {
        // Floating text
        floatTextDuration: 1.2,
        floatTextSpeed: 40,
        floatTextFadeStart: 0.7,

        // Explosions
        explosionDuration: 0.5,
        explosionExpandSpeed: 3,
        explosionFadeSpeed: 2,

        // Projectiles
        projectileSpeed: 300,
        homingTurnRate: 8,
        projectileTrailLength: 5,

        // Tower animations
        towerFireFlash: 0.1,
        towerRecoilAmount: 3,
        towerRecoilSpeed: 15,

        // Enemy animations
        enemyHitFlash: 0.15,
        enemyDeathDuration: 0.3,
        enemySpawnFade: 0.5,

        // UI animations
        panelSlideSpeed: 400,
        tooltipFadeSpeed: 0.2,
        buttonHoverScale: 1.05,
        waveAnnounceDuration: 2.0,

        // Screen effects
        screenShakeDuration: 0.3,
        screenShakeDecay: 5,
        screenFlashDuration: 0.5,

        // Beam effects
        beamPulseRate: 3,
        beamWidth: 3,
        beamGlowWidth: 8,

        // Overclock
        overclockPulseRate: 2,
        overclockGlowSize: 5,

        // Mastery
        masteryUpEffect: 1.5,
        masteryGlowPulse: 1.5,
    },

    // ===== UI LAYOUT CONSTANTS =====
    UI: {
        // Sidebar
        sidebarWidth: 200,
        sidebarPadding: 8,
        towerButtonHeight: 54,
        towerButtonMargin: 4,
        towerButtonIconSize: 36,

        // HUD bar
        hudHeight: 40,
        hudPadding: 10,
        hudFontSize: 14,
        hudIconSize: 20,

        // Tower info panel
        infoWidth: 220,
        infoPadding: 12,
        infoTitleSize: 16,
        infoTextSize: 12,
        infoStatRowHeight: 20,

        // Ability bar
        abilityBarHeight: 50,
        abilityIconSize: 40,
        abilityGap: 8,
        abilityCooldownFontSize: 12,

        // Wave progress bar
        waveBarHeight: 6,
        waveBarWidth: 200,
        waveBarBorderRadius: 3,

        // Tooltip
        tooltipMaxWidth: 200,
        tooltipPadding: 8,
        tooltipFontSize: 12,
        tooltipBorderRadius: 6,
        tooltipOffsetX: 15,
        tooltipOffsetY: -10,

        // Context menu
        contextMenuWidth: 160,
        contextMenuItemHeight: 28,
        contextMenuFontSize: 13,

        // Minimap
        minimapSize: 120,
        minimapPadding: 4,
        minimapOpacity: 0.7,

        // Margins and spacing
        panelGap: 8,
        sectionGap: 12,
        elementSpacing: 4,
    },
};

// ===== TOWER DEFINITIONS =====
const TOWERS = {
    arrow: {
        name: 'Arrow Tower', nickname: 'Ranger',
        baseCost: 50, key: '1',
        color: '#2d8a4e', iconColor: '#3ab06a',
        description: 'Fast-firing single target damage',
        tiers: {
            1: { damage: 10, range: 120, fireRate: 0.5, special: null },
            2: { damage: 18, range: 135, fireRate: 0.45, special: null, cost: 75 },
        },
        pathA: {
            name: 'Marksman', desc: 'Precision single-target sniper',
            icon: '\u{1F3AF}',
            tiers: {
                3: { damage: 35, range: 160, fireRate: 0.5, cost: 100,
                    special: { critChance: 0.15, critMult: 2 },
                    desc: '15% crit chance (2x damage)' },
                4: { damage: 60, range: 180, fireRate: 0.45, cost: 150,
                    special: { critChance: 0.25, critMult: 3, armorPierce: 0.5 },
                    desc: '25% crit (3x), 50% armor pierce' },
                5: { damage: 120, range: 220, fireRate: 0.4, cost: 250,
                    special: { critChance: 0.35, critMult: 4, armorPierce: 0.5, perfectShot: true, perfectShotEvery: 5, executeThreshold: 0.2 },
                    desc: '35% crit (4x), Perfect Shot every 5th hit' },
            }
        },
        pathB: {
            name: 'Volley', desc: 'Multi-shot crowd control',
            icon: '\u{1F3F9}',
            tiers: {
                3: { damage: 12, range: 120, fireRate: 0.5, cost: 100,
                    special: { multishot: 2 },
                    desc: 'Fires 2 arrows at different targets' },
                4: { damage: 15, range: 130, fireRate: 0.45, cost: 150,
                    special: { multishot: 3, pierce: 1 },
                    desc: '3 arrows, each pierces 1 enemy' },
                5: { damage: 18, range: 140, fireRate: 0.4, cost: 250,
                    special: { multishot: 5, pierce: 2, volleyStorm: true, volleyCd: 8, volleyArrows: 20, volleyDuration: 2 },
                    desc: '5 arrows pierce 2, Volley Storm every 8s' },
            }
        },
    },
    cannon: {
        name: 'Cannon Tower', nickname: 'Artillery',
        baseCost: 100, key: '2',
        color: '#6a5a4a', iconColor: '#8a7a6a',
        description: 'Slow-firing AOE splash damage',
        tiers: {
            1: { damage: 30, range: 100, fireRate: 1.5, splash: 40, special: null },
            2: { damage: 50, range: 110, fireRate: 1.4, splash: 50, special: null, cost: 150 },
        },
        pathA: {
            name: 'Siege Cannon', desc: 'Massive single explosions',
            icon: '\u{1F4A3}',
            tiers: {
                3: { damage: 100, range: 120, fireRate: 1.8, splash: 70, cost: 200,
                    special: { centerBonus: 2, centerRadius: 20 },
                    desc: '2x damage in center blast radius' },
                4: { damage: 200, range: 130, fireRate: 2.0, splash: 90, cost: 300,
                    special: { centerBonus: 3, centerRadius: 30, burnDPS: 10, burnDuration: 3 },
                    desc: '3x center, leaves fire for 3s' },
                5: { damage: 450, range: 150, fireRate: 2.5, splash: 120, cost: 500,
                    special: { centerBonus: 5, centerRadius: 40, burnDPS: 20, burnDuration: 5, devastation: true, devEvery: 4, devBonusDmg: 300, devStun: 1 },
                    desc: '5x center, Devastation Round every 4th shot' },
            }
        },
        pathB: {
            name: 'Cluster Cannon', desc: 'Multiple rapid explosions',
            icon: '\u{1F4A5}',
            tiers: {
                3: { damage: 25, range: 110, fireRate: 1.3, splash: 35, cost: 200,
                    special: { multiShot: 2 },
                    desc: 'Fires 2 projectiles rapidly' },
                4: { damage: 30, range: 115, fireRate: 1.2, splash: 40, cost: 300,
                    special: { multiShot: 3, staggerChance: 0.3, staggerSlow: 0.3 },
                    desc: '3 projectiles, 30% stagger chance' },
                5: { damage: 35, range: 120, fireRate: 1.0, splash: 45, cost: 500,
                    special: { multiShot: 5, staggerChance: 0.35, staggerSlow: 0.3, barrage: true, barrageCd: 6, barrageCount: 15, barrageDuration: 3 },
                    desc: '5 projectiles, Barrage every 6s' },
            }
        },
    },
    ice: {
        name: 'Ice Tower', nickname: 'Cryo',
        baseCost: 75, key: '3',
        color: '#3a8aa0', iconColor: '#60d0e0',
        description: 'Crowd control through slowing',
        tiers: {
            1: { damage: 8, range: 100, fireRate: 0.8, special: { slow: 0.3, slowDuration: 1.5 } },
            2: { damage: 12, range: 110, fireRate: 0.75, special: { slow: 0.4, slowDuration: 2 }, cost: 100 },
        },
        pathA: {
            name: 'Deep Freeze', desc: 'Maximum crowd control',
            icon: '\u{2744}',
            tiers: {
                3: { damage: 15, range: 120, fireRate: 0.7, cost: 150,
                    special: { slow: 0.5, slowDuration: 2.5, freezeChance: 0.15, freezeDuration: 1.5 },
                    desc: '50% slow, 15% chance to freeze 1.5s' },
                4: { damage: 20, range: 130, fireRate: 0.65, cost: 225,
                    special: { slow: 0.6, slowDuration: 3, freezeChance: 0.25, freezeDuration: 2, freezeVulnerable: 0.2, freezeChain: 1 },
                    desc: '25% freeze, chains to 1, frozen +20% dmg' },
                5: { damage: 30, range: 140, fireRate: 0.6, cost: 375,
                    special: { slow: 0.7, slowDuration: 3.5, freezeChance: 0.4, freezeDuration: 2.5, freezeVulnerable: 0.3, freezeChain: 3, shatterDmg: 50, absoluteZero: true, azCd: 12, azDuration: 3 },
                    desc: '40% freeze, chains 3, Absolute Zero every 12s' },
            }
        },
        pathB: {
            name: 'Frostbite', desc: 'Ice as damage source',
            icon: '\u{1F9CA}',
            tiers: {
                3: { damage: 25, range: 100, fireRate: 0.7, cost: 150,
                    special: { slow: 0.3, slowDuration: 1.5, frozenDmgMult: 3, icePatch: true },
                    desc: 'Frozen take 3x damage, ice on ground' },
                4: { damage: 45, range: 110, fireRate: 0.65, cost: 225,
                    special: { slow: 0.3, slowDuration: 2, frozenDmgMult: 4, icePatch: true, brittleChance: 0.1, brittleVuln: 0.5, brittleDuration: 5 },
                    desc: '4x frozen dmg, 10% Brittle (+50% dmg)' },
                5: { damage: 80, range: 120, fireRate: 0.6, cost: 375,
                    special: { slow: 0.3, slowDuration: 2, frozenDmgMult: 5, icePatch: true, brittleChance: 0.2, brittleVuln: 0.5, brittleDuration: 5, shatterDmg: 100, shatterRadius: 60, glacialLance: true, lanceCd: 10, lanceDmg: 200, canFreezeBoss: true },
                    desc: '5x frozen, Glacial Lance every 10s' },
            }
        },
    },
    lightning: {
        name: 'Lightning Tower', nickname: 'Tesla',
        baseCost: 120, key: '4',
        color: '#8a8a2a', iconColor: '#e0e040',
        description: 'Multi-target chaining damage',
        tiers: {
            1: { damage: 15, range: 110, fireRate: 0.9, special: { chains: 2 } },
            2: { damage: 22, range: 120, fireRate: 0.85, special: { chains: 3 }, cost: 180 },
        },
        pathA: {
            name: 'Chain Master', desc: 'Maximum chaining',
            icon: '\u{26A1}',
            tiers: {
                3: { damage: 25, range: 125, fireRate: 0.8, cost: 270,
                    special: { chains: 5, chainRange: 150, chainFalloff: 0.85 },
                    desc: 'Chains to 5 enemies' },
                4: { damage: 30, range: 130, fireRate: 0.75, cost: 405,
                    special: { chains: 7, chainRange: 150, chainFalloff: 0.9, arcSurge: 0.1 },
                    desc: '7 chains, 90% dmg kept, 10% Arc Surge' },
                5: { damage: 40, range: 140, fireRate: 0.7, cost: 675,
                    special: { chains: 10, chainRange: 150, chainFalloff: 0.95, arcSurge: 0.2, overload: true, overloadCd: 8, overloadRange: 200 },
                    desc: '10 chains, Overload every 8s hits ALL' },
            }
        },
        pathB: {
            name: 'Storm Caller', desc: 'AOE lightning damage',
            icon: '\u{26C8}',
            tiers: {
                3: { damage: 35, range: 120, fireRate: 1.0, cost: 270,
                    special: { stunChance: 0.15, stunDuration: 0.5 },
                    desc: '15% stun chance (0.5s)' },
                4: { damage: 55, range: 130, fireRate: 0.95, cost: 405,
                    special: { stunChance: 0.25, stunDuration: 0.75, splashDmg: 0.5, splashRadius: 40 },
                    desc: '25% stun, 50% splash in 40 radius' },
                5: { damage: 85, range: 140, fireRate: 0.9, cost: 675,
                    special: { stunChance: 0.35, stunDuration: 1.0, splashDmg: 0.75, splashRadius: 60, thunderstorm: true, stormCd: 10, stormDuration: 5, stormRadius: 100, stormDmg: 30, stormInterval: 0.3 },
                    desc: '35% stun, Thunderstorm every 10s' },
            }
        },
    },
    sniper: {
        name: 'Sniper Tower', nickname: 'Deadeye',
        baseCost: 150, key: '5',
        color: '#2a5a2a', iconColor: '#3a8a3a',
        description: 'Long-range high single-target damage',
        tiers: {
            1: { damage: 50, range: 200, fireRate: 2.0, special: null },
            2: { damage: 80, range: 220, fireRate: 1.9, special: null, cost: 200 },
        },
        pathA: {
            name: 'Assassin', desc: 'Maximum single-target devastation',
            icon: '\u{1F52B}',
            tiers: {
                3: { damage: 150, range: 250, fireRate: 1.8, cost: 300,
                    special: { armorPierce: 0.5, instantKill: 0.1 },
                    desc: '50% armor pierce, 10% instant kill' },
                4: { damage: 280, range: 280, fireRate: 1.7, cost: 450,
                    special: { armorPierce: 1.0, instantKill: 0.15, bossDmgMult: 2 },
                    desc: 'Ignores all armor, 15% kill, 2x boss dmg' },
                5: { damage: 500, range: 320, fireRate: 1.5, cost: 750,
                    special: { armorPierce: 1.0, instantKill: 0.25, bossDmgMult: 3, markedForDeath: true, markCd: 6, markDmg: 1000 },
                    desc: '25% kill, 3x boss, Marked for Death' },
            }
        },
        pathB: {
            name: 'Spotter', desc: 'Utility/debuffer sniper',
            icon: '\u{1F50D}',
            tiers: {
                3: { damage: 80, range: 250, fireRate: 2.0, cost: 300,
                    special: { markVuln: 0.25, markDuration: 5, seeInvisible: true },
                    desc: 'Marks targets: +25% dmg from all, 5s' },
                4: { damage: 120, range: 280, fireRate: 1.9, cost: 450,
                    special: { markVuln: 0.4, markDuration: 6, seeInvisible: true, revealPermanent: true, markSlow: 0.2 },
                    desc: '40% mark, reveals invis, 20% slow' },
                5: { damage: 180, range: 320, fireRate: 1.8, cost: 750,
                    special: { markVuln: 0.6, markDuration: 8, seeInvisible: true, revealPermanent: true, markSlow: 0.3, areaMarkVuln: 0.3, areaMarkRadius: 60, designate: true, desCd: 10, desDuration: 3 },
                    desc: '60% mark, area mark, Designate All' },
            }
        },
    },
    laser: {
        name: 'Laser Tower', nickname: 'Photon',
        baseCost: 200, key: '6',
        color: '#8a2a3a', iconColor: '#e04060',
        description: 'Continuous beam, ramps up on same target',
        tiers: {
            1: { damage: 15, range: 130, fireRate: 0, special: { beam: true, dps: 15 } },
            2: { damage: 22, range: 145, fireRate: 0, special: { beam: true, dps: 22 }, cost: 280 },
        },
        pathA: {
            name: 'Focused Beam', desc: 'Maximum single-target DPS',
            icon: '\u{1F506}',
            tiers: {
                3: { damage: 35, range: 155, fireRate: 0, cost: 400,
                    special: { beam: true, dps: 35, rampRate: 0.05, rampMax: 0.5 },
                    desc: '+5% DPS/sec on same target (max 50%)' },
                4: { damage: 55, range: 165, fireRate: 0, cost: 600,
                    special: { beam: true, dps: 55, rampRate: 0.08, rampMax: 0.8, burnDPS: 10, burnDuration: 3 },
                    desc: '+8%/s (max 80%), burn 3s after beam stops' },
                5: { damage: 90, range: 180, fireRate: 0, cost: 1000,
                    special: { beam: true, dps: 90, rampRate: 0.12, rampMax: 1.5, burnDPS: 20, burnDuration: 5, pierceAtMax: true, pierceDmg: 0.5, deathRay: true, drayCd: 15, drayDuration: 5, drayDPS: 300 },
                    desc: '+12%/s (max 150%), Death Ray every 15s' },
            }
        },
        pathB: {
            name: 'Prism', desc: 'Multi-target beam splitting',
            icon: '\u{1F48E}',
            tiers: {
                3: { damage: 12, range: 140, fireRate: 0, cost: 400,
                    special: { beam: true, dps: 12, beamSplit: 2, splitDmg: 0.5 },
                    desc: 'Beam splits to 2 targets (50% each)' },
                4: { damage: 15, range: 150, fireRate: 0, cost: 600,
                    special: { beam: true, dps: 15, beamSplit: 3, splitDmg: 0.5, meltdown: 2 },
                    desc: '3 beams, removes 2 armor/sec' },
                5: { damage: 20, range: 160, fireRate: 0, cost: 1000,
                    special: { beam: true, dps: 20, beamSplit: 5, splitDmg: 0.5, meltdown: 5, energyField: true, fieldSlow: 0.2, solarFlare: true, flareCd: 10, flareDmg: 200, flareRadius: 100, blindDuration: 3 },
                    desc: '5 beams, energy field, Solar Flare' },
            }
        },
    },
    missile: {
        name: 'Missile Tower', nickname: 'Valkyrie',
        baseCost: 175, key: '7',
        color: '#5a5a6a', iconColor: '#8a8a9a',
        description: 'Homing missiles, versatile AOE',
        tiers: {
            1: { damage: 25, range: 150, fireRate: 1.2, special: { homing: true } },
            2: { damage: 40, range: 160, fireRate: 1.1, special: { homing: true }, cost: 250 },
        },
        pathA: {
            name: 'Warhead', desc: 'Massive single-target missiles',
            icon: '\u{1F680}',
            tiers: {
                3: { damage: 80, range: 170, fireRate: 1.3, cost: 375,
                    special: { homing: true, critChance: 0.2, critMult: 2 },
                    desc: '20% crit (2x), aggressive tracking' },
                4: { damage: 140, range: 180, fireRate: 1.2, cost: 560,
                    special: { homing: true, critChance: 0.3, critMult: 2.5, armorPierce: 0.5 },
                    desc: '30% crit (2.5x), 50% armor pierce' },
                5: { damage: 250, range: 200, fireRate: 1.1, cost: 940,
                    special: { homing: true, critChance: 0.4, critMult: 3, armorPierce: 1.0, splitOnHit: 2, splitDmg: 0.5, tacticalNuke: true, nukeCd: 8, nukeDmg: 800, nukeRadius: 120, nukeStun: 1.5 },
                    desc: '40% crit, splits on hit, Tactical Nuke' },
            }
        },
        pathB: {
            name: 'Cluster', desc: 'Multi-target swarming missiles',
            icon: '\u{1F387}',
            tiers: {
                3: { damage: 20, range: 155, fireRate: 1.0, cost: 375,
                    special: { homing: true, multiMissile: 3 },
                    desc: 'Fires 3 missiles at different targets' },
                4: { damage: 25, range: 160, fireRate: 0.9, cost: 560,
                    special: { homing: true, multiMissile: 4, concussChance: 0.25, concussDuration: 0.3 },
                    desc: '4 missiles, 25% concuss (0.3s stun)' },
                5: { damage: 30, range: 170, fireRate: 0.8, cost: 940,
                    special: { homing: true, multiMissile: 6, concussChance: 0.35, concussDuration: 0.5, retarget: true, rocketBarrage: true, barrageCd: 10, barrageCount: 20, barrageDuration: 3 },
                    desc: '6 missiles retarget, Rocket Barrage' },
            }
        },
    },
    boost: {
        name: 'Boost Tower', nickname: 'Catalyst',
        baseCost: 250, key: '8',
        color: '#8a7a20', iconColor: '#e0c030',
        description: 'Buffs nearby towers (no attack)',
        tiers: {
            1: { damage: 0, range: 80, fireRate: 0, special: { aura: true, dmgBuff: 0.10, rateBuff: 0, rangeBuff: 0 } },
            2: { damage: 0, range: 100, fireRate: 0, special: { aura: true, dmgBuff: 0.15, rateBuff: 0.05, rangeBuff: 0 }, cost: 350 },
        },
        pathA: {
            name: 'Amplifier', desc: 'Tower buff specialist',
            icon: '\u{1F4E1}',
            tiers: {
                3: { damage: 0, range: 120, fireRate: 0, cost: 500,
                    special: { aura: true, dmgBuff: 0.25, rateBuff: 0.10, rangeBuff: 0.10 },
                    desc: '+25% dmg, +10% rate & range to allies' },
                4: { damage: 0, range: 140, fireRate: 0, cost: 750,
                    special: { aura: true, dmgBuff: 0.35, rateBuff: 0.15, rangeBuff: 0.15, critBuff: 0.10 },
                    desc: '+35% dmg, +15% rate/range, +10% crit' },
                5: { damage: 0, range: 160, fireRate: 0, cost: 1250,
                    special: { aura: true, dmgBuff: 0.50, rateBuff: 0.20, rangeBuff: 0.20, critBuff: 0.15, splashBuff: true, splashDmgRatio: 0.2, splashRadius: 30, supernova: true, snovaCd: 15, snovaDuration: 3, snovaMult: 3 },
                    desc: '+50% all, splash buff, Supernova x3' },
            }
        },
        pathB: {
            name: 'Armory', desc: 'Economy and utility support',
            icon: '\u{1F3EA}',
            tiers: {
                3: { damage: 0, range: 120, fireRate: 0, cost: 500,
                    special: { aura: true, dmgBuff: 0.10, rateBuff: 0, rangeBuff: 0, goldPerWave: 3, upgradeDiscount: 0.15 },
                    desc: '+3 gold/wave, 15% upgrade discount' },
                4: { damage: 0, range: 140, fireRate: 0, cost: 750,
                    special: { aura: true, dmgBuff: 0.10, rateBuff: 0, rangeBuff: 0, goldPerWave: 8, upgradeDiscount: 0.25, sellBonus: 0.20 },
                    desc: '+8 gold/wave, 25% discount, +20% sell' },
                5: { damage: 0, range: 160, fireRate: 0, cost: 1250,
                    special: { aura: true, dmgBuff: 0.15, rateBuff: 0, rangeBuff: 0, goldPerWave: 15, upgradeDiscount: 0.35, sellBonus: 0.30, supplyDrop: true, supplyGold: 25, blackMarket: true, bmCd: 30 },
                    desc: '+15 gold/wave, Supply Drop, Black Market' },
            }
        },
    },
};

// Helper to get total cost for a tower at a given tier/path
function getTowerTotalCost(type, tier, path) {
    const def = TOWERS[type];
    let total = def.baseCost;
    if (tier >= 2) total += def.tiers[2].cost || 0;
    if (tier >= 3) {
        const p = path === 'A' ? def.pathA : def.pathB;
        total += p.tiers[3].cost;
        if (tier >= 4) total += p.tiers[4].cost;
        if (tier >= 5) total += p.tiers[5].cost;
    }
    return total;
}

// Helper to calculate scaled upgrade cost based on difficulty and research
function getScaledUpgradeCost(baseCost, tier, difficulty) {
    const preset = CONFIG.DIFFICULTY_PRESETS[difficulty] || CONFIG.DIFFICULTY_PRESETS.normal;
    let scaledCost = baseCost;
    if (tier >= 3) scaledCost *= CONFIG.TIER3_COST_MULT;
    if (tier >= 4) scaledCost *= CONFIG.TIER4_COST_MULT;
    if (tier >= 5) scaledCost *= CONFIG.TIER5_COST_MULT;
    return Math.floor(scaledCost);
}

// ===== ENEMY TYPES =====
const ENEMIES = {
    basic: { name: 'Grunt', hp: 40, speed: 1.2, armor: 0, reward: 5, size: 10, color: '#e04040', desc: 'Standard enemy' },
    fast: { name: 'Scout', hp: 25, speed: 2.2, armor: 0, reward: 6, size: 8, color: '#40e0e0', desc: 'Fast but fragile' },
    heavy: { name: 'Brute', hp: 120, speed: 0.7, armor: 3, reward: 12, size: 14, color: '#8a6a4a', desc: 'Slow, heavy armor' },
    healer: { name: 'Medic', hp: 50, speed: 1.0, armor: 0, reward: 15, size: 10, color: '#40e040', desc: 'Heals nearby enemies',
        healRadius: 80, healRate: 5, healInterval: 1.0, healPulseColor: '#80ff80' },
    shield: { name: 'Guardian', hp: 60, speed: 0.9, armor: 0, reward: 12, size: 12, color: '#4080e0', desc: 'Shields nearby enemies' },
    swarm: { name: 'Swarmling', hp: 12, speed: 1.8, armor: 0, reward: 2, size: 6, color: '#e0e040', desc: 'Weak but numerous' },
    stealth: { name: 'Shadow', hp: 45, speed: 1.5, armor: 0, reward: 10, size: 9, color: '#8040a0', desc: 'Periodically invisible' },
    boss: { name: 'Overlord', hp: 800, speed: 0.5, armor: 5, reward: 100, size: 20, color: '#ff2020', desc: 'Massive boss enemy', isBoss: true },

    // New enemy types
    splitter: {
        name: 'Splitter', hp: 80, speed: 1.0, armor: 1, reward: 10, size: 12, color: '#e0a040',
        desc: 'Splits into 2 smaller copies on death',
        splitCount: 2, splitHpRatio: 0.4, splitSpeedMult: 1.3, splitSizeRatio: 0.6,
        splitReward: 3, splitColor: '#d09030',
    },
    ghost: {
        name: 'Phantom', hp: 55, speed: 1.3, armor: 0, reward: 12, size: 9, color: '#a060d0',
        desc: 'Periodically phases invisible and takes reduced damage',
        phaseInterval: 4.0, phaseDuration: 2.0, phaseReduction: 0.8,
        phaseColor: 'rgba(160, 96, 208, 0.3)', phaseGlowColor: '#c080e0',
    },
    berserker: {
        name: 'Berserker', hp: 90, speed: 0.9, armor: 1, reward: 14, size: 13, color: '#e02020',
        desc: 'Enrages at low health — speeds up and gains armor',
        enrageThreshold: 0.4, enrageSpeedMult: 2.0, enrageArmorBonus: 3,
        enrageColor: '#ff4040', enrageGlowColor: '#ff0000', enrageSizeMult: 1.15,
    },
    swarmfast: {
        name: 'Buzzer', hp: 8, speed: 2.8, armor: 0, reward: 1, size: 5, color: '#c0e040',
        desc: 'Extremely fast swarm unit — nearly impossible to hit one-by-one',
        spawnGroupSize: 15, spawnDelay: 0.1, zigzagAmplitude: 8, zigzagFrequency: 4,
    },
    disruptor: {
        name: 'Disruptor', hp: 70, speed: 1.25, armor: 1, reward: 16, size: 11, color: '#ff9a6a',
        desc: 'Emits EMP pulses that disable nearby towers briefly',
        disruptRadius: 150, disruptDuration: 1.5, disruptInterval: 2.8,
    },
    toxic: {
        name: 'Toxic Carrier', hp: 65, speed: 1.05, armor: 0, reward: 15, size: 11, color: '#80d060',
        desc: 'Releases corrosive fumes that reduce nearby tower damage',
        toxicRadius: 140, toxicDuration: 2.8, toxicInterval: 3.2, toxicDamageMult: 0.8,
    },
};

// ===== WAVE DEFINITIONS (per map, auto-generated from templates) =====
// Each difficulty group has its own unique enemy pool and wave patterns
function generateWaves(mapIndex, waveCount) {
    const waves = [];
    const diffGroup = Math.floor(mapIndex / 5);

    for (let w = 1; w <= waveCount; w++) {
        const wave = { enemies: [], delay: 0.6 };
        const diff = diffGroup * 0.3 + (mapIndex % 5) * 0.06;
        const hpScale = 1 + (w - 1) * 0.12 + diff * 0.15;
        const countBase = Math.floor(5 + w * 1.2 + diff * 2);

        if (diffGroup === 0) {
            // ===== EASY: Grunt, Scout, Swarmling, Medic, Boss =====
            if (w % 10 === 0) {
                wave.enemies.push({ type: 'boss', count: 1, hpMult: hpScale * 1.2, delay: 2.0 });
                wave.enemies.push({ type: 'basic', count: Math.floor(countBase * 0.3), hpMult: hpScale, delay: 0.6 });
            } else if (w % 5 === 0) {
                // Medic-supported push
                wave.enemies.push({ type: 'basic', count: Math.floor(countBase * 0.5), hpMult: hpScale, delay: 0.5 });
                wave.enemies.push({ type: 'healer', count: 1 + Math.floor(w / 15), hpMult: hpScale, delay: 1.0 });
                wave.enemies.push({ type: 'fast', count: Math.floor(countBase * 0.2), hpMult: hpScale * 0.7, delay: 0.4 });
            } else if (w % 3 === 0) {
                // Swarm wave
                wave.enemies.push({ type: 'swarm', count: countBase * 2, hpMult: hpScale * 0.5, delay: 0.2 });
            } else if (w % 7 === 0) {
                // Scout rush
                wave.enemies.push({ type: 'fast', count: Math.floor(countBase * 0.7), hpMult: hpScale * 0.8, delay: 0.35 });
                wave.enemies.push({ type: 'swarm', count: Math.floor(countBase * 0.5), hpMult: hpScale * 0.4, delay: 0.2 });
            } else {
                // Standard grunts + scouts
                wave.enemies.push({ type: 'basic', count: countBase, hpMult: hpScale, delay: 0.5 });
                if (w > 3) wave.enemies.push({ type: 'fast', count: Math.floor(countBase * 0.25), hpMult: hpScale * 0.7, delay: 0.4 });
            }

        } else if (diffGroup === 1) {
            // ===== NORMAL: Grunt, Brute, Guardian, Medic, Splitter, Boss =====
            if (w % 10 === 0) {
                wave.enemies.push({ type: 'boss', count: 1 + Math.floor(w / 25), hpMult: hpScale * 1.5, delay: 2.0 });
                wave.enemies.push({ type: 'heavy', count: Math.floor(countBase * 0.3), hpMult: hpScale, delay: 0.8 });
            } else if (w % 5 === 0) {
                // Armored push with healer support
                wave.enemies.push({ type: 'heavy', count: Math.floor(countBase * 0.4), hpMult: hpScale, delay: 0.8 });
                wave.enemies.push({ type: 'shield', count: Math.floor(countBase * 0.2), hpMult: hpScale, delay: 0.9 });
                wave.enemies.push({ type: 'healer', count: 2, hpMult: hpScale, delay: 1.0 });
            } else if (w % 7 === 0) {
                // Guardian wall
                wave.enemies.push({ type: 'shield', count: Math.floor(countBase * 0.5), hpMult: hpScale * 1.2, delay: 0.7 });
                wave.enemies.push({ type: 'basic', count: Math.floor(countBase * 0.3), hpMult: hpScale, delay: 0.5 });
            } else if (w % 11 === 0) {
                // Splitter wave
                wave.enemies.push({ type: 'splitter', count: Math.floor(countBase * 0.5), hpMult: hpScale, delay: 0.8 });
                wave.enemies.push({ type: 'heavy', count: Math.floor(countBase * 0.2), hpMult: hpScale, delay: 0.8 });
            } else if (w % 3 === 0) {
                // Brute march
                wave.enemies.push({ type: 'heavy', count: Math.floor(countBase * 0.4), hpMult: hpScale, delay: 0.9 });
                wave.enemies.push({ type: 'basic', count: Math.floor(countBase * 0.4), hpMult: hpScale, delay: 0.5 });
            } else {
                // Standard mixed
                wave.enemies.push({ type: 'basic', count: countBase, hpMult: hpScale, delay: 0.5 });
                if (w > 3) wave.enemies.push({ type: 'heavy', count: Math.floor(countBase * 0.15), hpMult: hpScale, delay: 0.8 });
                if (w > 6) wave.enemies.push({ type: 'shield', count: 1, hpMult: hpScale, delay: 1.0 });
            }

        } else if (diffGroup === 2) {
            // ===== HARD: Shadow, Phantom, Berserker, Brute, Buzzer, Boss =====
            if (w % 10 === 0) {
                wave.enemies.push({ type: 'boss', count: 1 + Math.floor(w / 20), hpMult: hpScale * 1.8, delay: 2.0 });
                wave.enemies.push({ type: 'berserker', count: Math.floor(countBase * 0.2), hpMult: hpScale, delay: 0.9 });
                wave.enemies.push({ type: 'heavy', count: Math.floor(countBase * 0.2), hpMult: hpScale, delay: 0.8 });
            } else if (w % 5 === 0) {
                // Shadow ambush
                wave.enemies.push({ type: 'stealth', count: Math.floor(countBase * 0.4), hpMult: hpScale, delay: 0.6 });
                wave.enemies.push({ type: 'ghost', count: Math.floor(countBase * 0.3), hpMult: hpScale, delay: 0.7 });
                wave.enemies.push({ type: 'heavy', count: Math.floor(countBase * 0.2), hpMult: hpScale, delay: 0.8 });
            } else if (w % 7 === 0) {
                // Berserker rage
                wave.enemies.push({ type: 'berserker', count: Math.floor(countBase * 0.5), hpMult: hpScale, delay: 0.8 });
                wave.enemies.push({ type: 'heavy', count: Math.floor(countBase * 0.2), hpMult: hpScale * 1.2, delay: 0.9 });
            } else if (w % 8 === 0) {
                // Buzzer swarm
                wave.enemies.push({ type: 'swarmfast', count: countBase * 3, hpMult: hpScale * 0.4, delay: 0.1 });
            } else if (w % 6 === 0) {
                // Disruptor support wave
                wave.enemies.push({ type: 'disruptor', count: Math.max(1, Math.floor(countBase * 0.18)), hpMult: hpScale, delay: 0.8 });
                wave.enemies.push({ type: 'heavy', count: Math.floor(countBase * 0.3), hpMult: hpScale, delay: 0.8 });
            } else if (w % 9 === 0) {
                // Toxic pressure wave
                wave.enemies.push({ type: 'toxic', count: Math.max(1, Math.floor(countBase * 0.22)), hpMult: hpScale, delay: 0.8 });
                wave.enemies.push({ type: 'stealth', count: Math.floor(countBase * 0.3), hpMult: hpScale, delay: 0.6 });
            } else if (w % 13 === 0) {
                // Phantom parade
                wave.enemies.push({ type: 'ghost', count: Math.floor(countBase * 0.6), hpMult: hpScale, delay: 0.6 });
                wave.enemies.push({ type: 'stealth', count: Math.floor(countBase * 0.3), hpMult: hpScale, delay: 0.7 });
            } else if (w % 3 === 0) {
                // Stealth wave
                wave.enemies.push({ type: 'stealth', count: Math.floor(countBase * 0.5), hpMult: hpScale, delay: 0.6 });
                wave.enemies.push({ type: 'heavy', count: Math.floor(countBase * 0.2), hpMult: hpScale, delay: 0.8 });
            } else {
                // Mixed hard
                wave.enemies.push({ type: 'heavy', count: Math.floor(countBase * 0.4), hpMult: hpScale, delay: 0.7 });
                wave.enemies.push({ type: 'stealth', count: Math.floor(countBase * 0.2), hpMult: hpScale, delay: 0.6 });
                if (w > 5) wave.enemies.push({ type: 'berserker', count: Math.floor(countBase * 0.1), hpMult: hpScale, delay: 0.9 });
            }

        } else {
            // ===== NIGHTMARE: ALL enemy types, elite variants, double modifiers =====
            if (w % 10 === 0) {
                // Multi-boss wave
                wave.enemies.push({ type: 'boss', count: 1 + Math.floor(w / 15), hpMult: hpScale * 2.5, delay: 1.5 });
                wave.enemies.push({ type: 'berserker', count: Math.floor(countBase * 0.3), hpMult: hpScale * 1.3, delay: 0.7 });
                wave.enemies.push({ type: 'ghost', count: Math.floor(countBase * 0.2), hpMult: hpScale, delay: 0.6 });
            } else if (w % 5 === 0) {
                // Everything-at-once wave
                wave.enemies.push({ type: 'heavy', count: Math.floor(countBase * 0.25), hpMult: hpScale * 1.3, delay: 0.7 });
                wave.enemies.push({ type: 'stealth', count: Math.floor(countBase * 0.2), hpMult: hpScale, delay: 0.5 });
                wave.enemies.push({ type: 'berserker', count: Math.floor(countBase * 0.2), hpMult: hpScale * 1.2, delay: 0.8 });
                wave.enemies.push({ type: 'splitter', count: Math.floor(countBase * 0.15), hpMult: hpScale, delay: 0.8 });
                wave.enemies.push({ type: 'healer', count: 2, hpMult: hpScale * 1.5, delay: 1.0 });
            } else if (w % 7 === 0) {
                // Invisible army
                wave.enemies.push({ type: 'ghost', count: Math.floor(countBase * 0.4), hpMult: hpScale * 1.2, delay: 0.5 });
                wave.enemies.push({ type: 'stealth', count: Math.floor(countBase * 0.4), hpMult: hpScale, delay: 0.5 });
                wave.enemies.push({ type: 'healer', count: 2, hpMult: hpScale, delay: 1.0 });
            } else if (w % 8 === 0) {
                // Buzzer + berserker combo
                wave.enemies.push({ type: 'swarmfast', count: countBase * 3, hpMult: hpScale * 0.5, delay: 0.1 });
                wave.enemies.push({ type: 'berserker', count: Math.floor(countBase * 0.3), hpMult: hpScale * 1.2, delay: 0.7 });
                wave.enemies.push({ type: 'disruptor', count: Math.max(1, Math.floor(countBase * 0.12)), hpMult: hpScale * 1.1, delay: 0.9 });
            } else if (w % 3 === 0) {
                // Splitter chaos
                wave.enemies.push({ type: 'splitter', count: Math.floor(countBase * 0.5), hpMult: hpScale * 1.2, delay: 0.6 });
                wave.enemies.push({ type: 'shield', count: Math.floor(countBase * 0.2), hpMult: hpScale * 1.3, delay: 0.8 });
                wave.enemies.push({ type: 'swarm', count: countBase, hpMult: hpScale * 0.5, delay: 0.15 });
            } else if (w % 9 === 0) {
                wave.enemies.push({ type: 'toxic', count: Math.max(2, Math.floor(countBase * 0.18)), hpMult: hpScale * 1.2, delay: 0.9 });
                wave.enemies.push({ type: 'heavy', count: Math.floor(countBase * 0.25), hpMult: hpScale * 1.2, delay: 0.8 });
            } else if (w % 11 === 0) {
                // Elite berserker rush
                wave.enemies.push({ type: 'berserker', count: Math.floor(countBase * 0.6), hpMult: hpScale * 1.5, delay: 0.6 });
                wave.enemies.push({ type: 'heavy', count: Math.floor(countBase * 0.3), hpMult: hpScale * 1.5, delay: 0.7 });
            } else {
                // Nightmare standard — everything mixed
                const types = ['basic', 'fast', 'heavy', 'stealth', 'berserker', 'ghost', 'splitter', 'disruptor', 'toxic'];
                const pick1 = types[w % types.length];
                const pick2 = types[(w * 3 + 1) % types.length];
                wave.enemies.push({ type: pick1, count: Math.floor(countBase * 0.5), hpMult: hpScale * 1.2, delay: 0.5 });
                wave.enemies.push({ type: pick2, count: Math.floor(countBase * 0.3), hpMult: hpScale, delay: 0.6 });
                if (w > 5) wave.enemies.push({ type: 'shield', count: Math.floor(countBase * 0.1), hpMult: hpScale * 1.3, delay: 0.9 });
            }
        }

        waves.push(wave);
    }
    return waves;
}

// ===== MAP DEFINITIONS (30x18 grid) =====
const MAPS = [
    {
        name: 'Green Valley', difficulty: 1, waves: 30,
        desc: 'A peaceful valley — the perfect training ground.',
        bgColor: '#243824', pathColor: '#4a4030', gridColor: '#2a4a2a',
        theme: 'forest',
        // River-cut ravines with alternating diagonal chokepoints
        waypoints: [
            [0, 9], [4, 9], [6, 6], [9, 6], [11, 11], [15, 11], [18, 4], [23, 4], [25, 10], [29, 10]
        ],
        // Decorative features rendered on the map
        decorations: [
            { type: 'tree', x: 2, y: 2 }, { type: 'tree', x: 3, y: 4 }, { type: 'tree', x: 1, y: 13 },
            { type: 'tree', x: 10, y: 8 }, { type: 'tree', x: 17, y: 1 }, { type: 'tree', x: 25, y: 10 },
            { type: 'tree', x: 28, y: 2 }, { type: 'tree', x: 24, y: 16 }, { type: 'tree', x: 9, y: 16 },
            { type: 'bush', x: 8, y: 7 }, { type: 'bush', x: 16, y: 10 }, { type: 'bush', x: 22, y: 3 },
            { type: 'rock', x: 11, y: 11 }, { type: 'rock', x: 23, y: 12 },
            { type: 'flowers', x: 4, y: 14 }, { type: 'flowers', x: 18, y: 5 }, { type: 'flowers', x: 27, y: 9 },
            { type: 'pond', x: 15, y: 8, w: 2, h: 2 },
            // Additional forest decorations
            { type: 'tree', x: 5, y: 16 }, { type: 'tree', x: 15, y: 0 },
            { type: 'bush', x: 1, y: 6 }, { type: 'bush', x: 27, y: 14 },
            { type: 'mushroom', x: 3, y: 7 }, { type: 'mushroom', x: 22, y: 8 },
            { type: 'stump', x: 12, y: 0 }, { type: 'stump', x: 26, y: 4 },
            { type: 'grass_tall', x: 7, y: 12 }, { type: 'grass_tall', x: 19, y: 2 },
            { type: 'butterfly', x: 9, y: 5, animated: true }, { type: 'butterfly', x: 21, y: 11, animated: true },
        ],
    },
    {
        name: 'Desert Pass', difficulty: 2, waves: 35,
        desc: 'Scorching heat and narrow passes test your defenses.',
        bgColor: '#3a3525', pathColor: '#5a4a30', gridColor: '#3a3828',
        theme: 'desert',
        // Broken canyon shelves with shifting elevation lanes
        waypoints: [
            [0, 3], [5, 3], [7, 8], [11, 8], [13, 2], [18, 2], [20, 12], [24, 12], [26, 6], [29, 6]
        ],
        decorations: [
            { type: 'cactus', x: 3, y: 8 }, { type: 'cactus', x: 12, y: 1 }, { type: 'cactus', x: 19, y: 9 },
            { type: 'cactus', x: 25, y: 6 }, { type: 'cactus', x: 11, y: 10 },
            { type: 'dune', x: 1, y: 14, w: 3, h: 2 }, { type: 'dune', x: 24, y: 15, w: 3, h: 2 },
            { type: 'skull', x: 5, y: 11 }, { type: 'skull', x: 14, y: 7 },
            { type: 'oasis', x: 20, y: 7, w: 2, h: 2 },
            { type: 'bones', x: 10, y: 5 }, { type: 'bones', x: 27, y: 1 },
            // Additional desert decorations
            { type: 'tumbleweed', x: 6, y: 13, animated: true }, { type: 'tumbleweed', x: 18, y: 1, animated: true },
            { type: 'sandstone', x: 2, y: 1, w: 1, h: 2 }, { type: 'sandstone', x: 26, y: 9, w: 1, h: 2 },
            { type: 'scorpion', x: 13, y: 12 }, { type: 'scorpion', x: 23, y: 14 },
            { type: 'mirage', x: 15, y: 8, w: 2, h: 1, animated: true },
            { type: 'vulture', x: 7, y: 0, animated: true },
        ],
    },
    {
        name: 'Frozen Peak', difficulty: 3, waves: 40,
        desc: 'Ice and cold slow everything — even your towers.',
        bgColor: '#202838', pathColor: '#3a4458', gridColor: '#283040',
        theme: 'ice',
        // Ice shelf switchbacks and wind-cut diagonal corridors
        waypoints: [
            [0, 15], [4, 15], [6, 11], [10, 11], [12, 3], [17, 3], [19, 13], [24, 13], [26, 6], [29, 6]
        ],
        decorations: [
            { type: 'icicle', x: 2, y: 1 }, { type: 'icicle', x: 8, y: 8 }, { type: 'icicle', x: 14, y: 10 },
            { type: 'icicle', x: 20, y: 8 }, { type: 'icicle', x: 26, y: 6 },
            { type: 'snowpile', x: 3, y: 7 }, { type: 'snowpile', x: 15, y: 5 }, { type: 'snowpile', x: 25, y: 12 },
            { type: 'frozenpool', x: 8, y: 12, w: 2, h: 2 }, { type: 'frozenpool', x: 20, y: 12, w: 2, h: 2 },
            { type: 'crystal', x: 13, y: 7 }, { type: 'crystal', x: 27, y: 3 },
            // Additional ice decorations
            { type: 'snowflake', x: 1, y: 4, animated: true }, { type: 'snowflake', x: 19, y: 1, animated: true },
            { type: 'frostpine', x: 7, y: 5 }, { type: 'frostpine', x: 21, y: 5 },
            { type: 'iceberg', x: 10, y: 9, w: 2, h: 1 },
            { type: 'penguins', x: 3, y: 13 }, { type: 'penguins', x: 25, y: 8 },
            { type: 'aurora', x: 14, y: 0, w: 4, h: 1, animated: true },
        ],
    },
    {
        name: 'Volcanic Rift', difficulty: 4, waves: 45,
        desc: 'Enemies emerge from the lava — fight fire with firepower.',
        bgColor: '#301818', pathColor: '#4a2a1a', gridColor: '#3a2020',
        theme: 'volcano',
        // Rift shelves and magma bridges with hard pivots
        waypoints: [
            [0, 9], [3, 9], [5, 4], [9, 4], [11, 12], [15, 12], [17, 6], [21, 6], [23, 14], [29, 14]
        ],
        decorations: [
            { type: 'lava', x: 1, y: 14, w: 3, h: 3 }, { type: 'lava', x: 22, y: 5, w: 2, h: 3 },
            { type: 'lava', x: 12, y: 5, w: 2, h: 2 },
            { type: 'volcano', x: 27, y: 0 }, { type: 'volcano', x: 13, y: 11 },
            { type: 'embers', x: 2, y: 5 }, { type: 'embers', x: 18, y: 5 },
            { type: 'charred', x: 8, y: 13 }, { type: 'charred', x: 21, y: 13 },
            { type: 'crack', x: 6, y: 5 }, { type: 'crack', x: 15, y: 3 }, { type: 'crack', x: 28, y: 8 },
            // Additional volcanic decorations
            { type: 'lavaspout', x: 3, y: 12, animated: true }, { type: 'lavaspout', x: 24, y: 8, animated: true },
            { type: 'obsidian', x: 9, y: 6 }, { type: 'obsidian', x: 19, y: 14 },
            { type: 'ashcloud', x: 14, y: 1, w: 3, h: 1, animated: true },
            { type: 'firefly', x: 5, y: 7, animated: true }, { type: 'firefly', x: 17, y: 7, animated: true },
        ],
    },
    {
        name: 'Shadow Realm', difficulty: 5, waves: 50,
        desc: 'The final challenge — darkness consumes all.',
        bgColor: '#181028', pathColor: '#2a2045', gridColor: '#201838',
        theme: 'shadow',
        // Nonlinear void corridors with deceptive reversals
        waypoints: [
            [0, 1], [7, 1], [9, 6], [5, 10], [12, 10], [14, 4], [20, 4], [22, 12], [16, 15], [25, 15], [27, 8], [29, 8]
        ],
        decorations: [
            { type: 'portal', x: 14, y: 7, w: 2, h: 2 },
            { type: 'shadowrift', x: 2, y: 4 }, { type: 'shadowrift', x: 22, y: 4 },
            { type: 'shadowrift', x: 7, y: 14 }, { type: 'shadowrift', x: 27, y: 10 },
            { type: 'rune', x: 8, y: 3 }, { type: 'rune', x: 16, y: 12 }, { type: 'rune', x: 23, y: 2 },
            { type: 'skull', x: 6, y: 9 }, { type: 'skull', x: 18, y: 7 },
            { type: 'voidcrystal', x: 14, y: 1 }, { type: 'voidcrystal', x: 28, y: 7 },
            // Additional shadow decorations
            { type: 'soultorch', x: 3, y: 2, animated: true }, { type: 'soultorch', x: 25, y: 6, animated: true },
            { type: 'darkpool', x: 9, y: 11, w: 2, h: 1 },
            { type: 'specter', x: 5, y: 6, animated: true }, { type: 'specter', x: 21, y: 14, animated: true },
            { type: 'voidrift', x: 11, y: 3, w: 1, h: 2, animated: true },
            { type: 'eyeball', x: 19, y: 5 }, { type: 'eyeball', x: 13, y: 14 },
        ],
    },
    // ===== NORMAL DIFFICULTY MAPS (indices 5-9) =====
    {
        name: 'Iron Crossing', difficulty: 3, waves: 35,
        desc: 'A fortified bridge over a raging river.',
        bgColor: '#2a2a20', pathColor: '#4a4030', gridColor: '#333028',
        theme: 'forest',
        waypoints: [
            [0, 4], [5, 4], [7, 9], [11, 9], [13, 3], [18, 3], [20, 13], [25, 13], [29, 10]
        ],
        decorations: [
            { type: 'tree', x: 2, y: 8 }, { type: 'tree', x: 10, y: 1 }, { type: 'tree', x: 18, y: 8 },
            { type: 'tree', x: 25, y: 1 }, { type: 'rock', x: 4, y: 12 }, { type: 'rock', x: 16, y: 10 },
            { type: 'bush', x: 9, y: 7 }, { type: 'bush', x: 23, y: 10 },
            { type: 'pond', x: 12, y: 8, w: 2, h: 2 },
        ],
    },
    {
        name: 'Dusty Trail', difficulty: 3, waves: 35,
        desc: 'Winding roads through dusty plains.',
        bgColor: '#302a1a', pathColor: '#5a4a30', gridColor: '#3a3020',
        theme: 'desert',
        waypoints: [
            [0, 9], [4, 9], [6, 4], [10, 4], [12, 14], [17, 14], [19, 6], [24, 6], [29, 11]
        ],
        decorations: [
            { type: 'cactus', x: 3, y: 14 }, { type: 'cactus', x: 15, y: 8 }, { type: 'cactus', x: 24, y: 12 },
            { type: 'dune', x: 8, y: 6, w: 2, h: 1 }, { type: 'skull', x: 17, y: 3 },
            { type: 'bones', x: 22, y: 8 }, { type: 'sandstone', x: 26, y: 1, w: 1, h: 2 },
        ],
    },
    {
        name: 'Storm Coast', difficulty: 3, waves: 40,
        desc: 'Lightning strikes illuminate the battlefield.',
        bgColor: '#1a2030', pathColor: '#3a3850', gridColor: '#252838',
        theme: 'ice',
        waypoints: [
            [0, 2], [7, 2], [9, 7], [5, 11], [12, 11], [14, 5], [19, 5], [21, 13], [29, 13]
        ],
        decorations: [
            { type: 'icicle', x: 7, y: 5 }, { type: 'icicle', x: 20, y: 10 },
            { type: 'snowpile', x: 13, y: 1 }, { type: 'snowpile', x: 27, y: 8 },
            { type: 'crystal', x: 2, y: 11 }, { type: 'crystal', x: 22, y: 2 },
            { type: 'frozenpool', x: 11, y: 11, w: 2, h: 2 },
        ],
    },
    {
        name: 'Ember Canyon', difficulty: 4, waves: 40,
        desc: 'Hot winds carry the scent of sulfur through narrow passes.',
        bgColor: '#2a1a10', pathColor: '#4a3020', gridColor: '#352218',
        theme: 'volcano',
        waypoints: [
            [0, 8], [4, 8], [6, 2], [12, 2], [14, 12], [18, 12], [20, 5], [25, 5], [29, 9]
        ],
        decorations: [
            { type: 'lava', x: 3, y: 13, w: 2, h: 2 }, { type: 'lava', x: 18, y: 5, w: 2, h: 2 },
            { type: 'volcano', x: 10, y: 8 }, { type: 'crack', x: 8, y: 12 },
            { type: 'embers', x: 16, y: 3 }, { type: 'charred', x: 25, y: 12 },
        ],
    },
    {
        name: 'Twilight Marsh', difficulty: 4, waves: 45,
        desc: 'Fog-laden wetlands where danger lurks beneath the surface.',
        bgColor: '#1a2020', pathColor: '#304038', gridColor: '#222a28',
        theme: 'shadow',
        waypoints: [
            [0, 15], [6, 15], [8, 9], [4, 5], [12, 5], [14, 13], [20, 13], [22, 4], [29, 4]
        ],
        decorations: [
            { type: 'darkpool', x: 4, y: 8, w: 2, h: 2 }, { type: 'darkpool', x: 20, y: 9, w: 2, h: 2 },
            { type: 'soultorch', x: 12, y: 9, animated: true }, { type: 'soultorch', x: 27, y: 8, animated: true },
            { type: 'skull', x: 6, y: 1 }, { type: 'skull', x: 22, y: 1 },
        ],
    },
    // ===== HARD DIFFICULTY MAPS (indices 10-14) =====
    {
        name: 'Crimson Fortress', difficulty: 4, waves: 45,
        desc: 'Blood-red walls conceal a deadly labyrinth.',
        bgColor: '#301010', pathColor: '#4a2020', gridColor: '#381818',
        theme: 'volcano',
        waypoints: [
            [0, 1], [8, 1], [10, 6], [5, 10], [12, 10], [14, 3], [20, 3], [22, 13], [27, 13], [29, 9]
        ],
        decorations: [
            { type: 'lava', x: 8, y: 4, w: 2, h: 2 }, { type: 'lava', x: 22, y: 12, w: 2, h: 2 },
            { type: 'crack', x: 15, y: 5 }, { type: 'crack', x: 10, y: 12 },
            { type: 'volcano', x: 17, y: 3 }, { type: 'embers', x: 2, y: 12 },
        ],
    },
    {
        name: 'Blizzard Peak', difficulty: 5, waves: 50,
        desc: 'Howling winds and zero visibility push defenses to the limit.',
        bgColor: '#182838', pathColor: '#2a3a50', gridColor: '#203040',
        theme: 'ice',
        waypoints: [
            [0, 9], [3, 9], [5, 3], [9, 3], [11, 14], [15, 14], [17, 2], [22, 2], [24, 12], [29, 12]
        ],
        decorations: [
            { type: 'icicle', x: 6, y: 8 }, { type: 'icicle', x: 12, y: 8 }, { type: 'icicle', x: 18, y: 8 },
            { type: 'icicle', x: 24, y: 8 }, { type: 'snowpile', x: 1, y: 14 },
            { type: 'frozenpool', x: 11, y: 5, w: 2, h: 2 },
            { type: 'frostpine', x: 23, y: 5 }, { type: 'crystal', x: 5, y: 13 },
        ],
    },
    {
        name: 'Inferno Depths', difficulty: 5, waves: 50,
        desc: 'The ground itself is ablaze — there is no safe ground.',
        bgColor: '#2a0a0a', pathColor: '#4a1a10', gridColor: '#381010',
        theme: 'volcano',
        waypoints: [
            [0, 5], [4, 5], [6, 12], [10, 12], [12, 3], [17, 3], [19, 14], [24, 14], [26, 7], [29, 7]
        ],
        decorations: [
            { type: 'lava', x: 2, y: 9, w: 2, h: 3 }, { type: 'lava', x: 14, y: 8, w: 3, h: 2 },
            { type: 'lava', x: 26, y: 2, w: 2, h: 2 },
            { type: 'volcano', x: 8, y: 7 }, { type: 'volcano', x: 21, y: 10 },
            { type: 'lavaspout', x: 13, y: 5, animated: true },
            { type: 'obsidian', x: 16, y: 12 }, { type: 'ashcloud', x: 6, y: 1, w: 3, h: 1, animated: true },
        ],
    },
    {
        name: 'Phantom Gates', difficulty: 5, waves: 50,
        desc: 'Enemies phase through walls — nothing is as it seems.',
        bgColor: '#18102a', pathColor: '#2a2040', gridColor: '#201830',
        theme: 'shadow',
        waypoints: [
            [0, 9], [4, 9], [6, 3], [11, 3], [13, 15], [9, 15], [11, 8], [17, 8],
            [19, 15], [24, 15], [26, 4], [29, 4]
        ],
        decorations: [
            { type: 'portal', x: 10, y: 9, w: 2, h: 2 }, { type: 'portal', x: 20, y: 8, w: 2, h: 2 },
            { type: 'shadowrift', x: 6, y: 5 }, { type: 'shadowrift', x: 22, y: 12 },
            { type: 'rune', x: 14, y: 6 }, { type: 'rune', x: 26, y: 7 },
            { type: 'voidcrystal', x: 2, y: 14 },
        ],
    },
    {
        name: 'Dragon\'s Spine', difficulty: 5, waves: 55,
        desc: 'A narrow ridge above a bottomless chasm — one wrong step and you fall.',
        bgColor: '#200a0a', pathColor: '#3a1a18', gridColor: '#2a1010',
        theme: 'volcano',
        waypoints: [
            [0, 3], [5, 3], [7, 14], [12, 14], [14, 4], [18, 4], [20, 15], [25, 15], [27, 5], [29, 5]
        ],
        decorations: [
            { type: 'lava', x: 3, y: 9, w: 2, h: 3 }, { type: 'lava', x: 9, y: 8, w: 2, h: 3 },
            { type: 'lava', x: 15, y: 9, w: 2, h: 3 }, { type: 'lava', x: 21, y: 8, w: 2, h: 3 },
            { type: 'volcano', x: 27, y: 9 }, { type: 'crack', x: 1, y: 7 },
            { type: 'embers', x: 14, y: 1 }, { type: 'charred', x: 26, y: 14 },
        ],
    },
    // ===== NIGHTMARE DIFFICULTY MAPS (indices 15-19) =====
    {
        name: 'Void Nexus', difficulty: 5, waves: 55,
        desc: 'Reality fractures at the nexus — time and space bend to the Void\'s will.',
        bgColor: '#100828', pathColor: '#201840', gridColor: '#180e30',
        theme: 'shadow',
        waypoints: [
            [0, 9], [4, 9], [6, 3], [10, 3], [12, 15], [17, 15], [19, 2], [24, 2], [26, 14], [29, 14]
        ],
        decorations: [
            { type: 'portal', x: 7, y: 9, w: 2, h: 2 }, { type: 'portal', x: 21, y: 9, w: 2, h: 2 },
            { type: 'voidrift', x: 13, y: 8, w: 2, h: 2, animated: true },
            { type: 'shadowrift', x: 5, y: 14 }, { type: 'shadowrift', x: 15, y: 5 },
            { type: 'eyeball', x: 26, y: 8 }, { type: 'soultorch', x: 1, y: 5, animated: true },
        ],
    },
    {
        name: 'Abyssal Maw', difficulty: 5, waves: 60,
        desc: 'The abyss stares back — and it is hungry.',
        bgColor: '#0a0818', pathColor: '#1a1430', gridColor: '#100c22',
        theme: 'shadow',
        waypoints: [
            [0, 1], [10, 1], [12, 7], [4, 7], [6, 15], [20, 15], [22, 8], [16, 8], [18, 2], [29, 2]
        ],
        decorations: [
            { type: 'portal', x: 10, y: 4, w: 3, h: 3 },
            { type: 'voidrift', x: 2, y: 12, w: 1, h: 2, animated: true },
            { type: 'voidrift', x: 26, y: 4, w: 1, h: 2, animated: true },
            { type: 'shadowrift', x: 8, y: 12 }, { type: 'shadowrift', x: 21, y: 12 },
            { type: 'eyeball', x: 16, y: 5 }, { type: 'eyeball', x: 6, y: 4 },
            { type: 'specter', x: 13, y: 14, animated: true },
        ],
    },
    {
        name: 'Eldritch Spiral', difficulty: 5, waves: 60,
        desc: 'A spiral of madness that twists deeper with every wave.',
        bgColor: '#14082a', pathColor: '#221840', gridColor: '#1a0e32',
        theme: 'shadow',
        waypoints: [
            [0, 1], [24, 1], [26, 15], [6, 15], [8, 6], [21, 6], [23, 11], [11, 11], [13, 8], [17, 8], [19, 10], [29, 10]
        ],
        decorations: [
            { type: 'portal', x: 14, y: 8, w: 2, h: 2 },
            { type: 'rune', x: 8, y: 3 }, { type: 'rune', x: 20, y: 14 },
            { type: 'voidcrystal', x: 2, y: 10 }, { type: 'voidcrystal', x: 24, y: 8 },
            { type: 'soultorch', x: 12, y: 3, animated: true }, { type: 'soultorch', x: 16, y: 14, animated: true },
            { type: 'specter', x: 7, y: 14, animated: true },
        ],
    },
    {
        name: 'Death\'s Corridor', difficulty: 5, waves: 65,
        desc: 'Only the dead walk these halls willingly.',
        bgColor: '#0a0510', pathColor: '#180e28', gridColor: '#10081a',
        theme: 'shadow',
        waypoints: [
            [0, 9], [4, 9], [6, 2], [10, 2], [12, 15], [16, 15], [18, 2], [22, 2],
            [24, 14], [27, 14], [29, 6]
        ],
        decorations: [
            { type: 'portal', x: 7, y: 8, w: 2, h: 2 }, { type: 'portal', x: 19, y: 8, w: 2, h: 2 },
            { type: 'shadowrift', x: 13, y: 5 }, { type: 'shadowrift', x: 24, y: 10 },
            { type: 'rune', x: 2, y: 14 }, { type: 'rune', x: 27, y: 2 },
            { type: 'eyeball', x: 8, y: 14 }, { type: 'eyeball', x: 20, y: 3 },
            { type: 'voidrift', x: 14, y: 11, w: 1, h: 2, animated: true },
        ],
    },
    {
        name: 'The Final Oblivion', difficulty: 5, waves: 70,
        desc: 'There is no return. The Void Emperor awaits at the end of all things.',
        bgColor: '#050310', pathColor: '#120a22', gridColor: '#0a0618',
        theme: 'shadow',
        waypoints: [
            [0, 9], [3, 9], [5, 2], [8, 2], [10, 15], [13, 15], [15, 2], [18, 2],
            [20, 15], [23, 15], [25, 2], [27, 2], [29, 9]
        ],
        decorations: [
            { type: 'portal', x: 14, y: 8, w: 3, h: 3 },
            { type: 'voidrift', x: 5, y: 8, w: 2, h: 2, animated: true },
            { type: 'voidrift', x: 24, y: 8, w: 2, h: 2, animated: true },
            { type: 'shadowrift', x: 10, y: 5 }, { type: 'shadowrift', x: 20, y: 12 },
            { type: 'rune', x: 1, y: 4 }, { type: 'rune', x: 28, y: 14 },
            { type: 'rune', x: 15, y: 4 }, { type: 'rune', x: 15, y: 13 },
            { type: 'eyeball', x: 7, y: 13 }, { type: 'eyeball', x: 22, y: 4 },
            { type: 'soultorch', x: 11, y: 1, animated: true }, { type: 'soultorch', x: 19, y: 16, animated: true },
            { type: 'specter', x: 3, y: 14, animated: true }, { type: 'specter', x: 26, y: 3, animated: true },
        ],
    },
];

// ===== RESEARCH TREE =====
const RESEARCH = {
    offense: {
        name: 'OFFENSE', icon: '\u2694',
        nodes: [
            // Row 1
            [
                { id: 'sharp', name: 'Sharpened Tips', desc: '+5% damage for all towers', cost: 1, effect: { dmgMult: 0.05 }, icon: '\u{1F5E1}' },
                { id: 'quick', name: 'Quick Hands', desc: '+3% fire rate for all towers', cost: 1, effect: { rateMult: 0.03 }, icon: '\u{23F1}' },
                { id: 'criteye', name: 'Critical Eye', desc: '+3% crit chance for all towers', cost: 1, effect: { critChance: 0.03 }, icon: '\u{1F441}' },
            ],
            // Row 2
            [
                { id: 'heavy', name: 'Heavy Ordnance', desc: '+8% damage for all towers', cost: 2, effect: { dmgMult: 0.08 }, requires: ['sharp'], icon: '\u{1F4A3}' },
                { id: 'rapid', name: 'Rapid Fire', desc: '+5% fire rate', cost: 2, effect: { rateMult: 0.05 }, requires: ['quick'], icon: '\u{26A1}' },
                { id: 'vital', name: 'Vital Strikes', desc: '+5% crit, +20% crit dmg', cost: 2, effect: { critChance: 0.05, critDmg: 0.2 }, requires: ['criteye'], icon: '\u{2620}' },
            ],
            // Row 3
            [
                { id: 'optics', name: 'Extended Optics', desc: '+10% range for all towers', cost: 3, effect: { rangeMult: 0.10 }, requires: ['heavy', 'rapid'], icon: '\u{1F52D}' },
                { id: 'elemental', name: 'Elemental Mastery', desc: 'Elemental effects last 20% longer', cost: 3, effect: { effectDuration: 0.2 }, requires: ['rapid', 'vital'], icon: '\u{1F525}' },
                { id: 'armorpierce', name: 'Armor Piercing', desc: 'All towers ignore 10% armor', cost: 3, effect: { armorPierce: 0.1 }, requires: ['heavy', 'vital'], icon: '\u{1F6E1}' },
            ],
            // Row 4
            [
                { id: 'dualmastery', name: 'Dual Mastery', desc: 'Both paths can reach Tier 3. Only one reaches 4-5.', cost: 4, effect: { dualMastery: true }, requires: ['optics', 'elemental'], icon: '\u{2B50}' },
                { id: 'crosstrain', name: 'Cross-Training', desc: 'Synergy bonuses 50% stronger', cost: 4, effect: { synergyMult: 0.5 }, requires: ['elemental', 'armorpierce'], icon: '\u{1F91D}' },
                { id: 'overclock', name: 'Overclock Protocol', desc: 'Overclock recovery 2s faster', cost: 4, effect: { overclockRecovery: 2 }, requires: ['optics', 'armorpierce'], icon: '\u{2699}' },
            ],
            // Row 5
            [
                { id: 'apex', name: 'Apex Predator', desc: 'All towers gain +75 bonus kills toward mastery', cost: 5, effect: { masteryBonus: 75 }, requires: ['dualmastery', 'crosstrain'], icon: '\u{1F451}' },
                { id: 'ultcalib', name: 'Ultimate Calibration', desc: 'Tier 5 abilities cooldown 25% faster', cost: 5, effect: { ultimateCdr: 0.25 }, requires: ['crosstrain', 'overclock'], icon: '\u{1F527}' },
                { id: 'warmachine', name: 'War Machine', desc: '+15% dmg, +10% rate. Towers cost 5% more', cost: 5, effect: { dmgMult: 0.15, rateMult: 0.10, costMult: 0.05 }, requires: ['dualmastery', 'overclock'], icon: '\u{1F916}' },
            ],
        ],
    },
    defense: {
        name: 'DEFENSE', icon: '\u{1F6E1}',
        nodes: [
            [
                { id: 'reinforce', name: 'Reinforced Gates', desc: '+3 starting lives', cost: 1, effect: { bonusLives: 3 }, icon: '\u{1F6AA}' },
                { id: 'harden', name: 'Tower Hardening', desc: 'Towers immune to damage', cost: 1, effect: { towerImmune: true }, icon: '\u{1F3F0}' },
                { id: 'veteran', name: 'Veteran Guards', desc: 'Leaked enemies deal 1 less life', cost: 1, effect: { reducedLeak: 1 }, icon: '\u{1F482}' },
            ],
            [
                { id: 'fortify', name: 'Fortified Walls', desc: '+5 starting lives', cost: 2, effect: { bonusLives: 5 }, requires: ['reinforce'], icon: '\u{1F9F1}' },
                { id: 'laststand', name: 'Last Stand', desc: 'At 5 lives, +20% dmg for 30s', cost: 2, effect: { lastStand: true }, requires: ['harden'], icon: '\u{1F4AA}' },
                { id: 'frostarmor', name: 'Frost Armor', desc: 'Tower damage freezes attackers', cost: 2, effect: { frostArmor: true }, requires: ['veteran'], icon: '\u{2744}' },
            ],
            [
                { id: 'lifeins', name: 'Life Insurance', desc: '+10 gold when you lose a life', cost: 3, effect: { lifeInsGold: 10 }, requires: ['fortify', 'laststand'], icon: '\u{1F4B0}' },
                { id: 'emergency', name: 'Emergency Protocol', desc: 'At 10 lives, abilities 50% faster', cost: 3, effect: { emergencyCdr: 0.5 }, requires: ['laststand', 'frostarmor'], icon: '\u{1F6A8}' },
                { id: 'secondchance', name: 'Second Chance', desc: 'Survive once at 1 life', cost: 3, effect: { secondChance: true }, requires: ['fortify', 'frostarmor'], icon: '\u{1F31F}' },
            ],
            [
                { id: 'immortal', name: 'Immortal Bastion', desc: '+10 lives, invuln for 10s after hit', cost: 4, effect: { bonusLives: 10, invulnWindow: 10 }, requires: ['lifeins', 'emergency'], icon: '\u{1F3F0}' },
                { id: 'phoenix', name: 'Phoenix Protocol', desc: '25% chance sold tower respawns', cost: 4, effect: { phoenixChance: 0.25 }, requires: ['emergency', 'secondchance'], icon: '\u{1F426}' },
                { id: 'unbreakable', name: 'Unbreakable', desc: 'Shield blocks first 5 leaks', cost: 4, effect: { startShield: 5 }, requires: ['lifeins', 'secondchance'], icon: '\u{1F6E1}' },
            ],
        ],
    },
    economy: {
        name: 'ECONOMY', icon: '\u{1F4B0}',
        nodes: [
            [
                { id: 'warchest', name: 'War Chest', desc: '+50 starting gold', cost: 1, effect: { bonusGold: 50 }, icon: '\u{1F4B0}' },
                { id: 'efficient', name: 'Efficient Builder', desc: 'All towers cost 3% less', cost: 1, effect: { costReduce: 0.03 }, icon: '\u{1F6E0}' },
                { id: 'interest', name: 'Interest Rate', desc: '+1% interest rate', cost: 1, effect: { interestRate: 0.01 }, icon: '\u{1F4C8}' },
            ],
            [
                { id: 'trade', name: 'Trade Routes', desc: '+75 starting gold', cost: 2, effect: { bonusGold: 75 }, requires: ['warchest'], icon: '\u{1F6A2}' },
                { id: 'bulk', name: 'Bulk Orders', desc: 'Towers cost 5% less', cost: 2, effect: { costReduce: 0.05 }, requires: ['efficient'], icon: '\u{1F4E6}' },
                { id: 'banking', name: 'Banking', desc: 'Interest cap +25 gold', cost: 2, effect: { interestCap: 25 }, requires: ['interest'], icon: '\u{1F3E6}' },
            ],
            [
                { id: 'bounty', name: 'Bounty System', desc: 'Bosses reward 50% more gold', cost: 3, effect: { bossGold: 0.5 }, requires: ['trade', 'bulk'], icon: '\u{1F4B5}' },
                { id: 'salvage', name: 'Salvage Expert', desc: 'Sell value 80% (from 70%)', cost: 3, effect: { sellRefund: 0.8 }, requires: ['bulk', 'banking'], icon: '\u{267B}' },
                { id: 'wavebonus', name: 'Wave Bonus', desc: 'Wave completion bonus doubled', cost: 3, effect: { waveBonusMult: 2 }, requires: ['trade', 'banking'], icon: '\u{1F3C6}' },
            ],
            [
                { id: 'goldrush', name: 'Gold Rush', desc: 'Every 5 waves, +100 gold', cost: 4, effect: { goldRush: 100 }, requires: ['bounty', 'salvage'], icon: '\u{1F4B4}' },
                { id: 'upgdiscount', name: 'Upgrade Discount', desc: 'Upgrades cost 15% less', cost: 4, effect: { upgradeDiscount: 0.15 }, requires: ['salvage', 'wavebonus'], icon: '\u{1F3F7}' },
                { id: 'portfolio', name: 'Investment Portfolio', desc: 'Compound interest on interest', cost: 4, effect: { compoundInterest: true }, requires: ['bounty', 'wavebonus'], icon: '\u{1F4CA}' },
            ],
        ],
    },
    knowledge: {
        name: 'KNOWLEDGE', icon: '\u{1F4DA}',
        nodes: [
            [
                { id: 'scholar', name: 'Scholar', desc: '+1 research point per map clear', cost: 1, effect: { bonusRP: 1 }, icon: '\u{1F393}' },
                { id: 'scouting', name: 'Scouting Report', desc: 'See enemy HP/stats in preview', cost: 1, effect: { scoutingReport: true }, icon: '\u{1F50D}' },
                { id: 'blueprint', name: 'Draft Protocols', desc: 'Endless mutator draft gains 1 reroll', cost: 1, effect: { draftReroll: 1 }, icon: '\u{1F4D0}' },
            ],
            [
                { id: 'advscholar', name: 'Advanced Scholar', desc: '+2 RP per map clear', cost: 2, effect: { bonusRP: 2 }, requires: ['scholar'], icon: '\u{1F4D6}' },
                { id: 'mapmastery', name: 'Endless Mastery', desc: 'Endless milestone rewards +50%', cost: 2, effect: { endlessMilestoneBoost: 0.5 }, requires: ['scouting'], icon: '\u{1F5FA}' },
                { id: 'tactical', name: 'Weekly Analysis', desc: 'Weekly first-victory RP bonus +50%', cost: 2, effect: { weeklyRpMult: 0.5 }, requires: ['blueprint'], icon: '\u{1F4FA}' },
            ],
            [
                { id: 'achiever', name: 'Achievement Hunter', desc: 'Achievements grant +1 RP', cost: 3, effect: { achievementRP: true }, requires: ['advscholar', 'mapmastery'], icon: '\u{1F3C5}' },
                { id: 'effexpert', name: 'Efficiency Expert', desc: '100+ kill towers earn 50% more gold', cost: 3, effect: { killGoldBonus: 0.5 }, requires: ['mapmastery', 'tactical'], icon: '\u{1F4B9}' },
                { id: 'orbcollect', name: 'Combat Analytics', desc: 'Elite/Boss kills reduce ability cooldowns by 0.6s', cost: 3, effect: { abilityCdOnEliteKill: 0.6 }, requires: ['advscholar', 'tactical'], icon: '\u{1F4D5}' },
            ],
            [
                { id: 'grandscholar', name: 'Grand Scholar', desc: '+3 RP per map clear', cost: 4, effect: { bonusRP: 3 }, requires: ['achiever', 'effexpert'], icon: '\u{1F9D9}' },
                { id: 'towerdna', name: 'Tower DNA', desc: 'Mastery bonuses 50% stronger', cost: 4, effect: { masteryMult: 0.5 }, requires: ['effexpert', 'orbcollect'], icon: '\u{1F9EC}' },
                { id: 'omniscience', name: 'Omniscience', desc: 'All enemies visible, see pathing', cost: 4, effect: { omniscience: true }, requires: ['achiever', 'orbcollect'], icon: '\u{1F4A0}' },
            ],
        ],
    },
};

// ===== PLAYER ABILITIES =====
const PLAYER_ABILITIES = [
    { id: 'airstrike', name: 'Air Strike', desc: 'Deals 200 damage in target area', cooldown: 30, icon: '\u{2708}', key: 'Q',
        effect: { type: 'aoe', damage: 200, radius: 80 } },
    { id: 'reinforce', name: 'Reinforce', desc: '+5 temporary lives for 20 seconds', cooldown: 45, icon: '\u{1F6E1}', key: 'W',
        effect: { type: 'buff', bonusLives: 5, duration: 20 } },
    { id: 'goldmine', name: 'Gold Mine', desc: 'Earn 100 bonus gold', cooldown: 60, icon: '\u{1F4B0}', key: 'E',
        effect: { type: 'gold', amount: 100 } },
    { id: 'slowfield', name: 'Slow Field', desc: 'Slow all enemies 50% for 8 seconds', cooldown: 40, icon: '\u{2744}', key: 'R',
        effect: { type: 'slow', amount: 0.5, duration: 8 } },
    { id: 'overcharge', name: 'Overcharge', desc: 'All towers +50% damage for 10s', cooldown: 50, icon: '\u{26A1}', key: 'T',
        effect: { type: 'towerbuff', dmgMult: 0.5, duration: 10 } },
];

// ===== ACHIEVEMENT DEFINITIONS =====
const ACHIEVEMENTS = [
    { id: 'first_blood', name: 'First Blood', desc: 'Kill your first enemy', icon: '\u{1F5E1}', check: s => s.totalKills >= 1 },
    { id: 'wave10', name: 'Holding Strong', desc: 'Survive 10 waves', icon: '\u{1F6E1}', check: s => s.wavesCompleted >= 10 },
    { id: 'wave30', name: 'Veteran Defender', desc: 'Survive 30 waves', icon: '\u{1F3C5}', check: s => s.wavesCompleted >= 30 },
    { id: 'rich', name: 'War Chest', desc: 'Have 1000 gold at once', icon: '\u{1F4B0}', check: s => s.maxGold >= 1000 },
    { id: 'mythic_tower', name: 'Mythic Guardian', desc: 'Get a tower to Mythic mastery', icon: '\u{1F48E}', check: s => s.maxMastery >= 500 },
    { id: 'tier5', name: 'Ultimate Power', desc: 'Upgrade a tower to Tier 5', icon: '\u{2B50}', check: s => s.maxTier >= 5 },
    { id: 'no_leak', name: 'Perfect Defense', desc: 'Complete a map with no leaks', icon: '\u{1F31F}', check: s => s.perfectWaves > 0 },
    { id: 'kills100', name: 'Centurion', desc: 'Kill 100 enemies in one game', icon: '\u{1F5E1}', check: s => s.totalKills >= 100 },
    { id: 'kills500', name: 'Slayer', desc: 'Kill 500 enemies in one game', icon: '\u{2694}', check: s => s.totalKills >= 500 },
    { id: 'map1', name: 'Valley Victor', desc: 'Complete Green Valley', icon: '\u{1F332}', check: s => s.mapsCompleted?.includes(0) },
    { id: 'map2', name: 'Desert Storm', desc: 'Complete Desert Pass', icon: '\u{1F3DC}', check: s => s.mapsCompleted?.includes(1) },
    { id: 'map3', name: 'Ice Breaker', desc: 'Complete Frozen Peak', icon: '\u{2744}', check: s => s.mapsCompleted?.includes(2) },
    { id: 'map4', name: 'Fire Walker', desc: 'Complete Volcanic Rift', icon: '\u{1F30B}', check: s => s.mapsCompleted?.includes(3) },
    { id: 'map5', name: 'Shadow Lord', desc: 'Complete Shadow Realm', icon: '\u{1F47B}', check: s => s.mapsCompleted?.includes(4) },
    { id: 'towers8', name: 'Arsenal', desc: 'Build all 8 tower types in one game', icon: '\u{1F3F0}', check: s => s.towerTypesBuilt >= 8 },
    { id: 'speed3', name: 'Fast Forward', desc: 'Play at 3x speed', icon: '\u{23E9}', check: s => s.usedSpeed3 },
    { id: 'boss5', name: 'Boss Hunter', desc: 'Kill 5 bosses in one game', icon: '\u{1F479}', check: s => s.bossKills >= 5 },
    { id: 'combo8', name: 'Tower Army', desc: 'Get 8 towers of same type combo', icon: '\u{1F3AF}', check: s => s.maxCombo >= 8 },
    { id: 'research5', name: 'Researcher', desc: 'Unlock 5 research nodes', icon: '\u{1F52C}', check: s => s.researchCount >= 5 },
    { id: 'all_maps', name: 'Conqueror', desc: 'Complete all 5 maps', icon: '\u{1F451}', check: s => (s.mapsCompleted?.length || 0) >= 5 },

    // New achievements
    { id: 'kills1000', name: 'Annihilator', desc: 'Kill 1000 enemies in one game', icon: '\u{1F480}', check: s => s.totalKills >= 1000 },
    { id: 'kills5000', name: 'Extinction Event', desc: 'Kill 5000 enemies in one game', icon: '\u{2622}', check: s => s.totalKills >= 5000 },
    { id: 'wave50', name: 'Unbreakable Wall', desc: 'Survive 50 waves', icon: '\u{1F3F0}', check: s => s.wavesCompleted >= 50 },
    { id: 'gold5000', name: 'Dragon Hoard', desc: 'Have 5000 gold at once', icon: '\u{1F4B0}', check: s => s.maxGold >= 5000 },
    { id: 'boss20', name: 'Boss Slayer', desc: 'Kill 20 bosses in one game', icon: '\u{1F47E}', check: s => s.bossKills >= 20 },
    { id: 'overclock10', name: 'Overclocker', desc: 'Overclock towers 10 times in one game', icon: '\u{2699}', check: s => s.overclockCount >= 10 },
    { id: 'no_tower_lost', name: 'Zero Casualties', desc: 'Complete a map without selling any tower', icon: '\u{1F3C6}', check: s => s.towersNeverSold },
    { id: 'speed_run', name: 'Speed Demon', desc: 'Complete a map in under 10 minutes', icon: '\u{23F1}', check: s => s.fastestClear < 600 },
    { id: 'full_research', name: 'Research Complete', desc: 'Unlock all research nodes', icon: '\u{1F9EA}', check: s => s.researchCount >= 30 },
    { id: 'multi_tier5', name: 'Tower of Power', desc: 'Have 3 Tier 5 towers at once', icon: '\u{1F31F}', check: s => s.tier5Count >= 3 },
    { id: 'first_ability', name: 'Ability Unlocked', desc: 'Use an ability for the first time', icon: '\u{2728}', check: s => s.abilitiesUsed >= 1 },
    { id: 'synergy_master', name: 'Synergy Master', desc: 'Activate 5 different synergy types', icon: '\u{1F91D}', check: s => s.synergyTypesActivated >= 5 },
];
