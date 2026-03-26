// ===== RESEARCH TREE =====
export const RESEARCH = {
    offense: {
        name: 'OFFENSE', icon: '\u2694',
        nodes: [
            // Row 1
            [
                { id: 'sharp', name: 'Sharpened Tips', desc: '+5% damage for all towers', cost: 1, effect: { dmgMult: 0.05 }, icon: '\u{1F5E1}' },
                { id: 'quick', name: 'Quick Hands', desc: '+3% fire rate for all towers', cost: 1, effect: { rateMult: 0.03 }, icon: '\u{23F1}' },
                { id: 'criteye', name: 'Critical Eye', desc: '+3% crit chance for all towers', cost: 1, effect: { critChance: 0.03 }, icon: '\u{1F441}' },
            ],
            // Row 2
            [
                { id: 'heavy', name: 'Heavy Ordnance', desc: '+8% damage for all towers', cost: 2, effect: { dmgMult: 0.08 }, requires: ['sharp'], icon: '\u{1F4A3}' },
                { id: 'rapid', name: 'Rapid Fire', desc: '+5% fire rate', cost: 2, effect: { rateMult: 0.05 }, requires: ['quick'], icon: '\u{26A1}' },
                { id: 'vital', name: 'Vital Strikes', desc: '+5% crit, +20% crit dmg', cost: 2, effect: { critChance: 0.05, critDmg: 0.2 }, requires: ['criteye'], icon: '\u{2620}' },
            ],
            // Row 3
            [
                { id: 'optics', name: 'Extended Optics', desc: '+10% range for all towers', cost: 3, effect: { rangeMult: 0.10 }, requires: ['heavy', 'rapid'], icon: '\u{1F52D}' },
                { id: 'elemental', name: 'Elemental Mastery', desc: 'Elemental effects last 20% longer', cost: 3, effect: { effectDuration: 0.2 }, requires: ['rapid', 'vital'], icon: '\u{1F525}' },
                { id: 'armorpierce', name: 'Armor Piercing', desc: 'All towers ignore 10% armor', cost: 3, effect: { armorPierce: 0.1 }, requires: ['heavy', 'vital'], icon: '\u{1F6E1}' },
            ],
            // Row 4
            [
                { id: 'dualmastery', name: 'Dual Mastery', desc: 'Both paths can reach Tier 3. Only one reaches 4-5.', cost: 4, effect: { dualMastery: true }, requires: ['optics', 'elemental'], icon: '\u{2B50}' },
                { id: 'crosstrain', name: 'Cross-Training', desc: 'Synergy bonuses 50% stronger', cost: 4, effect: { synergyMult: 0.5 }, requires: ['elemental', 'armorpierce'], icon: '\u{1F91D}' },
                { id: 'overclock', name: 'Overclock Protocol', desc: 'Overclock recovery 2s faster', cost: 4, effect: { overclockRecovery: 2 }, requires: ['optics', 'armorpierce'], icon: '\u{2699}' },
            ],
            // Row 5
            [
                { id: 'apex', name: 'Apex Predator', desc: 'All towers gain +75 bonus kills toward mastery', cost: 5, effect: { masteryBonus: 75 }, requires: ['dualmastery', 'crosstrain'], icon: '\u{1F451}' },
                { id: 'ultcalib', name: 'Ultimate Calibration', desc: 'Tier 5 abilities cooldown 25% faster', cost: 5, effect: { ultimateCdr: 0.25 }, requires: ['crosstrain', 'overclock'], icon: '\u{1F527}' },
                { id: 'warmachine', name: 'War Machine', desc: '+15% dmg, +10% rate. Towers cost 5% more', cost: 5, effect: { dmgMult: 0.15, rateMult: 0.10, costMult: 0.05 }, requires: ['dualmastery', 'overclock'], icon: '\u{1F916}' },
            ],
        ],
    },
    defense: {
        name: 'DEFENSE', icon: '\u{1F6E1}',
        nodes: [
            [
                { id: 'reinforce', name: 'Reinforced Gates', desc: '+3 starting lives', cost: 1, effect: { bonusLives: 3 }, icon: '\u{1F6AA}' },
                { id: 'harden', name: 'Tower Hardening', desc: 'Towers immune to damage', cost: 1, effect: { towerImmune: true }, icon: '\u{1F3F0}' },
                { id: 'veteran', name: 'Veteran Guards', desc: 'Leaked enemies deal 1 less life', cost: 1, effect: { reducedLeak: 1 }, icon: '\u{1F482}' },
            ],
            [
                { id: 'fortify', name: 'Fortified Walls', desc: '+5 starting lives', cost: 2, effect: { bonusLives: 5 }, requires: ['reinforce'], icon: '\u{1F9F1}' },
                { id: 'laststand', name: 'Last Stand', desc: 'At 5 lives, +20% dmg for 30s', cost: 2, effect: { lastStand: true }, requires: ['harden'], icon: '\u{1F4AA}' },
                { id: 'frostarmor', name: 'Frost Armor', desc: 'Tower damage freezes attackers', cost: 2, effect: { frostArmor: true }, requires: ['veteran'], icon: '\u{2744}' },
            ],
            [
                { id: 'lifeins', name: 'Life Insurance', desc: '+10 gold when you lose a life', cost: 3, effect: { lifeInsGold: 10 }, requires: ['fortify', 'laststand'], icon: '\u{1F4B0}' },
                { id: 'emergency', name: 'Emergency Protocol', desc: 'At 10 lives, abilities 50% faster', cost: 3, effect: { emergencyCdr: 0.5 }, requires: ['laststand', 'frostarmor'], icon: '\u{1F6A8}' },
                { id: 'secondchance', name: 'Second Chance', desc: 'Survive once at 1 life', cost: 3, effect: { secondChance: true }, requires: ['fortify', 'frostarmor'], icon: '\u{1F31F}' },
            ],
            [
                { id: 'immortal', name: 'Immortal Bastion', desc: '+10 lives, invuln for 10s after hit', cost: 4, effect: { bonusLives: 10, invulnWindow: 10 }, requires: ['lifeins', 'emergency'], icon: '\u{1F3F0}' },
                { id: 'phoenix', name: 'Phoenix Protocol', desc: '25% chance sold tower respawns', cost: 4, effect: { phoenixChance: 0.25 }, requires: ['emergency', 'secondchance'], icon: '\u{1F426}' },
                { id: 'unbreakable', name: 'Unbreakable', desc: 'Shield blocks first 5 leaks', cost: 4, effect: { startShield: 5 }, requires: ['lifeins', 'secondchance'], icon: '\u{1F6E1}' },
            ],
        ],
    },
    economy: {
        name: 'ECONOMY', icon: '\u{1F4B0}',
        nodes: [
            [
                { id: 'warchest', name: 'War Chest', desc: '+50 starting gold', cost: 1, effect: { bonusGold: 50 }, icon: '\u{1F4B0}' },
                { id: 'efficient', name: 'Efficient Builder', desc: 'All towers cost 3% less', cost: 1, effect: { costReduce: 0.03 }, icon: '\u{1F6E0}' },
                { id: 'interest', name: 'Interest Rate', desc: '+1% interest rate', cost: 1, effect: { interestRate: 0.01 }, icon: '\u{1F4C8}' },
            ],
            [
                { id: 'trade', name: 'Trade Routes', desc: '+75 starting gold', cost: 2, effect: { bonusGold: 75 }, requires: ['warchest'], icon: '\u{1F6A2}' },
                { id: 'bulk', name: 'Bulk Orders', desc: 'Towers cost 5% less', cost: 2, effect: { costReduce: 0.05 }, requires: ['efficient'], icon: '\u{1F4E6}' },
                { id: 'banking', name: 'Banking', desc: 'Interest cap +25 gold', cost: 2, effect: { interestCap: 25 }, requires: ['interest'], icon: '\u{1F3E6}' },
            ],
            [
                { id: 'bounty', name: 'Bounty System', desc: 'Bosses reward 50% more gold', cost: 3, effect: { bossGold: 0.5 }, requires: ['trade', 'bulk'], icon: '\u{1F4B5}' },
                { id: 'salvage', name: 'Salvage Expert', desc: 'Sell value 80% (from 70%)', cost: 3, effect: { sellRefund: 0.8 }, requires: ['bulk', 'banking'], icon: '\u{267B}' },
                { id: 'wavebonus', name: 'Wave Bonus', desc: 'Wave completion bonus doubled', cost: 3, effect: { waveBonusMult: 2 }, requires: ['trade', 'banking'], icon: '\u{1F3C6}' },
            ],
            [
                { id: 'goldrush', name: 'Gold Rush', desc: 'Every 5 waves, +100 gold', cost: 4, effect: { goldRush: 100 }, requires: ['bounty', 'salvage'], icon: '\u{1F4B4}' },
                { id: 'upgdiscount', name: 'Upgrade Discount', desc: 'Upgrades cost 15% less', cost: 4, effect: { upgradeDiscount: 0.15 }, requires: ['salvage', 'wavebonus'], icon: '\u{1F3F7}' },
                { id: 'portfolio', name: 'Investment Portfolio', desc: 'Compound interest on interest', cost: 4, effect: { compoundInterest: true }, requires: ['bounty', 'wavebonus'], icon: '\u{1F4CA}' },
            ],
        ],
    },
    knowledge: {
        name: 'KNOWLEDGE', icon: '\u{1F4DA}',
        nodes: [
            [
                { id: 'scholar', name: 'Scholar', desc: '+1 research point per map clear', cost: 1, effect: { bonusRP: 1 }, icon: '\u{1F393}' },
                { id: 'scouting', name: 'Scouting Report', desc: 'See enemy HP/stats in preview', cost: 1, effect: { scoutingReport: true }, icon: '\u{1F50D}' },
                { id: 'blueprint', name: 'Draft Protocols', desc: 'Endless mutator draft gains 1 reroll', cost: 1, effect: { draftReroll: 1 }, icon: '\u{1F4D0}' },
            ],
            [
                { id: 'advscholar', name: 'Advanced Scholar', desc: '+2 RP per map clear', cost: 2, effect: { bonusRP: 2 }, requires: ['scholar'], icon: '\u{1F4D6}' },
                { id: 'mapmastery', name: 'Endless Mastery', desc: 'Endless milestone rewards +50%', cost: 2, effect: { endlessMilestoneBoost: 0.5 }, requires: ['scouting'], icon: '\u{1F5FA}' },
                { id: 'tactical', name: 'Weekly Analysis', desc: 'Weekly first-victory RP bonus +50%', cost: 2, effect: { weeklyRpMult: 0.5 }, requires: ['blueprint'], icon: '\u{1F4FA}' },
            ],
            [
                { id: 'achiever', name: 'Achievement Hunter', desc: 'Achievements grant +1 RP', cost: 3, effect: { achievementRP: true }, requires: ['advscholar', 'mapmastery'], icon: '\u{1F3C5}' },
                { id: 'effexpert', name: 'Efficiency Expert', desc: '100+ kill towers earn 50% more gold', cost: 3, effect: { killGoldBonus: 0.5 }, requires: ['mapmastery', 'tactical'], icon: '\u{1F4B9}' },
                { id: 'orbcollect', name: 'Combat Analytics', desc: 'Elite/Boss kills reduce ability cooldowns by 0.6s', cost: 3, effect: { abilityCdOnEliteKill: 0.6 }, requires: ['advscholar', 'tactical'], icon: '\u{1F4D5}' },
            ],
            [
                { id: 'grandscholar', name: 'Grand Scholar', desc: '+3 RP per map clear', cost: 4, effect: { bonusRP: 3 }, requires: ['achiever', 'effexpert'], icon: '\u{1F9D9}' },
                { id: 'towerdna', name: 'Tower DNA', desc: 'Mastery bonuses 50% stronger', cost: 4, effect: { masteryMult: 0.5 }, requires: ['effexpert', 'orbcollect'], icon: '\u{1F9EC}' },
                { id: 'omniscience', name: 'Omniscience', desc: 'All enemies visible, see pathing', cost: 4, effect: { omniscience: true }, requires: ['achiever', 'orbcollect'], icon: '\u{1F4A0}' },
            ],
        ],
    },
};
