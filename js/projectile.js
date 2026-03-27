// ===== PROJECTILE SYSTEM =====
class Projectile {
    constructor(opts) {
        this.x = opts.x;
        this.y = opts.y;
        this.target = opts.target;
        this.damage = opts.damage;
        this.speed = opts.speed || 8;
        this.tower = opts.tower;
        this.type = opts.type;
        this.splash = opts.splash || 0;
        this.isCrit = opts.isCrit || false;
        this.instantKill = opts.instantKill || false;
        this.isPerfectShot = opts.isPerfectShot || false;
        this.homing = opts.homing || false;
        this.pierce = opts.pierce || 0;
        this.special = opts.special || {};
        this.alive = true;
        this.pierced = new Set();
        this.life = 3; // max lifetime seconds

        // Calculate initial velocity
        const angle = angleBetween(this, this.target);
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        this.angle = angle;

        // Config-driven visuals
        this.visual = this._resolveVisualProfile(opts);
        this.size = this.visual.size || 3;
        this.trailMax = this.visual.trailCount || 8;
        this.trail = [];
        this.trailColor = this.visual.trailColor || '#ffffff';
        this.visualProfileKey = `${this.type}:${this.visual.family}:${this.tower && this.tower.path ? this.tower.path : 'base'}`;
    }

    _resolveVisualProfile() {
        const visualConfig = (typeof PROJECTILE_VISUALS !== 'undefined') ? PROJECTILE_VISUALS[this.type] : null;
        if (!visualConfig || !visualConfig.base) {
            return {
                family: 'orb',
                bodyColor: '#ffffff',
                coreColor: '#ffffff',
                accentColor: '#cccccc',
                trailColor: '#ffffff',
                trailAccent: '#ffffff',
                glowColor: '#ffffff',
                impactStyle: 'orbPop',
                impactColor: '#ffffff',
                size: 3,
                trailMode: 'mist',
                trailLife: 0.16,
                trailCount: 6,
                length: 8,
                width: 8,
                spin: 0,
                glow: 0.12,
            };
        }

        const familyDefaults = (typeof PROJECTILE_FAMILY_DEFAULTS !== 'undefined' && visualConfig.base.family)
            ? (PROJECTILE_FAMILY_DEFAULTS[visualConfig.base.family] || {})
            : {};

        let merged = this._mergeVisualLayers(familyDefaults, visualConfig.base);

        const pathLayer = this._getPathVisualLayer(visualConfig);
        if (pathLayer) {
            merged = this._mergeVisualLayers(merged, pathLayer);
        }

        if (this.isCrit && visualConfig.crit) {
            merged = this._mergeVisualLayers(merged, visualConfig.crit);
        }

        const specialLayer = this._getSpecialVisualLayer(visualConfig);
        if (specialLayer) {
            merged = this._mergeVisualLayers(merged, specialLayer);
        }

        if (!merged.family) {
            merged.family = 'orb';
        }
        if (!merged.trailMode) {
            merged.trailMode = 'mist';
        }

        return merged;
    }

    _mergeVisualLayers(...layers) {
        const out = {};
        for (const layer of layers) {
            if (!layer || typeof layer !== 'object') continue;
            Object.assign(out, layer);
        }
        return out;
    }

    _getPathVisualLayer(config) {
        if (!this.tower || !this.tower.path) return null;
        if (this.tower.path === 'A') return config.pathA || null;
        if (this.tower.path === 'B') return config.pathB || null;
        return null;
    }

    _getSpecialVisualLayer(config) {
        if (!config.special) return null;
        if (this.isPerfectShot && config.special.perfectShot) {
            return config.special.perfectShot;
        }
        return null;
    }

    _getColor(key, fallback = '#ffffff') {
        const c = this.visual && this.visual[key];
        return c || fallback;
    }

    _updateTrail(dt) {
        for (const point of this.trail) {
            point.life -= dt;
        }
        this.trail = this.trail.filter(point => point.life > 0);
        this._pushTrailPoint();
    }

    _pushTrailPoint() {
        const life = this.visual.trailLife || 0.16;
        this.trail.push({
            x: this.x,
            y: this.y,
            angle: this.angle,
            life,
            maxLife: life,
            size: this.visual.size || this.size,
            color: this._getColor('trailColor', '#ffffff'),
            accent: this._getColor('trailAccent', this._getColor('trailColor', '#ffffff')),
        });
        while (this.trail.length > this.trailMax) {
            this.trail.shift();
        }
    }

    update(dt) {
        if (!this.alive) return false;
        this.life -= dt;
        if (this.life <= 0) {
            this.alive = false;
            return false;
        }

        // Retarget if current target is dead or missing
        if (!this.target || !this.target.alive) {
            let nearest = null;
            let minD = Infinity;
            for (const e of GameState.enemies) {
                if (e.alive && !this.pierced.has(e)) {
                    const d = dist(this, e);
                    if (d < minD) {
                        minD = d;
                        nearest = e;
                    }
                }
            }
            if (nearest) this.target = nearest;
        }

        // Guaranteed hit: projectiles perfectly track their target
        if (this.target && this.target.alive) {
            const angle = angleBetween(this, this.target);
            this.angle = angle;
            this.vx = Math.cos(this.angle) * this.speed;
            this.vy = Math.sin(this.angle) * this.speed;
        }

        // Move
        this.x += this.vx;
        this.y += this.vy;

        // Trail
        this._updateTrail(dt);

        // Check hit
        if (this.target && this.target.alive) {
            if (dist(this, this.target) < this.target.size + 5) {
                this.hit(this.target);
                return this.alive; // might continue if piercing
            }
        }

        // Check hit any enemy (if target is dead)
        if (!this.target || !this.target.alive) {
            for (const e of GameState.enemies) {
                if (e.alive && !this.pierced.has(e) && dist(this, e) < e.size + 5) {
                    this.hit(e);
                    if (!this.alive) return false;
                }
            }
        }

        // Out of bounds - retarget to nearest enemy instead of dying
        if (this.x < -50 || this.x > canvasWidth + 50 || this.y < -50 || this.y > canvasHeight + 50) {
            let nearest = null;
            let minD = Infinity;
            for (const e of GameState.enemies) {
                if (e.alive && !this.pierced.has(e)) {
                    const d = dist(this, e);
                    if (d < minD) {
                        minD = d;
                        nearest = e;
                    }
                }
            }
            if (nearest) {
                this.target = nearest;
                const angle = angleBetween(this, nearest);
                this.angle = angle;
                this.vx = Math.cos(angle) * this.speed;
                this.vy = Math.sin(angle) * this.speed;
                this.x = Math.max(-45, Math.min(canvasWidth + 45, this.x));
                this.y = Math.max(-45, Math.min(canvasHeight + 45, this.y));
            } else {
                this.alive = false;
                return false;
            }
        }

        return true;
    }

    hit(enemy) {
        this.pierced.add(enemy);
        const affectedEnemies = [];

        // Instant kill
        if (this.instantKill && !enemy.isBoss) {
            enemy.hp = 0;
            enemy.die();
            this.tower.recordKill(enemy);
            Effects.addFloatingText(enemy.x, enemy.y - 25, 'EXECUTE!', '#ff4040', 16);
            this._spawnImpactVisual(enemy, [enemy]);
            this.alive = false;
            return;
        }

        // Perfect shot
        if (this.isPerfectShot && !enemy.isBoss && enemy.hp / enemy.maxHp < (this.special.executeThreshold || 0.2)) {
            enemy.hp = 0;
            enemy.die();
            this.tower.recordKill(enemy);
            Effects.addFloatingText(enemy.x, enemy.y - 25, 'PERFECT!', '#ffd700', 16);
            Effects.spawnExplosion(enemy.x, enemy.y, '#ffd700', 20, { speed: 2, glow: true });
            this._spawnImpactVisual(enemy, [enemy]);
            this.alive = false;
            return;
        }

        let dmg = this.damage;

        // Boss damage multiplier
        if (enemy.isBoss && this.special.bossDmgMult) {
            dmg *= this.special.bossDmgMult;
        }

        // T4 Frost Vulnerability: frozen enemies take +25% dmg from ice tower
        if (this.special.t4FrostVuln && enemy.frozen) {
            dmg *= (1 + this.special.t4FrostVuln);
        }

        // T4 Inferno: burning enemies take +20% dmg from flame tower
        if (this.special.t4Inferno && enemy.burnTimer > 0) {
            dmg *= (1 + this.special.t4Inferno);
        }

        // Splash damage
        if (this.splash > 0) {
            const centerBonus = this.special.centerBonus || 1;
            const centerRadius = this.special.centerRadius || 0;

            for (const e of GameState.enemies) {
                if (!e.alive) continue;
                const d = dist(this, e);
                if (d <= this.splash) {
                    let splashDmg = dmg;
                    if (centerBonus > 1 && d <= centerRadius) {
                        splashDmg *= centerBonus;
                    } else {
                        splashDmg *= (1 - d / this.splash) * 0.6 + 0.4; // falloff
                    }
                    // T4 Inferno: burning enemies take +20% dmg (per-enemy check)
                    if (this.special.t4Inferno && e.burnTimer > 0) {
                        splashDmg *= (1 + this.special.t4Inferno);
                    }
                    e.takeDamage(splashDmg, this.tower);
                    affectedEnemies.push(e);
                }
            }

            // T4 Shockwave: stun enemies in outer 30% of splash radius
            if (this.special.t4Shockwave) {
                const outerThreshold = this.splash * 0.70;
                for (const e of affectedEnemies) {
                    if (!e.alive) continue;
                    if (dist(this, e) > outerThreshold) {
                        e.applyStun(0.4);
                    }
                }
            }

            // T4 Napalm Zone (missile): leave a burn/slow zone
            if (this.special.t4NapalmZone && this.tower && typeof this.tower._addT4Zone === 'function') {
                this.tower._addT4Zone(this.x, this.y, 'napalm');
            }

            // T4 Crater (mortar): leave a slow crater
            if (this.special.t4Crater && this.tower && typeof this.tower._addT4Zone === 'function') {
                this.tower._addT4Zone(this.x, this.y, 'crater');
            }

            Effects.spawnSplash(this.x, this.y, this._getColor('trailColor', '#ffffff'), this.splash);
            if (this.splash > 50) {
                addScreenShake(this.splash / 20 * (GameState.settings.shakeIntensity || 1));
                Audio.play('explosion');
            }
        } else {
            // Single target
            enemy.takeDamage(dmg, this.tower);
            affectedEnemies.push(enemy);
        }

        if (affectedEnemies.length === 0) {
            affectedEnemies.push(enemy);
        }

        // Broad on-hit effects (single target and splash targets)
        if (this.special.burnDPS) {
            for (const e of affectedEnemies) {
                if (!e.alive) continue;
                e.applyBurn(this.special.burnDPS, this.special.burnDuration || 3, {
                    meltArmor: this.special.meltArmor || 0,
                });
            }
        }

        if (this.special.poisonDPS) {
            for (const e of affectedEnemies) {
                if (!e.alive) continue;
                e.applyPoison(this.special.poisonDPS, this.special.poisonDuration || 3, {
                    maxStacks: this.special.poisonStacks || e.maxPoisonStacks,
                    spreadCount: this.special.plagueSpread || 0,
                    spreadRadius: this.special.spreadRadius || 0,
                    deathCloud: !!this.special.deathCloud,
                    cloudDuration: this.special.cloudDuration || 0,
                    cloudRadius: this.special.cloudRadius || 0,
                    sourceTower: this.tower,
                });
                if (this.special.corrodeDPS) {
                    e.applyCorrosion(this.special.corrodeDPS, this.special.poisonDuration || 3, this.special.corrodeMax || 0);
                }
                if (this.special.weakenVuln) {
                    e.applyVulnerability(1 + this.special.weakenVuln, this.special.poisonDuration || 3);
                }
                // T4 Neurotoxin: poison also applies Brittle (armor reduction)
                if (this.special.t4Neurotoxin && typeof e.applyBrittle === 'function') {
                    e.applyBrittle(0.20, 3);
                }
            }
        }

        if (this.special.staggerChance) {
            for (const e of affectedEnemies) {
                if (e.alive && Math.random() < this.special.staggerChance) {
                    e.applySlow(this.special.staggerSlow || 0.3, 1);
                }
            }
        }

        if (this.special.fireSpread && this.special.burnDPS) {
            const spreadChance = Number.isFinite(this.special.spreadChance) ? this.special.spreadChance : 1;
            if (Math.random() < spreadChance) {
                let spreadsLeft = Math.max(0, Math.floor(this.special.fireSpread));
                const spreadRadius = this.special.spreadRadius || 70;
                for (const src of affectedEnemies) {
                    if (!src.alive || spreadsLeft <= 0) break;
                    for (const nearby of GameState.enemies) {
                        if (spreadsLeft <= 0) break;
                        if (!nearby.alive || nearby === src) continue;
                        if (dist(src, nearby) > spreadRadius) continue;
                        nearby.applyBurn(this.special.burnDPS, this.special.burnDuration || 3, {
                            meltArmor: this.special.meltArmor || 0,
                        });
                        spreadsLeft--;
                    }
                }
            }
        }

        if (this.special.quakeZone && this.tower && typeof this.tower._addQuakeZone === 'function') {
            this.tower._addQuakeZone(this.x, this.y, this.special);
        }

        if (this.special.quakeStun && Math.random() < this.special.quakeStun) {
            for (const e of affectedEnemies) {
                if (e.alive) e.applyStun(0.5);
            }
        }

        if (this.special.shrapnelCount && this.special.shrapnelDmg) {
            let hits = 0;
            const maxHits = Math.max(1, Math.floor(this.special.shrapnelCount));
            const radius = this.special.shrapnelRadius || 100;
            const pierce = Math.max(1, (this.special.shrapnelPierce || 0) + 1);
            for (const e of GameState.enemies) {
                if (!e.alive || e === enemy) continue;
                if (dist(this, e) > radius) continue;
                e.takeDamage(this.special.shrapnelDmg, this.tower);
                Effects.spawnBeam(this.x, this.y, e.x, e.y, '#d4b090', 1.5, 0.07);
                hits++;
                if (hits >= maxHits * pierce) break;
            }
        }

        // Apply special effects
        if (this.special.slow) {
            enemy.applySlow(this.special.slow, this.special.slowDuration || 2);
        }
        if (this.special.freezeChance && Math.random() < this.special.freezeChance) {
            const freezeDuration = this.special.freezeDuration || 1.5;
            const canFreezeBoss = !!this.special.canFreezeBoss;
            enemy.applyFreeze(freezeDuration, { ignoreBossImmunity: canFreezeBoss });
            if (this.special.freezeVulnerable) {
                enemy.applyVulnerability(1 + this.special.freezeVulnerable, freezeDuration);
            }
            // Chain freeze
            if (this.special.freezeChain) {
                let chained = 0;
                for (const e of GameState.enemies) {
                    if (e !== enemy && e.alive && dist(enemy, e) < 80 && chained < this.special.freezeChain) {
                        e.applyFreeze(freezeDuration, { ignoreBossImmunity: canFreezeBoss });
                        if (this.special.freezeVulnerable) {
                            e.applyVulnerability(1 + this.special.freezeVulnerable, freezeDuration);
                        }
                        chained++;
                    }
                }
            }
        }
        if (this.special.stunChance && Math.random() < this.special.stunChance) {
            enemy.applyStun(this.special.stunDuration || 0.5);
        }
        if (this.special.markVuln) {
            enemy.applyMark(this.special.markVuln, this.special.markDuration || 5);
        }
        if (this.special.brittleChance && Math.random() < this.special.brittleChance) {
            enemy.applyBrittle(this.special.brittleVuln, this.special.brittleDuration || 5);
        }
        if (this.special.concussChance && Math.random() < this.special.concussChance) {
            enemy.applyStun(this.special.concussDuration || 0.3);
        }

        // Splash damage for lightning & storm
        if (this.special.splashDmg && this.special.splashRadius) {
            for (const e of GameState.enemies) {
                if (e !== enemy && e.alive && dist(enemy, e) <= this.special.splashRadius) {
                    e.takeDamage(dmg * this.special.splashDmg, this.tower);
                }
            }
        }

        // Lightning chains
        if (this.special.chains) {
            this._chainLightning(enemy, dmg);
        }

        // Track kills
        if (!enemy.alive) {
            this.tower.recordKill(enemy);
        }

        this._spawnImpactVisual(enemy, affectedEnemies);

        // Crit visual
        if (this.isCrit) {
            Effects.addFloatingText(enemy.x + 10, enemy.y - 25, 'CRIT!', '#ff4040', 14);
            Effects.spawnExplosion(enemy.x, enemy.y, '#ff4040', 6, { speed: 1.5 });
        }

        // Pierce through
        if (this.pierce > 0) {
            this.pierce--;
            // Find next target
            let nextTarget = null;
            let minDist = Infinity;
            for (const e of GameState.enemies) {
                if (e.alive && !this.pierced.has(e) && dist(this, e) < 100) {
                    const d = dist(this, e);
                    if (d < minDist) {
                        minDist = d;
                        nextTarget = e;
                    }
                }
            }
            if (nextTarget) {
                this.target = nextTarget;
                const angle = angleBetween(this, nextTarget);
                this.vx = Math.cos(angle) * this.speed;
                this.vy = Math.sin(angle) * this.speed;
                this.angle = angle;
            } else {
                this.alive = false;
            }
        } else {
            this.alive = false;
        }

        // Split warheads
        if (this.special.splitOnHit && this.alive === false) {
            const splitCount = this.special.splitOnHit;
            const splitDmg = this.damage * (this.special.splitDmg || 0.5);
            for (let i = 0; i < splitCount; i++) {
                const angle = (Math.PI * 2 / splitCount) * i;
                const nx = this.x + Math.cos(angle) * 20;
                const ny = this.y + Math.sin(angle) * 20;
                // Find nearby enemy
                let splitTarget = null;
                for (const e of GameState.enemies) {
                    if (e.alive && dist({ x: nx, y: ny }, e) < 80) {
                        splitTarget = e;
                        break;
                    }
                }
                if (splitTarget) {
                    GameState.projectiles.push(new Projectile({
                        x: this.x,
                        y: this.y,
                        target: splitTarget,
                        damage: splitDmg,
                        speed: this.speed * 0.8,
                        tower: this.tower,
                        type: this.type,
                        splash: this.splash * 0.5,
                        homing: true,
                        special: {},
                    }));
                }
            }
        }
    }

    _chainLightning(firstTarget, baseDmg) {
        const maxChains = this.special.chains;
        const chainRange = this.special.chainRange || 120;
        const falloff = this.special.chainFalloff || 0.85;
        let currentDmg = baseDmg;
        let lastTarget = firstTarget;
        const hit = new Set([firstTarget]);

        for (let i = 0; i < maxChains; i++) {
            currentDmg *= falloff;
            let nextTarget = null;
            let minDist = chainRange;

            for (const e of GameState.enemies) {
                if (e.alive && !hit.has(e)) {
                    const d = dist(lastTarget, e);
                    if (d < minDist) {
                        minDist = d;
                        nextTarget = e;
                    }
                }
            }

            if (!nextTarget) break;
            hit.add(nextTarget);
            nextTarget.takeDamage(currentDmg, this.tower);
            if (!nextTarget.alive) this.tower.recordKill(nextTarget);

            // Visual chain
            Effects.spawnLightningArc(lastTarget.x, lastTarget.y, nextTarget.x, nextTarget.y);
            Effects.spawnBeam(lastTarget.x, lastTarget.y, nextTarget.x, nextTarget.y, '#ffe040', 2, 0.1);

            lastTarget = nextTarget;
        }
    }

    _spawnImpactVisual(enemy) {
        const presetTable = (typeof PROJECTILE_IMPACT_PRESETS !== 'undefined') ? PROJECTILE_IMPACT_PRESETS : null;
        const preset = (presetTable && presetTable[this.visual.impactStyle])
            ? presetTable[this.visual.impactStyle]
            : { mode: 'burst', color: '#ffffff', count: 5, speed: 1.0, size: 0.8 };
        const color = this._getColor('impactColor', preset.color || this._getColor('trailColor', '#ffffff'));

        if (preset.mode === 'arc') {
            Effects.spawnLightningArc(this.x, this.y, enemy.x, enemy.y);
            Effects.spawnExplosion(this.x, this.y, color, preset.count || 6, {
                speed: preset.speed || 1,
                size: preset.size || 1,
                glow: true,
            });
            return;
        }

        if (this.visual.impactStyle === 'frost') {
            Effects.spawnFrostRing(this.x, this.y);
        } else if (this.visual.impactStyle === 'toxicSplash') {
            Effects.spawnSplash(this.x, this.y, color, 26);
        } else if (this.visual.impactStyle === 'seismicBurst') {
            Effects.spawnSplash(this.x, this.y, color, 34);
        }

        Effects.spawnExplosion(this.x, this.y, color, preset.count || 6, {
            speed: preset.speed || 1,
            size: preset.size || 1,
            glow: true,
        });
    }

    _applyVisualGlow(ctx) {
        const glow = this.visual.glow || 0;
        if (glow <= 0) return;
        ctx.shadowColor = this._getColor('glowColor', this._getColor('bodyColor', '#ffffff'));
        ctx.shadowBlur = Math.max(2, Math.round((this.visual.size || this.size) * (2 + glow * 5)));
    }

    _drawTrail(ctx) {
        switch (this.visual.trailMode) {
            case 'streak': this._drawTrailStreak(ctx); break;
            case 'smoke': this._drawTrailSmoke(ctx); break;
            case 'shards': this._drawTrailShards(ctx); break;
            case 'sparks': this._drawTrailSparks(ctx); break;
            case 'line': this._drawTrailLine(ctx); break;
            case 'smokeFire': this._drawTrailSmokeFire(ctx); break;
            case 'embers': this._drawTrailEmbers(ctx); break;
            case 'ghost': this._drawTrailGhost(ctx); break;
            case 'mist':
            default:
                this._drawTrailMist(ctx);
                break;
        }
    }

    _drawTrailStreak(ctx) {
        for (const point of this.trail) {
            const alpha = Math.max(0, point.life / point.maxLife) * 0.5;
            const len = (this.visual.length || 10) * alpha;
            const wid = Math.max(1, (this.visual.width || 3) * alpha);
            ctx.save();
            ctx.translate(point.x, point.y);
            ctx.rotate(point.angle || this.angle);
            ctx.fillStyle = colorAlpha(point.color, alpha);
            ctx.fillRect(-len, -wid * 0.5, len, wid);
            ctx.restore();
        }
    }

    _drawTrailSmoke(ctx) {
        for (const point of this.trail) {
            const alpha = Math.max(0, point.life / point.maxLife) * 0.35;
            const radius = Math.max(1, point.size * (1.2 - alpha));
            ctx.fillStyle = colorAlpha(this._getColor('smokeColor', point.color), alpha);
            ctx.beginPath();
            ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    _drawTrailShards(ctx) {
        for (const point of this.trail) {
            const alpha = Math.max(0, point.life / point.maxLife) * 0.45;
            const size = Math.max(1, point.size * alpha);
            ctx.save();
            ctx.translate(point.x, point.y);
            ctx.rotate((point.angle || this.angle) + alpha * 3);
            ctx.fillStyle = colorAlpha(point.accent, alpha);
            ctx.beginPath();
            ctx.moveTo(size, 0);
            ctx.lineTo(0, -size * 0.45);
            ctx.lineTo(-size, 0);
            ctx.lineTo(0, size * 0.45);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    }

    _drawTrailSparks(ctx) {
        for (const point of this.trail) {
            const alpha = Math.max(0, point.life / point.maxLife) * 0.6;
            const size = Math.max(1, point.size * alpha);
            ctx.save();
            ctx.translate(point.x, point.y);
            ctx.rotate((point.angle || this.angle) + Math.sin(GameState.time * 30 + point.x) * 0.4);
            ctx.strokeStyle = colorAlpha(point.color, alpha);
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(-size, 0);
            ctx.lineTo(size, 0);
            ctx.moveTo(0, -size * 0.8);
            ctx.lineTo(0, size * 0.8);
            ctx.stroke();
            ctx.restore();
        }
    }

    _drawTrailLine(ctx) {
        if (this.trail.length < 2) return;
        ctx.save();
        ctx.lineCap = 'round';
        for (let i = 1; i < this.trail.length; i++) {
            const prev = this.trail[i - 1];
            const curr = this.trail[i];
            const alpha = Math.max(0, curr.life / curr.maxLife) * 0.45;
            ctx.strokeStyle = colorAlpha(curr.color, alpha);
            ctx.lineWidth = Math.max(0.8, (this.visual.width || 2) * alpha);
            ctx.beginPath();
            ctx.moveTo(prev.x, prev.y);
            ctx.lineTo(curr.x, curr.y);
            ctx.stroke();
        }
        ctx.restore();
    }

    _drawTrailSmokeFire(ctx) {
        for (const point of this.trail) {
            const alpha = Math.max(0, point.life / point.maxLife);
            const smokeAlpha = alpha * 0.22;
            const flameAlpha = alpha * 0.38;

            ctx.fillStyle = colorAlpha(this._getColor('smokeColor', '#777777'), smokeAlpha);
            ctx.beginPath();
            ctx.arc(point.x, point.y, Math.max(1, point.size * (1.1 - alpha * 0.5)), 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = colorAlpha(this._getColor('exhaustColor', point.color), flameAlpha);
            ctx.beginPath();
            ctx.arc(point.x, point.y, Math.max(1, point.size * 0.6), 0, Math.PI * 2);
            ctx.fill();
        }
    }

    _drawTrailEmbers(ctx) {
        for (const point of this.trail) {
            const alpha = Math.max(0, point.life / point.maxLife) * 0.5;
            const size = Math.max(1, point.size * alpha);
            ctx.fillStyle = colorAlpha(this._getColor('emberColor', point.accent), alpha);
            ctx.beginPath();
            ctx.arc(point.x, point.y, size * 0.7, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    _drawTrailMist(ctx) {
        for (const point of this.trail) {
            const alpha = Math.max(0, point.life / point.maxLife) * 0.35;
            ctx.fillStyle = colorAlpha(point.color, alpha);
            ctx.beginPath();
            ctx.arc(point.x, point.y, Math.max(1, point.size * (0.9 + alpha)), 0, Math.PI * 2);
            ctx.fill();
        }
    }

    _drawTrailGhost(ctx) {
        for (const point of this.trail) {
            const alpha = Math.max(0, point.life / point.maxLife) * 0.4;
            const wobble = Math.sin(GameState.time * 8 + point.x * 0.05) * 1.4;
            ctx.fillStyle = colorAlpha(point.color, alpha);
            ctx.beginPath();
            ctx.arc(point.x + wobble, point.y, Math.max(1, point.size * (0.8 + alpha)), 0, Math.PI * 2);
            ctx.fill();
        }
    }

    _drawBody(ctx) {
        switch (this.visual.family) {
            case 'dart': this._drawDartBody(ctx); break;
            case 'shell': this._drawShellBody(ctx); break;
            case 'shard': this._drawShardBody(ctx); break;
            case 'bolt': this._drawBoltBody(ctx); break;
            case 'tracer': this._drawTracerBody(ctx); break;
            case 'rocket': this._drawRocketBody(ctx); break;
            case 'plume': this._drawPlumeBody(ctx); break;
            case 'orb':
            default:
                this._drawOrbBody(ctx);
                break;
        }
    }

    _drawDartBody(ctx) {
        const length = this.visual.length || 12;
        const width = this.visual.width || 4;
        ctx.fillStyle = this._getColor('bodyColor', '#aaffaa');
        ctx.beginPath();
        ctx.moveTo(length * 0.5, 0);
        ctx.lineTo(-length * 0.4, -width * 0.5);
        ctx.lineTo(-length * 0.2, 0);
        ctx.lineTo(-length * 0.4, width * 0.5);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = this._getColor('tipColor', '#ffffff');
        ctx.beginPath();
        ctx.moveTo(length * 0.56, 0);
        ctx.lineTo(length * 0.35, -width * 0.28);
        ctx.lineTo(length * 0.35, width * 0.28);
        ctx.closePath();
        ctx.fill();
    }

    _drawShellBody(ctx) {
        const radius = this.visual.size || this.size;
        ctx.fillStyle = this._getColor('bodyColor', '#888888');
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = this._getColor('coreColor', this._getColor('accentColor', '#555555'));
        ctx.beginPath();
        ctx.arc(radius * 0.2, -radius * 0.2, Math.max(1, radius * 0.45), 0, Math.PI * 2);
        ctx.fill();
    }

    _drawShardBody(ctx) {
        const length = this.visual.length || 10;
        const width = this.visual.width || 5;
        ctx.fillStyle = this._getColor('bodyColor', '#80e0ff');
        ctx.beginPath();
        ctx.moveTo(length * 0.5, 0);
        ctx.lineTo(0, -width * 0.7);
        ctx.lineTo(-length * 0.45, 0);
        ctx.lineTo(0, width * 0.7);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = this._getColor('coreColor', '#d7fbff');
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.moveTo(length * 0.2, 0);
        ctx.lineTo(-length * 0.1, -width * 0.25);
        ctx.lineTo(-length * 0.2, width * 0.25);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    _drawBoltBody(ctx) {
        const length = this.visual.length || 14;
        const width = this.visual.width || 3;
        const zigzag = this.visual.zigzag || 4;
        ctx.strokeStyle = this._getColor('bodyColor', '#ffe040');
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-length * 0.5, 0);
        const step = length / zigzag;
        for (let i = 1; i < zigzag; i++) {
            const x = -length * 0.5 + i * step;
            const y = (i % 2 === 0 ? -1 : 1) * width * 0.9;
            ctx.lineTo(x, y);
        }
        ctx.lineTo(length * 0.5, 0);
        ctx.stroke();
    }

    _drawTracerBody(ctx) {
        const length = this.visual.length || 18;
        const width = this.visual.width || 2;
        ctx.strokeStyle = this._getColor('bodyColor', '#ffffff');
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-length * 0.5, 0);
        ctx.lineTo(length * 0.5, 0);
        ctx.stroke();
    }

    _drawRocketBody(ctx) {
        const length = this.visual.length || 14;
        const width = this.visual.width || 5;
        ctx.fillStyle = this._getColor('bodyColor', '#aaaaaa');
        ctx.fillRect(-length * 0.45, -width * 0.35, length * 0.8, width * 0.7);

        ctx.fillStyle = this._getColor('coreColor', '#dddddd');
        ctx.beginPath();
        ctx.moveTo(length * 0.35, 0);
        ctx.lineTo(length * 0.12, -width * 0.35);
        ctx.lineTo(length * 0.12, width * 0.35);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = this._getColor('finColor', this._getColor('accentColor', '#666666'));
        ctx.beginPath();
        ctx.moveTo(-length * 0.2, -width * 0.35);
        ctx.lineTo(-length * 0.45, -width * 0.6);
        ctx.lineTo(-length * 0.34, -width * 0.15);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-length * 0.2, width * 0.35);
        ctx.lineTo(-length * 0.45, width * 0.6);
        ctx.lineTo(-length * 0.34, width * 0.15);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = this._getColor('exhaustColor', '#ff4020');
        ctx.beginPath();
        ctx.moveTo(-length * 0.45, 0);
        ctx.lineTo(-length * 0.6, -width * 0.22);
        ctx.lineTo(-length * 0.6, width * 0.22);
        ctx.closePath();
        ctx.fill();
    }

    _drawPlumeBody(ctx) {
        const length = this.visual.length || 12;
        const width = this.visual.width || 8;
        const wobble = (this.visual.wobble || 0) * Math.sin(GameState.time * 14 + this.x * 0.04);

        ctx.fillStyle = this._getColor('bodyColor', '#ff8a2a');
        ctx.beginPath();
        ctx.moveTo(length * 0.45, 0);
        ctx.quadraticCurveTo(0, -width * 0.55 - wobble * width, -length * 0.45, 0);
        ctx.quadraticCurveTo(0, width * 0.55 + wobble * width, length * 0.45, 0);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = this._getColor('coreColor', '#ffd36a');
        ctx.beginPath();
        ctx.arc(length * 0.05, 0, Math.max(1.2, width * 0.25), 0, Math.PI * 2);
        ctx.fill();
    }

    _drawOrbBody(ctx) {
        const radius = this.visual.size || this.size;
        ctx.fillStyle = this._getColor('bodyColor', this._getColor('trailColor', '#ffffff'));
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = this._getColor('coreColor', '#ffffff');
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.arc(radius * 0.18, -radius * 0.2, Math.max(1, radius * 0.45), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        if (this.visual.ringColor) {
            ctx.strokeStyle = colorAlpha(this.visual.ringColor, 0.8);
            ctx.lineWidth = 1.1;
            ctx.beginPath();
            ctx.arc(0, 0, radius * 1.12, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    draw(ctx) {
        if (!this.alive) return;

        this._drawTrail(ctx);

        ctx.save();
        ctx.translate(this.x, this.y);
        const spin = this.visual.spin || 0;
        ctx.rotate(this.angle + spin * GameState.time);
        this._applyVisualGlow(ctx);
        this._drawBody(ctx);
        ctx.restore();
    }
}
