// ===== TOWER POLISH MODULE =====
// Adds life to towers: idle animations, barrel tracking, build-in/sell anims,
// between-wave ambience, impact particles, environmental reactivity.

// =========================================================================
// 1. TOWER IDLE ANIMATIONS — subtle bob/sway/glow pulse when not firing
// =========================================================================
const TowerIdleAnims = {
    // Per-tower type idle configs
    _configs: {
        arrow:     { bobAmp: 0.6, bobHz: 1.2, swayAmp: 0.02, glowPulse: false },
        cannon:    { bobAmp: 0.3, bobHz: 0.8, swayAmp: 0.0,  glowPulse: false },
        ice:       { bobAmp: 0.5, bobHz: 1.0, swayAmp: 0.01, glowPulse: true, glowColor: '#80e0ff', glowHz: 1.5 },
        lightning: { bobAmp: 0.4, bobHz: 1.5, swayAmp: 0.0,  glowPulse: true, glowColor: '#ffe040', glowHz: 3.0 },
        sniper:    { bobAmp: 0.2, bobHz: 0.6, swayAmp: 0.0,  glowPulse: false },
        laser:     { bobAmp: 0.3, bobHz: 1.0, swayAmp: 0.0,  glowPulse: true, glowColor: '#ff4040', glowHz: 2.0 },
        flame:     { bobAmp: 0.5, bobHz: 1.3, swayAmp: 0.01, glowPulse: true, glowColor: '#ff6020', glowHz: 4.0 },
        missile:   { bobAmp: 0.3, bobHz: 0.7, swayAmp: 0.0,  glowPulse: false },
        mortar:    { bobAmp: 0.3, bobHz: 0.6, swayAmp: 0.0,  glowPulse: false },
        venom:     { bobAmp: 0.5, bobHz: 1.1, swayAmp: 0.015,glowPulse: true, glowColor: '#40ff40', glowHz: 2.0 },
        necro:     { bobAmp: 0.7, bobHz: 0.9, swayAmp: 0.02, glowPulse: true, glowColor: '#bf5fff', glowHz: 1.8 },
        boost:     { bobAmp: 0.4, bobHz: 1.0, swayAmp: 0.0,  glowPulse: true, glowColor: '#ffd700', glowHz: 2.5 },
    },

    getIdleOffset(tower, t) {
        const cfg = this._configs[tower.type] || { bobAmp: 0.4, bobHz: 1.0, swayAmp: 0.0, glowPulse: false };
        // Use tower id for phase offset so they don't all bob in sync
        const phase = (tower.id || 0) * 1.37;
        const isFiring = tower.fireTimer > 0 && tower.fireTimer < tower.getEffectiveFireRate() * 0.5;

        // Reduce idle anim when actively firing
        const idleWeight = isFiring ? 0.15 : 1.0;

        const bobY = Math.sin(t * cfg.bobHz * Math.PI * 2 + phase) * cfg.bobAmp * idleWeight;
        const swayAngle = Math.sin(t * cfg.bobHz * 0.7 * Math.PI * 2 + phase + 1.0) * cfg.swayAmp * idleWeight;

        return { bobY, swayAngle };
    },

    drawIdleGlow(ctx, tower, x, y, t) {
        const cfg = this._configs[tower.type];
        if (!cfg || !cfg.glowPulse) return;

        const phase = (tower.id || 0) * 2.13;
        const pulse = 0.3 + Math.sin(t * cfg.glowHz * Math.PI * 2 + phase) * 0.2;
        const radius = (CONFIG.TILE_SIZE / 2) + 4;

        ctx.save();
        ctx.globalAlpha = pulse * 0.15;
        const grad = ctx.createRadialGradient(x, y, radius * 0.3, x, y, radius);
        grad.addColorStop(0, cfg.glowColor);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    },
};

// =========================================================================
// 2. BARREL TRACKING — smooth rotation toward nearest enemy when idle
// =========================================================================
const BarrelTracking = {
    updateAngle(tower, dt) {
        if (tower.type === 'boost') return; // Boost doesn't aim

        // If tower has a target and is firing, angle is already set in tower.update()
        if (tower.target && tower.target.alive) return;

        // Find nearest enemy in range for idle tracking
        const range = tower.getEffectiveRange();
        let closest = null;
        let closestDist = Infinity;
        for (const e of GameState.enemies) {
            if (!e.alive) continue;
            const d = Math.hypot(e.x - tower.x, e.y - tower.y);
            if (d < range && d < closestDist) {
                closestDist = d;
                closest = e;
            }
        }

        if (closest) {
            const targetAngle = Math.atan2(closest.y - tower.y, closest.x - tower.x);
            // Smooth rotation toward target
            let diff = targetAngle - tower.angle;
            // Normalize to [-PI, PI]
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            tower.angle += diff * Math.min(1, dt * 5);
        } else {
            // Slow idle sweep when no enemies
            const phase = (tower.id || 0) * 0.73;
            const idleSweep = Math.sin(GameState.time * 0.3 + phase) * 0.3;
            let diff = idleSweep - tower.angle;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            tower.angle += diff * Math.min(1, dt * 1.5);
        }
    },
};

// =========================================================================
// 3. BUILD-IN ANIMATION — scale up from 0 + dust particles on placement
// =========================================================================
const BuildAnimation = {
    _anims: new Map(), // towerId -> { progress, startTime }
    DURATION: 0.35,

    start(tower) {
        this._anims.set(tower.id, {
            progress: 0,
            startTime: GameState.time,
        });
        // Dust particles
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 / 12) * i;
            const speed = 1 + Math.random() * 2;
            GameState.particles.push(new Particle(tower.x, tower.y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 0.5,
                life: 0.3 + Math.random() * 0.3,
                size: 2 + Math.random() * 3,
                color: choose(['#8a7a5a', '#6a5a3a', '#aa9a7a', '#554433']),
                gravity: 2.5,
                friction: 0.92,
                shape: 'square',
                rotation: Math.random() * Math.PI,
                rotationSpeed: (Math.random() - 0.5) * 8,
            }));
        }
        // Ground ring
        if (typeof RingWaves !== 'undefined') {
            RingWaves.spawn(tower.x, tower.y, {
                startRadius: 3,
                maxRadius: CONFIG.TILE_SIZE,
                speed: 80,
                lineWidth: 2,
                color: TOWERS[tower.type] ? TOWERS[tower.type].iconColor : '#ffffff',
                life: 0.3,
            });
        }
    },

    update(dt) {
        for (const [id, anim] of this._anims) {
            anim.progress = Math.min(1, (GameState.time - anim.startTime) / this.DURATION);
            if (anim.progress >= 1) {
                this._anims.delete(id);
            }
        }
    },

    getScale(towerId) {
        const anim = this._anims.get(towerId);
        if (!anim) return 1.0;
        // Elastic ease-out: overshoot then settle
        const t = anim.progress;
        const c4 = (2 * Math.PI) / 3;
        return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    },

    isAnimating(towerId) {
        return this._anims.has(towerId);
    },
};

// =========================================================================
// 4. SELL ANIMATION — shrink + gold particles flying out
// =========================================================================
const SellAnimation = {
    _anims: [], // { x, y, color, progress, startTime, value }
    DURATION: 0.4,

    start(tower) {
        const def = TOWERS[tower.type];
        const color = def ? def.iconColor : '#ffffff';
        const value = tower.getSellValue();

        this._anims.push({
            x: tower.x,
            y: tower.y,
            color,
            progress: 0,
            startTime: GameState.time,
            value,
        });

        // Gold coin particles flying outward
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i + Math.random() * 0.4;
            const speed = 2 + Math.random() * 3;
            GameState.particles.push(new Particle(tower.x, tower.y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                life: 0.5 + Math.random() * 0.4,
                size: 2 + Math.random() * 2,
                color: '#ffd700',
                gravity: 3,
                glow: true,
                shape: 'circle',
            }));
        }

        // Sparkle dust at disassembly
        for (let i = 0; i < 6; i++) {
            GameState.particles.push(new Particle(
                tower.x + (Math.random() - 0.5) * 20,
                tower.y + (Math.random() - 0.5) * 20,
                {
                    vx: (Math.random() - 0.5) * 2,
                    vy: -1 - Math.random() * 2,
                    life: 0.4 + Math.random() * 0.3,
                    size: 1 + Math.random() * 2,
                    color,
                    glow: true,
                    friction: 0.95,
                }
            ));
        }

        // Implosion ring
        if (typeof RingWaves !== 'undefined') {
            RingWaves.spawn(tower.x, tower.y, {
                startRadius: CONFIG.TILE_SIZE * 0.8,
                maxRadius: CONFIG.TILE_SIZE * 0.1,
                speed: -80,
                lineWidth: 2,
                color: '#ffd700',
                life: 0.25,
            });
        }
    },

    update(dt) {
        this._anims = this._anims.filter(a => {
            a.progress = Math.min(1, (GameState.time - a.startTime) / this.DURATION);
            return a.progress < 1;
        });
    },

    draw(ctx) {
        for (const a of this._anims) {
            const t = a.progress;
            const scale = 1 - t;
            const alpha = 1 - t * t;
            const spin = t * Math.PI * 2;

            ctx.save();
            ctx.globalAlpha = alpha * 0.6;
            ctx.translate(a.x, a.y);
            ctx.rotate(spin);
            ctx.scale(scale, scale);

            // Ghost of the tower shrinking and spinning
            ctx.fillStyle = a.color;
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 10 * alpha;
            const half = CONFIG.TILE_SIZE / 2 - 2;
            ctx.fillRect(-half, -half, half * 2, half * 2);

            ctx.restore();
        }
    },
};

// =========================================================================
// 5. BETWEEN-WAVE AMBIENCE — tower idle sparks + path anticipation dust
// =========================================================================
const BetweenWaveAmbience = {
    _sparkTimer: 0,
    _anticipationActive: false,
    _anticipationTimer: 0,

    update(dt) {
        // --- Tower idle sparks/puffs between waves ---
        this._sparkTimer += dt;
        const isIdle = GameState.gamePhase === 'idle';

        if (isIdle && this._sparkTimer > 0.4) {
            this._sparkTimer = 0;
            // Random tower emits a small spark/puff
            if (GameState.towers.length > 0) {
                const tower = GameState.towers[Math.floor(Math.random() * GameState.towers.length)];
                this._emitIdlePuff(tower);
            }
        }

        // --- Path anticipation: dust/rumble near spawn before wave starts ---
        if (isIdle && GameState.wave > 0) {
            this._anticipationActive = true;
            this._anticipationTimer += dt;
            this._updateAnticipation(dt);
        } else {
            this._anticipationActive = false;
            this._anticipationTimer = 0;
        }
    },

    _emitIdlePuff(tower) {
        const def = TOWERS[tower.type];
        if (!def) return;

        // Type-specific idle effects
        const puffs = {
            flame:     { color: choose(['#ff4020', '#ff8020']), vy: -1.5, size: 2, gravity: -0.3, life: 0.6 },
            ice:       { color: choose(['#80e0ff', '#a0f0ff']), vy: -0.8, size: 1.5, gravity: -0.1, life: 0.8 },
            lightning: { color: '#ffe040', vy: 0, size: 1, gravity: 0, life: 0.15 },
            venom:     { color: choose(['#40ff40', '#60dd60']), vy: -0.5, size: 2, gravity: -0.2, life: 0.7 },
            necro:     { color: choose(['#bf5fff', '#9040cc']), vy: -1.0, size: 2, gravity: -0.2, life: 0.8 },
            laser:     { color: '#ff4040', vy: 0, size: 1.5, gravity: 0, life: 0.2 },
            boost:     { color: '#ffd700', vy: -0.5, size: 1.5, gravity: 0, life: 0.5 },
        };

        const p = puffs[tower.type];
        if (!p) return; // No idle puff for arrow/cannon/sniper/missile/mortar (mechanical, not magical)

        GameState.particles.push(new Particle(
            tower.x + (Math.random() - 0.5) * 12,
            tower.y - 5 + (Math.random() - 0.5) * 6,
            {
                vx: (Math.random() - 0.5) * 1.0,
                vy: p.vy + (Math.random() - 0.5) * 0.5,
                life: p.life,
                size: p.size + Math.random(),
                color: p.color,
                gravity: p.gravity,
                glow: true,
                friction: 0.96,
            }
        ));
    },

    _updateAnticipation(dt) {
        // Spawn dust/rumble particles at the path start point
        const path = GameState.detailedPath || (typeof MapSystem !== 'undefined' && MapSystem.detailedPath);
        if (!path || path.length === 0) return;

        // Only emit intermittently, increasing as time passes
        const intensity = Math.min(1, this._anticipationTimer / 8.0); // Builds over 8 seconds
        if (Math.random() > intensity * 0.3 * dt * 60) return;

        const spawnPt = path[0];
        if (!spawnPt) return;

        // Dust at spawn
        const count = 1 + Math.floor(intensity * 2);
        for (let i = 0; i < count; i++) {
            GameState.particles.push(new Particle(
                spawnPt.x + (Math.random() - 0.5) * 30,
                spawnPt.y + (Math.random() - 0.5) * 20,
                {
                    vx: (Math.random() - 0.5) * 2,
                    vy: -0.5 - Math.random() * 1.5,
                    life: 0.6 + Math.random() * 0.6,
                    size: 1.5 + Math.random() * 2.5,
                    color: choose(['rgba(180,160,120,0.4)', 'rgba(150,130,100,0.35)', 'rgba(200,180,140,0.3)']),
                    gravity: 0.5,
                    friction: 0.95,
                }
            ));
        }

        // Screen rumble removed — dust particles only
    },

    draw(ctx) {
        // Draw anticipation warning indicator at spawn point
        if (!this._anticipationActive || this._anticipationTimer < 3.0) return;

        const path = GameState.detailedPath || (typeof MapSystem !== 'undefined' && MapSystem.detailedPath);
        if (!path || path.length === 0) return;
        const spawnPt = path[0];
        if (!spawnPt) return;

        const intensity = Math.min(1, this._anticipationTimer / 8.0);
        const pulse = Math.sin(GameState.time * 4) * 0.5 + 0.5;

        ctx.save();
        ctx.globalAlpha = intensity * 0.25 * (0.5 + pulse * 0.5);

        // Pulsing danger glow at spawn
        const grad = ctx.createRadialGradient(spawnPt.x, spawnPt.y, 5, spawnPt.x, spawnPt.y, 30 + pulse * 10);
        grad.addColorStop(0, 'rgba(255, 60, 40, 0.5)');
        grad.addColorStop(1, 'rgba(255, 60, 40, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(spawnPt.x, spawnPt.y, 30 + pulse * 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    },
};

// =========================================================================
// 6. IMPACT PARTICLES — type-specific contact effects
// =========================================================================
const ImpactParticles = {
    // Per tower-type impact particle configs
    _configs: {
        arrow:     { colors: ['#c8a868', '#e0c880'], count: 3, speed: 1.5, size: 1.2, shape: 'triangle', gravity: 1 },
        cannon:    { colors: ['#ff6030', '#ff9040', '#ffcc40'], count: 6, speed: 2.5, size: 2.0, shape: 'circle', gravity: 1.5 },
        ice:       { colors: ['#80e0ff', '#a0f0ff', '#c0f8ff'], count: 5, speed: 1.8, size: 1.5, shape: 'square', gravity: 0.3 },
        lightning: { colors: ['#ffe040', '#ffff80', '#ffffff'], count: 4, speed: 3.0, size: 1.0, shape: 'star', gravity: 0 },
        sniper:    { colors: ['#ffcc00', '#ffffff'],           count: 3, speed: 2.0, size: 1.5, shape: 'circle', gravity: 0 },
        laser:     { colors: ['#ff4040', '#ff8080', '#ffaaaa'],count: 4, speed: 1.5, size: 1.3, shape: 'circle', gravity: 0 },
        flame:     { colors: ['#ff4020', '#ff8020', '#ffcc20'],count: 6, speed: 2.0, size: 2.0, shape: 'circle', gravity: -0.5 },
        missile:   { colors: ['#ff6030', '#ff9040', '#aaa'],   count: 8, speed: 3.0, size: 2.5, shape: 'square', gravity: 2 },
        mortar:    { colors: ['#aa8855', '#cc9966', '#886644'],count: 7, speed: 2.5, size: 2.0, shape: 'square', gravity: 3 },
        venom:     { colors: ['#40ff40', '#80ff80', '#40cc40'],count: 5, speed: 1.5, size: 1.8, shape: 'circle', gravity: 0.3 },
        necro:     { colors: ['#bf5fff', '#9040cc', '#6020aa'],count: 5, speed: 1.5, size: 1.5, shape: 'star', gravity: -0.3 },
    },

    spawn(x, y, towerType) {
        const cfg = this._configs[towerType];
        if (!cfg) return;

        for (let i = 0; i < cfg.count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = cfg.speed * (0.5 + Math.random());
            GameState.particles.push(new Particle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.15 + Math.random() * 0.2,
                size: cfg.size * (0.5 + Math.random() * 0.5),
                color: choose(cfg.colors),
                gravity: cfg.gravity,
                shape: cfg.shape,
                friction: 0.92,
                glow: towerType === 'lightning' || towerType === 'laser' || towerType === 'necro',
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 6,
            }));
        }
    },
};

// =========================================================================
// 7. ENVIRONMENTAL REACTIVITY — scorch marks, frost spread, path wear
// =========================================================================
const EnvironmentalReactivity = {
    _scorchTimer: {},  // towerId -> timer
    _frostTimer: {},
    _pathWear: [],     // { x, y, alpha, life }
    _maxPathWear: 40,

    update(dt) {
        // --- Tower aura effects on ground ---
        for (const tower of GameState.towers) {
            if (tower.disabled) continue;

            // Flame towers leave scorch marks
            if (tower.type === 'flame') {
                if (!this._scorchTimer[tower.id]) this._scorchTimer[tower.id] = 0;
                this._scorchTimer[tower.id] += dt;
                if (this._scorchTimer[tower.id] > 5.0) {
                    this._scorchTimer[tower.id] = 0;
                    if (typeof GroundDecals !== 'undefined') {
                        GroundDecals.addScorchMark(
                            tower.x + (Math.random() - 0.5) * 20,
                            tower.y + (Math.random() - 0.5) * 20,
                            10 + Math.random() * 10
                        );
                    }
                }
            }

            // Ice towers spread frost
            if (tower.type === 'ice') {
                if (!this._frostTimer[tower.id]) this._frostTimer[tower.id] = 0;
                this._frostTimer[tower.id] += dt;
                if (this._frostTimer[tower.id] > 4.0) {
                    this._frostTimer[tower.id] = 0;
                    if (typeof GroundDecals !== 'undefined') {
                        GroundDecals.addFrostPatch(
                            tower.x + (Math.random() - 0.5) * 25,
                            tower.y + (Math.random() - 0.5) * 25,
                            12 + Math.random() * 12
                        );
                    }
                }
            }
        }

        // --- Path wear from enemy traffic ---
        const path = GameState.detailedPath || (typeof MapSystem !== 'undefined' && MapSystem.detailedPath);
        if (path && path.length > 0 && GameState.enemies.length > 5) {
            // Occasionally add wear marks where enemies cluster
            if (Math.random() < dt * 0.5) {
                const enemy = GameState.enemies[Math.floor(Math.random() * GameState.enemies.length)];
                if (enemy && enemy.alive) {
                    this._pathWear.push({
                        x: enemy.x + (Math.random() - 0.5) * 8,
                        y: enemy.y + (Math.random() - 0.5) * 8,
                        life: 3.0 + Math.random() * 2,
                        maxLife: 5.0,
                        size: 3 + Math.random() * 4,
                    });
                    if (this._pathWear.length > this._maxPathWear) {
                        this._pathWear.shift();
                    }
                }
            }
        }

        // Update path wear
        this._pathWear = this._pathWear.filter(w => {
            w.life -= dt;
            return w.life > 0;
        });
    },

    drawPathWear(ctx) {
        if (this._pathWear.length === 0) return;
        ctx.save();
        for (const w of this._pathWear) {
            const alpha = clamp(w.life / w.maxLife, 0, 1) * 0.15;
            ctx.globalAlpha = alpha;
            const grad = ctx.createRadialGradient(w.x, w.y, 0, w.x, w.y, w.size);
            grad.addColorStop(0, 'rgba(80,60,40,0.5)');
            grad.addColorStop(1, 'rgba(80,60,40,0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(w.x, w.y, w.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    },

    reset() {
        this._scorchTimer = {};
        this._frostTimer = {};
        this._pathWear = [];
    },
};

// =========================================================================
// INTEGRATION: Hook into TowerRenderer.draw for idle anims + build scale
// =========================================================================
const _originalTowerRendererDraw = TowerRenderer.draw.bind(TowerRenderer);
TowerRenderer.draw = function(ctx, tower) {
    const t = GameState.time;

    // Build-in scale
    const buildScale = BuildAnimation.getScale(tower.id);
    const isBuilding = BuildAnimation.isAnimating(tower.id);

    // Idle animation offsets
    const idle = TowerIdleAnims.getIdleOffset(tower, t);

    ctx.save();

    // Apply build-in scale
    if (isBuilding) {
        ctx.translate(tower.x, tower.y);
        ctx.scale(buildScale, buildScale);
        ctx.translate(-tower.x, -tower.y);
    }

    // Apply idle bob + sway
    if (!isBuilding) {
        ctx.translate(0, idle.bobY);
        if (idle.swayAngle !== 0) {
            ctx.translate(tower.x, tower.y);
            ctx.rotate(idle.swayAngle);
            ctx.translate(-tower.x, -tower.y);
        }
    }

    // Draw idle glow BEHIND the tower
    if (!isBuilding) {
        TowerIdleAnims.drawIdleGlow(ctx, tower, tower.x, tower.y + idle.bobY, t);
    }

    // Draw the actual tower
    _originalTowerRendererDraw(ctx, tower);

    ctx.restore();
};

// =========================================================================
// INTEGRATION: Hook into placeTower for build-in animation
// =========================================================================
const _origPlaceTowerForBuild = typeof window.placeTower === 'function'
    ? window.placeTower
    : (typeof placeTower === 'function' ? placeTower : null);

if (_origPlaceTowerForBuild) {
    window.placeTower = function(type, worldX, worldY) {
        const tower = _origPlaceTowerForBuild(type, worldX, worldY);
        if (tower) {
            BuildAnimation.start(tower);
        }
        return tower;
    };
}

// =========================================================================
// INTEGRATION: Hook into Tower.sell for sell animation
// =========================================================================
const _originalTowerSell = Tower.prototype.sell;
Tower.prototype.sell = function() {
    // Capture position before the tower is removed
    SellAnimation.start(this);
    _originalTowerSell.call(this);
};

// =========================================================================
// INTEGRATION: Hook into Tower.update for barrel tracking
// =========================================================================
const _originalTowerUpdate = Tower.prototype.update;
Tower.prototype.update = function(dt) {
    _originalTowerUpdate.call(this, dt);
    BarrelTracking.updateAngle(this, dt);
};

// =========================================================================
// INTEGRATION: Hook into projectile hit for impact particles
// =========================================================================
const _originalProjectileHit = Projectile.prototype.hit;
Projectile.prototype.hit = function(enemy) {
    // Spawn type-specific impact particles at contact point
    if (this.tower && this.tower.type) {
        ImpactParticles.spawn(this.x, this.y, this.tower.type);
    }
    _originalProjectileHit.call(this, enemy);
};

// =========================================================================
// MASTER MODULE: TowerPolish — update & draw integrated with game loop
// =========================================================================
const TowerPolish = {
    update(dt) {
        BuildAnimation.update(dt);
        SellAnimation.update(dt);
        BetweenWaveAmbience.update(dt);
        EnvironmentalReactivity.update(dt);
    },

    draw(ctx) {
        // Environmental path wear draws under towers (before tower layer)
        EnvironmentalReactivity.drawPathWear(ctx);
    },

    drawOverlay(ctx) {
        // Sell ghost animation (draws above towers)
        SellAnimation.draw(ctx);
        // Between-wave anticipation glow
        BetweenWaveAmbience.draw(ctx);
    },

    reset() {
        BuildAnimation._anims.clear();
        SellAnimation._anims = [];
        BetweenWaveAmbience._sparkTimer = 0;
        BetweenWaveAmbience._anticipationActive = false;
        BetweenWaveAmbience._anticipationTimer = 0;
        EnvironmentalReactivity.reset();
    },
};
