import { ENEMIES } from './config/enemies.js';
import { generateWaves } from './config/waves.js';
import { RESEARCH } from './config/research.js';
import { PLAYER_ABILITIES } from './config/playerAbilities.js';
import { ACHIEVEMENTS } from './config/achievements.js';

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
    MAX_TOWERS: 50,
    MAX_CATALYSTS: 3,
    SELL_REFUND: 0.7,
    DISMANTLE_REFUND: 0.5,
    LINK_COST: 50,
    LINK_RANGE: 190,
    MAX_LINKS_PER_TOWER: 2,
    LINK_DAMAGE_BONUS: 0.04,
    LINK_SAME_TYPE_RATE_BONUS: 0.03,
    LINK_CROSS_TYPE_RANGE_BONUS: 0.05,
    LINK_DIVERSITY_CRIT_BONUS: 0.04,
    MOVE_COST_RATIO: 0.25,
    OVERCLOCK_BOOST: 1.5,
    OVERCLOCK_DURATION: 10,
    OVERCLOCK_COOLDOWN: 5,
    WAVE_BONUS_BASE: 20,
    MASTERY_XP_PER_SCORE: 120,
    FORMATION_RANGE: 125,
    SYNERGY_UPDATE_INTERVAL: 2.0,
    SELL_CONFIRM_WINDOW: 3.0,
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
            name: 'Fortress',
            icon: '\u{1F6E1}',
            summary: 'Outlast anything. Build slow, build permanent.',
            bonusText: '+10 lives, +15% tower range',
            drawbackText: '-300 starting gold',
            style: {
                accent: '#5ec4ff',
                gradient: 'linear-gradient(135deg, rgba(20, 44, 78, 0.95), rgba(18, 30, 58, 0.94))',
            },
            effects: {
                startLives: 10,
                rangeMult: 0.15,
                startGold: -300,
            },
        },
        {
            id: 'tempo',
            name: 'Tempo',
            icon: '\u26A1',
            summary: 'Relentless ability spam. Survive by killing faster.',
            bonusText: '-40% ability cooldowns, +20% attack speed',
            drawbackText: '-16 starting lives',
            style: {
                accent: '#f4d06f',
                gradient: 'linear-gradient(135deg, rgba(78, 58, 20, 0.95), rgba(52, 36, 16, 0.92))',
            },
            effects: {
                abilityCooldownMult: 0.60,
                rateMult: 0.20,
                startLives: -16,
            },
        },
        {
            id: 'greed',
            name: 'Greed',
            icon: '\u{1F4B0}',
            summary: 'Snowball economy. Fragile early, unstoppable late.',
            bonusText: '+100 gold, +3% interest, +50 cap',
            drawbackText: '-15 starting lives',
            style: {
                accent: '#7ee08a',
                gradient: 'linear-gradient(135deg, rgba(24, 72, 38, 0.95), rgba(18, 48, 28, 0.92))',
            },
            effects: {
                startGold: 100,
                interestRateDelta: 0.03,
                interestCapDelta: 50,
                startLives: -15,
            },
        },
        {
            id: 'execution',
            name: 'Execution',
            icon: '\u{1F3AF}',
            summary: 'Assassinate elites and bosses. Trash mobs are your problem.',
            bonusText: '+40% elite/boss damage, +10% crit chance',
            drawbackText: '-45% damage to normal enemies',
            style: {
                accent: '#ff8a8a',
                gradient: 'linear-gradient(135deg, rgba(82, 24, 24, 0.95), rgba(56, 18, 18, 0.92))',
            },
            effects: {
                eliteBossDamageMult: 1.40,
                critChance: 0.10,
                globalDamageMult: 0.55,
            },
        },
    ],

    // ===== PHASE II BALANCE COMPRESSION =====
    // Keep doctrine deltas meaningful and prevent runaway stacking noise.
    DOCTRINE_BALANCE_LIMITS: {
        startGold: { min: -300, max: 200 },
        startLives: { min: -16, max: 12 },
        interestRateDelta: { min: -0.04, max: 0.04 },
        interestCapDelta: { min: -60, max: 60 },
        abilityCooldownMult: { min: 0.55, max: 1.2 },
        globalDamageMult: { min: 0.50, max: 1.3 },
        eliteBossDamageMult: { min: 1.0, max: 1.5 },
        rangeMult: { min: 0, max: 0.2 },
        rateMult: { min: 0, max: 0.25 },
        critChance: { min: 0, max: 0.15 },
    },

    // Research bonuses still add up from unlocked nodes, but high-noise bonuses
    // are clamped so progression remains legible and easier to rebalance.
    RESEARCH_COMPRESSION_RULES: {
        bonusLivesMax: 15,
        bonusGoldMax: 150,
        bonusRpMax: 4,
        costReduceMax: 0.18,
        upgradeDiscountMax: 0.25,
        dmgMultMax: 0.4,
        rateMultMax: 0.3,
        rangeMultMax: 0.2,
        critChanceMax: 0.15,
        critDmgMax: 0.6,
        interestRateMax: 0.03,
        interestCapMax: 75,
        sellRefundMax: 0.85,
        killGoldBonusMax: 0.35,
        abilityCdOnEliteKillMax: 0.5,
        goldRushMax: 75,
        waveBonusMultMax: 1.5,
    },

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

// ===== PROJECTILE VISUAL SYSTEM =====
// Family defaults are merged with tower/path/crit/special overrides.
const PROJECTILE_FAMILY_DEFAULTS = {
    dart: {
        family: 'dart',
        size: 3,
        length: 12,
        width: 4,
        trailMode: 'streak',
        trailLife: 0.16,
        trailCount: 8,
        glow: 0.12,
        spin: 0,
        impactStyle: 'pierce',
    },
    shell: {
        family: 'shell',
        size: 5,
        length: 10,
        width: 7,
        trailMode: 'smoke',
        trailLife: 0.22,
        trailCount: 7,
        glow: 0.08,
        spin: 0.04,
        impactStyle: 'blast',
    },
    shard: {
        family: 'shard',
        size: 4,
        length: 11,
        width: 6,
        trailMode: 'shards',
        trailLife: 0.18,
        trailCount: 8,
        glow: 0.20,
        spin: 0.18,
        impactStyle: 'frost',
    },
    bolt: {
        family: 'bolt',
        size: 3,
        length: 14,
        width: 3,
        trailMode: 'sparks',
        trailLife: 0.12,
        trailCount: 7,
        glow: 0.35,
        spin: 0,
        zigzag: 4,
        impactStyle: 'arc',
    },
    tracer: {
        family: 'tracer',
        size: 2,
        length: 18,
        width: 2,
        trailMode: 'line',
        trailLife: 0.10,
        trailCount: 6,
        glow: 0.18,
        spin: 0,
        impactStyle: 'tracerPop',
    },
    rocket: {
        family: 'rocket',
        size: 4,
        length: 14,
        width: 5,
        trailMode: 'smokeFire',
        trailLife: 0.24,
        trailCount: 9,
        glow: 0.16,
        spin: 0,
        impactStyle: 'rocketBurst',
    },
    plume: {
        family: 'plume',
        size: 5,
        length: 12,
        width: 8,
        trailMode: 'embers',
        trailLife: 0.18,
        trailCount: 10,
        glow: 0.28,
        spin: 0.12,
        wobble: 0.18,
        impactStyle: 'embers',
    },
    orb: {
        family: 'orb',
        size: 4,
        length: 8,
        width: 8,
        trailMode: 'mist',
        trailLife: 0.20,
        trailCount: 8,
        glow: 0.30,
        spin: 0.10,
        impactStyle: 'orbPop',
    },
};

const PROJECTILE_IMPACT_PRESETS = {
    pierce: {
        mode: 'burst',
        color: '#b8ffb8',
        count: 4,
        speed: 1.0,
        size: 0.8,
    },
    blast: {
        mode: 'burst',
        color: '#ff9a5a',
        count: 10,
        speed: 1.4,
        size: 1.1,
    },
    frost: {
        mode: 'burst',
        color: '#8fe8ff',
        count: 8,
        speed: 1.0,
        size: 0.9,
    },
    arc: {
        mode: 'arc',
        color: '#ffe55a',
        count: 6,
        speed: 0.8,
        size: 0.7,
    },
    tracerPop: {
        mode: 'burst',
        color: '#ffffff',
        count: 3,
        speed: 0.7,
        size: 0.5,
    },
    rocketBurst: {
        mode: 'burst',
        color: '#ff7a3a',
        count: 14,
        speed: 1.6,
        size: 1.2,
    },
    embers: {
        mode: 'burst',
        color: '#ff8a2a',
        count: 9,
        speed: 1.1,
        size: 0.9,
    },
    toxicSplash: {
        mode: 'burst',
        color: '#6dff72',
        count: 8,
        speed: 0.9,
        size: 0.9,
    },
    seismicBurst: {
        mode: 'burst',
        color: '#c4a27a',
        count: 12,
        speed: 1.2,
        size: 1.0,
    },
    soulBurst: {
        mode: 'burst',
        color: '#b06dff',
        count: 8,
        speed: 0.95,
        size: 0.95,
    },
    orbPop: {
        mode: 'burst',
        color: '#b0d0ff',
        count: 6,
        speed: 0.8,
        size: 0.8,
    },
};

const PROJECTILE_VISUALS = {
    arrow: {
        base: {
            family: 'dart',
            bodyColor: '#73d36f',
            tipColor: '#e8ffd8',
            accentColor: '#4e8c3b',
            trailColor: '#67e17b',
            trailAccent: '#d9ff8a',
            glowColor: '#a8ffb0',
            impactStyle: 'pierce',
            impactColor: '#73d36f',
        },
        pathA: {
            bodyColor: '#9bc7ff',
            tipColor: '#ffffff',
            accentColor: '#4b6da8',
            trailColor: '#c1e4ff',
            trailAccent: '#dff0ff',
            glowColor: '#d7eeff',
            length: 13,
            width: 3,
        },
        pathB: {
            bodyColor: '#8fe25a',
            tipColor: '#f4ffb0',
            accentColor: '#628c35',
            trailColor: '#a8ff70',
            trailAccent: '#f6ff80',
            width: 5,
        },
        crit: {
            bodyColor: '#ff5c5c',
            tipColor: '#ffffff',
            trailColor: '#ff8a8a',
            glowColor: '#ffb0b0',
        },
        special: {
            perfectShot: {
                bodyColor: '#ffd74a',
                tipColor: '#fff8d2',
                trailColor: '#ffe68a',
                trailAccent: '#fff2b0',
                glowColor: '#ffd74a',
                size: 4,
                length: 15,
                impactStyle: 'tracerPop',
            },
        },
    },

    cannon: {
        base: {
            family: 'shell',
            bodyColor: '#8c8c8c',
            coreColor: '#5a5a5a',
            accentColor: '#c3b08a',
            trailColor: '#9a6a45',
            trailAccent: '#5a4a40',
            glowColor: '#ff9a5a',
            impactStyle: 'blast',
            impactColor: '#ff9a5a',
        },
        pathA: {
            bodyColor: '#4e4e52',
            coreColor: '#ff7a2a',
            accentColor: '#2a2a2e',
            trailColor: '#ff8a42',
            glowColor: '#ffb26e',
            size: 5.5,
        },
        pathB: {
            bodyColor: '#9a7a62',
            coreColor: '#d8b07a',
            accentColor: '#704f36',
            trailColor: '#c9a07a',
            trailAccent: '#805a42',
            size: 4.5,
        },
        crit: {
            coreColor: '#fff3d0',
            glowColor: '#ffd070',
        },
    },

    ice: {
        base: {
            family: 'shard',
            bodyColor: '#8fe8ff',
            coreColor: '#d7fbff',
            accentColor: '#5ab0c9',
            trailColor: '#8fe8ff',
            trailAccent: '#d7fbff',
            glowColor: '#c8f7ff',
            impactStyle: 'frost',
            impactColor: '#8fe8ff',
        },
        pathA: {
            bodyColor: '#d9f7ff',
            coreColor: '#ffffff',
            accentColor: '#98d6ef',
            trailColor: '#d7fbff',
            glowColor: '#ffffff',
            spin: 0.08,
        },
        pathB: {
            bodyColor: '#72d7ff',
            coreColor: '#b6f0ff',
            accentColor: '#3a9bd2',
            trailColor: '#7ce8ff',
            trailAccent: '#b6f0ff',
            spin: 0.24,
            size: 4.5,
        },
        crit: {
            glowColor: '#ffffff',
            size: 4.5,
        },
    },

    lightning: {
        base: {
            family: 'bolt',
            bodyColor: '#ffe45a',
            coreColor: '#fff8c2',
            accentColor: '#d2b400',
            trailColor: '#ffe45a',
            trailAccent: '#fff8c2',
            glowColor: '#ffe45a',
            impactStyle: 'arc',
            impactColor: '#ffe45a',
        },
        pathA: {
            bodyColor: '#fff19a',
            coreColor: '#ffffff',
            accentColor: '#ffd43a',
            trailColor: '#fff19a',
            trailAccent: '#ffffff',
            zigzag: 6,
            width: 2.5,
        },
        pathB: {
            family: 'orb',
            bodyColor: '#f1d95a',
            coreColor: '#fff6bf',
            accentColor: '#8cc8ff',
            trailColor: '#ffd84d',
            trailAccent: '#8cc8ff',
            glowColor: '#ffe45a',
            impactStyle: 'arc',
            size: 3.8,
        },
        crit: {
            coreColor: '#ffffff',
            glowColor: '#ffffff',
            trailColor: '#fff7c8',
        },
    },

    sniper: {
        base: {
            family: 'tracer',
            bodyColor: '#f0f0f0',
            coreColor: '#ffffff',
            accentColor: '#9a9a9a',
            trailColor: '#ffffff',
            trailAccent: '#d0d0d0',
            glowColor: '#f8f8f8',
            impactStyle: 'tracerPop',
            impactColor: '#ffffff',
        },
        pathA: {
            bodyColor: '#ff7b7b',
            coreColor: '#ffffff',
            accentColor: '#702020',
            trailColor: '#ff9a9a',
            trailAccent: '#ffffff',
            glowColor: '#ffb6b6',
        },
        pathB: {
            bodyColor: '#9be1d9',
            coreColor: '#ffffff',
            accentColor: '#4a7a86',
            trailColor: '#b8f4ef',
            trailAccent: '#8ee0ff',
            glowColor: '#d8ffff',
        },
        crit: {
            bodyColor: '#ff4040',
            trailColor: '#ff6a6a',
            glowColor: '#ffb0b0',
            length: 20,
        },
    },

    missile: {
        base: {
            family: 'rocket',
            bodyColor: '#9a9aa4',
            coreColor: '#d7d7e0',
            accentColor: '#5b5b66',
            finColor: '#70707a',
            exhaustColor: '#ff6a2a',
            smokeColor: '#7e7e88',
            trailColor: '#ff824a',
            trailAccent: '#ffd090',
            glowColor: '#ff8a52',
            impactStyle: 'rocketBurst',
            impactColor: '#ff824a',
        },
        pathA: {
            bodyColor: '#c76a6a',
            coreColor: '#ffe0c0',
            accentColor: '#6a1f1f',
            finColor: '#8a3232',
            exhaustColor: '#ff4422',
            trailColor: '#ff6a52',
            glowColor: '#ff9e8a',
            size: 4.5,
        },
        pathB: {
            bodyColor: '#8aa5c8',
            coreColor: '#f5f8ff',
            accentColor: '#485b7e',
            finColor: '#6a80a8',
            exhaustColor: '#ff9a42',
            trailColor: '#9ac4ff',
            trailAccent: '#ffd090',
            size: 3.5,
        },
        crit: {
            coreColor: '#ffffff',
            glowColor: '#ffd6a8',
        },
    },

    flame: {
        base: {
            family: 'plume',
            bodyColor: '#ff8a2a',
            coreColor: '#ffd36a',
            accentColor: '#c94d18',
            emberColor: '#ffb24a',
            trailColor: '#ff8a2a',
            trailAccent: '#ffd36a',
            glowColor: '#ff9a42',
            impactStyle: 'embers',
            impactColor: '#ff8a2a',
        },
        pathA: {
            bodyColor: '#ffd08a',
            coreColor: '#fff3c8',
            accentColor: '#ff8c2a',
            emberColor: '#fff0aa',
            trailColor: '#ffd08a',
            trailAccent: '#ffffff',
            glowColor: '#fff1b8',
            width: 6,
        },
        pathB: {
            bodyColor: '#ff6a22',
            coreColor: '#ffb04a',
            accentColor: '#b82812',
            emberColor: '#ffea70',
            trailColor: '#ff6a22',
            trailAccent: '#ffb04a',
            glowColor: '#ff7a40',
            wobble: 0.26,
            size: 5.5,
        },
        crit: {
            coreColor: '#fff8c0',
            glowColor: '#ffd76a',
        },
    },

    venom: {
        base: {
            family: 'orb',
            bodyColor: '#57d85d',
            coreColor: '#c8ffb0',
            accentColor: '#2b7a34',
            ringColor: '#91ff78',
            trailColor: '#67f067',
            trailAccent: '#c8ffb0',
            glowColor: '#73ff73',
            impactStyle: 'toxicSplash',
            impactColor: '#57d85d',
        },
        pathA: {
            bodyColor: '#9fd95a',
            coreColor: '#e9ffb8',
            accentColor: '#6f8f24',
            ringColor: '#d4ff74',
            trailColor: '#c0f06a',
            trailAccent: '#f2ff9f',
            glowColor: '#d6ff72',
        },
        pathB: {
            bodyColor: '#45f05f',
            coreColor: '#d8fff0',
            accentColor: '#1c7a48',
            ringColor: '#99ffd0',
            trailColor: '#52ff8d',
            trailAccent: '#b8fff0',
            glowColor: '#74ffc1',
        },
        crit: {
            coreColor: '#ffffff',
            glowColor: '#dfff9a',
        },
    },

    mortar: {
        base: {
            family: 'shell',
            bodyColor: '#9a846b',
            coreColor: '#6f5a46',
            accentColor: '#d0b28d',
            trailColor: '#9e866d',
            trailAccent: '#5f5248',
            smokeColor: '#75675a',
            glowColor: '#caa278',
            impactStyle: 'seismicBurst',
            impactColor: '#caa278',
            size: 5.5,
        },
        pathA: {
            bodyColor: '#7d6b5c',
            coreColor: '#4e433a',
            accentColor: '#b89a7d',
            trailColor: '#9a8169',
            trailAccent: '#706154',
            glowColor: '#d0a680',
        },
        pathB: {
            bodyColor: '#a79b8f',
            coreColor: '#d9d1c8',
            accentColor: '#6f6760',
            trailColor: '#b4aca4',
            trailAccent: '#ece4dc',
            glowColor: '#d7c6b2',
            size: 5,
        },
        crit: {
            coreColor: '#fff0d6',
            glowColor: '#ffe0aa',
        },
    },

    necro: {
        base: {
            family: 'orb',
            bodyColor: '#9d62ff',
            coreColor: '#d7b8ff',
            accentColor: '#5628a8',
            ringColor: '#c88cff',
            trailColor: '#b07cff',
            trailAccent: '#e4c8ff',
            glowColor: '#b47dff',
            impactStyle: 'soulBurst',
            impactColor: '#b07cff',
            size: 4.5,
        },
        pathA: {
            bodyColor: '#7d78ff',
            coreColor: '#efe6ff',
            accentColor: '#5340b8',
            ringColor: '#c9bcff',
            trailColor: '#8ea0ff',
            trailAccent: '#efe6ff',
            glowColor: '#a8b0ff',
        },
        pathB: {
            bodyColor: '#b06dff',
            coreColor: '#ffe0ff',
            accentColor: '#6f2e8e',
            ringColor: '#f1a8ff',
            trailColor: '#cf8cff',
            trailAccent: '#ffd8ff',
            glowColor: '#d79cff',
            trailMode: 'ghost',
        },
        crit: {
            coreColor: '#ffffff',
            glowColor: '#f0c8ff',
        },
    },
};

const LASER_BEAM_VISUALS = {
    base: {
        colorStart: '#ff4060',
        colorEnd: '#ffffff',
        coreStart: '#ff9ab0',
        coreEnd: '#ffffff',
        glowColor: '#ff6080',
        widthBase: 2.0,
        widthRamp: 3.0,
        pulseHz: 12,
        pulseAmp: 0.08,
        jitter: 0.2,
        taper: 1.0,
    },
    focused: {
        colorStart: '#ff3050',
        colorEnd: '#ffffff',
        coreStart: '#ffd0de',
        coreEnd: '#ffffff',
        glowColor: '#ff6a95',
        widthBase: 2.2,
        widthRamp: 3.8,
        pulseHz: 14,
        pulseAmp: 0.12,
        jitter: 0.25,
    },
    prism: {
        colorStart: '#ff50c0',
        colorEnd: '#b8ffff',
        coreStart: '#ffd8ff',
        coreEnd: '#ffffff',
        glowColor: '#d070ff',
        widthBase: 1.8,
        widthRamp: 2.2,
        pulseHz: 10,
        pulseAmp: 0.1,
        jitter: 0.15,
        dual: true,
        dualOffset: 1.8,
        altColor: '#80e0ff',
    },
    split: {
        colorStart: '#d56cff',
        colorEnd: '#ffffff',
        coreStart: '#f0c8ff',
        coreEnd: '#ffffff',
        glowColor: '#c080ff',
        widthBase: 1.6,
        widthRamp: 1.8,
        pulseHz: 11,
        pulseAmp: 0.09,
        jitter: 0.2,
        dual: true,
        dualOffset: 1.2,
        altColor: '#88e8ff',
    },
    deathRay: {
        colorStart: '#fff0b8',
        colorEnd: '#ffffff',
        coreStart: '#ffffff',
        coreEnd: '#ffffff',
        glowColor: '#fff2a8',
        widthBase: 5.5,
        widthRamp: 2.5,
        pulseHz: 18,
        pulseAmp: 0.18,
        jitter: 0.35,
        dual: true,
        dualOffset: 2.3,
        altColor: '#ffd070',
        taper: 1.1,
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
    flame: {
        name: 'Flame Tower', nickname: 'Pyro',
        baseCost: 125, key: '8',
        color: '#8a3a10', iconColor: '#ff6020',
        description: 'Burns enemies over time with fire',
        tiers: {
            1: { damage: 12, range: 100, fireRate: 0.7, special: { burnDPS: 8, burnDuration: 2 } },
            2: { damage: 18, range: 110, fireRate: 0.65, special: { burnDPS: 14, burnDuration: 2.5 }, cost: 150 },
        },
        pathA: {
            name: 'Inferno', desc: 'Intense single-target incineration',
            icon: '\u{1F525}',
            tiers: {
                3: { damage: 30, range: 120, fireRate: 0.6, cost: 200,
                    special: { burnDPS: 25, burnDuration: 3, burnRamp: 0.1 },
                    desc: 'Burn intensifies +10%/s on same target' },
                4: { damage: 50, range: 130, fireRate: 0.55, cost: 300,
                    special: { burnDPS: 45, burnDuration: 4, burnRamp: 0.15, meltArmor: 2 },
                    desc: 'Burns melt 2 armor/s, +15% ramp' },
                5: { damage: 90, range: 140, fireRate: 0.5, cost: 500,
                    special: { burnDPS: 80, burnDuration: 5, burnRamp: 0.2, meltArmor: 4, immolate: true, immolateCd: 10, immolateDmg: 500, immolateRadius: 60 },
                    desc: 'Max burn, Immolate: 500 AOE every 10s' },
            }
        },
        pathB: {
            name: 'Wildfire', desc: 'Fire spreads between enemies',
            icon: '\u{1F32A}',
            tiers: {
                3: { damage: 15, range: 110, fireRate: 0.65, cost: 200,
                    special: { burnDPS: 12, burnDuration: 2.5, fireSpread: 1, spreadRadius: 50 },
                    desc: 'Fire spreads to 1 nearby enemy' },
                4: { damage: 22, range: 120, fireRate: 0.6, cost: 300,
                    special: { burnDPS: 18, burnDuration: 3, fireSpread: 2, spreadRadius: 60, spreadChance: 0.4 },
                    desc: 'Spreads to 2, 40% on hit' },
                5: { damage: 30, range: 130, fireRate: 0.55, cost: 500,
                    special: { burnDPS: 25, burnDuration: 3.5, fireSpread: 4, spreadRadius: 80, spreadChance: 0.6, firestorm: true, stormCd: 12, stormDuration: 4, stormRadius: 120, stormDPS: 15 },
                    desc: 'Spreads to 4, Firestorm every 12s' },
            }
        },
    },
    venom: {
        name: 'Venom Tower', nickname: 'Toxin',
        baseCost: 100, key: '9',
        color: '#2a6a2a', iconColor: '#40e040',
        description: 'Stacking poison and armor corrosion',
        tiers: {
            1: { damage: 8, range: 110, fireRate: 0.6, special: { poisonDPS: 5, poisonDuration: 3, poisonStacks: 3 } },
            2: { damage: 12, range: 120, fireRate: 0.55, special: { poisonDPS: 8, poisonDuration: 3.5, poisonStacks: 4 }, cost: 125 },
        },
        pathA: {
            name: 'Plague Doctor', desc: 'Poison spreads on kill',
            icon: '\u{2620}',
            tiers: {
                3: { damage: 18, range: 130, fireRate: 0.5, cost: 175,
                    special: { poisonDPS: 14, poisonDuration: 4, poisonStacks: 5, plagueSpread: 2, spreadRadius: 70 },
                    desc: 'Poison spreads to 2 on victim death' },
                4: { damage: 28, range: 140, fireRate: 0.45, cost: 260,
                    special: { poisonDPS: 22, poisonDuration: 5, poisonStacks: 6, plagueSpread: 3, spreadRadius: 90, deathCloud: true, cloudDuration: 3, cloudRadius: 50 },
                    desc: 'Spreads 3, death cloud poisons area' },
                5: { damage: 45, range: 150, fireRate: 0.4, cost: 440,
                    special: { poisonDPS: 35, poisonDuration: 6, poisonStacks: 8, plagueSpread: 5, spreadRadius: 110, deathCloud: true, cloudDuration: 4, cloudRadius: 70, pandemic: true, pandemicCd: 15, pandemicDuration: 5 },
                    desc: 'Spreads 5, Pandemic: all enemies poisoned' },
            }
        },
        pathB: {
            name: 'Corrosive', desc: 'Strips armor over time',
            icon: '\u{1F9EA}',
            tiers: {
                3: { damage: 15, range: 120, fireRate: 0.55, cost: 175,
                    special: { poisonDPS: 10, poisonDuration: 3, corrodeDPS: 1, corrodeMax: 5 },
                    desc: 'Corrodes 1 armor/s (max -5)' },
                4: { damage: 25, range: 130, fireRate: 0.5, cost: 260,
                    special: { poisonDPS: 16, poisonDuration: 3.5, corrodeDPS: 2, corrodeMax: 10, weakenVuln: 0.15 },
                    desc: 'Corrodes 2/s, weakened +15% dmg taken' },
                5: { damage: 40, range: 140, fireRate: 0.45, cost: 440,
                    special: { poisonDPS: 28, poisonDuration: 4, corrodeDPS: 4, corrodeMax: 999, weakenVuln: 0.25, dissolve: true, dissolveCd: 12, dissolveRadius: 80, dissolveArmorRemove: 1.0 },
                    desc: 'Infinite corrode, Dissolve: strip all armor' },
            }
        },
    },
    mortar: {
        name: 'Mortar Tower', nickname: 'Bombardier',
        baseCost: 160, key: '0',
        color: '#5a4a3a', iconColor: '#a08060',
        description: 'Ultra-long range, massive slow AOE',
        tiers: {
            1: { damage: 40, range: 220, fireRate: 2.5, splash: 55, special: null },
            2: { damage: 65, range: 240, fireRate: 2.3, splash: 65, special: null, cost: 225 },
        },
        pathA: {
            name: 'Earthquake', desc: 'Ground denial and terrain control',
            icon: '\u{1F30D}',
            tiers: {
                3: { damage: 120, range: 260, fireRate: 2.5, splash: 80, cost: 350,
                    special: { quakeZone: true, zoneDuration: 3, zoneSlow: 0.4, zoneRadius: 60 },
                    desc: 'Shots leave tremor zones (40% slow, 3s)' },
                4: { damage: 220, range: 280, fireRate: 2.8, splash: 100, cost: 525,
                    special: { quakeZone: true, zoneDuration: 4, zoneSlow: 0.5, zoneRadius: 80, zoneDPS: 10, quakeStun: 0.15 },
                    desc: 'Zones deal 10 DPS, 15% stun on impact' },
                5: { damage: 400, range: 300, fireRate: 3.0, splash: 130, cost: 880,
                    special: { quakeZone: true, zoneDuration: 5, zoneSlow: 0.6, zoneRadius: 100, zoneDPS: 25, quakeStun: 0.25, tectonic: true, tectonicCd: 14, tectonicRadius: 180, tectonicDmg: 600, tectonicStun: 2 },
                    desc: 'Zones persist, Tectonic Slam every 14s' },
            }
        },
        pathB: {
            name: 'Shrapnel', desc: 'Anti-swarm fragmentation',
            icon: '\u{1F4A2}',
            tiers: {
                3: { damage: 30, range: 230, fireRate: 2.0, splash: 50, cost: 350,
                    special: { shrapnelCount: 6, shrapnelDmg: 15, shrapnelRadius: 100 },
                    desc: 'Shells burst into 6 shrapnel pieces' },
                4: { damage: 40, range: 250, fireRate: 1.8, splash: 55, cost: 525,
                    special: { shrapnelCount: 10, shrapnelDmg: 20, shrapnelRadius: 120, shrapnelPierce: 1 },
                    desc: '10 shrapnel, each pierces 1 enemy' },
                5: { damage: 55, range: 270, fireRate: 1.6, splash: 60, cost: 880,
                    special: { shrapnelCount: 15, shrapnelDmg: 30, shrapnelRadius: 150, shrapnelPierce: 2, clusterBomb: true, clusterCd: 10, clusterCount: 5, clusterDmg: 80, clusterRadius: 70 },
                    desc: '15 shrapnel, Cluster Bomb every 10s' },
            }
        },
    },
    necro: {
        name: 'Necro Tower', nickname: 'Reaper',
        baseCost: 225, key: '-',
        color: '#3a1a4a', iconColor: '#a040ff',
        description: 'Dark magic that feeds on death',
        tiers: {
            1: { damage: 20, range: 120, fireRate: 1.0, special: { soulGain: 1, maxSouls: 10, soulDmgBonus: 0.03 } },
            2: { damage: 30, range: 130, fireRate: 0.95, special: { soulGain: 1, maxSouls: 15, soulDmgBonus: 0.04 }, cost: 300 },
        },
        pathA: {
            name: 'Soul Harvester', desc: 'Souls become destructive projectiles',
            icon: '\u{1F480}',
            tiers: {
                3: { damage: 45, range: 140, fireRate: 0.9, cost: 425,
                    special: { soulGain: 2, maxSouls: 25, soulDmgBonus: 0.05, soulBolt: true, soulBoltDmg: 30, soulBoltInterval: 2 },
                    desc: '+5%/soul, fires soul bolts at enemies' },
                4: { damage: 70, range: 150, fireRate: 0.85, cost: 640,
                    special: { soulGain: 2, maxSouls: 40, soulDmgBonus: 0.06, soulBolt: true, soulBoltDmg: 50, soulBoltInterval: 1.5, soulExplosion: true, soulExpRadius: 40 },
                    desc: '+6%/soul, soul bolts explode on impact' },
                5: { damage: 110, range: 160, fireRate: 0.8, cost: 1060,
                    special: { soulGain: 3, maxSouls: 60, soulDmgBonus: 0.08, soulBolt: true, soulBoltDmg: 80, soulBoltInterval: 1, soulExplosion: true, soulExpRadius: 60, reaper: true, reaperCd: 12, reaperDmg: 0.25 },
                    desc: '+8%/soul, Reap: 25% max HP to all in range' },
            }
        },
        pathB: {
            name: 'Wither', desc: 'Life drain aura and regeneration',
            icon: '\u{1F47B}',
            tiers: {
                3: { damage: 25, range: 130, fireRate: 0.95, cost: 425,
                    special: { soulGain: 1, maxSouls: 20, soulDmgBonus: 0.04, witherAura: true, witherRadius: 80, witherDPS: 8 },
                    desc: 'Aura drains 8 DPS from nearby enemies' },
                4: { damage: 40, range: 140, fireRate: 0.9, cost: 640,
                    special: { soulGain: 1, maxSouls: 30, soulDmgBonus: 0.05, witherAura: true, witherRadius: 100, witherDPS: 15, witherHeal: true, healPerKill: 1 },
                    desc: 'Wither 15 DPS, kills restore 1 life' },
                5: { damage: 65, range: 150, fireRate: 0.85, cost: 1060,
                    special: { soulGain: 2, maxSouls: 50, soulDmgBonus: 0.06, witherAura: true, witherRadius: 130, witherDPS: 25, witherHeal: true, healPerKill: 1, witherSlow: 0.2, deathPact: true, pactCd: 18, pactDuration: 5, pactDmgMult: 2 },
                    desc: 'Wither 25 DPS + slow, Death Pact: 2x dmg' },
            }
        },
    },
    boost: {
        name: 'Boost Tower', nickname: 'Catalyst',
        baseCost: 250, key: '=',
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

// ENEMIES and generateWaves are now sourced from split config modules.

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
            { type: 'stump', x: 12, y: 0 }, { type: 'stump', x: 26, y: 4 },
            { type: 'grass_tall', x: 7, y: 12 }, { type: 'grass_tall', x: 19, y: 2 },
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

CONFIG.PROGRESSION = {
    STARTER_TOWERS: ['arrow', 'cannon', 'ice', 'lightning', 'sniper'],
    LICENSE_ORDER: ['flame', 'venom', 'boost', 'missile', 'mortar', 'laser', 'necro'],
    BAND_GATES: {
        easy: {
            label: 'Training Grounds',
            requires: null,
        },
        normal: {
            label: 'The Battlefield',
            requires: {
                and: [
                    { marksAtLeast: 9 },
                    { clearMap: 4 },
                ],
            },
        },
        hard: {
            label: 'The Gauntlet',
            requires: {
                and: [
                    { marksAtLeast: 22 },
                    { clearMap: 9 },
                ],
            },
        },
        nightmare: {
            label: 'The Void',
            requires: {
                and: [
                    { marksAtLeast: 38 },
                    { clearMap: 14 },
                ],
            },
        },
    },
    TOWER_LICENSES: {
        flame: {
            label: 'Flame Tower',
            requires: {
                and: [
                    { marksAtLeast: 2 },
                    { clearMap: 0 },
                ],
            },
            legacyProof: {
                or: [
                    { clearMap: 0 },
                    { mapsClearedAtLeast: 1 },
                ],
            },
        },
        venom: {
            label: 'Venom Tower',
            requires: {
                and: [
                    { marksAtLeast: 5 },
                    { clearMap: 1 },
                ],
            },
            legacyProof: {
                or: [
                    { clearMap: 1 },
                    { mapsClearedAtLeast: 2 },
                ],
            },
        },
        boost: {
            label: 'Boost Tower',
            requires: {
                and: [
                    { marksAtLeast: 6 },
                    { mapsClearedAtLeast: 2 },
                ],
            },
            legacyProof: {
                or: [
                    { mapsClearedAtLeast: 3 },
                    { researchNodesAtLeast: 5 },
                ],
            },
        },
        missile: {
            label: 'Missile Tower',
            requires: {
                and: [
                    { marksAtLeast: 10 },
                    { mapsClearedAtLeast: 3 },
                    { bossKillsAtLeast: 3 },
                ],
            },
            legacyProof: {
                or: [
                    { clearDifficultyBand: 'easy' },
                    { achievementUnlocked: 'boss5' },
                ],
            },
        },
        mortar: {
            label: 'Mortar Tower',
            requires: {
                and: [
                    { marksAtLeast: 14 },
                    { clearMap: 5 },
                    { peakLinksAtLeast: 2 },
                ],
            },
            legacyProof: {
                or: [
                    { clearMap: 5 },
                    { mapsClearedAtLeast: 8 },
                ],
            },
        },
        laser: {
            label: 'Laser Tower',
            requires: {
                and: [
                    { marksAtLeast: 18 },
                    { clearMap: 7 },
                    { researchNodesAtLeast: 6 },
                ],
            },
            legacyProof: {
                or: [
                    { clearDifficultyBand: 'normal' },
                    { researchNodesAtLeast: 10 },
                ],
            },
        },
        necro: {
            label: 'Necro Tower',
            requires: {
                and: [
                    { marksAtLeast: 24 },
                    {
                        or: [
                            { clearMap: 10 },
                            { endlessDepthAtLeast: 10 },
                        ],
                    },
                    {
                        or: [
                            { achievementUnlocked: 'mythic_tower' },
                            { clearDifficultyBand: 'hard' },
                        ],
                    },
                ],
            },
            legacyProof: {
                or: [
                    { achievementUnlocked: 'mythic_tower' },
                    { clearDifficultyBand: 'hard' },
                    { endlessDepthAtLeast: 10 },
                ],
            },
        },
    },
    MAP_DIRECTIVES: [
        { id: 'frost_lock', name: 'Frost Lock', desc: 'Apply 20 freeze effects and win.', requirement: { freezeApplicationsAtLeast: 20 } },
        { id: 'war_chest', name: 'War Chest', desc: 'Reach 500 gold at any point and win.', requirement: { maxGoldAtLeast: 500 } },
        { id: 'relay_command', name: 'Relay Command', desc: 'Use overclock at least once in a winning run.', requirement: { overclockUsesAtLeast: 1 } },
        { id: 'burn_scar', name: 'Burn Scar', desc: 'Deal 2500 burn damage and win.', requirement: { burnDamageAtLeast: 2500 } },
        { id: 'toxic_crown', name: 'Toxic Crown', desc: 'Deal 2000 poison damage and win.', requirement: { poisonDamageAtLeast: 2000 } },

        { id: 'frost_relay', name: 'Frost Relay', desc: 'Apply 45 freeze effects, reach 1 active link, and win.', requirement: { and: [{ freezeApplicationsAtLeast: 45 }, { peakLinksAtLeast: 1 }] } },
        { id: 'ember_reserve', name: 'Ember Reserve', desc: 'Deal 5000 burn damage and win.', requirement: { burnDamageAtLeast: 5000 } },
        { id: 'venom_coast', name: 'Venom Coast', desc: 'Deal 4500 poison damage and win.', requirement: { poisonDamageAtLeast: 4500 } },
        { id: 'pressure_net', name: 'Pressure Net', desc: 'Reach 2 active links, use 3 abilities, and win.', requirement: { and: [{ peakLinksAtLeast: 2 }, { abilitiesUsedAtLeast: 3 }] } },
        { id: 'twin_apex', name: 'Twin Apex', desc: 'Reach 2 Tier 5 towers and win.', requirement: { peakTier5AtLeast: 2 } },

        { id: 'captain_breaker', name: 'Captain Breaker', desc: 'Kill 1 captain and win.', requirement: { captainKillsAtLeast: 1 } },
        { id: 'whiteout_lock', name: 'Whiteout Lock', desc: 'Apply 90 freeze effects, take no leaks, and win.', requirement: { and: [{ freezeApplicationsAtLeast: 90 }, { noLeaks: true }] } },
        { id: 'inferno_feed', name: 'Inferno Feed', desc: 'Deal 12000 burn damage and win.', requirement: { burnDamageAtLeast: 12000 } },
        { id: 'blight_hunt', name: 'Blight Hunt', desc: 'Deal 9000 poison damage, kill 1 captain, and win.', requirement: { and: [{ poisonDamageAtLeast: 9000 }, { captainKillsAtLeast: 1 }] } },
        { id: 'iron_discipline', name: 'Iron Discipline', desc: 'Kill 1 captain, sell no towers, and win.', requirement: { and: [{ captainKillsAtLeast: 1 }, { noSell: true }] } },

        { id: 'nexus_hunt', name: 'Nexus Hunt', desc: 'Kill 2 captains and win.', requirement: { captainKillsAtLeast: 2 } },
        { id: 'ash_spiral', name: 'Ash Spiral', desc: 'Deal 18000 burn damage and win.', requirement: { burnDamageAtLeast: 18000 } },
        { id: 'pandemic_spiral', name: 'Pandemic Spiral', desc: 'Deal 15000 poison damage and win.', requirement: { poisonDamageAtLeast: 15000 } },
        { id: 'frozen_command', name: 'Frozen Command', desc: 'Apply 150 freeze effects, kill 1 captain, and win.', requirement: { and: [{ freezeApplicationsAtLeast: 150 }, { captainKillsAtLeast: 1 }] } },
        { id: 'final_oblivion', name: 'Final Oblivion', desc: 'Kill 2 captains, reach 3 Tier 5 towers, take no leaks, and win.', requirement: { and: [{ captainKillsAtLeast: 2 }, { peakTier5AtLeast: 3 }, { noLeaks: true }] } },
    ],
};

// RESEARCH, PLAYER_ABILITIES, and ACHIEVEMENTS now come from split config modules.

function installLegacyConfigGlobals(globalScope = globalThis) {
    if (!globalScope || typeof globalScope !== 'object') return;

    Object.assign(globalScope, {
        CONFIG,
        PROJECTILE_FAMILY_DEFAULTS,
        PROJECTILE_IMPACT_PRESETS,
        PROJECTILE_VISUALS,
        LASER_BEAM_VISUALS,
        TOWERS,
        ENEMIES,
        MAPS,
        RESEARCH,
        PLAYER_ABILITIES,
        ACHIEVEMENTS,
        generateWaves,
        getTowerTotalCost,
        getScaledUpgradeCost,
    });
}

export {
    CONFIG,
    PROJECTILE_FAMILY_DEFAULTS,
    PROJECTILE_IMPACT_PRESETS,
    PROJECTILE_VISUALS,
    LASER_BEAM_VISUALS,
    TOWERS,
    ENEMIES,
    MAPS,
    RESEARCH,
    PLAYER_ABILITIES,
    ACHIEVEMENTS,
    generateWaves,
    getTowerTotalCost,
    getScaledUpgradeCost,
    installLegacyConfigGlobals,
};
