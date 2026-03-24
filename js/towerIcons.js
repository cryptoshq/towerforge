// ===== TOWER ICON SYSTEM — HIGH-QUALITY CANVAS-DRAWN VECTOR ICONS =====
// Each icon is rendered to an offscreen canvas at init and cached.
// All icons target the same quality level as the laser icon:
// multi-layer construction with gradients, glows, shadows, and fine details.

const TowerIcons = {
    _cache: {},
    _size: 36,

    init() {
        for (const [type, def] of Object.entries(TOWERS)) {
            this._cache[type] = this._renderIcon(type, def, this._size);
            this._cache[type + '_large'] = this._renderIcon(type, def, 64);
        }
    },

    getIcon(type, large = false) {
        const key = large ? type + '_large' : type;
        const src = this._cache[key];
        if (!src) return null;
        // Clone by drawing cached canvas onto a fresh one
        // (canvas.cloneNode does NOT copy drawn pixel data)
        const copy = document.createElement('canvas');
        copy.width = src.width;
        copy.height = src.height;
        copy.getContext('2d').drawImage(src, 0, 0);
        return copy;
    },

    _renderIcon(type, def, size) {
        const c = document.createElement('canvas');
        c.width = size;
        c.height = size;
        const ctx = c.getContext('2d');
        const half = size / 2;

        // Background glow disc
        const bgGrad = ctx.createRadialGradient(half, half, 0, half, half, half);
        bgGrad.addColorStop(0, colorAlpha(def.iconColor, 0.35));
        bgGrad.addColorStop(0.6, colorAlpha(def.iconColor, 0.12));
        bgGrad.addColorStop(1, colorAlpha(def.iconColor, 0.02));
        ctx.fillStyle = bgGrad;
        ctx.beginPath();
        ctx.arc(half, half, half - 1, 0, Math.PI * 2);
        ctx.fill();

        // Border ring with subtle gradient
        const borderGrad = ctx.createLinearGradient(0, 0, size, size);
        borderGrad.addColorStop(0, colorAlpha(def.iconColor, 0.9));
        borderGrad.addColorStop(1, colorAlpha(def.iconColor, 0.5));
        ctx.strokeStyle = borderGrad;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(half, half, half - 2, 0, Math.PI * 2);
        ctx.stroke();

        // Inner highlight arc (top-left)
        ctx.strokeStyle = colorAlpha('#ffffff', 0.08);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(half, half, half - 3, -Math.PI * 0.8, -Math.PI * 0.2);
        ctx.stroke();

        ctx.save();
        ctx.translate(half, half);

        switch (type) {
            case 'arrow': this._drawArrowIcon(ctx, size); break;
            case 'cannon': this._drawCannonIcon(ctx, size); break;
            case 'ice': this._drawIceIcon(ctx, size); break;
            case 'lightning': this._drawLightningIcon(ctx, size); break;
            case 'sniper': this._drawSniperIcon(ctx, size); break;
            case 'laser': this._drawLaserIcon(ctx, size); break;
            case 'missile': this._drawMissileIcon(ctx, size); break;
            case 'boost': this._drawBoostIcon(ctx, size); break;
        }

        ctx.restore();
        return c;
    },

    // ──── ARROW TOWER ────
    // Elegant recurve bow with glowing nocked arrow
    _drawArrowIcon(ctx, s) {
        const u = s / 36;

        // Bow limb glow (soft green aura behind the bow)
        ctx.save();
        ctx.shadowColor = '#3ab06a';
        ctx.shadowBlur = 6 * u;
        ctx.strokeStyle = '#3ab06a';
        ctx.lineWidth = 0.5 * u;
        ctx.beginPath();
        ctx.arc(3 * u, 0, 10 * u, -1.2, 1.2);
        ctx.stroke();
        ctx.restore();

        // Bow limb — wood grain gradient
        const bowGrad = ctx.createLinearGradient(3 * u, -10 * u, 3 * u, 10 * u);
        bowGrad.addColorStop(0, '#a07818');
        bowGrad.addColorStop(0.3, '#c09020');
        bowGrad.addColorStop(0.5, '#d0a030');
        bowGrad.addColorStop(0.7, '#c09020');
        bowGrad.addColorStop(1, '#907010');
        ctx.strokeStyle = bowGrad;
        ctx.lineWidth = 3 * u;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(3 * u, 0, 10 * u, -1.2, 1.2);
        ctx.stroke();

        // Bow limb edge highlight
        ctx.strokeStyle = colorAlpha('#ffe090', 0.4);
        ctx.lineWidth = 1 * u;
        ctx.beginPath();
        ctx.arc(3 * u, 0, 9 * u, -1.0, 1.0);
        ctx.stroke();

        // Bowstring
        const topX = 3 * u + Math.cos(-1.2) * 10 * u;
        const topY = Math.sin(-1.2) * 10 * u;
        const botX = 3 * u + Math.cos(1.2) * 10 * u;
        const botY = Math.sin(1.2) * 10 * u;
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 0.8 * u;
        ctx.beginPath();
        ctx.moveTo(topX, topY);
        ctx.lineTo(-2 * u, 0);
        ctx.lineTo(botX, botY);
        ctx.stroke();

        // Arrow shaft with gradient
        const shaftGrad = ctx.createLinearGradient(-10 * u, 0, 10 * u, 0);
        shaftGrad.addColorStop(0, '#aaa');
        shaftGrad.addColorStop(0.5, '#e0e0e0');
        shaftGrad.addColorStop(1, '#fff');
        ctx.strokeStyle = shaftGrad;
        ctx.lineWidth = 1.5 * u;
        ctx.beginPath();
        ctx.moveTo(-10 * u, 0);
        ctx.lineTo(9 * u, 0);
        ctx.stroke();

        // Arrowhead — metallic with glow
        ctx.save();
        ctx.shadowColor = '#80ffa0';
        ctx.shadowBlur = 4 * u;
        ctx.fillStyle = '#e0ffe0';
        ctx.beginPath();
        ctx.moveTo(13 * u, 0);
        ctx.lineTo(7 * u, -3.5 * u);
        ctx.lineTo(8 * u, 0);
        ctx.lineTo(7 * u, 3.5 * u);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Fletching (red feathers with detail)
        ctx.fillStyle = '#e04040';
        ctx.beginPath();
        ctx.moveTo(-10 * u, 0);
        ctx.lineTo(-7 * u, -3.5 * u);
        ctx.lineTo(-5.5 * u, 0);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-10 * u, 0);
        ctx.lineTo(-7 * u, 3.5 * u);
        ctx.lineTo(-5.5 * u, 0);
        ctx.closePath();
        ctx.fill();

        // Fletching highlight
        ctx.fillStyle = colorAlpha('#ff8080', 0.5);
        ctx.beginPath();
        ctx.moveTo(-9.5 * u, 0);
        ctx.lineTo(-7.5 * u, -2 * u);
        ctx.lineTo(-6.5 * u, 0);
        ctx.closePath();
        ctx.fill();

        // Nock glow (where arrow meets string)
        ctx.fillStyle = '#3ab06a';
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(-2 * u, 0, 2 * u, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    },

    // ──── CANNON TOWER ────
    // Heavy artillery cannon with muzzle glow and smoke wisps
    _drawCannonIcon(ctx, s) {
        const u = s / 36;

        // Base platform — metal disc
        const baseGrad = ctx.createRadialGradient(0, 4 * u, 0, 0, 4 * u, 8 * u);
        baseGrad.addColorStop(0, '#6a5a4a');
        baseGrad.addColorStop(1, '#3a3028');
        ctx.fillStyle = baseGrad;
        ctx.beginPath();
        ctx.ellipse(0, 4 * u, 8 * u, 5 * u, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#7a6a5a';
        ctx.lineWidth = 1 * u;
        ctx.stroke();

        // Rivets on base
        ctx.fillStyle = '#8a7a6a';
        for (let i = 0; i < 6; i++) {
            const a = (Math.PI * 2 / 6) * i;
            ctx.beginPath();
            ctx.arc(Math.cos(a) * 6 * u, 4 * u + Math.sin(a) * 3.5 * u, 0.8 * u, 0, Math.PI * 2);
            ctx.fill();
        }

        // Barrel — rotated with metallic gradient
        ctx.save();
        ctx.rotate(-0.4);
        const barrelGrad = ctx.createLinearGradient(0, -5 * u, 0, 5 * u);
        barrelGrad.addColorStop(0, '#888');
        barrelGrad.addColorStop(0.3, '#666');
        barrelGrad.addColorStop(0.5, '#777');
        barrelGrad.addColorStop(0.7, '#555');
        barrelGrad.addColorStop(1, '#444');
        ctx.fillStyle = barrelGrad;
        this._roundRectPath(ctx, -5 * u, -4.5 * u, 17 * u, 9 * u, 2 * u);
        ctx.fill();

        // Barrel rings (reinforcement bands)
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 1.2 * u;
        for (const rx of [0, 6 * u, 10 * u]) {
            ctx.beginPath();
            ctx.moveTo(rx, -4.5 * u);
            ctx.lineTo(rx, 4.5 * u);
            ctx.stroke();
        }

        // Bore opening
        const boreGrad = ctx.createRadialGradient(12 * u, 0, 0, 12 * u, 0, 4 * u);
        boreGrad.addColorStop(0, '#1a1a1a');
        boreGrad.addColorStop(1, '#333');
        ctx.fillStyle = boreGrad;
        ctx.beginPath();
        ctx.arc(12 * u, 0, 3.8 * u, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Muzzle flash — multi-layer glow
        ctx.save();
        ctx.shadowColor = '#ff8040';
        ctx.shadowBlur = 8 * u;
        const flashGrad = ctx.createRadialGradient(10 * u, -5 * u, 0, 10 * u, -5 * u, 5 * u);
        flashGrad.addColorStop(0, 'rgba(255,200,100,0.8)');
        flashGrad.addColorStop(0.4, 'rgba(255,128,64,0.4)');
        flashGrad.addColorStop(1, 'rgba(255,64,0,0)');
        ctx.fillStyle = flashGrad;
        ctx.beginPath();
        ctx.arc(10 * u, -5 * u, 5 * u, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Smoke wisps
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = '#aaa';
        ctx.beginPath();
        ctx.arc(12 * u, -8 * u, 2.5 * u, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(8 * u, -10 * u, 1.8 * u, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    },

    // ──── ICE TOWER ────
    // Crystalline snowflake with frosted aura and ice shards
    _drawIceIcon(ctx, s) {
        const u = s / 36;

        // Frost aura (soft glow behind everything)
        ctx.save();
        const auraGrad = ctx.createRadialGradient(0, 0, 2 * u, 0, 0, 14 * u);
        auraGrad.addColorStop(0, 'rgba(128,210,255,0.25)');
        auraGrad.addColorStop(1, 'rgba(128,210,255,0)');
        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 14 * u, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Snowflake arms with crystal detail
        ctx.lineCap = 'round';
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            ctx.save();
            ctx.rotate(angle);

            // Main arm glow
            ctx.shadowColor = '#80d0ff';
            ctx.shadowBlur = 3 * u;

            // Main arm — gradient stroke
            const armGrad = ctx.createLinearGradient(0, 0, 0, -12 * u);
            armGrad.addColorStop(0, '#c0f0ff');
            armGrad.addColorStop(1, '#60c0e0');
            ctx.strokeStyle = armGrad;
            ctx.lineWidth = 2.2 * u;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, -12 * u);
            ctx.stroke();

            // Branch — left
            ctx.strokeStyle = '#90d8ff';
            ctx.lineWidth = 1.4 * u;
            ctx.beginPath();
            ctx.moveTo(0, -7 * u);
            ctx.lineTo(-4 * u, -10 * u);
            ctx.stroke();

            // Branch — right
            ctx.beginPath();
            ctx.moveTo(0, -7 * u);
            ctx.lineTo(4 * u, -10 * u);
            ctx.stroke();

            // Small inner branch
            ctx.strokeStyle = '#a0e0ff';
            ctx.lineWidth = 0.8 * u;
            ctx.beginPath();
            ctx.moveTo(0, -4 * u);
            ctx.lineTo(-2.5 * u, -6 * u);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, -4 * u);
            ctx.lineTo(2.5 * u, -6 * u);
            ctx.stroke();

            // Tip crystal dot
            ctx.fillStyle = '#e0f8ff';
            ctx.beginPath();
            ctx.arc(0, -12 * u, 1.2 * u, 0, Math.PI * 2);
            ctx.fill();

            ctx.shadowBlur = 0;
            ctx.restore();
        }

        // Central crystal — faceted diamond
        ctx.save();
        ctx.shadowColor = '#80e0ff';
        ctx.shadowBlur = 8 * u;
        const cGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 4 * u);
        cGrad.addColorStop(0, '#ffffff');
        cGrad.addColorStop(0.5, '#c0f0ff');
        cGrad.addColorStop(1, '#80d0ff');
        ctx.fillStyle = cGrad;
        // Diamond shape
        ctx.beginPath();
        ctx.moveTo(0, -3.5 * u);
        ctx.lineTo(3.5 * u, 0);
        ctx.lineTo(0, 3.5 * u);
        ctx.lineTo(-3.5 * u, 0);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#e0f8ff';
        ctx.lineWidth = 0.6 * u;
        ctx.stroke();
        ctx.restore();

        // Ice sparkle dots
        ctx.fillStyle = '#fff';
        ctx.globalAlpha = 0.6;
        const sparkles = [[-5, -8], [7, -4], [-3, 9], [8, 6]];
        for (const [sx, sy] of sparkles) {
            ctx.beginPath();
            ctx.arc(sx * u, sy * u, 0.7 * u, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    },

    // ──── LIGHTNING TOWER ────
    // Electric bolt with plasma orb and crackling arcs
    _drawLightningIcon(ctx, s) {
        const u = s / 36;

        // Plasma field background
        const plasmaGrad = ctx.createRadialGradient(0, 0, 2 * u, 0, 0, 13 * u);
        plasmaGrad.addColorStop(0, 'rgba(255,224,64,0.15)');
        plasmaGrad.addColorStop(1, 'rgba(255,224,64,0)');
        ctx.fillStyle = plasmaGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 13 * u, 0, Math.PI * 2);
        ctx.fill();

        // Lightning bolt — multi-layer with core + outer glow
        ctx.save();
        // Outer glow bolt
        ctx.shadowColor = '#ffe040';
        ctx.shadowBlur = 10 * u;
        ctx.fillStyle = '#ffe040';
        ctx.beginPath();
        ctx.moveTo(2 * u, -13 * u);
        ctx.lineTo(-4 * u, -2 * u);
        ctx.lineTo(1 * u, -2 * u);
        ctx.lineTo(-3 * u, 13 * u);
        ctx.lineTo(7 * u, 1 * u);
        ctx.lineTo(2 * u, 1 * u);
        ctx.lineTo(8 * u, -13 * u);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;

        // Bright inner core
        ctx.fillStyle = '#fff8d0';
        ctx.beginPath();
        ctx.moveTo(3 * u, -11 * u);
        ctx.lineTo(-2 * u, -2 * u);
        ctx.lineTo(1.5 * u, -2 * u);
        ctx.lineTo(-1 * u, 10 * u);
        ctx.lineTo(5 * u, 1 * u);
        ctx.lineTo(2.5 * u, 1 * u);
        ctx.lineTo(6 * u, -11 * u);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Electric arcs (multiple crackling tendrils)
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 0.6 * u;
        ctx.globalAlpha = 0.5;
        // Arc 1 — upper left
        ctx.beginPath();
        ctx.moveTo(-7 * u, -6 * u);
        ctx.quadraticCurveTo(-4 * u, -9 * u, -1 * u, -6 * u);
        ctx.stroke();
        // Arc 2 — lower right
        ctx.beginPath();
        ctx.moveTo(4 * u, 5 * u);
        ctx.quadraticCurveTo(8 * u, 2 * u, 10 * u, 6 * u);
        ctx.stroke();
        // Arc 3 — mid left
        ctx.beginPath();
        ctx.moveTo(-9 * u, 1 * u);
        ctx.quadraticCurveTo(-6 * u, -2 * u, -4 * u, 2 * u);
        ctx.stroke();
        // Arc 4 — upper right
        ctx.beginPath();
        ctx.moveTo(6 * u, -8 * u);
        ctx.quadraticCurveTo(9 * u, -10 * u, 11 * u, -7 * u);
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Plasma orb at center of bolt
        ctx.save();
        ctx.shadowColor = '#ffe080';
        ctx.shadowBlur = 5 * u;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(1 * u, -0.5 * u, 2 * u, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    },

    // ──── SNIPER TOWER ────
    // Precision scope with tactical HUD elements and laser dot
    _drawSniperIcon(ctx, s) {
        const u = s / 36;

        // Scope housing glow
        ctx.save();
        ctx.shadowColor = '#50b050';
        ctx.shadowBlur = 4 * u;

        // Outer scope ring
        ctx.strokeStyle = '#3a8a3a';
        ctx.lineWidth = 1.8 * u;
        ctx.beginPath();
        ctx.arc(0, 0, 11 * u, 0, Math.PI * 2);
        ctx.stroke();

        // Inner scope ring
        ctx.strokeStyle = '#50b050';
        ctx.lineWidth = 1 * u;
        ctx.beginPath();
        ctx.arc(0, 0, 6 * u, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Crosshair lines — with gaps at center and ends
        ctx.strokeStyle = '#60c060';
        ctx.lineWidth = 1 * u;
        ctx.lineCap = 'round';
        // Horizontal
        ctx.beginPath(); ctx.moveTo(-14 * u, 0); ctx.lineTo(-7 * u, 0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-5 * u, 0); ctx.lineTo(-2.5 * u, 0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(2.5 * u, 0); ctx.lineTo(5 * u, 0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(7 * u, 0); ctx.lineTo(14 * u, 0); ctx.stroke();
        // Vertical
        ctx.beginPath(); ctx.moveTo(0, -14 * u); ctx.lineTo(0, -7 * u); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, -5 * u); ctx.lineTo(0, -2.5 * u); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, 2.5 * u); ctx.lineTo(0, 5 * u); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, 7 * u); ctx.lineTo(0, 14 * u); ctx.stroke();

        // Tactical tick marks on outer ring
        ctx.strokeStyle = '#408040';
        ctx.lineWidth = 0.7 * u;
        for (let i = 0; i < 12; i++) {
            if (i % 3 === 0) continue; // skip cardinal directions
            const a = (Math.PI * 2 / 12) * i;
            ctx.beginPath();
            ctx.moveTo(Math.cos(a) * 10 * u, Math.sin(a) * 10 * u);
            ctx.lineTo(Math.cos(a) * 12 * u, Math.sin(a) * 12 * u);
            ctx.stroke();
        }

        // Distance markers at diagonals
        ctx.fillStyle = '#50b050';
        for (let i = 0; i < 4; i++) {
            const a = (Math.PI / 2) * i + Math.PI / 4;
            ctx.beginPath();
            ctx.arc(Math.cos(a) * 11 * u, Math.sin(a) * 11 * u, 1.2 * u, 0, Math.PI * 2);
            ctx.fill();
        }

        // Center dot — pulsing red laser
        ctx.save();
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 6 * u;
        ctx.fillStyle = '#ff3030';
        ctx.beginPath();
        ctx.arc(0, 0, 2.2 * u, 0, Math.PI * 2);
        ctx.fill();
        // Bright core
        ctx.fillStyle = '#ff8080';
        ctx.beginPath();
        ctx.arc(0, 0, 1 * u, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // HUD readout text (tiny range indicator)
        ctx.fillStyle = colorAlpha('#50b050', 0.4);
        ctx.font = `${2.5 * u}px monospace`;
        ctx.textAlign = 'right';
        ctx.fillText('220m', 13 * u, -11 * u);
    },

    // ──── LASER TOWER ────
    // Emitter housing with beam, core glow, focusing rings, lens flare
    _drawLaserIcon(ctx, s) {
        const u = s / 36;

        // Emitter housing — dark with ring detail
        const housingGrad = ctx.createRadialGradient(0, 0, 2 * u, 0, 0, 7 * u);
        housingGrad.addColorStop(0, '#5a2030');
        housingGrad.addColorStop(1, '#3a1020');
        ctx.fillStyle = housingGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 6 * u, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#8a3040';
        ctx.lineWidth = 1.5 * u;
        ctx.stroke();

        // Housing detail ring
        ctx.strokeStyle = '#6a2535';
        ctx.lineWidth = 0.6 * u;
        ctx.beginPath();
        ctx.arc(0, 0, 4.5 * u, 0, Math.PI * 2);
        ctx.stroke();

        // Beam — multi-layer gradient
        const beamGrad = ctx.createLinearGradient(-2 * u, 0, 15 * u, 0);
        beamGrad.addColorStop(0, '#ff4060');
        beamGrad.addColorStop(0.3, '#ff6080');
        beamGrad.addColorStop(0.6, '#ff8090');
        beamGrad.addColorStop(1, 'rgba(255,64,96,0)');
        ctx.fillStyle = beamGrad;
        ctx.fillRect(-2 * u, -2.5 * u, 17 * u, 5 * u);

        // Beam inner core (brighter)
        const coreGrad = ctx.createLinearGradient(-1 * u, 0, 12 * u, 0);
        coreGrad.addColorStop(0, 'rgba(255,200,210,0.8)');
        coreGrad.addColorStop(1, 'rgba(255,128,160,0)');
        ctx.fillStyle = coreGrad;
        ctx.fillRect(-1 * u, -1 * u, 13 * u, 2 * u);

        // Core glow
        ctx.save();
        ctx.shadowColor = '#ff4060';
        ctx.shadowBlur = 10 * u;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(0, 0, 3 * u, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Focusing ellipse rings
        ctx.strokeStyle = '#ff8080';
        ctx.lineWidth = 0.8 * u;
        ctx.beginPath();
        ctx.ellipse(0, 0, 9 * u, 4 * u, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = colorAlpha('#ff8080', 0.4);
        ctx.lineWidth = 0.5 * u;
        ctx.beginPath();
        ctx.ellipse(0, 0, 12 * u, 5.5 * u, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Lens flare dots
        ctx.fillStyle = '#ff80a0';
        ctx.globalAlpha = 0.5;
        ctx.beginPath(); ctx.arc(-8 * u, -6 * u, 1.5 * u, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(6 * u, 5 * u, 1 * u, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(-4 * u, 8 * u, 0.8 * u, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
    },

    // ──── MISSILE TOWER ────
    // Detailed missile with metallic body, targeting fins, exhaust plume
    _drawMissileIcon(ctx, s) {
        const u = s / 36;

        // Exhaust plume — layered glow trail
        ctx.save();
        // Outer flame
        const exhaust1 = ctx.createLinearGradient(-12 * u, 0, -3 * u, 0);
        exhaust1.addColorStop(0, 'rgba(255,64,0,0)');
        exhaust1.addColorStop(0.5, 'rgba(255,128,64,0.5)');
        exhaust1.addColorStop(1, 'rgba(255,160,80,0.7)');
        ctx.fillStyle = exhaust1;
        ctx.beginPath();
        ctx.moveTo(-3 * u, -2 * u);
        ctx.quadraticCurveTo(-8 * u, -1 * u, -13 * u, 0);
        ctx.quadraticCurveTo(-8 * u, 1 * u, -3 * u, 2 * u);
        ctx.closePath();
        ctx.fill();

        // Inner flame (bright)
        ctx.fillStyle = '#ffe0a0';
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.moveTo(-3 * u, -1 * u);
        ctx.quadraticCurveTo(-6 * u, -0.5 * u, -9 * u, 0);
        ctx.quadraticCurveTo(-6 * u, 0.5 * u, -3 * u, 1 * u);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.restore();

        // Missile body — metallic gradient
        const bodyGrad = ctx.createLinearGradient(0, -3 * u, 0, 3 * u);
        bodyGrad.addColorStop(0, '#a0a0a0');
        bodyGrad.addColorStop(0.3, '#888');
        bodyGrad.addColorStop(0.5, '#999');
        bodyGrad.addColorStop(0.7, '#777');
        bodyGrad.addColorStop(1, '#666');
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.moveTo(-3 * u, -3 * u);
        ctx.lineTo(8 * u, -3 * u);
        ctx.lineTo(10 * u, 0);
        ctx.lineTo(8 * u, 3 * u);
        ctx.lineTo(-3 * u, 3 * u);
        ctx.closePath();
        ctx.fill();

        // Body stripe detail
        ctx.strokeStyle = '#aaa';
        ctx.lineWidth = 0.5 * u;
        ctx.beginPath(); ctx.moveTo(3 * u, -3 * u); ctx.lineTo(3 * u, 3 * u); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(6 * u, -3 * u); ctx.lineTo(6 * u, 3 * u); ctx.stroke();

        // Nose cone — red with gradient
        const noseGrad = ctx.createLinearGradient(8 * u, 0, 14 * u, 0);
        noseGrad.addColorStop(0, '#cc3020');
        noseGrad.addColorStop(1, '#ff4020');
        ctx.fillStyle = noseGrad;
        ctx.beginPath();
        ctx.moveTo(8 * u, -3 * u);
        ctx.lineTo(14 * u, 0);
        ctx.lineTo(8 * u, 3 * u);
        ctx.closePath();
        ctx.fill();

        // Nose highlight
        ctx.fillStyle = colorAlpha('#ff8060', 0.5);
        ctx.beginPath();
        ctx.moveTo(9 * u, -1.5 * u);
        ctx.lineTo(12 * u, 0);
        ctx.lineTo(9 * u, 1.5 * u);
        ctx.closePath();
        ctx.fill();

        // Fins — with gradient
        ctx.fillStyle = '#556';
        // Top fin
        ctx.beginPath();
        ctx.moveTo(-3 * u, -3 * u);
        ctx.lineTo(-6 * u, -9 * u);
        ctx.lineTo(1 * u, -3 * u);
        ctx.closePath();
        ctx.fill();
        // Bottom fin
        ctx.beginPath();
        ctx.moveTo(-3 * u, 3 * u);
        ctx.lineTo(-6 * u, 9 * u);
        ctx.lineTo(1 * u, 3 * u);
        ctx.closePath();
        ctx.fill();

        // Fin edge highlight
        ctx.strokeStyle = '#778';
        ctx.lineWidth = 0.5 * u;
        ctx.beginPath();
        ctx.moveTo(-3 * u, -3 * u);
        ctx.lineTo(-6 * u, -9 * u);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-3 * u, 3 * u);
        ctx.lineTo(-6 * u, 9 * u);
        ctx.stroke();

        // Targeting window — glowing circle
        ctx.save();
        ctx.shadowColor = '#80c0ff';
        ctx.shadowBlur = 3 * u;
        ctx.fillStyle = '#90d0ff';
        ctx.beginPath();
        ctx.arc(4.5 * u, 0, 1.8 * u, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#c0e8ff';
        ctx.beginPath();
        ctx.arc(4.5 * u, -0.5 * u, 0.8 * u, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    },

    // ──── BOOST TOWER ────
    // Radiant star with energy pulse rings and buff arrows
    _drawBoostIcon(ctx, s) {
        const u = s / 36;

        // Outer energy field
        const fieldGrad = ctx.createRadialGradient(0, 0, 4 * u, 0, 0, 15 * u);
        fieldGrad.addColorStop(0, 'rgba(255,215,0,0.15)');
        fieldGrad.addColorStop(1, 'rgba(255,215,0,0)');
        ctx.fillStyle = fieldGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 15 * u, 0, Math.PI * 2);
        ctx.fill();

        // Pulse rings
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 0.8 * u;
        ctx.globalAlpha = 0.35;
        ctx.beginPath();
        ctx.arc(0, 0, 12 * u, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 0.2;
        ctx.setLineDash([2.5 * u, 2.5 * u]);
        ctx.beginPath();
        ctx.arc(0, 0, 15 * u, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;

        // Central star — gradient filled with glow
        ctx.save();
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 10 * u;

        const starGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 9 * u);
        starGrad.addColorStop(0, '#fff8d0');
        starGrad.addColorStop(0.5, '#ffd700');
        starGrad.addColorStop(1, '#d4a000');
        ctx.fillStyle = starGrad;

        const starPoints = 5;
        const outerR = 8 * u;
        const innerR = 4 * u;
        ctx.beginPath();
        for (let i = 0; i < starPoints * 2; i++) {
            const r = i % 2 === 0 ? outerR : innerR;
            const angle = (Math.PI / starPoints) * i - Math.PI / 2;
            const px = Math.cos(angle) * r;
            const py = Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Star edge highlight
        ctx.strokeStyle = colorAlpha('#fff', 0.3);
        ctx.lineWidth = 0.5 * u;
        ctx.beginPath();
        for (let i = 0; i < starPoints * 2; i++) {
            const r = i % 2 === 0 ? outerR : innerR;
            const angle = (Math.PI / starPoints) * i - Math.PI / 2;
            const px = Math.cos(angle) * r;
            const py = Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();

        // Buff arrows (up indicators)
        ctx.fillStyle = '#40ff80';
        ctx.globalAlpha = 0.65;
        // Left buff arrow
        ctx.beginPath();
        ctx.moveTo(-10 * u, 3 * u);
        ctx.lineTo(-7 * u, -4 * u);
        ctx.lineTo(-4 * u, 3 * u);
        ctx.lineTo(-6 * u, 2 * u);
        ctx.lineTo(-7 * u, -1 * u);
        ctx.lineTo(-8 * u, 2 * u);
        ctx.closePath();
        ctx.fill();
        // Right buff arrow
        ctx.beginPath();
        ctx.moveTo(4 * u, 3 * u);
        ctx.lineTo(7 * u, -4 * u);
        ctx.lineTo(10 * u, 3 * u);
        ctx.lineTo(8 * u, 2 * u);
        ctx.lineTo(7 * u, -1 * u);
        ctx.lineTo(6 * u, 2 * u);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;

        // Central bright core
        ctx.fillStyle = '#fff';
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(0, 0, 2 * u, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    },

    // ──── HELPERS ────
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
