// ===== CENTRAL GAME STATE =====
const GameState = {
    screen: 'menu', // menu, difficulty, mapselect, doctrine, game, research, achievements, howtoplay, settings
    gamePhase: 'idle', // idle (between waves), playing, paused, gameover, victory
    mapIndex: 0,
    wave: 0,
    maxWave: 30,
    gold: 200,
    lives: 20,
    maxLives: 20,
    score: 0,
    gameSpeed: 1,
    time: 0,

    // Game objects
    towers: [],
    enemies: [],
    projectiles: [],
    particles: [],
    floatingTexts: [],
    beams: [],

    // Wave state
    waveEnemies: [], // queue of enemies to spawn
    spawnTimer: 0,
    enemiesAlive: 0,
    enemiesSpawned: 0,
    totalEnemiesInWave: 0,

    // Selection
    selectedTowerType: null,
    selectedTower: null,
    placementValid: false,
    mouseGridCol: -1,
    mouseGridRow: -1,
    mouseX: 0,
    mouseY: 0,

    // Map data (set when map loads)
    grid: null, // 2D array: 0=buildable, 1=path, 2=blocked
    waypoints: [], // world coordinates
    pathTiles: new Set(), // "col,row" strings

    // Abilities
    abilities: [],
    abilityTarget: null,

    // Tower abilities
    towerAbilityCooldowns: {},

    // Active effects
    globalSlow: 0,
    globalSlowTimer: 0,
    globalDmgBuff: 0,
    globalDmgBuffTimer: 0,
    bonusLivesTimer: 0,
    bonusLivesAmount: 0,
    supernovaTimer: 0,
    supernovaSource: null,

    // Research / persistent
    researchPoints: 0,
    purchasedResearch: new Set(),
    unlockedMaps: [
        true, false, false, false, false,   // easy (0-4)
        false, false, false, false, false,  // normal (5-9)
        false, false, false, false, false,  // hard (10-14)
        false, false, false, false, false,  // nightmare (15-19)
    ],
    achievementsUnlocked: new Set(),
    mapScores: [0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0],
    mapWaveRecords: [0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0],
    metaProgress: {
        progressionVersion: 1,
        commandMarks: 0,
        mapMarkBits: new Array(20).fill(0),
        towerLicenses: {},
        legacyProgressionBackfillDone: false,
        lifetimeMapsCleared: 0,
        lifetimePerfectClears: 0,
        lifetimeDirectiveClears: 0,
        lifetimeBossKills: 0,
        lifetimeCaptainKills: 0,
        endlessBestDepthByMap: new Array(20).fill(0),
        endlessMilestonesClaimed: {},
        totalEndlessMilestones: 0,
        challengeWinStreak: 0,
        bestChallengeWinStreak: 0,
        totalChallengeVictories: 0,
        weeklyRecords: {},
    },

    // Weekly challenge run state (not persistent outside save slots)
    weeklyChallengeRun: null,

    // Doctrine (Phase 5)
    pendingMapIndex: null,
    pendingDoctrineId: null,
    activeDoctrineId: null,
    doctrineEffects: {
        startGold: 0,
        startLives: 0,
        interestRateDelta: 0,
        interestCapDelta: 0,
        abilityCooldownMult: 1,
        globalDamageMult: 1,
        eliteBossDamageMult: 1,
    },

    // Stats for achievements
    stats: {
        totalKills: 0,
        bossKills: 0,
        maxGold: 0,
        maxMastery: 0,
        maxTier: 0,
        perfectWaves: 0,
        wavesCompleted: 0,
        mapsCompleted: [],
        towerTypesBuilt: 0,
        usedSpeed3: false,
        maxCombo: 0,
        researchCount: 0,
        towerTypesSet: new Set(),
        leaksThisGame: 0,
        overclockUses: 0,
        abilitiesUsed: 0,
        towersNeverSold: true,
        towersPlacedThisRun: 0,
        maxActiveLinks: 0,
        tier5CountPeak: 0,
        freezeApplications: 0,
        burnDamageDealt: 0,
        poisonDamageDealt: 0,
        captainKillsThisRun: 0,
    },

    // Settings
    settings: {
        musicVolume: 0.7,
        sfxVolume: 0.8,
        shakeIntensity: 1.0,
        showRanges: false,
        showHealthBars: true,
        showDamageNumbers: true,
        autoStart: false,
        difficulty: 'normal',
        hotkeys: {
            startWave: 'Space',
            pause: 'Escape',
            sellTower: 'KeyS',
            upgradeTower: 'KeyU',
            cycleTower: 'Tab',
            toggleRanges: 'KeyG',
            speedUp: 'Equal',
            speedReset: 'Minus',
            showShortcuts: 'Slash',
            toggleFPS: 'KeyF',
            selectAll: 'KeyA',
            ability1: 'KeyQ',
            ability2: 'KeyW',
            ability3: 'KeyE',
            ability4: 'KeyR',
            ability5: 'KeyT',
        },
    },

    // Second chance (research)
    secondChanceUsed: false,
    shieldCharges: 0,
    lastStandTimer: 0,
    invulnTimer: 0,

    // Boss intro sequence
    bossIntro: { active: false, timer: 0, duration: 0, name: '', abilities: [], x: 0, y: 0 },

    // Challenge modifiers
    activeChallenges: [],
    _pendingChallenges: [],

    // Screen effects
    screenFlash: null,
    poisonClouds: [],
    pathLength: 0,

    // FPS display
    showFPS: false,

    // Computed research bonuses (cached)
    researchBonuses: {},
    researchCompressionNotes: [],

    reset() {
        this.wave = 0;
        const diffPreset = CONFIG.DIFFICULTY_PRESETS[this.settings.difficulty] || CONFIG.DIFFICULTY_PRESETS.normal;
        this.gold = diffPreset.startingGold;
        this.lives = diffPreset.startingLives;
        this.maxLives = diffPreset.startingLives;
        this.score = 0;
        this.time = 0;
        this.gameSpeed = 1;
        this.towers = [];
        this.enemies = [];
        this.projectiles = [];
        this.particles = [];
        this.floatingTexts = [];
        this.beams = [];
        this.poisonClouds = [];
        this.waveEnemies = [];
        this.spawnTimer = 0;
        this.enemiesAlive = 0;
        this.enemiesSpawned = 0;
        this.totalEnemiesInWave = 0;
        this.selectedTowerType = null;
        this.selectedTower = null;
        this.gamePhase = 'idle';
        this.globalSlow = 0;
        this.globalSlowTimer = 0;
        this.globalDmgBuff = 0;
        this.globalDmgBuffTimer = 0;
        this.bonusLivesTimer = 0;
        this.bonusLivesAmount = 0;
        this.supernovaTimer = 0;
        this.supernovaSource = null;
        this.bossIntro = { active: false, timer: 0, duration: 0, name: '', abilities: [], x: 0, y: 0 };
        this.secondChanceUsed = false;
        this.shieldCharges = 0;
        this.lastStandTimer = 0;
        this.invulnTimer = 0;
        this.towerAbilityCooldowns = {};
        this.activeChallenges = [...(this._pendingChallenges || [])];

        // Apply doctrine effects for this run
        this.computeDoctrineEffects();
        const de = this.doctrineEffects;
        this.gold += (de.startGold || 0);
        this.lives += (de.startLives || 0);
        this.lives = Math.max(1, Math.floor(this.lives));
        this.gold = Math.max(0, Math.floor(this.gold));
        this.maxLives = this.lives;

        // Apply research bonuses
        this.researchCompressionNotes = [];
        this.computeResearchBonuses();
        const rb = this.researchBonuses;
        this.gold += (rb.bonusGold || 0);
        this.lives += (rb.bonusLives || 0);
        this.maxLives = this.lives;
        if (rb.startShield) this.shieldCharges = rb.startShield;

        // Reset stats
        this.stats = {
            totalKills: 0, bossKills: 0, maxGold: this.gold,
            maxMastery: 0, maxTier: 1, perfectWaves: 0,
            wavesCompleted: 0, mapsCompleted: [...(this.stats.mapsCompleted || [])],
            towerTypesBuilt: 0, usedSpeed3: false, maxCombo: 0,
            researchCount: this.purchasedResearch.size,
            towerTypesSet: new Set(), leaksThisGame: 0,
            overclockUses: 0, abilitiesUsed: 0,
            towersNeverSold: true, towersPlacedThisRun: 0,
            maxActiveLinks: 0, tier5CountPeak: 0,
            freezeApplications: 0, burnDamageDealt: 0,
            poisonDamageDealt: 0, captainKillsThisRun: 0,
        };

        // Init abilities
        this.abilities = PLAYER_ABILITIES.map(a => ({
            ...a, cooldownTimer: 0, ready: true
        }));
    },

    computeResearchBonuses() {
        const rb = {};
        for (const branchKey of Object.keys(RESEARCH)) {
            const branch = RESEARCH[branchKey];
            for (const row of branch.nodes) {
                for (const node of row) {
                    if (this.purchasedResearch.has(node.id)) {
                        for (const [k, v] of Object.entries(node.effect)) {
                            if (typeof v === 'number') {
                                rb[k] = (rb[k] || 0) + v;
                            } else {
                                rb[k] = v;
                            }
                        }
                    }
                }
            }
        }

        this.researchCompressionNotes = this._applyResearchBonusCompression(rb);
        this.researchBonuses = rb;
    },

    _clampBonusValue(value, min, max) {
        if (!Number.isFinite(value)) return value;
        let out = value;
        if (Number.isFinite(min)) out = Math.max(min, out);
        if (Number.isFinite(max)) out = Math.min(max, out);
        return out;
    },

    _applyResearchBonusCompression(rb) {
        const rules = CONFIG.RESEARCH_COMPRESSION_RULES || {};
        const notes = [];

        const clamp = (key, min, max, note) => {
            if (!Number.isFinite(rb[key])) return;
            const before = rb[key];
            const after = this._clampBonusValue(before, min, max);
            if (Math.abs(after - before) > 0.00001) {
                rb[key] = after;
                notes.push(note || key);
            }
        };

        clamp('bonusLives', 0, rules.bonusLivesMax, 'Lives cap');
        clamp('bonusGold', 0, rules.bonusGoldMax, 'Start gold cap');
        clamp('bonusRP', 0, rules.bonusRpMax, 'RP gain cap');

        clamp('costReduce', 0, rules.costReduceMax, 'Build discount cap');
        clamp('upgradeDiscount', 0, rules.upgradeDiscountMax, 'Upgrade discount cap');
        clamp('dmgMult', 0, rules.dmgMultMax, 'Damage stack cap');
        clamp('rateMult', 0, rules.rateMultMax, 'Rate stack cap');
        clamp('rangeMult', 0, rules.rangeMultMax, 'Range stack cap');
        clamp('critChance', 0, rules.critChanceMax, 'Crit chance cap');
        clamp('critDmg', 0, rules.critDmgMax, 'Crit damage cap');

        clamp('interestRate', 0, rules.interestRateMax, 'Interest rate cap');
        clamp('interestCap', 0, rules.interestCapMax, 'Interest cap cap');
        clamp('sellRefund', CONFIG.SELL_REFUND, rules.sellRefundMax, 'Sell refund cap');
        clamp('killGoldBonus', 0, rules.killGoldBonusMax, 'Kill gold cap');
        clamp('abilityCdOnEliteKill', 0, rules.abilityCdOnEliteKillMax, 'Elite CD refund cap');
        clamp('goldRush', 0, rules.goldRushMax, 'Gold rush cap');
        clamp('waveBonusMult', 0, rules.waveBonusMultMax, 'Wave bonus cap');

        return notes;
    },

    getActiveDoctrine() {
        const doctrineId = this.activeDoctrineId;
        if (!doctrineId || !Array.isArray(CONFIG.DOCTRINES)) return null;
        return CONFIG.DOCTRINES.find(d => d.id === doctrineId) || null;
    },

    computeDoctrineEffects() {
        const defaults = {
            startGold: 0,
            startLives: 0,
            interestRateDelta: 0,
            interestCapDelta: 0,
            abilityCooldownMult: 1,
            globalDamageMult: 1,
            eliteBossDamageMult: 1,
        };

        const doctrine = this.getActiveDoctrine();
        if (!doctrine || !doctrine.effects || typeof doctrine.effects !== 'object') {
            this.doctrineEffects = { ...defaults };
            return;
        }

        this.doctrineEffects = {
            ...defaults,
            ...doctrine.effects,
        };
        this.doctrineEffects = this._applyDoctrineBalanceLimits(this.doctrineEffects);
    },

    _applyDoctrineBalanceLimits(effects) {
        const limits = CONFIG.DOCTRINE_BALANCE_LIMITS || {};
        const out = { ...effects };

        const clampKey = (key) => {
            const rule = limits[key];
            if (!rule || !Number.isFinite(out[key])) return;
            out[key] = this._clampBonusValue(out[key], rule.min, rule.max);
        };

        clampKey('startGold');
        clampKey('startLives');
        clampKey('interestRateDelta');
        clampKey('interestCapDelta');
        clampKey('abilityCooldownMult');
        clampKey('globalDamageMult');
        clampKey('eliteBossDamageMult');

        return out;
    },
};
