import { ENEMIES } from './enemies.js';

// ===== WAVE DEFINITIONS (per map, auto-generated from templates) =====
// Each difficulty group has its own unique enemy pool and wave patterns
export function generateWaves(mapIndex, waveCount) {
    const waves = [];
    const diffGroup = Math.floor(mapIndex / 5);

    for (let w = 1; w <= waveCount; w++) {
        const wave = { enemies: [], delay: 0.6 };
        const diff = diffGroup * 0.3 + (mapIndex % 5) * 0.08;
        // Steeper HP scaling: 28% per wave + exponential kicker past wave 8
        const linearScale = 1 + (w - 1) * 0.28 + diff * 0.25;
        const expKicker = w > 8 ? Math.pow(1.04, w - 8) - 1 : 0;
        const hpScale = linearScale + expKicker;
        const countBase = Math.floor(6 + w * 1.5 + diff * 2.5);

        if (diffGroup === 0) {
            // ===== EASY: Grunt, Scout, Swarmling, Medic, Boss =====
            if (w % 10 === 0) {
                wave.enemies.push({ type: 'boss', count: 1, hpMult: hpScale * 1.2, delay: 2.0 });
                wave.enemies.push({ type: 'basic', count: Math.floor(countBase * 0.3), hpMult: hpScale, delay: 0.6 });
            } else if (w % 5 === 0) {
                // Medic-supported push
                wave.enemies.push({ type: 'basic', count: Math.floor(countBase * 0.5), hpMult: hpScale, delay: 0.5 });
                wave.enemies.push({ type: 'healer', count: 1 + Math.floor(w / 15), hpMult: hpScale, delay: 1.0 });
                wave.enemies.push({ type: 'fast', count: Math.floor(countBase * 0.2), hpMult: hpScale * 0.7, delay: 0.4 });
            } else if (w % 3 === 0) {
                // Swarm wave
                wave.enemies.push({ type: 'swarm', count: countBase * 2, hpMult: hpScale * 0.5, delay: 0.2 });
            } else if (w % 7 === 0) {
                // Scout rush
                wave.enemies.push({ type: 'fast', count: Math.floor(countBase * 0.7), hpMult: hpScale * 0.8, delay: 0.35 });
                wave.enemies.push({ type: 'swarm', count: Math.floor(countBase * 0.5), hpMult: hpScale * 0.4, delay: 0.2 });
            } else {
                // Standard grunts + scouts
                wave.enemies.push({ type: 'basic', count: countBase, hpMult: hpScale, delay: 0.5 });
                if (w > 3) wave.enemies.push({ type: 'fast', count: Math.floor(countBase * 0.25), hpMult: hpScale * 0.7, delay: 0.4 });
            }

        } else if (diffGroup === 1) {
            // ===== NORMAL: Grunt, Brute, Guardian, Medic, Splitter, Boss =====
            if (w % 10 === 0) {
                wave.enemies.push({ type: 'boss', count: 1 + Math.floor(w / 25), hpMult: hpScale * 1.5, delay: 2.0 });
                wave.enemies.push({ type: 'heavy', count: Math.floor(countBase * 0.3), hpMult: hpScale, delay: 0.8 });
            } else if (w % 5 === 0) {
                // Armored push with healer support
                wave.enemies.push({ type: 'heavy', count: Math.floor(countBase * 0.4), hpMult: hpScale, delay: 0.8 });
                wave.enemies.push({ type: 'shield', count: Math.floor(countBase * 0.2), hpMult: hpScale, delay: 0.9 });
                wave.enemies.push({ type: 'healer', count: 2, hpMult: hpScale, delay: 1.0 });
            } else if (w % 7 === 0) {
                // Guardian wall
                wave.enemies.push({ type: 'shield', count: Math.floor(countBase * 0.5), hpMult: hpScale * 1.2, delay: 0.7 });
                wave.enemies.push({ type: 'basic', count: Math.floor(countBase * 0.3), hpMult: hpScale, delay: 0.5 });
            } else if (w % 11 === 0) {
                // Splitter wave
                wave.enemies.push({ type: 'splitter', count: Math.floor(countBase * 0.5), hpMult: hpScale, delay: 0.8 });
                wave.enemies.push({ type: 'heavy', count: Math.floor(countBase * 0.2), hpMult: hpScale, delay: 0.8 });
            } else if (w % 3 === 0) {
                // Brute march
                wave.enemies.push({ type: 'heavy', count: Math.floor(countBase * 0.4), hpMult: hpScale, delay: 0.9 });
                wave.enemies.push({ type: 'basic', count: Math.floor(countBase * 0.4), hpMult: hpScale, delay: 0.5 });
            } else {
                // Standard mixed
                wave.enemies.push({ type: 'basic', count: countBase, hpMult: hpScale, delay: 0.5 });
                if (w > 3) wave.enemies.push({ type: 'heavy', count: Math.floor(countBase * 0.15), hpMult: hpScale, delay: 0.8 });
                if (w > 6) wave.enemies.push({ type: 'shield', count: 1, hpMult: hpScale, delay: 1.0 });
            }

        } else if (diffGroup === 2) {
            // ===== HARD: Shadow, Phantom, Berserker, Brute, Buzzer, Boss =====
            if (w % 10 === 0) {
                wave.enemies.push({ type: 'boss', count: 1 + Math.floor(w / 20), hpMult: hpScale * 1.8, delay: 2.0 });
                wave.enemies.push({ type: 'berserker', count: Math.floor(countBase * 0.2), hpMult: hpScale, delay: 0.9 });
                wave.enemies.push({ type: 'heavy', count: Math.floor(countBase * 0.2), hpMult: hpScale, delay: 0.8 });
            } else if (w % 5 === 0) {
                // Shadow ambush
                wave.enemies.push({ type: 'stealth', count: Math.floor(countBase * 0.4), hpMult: hpScale, delay: 0.6 });
                wave.enemies.push({ type: 'ghost', count: Math.floor(countBase * 0.3), hpMult: hpScale, delay: 0.7 });
                wave.enemies.push({ type: 'heavy', count: Math.floor(countBase * 0.2), hpMult: hpScale, delay: 0.8 });
            } else if (w % 7 === 0) {
                // Berserker rage
                wave.enemies.push({ type: 'berserker', count: Math.floor(countBase * 0.5), hpMult: hpScale, delay: 0.8 });
                wave.enemies.push({ type: 'heavy', count: Math.floor(countBase * 0.2), hpMult: hpScale * 1.2, delay: 0.9 });
            } else if (w % 8 === 0) {
                // Buzzer swarm
                wave.enemies.push({ type: 'swarmfast', count: countBase * 3, hpMult: hpScale * 0.4, delay: 0.1 });
            } else if (w % 6 === 0) {
                // Disruptor support wave
                wave.enemies.push({ type: 'disruptor', count: Math.max(1, Math.floor(countBase * 0.18)), hpMult: hpScale, delay: 0.8 });
                wave.enemies.push({ type: 'heavy', count: Math.floor(countBase * 0.3), hpMult: hpScale, delay: 0.8 });
            } else if (w % 9 === 0) {
                // Toxic pressure wave
                wave.enemies.push({ type: 'toxic', count: Math.max(1, Math.floor(countBase * 0.22)), hpMult: hpScale, delay: 0.8 });
                wave.enemies.push({ type: 'stealth', count: Math.floor(countBase * 0.3), hpMult: hpScale, delay: 0.6 });
            } else if (w % 13 === 0) {
                // Tunneler ambush
                if (typeof ENEMIES !== 'undefined' && ENEMIES.tunneler) {
                    wave.enemies.push({ type: 'tunneler', count: Math.floor(countBase * 0.4), hpMult: hpScale, delay: 0.7 });
                    wave.enemies.push({ type: 'heavy', count: Math.floor(countBase * 0.2), hpMult: hpScale, delay: 0.8 });
                } else {
                    wave.enemies.push({ type: 'ghost', count: Math.floor(countBase * 0.6), hpMult: hpScale, delay: 0.6 });
                    wave.enemies.push({ type: 'stealth', count: Math.floor(countBase * 0.3), hpMult: hpScale, delay: 0.7 });
                }
            } else if (w % 3 === 0) {
                // Stealth wave
                wave.enemies.push({ type: 'stealth', count: Math.floor(countBase * 0.5), hpMult: hpScale, delay: 0.6 });
                wave.enemies.push({ type: 'heavy', count: Math.floor(countBase * 0.2), hpMult: hpScale, delay: 0.8 });
            } else {
                // Mixed hard
                wave.enemies.push({ type: 'heavy', count: Math.floor(countBase * 0.4), hpMult: hpScale, delay: 0.7 });
                wave.enemies.push({ type: 'stealth', count: Math.floor(countBase * 0.2), hpMult: hpScale, delay: 0.6 });
                if (w > 5) wave.enemies.push({ type: 'berserker', count: Math.floor(countBase * 0.1), hpMult: hpScale, delay: 0.9 });
            }

        } else {
            // ===== NIGHTMARE: ALL enemy types, elite variants, double modifiers =====
            if (w % 10 === 0) {
                // Multi-boss wave
                wave.enemies.push({ type: 'boss', count: 1 + Math.floor(w / 15), hpMult: hpScale * 2.5, delay: 1.5 });
                wave.enemies.push({ type: 'berserker', count: Math.floor(countBase * 0.3), hpMult: hpScale * 1.3, delay: 0.7 });
                wave.enemies.push({ type: 'ghost', count: Math.floor(countBase * 0.2), hpMult: hpScale, delay: 0.6 });
            } else if (w % 5 === 0) {
                // Everything-at-once wave
                wave.enemies.push({ type: 'heavy', count: Math.floor(countBase * 0.25), hpMult: hpScale * 1.3, delay: 0.7 });
                wave.enemies.push({ type: 'stealth', count: Math.floor(countBase * 0.2), hpMult: hpScale, delay: 0.5 });
                wave.enemies.push({ type: 'berserker', count: Math.floor(countBase * 0.2), hpMult: hpScale * 1.2, delay: 0.8 });
                wave.enemies.push({ type: 'splitter', count: Math.floor(countBase * 0.15), hpMult: hpScale, delay: 0.8 });
                wave.enemies.push({ type: 'healer', count: 2, hpMult: hpScale * 1.5, delay: 1.0 });
            } else if (w % 7 === 0) {
                // Invisible army
                wave.enemies.push({ type: 'ghost', count: Math.floor(countBase * 0.4), hpMult: hpScale * 1.2, delay: 0.5 });
                wave.enemies.push({ type: 'stealth', count: Math.floor(countBase * 0.4), hpMult: hpScale, delay: 0.5 });
                wave.enemies.push({ type: 'healer', count: 2, hpMult: hpScale, delay: 1.0 });
            } else if (w % 8 === 0) {
                // Buzzer + berserker combo
                wave.enemies.push({ type: 'swarmfast', count: countBase * 3, hpMult: hpScale * 0.5, delay: 0.1 });
                wave.enemies.push({ type: 'berserker', count: Math.floor(countBase * 0.3), hpMult: hpScale * 1.2, delay: 0.7 });
                wave.enemies.push({ type: 'disruptor', count: Math.max(1, Math.floor(countBase * 0.12)), hpMult: hpScale * 1.1, delay: 0.9 });
            } else if (w % 3 === 0) {
                // Splitter chaos
                wave.enemies.push({ type: 'splitter', count: Math.floor(countBase * 0.5), hpMult: hpScale * 1.2, delay: 0.6 });
                wave.enemies.push({ type: 'shield', count: Math.floor(countBase * 0.2), hpMult: hpScale * 1.3, delay: 0.8 });
                wave.enemies.push({ type: 'swarm', count: countBase, hpMult: hpScale * 0.5, delay: 0.15 });
            } else if (w % 9 === 0) {
                wave.enemies.push({ type: 'toxic', count: Math.max(2, Math.floor(countBase * 0.18)), hpMult: hpScale * 1.2, delay: 0.9 });
                wave.enemies.push({ type: 'heavy', count: Math.floor(countBase * 0.25), hpMult: hpScale * 1.2, delay: 0.8 });
            } else if (w % 11 === 0) {
                // Elite berserker rush
                wave.enemies.push({ type: 'berserker', count: Math.floor(countBase * 0.6), hpMult: hpScale * 1.5, delay: 0.6 });
                wave.enemies.push({ type: 'heavy', count: Math.floor(countBase * 0.3), hpMult: hpScale * 1.5, delay: 0.7 });
            } else if (w % 13 === 0) {
                // Sapper gold heist
                wave.enemies.push({ type: 'sapper', count: Math.floor(countBase * 0.5), hpMult: hpScale * 0.8, delay: 0.3 });
                wave.enemies.push({ type: 'fast', count: Math.floor(countBase * 0.4), hpMult: hpScale * 0.7, delay: 0.3 });
                wave.enemies.push({ type: 'stealth', count: Math.floor(countBase * 0.2), hpMult: hpScale, delay: 0.5 });
            } else if (w % 14 === 0) {
                // Mirror + Summoner nightmare
                wave.enemies.push({ type: 'mirror', count: Math.floor(countBase * 0.4), hpMult: hpScale * 1.2, delay: 0.6 });
                wave.enemies.push({ type: 'summoner', count: Math.max(2, Math.floor(countBase * 0.15)), hpMult: hpScale * 1.3, delay: 1.0 });
                wave.enemies.push({ type: 'shield', count: Math.floor(countBase * 0.15), hpMult: hpScale * 1.2, delay: 0.8 });
            } else if (w % 15 === 0 && w % 5 !== 0) {
                // Tunneler invasion
                wave.enemies.push({ type: 'tunneler', count: Math.floor(countBase * 0.5), hpMult: hpScale * 1.3, delay: 0.7 });
                wave.enemies.push({ type: 'heavy', count: Math.floor(countBase * 0.3), hpMult: hpScale * 1.4, delay: 0.8 });
            } else {
                // Nightmare standard — everything mixed (including new types)
                const types = ['basic', 'fast', 'heavy', 'stealth', 'berserker', 'ghost', 'splitter', 'disruptor', 'toxic', 'tunneler', 'mirror', 'sapper', 'summoner'];
                const pick1 = types[w % types.length];
                const pick2 = types[(w * 3 + 1) % types.length];
                wave.enemies.push({ type: pick1, count: Math.floor(countBase * 0.5), hpMult: hpScale * 1.2, delay: 0.5 });
                wave.enemies.push({ type: pick2, count: Math.floor(countBase * 0.3), hpMult: hpScale, delay: 0.6 });
                if (w > 5) wave.enemies.push({ type: 'shield', count: Math.floor(countBase * 0.1), hpMult: hpScale * 1.3, delay: 0.9 });
            }
        }

        waves.push(wave);
    }
    return waves;
}
