// ===== ABILITY SYSTEM =====
const AbilitySystem = {
    update(dt) {
        // Update player ability cooldowns
        for (const ab of GameState.abilities) {
            if (ab.cooldownTimer > 0) {
                ab.cooldownTimer -= dt * GameState.gameSpeed;
                if (ab.cooldownTimer <= 0) {
                    ab.cooldownTimer = 0;
                    ab.ready = true;
                }
            }
        }

        // Update global effects
        if (GameState.globalSlowTimer > 0) {
            GameState.globalSlowTimer -= dt;
            if (GameState.globalSlowTimer <= 0) { GameState.globalSlow = 0; }
        }
        if (GameState.globalDmgBuffTimer > 0) {
            GameState.globalDmgBuffTimer -= dt;
            if (GameState.globalDmgBuffTimer <= 0) { GameState.globalDmgBuff = 0; }
        }
        if (GameState.bonusLivesTimer > 0) {
            GameState.bonusLivesTimer -= dt;
            if (GameState.bonusLivesTimer <= 0) {
                GameState.lives = Math.max(1, GameState.lives - GameState.bonusLivesAmount);
                GameState.bonusLivesAmount = 0;
            }
        }
        if (GameState.supernovaTimer > 0) {
            GameState.supernovaTimer -= dt;
        }

        // Tower ultimate abilities
        for (const tower of GameState.towers) {
            if (tower.tier >= 5 && tower.abilityReady) {
                this._checkTowerAbility(tower);
            }
        }
    },

    reduceCooldowns(seconds) {
        if (!Number.isFinite(seconds) || seconds <= 0) return;
        for (const ab of GameState.abilities) {
            if (ab.cooldownTimer > 0) {
                ab.cooldownTimer = Math.max(0, ab.cooldownTimer - seconds);
                if (ab.cooldownTimer <= 0) {
                    ab.cooldownTimer = 0;
                    ab.ready = true;
                }
            }
        }
    },

    useAbility(index, targetX, targetY) {
        const ab = GameState.abilities[index];
        if (!ab || !ab.ready) return;

        ab.ready = false;
        let cd = ab.cooldown;
        const de = GameState.doctrineEffects || {};
        if (de.abilityCooldownMult && Number.isFinite(de.abilityCooldownMult) && de.abilityCooldownMult > 0) {
            cd *= de.abilityCooldownMult;
        }
        if (typeof WaveSystem !== 'undefined' && typeof WaveSystem.getCurrentTacticalModifiers === 'function') {
            const tactical = WaveSystem.getCurrentTacticalModifiers();
            if (tactical.abilityCooldownMult && Number.isFinite(tactical.abilityCooldownMult) && tactical.abilityCooldownMult > 0) {
                cd *= tactical.abilityCooldownMult;
            }
        }
        // Emergency protocol
        if (GameState.researchBonuses.emergencyCdr && GameState.lives <= 10) {
            cd *= (1 - GameState.researchBonuses.emergencyCdr);
        }
        ab.cooldownTimer = cd;
        GameState.stats.abilitiesUsed = (GameState.stats.abilitiesUsed || 0) + 1;

        Audio.play('ability');

        switch (ab.effect.type) {
            case 'aoe':
                // Air Strike
                const tx = targetX || GameState.mouseX;
                const ty = targetY || GameState.mouseY;
                for (const e of GameState.enemies) {
                    if (e.alive && dist({ x: tx, y: ty }, e) <= ab.effect.radius) {
                        e.takeDamage(ab.effect.damage);
                    }
                }
                Effects.spawnExplosion(tx, ty, '#ff8040', 25, { speed: 2, size: 1.5 });
                Effects.spawnSplash(tx, ty, '#ff4020', ab.effect.radius);
                addScreenShake(8 * GameState.settings.shakeIntensity);
                Audio.play('explosion');
                break;

            case 'buff':
                // Reinforce
                GameState.bonusLivesAmount = ab.effect.bonusLives;
                GameState.lives += ab.effect.bonusLives;
                GameState.bonusLivesTimer = ab.effect.duration;
                Effects.addFloatingText(logicalWidth / 2, logicalHeight / 2, `+${ab.effect.bonusLives} LIVES`, '#40ff80', 18);
                break;

            case 'gold':
                // Gold Mine
                GameState.gold += ab.effect.amount;
                Effects.addFloatingText(logicalWidth / 2, logicalHeight / 2, `+${ab.effect.amount} GOLD`, '#ffd700', 18);
                Effects.spawnGoldCoin(logicalWidth / 2, logicalHeight / 2);
                break;

            case 'slow':
                // Slow Field
                GameState.globalSlow = ab.effect.amount;
                GameState.globalSlowTimer = ab.effect.duration;
                Effects.addFloatingText(logicalWidth / 2, logicalHeight / 2, 'SLOW FIELD', '#80e0ff', 18);
                break;

            case 'towerbuff':
                // Overcharge
                GameState.globalDmgBuff = ab.effect.dmgMult;
                GameState.globalDmgBuffTimer = ab.effect.duration;
                Effects.addFloatingText(logicalWidth / 2, logicalHeight / 2, 'OVERCHARGE!', '#ffe040', 18);
                for (const t of GameState.towers) {
                    Effects.spawnExplosion(t.x, t.y, '#ffe040', 6, { speed: 0.5, glow: true });
                }
                break;
        }
    },

    _checkTowerAbility(tower) {
        const sp = tower.special;
        if (!sp) return;

        // Overload (Chain Master T5)
        if (sp.overload && tower.abilityReady) {
            tower.abilityCooldown = sp.overloadCd;
            tower.abilityCooldownMax = sp.overloadCd;
            tower.abilityReady = false;
            tower.stats.abilitiesUsed++;
            // Next attack chains to ALL in range
            const range = sp.overloadRange || 200;
            const dmg = tower.getEffectiveDamage();
            for (const e of GameState.enemies) {
                if (e.alive && dist(tower, e) <= range) {
                    e.takeDamage(dmg, tower);
                    Effects.spawnLightningArc(tower.x, tower.y, e.x, e.y);
                    Effects.spawnBeam(tower.x, tower.y, e.x, e.y, '#ffe040', 3, 0.2);
                }
            }
            addScreenShake(5);
            Audio.play('lightning');
        }

        // Volley Storm (Arrow Volley Path B T5)
        if (sp.volleyStorm && tower.abilityReady) {
            tower.abilityCooldown = sp.volleyCd;
            tower.abilityCooldownMax = sp.volleyCd;
            tower.abilityReady = false;
            tower.stats.abilitiesUsed++;
            this._startVolleyStorm(tower, sp);
        }

        // Absolute Zero (Deep Freeze Path A T5)
        if (sp.absoluteZero && tower.abilityReady) {
            tower.abilityCooldown = sp.azCd;
            tower.abilityCooldownMax = sp.azCd;
            tower.abilityReady = false;
            tower.stats.abilitiesUsed++;
            const range = tower.getEffectiveRange();
            for (const e of GameState.enemies) {
                if (e.alive && dist(tower, e) <= range) {
                    e.applyFreeze(sp.azDuration || 3);
                }
            }
            Effects.addFloatingText(tower.x, tower.y - 30, 'ABSOLUTE ZERO', '#80e0ff', 16);
            Effects.spawnExplosion(tower.x, tower.y, '#80e0ff', 20, { speed: 1.5, glow: true });
            RingWaves.spawn(tower.x, tower.y, { color: '#80e0ff', maxRadius: range, speed: 200, lineWidth: 3, life: 0.5 });
            GroundDecals.addFrostPatch(tower.x, tower.y, range * 0.5);
            addScreenShake(6);
            Audio.play('freeze');
        }

        // Thunderstorm (Storm Caller T5)
        if (sp.thunderstorm && tower.abilityReady) {
            tower.abilityCooldown = sp.stormCd;
            tower.abilityCooldownMax = sp.stormCd;
            tower.abilityReady = false;
            tower.stats.abilitiesUsed++;
            const target = tower.findTarget();
            if (target) {
                this._startThunderstorm(tower, target.x, target.y, sp);
            }
        }

        // Marked for Death (Sniper Assassin Path A T5)
        if (sp.markedForDeath && tower.abilityReady) {
            tower.abilityCooldown = sp.markCd;
            tower.abilityCooldownMax = sp.markCd;
            tower.abilityReady = false;
            tower.stats.abilitiesUsed++;
            this._activateMarkedForDeath(tower, sp);
        }

        // Designate All (Sniper Spotter Path B T5)
        if (sp.designate && tower.abilityReady) {
            tower.abilityCooldown = sp.desCd;
            tower.abilityCooldownMax = sp.desCd;
            tower.abilityReady = false;
            tower.stats.abilitiesUsed++;
            this._activateDesignateAll(tower, sp);
        }

        // Death Ray (Laser Focused Path A T5)
        if (sp.deathRay && tower.abilityReady) {
            tower.abilityCooldown = sp.drayCd;
            tower.abilityCooldownMax = sp.drayCd;
            tower.abilityReady = false;
            tower.stats.abilitiesUsed++;
            this._startDeathRay(tower, sp);
        }

        // Solar Flare (Laser Prism Path B T5)
        if (sp.solarFlare && tower.abilityReady) {
            tower.abilityCooldown = sp.flareCd;
            tower.abilityCooldownMax = sp.flareCd;
            tower.abilityReady = false;
            tower.stats.abilitiesUsed++;
            this._activateSolarFlare(tower, sp);
        }

        // Tactical Nuke (Missile Warhead Path A T5)
        if (sp.tacticalNuke && tower.abilityReady) {
            tower.abilityCooldown = sp.nukeCd;
            tower.abilityCooldownMax = sp.nukeCd;
            tower.abilityReady = false;
            tower.stats.abilitiesUsed++;
            // Find densest cluster of enemies
            const nukeTarget = this._findDensestCluster(sp.nukeRadius);
            if (nukeTarget) {
                for (const e of GameState.enemies) {
                    if (e.alive && dist(nukeTarget, e) <= sp.nukeRadius) {
                        e.takeDamage(sp.nukeDmg, tower);
                        e.applyStun(sp.nukeStun);
                        if (!e.alive) tower.recordKill(e);
                    }
                }
                Effects.spawnExplosion(nukeTarget.x, nukeTarget.y, '#ff4020', 30, { speed: 3, size: 2, glow: true });
                Effects.spawnExplosion(nukeTarget.x, nukeTarget.y, '#ff8020', 20, { speed: 2, size: 1.5 });
                Effects.spawnExplosion(nukeTarget.x, nukeTarget.y, '#ffcc20', 15, { speed: 1.5, size: 1 });
                RingWaves.spawn(nukeTarget.x, nukeTarget.y, { color: '#ff4020', maxRadius: sp.nukeRadius * 1.5, speed: 250, lineWidth: 4, life: 0.6 });
                RingWaves.spawn(nukeTarget.x, nukeTarget.y, { color: '#ff8020', maxRadius: sp.nukeRadius, speed: 180, lineWidth: 3, life: 0.5 });
                GroundDecals.addScorchMark(nukeTarget.x, nukeTarget.y, sp.nukeRadius * 0.4);
                Effects.addFloatingText(nukeTarget.x, nukeTarget.y - 30, 'TACTICAL NUKE!', '#ff4020', 18);
                addScreenShake(15 * (GameState.settings.shakeIntensity || 1));
                Audio.play('explosion');
            }
        }

        // Rocket Barrage (Missile Cluster Path B T5)
        if (sp.rocketBarrage && tower.abilityReady) {
            tower.abilityCooldown = sp.barrageCd;
            tower.abilityCooldownMax = sp.barrageCd;
            tower.abilityReady = false;
            tower.stats.abilitiesUsed++;
            this._startRocketBarrage(tower, sp);
        }

        // Supernova (Boost Amplifier Path A T5)
        if (sp.supernova && tower.abilityReady) {
            tower.abilityCooldown = sp.snovaCd;
            tower.abilityCooldownMax = sp.snovaCd;
            tower.abilityReady = false;
            tower.stats.abilitiesUsed++;
            GameState.supernovaTimer = sp.snovaDuration;
            GameState.supernovaSource = tower;
            Effects.addFloatingText(tower.x, tower.y - 30, 'SUPERNOVA!', '#ffd700', 18);
            Effects.spawnExplosion(tower.x, tower.y, '#ffd700', 25, { speed: 2.5, glow: true });
            RingWaves.spawn(tower.x, tower.y, { color: '#ffd700', maxRadius: tower.range * 1.5, speed: 150, lineWidth: 4, life: 0.8 });
            Audio.play('ability');
        }
    },

    _startThunderstorm(tower, tx, ty, sp) {
        const duration = sp.stormDuration * 1000;
        const interval = sp.stormInterval * 1000;
        const radius = sp.stormRadius;
        const dmg = sp.stormDmg;
        let elapsed = 0;

        const storm = setInterval(() => {
            elapsed += interval;
            if (elapsed >= duration || GameState.gamePhase !== 'playing') {
                clearInterval(storm);
                return;
            }
            // Strike random enemy in area
            const targets = GameState.enemies.filter(e => e.alive && dist({ x: tx, y: ty }, e) <= radius);
            if (targets.length > 0) {
                const t = choose(targets);
                t.takeDamage(dmg, tower);
                if (!t.alive) tower.recordKill(t);
                Effects.spawnLightningArc(tx, ty - 50, t.x, t.y);
                Effects.spawnBeam(tx, ty - 30, t.x, t.y, '#ffe040', 2, 0.1);
            }
        }, interval);
    },

    // Volley Storm: rain arrows over a large area for a duration
    _startVolleyStorm(tower, sp) {
        const totalArrows = sp.volleyArrows || 20;
        const duration = (sp.volleyDuration || 2) * 1000;
        const interval = duration / totalArrows;
        const range = tower.getEffectiveRange();
        const dmg = tower.getEffectiveDamage();
        let arrowsFired = 0;

        Effects.addFloatingText(tower.x, tower.y - 30, 'VOLLEY STORM!', '#8aff8a', 16);
        RingWaves.spawn(tower.x, tower.y, { color: '#8aff8a', maxRadius: range, speed: 200, lineWidth: 2, life: 0.5 });
        Audio.play('arrow');

        const volley = setInterval(() => {
            arrowsFired++;
            if (arrowsFired >= totalArrows || GameState.gamePhase !== 'playing') {
                clearInterval(volley);
                return;
            }
            // Rain arrow at random position within range
            const angle = Math.random() * Math.PI * 2;
            const r = Math.random() * range;
            const ax = tower.x + Math.cos(angle) * r;
            const ay = tower.y + Math.sin(angle) * r;

            // Deal damage to enemies near impact point
            const impactRadius = 20;
            for (const e of GameState.enemies) {
                if (e.alive && dist({ x: ax, y: ay }, e) <= impactRadius) {
                    e.takeDamage(dmg, tower);
                    if (!e.alive) tower.recordKill(e);
                }
            }
            // Visual: arrow impact particle
            Effects.spawnExplosion(ax, ay, '#8aff8a', 3, { speed: 0.5, life: 0.2 });
            // Trail from sky
            Effects.spawnBeam(ax, ay - 40, ax, ay, '#8aff8a', 1, 0.1);
        }, interval);
    },

    // Marked for Death: mark strongest enemy, deal massive damage after delay
    _activateMarkedForDeath(tower, sp) {
        // Find strongest enemy in range
        const range = tower.getEffectiveRange();
        let strongest = null;
        for (const e of GameState.enemies) {
            if (e.alive && dist(tower, e) <= range) {
                if (!strongest || e.hp > strongest.hp) {
                    strongest = e;
                }
            }
        }
        // Fallback: strongest enemy on map
        if (!strongest) {
            for (const e of GameState.enemies) {
                if (e.alive) {
                    if (!strongest || e.hp > strongest.hp) {
                        strongest = e;
                    }
                }
            }
        }
        if (!strongest) return;

        const target = strongest;

        // Visual: crosshair marker on target
        Effects.addFloatingText(target.x, target.y - target.size - 15, 'MARKED', '#ff60a0', 14);
        // Pulsing crosshair ring effect
        RingWaves.spawn(target.x, target.y, { color: '#ff60a0', maxRadius: 40, speed: 60, lineWidth: 2, life: 1.5 });

        // After 2 second delay, deal massive damage
        setTimeout(() => {
            if (!target.alive || GameState.gamePhase !== 'playing') return;
            target.takeDamage(sp.markDmg || 1000, tower);
            if (!target.alive) tower.recordKill(target);

            // Big impact visual
            Effects.spawnExplosion(target.x, target.y, '#ff60a0', 20, { speed: 2, size: 1.5, glow: true });
            Effects.spawnExplosion(target.x, target.y, '#ff2040', 12, { speed: 1.5, size: 1.2 });
            RingWaves.spawn(target.x, target.y, { color: '#ff60a0', maxRadius: 60, speed: 150, lineWidth: 3, life: 0.4 });
            Effects.addFloatingText(target.x, target.y - 25, `${sp.markDmg || 1000}`, '#ff60a0', 18);
            Effects.spawnBeam(tower.x, tower.y, target.x, target.y, '#ff60a0', 3, 0.3);
            addScreenShake(4);
            Audio.play('sniper');
        }, 2000);
    },

    // Designate All: mark ALL enemies on screen with vulnerability
    _activateDesignateAll(tower, sp) {
        const duration = sp.desDuration || 3;
        const vuln = 0.6; // +60% damage from all sources
        let marked = 0;
        for (const e of GameState.enemies) {
            if (e.alive) {
                e.applyMark(vuln, duration);
                marked++;
                // Visual: small mark effect on each enemy
                Effects.spawnExplosion(e.x, e.y, '#ff40ff', 4, { speed: 0.5, life: 0.3, glow: true });
            }
        }
        Effects.addFloatingText(tower.x, tower.y - 30, `DESIGNATE ALL! (${marked})`, '#ff40ff', 16);
        RingWaves.spawn(tower.x, tower.y, { color: '#ff40ff', maxRadius: 300, speed: 400, lineWidth: 2, life: 0.5 });
        addScreenShake(3);
        Audio.play('sniper');
    },

    // Death Ray: massive beam for a duration, infinite range
    _startDeathRay(tower, sp) {
        const duration = (sp.drayDuration || 5) * 1000;
        const dps = sp.drayDPS || 300;
        const interval = 50; // 20 ticks per second
        const dmgPerTick = dps * (interval / 1000);
        let elapsed = 0;
        let currentTarget = null;

        Effects.addFloatingText(tower.x, tower.y - 30, 'DEATH RAY!', '#ff2020', 18);
        addScreenShake(4);

        const ray = setInterval(() => {
            elapsed += interval;
            if (elapsed >= duration || GameState.gamePhase !== 'playing') {
                clearInterval(ray);
                return;
            }
            // Find target: any enemy on map (infinite range), prefer strongest
            if (!currentTarget || !currentTarget.alive) {
                currentTarget = null;
                let maxHp = 0;
                for (const e of GameState.enemies) {
                    if (e.alive && e.hp > maxHp) {
                        maxHp = e.hp;
                        currentTarget = e;
                    }
                }
            }
            if (!currentTarget) return;

            currentTarget.takeDamage(dmgPerTick, tower);
            tower.stats.totalDamageDealt += dmgPerTick;
            if (!currentTarget.alive) {
                tower.recordKill(currentTarget);
                currentTarget = null;
            }

            // Visual: thick red beam with glow
            if (currentTarget) {
                Effects.spawnBeam(tower.x, tower.y, currentTarget.x, currentTarget.y, '#ff2020', 6, interval / 1000 + 0.02);
                Effects.spawnBeam(tower.x, tower.y, currentTarget.x, currentTarget.y, '#ff6060', 3, interval / 1000 + 0.02);
                // Sparks at impact
                if (Math.random() < 0.3) {
                    Effects.spawnExplosion(currentTarget.x, currentTarget.y, '#ff4040', 2, { speed: 0.5, life: 0.1 });
                }
            }
        }, interval);
    },

    // Solar Flare: burst damage + blind (heavy slow) in radius
    _activateSolarFlare(tower, sp) {
        const flareDmg = sp.flareDmg || 200;
        const flareRadius = sp.flareRadius || 100;
        const blindDuration = sp.blindDuration || 3;
        const blindSlow = 0.8; // 80% slow = blind

        Effects.addFloatingText(tower.x, tower.y - 30, 'SOLAR FLARE!', '#ffe040', 16);
        Effects.spawnExplosion(tower.x, tower.y, '#ffe040', 25, { speed: 2.5, size: 1.8, glow: true });
        Effects.spawnExplosion(tower.x, tower.y, '#ffffff', 15, { speed: 2, size: 1.3, glow: true });
        RingWaves.spawn(tower.x, tower.y, { color: '#ffe040', maxRadius: flareRadius * 1.5, speed: 250, lineWidth: 4, life: 0.6 });
        RingWaves.spawn(tower.x, tower.y, { color: '#ffffff', maxRadius: flareRadius, speed: 180, lineWidth: 3, life: 0.5 });

        for (const e of GameState.enemies) {
            if (e.alive && dist(tower, e) <= flareRadius) {
                e.takeDamage(flareDmg, tower);
                e.applySlow(blindSlow, blindDuration);
                if (!e.alive) tower.recordKill(e);
            }
        }
        addScreenShake(8 * (GameState.settings.shakeIntensity || 1));
        Audio.play('explosion');
    },

    // Find densest cluster of enemies for Tactical Nuke targeting
    _findDensestCluster(radius) {
        let best = null;
        let bestCount = 0;
        for (const e of GameState.enemies) {
            if (!e.alive) continue;
            let count = 0;
            for (const other of GameState.enemies) {
                if (other.alive && dist(e, other) <= radius) count++;
            }
            if (count > bestCount) {
                bestCount = count;
                best = e;
            }
        }
        return best;
    },

    // Rocket Barrage: launch many missiles over a duration at random enemies across the map
    _startRocketBarrage(tower, sp) {
        const totalMissiles = sp.barrageCount || 20;
        const duration = (sp.barrageDuration || 3) * 1000;
        const interval = duration / totalMissiles;
        const dmg = tower.getEffectiveDamage();
        let fired = 0;

        Effects.addFloatingText(tower.x, tower.y - 30, 'ROCKET BARRAGE!', '#ff6020', 16);
        Audio.play('missile');

        const barrage = setInterval(() => {
            fired++;
            if (fired >= totalMissiles || GameState.gamePhase !== 'playing') {
                clearInterval(barrage);
                return;
            }
            // Pick a random alive enemy anywhere on the map
            const alive = GameState.enemies.filter(e => e.alive);
            if (alive.length === 0) return;
            const target = choose(alive);

            // Create a homing projectile toward target
            GameState.projectiles.push(new Projectile({
                x: tower.x,
                y: tower.y,
                target: target,
                damage: dmg,
                speed: 5 + Math.random() * 2,
                tower: tower,
                type: 'missile',
                splash: 25,
                isCrit: false,
                homing: true,
                pierce: 0,
                special: {},
            }));
            // Smoke at launch
            Effects.spawnMissileSmoke(tower.x, tower.y);
        }, interval);
    },
};
