// ===== WAVE SPAWNER SYSTEM =====
const WaveSystem = {
    waveDefs: [],

    // Wave difficulty scaling multipliers
    difficultyScale: {
        hpMult: 1.0,
        speedMult: 1.0,
        armorMult: 1.0,
    },

    // Wave modifiers (applied every 5 waves)
    activeModifiers: [],
    currentScenario: null,
    currentFaction: null,
    currentWaveArc: null,
    currentMapPressure: null,
    availableModifiers: [
        { id: 'double_speed', name: 'Double Speed', desc: 'All enemies move 2x faster', icon: '>>',
            apply(enemy) { enemy.baseSpeed *= 2; enemy.speed = enemy.baseSpeed; } },
        { id: 'extra_armor', name: 'Extra Armor', desc: 'All enemies gain +5 armor', icon: 'AR',
            apply(enemy) { enemy.armor += 5; enemy.baseArmor += 5; } },
        { id: 'regen', name: 'Regenerating', desc: 'All enemies regenerate 1% HP/s', icon: 'RG',
            apply(enemy) { enemy.regenRate = enemy.maxHp * 0.01; } },
        { id: 'invisible_scouts', name: 'Invisible Scouts', desc: 'Fast enemies gain stealth', icon: 'ST',
            apply(enemy) {
                if (enemy.type === 'fast' || enemy.type === 'stealth') {
                    enemy.invisible = true;
                    enemy.stealthTimer = 3.0;
                }
            } },
        { id: 'shielded', name: 'Shielded Horde', desc: 'All enemies start with a small shield', icon: 'SH',
            apply(enemy) { enemy.shielded = true; enemy.shieldHp = enemy.maxHp * 0.15; } },
        { id: 'frenzy', name: 'Frenzy', desc: 'Enemies speed up as they lose HP', icon: 'FR',
            apply(enemy) { enemy.frenzy = true; } },
        { id: 'fortified', name: 'Fortified', desc: 'Enemies take 20% less damage', icon: 'FT',
            apply(enemy) { enemy.fortified = true; enemy.fortifiedReduction = 0.2; } },
        { id: 'swarm_surge', name: 'Swarm Surge', desc: 'Double the number of enemies, but half HP', icon: 'SW',
            // This modifier is handled at wave composition level, not per-enemy
            apply(enemy) { /* no-op: handled in startWave */ } },
    ],

    // Scenario layer (encounter identity)
    scenarioTemplates: [
        { id: 'rush_assault', name: 'Rush Assault', desc: 'Fast movers attack in tight waves.', threatTags: ['RUSH'] },
        { id: 'armored_column', name: 'Armored Column', desc: 'Heavy frontline units with reinforced plating.', threatTags: ['ARMORED'] },
        { id: 'support_convoy', name: 'Support Convoy', desc: 'Healer and guardian support pulses come faster.', threatTags: ['HEAL SUPPORT', 'SHIELD AURA'] },
        { id: 'stealth_ambush', name: 'Stealth Ambush', desc: 'Stealth and phantom units phase more aggressively.', threatTags: ['STEALTH'] },
        { id: 'siege_push', name: 'Siege Push', desc: 'Heavy targets become tougher and push steadily.', threatTags: ['SIEGE', 'ARMORED'] },
    ],

    // Enemy faction layer (Phase 6)
    factionTemplates: [
        {
            id: 'siege_foundry',
            name: 'Siege Foundry',
            desc: 'Forged armor columns with command captains and reinforced escorts.',
            captainId: 'siege_foreman',
            threatTags: ['FACTION: SIEGE FOUNDRY', 'CAPTAIN AURA', 'ARMORED'],
        },
        {
            id: 'veil_swarm',
            name: 'Veil Swarm',
            desc: 'Ambush cadres phase in from fog lanes with burst commanders.',
            captainId: 'veil_ambusher',
            threatTags: ['FACTION: VEIL SWARM', 'CAPTAIN AURA', 'AMBUSH'],
        },
        {
            id: 'blight_caravan',
            name: 'Blight Caravan',
            desc: 'Corrosive support convoys chain heals and sustain frontline pushes.',
            captainId: 'blight_matron',
            threatTags: ['FACTION: BLIGHT CARAVAN', 'CAPTAIN AURA', 'SUSTAIN'],
        },
    ],

    waveArcTemplates: {
        opener: {
            id: 'opener',
            name: 'Opener',
            desc: 'Probe lanes with light pressure and scouting detachments.',
            threatTags: ['ARC: OPENER'],
        },
        stress: {
            id: 'stress',
            name: 'Stress',
            desc: 'Lane pressure spikes with heavier assault profiles.',
            threatTags: ['ARC: STRESS', 'PRESSURE SPIKE'],
        },
        support: {
            id: 'support',
            name: 'Support',
            desc: 'Support specialists accelerate sustain and utility pressure.',
            threatTags: ['ARC: SUPPORT', 'SUSTAIN'],
        },
        mix: {
            id: 'mix',
            name: 'Mix',
            desc: 'Mixed detachments blend rush and utility threats.',
            threatTags: ['ARC: MIX', 'MIXED COMPS'],
        },
        climax: {
            id: 'climax',
            name: 'Climax',
            desc: 'Peak pressure escalation before arc reset.',
            threatTags: ['ARC: CLIMAX', 'PEAK THREAT'],
        },
    },

    captainProfiles: {
        siege_foreman: {
            id: 'siege_foreman',
            name: 'Siege Foreman',
            prefix: 'Foreman',
            color: '#ffbe70',
            auraRadius: 170,
            auraSpeedMult: 1.12,
            auraDamageReduction: 0.18,
            auraArmorBonus: 2,
            hpMult: 1.8,
            speedMultSelf: 0.92,
            armorBonusSelf: 4,
            rewardMult: 2.2,
            fortifiedReduction: 0.12,
        },
        veil_ambusher: {
            id: 'veil_ambusher',
            name: 'Veil Ambusher',
            prefix: 'Ambusher',
            color: '#c690ff',
            auraRadius: 180,
            auraSpeedMult: 1.18,
            auraDamageReduction: 0.08,
            auraArmorBonus: 1,
            auraStealthCooldownMult: 0.65,
            hpMult: 1.55,
            speedMultSelf: 1.14,
            armorBonusSelf: 1,
            rewardMult: 2.3,
            fortifiedReduction: 0.08,
        },
        blight_matron: {
            id: 'blight_matron',
            name: 'Blight Matron',
            prefix: 'Matron',
            color: '#9ee08a',
            auraRadius: 190,
            auraSpeedMult: 1.04,
            auraDamageReduction: 0.12,
            auraArmorBonus: 1,
            auraRegenPct: 0.006,
            auraSupportCastRate: 1.24,
            hpMult: 1.9,
            speedMultSelf: 0.88,
            armorBonusSelf: 3,
            rewardMult: 2.4,
            fortifiedReduction: 0.14,
        },
    },

    mapPressures: {
        forest: {
            id: 'forest_roots',
            name: 'Rootsnare Grounds',
            desc: 'Ambushers and bruisers gain extra staying power in dense terrain.',
            threatTag: 'TERRAIN PRESSURE',
            apply(enemy) {
                if (enemy.type === 'heavy' || enemy.type === 'berserker' || enemy.type === 'stealth') {
                    enemy.maxHp *= 1.08;
                    enemy.hp = enemy.maxHp;
                }
            },
        },
        desert: {
            id: 'desert_haze',
            name: 'Heat Haze',
            desc: 'Fast and support enemies move and cast faster through the dunes.',
            threatTag: 'HEAT HAZE',
            apply(enemy) {
                if (enemy.type === 'fast' || enemy.type === 'healer' || enemy.type === 'shield') {
                    enemy.baseSpeed *= 1.12;
                    enemy.speed = enemy.baseSpeed;
                }
                if (enemy.type === 'healer') enemy.healCooldown *= 0.84;
                if (enemy.type === 'shield') enemy.shieldAuraCooldown *= 0.84;
            },
        },
        ice: {
            id: 'ice_blackice',
            name: 'Black Ice Lanes',
            desc: 'Enemies slide through corners, reducing the impact of slows.',
            threatTag: 'SLIPPERY LANES',
            apply(enemy) {
                enemy.baseSpeed *= 1.08;
                enemy.speed = enemy.baseSpeed;
                enemy.slowResist = Math.max(enemy.slowResist || 0, 0.1);
            },
        },
        volcano: {
            id: 'volcano_embers',
            name: 'Ember Front',
            desc: 'Siege units are scorched into harder targets.',
            threatTag: 'SIEGE PRESSURE',
            apply(enemy) {
                if (enemy.type === 'heavy' || enemy.type === 'boss' || enemy.type === 'berserker') {
                    enemy.maxHp *= 1.1;
                    enemy.hp = enemy.maxHp;
                    enemy.reward = Math.floor(enemy.reward * 1.1);
                }
            },
        },
        shadow: {
            id: 'shadow_voiddrift',
            name: 'Void Drift',
            desc: 'Stealth units phase in and out more frequently.',
            threatTag: 'VOID PHASE',
            apply(enemy) {
                if (enemy.type === 'stealth' || enemy.type === 'ghost') {
                    enemy.stealthCooldown *= 0.75;
                    if (enemy.stealthPrepMaxTimer > 0) {
                        enemy.stealthPrepMaxTimer *= 0.85;
                        enemy.stealthPrepTimer *= 0.85;
                    }
                }
            },
        },
    },

    // Elite/champion enemy variants
    eliteVariants: [
        { prefix: 'Swift', color: '#00ffff', speedMult: 1.6, hpMult: 0.9, rewardMult: 1.5,
            desc: 'Moves much faster' },
        { prefix: 'Armored', color: '#aaaaaa', armorAdd: 8, hpMult: 1.2, rewardMult: 1.8,
            desc: 'Has heavy armor plating' },
        { prefix: 'Regenerating', color: '#44ff44', hpMult: 1.3, rewardMult: 1.6, regenPct: 0.02,
            desc: 'Regenerates health over time' },
        { prefix: 'Giant', color: '#ff8800', hpMult: 2.5, speedMult: 0.7, sizeMult: 1.5, rewardMult: 2.5,
            desc: 'Huge and tough but slow' },
        { prefix: 'Vampiric', color: '#cc00cc', hpMult: 1.1, rewardMult: 1.7, vampiric: true,
            desc: 'Heals when dealing leak damage' },
        { prefix: 'Berserker', color: '#ff2200', hpMult: 0.8, speedMult: 1.3, rewardMult: 1.4, berserker: true,
            desc: 'Gets faster when damaged' },
    ],

    // Bonus wave definitions (every 10 waves)
    bonusWaveTemplates: [
        { name: 'Gold Rush', desc: 'Hold out until extraction and claim the convoy payout.',
            composition: (w, hp) => [
                { type: 'swarm', count: 40, hpMult: hp * 0.4, delay: 0.12 },
            ],
            bonusGold: 150, timeLimit: 20,
            objective: {
                type: 'survival_timer',
                title: 'Hold The Line',
                goalText: 'Survive until extraction timer ends.',
                successText: 'Extraction successful',
                failText: 'Defense collapsed',
            },
        },
        { name: 'Elite Gauntlet', desc: 'Eliminate marked elite targets before the window closes.',
            composition: (w, hp) => [
                { type: 'heavy', count: 8, hpMult: hp * 1.5, delay: 1.2, forceElite: true, objectiveTarget: true },
            ],
            bonusGold: 200, timeLimit: 30,
            objective: {
                type: 'priority_target',
                title: 'Priority Elimination',
                goalText: 'Kill all marked elites before they escape.',
                successText: 'All marked elites destroyed',
                failText: 'Priority targets escaped',
            },
        },
        { name: 'Speed Demons', desc: 'Withstand the rush and survive the timer.',
            composition: (w, hp) => [
                { type: 'fast', count: 25, hpMult: hp * 0.6, delay: 0.2 },
            ],
            bonusGold: 120, timeLimit: 15,
            objective: {
                type: 'survival_timer',
                title: 'Evade The Surge',
                goalText: 'Survive until command recalls hostiles.',
                successText: 'Rush contained',
                failText: 'Rush overwhelmed defenses',
            },
        },
        { name: 'Boss Blitz', desc: 'Destroy marked minibosses before timer expires.',
            composition: (w, hp) => [
                { type: 'boss', count: 3, hpMult: hp * 0.6, delay: 3.0, objectiveTarget: true },
            ],
            bonusGold: 300, timeLimit: 45,
            objective: {
                type: 'priority_target',
                title: 'Boss Hunt',
                goalText: 'Eliminate every marked miniboss.',
                successText: 'Boss hunt complete',
                failText: 'Miniboss escaped',
            },
        },
    ],

    // Wave statistics tracking
    waveStats: {
        currentWaveKills: 0,
        currentWaveStartTime: 0,
        currentWaveDamageDealt: 0,
        enemiesLeakedThisWave: 0,
        elitesKilledThisWave: 0,
        history: [], // { wave, kills, time, damageDealt, leaked, elitesKilled, modifiers, isBonus }
        fastestWaveClear: Infinity,
        totalWaveTime: 0,
        perfectWaves: 0, // no leaks
        totalElitesKilled: 0,
        totalBonusGoldEarned: 0,
    },

    // Wave countdown timer
    countdownTimer: 0,
    countdownActive: false,
    countdownDuration: 3, // seconds before auto-start
    countdownCallback: null,

    // Current bonus wave info
    currentBonusWave: null,
    bonusWaveTimer: 0,
    isBonusWave: false,
    bonusObjectiveState: null,

    // Endless mode
    endlessMode: false,

    // Between-wave tactical choice events (Phase 5)
    tacticalEventTemplates: [
        {
            id: 'supply_cache',
            name: 'Supply Cache',
            icon: '\u{1F4E6}',
            desc: 'Open reserve crates for immediate funding, but enemy outriders move faster next wave.',
            rewardText: '+120 gold now',
            riskText: 'Next wave enemies gain +12% speed',
            immediate: { gold: 120 },
            timed: { enemySpeedMult: 1.12 },
            duration: 1,
        },
        {
            id: 'field_repairs',
            name: 'Field Repairs',
            icon: '\u{1FA79}',
            desc: 'Patch your base integrity, but near-term banking efficiency drops.',
            rewardText: 'Restore +3 lives',
            riskText: '-2% interest for 2 waves',
            immediate: { lives: 3 },
            timed: { interestRateDelta: -0.02 },
            duration: 2,
        },
        {
            id: 'volatile_payloads',
            name: 'Volatile Payloads',
            icon: '\u{1F4A3}',
            desc: 'Empower your firepower, but enemies arrive with reinforced durability.',
            rewardText: '+18% tower damage for 2 waves',
            riskText: 'Enemies gain +10% HP for 2 waves',
            immediate: {},
            timed: { towerDamageMult: 1.18, enemyHpMult: 1.1 },
            duration: 2,
        },
        {
            id: 'cooldown_protocol',
            name: 'Cooldown Protocol',
            icon: '\u{23F1}',
            desc: 'Lower ability cooldown pressure now, at the cost of reduced wave stipend.',
            rewardText: '-22% ability cooldown for 2 waves',
            riskText: '-10 wave bonus gold for 2 waves',
            immediate: {},
            timed: { abilityCooldownMult: 0.78, waveBonusFlat: -10 },
            duration: 2,
        },
        {
            id: 'bounty_contracts',
            name: 'Bounty Contracts',
            icon: '\u{1F4DC}',
            desc: 'Issue premium bounties to improve enemy payouts, but targets become tougher.',
            rewardText: '+25% kill gold for 2 waves',
            riskText: 'Enemies gain +8% HP for 2 waves',
            immediate: {},
            timed: { killGoldMult: 1.25, enemyHpMult: 1.08 },
            duration: 2,
        },
        {
            id: 'reserve_drills',
            name: 'Reserve Drills',
            icon: '\u2699',
            desc: 'Drill support crews for better wave stipends at the cost of increased lane pressure.',
            rewardText: '+20 wave bonus gold for 2 waves',
            riskText: 'Enemies gain +6% speed for 2 waves',
            immediate: { gold: 60 },
            timed: { waveBonusFlat: 20, enemySpeedMult: 1.06 },
            duration: 2,
        },
    ],
    activeTacticalEffects: [],
    currentTacticalWaveModifiers: null,
    currentTacticalWaveEffectNames: [],
    tacticalEventChoices: [],
    tacticalEventModalOpen: false,
    tacticalEventsTaken: 0,
    _tacticalBindingsReady: false,

    // Endless mutator draft state
    endlessDraftMutatorIds: [],
    endlessDraftedDepths: [],
    endlessDraftChoices: [],
    endlessDraftModalOpen: false,
    endlessDraftCurrentDepth: 0,
    endlessDraftRerollsLeft: 0,
    endlessDraftInterval: 5,
    _endlessDraftBindingsReady: false,

    endlessMilestones: [5, 10, 15, 20, 30, 40, 50],

    // Skip wave readiness (only after all enemies are spawned)
    skipReadyShown: false,

    init(mapIndex) {
        this.waveDefs = generateWaves(mapIndex, MAPS[mapIndex].waves);
        this.activeModifiers = [];
        this.difficultyScale = { hpMult: 1.0, speedMult: 1.0, armorMult: 1.0 };
        this.currentBonusWave = null;
        this.bonusWaveTimer = 0;
        this.isBonusWave = false;
        this.bonusObjectiveState = null;
        this.endlessMode = false;
        this.currentScenario = null;
        this.currentFaction = null;
        this.currentWaveArc = null;
        this.currentMapPressure = null;
        this.skipReadyShown = false;
        this.countdownTimer = 0;
        this.countdownActive = false;
        this.countdownCallback = null;
        this.activeTacticalEffects = [];
        this.currentTacticalWaveModifiers = this._getDefaultTacticalModifiers();
        this.currentTacticalWaveEffectNames = [];
        this.tacticalEventChoices = [];
        this.tacticalEventModalOpen = false;
        this.tacticalEventsTaken = 0;
        this._hideTacticalEventModal();
        this._ensureTacticalEventBindings();
        this.endlessDraftMutatorIds = [];
        this.endlessDraftedDepths = [];
        this.endlessDraftChoices = [];
        this.endlessDraftModalOpen = false;
        this.endlessDraftCurrentDepth = 0;
        this.endlessDraftRerollsLeft = 0;
        this._hideEndlessDraftModal();
        this._ensureEndlessDraftBindings();
        this.resetWaveStats();
    },

    resetWaveStats() {
        this.waveStats = {
            currentWaveKills: 0,
            currentWaveStartTime: 0,
            currentWaveDamageDealt: 0,
            enemiesLeakedThisWave: 0,
            elitesKilledThisWave: 0,
            history: [],
            fastestWaveClear: Infinity,
            totalWaveTime: 0,
            perfectWaves: 0,
            totalElitesKilled: 0,
            totalBonusGoldEarned: 0,
        };
    },

    // Calculate difficulty scaling for a given wave number
    _calculateDifficultyScale(waveNum) {
        // Every wave increases difficulty slightly, with jumps every 5 waves
        const baseHpMult = 1.0 + (waveNum - 1) * 0.04;
        const baseSpeedMult = 1.0 + (waveNum - 1) * 0.008;
        const baseArmorMult = 1.0 + (waveNum - 1) * 0.03;

        // Every 5 waves, a bigger jump
        const fiveWaveJumps = Math.floor(waveNum / 5);
        const hpJump = fiveWaveJumps * 0.1;
        const speedJump = fiveWaveJumps * 0.02;
        const armorJump = fiveWaveJumps * 0.05;

        return {
            hpMult: baseHpMult + hpJump,
            speedMult: baseSpeedMult + speedJump,
            armorMult: baseArmorMult + armorJump,
        };
    },

    // Determine if an enemy should be promoted to elite
    _shouldBeElite(waveNum, enemyType) {
        if (enemyType === 'boss') return false; // Bosses are already special
        if (enemyType === 'swarm') return false; // Swarmlings too weak
        // Chance increases with wave number
        const baseChance = 0.02 + (waveNum - 1) * 0.008;
        const chance = Math.min(baseChance, 0.25); // Cap at 25%
        return Math.random() < chance;
    },

    // Pick a random elite variant
    _pickEliteVariant() {
        return this.eliteVariants[Math.floor(Math.random() * this.eliteVariants.length)];
    },

    // Pick a random wave modifier
    _pickWaveModifier() {
        const available = this.availableModifiers.filter(
            m => !this.activeModifiers.some(am => am.id === m.id)
        );
        if (available.length === 0) return this.availableModifiers[Math.floor(Math.random() * this.availableModifiers.length)];
        return available[Math.floor(Math.random() * available.length)];
    },

    _getCaptainProfileById(profileId) {
        if (!profileId) return null;
        return this.captainProfiles[profileId] || null;
    },

    _getMapDifficultyBand() {
        const mapIdx = Number.isFinite(GameState.mapIndex) ? GameState.mapIndex : 0;
        return Math.max(0, Math.min(3, Math.floor(mapIdx / 5)));
    },

    _getFactionCadenceProfile() {
        const band = this._getMapDifficultyBand();

        if (!this.endlessMode) {
            switch (band) {
                case 0: return { start: 8, interval: 8 };   // lighter onboarding cadence
                case 1: return { start: 6, interval: 6 };   // baseline cadence
                case 2: return { start: 5, interval: 5 };   // denser hard maps
                default: return { start: 4, interval: 4 };  // dense nightmare maps
            }
        }

        switch (band) {
            case 0: return { start: 4, interval: 6 };
            case 1: return { start: 2, interval: 4 };
            case 2: return { start: 2, interval: 3 };
            default: return { start: 1, interval: 2 };
        }
    },

    _getArcCadenceProfile() {
        const band = this._getMapDifficultyBand();

        if (!this.endlessMode) {
            switch (band) {
                case 0:
                    return {
                        start: 3,
                        interval: 2,
                        order: ['opener', 'support', 'mix', 'stress', 'climax'],
                    };
                case 1:
                    return {
                        start: 1,
                        interval: 1,
                        order: ['opener', 'stress', 'support', 'mix', 'climax'],
                    };
                case 2:
                    return {
                        start: 1,
                        interval: 1,
                        order: ['opener', 'stress', 'mix', 'support', 'climax'],
                    };
                default:
                    return {
                        start: 1,
                        interval: 1,
                        order: ['stress', 'mix', 'support', 'climax', 'stress', 'climax'],
                    };
            }
        }

        switch (band) {
            case 0:
                return {
                    start: 2,
                    interval: 2,
                    order: ['opener', 'support', 'mix', 'stress', 'climax'],
                };
            case 1:
                return {
                    start: 1,
                    interval: 1,
                    order: ['opener', 'stress', 'support', 'mix', 'climax'],
                };
            case 2:
                return {
                    start: 1,
                    interval: 1,
                    order: ['stress', 'support', 'mix', 'climax', 'stress'],
                };
            default:
                return {
                    start: 1,
                    interval: 1,
                    order: ['stress', 'mix', 'climax', 'support', 'climax'],
                };
        }
    },

    _getFactionForWave(waveNum) {
        if (!Number.isFinite(waveNum) || waveNum <= 0) return null;
        if (waveNum % 10 === 0) return null; // objective bonus waves stay focused
        if (!Array.isArray(this.factionTemplates) || this.factionTemplates.length === 0) return null;
        const cadence = this._getFactionCadenceProfile();

        if (!this.endlessMode) {
            if (waveNum < cadence.start) return null;
            if (((waveNum - cadence.start) % cadence.interval) !== 0) return null;
            const cycle = Math.floor((waveNum - cadence.start) / cadence.interval);
            return this.factionTemplates[((cycle % this.factionTemplates.length) + this.factionTemplates.length) % this.factionTemplates.length];
        }

        if (waveNum <= GameState.maxWave) return null;
        const depth = waveNum - GameState.maxWave;
        if (depth < cadence.start) return null;
        if (((depth - cadence.start) % cadence.interval) !== 0) return null;
        const cycle = Math.floor((depth - cadence.start) / cadence.interval);
        return this.factionTemplates[((cycle % this.factionTemplates.length) + this.factionTemplates.length) % this.factionTemplates.length];
    },

    _getWaveArcForWave(waveNum) {
        if (!Number.isFinite(waveNum) || waveNum <= 0) return null;
        if (waveNum % 10 === 0) return null;
        const cadence = this._getArcCadenceProfile();
        let anchor = waveNum;
        if (this.endlessMode && waveNum > GameState.maxWave) {
            anchor = Math.max(1, waveNum - GameState.maxWave);
        }
        if (anchor < cadence.start) return null;
        if (((anchor - cadence.start) % cadence.interval) !== 0) return null;

        const cycle = Math.floor((anchor - cadence.start) / cadence.interval);
        const order = Array.isArray(cadence.order) && cadence.order.length > 0
            ? cadence.order
            : ['opener', 'stress', 'support', 'mix', 'climax'];
        const idx = ((cycle % order.length) + order.length) % order.length;
        const id = order[idx];
        return this.waveArcTemplates[id] || null;
    },

    _injectFactionCaptainEntry(entries) {
        if (!this.currentFaction || !this.currentFaction.captainId) return;
        if (!Array.isArray(entries) || entries.length === 0) return;
        if (entries.some(entry => entry && entry.isCaptain)) return;

        let captainType = 'heavy';
        switch (this.currentFaction.id) {
            case 'veil_swarm':
                captainType = entries.some(entry => entry.type === 'stealth')
                    ? 'stealth'
                    : (entries.some(entry => entry.type === 'ghost') ? 'ghost' : 'fast');
                break;
            case 'blight_caravan':
                captainType = entries.some(entry => entry.type === 'healer')
                    ? 'healer'
                    : (entries.some(entry => entry.type === 'toxic') ? 'toxic' : 'shield');
                break;
            default:
                captainType = entries.some(entry => entry.type === 'heavy')
                    ? 'heavy'
                    : (entries.some(entry => entry.type === 'shield') ? 'shield' : 'heavy');
                break;
        }

        entries.unshift({
            type: captainType,
            hpMult: 1.35,
            delay: 0.4,
            isElite: true,
            eliteVariant: this._pickEliteVariant(),
            isCaptain: true,
            captainProfileId: this.currentFaction.captainId,
        });
    },

    _applyFactionToEntry(entry) {
        if (!this.currentFaction || !entry) return;

        switch (this.currentFaction.id) {
            case 'siege_foundry':
                if (entry.type === 'heavy' || entry.type === 'shield' || entry.type === 'boss') {
                    entry.hpMult *= 1.12;
                    entry.delay = Math.max(0.08, entry.delay * 0.92);
                }
                if (entry.type === 'disruptor' || entry.type === 'toxic') {
                    entry.hpMult *= 1.06;
                }
                break;
            case 'veil_swarm':
                if (entry.type === 'stealth' || entry.type === 'ghost' || entry.type === 'fast' || entry.type === 'swarmfast') {
                    entry.delay = Math.max(0.06, entry.delay * 0.8);
                    entry.hpMult *= 1.06;
                }
                if (entry.type === 'disruptor') {
                    entry.delay = Math.max(0.08, entry.delay * 0.9);
                }
                break;
            case 'blight_caravan':
                if (entry.type === 'healer' || entry.type === 'shield' || entry.type === 'toxic') {
                    entry.delay = Math.max(0.08, entry.delay * 0.86);
                    entry.hpMult *= 1.1;
                }
                if (entry.type === 'heavy' || entry.type === 'berserker') {
                    entry.hpMult *= 1.07;
                }
                break;
        }
    },

    _applyFactionToEnemy(enemy) {
        if (!this.currentFaction || !enemy) return;

        switch (this.currentFaction.id) {
            case 'siege_foundry':
                if (enemy.type === 'heavy' || enemy.type === 'shield' || enemy.isBoss) {
                    enemy.armor += 2;
                    enemy.baseArmor += 2;
                    enemy.reward = Math.floor(enemy.reward * 1.08);
                }
                break;
            case 'veil_swarm':
                if (enemy.type === 'stealth' || enemy.type === 'ghost' || enemy.type === 'fast' || enemy.type === 'swarmfast') {
                    enemy.baseSpeed *= 1.14;
                    enemy.speed = enemy.baseSpeed;
                    if (enemy.type === 'stealth' || enemy.type === 'ghost') {
                        enemy.stealthCooldown *= 0.72;
                    }
                }
                break;
            case 'blight_caravan':
                if (enemy.type === 'healer' || enemy.type === 'shield' || enemy.type === 'toxic') {
                    enemy.maxHp *= 1.1;
                    enemy.hp = enemy.maxHp;
                    enemy.reward = Math.floor(enemy.reward * 1.06);
                }
                if (enemy.type === 'healer') {
                    enemy.healCooldown *= 0.75;
                }
                if (enemy.type === 'shield') {
                    enemy.shieldAuraCooldown *= 0.8;
                }
                if (enemy.type === 'toxic') {
                    enemy.toxicCooldown *= 0.8;
                }
                break;
        }
    },

    _applyWaveArcToEntry(entry) {
        if (!this.currentWaveArc || !entry) return;

        switch (this.currentWaveArc.id) {
            case 'opener':
                if (entry.type === 'basic' || entry.type === 'fast' || entry.type === 'swarm') {
                    entry.delay = Math.max(0.08, entry.delay * 0.9);
                    entry.hpMult *= 0.97;
                }
                break;
            case 'stress':
                if (entry.type === 'heavy' || entry.type === 'berserker' || entry.type === 'disruptor' || entry.type === 'toxic') {
                    entry.hpMult *= 1.12;
                    entry.delay = Math.max(0.08, entry.delay * 0.95);
                }
                break;
            case 'support':
                if (entry.type === 'healer' || entry.type === 'shield' || entry.type === 'toxic') {
                    entry.delay = Math.max(0.08, entry.delay * 0.84);
                    entry.hpMult *= 1.08;
                }
                break;
            case 'mix':
                if (entry.type === 'fast' || entry.type === 'stealth' || entry.type === 'ghost') {
                    entry.delay = Math.max(0.08, entry.delay * 0.92);
                }
                if (entry.type === 'heavy' || entry.type === 'shield') {
                    entry.hpMult *= 1.05;
                }
                break;
            case 'climax':
                if (entry.type === 'heavy' || entry.type === 'berserker' || entry.type === 'boss') {
                    entry.hpMult *= 1.16;
                    entry.delay = Math.max(0.08, entry.delay * 0.9);
                }
                if (!entry.isElite && entry.type !== 'boss' && (entry.type === 'heavy' || entry.type === 'berserker' || entry.type === 'disruptor')) {
                    entry.isElite = true;
                    if (!entry.eliteVariant) entry.eliteVariant = this._pickEliteVariant();
                }
                break;
        }
    },

    _applyWaveArcToEnemy(enemy) {
        if (!this.currentWaveArc || !enemy) return;

        switch (this.currentWaveArc.id) {
            case 'opener':
                if (enemy.type === 'basic' || enemy.type === 'fast' || enemy.type === 'swarm') {
                    enemy.baseSpeed *= 1.04;
                    enemy.speed = enemy.baseSpeed;
                }
                break;
            case 'stress':
                if (enemy.type === 'heavy' || enemy.type === 'berserker' || enemy.type === 'disruptor' || enemy.type === 'toxic') {
                    enemy.armor += 1;
                    enemy.baseArmor = enemy.armor;
                }
                break;
            case 'support':
                if (enemy.type === 'healer') enemy.healCooldown *= 0.82;
                if (enemy.type === 'shield') enemy.shieldAuraCooldown *= 0.82;
                if (enemy.type === 'toxic') enemy.toxicCooldown *= 0.82;
                break;
            case 'mix':
                if (enemy.type === 'fast' || enemy.type === 'stealth' || enemy.type === 'ghost') {
                    enemy.baseSpeed *= 1.08;
                    enemy.speed = enemy.baseSpeed;
                }
                if (enemy.type === 'heavy' || enemy.type === 'shield') {
                    enemy.maxHp *= 1.05;
                    enemy.hp = enemy.maxHp;
                }
                break;
            case 'climax':
                enemy.reward = Math.floor(enemy.reward * 1.1);
                if (enemy.type === 'heavy' || enemy.type === 'berserker' || enemy.isBoss) {
                    enemy.maxHp *= 1.12;
                    enemy.hp = enemy.maxHp;
                }
                break;
        }
    },

    _applyCaptainProfile(enemy, captainProfileId) {
        if (!enemy) return;
        const profile = this._getCaptainProfileById(captainProfileId);
        if (!profile) return;

        enemy.isCaptain = true;
        enemy.captainProfileId = profile.id;
        enemy.captainAuraProfileId = profile.id;
        enemy.captainAuraRadius = profile.auraRadius;
        enemy.captainAuraColor = profile.color;
        enemy.captainAuraName = profile.name;

        enemy.name = `${profile.prefix} ${enemy.name}`;
        enemy.maxHp *= profile.hpMult;
        enemy.hp = enemy.maxHp;
        enemy.baseSpeed *= profile.speedMultSelf;
        enemy.speed = enemy.baseSpeed;
        enemy.armor += profile.armorBonusSelf;
        enemy.baseArmor = enemy.armor;
        enemy.reward = Math.max(1, Math.floor(enemy.reward * profile.rewardMult));

        enemy.fortified = true;
        enemy.fortifiedReduction = Math.max(enemy.fortifiedReduction || 0, profile.fortifiedReduction || 0);

        // Ensure captain appears elite if not already flagged.
        enemy.isElite = true;
    },

    _applyCaptainAuras() {
        if (GameState.gamePhase !== 'playing') return;
        if (!Array.isArray(GameState.enemies) || GameState.enemies.length === 0) return;

        for (const enemy of GameState.enemies) {
            enemy.captainAuraActive = false;
            enemy.captainSpeedMult = 1;
            enemy.captainDamageReduction = 0;
            enemy.captainArmorBonus = 0;
            enemy.captainStealthCooldownMult = 1;
            enemy.captainRegenRate = 0;
            enemy.captainSupportCastRate = 1;
            enemy.captainAuraProfileId = null;
            enemy.captainAuraColor = enemy.captainAuraColor || '#ffbe70';
            enemy.captainAuraName = enemy.captainAuraName || '';
        }

        const captains = GameState.enemies.filter(enemy => enemy.alive && enemy.isCaptain);
        if (captains.length === 0) return;

        for (const captain of captains) {
            const profile = this._getCaptainProfileById(captain.captainProfileId);
            if (!profile) continue;

            const radius = profile.auraRadius || 160;
            for (const ally of GameState.enemies) {
                if (!ally.alive || ally === captain) continue;
                if (dist(captain, ally) > radius) continue;

                ally.captainAuraActive = true;
                ally.captainAuraProfileId = profile.id;
                ally.captainAuraColor = profile.color || '#ffbe70';
                ally.captainAuraName = profile.name || 'Command Aura';
                ally.captainSpeedMult = Math.max(ally.captainSpeedMult || 1, profile.auraSpeedMult || 1);
                ally.captainDamageReduction = Math.max(ally.captainDamageReduction || 0, profile.auraDamageReduction || 0);
                ally.captainArmorBonus = Math.max(ally.captainArmorBonus || 0, profile.auraArmorBonus || 0);
                if (Number.isFinite(profile.auraStealthCooldownMult) && profile.auraStealthCooldownMult > 0) {
                    ally.captainStealthCooldownMult = Math.min(ally.captainStealthCooldownMult || 1, profile.auraStealthCooldownMult);
                }
                if (Number.isFinite(profile.auraRegenPct) && profile.auraRegenPct > 0) {
                    ally.captainRegenRate = Math.max(ally.captainRegenRate || 0, ally.maxHp * profile.auraRegenPct);
                }
                if (Number.isFinite(profile.auraSupportCastRate) && profile.auraSupportCastRate > 0) {
                    ally.captainSupportCastRate = Math.max(ally.captainSupportCastRate || 1, profile.auraSupportCastRate);
                }
            }
        }
    },

    _getDefaultTacticalModifiers() {
        return {
            enemyHpMult: 1,
            enemySpeedMult: 1,
            towerDamageMult: 1,
            abilityCooldownMult: 1,
            killGoldMult: 1,
            interestRateDelta: 0,
            interestCapDelta: 0,
            waveBonusFlat: 0,
        };
    },

    _mergeTacticalModifiers(base, next) {
        if (!next || typeof next !== 'object') return base;

        const out = { ...base };
        const applyMult = (key) => {
            if (Number.isFinite(next[key])) {
                out[key] *= next[key];
            }
        };
        const applyAdd = (key) => {
            if (Number.isFinite(next[key])) {
                out[key] += next[key];
            }
        };

        applyMult('enemyHpMult');
        applyMult('enemySpeedMult');
        applyMult('towerDamageMult');
        applyMult('abilityCooldownMult');
        applyMult('killGoldMult');

        applyAdd('interestRateDelta');
        applyAdd('interestCapDelta');
        applyAdd('waveBonusFlat');

        return out;
    },

    _getTacticalTemplateById(id) {
        if (!id) return null;
        return this.tacticalEventTemplates.find(t => t.id === id) || null;
    },

    getCurrentTacticalModifiers() {
        return this.currentTacticalWaveModifiers || this._getDefaultTacticalModifiers();
    },

    getProjectedTacticalModifiers() {
        let mods = this._getDefaultTacticalModifiers();
        for (const effect of this.activeTacticalEffects) {
            if (!effect || !Number.isFinite(effect.remainingWaves) || effect.remainingWaves <= 0) continue;
            mods = this._mergeTacticalModifiers(mods, effect.modifiers);
        }
        return mods;
    },

    _consumeTacticalEffectsForWave() {
        let mods = this._getDefaultTacticalModifiers();
        const names = [];
        const remaining = [];

        for (const effect of this.activeTacticalEffects) {
            if (!effect || !Number.isFinite(effect.remainingWaves) || effect.remainingWaves <= 0) continue;
            mods = this._mergeTacticalModifiers(mods, effect.modifiers);
            if (effect.name) names.push(effect.name);

            const left = effect.remainingWaves - 1;
            if (left > 0) {
                remaining.push({ ...effect, remainingWaves: left });
            }
        }

        this.activeTacticalEffects = remaining;
        this.currentTacticalWaveModifiers = mods;
        this.currentTacticalWaveEffectNames = names;
    },

    _shouldTriggerTacticalChoice() {
        if (this.tacticalEventModalOpen) return false;
        if (this.endlessDraftModalOpen) return false;
        if (GameState.weeklyChallengeRun && GameState.weeklyChallengeRun.active) return false;
        if (GameState.wave < 3) return false;
        if (this.isBonusWave) return false;

        const nextWave = GameState.wave + 1;
        if (!this.endlessMode && nextWave > GameState.maxWave) return false;
        if (nextWave % 10 === 0) return false;

        return (GameState.wave % 3) === 0;
    },

    _rollTacticalChoices() {
        const pool = [...this.tacticalEventTemplates];
        const choices = [];
        const count = Math.min(3, pool.length);
        while (choices.length < count && pool.length > 0) {
            const idx = Math.floor(Math.random() * pool.length);
            choices.push(pool.splice(idx, 1)[0]);
        }
        return choices;
    },

    _ensureTacticalEventBindings() {
        if (this._tacticalBindingsReady) return;

        const modal = document.getElementById('tactical-event-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    // Explicitly keep modal locked until a choice is made.
                    Audio.play('click');
                }
            });
        }

        this._tacticalBindingsReady = true;
    },

    _renderTacticalEventModal() {
        const modal = document.getElementById('tactical-event-modal');
        const subtitle = document.getElementById('tactical-event-subtitle');
        const activeEl = document.getElementById('tactical-event-active');
        const choicesEl = document.getElementById('tactical-event-choices');
        if (!modal || !subtitle || !activeEl || !choicesEl) return;

        const nextWave = GameState.wave + 1;
        subtitle.textContent = `Wave ${GameState.wave} cleared. Choose one tactical directive for wave ${nextWave}.`;

        if (this.activeTacticalEffects.length > 0) {
            const text = this.activeTacticalEffects
                .map(e => `${e.name} (${e.remainingWaves}w)`)
                .join(' | ');
            activeEl.textContent = `Active tactical effects: ${text}`;
        } else {
            activeEl.textContent = 'Active tactical effects: none';
        }

        choicesEl.innerHTML = '';
        this.tacticalEventChoices.forEach((choice, idx) => {
            const card = document.createElement('div');
            card.className = 'tactical-choice-card';
            card.innerHTML = `
                <div class="tactical-choice-slot">Option ${idx + 1}</div>
                <div class="tactical-choice-name">${choice.icon || ''} ${choice.name}</div>
                <div class="tactical-choice-desc">${choice.desc || ''}</div>
                <div class="tactical-choice-effect positive">BENEFIT: ${choice.rewardText || 'None'}</div>
                <div class="tactical-choice-effect negative">TRADEOFF: ${choice.riskText || 'None'}</div>
            `;

            const pickBtn = document.createElement('button');
            pickBtn.type = 'button';
            pickBtn.className = 'tactical-choice-pick';
            pickBtn.textContent = `PICK (${idx + 1})`;
            pickBtn.addEventListener('click', () => this.pickTacticalChoice(idx));

            card.appendChild(pickBtn);
            choicesEl.appendChild(card);
        });
    },

    _openTacticalChoiceEvent() {
        const modal = document.getElementById('tactical-event-modal');
        if (!modal) return false;

        this.cancelCountdown();
        this.tacticalEventChoices = this._rollTacticalChoices();
        if (this.tacticalEventChoices.length === 0) return false;

        this.tacticalEventModalOpen = true;

        const startBtn = document.getElementById('btn-start-wave');
        if (startBtn) startBtn.classList.add('hidden');
        const skipBtn = document.getElementById('btn-skip-wave');
        if (skipBtn) skipBtn.style.display = 'none';

        this._renderTacticalEventModal();
        modal.style.display = 'flex';
        showWaveBanner('TACTICAL DIRECTIVE AVAILABLE');
        return true;
    },

    _hideTacticalEventModal() {
        const modal = document.getElementById('tactical-event-modal');
        if (modal) modal.style.display = 'none';
    },

    _restorePendingTacticalEventModal() {
        if (!this.tacticalEventModalOpen) return;
        if (!Array.isArray(this.tacticalEventChoices) || this.tacticalEventChoices.length === 0) {
            this.tacticalEventModalOpen = false;
            this._hideTacticalEventModal();
            return;
        }

        this.cancelCountdown();

        const startBtn = document.getElementById('btn-start-wave');
        if (startBtn) startBtn.classList.add('hidden');
        const skipBtn = document.getElementById('btn-skip-wave');
        if (skipBtn) skipBtn.style.display = 'none';

        this._renderTacticalEventModal();
        const modal = document.getElementById('tactical-event-modal');
        if (modal) modal.style.display = 'flex';
    },

    pickTacticalChoice(index) {
        if (!this.tacticalEventModalOpen) return;

        const choice = this.tacticalEventChoices[index];
        if (!choice) return;

        const immediate = choice.immediate || {};
        if (Number.isFinite(immediate.gold) && immediate.gold !== 0) {
            GameState.gold = Math.max(0, Math.floor(GameState.gold + immediate.gold));
            Effects.addFloatingText(logicalWidth / 2, 82, `${immediate.gold >= 0 ? '+' : ''}${Math.floor(immediate.gold)} gold`, '#ffd27a', 12);
        }
        if (Number.isFinite(immediate.lives) && immediate.lives !== 0) {
            GameState.lives = clamp(Math.floor(GameState.lives + immediate.lives), 1, GameState.maxLives);
            Effects.addFloatingText(logicalWidth / 2, 98, `${immediate.lives >= 0 ? '+' : ''}${Math.floor(immediate.lives)} lives`, '#8fffa8', 12);
        }

        if (choice.duration > 0 && choice.timed && Object.keys(choice.timed).length > 0) {
            this.activeTacticalEffects.push({
                id: choice.id,
                name: choice.name,
                remainingWaves: Math.max(1, Math.floor(choice.duration)),
                modifiers: { ...choice.timed },
            });
        }

        this.tacticalEventsTaken++;
        this.tacticalEventModalOpen = false;
        this.tacticalEventChoices = [];
        this._hideTacticalEventModal();

        const startBtn = document.getElementById('btn-start-wave');
        if (startBtn) startBtn.classList.remove('hidden');

        showWaveBanner(`TACTICAL PICK: ${choice.name.toUpperCase()}`);
        if (choice.rewardText) {
            Effects.addFloatingText(logicalWidth / 2, 114, choice.rewardText, '#8fe3ff', 11);
        }
        if (choice.riskText) {
            Effects.addFloatingText(logicalWidth / 2, 128, choice.riskText, '#ffb3b3', 11);
        }
        Audio.play('powerup');

        if (GameState.settings.autoStart && GameState.gamePhase === 'idle') {
            this.startCountdown(this.countdownDuration, () => {
                if (GameState.gamePhase === 'idle') this.startWave();
            });
        }

        if (typeof SaveSystem !== 'undefined' && SaveSystem.autoSave) {
            SaveSystem.autoSave();
        }
    },

    _createBonusObjectiveState(template, queuedEntries) {
        if (!template || !template.objective || typeof template.objective !== 'object') return null;

        const objective = template.objective;
        const state = {
            type: objective.type || 'survival_timer',
            title: objective.title || 'Bonus Objective',
            goalText: objective.goalText || '',
            successText: objective.successText || 'Objective complete',
            failText: objective.failText || 'Objective failed',
            started: true,
            resolved: false,
            success: false,
            failed: false,
            requiredTargets: 0,
            eliminatedTargets: 0,
            leakedTargets: 0,
            survivedSeconds: 0,
            rewardScale: 0,
        };

        if (state.type === 'priority_target') {
            const list = Array.isArray(queuedEntries) ? queuedEntries : [];
            state.requiredTargets = list.reduce((sum, entry) => {
                return sum + (entry && entry.isObjectiveTarget ? 1 : 0);
            }, 0);
            if (state.requiredTargets <= 0) {
                state.requiredTargets = 1;
            }
        }

        return state;
    },

    _clearActiveEnemiesForBonusObjective() {
        for (const enemy of GameState.enemies) {
            enemy.alive = false;
            enemy.reached = false;
        }
        GameState.enemies = [];
        GameState.waveEnemies = [];
        GameState.enemiesAlive = 0;
    },

    _resolveBonusObjective(success, reasonText) {
        if (!this.isBonusWave || !this.currentBonusWave || !this.bonusObjectiveState) return;
        if (this.bonusObjectiveState.resolved) return;

        const state = this.bonusObjectiveState;
        state.resolved = true;
        state.success = !!success;
        state.failed = !success;
        state.reasonText = reasonText || (success ? state.successText : state.failText);
        state.survivedSeconds = Math.max(0, this.currentBonusWave.timeLimit - Math.max(0, this.bonusWaveTimer));

        if (state.type === 'priority_target') {
            const req = Math.max(1, state.requiredTargets || 0);
            const ratio = clamp(state.eliminatedTargets / req, 0, 1);
            state.rewardScale = success ? 1 : ratio;
        } else {
            state.rewardScale = success ? 1 : 0;
        }

        this.bonusWaveTimer = 0;
        this._clearActiveEnemiesForBonusObjective();

        const color = success ? '#40ff9a' : '#ff8080';
        const label = success ? 'OBJECTIVE COMPLETE' : 'OBJECTIVE FAILED';
        showWaveBanner(`BONUS ${label}`);
        Effects.addFloatingText(logicalWidth / 2, logicalHeight / 2 - 12, state.reasonText || label, color, 16);
        Audio.play(success ? 'achievement' : 'leak');
    },

    _onBonusObjectiveTargetKilled() {
        if (!this.isBonusWave || !this.bonusObjectiveState) return;
        const state = this.bonusObjectiveState;
        if (state.resolved) return;
        if (state.type !== 'priority_target') return;

        state.eliminatedTargets++;
        const remaining = Math.max(0, (state.requiredTargets || 0) - state.eliminatedTargets);
        Effects.addFloatingText(logicalWidth / 2, 72, `Priority targets left: ${remaining}`, '#ffd890', 11);
        if (remaining <= 0) {
            this._resolveBonusObjective(true, state.successText);
        }
    },

    _onBonusObjectiveTargetLeaked() {
        if (!this.isBonusWave || !this.bonusObjectiveState) return;
        const state = this.bonusObjectiveState;
        if (state.resolved) return;
        if (state.type !== 'priority_target') return;

        state.leakedTargets++;
        this._resolveBonusObjective(false, state.failText);
    },

    getBonusObjectiveDisplay() {
        if (!this.isBonusWave || !this.currentBonusWave || !this.bonusObjectiveState) return null;
        const state = this.bonusObjectiveState;
        const timerTotal = Math.max(1, this.currentBonusWave.timeLimit || 1);
        const timerRemaining = Math.max(0, this.bonusWaveTimer);
        const base = {
            type: state.type,
            title: state.title,
            goalText: state.goalText,
            resolved: !!state.resolved,
            success: !!state.success,
            failed: !!state.failed,
            rewardScale: Number.isFinite(state.rewardScale) ? state.rewardScale : 0,
            timeRemaining: Math.ceil(timerRemaining),
            timeTotal: timerTotal,
            timeFraction: timerRemaining / timerTotal,
        };

        if (state.type === 'priority_target') {
            base.requiredTargets = state.requiredTargets;
            base.eliminatedTargets = state.eliminatedTargets;
            base.remainingTargets = Math.max(0, state.requiredTargets - state.eliminatedTargets);
        }

        return base;
    },

    _getModifierById(id) {
        if (!id) return null;
        return this.availableModifiers.find(m => m.id === id) || null;
    },

    _getEndlessDraftModifiers() {
        return this.endlessDraftMutatorIds
            .map(id => this._getModifierById(id))
            .filter(Boolean);
    },

    _isEndlessDraftDepth(depth) {
        if (!Number.isFinite(depth) || depth <= 0) return false;
        return depth === 1 || depth % this.endlessDraftInterval === 0;
    },

    _shouldTriggerEndlessDraft() {
        if (!this.endlessMode) return false;
        if (this.endlessDraftModalOpen) return false;
        if (this.endlessDraftMutatorIds.length >= this.availableModifiers.length) return false;

        const depth = this._getEndlessDepth();
        if (!this._isEndlessDraftDepth(depth)) return false;
        return !this.endlessDraftedDepths.includes(depth);
    },

    _ensureEndlessDraftBindings() {
        if (this._endlessDraftBindingsReady) return;

        const rerollBtn = document.getElementById('btn-endless-draft-reroll');
        if (rerollBtn) {
            rerollBtn.addEventListener('click', () => {
                this.rerollEndlessMutatorDraft();
                Audio.play('click');
            });
        }

        this._endlessDraftBindingsReady = true;
    },

    _buildEndlessDraftPool() {
        const selected = new Set(this.endlessDraftMutatorIds);
        const pool = this.availableModifiers.filter(mod => !selected.has(mod.id));
        return pool;
    },

    _rollEndlessDraftChoices() {
        const pool = this._buildEndlessDraftPool();
        if (pool.length === 0) return [];

        const choices = [];
        const localPool = [...pool];
        const count = Math.min(3, localPool.length);
        while (choices.length < count && localPool.length > 0) {
            const idx = Math.floor(Math.random() * localPool.length);
            choices.push(localPool.splice(idx, 1)[0]);
        }
        return choices;
    },

    _renderEndlessDraftModal() {
        const modal = document.getElementById('endless-draft-modal');
        const subtitle = document.getElementById('endless-draft-subtitle');
        const current = document.getElementById('endless-draft-current');
        const choicesEl = document.getElementById('endless-draft-choices');
        const rerollBtn = document.getElementById('btn-endless-draft-reroll');
        if (!modal || !subtitle || !current || !choicesEl || !rerollBtn) return;

        subtitle.textContent = `Depth +${this.endlessDraftCurrentDepth} - pick one mutator for this endless run.`;

        const activeNames = this._getEndlessDraftModifiers().map(m => m.name);
        current.textContent = activeNames.length > 0
            ? `Active mutators: ${activeNames.join(' + ')}`
            : 'Active mutators: none yet.';

        choicesEl.innerHTML = '';
        this.endlessDraftChoices.forEach((mod, idx) => {
            const card = document.createElement('div');
            card.className = 'endless-draft-card';
            card.innerHTML = `
                <div class="edc-slot">Option ${idx + 1}</div>
                <div class="edc-name">${mod.icon} ${mod.name}</div>
                <div class="edc-desc">${mod.desc}</div>
            `;

            const pickBtn = document.createElement('button');
            pickBtn.type = 'button';
            pickBtn.className = 'edc-pick';
            pickBtn.textContent = `PICK (${idx + 1})`;
            pickBtn.addEventListener('click', () => {
                this.pickEndlessDraftChoice(idx);
            });

            card.appendChild(pickBtn);
            choicesEl.appendChild(card);
        });

        const canReroll = this.endlessDraftRerollsLeft > 0 && this.endlessDraftChoices.length > 1;
        rerollBtn.style.display = canReroll ? 'block' : 'none';
        rerollBtn.textContent = `REROLL (${this.endlessDraftRerollsLeft})`;
    },

    _openEndlessMutatorDraft(depth) {
        const modal = document.getElementById('endless-draft-modal');
        if (!modal) return;

        this.endlessDraftModalOpen = true;
        this.endlessDraftCurrentDepth = depth;
        this.endlessDraftChoices = this._rollEndlessDraftChoices();
        this.endlessDraftRerollsLeft = Math.max(0, Math.floor(GameState.researchBonuses.draftReroll || 0));

        if (this.endlessDraftChoices.length === 0) {
            this.endlessDraftModalOpen = false;
            if (!this.endlessDraftedDepths.includes(depth)) {
                this.endlessDraftedDepths.push(depth);
            }
            return;
        }

        const startBtn = document.getElementById('btn-start-wave');
        if (startBtn) startBtn.classList.add('hidden');
        const skipBtn = document.getElementById('btn-skip-wave');
        if (skipBtn) skipBtn.style.display = 'none';

        this._renderEndlessDraftModal();
        modal.style.display = 'flex';
        showWaveBanner('ENDLESS DRAFT - CHOOSE MUTATOR');
    },

    _hideEndlessDraftModal() {
        const modal = document.getElementById('endless-draft-modal');
        if (modal) modal.style.display = 'none';
    },

    rerollEndlessMutatorDraft() {
        if (!this.endlessDraftModalOpen) return;
        if (this.endlessDraftRerollsLeft <= 0) return;

        this.endlessDraftRerollsLeft--;
        this.endlessDraftChoices = this._rollEndlessDraftChoices();
        this._renderEndlessDraftModal();
    },

    pickEndlessDraftChoice(index) {
        if (!this.endlessDraftModalOpen) return;
        const mod = this.endlessDraftChoices[index];
        if (!mod) return;

        if (!this.endlessDraftMutatorIds.includes(mod.id)) {
            this.endlessDraftMutatorIds.push(mod.id);
        }
        if (!this.endlessDraftedDepths.includes(this.endlessDraftCurrentDepth)) {
            this.endlessDraftedDepths.push(this.endlessDraftCurrentDepth);
        }

        this.endlessDraftModalOpen = false;
        this.endlessDraftChoices = [];
        this.endlessDraftCurrentDepth = 0;
        this.endlessDraftRerollsLeft = 0;
        this._hideEndlessDraftModal();

        const startBtn = document.getElementById('btn-start-wave');
        if (startBtn) startBtn.classList.remove('hidden');

        showWaveBanner(`MUTATOR ADDED: ${mod.name.toUpperCase()}`);
        Effects.addFloatingText(logicalWidth / 2, 84, mod.desc, '#ffcc80', 12);
        Audio.play('powerup');

        if (GameState.settings.autoStart && GameState.gamePhase === 'idle') {
            this.startCountdown(this.countdownDuration, () => {
                if (GameState.gamePhase === 'idle') this.startWave();
            });
        }

        if (typeof SaveSystem !== 'undefined' && SaveSystem.autoSave) {
            SaveSystem.autoSave();
        }
    },

    _getScenarioForWave(waveNum) {
        if (waveNum <= 0 || waveNum % 10 === 0) return null;

        const campaignScenario = !this.endlessMode && waveNum % 4 === 0;
        const endlessScenario = this.endlessMode && waveNum > GameState.maxWave && (waveNum % 3 === 0 || waveNum % 4 === 0);
        if (!campaignScenario && !endlessScenario) return null;

        const seed = Math.floor(waveNum / 4) + GameState.mapIndex;
        const idx = ((seed % this.scenarioTemplates.length) + this.scenarioTemplates.length) % this.scenarioTemplates.length;
        return this.scenarioTemplates[idx];
    },

    _applyScenarioToEntry(entry) {
        if (!this.currentScenario || !entry) return;

        switch (this.currentScenario.id) {
            case 'rush_assault':
                if (entry.type === 'fast' || entry.type === 'swarm' || entry.type === 'swarmfast') {
                    entry.delay = Math.max(0.06, entry.delay * 0.82);
                    entry.hpMult *= 0.92;
                }
                break;
            case 'armored_column':
                if (entry.type === 'heavy' || entry.type === 'shield' || entry.type === 'boss') {
                    entry.hpMult *= 1.1;
                }
                break;
            case 'support_convoy':
                if (entry.type === 'healer' || entry.type === 'shield') {
                    entry.delay = Math.max(0.08, entry.delay * 0.88);
                }
                break;
            case 'stealth_ambush':
                if (entry.type === 'stealth' || entry.type === 'ghost') {
                    entry.delay = Math.max(0.08, entry.delay * 0.84);
                    entry.hpMult *= 1.05;
                }
                break;
            case 'siege_push':
                if (entry.type === 'heavy' || entry.type === 'berserker' || entry.type === 'boss') {
                    entry.hpMult *= 1.2;
                    entry.delay = Math.max(0.14, entry.delay * 1.08);
                }
                break;
        }
    },

    _applyScenarioToEnemy(enemy) {
        if (!this.currentScenario || !enemy) return;

        switch (this.currentScenario.id) {
            case 'rush_assault':
                if (enemy.type === 'fast' || enemy.type === 'swarm' || enemy.type === 'swarmfast') {
                    enemy.baseSpeed *= 1.22;
                    enemy.speed = enemy.baseSpeed;
                    enemy.reward = Math.floor(enemy.reward * 1.1);
                }
                break;
            case 'armored_column':
                if (enemy.type === 'heavy' || enemy.type === 'shield' || enemy.isBoss) {
                    enemy.armor += 4;
                    enemy.baseArmor += 4;
                }
                break;
            case 'support_convoy':
                if (enemy.type === 'healer') enemy.healCooldown *= 0.72;
                if (enemy.type === 'shield') enemy.shieldAuraCooldown *= 0.72;
                if (enemy.type !== 'healer' && enemy.type !== 'shield') {
                    enemy.regenRate = Math.max(enemy.regenRate, enemy.maxHp * 0.0035);
                }
                break;
            case 'stealth_ambush':
                if (enemy.type === 'stealth' || enemy.type === 'ghost') {
                    enemy.stealthCooldown *= 0.65;
                }
                break;
            case 'siege_push':
                if (enemy.type === 'heavy' || enemy.type === 'berserker' || enemy.isBoss) {
                    enemy.maxHp *= 1.15;
                    enemy.hp = enemy.maxHp;
                    enemy.baseSpeed *= 0.92;
                    enemy.speed = enemy.baseSpeed;
                    enemy.reward = Math.floor(enemy.reward * 1.12);
                }
                break;
        }
    },

    // Start the countdown timer before a wave
    startCountdown(duration, callback) {
        this.countdownTimer = duration || this.countdownDuration;
        this.countdownActive = true;
        this.countdownCallback = callback || (() => this.startWave());
    },

    // Cancel the countdown
    cancelCountdown() {
        this.countdownActive = false;
        this.countdownTimer = 0;
        this.countdownCallback = null;
    },

    startWave() {
        if (GameState.gamePhase !== 'idle') return;
        if (GameState.wave >= GameState.maxWave && !this.endlessMode) return;
        if (this.endlessDraftModalOpen) return;
        if (this.tacticalEventModalOpen) return;

        // Cancel any active countdown
        this.cancelCountdown();

        GameState.wave++;
        GameState.gamePhase = 'playing';
        GameState.stats.wavesCompleted = GameState.wave;

        // Update difficulty scaling
        this.difficultyScale = this._calculateDifficultyScale(GameState.wave);

        // Determine wave modifiers (every 5 waves, or more frequently in endless)
        this.activeModifiers = [];
        this.currentScenario = this._getScenarioForWave(GameState.wave);
        this.currentFaction = this._getFactionForWave(GameState.wave);
        this.currentWaveArc = this._getWaveArcForWave(GameState.wave);
        this.currentMapPressure = this._getMapPressureForCurrentMap();
        if (this.endlessMode) {
            const drafted = this._getEndlessDraftModifiers();
            this.activeModifiers = drafted;

            const endlessWaveNum = GameState.wave - GameState.maxWave;
            const isBonusWaveNumber = (GameState.wave % 10 === 0);
            if (endlessWaveNum > 0 && this.activeModifiers.length > 0 && !isBonusWaveNumber) {
                const modNames = this.activeModifiers.map(m => m.name.toUpperCase()).join(' + ');
                showWaveBanner(`ENDLESS WAVE ${GameState.wave} — ${modNames}`);
                this.activeModifiers.slice(0, 3).forEach((mod, idx) => {
                    Effects.addFloatingText(logicalWidth / 2, 62 + idx * 18, mod.desc, '#ffaa00', 12);
                });
            }
        } else if (GameState.wave % 5 === 0 && GameState.wave % 10 !== 0) {
            const modifier = this._pickWaveModifier();
            this.activeModifiers.push(modifier);
            showWaveBanner(`WAVE ${GameState.wave} — ${modifier.name.toUpperCase()}!`);
            Effects.addFloatingText(logicalWidth / 2, 60, modifier.desc, '#ffaa00', 12);
        }

        // Check if this is a bonus wave (every 10 waves)
        this.isBonusWave = (GameState.wave % 10 === 0);
        if (this.isBonusWave) {
            const templateIdx = Math.floor((GameState.wave / 10 - 1) % this.bonusWaveTemplates.length);
            this.currentBonusWave = this.bonusWaveTemplates[templateIdx];
            this.bonusWaveTimer = this.currentBonusWave.timeLimit;
        } else {
            this.currentBonusWave = null;
            this.bonusWaveTimer = 0;
            this.bonusObjectiveState = null;
        }

        // Consume timed tactical effects for this specific wave.
        this._consumeTacticalEffectsForWave();

        // Build spawn queue
        GameState.waveEnemies = [];

        if (this.endlessMode && GameState.wave > GameState.maxWave) {
            // Generate endless wave procedurally
            const endlessWaveDef = this.generateEndlessWave(GameState.wave);
            for (const group of endlessWaveDef.enemies) {
                let count = group.count;
                let hpMult = group.hpMult || 1;

                if (this.activeModifiers.some(m => m.id === 'swarm_surge')) {
                    count = Math.floor(count * 2);
                    hpMult *= 0.5;
                }

                for (let i = 0; i < count; i++) {
                    const isElite = group.forceElite || this._shouldBeEliteEndless(GameState.wave, group.type);
                    const entry = {
                        type: group.type,
                        hpMult: hpMult,
                        delay: group.delay || 0.5,
                        isElite: isElite,
                        eliteVariant: isElite ? this._pickEliteVariant() : null,
                    };
                    this._applyScenarioToEntry(entry);
                    this._applyFactionToEntry(entry);
                    this._applyWaveArcToEntry(entry);
                    GameState.waveEnemies.push(entry);
                }
            }
        } else if (this.isBonusWave && this.currentBonusWave) {
            // Use bonus wave composition
            const hpScale = this.difficultyScale.hpMult;
            const bonusGroups = this.currentBonusWave.composition(GameState.wave, hpScale);
            for (const group of bonusGroups) {
                for (let i = 0; i < group.count; i++) {
                    const entry = {
                        type: group.type,
                        hpMult: group.hpMult || 1,
                        delay: group.delay || 0.5,
                        isElite: group.forceElite || false,
                        eliteVariant: null,
                        isObjectiveTarget: !!group.objectiveTarget,
                    };
                    this._applyScenarioToEntry(entry);
                    this._applyFactionToEntry(entry);
                    this._applyWaveArcToEntry(entry);
                    if (entry.isElite) {
                        entry.eliteVariant = this._pickEliteVariant();
                    }
                    GameState.waveEnemies.push(entry);
                }
            }
        } else {
            // Normal wave composition from waveDefs
            const waveDef = this.waveDefs[GameState.wave - 1];
            if (!waveDef) return;

            for (const group of waveDef.enemies) {
                // If swarm_surge modifier is active, double count but halve HP
                let count = group.count;
                let hpMult = group.hpMult || 1;

                if (this.activeModifiers.some(m => m.id === 'swarm_surge')) {
                    count = Math.floor(count * 2);
                    hpMult *= 0.5;
                }

                for (let i = 0; i < count; i++) {
                    const isElite = this._shouldBeElite(GameState.wave, group.type);
                    const entry = {
                        type: group.type,
                        hpMult: hpMult,
                        delay: group.delay || 0.5,
                        isElite: isElite,
                        eliteVariant: isElite ? this._pickEliteVariant() : null,
                    };
                    this._applyScenarioToEntry(entry);
                    this._applyFactionToEntry(entry);
                    this._applyWaveArcToEntry(entry);
                    GameState.waveEnemies.push(entry);
                }
            }
        }

        this._injectFactionCaptainEntry(GameState.waveEnemies);

        if (this.isBonusWave && this.currentBonusWave) {
            this.bonusObjectiveState = this._createBonusObjectiveState(this.currentBonusWave, GameState.waveEnemies);
        }

        // Reset wave statistics
        this.waveStats.currentWaveKills = 0;
        this.waveStats.currentWaveStartTime = GameState.time;
        this.waveStats.currentWaveDamageDealt = 0;
        this.waveStats.enemiesLeakedThisWave = 0;
        this.waveStats.elitesKilledThisWave = 0;

        // Snapshot tower damage for per-wave MVP tracking
        this._towerDamageSnapshot = {};
        for (const t of GameState.towers) {
            this._towerDamageSnapshot[t.id] = t.stats.totalDamageDealt;
        }

        // Shuffle slightly for mixed feel (keep groups mostly together)
        const carryOverAlive = Math.max(0, GameState.enemiesAlive);
        GameState.totalEnemiesInWave = GameState.waveEnemies.length + carryOverAlive;
        GameState.enemiesSpawned = carryOverAlive;
        GameState.enemiesAlive = carryOverAlive;
        GameState.spawnTimer = 0.5; // Initial delay
        this.skipReadyShown = false;

        // Show wave banner
        if (this.endlessMode && this.activeModifiers.length === 0) {
            showWaveBanner(`ENDLESS WAVE ${GameState.wave}`);
        } else if (this.isBonusWave && this.currentBonusWave) {
            showWaveBanner(`BONUS WAVE: ${this.currentBonusWave.name.toUpperCase()}`);
            Effects.addFloatingText(logicalWidth / 2, 100, this.currentBonusWave.desc, '#ffd700', 14);
            if (this.bonusObjectiveState) {
                Effects.addFloatingText(logicalWidth / 2, 116, `Objective: ${this.bonusObjectiveState.title}`, '#ffe39a', 12);
                if (this.bonusObjectiveState.goalText) {
                    Effects.addFloatingText(logicalWidth / 2, 132, this.bonusObjectiveState.goalText, '#b8c8ee', 10);
                }
            }
        } else if (this.activeModifiers.length === 0) {
            showWaveBanner(`WAVE ${GameState.wave}`);
        }
        if (this.currentScenario && !this.isBonusWave) {
            Effects.addFloatingText(logicalWidth / 2, 100, `Scenario: ${this.currentScenario.name}`, '#90b0ff', 12);
            Effects.addFloatingText(logicalWidth / 2, 116, this.currentScenario.desc, '#7f96c8', 10);
        }
        if (this.currentFaction && !this.isBonusWave) {
            Effects.addFloatingText(logicalWidth / 2, 132, `Faction: ${this.currentFaction.name}`, '#ffc990', 11);
        }
        const arcY = (this.currentFaction && !this.isBonusWave) ? 148 : 132;
        if (this.currentWaveArc && !this.isBonusWave) {
            Effects.addFloatingText(logicalWidth / 2, arcY, `Arc: ${this.currentWaveArc.name}`, '#9ed0ff', 10);
            Effects.addFloatingText(logicalWidth / 2, arcY + 14, this.currentWaveArc.desc, '#7ea6d2', 9);
        }
        if (this.currentMapPressure && !this.isBonusWave) {
            const mapPressureY = (this.currentFaction && !this.isBonusWave)
                ? (this.currentWaveArc ? 170 : 148)
                : (this.currentWaveArc ? 156 : 132);
            Effects.addFloatingText(logicalWidth / 2, mapPressureY, `Map Pressure: ${this.currentMapPressure.name}`, '#b090ff', 10);
        }
        if (this.currentTacticalWaveEffectNames.length > 0) {
            const tacticalText = this.currentTacticalWaveEffectNames.slice(0, 2).join(' + ');
            const tacticalY = this.currentMapPressure
                ? ((this.currentFaction && !this.isBonusWave) ? (this.currentWaveArc ? 186 : 164) : (this.currentWaveArc ? 172 : 148))
                : ((this.currentFaction && !this.isBonusWave) ? (this.currentWaveArc ? 170 : 148) : (this.currentWaveArc ? 156 : 132));
            Effects.addFloatingText(logicalWidth / 2, tacticalY, `Tactical: ${tacticalText}`, '#8fd8ff', 10);
        }
        // (modifier banner already shown above)

        // Sound
        const hasBoss = (this.isBonusWave && this.currentBonusWave && this.currentBonusWave.name === 'Boss Blitz')
            || GameState.waveEnemies.some(e => e.type === 'boss');
        Audio.play(hasBoss ? 'boss' : 'wave_start');

        // Boss intro sequence (any wave with a boss-type enemy)
        if (hasBoss) {
            const boss = this._getBossProfileForWave(GameState.wave);
            const spawnPt = GameState.waypoints[0] || { x: logicalWidth / 2, y: logicalHeight / 2 };
            GameState.bossIntro = {
                active: true,
                timer: 0,
                duration: 2.5,
                name: boss.name,
                abilities: boss.introAbilities || [],
                x: spawnPt.x,
                y: spawnPt.y,
            };
            addScreenShake(8);
        }

        // UI
        document.getElementById('btn-start-wave').classList.add('hidden');
        const skipBtn = document.getElementById('btn-skip-wave');
        if (skipBtn) skipBtn.style.display = 'none';

        // Interest + wave bonus
        if (GameState.wave > 1) {
            const de = GameState.doctrineEffects || {};
            const tm = this.getCurrentTacticalModifiers();
            const interestRate = Math.max(0, CONFIG.INTEREST_RATE + (GameState.researchBonuses.interestRate || 0) + (de.interestRateDelta || 0) + (tm.interestRateDelta || 0));
            const interestCap = Math.max(0, CONFIG.INTEREST_CAP + (GameState.researchBonuses.interestCap || 0) + (de.interestCapDelta || 0) + (tm.interestCapDelta || 0));
            const interest = Math.min(
                Math.floor(GameState.gold * interestRate),
                interestCap
            );
            GameState.gold += interest;
            if (interest > 0) {
                Effects.addFloatingText(logicalWidth / 2, 80, `Interest: +${interest}`, '#ffd700', 12);
            }

            // Compound interest
            if (GameState.researchBonuses.compoundInterest) {
                const extra = Math.floor(interest * 0.1);
                GameState.gold += extra;
            }
        }

        // Wave bonus
        let waveBonus = CONFIG.WAVE_BONUS_BASE;
        if (GameState.researchBonuses.waveBonusMult) waveBonus *= GameState.researchBonuses.waveBonusMult;
        waveBonus += this.getCurrentTacticalModifiers().waveBonusFlat || 0;
        waveBonus = Math.max(0, Math.floor(waveBonus));
        GameState.gold += waveBonus;

        // Gold rush
        if (GameState.researchBonuses.goldRush && GameState.wave % 5 === 0) {
            GameState.gold += GameState.researchBonuses.goldRush;
            Effects.addFloatingText(logicalWidth / 2, 100, `Gold Rush: +${GameState.researchBonuses.goldRush}`, '#ffd700', 14);
        }

        // Armory gold per wave
        for (const t of GameState.towers) {
            if (t.type === 'boost' && t.special.goldPerWave) {
                GameState.gold += t.special.goldPerWave;
            }
        }

        // Endless mode scaling gold bonus
        if (this.endlessMode && GameState.wave > GameState.maxWave) {
            const endlessWaveNum = GameState.wave - GameState.maxWave;
            const endlessGold = Math.floor(10 + endlessWaveNum * 5);
            GameState.gold += endlessGold;
            Effects.addFloatingText(logicalWidth / 2, 120, `Endless Bonus: +${endlessGold}`, '#ff80ff', 12);
        }

        GameState.stats.maxGold = Math.max(GameState.stats.maxGold, GameState.gold);
    },

    update(dt) {
        // Handle countdown timer
        if (this.countdownActive) {
            this.countdownTimer -= dt;
            if (this.countdownTimer <= 0) {
                this.countdownActive = false;
                const cb = this.countdownCallback;
                this.countdownCallback = null;
                if (cb) cb();
            }
            return;
        }

        if (GameState.gamePhase !== 'playing') return;

        // Update bonus wave timer
        if (this.isBonusWave && this.currentBonusWave) {
            this.bonusWaveTimer -= dt;
            if (this.bonusObjectiveState && !this.bonusObjectiveState.resolved) {
                if (this.bonusObjectiveState.type === 'survival_timer' && this.bonusWaveTimer <= 0) {
                    this._resolveBonusObjective(true, this.bonusObjectiveState.successText || 'Survived the objective window');
                } else if (this.bonusObjectiveState.type === 'priority_target' && this.bonusWaveTimer <= 0) {
                    this._resolveBonusObjective(false, this.bonusObjectiveState.failText || 'Priority targets not eliminated in time');
                }
            } else if (this.bonusWaveTimer <= 0 && GameState.waveEnemies.length > 0) {
                // Legacy fallback: if no objective state exists, clear remaining spawns.
                GameState.waveEnemies = [];
                Effects.addFloatingText(logicalWidth / 2, logicalHeight / 2, 'TIME UP!', '#ff4040', 18);
            }
        }

        // Spawn enemies
        if (GameState.waveEnemies.length > 0) {
            GameState.spawnTimer -= dt;
            if (GameState.spawnTimer <= 0) {
                const next = GameState.waveEnemies.shift();
                const enemy = new Enemy(next.type, next.hpMult);
                const tacticalMods = this.getCurrentTacticalModifiers();
                enemy.isObjectiveTarget = !!next.isObjectiveTarget;

                // Apply difficulty scaling (wave progression + difficulty preset)
                const diffPreset = CONFIG.DIFFICULTY_PRESETS[GameState.settings.difficulty] || CONFIG.DIFFICULTY_PRESETS.normal;
                enemy.baseSpeed *= this.difficultyScale.speedMult * diffPreset.enemySpeedMult;
                enemy.speed = enemy.baseSpeed;
                enemy.maxHp *= diffPreset.enemyHpMult;
                enemy.hp = enemy.maxHp;
                enemy.maxHp *= tacticalMods.enemyHpMult;
                enemy.hp = enemy.maxHp;
                enemy.armor *= this.difficultyScale.armorMult * diffPreset.enemyArmorMult;
                enemy.baseArmor = enemy.armor;
                if (enemy.isBoss) {
                    const bossProfile = this._getBossProfileForWave(GameState.wave);
                    if (enemy.setBossProfile) enemy.setBossProfile(bossProfile);
                    enemy.maxHp *= diffPreset.bossHpMult;
                    enemy.hp = enemy.maxHp;
                }
                enemy.reward = Math.floor(enemy.reward * diffPreset.goldIncomeMult);
                enemy.baseSpeed *= tacticalMods.enemySpeedMult;
                enemy.speed = enemy.baseSpeed;

                // Apply elite variant if applicable
                if (next.isElite && next.eliteVariant) {
                    this._applyEliteVariant(enemy, next.eliteVariant);
                }

                // Apply active wave modifiers
                for (const mod of this.activeModifiers) {
                    mod.apply(enemy);
                }

                this._applyScenarioToEnemy(enemy);
                this._applyFactionToEnemy(enemy);
                this._applyWaveArcToEnemy(enemy);
                this._applyMapPressure(enemy);
                if (next.isCaptain && next.captainProfileId) {
                    this._applyCaptainProfile(enemy, next.captainProfileId);
                }
                enemy.reward = Math.max(1, Math.floor(enemy.reward * tacticalMods.killGoldMult));

                GameState.enemies.push(enemy);
                GameState.enemiesSpawned++;
                GameState.enemiesAlive++;
                GameState.spawnTimer = next.delay;

                // Skip is only available after the final spawn of the current wave.
                if (GameState.waveEnemies.length === 0) {
                    this._showSkipReadyPrompt();
                }
            }
        } else if (GameState.enemiesAlive > 0) {
            this._showSkipReadyPrompt();
        }

        // Check wave complete
        const survivalObjectivePending = this.isBonusWave && this.bonusObjectiveState &&
            this.bonusObjectiveState.type === 'survival_timer' &&
            !this.bonusObjectiveState.resolved;
        if (!survivalObjectivePending && GameState.waveEnemies.length === 0 && GameState.enemiesAlive <= 0) {
            this.waveComplete();
        }

        this._applyCaptainAuras();
    },

    // Apply elite variant properties to an enemy
    _applyEliteVariant(enemy, variant) {
        enemy.isElite = true;
        enemy.eliteVariant = variant;
        enemy.name = `${variant.prefix} ${enemy.name}`;
        enemy.color = variant.color;

        if (variant.hpMult) {
            enemy.maxHp *= variant.hpMult;
            enemy.hp = enemy.maxHp;
        }
        if (variant.speedMult) {
            enemy.baseSpeed *= variant.speedMult;
            enemy.speed = enemy.baseSpeed;
        }
        if (variant.armorAdd) {
            enemy.armor += variant.armorAdd;
            enemy.baseArmor = enemy.armor;
        }
        if (variant.rewardMult) {
            enemy.reward = Math.floor(enemy.reward * variant.rewardMult);
        }
        if (variant.sizeMult) {
            enemy.size = Math.floor(enemy.size * variant.sizeMult);
        }
        if (variant.regenPct) {
            enemy.regenRate = enemy.maxHp * variant.regenPct;
        }
        if (variant.vampiric) {
            enemy.vampiric = true;
        }
        if (variant.berserker) {
            enemy.berserker = true;
        }
    },

    // ===== ENDLESS MODE WAVE GENERATION =====

    // Generate a procedurally scaled wave for endless mode
    generateEndlessWave(waveNum) {
        const maxWave = GameState.maxWave;
        const endlessNum = waveNum - maxWave; // How many waves past normal
        const mapIndex = GameState.mapIndex;
        const diffGroup = Math.floor(mapIndex / 5);
        const diff = diffGroup * 0.3 + (mapIndex % 5) * 0.06;

        // Scaling factors
        const hpMult = (1.0 + (waveNum - 1) * 0.12 + diff * 0.15) * (1.0 + endlessNum * 0.15);
        const speedMult = Math.min(1.0 + endlessNum * 0.02, 1.5);
        const countBase = Math.floor(5 + waveNum * 1.5 + diff * 2);
        const eliteChance = Math.min(0.1 + endlessNum * 0.02, 0.6);

        // All available enemy types, progressively unlocked
        const allTypes = ['basic', 'fast', 'heavy', 'swarm', 'stealth', 'healer', 'shield',
                          'splitter', 'ghost', 'berserker', 'swarmfast', 'disruptor', 'toxic'];

        // More types unlocked as endless goes deeper
        const availableCount = Math.min(3 + Math.floor(endlessNum / 3), allTypes.length);
        const availableTypes = allTypes.slice(0, availableCount);

        const wave = { enemies: [] };

        // Boss every 5 waves past max
        if (endlessNum % 5 === 0) {
            const bossCount = 1 + Math.floor(endlessNum / 10);
            wave.enemies.push({
                type: 'boss',
                count: bossCount,
                hpMult: hpMult * (1.5 + endlessNum * 0.1),
                delay: 2.5,
                forceElite: endlessNum >= 15,
            });
        }

        // Choose wave composition pattern based on wave number
        const pattern = endlessNum % 7;

        if (pattern === 0) {
            // Massive swarm
            wave.enemies.push({ type: 'swarm', count: countBase * 3, hpMult: hpMult * 0.5 * speedMult, delay: 0.12 });
            wave.enemies.push({ type: 'swarmfast', count: countBase * 2, hpMult: hpMult * 0.3, delay: 0.08 });
        } else if (pattern === 1) {
            // Tank assault
            wave.enemies.push({ type: 'heavy', count: Math.floor(countBase * 0.6), hpMult: hpMult * 1.3, delay: 0.9 });
            wave.enemies.push({ type: 'shield', count: Math.floor(countBase * 0.2), hpMult: hpMult, delay: 1.0 });
            wave.enemies.push({ type: 'healer', count: Math.max(2, Math.floor(endlessNum / 3)), hpMult: hpMult, delay: 1.2 });
        } else if (pattern === 2) {
            // Stealth nightmare
            wave.enemies.push({ type: 'stealth', count: Math.floor(countBase * 0.5), hpMult: hpMult, delay: 0.6 });
            wave.enemies.push({ type: 'ghost', count: Math.floor(countBase * 0.4), hpMult: hpMult * 0.9, delay: 0.7 });
            wave.enemies.push({ type: 'fast', count: Math.floor(countBase * 0.3), hpMult: hpMult * 0.6, delay: 0.3 });
        } else if (pattern === 3) {
            // Berserker rush
            wave.enemies.push({ type: 'berserker', count: Math.floor(countBase * 0.5), hpMult: hpMult * 1.1, delay: 0.7 });
            wave.enemies.push({ type: 'fast', count: Math.floor(countBase * 0.5), hpMult: hpMult * 0.7, delay: 0.3 });
        } else if (pattern === 4) {
            // Splitter chaos
            wave.enemies.push({ type: 'splitter', count: Math.floor(countBase * 0.6), hpMult: hpMult * 1.2, delay: 0.7 });
            wave.enemies.push({ type: 'basic', count: Math.floor(countBase * 0.4), hpMult: hpMult, delay: 0.5 });
            wave.enemies.push({ type: 'shield', count: 2, hpMult: hpMult, delay: 1.0 });
        } else if (pattern === 5) {
            // Everything at once — mixed assault
            const typeCount = Math.min(availableTypes.length, 5);
            for (let t = 0; t < typeCount; t++) {
                const etype = availableTypes[t % availableTypes.length];
                const count = Math.max(2, Math.floor(countBase * 0.3));
                const ehpMult = etype === 'swarm' || etype === 'swarmfast' ? hpMult * 0.4 : hpMult;
                const edelay = etype === 'swarm' || etype === 'swarmfast' ? 0.15 : 0.5;
                wave.enemies.push({ type: etype, count: count, hpMult: ehpMult, delay: edelay });
            }
        } else {
            // Escalating gauntlet — healers supporting heavy hitters
            wave.enemies.push({ type: 'heavy', count: Math.floor(countBase * 0.3), hpMult: hpMult * 1.4, delay: 0.8 });
            wave.enemies.push({ type: 'berserker', count: Math.floor(countBase * 0.3), hpMult: hpMult * 1.1, delay: 0.7 });
            wave.enemies.push({ type: 'healer', count: Math.max(3, Math.floor(endlessNum / 2)), hpMult: hpMult, delay: 1.0 });
            wave.enemies.push({ type: 'stealth', count: Math.floor(countBase * 0.2), hpMult: hpMult * 0.8, delay: 0.6 });
        }

        return wave;
    },

    // Enhanced elite chance for endless mode
    _shouldBeEliteEndless(waveNum, enemyType) {
        if (enemyType === 'boss') return false;
        if (enemyType === 'swarm' || enemyType === 'swarmfast') return false;
        const endlessNum = waveNum - GameState.maxWave;
        const chance = Math.min(0.1 + endlessNum * 0.02, 0.6);
        return Math.random() < chance;
    },

    // Track a kill from this wave
    recordKill(enemy) {
        this.waveStats.currentWaveKills++;
        if (enemy.isElite) {
            this.waveStats.elitesKilledThisWave++;
            this.waveStats.totalElitesKilled++;
        }
        if (enemy && enemy.isObjectiveTarget) {
            this._onBonusObjectiveTargetKilled();
        }
    },

    // Track damage dealt this wave
    recordDamage(amount) {
        this.waveStats.currentWaveDamageDealt += amount;
    },

    // Track an enemy leak
    recordLeak(enemy) {
        this.waveStats.enemiesLeakedThisWave++;
        if (enemy && enemy.isObjectiveTarget) {
            this._onBonusObjectiveTargetLeaked();
        }
    },

    _getEndlessDepth() {
        if (!this.endlessMode || GameState.wave <= GameState.maxWave) return 0;
        return Math.max(0, GameState.wave - GameState.maxWave);
    },

    _getClaimedEndlessMilestonesForMap(mapIdx) {
        if (!GameState.metaProgress || typeof GameState.metaProgress !== 'object') return [];
        if (!GameState.metaProgress.endlessMilestonesClaimed || typeof GameState.metaProgress.endlessMilestonesClaimed !== 'object') {
            GameState.metaProgress.endlessMilestonesClaimed = {};
        }
        const key = String(mapIdx);
        const claimed = GameState.metaProgress.endlessMilestonesClaimed[key];
        if (!Array.isArray(claimed)) {
            GameState.metaProgress.endlessMilestonesClaimed[key] = [];
            return GameState.metaProgress.endlessMilestonesClaimed[key];
        }
        return claimed;
    },

    _updateEndlessRecords() {
        const depth = this._getEndlessDepth();
        if (depth <= 0) return;
        if (!GameState.metaProgress || typeof GameState.metaProgress !== 'object') return;

        if (!Array.isArray(GameState.metaProgress.endlessBestDepthByMap)) {
            GameState.metaProgress.endlessBestDepthByMap = new Array(20).fill(0);
        }
        while (GameState.metaProgress.endlessBestDepthByMap.length < 20) {
            GameState.metaProgress.endlessBestDepthByMap.push(0);
        }

        const mapIdx = GameState.mapIndex;
        const prev = GameState.metaProgress.endlessBestDepthByMap[mapIdx] || 0;
        if (depth > prev) {
            GameState.metaProgress.endlessBestDepthByMap[mapIdx] = depth;
            Effects.addFloatingText(logicalWidth / 2, 74, `New Endless Record: +${depth}`, '#ff9bff', 13);
            SaveSystem.savePersistent();
        }
    },

    _processEndlessMilestones() {
        const depth = this._getEndlessDepth();
        if (depth <= 0) return;

        const claimed = this._getClaimedEndlessMilestonesForMap(GameState.mapIndex);
        let claimedAny = false;

        for (const m of this.endlessMilestones) {
            if (depth < m) continue;
            if (claimed.includes(m)) continue;

            claimed.push(m);
            claimedAny = true;

            const rewardMult = 1 + (GameState.researchBonuses.endlessMilestoneBoost || 0);
            const rpGain = Math.max(1, Math.floor((m / 5) * rewardMult));
            const goldGain = Math.floor((30 + m * 8) * rewardMult);
            GameState.researchPoints += rpGain;
            GameState.gold += goldGain;

            showWaveBanner(`ENDLESS MILESTONE +${m}`);
            Effects.addFloatingText(logicalWidth / 2, 44, `Milestone Reward: +${rpGain} RP`, '#ff9bff', 14);
            Effects.addFloatingText(logicalWidth / 2, 60, `Treasure Cache: +${goldGain} Gold`, '#ffd27a', 12);
            Audio.play('achievement');

            GameState.metaProgress.totalEndlessMilestones = (GameState.metaProgress.totalEndlessMilestones || 0) + 1;
        }

        if (claimedAny) {
            SaveSystem.savePersistent();
        }
    },

    waveComplete() {
        GameState.gamePhase = 'idle';

        // Record wave statistics
        const waveTime = GameState.time - this.waveStats.currentWaveStartTime;
        const isPerfect = this.waveStats.enemiesLeakedThisWave === 0;

        const waveRecord = {
            wave: GameState.wave,
            kills: this.waveStats.currentWaveKills,
            time: waveTime,
            damageDealt: Math.floor(this.waveStats.currentWaveDamageDealt),
            leaked: this.waveStats.enemiesLeakedThisWave,
            elitesKilled: this.waveStats.elitesKilledThisWave,
            modifiers: this.activeModifiers.map(m => m.name),
            isBonus: this.isBonusWave,
            isPerfect: isPerfect,
            bonusObjective: this.bonusObjectiveState ? {
                type: this.bonusObjectiveState.type,
                title: this.bonusObjectiveState.title,
                success: !!this.bonusObjectiveState.success,
                rewardScale: this.bonusObjectiveState.rewardScale || 0,
            } : null,
        };
        this.waveStats.history.push(waveRecord);

        // Update aggregate stats
        this.waveStats.totalWaveTime += waveTime;
        if (waveTime < this.waveStats.fastestWaveClear && this.waveStats.currentWaveKills > 0) {
            this.waveStats.fastestWaveClear = waveTime;
        }
        if (isPerfect) {
            this.waveStats.perfectWaves++;
            GameState.stats.perfectWaves++;
        }

        // Award bonus wave gold
        if (this.isBonusWave && this.currentBonusWave) {
            let rewardScale = 0;
            if (this.bonusObjectiveState) {
                if (!this.bonusObjectiveState.resolved) {
                    if (this.bonusObjectiveState.type === 'survival_timer') {
                        this.bonusObjectiveState.success = true;
                        this.bonusObjectiveState.resolved = true;
                        this.bonusObjectiveState.rewardScale = 1;
                    } else if (this.bonusObjectiveState.type === 'priority_target') {
                        const req = Math.max(1, this.bonusObjectiveState.requiredTargets || 0);
                        const ratio = clamp((this.bonusObjectiveState.eliminatedTargets || 0) / req, 0, 1);
                        this.bonusObjectiveState.success = ratio >= 1;
                        this.bonusObjectiveState.resolved = true;
                        this.bonusObjectiveState.rewardScale = ratio;
                    }
                }
                rewardScale = clamp(this.bonusObjectiveState.rewardScale || 0, 0, 1);
            } else {
                // Legacy fallback: proportional to kills achieved.
                const killRatio = this.waveStats.currentWaveKills / Math.max(GameState.totalEnemiesInWave, 1);
                rewardScale = clamp(killRatio, 0, 1);
            }

            const bonusGold = Math.floor(this.currentBonusWave.bonusGold * rewardScale);
            if (bonusGold > 0) {
                GameState.gold += bonusGold;
                this.waveStats.totalBonusGoldEarned += bonusGold;
                const pct = Math.round(rewardScale * 100);
                Effects.addFloatingText(logicalWidth / 2, 60, `Bonus Objective Reward: +${bonusGold}g (${pct}%)`, '#ffd700', 16);
            } else if (this.bonusObjectiveState) {
                Effects.addFloatingText(logicalWidth / 2, 60, 'Bonus Objective Reward: +0g', '#ffb090', 14);
            }
        }

        if (this.isBonusWave) {
            this.bonusObjectiveState = null;
        }

        // Perfect wave gold bonus
        if (isPerfect && GameState.wave > 1) {
            const perfectBonus = Math.floor(5 + GameState.wave * 2);
            GameState.gold += perfectBonus;
            Effects.addFloatingText(logicalWidth / 2, 40, `Perfect Wave! +${perfectBonus}`, '#40ff40', 13);
        }

        // Endless progression milestones + records
        if (this.endlessMode) {
            this._updateEndlessRecords();
            this._processEndlessMilestones();
        }

        // Check if all waves done
        if (GameState.wave >= GameState.maxWave && !this.endlessMode) {
            // Show endless mode prompt instead of immediate victory
            document.getElementById('endless-modal').style.display = 'flex';
            return;
        }

        // Show wave complete
        Audio.play('wave_complete');
        const clearTimeStr = waveTime.toFixed(1) + 's';
        const endlessTag = this.endlessMode ? ' [ENDLESS]' : '';

        // Calculate Tower MVP for this wave
        let mvpTower = null;
        let mvpDamage = 0;
        const snapshot = this._towerDamageSnapshot || {};
        for (const t of GameState.towers) {
            const waveDmg = t.stats.totalDamageDealt - (snapshot[t.id] || 0);
            if (waveDmg > mvpDamage) {
                mvpDamage = waveDmg;
                mvpTower = t;
            }
        }

        // Show wave banner with MVP info
        if (mvpTower && mvpDamage > 0) {
            const towerDef = TOWERS[mvpTower.type];
            const towerName = towerDef ? towerDef.name : mvpTower.type;
            const mvpKills = mvpTower.kills;
            showWaveBanner(`WAVE ${GameState.wave} COMPLETE${endlessTag} (${clearTimeStr})`);
            // Show MVP as floating text below the banner
            Effects.addFloatingText(
                logicalWidth / 2, 55,
                `MVP: ${towerName} #${mvpTower.id} (${Math.floor(mvpDamage)} dmg)`,
                '#ffd700', 13
            );
        } else {
            showWaveBanner(`WAVE ${GameState.wave} COMPLETE${endlessTag} (${clearTimeStr})`);
        }

        // Track when wave completed so preview can delay appearance
        this.waveCompleteTimestamp = performance.now();

        // Hide skip button and show start button
        const skipBtn = document.getElementById('btn-skip-wave');
        if (skipBtn) skipBtn.style.display = 'none';
        document.getElementById('btn-start-wave').classList.remove('hidden');

        if (this._shouldTriggerEndlessDraft()) {
            this._openEndlessMutatorDraft(this._getEndlessDepth());
            SaveSystem.autoSave();
            return;
        }

        if (this._shouldTriggerTacticalChoice()) {
            if (this._openTacticalChoiceEvent()) {
                SaveSystem.autoSave();
                return;
            }
        }

        // Auto start
        if (GameState.settings.autoStart) {
            this.startCountdown(this.countdownDuration, () => {
                if (GameState.gamePhase === 'idle') this.startWave();
            });
        }

        // Save
        SaveSystem.autoSave();
    },

    getWavePreview(wave) {
        if (wave < 1) return null;

        // In endless mode, waves beyond maxWave don't have predefined defs
        if (this.endlessMode && wave > this.waveDefs.length) {
            const scale = this._calculateDifficultyScale(wave);
            const endlessNum = wave - GameState.maxWave;
            const activeMutators = this._getEndlessDraftModifiers();
            const mutatorNames = activeMutators.map(m => m.name);
            const draftDepth = Math.max(1, endlessNum - 1);
            const draftPending = this._isEndlessDraftDepth(draftDepth) && !this.endlessDraftedDepths.includes(draftDepth);
            const faction = this._getFactionForWave(wave);
            const arc = this._getWaveArcForWave(wave);
            const endlessThreatTags = draftPending
                ? ['MUTATOR DRAFT', 'ELITE RISK']
                : ['UNPREDICTABLE', 'ELITE RISK'];
            if (arc && Array.isArray(arc.threatTags)) {
                for (const tag of arc.threatTags) {
                    if (!endlessThreatTags.includes(tag)) endlessThreatTags.push(tag);
                }
            }
            if (faction && Array.isArray(faction.threatTags)) {
                for (const tag of faction.threatTags) {
                    if (!endlessThreatTags.includes(tag)) endlessThreatTags.push(tag);
                }
            }
            return {
                enemies: [{ type: 'basic', count: '??', name: 'Endless', color: '#ff80ff', hpMult: 1 }],
                difficultyScale: scale,
                hasModifier: activeMutators.length > 0,
                isBonus: wave % 10 === 0,
                eliteChance: Math.min(0.1 + endlessNum * 0.02, 0.6),
                modifierHint: mutatorNames.length > 0
                    ? `Active mutators: ${mutatorNames.join(' + ')}`
                    : 'Endless mode — draft mutators to shape the run.',
                bonusInfo: null,
                isEndless: true,
                faction,
                arc,
                threatTags: endlessThreatTags,
            };
        }

        if (wave > this.waveDefs.length) return null;
        const def = this.waveDefs[wave - 1];

        // Calculate what difficulty scale will be
        const scale = this._calculateDifficultyScale(wave);

        // Determine if this wave will have modifiers
        const hasModifier = (wave % 5 === 0 && wave % 10 !== 0);
        const isBonus = (wave % 10 === 0);
        const scenario = this._getScenarioForWave(wave);
        const faction = this._getFactionForWave(wave);
        const arc = this._getWaveArcForWave(wave);
        const mapPressure = this._getMapPressureForCurrentMap();

        // Estimate elite chance
        const eliteChance = Math.min(0.02 + (wave - 1) * 0.008, 0.25);

        const preview = {
            enemies: def.enemies.map(g => ({
                type: g.type,
                count: g.count,
                name: ENEMIES[g.type].name,
                color: ENEMIES[g.type].color,
                hpMult: g.hpMult || 1,
            })),
            difficultyScale: scale,
            hasModifier: hasModifier,
            isBonus: isBonus,
            eliteChance: eliteChance,
            modifierHint: hasModifier ? 'Random modifier will be applied!' : null,
            bonusInfo: null,
            scenario: scenario,
            faction: faction,
            arc: arc,
            mapPressure: mapPressure,
        };

        if (preview.enemies.some(e => e.type === 'boss')) {
            const boss = this._getBossProfileForWave(wave);
            preview.bossName = boss.name;
        }

        if (isBonus) {
            const templateIdx = Math.floor((wave / 10 - 1) % this.bonusWaveTemplates.length);
            const template = this.bonusWaveTemplates[templateIdx];
            const bonusGroups = template.composition(wave, scale.hpMult);
            preview.enemies = bonusGroups.map(group => ({
                type: group.type,
                count: group.count,
                name: ENEMIES[group.type].name,
                color: ENEMIES[group.type].color,
                hpMult: group.hpMult || 1,
                isObjectiveTarget: !!group.objectiveTarget,
            }));
            preview.bonusInfo = {
                name: template.name,
                desc: template.desc,
                bonusGold: template.bonusGold,
                timeLimit: template.timeLimit,
                objectiveType: template.objective && template.objective.type ? template.objective.type : null,
                objectiveTitle: template.objective && template.objective.title ? template.objective.title : '',
                objectiveGoal: template.objective && template.objective.goalText ? template.objective.goalText : '',
            };
        }

        preview.threatTags = this._deriveThreatTags(preview);

        return preview;
    },

    _deriveThreatTags(preview) {
        if (!preview || !Array.isArray(preview.enemies)) return [];

        const types = new Set(preview.enemies.map(g => g.type));
        const tags = [];
        const add = (t) => {
            if (!tags.includes(t)) tags.push(t);
        };

        if (types.has('boss')) add('BOSS');
        if (types.has('healer')) add('HEAL SUPPORT');
        if (types.has('shield')) add('SHIELD AURA');
        if (types.has('stealth') || types.has('ghost')) add('STEALTH');
        if (types.has('heavy')) add('ARMORED');
        if (types.has('disruptor')) add('DISRUPTION');
        if (types.has('toxic')) add('CORROSIVE');
        if (types.has('splitter')) add('SPLIT ON DEATH');
        if (types.has('berserker')) add('ENRAGE');
        if (types.has('fast') || types.has('swarmfast') || types.has('swarm')) add('RUSH');
        if ((preview.eliteChance || 0) >= 0.15) add('ELITE RISK');
        if (preview.hasModifier) add('WAVE MODIFIER');
        if (preview.isBonus && preview.bonusInfo) {
            add('BONUS OBJECTIVE');
            if (preview.bonusInfo.objectiveType === 'survival_timer') add('SURVIVAL');
            if (preview.bonusInfo.objectiveType === 'priority_target') add('PRIORITY TARGETS');
        }
        if (preview.faction && Array.isArray(preview.faction.threatTags)) {
            for (const tag of preview.faction.threatTags) add(tag);
        }
        if (preview.arc && Array.isArray(preview.arc.threatTags)) {
            for (const tag of preview.arc.threatTags) add(tag);
        }
        if (preview.scenario && Array.isArray(preview.scenario.threatTags)) {
            for (const tag of preview.scenario.threatTags) add(tag);
        }
        if (preview.mapPressure && preview.mapPressure.threatTag) {
            add(preview.mapPressure.threatTag);
        }

        return tags.slice(0, 5);
    },

    _getMapPressureForCurrentMap() {
        const map = MAPS[GameState.mapIndex];
        if (!map || !map.theme) return null;
        return this.mapPressures[map.theme] || null;
    },

    _applyMapPressure(enemy) {
        if (!this.currentMapPressure || !enemy) return;
        if (typeof this.currentMapPressure.apply === 'function') {
            this.currentMapPressure.apply(enemy);
        }
    },

    _getBossProfileForWave(waveNum) {
        const diffGroup = Math.floor(GameState.mapIndex / 5);
        const baseIdx = Math.min(diffGroup, 3);

        // In endless mode, rotate boss archetypes over time to keep encounters varied.
        let variantShift = 0;
        if (this.endlessMode && waveNum > GameState.maxWave) {
            const endlessIndex = Math.max(0, waveNum - GameState.maxWave);
            variantShift = Math.floor(endlessIndex / 10) % 4;
        }

        const profileKeys = ['brood', 'colossus', 'infernal', 'void'];
        const key = profileKeys[(baseIdx + variantShift) % profileKeys.length];
        if (typeof BOSS_ARCHETYPES !== 'undefined' && BOSS_ARCHETYPES[key]) {
            return BOSS_ARCHETYPES[key];
        }
        return {
            name: 'Overlord',
            introAbilities: ['Shield', 'Rush', 'Summon'],
            abilityCycle: ['shield', 'speed', 'summon'],
            color: '#ff2020',
        };
    },

    // Get the current wave's active modifiers for display
    getActiveModifiers() {
        return this.activeModifiers.map(m => ({
            name: m.name,
            desc: m.desc,
            icon: m.icon,
        }));
    },

    // Get formatted stats for the current or a specific wave
    getWaveStatsDisplay(waveNum) {
        if (waveNum !== undefined) {
            const record = this.waveStats.history.find(h => h.wave === waveNum);
            if (!record) return null;
            return {
                wave: record.wave,
                kills: record.kills,
                clearTime: record.time.toFixed(1) + 's',
                damageDealt: formatGold(record.damageDealt),
                leaked: record.leaked,
                elitesKilled: record.elitesKilled,
                modifiers: record.modifiers,
                isBonus: record.isBonus,
                isPerfect: record.isPerfect,
            };
        }
        // Current wave stats
        return {
            wave: GameState.wave,
            kills: this.waveStats.currentWaveKills,
            elapsed: (GameState.time - this.waveStats.currentWaveStartTime).toFixed(1) + 's',
            damageDealt: formatGold(Math.floor(this.waveStats.currentWaveDamageDealt)),
            leaked: this.waveStats.enemiesLeakedThisWave,
            elitesKilled: this.waveStats.elitesKilledThisWave,
        };
    },

    // Get aggregate stats across all waves
    getOverallStats() {
        const totalKills = this.waveStats.history.reduce((s, h) => s + h.kills, 0);
        const totalLeaks = this.waveStats.history.reduce((s, h) => s + h.leaked, 0);
        const totalDmg = this.waveStats.history.reduce((s, h) => s + h.damageDealt, 0);
        const avgClearTime = this.waveStats.history.length > 0
            ? (this.waveStats.totalWaveTime / this.waveStats.history.length).toFixed(1)
            : '0.0';

        return {
            wavesCompleted: this.waveStats.history.length,
            totalKills: totalKills,
            totalLeaks: totalLeaks,
            totalDamage: formatGold(totalDmg),
            fastestClear: this.waveStats.fastestWaveClear === Infinity
                ? 'N/A'
                : this.waveStats.fastestWaveClear.toFixed(1) + 's',
            averageClearTime: avgClearTime + 's',
            perfectWaves: this.waveStats.perfectWaves,
            totalElitesKilled: this.waveStats.totalElitesKilled,
            totalBonusGold: this.waveStats.totalBonusGoldEarned,
        };
    },

    // Get countdown display info
    getCountdownDisplay() {
        if (!this.countdownActive) return null;
        return {
            remaining: Math.ceil(this.countdownTimer),
            fraction: this.countdownTimer / this.countdownDuration,
        };
    },

    // Get bonus wave timer display
    getBonusWaveTimerDisplay() {
        if (!this.isBonusWave || !this.currentBonusWave) return null;
        const objective = this.getBonusObjectiveDisplay();
        return {
            remaining: Math.ceil(this.bonusWaveTimer),
            total: this.currentBonusWave.timeLimit,
            fraction: this.bonusWaveTimer / this.currentBonusWave.timeLimit,
            name: this.currentBonusWave.name,
            objective,
        };
    },

    // Get difficulty info for a given wave
    getDifficultyInfo(waveNum) {
        const scale = this._calculateDifficultyScale(waveNum || GameState.wave);
        return {
            hpMultiplier: (scale.hpMult * 100).toFixed(0) + '%',
            speedMultiplier: (scale.speedMult * 100).toFixed(0) + '%',
            armorMultiplier: (scale.armorMult * 100).toFixed(0) + '%',
            eliteChance: (Math.min(0.02 + ((waveNum || GameState.wave) - 1) * 0.008, 0.25) * 100).toFixed(1) + '%',
        };
    },

    // Skip to the next wave after all current spawns are out
    skipWave() {
        if (GameState.gamePhase !== 'playing') return;
        if (GameState.waveEnemies.length > 0) return;

        // No next wave available in normal mode.
        if (GameState.wave >= GameState.maxWave && !this.endlessMode) return;

        // Hide skip button and immediately force-start the next wave.
        const skipBtn = document.getElementById('btn-skip-wave');
        if (skipBtn) skipBtn.style.display = 'none';
        showWaveBanner('SKIP USED - NEXT WAVE');

        GameState.gamePhase = 'idle';
        this.startWave();
    },

    _showSkipReadyPrompt() {
        if (this.skipReadyShown) return;

        if (GameState.wave >= GameState.maxWave && !this.endlessMode) {
            this.skipReadyShown = true;
            return;
        }

        const skipBtn = document.getElementById('btn-skip-wave');
        if (skipBtn) skipBtn.style.display = 'flex';
        showWaveBanner('SKIP READY - FORCE NEXT WAVE');
        this.skipReadyShown = true;
    },
};

function showWaveBanner(text) {
    const banner = document.getElementById('wave-banner');
    const bannerText = document.getElementById('wave-banner-text');
    if (!banner || !bannerText) return;

    bannerText.textContent = text;

    // Restart animation cleanly on rapid consecutive banners.
    if (showWaveBanner._hideTimer) clearTimeout(showWaveBanner._hideTimer);
    if (showWaveBanner._exitTimer) clearTimeout(showWaveBanner._exitTimer);

    banner.style.display = 'block';
    banner.classList.remove('is-exiting', 'is-visible');
    banner.offsetHeight; // Force reflow so keyframes restart.
    banner.classList.add('is-visible');

    showWaveBanner._exitTimer = setTimeout(() => {
        banner.classList.remove('is-visible');
        banner.classList.add('is-exiting');
    }, 2200);

    showWaveBanner._hideTimer = setTimeout(() => {
        banner.classList.remove('is-exiting');
        banner.style.display = 'none';
    }, 2440);
}
