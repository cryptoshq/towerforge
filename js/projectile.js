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

        // Visual properties based on type
        this.trail = [];
        this.size = this.type === 'cannon' ? 5 : this.type === 'sniper' ? 2 : this.type === 'missile' ? 4 : 3;
        this.trailColor = this._getTrailColor();
    }

    _getTrailColor() {
        switch (this.type) {
            case 'arrow': return this.isPerfectShot ? '#ffd700' : '#8aff8a';
            case 'cannon': return '#ff8040';
            case 'ice': return '#80e0ff';
            case 'lightning': return '#ffe040';
            case 'sniper': return this.isCrit ? '#ff4040' : '#ffffff';
            case 'missile': return '#ff6020';
            default: return '#ffffff';
        }
    }

    update(dt) {
        if (!this.alive) return false;
        this.life -= dt;
        if (this.life <= 0) { this.alive = false; return false; }

        // Retarget if current target is dead or missing
        if (!this.target || !this.target.alive) {
            let nearest = null;
            let minD = Infinity;
            for (const e of GameState.enemies) {
                if (e.alive && !this.pierced.has(e)) {
                    const d = dist(this, e);
                    if (d < minD) { minD = d; nearest = e; }
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
        this.trail.push({ x: this.x, y: this.y, life: 0.15 });
        if (this.trail.length > 10) this.trail.shift();

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
                    if (d < minD) { minD = d; nearest = e; }
                }
            }
            if (nearest) {
                // Retarget and redirect toward the nearest enemy
                this.target = nearest;
                const angle = angleBetween(this, nearest);
                this.angle = angle;
                this.vx = Math.cos(angle) * this.speed;
                this.vy = Math.sin(angle) * this.speed;
                // Clamp position back to within bounds
                this.x = Math.max(-45, Math.min(canvasWidth + 45, this.x));
                this.y = Math.max(-45, Math.min(canvasHeight + 45, this.y));
            } else {
                // No enemies left, projectile can die
                this.alive = false;
                return false;
            }
        }

        return true;
    }

    hit(enemy) {
        this.pierced.add(enemy);

        // Instant kill
        if (this.instantKill && !enemy.isBoss) {
            enemy.hp = 0;
            enemy.die();
            this.tower.kills++;
            Effects.addFloatingText(enemy.x, enemy.y - 25, 'EXECUTE!', '#ff4040', 16);
            this.alive = false;
            return;
        }

        // Perfect shot
        if (this.isPerfectShot && !enemy.isBoss && enemy.hp / enemy.maxHp < (this.special.executeThreshold || 0.2)) {
            enemy.hp = 0;
            enemy.die();
            this.tower.kills++;
            Effects.addFloatingText(enemy.x, enemy.y - 25, 'PERFECT!', '#ffd700', 16);
            Effects.spawnExplosion(enemy.x, enemy.y, '#ffd700', 20, { speed: 2, glow: true });
            this.alive = false;
            return;
        }

        let dmg = this.damage;

        // Boss damage multiplier
        if (enemy.isBoss && this.special.bossDmgMult) {
            dmg *= this.special.bossDmgMult;
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
                    e.takeDamage(splashDmg, this.tower);
                }
            }
            Effects.spawnSplash(this.x, this.y, this.trailColor, this.splash);
            if (this.splash > 50) {
                addScreenShake(this.splash / 20 * (GameState.settings.shakeIntensity || 1));
                Audio.play('explosion');
            }

            // Burn effect
            if (this.special.burnDPS) {
                for (const e of GameState.enemies) {
                    if (e.alive && dist(this, e) <= this.splash) {
                        e.applyBurn(this.special.burnDPS, this.special.burnDuration || 3);
                    }
                }
            }

            // Stagger
            if (this.special.staggerChance) {
                for (const e of GameState.enemies) {
                    if (e.alive && dist(this, e) <= this.splash && Math.random() < this.special.staggerChance) {
                        e.applySlow(this.special.staggerSlow || 0.3, 1);
                    }
                }
            }
        } else {
            // Single target
            enemy.takeDamage(dmg, this.tower);
        }

        // Apply special effects
        if (this.special.slow) {
            enemy.applySlow(this.special.slow, this.special.slowDuration || 2);
        }
        if (this.special.freezeChance && Math.random() < this.special.freezeChance) {
            enemy.applyFreeze(this.special.freezeDuration || 1.5);
            // Chain freeze
            if (this.special.freezeChain) {
                let chained = 0;
                for (const e of GameState.enemies) {
                    if (e !== enemy && e.alive && dist(enemy, e) < 80 && chained < this.special.freezeChain) {
                        e.applyFreeze(this.special.freezeDuration || 1.5);
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
            this.tower.kills++;
            GameState.stats.maxMastery = Math.max(GameState.stats.maxMastery, this.tower.kills);
        }

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
                    if (d < minDist) { minDist = d; nextTarget = e; }
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
                        splitTarget = e; break;
                    }
                }
                if (splitTarget) {
                    GameState.projectiles.push(new Projectile({
                        x: this.x, y: this.y,
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
            if (!nextTarget.alive) this.tower.kills++;

            // Visual chain
            Effects.spawnLightningArc(lastTarget.x, lastTarget.y, nextTarget.x, nextTarget.y);
            Effects.spawnBeam(lastTarget.x, lastTarget.y, nextTarget.x, nextTarget.y, '#ffe040', 2, 0.1);

            lastTarget = nextTarget;
        }
    }

    draw(ctx) {
        if (!this.alive) return;

        // Trail
        for (let i = 0; i < this.trail.length; i++) {
            const t = this.trail[i];
            const alpha = (i / this.trail.length) * 0.5;
            ctx.fillStyle = colorAlpha(this.trailColor, alpha);
            ctx.beginPath();
            ctx.arc(t.x, t.y, this.size * (i / this.trail.length), 0, Math.PI * 2);
            ctx.fill();
        }

        // Projectile
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        if (this.isPerfectShot) {
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 15;
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(-8, -2, 16, 4);
        } else if (this.type === 'arrow') {
            ctx.fillStyle = this.isCrit ? '#ff4040' : '#aaffaa';
            ctx.beginPath();
            ctx.moveTo(6, 0);
            ctx.lineTo(-4, -2);
            ctx.lineTo(-4, 2);
            ctx.closePath();
            ctx.fill();
        } else if (this.type === 'cannon') {
            ctx.fillStyle = '#888';
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'ice') {
            ctx.fillStyle = '#80e0ff';
            ctx.shadowColor = '#80e0ff';
            ctx.shadowBlur = 8;
            drawPoly(ctx, 0, 0, 6, this.size, GameState.time * 3);
            ctx.fill();
        } else if (this.type === 'sniper') {
            ctx.strokeStyle = this.isCrit ? '#ff4040' : '#fff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-8, 0);
            ctx.lineTo(8, 0);
            ctx.stroke();
        } else if (this.type === 'missile') {
            ctx.fillStyle = '#aaa';
            ctx.fillRect(-5, -2, 10, 4);
            ctx.fillStyle = '#ff4020';
            ctx.fillRect(-6, -1.5, 3, 3);
        } else {
            ctx.fillStyle = this.trailColor;
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}
