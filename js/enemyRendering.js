// ===== ENEMY RENDERING (COMPLETE REDESIGN - SCARY & IMPRESSIVE) =====
const EnemyRenderer = {
    // Animation cache for persistent per-enemy state
    _animCache: new WeakMap(),

    _getAnim(enemy) {
        let a = this._animCache.get(enemy);
        if (!a) {
            a = {
                deathPhase: 0,
                spawnPhase: 1,
                breathPhase: Math.random() * Math.PI * 2,
                flickerSeed: Math.random() * 1000,
                crackPattern: this._genCracks(),
                bossIntroTimer: 0,
            };
            this._animCache.set(enemy, a);
        }
        return a;
    },

    _genCracks() {
        const cracks = [];
        for (let i = 0; i < 5; i++) {
            const a = Math.random() * Math.PI * 2;
            const segs = [];
            let cx = 0, cy = 0;
            for (let j = 0; j < 3; j++) {
                const da = a + (Math.random() - 0.5) * 1.2;
                const len = 0.15 + Math.random() * 0.25;
                cx += Math.cos(da) * len;
                cy += Math.sin(da) * len;
                segs.push({ x: cx, y: cy });
            }
            cracks.push(segs);
        }
        return cracks;
    },

    _getCaptainAuraStyle(profileId, fallbackColor) {
        const color = fallbackColor || '#ffbe70';
        switch (profileId) {
            case 'veil_ambusher':
                return {
                    id: 'veil_ambusher',
                    auraColor: '#c690ff',
                    accentColor: '#e5c5ff',
                    label: 'AMBUSH CAPTAIN',
                    labelColor: '#f0dfff',
                };
            case 'blight_matron':
                return {
                    id: 'blight_matron',
                    auraColor: '#9ee08a',
                    accentColor: '#d8ffc6',
                    label: 'MATRON CAPTAIN',
                    labelColor: '#e7ffd7',
                };
            default:
                return {
                    id: 'default',
                    auraColor: color,
                    accentColor: '#ffdca1',
                    label: 'CAPTAIN',
                    labelColor: '#ffdca1',
                };
        }
    },

    _drawCaptainTelegraph(ctx, enemy, x, y, size, t, anim) {
        const style = this._getCaptainAuraStyle(enemy.captainProfileId, enemy.captainAuraColor);
        const pulse = 0.7 + Math.sin(t * 7 + anim.flickerSeed) * 0.2;
        const auraR = (enemy.captainAuraRadius || 160) * (0.96 + pulse * 0.04);

        ctx.save();

        if (style.id === 'veil_ambusher') {
            ctx.strokeStyle = colorAlpha(style.auraColor, 0.35);
            ctx.lineWidth = 2;
            ctx.setLineDash([8, 6]);
            ctx.lineDashOffset = -t * 28;
            ctx.beginPath();
            ctx.arc(x, y, auraR, 0, Math.PI * 2);
            ctx.stroke();

            ctx.setLineDash([]);
            ctx.strokeStyle = colorAlpha(style.accentColor, 0.45);
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(x, y, auraR * 0.86, t * 2.4, t * 2.4 + Math.PI * 0.9);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(x, y, auraR * 0.86, t * 2.4 + Math.PI, t * 2.4 + Math.PI * 1.9);
            ctx.stroke();

            // Directional ambush chevrons.
            ctx.strokeStyle = style.accentColor;
            ctx.lineWidth = 1.5;
            for (let i = 0; i < 3; i++) {
                const a = t * 1.8 + i * (Math.PI * 2 / 3);
                const cx = x + Math.cos(a) * (auraR + 8);
                const cy = y + Math.sin(a) * (auraR + 8);
                const nx = Math.cos(a);
                const ny = Math.sin(a);
                const tx = -ny;
                const ty = nx;
                ctx.beginPath();
                ctx.moveTo(cx - tx * 4 - nx * 2, cy - ty * 4 - ny * 2);
                ctx.lineTo(cx, cy);
                ctx.lineTo(cx + tx * 4 - nx * 2, cy + ty * 4 - ny * 2);
                ctx.stroke();
            }
        } else if (style.id === 'blight_matron') {
            const ripple = 1 + Math.sin(t * 2.2 + anim.flickerSeed) * 0.03;
            const outer = auraR * ripple;
            const inner = auraR * 0.84;

            ctx.strokeStyle = colorAlpha(style.auraColor, 0.28);
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.arc(x, y, outer, 0, Math.PI * 2);
            ctx.stroke();

            ctx.strokeStyle = colorAlpha(style.accentColor, 0.45);
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.arc(x, y, inner, 0, Math.PI * 2);
            ctx.stroke();

            // Healer-chain glyphs around the ring.
            ctx.strokeStyle = colorAlpha(style.accentColor, 0.75);
            ctx.lineWidth = 1.4;
            for (let i = 0; i < 6; i++) {
                const a = t * 1.2 + i * (Math.PI * 2 / 6);
                const gx = x + Math.cos(a) * (inner + 6);
                const gy = y + Math.sin(a) * (inner + 6);
                ctx.beginPath();
                ctx.moveTo(gx - 3, gy);
                ctx.lineTo(gx + 3, gy);
                ctx.moveTo(gx, gy - 3);
                ctx.lineTo(gx, gy + 3);
                ctx.stroke();
            }
        } else {
            ctx.strokeStyle = colorAlpha(style.auraColor, 0.22);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, auraR, 0, Math.PI * 2);
            ctx.stroke();
        }

        const ly = y - size - 30;
        ctx.font = 'bold 8px "Share Tech Mono"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = style.labelColor;
        ctx.fillText(style.label, x, ly);

        // Captain crest, varied by captain role.
        ctx.strokeStyle = style.labelColor;
        ctx.lineWidth = 1.6;
        if (style.id === 'veil_ambusher') {
            ctx.beginPath();
            ctx.moveTo(x - 8, ly + 5);
            ctx.lineTo(x - 2, ly - 3);
            ctx.lineTo(x + 2, ly + 5);
            ctx.lineTo(x + 8, ly - 3);
            ctx.stroke();
        } else if (style.id === 'blight_matron') {
            ctx.beginPath();
            ctx.moveTo(x - 6, ly + 4);
            ctx.lineTo(x + 6, ly + 4);
            ctx.moveTo(x, ly - 2);
            ctx.lineTo(x, ly + 10);
            ctx.stroke();
        } else {
            ctx.beginPath();
            ctx.moveTo(x - 7, ly + 5);
            ctx.lineTo(x - 2, ly - 1);
            ctx.lineTo(x + 2, ly + 5);
            ctx.lineTo(x + 7, ly - 1);
            ctx.stroke();
        }

        ctx.restore();
    },

    _drawCommandedTelegraph(ctx, enemy, x, y, size, t) {
        const style = this._getCaptainAuraStyle(enemy.captainAuraProfileId, enemy.captainAuraColor);

        ctx.save();
        if (style.id === 'veil_ambusher') {
            ctx.strokeStyle = colorAlpha(style.auraColor, 0.55);
            ctx.lineWidth = 1.4;
            ctx.setLineDash([4, 3]);
            ctx.lineDashOffset = -t * 18;
            ctx.beginPath();
            ctx.arc(x, y, size + 5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 1.85);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.strokeStyle = colorAlpha(style.accentColor, 0.6);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(x, y, size + 8, t * 1.6, t * 1.6 + Math.PI * 0.55);
            ctx.stroke();
        } else if (style.id === 'blight_matron') {
            const pulse = 0.78 + Math.sin(t * 5) * 0.14;
            ctx.strokeStyle = colorAlpha(style.auraColor, 0.55);
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(x, y, (size + 5) * pulse, 0, Math.PI * 2);
            ctx.stroke();

            ctx.strokeStyle = colorAlpha(style.accentColor, 0.75);
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(x - 2.5, y);
            ctx.lineTo(x + 2.5, y);
            ctx.moveTo(x, y - 2.5);
            ctx.lineTo(x, y + 2.5);
            ctx.stroke();
        } else {
            ctx.strokeStyle = colorAlpha(style.auraColor, 0.45);
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.arc(x, y, size + 5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 1.8);
            ctx.stroke();
        }
        ctx.restore();
    },

    draw(ctx, enemy) {
        if (!enemy.alive) return;

        const x = enemy.x;
        const y = enemy.y;
        const size = enemy.size;
        const t = GameState.time;
        const anim = this._getAnim(enemy);

        // Invisibility - only faint shimmer
        if (enemy.invisible && !(GameState.researchBonuses.omniscience)) {
            ctx.save();
            ctx.globalAlpha = 0.12 + Math.sin(t * 8 + anim.flickerSeed) * 0.04;
            this._drawEnemyBody(ctx, enemy, x, y, size, t, anim);
            ctx.restore();
            return;
        }

        ctx.save();

        // Freeze visual
        if (enemy.frozen) {
            ctx.globalAlpha = 0.8;
        }

        // Hit flash
        if (enemy.hitFlash > 0) {
            ctx.globalAlpha = 0.7 + enemy.hitFlash * 0.3;
        }

        // === ELITE GLOW OUTLINE ===
        if (enemy.isElite && enemy.eliteVariant) {
            const glowColor = enemy.eliteVariant.color || '#ffaa00';
            const pulse = Math.sin(t * 4 + anim.flickerSeed) * 0.3 + 0.7;
            ctx.save();
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 10 + pulse * 6;
            ctx.strokeStyle = colorAlpha(glowColor, 0.6 + pulse * 0.3);
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(x, y, size + 3, 0, Math.PI * 2);
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Elite modifier icon above
            const iconY = y - size - 14;
            ctx.fillStyle = glowColor;
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 4;
            ctx.font = 'bold 7px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const prefix = enemy.eliteVariant.prefix || '?';
            ctx.fillText(prefix[0], x, iconY);
            // small diamond behind
            ctx.fillStyle = colorAlpha(glowColor, 0.25);
            ctx.beginPath();
            ctx.moveTo(x, iconY - 5);
            ctx.lineTo(x + 5, iconY);
            ctx.lineTo(x, iconY + 5);
            ctx.lineTo(x - 5, iconY);
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.restore();
        }

        // === BONUS OBJECTIVE TARGET MARKER ===
        if (enemy.isObjectiveTarget) {
            const pulse = 0.6 + Math.sin(t * 8 + anim.flickerSeed) * 0.3;
            const ringR = size + 8 + pulse * 2;

            ctx.save();
            ctx.strokeStyle = colorAlpha('#ffd580', 0.75);
            ctx.lineWidth = 2;
            ctx.shadowColor = '#ffcf6a';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(x, y, ringR, t * 1.6, t * 1.6 + Math.PI * 1.2);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(x, y, ringR, t * 1.6 + Math.PI, t * 1.6 + Math.PI * 2.2);
            ctx.stroke();

            const ty = y - size - 22;
            ctx.shadowBlur = 0;
            ctx.font = 'bold 8px "Share Tech Mono"';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#ffe19b';
            ctx.fillText('TARGET', x, ty);

            ctx.fillStyle = colorAlpha('#ffe19b', 0.25);
            ctx.beginPath();
            ctx.moveTo(x, ty - 6);
            ctx.lineTo(x + 6, ty);
            ctx.lineTo(x, ty + 6);
            ctx.lineTo(x - 6, ty);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }

        // === CAPTAIN MARKER / COMMAND AURA ===
        if (enemy.isCaptain) {
            this._drawCaptainTelegraph(ctx, enemy, x, y, size, t, anim);
        } else if (enemy.captainAuraActive) {
            // Allied unit currently under command aura.
            this._drawCommandedTelegraph(ctx, enemy, x, y, size, t);
        }

        // === DIFFICULTY-SPECIFIC PRE-BODY EFFECTS ===
        const diffTheme = this._getDifficultyTheme();
        const diffGroup = Math.floor(GameState.mapIndex / 5);

        if (diffGroup === 2) {
            // HARD: Ember/smoke particles trailing behind enemies
            ctx.save();
            for (let i = 0; i < 4; i++) {
                const age = ((t * 2 + i * 0.7 + anim.flickerSeed) % 3) / 3;
                const px = x - (enemy.dx || 0) * age * 20 + (Math.sin(t * 3 + i * 2.1) * 3);
                const py = y - (enemy.dy || 0) * age * 20 - age * 8;
                const pAlpha = (1 - age) * 0.5;
                const pSize = 1.5 + age * 3;
                ctx.globalAlpha = pAlpha;
                ctx.fillStyle = i % 2 === 0 ? diffTheme.particleColor : '#ff8020';
                ctx.beginPath();
                ctx.arc(px, py, pSize, 0, Math.PI * 2);
                ctx.fill();
            }
            // Subtle red glow around enemy
            ctx.globalAlpha = 0.2 + Math.sin(t * 4 + anim.flickerSeed) * 0.08;
            ctx.shadowColor = diffTheme.glowColor;
            ctx.shadowBlur = 12;
            ctx.fillStyle = colorAlpha(diffTheme.glowColor, 0.06);
            ctx.beginPath();
            ctx.arc(x, y, size + 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.restore();
        }

        if (diffGroup >= 3) {
            // NIGHTMARE: Purple void aura beneath the enemy
            ctx.save();
            const auraPulse = Math.sin(t * 3 + anim.flickerSeed) * 0.2 + 0.8;
            ctx.globalAlpha = 0.25 * auraPulse;
            const auraGrad = ctx.createRadialGradient(x, y, size * 0.3, x, y, size + diffTheme.auraSize + 6);
            auraGrad.addColorStop(0, colorAlpha(diffTheme.glowColor, 0.4));
            auraGrad.addColorStop(0.6, colorAlpha(diffTheme.glowColor, 0.15));
            auraGrad.addColorStop(1, colorAlpha(diffTheme.glowColor, 0));
            ctx.fillStyle = auraGrad;
            ctx.beginPath();
            ctx.arc(x, y, size + diffTheme.auraSize + 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // NIGHTMARE: Void particle trails (purple sparkles)
            ctx.save();
            for (let i = 0; i < 6; i++) {
                const age = ((t * 1.5 + i * 0.5 + anim.flickerSeed) % 2.5) / 2.5;
                const spread = Math.sin(t * 2 + i * 1.3) * 5;
                const px = x - (enemy.dx || 0) * age * 25 + spread;
                const py = y - (enemy.dy || 0) * age * 25 + Math.cos(t * 3 + i) * 3;
                const pAlpha = (1 - age) * 0.6;
                const pSize = 1 + (1 - age) * 2;
                ctx.globalAlpha = pAlpha;
                ctx.fillStyle = diffTheme.particleColor;
                ctx.beginPath();
                ctx.arc(px, py, pSize, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();

            // NIGHTMARE: Afterimage trail
            ctx.save();
            for (let i = 1; i <= 3; i++) {
                const trailX = x - (enemy.dx || 0) * i * 4;
                const trailY = y - (enemy.dy || 0) * i * 4;
                ctx.globalAlpha = 0.12 - i * 0.03;
                ctx.fillStyle = diffTheme.glowColor;
                ctx.beginPath();
                ctx.arc(trailX, trailY, size * (1 - i * 0.05), 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();

            // NIGHTMARE: Reality-warp scale distortion
            const warpAmount = Math.sin(t * 7 + anim.flickerSeed) * 0.06;
            const warpX = 1 + warpAmount;
            const warpY = 1 - warpAmount;
            ctx.save();
            ctx.translate(x, y);
            ctx.scale(warpX, warpY);
            ctx.translate(-x, -y);
        }

        // Draw body
        this._drawEnemyBody(ctx, enemy, x, y, size, t, anim);

        // Restore warp transform for nightmare
        if (diffGroup >= 3) {
            ctx.restore();
        }

        // === DIFFICULTY-SPECIFIC POST-BODY OVERLAYS ===
        if (diffGroup === 1) {
            // NORMAL: Battle scars (small dark lines across the body)
            ctx.save();
            ctx.globalAlpha = 0.35;
            ctx.strokeStyle = '#2a1a00';
            ctx.lineWidth = 0.8;
            ctx.lineCap = 'round';
            const scarSeed = anim.flickerSeed;
            for (let i = 0; i < 3; i++) {
                const scarAngle = scarSeed * 3.7 + i * 2.1;
                const scarLen = size * 0.35;
                const sx = x + Math.cos(scarAngle + 1) * size * 0.2;
                const sy = y + Math.sin(scarAngle + 1) * size * 0.2;
                ctx.beginPath();
                ctx.moveTo(sx - Math.cos(scarAngle) * scarLen * 0.5, sy - Math.sin(scarAngle) * scarLen * 0.5);
                ctx.lineTo(sx + Math.cos(scarAngle) * scarLen * 0.5, sy + Math.sin(scarAngle) * scarLen * 0.5);
                ctx.stroke();
            }

            // NORMAL: Subtle golden sheen highlight
            ctx.globalAlpha = 0.12 + Math.sin(t * 2 + anim.flickerSeed) * 0.05;
            const sheenGrad = ctx.createLinearGradient(x - size, y - size, x + size, y + size);
            sheenGrad.addColorStop(0, 'rgba(255, 215, 0, 0)');
            sheenGrad.addColorStop(0.4 + Math.sin(t * 1.5) * 0.1, 'rgba(255, 215, 0, 0.4)');
            sheenGrad.addColorStop(1, 'rgba(255, 215, 0, 0)');
            ctx.fillStyle = sheenGrad;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        if (diffGroup === 2) {
            // HARD: Fire cracks (glowing red lines on the body)
            ctx.save();
            ctx.globalAlpha = 0.6 + Math.sin(t * 5 + anim.flickerSeed) * 0.2;
            ctx.strokeStyle = diffTheme.glowColor;
            ctx.shadowColor = diffTheme.glowColor;
            ctx.shadowBlur = 4;
            ctx.lineWidth = 1;
            ctx.lineCap = 'round';
            const cracks = anim.crackPattern;
            for (let i = 0; i < Math.min(cracks.length, 3); i++) {
                const segs = cracks[i];
                ctx.beginPath();
                ctx.moveTo(x, y);
                for (const seg of segs) {
                    ctx.lineTo(x + seg.x * size, y + seg.y * size);
                }
                ctx.stroke();
            }
            ctx.shadowBlur = 0;

            // HARD: Heat shimmer effect
            ctx.globalAlpha = 0.06;
            ctx.fillStyle = '#ff6020';
            for (let i = 0; i < 3; i++) {
                const shimmerY = y - size - 3 - i * 3;
                const shimmerX = x + Math.sin(t * 6 + i * 2 + anim.flickerSeed) * 3;
                ctx.beginPath();
                ctx.ellipse(shimmerX, shimmerY, size * 0.5, 1.5, 0, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        if (diffGroup >= 3) {
            // NIGHTMARE: Void energy crackling (purple lightning arcs)
            ctx.save();
            const arcCount = 2 + Math.floor(Math.sin(t * 3) + 1);
            ctx.strokeStyle = diffTheme.glowColor;
            ctx.shadowColor = diffTheme.glowColor;
            ctx.shadowBlur = 6;
            ctx.lineWidth = 0.8;
            ctx.globalAlpha = 0.5 + Math.sin(t * 8 + anim.flickerSeed) * 0.3;
            for (let i = 0; i < arcCount; i++) {
                const arcAngle = t * 4 + i * (Math.PI * 2 / arcCount) + anim.flickerSeed;
                const arcR = size + 2;
                ctx.beginPath();
                let ax = x + Math.cos(arcAngle) * arcR;
                let ay = y + Math.sin(arcAngle) * arcR;
                ctx.moveTo(ax, ay);
                for (let j = 0; j < 3; j++) {
                    ax += (Math.random() - 0.5) * 8;
                    ay += (Math.random() - 0.5) * 8;
                    ctx.lineTo(ax, ay);
                }
                ctx.stroke();
            }
            ctx.shadowBlur = 0;

            // NIGHTMARE: Intensely glowing eyes with trailing effect
            ctx.globalAlpha = 0.7 + Math.sin(t * 6) * 0.3;
            ctx.shadowColor = diffTheme.eyeColor;
            ctx.shadowBlur = 10;
            ctx.fillStyle = diffTheme.eyeColor;
            const eyeSpread = size * 0.25;
            const eyeY = y - size * 0.15;
            ctx.beginPath();
            ctx.arc(x - eyeSpread, eyeY, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x + eyeSpread, eyeY, 2, 0, Math.PI * 2);
            ctx.fill();
            // Eye trails
            ctx.globalAlpha = 0.2;
            for (let i = 1; i <= 3; i++) {
                const trailOff = i * 2;
                ctx.beginPath();
                ctx.arc(x - eyeSpread - trailOff * (enemy.dx || 0) * 0.3, eyeY - trailOff * (enemy.dy || 0) * 0.3, 1.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(x + eyeSpread - trailOff * (enemy.dx || 0) * 0.3, eyeY - trailOff * (enemy.dy || 0) * 0.3, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.shadowBlur = 0;

            // NIGHTMARE: Occasional glitch/flicker effect
            const glitchPhase = Math.sin(t * 11 + anim.flickerSeed * 7);
            if (glitchPhase > 0.85) {
                ctx.globalAlpha = 0.3;
                ctx.fillStyle = diffTheme.glowColor;
                const glitchOffX = (Math.sin(t * 37) * 4);
                const glitchOffY = (Math.cos(t * 29) * 2);
                ctx.beginPath();
                ctx.rect(x - size + glitchOffX, y - size * 0.3 + glitchOffY, size * 2, size * 0.2);
                ctx.fill();
            }
            ctx.restore();
        }

        // === STATUS EFFECT OVERLAYS ===
        this._drawStatusEffects(ctx, enemy, x, y, size, t);

        // HP bar (toggle-able)
        if (GameState.settings.showHealthBars !== false) {
            this._drawHPBar(ctx, enemy, x, y, size);
        }

        ctx.restore();
    },

    // ===== STATUS EFFECTS (redesigned to be clearly visible) =====
    _drawStatusEffects(ctx, enemy, x, y, size, t) {
        // Shield visual - energy barrier bubble
        if (enemy.shielded && enemy.shieldHp > 0) {
            const shieldPulse = Math.sin(t * 5) * 0.15 + 0.85;
            ctx.save();
            ctx.strokeStyle = '#4090ff';
            ctx.lineWidth = 2;
            ctx.shadowColor = '#4090ff';
            ctx.shadowBlur = 8;
            // Hexagonal shield segments
            for (let i = 0; i < 6; i++) {
                const a1 = (Math.PI * 2 / 6) * i + t * 0.5;
                const a2 = (Math.PI * 2 / 6) * (i + 1) + t * 0.5;
                const r = (size + 5) * shieldPulse;
                ctx.beginPath();
                ctx.moveTo(x + Math.cos(a1) * r, y + Math.sin(a1) * r);
                ctx.lineTo(x + Math.cos(a2) * r, y + Math.sin(a2) * r);
                ctx.stroke();
            }
            // Inner glow
            ctx.fillStyle = colorAlpha('#4090ff', 0.08 + Math.sin(t * 6) * 0.03);
            ctx.beginPath();
            ctx.arc(x, y, (size + 5) * shieldPulse, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.restore();
        }

        // Frozen overlay - ice crystals
        if (enemy.frozen) {
            ctx.save();
            ctx.fillStyle = 'rgba(140, 220, 255, 0.3)';
            ctx.beginPath();
            ctx.arc(x, y, size + 2, 0, Math.PI * 2);
            ctx.fill();

            // Ice crystal spikes
            ctx.strokeStyle = '#b0f0ff';
            ctx.fillStyle = colorAlpha('#d0f8ff', 0.5);
            ctx.lineWidth = 1.2;
            ctx.shadowColor = '#80e0ff';
            ctx.shadowBlur = 4;
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i + t * 0.3;
                const cr = size + 2;
                const cx = x + Math.cos(angle) * cr;
                const cy = y + Math.sin(angle) * cr;
                // Draw crystal shard
                ctx.beginPath();
                ctx.moveTo(cx + Math.cos(angle) * 5, cy + Math.sin(angle) * 5);
                ctx.lineTo(cx + Math.cos(angle + 0.4) * 2, cy + Math.sin(angle + 0.4) * 2);
                ctx.lineTo(cx + Math.cos(angle - 0.4) * 2, cy + Math.sin(angle - 0.4) * 2);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            }
            // Frost shimmer particles
            ctx.fillStyle = '#d0f8ff';
            for (let i = 0; i < 4; i++) {
                const fa = t * 2 + i * 1.5;
                const fr = size * 0.6;
                ctx.globalAlpha = 0.3 + Math.sin(fa) * 0.2;
                ctx.beginPath();
                ctx.arc(x + Math.cos(fa) * fr, y + Math.sin(fa) * fr, 1, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;
            ctx.restore();
        }

        // Stunned overlay - spinning stars
        if (enemy.stunned) {
            ctx.save();
            ctx.shadowColor = '#ffe040';
            ctx.shadowBlur = 3;
            for (let i = 0; i < 4; i++) {
                const angle = (Math.PI * 2 / 4) * i + t * 5;
                const sr = size + 7;
                const sx = x + Math.cos(angle) * sr;
                const sy = y - size * 0.6 + Math.sin(angle) * 4;
                ctx.fillStyle = '#ffe040';
                // Draw proper star shape
                ctx.beginPath();
                for (let p = 0; p < 5; p++) {
                    const sa = (Math.PI * 2 / 5) * p - Math.PI / 2 + t * 3;
                    const outer = 2.5;
                    const inner = 1;
                    ctx.lineTo(sx + Math.cos(sa) * outer, sy + Math.sin(sa) * outer);
                    const sa2 = sa + Math.PI / 5;
                    ctx.lineTo(sx + Math.cos(sa2) * inner, sy + Math.sin(sa2) * inner);
                }
                ctx.closePath();
                ctx.fill();
            }
            ctx.shadowBlur = 0;
            ctx.restore();
        }

        // Burn effect - fire particles rising
        if (enemy.burning) {
            if (Math.random() < 0.3) {
                const fAngle = rand(-0.5, 0.5);
                Effects.spawnFireTrail(
                    x + rand(-size * 0.8, size * 0.8),
                    y + rand(-size * 0.5, size * 0.5)
                );
            }
            // Fire glow overlay
            ctx.save();
            const fireAlpha = 0.08 + Math.sin(t * 10) * 0.04;
            ctx.fillStyle = colorAlpha('#ff4010', fireAlpha);
            ctx.beginPath();
            ctx.arc(x, y, size + 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Poisoned overlay - green drip effect
        if (enemy.poisoned) {
            ctx.save();
            const poisonAlpha = 0.12 + Math.sin(t * 6) * 0.05;
            ctx.fillStyle = colorAlpha('#40c040', poisonAlpha);
            ctx.beginPath();
            ctx.arc(x, y, size + 1, 0, Math.PI * 2);
            ctx.fill();
            // Poison drip particles
            if (Math.random() < 0.08 * (enemy.poisonStacks || 1)) {
                GameState.particles.push(new Particle(
                    x + rand(-size * 0.5, size * 0.5), y + size * 0.3,
                    { vx: 0, vy: rand(0.5, 1.5), life: 0.3, size: 1.5, color: '#40c040', glow: true }
                ));
            }
            ctx.restore();
        }

        // Slowed overlay - blue tint with slow particles
        if (enemy.slow > 0 && !enemy.frozen) {
            ctx.save();
            ctx.fillStyle = colorAlpha('#60d0e0', 0.1);
            ctx.beginPath();
            ctx.arc(x, y, size + 1, 0, Math.PI * 2);
            ctx.fill();
            // Floating slow particles (ice motes drifting down)
            if (Math.random() < 0.06) {
                GameState.particles.push(new Particle(
                    x + rand(-size, size), y - size * 0.5,
                    { vx: rand(-0.3, 0.3), vy: rand(0.3, 0.8), life: 0.5, size: 1.5, color: '#80e0ff', glow: true }
                ));
            }
            ctx.restore();
        }

        // Mark indicator - target reticle
        if (enemy.marked) {
            ctx.save();
            const markR = size + 7;
            const markRot = t * 2;
            ctx.strokeStyle = '#ff6040';
            ctx.lineWidth = 1.5;
            ctx.shadowColor = '#ff4020';
            ctx.shadowBlur = 3;
            // Outer rotating ring segments
            for (let i = 0; i < 4; i++) {
                const a = markRot + (Math.PI / 2) * i;
                ctx.beginPath();
                ctx.arc(x, y, markR, a, a + 0.8);
                ctx.stroke();
            }
            // Crosshair lines
            ctx.lineWidth = 1;
            const cross = markR + 3;
            for (let i = 0; i < 4; i++) {
                const a = (Math.PI / 2) * i;
                ctx.beginPath();
                ctx.moveTo(x + Math.cos(a) * (markR - 3), y + Math.sin(a) * (markR - 3));
                ctx.lineTo(x + Math.cos(a) * cross, y + Math.sin(a) * cross);
                ctx.stroke();
            }
            // Center dot
            ctx.fillStyle = '#ff6040';
            ctx.beginPath();
            ctx.arc(x, y, 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.restore();
        }

        // Brittle - crack overlay
        if (enemy.brittle) {
            ctx.save();
            ctx.strokeStyle = '#a0c0ff';
            ctx.lineWidth = 1;
            ctx.shadowColor = '#80a0ff';
            ctx.shadowBlur = 2;
            const anim = this._getAnim(enemy);
            for (const crack of anim.crackPattern) {
                ctx.beginPath();
                ctx.moveTo(x, y);
                for (const seg of crack) {
                    ctx.lineTo(x + seg.x * size, y + seg.y * size);
                }
                ctx.stroke();
            }
            ctx.shadowBlur = 0;
            ctx.restore();
        }

        // Regenerating visual
        if (enemy.regenRate > 0) {
            if (Math.random() < 0.05) {
                GameState.particles.push(new Particle(
                    x + rand(-size, size), y + rand(-size, size),
                    { vx: 0, vy: rand(-1.2, -0.3), life: 0.4, size: 1.5, color: '#44ff44', glow: true }
                ));
            }
        }

        // Fortified visual
        if (enemy.fortified) {
            ctx.save();
            ctx.strokeStyle = colorAlpha('#888888', 0.4 + Math.sin(t * 3) * 0.1);
            ctx.lineWidth = 2;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.arc(x, y, size + 4, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();
        }

        // Frenzy visual
        if (enemy.frenzy) {
            ctx.save();
            const frenzyPulse = Math.sin(t * 8) * 0.1 + 0.15;
            ctx.fillStyle = colorAlpha('#ff2200', frenzyPulse);
            ctx.beginPath();
            ctx.arc(x, y, size + 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Boss shield indicator
        if (enemy.bossShieldActive && enemy.bossShieldHp > 0) {
            ctx.save();
            const bsPulse = Math.sin(t * 4) * 0.15 + 0.85;
            const bsSize = (enemy.type === 'boss' ? size * 1.5 : size) + 10;
            ctx.strokeStyle = colorAlpha('#ffaa20', 0.6);
            ctx.lineWidth = 3;
            ctx.shadowColor = '#ffaa20';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(x, y, bsSize * bsPulse, 0, Math.PI * 2);
            ctx.stroke();
            // Shield HP percentage arc
            const shieldPct = enemy.bossShieldHp / enemy.bossShieldMaxHp;
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, bsSize * bsPulse + 3, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * shieldPct);
            ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.restore();
        }
    },

    // ===== DIFFICULTY THEME =====
    _getDifficultyTheme() {
        const diffGroup = Math.floor(GameState.mapIndex / 5);
        switch(diffGroup) {
            case 0: return { // EASY - soft, organic, green tints
                glowColor: '#40e080', eyeColor: '#60ff60', particleColor: '#80ffa0',
                bodyTint: 0, shadowIntensity: 0.15, auraSize: 0
            };
            case 1: return { // NORMAL - battle-worn, golden/brown tints
                glowColor: '#e0c040', eyeColor: '#ffcc00', particleColor: '#ffd060',
                bodyTint: 1, shadowIntensity: 0.25, auraSize: 0
            };
            case 2: return { // HARD - fiery, red/orange, smoke trails
                glowColor: '#ff4020', eyeColor: '#ff2000', particleColor: '#ff6030',
                bodyTint: 2, shadowIntensity: 0.35, auraSize: 3
            };
            case 3: return { // NIGHTMARE - void/purple, reality-warping
                glowColor: '#c020e0', eyeColor: '#ff00ff', particleColor: '#d040ff',
                bodyTint: 3, shadowIntensity: 0.45, auraSize: 6
            };
        }
        return { glowColor: '#fff', eyeColor: '#ff0000', particleColor: '#fff', bodyTint: 0, shadowIntensity: 0.2, auraSize: 0 };
    },

    _drawEnemyBody(ctx, enemy, x, y, size, t, anim) {
        // Boss enemies use isBoss flag or 'boss' type
        if (enemy.isBoss || enemy.type === 'boss') {
            this._drawBoss(ctx, enemy, x, y, size, t, anim);
            return;
        }
        switch (enemy.type) {
            case 'basic':
                this._drawBasic(ctx, enemy, x, y, size, t, anim);
                break;
            case 'fast':
                this._drawFast(ctx, enemy, x, y, size, t, anim);
                break;
            case 'heavy':
                this._drawHeavy(ctx, enemy, x, y, size, t, anim);
                break;
            case 'healer':
                this._drawHealer(ctx, enemy, x, y, size, t, anim);
                break;
            case 'shield':
                this._drawShield(ctx, enemy, x, y, size, t, anim);
                break;
            case 'disruptor':
                this._drawDisruptor(ctx, enemy, x, y, size, t, anim);
                break;
            case 'toxic':
                this._drawToxic(ctx, enemy, x, y, size, t, anim);
                break;
            case 'swarm':
                this._drawSwarm(ctx, enemy, x, y, size, t, anim);
                break;
            case 'stealth':
                this._drawStealth(ctx, enemy, x, y, size, t, anim);
                break;
            case 'splitter':
                this._drawSplitter(ctx, enemy, x, y, size, t, anim);
                break;
            case 'ghost':
                this._drawGhost(ctx, enemy, x, y, size, t, anim);
                break;
            case 'berserker':
                this._drawBerserker(ctx, enemy, x, y, size, t, anim);
                break;
            case 'swarmfast':
                this._drawSwarmfast(ctx, enemy, x, y, size, t, anim);
                break;
            case 'tunneler':
                this._drawTunneler(ctx, enemy, x, y, size, t, anim);
                break;
            case 'mirror':
                this._drawMirror(ctx, enemy, x, y, size, t, anim);
                break;
            case 'sapper':
                this._drawSapper(ctx, enemy, x, y, size, t, anim);
                break;
            case 'summoner':
                this._drawSummoner(ctx, enemy, x, y, size, t, anim);
                break;
            default:
                // Fallback: draw as basic
                this._drawBasic(ctx, enemy, x, y, size, t, anim);
                break;
        }
    },

    // ============================================================
    // ===== BASIC (Grunt) - Armored demon footsoldier ==========
    // ============================================================
    _drawBasic(ctx, enemy, x, y, size, t, anim) {
        const bob = Math.sin(t * 6 + enemy.bobOffset) * 1.5;
        const legSwing = Math.sin(t * 8 + enemy.bobOffset) * 0.35;
        const breathe = Math.sin(t * 3 + anim.breathPhase) * 0.04 + 1.0;
        const s = size * breathe;

        ctx.save();
        ctx.translate(x, y + bob * 0.3);

        // Ground shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(0, s + 3, s * 0.7, 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Legs (armored, animated march)
        ctx.strokeStyle = brighten(enemy.color, -40);
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        // Left leg
        ctx.beginPath();
        ctx.moveTo(-s * 0.3, s * 0.4);
        ctx.lineTo(-s * 0.35 + Math.sin(t * 8) * 3, s + 2);
        ctx.stroke();
        // Right leg
        ctx.beginPath();
        ctx.moveTo(s * 0.3, s * 0.4);
        ctx.lineTo(s * 0.35 - Math.sin(t * 8) * 3, s + 2);
        ctx.stroke();
        // Knee plates
        ctx.fillStyle = brighten(enemy.color, -20);
        ctx.beginPath();
        ctx.arc(-s * 0.32 + Math.sin(t * 8) * 1.5, s * 0.7, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(s * 0.32 - Math.sin(t * 8) * 1.5, s * 0.7, 2, 0, Math.PI * 2);
        ctx.fill();

        // Arms (swinging with fists)
        ctx.strokeStyle = brighten(enemy.color, -30);
        ctx.lineWidth = 2.5;
        // Left arm
        ctx.beginPath();
        ctx.moveTo(-s * 0.7, -s * 0.15);
        ctx.lineTo(-s * 0.9 - Math.sin(t * 8) * 2.5, s * 0.35);
        ctx.stroke();
        // Right arm
        ctx.beginPath();
        ctx.moveTo(s * 0.7, -s * 0.15);
        ctx.lineTo(s * 0.9 + Math.sin(t * 8) * 2.5, s * 0.35);
        ctx.stroke();
        // Fists
        ctx.fillStyle = brighten(enemy.color, -10);
        ctx.beginPath();
        ctx.arc(-s * 0.9 - Math.sin(t * 8) * 2.5, s * 0.35, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(s * 0.9 + Math.sin(t * 8) * 2.5, s * 0.35, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Body torso - armored carapace shape
        const bodyGrad = ctx.createLinearGradient(0, -s * 0.8, 0, s * 0.5);
        bodyGrad.addColorStop(0, brighten(enemy.color, 15));
        bodyGrad.addColorStop(0.5, enemy.color);
        bodyGrad.addColorStop(1, brighten(enemy.color, -25));
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.moveTo(-s * 0.75, -s * 0.4);
        ctx.quadraticCurveTo(-s * 0.85, 0, -s * 0.6, s * 0.5);
        ctx.lineTo(s * 0.6, s * 0.5);
        ctx.quadraticCurveTo(s * 0.85, 0, s * 0.75, -s * 0.4);
        ctx.closePath();
        ctx.fill();
        // Armor outline
        ctx.strokeStyle = brighten(enemy.color, 30);
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Chest armor plate (V shape)
        ctx.fillStyle = brighten(enemy.color, -30);
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.35);
        ctx.lineTo(-s * 0.35, s * 0.1);
        ctx.lineTo(0, s * 0.4);
        ctx.lineTo(s * 0.35, s * 0.1);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = brighten(enemy.color, -10);
        ctx.lineWidth = 0.7;
        ctx.stroke();

        // Shoulder pauldrons
        ctx.fillStyle = brighten(enemy.color, -15);
        ctx.beginPath();
        ctx.ellipse(-s * 0.65, -s * 0.25, s * 0.25, s * 0.18, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = brighten(enemy.color, 20);
        ctx.lineWidth = 0.8;
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(s * 0.65, -s * 0.25, s * 0.25, s * 0.18, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Head - helmet with visor
        const headGrad = ctx.createRadialGradient(0, -s * 0.8, 0, 0, -s * 0.8, s * 0.45);
        headGrad.addColorStop(0, brighten(enemy.color, 20));
        headGrad.addColorStop(1, brighten(enemy.color, -10));
        ctx.fillStyle = headGrad;
        ctx.beginPath();
        ctx.arc(0, -s * 0.75, s * 0.42, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = brighten(enemy.color, 30);
        ctx.lineWidth = 1;
        ctx.stroke();

        // Visor slit
        ctx.fillStyle = '#1a0000';
        ctx.beginPath();
        ctx.ellipse(0, -s * 0.75, s * 0.3, s * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();

        // Horns on helmet (small but menacing)
        ctx.fillStyle = '#553322';
        ctx.beginPath();
        ctx.moveTo(-s * 0.25, -s);
        ctx.lineTo(-s * 0.4, -s * 1.4);
        ctx.lineTo(-s * 0.15, -s * 1.05);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(s * 0.25, -s);
        ctx.lineTo(s * 0.4, -s * 1.4);
        ctx.lineTo(s * 0.15, -s * 1.05);
        ctx.closePath();
        ctx.fill();

        // Glowing red eyes behind visor
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 6 + Math.sin(t * 4) * 2;
        ctx.fillStyle = '#ff2020';
        ctx.beginPath();
        ctx.arc(-s * 0.13, -s * 0.76, 1.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(s * 0.13, -s * 0.76, 1.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.restore();
    },

    // ============================================================
    // ===== FAST (Scout) - Sleek blade-like predator ============
    // ============================================================
    _drawFast(ctx, enemy, x, y, size, t, anim) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(enemy.angle);

        const s = size;
        const speedPulse = Math.sin(t * 15 + anim.flickerSeed) * 0.5 + 0.5;

        // Motion ghost trail (4 copies, increasingly faded)
        for (let i = 4; i >= 1; i--) {
            ctx.save();
            ctx.globalAlpha = (ctx.globalAlpha || 1) * (0.06 * (5 - i));
            const offset = -i * s * 0.55;
            const waver = Math.sin(t * 6 + i * 2) * 1;
            ctx.fillStyle = enemy.color;
            ctx.beginPath();
            ctx.moveTo(s * 1.2 + offset, waver);
            ctx.lineTo(s * 0.2 + offset, -s * 0.45 + waver);
            ctx.lineTo(-s * 0.5 + offset, waver);
            ctx.lineTo(s * 0.2 + offset, s * 0.45 + waver);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }

        // Main body - razor dart shape
        const bodyGrad = ctx.createLinearGradient(-s * 0.5, 0, s * 1.2, 0);
        bodyGrad.addColorStop(0, brighten(enemy.color, -30));
        bodyGrad.addColorStop(0.3, enemy.color);
        bodyGrad.addColorStop(0.7, brighten(enemy.color, 20));
        bodyGrad.addColorStop(1, '#ffffff');
        ctx.fillStyle = bodyGrad;
        ctx.shadowColor = enemy.color;
        ctx.shadowBlur = 8 + speedPulse * 4;
        ctx.beginPath();
        // Sleek blade shape
        ctx.moveTo(s * 1.3, 0);
        ctx.lineTo(s * 0.3, -s * 0.5);
        ctx.quadraticCurveTo(-s * 0.2, -s * 0.65, -s * 0.6, -s * 0.35);
        ctx.lineTo(-s * 0.5, 0);
        ctx.lineTo(-s * 0.6, s * 0.35);
        ctx.quadraticCurveTo(-s * 0.2, s * 0.65, s * 0.3, s * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;

        // Highlight leading edge
        ctx.strokeStyle = brighten(enemy.color, 70);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(s * 1.3, 0);
        ctx.lineTo(s * 0.3, -s * 0.5);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(s * 1.3, 0);
        ctx.lineTo(s * 0.3, s * 0.5);
        ctx.stroke();

        // Swept-back wing fins (animated flutter)
        const wingFlap = Math.sin(t * 14 + enemy.bobOffset) * 0.25;
        ctx.fillStyle = brighten(enemy.color, 15);
        // Top wing
        ctx.beginPath();
        ctx.moveTo(s * 0.1, -s * 0.45);
        ctx.lineTo(-s * 0.5, -s * (1.0 + wingFlap));
        ctx.lineTo(-s * 0.7, -s * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = brighten(enemy.color, 40);
        ctx.lineWidth = 0.6;
        ctx.stroke();
        // Bottom wing
        ctx.beginPath();
        ctx.moveTo(s * 0.1, s * 0.45);
        ctx.lineTo(-s * 0.5, s * (1.0 + wingFlap));
        ctx.lineTo(-s * 0.7, s * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Eye/sensor (predator eye, glowing)
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 4;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(s * 0.4, 0, 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.arc(s * 0.4, 0, 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Speed line streaks behind
        ctx.strokeStyle = colorAlpha(brighten(enemy.color, 50), 0.3);
        ctx.lineWidth = 0.8;
        for (let i = 0; i < 3; i++) {
            const ly = (i - 1) * s * 0.3;
            const lx = -s * 0.5 - rand(s * 0.3, s * 1.5);
            ctx.beginPath();
            ctx.moveTo(-s * 0.5, ly);
            ctx.lineTo(lx, ly);
            ctx.stroke();
        }

        ctx.restore();

        // Speed trail particles
        if (Math.random() < 0.35) {
            const trailAngle = enemy.angle + Math.PI;
            GameState.particles.push(new Particle(
                x + Math.cos(trailAngle) * size,
                y + Math.sin(trailAngle) * size,
                {
                    vx: Math.cos(trailAngle) * 3.5 + rand(-0.5, 0.5),
                    vy: Math.sin(trailAngle) * 3.5 + rand(-0.5, 0.5),
                    life: 0.2,
                    size: rand(1, 2.5),
                    color: brighten(enemy.color, 40),
                    glow: true
                }
            ));
        }
    },

    // ============================================================
    // ===== HEAVY (Brute) - Massive armored juggernaut =========
    // ============================================================
    _drawHeavy(ctx, enemy, x, y, size, t, anim) {
        const bob = Math.abs(Math.sin(t * 3 + enemy.bobOffset)) * 2;
        const breathe = Math.sin(t * 2 + anim.breathPhase) * 0.03 + 1.0;
        const s = size * breathe;

        ctx.save();
        ctx.translate(x, y + bob);

        const w = s * 1.2;
        const h = s * 1.3;

        // Heavy ground shadow (larger = heavier)
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath();
        ctx.ellipse(0, h + 3, w * 0.9, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Stomping dust particles
        if (Math.abs(Math.sin(t * 3 + enemy.bobOffset)) > 0.98) {
            for (let i = 0; i < 3; i++) {
                GameState.particles.push(new Particle(
                    x + rand(-w * 0.6, w * 0.6), y + h + 2,
                    { vx: rand(-1, 1), vy: rand(-0.5, 0.2), life: 0.3, size: rand(1.5, 3), color: '#8a7a6a' }
                ));
            }
        }

        // Main body - massive armored block
        const bodyGrad = ctx.createLinearGradient(-w, -h, w, h);
        bodyGrad.addColorStop(0, brighten(enemy.color, 15));
        bodyGrad.addColorStop(0.5, enemy.color);
        bodyGrad.addColorStop(1, brighten(enemy.color, -25));
        ctx.fillStyle = bodyGrad;
        // Rounded heavy shape
        ctx.beginPath();
        ctx.moveTo(-w * 0.8, -h);
        ctx.lineTo(w * 0.8, -h);
        ctx.quadraticCurveTo(w, -h * 0.8, w, -h * 0.3);
        ctx.lineTo(w, h * 0.5);
        ctx.quadraticCurveTo(w, h, w * 0.7, h);
        ctx.lineTo(-w * 0.7, h);
        ctx.quadraticCurveTo(-w, h, -w, h * 0.5);
        ctx.lineTo(-w, -h * 0.3);
        ctx.quadraticCurveTo(-w, -h * 0.8, -w * 0.8, -h);
        ctx.closePath();
        ctx.fill();

        // Armor plate lines
        ctx.strokeStyle = brighten(enemy.color, -40);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-w, 0);
        ctx.lineTo(w, 0);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, -h);
        ctx.lineTo(0, h);
        ctx.stroke();

        // Four armor plate sections (darker inner)
        ctx.fillStyle = brighten(enemy.color, -18);
        const gap = 2;
        ctx.fillRect(-w + gap + 1, -h + gap + 1, w - gap - 2, h - gap - 2);
        ctx.fillRect(1, -h + gap + 1, w - gap - 2, h - gap - 2);
        ctx.fillRect(-w + gap + 1, 1, w - gap - 2, h - gap - 2);
        ctx.fillRect(1, 1, w - gap - 2, h - gap - 2);

        // Heavy outer border
        ctx.strokeStyle = brighten(enemy.color, 35);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-w * 0.8, -h);
        ctx.lineTo(w * 0.8, -h);
        ctx.quadraticCurveTo(w, -h * 0.8, w, -h * 0.3);
        ctx.lineTo(w, h * 0.5);
        ctx.quadraticCurveTo(w, h, w * 0.7, h);
        ctx.lineTo(-w * 0.7, h);
        ctx.quadraticCurveTo(-w, h, -w, h * 0.5);
        ctx.lineTo(-w, -h * 0.3);
        ctx.quadraticCurveTo(-w, -h * 0.8, -w * 0.8, -h);
        ctx.closePath();
        ctx.stroke();

        // Rivets at plate intersections
        ctx.fillStyle = '#999';
        const rivetPos = [
            [-w + 3, -h + 3], [w - 3, -h + 3],
            [-w + 3, h - 3], [w - 3, h - 3],
            [-w + 3, 0], [w - 3, 0],
            [0, -h + 3], [0, h - 3], [0, 0]
        ];
        for (const [rx, ry] of rivetPos) {
            ctx.beginPath();
            ctx.arc(rx, ry, 1.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 0.5;
            ctx.stroke();
        }

        // Battle damage cracks (more as HP drops)
        const hpPct = enemy.hp / enemy.maxHp;
        ctx.strokeStyle = '#2a1a0a';
        ctx.lineWidth = 1;
        if (hpPct < 0.7) {
            ctx.beginPath();
            ctx.moveTo(-w * 0.5, -h * 0.3);
            ctx.lineTo(-w * 0.2, -h * 0.05);
            ctx.lineTo(-w * 0.45, h * 0.25);
            ctx.stroke();
        }
        if (hpPct < 0.4) {
            ctx.beginPath();
            ctx.moveTo(w * 0.3, -h * 0.5);
            ctx.lineTo(w * 0.1, -h * 0.15);
            ctx.lineTo(w * 0.35, h * 0.3);
            ctx.lineTo(w * 0.15, h * 0.55);
            ctx.stroke();
            // Smoke from cracks
            if (Math.random() < 0.06) {
                GameState.particles.push(new Particle(
                    x + rand(-w * 0.3, w * 0.3), y + bob + rand(-h * 0.3, 0),
                    { vx: rand(-0.3, 0.3), vy: rand(-1, -0.3), life: 0.5, size: rand(2, 4), color: '#555' }
                ));
            }
        }

        // Menacing visor / eyes
        ctx.fillStyle = '#1a0800';
        ctx.fillRect(-w * 0.7, -h * 0.55, w * 1.4, h * 0.28);
        // Visor border
        ctx.strokeStyle = '#665544';
        ctx.lineWidth = 1;
        ctx.strokeRect(-w * 0.7, -h * 0.55, w * 1.4, h * 0.28);
        // Angry glowing eye slits
        ctx.shadowColor = '#ff3300';
        ctx.shadowBlur = 5 + Math.sin(t * 3) * 2;
        ctx.fillStyle = '#ff3300';
        ctx.fillRect(-w * 0.5, -h * 0.48, w * 0.3, h * 0.14);
        ctx.fillRect(w * 0.2, -h * 0.48, w * 0.3, h * 0.14);
        ctx.shadowBlur = 0;

        // Massive shoulder spikes/shields
        ctx.fillStyle = '#665544';
        // Left shield plate
        ctx.beginPath();
        ctx.moveTo(-w - 2, -h * 0.7);
        ctx.lineTo(-w - 7, -h - 5);
        ctx.lineTo(-w - 8, -h * 0.2);
        ctx.lineTo(-w - 2, h * 0.1);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#887766';
        ctx.lineWidth = 1;
        ctx.stroke();
        // Right shield plate
        ctx.beginPath();
        ctx.moveTo(w + 2, -h * 0.7);
        ctx.lineTo(w + 7, -h - 5);
        ctx.lineTo(w + 8, -h * 0.2);
        ctx.lineTo(w + 2, h * 0.1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    },

    // ============================================================
    // ===== HEALER (Medic) - Ethereal floating priest ============
    // ============================================================
    _drawHealer(ctx, enemy, x, y, size, t, anim) {
        const hover = Math.sin(t * 3 + enemy.bobOffset) * 3.5;
        const pulse = Math.sin(t * 4) * 0.3 + 0.7;
        const s = size;

        ctx.save();
        ctx.translate(x, y + hover);

        // Healing aura rings (concentric, pulsing)
        for (let ring = 2; ring >= 0; ring--) {
            const auraSize = s + 6 + ring * 5 + Math.sin(t * 3 + ring * 1.5) * 3;
            const auraAlpha = pulse * (0.15 - ring * 0.04);
            ctx.strokeStyle = colorAlpha('#40ff40', auraAlpha);
            ctx.lineWidth = 1.5 - ring * 0.3;
            ctx.beginPath();
            ctx.arc(0, 0, auraSize, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Healing cast telegraph
        if (enemy.healCastTimer > 0 && enemy.healCastMaxTimer > 0) {
            const frac = Math.max(0, Math.min(1, enemy.healCastTimer / enemy.healCastMaxTimer));
            const teleR = s + 14;
            ctx.beginPath();
            ctx.arc(0, 0, teleR, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(120,255,140,0.25)';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(0, 0, teleR, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - frac));
            ctx.strokeStyle = '#90ff90';
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.font = 'bold 8px "Share Tech Mono"';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#b8ffb8';
            ctx.fillText('HEAL', 0, -teleR - 6);
        }

        // Orbiting heal particles (6 particles in a circle)
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 / 6) * i + t * 1.5;
            const pr = s * 1.0 + Math.sin(t * 2.5 + i * 1.2) * 2;
            const px = Math.cos(angle) * pr;
            const py = Math.sin(angle) * pr;
            const pAlpha = 0.4 + Math.sin(t * 3 + i) * 0.2;
            ctx.fillStyle = colorAlpha('#80ff80', pAlpha);
            ctx.shadowColor = '#40ff40';
            ctx.shadowBlur = 4;
            ctx.beginPath();
            ctx.arc(px, py, 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        // Shadow beneath (floating indicator)
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.ellipse(0, s + 6 - hover, s * 0.5, 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Robes / body (flowing shape)
        ctx.shadowColor = '#40ff40';
        ctx.shadowBlur = 12;
        const robeGrad = ctx.createRadialGradient(0, -s * 0.2, 0, 0, 0, s * 1.1);
        robeGrad.addColorStop(0, brighten(enemy.color, 40));
        robeGrad.addColorStop(0.4, enemy.color);
        robeGrad.addColorStop(1, brighten(enemy.color, -30));
        ctx.fillStyle = robeGrad;
        ctx.beginPath();
        // Robed figure shape - round top, flowing bottom
        ctx.moveTo(0, -s * 0.9);
        ctx.quadraticCurveTo(-s * 0.8, -s * 0.5, -s * 0.7, 0);
        ctx.quadraticCurveTo(-s * 0.9, s * 0.6, -s * 0.5 + Math.sin(t * 4) * 1.5, s);
        ctx.lineTo(s * 0.5 + Math.sin(t * 4 + 2) * 1.5, s);
        ctx.quadraticCurveTo(s * 0.9, s * 0.6, s * 0.7, 0);
        ctx.quadraticCurveTo(s * 0.8, -s * 0.5, 0, -s * 0.9);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;

        // Face area (dark void with glow)
        ctx.fillStyle = '#0a200a';
        ctx.beginPath();
        ctx.ellipse(0, -s * 0.45, s * 0.35, s * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Glowing green eyes
        ctx.shadowColor = '#60ff60';
        ctx.shadowBlur = 6;
        ctx.fillStyle = '#60ff60';
        ctx.beginPath();
        ctx.arc(-s * 0.12, -s * 0.48, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(s * 0.12, -s * 0.48, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Large glowing cross on chest
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#ffffff';
        const crossW = 2.5;
        const crossH = s * 0.55;
        ctx.fillRect(-crossW / 2, -crossH / 2 + s * 0.05, crossW, crossH);
        ctx.fillRect(-crossH / 2, -crossW / 2 + s * 0.05, crossH, crossW);
        // Cross glow pulse
        ctx.fillStyle = colorAlpha('#80ff80', pulse * 0.5);
        ctx.fillRect(-crossW / 2 - 0.5, -crossH / 2 - 0.5 + s * 0.05, crossW + 1, crossH + 1);
        ctx.fillRect(-crossH / 2 - 0.5, -crossW / 2 - 0.5 + s * 0.05, crossH + 1, crossW + 1);
        ctx.shadowBlur = 0;

        // Staff / scepter (held to side)
        ctx.strokeStyle = '#ccaa44';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(s * 0.5, -s * 0.3);
        ctx.lineTo(s * 0.5, s * 0.8);
        ctx.stroke();
        // Staff top orb
        ctx.fillStyle = '#60ff60';
        ctx.shadowColor = '#40ff40';
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.arc(s * 0.5, -s * 0.4, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Rising heal sparkle particles
        if (Math.random() < 0.08) {
            const angle = rand(0, Math.PI * 2);
            const dist = rand(s * 0.5, s * 1.5);
            GameState.particles.push(new Particle(
                x + Math.cos(angle) * dist,
                y + hover + Math.sin(angle) * dist,
                { vx: 0, vy: rand(-1.5, -0.5), life: 0.5, size: 2, color: '#80ff80', glow: true }
            ));
        }

        ctx.restore();
    },

    // ============================================================
    // ===== SHIELD (Guardian) - Hexagonal fortress with barrier ==
    // ============================================================
    _drawShield(ctx, enemy, x, y, size, t, anim) {
        const s = size;
        const breathe = Math.sin(t * 2.5 + anim.breathPhase) * 0.03 + 1.0;
        const shimmerT = t * 3;

        ctx.save();
        ctx.translate(x, y);

        // Outer energy field hexagonal shimmer
        const shimmer = Math.sin(t * 5) * 0.15 + 0.3;
        ctx.strokeStyle = colorAlpha('#60a0ff', shimmer);
        ctx.lineWidth = 1.5;
        drawPoly(ctx, 0, 0, 6, s + 6 + Math.sin(shimmerT) * 1.5, t * 0.2);
        ctx.stroke();

        // Shield aura cast telegraph
        if (enemy.shieldAuraCastTimer > 0 && enemy.shieldAuraCastMaxTimer > 0) {
            const frac = Math.max(0, Math.min(1, enemy.shieldAuraCastTimer / enemy.shieldAuraCastMaxTimer));
            const auraR = enemy.shieldAuraRadius;
            ctx.beginPath();
            ctx.arc(0, 0, auraR, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(120,180,255,0.2)';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 4]);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(0, 0, auraR, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - frac));
            ctx.strokeStyle = '#9bc8ff';
            ctx.lineWidth = 3;
            ctx.setLineDash([]);
            ctx.stroke();

            ctx.font = 'bold 8px "Share Tech Mono"';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#c8e0ff';
            ctx.fillText('AURA', 0, -auraR - 8);
        }

        // Rotating barrier arc segments
        ctx.strokeStyle = colorAlpha('#80c0ff', 0.2 + Math.sin(t * 6) * 0.1);
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, s + 9, t * 1.5, t * 1.5 + Math.PI * 0.8);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, s + 9, t * 1.5 + Math.PI, t * 1.5 + Math.PI * 1.8);
        ctx.stroke();

        // Main hexagonal body with gradient
        const bodyGrad = ctx.createRadialGradient(0, -s * 0.2, 0, 0, 0, s * breathe);
        bodyGrad.addColorStop(0, brighten(enemy.color, 25));
        bodyGrad.addColorStop(0.5, enemy.color);
        bodyGrad.addColorStop(1, brighten(enemy.color, -20));
        ctx.fillStyle = bodyGrad;
        ctx.shadowColor = enemy.color;
        ctx.shadowBlur = 8;
        drawPoly(ctx, 0, 0, 6, s * breathe, t * 0.1);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Inner hexagon with detail
        ctx.strokeStyle = brighten(enemy.color, 40);
        ctx.lineWidth = 1;
        drawPoly(ctx, 0, 0, 6, s * 0.6 * breathe, t * 0.1);
        ctx.stroke();

        // Connecting lines inner to outer hex
        for (let i = 0; i < 6; i++) {
            const a = (Math.PI * 2 / 6) * i + t * 0.1;
            ctx.strokeStyle = colorAlpha(brighten(enemy.color, 30), 0.35);
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(Math.cos(a) * s * 0.6 * breathe, Math.sin(a) * s * 0.6 * breathe);
            ctx.lineTo(Math.cos(a) * s * breathe, Math.sin(a) * s * breathe);
            ctx.stroke();
        }

        // Heavy border
        ctx.strokeStyle = brighten(enemy.color, 50);
        ctx.lineWidth = 2.2;
        drawPoly(ctx, 0, 0, 6, s * breathe, t * 0.1);
        ctx.stroke();

        // Central shield emblem (prominent)
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#80c0ff';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.45);
        ctx.lineTo(-s * 0.38, -s * 0.12);
        ctx.lineTo(-s * 0.28, s * 0.3);
        ctx.lineTo(0, s * 0.45);
        ctx.lineTo(s * 0.28, s * 0.3);
        ctx.lineTo(s * 0.38, -s * 0.12);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;

        // Shield emblem inner
        ctx.fillStyle = brighten(enemy.color, 10);
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.28);
        ctx.lineTo(-s * 0.22, -s * 0.05);
        ctx.lineTo(-s * 0.16, s * 0.16);
        ctx.lineTo(0, s * 0.28);
        ctx.lineTo(s * 0.16, s * 0.16);
        ctx.lineTo(s * 0.22, -s * 0.05);
        ctx.closePath();
        ctx.fill();

        // Energy node dots at hex vertices
        ctx.fillStyle = '#80c0ff';
        ctx.shadowColor = '#4080ff';
        ctx.shadowBlur = 3;
        for (let i = 0; i < 6; i++) {
            const a = (Math.PI * 2 / 6) * i + t * 0.1;
            const nr = s * breathe;
            ctx.beginPath();
            ctx.arc(Math.cos(a) * nr, Math.sin(a) * nr, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.shadowBlur = 0;

        ctx.restore();
    },

    // ============================================================
    // ===== DISRUPTOR - EMP specialist ===========================
    // ============================================================
    _drawDisruptor(ctx, enemy, x, y, size, t, anim) {
        const s = size;
        const pulse = Math.sin(t * 6 + enemy.bobOffset) * 0.12 + 0.88;

        ctx.save();
        ctx.translate(x, y);

        // EMP cast telegraph
        if (enemy.disruptCastTimer > 0 && enemy.disruptCastMaxTimer > 0) {
            const frac = Math.max(0, Math.min(1, enemy.disruptCastTimer / enemy.disruptCastMaxTimer));
            const auraR = enemy.disruptRadius || 150;
            ctx.beginPath();
            ctx.arc(0, 0, auraR, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255,160,120,0.22)';
            ctx.lineWidth = 2;
            ctx.setLineDash([7, 5]);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(0, 0, auraR, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - frac));
            ctx.strokeStyle = '#ffb080';
            ctx.lineWidth = 3;
            ctx.setLineDash([]);
            ctx.stroke();

            ctx.font = 'bold 8px "Share Tech Mono"';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ffd0b8';
            ctx.fillText('EMP', 0, -auraR - 8);
        }

        // Core body
        const grad = ctx.createRadialGradient(0, -s * 0.2, 0, 0, 0, s * 1.15);
        grad.addColorStop(0, brighten(enemy.color, 26));
        grad.addColorStop(0.6, enemy.color);
        grad.addColorStop(1, brighten(enemy.color, -20));
        ctx.fillStyle = grad;
        ctx.shadowColor = enemy.color;
        ctx.shadowBlur = 8;
        drawPoly(ctx, 0, 0, 8, s * pulse, t * 0.25);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Ring accents
        ctx.strokeStyle = colorAlpha('#ffc8a0', 0.65);
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.75, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.48, 0, Math.PI * 2);
        ctx.stroke();

        // Center spark
        ctx.fillStyle = '#fff4e8';
        ctx.beginPath();
        ctx.arc(0, 0, 2.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    },

    // ============================================================
    // ===== TOXIC CARRIER - Corrosion support ====================
    // ============================================================
    _drawToxic(ctx, enemy, x, y, size, t, anim) {
        const s = size;
        const pulse = Math.sin(t * 4 + enemy.bobOffset) * 0.08 + 1;

        ctx.save();
        ctx.translate(x, y);

        if (enemy.toxicCastTimer > 0 && enemy.toxicCastMaxTimer > 0) {
            const frac = Math.max(0, Math.min(1, enemy.toxicCastTimer / enemy.toxicCastMaxTimer));
            const auraR = enemy.toxicRadius || 140;
            ctx.beginPath();
            ctx.arc(0, 0, auraR, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(160,255,130,0.18)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 6]);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(0, 0, auraR, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - frac));
            ctx.strokeStyle = '#b8ff90';
            ctx.lineWidth = 3;
            ctx.setLineDash([]);
            ctx.stroke();

            ctx.font = 'bold 8px "Share Tech Mono"';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#d6ffbf';
            ctx.fillText('TOXIC', 0, -auraR - 8);
        }

        const grad = ctx.createRadialGradient(0, -s * 0.2, 0, 0, 0, s * 1.2);
        grad.addColorStop(0, brighten(enemy.color, 30));
        grad.addColorStop(0.55, enemy.color);
        grad.addColorStop(1, brighten(enemy.color, -20));
        ctx.fillStyle = grad;
        drawPoly(ctx, 0, 0, 7, s * pulse, t * 0.2);
        ctx.fill();

        ctx.strokeStyle = '#d0ffb0';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.65, 0, Math.PI * 2);
        ctx.stroke();

        for (let i = 0; i < 5; i++) {
            const a = t * 1.2 + i * (Math.PI * 2 / 5);
            ctx.fillStyle = colorAlpha('#d8ffb8', 0.7);
            ctx.beginPath();
            ctx.arc(Math.cos(a) * s * 0.55, Math.sin(a) * s * 0.55, 1.4, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    },

    // ============================================================
    // ===== SWARM (Swarmling) - Angry insect creature ===========
    // ============================================================
    _drawSwarm(ctx, enemy, x, y, size, t, anim) {
        const buzzX = Math.sin(t * 20 + enemy.bobOffset * 7) * 1.2;
        const buzzY = Math.cos(t * 18 + enemy.bobOffset * 5) * 1.0;
        const dx = x + buzzX;
        const dy = y + buzzY;
        const s = size;

        ctx.save();
        ctx.translate(dx, dy);
        ctx.rotate(enemy.angle || 0);

        // Wing beat (fast flicker)
        const wingPhase = Math.sin(t * 35 + enemy.bobOffset * 10);
        ctx.fillStyle = colorAlpha('#ffe080', wingPhase > 0 ? 0.35 : 0.15);
        ctx.beginPath();
        ctx.ellipse(0, -s * (wingPhase > 0 ? 0.8 : 0.5), s * 0.6, s * 0.2, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = colorAlpha('#ffe080', wingPhase > 0 ? 0.15 : 0.35);
        ctx.beginPath();
        ctx.ellipse(0, s * (wingPhase > 0 ? 0.5 : 0.8), s * 0.6, s * 0.2, 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Body (segmented bug-like)
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, s * 1.0, s * 0.75, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = brighten(enemy.color, 30);
        ctx.lineWidth = 0.6;
        ctx.stroke();

        // Segment lines
        ctx.strokeStyle = brighten(enemy.color, -30);
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(-s * 0.3, -s * 0.7);
        ctx.lineTo(-s * 0.3, s * 0.7);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(s * 0.3, -s * 0.7);
        ctx.lineTo(s * 0.3, s * 0.7);
        ctx.stroke();

        // Angry red eyes
        ctx.fillStyle = '#ff0000';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 2;
        ctx.beginPath();
        ctx.arc(-s * 0.2, -s * 0.12, 1, 0, Math.PI * 2);
        ctx.arc(s * 0.2, -s * 0.12, 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Angry brow
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(-s * 0.5, -s * 0.4);
        ctx.lineTo(-s * 0.05, -s * 0.25);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(s * 0.5, -s * 0.4);
        ctx.lineTo(s * 0.05, -s * 0.25);
        ctx.stroke();

        // Mandibles
        ctx.strokeStyle = brighten(enemy.color, -40);
        ctx.lineWidth = 0.8;
        const mSnap = Math.sin(t * 12 + enemy.bobOffset * 3) * 0.15;
        ctx.beginPath();
        ctx.moveTo(-s * 0.15, s * 0.45);
        ctx.lineTo(-s * (0.35 + mSnap), s * 0.7);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(s * 0.15, s * 0.45);
        ctx.lineTo(s * (0.35 + mSnap), s * 0.7);
        ctx.stroke();

        ctx.restore();

        // Swarm connection lines
        if (GameState.enemies) {
            ctx.strokeStyle = colorAlpha(enemy.color, 0.12);
            ctx.lineWidth = 0.5;
            for (const other of GameState.enemies) {
                if (other === enemy || !other.alive) continue;
                if (other.type !== 'swarm' && other.type !== 'swarmfast') continue;
                const d = Math.hypot(other.x - dx, other.y - dy);
                if (d < 40 && d > 0) {
                    ctx.beginPath();
                    ctx.moveTo(dx, dy);
                    ctx.lineTo(other.x, other.y);
                    ctx.stroke();
                }
            }
        }
    },

    // ============================================================
    // ===== STEALTH (Shadow) - Ninja specter with shimmer =======
    // ============================================================
    _drawStealth(ctx, enemy, x, y, size, t, anim) {
        const isVis = !enemy.invisible;
        const alpha = isVis ? 0.85 : 0.12;
        const s = size;

        ctx.save();
        ctx.globalAlpha = Math.min(ctx.globalAlpha || 1, alpha);
        ctx.translate(x, y);
        ctx.rotate(enemy.angle);

        // Stealth phase-in telegraph
        if (enemy.stealthPrepTimer > 0 && enemy.stealthPrepMaxTimer > 0) {
            const frac = Math.max(0, Math.min(1, enemy.stealthPrepTimer / enemy.stealthPrepMaxTimer));
            const prepR = s + 10;
            ctx.beginPath();
            ctx.arc(0, 0, prepR, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(180,120,255,0.2)';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 3]);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(0, 0, prepR, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - frac));
            ctx.strokeStyle = '#d090ff';
            ctx.lineWidth = 3;
            ctx.setLineDash([]);
            ctx.stroke();

            ctx.font = 'bold 8px "Share Tech Mono"';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#e0b8ff';
            ctx.fillText('PHASE', 0, -prepR - 6);
        }

        // Shadow wisps trailing behind
        for (let i = 4; i >= 1; i--) {
            ctx.save();
            ctx.globalAlpha = (ctx.globalAlpha || 1) * (0.08 * (5 - i));
            const offset = -i * s * 0.4;
            const waver = Math.sin(t * 4 + i * 1.8) * 2.5;
            ctx.fillStyle = enemy.color;
            ctx.beginPath();
            ctx.moveTo(s * 0.5 + offset, waver);
            ctx.lineTo(offset, -s * 0.4 + waver);
            ctx.lineTo(-s * 0.5 + offset, waver);
            ctx.lineTo(offset, s * 0.4 + waver);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }

        // Main body - flowing diamond with wavering edges (ninja cloak)
        ctx.shadowColor = '#a040ff';
        ctx.shadowBlur = isVis ? 10 : 3;
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        const segments = 20;
        for (let i = 0; i <= segments; i++) {
            const pct = i / segments;
            const baseAngle = pct * Math.PI * 2;
            const diamondR = s * (0.65 + 0.35 * Math.abs(Math.cos(baseAngle * 2)));
            const waveR = diamondR + Math.sin(t * 5 + baseAngle * 3) * 2;
            const px = Math.cos(baseAngle) * waveR;
            const py = Math.sin(baseAngle) * waveR;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;

        // Ninja mask / face slit
        ctx.fillStyle = '#1a0020';
        ctx.beginPath();
        ctx.ellipse(s * 0.1, 0, s * 0.25, s * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();

        // Glowing eyes (always visible even when cloaked, menacing)
        const eyeGlow = isVis ? 6 : 14;
        ctx.shadowColor = '#ff00ff';
        ctx.shadowBlur = eyeGlow + Math.sin(t * 6) * 2;
        ctx.fillStyle = isVis ? '#cc40cc' : '#ff60ff';
        ctx.beginPath();
        ctx.arc(-s * 0.02, -s * 0.03, isVis ? 1.5 : 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(s * 0.22, -s * 0.03, isVis ? 1.5 : 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Blade / weapon (small shuriken shape on side)
        if (isVis) {
            ctx.fillStyle = '#aaaacc';
            const bx = -s * 0.3, by = s * 0.1;
            for (let i = 0; i < 4; i++) {
                const ba = (Math.PI / 2) * i + t * 8;
                ctx.beginPath();
                ctx.moveTo(bx, by);
                ctx.lineTo(bx + Math.cos(ba) * s * 0.3, by + Math.sin(ba) * s * 0.3);
                ctx.lineTo(bx + Math.cos(ba + 0.5) * s * 0.12, by + Math.sin(ba + 0.5) * s * 0.12);
                ctx.closePath();
                ctx.fill();
            }
        }

        // Shimmer effect when transitioning visibility
        if (!isVis) {
            ctx.strokeStyle = colorAlpha('#c060ff', 0.15 + Math.sin(t * 8) * 0.1);
            ctx.lineWidth = 0.8;
            for (let i = 0; i < 3; i++) {
                const sa = rand(0, Math.PI * 2);
                const sr = s * (0.5 + Math.sin(t * 4 + i * 2) * 0.3);
                ctx.beginPath();
                ctx.arc(0, 0, sr, sa, sa + 0.5);
                ctx.stroke();
            }
        }

        ctx.restore();

        // Spectral energy wisps
        if (Math.random() < 0.06) {
            const a = rand(0, Math.PI * 2);
            const r = rand(s * 0.3, s * 1.2);
            GameState.particles.push(new Particle(
                x + Math.cos(a + enemy.angle) * r,
                y + Math.sin(a + enemy.angle) * r,
                {
                    vx: rand(-0.5, 0.5), vy: rand(-1.5, -0.3),
                    life: 0.4, size: rand(1, 2.5),
                    color: '#9060d0', glow: true
                }
            ));
        }
    },

    // ============================================================
    // ===== SPLITTER - Segmented alien that breaks apart ========
    // ============================================================
    _drawSplitter(ctx, enemy, x, y, size, t, anim) {
        const wobble = Math.sin(t * 5 + enemy.bobOffset) * 0.06;
        const s = size;
        const breatheGap = 1.5 + Math.sin(t * 3) * 0.8;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(wobble);

        const segSize = s * 0.5;
        const baseColor = enemy.color;

        // Segment positions (4 quadrants pulling apart and together)
        const segColors = [
            baseColor,
            brighten(baseColor, 20),
            brighten(baseColor, -15),
            brighten(baseColor, 10),
        ];
        const segPositions = [
            { cx: -segSize * 0.5 - breatheGap, cy: -segSize * 0.5 - breatheGap },
            { cx: segSize * 0.5 + breatheGap, cy: -segSize * 0.5 - breatheGap },
            { cx: -segSize * 0.5 - breatheGap, cy: segSize * 0.5 + breatheGap },
            { cx: segSize * 0.5 + breatheGap, cy: segSize * 0.5 + breatheGap },
        ];

        // Energy tendrils connecting segments to center
        ctx.strokeStyle = colorAlpha('#ffcc40', 0.3 + Math.sin(t * 4) * 0.15);
        ctx.lineWidth = 1;
        for (const seg of segPositions) {
            ctx.beginPath();
            ctx.moveTo(0, 0);
            const midX = seg.cx * 0.5 + Math.sin(t * 6 + seg.cx) * 1.5;
            const midY = seg.cy * 0.5 + Math.cos(t * 6 + seg.cy) * 1.5;
            ctx.quadraticCurveTo(midX, midY, seg.cx, seg.cy);
            ctx.stroke();
        }

        // Draw each segment as an organic blob
        for (let i = 0; i < 4; i++) {
            const seg = segPositions[i];
            const segGrad = ctx.createRadialGradient(seg.cx, seg.cy, 0, seg.cx, seg.cy, segSize);
            segGrad.addColorStop(0, brighten(segColors[i], 20));
            segGrad.addColorStop(1, segColors[i]);
            ctx.fillStyle = segGrad;
            ctx.beginPath();
            ctx.arc(seg.cx, seg.cy, segSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = brighten(segColors[i], 35);
            ctx.lineWidth = 1;
            ctx.stroke();

            // Eye on each segment
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(seg.cx, seg.cy - segSize * 0.2, 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#220000';
            ctx.beginPath();
            ctx.arc(seg.cx, seg.cy - segSize * 0.2, 0.7, 0, Math.PI * 2);
            ctx.fill();

            // Membrane / skin pattern
            ctx.strokeStyle = colorAlpha(brighten(segColors[i], -30), 0.3);
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.arc(seg.cx, seg.cy, segSize * 0.6, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Split seam lines (dashed, showing where it breaks)
        ctx.strokeStyle = colorAlpha('#ffffff', 0.5);
        ctx.lineWidth = 1.5;
        ctx.setLineDash([2.5, 2.5]);
        ctx.beginPath();
        ctx.moveTo(-s, 0);
        ctx.lineTo(s, 0);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.lineTo(0, s);
        ctx.stroke();
        ctx.setLineDash([]);

        // Central nucleus (pulsing, holding segments together)
        const nucleusPulse = 0.8 + Math.sin(t * 5) * 0.2;
        ctx.fillStyle = brighten(baseColor, 50);
        ctx.shadowColor = '#ffaa40';
        ctx.shadowBlur = 6 * nucleusPulse;
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.22 * nucleusPulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.restore();
    },

    // ============================================================
    // ===== GHOST (Phantom) - Ethereal wailing specter ==========
    // ============================================================
    _drawGhost(ctx, enemy, x, y, size, t, anim) {
        const hover = Math.sin(t * 2.5 + enemy.bobOffset) * 4;
        const s = size;
        const isPhased = enemy.invisible;

        ctx.save();
        ctx.translate(x, y + hover);

        if (enemy.stealthPrepTimer > 0 && enemy.stealthPrepMaxTimer > 0) {
            const frac = Math.max(0, Math.min(1, enemy.stealthPrepTimer / enemy.stealthPrepMaxTimer));
            const prepR = s + 12;
            ctx.beginPath();
            ctx.arc(0, 0, prepR, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(186, 130, 255, 0.22)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 4]);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(0, 0, prepR, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - frac));
            ctx.strokeStyle = '#d0a0ff';
            ctx.lineWidth = 3;
            ctx.setLineDash([]);
            ctx.stroke();

            ctx.font = 'bold 8px "Share Tech Mono"';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#e0c0ff';
            ctx.fillText('SHIFT', 0, -prepR - 7);
        }

        // Multiple ethereal transparency layers (outer to inner)
        for (let layer = 3; layer >= 0; layer--) {
            const layerSize = s * (1 + layer * 0.3);
            const layerAlpha = isPhased ? 0.025 * (4 - layer) : 0.1 * (4 - layer);

            ctx.fillStyle = colorAlpha(enemy.color, layerAlpha);
            ctx.beginPath();
            const points = 28;
            for (let i = 0; i <= points; i++) {
                const pct = i / points;
                const a = pct * Math.PI * 2;
                const waveAmp = layerSize * 0.15;
                const wave = Math.sin(a * 3 + t * 4 + layer * 0.8) * waveAmp;
                let r = layerSize;
                // Bottom half: create tendril shapes (like a ghost's tattered cloak)
                if (a > Math.PI * 0.6 && a < Math.PI * 2.4) {
                    r += Math.sin(a * 5 + t * 3) * layerSize * 0.35;
                }
                r += wave;
                const px = Math.cos(a) * r;
                const py = Math.sin(a) * r;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
        }

        // Core body (most solid layer)
        const coreAlpha = isPhased ? 0.12 : 0.55;
        const coreGrad = ctx.createRadialGradient(0, -s * 0.2, 0, 0, 0, s * 0.85);
        coreGrad.addColorStop(0, colorAlpha(brighten(enemy.color, 30), coreAlpha));
        coreGrad.addColorStop(1, colorAlpha(enemy.color, coreAlpha * 0.5));
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        const coreP = 24;
        for (let i = 0; i <= coreP; i++) {
            const pct = i / coreP;
            const a = pct * Math.PI * 2;
            let r = s * 0.8 + Math.sin(a * 3 + t * 3.5) * s * 0.1;
            const px = Math.cos(a) * r;
            const py = Math.sin(a) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();

        // Eerie glow ring
        ctx.shadowColor = enemy.color;
        ctx.shadowBlur = 15;
        ctx.strokeStyle = colorAlpha(brighten(enemy.color, 50), isPhased ? 0.08 : 0.25);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Hollow eyes (large, haunted ovals - wailing)
        const eyeAlpha = isPhased ? 0.25 : 0.85;
        ctx.fillStyle = colorAlpha('#ffffff', eyeAlpha);
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = isPhased ? 10 : 5;
        // Left eye
        ctx.beginPath();
        ctx.ellipse(-s * 0.25, -s * 0.15, 3, 3.5 + Math.sin(t * 5) * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        // Right eye
        ctx.beginPath();
        ctx.ellipse(s * 0.25, -s * 0.15, 3, 3.5 + Math.sin(t * 5 + 1) * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        // Eye black centers
        ctx.fillStyle = colorAlpha('#200040', eyeAlpha);
        ctx.beginPath();
        ctx.arc(-s * 0.25, -s * 0.13, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(s * 0.25, -s * 0.13, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Wailing mouth (dark void, opens and closes)
        const mouthOpen = (Math.sin(t * 4) + 1) * 0.5;
        ctx.fillStyle = colorAlpha('#0a0020', isPhased ? 0.15 : 0.5);
        ctx.beginPath();
        ctx.ellipse(0, s * 0.2, 2.5 + mouthOpen, 3 + mouthOpen * 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.restore();

        // Trailing wisps
        if (Math.random() < 0.07) {
            GameState.particles.push(new Particle(
                x + rand(-s, s),
                y + hover + rand(-s * 0.5, s * 1.2),
                {
                    vx: rand(-0.5, 0.5), vy: rand(-1.5, -0.3),
                    life: 0.6, size: rand(1, 3.5),
                    color: brighten(enemy.color, 20), glow: true
                }
            ));
        }
    },

    // ============================================================
    // ===== BERSERKER - Raging demon warrior ====================
    // ============================================================
    _drawBerserker(ctx, enemy, x, y, size, t, anim) {
        const hpPct = enemy.hp / enemy.maxHp;
        const rage = clamp(1 - hpPct, 0, 1);
        const bob = Math.sin(t * 6 + enemy.bobOffset) * (1 + rage * 2.5);
        const shake = rage > 0.5 ? (Math.sin(t * 30) * rage * 1.5) : 0;

        // Rage color: transitions from base to deep angry red
        const rageR = Math.min(255, 200 + rage * 55);
        const rageG = Math.max(0, Math.floor(40 * (1 - rage * 0.9)));
        const rageB = Math.max(0, Math.floor(30 * (1 - rage * 0.9)));
        const rageColor = rgbToHex(rageR, rageG, rageB);
        const enrageGrow = 1 + rage * 0.25;
        const s = size * enrageGrow;

        ctx.save();
        ctx.translate(x + shake, y + bob);

        // === RAGE AURA (stronger at low HP) ===
        if (rage > 0.2) {
            const auraAlpha = rage * 0.18;
            const auraR = s * (1.6 + Math.sin(t * 6) * 0.3);
            const grad = ctx.createRadialGradient(0, 0, s * 0.3, 0, 0, auraR);
            grad.addColorStop(0, colorAlpha('#ff0000', auraAlpha));
            grad.addColorStop(0.5, colorAlpha('#ff2200', auraAlpha * 0.5));
            grad.addColorStop(1, 'rgba(255,0,0,0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(0, 0, auraR, 0, Math.PI * 2);
            ctx.fill();
        }

        // Ground shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(0, s + 2, s * 0.6, 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Legs (stomping, aggressive)
        ctx.strokeStyle = brighten(rageColor, -30);
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-s * 0.3, s * 0.4);
        ctx.lineTo(-s * 0.4 + Math.sin(t * 8) * 3, s + 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(s * 0.3, s * 0.4);
        ctx.lineTo(s * 0.4 - Math.sin(t * 8) * 3, s + 2);
        ctx.stroke();

        // Main body - massive trapezoidal warrior torso
        ctx.fillStyle = rageColor;
        ctx.shadowColor = rage > 0.5 ? '#ff0000' : rageColor;
        ctx.shadowBlur = rage * 15;
        ctx.beginPath();
        ctx.moveTo(-s * 0.95, -s * 0.7);
        ctx.lineTo(s * 0.95, -s * 0.7);
        ctx.lineTo(s * 0.65, s * 0.7);
        ctx.lineTo(-s * 0.65, s * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;

        // Body border
        ctx.strokeStyle = brighten(rageColor, 30);
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Chest battle scar X (gets redder with rage)
        ctx.strokeStyle = brighten(rageColor, -50 + rage * 30);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-s * 0.35, -s * 0.35);
        ctx.lineTo(s * 0.35, s * 0.35);
        ctx.moveTo(s * 0.35, -s * 0.35);
        ctx.lineTo(-s * 0.35, s * 0.35);
        ctx.stroke();

        // Armored belt/waist
        ctx.fillStyle = '#553333';
        ctx.fillRect(-s * 0.7, s * 0.2, s * 1.4, s * 0.15);

        // Head
        const headGrad = ctx.createRadialGradient(0, -s * 0.95, 0, 0, -s * 0.95, s * 0.45);
        headGrad.addColorStop(0, brighten(rageColor, 15));
        headGrad.addColorStop(1, rageColor);
        ctx.fillStyle = headGrad;
        ctx.beginPath();
        ctx.arc(0, -s * 0.9, s * 0.4, 0, Math.PI * 2);
        ctx.fill();

        // Angry eyes - glow intensely at low hp
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 5 + rage * 12;
        ctx.fillStyle = `rgb(255,${Math.floor(80 * (1 - rage))},0)`;
        const eyeSize = 2 + rage * 1.5;
        ctx.beginPath();
        ctx.arc(-s * 0.15, -s * 0.93, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(s * 0.15, -s * 0.93, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Furious angry brows (more angled with rage)
        ctx.strokeStyle = '#1a0000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-s * 0.35, -s * (1.15 + rage * 0.1));
        ctx.lineTo(-s * 0.05, -s * 1.0);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(s * 0.35, -s * (1.15 + rage * 0.1));
        ctx.lineTo(s * 0.05, -s * 1.0);
        ctx.stroke();

        // Snarling mouth
        ctx.strokeStyle = '#220000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-s * 0.2, -s * 0.78);
        ctx.lineTo(-s * 0.1, -s * 0.72);
        ctx.lineTo(0, -s * 0.75);
        ctx.lineTo(s * 0.1, -s * 0.72);
        ctx.lineTo(s * 0.2, -s * 0.78);
        ctx.stroke();

        // Spikes on body (grow with rage)
        const spikeLen = 4 + rage * 7;
        ctx.fillStyle = rage > 0.5 ? '#aa1111' : '#771111';
        // Left spikes
        for (let i = 0; i < 3 + Math.floor(rage * 2); i++) {
            const sy = -s * 0.5 + i * s * 0.3;
            ctx.beginPath();
            ctx.moveTo(-s * 0.9, sy - 2.5);
            ctx.lineTo(-s * 0.9 - spikeLen, sy);
            ctx.lineTo(-s * 0.9, sy + 2.5);
            ctx.closePath();
            ctx.fill();
        }
        // Right spikes
        for (let i = 0; i < 3 + Math.floor(rage * 2); i++) {
            const sy = -s * 0.5 + i * s * 0.3;
            ctx.beginPath();
            ctx.moveTo(s * 0.9, sy - 2.5);
            ctx.lineTo(s * 0.9 + spikeLen, sy);
            ctx.lineTo(s * 0.9, sy + 2.5);
            ctx.closePath();
            ctx.fill();
        }

        // Head spikes / mohawk (at high rage)
        if (rage > 0.3) {
            ctx.fillStyle = '#991111';
            for (let i = 0; i < 3; i++) {
                const mx = (i - 1) * s * 0.15;
                const mh = 3 + rage * 5 + i * rage * 2;
                ctx.beginPath();
                ctx.moveTo(mx - 2, -s * 1.2);
                ctx.lineTo(mx, -s * 1.2 - mh);
                ctx.lineTo(mx + 2, -s * 1.2);
                ctx.closePath();
                ctx.fill();
            }
        }

        ctx.restore();

        // Rage particles (more at low HP)
        if (rage > 0.3 && Math.random() < rage * 0.25) {
            GameState.particles.push(new Particle(
                x + shake + rand(-s, s),
                y + bob + rand(-s, s * 0.5),
                {
                    vx: rand(-1.5, 1.5), vy: rand(-2.5, -0.5),
                    life: 0.3, size: rand(1.5, 3.5),
                    color: '#ff2000', glow: true
                }
            ));
        }
    },

    // ============================================================
    // ===== SWARMFAST (Buzzer) - Lightning-fast wasp ============
    // ============================================================
    _drawSwarmfast(ctx, enemy, x, y, size, t, anim) {
        const buzzX = Math.sin(t * 30 + enemy.bobOffset * 11) * 1.0;
        const buzzY = Math.cos(t * 25 + enemy.bobOffset * 9) * 0.8;
        const dx = x + buzzX;
        const dy = y + buzzY;
        const s = size;

        ctx.save();
        ctx.translate(dx, dy);
        ctx.rotate(enemy.angle);

        // Wing beat (ultra-fast flicker - nearly invisible)
        const wingPhase = Math.sin(t * 45 + enemy.bobOffset * 13);
        ctx.fillStyle = colorAlpha('#e0ff80', wingPhase > 0 ? 0.35 : 0.15);
        ctx.beginPath();
        ctx.ellipse(-s * 0.1, -s * (wingPhase > 0 ? 0.9 : 0.5), s * 0.55, s * 0.2, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = colorAlpha('#e0ff80', wingPhase > 0 ? 0.15 : 0.35);
        ctx.beginPath();
        ctx.ellipse(-s * 0.1, s * (wingPhase > 0 ? 0.5 : 0.9), s * 0.55, s * 0.2, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Abdomen (back segment, striped)
        ctx.fillStyle = brighten(enemy.color, -20);
        ctx.beginPath();
        ctx.ellipse(-s * 0.35, 0, s * 0.4, s * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        // Stripes on abdomen
        ctx.strokeStyle = '#333300';
        ctx.lineWidth = 0.7;
        for (let i = 0; i < 3; i++) {
            const sx = -s * 0.2 - i * s * 0.12;
            ctx.beginPath();
            ctx.moveTo(sx, -s * 0.25);
            ctx.lineTo(sx, s * 0.25);
            ctx.stroke();
        }

        // Thorax (front segment)
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.ellipse(s * 0.15, 0, s * 0.45, s * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();

        // Tiny angry eyes
        ctx.fillStyle = '#ff0000';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 3;
        ctx.beginPath();
        ctx.arc(s * 0.45, -s * 0.12, 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(s * 0.45, s * 0.12, 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Stinger (sharp, menacing)
        ctx.strokeStyle = '#bb8800';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-s * 0.7, 0);
        ctx.lineTo(-s * 1.15, 0);
        ctx.stroke();
        ctx.fillStyle = '#cc9900';
        ctx.beginPath();
        ctx.moveTo(-s * 1.15, 0);
        ctx.lineTo(-s * 1.0, -s * 0.08);
        ctx.lineTo(-s * 1.0, s * 0.08);
        ctx.closePath();
        ctx.fill();

        ctx.restore();

        // Buzzer swarm connections
        if (GameState.enemies) {
            ctx.strokeStyle = colorAlpha(enemy.color, 0.1);
            ctx.lineWidth = 0.3;
            for (const other of GameState.enemies) {
                if (other === enemy || !other.alive) continue;
                if (other.type !== 'swarm' && other.type !== 'swarmfast') continue;
                const d = Math.hypot(other.x - dx, other.y - dy);
                if (d < 35 && d > 0) {
                    ctx.beginPath();
                    ctx.moveTo(dx, dy);
                    ctx.lineTo(other.x, other.y);
                    ctx.stroke();
                }
            }
        }
    },

    // ============================================================
    // ===== BOSS (Overlord) - MASSIVE TERRIFYING MONSTROSITY ====
    // ============================================================
    _drawBoss(ctx, enemy, x, y, size, t, anim) {
        // Boss intro grow-in animation: pulse/grow from small to full over ~2s
        let introScale = 1.0;
        if (anim.bossIntroTimer < 2.0) {
            anim.bossIntroTimer += 1 / 60; // approximate per-frame increment
            const p = Math.min(anim.bossIntroTimer / 2.0, 1);
            // Elastic ease-out for dramatic pop-in
            const overshoot = 1.0 + Math.sin(p * Math.PI * 3) * 0.15 * (1 - p);
            introScale = p * overshoot;
        }

        // Bosses are drawn at 2.5x their size for dramatic presence
        const drawSize = size * 2.5 * introScale;
        const breathe = Math.sin(t * 2) * 0.06 + 1.0;
        const enraged = enemy.bossEnraged;
        const ds = Math.max(0.1, drawSize * breathe);

        ctx.save();
        ctx.translate(x, y);

        // Boss cast telegraph ring + label
        if (enemy.bossCastTimer > 0) {
            const castFrac = enemy.bossCastMaxTimer > 0
                ? Math.max(0, Math.min(1, enemy.bossCastTimer / enemy.bossCastMaxTimer))
                : 0;
            const telegraphR = ds * 1.85;

            ctx.beginPath();
            ctx.arc(0, 0, telegraphR, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 180, 120, 0.26)';
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(0, 0, telegraphR, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - castFrac));
            ctx.strokeStyle = enemy.bossProfile?.castColor || '#ffb080';
            ctx.lineWidth = 4;
            ctx.shadowColor = enemy.bossProfile?.castColor || '#ffb080';
            ctx.shadowBlur = 8;
            ctx.stroke();
            ctx.shadowBlur = 0;

            if (enemy.bossCastLabel) {
                ctx.font = 'bold 11px "Share Tech Mono"';
                ctx.textAlign = 'center';
                ctx.fillStyle = '#ffd6b0';
                ctx.fillText(enemy.bossCastLabel.toUpperCase(), 0, -telegraphR - 10);
            }
        }

        // === MASSIVE GROUND SHADOW ===
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(0, ds + 6, ds * 0.9, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // === SCREEN-PRESENCE AURA (outermost, intimidating) ===
        const auraRadius = Math.max(ds * 0.55, ds * 2.0 + Math.sin(t * 1.5) * 6);
        const auraGrad = ctx.createRadialGradient(0, 0, Math.max(0, ds * 0.4), 0, 0, auraRadius);
        const auraColor = enraged ? '#ff0000' : '#cc1010';
        auraGrad.addColorStop(0, colorAlpha(auraColor, 0.1));
        auraGrad.addColorStop(0.3, colorAlpha(auraColor, 0.06));
        auraGrad.addColorStop(0.6, colorAlpha(auraColor, 0.03));
        auraGrad.addColorStop(1, 'rgba(255,0,0,0)');
        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(0, 0, auraRadius, 0, Math.PI * 2);
        ctx.fill();

        // === DARK ENERGY RING (pulsing) ===
        const ringPulse = Math.sin(t * 3) * 0.1 + 0.9;
        ctx.strokeStyle = colorAlpha(enraged ? '#ff2020' : '#882020', 0.3);
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(0, 0, ds * 1.5 * ringPulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // === ARCANE RUNES floating in orbit ===
        const runeCount = 8;
        for (let i = 0; i < runeCount; i++) {
            const runeAngle = (Math.PI * 2 / runeCount) * i + t * 0.4;
            const runeR = ds * 1.4 + Math.sin(t * 2 + i * 1.5) * 5;
            const rx = Math.cos(runeAngle) * runeR;
            const ry = Math.sin(runeAngle) * runeR;
            ctx.save();
            ctx.translate(rx, ry);
            ctx.rotate(runeAngle + t * 0.8);
            const runeAlpha = 0.4 + Math.sin(t * 3 + i) * 0.25;
            ctx.fillStyle = colorAlpha(enraged ? '#ff4020' : '#ff6040', runeAlpha);
            ctx.shadowColor = enraged ? '#ff2000' : '#ff4020';
            ctx.shadowBlur = 5;
            // Rune symbol (cross in diamond)
            ctx.beginPath();
            ctx.moveTo(0, -3.5);
            ctx.lineTo(3.5, 0);
            ctx.lineTo(0, 3.5);
            ctx.lineTo(-3.5, 0);
            ctx.closePath();
            ctx.fill();
            ctx.fillRect(-0.8, -3, 1.6, 6);
            ctx.fillRect(-3, -0.8, 6, 1.6);
            ctx.shadowBlur = 0;
            ctx.restore();
        }

        // === ORBITING ARMOR SHARDS ===
        const shardCount = 6;
        for (let i = 0; i < shardCount; i++) {
            const orbAngle = (Math.PI * 2 / shardCount) * i + t * 1.0;
            const orbR = ds * 1.05;
            const ox = Math.cos(orbAngle) * orbR;
            const oy = Math.sin(orbAngle) * orbR;
            ctx.save();
            ctx.translate(ox, oy);
            ctx.rotate(orbAngle + Math.PI / 2);
            ctx.fillStyle = colorAlpha(enraged ? '#dd2020' : '#cc3030', 0.75);
            ctx.strokeStyle = enraged ? '#ff6040' : '#ff4030';
            ctx.lineWidth = 1;
            // Armor shard diamond
            ctx.beginPath();
            ctx.moveTo(0, -ds * 0.16);
            ctx.lineTo(-ds * 0.06, 0);
            ctx.lineTo(0, ds * 0.16);
            ctx.lineTo(ds * 0.06, 0);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }

        // === DARK WINGS (massive, bat-like) ===
        const wingFlap = Math.sin(t * 2.5) * 0.12;
        ctx.fillStyle = colorAlpha('#2a0a0a', 0.6);
        ctx.strokeStyle = '#551515';
        ctx.lineWidth = 1.5;
        // Left wing
        ctx.beginPath();
        ctx.moveTo(-ds * 0.5, -ds * 0.3);
        ctx.quadraticCurveTo(-ds * 1.2, -ds * (0.9 + wingFlap), -ds * 1.6, -ds * (0.5 + wingFlap * 0.5));
        ctx.lineTo(-ds * 1.4, -ds * 0.1);
        ctx.quadraticCurveTo(-ds * 1.1, ds * 0.1, -ds * 0.9, -ds * 0.05);
        ctx.lineTo(-ds * 0.7, ds * 0.15);
        ctx.quadraticCurveTo(-ds * 0.6, ds * 0.2, -ds * 0.4, ds * 0.1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Wing membrane lines
        ctx.strokeStyle = colorAlpha('#441111', 0.5);
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(-ds * 0.5, -ds * 0.25);
        ctx.lineTo(-ds * 1.3, -ds * (0.6 + wingFlap * 0.5));
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-ds * 0.5, -ds * 0.15);
        ctx.lineTo(-ds * 1.1, -ds * 0.1);
        ctx.stroke();
        // Right wing
        ctx.fillStyle = colorAlpha('#2a0a0a', 0.6);
        ctx.strokeStyle = '#551515';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(ds * 0.5, -ds * 0.3);
        ctx.quadraticCurveTo(ds * 1.2, -ds * (0.9 + wingFlap), ds * 1.6, -ds * (0.5 + wingFlap * 0.5));
        ctx.lineTo(ds * 1.4, -ds * 0.1);
        ctx.quadraticCurveTo(ds * 1.1, ds * 0.1, ds * 0.9, -ds * 0.05);
        ctx.lineTo(ds * 0.7, ds * 0.15);
        ctx.quadraticCurveTo(ds * 0.6, ds * 0.2, ds * 0.4, ds * 0.1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = colorAlpha('#441111', 0.5);
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(ds * 0.5, -ds * 0.25);
        ctx.lineTo(ds * 1.3, -ds * (0.6 + wingFlap * 0.5));
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(ds * 0.5, -ds * 0.15);
        ctx.lineTo(ds * 1.1, -ds * 0.1);
        ctx.stroke();

        // === OUTER BODY / ARMORED SHELL (octagonal) ===
        const outerGrad = ctx.createRadialGradient(0, -ds * 0.15, ds * 0.1, 0, 0, ds);
        outerGrad.addColorStop(0, brighten(enemy.color, 20));
        outerGrad.addColorStop(0.5, enemy.color);
        outerGrad.addColorStop(1, brighten(enemy.color, -30));
        ctx.fillStyle = outerGrad;
        ctx.shadowColor = enraged ? '#ff0000' : enemy.color;
        ctx.shadowBlur = 22;
        drawPoly(ctx, 0, 0, 8, ds, t * 0.3);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Armor plate outlines
        ctx.strokeStyle = enraged ? '#ff6060' : '#ff8080';
        ctx.lineWidth = 3;
        drawPoly(ctx, 0, 0, 8, ds, t * 0.3);
        ctx.stroke();

        // Inner armor layer
        ctx.fillStyle = brighten(enemy.color, -35);
        drawPoly(ctx, 0, 0, 8, ds * 0.72, t * 0.3 + 0.2);
        ctx.fill();
        ctx.strokeStyle = enraged ? '#cc4040' : '#aa3030';
        ctx.lineWidth = 1.5;
        drawPoly(ctx, 0, 0, 8, ds * 0.72, t * 0.3 + 0.2);
        ctx.stroke();

        // Veined/cracked detail on armor
        ctx.strokeStyle = colorAlpha(enraged ? '#ff4040' : '#882020', 0.3);
        ctx.lineWidth = 0.8;
        for (let i = 0; i < 8; i++) {
            const va = (Math.PI * 2 / 8) * i + t * 0.3;
            ctx.beginPath();
            ctx.moveTo(Math.cos(va) * ds * 0.35, Math.sin(va) * ds * 0.35);
            const midA = va + Math.sin(i * 3) * 0.3;
            ctx.quadraticCurveTo(
                Math.cos(midA) * ds * 0.6, Math.sin(midA) * ds * 0.6,
                Math.cos(va) * ds * 0.9, Math.sin(va) * ds * 0.9
            );
            ctx.stroke();
        }

        // === CENTRAL EYE (massive, tracks nearest tower) ===
        let eyeAngle = t * 0.5;
        if (GameState.towers && GameState.towers.length > 0) {
            let nearestDist = Infinity;
            for (const tower of GameState.towers) {
                const d = Math.hypot(tower.x - x, tower.y - y);
                if (d < nearestDist) {
                    nearestDist = d;
                    eyeAngle = Math.atan2(tower.y - y, tower.x - x);
                }
            }
        }

        // Eye socket (dark void)
        ctx.fillStyle = '#120000';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(0, 0, ds * 0.35, 0, Math.PI * 2);
        ctx.fill();

        // Iris (fiery gradient)
        const irisGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, ds * 0.32);
        irisGrad.addColorStop(0, enraged ? '#ffcc00' : '#ff8000');
        irisGrad.addColorStop(0.3, enraged ? '#ff6600' : '#ff4000');
        irisGrad.addColorStop(0.7, enraged ? '#ff2200' : '#cc2000');
        irisGrad.addColorStop(1, '#660000');
        ctx.fillStyle = irisGrad;
        ctx.beginPath();
        ctx.arc(0, 0, ds * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Iris texture (radial lines)
        ctx.strokeStyle = colorAlpha('#ff6000', 0.3);
        ctx.lineWidth = 0.5;
        for (let i = 0; i < 12; i++) {
            const ia = (Math.PI * 2 / 12) * i;
            ctx.beginPath();
            ctx.moveTo(Math.cos(ia) * ds * 0.08, Math.sin(ia) * ds * 0.08);
            ctx.lineTo(Math.cos(ia) * ds * 0.28, Math.sin(ia) * ds * 0.28);
            ctx.stroke();
        }

        // Slit pupil (vertical, tracks towers)
        const pupilDist = ds * 0.08;
        const pupilX = Math.cos(eyeAngle) * pupilDist;
        const pupilY = Math.sin(eyeAngle) * pupilDist;
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        // Vertical slit pupil
        ctx.ellipse(pupilX, pupilY, ds * 0.06, ds * 0.2, eyeAngle * 0.1, 0, Math.PI * 2);
        ctx.fill();

        // Eye highlight (specular)
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.beginPath();
        ctx.arc(-ds * 0.1, -ds * 0.12, ds * 0.06, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,200,100,0.3)';
        ctx.beginPath();
        ctx.arc(ds * 0.05, ds * 0.08, ds * 0.03, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // === CROWN OF HORNS (5 horns, dramatically large) ===
        const hornColor = enraged ? '#cc3300' : '#aa7722';
        const hornGlow = enraged ? '#ff2200' : '#ffd700';
        ctx.shadowColor = hornGlow;
        ctx.shadowBlur = 10;

        // Horn definitions: [base_angle, curve, length]
        const horns = [
            { baseX: -ds * 0.55, baseY: -ds * 0.7, tipX: -ds * 0.85, tipY: -ds * 1.65, w: ds * 0.12 },
            { baseX: -ds * 0.25, baseY: -ds * 0.85, tipX: -ds * 0.3, tipY: -ds * 1.55, w: ds * 0.1 },
            { baseX: 0, baseY: -ds * 0.9, tipX: 0, tipY: -ds * 1.7, w: ds * 0.12 },
            { baseX: ds * 0.25, baseY: -ds * 0.85, tipX: ds * 0.3, tipY: -ds * 1.55, w: ds * 0.1 },
            { baseX: ds * 0.55, baseY: -ds * 0.7, tipX: ds * 0.85, tipY: -ds * 1.65, w: ds * 0.12 },
        ];

        for (const h of horns) {
            // Horn gradient
            const hGrad = ctx.createLinearGradient(h.baseX, h.baseY, h.tipX, h.tipY);
            hGrad.addColorStop(0, hornColor);
            hGrad.addColorStop(0.5, brighten(hornColor, 15));
            hGrad.addColorStop(1, brighten(hornColor, -20));
            ctx.fillStyle = hGrad;
            ctx.beginPath();
            ctx.moveTo(h.baseX - h.w, h.baseY);
            ctx.quadraticCurveTo(h.tipX - h.w * 0.3, (h.baseY + h.tipY) * 0.5, h.tipX, h.tipY);
            ctx.quadraticCurveTo(h.tipX + h.w * 0.3, (h.baseY + h.tipY) * 0.5, h.baseX + h.w, h.baseY);
            ctx.closePath();
            ctx.fill();
            // Horn ridge highlight
            ctx.strokeStyle = colorAlpha(brighten(hornColor, 40), 0.4);
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            ctx.moveTo(h.baseX, h.baseY);
            ctx.quadraticCurveTo(h.tipX, (h.baseY + h.tipY) * 0.5, h.tipX, h.tipY);
            ctx.stroke();
        }

        // Crown base connecting horns
        ctx.strokeStyle = hornGlow;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-ds * 0.65, -ds * 0.7);
        ctx.quadraticCurveTo(-ds * 0.35, -ds * 0.95, 0, -ds * 0.9);
        ctx.quadraticCurveTo(ds * 0.35, -ds * 0.95, ds * 0.65, -ds * 0.7);
        ctx.stroke();
        // Crown jewel
        ctx.fillStyle = enraged ? '#ff0000' : '#ffd700';
        ctx.shadowColor = enraged ? '#ff0000' : '#ffd700';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(0, -ds * 0.9, ds * 0.06, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // === MOUTH / JAW (below the eye, opens and closes) ===
        const jawOpen = Math.sin(t * 2) * ds * 0.04 + ds * 0.04;
        ctx.fillStyle = '#0a0000';
        ctx.beginPath();
        ctx.moveTo(-ds * 0.3, ds * 0.35);
        ctx.quadraticCurveTo(0, ds * 0.35 + jawOpen + ds * 0.08, ds * 0.3, ds * 0.35);
        ctx.quadraticCurveTo(0, ds * 0.35 + jawOpen + ds * 0.15, -ds * 0.3, ds * 0.35);
        ctx.fill();
        // Teeth
        ctx.fillStyle = '#ddccaa';
        for (let i = 0; i < 5; i++) {
            const tx = -ds * 0.2 + i * ds * 0.1;
            ctx.beginPath();
            ctx.moveTo(tx - ds * 0.02, ds * 0.35);
            ctx.lineTo(tx, ds * 0.35 + jawOpen * 0.5 + ds * 0.04);
            ctx.lineTo(tx + ds * 0.02, ds * 0.35);
            ctx.closePath();
            ctx.fill();
        }

        // === FIRE / ENERGY PARTICLE TRAIL ===
        if (Math.random() < 0.45) {
            const angle = rand(0, Math.PI * 2);
            const r = rand(ds * 0.3, ds * 1.3);
            const colors = ['#ff4020', '#ff8020', '#ffcc20', '#ff2000', '#ff6000'];
            GameState.particles.push(new Particle(
                x + Math.cos(angle) * r,
                y + Math.sin(angle) * r,
                {
                    vx: rand(-1, 1),
                    vy: rand(-3.5, -1),
                    life: rand(0.3, 0.8),
                    size: rand(2, 4),
                    color: colors[Math.floor(Math.random() * colors.length)],
                    glow: true
                }
            ));
        }

        // === DARK SMOKE from below ===
        if (Math.random() < 0.1) {
            GameState.particles.push(new Particle(
                x + rand(-ds * 0.5, ds * 0.5),
                y + ds * 0.8,
                {
                    vx: rand(-0.3, 0.3), vy: rand(0.3, 1),
                    life: 0.6, size: rand(3, 6), color: '#2a1010'
                }
            ));
        }

        // === ENRAGE VISUALS ===
        if (enraged) {
            // Pulsing red overlay
            ctx.fillStyle = colorAlpha('#ff0000', 0.12 + Math.sin(t * 8) * 0.06);
            ctx.beginPath();
            ctx.arc(0, 0, ds * 1.1, 0, Math.PI * 2);
            ctx.fill();

            // Extra fire particles
            if (Math.random() < 0.35) {
                const angle = rand(0, Math.PI * 2);
                GameState.particles.push(new Particle(
                    x + Math.cos(angle) * ds,
                    y + Math.sin(angle) * ds,
                    {
                        vx: Math.cos(angle) * 2.5,
                        vy: Math.sin(angle) * 2.5 - 2,
                        life: 0.45,
                        size: rand(2.5, 5),
                        color: '#ff2000',
                        glow: true
                    }
                ));
            }

            // Enrage cracks / energy lines on body
            ctx.strokeStyle = colorAlpha('#ff6600', 0.4 + Math.sin(t * 6) * 0.2);
            ctx.lineWidth = 1.5;
            for (let i = 0; i < 6; i++) {
                const ca = (Math.PI * 2 / 6) * i + t * 0.2;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                const mx = Math.cos(ca + 0.3) * ds * 0.5;
                const my = Math.sin(ca + 0.3) * ds * 0.5;
                ctx.quadraticCurveTo(mx, my, Math.cos(ca) * ds * 0.85, Math.sin(ca) * ds * 0.85);
                ctx.stroke();
            }
        }

        ctx.restore();
    },

    // ============================================================
    // ===== HP BAR ==============================================
    // ============================================================
    _drawHPBar(ctx, enemy, x, y, size) {
        if (enemy.hp >= enemy.maxHp) return;

        const isBoss = enemy.isBoss || enemy.type === 'boss';
        const pct = clamp(enemy.hp / enemy.maxHp, 0, 1);

        if (isBoss) {
            // === BOSS HP BAR (dramatic, wide, prominent) ===
            const drawSize = size * 2.5;
            const barW = drawSize * 2.5;
            const barH = 7;
            const barX = x - barW / 2;
            const barY = y - drawSize - 25;

            // Outer frame
            ctx.fillStyle = 'rgba(0,0,0,0.85)';
            ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);

            // Inner background
            ctx.fillStyle = '#1a0000';
            ctx.fillRect(barX, barY, barW, barH);

            // HP fill gradient
            const hpGrad = ctx.createLinearGradient(barX, 0, barX + barW * pct, 0);
            if (pct > 0.5) {
                hpGrad.addColorStop(0, '#ff4040');
                hpGrad.addColorStop(1, '#ff8040');
            } else if (pct > 0.25) {
                hpGrad.addColorStop(0, '#ff3030');
                hpGrad.addColorStop(1, '#ff5020');
            } else {
                hpGrad.addColorStop(0, '#ff2020');
                hpGrad.addColorStop(1, '#ff1010');
            }
            ctx.fillStyle = hpGrad;
            ctx.fillRect(barX, barY, barW * pct, barH);

            // Shiny highlight on bar
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.fillRect(barX, barY, barW * pct, barH * 0.35);

            // Tick marks at 25% intervals
            ctx.strokeStyle = 'rgba(0,0,0,0.4)';
            ctx.lineWidth = 1;
            for (let i = 1; i < 4; i++) {
                const tickX = barX + (barW / 4) * i;
                ctx.beginPath();
                ctx.moveTo(tickX, barY);
                ctx.lineTo(tickX, barY + barH);
                ctx.stroke();
            }

            // Frame border (glowing if enraged)
            if (enemy.bossEnraged) {
                ctx.strokeStyle = '#ff4040';
                ctx.shadowColor = '#ff0000';
                ctx.shadowBlur = 4;
            } else {
                ctx.strokeStyle = 'rgba(255,180,180,0.5)';
            }
            ctx.lineWidth = 1.5;
            ctx.strokeRect(barX - 1, barY - 1, barW + 2, barH + 2);
            ctx.shadowBlur = 0;

            // Boss name tag
            ctx.fillStyle = '#ffcccc';
            ctx.font = 'bold 7px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(enemy.name || 'BOSS', x, barY - 3);

            // HP percentage text
            ctx.fillStyle = '#ffffff';
            ctx.font = '6px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(Math.ceil(pct * 100) + '%', x, barY + barH / 2);
        } else {
            // === REGULAR ENEMY HP BAR ===
            const barW = size * 2 + 4;
            const barH = 3;
            const barX = x - barW / 2;
            const barY = y - size - 8;

            // Background
            ctx.fillStyle = 'rgba(0,0,0,0.55)';
            ctx.fillRect(barX - 0.5, barY - 0.5, barW + 1, barH + 1);

            // Fill
            const color = pct > 0.5 ? '#40ff40' : pct > 0.25 ? '#ffaa00' : '#ff4040';
            ctx.fillStyle = color;
            ctx.fillRect(barX, barY, barW * pct, barH);

            // Highlight
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.fillRect(barX, barY, barW * pct, barH * 0.4);

            // Border
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(barX, barY, barW, barH);
        }
    },

    // ============================================================
    // ===== TUNNELER — Burrowing mole-like creature ============
    // ============================================================
    _drawTunneler(ctx, enemy, x, y, size, t, anim) {
        const bob = Math.sin(t * 4 + enemy.bobOffset) * 2;
        const s = size;
        const burrowed = enemy._burrowed;

        ctx.save();
        ctx.translate(x, y + bob * 0.5);

        if (burrowed) {
            // Underground — draw dirt mound
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = '#6B4226';
            ctx.beginPath();
            ctx.ellipse(0, 2, s * 1.2, s * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();
            // Dirt particles
            for (let i = 0; i < 3; i++) {
                const px = Math.sin(t * 5 + i * 2) * s * 0.8;
                const py = -Math.abs(Math.cos(t * 6 + i * 1.5)) * s * 0.6;
                ctx.fillStyle = '#8B6914';
                ctx.beginPath();
                ctx.arc(px, py, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
        } else {
            // Ground shadow
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.beginPath();
            ctx.ellipse(0, s * 0.6, s * 0.8, s * 0.25, 0, 0, Math.PI * 2);
            ctx.fill();

            // Body — oval mole shape
            ctx.fillStyle = '#8B6914';
            ctx.beginPath();
            ctx.ellipse(0, 0, s * 0.8, s * 0.6, 0, 0, Math.PI * 2);
            ctx.fill();

            // Claws
            ctx.fillStyle = '#DAA520';
            ctx.beginPath();
            ctx.moveTo(-s * 0.6, s * 0.2);
            ctx.lineTo(-s * 0.9, s * 0.5);
            ctx.lineTo(-s * 0.4, s * 0.35);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(s * 0.6, s * 0.2);
            ctx.lineTo(s * 0.9, s * 0.5);
            ctx.lineTo(s * 0.4, s * 0.35);
            ctx.closePath();
            ctx.fill();

            // Eyes
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(-s * 0.25, -s * 0.15, s * 0.15, 0, Math.PI * 2);
            ctx.arc(s * 0.25, -s * 0.15, s * 0.15, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(-s * 0.25, -s * 0.15, s * 0.08, 0, Math.PI * 2);
            ctx.arc(s * 0.25, -s * 0.15, s * 0.08, 0, Math.PI * 2);
            ctx.fill();

            // Snout
            ctx.fillStyle = '#D2691E';
            ctx.beginPath();
            ctx.ellipse(0, s * 0.1, s * 0.2, s * 0.15, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    },

    // ============================================================
    // ===== MIRROR — Reflective crystalline enemy ===============
    // ============================================================
    _drawMirror(ctx, enemy, x, y, size, t, anim) {
        const s = size;
        const shimmer = Math.sin(t * 5 + enemy.bobOffset) * 0.15;

        ctx.save();
        ctx.translate(x, y);

        // Ground shadow
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.ellipse(0, s * 0.5, s * 0.7, s * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Crystal body — diamond shape
        ctx.fillStyle = '#C0C0FF';
        ctx.globalAlpha = 0.7 + shimmer;
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.9);
        ctx.lineTo(s * 0.6, 0);
        ctx.lineTo(0, s * 0.9);
        ctx.lineTo(-s * 0.6, 0);
        ctx.closePath();
        ctx.fill();

        // Highlight facets
        ctx.fillStyle = '#E8E8FF';
        ctx.globalAlpha = 0.5 + shimmer;
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.9);
        ctx.lineTo(s * 0.6, 0);
        ctx.lineTo(0, -s * 0.2);
        ctx.closePath();
        ctx.fill();

        // Reflective glow
        ctx.globalAlpha = 0.2 + shimmer * 0.3;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.9);
        ctx.lineTo(s * 0.6, 0);
        ctx.lineTo(0, s * 0.9);
        ctx.lineTo(-s * 0.6, 0);
        ctx.closePath();
        ctx.stroke();

        // Sparkle
        const sparkAngle = t * 3;
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.6 + Math.sin(sparkAngle) * 0.4;
        ctx.beginPath();
        ctx.arc(Math.cos(sparkAngle) * s * 0.3, Math.sin(sparkAngle) * s * 0.3, 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    },

    // ============================================================
    // ===== SAPPER — Sneaky gold thief ========================
    // ============================================================
    _drawSapper(ctx, enemy, x, y, size, t, anim) {
        const bob = Math.sin(t * 8 + enemy.bobOffset) * 1;
        const s = size;

        ctx.save();
        ctx.translate(x, y + bob);

        // Ground shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(0, s * 0.5, s * 0.6, s * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body — small hunched figure
        ctx.fillStyle = '#8B7355';
        ctx.beginPath();
        ctx.ellipse(0, 0, s * 0.5, s * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Hood/cloak
        ctx.fillStyle = '#6B5B45';
        ctx.beginPath();
        ctx.arc(0, -s * 0.2, s * 0.45, Math.PI, 0, false);
        ctx.closePath();
        ctx.fill();

        // Gold bag
        ctx.fillStyle = '#DAA520';
        ctx.beginPath();
        ctx.ellipse(s * 0.3, s * 0.1, s * 0.25, s * 0.2, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Gold shimmer
        const sparkle = Math.sin(t * 10) > 0.7;
        if (sparkle) {
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(s * 0.3, s * 0.05, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Beady eyes
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(-s * 0.15, -s * 0.25, s * 0.08, 0, Math.PI * 2);
        ctx.arc(s * 0.1, -s * 0.25, s * 0.08, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    },

    // ============================================================
    // ===== SUMMONER — Dark magic caster =====================
    // ============================================================
    _drawSummoner(ctx, enemy, x, y, size, t, anim) {
        const float = Math.sin(t * 2.5 + enemy.bobOffset) * 3;
        const s = size;

        ctx.save();
        ctx.translate(x, y + float);

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(0, s * 0.8 - float, s * 0.7, s * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Magic circle below
        const circleAlpha = 0.2 + Math.sin(t * 3) * 0.1;
        ctx.strokeStyle = `rgba(155, 48, 255, ${circleAlpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, s * 1.2, 0, Math.PI * 2);
        ctx.stroke();

        // Robe body
        ctx.fillStyle = '#4B0082';
        ctx.beginPath();
        ctx.moveTo(-s * 0.5, -s * 0.3);
        ctx.lineTo(-s * 0.7, s * 0.8);
        ctx.lineTo(s * 0.7, s * 0.8);
        ctx.lineTo(s * 0.5, -s * 0.3);
        ctx.closePath();
        ctx.fill();

        // Head/hood
        ctx.fillStyle = '#3B0062';
        ctx.beginPath();
        ctx.arc(0, -s * 0.4, s * 0.35, 0, Math.PI * 2);
        ctx.fill();

        // Glowing eyes
        const eyeGlow = 0.5 + Math.sin(t * 4) * 0.3;
        ctx.fillStyle = `rgba(200, 100, 255, ${eyeGlow})`;
        ctx.shadowColor = '#9B30FF';
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.arc(-s * 0.12, -s * 0.42, s * 0.06, 0, Math.PI * 2);
        ctx.arc(s * 0.12, -s * 0.42, s * 0.06, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Floating orbs
        for (let i = 0; i < 3; i++) {
            const orbAngle = t * 2 + (Math.PI * 2 / 3) * i;
            const orbX = Math.cos(orbAngle) * s * 0.8;
            const orbY = Math.sin(orbAngle) * s * 0.5 - s * 0.3;
            ctx.fillStyle = `rgba(155, 48, 255, ${0.4 + Math.sin(t * 3 + i) * 0.2})`;
            ctx.beginPath();
            ctx.arc(orbX, orbY, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    },
};
