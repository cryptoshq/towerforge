// ===== UTILITY FUNCTIONS =====
function dist(a, b) {
    const dx = a.x - b.x, dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function rand(min, max) { return Math.random() * (max - min) + min; }
function randInt(min, max) { return Math.floor(rand(min, max + 1)); }
function choose(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function angleBetween(a, b) {
    return Math.atan2(b.y - a.y, b.x - a.x);
}

function pointInRect(px, py, rx, ry, rw, rh) {
    return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
}

function gridToWorld(col, row) {
    return {
        x: col * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
        y: row * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2
    };
}

function worldToGrid(x, y) {
    return {
        col: Math.floor(x / CONFIG.TILE_SIZE),
        row: Math.floor(y / CONFIG.TILE_SIZE)
    };
}

function formatGold(n) {
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return Math.floor(n).toString();
}

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

// Easing functions
const ease = {
    linear: t => t,
    inQuad: t => t * t,
    outQuad: t => t * (2 - t),
    inOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    outBack: t => { const s = 1.70158; return --t * t * ((s + 1) * t + s) + 1; },
    outElastic: t => {
        if (t === 0 || t === 1) return t;
        return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1;
    },
};

// Color helpers
function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
}

function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
}

function colorLerp(c1, c2, t) {
    const a = hexToRgb(c1), b = hexToRgb(c2);
    return rgbToHex(lerp(a.r, b.r, t), lerp(a.g, b.g, t), lerp(a.b, b.b, t));
}

function colorAlpha(hex, alpha) {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r},${g},${b},${alpha})`;
}

function brighten(hex, amount) {
    const { r, g, b } = hexToRgb(hex);
    return rgbToHex(r + amount, g + amount, b + amount);
}

// Polygon drawing helper
function drawPoly(ctx, cx, cy, sides, radius, rotation = 0) {
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
        const a = (Math.PI * 2 / sides) * i + rotation;
        const x = cx + Math.cos(a) * radius;
        const y = cy + Math.sin(a) * radius;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
}

// Catmull-Rom spline interpolation for smooth paths
function catmullRomPoint(p0, p1, p2, p3, t) {
    const t2 = t * t;
    const t3 = t2 * t;
    return {
        x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3)
    };
}

function generateSmoothPath(waypoints, pointsPerSegment = 12) {
    if (waypoints.length < 2) return [...waypoints];
    const result = [];
    const pts = waypoints;
    for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[Math.max(i - 1, 0)];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[Math.min(i + 2, pts.length - 1)];
        const steps = (i === 0 || i === pts.length - 2) ? Math.max(4, pointsPerSegment >> 1) : pointsPerSegment;
        for (let s = 0; s < steps; s++) {
            const t = s / steps;
            result.push(catmullRomPoint(p0, p1, p2, p3, t));
        }
    }
    result.push(pts[pts.length - 1]);
    return result;
}

function getIsoWeekInfo(date = new Date()) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const day = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    const year = d.getUTCFullYear();
    const weekStr = String(week).padStart(2, '0');
    return {
        year,
        week,
        id: `${year}-W${weekStr}`,
    };
}

function hashStringToSeed(str) {
    let hash = 2166136261;
    for (let i = 0; i < str.length; i++) {
        hash ^= str.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}

function createSeededRng(seed) {
    let t = (seed >>> 0) || 1;
    return function rng() {
        t += 0x6D2B79F5;
        let r = Math.imul(t ^ (t >>> 15), 1 | t);
        r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
        return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
}

// Screen shake disabled — kept as stubs so callers don't break
let shakeX = 0, shakeY = 0, shakeIntensity = 0, shakeDecay = 0.9;
function addScreenShake(intensity) { /* disabled */ }
function updateScreenShake() { /* disabled */ }
