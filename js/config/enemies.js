// ===== ENEMY TYPES =====
export const ENEMIES = {
    basic: { name: 'Grunt', hp: 40, speed: 1.2, armor: 0, reward: 5, size: 10, color: '#e04040', desc: 'Standard enemy' },
    fast: { name: 'Scout', hp: 25, speed: 2.2, armor: 0, reward: 6, size: 8, color: '#40e0e0', desc: 'Fast but fragile' },
    heavy: { name: 'Brute', hp: 120, speed: 0.7, armor: 3, reward: 12, size: 14, color: '#8a6a4a', desc: 'Slow, heavy armor' },
    healer: { name: 'Medic', hp: 50, speed: 1.0, armor: 0, reward: 15, size: 10, color: '#40e040', desc: 'Heals nearby enemies',
        healRadius: 80, healRate: 5, healInterval: 1.0, healPulseColor: '#80ff80' },
    shield: { name: 'Guardian', hp: 60, speed: 0.9, armor: 0, reward: 12, size: 12, color: '#4080e0', desc: 'Shields nearby enemies' },
    swarm: { name: 'Swarmling', hp: 12, speed: 1.8, armor: 0, reward: 2, size: 6, color: '#e0e040', desc: 'Weak but numerous' },
    stealth: { name: 'Shadow', hp: 45, speed: 1.5, armor: 0, reward: 10, size: 9, color: '#8040a0', desc: 'Periodically invisible' },
    boss: { name: 'Overlord', hp: 800, speed: 0.5, armor: 5, reward: 100, size: 20, color: '#ff2020', desc: 'Massive boss enemy', isBoss: true },

    // New enemy types
    splitter: {
        name: 'Splitter', hp: 80, speed: 1.0, armor: 1, reward: 10, size: 12, color: '#e0a040',
        desc: 'Splits into 2 smaller copies on death',
        splitCount: 2, splitHpRatio: 0.4, splitSpeedMult: 1.3, splitSizeRatio: 0.6,
        splitReward: 3, splitColor: '#d09030',
    },
    ghost: {
        name: 'Phantom', hp: 55, speed: 1.3, armor: 0, reward: 12, size: 9, color: '#a060d0',
        desc: 'Periodically phases invisible and takes reduced damage',
        phaseInterval: 4.0, phaseDuration: 2.0, phaseReduction: 0.8,
        phaseColor: 'rgba(160, 96, 208, 0.3)', phaseGlowColor: '#c080e0',
    },
    berserker: {
        name: 'Berserker', hp: 90, speed: 0.9, armor: 1, reward: 14, size: 13, color: '#e02020',
        desc: 'Enrages at low health — speeds up and gains armor',
        enrageThreshold: 0.4, enrageSpeedMult: 2.0, enrageArmorBonus: 3,
        enrageColor: '#ff4040', enrageGlowColor: '#ff0000', enrageSizeMult: 1.15,
    },
    swarmfast: {
        name: 'Buzzer', hp: 8, speed: 2.8, armor: 0, reward: 1, size: 5, color: '#c0e040',
        desc: 'Extremely fast swarm unit — nearly impossible to hit one-by-one',
        spawnGroupSize: 15, spawnDelay: 0.1, zigzagAmplitude: 8, zigzagFrequency: 4,
    },
    disruptor: {
        name: 'Disruptor', hp: 70, speed: 1.25, armor: 1, reward: 16, size: 11, color: '#ff9a6a',
        desc: 'Emits EMP pulses that disable nearby towers briefly',
        disruptRadius: 150, disruptDuration: 1.5, disruptInterval: 2.8,
    },
    toxic: {
        name: 'Toxic Carrier', hp: 65, speed: 1.05, armor: 0, reward: 15, size: 11, color: '#80d060',
        desc: 'Releases corrosive fumes that reduce nearby tower damage',
        toxicRadius: 140, toxicDuration: 2.8, toxicInterval: 3.2, toxicDamageMult: 0.8,
    },
};
