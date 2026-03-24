// ===== SYNERGY & ENVIRONMENTAL ZONE SYSTEM =====
const SynergySystem = {
    zones: [],
    updateTimer: 0,

    update(dt) {
        this.updateTimer -= dt;
        if (this.updateTimer <= 0) {
            this.updateTimer = 1.0; // Check every second
            this.detectZones();
        }

        // Apply zone effects
        for (const zone of this.zones) {
            this._applyZoneEffect(zone, dt);
        }
    },

    detectZones() {
        this.zones = [];

        // Group towers by type
        const byType = {};
        for (const t of GameState.towers) {
            if (!byType[t.type]) byType[t.type] = [];
            byType[t.type].push(t);
        }

        // Ice triangle: 3+ ice towers forming a triangle
        if (byType.ice && byType.ice.length >= 3) {
            this._findTriangles(byType.ice, 'frozen_zone');
        }

        // Lightning triangle
        if (byType.lightning && byType.lightning.length >= 3) {
            this._findTriangles(byType.lightning, 'static_field');
        }

        // Cannon + Boost combo
        if (byType.cannon && byType.cannon.length >= 2 && byType.boost) {
            for (const b of byType.boost) {
                const nearbyCannons = byType.cannon.filter(c => dist(b, c) <= 160);
                if (nearbyCannons.length >= 2) {
                    const cx = (nearbyCannons[0].x + nearbyCannons[1].x + b.x) / 3;
                    const cy = (nearbyCannons[0].y + nearbyCannons[1].y + b.y) / 3;
                    this.zones.push({
                        type: 'blast_zone',
                        x: cx, y: cy, radius: 100,
                        towers: [nearbyCannons[0], nearbyCannons[1], b],
                    });
                }
            }
        }
    },

    _findTriangles(towers, zoneType) {
        // Find groups of 3 that are within range
        for (let i = 0; i < towers.length - 2; i++) {
            for (let j = i + 1; j < towers.length - 1; j++) {
                for (let k = j + 1; k < towers.length; k++) {
                    const a = towers[i], b = towers[j], c = towers[k];
                    const maxDist = 200;
                    if (dist(a, b) <= maxDist && dist(b, c) <= maxDist && dist(a, c) <= maxDist) {
                        const cx = (a.x + b.x + c.x) / 3;
                        const cy = (a.y + b.y + c.y) / 3;
                        this.zones.push({
                            type: zoneType,
                            x: cx, y: cy,
                            radius: 80,
                            towers: [a, b, c],
                        });
                    }
                }
            }
        }
    },

    _applyZoneEffect(zone, dt) {
        for (const e of GameState.enemies) {
            if (!e.alive || dist(zone, e) > zone.radius) continue;

            switch (zone.type) {
                case 'frozen_zone':
                    e.applySlow(0.3, 0.5);
                    break;
                case 'static_field':
                    if (Math.random() < 0.02) { // Random strike
                        e.takeDamage(15);
                        Effects.spawnLightningArc(zone.x, zone.y, e.x, e.y);
                    }
                    break;
                case 'blast_zone':
                    // Handled by cannon splash bonus
                    break;
            }
        }
    },

    drawZones(ctx) {
        this.draw(ctx);
    },

    draw(ctx) {
        for (const zone of this.zones) {
            ctx.save();
            ctx.globalAlpha = 0.1 + Math.sin(GameState.time * 2) * 0.05;

            switch (zone.type) {
                case 'frozen_zone':
                    ctx.fillStyle = '#40c0ff';
                    break;
                case 'static_field':
                    ctx.fillStyle = '#ffe040';
                    break;
                case 'blast_zone':
                    ctx.fillStyle = '#ff6020';
                    break;
            }

            ctx.beginPath();
            ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
            ctx.fill();

            // Zone border
            ctx.globalAlpha = 0.3;
            ctx.strokeStyle = ctx.fillStyle;
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.restore();
        }
    },
};
