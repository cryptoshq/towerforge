// ===== PLAYER ABILITIES =====
export const PLAYER_ABILITIES = [
    { id: 'airstrike', name: 'Air Strike', desc: 'Deals 200 damage in target area', cooldown: 30, icon: '\u{2708}', key: 'Q',
        effect: { type: 'aoe', damage: 200, radius: 80 } },
    { id: 'reinforce', name: 'Reinforce', desc: '+5 temporary lives for 20 seconds', cooldown: 45, icon: '\u{1F6E1}', key: 'W',
        effect: { type: 'buff', bonusLives: 5, duration: 20 } },
    { id: 'goldmine', name: 'Gold Mine', desc: 'Earn 100 bonus gold', cooldown: 60, icon: '\u{1F4B0}', key: 'E',
        effect: { type: 'gold', amount: 100 } },
    { id: 'slowfield', name: 'Slow Field', desc: 'Slow all enemies 50% for 8 seconds', cooldown: 40, icon: '\u{2744}', key: 'R',
        effect: { type: 'slow', amount: 0.5, duration: 8 } },
    { id: 'overcharge', name: 'Overcharge', desc: 'All towers +50% damage for 10s', cooldown: 50, icon: '\u{26A1}', key: 'T',
        effect: { type: 'towerbuff', dmgMult: 0.5, duration: 10 } },
];
