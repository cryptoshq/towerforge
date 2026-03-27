// ===== TOWER RENDERING — ALL TOWER VISUAL STATES =====
// Redesigned: every tower is multi-layered with gradients, glows, tier
// progression, path differentiation, firing animations, and particles.
// Inspired by the Photon (Laser) icon quality from TowerIcons.

const TowerRenderer = {
    draw(ctx, tower) {
        const ts = CONFIG.TILE_SIZE;
        const x = tower.x;
        const y = tower.y;
        const def = TOWERS[tower.type];
        const t = GameState.time;

        ctx.save();

        // Placement bounce: spring scale-in from 0 → 1.15 → 1.0
        if (tower.placeBounce > 0) {
            const p = 1 - tower.placeBounce; // 0 = just placed, 1 = settled
            let tileScale;
            if (p < 0.55) {
                tileScale = (p / 0.55) * 1.18; // scale up with overshoot
            } else {
                tileScale = 1.18 - ((p - 0.55) / 0.45) * 0.18; // ease back to 1.0
            }
            ctx.translate(x, y);
            ctx.scale(tileScale, tileScale);
            ctx.translate(-x, -y);
        }

        // Disabled overlay
        if (tower.disabled) {
            ctx.globalAlpha = 0.5;
        }

        // Draw range circle if selected or hovered
        if (GameState.selectedTower === tower || GameState.settings.showRanges) {
            const range = tower.getEffectiveRange();
            ctx.strokeStyle = colorAlpha(def.iconColor, 0.3);
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.arc(x, y, range, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);

            // Fill
            ctx.fillStyle = colorAlpha(def.iconColor, 0.05);
            ctx.fill();
        }

        // Overclock glow
        if (tower.overclocked) {
            ctx.shadowColor = '#ff8040';
            ctx.shadowBlur = 15 + Math.sin(t * 10) * 5;
        }

        // Synergy discovery pulse
        if (tower.synergyPulse && tower.synergyPulse.timer > 0) {
            const pct = tower.synergyPulse.timer / 1.2;
            const radius = ts * 0.7 + (1 - pct) * ts * 0.5;
            ctx.save();
            ctx.globalAlpha = pct * 0.7;
            ctx.strokeStyle = tower.synergyPulse.color;
            ctx.shadowColor = tower.synergyPulse.color;
            ctx.shadowBlur = 12;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // Mastery glow effect (drawn before tower so it appears behind/around it)
        this._drawMasteryGlow(ctx, tower, x, y, ts, t);

        // Base rendering by type and tier
        this._drawTower(ctx, tower, x, y, ts, t);

        // Mastery star
        this._drawMasteryStar(ctx, tower, x, y);

        // Boost connections
        if (tower.type === 'boost') {
            this._drawBoostLines(ctx, tower);
        }

        // Targeting indicator
        if (GameState.selectedTower === tower) {
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 2;
            ctx.strokeRect(x - ts / 2 + 2, y - ts / 2 + 2, ts - 4, ts - 4);
        }

        // Upgrade flash: bright white burst that fades out
        if (tower.upgradeFlash > 0) {
            const flashAlpha = tower.upgradeFlash * 0.75;
            ctx.save();
            ctx.globalAlpha = flashAlpha;
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 20 * tower.upgradeFlash;
            ctx.beginPath();
            ctx.arc(x, y, ts * 0.58, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        ctx.restore();

        // Disabled smoke
        if (tower.disabled) {
            if (Math.random() < 0.1) {
                GameState.particles.push(new Particle(
                    x + rand(-8, 8), y - 10,
                    { vx: rand(-0.5, 0.5), vy: -rand(0.5, 1.5), life: rand(0.3, 0.6), size: rand(2, 4), color: '#666' }
                ));
            }
        }
    },

    _drawTower(ctx, tower, x, y, ts, t) {
        const half = ts / 2 - 2;
        const def = TOWERS[tower.type];
        const tier = tower.tier;
        const path = tower.path;

        switch (tower.type) {
            case 'arrow': this._drawArrow(ctx, tower, x, y, half, t); break;
            case 'cannon': this._drawCannon(ctx, tower, x, y, half, t); break;
            case 'ice': this._drawIce(ctx, tower, x, y, half, t); break;
            case 'lightning': this._drawLightning(ctx, tower, x, y, half, t); break;
            case 'sniper': this._drawSniper(ctx, tower, x, y, half, t); break;
            case 'laser': this._drawLaser(ctx, tower, x, y, half, t); break;
            case 'missile': this._drawMissile(ctx, tower, x, y, half, t); break;
            case 'boost': this._drawBoost(ctx, tower, x, y, half, t); break;
            case 'flame': this._drawFlame(ctx, tower, x, y, half, t); break;
            case 'venom': this._drawVenom(ctx, tower, x, y, half, t); break;
            case 'mortar': this._drawMortar(ctx, tower, x, y, half, t); break;
            case 'necro': this._drawNecro(ctx, tower, x, y, half, t); break;
        }
    },

    // =========================================================================
    // SHARED BASE DRAWING — circular/square platform with tier detail
    // =========================================================================
    _drawBase(ctx, x, y, half, tier, baseColor, accentColor, t) {
        // Tier 5 pulsing glow under base
        if (tier >= 5) {
            ctx.save();
            ctx.shadowColor = accentColor;
            ctx.shadowBlur = 12 + Math.sin(t * 3) * 5;
            ctx.fillStyle = colorAlpha(accentColor, 0.1 + Math.sin(t * 3) * 0.05);
            ctx.beginPath();
            ctx.arc(x, y, half + 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Main base platform with gradient
        ctx.save();
        const baseGrad = ctx.createRadialGradient(x - 2, y - 2, 0, x, y, half * 1.4);
        baseGrad.addColorStop(0, brighten(baseColor, 25));
        baseGrad.addColorStop(0.7, baseColor);
        baseGrad.addColorStop(1, brighten(baseColor, -20));
        ctx.fillStyle = baseGrad;
        if (tier >= 4) {
            ctx.shadowColor = accentColor;
            ctx.shadowBlur = 6 + tier;
        }
        this._roundRect(ctx, x - half, y - half, half * 2, half * 2, 4);
        ctx.fill();
        ctx.restore();

        // Border with metallic gradient
        ctx.save();
        const borderGrad = ctx.createLinearGradient(x - half, y - half, x + half, y + half);
        borderGrad.addColorStop(0, brighten(accentColor, 30));
        borderGrad.addColorStop(0.5, accentColor);
        borderGrad.addColorStop(1, brighten(accentColor, -20));
        ctx.strokeStyle = borderGrad;
        ctx.lineWidth = tier >= 4 ? 2 : 1.5;
        this._roundRect(ctx, x - half, y - half, half * 2, half * 2, 4);
        ctx.stroke();
        ctx.restore();

        // Tier rings on base
        if (tier >= 2) {
            ctx.save();
            ctx.strokeStyle = colorAlpha(accentColor, 0.15 + tier * 0.03);
            ctx.lineWidth = 0.5;
            const ringCount = Math.min(tier, 4);
            for (let i = 1; i <= ringCount; i++) {
                const r = half * (0.3 + i * 0.15);
                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.restore();
        }

        // Corner gems at tier 3+
        if (tier >= 3) {
            ctx.save();
            ctx.fillStyle = accentColor;
            if (tier >= 4) {
                ctx.shadowColor = accentColor;
                ctx.shadowBlur = 3;
            }
            const jInset = half - 2;
            const gemSize = tier >= 5 ? 2 : 1.5;
            for (let dx = -1; dx <= 1; dx += 2) {
                for (let dy = -1; dy <= 1; dy += 2) {
                    ctx.beginPath();
                    ctx.arc(x + dx * jInset, y + dy * jInset, gemSize, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            ctx.restore();
        }

        // Energy circuit for tier 4+
        if (tier >= 4) {
            ctx.save();
            ctx.strokeStyle = colorAlpha(accentColor, 0.12 + Math.sin(t * 2) * 0.06);
            ctx.lineWidth = 0.5;
            const inset = half - 4;
            ctx.beginPath();
            for (let i = 0; i < 8; i++) {
                const a = (Math.PI * 2 / 8) * i + Math.PI / 8;
                const px = x + Math.cos(a) * inset;
                const py = y + Math.sin(a) * inset;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.stroke();
            ctx.restore();
        }
    },

    // =========================================================================
    // ARROW TOWER (Ranger) — Elegant wooden watchtower / Marksman / Volley
    // =========================================================================
    _drawArrow(ctx, tower, x, y, half, t) {
        const tier = tower.tier;
        const isMarksman = tower.path === 'A';
        const isVolley = tower.path === 'B';

        // Base colors
        const baseColor = tier >= 4 ? (isMarksman ? '#2a3a2a' : isVolley ? '#3a2a1a' : '#3a4a2a')
            : tier >= 3 ? '#3a4a2a' : '#4a5a3a';
        const accent = tier >= 4 ? (isMarksman ? '#40ff80' : '#ff8040') : '#3ab06a';
        this._drawBase(ctx, x, y, half, tier, baseColor, accent, t);

        // Wooden plank texture on base (T1-2)
        if (tier <= 2) {
            ctx.save();
            ctx.strokeStyle = colorAlpha('#5a4a2a', 0.4);
            ctx.lineWidth = 0.5;
            for (let i = -1; i <= 1; i++) {
                ctx.beginPath();
                ctx.moveTo(x - half + 3, y + i * 5);
                ctx.lineTo(x + half - 3, y + i * 5);
                ctx.stroke();
            }
            ctx.restore();
        }

        // --- WEAPON ---
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(tower.angle);

        if (tier <= 2) {
            // T1-2: Elegant recurve bow with nocked arrow
            // Tower body — wooden with gradient
            const bodyGrad = ctx.createLinearGradient(-5, -6, 5, 6);
            bodyGrad.addColorStop(0, '#8a7a5a');
            bodyGrad.addColorStop(0.5, '#7a6a4a');
            bodyGrad.addColorStop(1, '#6a5a3a');
            ctx.fillStyle = bodyGrad;
            this._roundRectPath(ctx, -5, -6, 10, 12, 2);
            ctx.fill();

            // Bow limbs — wood grain gradient with glow
            ctx.save();
            ctx.shadowColor = '#3ab06a';
            ctx.shadowBlur = 3;
            const bowGrad = ctx.createLinearGradient(5, -10, 5, 10);
            bowGrad.addColorStop(0, '#a07818');
            bowGrad.addColorStop(0.3, '#c09020');
            bowGrad.addColorStop(0.5, '#d0a030');
            bowGrad.addColorStop(0.7, '#c09020');
            bowGrad.addColorStop(1, '#907010');
            ctx.strokeStyle = bowGrad;
            ctx.lineWidth = 2.5 + (tier - 1) * 0.5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.arc(5, 0, 10, -1.0, 1.0);
            ctx.stroke();
            ctx.restore();

            // Bow limb highlight
            ctx.strokeStyle = colorAlpha('#ffe090', 0.35);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(5, 0, 9, -0.8, 0.8);
            ctx.stroke();

            // Bowstring
            const topX = 5 + Math.cos(-1.0) * 10;
            const topY = Math.sin(-1.0) * 10;
            const botX = 5 + Math.cos(1.0) * 10;
            const botY = Math.sin(1.0) * 10;
            ctx.strokeStyle = '#ccc';
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            ctx.moveTo(topX, topY);
            ctx.lineTo(2, 0);
            ctx.lineTo(botX, botY);
            ctx.stroke();

            // Arrow shaft with metallic gradient
            const shaftGrad = ctx.createLinearGradient(-8, 0, 12, 0);
            shaftGrad.addColorStop(0, '#aaa');
            shaftGrad.addColorStop(0.5, '#e0e0e0');
            shaftGrad.addColorStop(1, '#fff');
            ctx.strokeStyle = shaftGrad;
            ctx.lineWidth = 1.3;
            ctx.beginPath();
            ctx.moveTo(-6, 0);
            ctx.lineTo(11, 0);
            ctx.stroke();

            // Arrowhead — glowing green
            ctx.save();
            ctx.shadowColor = '#80ffa0';
            ctx.shadowBlur = 4;
            ctx.fillStyle = '#e0ffe0';
            ctx.beginPath();
            ctx.moveTo(14, 0);
            ctx.lineTo(9, -3);
            ctx.lineTo(10, 0);
            ctx.lineTo(9, 3);
            ctx.closePath();
            ctx.fill();
            ctx.restore();

            // Fletching
            ctx.fillStyle = '#c03030';
            ctx.beginPath();
            ctx.moveTo(-6, 0);
            ctx.lineTo(-3, -3);
            ctx.lineTo(-2, 0);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(-6, 0);
            ctx.lineTo(-3, 3);
            ctx.lineTo(-2, 0);
            ctx.closePath();
            ctx.fill();

            // Quiver on the side (T2)
            if (tier >= 2) {
                ctx.save();
                ctx.fillStyle = '#5a3a1a';
                ctx.fillRect(-7, -8, 3, 7);
                ctx.strokeStyle = '#7a5a2a';
                ctx.lineWidth = 0.5;
                ctx.strokeRect(-7, -8, 3, 7);
                // Arrow tips poking out
                ctx.fillStyle = '#ddd';
                ctx.fillRect(-6.5, -9, 0.8, 2);
                ctx.fillRect(-5.5, -9.5, 0.8, 2);
                ctx.restore();
            }

        } else if (isMarksman) {
            // PATH A: Marksman — angular, precise, sniper crossbow
            if (tier === 3) {
                // T3A: Sleek crossbow with scope
                ctx.fillStyle = '#4a5a3a';
                this._roundRectPath(ctx, -7, -4, 14, 8, 2);
                ctx.fill();

                // Crossbow rail — metallic
                const railGrad = ctx.createLinearGradient(-3, 0, 16, 0);
                railGrad.addColorStop(0, '#777');
                railGrad.addColorStop(0.5, '#999');
                railGrad.addColorStop(1, '#888');
                ctx.fillStyle = railGrad;
                ctx.fillRect(-3, -2, 19, 4);

                // Cross piece with reinforcement
                ctx.fillStyle = '#aaa';
                ctx.fillRect(4, -9, 2.5, 18);
                ctx.strokeStyle = '#bbb';
                ctx.lineWidth = 0.5;
                ctx.strokeRect(4, -9, 2.5, 18);

                // Scope — glowing green lens
                ctx.save();
                const scopeGrad = ctx.createRadialGradient(9, -6, 0, 9, -6, 3.5);
                scopeGrad.addColorStop(0, '#80ffb0');
                scopeGrad.addColorStop(0.7, '#40ff80');
                scopeGrad.addColorStop(1, '#20aa50');
                ctx.fillStyle = scopeGrad;
                ctx.shadowColor = '#40ff80';
                ctx.shadowBlur = 6;
                ctx.beginPath();
                ctx.arc(9, -6, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                // Scope crosshair
                ctx.strokeStyle = '#20aa50';
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(9, -8); ctx.lineTo(9, -4);
                ctx.moveTo(7, -6); ctx.lineTo(11, -6);
                ctx.stroke();

            } else if (tier === 4) {
                // T4A: Heavy crossbow with dual scopes, stabilizers
                const bodyGrad = ctx.createLinearGradient(-8, -5, 8, 5);
                bodyGrad.addColorStop(0, '#3a4a2a');
                bodyGrad.addColorStop(1, '#2a3a1a');
                ctx.fillStyle = bodyGrad;
                this._roundRectPath(ctx, -8, -5, 16, 10, 3);
                ctx.fill();

                // Long precision barrel
                const barrelGrad = ctx.createLinearGradient(0, -2.5, 0, 2.5);
                barrelGrad.addColorStop(0, '#888');
                barrelGrad.addColorStop(0.5, '#aaa');
                barrelGrad.addColorStop(1, '#777');
                ctx.fillStyle = barrelGrad;
                ctx.fillRect(-4, -2.5, 22, 5);

                // Stabilizer fins — angular
                ctx.fillStyle = '#666';
                ctx.beginPath();
                ctx.moveTo(5, -10);
                ctx.lineTo(7, -3);
                ctx.lineTo(3, -3);
                ctx.closePath();
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(5, 10);
                ctx.lineTo(7, 3);
                ctx.lineTo(3, 3);
                ctx.closePath();
                ctx.fill();

                // Dual scope system
                ctx.save();
                const scope4Grad = ctx.createRadialGradient(11, -6, 0, 11, -6, 4);
                scope4Grad.addColorStop(0, '#80ffb0');
                scope4Grad.addColorStop(0.6, '#40ff80');
                scope4Grad.addColorStop(1, '#108830');
                ctx.fillStyle = scope4Grad;
                ctx.shadowColor = '#40ff80';
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.arc(11, -6, 3.5, 0, Math.PI * 2);
                ctx.fill();
                // Secondary scope (rangefinder)
                ctx.shadowBlur = 4;
                ctx.beginPath();
                ctx.arc(4, -7, 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

                // Scope inner detail
                ctx.fillStyle = '#20aa50';
                ctx.beginPath();
                ctx.arc(11, -6, 1.5, 0, Math.PI * 2);
                ctx.fill();

            } else { // T5A
                // T5A: Golden precision weapon, banner, projected crosshairs
                // Banner flowing behind
                ctx.save();
                ctx.fillStyle = '#a02020';
                ctx.beginPath();
                ctx.moveTo(-6, 0);
                ctx.lineTo(-15, -8 + Math.sin(t * 3) * 3);
                ctx.lineTo(-17, 0 + Math.sin(t * 3 + 0.5) * 2);
                ctx.lineTo(-15, 8 + Math.sin(t * 3 + 1) * 3);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = '#ffd700';
                ctx.lineWidth = 0.8;
                ctx.stroke();
                ctx.restore();

                // Gilded body
                const gBodyGrad = ctx.createLinearGradient(-9, -5, 9, 5);
                gBodyGrad.addColorStop(0, '#5a5a2a');
                gBodyGrad.addColorStop(0.5, '#6a6a3a');
                gBodyGrad.addColorStop(1, '#4a4a1a');
                ctx.fillStyle = gBodyGrad;
                this._roundRectPath(ctx, -9, -5, 18, 10, 3);
                ctx.fill();

                // Golden barrel with engravings
                ctx.save();
                const gBarrelGrad = ctx.createLinearGradient(0, -3, 0, 3);
                gBarrelGrad.addColorStop(0, '#d0b040');
                gBarrelGrad.addColorStop(0.5, '#e0c050');
                gBarrelGrad.addColorStop(1, '#c0a030');
                ctx.fillStyle = gBarrelGrad;
                ctx.shadowColor = '#ffd700';
                ctx.shadowBlur = 4;
                ctx.fillRect(-4, -3, 22, 6);
                ctx.restore();

                // Gold engravings
                ctx.strokeStyle = colorAlpha('#ffd700', 0.6);
                ctx.lineWidth = 0.5;
                for (let i = 0; i < 5; i++) {
                    ctx.beginPath();
                    ctx.arc(1 + i * 3.5, 0, 1.5, 0, Math.PI * 2);
                    ctx.stroke();
                }

                // Massive golden scope
                ctx.save();
                const gScopeGrad = ctx.createRadialGradient(13, -6, 0, 13, -6, 5);
                gScopeGrad.addColorStop(0, '#ffffff');
                gScopeGrad.addColorStop(0.4, '#ffd700');
                gScopeGrad.addColorStop(1, '#aa8020');
                ctx.fillStyle = gScopeGrad;
                ctx.shadowColor = '#ffd700';
                ctx.shadowBlur = 12;
                ctx.beginPath();
                ctx.arc(13, -6, 4.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                // Crosshair in scope
                ctx.strokeStyle = '#40ff80';
                ctx.lineWidth = 0.8;
                ctx.beginPath();
                ctx.moveTo(13, -9); ctx.lineTo(13, -3);
                ctx.moveTo(10, -6); ctx.lineTo(16, -6);
                ctx.stroke();
            }
        } else if (isVolley) {
            // PATH B: Volley — spread, multiple bows, area presence
            if (tier === 3) {
                // T3B: Triple bow arrangement
                for (let i = 0; i < 3; i++) {
                    const angle = ((i / 3) - 0.33) * 1.0;
                    ctx.save();
                    ctx.rotate(angle);
                    // Bow limb
                    const bowG = ctx.createLinearGradient(5, -8, 5, 8);
                    bowG.addColorStop(0, '#a07818');
                    bowG.addColorStop(0.5, '#c09020');
                    bowG.addColorStop(1, '#907010');
                    ctx.strokeStyle = bowG;
                    ctx.lineWidth = 2;
                    ctx.lineCap = 'round';
                    ctx.beginPath();
                    ctx.arc(5, 0, 8, -0.7, 0.7);
                    ctx.stroke();
                    // Arrow
                    ctx.fillStyle = '#ddd';
                    ctx.fillRect(0, -0.5, 11, 1);
                    // Arrowhead
                    ctx.fillStyle = '#ff8040';
                    ctx.beginPath();
                    ctx.moveTo(11, -1.5);
                    ctx.lineTo(13, 0);
                    ctx.lineTo(11, 1.5);
                    ctx.closePath();
                    ctx.fill();
                    ctx.restore();
                }
                // Center hub
                ctx.save();
                const hubGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 5);
                hubGrad.addColorStop(0, '#7a6a4a');
                hubGrad.addColorStop(1, '#5a4a2a');
                ctx.fillStyle = hubGrad;
                ctx.beginPath();
                ctx.arc(0, 0, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#8a7a5a';
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.restore();

            } else if (tier === 4) {
                // T4B: Four bow arms with war drum
                for (let i = 0; i < 4; i++) {
                    const angle = ((i / 4) - 0.375) * 1.4;
                    ctx.save();
                    ctx.rotate(angle);
                    const bowG = ctx.createLinearGradient(5, -8, 5, 8);
                    bowG.addColorStop(0, '#b08020');
                    bowG.addColorStop(0.5, '#d0a030');
                    bowG.addColorStop(1, '#a07018');
                    ctx.strokeStyle = bowG;
                    ctx.lineWidth = 2.2;
                    ctx.lineCap = 'round';
                    ctx.beginPath();
                    ctx.arc(5, 0, 9, -0.7, 0.7);
                    ctx.stroke();
                    ctx.fillStyle = '#ddd';
                    ctx.fillRect(0, -0.5, 12, 1);
                    // Glowing arrowheads
                    ctx.save();
                    ctx.fillStyle = '#ff8040';
                    ctx.shadowColor = '#ff6020';
                    ctx.shadowBlur = 3;
                    ctx.beginPath();
                    ctx.moveTo(12, -1.5);
                    ctx.lineTo(14, 0);
                    ctx.lineTo(12, 1.5);
                    ctx.closePath();
                    ctx.fill();
                    ctx.restore();
                    ctx.restore();
                }
                // War drum center
                ctx.save();
                const drumGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 6);
                drumGrad.addColorStop(0, '#8a7a5a');
                drumGrad.addColorStop(1, '#6a5a3a');
                ctx.fillStyle = drumGrad;
                ctx.beginPath();
                ctx.arc(0, 0, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#aa9a6a';
                ctx.lineWidth = 1.5;
                ctx.stroke();
                // Drum cross
                ctx.strokeStyle = colorAlpha('#c0a050', 0.4);
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(-4, 0); ctx.lineTo(4, 0);
                ctx.moveTo(0, -4); ctx.lineTo(0, 4);
                ctx.stroke();
                ctx.restore();

            } else { // T5B
                // T5B: Rain of arrows — 5 bows, war banner, fire arrows
                // War banner pole
                ctx.fillStyle = '#5a4a3a';
                ctx.fillRect(-1.5, -17, 3, 14);
                // Banner flag
                ctx.save();
                ctx.fillStyle = '#a02020';
                ctx.beginPath();
                ctx.moveTo(1.5, -17);
                ctx.lineTo(12 + Math.sin(t * 4) * 2, -15 + Math.sin(t * 3) * 1);
                ctx.lineTo(10 + Math.sin(t * 4 + 0.5) * 2, -10);
                ctx.lineTo(1.5, -11);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = '#ffd700';
                ctx.lineWidth = 0.8;
                ctx.stroke();
                // Banner emblem
                ctx.fillStyle = '#ffd700';
                ctx.font = '5px sans-serif';
                ctx.fillText('\u2694', 5, -13);
                ctx.restore();

                // Five bow arms with fire arrows
                for (let i = 0; i < 5; i++) {
                    const angle = ((i / 5) - 0.4) * 1.6;
                    ctx.save();
                    ctx.rotate(angle);
                    const bowG = ctx.createLinearGradient(5, -9, 5, 9);
                    bowG.addColorStop(0, '#a07010');
                    bowG.addColorStop(0.5, '#c09020');
                    bowG.addColorStop(1, '#906008');
                    ctx.strokeStyle = bowG;
                    ctx.lineWidth = 2.5;
                    ctx.lineCap = 'round';
                    ctx.beginPath();
                    ctx.arc(5, 0, 10, -0.7, 0.7);
                    ctx.stroke();
                    ctx.fillStyle = '#ddd';
                    ctx.fillRect(0, -0.5, 13, 1);
                    // Fire arrowhead
                    ctx.save();
                    ctx.fillStyle = '#ff6020';
                    ctx.shadowColor = '#ff4010';
                    ctx.shadowBlur = 5;
                    ctx.beginPath();
                    ctx.moveTo(13, -2);
                    ctx.lineTo(16, 0);
                    ctx.lineTo(13, 2);
                    ctx.closePath();
                    ctx.fill();
                    ctx.restore();
                    ctx.restore();
                }

                // Glowing center hub
                ctx.save();
                const hubGrad5 = ctx.createRadialGradient(0, 0, 0, 0, 0, 6);
                hubGrad5.addColorStop(0, '#aa9a5a');
                hubGrad5.addColorStop(1, '#8a7a4a');
                ctx.fillStyle = hubGrad5;
                ctx.shadowColor = '#ff6030';
                ctx.shadowBlur = 6;
                ctx.beginPath();
                ctx.arc(0, 0, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

                // Raining arrow particles
                if (Math.random() < 0.08) {
                    GameState.particles.push(new Particle(
                        x + rand(-15, 15), y - 20,
                        { vx: rand(-0.3, 0.3), vy: rand(1.5, 3), life: rand(0.3, 0.5), size: rand(1, 2), color: '#ffa040' }
                    ));
                }
            }
        }

        ctx.restore();

        // T5A projected crosshairs
        if (tier >= 5 && isMarksman) {
            ctx.save();
            ctx.strokeStyle = colorAlpha('#40ff80', 0.2 + Math.sin(t * 4) * 0.1);
            ctx.lineWidth = 0.8;
            const cr = 20;
            ctx.beginPath();
            ctx.arc(x, y, cr, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x - cr - 4, y); ctx.lineTo(x + cr + 4, y);
            ctx.moveTo(x, y - cr - 4); ctx.lineTo(x, y + cr + 4);
            ctx.stroke();
            ctx.restore();
        }
    },

    // =========================================================================
    // CANNON TOWER (Artillery) — Heavy stone turret / Siege / Cluster
    // =========================================================================
    _drawCannon(ctx, tower, x, y, half, t) {
        const tier = tower.tier;
        const isSiege = tower.path === 'A';
        const isCluster = tower.path === 'B';

        const baseColor = tier >= 4 ? (isSiege ? '#3a2010' : '#3a3530') : '#5a4a3a';
        const accent = tier >= 4 ? (isSiege ? '#ff6020' : '#ffaa20') : '#8a7a6a';
        this._drawBase(ctx, x, y, half, tier, baseColor, accent, t);

        // Stone brick texture
        ctx.save();
        ctx.strokeStyle = colorAlpha('#000', 0.12);
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(x - half + 3, y - 3); ctx.lineTo(x + half - 3, y - 3);
        ctx.moveTo(x - half + 3, y + 4); ctx.lineTo(x + half - 3, y + 4);
        ctx.moveTo(x, y - half + 3); ctx.lineTo(x, y - 3);
        ctx.moveTo(x - 5, y - 3); ctx.lineTo(x - 5, y + 4);
        ctx.moveTo(x + 5, y + 4); ctx.lineTo(x + 5, y + half - 3);
        ctx.stroke();
        ctx.restore();

        // Turret ring
        if (tier >= 2) {
            ctx.save();
            ctx.strokeStyle = '#6a6a6a';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(x, y, half * 0.55, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // --- WEAPON ---
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(tower.angle);

        if (tier <= 2) {
            // T1-2: Stone turret with single barrel
            // Turret body — metallic gradient
            const turretGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 7);
            turretGrad.addColorStop(0, '#999');
            turretGrad.addColorStop(0.6, '#777');
            turretGrad.addColorStop(1, '#555');
            ctx.fillStyle = turretGrad;
            ctx.beginPath();
            ctx.arc(0, 0, 6 + tier, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#888';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Barrel with gradient
            const barrelGrad = ctx.createLinearGradient(0, -3.5, 0, 3.5);
            barrelGrad.addColorStop(0, '#777');
            barrelGrad.addColorStop(0.3, '#666');
            barrelGrad.addColorStop(0.7, '#555');
            barrelGrad.addColorStop(1, '#444');
            ctx.fillStyle = barrelGrad;
            ctx.fillRect(2, -3, 14, 6);

            // Barrel bore
            const boreGrad = ctx.createRadialGradient(16, 0, 0, 16, 0, 3);
            boreGrad.addColorStop(0, '#222');
            boreGrad.addColorStop(1, '#444');
            ctx.fillStyle = boreGrad;
            ctx.beginPath();
            ctx.arc(16, 0, 2.5, 0, Math.PI * 2);
            ctx.fill();

            // Barrel reinforcement bands
            ctx.strokeStyle = '#888';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(6, -3.5); ctx.lineTo(6, 3.5);
            ctx.moveTo(11, -3.5); ctx.lineTo(11, 3.5);
            ctx.stroke();

            // Muzzle glow hint
            if (tier >= 2) {
                ctx.save();
                ctx.fillStyle = colorAlpha('#ff8040', 0.15 + Math.sin(t * 5) * 0.1);
                ctx.beginPath();
                ctx.arc(16, 0, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

        } else if (isSiege) {
            // PATH A: Siege — massive single barrel, dragon theme
            if (tier === 3) {
                // T3A: Massive barrel with hot tip
                const tGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 8);
                tGrad.addColorStop(0, '#888');
                tGrad.addColorStop(1, '#555');
                ctx.fillStyle = tGrad;
                ctx.beginPath();
                ctx.arc(0, 0, 7, 0, Math.PI * 2);
                ctx.fill();

                // Heavy barrel with gradient
                const barrelG = ctx.createLinearGradient(0, -4.5, 0, 4.5);
                barrelG.addColorStop(0, '#666');
                barrelG.addColorStop(0.5, '#777');
                barrelG.addColorStop(1, '#555');
                ctx.fillStyle = barrelG;
                ctx.fillRect(0, -4, 17, 8);

                // Hot barrel tip glow
                ctx.save();
                const heatGlow = 0.5 + Math.sin(t * 5) * 0.3;
                const heatGrad = ctx.createRadialGradient(17, 0, 0, 17, 0, 5);
                heatGrad.addColorStop(0, colorAlpha('#ffcc40', heatGlow));
                heatGrad.addColorStop(0.5, colorAlpha('#ff6020', heatGlow * 0.6));
                heatGrad.addColorStop(1, 'rgba(255,64,16,0)');
                ctx.fillStyle = heatGrad;
                ctx.shadowColor = '#ff4020';
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.arc(17, 0, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                // Bore
                ctx.fillStyle = '#333';
                ctx.beginPath();
                ctx.arc(17, 0, 3, 0, Math.PI * 2);
                ctx.fill();

            } else if (tier === 4) {
                // T4A: Dragon-cannon with runic engravings
                const tGrad4 = ctx.createRadialGradient(0, 0, 0, 0, 0, 9);
                tGrad4.addColorStop(0, '#6a4a3a');
                tGrad4.addColorStop(1, '#4a2a1a');
                ctx.fillStyle = tGrad4;
                ctx.beginPath();
                ctx.arc(0, 0, 8, 0, Math.PI * 2);
                ctx.fill();

                // Heavy barrel
                const bGrad4 = ctx.createLinearGradient(0, -5.5, 0, 5.5);
                bGrad4.addColorStop(0, '#5a3a20');
                bGrad4.addColorStop(0.5, '#6a4a30');
                bGrad4.addColorStop(1, '#4a2a15');
                ctx.fillStyle = bGrad4;
                ctx.fillRect(-2, -5, 19, 10);

                // Runic engravings (glowing orange)
                ctx.save();
                ctx.strokeStyle = '#ff8040';
                ctx.shadowColor = '#ff8040';
                ctx.shadowBlur = 3 + Math.sin(t * 4) * 1.5;
                ctx.lineWidth = 0.8;
                for (let i = 0; i < 4; i++) {
                    const rx = 2 + i * 4;
                    ctx.beginPath();
                    ctx.moveTo(rx, -4);
                    ctx.lineTo(rx + 1.5, -2);
                    ctx.lineTo(rx - 1, 0);
                    ctx.lineTo(rx + 1.5, 2);
                    ctx.lineTo(rx, 4);
                    ctx.stroke();
                }
                ctx.restore();

                // Barrel tip heat
                ctx.save();
                const heatG4 = ctx.createRadialGradient(17, 0, 0, 17, 0, 6);
                heatG4.addColorStop(0, '#ffcc40');
                heatG4.addColorStop(0.4, '#ff6020');
                heatG4.addColorStop(1, 'rgba(255,64,16,0)');
                ctx.fillStyle = heatG4;
                ctx.shadowColor = '#ff4020';
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(17, 0, 5.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

            } else { // T5A
                // T5A: Dragon-mouth cannon with fire, glowing runes
                // Dragon body
                const dGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 10);
                dGrad.addColorStop(0, '#5a3020');
                dGrad.addColorStop(1, '#3a1510');
                ctx.fillStyle = dGrad;
                ctx.beginPath();
                ctx.arc(0, 0, 9, 0, Math.PI * 2);
                ctx.fill();

                // Dragon barrel with scales
                const sGrad = ctx.createLinearGradient(0, -6.5, 0, 6.5);
                sGrad.addColorStop(0, '#6a3a20');
                sGrad.addColorStop(0.5, '#5a2a15');
                sGrad.addColorStop(1, '#4a2010');
                ctx.fillStyle = sGrad;
                ctx.fillRect(-3, -6, 20, 12);

                // Scale pattern
                ctx.save();
                ctx.fillStyle = '#7a4a25';
                for (let i = 0; i < 5; i++) {
                    for (let j = -1; j <= 1; j++) {
                        ctx.beginPath();
                        ctx.arc(1 + i * 3.5, j * 4, 2, 0, Math.PI, true);
                        ctx.fill();
                    }
                }
                ctx.restore();

                // Glowing red runes along barrel
                ctx.save();
                ctx.strokeStyle = '#ff2010';
                ctx.shadowColor = '#ff2010';
                ctx.shadowBlur = 6 + Math.sin(t * 4) * 3;
                ctx.lineWidth = 1;
                for (let i = 0; i < 5; i++) {
                    const rx = 1 + i * 3.5;
                    ctx.beginPath();
                    ctx.moveTo(rx, -5.5);
                    ctx.lineTo(rx + 1.5, -3);
                    ctx.lineTo(rx - 1, -1);
                    ctx.lineTo(rx + 1.5, 1);
                    ctx.lineTo(rx - 1, 3);
                    ctx.lineTo(rx, 5.5);
                    ctx.stroke();
                }
                ctx.restore();

                // Dragon mouth (barrel end)
                ctx.save();
                ctx.fillStyle = '#3a1a0a';
                // Upper jaw
                ctx.beginPath();
                ctx.moveTo(15, -7);
                ctx.lineTo(21, -3);
                ctx.lineTo(17, -2);
                ctx.lineTo(15, -4);
                ctx.closePath();
                ctx.fill();
                // Lower jaw
                ctx.beginPath();
                ctx.moveTo(15, 7);
                ctx.lineTo(21, 3);
                ctx.lineTo(17, 2);
                ctx.lineTo(15, 4);
                ctx.closePath();
                ctx.fill();
                // Teeth
                ctx.fillStyle = '#eee';
                for (let i = 0; i < 3; i++) {
                    ctx.beginPath();
                    ctx.moveTo(16 + i * 1.5, -3);
                    ctx.lineTo(16.5 + i * 1.5, -1.5);
                    ctx.lineTo(17 + i * 1.5, -3);
                    ctx.closePath();
                    ctx.fill();
                    ctx.beginPath();
                    ctx.moveTo(16 + i * 1.5, 3);
                    ctx.lineTo(16.5 + i * 1.5, 1.5);
                    ctx.lineTo(17 + i * 1.5, 3);
                    ctx.closePath();
                    ctx.fill();
                }
                ctx.restore();

                // Fire from mouth
                ctx.save();
                const fireGrad = ctx.createRadialGradient(22, 0, 0, 22, 0, 6);
                fireGrad.addColorStop(0, '#ffff80');
                fireGrad.addColorStop(0.3, '#ff8020');
                fireGrad.addColorStop(0.7, '#ff4010');
                fireGrad.addColorStop(1, 'rgba(255,64,16,0)');
                ctx.fillStyle = fireGrad;
                ctx.shadowColor = '#ff4010';
                ctx.shadowBlur = 12 + Math.sin(t * 8) * 5;
                ctx.globalAlpha = 0.7 + Math.sin(t * 6) * 0.2;
                ctx.beginPath();
                ctx.moveTo(19, -2.5);
                ctx.lineTo(25 + Math.sin(t * 10) * 3, -1 + Math.sin(t * 7) * 1.5);
                ctx.lineTo(24 + Math.cos(t * 8) * 2, 0);
                ctx.lineTo(25 + Math.sin(t * 9) * 3, 1 + Math.cos(t * 7) * 1.5);
                ctx.lineTo(19, 2.5);
                ctx.closePath();
                ctx.fill();
                ctx.restore();

                // Dragon eye
                ctx.save();
                ctx.fillStyle = '#ff2010';
                ctx.shadowColor = '#ff0000';
                ctx.shadowBlur = 4;
                ctx.beginPath();
                ctx.arc(14, -5, 1.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        } else if (isCluster) {
            // PATH B: Cluster — multiple barrels, gatling theme
            const rotSpeed = tier >= 5 ? t * 3 : tier >= 4 ? t * 2 : t * 1;
            if (tier === 3) {
                // T3B: Double barrel
                const tGrad3b = ctx.createRadialGradient(0, 0, 0, 0, 0, 7);
                tGrad3b.addColorStop(0, '#888');
                tGrad3b.addColorStop(1, '#555');
                ctx.fillStyle = tGrad3b;
                ctx.beginPath();
                ctx.arc(0, 0, 6, 0, Math.PI * 2);
                ctx.fill();
                // Two barrels
                for (let i = -1; i <= 1; i += 2) {
                    const bGrad = ctx.createLinearGradient(0, i * 3 - 2, 0, i * 3 + 2);
                    bGrad.addColorStop(0, '#666');
                    bGrad.addColorStop(0.5, '#777');
                    bGrad.addColorStop(1, '#555');
                    ctx.fillStyle = bGrad;
                    ctx.fillRect(2, i * 3 - 1.5, 13, 3);
                    ctx.fillStyle = '#333';
                    ctx.beginPath();
                    ctx.arc(15, i * 3, 1.5, 0, Math.PI * 2);
                    ctx.fill();
                }

            } else if (tier === 4) {
                // T4B: Triple barrel gatling, rotating
                ctx.save();
                ctx.rotate(rotSpeed);
                for (let i = 0; i < 3; i++) {
                    const a = (Math.PI * 2 / 3) * i;
                    ctx.save();
                    ctx.rotate(a);
                    const bGrad = ctx.createLinearGradient(0, -2, 0, 2);
                    bGrad.addColorStop(0, '#777');
                    bGrad.addColorStop(0.5, '#888');
                    bGrad.addColorStop(1, '#666');
                    ctx.fillStyle = bGrad;
                    ctx.fillRect(3, -1.5, 12, 3);
                    ctx.fillStyle = '#444';
                    ctx.beginPath();
                    ctx.arc(15, 0, 1.5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
                ctx.restore();
                // Center hub
                const hubG4 = ctx.createRadialGradient(0, 0, 0, 0, 0, 6);
                hubG4.addColorStop(0, '#999');
                hubG4.addColorStop(1, '#666');
                ctx.fillStyle = hubG4;
                ctx.beginPath();
                ctx.arc(0, 0, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#aaa';
                ctx.lineWidth = 1;
                ctx.stroke();

            } else { // T5B
                // T5B: Rapid-fire minigun with spinning barrels, ammo belt
                // Ammo belt from side
                ctx.save();
                ctx.fillStyle = '#8a7a30';
                for (let i = 0; i < 6; i++) {
                    ctx.fillRect(-12 + i * 2.5, 5 + Math.sin(i + t * 5) * 0.5, 2, 4);
                }
                ctx.strokeStyle = '#6a5a20';
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(-12, 7);
                ctx.lineTo(3, 7);
                ctx.lineTo(3, 2);
                ctx.stroke();
                ctx.restore();

                // Spinning barrels
                ctx.save();
                ctx.rotate(rotSpeed);
                for (let i = 0; i < 6; i++) {
                    const a = (Math.PI * 2 / 6) * i;
                    ctx.save();
                    ctx.rotate(a);
                    const bGrad = ctx.createLinearGradient(0, -1, 0, 1);
                    bGrad.addColorStop(0, '#666');
                    bGrad.addColorStop(0.5, '#777');
                    bGrad.addColorStop(1, '#555');
                    ctx.fillStyle = bGrad;
                    ctx.fillRect(4, -1, 13, 2);
                    ctx.fillStyle = '#333';
                    ctx.beginPath();
                    ctx.arc(17, 0, 1, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
                ctx.restore();

                // Center hub with heat glow
                ctx.save();
                const hubG5 = ctx.createRadialGradient(0, 0, 0, 0, 0, 7);
                hubG5.addColorStop(0, '#aaa');
                hubG5.addColorStop(0.5, '#888');
                hubG5.addColorStop(1, '#666');
                ctx.fillStyle = hubG5;
                ctx.shadowColor = '#ffaa20';
                ctx.shadowBlur = 5 + Math.sin(t * 8) * 3;
                ctx.beginPath();
                ctx.arc(0, 0, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                ctx.fillStyle = '#555';
                ctx.beginPath();
                ctx.arc(0, 0, 4, 0, Math.PI * 2);
                ctx.fill();

                // Muzzle flash particles
                if (Math.random() < 0.06) {
                    const fa = tower.angle + rand(-0.2, 0.2);
                    GameState.particles.push(new Particle(
                        x + Math.cos(fa) * 17, y + Math.sin(fa) * 17,
                        { vx: Math.cos(fa) * 3, vy: Math.sin(fa) * 3, life: 0.1, size: rand(1, 3), color: '#ffaa40' }
                    ));
                }
            }
        }

        ctx.restore();

        // T5A fire trail particles
        if (tier >= 5 && isSiege) {
            if (Math.random() < 0.08) {
                Effects.spawnFireTrail(x + rand(-10, 10), y + half);
            }
        }
    },

    // =========================================================================
    // ICE TOWER (Cryo) — Crystal formation / Deep Freeze / Frostbite
    // =========================================================================
    _drawIce(ctx, tower, x, y, half, t) {
        const tier = tower.tier;
        const isDeepFreeze = tower.path === 'A';
        const isFrostbite = tower.path === 'B';

        // Icy base
        const baseColor = tier >= 3 ? (isFrostbite ? '#1a2a3a' : '#1a3a4a') : '#2a5a7a';
        const accent = tier >= 4 ? '#80d0ff' : '#60a0c0';
        this._drawBase(ctx, x, y, half, tier, baseColor, accent, t);

        // Frost pattern on base
        if (tier >= 2) {
            ctx.save();
            ctx.strokeStyle = colorAlpha('#80d0ff', 0.2);
            ctx.lineWidth = 0.5;
            for (let i = 0; i < 6; i++) {
                const a = (Math.PI / 3) * i;
                ctx.beginPath();
                ctx.moveTo(x, y);
                const len = half - 3;
                ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
                // Branch at 60%
                const mx = x + Math.cos(a) * len * 0.6;
                const my = y + Math.sin(a) * len * 0.6;
                ctx.moveTo(mx, my);
                ctx.lineTo(mx + Math.cos(a + 0.6) * len * 0.3, my + Math.sin(a + 0.6) * len * 0.3);
                ctx.moveTo(mx, my);
                ctx.lineTo(mx + Math.cos(a - 0.6) * len * 0.3, my + Math.sin(a - 0.6) * len * 0.3);
                ctx.stroke();
            }
            ctx.restore();
        }

        // --- CRYSTAL / WEAPON ---
        ctx.save();
        ctx.translate(x, y);

        if (tier <= 2) {
            // T1-2: Crystal spire with frost aura
            // Stone pedestal
            const pedGrad = ctx.createLinearGradient(-6, 2, 6, 8);
            pedGrad.addColorStop(0, '#8a9aaa');
            pedGrad.addColorStop(1, '#5a6a7a');
            ctx.fillStyle = pedGrad;
            ctx.fillRect(-5, 2, 10, 6);

            // Main crystal spire with gradient
            ctx.save();
            const cryGrad = ctx.createLinearGradient(0, -14, 0, 2);
            cryGrad.addColorStop(0, '#a0e8ff');
            cryGrad.addColorStop(0.5, '#60c0e0');
            cryGrad.addColorStop(1, '#3090b0');
            ctx.fillStyle = cryGrad;
            ctx.shadowColor = '#80d0ff';
            ctx.shadowBlur = 4 + tier * 3;
            ctx.beginPath();
            ctx.moveTo(0, -12 - tier * 2);
            ctx.lineTo(-5, 2);
            ctx.lineTo(5, 2);
            ctx.closePath();
            ctx.fill();
            ctx.restore();

            // Crystal highlight facet
            ctx.fillStyle = colorAlpha('#ffffff', 0.3);
            ctx.beginPath();
            ctx.moveTo(-1, -8);
            ctx.lineTo(-3, 0);
            ctx.lineTo(0, -2);
            ctx.closePath();
            ctx.fill();

            // Side crystals (T2)
            if (tier >= 2) {
                ctx.save();
                ctx.shadowColor = '#80d0ff';
                ctx.shadowBlur = 3;
                const sideGrad = ctx.createLinearGradient(0, -6, 0, 2);
                sideGrad.addColorStop(0, '#80e0ff');
                sideGrad.addColorStop(1, '#40a0c0');
                ctx.fillStyle = sideGrad;
                ctx.beginPath();
                ctx.moveTo(-6, -4);
                ctx.lineTo(-9, 2);
                ctx.lineTo(-5, 2);
                ctx.closePath();
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(6, -3);
                ctx.lineTo(9, 2);
                ctx.lineTo(5, 2);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }

            // Sparkle dots
            ctx.save();
            ctx.fillStyle = '#fff';
            ctx.globalAlpha = 0.4 + Math.sin(t * 5) * 0.3;
            ctx.beginPath();
            ctx.arc(1, -6, 1, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

        } else if (isDeepFreeze) {
            // PATH A: Deep Freeze — snowflake/crystal cluster, freezing aura
            if (tier === 3) {
                // T3A: Crystal cluster radiating outward
                ctx.save();
                ctx.fillStyle = '#80d0ff';
                ctx.shadowColor = '#80d0ff';
                ctx.shadowBlur = 8;
                // Main crystal
                ctx.beginPath();
                ctx.moveTo(0, -14);
                ctx.lineTo(-4, 0);
                ctx.lineTo(4, 0);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
                // Radiating side crystals
                for (let i = 0; i < 4; i++) {
                    const a = (Math.PI * 2 / 4) * i + Math.PI / 4;
                    ctx.save();
                    ctx.rotate(a);
                    const cG = ctx.createLinearGradient(0, -10, 0, 0);
                    cG.addColorStop(0, '#90e0ff');
                    cG.addColorStop(1, '#50a0c0');
                    ctx.fillStyle = cG;
                    ctx.beginPath();
                    ctx.moveTo(0, -10);
                    ctx.lineTo(-2.5, 0);
                    ctx.lineTo(2.5, 0);
                    ctx.closePath();
                    ctx.fill();
                    ctx.restore();
                }
                // Inner diamond core
                ctx.save();
                ctx.fillStyle = '#c0f0ff';
                ctx.shadowColor = '#80d0ff';
                ctx.shadowBlur = 5;
                ctx.beginPath();
                ctx.moveTo(0, -3);
                ctx.lineTo(3, 0);
                ctx.lineTo(0, 3);
                ctx.lineTo(-3, 0);
                ctx.closePath();
                ctx.fill();
                ctx.restore();

            } else if (tier === 4) {
                // T4A: Large crystal formation with slowly rotating crystals
                ctx.save();
                const mainCryGrad = ctx.createLinearGradient(0, -17, 0, 2);
                mainCryGrad.addColorStop(0, '#b0f0ff');
                mainCryGrad.addColorStop(0.5, '#80d0ff');
                mainCryGrad.addColorStop(1, '#4090b0');
                ctx.fillStyle = mainCryGrad;
                ctx.shadowColor = '#80d0ff';
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.moveTo(0, -16);
                ctx.lineTo(-5, 2);
                ctx.lineTo(5, 2);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
                // 6 orbiting crystals
                for (let i = 0; i < 6; i++) {
                    const a = (Math.PI * 2 / 6) * i + t * 0.2;
                    ctx.save();
                    ctx.rotate(a);
                    const cG4 = ctx.createLinearGradient(0, -12, 0, -2);
                    cG4.addColorStop(0, '#80d0ff');
                    cG4.addColorStop(1, '#4080a0');
                    ctx.fillStyle = cG4;
                    ctx.globalAlpha = 0.8;
                    ctx.beginPath();
                    ctx.moveTo(0, -12);
                    ctx.lineTo(-2, -2);
                    ctx.lineTo(2, -2);
                    ctx.closePath();
                    ctx.fill();
                    ctx.restore();
                }
                // Central orb
                ctx.save();
                const orbGrad4 = ctx.createRadialGradient(0, 0, 0, 0, 0, 4);
                orbGrad4.addColorStop(0, '#ffffff');
                orbGrad4.addColorStop(0.5, '#c0f0ff');
                orbGrad4.addColorStop(1, '#60b0d0');
                ctx.fillStyle = orbGrad4;
                ctx.shadowColor = '#80d0ff';
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.arc(0, 0, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

            } else { // T5A
                // T5A: Massive snowflake with blizzard particles
                // Snowflake arms with branching
                ctx.save();
                ctx.strokeStyle = '#b0e8ff';
                ctx.shadowColor = '#80d0ff';
                ctx.shadowBlur = 15 + Math.sin(t * 3) * 5;
                ctx.lineWidth = 2;
                ctx.lineCap = 'round';
                for (let i = 0; i < 6; i++) {
                    const a = (Math.PI / 3) * i + t * 0.3;
                    const len = 14;
                    const cx2 = Math.cos(a) * len;
                    const cy2 = Math.sin(a) * len;
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(cx2, cy2);
                    ctx.stroke();
                    // Branch arms
                    const bLen = 5;
                    const bA1 = a + 0.5;
                    const bA2 = a - 0.5;
                    const mid = 0.6;
                    ctx.beginPath();
                    ctx.moveTo(cx2 * mid, cy2 * mid);
                    ctx.lineTo(cx2 * mid + Math.cos(bA1) * bLen, cy2 * mid + Math.sin(bA1) * bLen);
                    ctx.moveTo(cx2 * mid, cy2 * mid);
                    ctx.lineTo(cx2 * mid + Math.cos(bA2) * bLen, cy2 * mid + Math.sin(bA2) * bLen);
                    ctx.stroke();
                    // Tip crystals
                    ctx.fillStyle = '#e0f8ff';
                    ctx.beginPath();
                    ctx.arc(cx2, cy2, 1.5, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();

                // Center crystal orb
                ctx.save();
                const iceGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 8);
                iceGrad.addColorStop(0, '#ffffff');
                iceGrad.addColorStop(0.5, '#b0e8ff');
                iceGrad.addColorStop(1, '#60b0d0');
                ctx.fillStyle = iceGrad;
                ctx.shadowColor = '#80d0ff';
                ctx.shadowBlur = 15;
                ctx.beginPath();
                ctx.arc(0, 0, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

                // Blizzard swirl particles
                if (Math.random() < 0.15) {
                    const angle = Math.random() * Math.PI * 2;
                    const r = rand(5, 20);
                    GameState.particles.push(new Particle(
                        x + Math.cos(angle) * r, y + Math.sin(angle) * r,
                        { vx: Math.cos(angle + 1.5) * 2, vy: Math.sin(angle + 1.5) * 2 - 0.5,
                          life: rand(0.3, 0.6), size: rand(1, 2.5), color: '#b0e8ff', glow: true }
                    ));
                }
            }

        } else if (isFrostbite) {
            // PATH B: Frostbite — aggressive ice spikes, dark ice
            if (tier === 3) {
                // T3B: Dark core with outward-pointing spikes
                ctx.save();
                const darkCore = ctx.createRadialGradient(0, 0, 0, 0, 0, 6);
                darkCore.addColorStop(0, '#3a6a8a');
                darkCore.addColorStop(1, '#1a3a5a');
                ctx.fillStyle = darkCore;
                ctx.beginPath();
                ctx.arc(0, 0, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                // Sharp spikes
                ctx.save();
                ctx.shadowColor = '#80d0ff';
                ctx.shadowBlur = 4;
                for (let i = 0; i < 8; i++) {
                    const a = (Math.PI * 2 / 8) * i;
                    ctx.save();
                    ctx.rotate(a);
                    const spikeG = ctx.createLinearGradient(0, -13, 0, -4);
                    spikeG.addColorStop(0, '#a0e0ff');
                    spikeG.addColorStop(1, '#4090b0');
                    ctx.fillStyle = spikeG;
                    ctx.beginPath();
                    ctx.moveTo(0, -13);
                    ctx.lineTo(-2, -4);
                    ctx.lineTo(2, -4);
                    ctx.closePath();
                    ctx.fill();
                    ctx.restore();
                }
                ctx.restore();

            } else if (tier === 4) {
                // T4B: More aggressive, longer alternating spikes
                ctx.save();
                const dc4 = ctx.createRadialGradient(0, 0, 0, 0, 0, 7);
                dc4.addColorStop(0, '#2a5070');
                dc4.addColorStop(1, '#1a3050');
                ctx.fillStyle = dc4;
                ctx.beginPath();
                ctx.arc(0, 0, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

                ctx.save();
                ctx.shadowColor = '#60c0ff';
                ctx.shadowBlur = 6;
                for (let i = 0; i < 10; i++) {
                    const a = (Math.PI * 2 / 10) * i;
                    const sLen = 10 + (i % 2) * 5;
                    ctx.save();
                    ctx.rotate(a);
                    const spG4 = ctx.createLinearGradient(0, -sLen, 0, -4);
                    spG4.addColorStop(0, i % 2 === 0 ? '#a0e0ff' : '#80d0f0');
                    spG4.addColorStop(1, '#3a7090');
                    ctx.fillStyle = spG4;
                    ctx.beginPath();
                    ctx.moveTo(0, -sLen);
                    ctx.lineTo(-2, -4);
                    ctx.lineTo(2, -4);
                    ctx.closePath();
                    ctx.fill();
                    ctx.restore();
                }
                ctx.restore();

            } else { // T5B
                // T5B: Ice lance formation, glacial blue glow
                // Central dark ice body
                ctx.save();
                const dc5 = ctx.createRadialGradient(0, 0, 0, 0, 0, 8);
                dc5.addColorStop(0, '#3a6090');
                dc5.addColorStop(1, '#1a2a40');
                ctx.fillStyle = dc5;
                ctx.shadowColor = '#40a0ff';
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(0, 0, 7, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

                // Main lance (pointing toward target)
                ctx.save();
                ctx.rotate(tower.angle);
                ctx.save();
                const lanceGrad = ctx.createLinearGradient(4, 0, 20, 0);
                lanceGrad.addColorStop(0, '#60b0e0');
                lanceGrad.addColorStop(1, '#b0e8ff');
                ctx.fillStyle = lanceGrad;
                ctx.shadowColor = '#40a0ff';
                ctx.shadowBlur = 12 + Math.sin(t * 4) * 4;
                ctx.beginPath();
                ctx.moveTo(20, 0);
                ctx.lineTo(4, -4);
                ctx.lineTo(4, 4);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
                // Side lances
                for (let i = -1; i <= 1; i += 2) {
                    ctx.save();
                    const sLanceG = ctx.createLinearGradient(3, i * 5, 15, i * 6);
                    sLanceG.addColorStop(0, '#4090b0');
                    sLanceG.addColorStop(1, '#80d0ff');
                    ctx.fillStyle = sLanceG;
                    ctx.shadowColor = '#40a0ff';
                    ctx.shadowBlur = 6;
                    ctx.beginPath();
                    ctx.moveTo(15, i * 6);
                    ctx.lineTo(3, i * 3);
                    ctx.lineTo(3, i * 8);
                    ctx.closePath();
                    ctx.fill();
                    ctx.restore();
                }
                ctx.restore();

                // Surrounding spike ring
                for (let i = 0; i < 12; i++) {
                    const a = (Math.PI * 2 / 12) * i + t * 0.15;
                    const sLen = 6 + (i % 3) * 3;
                    ctx.save();
                    ctx.rotate(a);
                    ctx.fillStyle = colorAlpha('#60c0e0', 0.6);
                    ctx.beginPath();
                    ctx.moveTo(0, -7 - sLen);
                    ctx.lineTo(-1.5, -7);
                    ctx.lineTo(1.5, -7);
                    ctx.closePath();
                    ctx.fill();
                    ctx.restore();
                }

                // Glacial glow pulse
                if (Math.random() < 0.08) {
                    Effects.spawnAura(x, y, 25, '#60c0ff');
                }
            }
        }

        ctx.restore();

        // Frost aura for Deep Freeze path
        if (tier >= 3 && isDeepFreeze) {
            ctx.save();
            ctx.globalAlpha = 0.12 + Math.sin(t * 2) * 0.05;
            ctx.fillStyle = '#80d0ff';
            ctx.beginPath();
            ctx.arc(x, y, 22 + tier * 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    },

    // =========================================================================
    // LIGHTNING TOWER (Tesla) — Tesla coil / Chain Master / Storm Caller
    // =========================================================================
    _drawLightning(ctx, tower, x, y, half, t) {
        const tier = tower.tier;
        const isChain = tower.path === 'A';
        const isStorm = tower.path === 'B';

        const baseColor = tier >= 3 ? '#3a3a20' : '#4a4a2a';
        const accent = tier >= 4 ? '#ffe040' : '#c0c030';
        this._drawBase(ctx, x, y, half, tier, baseColor, accent, t);

        // Conductive plate markings
        if (tier >= 2) {
            ctx.save();
            ctx.strokeStyle = colorAlpha('#ffe040', 0.12);
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.arc(x, y, half - 4, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(x, y, half - 8, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // --- COIL / WEAPON ---
        ctx.save();
        ctx.translate(x, y);

        if (tier <= 2) {
            // T1-2: Tesla coil with sparks
            // Coil base — metallic
            const cBaseGrad = ctx.createLinearGradient(-5, 2, 5, 7);
            cBaseGrad.addColorStop(0, '#999');
            cBaseGrad.addColorStop(1, '#666');
            ctx.fillStyle = cBaseGrad;
            ctx.fillRect(-4, 2, 8, 5);

            // Coil pillar
            const pillarGrad = ctx.createLinearGradient(-3, -8, 3, 6);
            pillarGrad.addColorStop(0, '#aaa');
            pillarGrad.addColorStop(1, '#777');
            ctx.fillStyle = pillarGrad;
            ctx.fillRect(-2.5, -8, 5, 14);

            // Copper coil windings
            ctx.strokeStyle = '#c09020';
            ctx.lineWidth = 1.5;
            for (let i = 0; i < 4 + tier; i++) {
                const cy = -6 + i * 2.5;
                ctx.beginPath();
                ctx.ellipse(0, cy, 4.5, 1.5, 0, 0, Math.PI * 2);
                ctx.stroke();
            }
            // Coil winding highlight
            ctx.strokeStyle = colorAlpha('#e0c060', 0.4);
            ctx.lineWidth = 0.5;
            for (let i = 0; i < 4 + tier; i++) {
                const cy = -6 + i * 2.5;
                ctx.beginPath();
                ctx.ellipse(0, cy, 4, 1.2, 0, -Math.PI * 0.3, Math.PI * 0.3);
                ctx.stroke();
            }

            // Spark orb on top
            ctx.save();
            const sparkGrad = ctx.createRadialGradient(0, -10, 0, 0, -10, 4);
            sparkGrad.addColorStop(0, '#ffffff');
            sparkGrad.addColorStop(0.4, '#ffe060');
            sparkGrad.addColorStop(1, '#c08020');
            ctx.fillStyle = sparkGrad;
            ctx.shadowColor = '#ffe040';
            ctx.shadowBlur = 6 + Math.sin(t * 6) * 3;
            ctx.beginPath();
            ctx.arc(0, -10, 3 + tier * 0.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Random sparks
            if (tier >= 2 && Math.random() < 0.06) {
                const sa = Math.random() * Math.PI * 2;
                const sr = 6;
                ctx.save();
                ctx.strokeStyle = '#ffe040';
                ctx.shadowColor = '#ffe040';
                ctx.shadowBlur = 3;
                ctx.lineWidth = 0.8;
                ctx.beginPath();
                ctx.moveTo(0, -10);
                ctx.lineTo(Math.cos(sa) * sr, -10 + Math.sin(sa) * sr);
                ctx.stroke();
                ctx.restore();
            }

        } else if (isChain) {
            // PATH A: Chain Master — multiple coils with arcs
            if (tier === 3) {
                const coilPos = [[-6, 0], [6, 0], [0, -6]];
                for (const [cx, cy] of coilPos) {
                    // Pillar
                    ctx.fillStyle = '#888';
                    ctx.fillRect(cx - 1.5, cy - 6, 3, 8);
                    // Coil wraps
                    ctx.strokeStyle = '#c09020';
                    ctx.lineWidth = 1;
                    for (let w = 0; w < 2; w++) {
                        ctx.beginPath();
                        ctx.ellipse(cx, cy - 4 + w * 2.5, 2.5, 1, 0, 0, Math.PI * 2);
                        ctx.stroke();
                    }
                    // Orb
                    ctx.save();
                    const orbG = ctx.createRadialGradient(cx, cy - 7, 0, cx, cy - 7, 3);
                    orbG.addColorStop(0, '#ffffff');
                    orbG.addColorStop(0.5, '#ffe060');
                    orbG.addColorStop(1, '#c08020');
                    ctx.fillStyle = orbG;
                    ctx.shadowColor = '#ffe040';
                    ctx.shadowBlur = 5;
                    ctx.beginPath();
                    ctx.arc(cx, cy - 7, 2.5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
                // Arcs between coils
                ctx.save();
                ctx.strokeStyle = '#ffe040';
                ctx.shadowColor = '#ffe040';
                ctx.shadowBlur = 4;
                ctx.lineWidth = 1;
                ctx.globalAlpha = 0.5 + Math.sin(t * 8) * 0.3;
                for (let i = 0; i < coilPos.length; i++) {
                    const next = coilPos[(i + 1) % coilPos.length];
                    ctx.beginPath();
                    ctx.moveTo(coilPos[i][0], coilPos[i][1] - 7);
                    const midX = (coilPos[i][0] + next[0]) / 2 + Math.sin(t * 10 + i) * 3;
                    const midY = (coilPos[i][1] + next[1]) / 2 - 7 + Math.cos(t * 8 + i) * 3;
                    ctx.quadraticCurveTo(midX, midY, next[0], next[1] - 7);
                    ctx.stroke();
                }
                ctx.restore();

            } else if (tier === 4) {
                const coilPos = [[-7, 2], [7, 2], [-4, -6], [4, -6]];
                for (const [cx, cy] of coilPos) {
                    ctx.fillStyle = '#999';
                    ctx.fillRect(cx - 2, cy - 5, 4, 8);
                    ctx.strokeStyle = '#c09020';
                    ctx.lineWidth = 1;
                    for (let w = 0; w < 3; w++) {
                        ctx.beginPath();
                        ctx.ellipse(cx, cy - 3 + w * 2, 3, 1, 0, 0, Math.PI * 2);
                        ctx.stroke();
                    }
                    ctx.save();
                    const orbG4 = ctx.createRadialGradient(cx, cy - 7, 0, cx, cy - 7, 3);
                    orbG4.addColorStop(0, '#ffffff');
                    orbG4.addColorStop(0.5, '#ffe060');
                    orbG4.addColorStop(1, '#c08020');
                    ctx.fillStyle = orbG4;
                    ctx.shadowColor = '#ffe040';
                    ctx.shadowBlur = 6;
                    ctx.beginPath();
                    ctx.arc(cx, cy - 7, 2.5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
                // Arc network
                ctx.save();
                ctx.strokeStyle = '#ffe040';
                ctx.shadowColor = '#ffe040';
                ctx.shadowBlur = 5;
                ctx.lineWidth = 1;
                ctx.globalAlpha = 0.6 + Math.sin(t * 7) * 0.3;
                for (let i = 0; i < coilPos.length; i++) {
                    for (let j = i + 1; j < coilPos.length; j++) {
                        if (Math.sin(t * 5 + i * 2 + j * 3) > 0) {
                            ctx.beginPath();
                            ctx.moveTo(coilPos[i][0], coilPos[i][1] - 7);
                            const mx = (coilPos[i][0] + coilPos[j][0]) / 2 + Math.sin(t * 12 + i + j) * 4;
                            const my = (coilPos[i][1] + coilPos[j][1]) / 2 - 7 + Math.cos(t * 10 + i + j) * 4;
                            ctx.quadraticCurveTo(mx, my, coilPos[j][0], coilPos[j][1] - 7);
                            ctx.stroke();
                        }
                    }
                }
                ctx.restore();

            } else { // T5A
                // T5A: Energy overload — massive tesla spire with rings
                // Central tesla spire
                const spireGrad = ctx.createLinearGradient(-3, -12, 3, 4);
                spireGrad.addColorStop(0, '#bbb');
                spireGrad.addColorStop(1, '#888');
                ctx.fillStyle = spireGrad;
                ctx.fillRect(-3, -12, 6, 16);

                // Gold coil windings
                ctx.strokeStyle = '#d0a020';
                ctx.lineWidth = 1.5;
                for (let w = 0; w < 6; w++) {
                    ctx.beginPath();
                    ctx.ellipse(0, -10 + w * 3, 5, 1.5, 0, 0, Math.PI * 2);
                    ctx.stroke();
                }

                // Spinning energy rings
                ctx.save();
                ctx.strokeStyle = '#ffe040';
                ctx.shadowColor = '#ffe040';
                ctx.shadowBlur = 12 + Math.sin(t * 5) * 5;
                ctx.lineWidth = 1.5;
                for (let i = 0; i < 3; i++) {
                    const r = 9 + i * 3;
                    const ringAngle = t * (2.5 + i * 0.7);
                    ctx.beginPath();
                    ctx.ellipse(0, -4, r, r * 0.3, ringAngle, 0, Math.PI * 2);
                    ctx.stroke();
                }
                ctx.restore();

                // Massive energy orb
                ctx.save();
                const orbGrad = ctx.createRadialGradient(0, -13, 0, 0, -13, 6);
                orbGrad.addColorStop(0, '#ffffff');
                orbGrad.addColorStop(0.4, '#ffe060');
                orbGrad.addColorStop(1, '#c08020');
                ctx.fillStyle = orbGrad;
                ctx.shadowColor = '#ffe040';
                ctx.shadowBlur = 20 + Math.sin(t * 6) * 8;
                ctx.beginPath();
                ctx.arc(0, -13, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

                // Random arcs
                if (Math.random() < 0.15) {
                    const arcAngle = Math.random() * Math.PI * 2;
                    const arcLen = rand(15, 25);
                    Effects.spawnLightningArc(x, y, x + Math.cos(arcAngle) * arcLen, y + Math.sin(arcAngle) * arcLen);
                }

                // Electric aura
                ctx.save();
                ctx.globalAlpha = 0.08 + Math.sin(t * 4) * 0.04;
                ctx.fillStyle = '#ffe040';
                ctx.beginPath();
                ctx.arc(0, 0, 25, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        } else if (isStorm) {
            // PATH B: Storm Caller — cloud formations with lightning
            if (tier === 3) {
                // Tower pillar
                const pillarG = ctx.createLinearGradient(-2, -4, 2, 10);
                pillarG.addColorStop(0, '#888');
                pillarG.addColorStop(1, '#555');
                ctx.fillStyle = pillarG;
                ctx.fillRect(-2, -4, 4, 10);
                // Orb
                ctx.save();
                const oG3 = ctx.createRadialGradient(0, -5, 0, 0, -5, 3.5);
                oG3.addColorStop(0, '#fff');
                oG3.addColorStop(0.5, '#ffe060');
                oG3.addColorStop(1, '#c09020');
                ctx.fillStyle = oG3;
                ctx.shadowColor = '#ffe040';
                ctx.shadowBlur = 5;
                ctx.beginPath();
                ctx.arc(0, -5, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                // Storm cloud
                ctx.fillStyle = '#4a4a5a';
                ctx.beginPath();
                ctx.arc(-5, -14, 5, 0, Math.PI * 2);
                ctx.arc(0, -15, 6, 0, Math.PI * 2);
                ctx.arc(5, -14, 5, 0, Math.PI * 2);
                ctx.fill();
                // Lightning bolt from cloud
                ctx.save();
                ctx.strokeStyle = '#ffe040';
                ctx.shadowColor = '#ffe040';
                ctx.shadowBlur = 4;
                ctx.lineWidth = 1.5;
                ctx.globalAlpha = 0.6 + Math.sin(t * 8) * 0.4;
                ctx.beginPath();
                ctx.moveTo(0, -10);
                ctx.lineTo(2, -7);
                ctx.lineTo(-1, -5);
                ctx.lineTo(3, -1);
                ctx.stroke();
                ctx.restore();

            } else if (tier === 4) {
                // T4B: Bigger cloud, more lightning, rain
                const pillarG4 = ctx.createLinearGradient(-3, -5, 3, 11);
                pillarG4.addColorStop(0, '#999');
                pillarG4.addColorStop(1, '#666');
                ctx.fillStyle = pillarG4;
                ctx.fillRect(-2.5, -5, 5, 11);
                ctx.save();
                const oG4 = ctx.createRadialGradient(0, -6, 0, 0, -6, 4);
                oG4.addColorStop(0, '#fff');
                oG4.addColorStop(0.5, '#ffe060');
                oG4.addColorStop(1, '#c09020');
                ctx.fillStyle = oG4;
                ctx.shadowColor = '#ffe040';
                ctx.shadowBlur = 6;
                ctx.beginPath();
                ctx.arc(0, -6, 3.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

                // Storm cloud
                ctx.fillStyle = '#3a3a4a';
                ctx.beginPath();
                ctx.arc(-7, -14, 5, 0, Math.PI * 2);
                ctx.arc(-2, -16, 6, 0, Math.PI * 2);
                ctx.arc(3, -15, 5.5, 0, Math.PI * 2);
                ctx.arc(7, -14, 4.5, 0, Math.PI * 2);
                ctx.fill();
                // Dark underside
                ctx.fillStyle = '#2a2a3a';
                ctx.fillRect(-9, -12, 18, 3);

                // Lightning strikes
                ctx.save();
                ctx.strokeStyle = '#ffe040';
                ctx.shadowColor = '#ffe040';
                ctx.shadowBlur = 5;
                ctx.lineWidth = 1.5;
                const boltAlpha = 0.5 + Math.sin(t * 10) * 0.5;
                ctx.globalAlpha = boltAlpha;
                ctx.beginPath();
                ctx.moveTo(-3, -10);
                ctx.lineTo(-1, -6);
                ctx.lineTo(-3, -4);
                ctx.lineTo(1, 0);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(3, -10);
                ctx.lineTo(5, -7);
                ctx.lineTo(3, -5);
                ctx.lineTo(5, -2);
                ctx.stroke();
                ctx.restore();

                // Rain drops
                ctx.save();
                ctx.strokeStyle = colorAlpha('#80a0ff', 0.3);
                ctx.lineWidth = 0.5;
                for (let i = 0; i < 5; i++) {
                    const rx = -7 + i * 3.5;
                    const ry = -9 + ((t * 20 + i * 7) % 12);
                    ctx.beginPath();
                    ctx.moveTo(rx, ry);
                    ctx.lineTo(rx, ry + 2);
                    ctx.stroke();
                }
                ctx.restore();

            } else { // T5B
                // T5B: Thundercloud system with massive lightning
                // Tower conductor
                const cGrad5 = ctx.createLinearGradient(-3, -6, 3, 12);
                cGrad5.addColorStop(0, '#aaa');
                cGrad5.addColorStop(1, '#777');
                ctx.fillStyle = cGrad5;
                ctx.fillRect(-3, -6, 6, 12);

                // Lightning rod tip
                ctx.save();
                ctx.fillStyle = '#ffd700';
                ctx.shadowColor = '#ffe040';
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.moveTo(0, -10);
                ctx.lineTo(-2, -6);
                ctx.lineTo(2, -6);
                ctx.closePath();
                ctx.fill();
                ctx.restore();

                // Massive thundercloud
                ctx.save();
                ctx.fillStyle = '#2a2a3a';
                ctx.shadowColor = '#ffe040';
                ctx.shadowBlur = 6 + Math.sin(t * 5) * 3;
                ctx.beginPath();
                ctx.arc(-8, -16, 6, 0, Math.PI * 2);
                ctx.arc(-2, -18, 7, 0, Math.PI * 2);
                ctx.arc(4, -17, 6.5, 0, Math.PI * 2);
                ctx.arc(9, -15, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                ctx.fillStyle = '#1a1a2a';
                ctx.fillRect(-10, -13, 22, 4);

                // Multiple lightning bolts
                ctx.save();
                ctx.strokeStyle = '#ffe040';
                ctx.shadowColor = '#ffe040';
                ctx.shadowBlur = 8;
                ctx.lineWidth = 2;
                const b1a = 0.7 + Math.sin(t * 12) * 0.5;
                ctx.globalAlpha = b1a;
                ctx.beginPath();
                ctx.moveTo(-4, -10);
                ctx.lineTo(-2, -5);
                ctx.lineTo(-5, -3);
                ctx.lineTo(-1, 3);
                ctx.stroke();
                ctx.globalAlpha = 0.5 + Math.cos(t * 10) * 0.5;
                ctx.beginPath();
                ctx.moveTo(4, -10);
                ctx.lineTo(6, -6);
                ctx.lineTo(3, -3);
                ctx.lineTo(6, 2);
                ctx.stroke();
                ctx.restore();

                // Rain particles
                if (Math.random() < 0.15) {
                    GameState.particles.push(new Particle(
                        x + rand(-12, 12), y - 15,
                        { vx: rand(-0.3, 0.3), vy: rand(2, 4), life: rand(0.2, 0.4), size: rand(0.5, 1.5), color: '#80a0ff' }
                    ));
                }

                // Occasional big spark
                if (Math.random() < 0.04) {
                    const sa = Math.random() * Math.PI * 2;
                    Effects.spawnLightningArc(x, y - 12, x + Math.cos(sa) * 20, y + Math.sin(sa) * 15);
                }
            }
        }

        ctx.restore();
    },

    // =========================================================================
    // SNIPER TOWER (Deadeye) — Tall tower / Assassin / Spotter
    // =========================================================================
    _drawSniper(ctx, tower, x, y, half, t) {
        const tier = tower.tier;
        const isAssassin = tower.path === 'A';
        const isSpotter = tower.path === 'B';

        const baseColor = tier >= 4 ? (isAssassin ? '#1a1a1a' : '#1a2a1a') : '#1a3a1a';
        const accent = isAssassin && tier >= 3 ? '#ff0000' : (isSpotter && tier >= 3 ? '#40ff80' : '#50aa60');
        this._drawBase(ctx, x, y, half, tier, baseColor, accent, t);

        // Decorative base ring for T3+
        if (tier >= 3) {
            ctx.save();
            ctx.strokeStyle = colorAlpha(accent, 0.2 + Math.sin(t * 2) * 0.08);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(x, y, half - 2, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // --- WEAPON ---
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(tower.angle);

        if (tier <= 2) {
            // T1-2: Proper sniper platform with bipod and long rifle

            // Platform / receiver body
            const bodyGrad = ctx.createLinearGradient(-6, -5, 6, 5);
            bodyGrad.addColorStop(0, '#5a6a5a');
            bodyGrad.addColorStop(0.5, '#4a5a4a');
            bodyGrad.addColorStop(1, '#3a4a3a');
            ctx.fillStyle = bodyGrad;
            this._roundRectPath(ctx, -6, -4, 12, 8, 2);
            ctx.fill();
            // Body edge highlight
            ctx.strokeStyle = '#6a7a6a';
            ctx.lineWidth = 0.5;
            this._roundRectPath(ctx, -6, -4, 12, 8, 2);
            ctx.stroke();

            // Rifle barrel — long and sleek
            const rifleGrad = ctx.createLinearGradient(0, -2, 0, 2);
            rifleGrad.addColorStop(0, '#8a8a8a');
            rifleGrad.addColorStop(0.3, '#6a6a6a');
            rifleGrad.addColorStop(0.7, '#5a5a5a');
            rifleGrad.addColorStop(1, '#4a4a4a');
            ctx.fillStyle = rifleGrad;
            ctx.fillRect(-2, -1.5, 19, 3);

            // Barrel bands
            ctx.strokeStyle = '#999';
            ctx.lineWidth = 0.7;
            for (const bx of [5, 10, 14]) {
                ctx.beginPath();
                ctx.moveTo(bx, -2); ctx.lineTo(bx, 2);
                ctx.stroke();
            }

            // Muzzle tip
            ctx.fillStyle = '#3a3a3a';
            ctx.fillRect(15, -2, 3, 4);
            ctx.fillStyle = '#555';
            ctx.fillRect(16, -1, 1.5, 2);

            // Wooden stock with grip
            const stockGrad = ctx.createLinearGradient(-8, -2, -4, 2);
            stockGrad.addColorStop(0, '#8a6a3a');
            stockGrad.addColorStop(0.5, '#7a5a2a');
            stockGrad.addColorStop(1, '#6a4a20');
            ctx.fillStyle = stockGrad;
            ctx.fillRect(-9, -2, 8, 4);
            // Stock cheek rest
            ctx.fillStyle = '#6a4a20';
            ctx.fillRect(-9, -3, 3, 1.5);

            // Bipod legs
            ctx.strokeStyle = '#777';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(2, 2); ctx.lineTo(-1, 7);
            ctx.moveTo(4, 2); ctx.lineTo(7, 7);
            ctx.stroke();
            // Bipod feet
            ctx.fillStyle = '#666';
            ctx.fillRect(-2, 6, 2, 1.5);
            ctx.fillRect(6, 6, 2, 1.5);

            // Scope
            ctx.save();
            // Scope tube
            ctx.fillStyle = '#333';
            ctx.fillRect(6, -5, 8, 2.5);
            // Scope lens — glowing
            const scopeGrad = ctx.createRadialGradient(12, -3.8, 0, 12, -3.8, 2.5);
            scopeGrad.addColorStop(0, tier >= 2 ? '#ff5050' : '#80c0ff');
            scopeGrad.addColorStop(0.6, tier >= 2 ? '#cc2020' : '#4080cc');
            scopeGrad.addColorStop(1, tier >= 2 ? '#880000' : '#204060');
            ctx.fillStyle = scopeGrad;
            ctx.shadowColor = tier >= 2 ? '#ff0000' : '#4080ff';
            ctx.shadowBlur = tier >= 2 ? 5 : 3;
            ctx.beginPath();
            ctx.arc(12, -3.8, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Trigger guard detail
            ctx.strokeStyle = '#555';
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.arc(-2, 3, 1.5, 0, Math.PI);
            ctx.stroke();

        } else if (isAssassin) {
            // PATH A: Assassin — stealth rifle, angular, deadly
            if (tier === 3) {
                // Angular stealth body
                const aBodyG = ctx.createLinearGradient(-7, -5, 7, 5);
                aBodyG.addColorStop(0, '#2a2a2a');
                aBodyG.addColorStop(0.5, '#1a1a1a');
                aBodyG.addColorStop(1, '#111');
                ctx.fillStyle = aBodyG;
                ctx.beginPath();
                ctx.moveTo(-7, -3); ctx.lineTo(-4, -5); ctx.lineTo(6, -5);
                ctx.lineTo(7, -3); ctx.lineTo(7, 3); ctx.lineTo(6, 5);
                ctx.lineTo(-4, 5); ctx.lineTo(-7, 3);
                ctx.closePath();
                ctx.fill();
                // Edge glow
                ctx.strokeStyle = colorAlpha('#ff0000', 0.2);
                ctx.lineWidth = 0.5;
                ctx.stroke();

                // Suppressed rifle barrel
                const aRifleG = ctx.createLinearGradient(0, -2.5, 0, 2.5);
                aRifleG.addColorStop(0, '#3a3a3a');
                aRifleG.addColorStop(0.5, '#4a4a4a');
                aRifleG.addColorStop(1, '#2a2a2a');
                ctx.fillStyle = aRifleG;
                ctx.fillRect(-3, -2, 20, 4);
                // Suppressor (fat tip)
                ctx.fillStyle = '#1a1a1a';
                this._roundRectPath(ctx, 14, -3, 6, 6, 1.5);
                ctx.fill();
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 0.5;
                this._roundRectPath(ctx, 14, -3, 6, 6, 1.5);
                ctx.stroke();
                // Suppressor vents
                ctx.strokeStyle = '#444';
                ctx.lineWidth = 0.4;
                for (let v = 0; v < 3; v++) {
                    ctx.beginPath();
                    ctx.moveTo(15.5 + v * 1.5, -2.5);
                    ctx.lineTo(15.5 + v * 1.5, 2.5);
                    ctx.stroke();
                }

                // Tactical scope with red glow
                ctx.save();
                ctx.fillStyle = '#222';
                ctx.fillRect(5, -6, 10, 2.5);
                const rsG = ctx.createRadialGradient(13, -4.8, 0, 13, -4.8, 3);
                rsG.addColorStop(0, '#ff4040');
                rsG.addColorStop(0.5, '#cc0000');
                rsG.addColorStop(1, '#660000');
                ctx.fillStyle = rsG;
                ctx.shadowColor = '#ff0000';
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.arc(13, -4.8, 2.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

                // Skull emblem — better drawn
                ctx.save();
                ctx.fillStyle = '#555';
                ctx.beginPath();
                ctx.arc(-2, 0, 2.5, -Math.PI, 0);
                ctx.quadraticCurveTo(-2, 3, -2, 2.5);
                ctx.fill();
                ctx.fillStyle = '#1a1a1a';
                ctx.beginPath(); ctx.arc(-3, -0.3, 0.6, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(-1, -0.3, 0.6, 0, Math.PI * 2); ctx.fill();
                ctx.restore();

            } else if (tier === 4) {
                // T4A: Anti-material rifle — massive, industrial
                const aBodyG4 = ctx.createLinearGradient(-8, -6, 8, 6);
                aBodyG4.addColorStop(0, '#1a1a1a');
                aBodyG4.addColorStop(0.5, '#111');
                aBodyG4.addColorStop(1, '#0a0a0a');
                ctx.fillStyle = aBodyG4;
                ctx.beginPath();
                ctx.moveTo(-8, -4); ctx.lineTo(-5, -6); ctx.lineTo(7, -6);
                ctx.lineTo(8, -4); ctx.lineTo(8, 4); ctx.lineTo(7, 6);
                ctx.lineTo(-5, 6); ctx.lineTo(-8, 4);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = colorAlpha('#ff0000', 0.15);
                ctx.lineWidth = 0.8;
                ctx.stroke();

                // Camo netting fragments
                ctx.save();
                ctx.globalAlpha = 0.25;
                const camoColors = ['#2a3a1a', '#3a4a2a', '#1a2a0a'];
                for (let i = 0; i < 5; i++) {
                    ctx.fillStyle = camoColors[i % 3];
                    ctx.fillRect(-6 + i * 3, -5 + (i % 2) * 4, 2.5, 2);
                }
                ctx.restore();

                // Heavy barrel with muzzle brake
                const aRifleG4 = ctx.createLinearGradient(0, -3, 0, 3);
                aRifleG4.addColorStop(0, '#3a3a3a');
                aRifleG4.addColorStop(0.5, '#4a4a4a');
                aRifleG4.addColorStop(1, '#2a2a2a');
                ctx.fillStyle = aRifleG4;
                ctx.fillRect(-3, -2.5, 23, 5);
                // Muzzle brake
                ctx.fillStyle = '#1a1a1a';
                ctx.fillRect(17, -4, 4, 8);
                // Brake vents
                ctx.fillStyle = '#333';
                ctx.fillRect(18, -3, 1.5, 1.5);
                ctx.fillRect(18, 1.5, 1.5, 1.5);

                // Glowing tactical scope
                ctx.save();
                ctx.fillStyle = '#1a1a1a';
                ctx.fillRect(5, -7, 12, 3);
                const rsG4 = ctx.createRadialGradient(14, -5.5, 0, 14, -5.5, 3.5);
                rsG4.addColorStop(0, '#ff5050');
                rsG4.addColorStop(0.4, '#ff0000');
                rsG4.addColorStop(1, '#440000');
                ctx.fillStyle = rsG4;
                ctx.shadowColor = '#ff0000';
                ctx.shadowBlur = 10 + Math.sin(t * 3) * 3;
                ctx.beginPath();
                ctx.arc(14, -5.5, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                // Scope crosshair
                ctx.strokeStyle = '#440000';
                ctx.lineWidth = 0.6;
                ctx.beginPath();
                ctx.moveTo(14, -8); ctx.lineTo(14, -3);
                ctx.moveTo(11.5, -5.5); ctx.lineTo(16.5, -5.5);
                ctx.stroke();

                // Bipod
                ctx.strokeStyle = '#555';
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.moveTo(3, 3); ctx.lineTo(0, 8);
                ctx.moveTo(6, 3); ctx.lineTo(9, 8);
                ctx.stroke();

                // Kill tally marks
                ctx.save();
                ctx.strokeStyle = colorAlpha('#ff0000', 0.5);
                ctx.lineWidth = 0.6;
                for (let k = 0; k < 4; k++) {
                    ctx.beginPath();
                    ctx.moveTo(-6 + k * 1.5, -3);
                    ctx.lineTo(-6 + k * 1.5, 0);
                    ctx.stroke();
                }
                ctx.beginPath();
                ctx.moveTo(-7, -1.5); ctx.lineTo(-1, -1.5);
                ctx.stroke();
                ctx.restore();

            } else { // T5A
                // T5A: Deathmark — the ultimate killing machine
                ctx.fillStyle = '#0a0a0a';
                ctx.beginPath();
                ctx.moveTo(-9, -4); ctx.lineTo(-6, -7); ctx.lineTo(8, -7);
                ctx.lineTo(9, -4); ctx.lineTo(9, 4); ctx.lineTo(8, 7);
                ctx.lineTo(-6, 7); ctx.lineTo(-9, 4);
                ctx.closePath();
                ctx.fill();
                // Pulsing red border
                ctx.save();
                ctx.strokeStyle = colorAlpha('#ff0000', 0.3 + Math.sin(t * 4) * 0.15);
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.restore();

                // Death mark emblem — glowing crosshair on body
                ctx.save();
                const markGlow = 0.4 + Math.sin(t * 5) * 0.2;
                ctx.strokeStyle = colorAlpha('#ff0000', markGlow);
                ctx.shadowColor = '#ff0000';
                ctx.shadowBlur = 6 + Math.sin(t * 4) * 3;
                ctx.lineWidth = 0.8;
                ctx.beginPath();
                ctx.arc(-3, 0, 4, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(-3, -5); ctx.lineTo(-3, 5);
                ctx.moveTo(-8, 0); ctx.lineTo(2, 0);
                ctx.stroke();
                // Inner dot
                ctx.fillStyle = colorAlpha('#ff0000', markGlow);
                ctx.beginPath();
                ctx.arc(-3, 0, 1, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

                // Elite anti-material barrel
                const aBarrelG5 = ctx.createLinearGradient(0, -3, 0, 3);
                aBarrelG5.addColorStop(0, '#2a2a2a');
                aBarrelG5.addColorStop(0.3, '#3a3a3a');
                aBarrelG5.addColorStop(0.7, '#2a2a2a');
                aBarrelG5.addColorStop(1, '#1a1a1a');
                ctx.fillStyle = aBarrelG5;
                ctx.fillRect(-2, -3, 24, 6);
                // Massive muzzle brake
                ctx.fillStyle = '#222';
                ctx.fillRect(19, -4.5, 5, 9);
                ctx.fillStyle = '#333';
                ctx.fillRect(20, -3.5, 1, 2);
                ctx.fillRect(20, 1.5, 1, 2);
                ctx.fillRect(22, -3.5, 1, 2);
                ctx.fillRect(22, 1.5, 1, 2);

                // Massive pulsing scope
                ctx.save();
                ctx.fillStyle = '#111';
                ctx.fillRect(5, -9, 14, 4);
                const rsG5 = ctx.createRadialGradient(15, -7, 0, 15, -7, 5);
                rsG5.addColorStop(0, '#ff6060');
                rsG5.addColorStop(0.4, '#ff0000');
                rsG5.addColorStop(1, '#330000');
                ctx.fillStyle = rsG5;
                ctx.shadowColor = '#ff0000';
                ctx.shadowBlur = 14 + Math.sin(t * 3) * 5;
                ctx.beginPath();
                ctx.arc(15, -7, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                // Animated crosshair in scope
                ctx.save();
                ctx.strokeStyle = '#330000';
                ctx.lineWidth = 0.8;
                const crossRot = t * 0.5;
                ctx.translate(15, -7);
                ctx.rotate(crossRot);
                ctx.beginPath();
                ctx.moveTo(0, -3.5); ctx.lineTo(0, 3.5);
                ctx.moveTo(-3.5, 0); ctx.lineTo(3.5, 0);
                ctx.stroke();
                ctx.setTransform(ctx.getTransform()); // reset inner rotation only
                ctx.restore();
                ctx.fillStyle = '#550000';
                ctx.beginPath();
                ctx.arc(15, -7, 1.2, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (isSpotter) {
            // PATH B: Spotter — tactical marksman rifle with sensors
            if (tier === 3) {
                // Tactical body
                const sBodyG = ctx.createLinearGradient(-6, -5, 6, 5);
                sBodyG.addColorStop(0, '#2a3a2a');
                sBodyG.addColorStop(0.5, '#1a2a1a');
                sBodyG.addColorStop(1, '#0a1a0a');
                ctx.fillStyle = sBodyG;
                this._roundRectPath(ctx, -6, -5, 12, 10, 2);
                ctx.fill();
                ctx.strokeStyle = colorAlpha('#40ff80', 0.15);
                ctx.lineWidth = 0.5;
                this._roundRectPath(ctx, -6, -5, 12, 10, 2);
                ctx.stroke();

                // Marksman rifle barrel
                const sRifleG = ctx.createLinearGradient(0, -2, 0, 2);
                sRifleG.addColorStop(0, '#5a6a5a');
                sRifleG.addColorStop(0.5, '#4a5a4a');
                sRifleG.addColorStop(1, '#3a4a3a');
                ctx.fillStyle = sRifleG;
                ctx.fillRect(-2, -1.5, 18, 3);

                // Sensor node on barrel
                ctx.save();
                const sensorG = ctx.createRadialGradient(14, 0, 0, 14, 0, 2);
                sensorG.addColorStop(0, '#80ffb0');
                sensorG.addColorStop(1, '#20aa50');
                ctx.fillStyle = sensorG;
                ctx.shadowColor = '#40ff80';
                ctx.shadowBlur = 5;
                ctx.beginPath();
                ctx.arc(14, 0, 1.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

                // Tactical scope with green lens
                ctx.fillStyle = '#333';
                ctx.fillRect(5, -6, 9, 2.5);
                ctx.save();
                const gsG = ctx.createRadialGradient(12, -4.8, 0, 12, -4.8, 2.5);
                gsG.addColorStop(0, '#80ffb0');
                gsG.addColorStop(0.5, '#40cc70');
                gsG.addColorStop(1, '#206630');
                ctx.fillStyle = gsG;
                ctx.shadowColor = '#40ff80';
                ctx.shadowBlur = 6;
                ctx.beginPath();
                ctx.arc(12, -4.8, 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

                // Small radar antenna
                ctx.fillStyle = '#777';
                ctx.fillRect(-1, -8, 2, 3);
                ctx.save();
                ctx.rotate(t * 1.5);
                ctx.fillStyle = '#999';
                ctx.beginPath();
                ctx.moveTo(0, -9);
                ctx.lineTo(-4, -6);
                ctx.lineTo(4, -6);
                ctx.closePath();
                ctx.fill();
                ctx.restore();

            } else if (tier === 4) {
                // T4B: Advanced sensor platform
                const sBodyG4 = ctx.createLinearGradient(-7, -5, 7, 5);
                sBodyG4.addColorStop(0, '#1a2a1a');
                sBodyG4.addColorStop(1, '#0a1a0a');
                ctx.fillStyle = sBodyG4;
                this._roundRectPath(ctx, -7, -5, 14, 10, 2);
                ctx.fill();

                // Tech panel details
                ctx.save();
                ctx.strokeStyle = '#40ff80';
                ctx.lineWidth = 0.5;
                ctx.globalAlpha = 0.2;
                ctx.strokeRect(-5, -3, 4, 6);
                ctx.strokeRect(1, -3, 4, 6);
                ctx.restore();
                // Blinking LEDs
                ctx.save();
                for (let led = 0; led < 3; led++) {
                    const ledAlpha = 0.3 + Math.sin(t * 4 + led * 2) * 0.3;
                    ctx.fillStyle = colorAlpha('#40ff80', ledAlpha);
                    ctx.fillRect(-4 + led * 2, -2, 1, 1);
                }
                ctx.restore();

                // Rifle barrel with sensors
                const sRifleG4 = ctx.createLinearGradient(0, -2, 0, 2);
                sRifleG4.addColorStop(0, '#4a5a4a');
                sRifleG4.addColorStop(1, '#3a4a3a');
                ctx.fillStyle = sRifleG4;
                ctx.fillRect(-2, -2, 20, 4);

                // Dual sensor nodes
                ctx.save();
                for (const sy of [-3.5, 3.5]) {
                    const snG = ctx.createRadialGradient(16, sy, 0, 16, sy, 2);
                    snG.addColorStop(0, '#80ffb0');
                    snG.addColorStop(1, '#20aa50');
                    ctx.fillStyle = snG;
                    ctx.shadowColor = '#40ff80';
                    ctx.shadowBlur = 4;
                    ctx.beginPath();
                    ctx.arc(16, sy, 1.5, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();

                // Radar mast + rotating dish
                ctx.fillStyle = '#888';
                ctx.fillRect(-1.5, -10, 3, 6);
                ctx.save();
                ctx.rotate(t * 2);
                const dishGrad = ctx.createLinearGradient(-8, -13, 8, -8);
                dishGrad.addColorStop(0, '#aaa');
                dishGrad.addColorStop(1, '#777');
                ctx.fillStyle = dishGrad;
                ctx.beginPath();
                ctx.moveTo(0, -13);
                ctx.lineTo(-8, -8);
                ctx.lineTo(8, -8);
                ctx.closePath();
                ctx.fill();
                ctx.restore();

                // Scanning sweep
                ctx.save();
                ctx.globalAlpha = 0.12;
                ctx.fillStyle = '#40ff80';
                ctx.beginPath();
                ctx.moveTo(0, -10);
                ctx.arc(0, -10, 20, t * 2, t * 2 + 0.5);
                ctx.closePath();
                ctx.fill();
                ctx.restore();

                // Advanced scope
                ctx.save();
                ctx.fillStyle = '#222';
                ctx.fillRect(5, -7, 10, 3);
                const gsG4 = ctx.createRadialGradient(13, -5.5, 0, 13, -5.5, 3);
                gsG4.addColorStop(0, '#80ffb0');
                gsG4.addColorStop(0.5, '#40cc70');
                gsG4.addColorStop(1, '#104420');
                ctx.fillStyle = gsG4;
                ctx.shadowColor = '#40ff80';
                ctx.shadowBlur = 8 + Math.sin(t * 3) * 2;
                ctx.beginPath();
                ctx.arc(13, -5.5, 2.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

            } else { // T5B
                // T5B: Full command station — radar array + multi-sensor
                const sBodyG5 = ctx.createLinearGradient(-8, -6, 8, 6);
                sBodyG5.addColorStop(0, '#1a2a1a');
                sBodyG5.addColorStop(0.5, '#0a1a0a');
                sBodyG5.addColorStop(1, '#051005');
                ctx.fillStyle = sBodyG5;
                this._roundRectPath(ctx, -8, -6, 16, 12, 3);
                ctx.fill();
                ctx.strokeStyle = colorAlpha('#40ff80', 0.12);
                ctx.lineWidth = 0.8;
                this._roundRectPath(ctx, -8, -6, 16, 12, 3);
                ctx.stroke();

                // Holographic display panels
                ctx.save();
                ctx.strokeStyle = '#40ff80';
                ctx.lineWidth = 0.5;
                ctx.globalAlpha = 0.25;
                ctx.strokeRect(-6, -4, 5, 8);
                ctx.strokeRect(1, -4, 5, 8);
                // Scanning lines
                const scanY = (Math.sin(t * 3) * 0.5 + 0.5) * 6 - 3;
                ctx.globalAlpha = 0.4;
                ctx.fillStyle = '#40ff80';
                ctx.fillRect(-5.5, scanY, 4, 0.5);
                ctx.fillRect(1.5, -scanY, 4, 0.5);
                // LED array
                ctx.globalAlpha = 1;
                for (let px = 0; px < 3; px++) {
                    for (let py = 0; py < 3; py++) {
                        const ledA = 0.2 + Math.sin(t * 5 + px * 2 + py * 3) * 0.3;
                        ctx.fillStyle = colorAlpha('#40ff80', ledA);
                        ctx.fillRect(-5 + px * 1.5, -3 + py * 2.5, 0.8, 0.8);
                    }
                }
                ctx.restore();

                // Central radar mast
                ctx.fillStyle = '#999';
                ctx.fillRect(-2, -14, 4, 9);

                // Full radar array
                ctx.save();
                ctx.rotate(t * 2.5);
                const dishG5 = ctx.createLinearGradient(-10, -17, 10, -11);
                dishG5.addColorStop(0, '#bbb');
                dishG5.addColorStop(1, '#777');
                ctx.fillStyle = dishG5;
                ctx.shadowColor = '#40ff80';
                ctx.shadowBlur = 6;
                ctx.beginPath();
                ctx.moveTo(0, -17);
                ctx.lineTo(-10, -11);
                ctx.lineTo(10, -11);
                ctx.closePath();
                ctx.fill();
                // Antenna tips
                ctx.strokeStyle = '#999';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(-10, -11); ctx.lineTo(-12, -9);
                ctx.moveTo(10, -11); ctx.lineTo(12, -9);
                ctx.stroke();
                ctx.restore();

                // Scanning sweep
                ctx.save();
                ctx.globalAlpha = 0.1;
                ctx.fillStyle = '#40ff80';
                ctx.beginPath();
                ctx.moveTo(0, -14);
                ctx.arc(0, -14, 28, t * 2.5, t * 2.5 + 0.6);
                ctx.closePath();
                ctx.fill();
                ctx.restore();

                // Triple-lens sensor array
                ctx.save();
                const positions = [{ x: 7, y: -3, r: 3 }, { x: 7, y: 3, r: 2.5 }, { x: 10, y: 0, r: 2 }];
                for (const p of positions) {
                    const mlG = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r + 1);
                    mlG.addColorStop(0, '#80ffb0');
                    mlG.addColorStop(1, '#20aa50');
                    ctx.fillStyle = mlG;
                    ctx.shadowColor = '#40ff80';
                    ctx.shadowBlur = 8 + Math.sin(t * 4) * 3;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }
        }

        ctx.restore();

        // Laser dot on target (Assassin T3+)
        if (isAssassin && tier >= 3 && tower.target && tower.target.alive) {
            ctx.save();
            ctx.fillStyle = '#ff0000';
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(tower.target.x, tower.target.y, tier >= 5 ? 3 : 2, 0, Math.PI * 2);
            ctx.fill();
            // Laser line
            ctx.strokeStyle = colorAlpha('#ff0000', tier >= 5 ? 0.25 : 0.15);
            ctx.lineWidth = tier >= 5 ? 1.5 : 1;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(tower.target.x, tower.target.y);
            ctx.stroke();
            ctx.restore();

            // T5A death mark on target
            if (tier >= 5) {
                ctx.save();
                ctx.strokeStyle = colorAlpha('#ff0000', 0.3 + Math.sin(t * 5) * 0.15);
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(tower.target.x, tower.target.y, 8, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(tower.target.x - 10, tower.target.y);
                ctx.lineTo(tower.target.x + 10, tower.target.y);
                ctx.moveTo(tower.target.x, tower.target.y - 10);
                ctx.lineTo(tower.target.x, tower.target.y + 10);
                ctx.stroke();
                ctx.restore();
            }
        }

        // Spotter marking on enemies
        if (isSpotter && tier >= 4 && tower.target && tower.target.alive) {
            ctx.save();
            ctx.strokeStyle = colorAlpha('#40ff80', 0.3);
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 2]);
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(tower.target.x, tower.target.y);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.strokeStyle = colorAlpha('#40ff80', 0.5);
            ctx.beginPath();
            ctx.arc(tower.target.x, tower.target.y, 6, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    },

    // =========================================================================
    // LASER TOWER (Photon) — Crystal energy / Focused Beam / Prism
    // (USER LIKES THIS — Enhanced version)
    // =========================================================================
    _drawLaser(ctx, tower, x, y, half, t) {
        const tier = tower.tier;
        const isFocused = tower.path === 'A';
        const isPrism = tower.path === 'B';

        // Energy platform
        const baseColor = '#3a1520';
        const accent = isPrism ? '#ff60a0' : '#ff4060';
        this._drawBase(ctx, x, y, half, tier, baseColor, accent, t);

        // Energy circuit lines on platform
        ctx.save();
        ctx.strokeStyle = colorAlpha('#ff4060', 0.2 + tier * 0.05);
        ctx.lineWidth = 0.5;
        const inset = half - 4;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const a = (Math.PI * 2 / 8) * i + Math.PI / 8;
            const px = x + Math.cos(a) * inset;
            const py = y + Math.sin(a) * inset;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();

        // --- CRYSTAL / LENS ---
        ctx.save();
        ctx.translate(x, y);

        if (tier <= 2) {
            // T1-2: Crystal energy core with floating shards
            // Pedestal
            const pedGrad = ctx.createLinearGradient(-5, 3, 5, 8);
            pedGrad.addColorStop(0, '#7a2a3a');
            pedGrad.addColorStop(1, '#4a1020');
            ctx.fillStyle = pedGrad;
            ctx.fillRect(-4, 3, 8, 5);

            // Energy core with multi-stop radial gradient
            ctx.save();
            const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 5 + tier * 2);
            coreGrad.addColorStop(0, '#ffffff');
            coreGrad.addColorStop(0.2, '#ffccdd');
            coreGrad.addColorStop(0.5, '#ff6080');
            coreGrad.addColorStop(0.8, '#cc2040');
            coreGrad.addColorStop(1, '#6a0818');
            ctx.fillStyle = coreGrad;
            ctx.shadowColor = '#ff4060';
            ctx.shadowBlur = 8 + tier * 3 + Math.sin(t * 4) * 3;
            ctx.beginPath();
            ctx.arc(0, 0, 5 + tier * 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Floating crystal shards around core
            if (tier >= 2) {
                ctx.save();
                for (let i = 0; i < 4; i++) {
                    const a = (Math.PI / 2) * i + t * 0.8;
                    const r = 8;
                    const cx = Math.cos(a) * r;
                    const cy = Math.sin(a) * r;
                    ctx.fillStyle = colorAlpha('#ff8090', 0.6);
                    ctx.beginPath();
                    ctx.moveTo(cx, cy - 2);
                    ctx.lineTo(cx - 1.5, cy);
                    ctx.lineTo(cx, cy + 2);
                    ctx.lineTo(cx + 1.5, cy);
                    ctx.closePath();
                    ctx.fill();
                }
                ctx.restore();
            }

        } else if (isFocused) {
            // PATH A: Focused Beam — concentric lens rings, energy core
            if (tier === 3) {
                // Lens housing
                const housingGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 9);
                housingGrad.addColorStop(0, '#5a2030');
                housingGrad.addColorStop(1, '#3a1020');
                ctx.fillStyle = housingGrad;
                ctx.beginPath();
                ctx.arc(0, 0, 9, 0, Math.PI * 2);
                ctx.fill();

                // Focusing lens rings
                ctx.save();
                ctx.strokeStyle = '#ff6080';
                ctx.shadowColor = '#ff4060';
                ctx.shadowBlur = 6;
                ctx.lineWidth = 1;
                for (let i = 1; i <= 3; i++) {
                    ctx.beginPath();
                    ctx.arc(0, 0, i * 2.5, 0, Math.PI * 2);
                    ctx.stroke();
                }
                ctx.restore();

                // Central energy core
                ctx.save();
                const cG3 = ctx.createRadialGradient(0, 0, 0, 0, 0, 4);
                cG3.addColorStop(0, '#ffffff');
                cG3.addColorStop(0.4, '#ff8090');
                cG3.addColorStop(1, '#cc2040');
                ctx.fillStyle = cG3;
                ctx.shadowColor = '#ff4060';
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(0, 0, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

            } else if (tier === 4) {
                // T4A: Bigger lens, orbiting focus rings
                const housingG4 = ctx.createRadialGradient(0, 0, 2, 0, 0, 10);
                housingG4.addColorStop(0, '#5a2030');
                housingG4.addColorStop(1, '#3a1020');
                ctx.fillStyle = housingG4;
                ctx.beginPath();
                ctx.arc(0, 0, 10, 0, Math.PI * 2);
                ctx.fill();

                // Orbiting focus rings
                ctx.save();
                ctx.strokeStyle = '#ff8080';
                ctx.shadowColor = '#ff4060';
                ctx.shadowBlur = 8;
                ctx.lineWidth = 1.5;
                for (let i = 0; i < 3; i++) {
                    const r = 7 + i * 2;
                    ctx.beginPath();
                    ctx.ellipse(0, 0, r, r * 0.3, t * (1.2 + i * 0.4), 0, Math.PI * 2);
                    ctx.stroke();
                }
                ctx.restore();

                // Lens elements
                ctx.save();
                ctx.strokeStyle = '#ff6080';
                ctx.lineWidth = 1;
                for (let i = 1; i <= 4; i++) {
                    ctx.beginPath();
                    ctx.arc(0, 0, i * 2, 0, Math.PI * 2);
                    ctx.stroke();
                }
                ctx.restore();

                // Core
                ctx.save();
                const cG4 = ctx.createRadialGradient(0, 0, 0, 0, 0, 5);
                cG4.addColorStop(0, '#ffffff');
                cG4.addColorStop(0.4, '#ff6080');
                cG4.addColorStop(1, '#bb1030');
                ctx.fillStyle = cG4;
                ctx.shadowColor = '#ff4060';
                ctx.shadowBlur = 12;
                ctx.beginPath();
                ctx.arc(0, 0, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

            } else { // T5A
                // T5A: Death ray — massive crystalline monolith
                ctx.save();
                const monoGrad = ctx.createLinearGradient(0, -16, 0, 5);
                monoGrad.addColorStop(0, '#ff6080');
                monoGrad.addColorStop(0.5, '#ff2040');
                monoGrad.addColorStop(1, '#8a0820');
                ctx.fillStyle = monoGrad;
                ctx.shadowColor = '#ff2040';
                ctx.shadowBlur = 20 + Math.sin(t * 4) * 8;
                ctx.beginPath();
                ctx.moveTo(0, -16);
                ctx.lineTo(-9, 5);
                ctx.lineTo(9, 5);
                ctx.closePath();
                ctx.fill();
                ctx.restore();

                // Crystal facet highlights
                ctx.save();
                ctx.fillStyle = colorAlpha('#ff8090', 0.3);
                ctx.beginPath();
                ctx.moveTo(-1, -14);
                ctx.lineTo(-7, 4);
                ctx.lineTo(0, 0);
                ctx.closePath();
                ctx.fill();
                ctx.restore();

                // Orbiting energy rings
                ctx.save();
                ctx.strokeStyle = '#ff8080';
                ctx.shadowColor = '#ff4060';
                ctx.shadowBlur = 12;
                ctx.lineWidth = 1.5;
                for (let i = 0; i < 4; i++) {
                    const r = 8 + i * 3;
                    ctx.beginPath();
                    ctx.ellipse(0, -2, r, r * 0.25, t * (1 + i * 0.35), 0, Math.PI * 2);
                    ctx.stroke();
                }
                ctx.restore();

                // Massive core
                ctx.save();
                const deathCoreGrad = ctx.createRadialGradient(0, -2, 0, 0, -2, 7);
                deathCoreGrad.addColorStop(0, '#ffffff');
                deathCoreGrad.addColorStop(0.3, '#ff4060');
                deathCoreGrad.addColorStop(0.7, '#cc1030');
                deathCoreGrad.addColorStop(1, '#660018');
                ctx.fillStyle = deathCoreGrad;
                ctx.shadowColor = '#ff2040';
                ctx.shadowBlur = 25 + Math.sin(t * 5) * 10;
                ctx.beginPath();
                ctx.arc(0, -2, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

                // Energy field
                ctx.save();
                ctx.globalAlpha = 0.06 + Math.sin(t * 3) * 0.03;
                ctx.fillStyle = '#ff4060';
                ctx.beginPath();
                ctx.arc(0, 0, 30, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

                // Energy particles
                if (Math.random() < 0.1) {
                    const pa = Math.random() * Math.PI * 2;
                    const pr = rand(8, 20);
                    GameState.particles.push(new Particle(
                        x + Math.cos(pa) * pr, y + Math.sin(pa) * pr,
                        { vx: -Math.cos(pa) * 1.5, vy: -Math.sin(pa) * 1.5,
                          life: rand(0.2, 0.5), size: rand(1, 3), color: '#ff4060', glow: true }
                    ));
                }
            }
        } else if (isPrism) {
            // PATH B: Prism — rainbow refraction, floating geometry
            if (tier === 3) {
                const floatY = Math.sin(t * 2) * 2;
                ctx.save();
                ctx.translate(0, floatY);
                ctx.rotate(t * 0.5);
                ctx.fillStyle = '#fff';
                ctx.shadowColor = '#ff60a0';
                ctx.shadowBlur = 8;
                drawPoly(ctx, 0, 0, 3, 9, 0);
                ctx.fill();
                // Facet colors
                const prismColors = ['#ff4040', '#40ff40', '#4040ff'];
                for (let i = 0; i < 3; i++) {
                    const a = (Math.PI * 2 / 3) * i;
                    ctx.fillStyle = colorAlpha(prismColors[i], 0.3);
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(Math.cos(a) * 9, Math.sin(a) * 9);
                    ctx.lineTo(Math.cos(a + Math.PI * 2 / 3) * 9, Math.sin(a + Math.PI * 2 / 3) * 9);
                    ctx.closePath();
                    ctx.fill();
                }
                ctx.restore();

            } else if (tier === 4) {
                const floatY = Math.sin(t * 2) * 2.5;
                ctx.save();
                ctx.translate(0, floatY);
                ctx.rotate(t * 0.6);
                ctx.save();
                ctx.strokeStyle = '#ff80a0';
                ctx.shadowColor = '#ff60a0';
                ctx.shadowBlur = 10;
                ctx.lineWidth = 1.5;
                drawPoly(ctx, 0, 0, 5, 11, 0);
                ctx.stroke();
                ctx.restore();
                ctx.fillStyle = '#fff';
                ctx.shadowColor = '#ff60a0';
                ctx.shadowBlur = 8;
                drawPoly(ctx, 0, 0, 5, 8, Math.PI / 5);
                ctx.fill();
                ctx.restore();

                // Rainbow rays
                ctx.save();
                const rainbowColors = ['#ff0000', '#ff8800', '#ffff00', '#00ff00', '#0088ff', '#8800ff'];
                ctx.globalAlpha = 0.15;
                ctx.lineWidth = 1;
                for (let i = 0; i < rainbowColors.length; i++) {
                    const a = (Math.PI * 2 / rainbowColors.length) * i + t * 0.3;
                    ctx.strokeStyle = rainbowColors[i];
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(Math.cos(a) * 20, Math.sin(a) * 20);
                    ctx.stroke();
                }
                ctx.restore();

            } else { // T5B
                // T5B: Prism array with multiple rotating rings
                const floatY = Math.sin(t * 2) * 3;
                ctx.save();
                ctx.translate(0, floatY);

                // Outer rotating ring
                ctx.save();
                ctx.rotate(t * 0.4);
                ctx.strokeStyle = '#ff80a0';
                ctx.shadowColor = '#ff60a0';
                ctx.shadowBlur = 12;
                ctx.lineWidth = 2;
                drawPoly(ctx, 0, 0, 6, 13, 0);
                ctx.stroke();
                ctx.restore();

                // Inner counter-rotating ring
                ctx.save();
                ctx.rotate(-t * 0.6);
                ctx.strokeStyle = '#ffaa80';
                ctx.lineWidth = 1.5;
                drawPoly(ctx, 0, 0, 6, 9, 0);
                ctx.stroke();
                ctx.restore();

                // Central prism
                ctx.save();
                ctx.rotate(t * 0.8);
                ctx.fillStyle = '#fff';
                ctx.shadowColor = '#ff60a0';
                ctx.shadowBlur = 15 + Math.sin(t * 3) * 5;
                drawPoly(ctx, 0, 0, 5, 7, 0);
                ctx.fill();
                ctx.restore();

                // Central core
                ctx.save();
                const prismCoreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 5);
                prismCoreGrad.addColorStop(0, '#ffffff');
                prismCoreGrad.addColorStop(0.5, '#ffaacc');
                prismCoreGrad.addColorStop(1, '#ff4080');
                ctx.fillStyle = prismCoreGrad;
                ctx.shadowColor = '#ff80a0';
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(0, 0, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

                ctx.restore(); // end float

                // Rainbow beam outputs
                ctx.save();
                const beamColors = ['#ff0000', '#ff6600', '#ffcc00', '#00ff44', '#0088ff', '#aa00ff'];
                ctx.globalAlpha = 0.12 + Math.sin(t * 3) * 0.05;
                ctx.lineWidth = 1.5;
                for (let i = 0; i < beamColors.length; i++) {
                    const a = (Math.PI * 2 / beamColors.length) * i + t * 0.2;
                    ctx.strokeStyle = beamColors[i];
                    ctx.shadowColor = beamColors[i];
                    ctx.shadowBlur = 4;
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(Math.cos(a) * 25, Math.sin(a) * 25);
                    ctx.stroke();
                }
                ctx.restore();

                // Solar energy particles
                if (Math.random() < 0.1) {
                    const pa = Math.random() * Math.PI * 2;
                    const colors = ['#ff4060', '#ffaa40', '#ff80a0', '#ffffff'];
                    GameState.particles.push(new Particle(
                        x + Math.cos(pa) * rand(10, 18), y + Math.sin(pa) * rand(10, 18),
                        { vx: -Math.cos(pa) * 1, vy: -Math.sin(pa) * 1,
                          life: rand(0.3, 0.5), size: rand(1.5, 3), color: colors[Math.floor(Math.random() * colors.length)], glow: true }
                    ));
                }
            }
        }
        ctx.restore();
    },

    // =========================================================================
    // MISSILE TOWER (Valkyrie) — Launch platform / Warhead / Cluster
    // =========================================================================
    _drawMissile(ctx, tower, x, y, half, t) {
        const tier = tower.tier;
        const isWarhead = tower.path === 'A';
        const isCluster = tower.path === 'B';

        const baseColor = tier >= 3 ? '#2a2a3a' : '#3a3a4a';
        const accent = tier >= 4 ? (isWarhead ? '#ff8020' : '#80ff40') : '#8a8a9a';
        this._drawBase(ctx, x, y, half, tier, baseColor, accent, t);

        // Caution stripes
        if (tier >= 3) {
            ctx.save();
            ctx.strokeStyle = colorAlpha('#ffcc00', 0.2);
            ctx.lineWidth = 1;
            for (let i = 0; i < 3; i++) {
                const sx = x - half + 4 + i * 6;
                ctx.beginPath();
                ctx.moveTo(sx, y + half - 3);
                ctx.lineTo(sx + 3, y + half - 6);
                ctx.stroke();
            }
            ctx.restore();
        }

        // --- WEAPON ---
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(tower.angle);

        if (tier <= 2) {
            // T1-2: Launch platform with single missile
            // Launch rail
            const railGrad = ctx.createLinearGradient(-5, -3, -5, 3);
            railGrad.addColorStop(0, '#666');
            railGrad.addColorStop(1, '#444');
            ctx.fillStyle = railGrad;
            ctx.fillRect(-5, -3, 10, 6);
            ctx.strokeStyle = '#777';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(-5, -3, 10, 6);

            // Missile body with metallic gradient
            const missileGrad = ctx.createLinearGradient(0, -2.5, 0, 2.5);
            missileGrad.addColorStop(0, '#aaa');
            missileGrad.addColorStop(0.4, '#999');
            missileGrad.addColorStop(0.6, '#888');
            missileGrad.addColorStop(1, '#777');
            ctx.fillStyle = missileGrad;
            ctx.fillRect(-1, -2, 12, 4);

            // Nose cone
            const noseGrad = ctx.createLinearGradient(11, 0, 14, 0);
            noseGrad.addColorStop(0, '#cc3020');
            noseGrad.addColorStop(1, '#ff4020');
            ctx.fillStyle = noseGrad;
            ctx.beginPath();
            ctx.moveTo(14, 0);
            ctx.lineTo(11, -2.5);
            ctx.lineTo(11, 2.5);
            ctx.closePath();
            ctx.fill();

            // Fins
            ctx.fillStyle = '#666';
            ctx.beginPath();
            ctx.moveTo(0, -4); ctx.lineTo(3, -2); ctx.lineTo(0, -2);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(0, 4); ctx.lineTo(3, 2); ctx.lineTo(0, 2);
            ctx.closePath();
            ctx.fill();

            // Exhaust port
            if (tier >= 2) {
                ctx.fillStyle = '#444';
                ctx.beginPath();
                ctx.arc(-1, 0, 2, 0, Math.PI * 2);
                ctx.fill();
                // Exhaust glow
                ctx.save();
                ctx.fillStyle = colorAlpha('#ff8040', 0.2);
                ctx.beginPath();
                ctx.arc(-3, 0, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

        } else if (isWarhead) {
            // PATH A: Warhead — single large missile, angular
            if (tier === 3) {
                // Launch frame
                ctx.fillStyle = '#4a4a5a';
                ctx.fillRect(-7, -5, 14, 10);
                ctx.strokeStyle = '#5a5a6a';
                ctx.lineWidth = 0.5;
                ctx.strokeRect(-7, -5, 14, 10);

                // Large missile
                const mGrad3 = ctx.createLinearGradient(0, -3.5, 0, 3.5);
                mGrad3.addColorStop(0, '#aaa');
                mGrad3.addColorStop(0.5, '#bbb');
                mGrad3.addColorStop(1, '#999');
                ctx.fillStyle = mGrad3;
                ctx.fillRect(-2, -3, 16, 6);

                // Warhead
                const wGrad3 = ctx.createLinearGradient(14, 0, 17, 0);
                wGrad3.addColorStop(0, '#cc3020');
                wGrad3.addColorStop(1, '#ff4020');
                ctx.fillStyle = wGrad3;
                ctx.beginPath();
                ctx.moveTo(17, 0);
                ctx.lineTo(14, -4);
                ctx.lineTo(14, 4);
                ctx.closePath();
                ctx.fill();

                // Danger stripes
                ctx.strokeStyle = '#ffcc00';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(4, -3); ctx.lineTo(6, 3);
                ctx.moveTo(8, -3); ctx.lineTo(10, 3);
                ctx.stroke();

                // Fins
                ctx.fillStyle = '#777';
                ctx.fillRect(-2, -6, 4, 3);
                ctx.fillRect(-2, 3, 4, 3);

            } else if (tier === 4) {
                // T4A: Heavy warhead with glowing tip
                ctx.fillStyle = '#3a3a4a';
                ctx.fillRect(-8, -6, 16, 12);

                const mGrad4 = ctx.createLinearGradient(0, -4.5, 0, 4.5);
                mGrad4.addColorStop(0, '#bbb');
                mGrad4.addColorStop(0.5, '#ccc');
                mGrad4.addColorStop(1, '#aaa');
                ctx.fillStyle = mGrad4;
                ctx.fillRect(-3, -4, 18, 8);

                // Warhead glow
                ctx.save();
                const wGrad4 = ctx.createRadialGradient(18, 0, 0, 18, 0, 6);
                wGrad4.addColorStop(0, '#ffcc40');
                wGrad4.addColorStop(0.4, '#ff6020');
                wGrad4.addColorStop(1, 'rgba(255,64,16,0)');
                ctx.fillStyle = wGrad4;
                ctx.shadowColor = '#ff4010';
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.arc(18, 0, 5.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

                // Danger marking
                ctx.strokeStyle = '#ffcc00';
                ctx.lineWidth = 1;
                ctx.strokeRect(3, -4, 6, 8);
                ctx.fillStyle = '#ffcc00';
                ctx.font = '6px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('!', 6, 2);

                // Fins
                ctx.fillStyle = '#888';
                ctx.fillRect(-3, -7, 5, 3);
                ctx.fillRect(-3, 4, 5, 3);

            } else { // T5A
                // T5A: Tactical nuke launcher
                // Silo housing
                ctx.fillStyle = '#333';
                ctx.fillRect(-9, -8, 18, 16);
                ctx.strokeStyle = '#555';
                ctx.lineWidth = 1;
                ctx.strokeRect(-9, -8, 18, 16);
                ctx.fillStyle = '#222';
                ctx.fillRect(-7, -6, 14, 12);

                // Nuclear missile
                const mGrad5 = ctx.createLinearGradient(0, -4.5, 0, 4.5);
                mGrad5.addColorStop(0, '#ccc');
                mGrad5.addColorStop(0.5, '#ddd');
                mGrad5.addColorStop(1, '#bbb');
                ctx.fillStyle = mGrad5;
                ctx.fillRect(-3, -4, 16, 8);

                // Nuclear warhead with massive glow
                ctx.save();
                const nukeGrad = ctx.createRadialGradient(16, 0, 0, 16, 0, 8);
                nukeGrad.addColorStop(0, '#ffff80');
                nukeGrad.addColorStop(0.3, '#ff8020');
                nukeGrad.addColorStop(0.7, '#ff4010');
                nukeGrad.addColorStop(1, 'rgba(255,64,16,0)');
                ctx.fillStyle = nukeGrad;
                ctx.shadowColor = '#ff8020';
                ctx.shadowBlur = 15 + Math.sin(t * 4) * 6;
                ctx.beginPath();
                ctx.arc(16, 0, 7, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

                // Nuclear symbol
                ctx.save();
                ctx.strokeStyle = '#ffcc00';
                ctx.shadowColor = '#ffcc00';
                ctx.shadowBlur = 4;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(6, 0, 3, 0, Math.PI * 2);
                ctx.stroke();
                for (let i = 0; i < 3; i++) {
                    const a = (Math.PI * 2 / 3) * i - Math.PI / 2;
                    ctx.beginPath();
                    ctx.arc(6, 0, 5, a - 0.4, a + 0.4);
                    ctx.stroke();
                }
                ctx.restore();

                // Danger stripes
                ctx.strokeStyle = '#ff0000';
                ctx.lineWidth = 1;
                for (let i = 0; i < 3; i++) {
                    ctx.beginPath();
                    ctx.moveTo(-7 + i * 3, -8);
                    ctx.lineTo(-5 + i * 3, 8);
                    ctx.stroke();
                }

                // Nuclear glow particles
                if (Math.random() < 0.06) {
                    GameState.particles.push(new Particle(
                        x + rand(-5, 15), y + rand(-8, 8),
                        { vx: rand(-0.5, 0.5), vy: rand(-1, -2), life: rand(0.3, 0.6), size: rand(1, 3), color: '#ff8020', glow: true }
                    ));
                }
            }
        } else if (isCluster) {
            // PATH B: Cluster — multiple missile pods
            if (tier === 3) {
                ctx.fillStyle = '#4a4a4a';
                ctx.fillRect(-6, -6, 12, 12);
                const tubePos = [[-3, -3], [3, -3], [-3, 3], [3, 3]];
                for (const [tx, ty] of tubePos) {
                    ctx.fillStyle = '#666';
                    ctx.beginPath();
                    ctx.arc(tx, ty, 2.5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.save();
                    ctx.fillStyle = '#ff4020';
                    ctx.shadowColor = '#ff4020';
                    ctx.shadowBlur = 2;
                    ctx.beginPath();
                    ctx.arc(tx, ty, 1.2, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }

            } else if (tier === 4) {
                ctx.fillStyle = '#3a3a3a';
                ctx.fillRect(-8, -7, 16, 14);
                ctx.strokeStyle = '#555';
                ctx.lineWidth = 0.5;
                ctx.strokeRect(-8, -7, 16, 14);
                for (let gx = -1; gx <= 1; gx++) {
                    for (let gy = -1; gy <= 1; gy++) {
                        if (gx === 0 && gy === 0) continue;
                        ctx.fillStyle = '#666';
                        ctx.beginPath();
                        ctx.arc(gx * 4, gy * 4, 2, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.save();
                        ctx.fillStyle = '#ff4020';
                        ctx.shadowColor = '#ff4020';
                        ctx.shadowBlur = 2;
                        ctx.beginPath();
                        ctx.arc(gx * 4, gy * 4, 1, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.restore();
                    }
                }
                // Center targeting optic
                ctx.save();
                const opticG = ctx.createRadialGradient(0, 0, 0, 0, 0, 2);
                opticG.addColorStop(0, '#80ff80');
                opticG.addColorStop(1, '#20aa20');
                ctx.fillStyle = opticG;
                ctx.shadowColor = '#40ff40';
                ctx.shadowBlur = 4;
                ctx.beginPath();
                ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

            } else { // T5B
                // T5B: Full missile battery
                ctx.fillStyle = '#2a2a2a';
                ctx.fillRect(-10, -9, 20, 18);
                ctx.strokeStyle = '#444';
                ctx.lineWidth = 1;
                ctx.strokeRect(-10, -9, 20, 18);

                // Armor plating
                ctx.strokeStyle = '#3a3a3a';
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(-10, 0); ctx.lineTo(10, 0);
                ctx.moveTo(0, -9); ctx.lineTo(0, 9);
                ctx.stroke();

                // 4x4 missile tubes
                for (let gx = -1.5; gx <= 1.5; gx++) {
                    for (let gy = -1.5; gy <= 1.5; gy++) {
                        const tx = gx * 4;
                        const ty = gy * 4;
                        ctx.fillStyle = '#555';
                        ctx.beginPath();
                        ctx.arc(tx, ty, 1.8, 0, Math.PI * 2);
                        ctx.fill();
                        const loaded = Math.sin(gx * 3 + gy * 7 + t * 0.5) > -0.3;
                        if (loaded) {
                            ctx.save();
                            ctx.fillStyle = '#ff4020';
                            ctx.shadowColor = '#ff4020';
                            ctx.shadowBlur = 2;
                            ctx.beginPath();
                            ctx.arc(tx, ty, 1, 0, Math.PI * 2);
                            ctx.fill();
                            ctx.restore();
                        }
                    }
                }

                // Military targeting center
                ctx.save();
                const tarG5 = ctx.createRadialGradient(0, 0, 0, 0, 0, 3);
                tarG5.addColorStop(0, '#80ff80');
                tarG5.addColorStop(1, '#20aa20');
                ctx.fillStyle = tarG5;
                ctx.shadowColor = '#40ff40';
                ctx.shadowBlur = 6 + Math.sin(t * 4) * 3;
                ctx.beginPath();
                ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                ctx.strokeStyle = colorAlpha('#40ff40', 0.5);
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(-4, 0); ctx.lineTo(4, 0);
                ctx.moveTo(0, -4); ctx.lineTo(0, 4);
                ctx.stroke();

                // Launch exhaust particles
                if (Math.random() < 0.04) {
                    const ea = tower.angle + Math.PI + rand(-0.3, 0.3);
                    GameState.particles.push(new Particle(
                        x + Math.cos(ea) * 10, y + Math.sin(ea) * 10,
                        { vx: Math.cos(ea) * 2, vy: Math.sin(ea) * 2, life: 0.2, size: rand(1, 2.5), color: '#888' }
                    ));
                }
            }
        }

        ctx.restore();
    },

    // =========================================================================
    // BOOST TOWER (Catalyst) — Energy beacon / Amplifier / Armory
    // =========================================================================
    _drawBoost(ctx, tower, x, y, half, t) {
        const tier = tower.tier;
        const isAmplifier = tower.path === 'A';
        const isArmory = tower.path === 'B';

        // Ornate golden base
        const baseColor = '#3a3a1a';
        const accent = '#c09030';
        this._drawBase(ctx, x, y, half, tier, baseColor, accent, t);

        // Golden border override (thicker for boost)
        ctx.save();
        const goldGrad = ctx.createLinearGradient(x - half, y - half, x + half, y + half);
        goldGrad.addColorStop(0, '#d0a030');
        goldGrad.addColorStop(0.5, '#ffd700');
        goldGrad.addColorStop(1, '#c09020');
        ctx.strokeStyle = goldGrad;
        ctx.lineWidth = 2;
        this._roundRect(ctx, x - half, y - half, half * 2, half * 2, 4);
        ctx.stroke();
        ctx.restore();

        // --- DEVICE ---
        ctx.save();
        ctx.translate(x, y);

        if (tier <= 2) {
            // T1-2: Glowing orb on ornate pedestal
            // Pedestal with gradient
            const pedGrad = ctx.createLinearGradient(-6, 3, 6, 8);
            pedGrad.addColorStop(0, '#8a8a6a');
            pedGrad.addColorStop(1, '#5a5a3a');
            ctx.fillStyle = pedGrad;
            ctx.fillRect(-4, 3, 8, 5);
            ctx.fillStyle = '#7a7a5a';
            ctx.fillRect(-6, 6, 12, 2);
            // Column
            ctx.fillStyle = '#5a5a3a';
            ctx.fillRect(-2, -3, 4, 8);

            // Glowing orb with detailed gradient
            ctx.save();
            const orbGrad = ctx.createRadialGradient(0, -4, 0, 0, -4, 5 + tier);
            orbGrad.addColorStop(0, '#ffffff');
            orbGrad.addColorStop(0.2, '#fff8e0');
            orbGrad.addColorStop(0.5, '#ffe880');
            orbGrad.addColorStop(0.8, '#ffd700');
            orbGrad.addColorStop(1, '#aa8020');
            ctx.fillStyle = orbGrad;
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 8 + Math.sin(t * 3) * 4;
            ctx.beginPath();
            ctx.arc(0, -4, 4 + tier, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Highlight sparkle
            if (tier >= 2) {
                ctx.save();
                ctx.fillStyle = '#fff';
                ctx.globalAlpha = 0.5 + Math.sin(t * 5) * 0.3;
                ctx.beginPath();
                ctx.arc(2, -6, 1, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

        } else if (isAmplifier) {
            // PATH A: Amplifier — satellite dish, energy waves
            if (tier === 3) {
                // Support
                ctx.fillStyle = '#888';
                ctx.fillRect(-1.5, -3, 3, 10);
                // Dish
                ctx.save();
                const dishGrad = ctx.createLinearGradient(-8, -6, 8, -6);
                dishGrad.addColorStop(0, '#999');
                dishGrad.addColorStop(0.5, '#bbb');
                dishGrad.addColorStop(1, '#999');
                ctx.fillStyle = dishGrad;
                ctx.beginPath();
                ctx.arc(0, -6, 8, -0.7, 0.7 + Math.PI, true);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = '#ddd';
                ctx.lineWidth = 0.5;
                ctx.stroke();
                ctx.restore();
                // Focus point
                ctx.save();
                const focusGrad = ctx.createRadialGradient(0, -6, 0, 0, -6, 2.5);
                focusGrad.addColorStop(0, '#fff');
                focusGrad.addColorStop(0.5, '#ffd700');
                focusGrad.addColorStop(1, '#aa8020');
                ctx.fillStyle = focusGrad;
                ctx.shadowColor = '#ffd700';
                ctx.shadowBlur = 6;
                ctx.beginPath();
                ctx.arc(0, -6, 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                // Broadcasting rings
                ctx.save();
                ctx.strokeStyle = colorAlpha('#ffd700', 0.2 + Math.sin(t * 4) * 0.1);
                ctx.lineWidth = 1;
                for (let i = 1; i <= 3; i++) {
                    ctx.beginPath();
                    ctx.arc(0, -6, 3 + i * 4 + Math.sin(t * 3 + i) * 2, -0.8, 0.8);
                    ctx.stroke();
                }
                ctx.restore();

            } else if (tier === 4) {
                // T4A: Larger dish, stronger broadcast
                ctx.fillStyle = '#999';
                ctx.fillRect(-2, -4, 4, 11);
                ctx.save();
                const dishG4 = ctx.createLinearGradient(-10, -7, 10, -7);
                dishG4.addColorStop(0, '#aaa');
                dishG4.addColorStop(0.5, '#ccc');
                dishG4.addColorStop(1, '#aaa');
                ctx.fillStyle = dishG4;
                ctx.beginPath();
                ctx.arc(0, -7, 10, -0.8, 0.8 + Math.PI, true);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = '#ddd';
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.arc(0, -7, 6, -0.6, 0.6 + Math.PI, true);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(0, -7, 3, -0.4, 0.4 + Math.PI, true);
                ctx.stroke();
                ctx.restore();
                // Powerful focus
                ctx.save();
                const focusG4 = ctx.createRadialGradient(0, -7, 0, 0, -7, 3.5);
                focusG4.addColorStop(0, '#fff');
                focusG4.addColorStop(0.5, '#ffd700');
                focusG4.addColorStop(1, '#aa8020');
                ctx.fillStyle = focusG4;
                ctx.shadowColor = '#ffd700';
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(0, -7, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                // Energy waves
                ctx.save();
                ctx.strokeStyle = colorAlpha('#ffd700', 0.3);
                ctx.lineWidth = 1.5;
                for (let i = 1; i <= 4; i++) {
                    const wave = ((t * 0.8 + i * 0.25) % 1);
                    ctx.globalAlpha = (1 - wave) * 0.3;
                    ctx.beginPath();
                    ctx.arc(0, -7, 5 + wave * 20, -0.6, 0.6);
                    ctx.stroke();
                }
                ctx.restore();

            } else { // T5A
                // T5A: Supernova core with orbital elements
                // Pedestal
                ctx.fillStyle = '#aaa';
                ctx.fillRect(-3, 2, 6, 5);

                // Orbiting satellite elements
                ctx.save();
                for (let i = 0; i < 3; i++) {
                    const orbitA = t * 2 + (Math.PI * 2 / 3) * i;
                    const ox = Math.cos(orbitA) * 10;
                    const oy = Math.sin(orbitA) * 10 * 0.4;
                    ctx.save();
                    ctx.fillStyle = '#ddd';
                    ctx.shadowColor = '#ffd700';
                    ctx.shadowBlur = 4;
                    ctx.beginPath();
                    ctx.arc(ox, oy - 2, 2.5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
                ctx.restore();

                // Orbit ring
                ctx.save();
                ctx.strokeStyle = colorAlpha('#ffd700', 0.2);
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.ellipse(0, -2, 10, 4, 0, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();

                // Supernova core
                ctx.save();
                const novaGrad = ctx.createRadialGradient(0, -3, 0, 0, -3, 8);
                novaGrad.addColorStop(0, '#ffffff');
                novaGrad.addColorStop(0.2, '#fff8e0');
                novaGrad.addColorStop(0.5, '#ffd700');
                novaGrad.addColorStop(0.8, '#cc8800');
                novaGrad.addColorStop(1, '#884400');
                ctx.fillStyle = novaGrad;
                ctx.shadowColor = '#ffd700';
                ctx.shadowBlur = 20 + Math.sin(t * 4) * 8;
                ctx.beginPath();
                ctx.arc(0, -3, 7, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

                // Energy rays
                ctx.save();
                ctx.strokeStyle = '#ffd700';
                ctx.globalAlpha = 0.15;
                ctx.lineWidth = 1;
                for (let i = 0; i < 8; i++) {
                    const ra = (Math.PI * 2 / 8) * i + t * 0.5;
                    const rLen = 12 + Math.sin(t * 3 + i) * 4;
                    ctx.beginPath();
                    ctx.moveTo(0, -3);
                    ctx.lineTo(Math.cos(ra) * rLen, -3 + Math.sin(ra) * rLen);
                    ctx.stroke();
                }
                ctx.restore();

                // Nova particles
                if (Math.random() < 0.08) {
                    const pa = Math.random() * Math.PI * 2;
                    GameState.particles.push(new Particle(
                        x + Math.cos(pa) * rand(5, 12), y - 3 + Math.sin(pa) * rand(5, 12),
                        { vx: Math.cos(pa) * 1.5, vy: Math.sin(pa) * 1.5,
                          life: rand(0.3, 0.5), size: rand(1, 2.5), color: '#ffd700', glow: true }
                    ));
                }
            }
        } else if (isArmory) {
            // PATH B: Armory/Supply Master — treasure, economic
            if (tier === 3) {
                // Treasure chest
                ctx.fillStyle = '#8a6a30';
                ctx.fillRect(-7, -2, 14, 8);
                ctx.fillStyle = '#9a7a40';
                ctx.beginPath();
                ctx.arc(0, -2, 7, Math.PI, 0);
                ctx.fill();
                // Lock
                ctx.save();
                ctx.fillStyle = '#ffd700';
                ctx.shadowColor = '#ffd700';
                ctx.shadowBlur = 3;
                ctx.beginPath();
                ctx.arc(0, 0, 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                // Gold coins
                ctx.save();
                ctx.fillStyle = '#ffd700';
                ctx.shadowColor = '#ffd700';
                ctx.shadowBlur = 3;
                ctx.beginPath();
                ctx.arc(-3, -4, 1.5, 0, Math.PI * 2);
                ctx.arc(1, -5, 1.5, 0, Math.PI * 2);
                ctx.arc(3, -3, 1.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

            } else if (tier === 4) {
                // T4B: Bigger chest overflowing
                ctx.fillStyle = '#7a5a20';
                ctx.fillRect(-8, -1, 16, 9);
                ctx.fillStyle = '#8a6a30';
                ctx.beginPath();
                ctx.arc(0, -1, 8, Math.PI, 0);
                ctx.fill();
                // Metal bands
                ctx.strokeStyle = '#aa8a40';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(-8, 2); ctx.lineTo(8, 2);
                ctx.moveTo(-8, 5); ctx.lineTo(8, 5);
                ctx.stroke();
                // Golden lock
                ctx.save();
                ctx.fillStyle = '#ffd700';
                ctx.shadowColor = '#ffd700';
                ctx.shadowBlur = 4;
                ctx.beginPath();
                ctx.arc(0, 1, 2.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                // Overflowing gold
                ctx.save();
                ctx.fillStyle = '#ffd700';
                ctx.shadowColor = '#ffd700';
                ctx.shadowBlur = 5;
                const coinPositions = [[-4, -5], [-1, -7], [2, -5], [4, -4], [0, -3]];
                for (const [cx, cy] of coinPositions) {
                    ctx.beginPath();
                    ctx.arc(cx, cy, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();

            } else { // T5B
                // T5B: Command center with antennas
                ctx.fillStyle = '#5a5a4a';
                ctx.fillRect(-9, -4, 18, 12);
                ctx.strokeStyle = '#7a7a5a';
                ctx.lineWidth = 1;
                ctx.strokeRect(-9, -4, 18, 12);

                // Roof
                ctx.fillStyle = '#6a6a4a';
                ctx.beginPath();
                ctx.moveTo(-10, -4);
                ctx.lineTo(0, -10);
                ctx.lineTo(10, -4);
                ctx.closePath();
                ctx.fill();

                // Multiple antennas
                ctx.strokeStyle = '#999';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(-5, -7); ctx.lineTo(-5, -14);
                ctx.moveTo(5, -7); ctx.lineTo(5, -13);
                ctx.moveTo(0, -10); ctx.lineTo(0, -16);
                ctx.stroke();
                // Blinking antenna tips
                ctx.save();
                ctx.fillStyle = '#ff0000';
                ctx.globalAlpha = 0.5 + Math.sin(t * 6) * 0.5;
                ctx.beginPath();
                ctx.arc(-5, -14, 1.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 0.5 + Math.sin(t * 6 + 1) * 0.5;
                ctx.beginPath();
                ctx.arc(5, -13, 1.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 0.5 + Math.sin(t * 6 + 2) * 0.5;
                ctx.fillStyle = '#ffd700';
                ctx.beginPath();
                ctx.arc(0, -16, 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

                // Windows
                ctx.save();
                ctx.fillStyle = '#ffd700';
                ctx.shadowColor = '#ffd700';
                ctx.shadowBlur = 4;
                ctx.fillRect(-6, -1, 3, 3);
                ctx.fillRect(3, -1, 3, 3);
                ctx.restore();

                // Dollar symbol
                ctx.save();
                ctx.fillStyle = '#ffd700';
                ctx.shadowColor = '#ffd700';
                ctx.shadowBlur = 6 + Math.sin(t * 3) * 3;
                ctx.font = 'bold 10px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('$', 0, 7);
                ctx.restore();

                // Gold coin particles
                if (Math.random() < 0.04) {
                    GameState.particles.push(new Particle(
                        x + rand(-8, 8), y - 10,
                        { vx: rand(-0.5, 0.5), vy: rand(-1, -0.3), life: rand(0.4, 0.7), size: rand(1.5, 3), color: '#ffd700', glow: true }
                    ));
                }
            }
        }

        ctx.restore();

        // Pulse rings (all tiers)
        const pulsePhase = (t % 2) / 2;
        ctx.save();
        ctx.globalAlpha = (1 - pulsePhase) * 0.2;
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, tower.getEffectiveRange() * pulsePhase, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    },

    // =========================================================================
    // FLAME TOWER (Pyro) — Fire brazier / Inferno / Wildfire
    // =========================================================================
    _drawFlame(ctx, tower, x, y, half, t) {
        const tier = tower.tier;
        const isInferno = tower.path === 'A';
        const isWildfire = tower.path === 'B';

        const baseColor = tier >= 4 ? (isInferno ? '#3a1a0a' : isWildfire ? '#2a1a08' : '#3a2010')
            : tier >= 3 ? '#3a2010' : '#4a3020';
        const accent = tier >= 4 ? (isInferno ? '#ff4010' : '#ff8020') : '#ff6020';
        this._drawBase(ctx, x, y, half, tier, baseColor, accent, t);

        ctx.save();
        ctx.translate(x, y);

        if (tier <= 2) {
            // T1-2: Stone brazier with fire
            ctx.fillStyle = '#5a4a3a';
            ctx.fillRect(-5, 1, 10, 6);
            ctx.fillStyle = '#6a5a4a';
            ctx.fillRect(-6, 5, 12, 3);
            // Fire
            ctx.save();
            for (let i = 0; i < 3 + tier; i++) {
                const fx = (i - (2 + tier) / 2) * 3;
                const fh = 6 + Math.sin(t * 6 + i * 1.5) * 3;
                const grad = ctx.createLinearGradient(fx, 0, fx, -fh);
                grad.addColorStop(0, '#ff6020');
                grad.addColorStop(0.4, '#ff4010');
                grad.addColorStop(1, 'rgba(255,100,0,0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.moveTo(fx - 2, 1);
                ctx.quadraticCurveTo(fx + Math.sin(t * 8 + i) * 1.5, -fh, fx + 2, 1);
                ctx.fill();
            }
            ctx.restore();

        } else if (isInferno) {
            // Path A: Inferno — intense concentrated flame pillar
            const intensity = tier === 5 ? 1.5 : tier === 4 ? 1.2 : 1;
            ctx.fillStyle = '#3a2010';
            ctx.fillRect(-4, 2, 8, 5);
            // Focused flame column
            ctx.save();
            const flameH = 12 * intensity;
            const colGrad = ctx.createLinearGradient(0, 2, 0, -flameH);
            colGrad.addColorStop(0, '#fff');
            colGrad.addColorStop(0.15, '#ffe060');
            colGrad.addColorStop(0.4, '#ff4010');
            colGrad.addColorStop(0.8, '#cc2000');
            colGrad.addColorStop(1, 'rgba(180,20,0,0)');
            ctx.fillStyle = colGrad;
            ctx.shadowColor = '#ff4010';
            ctx.shadowBlur = 10 + Math.sin(t * 5) * 5;
            ctx.beginPath();
            ctx.moveTo(-3, 2);
            ctx.quadraticCurveTo(-1 + Math.sin(t * 7) * 1, -flameH, 0, -flameH - 2);
            ctx.quadraticCurveTo(1 + Math.sin(t * 7 + 1) * 1, -flameH, 3, 2);
            ctx.fill();
            ctx.restore();
            // Heat shimmer rings for T4+
            if (tier >= 4) {
                ctx.save();
                ctx.strokeStyle = colorAlpha('#ff6020', 0.15 + Math.sin(t * 4) * 0.08);
                ctx.lineWidth = 1;
                for (let i = 0; i < tier - 2; i++) {
                    ctx.beginPath();
                    ctx.arc(0, -4, 6 + i * 4 + Math.sin(t * 3 + i) * 2, 0, Math.PI * 2);
                    ctx.stroke();
                }
                ctx.restore();
            }
            // T5 ember particles
            if (tier >= 5 && Math.random() < 0.1) {
                GameState.particles.push(new Particle(
                    x + rand(-4, 4), y - 8,
                    { vx: rand(-0.5, 0.5), vy: rand(-2, -0.8), life: rand(0.3, 0.6), size: rand(1, 2.5), color: '#ff6020', glow: true }
                ));
            }

        } else if (isWildfire) {
            // Path B: Wildfire — spreading, scattered flames
            ctx.fillStyle = '#4a3020';
            ctx.fillRect(-3, 3, 6, 4);
            // Multiple scattered fire sources
            ctx.save();
            const fireCount = tier === 5 ? 7 : tier === 4 ? 5 : 4;
            for (let i = 0; i < fireCount; i++) {
                const angle = (Math.PI * 2 / fireCount) * i + t * 0.3;
                const dist = 4 + (tier - 2) * 2;
                const fx = Math.cos(angle) * dist;
                const fy = Math.sin(angle) * dist * 0.6;
                const fh = 5 + Math.sin(t * 5 + i * 2) * 2;
                const grad = ctx.createLinearGradient(fx, fy, fx, fy - fh);
                grad.addColorStop(0, '#ff8020');
                grad.addColorStop(0.5, '#ff4010');
                grad.addColorStop(1, 'rgba(255,60,0,0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.moveTo(fx - 1.5, fy);
                ctx.quadraticCurveTo(fx + Math.sin(t * 6 + i) * 0.8, fy - fh, fx + 1.5, fy);
                ctx.fill();
            }
            ctx.restore();
            // Connecting fire trails for T4+
            if (tier >= 4) {
                ctx.save();
                ctx.strokeStyle = colorAlpha('#ff6020', 0.15);
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(0, 0, 4 + (tier - 2) * 2, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
        }

        ctx.restore();
    },

    // =========================================================================
    // VENOM TOWER (Toxin) — Poison vial / Plague Doctor / Corrosive
    // =========================================================================
    _drawVenom(ctx, tower, x, y, half, t) {
        const tier = tower.tier;
        const isPlague = tower.path === 'A';
        const isCorrosive = tower.path === 'B';

        const baseColor = tier >= 4 ? (isPlague ? '#1a2a1a' : isCorrosive ? '#1a2a20' : '#2a3a2a')
            : tier >= 3 ? '#2a3a2a' : '#3a4a3a';
        const accent = tier >= 4 ? (isPlague ? '#80ff40' : '#40ffa0') : '#40e040';
        this._drawBase(ctx, x, y, half, tier, baseColor, accent, t);

        ctx.save();
        ctx.translate(x, y);

        if (tier <= 2) {
            // T1-2: Bubbling cauldron
            ctx.fillStyle = '#4a4a4a';
            ctx.beginPath();
            ctx.arc(0, 2, 6, 0, Math.PI);
            ctx.fill();
            ctx.fillStyle = '#3a3a3a';
            ctx.fillRect(-6, -1, 12, 3);
            // Poison liquid
            ctx.save();
            const liqGrad = ctx.createRadialGradient(0, 2, 0, 0, 2, 5);
            liqGrad.addColorStop(0, '#80ff40');
            liqGrad.addColorStop(0.7, '#40a020');
            liqGrad.addColorStop(1, '#206010');
            ctx.fillStyle = liqGrad;
            ctx.shadowColor = '#40e040';
            ctx.shadowBlur = 4;
            ctx.beginPath();
            ctx.arc(0, 0, 5, 0, Math.PI);
            ctx.fill();
            ctx.restore();
            // Bubbles
            ctx.save();
            ctx.fillStyle = '#80ff60';
            for (let i = 0; i < 2 + tier; i++) {
                const bx = Math.sin(t * 3 + i * 2) * 3;
                const by = -1 - Math.abs(Math.sin(t * 4 + i)) * 4;
                ctx.globalAlpha = 0.4 + Math.sin(t * 5 + i) * 0.2;
                ctx.beginPath();
                ctx.arc(bx, by, 1 + Math.sin(t * 3 + i) * 0.5, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();

        } else if (isPlague) {
            // Path A: Plague Doctor — skull with miasma
            // Skull shape
            ctx.save();
            ctx.fillStyle = '#d0d0b0';
            ctx.beginPath();
            ctx.arc(0, -2, 6, 0, Math.PI * 2);
            ctx.fill();
            // Jaw
            ctx.fillStyle = '#b0b090';
            ctx.fillRect(-4, 2, 8, 3);
            // Eye sockets
            ctx.fillStyle = '#40e040';
            ctx.shadowColor = '#40e040';
            ctx.shadowBlur = 4 + Math.sin(t * 3) * 2;
            ctx.beginPath();
            ctx.arc(-2.5, -3, 1.5, 0, Math.PI * 2);
            ctx.arc(2.5, -3, 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            // Miasma cloud
            ctx.save();
            for (let i = 0; i < (tier >= 5 ? 5 : tier >= 4 ? 4 : 3); i++) {
                const angle = (Math.PI * 2 / 5) * i + t * 0.5;
                const cr = 8 + Math.sin(t * 2 + i) * 2;
                const cx = Math.cos(angle) * cr;
                const cy = Math.sin(angle) * cr * 0.5 - 2;
                ctx.fillStyle = colorAlpha('#40e040', 0.08 + Math.sin(t * 3 + i) * 0.03);
                ctx.beginPath();
                ctx.arc(cx, cy, 4 + Math.sin(t * 2 + i * 0.7) * 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
            // T5 particle drip
            if (tier >= 5 && Math.random() < 0.08) {
                GameState.particles.push(new Particle(
                    x + rand(-6, 6), y + rand(-6, 6),
                    { vx: rand(-0.3, 0.3), vy: rand(-0.8, -0.2), life: rand(0.4, 0.7), size: rand(1, 2), color: '#80ff40', glow: true }
                ));
            }

        } else if (isCorrosive) {
            // Path B: Corrosive — acid sprayer
            // Nozzle
            ctx.fillStyle = '#5a6a5a';
            ctx.fillRect(-2, -8, 4, 10);
            // Tank
            ctx.save();
            const tankGrad = ctx.createLinearGradient(-5, 0, 5, 0);
            tankGrad.addColorStop(0, '#4a5a4a');
            tankGrad.addColorStop(0.5, '#5a6a5a');
            tankGrad.addColorStop(1, '#4a5a4a');
            ctx.fillStyle = tankGrad;
            ctx.fillRect(-5, 0, 10, 7);
            ctx.restore();
            // Acid glow inside tank
            ctx.save();
            ctx.fillStyle = colorAlpha('#40ffa0', 0.3 + Math.sin(t * 4) * 0.15);
            ctx.shadowColor = '#40ffa0';
            ctx.shadowBlur = 6;
            ctx.fillRect(-4, 1, 8, 5);
            ctx.restore();
            // Dripping acid from nozzle
            ctx.save();
            for (let i = 0; i < (tier >= 4 ? 3 : 2); i++) {
                const dripY = -8 + ((t * 2 + i * 0.5) % 1) * 5;
                ctx.fillStyle = '#40ffa0';
                ctx.globalAlpha = 1 - ((t * 2 + i * 0.5) % 1);
                ctx.beginPath();
                ctx.arc(rand(-1, 1), dripY, 1, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
            // T4+ acid puddle indicator
            if (tier >= 4) {
                ctx.save();
                ctx.fillStyle = colorAlpha('#40ffa0', 0.1 + Math.sin(t * 3) * 0.05);
                ctx.beginPath();
                ctx.ellipse(0, 6, 7 + tier, 3, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }

        ctx.restore();
    },

    // =========================================================================
    // MORTAR TOWER (Bombardier) — Heavy artillery / Earthquake / Shrapnel
    // =========================================================================
    _drawMortar(ctx, tower, x, y, half, t) {
        const tier = tower.tier;
        const isEarthquake = tower.path === 'A';
        const isShrapnel = tower.path === 'B';

        const baseColor = tier >= 4 ? (isEarthquake ? '#3a3020' : isShrapnel ? '#3a3530' : '#4a3a2a')
            : tier >= 3 ? '#4a3a2a' : '#5a4a3a';
        const accent = tier >= 4 ? (isEarthquake ? '#c09040' : '#a0a0a0') : '#a08060';
        this._drawBase(ctx, x, y, half, tier, baseColor, accent, t);

        ctx.save();
        ctx.translate(x, y);

        if (tier <= 2) {
            // T1-2: Heavy mortar tube on tripod
            // Tripod legs
            ctx.strokeStyle = '#6a6a5a';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, 2); ctx.lineTo(-6, 7);
            ctx.moveTo(0, 2); ctx.lineTo(6, 7);
            ctx.moveTo(0, 2); ctx.lineTo(0, 8);
            ctx.stroke();
            // Mortar tube (angled)
            ctx.save();
            ctx.rotate(-0.4);
            const tubeGrad = ctx.createLinearGradient(-3, 4, -3, -8);
            tubeGrad.addColorStop(0, '#6a5a4a');
            tubeGrad.addColorStop(0.5, '#8a7a6a');
            tubeGrad.addColorStop(1, '#5a4a3a');
            ctx.fillStyle = tubeGrad;
            ctx.fillRect(-3, -8, 6, 12);
            // Muzzle ring
            ctx.fillStyle = '#8a8a7a';
            ctx.fillRect(-4, -9, 8, 2);
            ctx.restore();

        } else if (isEarthquake) {
            // Path A: Earthquake — massive cannon with seismic glow
            const scale = tier === 5 ? 1.3 : tier === 4 ? 1.15 : 1;
            ctx.save();
            ctx.scale(scale, scale);
            // Heavy barrel
            ctx.save();
            ctx.rotate(-0.35);
            const barrelGrad = ctx.createLinearGradient(-4, 4, -4, -10);
            barrelGrad.addColorStop(0, '#5a4a30');
            barrelGrad.addColorStop(0.5, '#7a6a50');
            barrelGrad.addColorStop(1, '#4a3a20');
            ctx.fillStyle = barrelGrad;
            ctx.fillRect(-4, -10, 8, 14);
            ctx.fillStyle = '#8a7a60';
            ctx.fillRect(-5, -11, 10, 2);
            ctx.restore();
            // Seismic glow at base
            ctx.save();
            ctx.fillStyle = colorAlpha('#c09040', 0.15 + Math.sin(t * 3) * 0.08);
            ctx.shadowColor = '#c09040';
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.ellipse(0, 5, 8, 3, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            ctx.restore();
            // T5 seismic rings
            if (tier >= 5) {
                ctx.save();
                const quakePulse = (t % 3) / 3;
                ctx.strokeStyle = colorAlpha('#c09040', (1 - quakePulse) * 0.2);
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, 0, 10 + quakePulse * 30, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }

        } else if (isShrapnel) {
            // Path B: Shrapnel — multi-barrel launcher
            const barrels = tier === 5 ? 4 : tier === 4 ? 3 : 2;
            // Mount
            ctx.fillStyle = '#5a5a5a';
            ctx.fillRect(-3, 0, 6, 6);
            // Multiple barrels
            ctx.save();
            for (let i = 0; i < barrels; i++) {
                const angle = -0.6 + (1.2 / (barrels - 1)) * i;
                ctx.save();
                ctx.rotate(angle);
                ctx.fillStyle = '#7a7a7a';
                ctx.fillRect(-2, -10, 4, 10);
                ctx.fillStyle = '#8a8a8a';
                ctx.fillRect(-2.5, -11, 5, 2);
                ctx.restore();
            }
            ctx.restore();
            // Shell indicators
            if (tier >= 4) {
                ctx.save();
                ctx.fillStyle = '#a0a0a0';
                for (let i = 0; i < tier - 2; i++) {
                    ctx.beginPath();
                    ctx.arc(-6 + i * 4, 4, 1.5, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }
        }

        ctx.restore();
    },

    // =========================================================================
    // NECRO TOWER (Reaper) — Dark spire / Soul Harvester / Wither
    // =========================================================================
    _drawNecro(ctx, tower, x, y, half, t) {
        const tier = tower.tier;
        const isSoulHarvester = tower.path === 'A';
        const isWither = tower.path === 'B';

        const baseColor = tier >= 4 ? (isSoulHarvester ? '#2a1a3a' : isWither ? '#1a2a2a' : '#2a1a2a')
            : tier >= 3 ? '#2a1a2a' : '#3a2a3a';
        const accent = tier >= 4 ? (isSoulHarvester ? '#c040ff' : '#40ffc0') : '#a040ff';
        this._drawBase(ctx, x, y, half, tier, baseColor, accent, t);

        ctx.save();
        ctx.translate(x, y);

        // Soul count indicator (small orbs around tower)
        const souls = tower.souls || 0;
        const maxSouls = (tower.special && tower.special.maxSouls) || 10;
        if (souls > 0) {
            ctx.save();
            const soulCount = Math.min(Math.floor(souls / (maxSouls / 6)), 6);
            for (let i = 0; i < soulCount; i++) {
                const sa = (Math.PI * 2 / 6) * i + t * 1.5;
                const sr = half + 3;
                ctx.fillStyle = colorAlpha('#c080ff', 0.3 + Math.sin(t * 4 + i) * 0.15);
                ctx.beginPath();
                ctx.arc(Math.cos(sa) * sr, Math.sin(sa) * sr, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        if (tier <= 2) {
            // T1-2: Dark spire/obelisk
            ctx.save();
            const spireGrad = ctx.createLinearGradient(0, 8, 0, -10);
            spireGrad.addColorStop(0, '#3a2a3a');
            spireGrad.addColorStop(0.5, '#4a3a4a');
            spireGrad.addColorStop(1, '#2a1a2a');
            ctx.fillStyle = spireGrad;
            ctx.beginPath();
            ctx.moveTo(-4, 7);
            ctx.lineTo(-2, -8);
            ctx.lineTo(0, -10);
            ctx.lineTo(2, -8);
            ctx.lineTo(4, 7);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
            // Eye
            ctx.save();
            ctx.fillStyle = '#a040ff';
            ctx.shadowColor = '#a040ff';
            ctx.shadowBlur = 4 + Math.sin(t * 3) * 2;
            ctx.beginPath();
            ctx.arc(0, -3, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

        } else if (isSoulHarvester) {
            // Path A: Soul Harvester — tall spire with soul orbs
            const spireH = tier === 5 ? 14 : tier === 4 ? 12 : 10;
            ctx.save();
            const grad = ctx.createLinearGradient(0, 7, 0, -spireH);
            grad.addColorStop(0, '#2a1a3a');
            grad.addColorStop(0.5, '#3a2a4a');
            grad.addColorStop(1, '#1a0a2a');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(-4, 7);
            ctx.lineTo(-2, -spireH + 2);
            ctx.lineTo(0, -spireH);
            ctx.lineTo(2, -spireH + 2);
            ctx.lineTo(4, 7);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
            // Glowing skull eye
            ctx.save();
            ctx.fillStyle = '#c040ff';
            ctx.shadowColor = '#c040ff';
            ctx.shadowBlur = 6 + Math.sin(t * 4) * 3;
            ctx.beginPath();
            ctx.arc(0, -4, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            // Flying soul orbs
            if (tier >= 4) {
                ctx.save();
                for (let i = 0; i < tier - 2; i++) {
                    const orbA = t * 2 + (Math.PI * 2 / (tier - 2)) * i;
                    const orbR = 6 + tier;
                    ctx.fillStyle = colorAlpha('#d080ff', 0.4 + Math.sin(t * 3 + i) * 0.2);
                    ctx.shadowColor = '#d080ff';
                    ctx.shadowBlur = 4;
                    ctx.beginPath();
                    ctx.arc(Math.cos(orbA) * orbR, Math.sin(orbA) * orbR * 0.5 - 2, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }
            // T5 reaper particles
            if (tier >= 5 && Math.random() < 0.08) {
                const pa = Math.random() * Math.PI * 2;
                GameState.particles.push(new Particle(
                    x + Math.cos(pa) * rand(4, 10), y + Math.sin(pa) * rand(4, 10),
                    { vx: Math.cos(pa) * 0.3, vy: -0.8 + Math.sin(pa) * 0.3,
                      life: rand(0.3, 0.6), size: rand(1, 2.5), color: '#c040ff', glow: true }
                ));
            }

        } else if (isWither) {
            // Path B: Wither — dark aura fountain, life drain
            // Dark pillar
            ctx.save();
            const pillarGrad = ctx.createLinearGradient(0, 7, 0, -8);
            pillarGrad.addColorStop(0, '#1a2a2a');
            pillarGrad.addColorStop(0.5, '#2a3a3a');
            pillarGrad.addColorStop(1, '#0a1a1a');
            ctx.fillStyle = pillarGrad;
            ctx.fillRect(-3, -8, 6, 15);
            ctx.restore();
            // Aura crystal
            ctx.save();
            ctx.fillStyle = '#40ffc0';
            ctx.shadowColor = '#40ffc0';
            ctx.shadowBlur = 6 + Math.sin(t * 3) * 3;
            ctx.beginPath();
            ctx.moveTo(0, -10);
            ctx.lineTo(3, -6);
            ctx.lineTo(0, -2);
            ctx.lineTo(-3, -6);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
            // Wither aura rings
            if (tier >= 3) {
                ctx.save();
                const ringCount = tier >= 5 ? 3 : tier >= 4 ? 2 : 1;
                for (let i = 0; i < ringCount; i++) {
                    const pulse = ((t + i * 0.5) % 2) / 2;
                    ctx.strokeStyle = colorAlpha('#40ffc0', (1 - pulse) * 0.15);
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.arc(0, 0, 8 + pulse * 20, 0, Math.PI * 2);
                    ctx.stroke();
                }
                ctx.restore();
            }
            // T5 life drain particles
            if (tier >= 5 && Math.random() < 0.06) {
                const pa = Math.random() * Math.PI * 2;
                const pr = rand(15, 25);
                GameState.particles.push(new Particle(
                    x + Math.cos(pa) * pr, y + Math.sin(pa) * pr,
                    { vx: -Math.cos(pa) * 1.5, vy: -Math.sin(pa) * 1.5,
                      life: rand(0.3, 0.5), size: rand(1, 2), color: '#40ffc0', glow: true }
                ));
            }
        }

        ctx.restore();
    },

    _drawBoostLines(ctx, tower) {
        const range = tower.getEffectiveRange();
        for (const t of GameState.towers) {
            if (t !== tower && t.type !== 'boost' && dist(tower, t) <= range) {
                ctx.save();
                ctx.strokeStyle = colorAlpha('#ffd700', 0.2);
                ctx.lineWidth = 1;
                ctx.setLineDash([3, 3]);
                ctx.beginPath();
                ctx.moveTo(tower.x, tower.y);
                ctx.lineTo(t.x, t.y);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.restore();
            }
        }
    },

    _drawMasteryGlow(ctx, tower, x, y, ts, t) {
        const mastery = tower.getMasteryData();
        if (!mastery) return;

        const half = ts / 2;
        const title = mastery.title;
        const color = mastery.color;

        ctx.save();

        if (title === 'Veteran') {
            const shimmer = 0.3 + Math.sin(t * 2) * 0.15;
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.globalAlpha = shimmer;
            ctx.shadowColor = color;
            ctx.shadowBlur = 6;
            this._roundRect(ctx, x - half + 1, y - half + 1, (half - 1) * 2, (half - 1) * 2, 5);
            ctx.stroke();

        } else if (title === 'Elite') {
            const pulse = 0.4 + Math.sin(t * 3) * 0.2;
            const ringRadius = half + 4 + Math.sin(t * 3) * 2;
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            ctx.globalAlpha = pulse;
            ctx.shadowColor = color;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(x, y, ringRadius, 0, Math.PI * 2);
            ctx.stroke();

        } else if (title === 'Master') {
            const glowPulse = 0.35 + Math.sin(t * 4) * 0.15;
            const glowSize = 12 + Math.sin(t * 3) * 4;
            ctx.globalAlpha = glowPulse;
            ctx.shadowColor = color;
            ctx.shadowBlur = glowSize;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, half + 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = glowPulse * 0.6;
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(x, y, half + 6 + Math.sin(t * 2) * 2, t * 0.5, t * 0.5 + Math.PI * 1.5);
            ctx.stroke();

        } else if (title === 'Legend') {
            const glowPulse = 0.3 + Math.sin(t * 5) * 0.15;
            const glowSize = 16 + Math.sin(t * 3.5) * 5;
            ctx.globalAlpha = glowPulse;
            ctx.shadowColor = color;
            ctx.shadowBlur = glowSize;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, half + 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = glowPulse * 0.5;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(x, y, half + 8 + Math.sin(t * 4) * 3, 0, Math.PI * 2);
            ctx.stroke();
            if (Math.random() < 0.15) {
                const angle = Math.random() * Math.PI * 2;
                const r = half + 4 + Math.random() * 6;
                GameState.particles.push(new Particle(
                    x + Math.cos(angle) * r,
                    y + Math.sin(angle) * r,
                    { vx: Math.cos(angle) * 0.5, vy: Math.sin(angle) * 0.5 - 0.5,
                      life: 0.4 + Math.random() * 0.3, size: 1 + Math.random() * 1.5,
                      color: color, glow: true }
                ));
            }

        } else if (title === 'Mythic') {
            const glowPulse = 0.35 + Math.sin(t * 6) * 0.15;
            const glowSize = 20 + Math.sin(t * 4) * 6;
            ctx.globalAlpha = glowPulse;
            ctx.shadowColor = color;
            ctx.shadowBlur = glowSize;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, half + 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = glowPulse * 0.6;
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(x, y, half + 8 + Math.sin(t * 3) * 2, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = glowPulse * 0.3;
            ctx.beginPath();
            ctx.arc(x, y, half + 12 + Math.cos(t * 2.5) * 3, 0, Math.PI * 2);
            ctx.stroke();
            for (let i = 0; i < 3; i++) {
                const orbitAngle = t * 2.5 + (i / 3) * Math.PI * 2;
                const orbitR = half + 9;
                const ox = x + Math.cos(orbitAngle) * orbitR;
                const oy = y + Math.sin(orbitAngle) * orbitR;
                ctx.globalAlpha = 0.7;
                ctx.fillStyle = '#d080ff';
                ctx.shadowColor = '#d080ff';
                ctx.shadowBlur = 6;
                ctx.beginPath();
                ctx.arc(ox, oy, 2, 0, Math.PI * 2);
                ctx.fill();
            }
            if (Math.random() < 0.2) {
                const angle = Math.random() * Math.PI * 2;
                const r = half + 6 + Math.random() * 8;
                GameState.particles.push(new Particle(
                    x + Math.cos(angle) * r,
                    y + Math.sin(angle) * r,
                    { vx: (Math.random() - 0.5) * 0.8, vy: -0.8 - Math.random() * 0.5,
                      life: 0.3 + Math.random() * 0.4, size: 1 + Math.random() * 2,
                      color: '#d080ff', glow: true }
                ));
            }
        }

        ctx.restore();
    },

    _drawMasteryStar(ctx, tower, x, y) {
        const mastery = tower.getMasteryData();
        if (!mastery) return;

        ctx.save();
        ctx.fillStyle = mastery.color;
        ctx.shadowColor = mastery.color;
        ctx.shadowBlur = 4;
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('\u2605', x, y - CONFIG.TILE_SIZE / 2 - 2);
        ctx.restore();
    },

    _roundRect(ctx, x, y, w, h, r) {
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
    },

    _roundRectPath(ctx, x, y, w, h, r) {
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
    },
};
