// ===== ENEMY SYSTEM =====

// Status effect definitions for visual indicators and behavior
const STATUS_EFFECTS = {
    slow: { name: 'Slowed', color: '#60d0e0', icon: 'S', priority: 1 },
    burn: { name: 'Burning', color: '#ff6020', icon: 'B', priority: 2 },
    freeze: { name: 'Frozen', color: '#80e0ff', icon: 'F', priority: 5 },
    poison: { name: 'Poisoned', color: '#40c040', icon: 'P', priority: 3 },
    marked: { name: 'Marked', color: '#ff40ff', icon: 'M', priority: 2 },
    stunned: { name: 'Stunned', color: '#ffe040', icon: '!', priority: 5 },
    brittle: { name: 'Brittle', color: '#a0d0ff', icon: 'X', priority: 3 },
    vulnerable: { name: 'Vulnerable', color: '#ff80c0', icon: 'V', priority: 3 },
    blind: { name: 'Blinded', color: '#fff0a0', icon: 'L', priority: 2 },
    shielded: { name: 'Shielded', color: '#4080e0', icon: 'O', priority: 1 },
    frenzy: { name: 'Frenzy', color: '#ff2200', icon: 'F', priority: 2 },
    fortified: { name: 'Fortified', color: '#888888', icon: 'T', priority: 1 },
    regen: { name: 'Regenerating', color: '#44ff44', icon: 'R', priority: 1 },
    commanded: { name: 'Commanded', color: '#ffbe70', icon: 'C', priority: 2 },
};

// Death animation types
const DEATH_ANIMATIONS = {
    shrink_fade: { duration: 0.4, type: 'shrink_fade' },
    explode: { duration: 0.3, type: 'explode' },
    dissolve: { duration: 0.5, type: 'dissolve' },
    shatter: { duration: 0.35, type: 'shatter' },
};

// Enemy formation patterns
const FORMATION_PATTERNS = {
    line: { name: 'Line', offsetFn: (i, count) => ({ dx: 0, dy: (i - count / 2) * 12 }) },
    wedge: { name: 'Wedge', offsetFn: (i, count) => {
        const row = Math.floor(Math.sqrt(i));
        const col = i - row * row;
        return { dx: -row * 10, dy: (col - row / 2) * 12 };
    }},
    circle: { name: 'Circle', offsetFn: (i, count) => {
        const angle = (Math.PI * 2 / count) * i;
        const radius = 15;
        return { dx: Math.cos(angle) * radius, dy: Math.sin(angle) * radius };
    }},
    scatter: { name: 'Scatter', offsetFn: (i, count) => ({
        dx: (Math.random() - 0.5) * 20,
        dy: (Math.random() - 0.5) * 20,
    })},
};

const BOSS_ARCHETYPES = {
    brood: {
        id: 'brood',
        name: 'Grub King',
        color: '#d8682a',
        abilityCycle: ['summon', 'speed', 'stomp'],
        introAbilities: ['Brood Call', 'Skitter Rush', 'Quake Slow'],
        castColor: '#ffb060',
        abilityDefs: {
            summon: { label: 'Brood Call', telegraph: 'BROOD CALL', castTime: 0.95, cooldown: 7.2, cooldownVariance: 1.2 },
            speed: { label: 'Skitter Rush', telegraph: 'SKITTER RUSH', castTime: 0.55, cooldown: 6.2, cooldownVariance: 1.0 },
            stomp: { label: 'Quake Slow', telegraph: 'QUAKE SLOW', castTime: 0.8, cooldown: 7.4, cooldownVariance: 1.0 },
        },
        phasePlan: [
            {
                threshold: 0.75,
                name: 'Brood Surge',
                abilityCycle: ['summon', 'stomp', 'speed'],
                abilityCooldownMult: 0.95,
                castTimeMult: 0.95,
                summonCountBonus: 1,
                triggerCooldown: 1.8,
            },
            {
                threshold: 0.45,
                name: 'Hatch Frenzy',
                abilityCycle: ['summon', 'speed', 'summon', 'stomp'],
                abilityCooldownMult: 0.85,
                castTimeMult: 0.9,
                summonCountBonus: 2,
                summonHpMult: 1.1,
                triggerCooldown: 1.4,
            },
        ],
        summonType: 'swarm',
        summonCountMin: 3,
        summonCountMax: 5,
        summonHpMult: 0.55,
        speedBurstDuration: 2.8,
        slowAmount: 0.22,
        slowDuration: 2.2,
        enrageThreshold: 0.35,
        enrageSpeedMult: 1.35,
    },
    colossus: {
        id: 'colossus',
        name: 'Stone Colossus',
        color: '#9a7a5a',
        abilityCycle: ['shield', 'stomp', 'disrupt'],
        introAbilities: ['Bastion Shield', 'Ground Slam', 'EMP Pulse'],
        castColor: '#c8b090',
        abilityDefs: {
            shield: { label: 'Bastion Shield', telegraph: 'BASTION SHIELD', castTime: 0.85, cooldown: 7.1, cooldownVariance: 1.0 },
            stomp: { label: 'Ground Slam', telegraph: 'GROUND SLAM', castTime: 0.9, cooldown: 7.3, cooldownVariance: 1.0 },
            disrupt: { label: 'EMP Pulse', telegraph: 'EMP PULSE', castTime: 1.0, cooldown: 7.8, cooldownVariance: 0.9 },
        },
        phasePlan: [
            {
                threshold: 0.7,
                name: 'Fortress Stance',
                abilityCycle: ['shield', 'stomp', 'disrupt'],
                abilityCooldownMult: 0.95,
                castTimeMult: 0.95,
                shieldHpMult: 1.15,
                triggerCooldown: 2.0,
            },
            {
                threshold: 0.4,
                name: 'Siege Breaker',
                abilityCycle: ['disrupt', 'stomp', 'shield', 'disrupt'],
                abilityCooldownMult: 0.82,
                castTimeMult: 0.9,
                towerDisruptDurationMult: 1.2,
                triggerCooldown: 1.5,
            },
        ],
        shieldHpMult: 0.45,
        slowAmount: 0.28,
        slowDuration: 2.8,
        towerDisruptRadius: 170,
        towerDisruptDuration: 2.0,
        enrageThreshold: 0.3,
        enrageSpeedMult: 1.2,
    },
    infernal: {
        id: 'infernal',
        name: 'Infernal Lord',
        color: '#d43a2e',
        abilityCycle: ['speed', 'summon', 'disrupt'],
        introAbilities: ['Blazing Sprint', 'Hellspawn Call', 'Overheat EMP'],
        castColor: '#ff7040',
        abilityDefs: {
            speed: { label: 'Blazing Sprint', telegraph: 'BLAZING SPRINT', castTime: 0.5, cooldown: 5.8, cooldownVariance: 1.0 },
            summon: { label: 'Hellspawn Call', telegraph: 'HELLSPAWN CALL', castTime: 0.95, cooldown: 7.0, cooldownVariance: 1.2 },
            disrupt: { label: 'Overheat EMP', telegraph: 'OVERHEAT EMP', castTime: 0.95, cooldown: 7.2, cooldownVariance: 1.0 },
        },
        phasePlan: [
            {
                threshold: 0.72,
                name: 'Scorch Phase',
                abilityCycle: ['speed', 'summon', 'disrupt'],
                abilityCooldownMult: 0.92,
                castTimeMult: 0.92,
                triggerCooldown: 1.7,
            },
            {
                threshold: 0.42,
                name: 'Burnout Frenzy',
                abilityCycle: ['speed', 'disrupt', 'summon', 'speed'],
                abilityCooldownMult: 0.8,
                castTimeMult: 0.85,
                summonCountBonus: 1,
                towerDisruptDurationMult: 1.15,
                triggerCooldown: 1.3,
            },
        ],
        summonType: 'berserker',
        summonCountMin: 2,
        summonCountMax: 3,
        summonHpMult: 0.65,
        speedBurstDuration: 3.0,
        towerDisruptRadius: 150,
        towerDisruptDuration: 2.4,
        enrageThreshold: 0.3,
        enrageSpeedMult: 1.45,
    },
    void: {
        id: 'void',
        name: 'Void Emperor',
        color: '#8b4ad0',
        abilityCycle: ['teleport', 'shield', 'summon'],
        introAbilities: ['Void Step', 'Aegis Rift', 'Mass Summon'],
        castColor: '#c090ff',
        abilityDefs: {
            teleport: { label: 'Void Step', telegraph: 'VOID STEP', castTime: 0.65, cooldown: 6.2, cooldownVariance: 1.0 },
            shield: { label: 'Aegis Rift', telegraph: 'AEGIS RIFT', castTime: 0.8, cooldown: 6.8, cooldownVariance: 1.0 },
            summon: { label: 'Mass Summon', telegraph: 'MASS SUMMON', castTime: 1.0, cooldown: 7.3, cooldownVariance: 1.2 },
        },
        phasePlan: [
            {
                threshold: 0.72,
                name: 'Phase Drift',
                abilityCycle: ['teleport', 'summon', 'shield'],
                abilityCooldownMult: 0.9,
                castTimeMult: 0.92,
                summonCountBonus: 1,
                triggerCooldown: 1.8,
            },
            {
                threshold: 0.42,
                name: 'Warp Collapse',
                abilityCycle: ['teleport', 'shield', 'summon', 'teleport'],
                abilityCooldownMult: 0.78,
                castTimeMult: 0.85,
                summonCountBonus: 1,
                summonHpMult: 1.1,
                shieldHpMult: 1.1,
                triggerCooldown: 1.2,
            },
        ],
        teleportSegments: 3,
        summonType: 'ghost',
        summonCountMin: 2,
        summonCountMax: 4,
        summonHpMult: 0.6,
        shieldHpMult: 0.4,
        enrageThreshold: 0.28,
        enrageSpeedMult: 1.3,
    },
};

const DEFAULT_BOSS_ARCHETYPE = BOSS_ARCHETYPES.brood;

class Enemy {
    constructor(type, hpMult = 1) {
        const def = ENEMIES[type];
        this.type = type;
        this.name = def.name;
        this.maxHp = def.hp * hpMult;
        this.hp = this.maxHp;
        this.speed = def.speed;
        this.baseSpeed = def.speed;
        this.armor = def.armor;
        this.baseArmor = def.armor;
        this.reward = def.reward;
        this.size = def.size;
        this.color = def.color;
        this.isBoss = def.isBoss || false;
        this.isObjectiveTarget = false;

        // Path following
        this.pathIndex = 0;
        this.x = 0;
        this.y = 0;
        this.progress = 0; // 0 to 1 along current segment

        // Sub-tile interpolation state for smoother movement
        this.renderX = 0;
        this.renderY = 0;
        this.prevX = 0;
        this.prevY = 0;
        this.interpolationAlpha = 0;

        // Status effects
        this.slow = 0;
        this.slowResist = 0;
        this.slowTimer = 0;
        this.frozen = false;
        this.freezeTimer = 0;
        this.stunned = false;
        this.stunTimer = 0;
        this.burning = false;
        this.burnDPS = 0;
        this.burnTimer = 0;
        this.burnArmorMelt = 0;
        this.burnSpreadCount = 0;
        this.burnSpreadRadius = 0;
        this.burnSpreadChance = 1;
        this.marked = false;
        this.markVuln = 0;
        this.markTimer = 0;
        this.brittle = false;
        this.brittleVuln = 0;
        this.brittleTimer = 0;
        this.vulnerableMult = 1;
        this.vulnerableTimer = 0;
        this.blinded = false;
        this.blindTimer = 0;
        this.blindSlowMult = 1;
        this.shielded = false;
        this.shieldHp = 0;

        // Poison status effect
        this.poisoned = false;
        this.poisonDPS = 0;
        this.poisonTimer = 0;
        this.poisonStacks = 0;
        this.maxPoisonStacks = 5;
        this.poisonSpreadCount = 0;
        this.poisonSpreadRadius = 0;
        this.poisonDeathCloud = false;
        this.poisonDeathCloudDuration = 0;
        this.poisonDeathCloudRadius = 0;
        this.poisonSourceTower = null;

        // Corrosion / armor stripping
        this.corrodeDPS = 0;
        this.corrodeTimer = 0;
        this.corrodeMax = 0;
        this.corrodedAmount = 0;

        // Stealth
        this.invisible = false;
        this.stealthTimer = 0;
        this.stealthCooldown = 0;

        // Healer
        this.healCooldown = 1.2;
        this.healCastTimer = 0;
        this.healCastMaxTimer = 0;

        // Health regeneration
        this.regenRate = 0; // HP per second (set by elite variant or wave modifier)
        this.regenTimer = 0;

        // Armor visual feedback
        this.armorSparks = []; // { x, y, life, vx, vy }
        this.lastArmorHitTime = 0;

        // Elite status
        this.isElite = false;
        this.eliteVariant = null;
        this.eliteGlowTimer = 0;

        // Special behaviors from elite variants
        this.vampiric = false;
        this.berserker = false;
        this.frenzy = false; // from wave modifier
        this.fortified = false;
        this.fortifiedReduction = 0;

        // Captain / aura state
        this.isCaptain = false;
        this.captainProfileId = null;
        this.captainAuraRadius = 0;
        this.captainAuraColor = '#ffbe70';
        this.captainAuraName = '';
        this.captainAuraProfileId = null;
        this.captainAuraActive = false;
        this.captainSpeedMult = 1;
        this.captainDamageReduction = 0;
        this.captainArmorBonus = 0;
        this.captainStealthCooldownMult = 1;
        this.captainRegenRate = 0;
        this.captainSupportCastRate = 1;

        // Formation tracking
        this.formationId = null;
        this.formationIndex = 0;
        this.formationOffset = { dx: 0, dy: 0 };

        // Boss special abilities
        this.bossAbilityCooldown = 0;
        this.bossAbilityPhase = 0; // track which ability to use next
        this.bossShieldActive = false;
        this.bossShieldHp = 0;
        this.bossShieldMaxHp = 0;
        this.bossSpeedBurstTimer = 0;
        this.bossSpawnCooldown = 0;
        this.bossEnraged = false;
        this.bossProfile = null;
        this.bossAbilityCycle = ['shield', 'speed', 'summon'];
        this.bossCastTimer = 0;
        this.bossCastMaxTimer = 0;
        this.bossCastLabel = '';
        this.bossPendingAbility = null;
        this.bossPhaseLevel = 0;
        this.bossPhaseName = 'Phase I';
        this.bossPhasePlan = [];
        this.bossPhaseAbilityCooldownMult = 1;
        this.bossPhaseCastTimeMult = 1;
        this.bossPhaseSummonCountBonus = 0;
        this.bossPhaseSummonHpMult = 1;
        this.bossPhaseShieldHpMult = 1;
        this.bossPhaseDisruptDurationMult = 1;

        // Shield enemy aura tracking
        this.shieldAuraCooldown = 0;
        this.shieldAuraRadius = 70;
        this.shieldAuraCastTimer = 0;
        this.shieldAuraCastMaxTimer = 0;

        // Disruptor pulse behavior
        this.disruptCooldown = 0;
        this.disruptRadius = 150;
        this.disruptDuration = 1.5;
        this.disruptCastTimer = 0;
        this.disruptCastMaxTimer = 0;

        // Toxic carrier pulse behavior
        this.toxicCooldown = 0;
        this.toxicRadius = 140;
        this.toxicDuration = 2.8;
        this.toxicDamageMult = 0.8;
        this.toxicCastTimer = 0;
        this.toxicCastMaxTimer = 0;

        // Stealth intent telegraph
        this.stealthPrepTimer = 0;
        this.stealthPrepMaxTimer = 0;

        // Death animation
        this.deathAnim = null; // { type, timer, duration }
        this.deathAnimComplete = false;

        // Visual
        this.hitFlash = 0;
        this.deathTimer = 0;
        this.alive = true;
        this.reached = false;
        this.angle = 0;
        this.bobOffset = Math.random() * Math.PI * 2;

        // Damage tracking
        this.totalDamageTaken = 0;
        this.lastDamageSource = null; // 'fire', 'ice', 'physical', 'lightning', etc.
        this.lastHitTower = null;

        // Set initial position
        if (GameState.detailedPath.length > 0) {
            this.x = GameState.detailedPath[0].x;
            this.y = GameState.detailedPath[0].y;
            this.renderX = this.x;
            this.renderY = this.y;
            this.prevX = this.x;
            this.prevY = this.y;
        }

        if (this.type === 'disruptor') {
            const def = ENEMIES.disruptor || {};
            this.disruptRadius = def.disruptRadius || this.disruptRadius;
            this.disruptDuration = def.disruptDuration || this.disruptDuration;
            this.disruptCooldown = def.disruptInterval || 2.8;
        }
        if (this.type === 'toxic') {
            const def = ENEMIES.toxic || {};
            this.toxicRadius = def.toxicRadius || this.toxicRadius;
            this.toxicDuration = def.toxicDuration || this.toxicDuration;
            this.toxicDamageMult = def.toxicDamageMult || this.toxicDamageMult;
            this.toxicCooldown = def.toxicInterval || 3.2;
        }

        if (this.isBoss) {
            this.setBossProfile(DEFAULT_BOSS_ARCHETYPE);
        }
    }

    setBossProfile(profile) {
        if (!this.isBoss) return;
        const p = profile || DEFAULT_BOSS_ARCHETYPE;

        this.bossProfile = { ...p };
        this.name = p.name || this.name;
        this.color = p.color || this.color;
        this.bossPhaseName = 'Phase I';
        this.bossPhaseLevel = 0;
        this.bossPhasePlan = Array.isArray(p.phasePlan)
            ? p.phasePlan
                .filter(phase => phase && Number.isFinite(phase.threshold))
                .sort((a, b) => b.threshold - a.threshold)
            : [];
        this.bossPhaseAbilityCooldownMult = 1;
        this.bossPhaseCastTimeMult = 1;
        this.bossPhaseSummonCountBonus = 0;
        this.bossPhaseSummonHpMult = 1;
        this.bossPhaseShieldHpMult = 1;
        this.bossPhaseDisruptDurationMult = 1;
        this.bossAbilityCycle = Array.isArray(p.abilityCycle) && p.abilityCycle.length > 0
            ? [...p.abilityCycle]
            : ['shield', 'speed', 'summon'];
        this.bossAbilityPhase = 0;

        const initialCd = Number.isFinite(p.initialCooldown) ? p.initialCooldown : 4.5;
        const initialVar = Number.isFinite(p.initialCooldownVariance) ? p.initialCooldownVariance : 1.2;
        this.bossAbilityCooldown = Math.max(0.5, initialCd + Math.random() * initialVar);
    }

    // Get a list of all active status effects for visual display
    getActiveStatusEffects() {
        const effects = [];
        if (this.slow > 0 && this.slowTimer > 0) effects.push(STATUS_EFFECTS.slow);
        if (this.burning) effects.push(STATUS_EFFECTS.burn);
        if (this.frozen) effects.push(STATUS_EFFECTS.freeze);
        if (this.poisoned) effects.push(STATUS_EFFECTS.poison);
        if (this.marked) effects.push(STATUS_EFFECTS.marked);
        if (this.stunned) effects.push(STATUS_EFFECTS.stunned);
        if (this.brittle) effects.push(STATUS_EFFECTS.brittle);
        if (this.vulnerableMult > 1 && this.vulnerableTimer > 0) effects.push(STATUS_EFFECTS.vulnerable);
        if (this.blinded && this.blindTimer > 0) effects.push(STATUS_EFFECTS.blind);
        if (this.shielded) effects.push(STATUS_EFFECTS.shielded);
        if (this.frenzy) effects.push(STATUS_EFFECTS.frenzy);
        if (this.fortified) effects.push(STATUS_EFFECTS.fortified);
        if (this.corrodeTimer > 0 || this.corrodedAmount > 0) effects.push({ name: 'Corroded', color: '#8fd05c', icon: 'C', priority: 2 });
        if (this.regenRate > 0) effects.push(STATUS_EFFECTS.regen);
        if (this.captainAuraActive && !this.isCaptain) effects.push(STATUS_EFFECTS.commanded);
        // Sort by priority descending so most important show first
        effects.sort((a, b) => b.priority - a.priority);
        return effects;
    }

    update(dt) {
        if (!this.alive) {
            // Process death animation if active
            if (this.deathAnim && !this.deathAnimComplete) {
                this.deathAnim.timer -= dt;
                if (this.deathAnim.timer <= 0) {
                    this.deathAnimComplete = true;
                }
                return false;
            }
            return false;
        }

        // Status effect timers
        if (this.slowTimer > 0) {
            this.slowTimer -= dt;
            if (this.slowTimer <= 0) this.slow = 0;
        }
        if (this.freezeTimer > 0) {
            this.freezeTimer -= dt;
            if (this.freezeTimer <= 0) {
                this.freezeTimer = 0;
                this.frozen = false;
            }
        }
        if (this.stunTimer > 0) {
            this.stunTimer -= dt;
            if (this.stunTimer <= 0) this.stunned = false;
        }
        if (this.burnTimer > 0) {
            this.burnTimer -= dt;
            const burnDmg = this.burnDPS * dt;
            this.hp -= burnDmg;
            GameState.stats.burnDamageDealt = (GameState.stats.burnDamageDealt || 0) + burnDmg;
            if (this.burnArmorMelt > 0) {
                const melt = this.burnArmorMelt * dt;
                this.armor = Math.max(0, this.armor - melt);
                this.baseArmor = Math.max(0, this.baseArmor - melt);
            }
            if (this.burnTimer <= 0) this.burning = false;
        }
        if (this.markTimer > 0) {
            this.markTimer -= dt;
            if (this.markTimer <= 0) { this.marked = false; this.markVuln = 0; }
        }
        if (this.brittleTimer > 0) {
            this.brittleTimer -= dt;
            if (this.brittleTimer <= 0) { this.brittle = false; this.brittleVuln = 0; }
        }
        if (this.vulnerableTimer > 0) {
            this.vulnerableTimer -= dt;
            if (this.vulnerableTimer <= 0) {
                this.vulnerableTimer = 0;
                this.vulnerableMult = 1;
            }
        }
        if (this.blindTimer > 0) {
            this.blindTimer -= dt;
            if (this.blindTimer <= 0) {
                this.blindTimer = 0;
                this.blinded = false;
                this.blindSlowMult = 1;
            }
        }

        if (this.corrodeTimer > 0) {
            this.corrodeTimer -= dt;
            if (this.corrodeDPS > 0 && this.corrodeMax > 0 && this.corrodedAmount < this.corrodeMax) {
                const remaining = this.corrodeMax - this.corrodedAmount;
                const strip = Math.min(remaining, this.corrodeDPS * dt);
                if (strip > 0) {
                    this.corrodedAmount += strip;
                    this.armor = Math.max(0, this.armor - strip);
                    this.baseArmor = Math.max(0, this.baseArmor - strip);
                }
            }
            if (this.corrodeTimer <= 0) {
                this.corrodeTimer = 0;
                this.corrodeDPS = 0;
            }
        }

        // Poison tick
        if (this.poisoned && this.poisonTimer > 0) {
            this.poisonTimer -= dt;
            const poisonDmg = this.poisonDPS * this.poisonStacks * dt;
            this.hp -= poisonDmg;
            this.totalDamageTaken += poisonDmg;
            GameState.stats.poisonDamageDealt = (GameState.stats.poisonDamageDealt || 0) + poisonDmg;
            // Poison visual: occasional green puff
            if (Math.random() < 0.1) {
                Effects.spawnExplosion(
                    this.x + rand(-5, 5),
                    this.y + rand(-5, 5),
                    '#40c040', 2, { speed: 0.3, life: 0.3 }
                );
            }
            if (this.poisonTimer <= 0) {
                this.poisoned = false;
                this.poisonDPS = 0;
                this.poisonStacks = 0;
                this.poisonSpreadCount = 0;
                this.poisonSpreadRadius = 0;
                this.poisonDeathCloud = false;
                this.poisonDeathCloudDuration = 0;
                this.poisonDeathCloudRadius = 0;
                this.poisonSourceTower = null;
            }
        }

        // Health regeneration
        const totalRegenRate = Math.max(0, (this.regenRate || 0) + (this.captainRegenRate || 0));
        if (totalRegenRate > 0 && this.hp < this.maxHp) {
            this.regenTimer += dt;
            if (this.regenTimer >= 0.5) { // Regen tick every 0.5s
                this.regenTimer -= 0.5;
                const healAmount = totalRegenRate * 0.5;
                this.hp = Math.min(this.maxHp, this.hp + healAmount);
                // Small green float text for regen
                if (healAmount >= 1) {
                    Effects.addFloatingText(
                        this.x + rand(-8, 8),
                        this.y - this.size - 3,
                        `+${Math.floor(healAmount)}`,
                        '#44ff44', 8
                    );
                }
            }
        }

        // Elite glow animation
        if (this.isElite) {
            this.eliteGlowTimer += dt * 3;
        }

        // Berserker effect: speed up as HP drops
        if (this.berserker) {
            const hpPct = this.hp / this.maxHp;
            const speedBoost = (1 - hpPct) * 0.8; // Up to 80% speed boost at low HP
            this.speed = this.baseSpeed * (1 + speedBoost);
        }

        // Frenzy effect from wave modifier: speed increases as HP drops
        if (this.frenzy && !this.berserker) {
            const hpPct = this.hp / this.maxHp;
            const speedBoost = (1 - hpPct) * 0.5;
            this.speed = this.baseSpeed * (1 + speedBoost);
        }

        // Update armor sparks
        for (let i = this.armorSparks.length - 1; i >= 0; i--) {
            const spark = this.armorSparks[i];
            spark.life -= dt;
            spark.x += spark.vx * dt;
            spark.y += spark.vy * dt;
            spark.vy += 60 * dt; // gravity
            if (spark.life <= 0) {
                this.armorSparks.splice(i, 1);
            }
        }

        // Stealth behavior
        if (this.type === 'stealth') {
            if (!this.invisible && this.stealthPrepTimer > 0) {
                this.stealthPrepTimer -= dt;
                if (this.stealthPrepTimer <= 0) {
                    this.invisible = true;
                    this.stealthTimer = 2.0;
                    Effects.addFloatingText(this.x, this.y - this.size - 10, 'PHASE', '#b080ff', 10);
                }
            }

            if (!this.invisible && this.stealthCooldown <= 0 && this.stealthPrepTimer <= 0) {
                this.stealthPrepMaxTimer = 0.55;
                this.stealthPrepTimer = this.stealthPrepMaxTimer;
            }
            if (this.invisible) {
                this.stealthTimer -= dt;
                if (this.stealthTimer <= 0) {
                    this.invisible = false;
                    this.stealthCooldown = 3.0 * Math.max(0.35, this.captainStealthCooldownMult || 1);
                }
            }
            if (this.stealthCooldown > 0) this.stealthCooldown -= dt;
        }

        // Healer behavior
        if (this.type === 'healer') {
            const supportCastRate = Math.max(0.5, this.captainSupportCastRate || 1);
            if (this.healCastTimer > 0) {
                this.healCastTimer -= dt;
                if (this.healCastTimer <= 0) {
                    this._castHealerPulse();
                    this.healCooldown = 2.0 / supportCastRate;
                }
            } else {
                this.healCooldown -= dt * supportCastRate;
                if (this.healCooldown <= 0) {
                    this.healCastMaxTimer = 0.65;
                    this.healCastTimer = this.healCastMaxTimer;
                    Effects.addFloatingText(this.x, this.y - this.size - 10, 'HEALING...', '#80ff80', 9);
                }
            }
        }

        // Shield enemy aura: periodically re-apply shields
        if (this.type === 'shield') {
            const supportCastRate = Math.max(0.5, this.captainSupportCastRate || 1);
            if (this.shieldAuraCastTimer > 0) {
                this.shieldAuraCastTimer -= dt;
                if (this.shieldAuraCastTimer <= 0) {
                    this._castShieldAura();
                    this.shieldAuraCooldown = 3.0 / supportCastRate;
                }
            } else {
                this.shieldAuraCooldown -= dt * supportCastRate;
                if (this.shieldAuraCooldown <= 0) {
                    this.shieldAuraCastMaxTimer = 0.7;
                    this.shieldAuraCastTimer = this.shieldAuraCastMaxTimer;
                    Effects.addFloatingText(this.x, this.y - this.size - 10, 'AURA UP...', '#80c0ff', 9);
                }
            }
        }

        if (this.type === 'ghost') {
            const def = ENEMIES.ghost;
            if (def) {
                if (!this.invisible && this.stealthPrepTimer > 0) {
                    this.stealthPrepTimer -= dt;
                    if (this.stealthPrepTimer <= 0) {
                        this.invisible = true;
                        this.stealthTimer = def.phaseDuration || 2.0;
                        Effects.addFloatingText(this.x, this.y - this.size - 10, 'PHASE SHIFT', '#c090ff', 10);
                    }
                }

                if (!this.invisible && this.stealthCooldown <= 0 && this.stealthPrepTimer <= 0) {
                    this.stealthPrepMaxTimer = 0.6;
                    this.stealthPrepTimer = this.stealthPrepMaxTimer;
                }

                if (this.invisible) {
                    this.stealthTimer -= dt;
                    if (this.stealthTimer <= 0) {
                        this.invisible = false;
                        this.stealthCooldown = (def.phaseInterval || 4.0) * Math.max(0.35, this.captainStealthCooldownMult || 1);
                    }
                }

                if (this.stealthCooldown > 0) this.stealthCooldown -= dt;
            }
        }

        if (this.type === 'disruptor') {
            if (this.disruptCastTimer > 0) {
                this.disruptCastTimer -= dt;
                if (this.disruptCastTimer <= 0) {
                    this._castDisruptPulse();
                    this.disruptCooldown = (ENEMIES.disruptor?.disruptInterval || 2.8);
                }
            } else {
                this.disruptCooldown -= dt;
                if (this.disruptCooldown <= 0) {
                    this.disruptCastMaxTimer = 0.7;
                    this.disruptCastTimer = this.disruptCastMaxTimer;
                    Effects.addFloatingText(this.x, this.y - this.size - 10, 'EMP CHARGE...', '#ffb080', 9);
                }
            }
        }

        if (this.type === 'toxic') {
            if (this.toxicCastTimer > 0) {
                this.toxicCastTimer -= dt;
                if (this.toxicCastTimer <= 0) {
                    this._castToxicPulse();
                    this.toxicCooldown = (ENEMIES.toxic?.toxicInterval || 3.2);
                }
            } else {
                this.toxicCooldown -= dt;
                if (this.toxicCooldown <= 0) {
                    this.toxicCastMaxTimer = 0.7;
                    this.toxicCastTimer = this.toxicCastMaxTimer;
                    Effects.addFloatingText(this.x, this.y - this.size - 10, 'TOXIC CLOUD...', '#a0ff80', 9);
                }
            }
        }

        // Boss special abilities
        if (this.isBoss) {
            this._updateBossPhaseState();
            this._updateBossAbilities(dt);
        }

        // Don't move if frozen or stunned
        if (this.frozen || this.stunned) return true;

        // Store previous position for interpolation
        this.prevX = this.x;
        this.prevY = this.y;

        // Movement
        const path = GameState.detailedPath;
        if (this.pathIndex >= path.length - 1) {
            this.reached = true;
            this.alive = false;
            return false;
        }

        const target = path[this.pathIndex + 1];
        const segDist = dist(path[this.pathIndex], target);

        // Calculate effective speed
        let spd = this.baseSpeed;
        if (this.berserker || this.frenzy) {
            spd = this.speed; // Already calculated above
        }
        if (this.slow > 0) spd *= (1 - this.slow);
        if (this.blinded) spd *= this.blindSlowMult;
        if (GameState.globalSlow > 0) spd *= (1 - GameState.globalSlow);
        if (this.captainSpeedMult && Number.isFinite(this.captainSpeedMult) && this.captainSpeedMult > 0) {
            spd *= this.captainSpeedMult;
        }

        // Boss speed burst
        if (this.bossSpeedBurstTimer > 0) {
            spd *= 2.0;
            this.bossSpeedBurstTimer -= dt;
        }

        spd *= CONFIG.TILE_SIZE; // Convert to pixels per second

        const moveAmount = spd * dt;
        this.progress += moveAmount / Math.max(segDist, 1);

        if (this.progress >= 1) {
            this.progress = 0;
            this.pathIndex++;
            if (this.pathIndex >= path.length - 1) {
                this.reached = true;
                this.alive = false;
                return false;
            }
        }

        // Interpolate position with sub-tile smoothing
        const a = path[this.pathIndex];
        const b = path[Math.min(this.pathIndex + 1, path.length - 1)];

        // Use cubic interpolation for smoother curves at path bends
        const rawX = lerp(a.x, b.x, this.progress);
        const rawY = lerp(a.y, b.y, this.progress);

        // Sub-tile interpolation: smooth between physics frames
        this.x = rawX;
        this.y = rawY;

        // Smooth rendering position to reduce jitter
        const smoothFactor = 0.3;
        this.renderX = lerp(this.renderX, this.x, smoothFactor);
        this.renderY = lerp(this.renderY, this.y, smoothFactor);

        // Apply formation offset for grouped enemies
        if (this.formationId !== null) {
            this.renderX += this.formationOffset.dx;
            this.renderY += this.formationOffset.dy;
        }

        this.angle = angleBetween(a, b);

        // Hit flash
        if (this.hitFlash > 0) this.hitFlash -= dt * 5;

        // Check death
        if (this.hp <= 0) {
            this.die();
            return false;
        }

        return true;
    }

    _castHealerPulse() {
        for (const e of GameState.enemies) {
            if (e !== this && e.alive && dist(this, e) < 80) {
                const healAmt = e.maxHp * 0.05;
                e.hp = Math.min(e.maxHp, e.hp + healAmt);
                Effects.addFloatingText(e.x, e.y - 15, `+${Math.floor(healAmt)}`, '#40ff40', 10);
            }
        }
        Effects.spawnExplosion(this.x, this.y, '#60ff90', 8, { speed: 0.8, life: 0.35 });
    }

    _castShieldAura() {
        for (const ally of GameState.enemies) {
            if (ally !== this && ally.alive && !ally.shielded && dist(this, ally) < this.shieldAuraRadius) {
                ally.shielded = true;
                ally.shieldHp = ally.maxHp * 0.2;
            }
        }
        Effects.spawnExplosion(this.x, this.y, '#80b8ff', 8, { speed: 0.8, life: 0.35 });
    }

    _castDisruptPulse() {
        let affected = 0;
        for (const tower of GameState.towers) {
            if (dist(this, tower) > this.disruptRadius) continue;
            tower.disabled = true;
            tower.disabledTimer = Math.max(tower.disabledTimer || 0, this.disruptDuration);
            tower.overclocked = false;
            affected++;
            Effects.addFloatingText(tower.x, tower.y - 16, 'EMP', '#ffb080', 10);
        }

        Effects.spawnExplosion(this.x, this.y, '#ffb080', 10, { speed: 1.0, life: 0.4 });
        if (affected > 0) {
            Effects.addFloatingText(this.x, this.y - this.size - 10, 'DISRUPT!', '#ffb080', 11);
            addScreenShake(1.8);
        }
    }

    _castToxicPulse() {
        let affected = 0;
        for (const tower of GameState.towers) {
            if (dist(this, tower) > this.toxicRadius) continue;
            tower.damageDebuffTimer = Math.max(tower.damageDebuffTimer || 0, this.toxicDuration);
            tower.damageDebuffMult = Math.min(tower.damageDebuffMult || 1, this.toxicDamageMult);
            affected++;
            Effects.addFloatingText(tower.x, tower.y - 16, 'CORRODED', '#a0ff80', 10);
        }

        Effects.spawnExplosion(this.x, this.y, '#90d060', 10, { speed: 0.9, life: 0.45 });
        if (affected > 0) {
            Effects.addFloatingText(this.x, this.y - this.size - 10, 'TOXIC BURST!', '#a0ff80', 11);
        }
    }

    // Boss special abilities
    _updateBossPhaseState() {
        if (!this.isBoss) return;
        if (!Array.isArray(this.bossPhasePlan) || this.bossPhasePlan.length === 0) return;

        while (this.bossPhaseLevel < this.bossPhasePlan.length) {
            const phase = this.bossPhasePlan[this.bossPhaseLevel];
            if (!phase || !Number.isFinite(phase.threshold)) {
                this.bossPhaseLevel++;
                continue;
            }
            if (this.hp > this.maxHp * phase.threshold) {
                break;
            }

            this._enterBossPhase(phase, this.bossPhaseLevel + 2);
            this.bossPhaseLevel++;
        }
    }

    _enterBossPhase(phase, phaseNumber) {
        this.bossPhaseName = phase && phase.name ? phase.name : `Phase ${phaseNumber}`;

        if (phase && Array.isArray(phase.abilityCycle) && phase.abilityCycle.length > 0) {
            this.bossAbilityCycle = [...phase.abilityCycle];
            this.bossAbilityPhase = 0;
        }

        this.bossPhaseAbilityCooldownMult = Number.isFinite(phase?.abilityCooldownMult) && phase.abilityCooldownMult > 0
            ? phase.abilityCooldownMult
            : 1;
        this.bossPhaseCastTimeMult = Number.isFinite(phase?.castTimeMult) && phase.castTimeMult > 0
            ? phase.castTimeMult
            : 1;
        this.bossPhaseSummonCountBonus = Number.isFinite(phase?.summonCountBonus)
            ? Math.max(0, Math.floor(phase.summonCountBonus))
            : 0;
        this.bossPhaseSummonHpMult = Number.isFinite(phase?.summonHpMult) && phase.summonHpMult > 0
            ? phase.summonHpMult
            : 1;
        this.bossPhaseShieldHpMult = Number.isFinite(phase?.shieldHpMult) && phase.shieldHpMult > 0
            ? phase.shieldHpMult
            : 1;
        this.bossPhaseDisruptDurationMult = Number.isFinite(phase?.towerDisruptDurationMult) && phase.towerDisruptDurationMult > 0
            ? phase.towerDisruptDurationMult
            : 1;

        const triggerCd = Number.isFinite(phase?.triggerCooldown) ? phase.triggerCooldown : 1.8;
        this.bossAbilityCooldown = Math.min(this.bossAbilityCooldown, Math.max(0.5, triggerCd));

        const label = phase && phase.name ? phase.name.toUpperCase() : `PHASE ${phaseNumber}`;
        Effects.addFloatingText(this.x, this.y - this.size - 16, `PHASE ${phaseNumber}: ${label}`, this.bossProfile?.castColor || '#ffcc88', 15);
        Effects.spawnExplosion(this.x, this.y, this.bossProfile?.castColor || '#ffcc88', 16, { speed: 1.4, life: 0.6, glow: true });
        addScreenShake(3.2);
    }

    _updateBossAbilities(dt) {
        if (this.bossCastTimer > 0) {
            this.bossCastTimer -= dt;
            if (this.bossCastTimer <= 0 && this.bossPendingAbility) {
                const abilityToCast = this.bossPendingAbility;
                this.bossPendingAbility = null;
                this._executeBossAbility(abilityToCast);
            }
            return;
        }

        this.bossAbilityCooldown -= dt;
        if (this.bossAbilityCooldown > 0) return;

        const cycle = this.bossAbilityCycle && this.bossAbilityCycle.length > 0
            ? this.bossAbilityCycle
            : ['shield', 'speed', 'summon'];
        const nextAbility = cycle[this.bossAbilityPhase % cycle.length];
        this.bossAbilityPhase++;

        const def = this._getBossAbilityDef(nextAbility);
        this.bossCastLabel = def.telegraph || def.label;
        this.bossCastTimer = Math.max(0, def.castTime);
        this.bossCastMaxTimer = this.bossCastTimer;
        this.bossPendingAbility = nextAbility;
        this.bossAbilityCooldown = def.cooldown + Math.random() * def.cooldownVariance;

        Effects.addFloatingText(this.x, this.y - this.size - 10, `${this.bossCastLabel}...`, this.bossProfile?.castColor || '#ffcc88', 12);

        if (this.bossCastTimer <= 0) {
            this._executeBossAbility(nextAbility);
            this.bossPendingAbility = null;
        }
    }

    _getBossAbilityDef(key) {
        const profile = this.bossProfile || DEFAULT_BOSS_ARCHETYPE;
        const defaultDefs = {
            shield: { label: 'Aegis', castTime: 0.75, cooldown: 6.5, cooldownVariance: 1.0 },
            speed: { label: 'Rush', castTime: 0.55, cooldown: 6.0, cooldownVariance: 1.2 },
            summon: { label: 'Summon', castTime: 0.9, cooldown: 7.0, cooldownVariance: 1.5 },
            stomp: { label: 'Ground Slam', castTime: 0.8, cooldown: 7.2, cooldownVariance: 1.1 },
            disrupt: { label: 'EMP Pulse', castTime: 0.9, cooldown: 7.5, cooldownVariance: 1.0 },
            teleport: { label: 'Void Step', castTime: 0.6, cooldown: 6.6, cooldownVariance: 1.2 },
        };
        const profileDefs = profile.abilityDefs && typeof profile.abilityDefs === 'object'
            ? profile.abilityDefs
            : null;
        const merged = {
            ...(defaultDefs[key] || defaultDefs.summon),
            ...(profileDefs && profileDefs[key] ? profileDefs[key] : {}),
        };

        const d = {
            label: merged.label || 'Ability',
            telegraph: merged.telegraph || merged.label || 'Ability',
            castTime: Number.isFinite(merged.castTime) ? merged.castTime : 0.75,
            cooldown: Number.isFinite(merged.cooldown) ? merged.cooldown : 6.5,
            cooldownVariance: Number.isFinite(merged.cooldownVariance) ? merged.cooldownVariance : 1.0,
        };

        let castMult = 1;
        if (profile.abilityCastTimeMult) castMult *= profile.abilityCastTimeMult;
        castMult *= (this.bossPhaseCastTimeMult || 1);
        d.castTime *= castMult;

        let cooldownMult = 1;
        if (profile.abilityCooldownMult) cooldownMult *= profile.abilityCooldownMult;
        cooldownMult *= (this.bossPhaseAbilityCooldownMult || 1);
        d.cooldown *= cooldownMult;
        d.cooldownVariance *= cooldownMult;

        return d;
    }

    _executeBossAbility(key) {
        switch (key) {
            case 'shield':
                this._bossActivateShield();
                break;
            case 'speed':
                this._bossSpeedBurst();
                break;
            case 'summon':
                this._bossSpawnMinions();
                break;
            case 'stomp':
                this._bossStompSlow();
                break;
            case 'disrupt':
                this._bossTowerDisrupt();
                break;
            case 'teleport':
                this._bossTeleportStep();
                break;
            default:
                this._bossSpawnMinions();
                break;
        }
    }

    _bossActivateShield() {
        if (this.bossShieldActive) return;
        this.bossShieldActive = true;
        const shieldMult = (this.bossProfile?.shieldHpMult || 0.3) * (this.bossPhaseShieldHpMult || 1);
        this.bossShieldMaxHp = this.maxHp * shieldMult;
        this.bossShieldHp = this.bossShieldMaxHp;
        Effects.addFloatingText(this.x, this.y - this.size - 10, 'SHIELD!', '#4080ff', 14);
        Effects.spawnExplosion(this.x, this.y, '#4080ff', 12, { speed: 1.0, life: 0.5 });
        Audio.play('freeze');
    }

    _bossSpeedBurst() {
        this.bossSpeedBurstTimer = this.bossProfile?.speedBurstDuration || 2.5;
        Effects.addFloatingText(this.x, this.y - this.size - 10, 'SPEED!', '#ff8800', 14);
        Effects.spawnExplosion(this.x, this.y, '#ff8800', 8, { speed: 1.5, life: 0.3 });
    }

    _bossSpawnMinions() {
        const profile = this.bossProfile || DEFAULT_BOSS_ARCHETYPE;
        const minCount = (profile.summonCountMin || 2) + (this.bossPhaseSummonCountBonus || 0);
        const maxCount = (profile.summonCountMax || 3) + (this.bossPhaseSummonCountBonus || 0);
        const type = profile.summonType || 'swarm';
        const hpMult = (profile.summonHpMult || 0.5) * (this.bossPhaseSummonHpMult || 1);
        const count = minCount + Math.floor(Math.random() * Math.max(1, maxCount - minCount + 1));
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i;
            const offsetDist = 15;
            const spawnPos = {
                x: this.x + Math.cos(angle) * offsetDist,
                y: this.y + Math.sin(angle) * offsetDist,
            };

            if (typeof WaveSystem !== 'undefined' && typeof WaveSystem.spawnEnemyFromEntry === 'function') {
                WaveSystem.spawnEnemyFromEntry(
                    { type, hpMult, delay: 0, isElite: false },
                    {
                        pathIndex: Math.max(0, this.pathIndex - 2),
                        progress: this.progress,
                        position: spawnPos,
                        includeInWaveTotal: true,
                    }
                );
            } else {
                const minion = new Enemy(type, hpMult);
                minion.pathIndex = Math.max(0, this.pathIndex - 2);
                minion.progress = this.progress;
                minion.x = spawnPos.x;
                minion.y = spawnPos.y;
                minion.renderX = minion.x;
                minion.renderY = minion.y;
                minion.prevX = minion.x;
                minion.prevY = minion.y;
                GameState.enemies.push(minion);
                GameState.enemiesAlive++;
                GameState.enemiesSpawned++;
                GameState.totalEnemiesInWave++;
            }
        }
        Effects.addFloatingText(this.x, this.y - this.size - 10, 'SUMMON!', '#ff4040', 14);
        Effects.spawnExplosion(this.x, this.y, '#ff4040', 10, { speed: 0.8, life: 0.4 });
    }

    _bossStompSlow() {
        const slowAmount = this.bossProfile?.slowAmount || 0.25;
        const slowDuration = this.bossProfile?.slowDuration || 2.5;
        GameState.globalSlow = Math.max(GameState.globalSlow, slowAmount);
        GameState.globalSlowTimer = Math.max(GameState.globalSlowTimer, slowDuration);
        Effects.addFloatingText(this.x, this.y - this.size - 10, 'GROUND SLAM!', '#80c8ff', 13);
        Effects.spawnExplosion(this.x, this.y, '#80c8ff', 14, { speed: 1.1, life: 0.5 });
        addScreenShake(3.5);
        Audio.play('freeze');
    }

    _bossTowerDisrupt() {
        const radius = this.bossProfile?.towerDisruptRadius || 160;
        const duration = (this.bossProfile?.towerDisruptDuration || 2.2) * (this.bossPhaseDisruptDurationMult || 1);
        let affected = 0;
        for (const tower of GameState.towers) {
            if (dist(this, tower) > radius) continue;
            tower.disabled = true;
            tower.disabledTimer = Math.max(tower.disabledTimer || 0, duration);
            tower.overclocked = false;
            affected++;
            Effects.addFloatingText(tower.x, tower.y - 18, 'DISRUPTED', '#ff9a60', 10);
        }
        if (affected > 0) {
            Effects.addFloatingText(this.x, this.y - this.size - 10, 'EMP PULSE!', '#ffb080', 13);
            Effects.spawnExplosion(this.x, this.y, '#ffb080', 12, { speed: 1.0, life: 0.4 });
            addScreenShake(2.5);
        }
    }

    _bossTeleportStep() {
        const path = GameState.detailedPath;
        if (!path || path.length < 2) return;
        const jump = this.bossProfile?.teleportSegments || 2;
        const oldX = this.x;
        const oldY = this.y;
        this.pathIndex = Math.max(0, Math.min(this.pathIndex + jump, path.length - 2));
        this.progress = 0;
        const pt = path[this.pathIndex];
        this.x = pt.x;
        this.y = pt.y;
        this.renderX = this.x;
        this.renderY = this.y;
        this.prevX = this.x;
        this.prevY = this.y;

        Effects.spawnExplosion(oldX, oldY, '#b080ff', 12, { speed: 0.9, life: 0.45 });
        Effects.spawnExplosion(this.x, this.y, '#b080ff', 14, { speed: 1.3, life: 0.55 });
        Effects.addFloatingText(this.x, this.y - this.size - 10, 'VOID STEP!', '#c090ff', 13);
        addScreenShake(2.8);
    }

    // Enrage the boss at low HP
    _checkBossEnrage() {
        const threshold = this.bossProfile?.enrageThreshold || 0.3;
        const speedMult = this.bossProfile?.enrageSpeedMult || 1.3;
        if (this.isBoss && !this.bossEnraged && this.hp < this.maxHp * threshold) {
            this.bossEnraged = true;
            this.baseSpeed *= speedMult;
            this.speed = this.baseSpeed;
            this.bossAbilityCooldown = Math.min(this.bossAbilityCooldown, 2.0); // Faster abilities
            Effects.addFloatingText(this.x, this.y - this.size - 15, 'ENRAGED!', '#ff0000', 16);
            Effects.spawnExplosion(this.x, this.y, '#ff0000', 20, { speed: 2.0, life: 0.6 });
            addScreenShake(4);
        }
    }

    takeDamage(amount, source = null) {
        // Armor reduction
        let armor = this.armor;
        let armorPierce = 0;
        if (source && source.special) {
            armorPierce = source.special.armorPierce || 0;
        }
        // Research armor pierce
        armorPierce += (GameState.researchBonuses.armorPierce || 0);
        armor += (this.captainArmorBonus || 0);
        armor = armor * (1 - Math.min(armorPierce, 1));

        let dmg = Math.max(amount - armor, 1);

        // Fortified reduction (from wave modifier)
        if (this.fortified) {
            dmg *= (1 - this.fortifiedReduction);
        }
        if (this.captainDamageReduction > 0) {
            dmg *= (1 - this.captainDamageReduction);
        }

        // Mark vulnerability
        if (this.marked) dmg *= (1 + this.markVuln);
        if (this.brittle) dmg *= (1 + this.brittleVuln);
        if (this.vulnerableMult > 1) dmg *= this.vulnerableMult;

        // Global buff
        if (GameState.globalDmgBuff > 0) dmg *= (1 + GameState.globalDmgBuff);

        // Doctrine modifiers
        const de = GameState.doctrineEffects || {};
        if (de.globalDamageMult && Number.isFinite(de.globalDamageMult) && de.globalDamageMult > 0) {
            dmg *= de.globalDamageMult;
        }
        if ((this.isElite || this.isBoss) && de.eliteBossDamageMult && Number.isFinite(de.eliteBossDamageMult) && de.eliteBossDamageMult > 0) {
            dmg *= de.eliteBossDamageMult;
        }

        if (typeof WaveSystem !== 'undefined' && typeof WaveSystem.getCurrentTacticalModifiers === 'function') {
            const tactical = WaveSystem.getCurrentTacticalModifiers();
            if (tactical.towerDamageMult && Number.isFinite(tactical.towerDamageMult) && tactical.towerDamageMult > 0) {
                dmg *= tactical.towerDamageMult;
            }
        }

        // Boss shield
        if (this.bossShieldActive && this.bossShieldHp > 0) {
            this.bossShieldHp -= dmg;
            if (this.bossShieldHp <= 0) {
                this.bossShieldActive = false;
                dmg = -this.bossShieldHp;
                this.bossShieldHp = 0;
                Effects.addFloatingText(this.x, this.y - this.size - 5, 'SHIELD BREAK!', '#4080ff', 12);
                Effects.spawnExplosion(this.x, this.y, '#4080ff', 15, { speed: 1.2 });
            } else {
                // Spawn sparks on shield hit
                this._spawnArmorSparks(2, '#4080ff');
                dmg = 0;
            }
        }

        // Shield
        if (this.shielded && this.shieldHp > 0) {
            this.shieldHp -= dmg;
            if (this.shieldHp <= 0) {
                this.shielded = false;
                dmg = -this.shieldHp;
                this.shieldHp = 0;
            } else {
                dmg = 0;
            }
        }

        // Armor spark visual feedback when hitting armored enemies
        if (armor > 0 && dmg > 0 && amount > 0) {
            const armorReduction = Math.max(0, amount - dmg) / amount;
            if (armorReduction > 0.15) {
                this._spawnArmorSparks(Math.floor(armorReduction * 6), '#cccccc');
            }
        }

        this.hp -= dmg;
        this.hitFlash = 1;
        this.totalDamageTaken += dmg;

        // Track damage source type for death animation selection
        if (source) {
            this.lastDamageSource = source.type || 'physical';
            if (typeof source.kills === 'number') {
                this.lastHitTower = source;
            }
        }

        // Research: Frost Armor — tower hits add a small slow.
        if (dmg > 0 && GameState.researchBonuses.frostArmor && this.alive) {
            this.applySlow(0.12, 0.75);
        }

        // Record damage for wave stats
        if (typeof WaveSystem !== 'undefined' && WaveSystem.recordDamage) {
            WaveSystem.recordDamage(dmg);
        }

        if (dmg > 0) {
            Effects.addFloatingText(
                this.x + rand(-10, 10),
                this.y - this.size - 5,
                Math.floor(dmg).toString(),
                '#fff',
                dmg > 100 ? 14 : 11
            );
        }

        // Check boss enrage
        if (this.isBoss) {
            this._checkBossEnrage();
        }

        if (this.hp <= 0) {
            this.die();
        }
    }

    // Spawn armor spark particles for visual feedback
    _spawnArmorSparks(count, color) {
        for (let i = 0; i < count; i++) {
            this.armorSparks.push({
                x: this.x + rand(-this.size, this.size),
                y: this.y + rand(-this.size, this.size),
                vx: rand(-40, 40),
                vy: rand(-60, -20),
                life: 0.3 + Math.random() * 0.2,
                color: color || '#cccccc',
            });
        }
        this.lastArmorHitTime = GameState.time;
    }

    applySlow(amount, duration) {
        const rb = GameState.researchBonuses;
        const durMult = 1 + (rb.effectDuration || 0);
        const resisted = amount * (1 - Math.max(0, Math.min(this.slowResist || 0, 0.8)));
        this.slow = Math.max(this.slow, resisted);
        this.slowTimer = Math.max(this.slowTimer, duration * durMult);
    }

    applyFreeze(duration, options = {}) {
        const ignoreBossImmunity = options === true || !!(options && options.ignoreBossImmunity);
        if (this.isBoss && !ignoreBossImmunity) return false; // Bosses immune unless special
        const rb = GameState.researchBonuses;
        const durMult = 1 + (rb.effectDuration || 0);
        this.frozen = true;
        this.freezeTimer = Math.max(this.freezeTimer, duration * durMult);
        GameState.stats.freezeApplications = (GameState.stats.freezeApplications || 0) + 1;
        Effects.spawnFrostRing(this.x, this.y);
        Audio.play('freeze');
        return true;
    }

    applyStun(duration) {
        if (this.isBoss) return;
        this.stunned = true;
        this.stunTimer = Math.max(this.stunTimer, duration);
    }

    applyBurn(dps, duration, options = {}) {
        this.burning = true;
        this.burnDPS = Math.max(this.burnDPS, dps);
        this.burnTimer = Math.max(this.burnTimer, duration);
        if (Number.isFinite(options.meltArmor) && options.meltArmor > 0) {
            this.burnArmorMelt = Math.max(this.burnArmorMelt || 0, options.meltArmor);
        }
    }

    applyMark(vuln, duration) {
        this.marked = true;
        this.markVuln = Math.max(this.markVuln, vuln);
        this.markTimer = Math.max(this.markTimer, duration);
    }

    applyBrittle(vuln, duration) {
        this.brittle = true;
        this.brittleVuln = Math.max(this.brittleVuln, vuln);
        this.brittleTimer = Math.max(this.brittleTimer, duration);
    }

    applyVulnerability(multiplier, duration) {
        if (!Number.isFinite(multiplier) || multiplier <= 1) return;
        const rb = GameState.researchBonuses;
        const durMult = 1 + (rb.effectDuration || 0);
        this.vulnerableMult = Math.max(this.vulnerableMult, multiplier);
        this.vulnerableTimer = Math.max(this.vulnerableTimer, duration * durMult);
    }

    applyBlind(duration, slowMult = 0.3) {
        const rb = GameState.researchBonuses;
        const durMult = 1 + (rb.effectDuration || 0);
        this.blinded = true;
        this.blindTimer = Math.max(this.blindTimer, duration * durMult);
        const clampedSlowMult = Math.max(0.15, Math.min(1, slowMult));
        this.blindSlowMult = Math.min(this.blindSlowMult, clampedSlowMult);
    }

    // Apply poison (stacking)
    applyPoison(dps, duration, options = {}) {
        this.poisoned = true;
        this.poisonDPS = Math.max(this.poisonDPS, dps);
        this.poisonTimer = Math.max(this.poisonTimer, duration);
        if (Number.isFinite(options.maxStacks) && options.maxStacks > 0) {
            this.maxPoisonStacks = Math.max(this.maxPoisonStacks || 1, Math.floor(options.maxStacks));
        }
        this.poisonStacks = Math.min(this.poisonStacks + 1, this.maxPoisonStacks);
        if (Number.isFinite(options.spreadCount) && options.spreadCount > 0) {
            this.poisonSpreadCount = Math.max(this.poisonSpreadCount || 0, Math.floor(options.spreadCount));
            this.poisonSpreadRadius = Math.max(this.poisonSpreadRadius || 0, options.spreadRadius || 0);
        }
        if (options.deathCloud) {
            this.poisonDeathCloud = true;
            this.poisonDeathCloudDuration = Math.max(this.poisonDeathCloudDuration || 0, options.cloudDuration || 0);
            this.poisonDeathCloudRadius = Math.max(this.poisonDeathCloudRadius || 0, options.cloudRadius || 0);
        }
        if (options.sourceTower) {
            this.poisonSourceTower = options.sourceTower;
        }
    }

    applyCorrosion(dps, duration, maxStrip) {
        if (!Number.isFinite(dps) || dps <= 0) return;
        this.corrodeDPS = Math.max(this.corrodeDPS, dps);
        this.corrodeTimer = Math.max(this.corrodeTimer, duration || 0);
        if (Number.isFinite(maxStrip) && maxStrip > 0) {
            this.corrodeMax = Math.max(this.corrodeMax, maxStrip);
        }
    }

    // Select death animation based on damage source
    _selectDeathAnimation() {
        switch (this.lastDamageSource) {
            case 'cannon':
            case 'missile':
                return { ...DEATH_ANIMATIONS.explode };
            case 'ice':
                return { ...DEATH_ANIMATIONS.shatter };
            case 'lightning':
                return { ...DEATH_ANIMATIONS.dissolve };
            case 'laser':
                return { ...DEATH_ANIMATIONS.dissolve };
            default:
                return { ...DEATH_ANIMATIONS.shrink_fade };
        }
    }

    die() {
        if (!this.alive) return;
        this.alive = false;

        // Start death animation
        const anim = this._selectDeathAnimation();
        anim.timer = anim.duration;
        this.deathAnim = anim;
        this.deathAnimComplete = false;

        // Reward
        let reward = this.reward;
        const rb = GameState.researchBonuses;
        if (this.isBoss && rb.bossGold) reward *= (1 + rb.bossGold);
        // Elite enemies give more gold
        if (this.isElite) reward = Math.floor(reward * 1.5);

        // Research: Efficiency Expert — veteran towers (100+ kills) grant bonus gold on kill.
        if (rb.killGoldBonus && this.lastHitTower && this.lastHitTower.kills >= 100) {
            reward = Math.floor(reward * (1 + rb.killGoldBonus));
        }
        GameState.gold += reward;
        GameState.score += Math.floor(this.maxHp / 2);

        // Stats
        GameState.stats.totalKills++;
        if (this.isBoss) GameState.stats.bossKills++;
        if (this.isCaptain) {
            GameState.stats.captainKillsThisRun = (GameState.stats.captainKillsThisRun || 0) + 1;
        }
        GameState.stats.maxGold = Math.max(GameState.stats.maxGold, GameState.gold);

        // Wave stats
        if (typeof WaveSystem !== 'undefined' && WaveSystem.recordKill) {
            WaveSystem.recordKill(this);
        }

        if ((this.isElite || this.isBoss) && rb.abilityCdOnEliteKill && typeof AbilitySystem !== 'undefined' && AbilitySystem.reduceCooldowns) {
            AbilitySystem.reduceCooldowns(rb.abilityCdOnEliteKill);
            Effects.addFloatingText(this.x, this.y - 34, `- ${rb.abilityCdOnEliteKill.toFixed(1)}s CD`, '#80e0ff', 10);
        }

        // Death effects based on animation type
        if (this.deathAnim.type === 'explode') {
            Effects.spawnExplosion(this.x, this.y, this.color, 16, { speed: 2.0 });
            addScreenShake(this.isBoss ? 6 : 2);
        } else if (this.deathAnim.type === 'shatter') {
            // Ice shatter effect: blue-white particles
            Effects.spawnExplosion(this.x, this.y, '#a0e0ff', 12, { speed: 1.5 });
            Effects.spawnExplosion(this.x, this.y, '#ffffff', 6, { speed: 1.0 });
        } else if (this.deathAnim.type === 'dissolve') {
            // Dissolve: smaller scattered particles
            Effects.spawnExplosion(this.x, this.y, this.color, 6, { speed: 0.5, life: 0.8 });
        } else {
            // Default shrink_fade
            Effects.spawnExplosion(this.x, this.y, this.color, 8);
        }

        Effects.spawnGoldCoin(this.x, this.y);
        Effects.addFloatingText(this.x, this.y - 20, `+${reward}`, '#ffd700', 12);

        // Elite death: extra burst effect
        if (this.isElite) {
            Effects.spawnExplosion(this.x, this.y, this.eliteVariant ? this.eliteVariant.color : '#ffaa00', 12, { speed: 1.8, life: 0.5 });
            Effects.addFloatingText(this.x, this.y - 30, 'ELITE SLAIN!', '#ffaa00', 11);
        }

        if (this.lastHitTower && this.lastHitTower.special && this.lastHitTower.special.witherHeal) {
            const heal = Math.max(1, Math.floor(this.lastHitTower.special.healPerKill || 1));
            GameState.lives = Math.min(GameState.maxLives, GameState.lives + heal);
            Effects.addFloatingText(this.lastHitTower.x, this.lastHitTower.y - 18, `+${heal} HP`, '#90ff90', 10);
        }

        if (this.poisoned && this.poisonSpreadCount > 0 && this.poisonSourceTower) {
            let spreadApplied = 0;
            const spreadRadius = this.poisonSpreadRadius || 80;
            for (const ally of GameState.enemies) {
                if (!ally.alive || ally === this) continue;
                if (dist(this, ally) > spreadRadius) continue;
                ally.applyPoison(
                    this.poisonDPS,
                    Math.max(0.5, this.poisonTimer || 2),
                    {
                        maxStacks: this.maxPoisonStacks,
                        sourceTower: this.poisonSourceTower,
                        spreadCount: this.poisonSpreadCount,
                        spreadRadius,
                        deathCloud: this.poisonDeathCloud,
                        cloudDuration: this.poisonDeathCloudDuration,
                        cloudRadius: this.poisonDeathCloudRadius,
                    }
                );
                spreadApplied++;
                if (spreadApplied >= this.poisonSpreadCount) break;
            }
            if (spreadApplied > 0) {
                Effects.addFloatingText(this.x, this.y - this.size - 10, 'PLAGUE!', '#80ff80', 10);
            }
        }

        if (this.poisoned && this.poisonDeathCloud && this.poisonDeathCloudRadius > 0) {
            const cloudDuration = Math.max(0.25, this.poisonDeathCloudDuration || 2.5);
            const cloudRadius = this.poisonDeathCloudRadius;
            const cloudDps = Math.max(1, this.poisonDPS * 0.5);
            const cloudUntil = GameState.time + cloudDuration;
            if (!Array.isArray(GameState.poisonClouds)) GameState.poisonClouds = [];
            GameState.poisonClouds.push({
                x: this.x,
                y: this.y,
                radius: cloudRadius,
                dps: cloudDps,
                until: cloudUntil,
                sourceTower: this.poisonSourceTower || null,
            });
            Effects.spawnExplosion(this.x, this.y, '#70d060', Math.floor(cloudRadius / 8), { speed: 0.8, life: 0.5 });
        }

        Audio.play('death');

        GameState.enemiesAlive--;
    }

    getDistFromEnd() {
        const path = GameState.detailedPath;
        let d = 0;
        // Distance from current position to next waypoint
        if (this.pathIndex < path.length - 1) {
            d += dist(this, path[this.pathIndex + 1]) * (1 - this.progress);
        }
        // Sum remaining segments
        for (let i = this.pathIndex + 1; i < path.length - 1; i++) {
            d += dist(path[i], path[i + 1]);
        }
        return d;
    }

    // Get the percentage of path remaining (0 = at end, 1 = at start)
    getPathProgressPercent() {
        const path = GameState.detailedPath;
        if (path.length <= 1) return 0;
        const totalSegments = path.length - 1;
        const completedSegments = this.pathIndex + this.progress;
        return completedSegments / totalSegments;
    }

    // Check if enemy is within a certain distance of a point
    isInRange(px, py, range) {
        const dx = this.x - px;
        const dy = this.y - py;
        return (dx * dx + dy * dy) <= range * range;
    }

    // Get the health percentage
    getHealthPercent() {
        return this.hp / this.maxHp;
    }

    // Check if the enemy has any negative status effects
    hasDebuffs() {
        return this.slow > 0 || this.frozen || this.stunned || this.burning ||
               this.marked || this.brittle || this.poisoned || this.blinded || this.vulnerableMult > 1;
    }

    // Get shield status (combines normal shield and boss shield)
    getShieldInfo() {
        if (this.bossShieldActive && this.bossShieldHp > 0) {
            return { active: true, hp: this.bossShieldHp, maxHp: this.bossShieldMaxHp, type: 'boss' };
        }
        if (this.shielded && this.shieldHp > 0) {
            return { active: true, hp: this.shieldHp, maxHp: this.maxHp * 0.2, type: 'normal' };
        }
        return { active: false, hp: 0, maxHp: 0, type: 'none' };
    }
}

// ===== ENEMY FORMATION SYSTEM =====
const EnemyFormations = {
    formations: [], // { id, pattern, members: [enemy refs], leader: enemy ref }
    nextFormationId: 1,

    // Create a formation from a group of enemies
    createFormation(enemies, patternName) {
        const pattern = FORMATION_PATTERNS[patternName] || FORMATION_PATTERNS.line;
        const formationId = this.nextFormationId++;
        const formation = {
            id: formationId,
            pattern: pattern,
            members: enemies,
            leader: enemies[0],
        };

        for (let i = 0; i < enemies.length; i++) {
            enemies[i].formationId = formationId;
            enemies[i].formationIndex = i;
            enemies[i].formationOffset = pattern.offsetFn(i, enemies.length);
        }

        this.formations.push(formation);
        return formation;
    },

    // Update all formations
    update(dt) {
        for (let i = this.formations.length - 1; i >= 0; i--) {
            const formation = this.formations[i];

            // Remove dead members
            formation.members = formation.members.filter(e => e.alive);

            // If formation is too small, dissolve it
            if (formation.members.length <= 1) {
                for (const m of formation.members) {
                    m.formationId = null;
                    m.formationOffset = { dx: 0, dy: 0 };
                }
                this.formations.splice(i, 1);
                continue;
            }

            // Update leader if needed
            if (!formation.leader.alive) {
                formation.leader = formation.members[0];
            }

            // Re-apply offsets as formation shrinks
            for (let j = 0; j < formation.members.length; j++) {
                formation.members[j].formationIndex = j;
                formation.members[j].formationOffset = formation.pattern.offsetFn(j, formation.members.length);
            }
        }
    },

    // Check if an enemy is in a formation
    isInFormation(enemy) {
        return enemy.formationId !== null;
    },

    // Get all formation members near a point
    getFormationMembersNear(x, y, radius) {
        const result = [];
        for (const formation of this.formations) {
            for (const member of formation.members) {
                if (member.alive && dist({ x, y }, member) <= radius) {
                    // Include all formation members
                    for (const m of formation.members) {
                        if (m.alive && !result.includes(m)) result.push(m);
                    }
                    break;
                }
            }
        }
        return result;
    },

    // Reset formations
    reset() {
        this.formations = [];
        this.nextFormationId = 1;
    },
};

// Shield enemy behavior
function updateShieldEnemies() {
    for (const e of GameState.enemies) {
        if (e.type === 'shield' && e.alive) {
            for (const ally of GameState.enemies) {
                if (ally !== e && ally.alive && !ally.shielded && dist(e, ally) < 70) {
                    ally.shielded = true;
                    ally.shieldHp = ally.maxHp * 0.2;
                }
            }
        }
    }
}
