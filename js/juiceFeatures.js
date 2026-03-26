// ===== JUICE FEATURES MODULE =====
// Features: Kill Feedback, Tower Placement Preview, Wave Pacing, Economy Visibility,
// Enemy Threat Preview, Post-Game Stats, Path Upgrade Decision Points, New Enemy Types, Tier 6 Ultimates

// ===========================
// 1. KILL FEEDBACK & JUICE
// ===========================
const KillFeedback = {
    comboCount: 0,
    comboTimer: 0,
    comboDecay: 2.5, // seconds before combo resets
    maxCombo: 0,
    killStreak: 0,
    multikillTimer: 0,
    multikillCount: 0,
    multikillWindow: 0.5, // seconds to chain multikills

    update(dt) {
        if (this.comboTimer > 0) {
            this.comboTimer -= dt;
            if (this.comboTimer <= 0) {
                if (this.comboCount >= 10) {
                    Effects.addFloatingText(
                        logicalWidth / 2, logicalHeight / 2 - 40,
                        `${this.comboCount}x COMBO ENDED!`, '#ffaa00', 16
                    );
                }
                this.comboCount = 0;
            }
        }
        if (this.multikillTimer > 0) {
            this.multikillTimer -= dt;
            if (this.multikillTimer <= 0) {
                this._announceMultikill();
                this.multikillCount = 0;
            }
        }
    },

    onKill(enemy) {
        this.comboCount++;
        this.comboTimer = this.comboDecay;
        this.killStreak++;
        this.multikillCount++;
        this.multikillTimer = this.multikillWindow;

        if (this.comboCount > this.maxCombo) this.maxCombo = this.comboCount;

        // Combo milestone announcements
        const milestones = [10, 25, 50, 100, 200, 500];
        if (milestones.includes(this.comboCount)) {
            const colors = { 10: '#ffaa00', 25: '#ff8800', 50: '#ff4400', 100: '#ff0044', 200: '#ff00ff', 500: '#00ffff' };
            Effects.addFloatingText(
                logicalWidth / 2, logicalHeight / 2 - 60,
                `🔥 ${this.comboCount}x COMBO! 🔥`,
                colors[this.comboCount] || '#ffaa00', 18
            );
            addScreenShake(this.comboCount >= 50 ? 3 : 1.5);
            // Bonus gold for high combos
            const bonus = Math.floor(this.comboCount / 10);
            if (bonus > 0) {
                GameState.gold += bonus;
                Effects.addFloatingText(
                    logicalWidth / 2, logicalHeight / 2 - 40,
                    `+${bonus} COMBO GOLD`, '#ffd700', 12
                );
            }
        }

        // Enhanced death effects based on kill type
        if (enemy.isBoss) {
            this._bossKillEffect(enemy);
        } else if (enemy.isElite) {
            this._eliteKillEffect(enemy);
        } else if (this.comboCount > 5) {
            // Extra particles on high combo
            const hue = (this.comboCount * 15) % 360;
            Effects.spawnExplosion(enemy.x, enemy.y, `hsl(${hue}, 100%, 60%)`, 4, { speed: 1.2, life: 0.3 });
        }
    },

    _bossKillEffect(enemy) {
        // Dramatic boss kill
        ScreenEffects.triggerSlowMotion(0.15, 1.5);
        addScreenShake(8);
        GameState.screenFlash = { color: '#ffffff', alpha: 0.6, timer: 0.8 };

        // Massive particle burst
        for (let i = 0; i < 40; i++) {
            const angle = (Math.PI * 2 / 40) * i;
            const speed = 2 + Math.random() * 4;
            Effects.spawnExplosion(
                enemy.x + Math.cos(angle) * 10,
                enemy.y + Math.sin(angle) * 10,
                choose(['#ff4040', '#ff8800', '#ffdd00', '#ffffff']),
                3, { speed, life: 0.6 + Math.random() * 0.4 }
            );
        }

        Effects.addFloatingText(enemy.x, enemy.y - 30, 'BOSS SLAIN!', '#ff4040', 20);
        Effects.addFloatingText(enemy.x, enemy.y - 50, `+${enemy.reward}g`, '#ffd700', 14);
    },

    _eliteKillEffect(enemy) {
        ScreenEffects.triggerSlowMotion(0.3, 0.5);
        addScreenShake(3);
        for (let i = 0; i < 15; i++) {
            Effects.spawnExplosion(
                enemy.x + rand(-15, 15),
                enemy.y + rand(-15, 15),
                enemy.color, 2, { speed: 1.5, life: 0.4 }
            );
        }
    },

    _announceMultikill() {
        if (this.multikillCount < 3) return;
        const labels = {
            3: { text: 'TRIPLE KILL!', color: '#44ff88', size: 13 },
            4: { text: 'QUAD KILL!', color: '#44ddff', size: 14 },
            5: { text: 'PENTA KILL!', color: '#ff44ff', size: 15 },
        };
        const label = labels[Math.min(this.multikillCount, 5)] ||
            { text: `${this.multikillCount}x MULTI KILL!`, color: '#ffdd00', size: 16 };
        Effects.addFloatingText(
            logicalWidth / 2, logicalHeight / 2 - 80,
            label.text, label.color, label.size
        );
    },

    reset() {
        this.comboCount = 0;
        this.comboTimer = 0;
        this.maxCombo = 0;
        this.killStreak = 0;
        this.multikillTimer = 0;
        this.multikillCount = 0;
    },

    drawComboMeter(ctx) {
        if (this.comboCount < 3) return;
        const x = logicalWidth / 2;
        const y = 65;
        const pct = this.comboTimer / this.comboDecay;

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Pulsing glow
        const pulse = 1 + Math.sin(GameState.time * 8) * 0.1;
        const hue = (this.comboCount * 8) % 360;

        ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
        ctx.shadowBlur = 10 * pulse;
        ctx.fillStyle = `hsl(${hue}, 100%, 70%)`;
        ctx.font = `bold ${Math.min(14 + this.comboCount * 0.3, 22)}px 'Orbitron', monospace`;
        ctx.fillText(`${this.comboCount}x COMBO`, x, y);

        // Decay bar
        ctx.shadowBlur = 0;
        const barW = 80;
        const barH = 3;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(x - barW / 2, y + 12, barW, barH);
        ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
        ctx.fillRect(x - barW / 2, y + 12, barW * pct, barH);

        ctx.restore();
    }
};

// ===========================
// 2. TOWER PLACEMENT PREVIEW
// ===========================
const PlacementPreview = {
    active: false,
    towerType: null,
    x: 0,
    y: 0,
    valid: false,
    pulseTimer: 0,

    update(dt) {
        if (!this.active) return;
        this.pulseTimer += dt * 3;
    },

    show(type, x, y, valid) {
        this.active = true;
        this.towerType = type;
        this.x = x;
        this.y = y;
        this.valid = valid;
    },

    hide() {
        this.active = false;
    },

    draw(ctx) {
        if (!this.active || !this.towerType) return;
        const def = TOWERS[this.towerType];
        if (!def) return;

        const x = this.x;
        const y = this.y;
        const pulse = 0.5 + Math.sin(this.pulseTimer) * 0.15;

        ctx.save();
        ctx.globalAlpha = this.valid ? 0.6 : 0.3;

        // Range circle
        const range = def.tiers[1].range;
        ctx.beginPath();
        ctx.arc(x, y, range, 0, Math.PI * 2);
        ctx.fillStyle = this.valid ? 'rgba(64, 224, 128, 0.08)' : 'rgba(224, 64, 64, 0.08)';
        ctx.fill();
        ctx.strokeStyle = this.valid ? `rgba(64, 224, 128, ${0.3 + pulse * 0.3})` : `rgba(224, 64, 64, ${0.3 + pulse * 0.3})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Tower ghost
        ctx.globalAlpha = this.valid ? (0.5 + pulse * 0.2) : 0.25;
        const footprint = CONFIG.TOWER_FOOTPRINT;

        // Tower body
        ctx.fillStyle = this.valid ? def.iconColor : '#ff4040';
        ctx.beginPath();
        ctx.arc(x, y, footprint, 0, Math.PI * 2);
        ctx.fill();

        // Tower outline
        ctx.strokeStyle = this.valid ? '#40ff80' : '#ff4040';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, footprint + 1, 0, Math.PI * 2);
        ctx.stroke();

        // Cost indicator
        const cost = def.baseCost;
        const canAfford = GameState.gold >= cost;
        ctx.globalAlpha = 1;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 10px monospace';
        ctx.fillStyle = canAfford ? '#ffd700' : '#ff4040';
        ctx.fillText(`${cost}g`, x, y + footprint + 12);

        // DPS preview text
        const dps = (def.tiers[1].damage / def.tiers[1].fireRate).toFixed(0);
        ctx.fillStyle = '#aaaacc';
        ctx.font = '9px monospace';
        ctx.fillText(`${dps} DPS`, x, y + footprint + 22);

        ctx.restore();
    }
};

// ===========================
// 3. WAVE PACING & TENSION
// ===========================
const WavePacing = {
    lastEnemySpotlight: false,
    waveCompletePopupTimer: 0,
    waveCompleteData: null,
    waveStartTime: 0,

    update(dt) {
        // Wave complete popup
        if (this.waveCompletePopupTimer > 0) {
            this.waveCompletePopupTimer -= dt;
        }

        // Last enemy spotlight
        if (GameState.gamePhase === 'playing') {
            const aliveEnemies = GameState.enemies.filter(e => e.alive);
            if (aliveEnemies.length === 1 && GameState.waveEnemies.length === 0 && !this.lastEnemySpotlight) {
                this.lastEnemySpotlight = true;
                const enemy = aliveEnemies[0];
                Effects.addFloatingText(enemy.x, enemy.y - enemy.size - 20, 'LAST ONE!', '#ffdd44', 14);
            }
            if (aliveEnemies.length > 1) {
                this.lastEnemySpotlight = false;
            }
        }
    },

    onWaveStart(waveNum) {
        this.waveStartTime = GameState.time;
        this.lastEnemySpotlight = false;
    },

    onWaveComplete(waveNum) {
        const clearTime = GameState.time - this.waveStartTime;
        const kills = GameState.stats.totalKills;
        const leaks = GameState.stats.leaksThisGame;

        this.waveCompleteData = {
            wave: waveNum,
            clearTime: clearTime,
            perfect: leaks === 0,
            kills: kills,
            gold: GameState.gold,
        };
        this.waveCompletePopupTimer = 3.0;

        // Perfect wave bonus
        if (this.waveCompleteData.perfect && waveNum > 1) {
            Effects.addFloatingText(
                logicalWidth / 2, logicalHeight / 2 - 20,
                'PERFECT WAVE!', '#40ff80', 16
            );
        }
    },

    drawWaveCompletePopup(ctx) {
        if (this.waveCompletePopupTimer <= 0 || !this.waveCompleteData) return;

        const d = this.waveCompleteData;
        const alpha = Math.min(this.waveCompletePopupTimer, 1);
        const x = logicalWidth / 2;
        const y = 100;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        roundRect(ctx, x - 100, y - 20, 200, 50, 8);
        ctx.fill();

        // Title
        ctx.fillStyle = d.perfect ? '#40ff80' : '#ffd700';
        ctx.font = "bold 14px 'Orbitron', monospace";
        ctx.fillText(`WAVE ${d.wave} CLEAR`, x, y - 5);

        // Time
        ctx.fillStyle = '#aaaacc';
        ctx.font = '11px monospace';
        ctx.fillText(`${d.clearTime.toFixed(1)}s`, x, y + 15);

        ctx.restore();
    },

    drawLastEnemySpotlight(ctx) {
        if (!this.lastEnemySpotlight) return;
        const enemy = GameState.enemies.find(e => e.alive);
        if (!enemy) return;

        ctx.save();
        const pulse = 0.3 + Math.sin(GameState.time * 6) * 0.15;

        // Spotlight circle
        ctx.beginPath();
        ctx.arc(enemy.renderX || enemy.x, enemy.renderY || enemy.y, 30, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 220, 60, ${pulse})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Arrow pointer
        const arrowY = (enemy.renderY || enemy.y) - enemy.size - 25 + Math.sin(GameState.time * 4) * 5;
        ctx.fillStyle = `rgba(255, 220, 60, ${pulse + 0.2})`;
        ctx.beginPath();
        ctx.moveTo((enemy.renderX || enemy.x), arrowY + 8);
        ctx.lineTo((enemy.renderX || enemy.x) - 6, arrowY);
        ctx.lineTo((enemy.renderX || enemy.x) + 6, arrowY);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }
};

// ===========================
// 4. ECONOMY VISIBILITY
// ===========================
const EconomyVisibility = {
    floatingGolds: [],
    interestPreviewTimer: 0,
    cantAffordFlashTimer: 0,
    cantAffordType: null,

    update(dt) {
        // Update floating gold animations
        for (let i = this.floatingGolds.length - 1; i >= 0; i--) {
            const g = this.floatingGolds[i];
            g.timer -= dt;
            g.y -= 20 * dt;
            g.x += g.vx * dt;
            if (g.timer <= 0) {
                this.floatingGolds.splice(i, 1);
            }
        }

        // Can't afford flash
        if (this.cantAffordFlashTimer > 0) {
            this.cantAffordFlashTimer -= dt;
        }
    },

    showGoldGain(x, y, amount, source) {
        const color = source === 'interest' ? '#88ffaa' : '#ffd700';
        this.floatingGolds.push({
            x, y, amount, color, source,
            vx: rand(-10, 10),
            timer: 1.2,
            maxTimer: 1.2,
        });
    },

    showCantAfford(towerType) {
        this.cantAffordFlashTimer = 0.5;
        this.cantAffordType = towerType;
        const goldEl = document.getElementById('hud-gold');
        if (goldEl) {
            goldEl.classList.add('gold-flash-red');
            setTimeout(() => goldEl.classList.remove('gold-flash-red'), 500);
        }
    },

    showInterestGain(amount) {
        if (amount <= 0) return;
        Effects.addFloatingText(
            logicalWidth - 100, 40,
            `+${amount} INTEREST`, '#88ffaa', 11
        );
    },

    showUpgradeDelta(tower, statsBefore, statsAfter) {
        const x = tower.x;
        let y = tower.y - 30;
        const deltas = [];
        if (statsAfter.damage > statsBefore.damage) {
            deltas.push({ text: `DMG +${(statsAfter.damage - statsBefore.damage).toFixed(0)}`, color: '#ff8844' });
        }
        if (statsAfter.range > statsBefore.range) {
            deltas.push({ text: `RNG +${(statsAfter.range - statsBefore.range).toFixed(0)}`, color: '#44aaff' });
        }
        if (statsAfter.fireRate < statsBefore.fireRate) {
            deltas.push({ text: `SPD +${((statsBefore.fireRate - statsAfter.fireRate) * 100).toFixed(0)}%`, color: '#44ff88' });
        }
        for (const d of deltas) {
            Effects.addFloatingText(x, y, d.text, d.color, 10);
            y -= 15;
        }
    },

    drawFloatingGolds(ctx) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = 'bold 11px monospace';
        for (const g of this.floatingGolds) {
            const alpha = Math.min(g.timer / 0.3, 1);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = g.color;
            ctx.fillText(`+${g.amount}g`, g.x, g.y);
        }
        ctx.restore();
    },

    drawCantAffordFlash(ctx) {
        if (this.cantAffordFlashTimer <= 0) return;
        // Red tint on sidebar
        ctx.save();
        const alpha = this.cantAffordFlashTimer * 0.3;
        ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
        ctx.fillRect(logicalWidth - 200, 0, 200, logicalHeight);
        ctx.restore();
    }
};

// ===========================
// 5. ENEMY THREAT PREVIEW
// ===========================
const ThreatPreview = {
    visible: false,
    previewData: null,

    generatePreview(waveNum) {
        if (waveNum <= 0 || !WaveSystem.waveDefs) return null;
        const nextWave = waveNum;
        if (nextWave > WaveSystem.waveDefs.length) return null;

        const waveDef = WaveSystem.waveDefs[nextWave - 1];
        if (!waveDef) return null;

        const threats = [];
        const isBossWave = waveDef.enemies.some(e => e.type === 'boss');
        const types = new Set();
        let totalCount = 0;

        for (const group of waveDef.enemies) {
            types.add(group.type);
            totalCount += group.count || 0;
            const def = ENEMIES[group.type];
            if (def) {
                threats.push({
                    type: group.type,
                    name: def.name,
                    count: group.count,
                    color: def.color,
                    isBoss: def.isBoss || false,
                    desc: def.desc,
                });
            }
        }

        // Get weakness indicators
        const weaknesses = [];
        if (types.has('heavy') || types.has('berserker')) weaknesses.push('High damage towers');
        if (types.has('fast') || types.has('swarmfast')) weaknesses.push('AOE / crowd control');
        if (types.has('stealth') || types.has('ghost')) weaknesses.push('Detection towers');
        if (types.has('shield') || types.has('healer')) weaknesses.push('Focus fire / burst');
        if (types.has('disruptor')) weaknesses.push('Spread towers out');
        if (types.has('toxic')) weaknesses.push('Long range towers');

        return {
            wave: nextWave,
            isBossWave,
            threats,
            totalCount,
            weaknesses,
            modifiers: WaveSystem.activeModifiers || [],
        };
    },

    drawPreviewInHUD(ctx) {
        if (GameState.gamePhase !== 'idle') return;
        const nextWave = GameState.wave + 1;
        const preview = this.generatePreview(nextWave);
        if (!preview) return;

        const x = 8;
        let y = logicalHeight - 120;

        ctx.save();
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        // Background panel
        ctx.fillStyle = 'rgba(10, 10, 30, 0.85)';
        roundRect(ctx, x, y, 220, preview.isBossWave ? 110 : 90, 6);
        ctx.fill();
        ctx.strokeStyle = preview.isBossWave ? '#ff4040' : '#444466';
        ctx.lineWidth = 1;
        roundRect(ctx, x, y, 220, preview.isBossWave ? 110 : 90, 6);
        ctx.stroke();

        // Title
        ctx.fillStyle = preview.isBossWave ? '#ff4040' : '#aaaacc';
        ctx.font = "bold 11px 'Orbitron', monospace";
        ctx.fillText(`WAVE ${nextWave} PREVIEW`, x + 8, y + 6);

        if (preview.isBossWave) {
            ctx.fillStyle = '#ff6040';
            ctx.font = 'bold 9px monospace';
            ctx.fillText('⚠ BOSS WAVE', x + 145, y + 7);
        }

        // Enemy types
        ctx.font = '10px monospace';
        let lineY = y + 22;
        for (const t of preview.threats.slice(0, 4)) {
            ctx.fillStyle = t.color;
            ctx.fillText(`● ${t.name}`, x + 8, lineY);
            ctx.fillStyle = '#888899';
            ctx.fillText(`x${t.count}`, x + 130, lineY);
            lineY += 14;
        }

        // Weakness hint
        if (preview.weaknesses.length > 0) {
            ctx.fillStyle = '#60d0e0';
            ctx.font = '9px monospace';
            ctx.fillText(`TIP: ${preview.weaknesses[0]}`, x + 8, lineY + 4);
        }

        ctx.restore();
    }
};

// ===========================
// 8. PATH UPGRADE DECISION POINTS
// ===========================
const PathDecisionUI = {
    // Camera zoom on path choice — stats are handled by UIRenderer.showPathChoice v2

    showPathChoice(tower) {
        if (typeof ScreenEffects !== 'undefined') {
            ScreenEffects.cameraZoomTarget = 1.15;
            ScreenEffects.cameraZoomCenterX = tower.x;
            ScreenEffects.cameraZoomCenterY = tower.y;
        }
    },

    _populatePathCard() { /* handled by showPathChoice v2 */ },

    onPathChosen() {
        if (typeof ScreenEffects !== 'undefined') {
            ScreenEffects.cameraZoomTarget = 1.0;
        }
    }
};

// ===========================
// 9. POST-GAME STATS SCREEN
// ===========================
const PostGameStats = {
    data: null,

    collect() {
        const sessionTime = (performance.now() - (sessionStartTime || 0) - (totalPauseTime || 0)) / 1000;

        // Per-tower stats
        const towerStats = GameState.towers.map(t => ({
            type: t.type,
            tier: t.tier,
            path: t.path,
            kills: t.kills || 0,
            damage: t.stats ? t.stats.totalDamageDealt : 0,
            shots: t.stats ? t.stats.totalShotsFired : 0,
            crits: t.stats ? t.stats.totalCrits : 0,
            mastery: t.masteryLevel,
        }));

        // Sort by damage dealt
        towerStats.sort((a, b) => b.damage - a.damage);

        // MVP tower
        const mvp = towerStats.length > 0 ? towerStats[0] : null;

        // Economy stats
        const totalGoldEarned = GameState.stats.maxGold || 0;

        this.data = {
            wave: GameState.wave,
            maxWave: GameState.maxWave,
            score: GameState.score,
            totalKills: GameState.stats.totalKills,
            bossKills: GameState.stats.bossKills,
            towersBuilt: GameState.towers.length,
            towerStats,
            mvp,
            totalGoldEarned,
            gameTime: GameState.time,
            realTime: sessionTime,
            leaks: GameState.stats.leaksThisGame,
            perfectWaves: GameState.stats.perfectWaves || 0,
            maxCombo: KillFeedback.maxCombo,
            difficulty: GameState.settings.difficulty,
            mapName: MAPS[GameState.mapIndex] ? MAPS[GameState.mapIndex].name : 'Unknown',
        };

        return this.data;
    },

    buildHTML(container, isVictory) {
        if (!this.data) this.collect();
        const d = this.data;

        let html = `<div class="postgame-stats">`;

        // Summary row
        html += `<div class="pg-summary">`;
        html += `<div class="pg-stat"><span class="pg-label">Score</span><span class="pg-value">${d.score.toLocaleString()}</span></div>`;
        html += `<div class="pg-stat"><span class="pg-label">Kills</span><span class="pg-value">${d.totalKills}</span></div>`;
        html += `<div class="pg-stat"><span class="pg-label">Leaks</span><span class="pg-value" style="color:${d.leaks === 0 ? '#40ff80' : '#ff4040'}">${d.leaks}</span></div>`;
        html += `<div class="pg-stat"><span class="pg-label">Max Combo</span><span class="pg-value">${d.maxCombo}x</span></div>`;
        html += `</div>`;

        // Timing
        html += `<div class="pg-timing">`;
        html += `<span>Game: ${formatTime(d.gameTime)}</span>`;
        html += `<span>Real: ${formatTime(d.realTime)}</span>`;
        html += `<span>${d.mapName} | ${d.difficulty}</span>`;
        html += `</div>`;

        // MVP Tower
        if (d.mvp) {
            const towerDef = TOWERS[d.mvp.type];
            const pathName = d.mvp.path ? (d.mvp.path === 'A' ? towerDef.pathA.name : towerDef.pathB.name) : '';
            html += `<div class="pg-mvp">`;
            html += `<span class="pg-mvp-label">⭐ MVP TOWER</span>`;
            html += `<span class="pg-mvp-name">${towerDef.name} ${pathName} T${d.mvp.tier}</span>`;
            html += `<span class="pg-mvp-stats">${d.mvp.kills} kills | ${Math.floor(d.mvp.damage).toLocaleString()} dmg</span>`;
            html += `</div>`;
        }

        // Top towers table
        if (d.towerStats.length > 0) {
            html += `<div class="pg-towers-title">TOWER PERFORMANCE</div>`;
            html += `<div class="pg-towers">`;
            for (const t of d.towerStats.slice(0, 5)) {
                const tDef = TOWERS[t.type];
                const pct = d.towerStats[0].damage > 0 ? (t.damage / d.towerStats[0].damage * 100) : 0;
                html += `<div class="pg-tower-row">`;
                html += `<span class="pg-tower-name" style="color:${tDef.iconColor}">${tDef.nickname || tDef.name} T${t.tier}</span>`;
                html += `<span class="pg-tower-kills">${t.kills}k</span>`;
                html += `<div class="pg-tower-bar"><div class="pg-tower-fill" style="width:${pct}%;background:${tDef.iconColor}"></div></div>`;
                html += `<span class="pg-tower-dmg">${Math.floor(t.damage).toLocaleString()}</span>`;
                html += `</div>`;
            }
            html += `</div>`;
        }

        html += `</div>`;
        return html;
    }
};

// ===========================
// 13. NEW ENEMY BEHAVIORS
// ===========================
// Add to ENEMIES config
if (typeof ENEMIES !== 'undefined') {
    // Tunneler: Burrows underground, skipping a portion of the path
    ENEMIES.tunneler = {
        name: 'Tunneler', hp: 60, speed: 0.8, armor: 2, reward: 18, size: 11, color: '#8B6914',
        desc: 'Burrows underground to skip portions of the path',
        burrowDistance: 5, // path segments to skip
        burrowCooldown: 8.0,
        burrowDuration: 1.5,
        burrowColor: 'rgba(139, 105, 20, 0.3)',
    };

    // Mirror: Reflects a portion of damage back to the attacking tower
    ENEMIES.mirror = {
        name: 'Mirror Fiend', hp: 50, speed: 1.1, armor: 0, reward: 16, size: 10, color: '#C0C0FF',
        desc: 'Reflects 15% of damage taken back to the attacking tower',
        reflectPct: 0.15,
        reflectColor: '#E0E0FF',
    };

    // Sapper: Steals gold when it reaches the end instead of taking lives
    ENEMIES.sapper = {
        name: 'Sapper', hp: 35, speed: 1.6, armor: 0, reward: 8, size: 8, color: '#DAA520',
        desc: 'Steals gold instead of lives when reaching the end',
        goldSteal: 50,
        sapperColor: '#FFD700',
    };

    // Summoner: Periodically spawns mini enemies while alive
    ENEMIES.summoner = {
        name: 'Summoner', hp: 100, speed: 0.7, armor: 1, reward: 25, size: 13, color: '#9B30FF',
        desc: 'Periodically summons small minions while alive',
        summonInterval: 6.0,
        summonCount: 3,
        summonType: 'swarm',
        summonHpMult: 0.3,
        summonColor: '#BF5FFF',
    };
}

// Enhanced Enemy class methods for new enemy behaviors
const NewEnemyBehaviors = {
    // Call this from Enemy.update() for new types
    updateSpecialBehaviors(enemy, dt) {
        if (!enemy.alive) return;

        // Tunneler burrow behavior
        if (enemy.type === 'tunneler') {
            this._updateTunneler(enemy, dt);
        }

        // Summoner behavior
        if (enemy.type === 'summoner') {
            this._updateSummoner(enemy, dt);
        }

        // Mirror reflect visual
        if (enemy.type === 'mirror') {
            this._updateMirror(enemy, dt);
        }
    },

    _updateTunneler(enemy, dt) {
        if (!enemy._burrowCd) enemy._burrowCd = 3.0 + Math.random() * 2;
        if (enemy._burrowed) {
            enemy._burrowTimer -= dt;
            if (enemy._burrowTimer <= 0) {
                enemy._burrowed = false;
                enemy.invisible = false;
                Effects.spawnExplosion(enemy.x, enemy.y, '#8B6914', 8, { speed: 0.8 });
                Effects.addFloatingText(enemy.x, enemy.y - enemy.size - 10, 'EMERGE!', '#DAA520', 10);
            }
            return;
        }

        enemy._burrowCd -= dt;
        if (enemy._burrowCd <= 0) {
            // Burrow! Skip ahead on the path
            const def = ENEMIES.tunneler;
            const path = GameState.detailedPath;
            const skipDist = def.burrowDistance || 5;

            enemy._burrowed = true;
            enemy._burrowTimer = def.burrowDuration || 1.5;
            enemy.invisible = true;

            // Visual: dust cloud at entry
            Effects.spawnExplosion(enemy.x, enemy.y, '#8B6914', 10, { speed: 1.0, life: 0.5 });
            Effects.addFloatingText(enemy.x, enemy.y - enemy.size - 10, 'BURROW!', '#DAA520', 11);

            // Skip ahead
            const newIdx = Math.min(enemy.pathIndex + skipDist, path.length - 2);
            enemy.pathIndex = newIdx;
            enemy.progress = 0;
            if (path[newIdx]) {
                enemy.x = path[newIdx].x;
                enemy.y = path[newIdx].y;
                enemy.renderX = enemy.x;
                enemy.renderY = enemy.y;
            }

            enemy._burrowCd = def.burrowCooldown || 8.0;
        }
    },

    _updateSummoner(enemy, dt) {
        if (!enemy._summonCd) enemy._summonCd = 4.0 + Math.random() * 2;
        enemy._summonCd -= dt;
        if (enemy._summonCd <= 0) {
            const def = ENEMIES.summoner;
            const count = def.summonCount || 3;
            const type = def.summonType || 'swarm';
            const hpMult = def.summonHpMult || 0.3;

            for (let i = 0; i < count; i++) {
                const angle = (Math.PI * 2 / count) * i;
                const spawnPos = {
                    x: enemy.x + Math.cos(angle) * 12,
                    y: enemy.y + Math.sin(angle) * 12,
                };

                if (typeof WaveSystem !== 'undefined' && typeof WaveSystem.spawnEnemyFromEntry === 'function') {
                    WaveSystem.spawnEnemyFromEntry(
                        { type, hpMult, delay: 0, isElite: false },
                        {
                            pathIndex: Math.max(0, enemy.pathIndex - 1),
                            progress: enemy.progress,
                            position: spawnPos,
                            includeInWaveTotal: true,
                        }
                    );
                } else {
                    const minion = new Enemy(type, hpMult);
                    minion.pathIndex = Math.max(0, enemy.pathIndex - 1);
                    minion.progress = enemy.progress;
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

            Effects.spawnExplosion(enemy.x, enemy.y, '#9B30FF', 10, { speed: 0.8, life: 0.4 });
            Effects.addFloatingText(enemy.x, enemy.y - enemy.size - 10, 'SUMMON!', '#BF5FFF', 12);
            enemy._summonCd = def.summonInterval || 6.0;
        }
    },

    _updateMirror(enemy, dt) {
        // Visual shimmer effect
        if (!enemy._mirrorTimer) enemy._mirrorTimer = 0;
        enemy._mirrorTimer += dt;
    },

    // Called when a mirror enemy takes damage - reflects to tower
    onMirrorDamage(enemy, tower, damage) {
        if (enemy.type !== 'mirror' || !tower) return;
        const reflectPct = ENEMIES.mirror.reflectPct || 0.15;
        const reflected = damage * reflectPct;

        // Flash the tower to show reflected damage
        Effects.addFloatingText(tower.x, tower.y - 20, `REFLECT -${Math.floor(reflected)}`, '#C0C0FF', 9);
        Effects.spawnExplosion(tower.x, tower.y, '#C0C0FF', 4, { speed: 0.5, life: 0.2 });

        // Temporarily reduce tower effectiveness (simulating "damage")
        tower.damageDebuffTimer = Math.max(tower.damageDebuffTimer || 0, 1.0);
        tower.damageDebuffMult = Math.min(tower.damageDebuffMult || 1, 0.85);
    },

    // Called when sapper reaches the end - steal gold instead of lives
    onSapperLeak(enemy) {
        if (enemy.type !== 'sapper') return false;
        const steal = ENEMIES.sapper.goldSteal || 50;
        const actualSteal = Math.min(steal, GameState.gold);
        GameState.gold -= actualSteal;
        Effects.addFloatingText(
            logicalWidth / 2, logicalHeight / 2,
            `-${actualSteal} GOLD STOLEN!`, '#DAA520', 16
        );
        addScreenShake(3);
        return true; // consumed - don't take lives
    }
};

// ===========================
// 15. TOWER TIER 6 ULTIMATES
// ===========================
const TowerUltimates = {
    // Define Tier 6 "Ultimate" upgrades for each tower path
    definitions: {
        arrow: {
            A: {
                name: 'Deadeye',
                desc: 'Every 3rd shot is an auto-crit headshot dealing 8x damage. Execute enemies below 30% HP.',
                tier: { damage: 250, range: 260, fireRate: 0.35, cost: 600,
                    special: { critChance: 0.5, critMult: 8, armorPierce: 0.8, perfectShot: true, perfectShotEvery: 3, executeThreshold: 0.3 },
                },
            },
            B: {
                name: 'Arrow Storm',
                desc: '8 arrows per volley, all pierce 3. Arrow Rain every 5s: 40 arrows blanket the area.',
                tier: { damage: 22, range: 160, fireRate: 0.35, cost: 600,
                    special: { multishot: 8, pierce: 3, volleyStorm: true, volleyCd: 5, volleyArrows: 40, volleyDuration: 2 },
                },
            },
        },
        cannon: {
            A: {
                name: 'Doom Cannon',
                desc: 'Apocalyptic blasts with 8x center damage. Every 3rd shot is a Devastation Round that stuns.',
                tier: { damage: 900, range: 170, fireRate: 3.0, splash: 150, cost: 800,
                    special: { centerBonus: 8, centerRadius: 50, burnDPS: 40, burnDuration: 6, devastation: true, devEvery: 3, devBonusDmg: 600, devStun: 2 },
                },
            },
            B: {
                name: 'Carpet Bomber',
                desc: '8 cluster projectiles with 50% stagger. Barrage every 4s drops 25 bombs.',
                tier: { damage: 50, range: 140, fireRate: 0.8, splash: 55, cost: 800,
                    special: { multiShot: 8, staggerChance: 0.5, staggerSlow: 0.4, barrage: true, barrageCd: 4, barrageCount: 25, barrageDuration: 3 },
                },
            },
        },
        ice: {
            A: {
                name: 'Absolute Zero',
                desc: '60% freeze chance, chains to 5. Absolute Zero every 8s freezes ALL enemies for 4s.',
                tier: { damage: 50, range: 160, fireRate: 0.5, cost: 700,
                    special: { slow: 0.8, slowDuration: 4, freezeChance: 0.6, freezeDuration: 3, freezeVulnerable: 0.5, freezeChain: 5, shatterDmg: 100, absoluteZero: true, azCd: 8, azDuration: 4 },
                },
            },
            B: {
                name: 'Glacial Devastator',
                desc: 'Frozen enemies take 8x damage. Glacial Lance every 6s deals 500 true damage.',
                tier: { damage: 150, range: 140, fireRate: 0.5, cost: 700,
                    special: { slow: 0.4, slowDuration: 2.5, frozenDmgMult: 8, icePatch: true, brittleChance: 0.35, brittleVuln: 0.7, brittleDuration: 6, shatterDmg: 200, shatterRadius: 80, glacialLance: true, lanceCd: 6, lanceDmg: 500, canFreezeBoss: true },
                },
            },
        },
        lightning: {
            A: {
                name: 'Storm Lord',
                desc: 'Chains to 8 targets. Every 6s calls down a Lightning Storm that hits all enemies on screen.',
                tier: { damage: 80, range: 160, fireRate: 0.6, cost: 750,
                    special: { chains: 8, chainDecay: 0.8, stunChance: 0.3, stunDuration: 1.5, overload: true, overloadCd: 6, overloadDmg: 200, overloadRadius: 999 },
                },
            },
            B: {
                name: 'Plasma Conduit',
                desc: 'Permanent chain to 6 targets. Linked enemies take continuous 80 DPS and are slowed.',
                tier: { damage: 50, range: 140, fireRate: 0, cost: 750,
                    special: { teslaDome: true, domeDmgPerSec: 80, domeRadius: 140, domeMaxTargets: 6, domeSlowAmt: 0.3, domeChainDmg: true },
                },
            },
        },
    },

    canUpgradeToUltimate(tower) {
        if (tower.tier !== 5 || !tower.path) return false;
        const ultimate = this.definitions[tower.type];
        if (!ultimate) return false;
        return !!ultimate[tower.path];
    },

    getUltimateDef(towerType, path) {
        const ultimate = this.definitions[towerType];
        if (!ultimate) return null;
        return ultimate[path] || null;
    },

    getUpgradeCost(tower) {
        const def = this.getUltimateDef(tower.type, tower.path);
        if (!def || !def.tier) return Infinity;
        return def.tier.cost || 1000;
    },

    applyUltimate(tower) {
        const def = this.getUltimateDef(tower.type, tower.path);
        if (!def || !def.tier) return false;

        const cost = def.tier.cost;
        if (GameState.gold < cost) return false;

        // Store pre-upgrade stats for delta display
        const statsBefore = {
            damage: tower.damage,
            range: tower.range,
            fireRate: tower.fireRate,
        };

        GameState.gold -= cost;
        tower.tier = 6;
        tower.totalCost += cost;

        // Apply stats
        tower.damage = def.tier.damage;
        tower.range = def.tier.range;
        tower.fireRate = def.tier.fireRate;
        if (def.tier.splash) tower.splash = def.tier.splash;
        tower.special = def.tier.special || {};

        const statsAfter = {
            damage: tower.damage,
            range: tower.range,
            fireRate: tower.fireRate,
        };

        // Dramatic upgrade effect
        Effects.spawnExplosion(tower.x, tower.y, '#ffd700', 25, { speed: 2.0, life: 0.8 });
        Effects.spawnExplosion(tower.x, tower.y, '#ffffff', 15, { speed: 1.5, life: 0.6 });
        Effects.addFloatingText(tower.x, tower.y - 30, `ULTIMATE: ${def.name}`, '#ffd700', 16);
        addScreenShake(4);
        ScreenEffects.triggerSlowMotion(0.3, 0.8);
        GameState.screenFlash = { color: '#ffd700', alpha: 0.3, timer: 0.6 };

        EconomyVisibility.showUpgradeDelta(tower, statsBefore, statsAfter);

        // Track stats
        GameState.stats.maxTier = Math.max(GameState.stats.maxTier, 6);

        Audio.play('powerup');
        return true;
    }
};

// ===========================
// INTEGRATION HOOKS
// ===========================

// Hook into enemy die() — enhance with kill feedback
const _originalEnemyDie = Enemy.prototype.die;
Enemy.prototype.die = function() {
    _originalEnemyDie.call(this);
    // Kill feedback
    KillFeedback.onKill(this);

    // Gold gain visibility
    let reward = this.reward;
    if (this.isElite) reward = Math.floor(reward * 1.5);
    EconomyVisibility.showGoldGain(this.x, this.y, reward, 'kill');
};

// Hook into enemy update() for new behaviors
const _originalEnemyUpdate = Enemy.prototype.update;
Enemy.prototype.update = function(dt) {
    // Run new enemy behaviors before standard update
    NewEnemyBehaviors.updateSpecialBehaviors(this, dt);
    return _originalEnemyUpdate.call(this, dt);
};

// Hook into handleEnemyLeak for sapper behavior
const _originalHandleEnemyLeak = typeof handleEnemyLeak === 'function' ? handleEnemyLeak : null;
if (_originalHandleEnemyLeak) {
    window.handleEnemyLeak = function(enemy) {
        // Sapper steals gold instead of lives
        if (NewEnemyBehaviors.onSapperLeak(enemy)) {
            GameState.enemiesAlive--;
            return; // Don't take lives
        }
        _originalHandleEnemyLeak(enemy);
    };
}

// Hook into placeTower for placement preview
const _originalPlaceTower = typeof placeTower === 'function' ? placeTower : null;
if (_originalPlaceTower) {
    window.placeTower = function(type, worldX, worldY) {
        const tower = _originalPlaceTower(type, worldX, worldY);
        if (tower) {
            PlacementPreview.hide();
        }
        return tower;
    };
}

// Hook into takeDamage for mirror enemy
const _originalTakeDamage = Enemy.prototype.takeDamage;
Enemy.prototype.takeDamage = function(amount, source) {
    _originalTakeDamage.call(this, amount, source);
    // Mirror reflect
    if (this.type === 'mirror' && this.alive && source) {
        NewEnemyBehaviors.onMirrorDamage(this, source, amount);
    }
};

// Helper for rounded rectangles
function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

// ===========================
// MASTER UPDATE & DRAW
// ===========================
const JuiceFeatures = {
    update(dt) {
        KillFeedback.update(dt);
        PlacementPreview.update(dt);
        WavePacing.update(dt);
        EconomyVisibility.update(dt);
    },

    draw(ctx) {
        // Draw before UI layer
        PlacementPreview.draw(ctx);
        WavePacing.drawLastEnemySpotlight(ctx);

        // Draw after UI layer
        EconomyVisibility.drawFloatingGolds(ctx);
        EconomyVisibility.drawCantAffordFlash(ctx);
        KillFeedback.drawComboMeter(ctx);
        WavePacing.drawWaveCompletePopup(ctx);
    },

    onWaveStart(waveNum) {
        WavePacing.onWaveStart(waveNum);
    },

    onWaveComplete(waveNum) {
        WavePacing.onWaveComplete(waveNum);
    },

    reset() {
        KillFeedback.reset();
        PlacementPreview.hide();
        EconomyVisibility.floatingGolds = [];
        WavePacing.waveCompletePopupTimer = 0;
        WavePacing.lastEnemySpotlight = false;
        PostGameStats.data = null;
    },

    collectPostGameStats() {
        return PostGameStats.collect();
    },

    buildPostGameHTML(container, isVictory) {
        return PostGameStats.buildHTML(container, isVictory);
    }
};
