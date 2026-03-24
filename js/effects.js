// ===== PARTICLE & EFFECTS SYSTEM =====
class Particle {
    constructor(x, y, opts = {}) {
        this.x = x;
        this.y = y;
        this.vx = opts.vx || (Math.random() - 0.5) * 3;
        this.vy = opts.vy || (Math.random() - 0.5) * 3;
        this.life = opts.life || 0.5;
        this.maxLife = this.life;
        this.size = opts.size || 3;
        this.color = opts.color || '#fff';
        this.gravity = opts.gravity || 0;
        this.friction = opts.friction || 0.98;
        this.shrink = opts.shrink !== false;
        this.glow = opts.glow || false;
        this.rotation = opts.rotation || 0;
        this.rotationSpeed = opts.rotationSpeed || 0;
        this.shape = opts.shape || 'circle'; // circle, square, triangle, star
        this.trail = opts.trail || false;
        this.trailPositions = [];
        this.maxTrailLength = opts.maxTrailLength || 5;
        this.fadeIn = opts.fadeIn || false;
        this.fadeInDuration = opts.fadeInDuration || 0.1;
        this.scaleUp = opts.scaleUp || false;
    }

    update(dt) {
        // Store trail position before moving
        if (this.trail) {
            this.trailPositions.push({ x: this.x, y: this.y });
            if (this.trailPositions.length > this.maxTrailLength) {
                this.trailPositions.shift();
            }
        }

        this.vx *= this.friction;
        this.vy *= this.friction;
        this.vy += this.gravity * dt;
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.rotationSpeed * dt;
        this.life -= dt;
        return this.life > 0;
    }

    draw(ctx) {
        const lifeRatio = clamp(this.life / this.maxLife, 0, 1);
        let alpha = lifeRatio;

        // Fade-in effect for the first portion of life
        if (this.fadeIn) {
            const elapsed = this.maxLife - this.life;
            if (elapsed < this.fadeInDuration) {
                alpha = clamp(elapsed / this.fadeInDuration, 0, 1) * lifeRatio;
            }
        }

        const size = this.shrink ? this.size * lifeRatio : this.size;
        const drawSize = this.scaleUp ? size * (1 + (1 - lifeRatio) * 0.5) : size;
        if (drawSize < 0.3) return;

        // Draw trail behind particle
        if (this.trail && this.trailPositions.length > 1) {
            ctx.save();
            for (let i = 0; i < this.trailPositions.length - 1; i++) {
                const t = i / this.trailPositions.length;
                const tp = this.trailPositions[i];
                ctx.globalAlpha = alpha * t * 0.5;
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(tp.x, tp.y, drawSize * t * 0.7, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        ctx.save();
        ctx.globalAlpha = alpha;
        if (this.glow) {
            ctx.shadowColor = this.color;
            ctx.shadowBlur = drawSize * 3;
        }
        ctx.fillStyle = this.color;

        if (this.rotation !== 0) {
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.translate(-this.x, -this.y);
        }

        if (this.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(this.x, this.y, drawSize, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.shape === 'square') {
            ctx.fillRect(this.x - drawSize, this.y - drawSize, drawSize * 2, drawSize * 2);
        } else if (this.shape === 'triangle') {
            ctx.beginPath();
            ctx.moveTo(this.x, this.y - drawSize);
            ctx.lineTo(this.x - drawSize, this.y + drawSize);
            ctx.lineTo(this.x + drawSize, this.y + drawSize);
            ctx.closePath();
            ctx.fill();
        } else if (this.shape === 'star') {
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
                const outerX = this.x + Math.cos(angle) * drawSize;
                const outerY = this.y + Math.sin(angle) * drawSize;
                if (i === 0) ctx.moveTo(outerX, outerY);
                else ctx.lineTo(outerX, outerY);
                const innerAngle = angle + Math.PI / 5;
                ctx.lineTo(this.x + Math.cos(innerAngle) * drawSize * 0.4, this.y + Math.sin(innerAngle) * drawSize * 0.4);
            }
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
    }
}

// ===== WEATHER SYSTEM =====
const Weather = {
    active: false,
    type: 'none', // none, rain, snow, ember, fog
    particles: [],
    fogAlpha: 0,
    fogTarget: 0,
    windX: 0,
    windY: 0,
    intensity: 1.0,
    timer: 0,

    init(mapTheme) {
        this.particles = [];
        this.fogAlpha = 0;
        this.fogTarget = 0;
        this.timer = 0;
        this.active = true;
        this.windX = 0;
        this.windY = 0;

        switch (mapTheme) {
            case 'forest':
                this.type = 'rain';
                this.intensity = 0.6;
                this.windX = -0.5;
                break;
            case 'ice':
                this.type = 'snow';
                this.intensity = 0.8;
                this.windX = 0.3;
                break;
            case 'volcano':
                this.type = 'ember';
                this.intensity = 0.7;
                this.windX = 0.2;
                break;
            case 'shadow':
                this.type = 'fog';
                this.intensity = 0.5;
                this.fogTarget = 0.15;
                break;
            case 'desert':
                this.type = 'none';
                this.intensity = 0.3;
                break;
            default:
                this.type = 'none';
                this.active = false;
                break;
        }
    },

    update(dt, canvasW, canvasH) {
        if (!this.active) return;
        this.timer += dt;

        // Slowly shift wind
        this.windX += (Math.random() - 0.5) * 0.1 * dt;
        this.windX = clamp(this.windX, -2, 2);

        // Fog fading
        if (this.type === 'fog') {
            const diff = this.fogTarget - this.fogAlpha;
            this.fogAlpha += diff * dt * 0.5;
            // Pulse the fog
            this.fogTarget = 0.1 + Math.sin(this.timer * 0.3) * 0.05;
        }

        // Spawn weather particles
        const spawnRate = this._getSpawnRate();
        const count = Math.floor(spawnRate * dt);
        for (let i = 0; i < count; i++) {
            this._spawnWeatherParticle(canvasW, canvasH);
        }

        // Update weather particles
        this.particles = this.particles.filter(p => {
            p.x += p.vx * dt * 60;
            p.y += p.vy * dt * 60;
            p.life -= dt;
            // Remove if off screen
            if (p.x < -20 || p.x > canvasW + 20 || p.y > canvasH + 20) {
                return false;
            }
            return p.life > 0;
        });
    },

    _getSpawnRate() {
        switch (this.type) {
            case 'rain': return 60 * this.intensity;
            case 'snow': return 20 * this.intensity;
            case 'ember': return 8 * this.intensity;
            case 'fog': return 3 * this.intensity;
            default: return 0;
        }
    },

    _spawnWeatherParticle(canvasW, canvasH) {
        switch (this.type) {
            case 'rain':
                this.particles.push({
                    x: Math.random() * (canvasW + 100) - 50,
                    y: -10,
                    vx: this.windX * 2 + (Math.random() - 0.5) * 0.5,
                    vy: 6 + Math.random() * 4,
                    life: 2.0,
                    maxLife: 2.0,
                    size: 1 + Math.random() * 1.5,
                    length: 8 + Math.random() * 12,
                    color: 'rgba(150,180,255,0.4)',
                });
                break;
            case 'snow':
                this.particles.push({
                    x: Math.random() * (canvasW + 60) - 30,
                    y: -10,
                    vx: this.windX + (Math.random() - 0.5) * 0.8,
                    vy: 0.8 + Math.random() * 1.2,
                    life: 6.0,
                    maxLife: 6.0,
                    size: 1 + Math.random() * 3,
                    wobblePhase: Math.random() * Math.PI * 2,
                    wobbleSpeed: 1 + Math.random() * 2,
                    color: 'rgba(230,240,255,0.6)',
                });
                break;
            case 'ember':
                this.particles.push({
                    x: Math.random() * canvasW,
                    y: canvasH + 10,
                    vx: this.windX + (Math.random() - 0.5) * 1.5,
                    vy: -(1.5 + Math.random() * 2.5),
                    life: 3.0 + Math.random() * 2,
                    maxLife: 5.0,
                    size: 1 + Math.random() * 2.5,
                    color: choose(['#ff4020', '#ff8020', '#ffcc20', '#ff6010']),
                    flicker: Math.random() * Math.PI * 2,
                });
                break;
            case 'fog':
                this.particles.push({
                    x: Math.random() * canvasW,
                    y: Math.random() * canvasH,
                    vx: (Math.random() - 0.5) * 0.3,
                    vy: (Math.random() - 0.5) * 0.2,
                    life: 4.0 + Math.random() * 3,
                    maxLife: 7.0,
                    size: 40 + Math.random() * 80,
                    color: 'rgba(180,180,200,0.05)',
                });
                break;
        }
    },

    draw(ctx, canvasW, canvasH) {
        if (!this.active) return;

        ctx.save();
        for (const p of this.particles) {
            const alpha = clamp(p.life / p.maxLife, 0, 1);

            if (this.type === 'rain') {
                ctx.globalAlpha = alpha * 0.6;
                ctx.strokeStyle = p.color;
                ctx.lineWidth = p.size;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x + p.vx * 2, p.y + p.length);
                ctx.stroke();
            } else if (this.type === 'snow') {
                // Wobble side to side
                const wobbleX = Math.sin(this.timer * p.wobbleSpeed + p.wobblePhase) * 0.5;
                p.x += wobbleX * 0.016 * 60;
                ctx.globalAlpha = alpha * 0.7;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            } else if (this.type === 'ember') {
                const flicker = 0.5 + Math.sin(this.timer * 8 + p.flicker) * 0.5;
                ctx.globalAlpha = alpha * flicker;
                ctx.fillStyle = p.color;
                ctx.shadowColor = p.color;
                ctx.shadowBlur = p.size * 4;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            } else if (this.type === 'fog') {
                ctx.globalAlpha = alpha * 0.08;
                ctx.fillStyle = p.color;
                const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
                gradient.addColorStop(0, 'rgba(180,180,200,0.1)');
                gradient.addColorStop(1, 'rgba(180,180,200,0)');
                ctx.fillStyle = gradient;
                ctx.fillRect(p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
            }
        }

        // Global fog overlay
        if (this.type === 'fog' && this.fogAlpha > 0.001) {
            ctx.globalAlpha = this.fogAlpha;
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(0, 0, canvasW, canvasH);
        }

        ctx.restore();
    },

    clear() {
        this.particles = [];
        this.active = false;
        this.type = 'none';
        this.fogAlpha = 0;
    },
};

// ===== SCREEN EFFECTS SYSTEM =====
const ScreenEffects = {
    cameraZoom: 1.0,
    cameraZoomTarget: 1.0,
    cameraZoomCenterX: 0,
    cameraZoomCenterY: 0,
    slowMotionFactor: 1.0,
    slowMotionTarget: 1.0,
    slowMotionTimer: 0,
    shakeX: 0,
    shakeY: 0,
    shakeIntensity: 0,
    shakeDuration: 0,

    update(dt) {
        // Camera zoom interpolation
        this.cameraZoom += (this.cameraZoomTarget - this.cameraZoom) * dt * 3.0;
        if (Math.abs(this.cameraZoom - this.cameraZoomTarget) < 0.001) {
            this.cameraZoom = this.cameraZoomTarget;
        }

        // Slow-motion timer
        if (this.slowMotionTimer > 0) {
            this.slowMotionTimer -= dt;
            if (this.slowMotionTimer <= 0) {
                this.slowMotionTarget = 1.0;
                this.slowMotionTimer = 0;
            }
        }
        this.slowMotionFactor += (this.slowMotionTarget - this.slowMotionFactor) * dt * 5.0;

        // Screen shake
        if (this.shakeDuration > 0) {
            this.shakeDuration -= dt;
            const intensity = this.shakeIntensity * clamp(this.shakeDuration / 0.3, 0, 1);
            this.shakeX = (Math.random() - 0.5) * intensity * 2;
            this.shakeY = (Math.random() - 0.5) * intensity * 2;
        } else {
            this.shakeX = 0;
            this.shakeY = 0;
            this.shakeIntensity = 0;
        }
    },

    triggerBossZoom(x, y) {
        this.cameraZoomCenterX = x;
        this.cameraZoomCenterY = y;
        this.cameraZoomTarget = 1.15;
        // Return to normal after a moment
        setTimeout(() => {
            this.cameraZoomTarget = 1.0;
        }, 1500);
    },

    triggerSlowMotion(factor, duration) {
        this.slowMotionTarget = factor;
        this.slowMotionTimer = duration;
    },

    triggerShake(intensity, duration) {
        this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
        this.shakeDuration = Math.max(this.shakeDuration, duration);
    },

    applyTransform(ctx, canvasW, canvasH) {
        if (this.cameraZoom !== 1.0) {
            const cx = this.cameraZoomCenterX || canvasW / 2;
            const cy = this.cameraZoomCenterY || canvasH / 2;
            ctx.translate(cx, cy);
            ctx.scale(this.cameraZoom, this.cameraZoom);
            ctx.translate(-cx, -cy);
        }
        if (this.shakeX !== 0 || this.shakeY !== 0) {
            ctx.translate(this.shakeX, this.shakeY);
        }
    },

    getSlowMotion() {
        return this.slowMotionFactor;
    },

    draw(ctx) {
        // Flash effect for slow-motion
        if (this.slowMotionFactor < 0.9) {
            ctx.save();
            const alpha = (1 - this.slowMotionFactor) * 0.12;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#8080ff';
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.restore();
        }

        // Screen shake vignette
        if (this.shakeIntensity > 2) {
            ctx.save();
            const alpha = Math.min(this.shakeIntensity / 20, 0.15);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#ff2020';
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.restore();
        }

        // Boss zoom vignette
        if (this.cameraZoom > 1.02) {
            ctx.save();
            const intensity = (this.cameraZoom - 1.0) * 3;
            const w = ctx.canvas.width;
            const h = ctx.canvas.height;
            const gradient = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.min(w, h) * 0.7);
            gradient.addColorStop(0, 'rgba(0,0,0,0)');
            gradient.addColorStop(1, `rgba(0,0,0,${Math.min(intensity, 0.3)})`);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, w, h);
            ctx.restore();
        }
    },

    reset() {
        this.cameraZoom = 1.0;
        this.cameraZoomTarget = 1.0;
        this.slowMotionFactor = 1.0;
        this.slowMotionTarget = 1.0;
        this.slowMotionTimer = 0;
        this.shakeX = 0;
        this.shakeY = 0;
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
    },
};

// ===== ENVIRONMENTAL PARTICLE SYSTEM =====
const EnvironmentalParticles = {
    particles: [],
    mapTheme: 'forest',
    timer: 0,

    init(mapTheme) {
        this.mapTheme = mapTheme || 'forest';
        this.particles = [];
        this.timer = 0;
    },

    update(dt, canvasW, canvasH) {
        this.timer += dt;

        // Spawn ambient particles based on map theme
        const rate = this._getSpawnRate();
        if (Math.random() < rate * dt) {
            this._spawnAmbientParticle(canvasW, canvasH);
        }

        // Update particles
        this.particles = this.particles.filter(p => {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
            if (p.wobble) {
                p.x += Math.sin(this.timer * p.wobbleSpeed + p.phase) * p.wobbleAmp * dt;
            }
            return p.life > 0 && p.x > -30 && p.x < canvasW + 30 && p.y > -30 && p.y < canvasH + 30;
        });
    },

    _getSpawnRate() {
        switch (this.mapTheme) {
            case 'forest': return 4;   // Floating dust motes & pollen
            case 'desert': return 3;   // Sand particles
            case 'ice': return 2;      // Ice crystals
            case 'volcano': return 5;  // Ash & sparks
            case 'shadow': return 3;   // Dark wisps
            default: return 2;
        }
    },

    _spawnAmbientParticle(canvasW, canvasH) {
        let particle;
        switch (this.mapTheme) {
            case 'forest':
                particle = {
                    x: Math.random() * canvasW,
                    y: Math.random() * canvasH,
                    vx: (Math.random() - 0.5) * 8,
                    vy: -5 + Math.random() * 3,
                    life: 3 + Math.random() * 4,
                    maxLife: 7,
                    size: 1 + Math.random() * 2,
                    color: choose(['rgba(200,220,140,0.3)', 'rgba(255,255,200,0.2)', 'rgba(180,255,180,0.25)']),
                    wobble: true,
                    wobbleSpeed: 1 + Math.random(),
                    wobbleAmp: 10 + Math.random() * 15,
                    phase: Math.random() * Math.PI * 2,
                };
                break;
            case 'desert':
                particle = {
                    x: -10,
                    y: canvasH * 0.5 + Math.random() * canvasH * 0.5,
                    vx: 15 + Math.random() * 25,
                    vy: (Math.random() - 0.5) * 5,
                    life: 3 + Math.random() * 2,
                    maxLife: 5,
                    size: 1 + Math.random() * 1.5,
                    color: 'rgba(200,180,130,0.3)',
                    wobble: false,
                };
                break;
            case 'ice':
                particle = {
                    x: Math.random() * canvasW,
                    y: Math.random() * canvasH,
                    vx: (Math.random() - 0.5) * 5,
                    vy: (Math.random() - 0.5) * 3,
                    life: 2 + Math.random() * 3,
                    maxLife: 5,
                    size: 1 + Math.random() * 2,
                    color: choose(['rgba(180,220,255,0.3)', 'rgba(200,240,255,0.25)', 'rgba(160,200,240,0.2)']),
                    wobble: true,
                    wobbleSpeed: 0.5 + Math.random() * 0.5,
                    wobbleAmp: 5 + Math.random() * 8,
                    phase: Math.random() * Math.PI * 2,
                };
                break;
            case 'volcano':
                particle = {
                    x: Math.random() * canvasW,
                    y: canvasH + 10,
                    vx: (Math.random() - 0.5) * 10,
                    vy: -(10 + Math.random() * 20),
                    life: 1.5 + Math.random() * 2.5,
                    maxLife: 4,
                    size: 0.5 + Math.random() * 1.5,
                    color: choose(['rgba(255,100,30,0.4)', 'rgba(255,50,10,0.3)', 'rgba(150,150,150,0.2)']),
                    wobble: false,
                };
                break;
            case 'shadow':
                particle = {
                    x: Math.random() * canvasW,
                    y: Math.random() * canvasH,
                    vx: (Math.random() - 0.5) * 6,
                    vy: (Math.random() - 0.5) * 6,
                    life: 2 + Math.random() * 4,
                    maxLife: 6,
                    size: 2 + Math.random() * 4,
                    color: choose(['rgba(100,50,150,0.2)', 'rgba(60,30,100,0.15)', 'rgba(150,80,200,0.15)']),
                    wobble: true,
                    wobbleSpeed: 0.3 + Math.random() * 0.5,
                    wobbleAmp: 8 + Math.random() * 12,
                    phase: Math.random() * Math.PI * 2,
                };
                break;
            default:
                particle = {
                    x: Math.random() * canvasW,
                    y: Math.random() * canvasH,
                    vx: (Math.random() - 0.5) * 5,
                    vy: (Math.random() - 0.5) * 5,
                    life: 2 + Math.random() * 3,
                    maxLife: 5,
                    size: 1 + Math.random(),
                    color: 'rgba(200,200,200,0.2)',
                    wobble: false,
                };
                break;
        }
        this.particles.push(particle);
    },

    draw(ctx) {
        ctx.save();
        for (const p of this.particles) {
            const alpha = clamp(p.life / p.maxLife, 0, 1);
            const fadeAlpha = alpha < 0.3 ? alpha / 0.3 : (alpha > 0.7 ? (1 - alpha) / 0.3 : 1);
            ctx.globalAlpha = fadeAlpha * 0.7;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    },

    clear() {
        this.particles = [];
    },
};

// ===== GROUND DECAL SYSTEM =====
const GroundDecals = {
    decals: [],
    maxDecals: 50,

    addScorchMark(x, y, radius) {
        this.decals.push({
            type: 'scorch',
            x: x,
            y: y,
            radius: radius || 15,
            life: 8.0,
            maxLife: 8.0,
            rotation: Math.random() * Math.PI * 2,
        });
        if (this.decals.length > this.maxDecals) {
            this.decals.shift();
        }
    },

    addCrackDecal(x, y, size) {
        this.decals.push({
            type: 'crack',
            x: x,
            y: y,
            size: size || 12,
            life: 6.0,
            maxLife: 6.0,
            rotation: Math.random() * Math.PI * 2,
            crackLines: this._generateCrackLines(),
        });
        if (this.decals.length > this.maxDecals) {
            this.decals.shift();
        }
    },

    addFrostPatch(x, y, radius) {
        this.decals.push({
            type: 'frost',
            x: x,
            y: y,
            radius: radius || 18,
            life: 4.0,
            maxLife: 4.0,
            rotation: Math.random() * Math.PI * 2,
        });
        if (this.decals.length > this.maxDecals) {
            this.decals.shift();
        }
    },

    _generateCrackLines() {
        const lines = [];
        const numLines = 3 + Math.floor(Math.random() * 4);
        for (let i = 0; i < numLines; i++) {
            const angle = Math.random() * Math.PI * 2;
            const length = 5 + Math.random() * 15;
            lines.push({ angle, length });
        }
        return lines;
    },

    update(dt) {
        this.decals = this.decals.filter(d => {
            d.life -= dt;
            return d.life > 0;
        });
    },

    draw(ctx) {
        ctx.save();
        for (const d of this.decals) {
            const alpha = clamp(d.life / d.maxLife, 0, 1) * 0.5;
            ctx.globalAlpha = alpha;

            if (d.type === 'scorch') {
                const gradient = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.radius);
                gradient.addColorStop(0, 'rgba(30,20,10,0.6)');
                gradient.addColorStop(0.6, 'rgba(50,30,10,0.3)');
                gradient.addColorStop(1, 'rgba(50,30,10,0)');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
                ctx.fill();
            } else if (d.type === 'crack') {
                ctx.strokeStyle = 'rgba(60,50,40,0.8)';
                ctx.lineWidth = 1.5;
                ctx.translate(d.x, d.y);
                ctx.rotate(d.rotation);
                for (const line of d.crackLines) {
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(Math.cos(line.angle) * line.length, Math.sin(line.angle) * line.length);
                    ctx.stroke();
                }
                ctx.setTransform(1, 0, 0, 1, 0, 0);
            } else if (d.type === 'frost') {
                const gradient = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.radius);
                gradient.addColorStop(0, 'rgba(150,200,255,0.4)');
                gradient.addColorStop(0.7, 'rgba(180,220,255,0.15)');
                gradient.addColorStop(1, 'rgba(200,240,255,0)');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.restore();
    },

    clear() {
        this.decals = [];
    },
};

// ===== RING WAVE EFFECT SYSTEM =====
const RingWaves = {
    rings: [],

    spawn(x, y, opts = {}) {
        this.rings.push({
            x: x,
            y: y,
            radius: opts.startRadius || 5,
            maxRadius: opts.maxRadius || 80,
            speed: opts.speed || 120,
            lineWidth: opts.lineWidth || 2,
            color: opts.color || '#fff',
            life: opts.life || 0.6,
            maxLife: opts.life || 0.6,
        });
    },

    update(dt) {
        this.rings = this.rings.filter(r => {
            r.radius += r.speed * dt;
            r.life -= dt;
            return r.life > 0 && r.radius < r.maxRadius;
        });
    },

    draw(ctx) {
        ctx.save();
        for (const r of this.rings) {
            const alpha = clamp(r.life / r.maxLife, 0, 1);
            ctx.globalAlpha = alpha * 0.7;
            ctx.strokeStyle = r.color;
            ctx.lineWidth = r.lineWidth * alpha;
            ctx.shadowColor = r.color;
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.restore();
    },

    clear() {
        this.rings = [];
    },
};

const Effects = {
    // Track recent kills for combo detection
    _recentKills: [],
    _comboWindow: 0.5, // seconds to count as combo

    spawnExplosion(x, y, color, count = 12, opts = {}) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i + Math.random() * 0.3;
            const speed = rand(1, 4) * (opts.speed || 1);
            GameState.particles.push(new Particle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: rand(0.3, 0.7),
                size: rand(2, 5) * (opts.size || 1),
                color: color,
                gravity: opts.gravity || 0.5,
                glow: opts.glow || false,
            }));
        }
    },

    spawnSplash(x, y, color, radius) {
        const count = Math.floor(radius / 5);
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * radius * 0.7;
            GameState.particles.push(new Particle(x + Math.cos(angle) * dist, y + Math.sin(angle) * dist, {
                vx: Math.cos(angle) * rand(0.5, 2),
                vy: Math.sin(angle) * rand(0.5, 2) - 1,
                life: rand(0.2, 0.5),
                size: rand(2, 4),
                color: color,
                gravity: 1,
            }));
        }
    },

    spawnFrostRing(x, y) {
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i;
            GameState.particles.push(new Particle(x, y, {
                vx: Math.cos(angle) * 2,
                vy: Math.sin(angle) * 2,
                life: 0.4,
                size: 3,
                color: '#80e0ff',
                friction: 0.92,
                glow: true,
            }));
        }
    },

    spawnLightningArc(x1, y1, x2, y2) {
        const steps = 5;
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const px = lerp(x1, x2, t) + (i > 0 && i < steps ? (Math.random() - 0.5) * 15 : 0);
            const py = lerp(y1, y2, t) + (i > 0 && i < steps ? (Math.random() - 0.5) * 15 : 0);
            GameState.particles.push(new Particle(px, py, {
                vx: 0, vy: 0,
                life: 0.15,
                size: 2,
                color: '#ffe040',
                shrink: false,
                glow: true,
            }));
        }
    },

    spawnFireTrail(x, y) {
        GameState.particles.push(new Particle(x, y, {
            vx: (Math.random() - 0.5) * 1,
            vy: -rand(1, 3),
            life: rand(0.3, 0.6),
            size: rand(2, 5),
            color: choose(['#ff4020', '#ff8020', '#ffcc20']),
            gravity: -0.5,
        }));
    },

    spawnGoldCoin(x, y) {
        for (let i = 0; i < 3; i++) {
            GameState.particles.push(new Particle(x, y, {
                vx: (Math.random() - 0.5) * 4,
                vy: -rand(2, 5),
                life: rand(0.5, 1.0),
                size: 3,
                color: '#ffd700',
                gravity: 3,
                glow: true,
            }));
        }
    },

    spawnBeam(x1, y1, x2, y2, color, width, life) {
        GameState.beams.push({ x1, y1, x2, y2, color, width, life, maxLife: life });
    },

    addFloatingText(x, y, text, color, size = 14) {
        GameState.floatingTexts.push({
            x, y, text, color, size,
            life: 1.0, maxLife: 1.0,
            vy: -1.5,
            scaleAnim: 0, // scale-up animation timer
            fontFamily: 'Orbitron, sans-serif',
            isCrit: false,
        });
    },

    // Improved floating text with scale-up and font options
    addStyledFloatingText(x, y, text, color, opts = {}) {
        GameState.floatingTexts.push({
            x: x + (Math.random() - 0.5) * (opts.spread || 0),
            y: y + (Math.random() - 0.5) * (opts.spread || 0),
            text: text,
            color: color,
            size: opts.size || 14,
            life: opts.life || 1.2,
            maxLife: opts.life || 1.2,
            vy: opts.vy || -1.5,
            vx: opts.vx || 0,
            scaleAnim: opts.scaleUp ? 0.15 : 0,
            fontFamily: opts.font || 'Orbitron, sans-serif',
            isCrit: opts.crit || false,
            bold: opts.bold !== false,
            outline: opts.outline || false,
            outlineColor: opts.outlineColor || '#000',
        });
    },

    // Group damage numbers that occur close together
    addGroupedDamage(x, y, damage, color) {
        // Check if there's a recent floating text nearby we can merge with
        const mergeRadius = 30;
        const mergeTimeWindow = 0.15;
        for (const ft of GameState.floatingTexts) {
            if (ft._isDamageGroup && ft.life > ft.maxLife - mergeTimeWindow) {
                const dx = ft.x - x;
                const dy = ft.y - y;
                if (dx * dx + dy * dy < mergeRadius * mergeRadius) {
                    ft._groupedDamage += damage;
                    ft.text = '-' + Math.round(ft._groupedDamage);
                    ft.size = Math.min(20, 14 + ft._groupedDamage / 50);
                    return;
                }
            }
        }
        // Create new damage number
        const ft = {
            x: x,
            y: y,
            text: '-' + Math.round(damage),
            color: color || '#fff',
            size: 14,
            life: 0.8,
            maxLife: 0.8,
            vy: -1.8,
            vx: (Math.random() - 0.5) * 0.5,
            scaleAnim: 0.08,
            fontFamily: 'Orbitron, sans-serif',
            isCrit: false,
            bold: true,
            _isDamageGroup: true,
            _groupedDamage: damage,
        };
        GameState.floatingTexts.push(ft);
    },

    spawnAura(x, y, radius, color) {
        for (let i = 0; i < 6; i++) {
            const angle = Math.random() * Math.PI * 2;
            const r = radius * 0.8 + Math.random() * radius * 0.4;
            GameState.particles.push(new Particle(
                x + Math.cos(angle) * r,
                y + Math.sin(angle) * r,
                {
                    vx: 0, vy: -rand(0.5, 1.5),
                    life: rand(0.5, 1.0),
                    size: rand(1, 3),
                    color: color,
                    glow: true,
                }
            ));
        }
    },

    // Pulsing ring aura effect for boost towers
    spawnAuraRing(x, y, radius, color) {
        RingWaves.spawn(x, y, {
            startRadius: radius * 0.7,
            maxRadius: radius * 1.2,
            speed: 30,
            lineWidth: 1.5,
            color: color,
            life: 0.8,
        });
        // Also spawn some orbiting particles
        for (let i = 0; i < 4; i++) {
            const angle = (Math.PI * 2 / 4) * i;
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            GameState.particles.push(new Particle(px, py, {
                vx: Math.cos(angle + Math.PI / 2) * 1,
                vy: Math.sin(angle + Math.PI / 2) * 1,
                life: 0.6,
                size: 2,
                color: color,
                glow: true,
                friction: 0.95,
            }));
        }
    },

    // ===== TRAIL EFFECTS =====
    spawnArrowTrail(x, y) {
        GameState.particles.push(new Particle(x, y, {
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            life: 0.15,
            size: 1.5,
            color: 'rgba(200,180,140,0.5)',
            shrink: true,
            friction: 0.9,
        }));
    },

    spawnMissileSmoke(x, y) {
        GameState.particles.push(new Particle(x, y, {
            vx: (Math.random() - 0.5) * 1.5,
            vy: (Math.random() - 0.5) * 1.5,
            life: rand(0.4, 0.8),
            size: rand(3, 6),
            color: choose(['rgba(150,150,150,0.4)', 'rgba(120,120,120,0.3)', 'rgba(100,100,100,0.25)']),
            gravity: -0.3,
            friction: 0.95,
            shrink: true,
        }));
    },

    spawnLaserTrail(x, y, color) {
        GameState.particles.push(new Particle(x, y, {
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            life: 0.2,
            size: 2,
            color: color || '#ff4040',
            glow: true,
            shrink: true,
        }));
    },

    // ===== DEATH EFFECTS PER ENEMY TYPE =====
    spawnDeathEffect(x, y, enemyType) {
        switch (enemyType) {
            case 'basic':
                // Standard pop explosion
                this.spawnExplosion(x, y, '#e04040', 8, { speed: 0.8 });
                break;
            case 'fast':
                // Speed streak particles that zip outward
                for (let i = 0; i < 10; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    GameState.particles.push(new Particle(x, y, {
                        vx: Math.cos(angle) * rand(3, 7),
                        vy: Math.sin(angle) * rand(3, 7),
                        life: 0.2,
                        size: 2,
                        color: '#40e0e0',
                        friction: 0.9,
                        trail: true,
                        maxTrailLength: 3,
                    }));
                }
                break;
            case 'heavy':
                // Ground-shaking slam with crack decal
                this.spawnExplosion(x, y, '#8a6a4a', 15, { speed: 0.6, size: 1.3, gravity: 2 });
                GroundDecals.addCrackDecal(x, y, 18);
                ScreenEffects.triggerShake(3, 0.2);
                break;
            case 'healer':
                // Green healing sparkle burst
                for (let i = 0; i < 12; i++) {
                    const angle = (Math.PI * 2 / 12) * i;
                    GameState.particles.push(new Particle(x, y, {
                        vx: Math.cos(angle) * rand(1, 3),
                        vy: Math.sin(angle) * rand(1, 3),
                        life: rand(0.4, 0.8),
                        size: rand(2, 4),
                        color: choose(['#40ff40', '#80ff80', '#40e040']),
                        glow: true,
                        gravity: -0.3,
                    }));
                }
                // Healing ring dissipation
                RingWaves.spawn(x, y, { color: '#40ff40', maxRadius: 50, speed: 80, life: 0.4 });
                break;
            case 'shield':
                // Shield shatter effect - angular fragments
                for (let i = 0; i < 16; i++) {
                    const angle = (Math.PI * 2 / 16) * i;
                    GameState.particles.push(new Particle(x, y, {
                        vx: Math.cos(angle) * rand(2, 5),
                        vy: Math.sin(angle) * rand(2, 5),
                        life: rand(0.3, 0.6),
                        size: rand(2, 5),
                        color: choose(['#4080e0', '#60a0ff', '#80c0ff']),
                        shape: 'triangle',
                        rotation: Math.random() * Math.PI * 2,
                        rotationSpeed: rand(-10, 10),
                        gravity: 1.5,
                    }));
                }
                break;
            case 'swarm':
                // Small pop
                this.spawnExplosion(x, y, '#e0e040', 4, { speed: 0.5, size: 0.6 });
                break;
            case 'stealth':
                // Fade-out with purple wisps
                for (let i = 0; i < 8; i++) {
                    GameState.particles.push(new Particle(x + rand(-8, 8), y + rand(-8, 8), {
                        vx: (Math.random() - 0.5) * 2,
                        vy: -rand(0.5, 2),
                        life: rand(0.5, 1.0),
                        size: rand(3, 6),
                        color: choose(['rgba(128,64,160,0.6)', 'rgba(100,40,140,0.4)', 'rgba(160,80,200,0.5)']),
                        fadeIn: true,
                        fadeInDuration: 0.1,
                        glow: true,
                    }));
                }
                break;
            case 'boss':
                // Massive explosion with screen shake, ring, and scorch
                this.spawnExplosion(x, y, '#ff2020', 30, { speed: 1.5, size: 1.8, glow: true });
                this.spawnExplosion(x, y, '#ff8020', 20, { speed: 1.0, size: 1.3 });
                this.spawnExplosion(x, y, '#ffcc20', 15, { speed: 0.7, size: 1.0 });
                RingWaves.spawn(x, y, { color: '#ff4020', maxRadius: 120, speed: 200, lineWidth: 4, life: 0.5 });
                RingWaves.spawn(x, y, { color: '#ff8020', maxRadius: 80, speed: 150, lineWidth: 3, life: 0.6 });
                GroundDecals.addScorchMark(x, y, 35);
                ScreenEffects.triggerShake(8, 0.5);
                ScreenEffects.triggerSlowMotion(0.3, 0.8);
                break;
            default:
                this.spawnExplosion(x, y, '#fff', 8);
                break;
        }
    },

    // ===== COMBO KILL EFFECTS =====
    registerKill(x, y) {
        const now = performance.now() / 1000;
        this._recentKills.push({ x, y, time: now });
        // Clean old kills
        this._recentKills = this._recentKills.filter(k => now - k.time < this._comboWindow);

        const comboCount = this._recentKills.length;
        if (comboCount >= 3) {
            this.spawnComboEffect(x, y, comboCount);
        }
    },

    spawnComboEffect(x, y, count) {
        const sizeMult = Math.min(3, 1 + count * 0.3);
        const particleCount = Math.min(40, 10 + count * 4);

        // Multi-colored combo explosion
        const colors = ['#ff4040', '#ff8020', '#ffcc20', '#40ff40', '#4080ff', '#ff40ff'];
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 / particleCount) * i + Math.random() * 0.2;
            const speed = rand(2, 6) * sizeMult * 0.5;
            GameState.particles.push(new Particle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: rand(0.4, 1.0),
                size: rand(2, 5) * sizeMult * 0.5,
                color: colors[i % colors.length],
                gravity: 0.5,
                glow: true,
            }));
        }

        // Combo ring wave
        RingWaves.spawn(x, y, {
            color: '#ffd700',
            maxRadius: 60 + count * 15,
            speed: 150,
            lineWidth: 3,
            life: 0.5,
        });

        // Floating combo text
        if (count >= 5) {
            this.addStyledFloatingText(x, y - 20, count + 'x COMBO!', '#ffd700', {
                size: 18 + count,
                scaleUp: true,
                life: 1.5,
                vy: -2,
                bold: true,
                outline: true,
                outlineColor: '#aa6600',
            });
        } else {
            this.addStyledFloatingText(x, y - 15, count + 'x COMBO', '#ffaa00', {
                size: 16,
                scaleUp: true,
                life: 1.0,
                vy: -1.8,
            });
        }
    },

    // ===== IMPACT EFFECTS =====
    spawnImpactSpark(x, y, color) {
        for (let i = 0; i < 4; i++) {
            const angle = Math.random() * Math.PI * 2;
            GameState.particles.push(new Particle(x, y, {
                vx: Math.cos(angle) * rand(1, 3),
                vy: Math.sin(angle) * rand(1, 3),
                life: 0.1 + Math.random() * 0.15,
                size: 1 + Math.random(),
                color: color || '#fff',
                glow: true,
            }));
        }
    },

    spawnExplosionWithDecal(x, y, color, count, radius) {
        this.spawnExplosion(x, y, color, count || 12, { glow: true });
        GroundDecals.addScorchMark(x, y, radius || 15);
        RingWaves.spawn(x, y, { color: color, maxRadius: (radius || 15) * 2, speed: 100, life: 0.3 });
    },

    // ===== RING WAVE ABILITIES =====
    spawnAbilityRing(x, y, radius, color) {
        RingWaves.spawn(x, y, {
            startRadius: 0,
            maxRadius: radius,
            speed: radius * 2,
            lineWidth: 3,
            color: color,
            life: 0.5,
        });
        // Secondary delayed ring
        setTimeout(() => {
            RingWaves.spawn(x, y, {
                startRadius: 0,
                maxRadius: radius * 0.7,
                speed: radius * 1.5,
                lineWidth: 2,
                color: color,
                life: 0.4,
            });
        }, 100);
    },

    updateAll(dt) {
        // Particles
        GameState.particles = GameState.particles.filter(p => p.update(dt));

        // Floating texts
        GameState.floatingTexts = GameState.floatingTexts.filter(ft => {
            if (ft.vx) ft.x += ft.vx;
            ft.y += ft.vy;
            ft.life -= dt;

            // Scale-up animation countdown
            if (ft.scaleAnim > 0) {
                ft.scaleAnim -= dt;
                if (ft.scaleAnim < 0) ft.scaleAnim = 0;
            }

            return ft.life > 0;
        });

        // Beams
        GameState.beams = GameState.beams.filter(b => {
            b.life -= dt;
            return b.life > 0;
        });

        // Sub-systems
        RingWaves.update(dt);
        GroundDecals.update(dt);
        ScreenEffects.update(dt);
    },

    drawAll(ctx) {
        // Ground decals (drawn first, under everything)
        GroundDecals.draw(ctx);

        // Ring waves
        RingWaves.draw(ctx);

        // Beams
        for (const b of GameState.beams) {
            const alpha = clamp(b.life / b.maxLife, 0, 1);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = b.color;
            ctx.lineWidth = b.width * alpha;
            ctx.shadowColor = b.color;
            ctx.shadowBlur = b.width * 2;
            ctx.beginPath();
            ctx.moveTo(b.x1, b.y1);
            ctx.lineTo(b.x2, b.y2);
            ctx.stroke();
            ctx.restore();
        }

        // Particles
        for (const p of GameState.particles) {
            p.draw(ctx);
        }

        // Floating texts
        for (const ft of GameState.floatingTexts) {
            const alpha = clamp(ft.life / ft.maxLife, 0, 1);
            const fontFamily = ft.fontFamily || 'Orbitron, sans-serif';
            const isBold = ft.bold !== false;

            // Scale-up animation: start bigger and shrink to normal
            let scaleFactor = 1.0;
            if (ft.scaleAnim > 0) {
                scaleFactor = 1.0 + ft.scaleAnim * 8; // starts scaled up, then returns to 1x
            }

            // Critical hit style
            if (ft.isCrit) {
                scaleFactor *= 1.3;
            }

            const fontSize = ft.size * scaleFactor;

            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.font = `${isBold ? 'bold ' : ''}${Math.round(fontSize)}px ${fontFamily}`;
            ctx.textAlign = 'center';

            // Outline effect for important text
            if (ft.outline) {
                ctx.strokeStyle = ft.outlineColor || 'rgba(0,0,0,0.9)';
                ctx.lineWidth = 3;
                ctx.strokeText(ft.text, ft.x, ft.y);
            }

            ctx.fillStyle = ft.color;
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = 4;
            ctx.fillText(ft.text, ft.x, ft.y);
            ctx.restore();
        }
    },
};
