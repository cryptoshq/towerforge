// ===== TOWER SYSTEM — DUAL PATH UPGRADES =====

// Tower synergy definitions: bonuses when specific tower types are adjacent
const TOWER_SYNERGIES = {
    // { types: [typeA, typeB], range: number, bonuses: { dmg, rate, range, special } }
    fire_ice: {
        types: ['cannon', 'ice'],
        range: 120,
        name: 'Thermal Shock',
        desc: '+10% damage to both towers',
        bonuses: { dmg: 0.10, rate: 0, range: 0 },
    },
    sniper_lightning: {
        types: ['sniper', 'lightning'],
        range: 150,
        name: 'Overcharge',
        desc: '+8% fire rate to both towers',
        bonuses: { dmg: 0, rate: 0.08, range: 0 },
    },
    arrow_arrow: {
        types: ['arrow', 'arrow'],
        range: 100,
        name: 'Crossfire',
        desc: '+5% damage, +5% range',
        bonuses: { dmg: 0.05, rate: 0, range: 0.05 },
    },
    ice_lightning: {
        types: ['ice', 'lightning'],
        range: 130,
        name: 'Superconductor',
        desc: '+12% damage to lightning tower',
        bonuses: { dmg: 0.12, rate: 0, range: 0 },
    },
    cannon_missile: {
        types: ['cannon', 'missile'],
        range: 120,
        name: 'Bombardment',
        desc: '+15% splash radius',
        bonuses: { dmg: 0, rate: 0, range: 0, splashBonus: 0.15 },
    },
    sniper_arrow: {
        types: ['sniper', 'arrow'],
        range: 140,
        name: 'Focus Fire',
        desc: '+10% crit chance to sniper',
        bonuses: { dmg: 0, rate: 0, range: 0, critBonus: 0.10 },
    },
    laser_boost: {
        types: ['laser', 'boost'],
        range: 100,
        name: 'Amplified Beam',
        desc: '+20% beam ramp rate',
        bonuses: { dmg: 0, rate: 0, range: 0, rampBonus: 0.20 },
    },
    flame_cannon: {
        types: ['flame', 'cannon'],
        range: 120,
        name: 'Scorched Earth',
        desc: '+15% burn damage to both',
        bonuses: { dmg: 0.15, rate: 0, range: 0 },
    },
    venom_ice: {
        types: ['venom', 'ice'],
        range: 130,
        name: 'Toxic Frost',
        desc: '+10% poison DPS, +10% slow duration',
        bonuses: { dmg: 0.10, rate: 0, range: 0 },
    },
    mortar_sniper: {
        types: ['mortar', 'sniper'],
        range: 150,
        name: 'Artillery Spotter',
        desc: '+12% range and +8% damage to mortar',
        bonuses: { dmg: 0.08, rate: 0, range: 0.12 },
    },
    necro_venom: {
        types: ['necro', 'venom'],
        range: 120,
        name: 'Death Blight',
        desc: '+15% damage to both, enemies decay faster',
        bonuses: { dmg: 0.15, rate: 0, range: 0 },
    },
    flame_ice: {
        types: ['flame', 'ice'],
        range: 110,
        name: 'Steam Burst',
        desc: '+10% fire rate to both',
        bonuses: { dmg: 0, rate: 0.10, range: 0 },
    },
    necro_laser: {
        types: ['necro', 'laser'],
        range: 120,
        name: 'Soul Beam',
        desc: '+12% damage to laser, +2 soul gain',
        bonuses: { dmg: 0.12, rate: 0, range: 0 },
    },
    mortar_cannon: {
        types: ['mortar', 'cannon'],
        range: 130,
        name: 'Heavy Barrage',
        desc: '+20% splash radius to both',
        bonuses: { dmg: 0, rate: 0, range: 0, splashBonus: 0.20 },
    },
};

class Tower {
    constructor(type, worldX, worldY) {
        const def = TOWERS[type];
        this.type = type;
        // Free placement: use exact world coordinates
        this.x = worldX;
        this.y = worldY;
        // Keep gridCol/gridRow for compatibility (derived from position)
        this.gridCol = Math.floor(worldX / CONFIG.TILE_SIZE);
        this.gridRow = Math.floor(worldY / CONFIG.TILE_SIZE);
        this.tier = 1;
        this.path = null; // null, 'A', 'B'
        this.totalCost = def.baseCost;

        // Stats (from current tier)
        this._applyTierStats();

        // Targeting
        this.targetMode = 'first'; // closest, strongest, weakest, first, last, fastest
        this.target = null;
        this.lastTargetId = null; // Target memory: prefer same target between frames
        this.fireTimer = 0;
        this.shotCount = 0;

        // Mastery
        this.kills = 0;
        this.masteryLevel = 0;

        // XP system
        this.xp = 0;
        this.xpLevel = 0;
        this.xpToNextLevel = CONFIG.MASTERY_XP_PER_SCORE;
        this.xpBonusDmg = 0;
        this.xpBonusRate = 0;
        this.xpBonusRange = 0;

        // Overclock
        this.overclocked = false;
        this.overclockTimer = 0;
        this.overclockCooldown = 0;
        this.disabled = false;
        this.disabledTimer = 0;
        this.damageDebuffTimer = 0;
        this.damageDebuffMult = 1;
        this.overclockStacks = 0; // Track multiple buff sources
        this.overclockVisualPulse = 0;

        // Linking
        this.links = [];
        this.linkMode = false;
        this.linkPreviewTargetId = null;

        // Beam tracking (for laser tower)
        this.beamTarget = null;
        this.beamTime = 0;
        this.beamRamp = 0;

        // Ability cooldowns
        this.abilityCooldown = 0;
        this.abilityReady = true;
        this.abilityCooldownMax = 0; // For progress tracking

        // Visual
        this.placedTime = GameState.time;
        this.angle = 0;
        this.animTimer = 0;

        // Synergy cache (recalculated periodically)
        this.activeSynergies = [];
        this.synergyUpdateTimer = 0;
        this.synergyBonuses = { dmg: 0, rate: 0, range: 0, splashBonus: 0, critBonus: 0, rampBonus: 0 };

        // Statistics tracking
        this.stats = {
            totalDamageDealt: 0,
            totalKills: 0,
            totalShotsFired: 0,
            totalCrits: 0,
            totalGoldEarned: 0,
            longestKillStreak: 0,
            currentKillStreak: 0,
            timeAlive: 0,
            overclockUses: 0,
            abilitiesUsed: 0,
        };

        // Move/relocate state
        this.isBeingMoved = false;
        this.movePreviewCol = -1;
        this.movePreviewRow = -1;

        // Sell confirmation state
        this.sellConfirmActive = false;
        this.sellConfirmTimer = 0;

        // Necro tower soul tracking
        this.souls = 0;
        this.specialTimers = {};
        this.quakeZones = [];
        this.deathPactTimer = 0;

        // ID
        this.id = Tower._nextId++;
    }

    _applyTierStats() {
        const def = TOWERS[this.type];
        let tierData;

        if (this.tier <= 2) {
            tierData = def.tiers[this.tier];
        } else if (this.path) {
            const pathDef = this.path === 'A' ? def.pathA : def.pathB;
            tierData = pathDef.tiers[this.tier];
        } else {
            tierData = def.tiers[2]; // Fallback
        }

        if (!tierData) return;

        this.damage = tierData.damage;
        this.range = tierData.range;
        this.fireRate = tierData.fireRate;
        this.splash = tierData.splash || 0;
        this.special = tierData.special || {};
    }

    // ===== XP SYSTEM =====
    addXP(amount) {
        if (!Number.isFinite(amount) || amount <= 0) return;

        const beforeContribution = this.getXPScoreContribution();
        const beforeMastery = this.getMasteryData();
        this.xp += amount;

        const afterContribution = this.getXPScoreContribution();
        this.xpLevel = afterContribution;
        this.xpToNextLevel = CONFIG.MASTERY_XP_PER_SCORE;
        this.xpBonusDmg = 0;
        this.xpBonusRate = 0;
        this.xpBonusRange = 0;

        const afterMastery = this.getMasteryData();
        if (afterMastery && (!beforeMastery || beforeMastery.title !== afterMastery.title)) {
            Effects.addFloatingText(this.x, this.y - 25, `${afterMastery.title.toUpperCase()}!`, afterMastery.color, 11);
            Effects.spawnExplosion(this.x, this.y, afterMastery.color, 7, { speed: 0.7, life: 0.35 });
        } else if (afterContribution > beforeContribution) {
            Effects.addFloatingText(this.x, this.y - 22, 'SYNC +1', '#80d0ff', 9);
        }
    }

    getXPProgress() {
        const current = this.xp % CONFIG.MASTERY_XP_PER_SCORE;
        return {
            level: this.xpLevel,
            current,
            needed: CONFIG.MASTERY_XP_PER_SCORE,
            percent: current / CONFIG.MASTERY_XP_PER_SCORE,
            scoreContribution: this.getXPScoreContribution(),
        };
    }

    getXPScoreContribution() {
        return Math.floor((this.xp || 0) / CONFIG.MASTERY_XP_PER_SCORE);
    }

    getProgressionScore() {
        return this.kills + this.getXPScoreContribution() + (GameState.researchBonuses.masteryBonus || 0);
    }

    getProgressionData() {
        const score = this.getProgressionScore();
        const mastery = this.getMasteryData();
        const nextMastery = CONFIG.MASTERY.find(m => m.kills > score) || null;
        const prevThreshold = mastery ? mastery.kills : 0;
        const nextThreshold = nextMastery ? nextMastery.kills : (CONFIG.MASTERY[CONFIG.MASTERY.length - 1].kills || score || 1);
        const normalizedCurrent = Math.max(0, score - prevThreshold);
        const normalizedNeeded = Math.max(1, nextThreshold - prevThreshold);

        return {
            score,
            kills: this.kills,
            xpContribution: this.getXPScoreContribution(),
            mastery,
            nextMastery,
            percent: Math.min(1, normalizedCurrent / normalizedNeeded),
            scoreToNext: nextMastery ? Math.max(0, nextThreshold - score) : 0,
            xpToNextScore: CONFIG.MASTERY_XP_PER_SCORE - (this.xp % CONFIG.MASTERY_XP_PER_SCORE || 0),
        };
    }

    // ===== SYNERGY DETECTION =====
    _detectSynergies() {
        this.activeSynergies = [];
        this.synergyBonuses = { dmg: 0, rate: 0, range: 0, splashBonus: 0, critBonus: 0, rampBonus: 0 };

        for (const key of Object.keys(TOWER_SYNERGIES)) {
            const synergy = TOWER_SYNERGIES[key];
            const [typeA, typeB] = synergy.types;

            // Check if this tower is one of the required types
            if (this.type !== typeA && this.type !== typeB) continue;

            // Find a matching adjacent tower of the other type
            const otherType = this.type === typeA ? typeB : typeA;

            for (const other of GameState.towers) {
                if (other === this) continue;
                if (other.type !== otherType) continue;
                if (dist(this, other) > synergy.range) continue;

                // Synergy found!
                this.activeSynergies.push({
                    name: synergy.name,
                    desc: synergy.desc,
                    partner: other,
                });

                // Accumulate bonuses
                this.synergyBonuses.dmg += synergy.bonuses.dmg || 0;
                this.synergyBonuses.rate += synergy.bonuses.rate || 0;
                this.synergyBonuses.range += synergy.bonuses.range || 0;
                this.synergyBonuses.splashBonus += synergy.bonuses.splashBonus || 0;
                this.synergyBonuses.critBonus += synergy.bonuses.critBonus || 0;
                this.synergyBonuses.rampBonus += synergy.bonuses.rampBonus || 0;

                break; // Only one instance per synergy type
            }
        }
    }

    getSynergyInfo() {
        return this.activeSynergies.map(s => ({
            name: s.name,
            desc: s.desc,
        }));
    }

    // ===== EFFECTIVE STATS =====
    getEffectiveDamage() {
        let dmg = this.damage;
        const rb = GameState.researchBonuses;

        // Research bonuses
        dmg *= (1 + (rb.dmgMult || 0));

        // Mastery bonus
        const mastery = this.getMasteryData();
        if (mastery) {
            let mult = mastery.dmgBonus;
            if (rb.masteryMult) mult *= (1 + rb.masteryMult);
            dmg *= (1 + mult);
        }

        // Formation bonus
        const formation = this.getFormationBonus();
        dmg *= (1 + formation.dmg);

        // Boost tower buffs
        const boost = this.getBoostBuff();
        dmg *= (1 + boost.dmg);

        // Synergy bonus
        dmg *= (1 + this.synergyBonuses.dmg);

        // Link network bonus
        const linkBonuses = this.getLinkBonuses();
        dmg *= (1 + linkBonuses.dmg);

        // Overclock
        if (this.overclocked) {
            let overclockMult = CONFIG.OVERCLOCK_BOOST;
            // Stacking with other buffs: additional overclock stacks give diminishing returns
            if (this.overclockStacks > 1) {
                overclockMult += (this.overclockStacks - 1) * 0.1;
            }
            dmg *= overclockMult;
        }

        // Supernova
        if (GameState.supernovaTimer > 0) {
            const src = GameState.supernovaSource;
            if (src && dist(this, src) <= src.range) {
                dmg *= 3;
            }
        }

        // Global dmg buff (from abilities)
        if (GameState.globalDmgBuff > 0) dmg *= (1 + GameState.globalDmgBuff);

        // Research: Last Stand (temporary global damage boost when at critical lives)
        if (GameState.lastStandTimer > 0) dmg *= 1.2;

        // Debuffs from enemy specialists (e.g. Toxic Carrier)
        dmg *= this.damageDebuffMult || 1;

        if (this.deathPactTimer > 0 && this.special && this.special.pactDmgMult) {
            dmg *= this.special.pactDmgMult;
        }

        // Necro tower: soul damage bonus
        if (this.type === 'necro' && this.special && this.special.soulDmgBonus && this.souls > 0) {
            dmg *= (1 + this.souls * this.special.soulDmgBonus);
        }

        // Challenge: glass_cannon — towers deal 2x damage
        if (GameState.activeChallenges.includes('glass_cannon')) dmg *= 2;

        return dmg;
    }

    getEffectiveRange() {
        let r = this.range;
        const rb = GameState.researchBonuses;
        r *= (1 + (rb.rangeMult || 0));

        const mastery = this.getMasteryData();
        if (mastery) {
            let mult = mastery.rangeBonus;
            if (rb.masteryMult) mult *= (1 + rb.masteryMult);
            r *= (1 + mult);
        }

        const boost = this.getBoostBuff();
        r *= (1 + boost.range);

        // Synergy bonus
        r *= (1 + this.synergyBonuses.range);

        const linkBonuses = this.getLinkBonuses();
        r *= (1 + linkBonuses.range);

        return r;
    }

    getEffectiveFireRate() {
        let rate = this.fireRate;
        if (rate === 0) return 0; // Continuous beam

        const rb = GameState.researchBonuses;
        rate *= (1 - Math.min(rb.rateMult || 0, 0.5));

        const mastery = this.getMasteryData();
        if (mastery) {
            let mult = mastery.rateBonus;
            if (rb.masteryMult) mult *= (1 + rb.masteryMult);
            rate *= (1 - Math.min(mult, 0.5));
        }

        const formation = this.getFormationBonus();
        rate *= (1 - Math.min(formation.rate, 0.3));

        const boost = this.getBoostBuff();
        rate *= (1 - Math.min(boost.rate, 0.3));

        // Synergy bonus
        rate *= (1 - Math.min(this.synergyBonuses.rate, 0.3));

        const linkBonuses = this.getLinkBonuses();
        rate *= (1 - Math.min(linkBonuses.rate, 0.3));

        if (this.overclocked) rate /= CONFIG.OVERCLOCK_BOOST;

        return Math.max(rate, 0.1);
    }

    // Get effective splash radius (accounting for synergies)
    getEffectiveSplash() {
        let splash = this.splash || 0;
        if (this.synergyBonuses.splashBonus > 0) {
            splash *= (1 + this.synergyBonuses.splashBonus);
        }
        return splash;
    }

    getMasteryData() {
        const kills = this.getProgressionScore();
        let best = null;
        for (const m of CONFIG.MASTERY) {
            if (kills >= m.kills) best = m;
        }
        return best;
    }

    getComboBonus() {
        return this.getFormationBonus();
    }

    getFormationClusterTowers() {
        const visited = new Set();
        const queue = [this];
        const cluster = [];
        const range = CONFIG.FORMATION_RANGE || 125;

        while (queue.length > 0) {
            const current = queue.shift();
            if (!current || visited.has(current.id)) continue;
            visited.add(current.id);
            cluster.push(current);

            for (const other of GameState.towers) {
                if (other.type !== this.type) continue;
                if (visited.has(other.id)) continue;
                if (dist(current, other) <= range) {
                    queue.push(other);
                }
            }
        }

        return cluster;
    }

    getFormationBonus() {
        const clusterSize = this.getFormationClusterTowers().length;
        let best = { dmg: 0, rate: 0, count: clusterSize };
        for (const cb of CONFIG.COMBO_BONUSES) {
            if (clusterSize >= cb.count) best = { ...cb, count: clusterSize };
        }
        const synMult = 1 + (GameState.researchBonuses.synergyMult || 0);
        return { dmg: best.dmg * synMult, rate: best.rate * synMult, count: clusterSize };
    }

    getLinkedTowers() {
        const linked = [];
        const seen = new Set();
        for (const linkId of this.links) {
            if (seen.has(linkId)) continue;
            seen.add(linkId);
            const other = GameState.towers.find(tower => tower.id === linkId);
            if (!other || other === this) continue;
            if (dist(this, other) > (CONFIG.LINK_RANGE || 190)) continue;
            if (!other.links.includes(this.id)) continue;
            linked.push(other);
        }
        return linked;
    }

    hasLinkTo(other) {
        return !!other && this.links.includes(other.id) && other.links.includes(this.id);
    }

    clearBrokenLinks() {
        const validIds = new Set(this.getLinkedTowers().map(t => t.id));
        for (const linkId of [...this.links]) {
            if (validIds.has(linkId)) continue;
            const other = GameState.towers.find(tower => tower.id === linkId);
            if (other) {
                other.links = other.links.filter(id => id !== this.id);
            }
        }
        this.links = [...validIds].slice(0, CONFIG.MAX_LINKS_PER_TOWER || 2);
    }

    canLinkTo(other) {
        if (!other || other === this) return false;
        if (dist(this, other) > (CONFIG.LINK_RANGE || 190)) return false;
        if (this.hasLinkTo(other)) return true;
        if (this.links.length >= (CONFIG.MAX_LINKS_PER_TOWER || 2)) return false;
        if (other.links.length >= (CONFIG.MAX_LINKS_PER_TOWER || 2)) return false;
        return true;
    }

    addLink(other) {
        if (!this.canLinkTo(other) || this.hasLinkTo(other)) return false;
        this.links.push(other.id);
        other.links.push(this.id);
        this.links = [...new Set(this.links)];
        other.links = [...new Set(other.links)];
        return true;
    }

    removeLink(other) {
        if (!other) return false;
        const hadLink = this.links.includes(other.id) || other.links.includes(this.id);
        this.links = this.links.filter(id => id !== other.id);
        other.links = other.links.filter(id => id !== this.id);
        return hadLink;
    }

    clearAllLinks() {
        for (const other of this.getLinkedTowers()) {
            other.links = other.links.filter(id => id !== this.id);
        }
        this.links = [];
    }

    beginLinkMode() {
        this.cancelSellConfirmation();
        this.cancelMove();
        this.linkMode = true;
        this.linkPreviewTargetId = null;
    }

    cancelLinkMode() {
        this.linkMode = false;
        this.linkPreviewTargetId = null;
    }

    getLinkBonuses() {
        const linked = this.getLinkedTowers();
        const bonuses = { dmg: 0, rate: 0, range: 0, crit: 0, count: linked.length, linkedNames: linked.map(t => TOWERS[t.type]?.nickname || TOWERS[t.type]?.name || t.type) };
        const linkedTypes = new Set();

        for (const other of linked) {
            linkedTypes.add(other.type);
            bonuses.dmg += CONFIG.LINK_DAMAGE_BONUS || 0;
            if (other.type === this.type) {
                bonuses.rate += CONFIG.LINK_SAME_TYPE_RATE_BONUS || 0;
            } else {
                bonuses.range += CONFIG.LINK_CROSS_TYPE_RANGE_BONUS || 0;
            }
        }

        if (linked.length >= 2 && linkedTypes.size >= 2) {
            bonuses.crit += CONFIG.LINK_DIVERSITY_CRIT_BONUS || 0;
        }

        return bonuses;
    }

    getBoostBuff() {
        let dmg = 0, rate = 0, range = 0, crit = 0;
        for (const t of GameState.towers) {
            if (t.type === 'boost' && t !== this && t.special.aura) {
                // Use base range (t.range) to avoid infinite recursion:
                // getBoostBuff -> getEffectiveRange -> getBoostBuff -> ...
                if (dist(this, t) <= t.range) {
                    dmg += t.special.dmgBuff || 0;
                    rate += t.special.rateBuff || 0;
                    range += t.special.rangeBuff || 0;
                    crit += t.special.critBuff || 0;
                }
            }
        }
        return { dmg, rate, range, crit };
    }

    // ===== UPDATE =====
    update(dt) {
        this.animTimer += dt;
        this.stats.timeAlive += dt;
        if (this.deathPactTimer > 0) this.deathPactTimer = Math.max(0, this.deathPactTimer - dt);

        // Update synergies periodically (every 2 seconds)
        this.synergyUpdateTimer -= dt;
        if (this.synergyUpdateTimer <= 0) {
            this.synergyUpdateTimer = 2.0;
            this.clearBrokenLinks();
            this._detectSynergies();
        }

        // Sell confirmation timeout
        if (this.sellConfirmActive) {
            this.sellConfirmTimer -= dt;
            if (this.sellConfirmTimer <= 0) {
                this.sellConfirmActive = false;
            }
        }

        // Overclock visual pulse
        if (this.overclocked) {
            this.overclockVisualPulse += dt * 4;
        } else {
            this.overclockVisualPulse = 0;
        }

        // Overclock
        if (this.overclocked) {
            this.overclockTimer -= dt;
            if (this.overclockTimer <= 0) {
                this.overclocked = false;
                this.overclockStacks = 0;
                let cooldown = CONFIG.OVERCLOCK_COOLDOWN;
                cooldown -= (GameState.researchBonuses.overclockRecovery || 0);
                this.disabled = true;
                this.disabledTimer = Math.max(cooldown, 1);
            }
        }
        if (this.disabled) {
            this.disabledTimer -= dt;
            if (this.disabledTimer <= 0) {
                this.disabled = false;
            }
            return;
        }

        if (this.damageDebuffTimer > 0) {
            this.damageDebuffTimer -= dt;
            if (this.damageDebuffTimer <= 0) {
                this.damageDebuffTimer = 0;
                this.damageDebuffMult = 1;
            }
        }

        // Ability cooldown
        if (this.abilityCooldown > 0) {
            this.abilityCooldown -= dt;
            if (this.abilityCooldown <= 0) this.abilityReady = true;
        }

        // Tower special abilities (Tier 5) — continuous effects and auto-triggers
        this._updateAbilities(dt);

        // Continuous Tier 5 aura/field effects (always active, no cooldown)
        this._updatePassiveEffects(dt);

        // Boost tower doesn't attack
        if (this.type === 'boost') return;

        // Laser tower — continuous beam
        if (this.special.beam) {
            this._updateBeam(dt);
            return;
        }

        // Normal tower — find target and fire
        this.fireTimer -= dt;
        if (this.fireTimer <= 0) {
            const target = this.findTarget();
            if (target) {
                this.target = target;
                this.lastTargetId = target.id || null;
                this.angle = angleBetween(this, target);
                this.fire(target);
                this.fireTimer = this.getEffectiveFireRate();
            }
        }
    }

    // ===== TIER 5 AUTO-TRIGGER ABILITIES =====
    _updateAbilities(dt) {
        if (this.tier < 5 || !this.special) return;
        const s = this.special;
        const enemies = GameState.enemies;
        const range = this.getEffectiveRange();

        for (const key of Object.keys(this.specialTimers)) {
            if (key === 'soulBolt') continue;
            this.specialTimers[key] = Math.max(0, this.specialTimers[key] - dt);
        }

        // --- Arrow Volley: "Volley Storm" — rain 20 arrows in an area ---
        if (s.volleyStorm && this.abilityReady) {
            const targets = enemies.filter(e => e.alive && dist(this, e) <= range);
            if (targets.length >= 3) {
                this.useAbility();
                const center = targets[0];
                for (let i = 0; i < (s.volleyArrows || 20); i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const r = Math.random() * 60;
                    const tx = center.x + Math.cos(angle) * r;
                    const ty = center.y + Math.sin(angle) * r;
                    setTimeout(() => {
                        const dmg = this.getEffectiveDamage() * 0.6;
                        for (const e of GameState.enemies) {
                            if (e.alive && Math.hypot(e.x - tx, e.y - ty) < 20) {
                                e.takeDamage(dmg, this);
                            }
                        }
                        Effects.spawnExplosion(tx, ty, '#3ab06a', 4, { speed: 0.5, life: 0.2 });
                    }, i * ((s.volleyDuration || 2) * 1000 / (s.volleyArrows || 20)));
                }
                Effects.addFloatingText(this.x, this.y - 30, 'VOLLEY STORM!', '#3ab06a', 14);
                Audio.play('arrow');
            }
        }

        // --- Cannon Siege: "Devastation" — massive crater explosion every Nth shot ---
        if (s.devastation && this.abilityReady) {
            const targets = enemies.filter(e => e.alive && dist(this, e) <= range);
            if (targets.length >= 2) {
                this.useAbility();
                const center = targets.reduce((best, e) => {
                    const nearby = enemies.filter(o => o.alive && Math.hypot(o.x - e.x, o.y - e.y) < (this.splash || 80)).length;
                    return nearby > best.count ? { e, count: nearby } : best;
                }, { e: targets[0], count: 0 }).e;
                const devDmg = this.getEffectiveDamage() + (s.devBonusDmg || 300);
                const devRadius = (this.splash || 80) * 1.5;
                for (const e of enemies) {
                    if (e.alive && Math.hypot(e.x - center.x, e.y - center.y) < devRadius) {
                        e.takeDamage(devDmg, this);
                        if (s.devStun) e.stunTimer = (e.stunTimer || 0) + s.devStun;
                    }
                }
                Effects.spawnExplosion(center.x, center.y, '#ff6020', 30, { speed: 2, life: 0.8, glow: true });
                addScreenShake(12);
                Effects.addFloatingText(center.x, center.y - 30, 'DEVASTATION!', '#ff6020', 16);
                Audio.play('cannon');
            }
        }

        // --- Cannon Cluster: "Barrage" — 15 rapid projectiles ---
        if (s.barrage && this.type === 'cannon' && this.abilityReady) {
            const targets = enemies.filter(e => e.alive && dist(this, e) <= range);
            if (targets.length >= 2) {
                this.useAbility();
                const count = s.barrageCount || 15;
                const interval = ((s.barrageDuration || 3) * 1000) / count;
                for (let i = 0; i < count; i++) {
                    setTimeout(() => {
                        const alive = GameState.enemies.filter(e => e.alive && dist(this, e) <= range);
                        if (alive.length > 0) {
                            const t = alive[Math.floor(Math.random() * alive.length)];
                            this._createProjectile(t, this.getEffectiveDamage() * 0.5, false, 1, false);
                        }
                    }, i * interval);
                }
                Effects.addFloatingText(this.x, this.y - 30, 'BARRAGE!', '#ff9040', 14);
                Audio.play('cannon');
            }
        }

        // --- Ice Deep Freeze: "Absolute Zero" — freeze all enemies in range ---
        if (s.absoluteZero && this.abilityReady) {
            const targets = enemies.filter(e => e.alive && dist(this, e) <= range);
            if (targets.length >= 4) {
                this.useAbility();
                const freezeDuration = s.azDuration || 3;
                const canFreezeBoss = !!s.canFreezeBoss;
                for (const e of targets) {
                    e.applyFreeze(freezeDuration, { ignoreBossImmunity: canFreezeBoss });
                    if (s.freezeVulnerable) {
                        e.applyVulnerability(1 + s.freezeVulnerable, freezeDuration);
                    }
                }
                Effects.spawnExplosion(this.x, this.y, '#80e0ff', 25, { speed: 1.5, life: 0.6 });
                Effects.addFloatingText(this.x, this.y - 30, 'ABSOLUTE ZERO!', '#80e0ff', 16);
                addScreenShake(6);
                Audio.play('ice');
            }
        }

        // --- Ice Frostbite: "Glacial Lance" — line-piercing ice spear ---
        if (s.glacialLance && this.abilityReady) {
            const targets = enemies.filter(e => e.alive && dist(this, e) <= range);
            if (targets.length >= 1) {
                this.useAbility();
                const target = targets[0];
                const angle = Math.atan2(target.y - this.y, target.x - this.x);
                const lanceDmg = s.lanceDmg || 200;
                const lanceRange = range * 1.5;
                // Damage all enemies along the lance line
                for (const e of enemies) {
                    if (!e.alive) continue;
                    const dx = e.x - this.x, dy = e.y - this.y;
                    const proj = dx * Math.cos(angle) + dy * Math.sin(angle);
                    if (proj < 0 || proj > lanceRange) continue;
                    const perp = Math.abs(-dx * Math.sin(angle) + dy * Math.cos(angle));
                    if (perp < 25) {
                        e.takeDamage(lanceDmg, this);
                        e.applyFreeze(2, { ignoreBossImmunity: !!s.canFreezeBoss });
                    }
                }
                const endX = this.x + Math.cos(angle) * lanceRange;
                const endY = this.y + Math.sin(angle) * lanceRange;
                Effects.spawnBeam(this.x, this.y, endX, endY, '#80e0ff', 6, 0.4);
                Effects.addFloatingText(this.x, this.y - 30, 'GLACIAL LANCE!', '#60d0e0', 14);
                Audio.play('ice');
            }
        }

        // --- Lightning Chain Master: "Overload" — hit ALL enemies in extended range ---
        if (s.overload && this.abilityReady) {
            const overloadRange = s.overloadRange || 200;
            const targets = enemies.filter(e => e.alive && dist(this, e) <= overloadRange);
            if (targets.length >= 5) {
                this.useAbility();
                const dmg = this.getEffectiveDamage() * 1.5;
                for (const e of targets) {
                    e.takeDamage(dmg, this);
                    Effects.spawnBeam(this.x, this.y, e.x, e.y, '#e0e040', 3, 0.15);
                }
                Effects.spawnExplosion(this.x, this.y, '#e0e040', 20, { speed: 2, life: 0.5 });
                addScreenShake(8);
                Effects.addFloatingText(this.x, this.y - 30, 'OVERLOAD!', '#e0e040', 16);
                Audio.play('lightning');
            }
        }

        // --- Lightning Storm Caller: "Thunderstorm" — periodic area strikes ---
        if (s.thunderstorm && this.abilityReady) {
            const targets = enemies.filter(e => e.alive && dist(this, e) <= (s.stormRadius || 100));
            if (targets.length >= 3) {
                this.useAbility();
                const stormDuration = (s.stormDuration || 5) * 1000;
                const stormInterval = (s.stormInterval || 0.3) * 1000;
                const stormDmg = s.stormDmg || 30;
                const stormRadius = s.stormRadius || 100;
                let elapsed = 0;
                const stormTick = setInterval(() => {
                    elapsed += stormInterval;
                    if (elapsed >= stormDuration) { clearInterval(stormTick); return; }
                    const alive = GameState.enemies.filter(e => e.alive && dist(this, e) <= stormRadius);
                    if (alive.length > 0) {
                        const t = alive[Math.floor(Math.random() * alive.length)];
                        t.takeDamage(stormDmg, this);
                        Effects.spawnBeam(t.x, t.y - 80, t.x, t.y, '#e0e040', 2, 0.08);
                        Effects.spawnExplosion(t.x, t.y, '#e0e040', 5, { speed: 0.8, life: 0.2 });
                    }
                }, stormInterval);
                Effects.addFloatingText(this.x, this.y - 30, 'THUNDERSTORM!', '#e0e040', 14);
                Audio.play('lightning');
            }
        }

        // --- Sniper Assassin: "Marked for Death" — massive single-target hit ---
        if (s.markedForDeath && this.abilityReady) {
            const targets = enemies.filter(e => e.alive && dist(this, e) <= range);
            const boss = targets.find(e => e.isBoss) || targets.find(e => e.isElite) || (targets.length > 0 ? targets.reduce((a, b) => a.hp > b.hp ? a : b) : null);
            if (boss) {
                this.useAbility();
                const markDmg = s.markDmg || 1000;
                boss.takeDamage(markDmg, this);
                Effects.spawnBeam(this.x, this.y, boss.x, boss.y, '#ff60a0', 4, 0.3);
                Effects.spawnExplosion(boss.x, boss.y, '#ff60a0', 15, { speed: 1.5, life: 0.5 });
                Effects.addFloatingText(boss.x, boss.y - 25, `MARKED! -${markDmg}`, '#ff60a0', 16);
                addScreenShake(5);
                Audio.play('sniper');
            }
        }

        // --- Sniper Spotter: "Designate All" — mark every enemy on screen ---
        if (s.designate && this.abilityReady) {
            if (enemies.filter(e => e.alive).length >= 5) {
                this.useAbility();
                const desDuration = s.desDuration || 3;
                const markVuln = s.areaMarkVuln || s.markVuln || 0.3;
                for (const e of enemies) {
                    if (!e.alive) continue;
                    e.marked = true;
                    e.markVuln = markVuln;
                    e.markTimer = desDuration;
                    Effects.spawnExplosion(e.x, e.y, '#ff60a0', 3, { speed: 0.5, life: 0.2 });
                }
                Effects.addFloatingText(this.x, this.y - 30, 'DESIGNATE ALL!', '#ff60a0', 14);
                Audio.play('sniper');
            }
        }

        // --- Laser Focused: "Death Ray" — 300 DPS beam for 5 seconds ---
        if (s.deathRay && this.abilityReady) {
            const targets = enemies.filter(e => e.alive && dist(this, e) <= range);
            const boss = targets.find(e => e.isBoss) || (targets.length > 0 ? targets.reduce((a, b) => a.hp > b.hp ? a : b) : null);
            if (boss) {
                this.useAbility();
                const drayDPS = s.drayDPS || 300;
                const drayDuration = (s.drayDuration || 5) * 1000;
                const tickInterval = 50; // 20 ticks/sec
                let elapsed = 0;
                const rayTarget = boss;
                const rayTick = setInterval(() => {
                    elapsed += tickInterval;
                    if (elapsed >= drayDuration || !rayTarget.alive) { clearInterval(rayTick); return; }
                    const tickDmg = drayDPS * (tickInterval / 1000);
                    rayTarget.takeDamage(tickDmg, this);
                    this.stats.totalDamageDealt += tickDmg;
                    const phase = clamp(elapsed / drayDuration, 0, 1);
                    const pulse = 0.5 + 0.5 * Math.sin(elapsed / 80);
                    const intensity = clamp(0.45 + phase * 0.35 + pulse * 0.2, 0, 1);
                    const widthScale = 0.92 + Math.sin(elapsed / 90) * 0.12;
                    this._spawnLaserBeam(rayTarget.x, rayTarget.y, 'deathRay', 0.06, widthScale, intensity);
                }, tickInterval);
                Effects.addFloatingText(this.x, this.y - 30, 'DEATH RAY!', '#ffffff', 16);
                addScreenShake(4);
                Audio.play('laser');
            }
        }

        // --- Laser Prism: "Solar Flare" — blind + damage all enemies in radius ---
        if (s.solarFlare && this.abilityReady) {
            const flareRadius = s.flareRadius || 100;
            const targets = enemies.filter(e => e.alive && dist(this, e) <= flareRadius);
            if (targets.length >= 3) {
                this.useAbility();
                const flareDmg = s.flareDmg || 200;
                for (const e of targets) {
                    e.takeDamage(flareDmg, this);
                    e.applyBlind(s.blindDuration || 3, 0.3);
                }
                Effects.spawnExplosion(this.x, this.y, '#ffffff', 30, { speed: 3, life: 0.8, glow: true });
                GameState.screenFlash = { color: '#ffffff', alpha: 0.4, timer: 0.3 };
                addScreenShake(10);
                Effects.addFloatingText(this.x, this.y - 30, 'SOLAR FLARE!', '#ffd700', 16);
                Audio.play('laser');
            }
        }

        // --- Missile Warhead: "Tactical Nuke" — massive single explosion ---
        if (s.tacticalNuke && this.abilityReady) {
            const targets = enemies.filter(e => e.alive && dist(this, e) <= range);
            if (targets.length >= 3) {
                this.useAbility();
                const center = targets.reduce((best, e) => {
                    const nearby = enemies.filter(o => o.alive && Math.hypot(o.x - e.x, o.y - e.y) < (s.nukeRadius || 120)).length;
                    return nearby > best.count ? { e, count: nearby } : best;
                }, { e: targets[0], count: 0 }).e;
                const nukeDmg = s.nukeDmg || 800;
                const nukeRadius = s.nukeRadius || 120;
                for (const e of enemies) {
                    if (e.alive && Math.hypot(e.x - center.x, e.y - center.y) < nukeRadius) {
                        e.takeDamage(nukeDmg, this);
                        if (s.nukeStun) e.stunTimer = (e.stunTimer || 0) + s.nukeStun;
                    }
                }
                Effects.spawnExplosion(center.x, center.y, '#ff4040', 40, { speed: 3, life: 1.0, glow: true });
                Effects.spawnExplosion(center.x, center.y, '#ffa040', 25, { speed: 2, life: 0.8 });
                GameState.screenFlash = { color: '#ff4040', alpha: 0.3, timer: 0.5 };
                addScreenShake(15);
                Effects.addFloatingText(center.x, center.y - 40, 'TACTICAL NUKE!', '#ff4040', 18);
                Audio.play('missile');
            }
        }

        // --- Missile Cluster: "Rocket Barrage" — 20 missiles everywhere ---
        if (s.rocketBarrage && this.abilityReady) {
            const targets = enemies.filter(e => e.alive && dist(this, e) <= range);
            if (targets.length >= 3) {
                this.useAbility();
                const count = s.barrageCount || 20;
                const interval = ((s.barrageDuration || 3) * 1000) / count;
                for (let i = 0; i < count; i++) {
                    setTimeout(() => {
                        const alive = GameState.enemies.filter(e => e.alive);
                        if (alive.length > 0) {
                            const t = alive[Math.floor(Math.random() * alive.length)];
                            this._createProjectile(t, this.getEffectiveDamage() * 0.8, false, 1, false);
                        }
                    }, i * interval);
                }
                Effects.addFloatingText(this.x, this.y - 30, 'ROCKET BARRAGE!', '#8a8a9a', 14);
                Audio.play('missile');
            }
        }

        // --- Boost Amplifier: "Supernova" — x3 damage buff to all nearby towers ---
        if (s.supernova && this.abilityReady) {
            const nearbyTowers = GameState.towers.filter(t => t !== this && t.type !== 'boost' && dist(this, t) <= range);
            if (nearbyTowers.length >= 2 && GameState.enemies.some(e => e.alive)) {
                this.useAbility();
                GameState.supernovaTimer = s.snovaDuration || 3;
                GameState.supernovaSource = this;
                Effects.spawnExplosion(this.x, this.y, '#ffd700', 30, { speed: 2.5, life: 1.0, glow: true });
                GameState.screenFlash = { color: '#ffd700', alpha: 0.25, timer: 0.3 };
                addScreenShake(6);
                Effects.addFloatingText(this.x, this.y - 30, `SUPERNOVA x${s.snovaMult || 3}!`, '#ffd700', 16);
                Audio.play('powerup');
            }
        }

        if (s.immolate && (this.specialTimers.immolate || 0) <= 0) {
            const immolateRadius = s.immolateRadius || 60;
            const victims = enemies.filter(e => e.alive && dist(this, e) <= immolateRadius);
            if (victims.length >= 2) {
                this.specialTimers.immolate = Math.max(0.1, s.immolateCd || 10);
                const dmg = s.immolateDmg || 500;
                for (const e of victims) {
                    e.takeDamage(dmg, this);
                    e.applyBurn((s.burnDPS || 20) * 0.6, Math.max(1.5, (s.burnDuration || 3) * 0.8), { meltArmor: s.meltArmor || 0 });
                }
                Effects.spawnExplosion(this.x, this.y, '#ff5a20', 20, { speed: 1.6, life: 0.5, glow: true });
                Effects.addFloatingText(this.x, this.y - 24, 'IMMOLATE!', '#ff7040', 14);
            }
        }

        if (s.firestorm && (this.specialTimers.firestorm || 0) <= 0) {
            const stormRadius = s.stormRadius || 120;
            const stormTargets = enemies.filter(e => e.alive && dist(this, e) <= stormRadius);
            if (stormTargets.length >= 3) {
                this.specialTimers.firestorm = Math.max(0.1, s.stormCd || 12);
                const stormDuration = s.stormDuration || 4;
                const tickInterval = 0.4;
                const ticks = Math.max(1, Math.floor(stormDuration / tickInterval));
                for (let i = 0; i < ticks; i++) {
                    setTimeout(() => {
                        const alive = GameState.enemies.filter(e => e.alive && dist(this, e) <= stormRadius);
                        for (const e of alive) {
                            e.takeDamage((s.stormDPS || 15) * tickInterval, this);
                            e.applyBurn(s.burnDPS || 20, 1.6, { meltArmor: s.meltArmor || 0 });
                        }
                        Effects.spawnExplosion(this.x + rand(-20, 20), this.y + rand(-20, 20), '#ff8040', 6, { speed: 0.8, life: 0.25 });
                    }, Math.floor(i * tickInterval * 1000));
                }
                Effects.addFloatingText(this.x, this.y - 24, 'FIRESTORM!', '#ff9a40', 14);
            }
        }

        if (s.pandemic && (this.specialTimers.pandemic || 0) <= 0) {
            const alive = enemies.filter(e => e.alive);
            if (alive.length >= 5) {
                this.specialTimers.pandemic = Math.max(0.1, s.pandemicCd || 15);
                for (const e of alive) {
                    e.applyPoison(s.poisonDPS || 25, s.pandemicDuration || 5, {
                        maxStacks: s.poisonStacks || e.maxPoisonStacks,
                        spreadCount: s.plagueSpread || 0,
                        spreadRadius: s.spreadRadius || 0,
                        deathCloud: !!s.deathCloud,
                        cloudDuration: s.cloudDuration || 0,
                        cloudRadius: s.cloudRadius || 0,
                        sourceTower: this,
                    });
                }
                Effects.addFloatingText(this.x, this.y - 24, 'PANDEMIC!', '#7ad060', 14);
                Effects.spawnExplosion(this.x, this.y, '#6cb850', 14, { speed: 1.1, life: 0.4 });
            }
        }

        if (s.dissolve && (this.specialTimers.dissolve || 0) <= 0) {
            const radius = s.dissolveRadius || 80;
            const targets = enemies.filter(e => e.alive && dist(this, e) <= radius);
            if (targets.length >= 2) {
                this.specialTimers.dissolve = Math.max(0.1, s.dissolveCd || 12);
                const armorRemoveRatio = Math.max(0, Math.min(1, s.dissolveArmorRemove || 1));
                for (const e of targets) {
                    const remove = e.armor * armorRemoveRatio;
                    e.armor = Math.max(0, e.armor - remove);
                    e.baseArmor = Math.max(0, e.baseArmor - remove);
                    e.applyVulnerability(1 + (s.weakenVuln || 0.2), 3);
                }
                Effects.addFloatingText(this.x, this.y - 24, 'DISSOLVE!', '#9cd95a', 14);
            }
        }

        if (s.tectonic && (this.specialTimers.tectonic || 0) <= 0) {
            const radius = s.tectonicRadius || 180;
            const targets = enemies.filter(e => e.alive && dist(this, e) <= radius);
            if (targets.length >= 2) {
                this.specialTimers.tectonic = Math.max(0.1, s.tectonicCd || 14);
                const dmg = s.tectonicDmg || 600;
                const stun = s.tectonicStun || 2;
                for (const e of targets) {
                    e.takeDamage(dmg, this);
                    e.applyStun(stun);
                }
                Effects.spawnExplosion(this.x, this.y, '#a08a70', 24, { speed: 1.5, life: 0.55 });
                Effects.addFloatingText(this.x, this.y - 24, 'TECTONIC SLAM!', '#c8b090', 14);
                addScreenShake(6);
            }
        }

        if (s.clusterBomb && (this.specialTimers.clusterBomb || 0) <= 0) {
            const alive = enemies.filter(e => e.alive && dist(this, e) <= range);
            if (alive.length >= 2) {
                this.specialTimers.clusterBomb = Math.max(0.1, s.clusterCd || 10);
                const count = s.clusterCount || 5;
                for (let i = 0; i < count; i++) {
                    setTimeout(() => {
                        const current = GameState.enemies.filter(e => e.alive && dist(this, e) <= range);
                        if (current.length === 0) return;
                        const t = current[Math.floor(Math.random() * current.length)];
                        const radius = s.clusterRadius || 70;
                        for (const e of GameState.enemies) {
                            if (e.alive && Math.hypot(e.x - t.x, e.y - t.y) <= radius) {
                                e.takeDamage(s.clusterDmg || 80, this);
                            }
                        }
                        Effects.spawnExplosion(t.x, t.y, '#caa070', 10, { speed: 1.0, life: 0.35 });
                    }, i * 180);
                }
                Effects.addFloatingText(this.x, this.y - 24, 'CLUSTER BOMB!', '#d4b090', 14);
            }
        }

        if (s.reaper && (this.specialTimers.reaper || 0) <= 0) {
            const targets = enemies.filter(e => e.alive && dist(this, e) <= range);
            if (targets.length >= 2) {
                this.specialTimers.reaper = Math.max(0.1, s.reaperCd || 12);
                const hpRatio = Math.max(0.05, Math.min(0.9, s.reaperDmg || 0.25));
                for (const e of targets) {
                    e.takeDamage(e.maxHp * hpRatio, this);
                }
                Effects.addFloatingText(this.x, this.y - 24, 'REAP!', '#c080ff', 14);
                Effects.spawnExplosion(this.x, this.y, '#a060ff', 14, { speed: 1.1, life: 0.45 });
            }
        }

        if (s.deathPact && (this.specialTimers.deathPact || 0) <= 0) {
            const alive = enemies.some(e => e.alive && dist(this, e) <= range * 1.2);
            if (alive) {
                this.specialTimers.deathPact = Math.max(0.1, s.pactCd || 18);
                this.deathPactTimer = Math.max(this.deathPactTimer || 0, s.pactDuration || 5);
                Effects.addFloatingText(this.x, this.y - 24, 'DEATH PACT!', '#ff80d0', 14);
                Effects.spawnExplosion(this.x, this.y, '#a060ff', 10, { speed: 0.9, life: 0.35 });
            }
        }

        if (s.blackMarket && (this.specialTimers.blackMarket || 0) <= 0) {
            const alive = enemies.filter(e => e.alive);
            if (alive.length > 0) {
                this.specialTimers.blackMarket = Math.max(0.1, s.bmCd || 30);
                const payout = Math.max(10, Math.floor((s.supplyGold || 20) * 1.5));
                GameState.gold += payout;
                Effects.addFloatingText(this.x, this.y - 24, `BLACK MARKET +${payout}g`, '#ffd070', 12);
                for (let i = 0; i < Math.min(3, alive.length); i++) {
                    const target = alive[i];
                    target.applyVulnerability(1.15, 2.5);
                }
            }
        }

        // --- Boost Armory: "Supply Drop" — free gold every wave ---
        if (s.supplyDrop && !this._supplyDropThisWave && GameState.gamePhase === 'playing') {
            this._supplyDropThisWave = GameState.wave;
            const gold = s.supplyGold || 25;
            GameState.gold += gold;
            Effects.addFloatingText(this.x, this.y - 20, `Supply: +${gold}g`, '#ffd700', 12);
            Effects.spawnGoldCoin(this.x, this.y);
        }
        // Reset supply drop flag for next wave
        if (this._supplyDropThisWave && this._supplyDropThisWave !== GameState.wave) {
            this._supplyDropThisWave = 0;
        }
    }

    // ===== PASSIVE TIER 5 EFFECTS (always active, no cooldown) =====
    _updatePassiveEffects(dt) {
        if (this.tier < 3 || !this.special) return;
        const s = this.special;

        // Energy Field (Laser Prism T5) — slow enemies in beam range
        if (s.energyField && s.fieldSlow) {
            const range = this.getEffectiveRange();
            const slowAmount = Math.max(0, Math.min(s.fieldSlow, 0.8));
            const auraDuration = Math.max(0.2, dt * 2);
            for (const e of GameState.enemies) {
                if (e.alive && dist(this, e) <= range) {
                    e.applySlow(slowAmount, auraDuration);
                }
            }
        }

        // Supernova timer decay
        if (GameState.supernovaTimer > 0 && GameState.supernovaSource === this) {
            GameState.supernovaTimer -= dt;
            if (GameState.supernovaTimer <= 0) {
                GameState.supernovaSource = null;
            }
        }

        if (s.witherAura) {
            const radius = s.witherRadius || this.getEffectiveRange();
            const dps = s.witherDPS || 8;
            for (const e of GameState.enemies) {
                if (!e.alive || dist(this, e) > radius) continue;
                e.takeDamage(dps * dt, this);
                if (s.witherSlow) {
                    e.applySlow(Math.max(0, Math.min(0.8, s.witherSlow)), Math.max(0.2, dt * 2));
                }
            }
        }

        if (s.soulBolt) {
            this.specialTimers.soulBolt = Math.max(0, (this.specialTimers.soulBolt || 0) - dt);
            if ((this.specialTimers.soulBolt || 0) <= 0) {
                const range = this.getEffectiveRange();
                const target = GameState.enemies.find(e => e.alive && dist(this, e) <= range);
                if (target) {
                    this.specialTimers.soulBolt = Math.max(0.15, s.soulBoltInterval || 2);
                    target.takeDamage(s.soulBoltDmg || 30, this);
                    Effects.spawnBeam(this.x, this.y, target.x, target.y, '#a060ff', 2.5, 0.1);
                    if (s.soulExplosion && s.soulExpRadius) {
                        for (const e of GameState.enemies) {
                            if (e !== target && e.alive && dist(target, e) <= s.soulExpRadius) {
                                e.takeDamage((s.soulBoltDmg || 30) * 0.5, this);
                            }
                        }
                        Effects.spawnExplosion(target.x, target.y, '#b080ff', 8, { speed: 0.9, life: 0.3 });
                    }
                }
            }
        }

        if (this.quakeZones.length > 0) {
            for (let i = this.quakeZones.length - 1; i >= 0; i--) {
                const zone = this.quakeZones[i];
                zone.remaining -= dt;
                if (zone.remaining <= 0) {
                    this.quakeZones.splice(i, 1);
                    continue;
                }
                for (const e of GameState.enemies) {
                    if (!e.alive || Math.hypot(e.x - zone.x, e.y - zone.y) > zone.radius) continue;
                    if (zone.slow > 0) {
                        e.applySlow(zone.slow, Math.max(0.2, dt * 2));
                    }
                    if (zone.dps > 0) {
                        e.takeDamage(zone.dps * dt, this);
                    }
                }
            }
        }
    }

    _addQuakeZone(x, y, special) {
        if (!special || !special.quakeZone) return;
        this.quakeZones.push({
            x,
            y,
            radius: special.zoneRadius || 80,
            remaining: special.zoneDuration || 3,
            slow: special.zoneSlow || 0,
            dps: special.zoneDPS || 0,
        });
        if (this.quakeZones.length > 10) {
            this.quakeZones.shift();
        }
    }

    _getLaserBeamProfile(variant = 'main', intensity = null) {
        const defs = (typeof LASER_BEAM_VISUALS !== 'undefined' && LASER_BEAM_VISUALS)
            ? LASER_BEAM_VISUALS
            : {
                base: {
                    colorStart: '#ff4060',
                    colorEnd: '#ffffff',
                    coreStart: '#ff9ab0',
                    coreEnd: '#ffffff',
                    glowColor: '#ff6080',
                    widthBase: 2,
                    widthRamp: 3,
                    pulseHz: 12,
                    pulseAmp: 0.08,
                    jitter: 0.2,
                    taper: 1,
                },
            };

        let profile = { ...(defs.base || {}) };
        if (this.path === 'A' && defs.focused) {
            profile = { ...profile, ...defs.focused };
        } else if (this.path === 'B' && defs.prism) {
            profile = { ...profile, ...defs.prism };
        }

        if (variant === 'split' && defs.split) {
            profile = { ...profile, ...defs.split };
        }
        if (variant === 'deathRay' && defs.deathRay) {
            profile = { ...profile, ...defs.deathRay };
        }

        const rampMax = this.special && this.special.rampMax ? this.special.rampMax : 1;
        const rampPct = Number.isFinite(intensity)
            ? clamp(intensity, 0, 1)
            : clamp(rampMax > 0 ? this.beamRamp / rampMax : 0, 0, 1);

        const outerColor = colorLerp(profile.colorStart || '#ff4060', profile.colorEnd || '#ffffff', rampPct);
        const coreColor = colorLerp(profile.coreStart || '#ff9ab0', profile.coreEnd || '#ffffff', rampPct);
        const width = (profile.widthBase || 2) + (profile.widthRamp || 0) * rampPct;

        return {
            width,
            style: {
                outerColor,
                coreColor,
                glowColor: profile.glowColor || outerColor,
                altColor: profile.altColor || outerColor,
                dual: !!profile.dual,
                dualOffset: profile.dualOffset || 0,
                jitter: profile.jitter || 0,
                pulseHz: profile.pulseHz || 0,
                pulseAmp: profile.pulseAmp || 0,
                taper: profile.taper || 1,
                dash: profile.dash || null,
            },
        };
    }

    _spawnLaserBeam(targetX, targetY, variant = 'main', life = 0.05, widthScale = 1, intensity = null) {
        const profile = this._getLaserBeamProfile(variant, intensity);
        const width = Math.max(0.6, profile.width * (Number.isFinite(widthScale) ? widthScale : 1));
        Effects.spawnBeam(this.x, this.y, targetX, targetY, profile.style, width, life);
    }

    _updateBeam(dt) {
        const range = this.getEffectiveRange();
        const dps = this.special.dps || this.damage;

        // Find or keep target
        if (!this.beamTarget || !this.beamTarget.alive || dist(this, this.beamTarget) > range * 1.1) {
            this.beamTarget = this.findTarget();
            this.beamTime = 0;
            this.beamRamp = 0;
        }

        if (!this.beamTarget) return;

        this.angle = angleBetween(this, this.beamTarget);
        this.beamTime += dt;

        // Ramp damage
        if (this.special.rampRate) {
            let rampRate = this.special.rampRate;
            // Synergy ramp bonus
            if (this.synergyBonuses.rampBonus > 0) {
                rampRate *= (1 + this.synergyBonuses.rampBonus);
            }
            this.beamRamp = Math.min(this.beamRamp + rampRate * dt, this.special.rampMax || 1);
        }

        let effectiveDps = this.getEffectiveDamage() * (1 + this.beamRamp);

        // Split beams
        const splitCount = this.special.beamSplit || 1;
        const splitDmg = this.special.splitDmg || 1;

        if (splitCount > 1) {
            const targets = this._findMultipleTargets(splitCount);
            for (const t of targets) {
                const dmg = effectiveDps * splitDmg * dt;
                t.takeDamage(dmg, this);
                this.stats.totalDamageDealt += dmg;
                this._spawnLaserBeam(t.x, t.y, 'split', 0.05, 0.9);

                // Meltdown
                if (this.special.meltdown) {
                    t.armor = Math.max(0, t.armor - this.special.meltdown * dt);
                }
            }
        } else {
            const dmg = effectiveDps * dt;
            this.beamTarget.takeDamage(dmg, this);
            this.stats.totalDamageDealt += dmg;
            this._spawnLaserBeam(this.beamTarget.x, this.beamTarget.y, 'main', 0.05, 1);
        }

        // Track kills for mastery and XP
        if (this.beamTarget && !this.beamTarget.alive) {
            this.recordKill(this.beamTarget);
            this.beamTarget = null;
        }
    }

    // Calculate XP earned from a kill
    _getKillXP(enemy) {
        let xp = 10; // base XP
        if (enemy.isBoss) xp += 50;
        if (enemy.isElite) xp += 25;
        xp += Math.floor(enemy.maxHp / 50);
        return xp;
    }

    findTarget() {
        const range = this.getEffectiveRange();
        let candidates = GameState.enemies.filter(e => {
            if (!e.alive) return false;
            if (e.invisible && !this.special.seeInvisible && !(GameState.researchBonuses.omniscience)) return false;
            return dist(this, e) <= range;
        });

        if (candidates.length === 0) return null;

        // Target memory: prefer the same target from last frame if still valid
        if (this.lastTargetId !== null) {
            const rememberedTarget = candidates.find(e => (e.id || null) === this.lastTargetId);
            if (rememberedTarget) {
                // Only keep targeting if still a reasonable choice
                // (within 20% of range and still alive)
                if (dist(this, rememberedTarget) <= range * 1.0) {
                    return rememberedTarget;
                }
            }
        }

        switch (this.targetMode) {
            case 'closest':
                candidates.sort((a, b) => dist(this, a) - dist(this, b));
                break;
            case 'strongest':
                candidates.sort((a, b) => b.hp - a.hp);
                break;
            case 'weakest':
                candidates.sort((a, b) => a.hp - b.hp);
                break;
            case 'first':
                candidates.sort((a, b) => a.getDistFromEnd() - b.getDistFromEnd());
                break;
            case 'last':
                candidates.sort((a, b) => b.getDistFromEnd() - a.getDistFromEnd());
                break;
            case 'fastest':
                candidates.sort((a, b) => b.speed - a.speed);
                break;
        }

        return candidates[0];
    }

    _findMultipleTargets(count) {
        const range = this.getEffectiveRange();
        let candidates = GameState.enemies.filter(e => e.alive && dist(this, e) <= range);
        candidates.sort((a, b) => dist(this, a) - dist(this, b));
        return candidates.slice(0, count);
    }

    fire(target) {
        this.shotCount++;
        this.stats.totalShotsFired++;
        const dmg = this.getEffectiveDamage();
        const special = this.special;

        // Crit check
        let isCrit = false;
        let critMult = 1;
        const linkBonuses = this.getLinkBonuses();
        let critChance = (special.critChance || 0) + (this.getBoostBuff().crit || 0) + (GameState.researchBonuses.critChance || 0);
        // Add synergy crit bonus
        critChance += this.synergyBonuses.critBonus;
        critChance += linkBonuses.crit || 0;
        if (Math.random() < critChance) {
            isCrit = true;
            critMult = (special.critMult || 2) + (GameState.researchBonuses.critDmg || 0);
            this.stats.totalCrits++;
        }

        // Instant kill check (sniper)
        let instantKill = false;
        if (special.instantKill && !target.isBoss && Math.random() < special.instantKill) {
            instantKill = true;
        }

        // Perfect shot (arrow marksman t5)
        let isPerfectShot = false;
        if (special.perfectShot && this.shotCount % special.perfectShotEvery === 0) {
            isPerfectShot = true;
        }

        // Multi-shot (arrow volley, cluster cannon)
        const multishot = special.multishot || special.multiShot || special.multiMissile || 1;

        if (multishot > 1) {
            const targets = this._findMultipleTargets(multishot);
            for (const t of targets) {
                this._createProjectile(t, dmg, isCrit, critMult, instantKill);
            }
        } else {
            this._createProjectile(target, dmg, isCrit, critMult, instantKill, isPerfectShot);
        }

        // Track damage estimate
        const estDmg = isCrit ? dmg * critMult : dmg;
        this.stats.totalDamageDealt += estDmg * multishot;

        // Boss damage multiplier (sniper assassin)
        // Handled in projectile impact

        // Play sound
        const soundMap = {
            arrow: 'arrow', cannon: 'cannon', ice: 'ice',
            lightning: 'lightning', sniper: 'sniper',
            laser: 'laser', missile: 'missile', boost: null,
            flame: 'cannon', venom: 'arrow', mortar: 'cannon', necro: 'laser',
        };
        if (soundMap[this.type]) Audio.play(soundMap[this.type]);
        if (isCrit) Audio.play('crit');
    }

    _createProjectile(target, dmg, isCrit, critMult, instantKill, isPerfectShot = false) {
        const speed = this.type === 'sniper' ? 15 : this.type === 'missile' ? 4 : 8;
        const homing = this.special.homing || this.type === 'missile';

        GameState.projectiles.push(new Projectile({
            x: this.x, y: this.y,
            target: target,
            damage: isCrit ? dmg * critMult : dmg,
            speed: speed,
            tower: this,
            type: this.type,
            splash: this.getEffectiveSplash() || 0,
            isCrit: isCrit,
            instantKill: instantKill,
            isPerfectShot: isPerfectShot,
            homing: homing,
            pierce: this.special.pierce || 0,
            special: { ...this.special },
        }));
    }

    // Record a kill (called when a projectile from this tower kills an enemy)
    recordKill(enemy) {
        this.kills++;
        this.stats.totalKills++;
        this.stats.currentKillStreak++;
        this.stats.longestKillStreak = Math.max(this.stats.longestKillStreak, this.stats.currentKillStreak);
        this.stats.totalGoldEarned += enemy.reward || 0;
        this.addXP(this._getKillXP(enemy));
        GameState.stats.maxMastery = Math.max(GameState.stats.maxMastery || 0, this.getProgressionScore());

        // Necro tower: gain souls on kill
        if (this.type === 'necro' && this.special && this.special.soulGain) {
            this.souls = Math.min((this.souls || 0) + this.special.soulGain, this.special.maxSouls || 60);
        }

        // Reset streak if we miss (handled externally)
    }

    // Reset kill streak (called when tower fails to kill for a while)
    resetKillStreak() {
        this.stats.currentKillStreak = 0;
    }

    // ===== UPGRADE SYSTEM =====
    getUpgradeCost() {
        if (this.tier >= 5) return null;

        const nextTier = this.tier + 1;
        const def = TOWERS[this.type];
        let cost;

        if (nextTier <= 2) {
            cost = def.tiers[2].cost;
        } else if (nextTier === 3) {
            // Need to choose path — return path A cost (both same in our config)
            return { needsPath: true, costA: def.pathA.tiers[3].cost, costB: def.pathB.tiers[3].cost };
        } else if (this.path) {
            const pathDef = this.path === 'A' ? def.pathA : def.pathB;
            cost = pathDef.tiers[nextTier].cost;
        } else {
            return null;
        }

        // Apply discounts
        const rb = GameState.researchBonuses;
        let discount = (rb.costReduce || 0) + (rb.upgradeDiscount || 0);

        // Armory discount
        for (const t of GameState.towers) {
            if (t.type === 'boost' && t.special.upgradeDiscount && dist(this, t) <= t.range) {
                discount += t.special.upgradeDiscount;
            }
        }

        cost = Math.floor(cost * (1 - Math.min(discount, 0.5)));
        return { cost, nextTier };
    }

    upgrade(path = null) {
        // Tier 6 "Ultimate" upgrade
        if (this.tier >= 5) {
            if (typeof TowerUltimates !== 'undefined' && TowerUltimates.canUpgradeToUltimate(this)) {
                return TowerUltimates.applyUltimate(this);
            }
            return false;
        }

        // Challenge: no_upgrade — cannot upgrade past Tier 2
        if (GameState.activeChallenges.includes('no_upgrade') && this.tier >= 2) {
            Effects.addFloatingText(this.x, this.y - 20, 'BASE ONLY: No upgrades!', '#ff4040', 12);
            Audio.play('error');
            return false;
        }

        const nextTier = this.tier + 1;
        const def = TOWERS[this.type];

        if (nextTier === 3 && !this.path) {
            if (!path) return false; // Must choose path
            this.path = path;
        }

        let cost;
        if (nextTier <= 2) {
            cost = def.tiers[2].cost;
        } else {
            const pathDef = this.path === 'A' ? def.pathA : def.pathB;
            cost = pathDef.tiers[nextTier].cost;
        }

        // Apply discounts
        const rb = GameState.researchBonuses;
        let discount = (rb.costReduce || 0) + (rb.upgradeDiscount || 0);
        for (const t of GameState.towers) {
            if (t.type === 'boost' && t.special.upgradeDiscount && dist(this, t) <= t.range) {
                discount += t.special.upgradeDiscount;
            }
        }
        cost = Math.floor(cost * (1 - Math.min(discount, 0.5)));

        if (GameState.gold < cost) return false;

        // Capture pre-upgrade stats for delta display
        const statsBefore = { damage: this.damage, range: this.range, fireRate: this.fireRate };

        GameState.gold -= cost;
        this.totalCost += cost;
        this.tier = nextTier;
        this._applyTierStats();

        // Stats
        GameState.stats.maxTier = Math.max(GameState.stats.maxTier, this.tier);
        if (this.tier >= 5) {
            const tier5Count = GameState.towers.filter((tower) => tower && tower.tier >= 5).length;
            GameState.stats.tier5CountPeak = Math.max(GameState.stats.tier5CountPeak || 0, tier5Count);
        }

        // Show stat deltas
        const statsAfter = { damage: this.damage, range: this.range, fireRate: this.fireRate };
        if (typeof EconomyVisibility !== 'undefined') {
            EconomyVisibility.showUpgradeDelta(this, statsBefore, statsAfter);
        }

        // Effects
        Effects.spawnExplosion(this.x, this.y, '#ffd700', 15, { speed: 1.5, glow: true });
        Audio.play('upgrade');

        // Re-detect synergies after upgrade (specials may have changed)
        this._detectSynergies();

        return true;
    }

    // ===== SELL SYSTEM =====
    getSellValue() {
        let refund = CONFIG.SELL_REFUND;
        const rb = GameState.researchBonuses;
        if (rb.sellRefund) refund = Math.max(refund, rb.sellRefund);

        // Armory bonus
        for (const t of GameState.towers) {
            if (t.type === 'boost' && t.special.sellBonus && dist(this, t) <= t.range) {
                refund += t.special.sellBonus;
            }
        }

        return Math.floor(this.totalCost * Math.min(refund, 1.0));
    }

    // Get sell value breakdown for confirmation dialog
    getSellBreakdown() {
        const baseValue = this.totalCost;
        let refundRate = CONFIG.SELL_REFUND;
        const rb = GameState.researchBonuses;
        if (rb.sellRefund) refundRate = Math.max(refundRate, rb.sellRefund);

        let armoryBonus = 0;
        for (const t of GameState.towers) {
            if (t.type === 'boost' && t.special.sellBonus && dist(this, t) <= t.range) {
                armoryBonus += t.special.sellBonus;
            }
        }

        const effectiveRate = Math.min(refundRate + armoryBonus, 1.0);
        const sellValue = Math.floor(baseValue * effectiveRate);

        return {
            totalCost: baseValue,
            baseRefundRate: (CONFIG.SELL_REFUND * 100).toFixed(0) + '%',
            researchBonus: rb.sellRefund ? ((rb.sellRefund - CONFIG.SELL_REFUND) * 100).toFixed(0) + '%' : null,
            armoryBonus: armoryBonus > 0 ? (armoryBonus * 100).toFixed(0) + '%' : null,
            effectiveRate: (effectiveRate * 100).toFixed(0) + '%',
            sellValue: sellValue,
            kills: this.kills,
            xpLevel: this.xpLevel,
        };
    }

    // Request sell confirmation
    requestSellConfirmation() {
        if (this.sellConfirmActive) {
            // Already confirming — execute the sell
            this.sell();
            return true;
        }
        // Start confirmation timer
        this.sellConfirmActive = true;
        this.sellConfirmTimer = 3.0; // 3 second window to confirm
        return false;
    }

    // Cancel sell confirmation
    cancelSellConfirmation() {
        this.sellConfirmActive = false;
        this.sellConfirmTimer = 0;
    }

    sell() {
        // Challenge: no_sell prevents selling
        if (GameState.activeChallenges.includes('no_sell')) {
            Effects.addFloatingText(this.x, this.y - 20, 'NO SELLING!', '#ff4040', 13);
            Audio.play('error');
            return;
        }
        const value = this.getSellValue();
        GameState.gold += value;
        GameState.stats.towersNeverSold = false;
        Effects.addFloatingText(this.x, this.y - 20, `+${value}`, '#ffd700', 14);
        Effects.spawnGoldCoin(this.x, this.y);
        Audio.play('sell');

        this.sellConfirmActive = false;
        this.cancelLinkMode();
        this.clearAllLinks();

        // Remove from towers array
        const idx = GameState.towers.indexOf(this);
        if (idx >= 0) GameState.towers.splice(idx, 1);

        // Clear selection
        if (GameState.selectedTower === this) {
            GameState.selectedTower = null;
        }
        if (typeof Input !== 'undefined' && Array.isArray(Input.multiSelectedTowers)) {
            Input.multiSelectedTowers = Input.multiSelectedTowers.filter(tower => tower !== this);
        }

        TowerCommands.refreshTowerSystems();
    }

    // ===== MOVE/RELOCATE =====
    getMoveCost() {
        return Math.floor(this.totalCost * CONFIG.MOVE_COST_RATIO);
    }

    // Start moving the tower (enter move mode)
    startMove() {
        this.isBeingMoved = true;
        this.movePreviewCol = -1;
        this.movePreviewRow = -1;
    }

    // Cancel the move
    cancelMove() {
        this.isBeingMoved = false;
        this.movePreviewCol = -1;
        this.movePreviewRow = -1;
    }

    // Set the preview position while choosing where to move
    setMovePreview(col, row) {
        this.movePreviewCol = col;
        this.movePreviewRow = row;
    }

    // Check if the tower can move to a specific location
    canMoveTo(col, row) {
        // Can't move to current position
        if (col === this.gridCol && row === this.gridRow) return false;
        // Check if the target tile is buildable
        if (!MapSystem.canBuild(col, row)) return false;
        // Check if there is already a tower there (excluding this one)
        for (const t of GameState.towers) {
            if (t !== this && t.gridCol === col && t.gridRow === row) return false;
        }
        return true;
    }

    // Execute the move to a new position
    moveTo(col, row) {
        if (!this.canMoveTo(col, row)) return false;

        const cost = this.getMoveCost();
        if (GameState.gold < cost) return false;

        GameState.gold -= cost;

        // Effects at old position
        Effects.spawnExplosion(this.x, this.y, '#aaaaaa', 8, { speed: 0.8, life: 0.3 });

        // Update position
        this.gridCol = col;
        this.gridRow = row;
        const pos = gridToWorld(col, row);
        this.x = pos.x;
        this.y = pos.y;

        // Effects at new position
        Effects.spawnExplosion(this.x, this.y, '#ffd700', 10, { speed: 1.0, life: 0.4 });
        Effects.addFloatingText(this.x, this.y - 20, `-${cost}`, '#ff8800', 11);
        Audio.play('place');

        // Reset move state
        this.isBeingMoved = false;
        this.movePreviewCol = -1;
        this.movePreviewRow = -1;
        this.cancelLinkMode();

        // Reset beam target (might be out of range now)
        this.beamTarget = null;
        this.beamTime = 0;
        this.beamRamp = 0;
        this.target = null;
        this.lastTargetId = null;

        // Re-detect synergies and clean local networks at new position
        TowerCommands.refreshTowerSystems();

        return true;
    }

    // ===== OVERCLOCK =====
    overclock() {
        if (this.overclocked || this.disabled || this.overclockCooldown > 0) return;
        this.overclocked = true;
        this.overclockTimer = CONFIG.OVERCLOCK_DURATION;
        this.overclockStacks = 1;
        this.stats.overclockUses++;
        GameState.stats.overclockUses = (GameState.stats.overclockUses || 0) + 1;
    }

    // Get overclock status info for display
    getOverclockInfo() {
        if (this.overclocked) {
            return {
                active: true,
                remaining: this.overclockTimer.toFixed(1),
                total: CONFIG.OVERCLOCK_DURATION,
                fraction: this.overclockTimer / CONFIG.OVERCLOCK_DURATION,
                stacks: this.overclockStacks,
                boostPercent: ((CONFIG.OVERCLOCK_BOOST - 1 + (this.overclockStacks - 1) * 0.1) * 100).toFixed(0) + '%',
                visualPulse: this.overclockVisualPulse,
            };
        }
        if (this.disabled) {
            return {
                active: false,
                disabled: true,
                cooldownRemaining: this.disabledTimer.toFixed(1),
                cooldownTotal: CONFIG.OVERCLOCK_COOLDOWN,
                cooldownFraction: this.disabledTimer / CONFIG.OVERCLOCK_COOLDOWN,
            };
        }
        return { active: false, disabled: false, ready: true };
    }

    // ===== ABILITY COOLDOWN TRACKING =====
    useAbility() {
        if (!this.abilityReady || this.abilityCooldown > 0) return false;

        // Determine ability cooldown from special data
        let cooldown = 0;
        const s = this.special;

        // Generic support for all cooldown keys that end in "Cd"
        const directCdKey = Object.keys(s).find(k => k.endsWith('Cd') && Number.isFinite(s[k]) && s[k] > 0);
        if (directCdKey) {
            cooldown = s[directCdKey];
        } else if (s.devEvery) {
            cooldown = s.devEvery * this.getEffectiveFireRate();
        } else {
            return false; // No active ability cooldown found
        }

        const rb = GameState.researchBonuses;
        if (rb.ultimateCdr) {
            cooldown *= (1 - Math.min(rb.ultimateCdr, 0.8));
        }

        this.abilityReady = false;
        this.abilityCooldown = cooldown;
        this.abilityCooldownMax = cooldown;
        this.stats.abilitiesUsed++;
        return true;
    }

    getAbilityCooldownInfo() {
        if (this.abilityCooldownMax <= 0) return null;
        return {
            ready: this.abilityReady,
            remaining: Math.max(0, this.abilityCooldown).toFixed(1),
            total: this.abilityCooldownMax,
            fraction: this.abilityCooldownMax > 0 ? Math.max(0, this.abilityCooldown) / this.abilityCooldownMax : 0,
        };
    }

    // ===== STATISTICS =====
    getStatsDisplay() {
        const progression = this.getProgressionData();
        return {
            totalDamage: formatGold(Math.floor(this.stats.totalDamageDealt)),
            totalKills: this.stats.totalKills,
            shotsFired: this.stats.totalShotsFired,
            crits: this.stats.totalCrits,
            critRate: this.stats.totalShotsFired > 0
                ? ((this.stats.totalCrits / this.stats.totalShotsFired) * 100).toFixed(1) + '%'
                : '0%',
            goldEarned: this.stats.totalGoldEarned,
            killStreak: this.stats.longestKillStreak,
            timeAlive: formatTime(this.stats.timeAlive),
            overclockUses: this.stats.overclockUses,
            abilitiesUsed: this.stats.abilitiesUsed,
            progressionScore: progression.score,
            masteryTitle: this.getMasteryData() ? this.getMasteryData().title : 'Novice',
            synergies: this.activeSynergies.map(s => s.name),
            links: this.getLinkedTowers().length,
        };
    }

    // Get a summary of all bonuses affecting this tower
    getBonusSummary() {
        const mastery = this.getMasteryData();
        const formation = this.getFormationBonus();
        const boost = this.getBoostBuff();
        const links = this.getLinkBonuses();

        const bonuses = [];

        if (mastery) {
            bonuses.push({ source: 'Mastery (' + mastery.title + ')', dmg: mastery.dmgBonus, rate: mastery.rateBonus, range: mastery.rangeBonus });
        }
        if (formation.dmg > 0 || formation.rate > 0) {
            bonuses.push({ source: `Formation (${formation.count})`, dmg: formation.dmg, rate: formation.rate, range: 0 });
        }
        if (boost.dmg > 0 || boost.rate > 0 || boost.range > 0) {
            bonuses.push({ source: 'Boost Aura', dmg: boost.dmg, rate: boost.rate, range: boost.range });
        }
        if (this.synergyBonuses.dmg > 0 || this.synergyBonuses.rate > 0 || this.synergyBonuses.range > 0) {
            bonuses.push({ source: 'Synergy', dmg: this.synergyBonuses.dmg, rate: this.synergyBonuses.rate, range: this.synergyBonuses.range });
        }
        if (links.dmg > 0 || links.rate > 0 || links.range > 0 || links.crit > 0) {
            bonuses.push({ source: `Link Net (${links.count})`, dmg: links.dmg, rate: links.rate, range: links.range, crit: links.crit });
        }
        if (this.overclocked) {
            const oc = CONFIG.OVERCLOCK_BOOST - 1 + (this.overclockStacks - 1) * 0.1;
            bonuses.push({ source: 'Overclock', dmg: oc, rate: oc, range: 0 });
        }

        return bonuses;
    }

    getPathName() {
        if (!this.path) return '';
        const def = TOWERS[this.type];
        return this.path === 'A' ? def.pathA.name : def.pathB.name;
    }
}

Tower._nextId = 1;

const TowerCommands = {
    _getAliveSelection() {
        const towers = Array.isArray(GameState.towers) ? GameState.towers : [];
        if (typeof Input === 'undefined' || !Array.isArray(Input.multiSelectedTowers)) return [];
        return Input.multiSelectedTowers.filter(tower => towers.includes(tower));
    },

    getTargetingSelection(anchorTower) {
        const batch = this._getAliveSelection();
        if (anchorTower && batch.includes(anchorTower) && batch.length > 1) {
            return batch.filter(tower => tower.type !== 'boost');
        }
        return anchorTower && anchorTower.type !== 'boost' ? [anchorTower] : [];
    },

    setTargetMode(anchorTower, mode) {
        if (!CONFIG.TARGETING_MODES.includes(mode)) return 0;
        const targets = this.getTargetingSelection(anchorTower);
        for (const tower of targets) {
            tower.targetMode = mode;
            tower.target = null;
            tower.lastTargetId = null;
        }
        return targets.length;
    },

    refreshTowerSystems() {
        let maxFormation = GameState.stats.maxCombo || 0;
        const activeLinkPairs = new Set();
        for (const tower of GameState.towers) {
            tower.clearBrokenLinks();
        }
        for (const tower of GameState.towers) {
            tower._detectSynergies();
            maxFormation = Math.max(maxFormation, tower.getFormationBonus().count || 0);
            const linked = tower.getLinkedTowers();
            for (const other of linked) {
                const key = tower.id < other.id ? `${tower.id}:${other.id}` : `${other.id}:${tower.id}`;
                activeLinkPairs.add(key);
            }
        }
        GameState.stats.maxCombo = maxFormation;
        GameState.stats.maxActiveLinks = Math.max(GameState.stats.maxActiveLinks || 0, activeLinkPairs.size);
        const tier5Count = GameState.towers.filter((tower) => tower && tower.tier >= 5).length;
        GameState.stats.tier5CountPeak = Math.max(GameState.stats.tier5CountPeak || 0, tier5Count);
    },

    upgradeTower(tower) {
        if (!tower) return { ok: false, reason: 'missing' };

        tower.cancelSellConfirmation();

        const upgInfo = tower.getUpgradeCost();
        if (!upgInfo) return { ok: false, reason: 'max-tier' };

        if (upgInfo.needsPath) {
            if (typeof UIRenderer !== 'undefined' && UIRenderer.showPathChoice) {
                UIRenderer.showPathChoice(tower);
            }
            return { ok: false, reason: 'needs-path' };
        }

        if (GameState.gold < upgInfo.cost) return { ok: false, reason: 'gold' };
        return { ok: !!tower.upgrade(), reason: 'upgrade' };
    },

    upgradeSelection(towers) {
        const selection = Array.isArray(towers) ? towers.filter(Boolean) : [];
        let upgraded = 0;
        for (const tower of selection) {
            const result = this.upgradeTower(tower);
            if (result.ok) upgraded++;
        }
        return upgraded;
    },

    overclockTower(tower) {
        if (!tower) return false;
        if (tower.overclocked || tower.disabled || tower.overclockCooldown > 0) return false;
        tower.cancelSellConfirmation();
        tower.cancelLinkMode();
        tower.overclock();
        return tower.overclocked;
    },

    requestSellTower(tower) {
        if (!tower) return { ok: false, sold: false, pending: false, reason: 'missing' };
        const value = tower.getSellValue();
        const pending = !tower.requestSellConfirmation();
        const stillExists = GameState.towers.includes(tower);
        return {
            ok: pending || !stillExists,
            sold: !pending && !stillExists,
            pending,
            value,
        };
    },

    sellSelection(towers) {
        const selection = Array.isArray(towers) ? towers.filter(Boolean) : [];
        let sold = 0;
        for (const tower of selection) {
            const before = GameState.towers.includes(tower);
            tower.sell();
            if (before && !GameState.towers.includes(tower)) sold++;
        }
        return sold;
    },

    beginMoveTower(tower) {
        if (!tower) return { ok: false, reason: 'missing' };
        const moveCost = tower.getMoveCost();
        if (GameState.gold < moveCost) return { ok: false, reason: 'gold', cost: moveCost };

        for (const other of GameState.towers) {
            if (other !== tower && other.isBeingMoved) {
                other.cancelMove();
            }
            if (other !== tower && other.linkMode) {
                other.cancelLinkMode();
            }
        }

        tower.cancelSellConfirmation();
        tower.cancelLinkMode();
        tower.startMove();
        return { ok: true, cost: moveCost };
    },

    cancelMoveTower(tower) {
        if (!tower || !tower.isBeingMoved) return false;
        tower.cancelMove();
        return true;
    },

    confirmMoveTower(tower, col, row) {
        if (!tower || !tower.isBeingMoved) return { ok: false, reason: 'inactive' };
        if (!tower.canMoveTo(col, row)) return { ok: false, reason: 'tile' };
        if (GameState.gold < tower.getMoveCost()) return { ok: false, reason: 'gold', cost: tower.getMoveCost() };
        const result = { ok: !!tower.moveTo(col, row), reason: 'move' };
        if (result.ok) this.refreshTowerSystems();
        return result;
    },

    beginLinkMode(tower) {
        if (!tower) return { ok: false, reason: 'missing' };

        for (const other of GameState.towers) {
            if (other !== tower && other.linkMode) {
                other.cancelLinkMode();
            }
            if (other !== tower && other.isBeingMoved) {
                other.cancelMove();
            }
        }

        tower.beginLinkMode();
        return { ok: true };
    },

    cancelLinkMode(tower) {
        if (!tower || !tower.linkMode) return false;
        tower.cancelLinkMode();
        return true;
    },

    toggleLink(anchorTower, otherTower) {
        if (!anchorTower || !otherTower || anchorTower === otherTower) return { ok: false, reason: 'target' };

        anchorTower.cancelSellConfirmation();
        otherTower.cancelSellConfirmation();
        anchorTower.clearBrokenLinks();
        otherTower.clearBrokenLinks();

        if (anchorTower.hasLinkTo(otherTower)) {
            anchorTower.removeLink(otherTower);
            this.refreshTowerSystems();
            return { ok: true, linked: false, unlinked: true };
        }

        if (dist(anchorTower, otherTower) > (CONFIG.LINK_RANGE || 190)) {
            return { ok: false, reason: 'range' };
        }
        if (anchorTower.links.length >= (CONFIG.MAX_LINKS_PER_TOWER || 2)) {
            return { ok: false, reason: 'capacity-anchor' };
        }
        if (otherTower.links.length >= (CONFIG.MAX_LINKS_PER_TOWER || 2)) {
            return { ok: false, reason: 'capacity-target' };
        }
        if (GameState.gold < CONFIG.LINK_COST) {
            return { ok: false, reason: 'gold', cost: CONFIG.LINK_COST };
        }

        GameState.gold -= CONFIG.LINK_COST;
        anchorTower.addLink(otherTower);
        this.refreshTowerSystems();
        return { ok: true, linked: true, unlinked: false, cost: CONFIG.LINK_COST };
    },
};

function placeTower(type, worldX, worldY) {
    if (!MapSystem.canBuildAt(worldX, worldY)) return null;

    if (typeof ProgressionSystem !== 'undefined' && !ProgressionSystem.isTowerUnlocked(type)) {
        Effects.addFloatingText(worldX, worldY - 20, 'TOWER LICENSE LOCKED', '#ff7070', 12);
        Audio.play('error');
        return null;
    }

    // Tower cap: maximum 50 towers
    if (GameState.towers.length >= CONFIG.MAX_TOWERS) {
        Effects.addFloatingText(worldX, worldY - 20, `MAX TOWERS (${CONFIG.MAX_TOWERS})!`, '#ff4040', 12);
        Audio.play('error');
        return null;
    }

    // Catalyst cap: maximum 3 boost towers
    if (type === 'boost') {
        const boostCount = GameState.towers.filter(t => t.type === 'boost').length;
        if (boostCount >= CONFIG.MAX_CATALYSTS) {
            Effects.addFloatingText(worldX, worldY - 20, `MAX CATALYSTS (${CONFIG.MAX_CATALYSTS})!`, '#ff4040', 12);
            Audio.play('error');
            return null;
        }
    }

    // Challenge: one_type — can only build one type of tower
    if (GameState.activeChallenges.includes('one_type') && GameState.towers.length > 0) {
        const existingType = GameState.towers[0].type;
        if (type !== existingType) {
            Effects.addFloatingText(worldX, worldY - 20, 'SPECIALIST: One type only!', '#ff4040', 12);
            Audio.play('error');
            return null;
        }
    }

    const def = TOWERS[type];
    let cost = def.baseCost;

    // Apply research cost reduction
    const rb = GameState.researchBonuses;
    let discount = rb.costReduce || 0;
    if (rb.costMult) cost = Math.floor(cost * (1 + rb.costMult));
    cost = Math.floor(cost * (1 - Math.min(discount, 0.5)));

    if (GameState.gold < cost) return null;

    GameState.gold -= cost;
    const tower = new Tower(type, worldX, worldY);
    tower.totalCost = cost;
    GameState.towers.push(tower);

    // Track tower types for achievements
    GameState.stats.towerTypesSet.add(type);
    GameState.stats.towerTypesBuilt = GameState.stats.towerTypesSet.size;
    GameState.stats.towersPlacedThisRun = (GameState.stats.towersPlacedThisRun || 0) + 1;

    // Track local formation rather than global spam count.
    TowerCommands.refreshTowerSystems();

    Effects.spawnExplosion(tower.x, tower.y, def.iconColor, 10, { speed: 0.8 });
    Audio.play('place');

    return tower;
}
