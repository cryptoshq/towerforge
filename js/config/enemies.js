// ===== ENEMY TYPES =====
export const ENEMIES = {
    basic: { name: 'Grunt', hp: 110, speed: 1.4, armor: 0, reward: 5, size: 10, color: '#e04040', desc: 'Standard enemy' },
    fast: { name: 'Scout', hp: 65, speed: 2.5, armor: 0, reward: 6, size: 8, color: '#40e0e0', desc: 'Fast but fragile' },
    heavy: { name: 'Brute', hp: 340, speed: 0.8, armor: 5, reward: 14, size: 14, color: '#8a6a4a', desc: 'Slow, heavy armor' },
    healer: { name: 'Medic', hp: 140, speed: 1.1, armor: 0, reward: 16, size: 10, color: '#40e040', desc: 'Heals nearby enemies',
        healRadius: 80, healRate: 8, healInterval: 1.0, healPulseColor: '#80ff80' },
    shield: { name: 'Guardian', hp: 170, speed: 1.0, armor: 1, reward: 13, size: 12, color: '#4080e0', desc: 'Shields nearby enemies' },
    swarm: { name: 'Swarmling', hp: 28, speed: 2.0, armor: 0, reward: 2, size: 6, color: '#e0e040', desc: 'Weak but numerous' },
    stealth: { name: 'Shadow', hp: 120, speed: 1.6, armor: 0, reward: 12, size: 9, color: '#8040a0', desc: 'Periodically invisible' },
    boss: { name: 'Overlord', hp: 2800, speed: 0.55, armor: 8, reward: 120, size: 20, color: '#ff2020', desc: 'Massive boss enemy', isBoss: true },

    // New enemy types
    splitter: {
        name: 'Splitter', hp: 220, speed: 1.1, armor: 2, reward: 12, size: 12, color: '#e0a040',
        desc: 'Splits into 2 smaller copies on death',
        splitCount: 2, splitHpRatio: 0.4, splitSpeedMult: 1.3, splitSizeRatio: 0.6,
        splitReward: 4, splitColor: '#d09030',
    },
    ghost: {
        name: 'Phantom', hp: 150, speed: 1.5, armor: 0, reward: 14, size: 9, color: '#a060d0',
        desc: 'Periodically phases invisible and takes reduced damage',
        phaseInterval: 4.0, phaseDuration: 2.0, phaseReduction: 0.8,
        phaseColor: 'rgba(160, 96, 208, 0.3)', phaseGlowColor: '#c080e0',
    },
    berserker: {
        name: 'Berserker', hp: 240, speed: 1.0, armor: 2, reward: 16, size: 13, color: '#e02020',
        desc: 'Enrages at low health — speeds up and gains armor',
        enrageThreshold: 0.4, enrageSpeedMult: 2.0, enrageArmorBonus: 4,
        enrageColor: '#ff4040', enrageGlowColor: '#ff0000', enrageSizeMult: 1.15,
    },
    swarmfast: {
        name: 'Buzzer', hp: 18, speed: 3.2, armor: 0, reward: 1, size: 5, color: '#c0e040',
        desc: 'Extremely fast swarm unit — nearly impossible to hit one-by-one',
        spawnGroupSize: 15, spawnDelay: 0.1, zigzagAmplitude: 8, zigzagFrequency: 4,
    },
    disruptor: {
        name: 'Disruptor', hp: 190, speed: 1.3, armor: 2, reward: 18, size: 11, color: '#ff9a6a',
        desc: 'Emits EMP pulses that disable nearby towers briefly',
        disruptRadius: 150, disruptDuration: 1.8, disruptInterval: 2.5,
    },
    toxic: {
        name: 'Toxic Carrier', hp: 175, speed: 1.1, armor: 1, reward: 17, size: 11, color: '#80d060',
        desc: 'Releases corrosive fumes that reduce nearby tower damage',
        toxicRadius: 140, toxicDuration: 2.8, toxicInterval: 3.0, toxicDamageMult: 0.75,
    },
};
