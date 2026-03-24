const { chromium } = require('playwright');

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

async function run() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });

    await page.goto(process.env.BASE_URL || 'http://localhost:3000');
    await page.waitForFunction(() => typeof startGame === 'function' && typeof WaveSystem !== 'undefined');

    const factionWave = await page.evaluate(() => {
        MenuSystem.showScreen('game');
        startGame(5);
        GameState.settings.autoStart = false;

        const preview = WaveSystem.getWavePreview(6);
        const preview12 = WaveSystem.getWavePreview(12);
        const preview18 = WaveSystem.getWavePreview(18);
        const previewArc9 = WaveSystem.getWavePreview(9);

        GameState.wave = 5;
        GameState.gamePhase = 'idle';
        WaveSystem.startWave();

        const captainEntry = GameState.waveEnemies.find(entry => entry.isCaptain);

        return {
            waveNow: GameState.wave,
            factionId: WaveSystem.currentFaction ? WaveSystem.currentFaction.id : null,
            captainEntryExists: !!captainEntry,
            captainProfileId: captainEntry ? captainEntry.captainProfileId : null,
            previewFactionId: preview && preview.faction ? preview.faction.id : null,
            previewThreatTags: preview && Array.isArray(preview.threatTags) ? preview.threatTags : [],
            preview12FactionId: preview12 && preview12.faction ? preview12.faction.id : null,
            preview12CaptainTag: !!(preview12 && Array.isArray(preview12.threatTags) && preview12.threatTags.includes('CAPTAIN AURA')),
            preview18FactionId: preview18 && preview18.faction ? preview18.faction.id : null,
            previewArc9Name: previewArc9 && previewArc9.arc ? previewArc9.arc.name : null,
            previewArc9Tags: previewArc9 && Array.isArray(previewArc9.threatTags) ? previewArc9.threatTags : [],
        };
    });

    assert(factionWave.waveNow === 6, `Expected wave 6 start, got ${factionWave.waveNow}`);
    assert(factionWave.factionId === 'siege_foundry', `Expected Siege Foundry faction, got ${factionWave.factionId}`);
    assert(factionWave.captainEntryExists, 'Faction wave should inject a captain entry');
    assert(factionWave.captainProfileId === 'siege_foreman', `Expected siege foreman captain profile, got ${factionWave.captainProfileId}`);
    assert(factionWave.previewFactionId === 'siege_foundry', `Wave preview should include faction id siege_foundry, got ${factionWave.previewFactionId}`);
    assert(factionWave.previewThreatTags.includes('CAPTAIN AURA'), 'Wave preview should include CAPTAIN AURA threat tag');
    assert(factionWave.preview12FactionId === 'veil_swarm', `Expected wave 12 faction veil_swarm, got ${factionWave.preview12FactionId}`);
    assert(factionWave.preview12CaptainTag, 'Wave 12 preview should include CAPTAIN AURA threat tag');
    assert(factionWave.preview18FactionId === 'blight_caravan', `Expected wave 18 faction blight_caravan, got ${factionWave.preview18FactionId}`);
    assert(factionWave.previewArc9Name === 'Mix', `Expected wave 9 arc name Mix, got ${factionWave.previewArc9Name}`);
    assert(factionWave.previewArc9Tags.some(tag => tag.includes('ARC')), 'Wave 9 preview should include wave arc threat tag');

    const cadenceByBand = await page.evaluate(() => {
        MenuSystem.showScreen('game');

        // Easy band (maps 0-4): lighter cadence.
        startGame(0);
        GameState.settings.autoStart = false;
        const easyW6 = WaveSystem.getWavePreview(6);
        const easyW8 = WaveSystem.getWavePreview(8);
        const easyW4 = WaveSystem.getWavePreview(4);
        const easyW5 = WaveSystem.getWavePreview(5);

        // Hard band (maps 10-14): denser cadence.
        startGame(10);
        GameState.settings.autoStart = false;
        const hardW5 = WaveSystem.getWavePreview(5);
        const hardW7 = WaveSystem.getWavePreview(7);

        // Nightmare band (maps 15-19): highest cadence.
        startGame(15);
        GameState.settings.autoStart = false;
        const nightmareW4 = WaveSystem.getWavePreview(4);
        const nightmareW8 = WaveSystem.getWavePreview(8);
        const nightmareW1 = WaveSystem.getWavePreview(1);

        return {
            easyW6Faction: easyW6 && easyW6.faction ? easyW6.faction.id : null,
            easyW8Faction: easyW8 && easyW8.faction ? easyW8.faction.id : null,
            easyW4Arc: easyW4 && easyW4.arc ? easyW4.arc.id : null,
            easyW5Arc: easyW5 && easyW5.arc ? easyW5.arc.id : null,

            hardW5Faction: hardW5 && hardW5.faction ? hardW5.faction.id : null,
            hardW7Arc: hardW7 && hardW7.arc ? hardW7.arc.id : null,

            nightmareW4Faction: nightmareW4 && nightmareW4.faction ? nightmareW4.faction.id : null,
            nightmareW8Faction: nightmareW8 && nightmareW8.faction ? nightmareW8.faction.id : null,
            nightmareW1Arc: nightmareW1 && nightmareW1.arc ? nightmareW1.arc.id : null,
        };
    });

    assert(cadenceByBand.easyW6Faction === null, `Easy maps should stay lighter before wave 8 factions (got ${cadenceByBand.easyW6Faction})`);
    assert(cadenceByBand.easyW8Faction === 'siege_foundry', `Easy map wave 8 should begin faction cadence (got ${cadenceByBand.easyW8Faction})`);
    assert(cadenceByBand.easyW4Arc === null, `Easy maps should not run arc scripting every wave (wave 4 arc: ${cadenceByBand.easyW4Arc})`);
    assert(cadenceByBand.easyW5Arc !== null, 'Easy maps should still surface periodic arc scripting on cadence waves');

    assert(cadenceByBand.hardW5Faction === 'siege_foundry', `Hard maps should trigger denser faction cadence by wave 5 (got ${cadenceByBand.hardW5Faction})`);
    assert(cadenceByBand.hardW7Arc !== null, 'Hard maps should keep arc scripting active each non-bonus wave');

    assert(cadenceByBand.nightmareW4Faction === 'siege_foundry', `Nightmare maps should trigger faction cadence by wave 4 (got ${cadenceByBand.nightmareW4Faction})`);
    assert(cadenceByBand.nightmareW8Faction === 'veil_swarm', `Nightmare maps should rotate to veil_swarm by wave 8 (got ${cadenceByBand.nightmareW8Faction})`);
    assert(cadenceByBand.nightmareW1Arc === 'stress', `Nightmare arc opener should start at stress (got ${cadenceByBand.nightmareW1Arc})`);

    const captainAura = await page.evaluate(() => {
        const cleanDoctrine = {
            startGold: 0,
            startLives: 0,
            interestRateDelta: 0,
            interestCapDelta: 0,
            abilityCooldownMult: 1,
            globalDamageMult: 1,
            eliteBossDamageMult: 1,
        };
        GameState.doctrineEffects = { ...cleanDoctrine };
        GameState.globalDmgBuff = 0;
        GameState.researchBonuses = {};
        WaveSystem.currentTacticalWaveModifiers = WaveSystem._getDefaultTacticalModifiers();

        const captain = new Enemy('heavy', 1);
        captain.x = 300;
        captain.y = 300;
        captain.renderX = 300;
        captain.renderY = 300;
        captain.alive = true;
        WaveSystem._applyCaptainProfile(captain, 'siege_foreman');

        const ally = new Enemy('basic', 1);
        ally.x = 350;
        ally.y = 300;
        ally.renderX = 350;
        ally.renderY = 300;
        ally.alive = true;

        GameState.enemies = [captain, ally];
        GameState.gamePhase = 'playing';
        WaveSystem._applyCaptainAuras();

        const auraApplied = ally.captainAuraActive;
        const auraSpeed = ally.captainSpeedMult;
        const auraReduction = ally.captainDamageReduction;
        const auraArmor = ally.captainArmorBonus;

        const hpBeforeBuffed = ally.hp;
        ally.takeDamage(60, null);
        const buffedDamage = hpBeforeBuffed - ally.hp;

        const control = new Enemy('basic', 1);
        control.x = 600;
        control.y = 300;
        control.renderX = 600;
        control.renderY = 300;
        control.alive = true;
        const hpBeforeControl = control.hp;
        control.takeDamage(60, null);
        const controlDamage = hpBeforeControl - control.hp;

        // Move ally out of aura range and re-evaluate
        ally.x = 1200;
        ally.y = 1200;
        ally.renderX = 1200;
        ally.renderY = 1200;
        GameState.enemies = [captain, ally];
        WaveSystem._applyCaptainAuras();
        const auraRemoved = !ally.captainAuraActive && ally.captainSpeedMult === 1;

        return {
            auraApplied,
            auraSpeed,
            auraReduction,
            auraArmor,
            buffedDamage,
            controlDamage,
            auraRemoved,
            captainIsElite: !!captain.isElite,
            captainName: captain.name,
        };
    });

    assert(captainAura.auraApplied, 'Captain aura should apply to nearby allied enemies');
    assert(captainAura.auraSpeed > 1, `Captain aura should increase speed multiplier (got ${captainAura.auraSpeed})`);
    assert(captainAura.auraReduction > 0, `Captain aura should add damage reduction (got ${captainAura.auraReduction})`);
    assert(captainAura.auraArmor > 0, `Captain aura should add armor bonus (got ${captainAura.auraArmor})`);
    assert(captainAura.buffedDamage < captainAura.controlDamage, `Aura-buffed enemy should take less damage (${captainAura.buffedDamage} vs ${captainAura.controlDamage})`);
    assert(captainAura.auraRemoved, 'Captain aura should clear when ally leaves aura radius');
    assert(captainAura.captainIsElite, 'Captain should always be elite-tier');
    assert(/Foreman/i.test(captainAura.captainName), `Captain name should include Foreman prefix (got: ${captainAura.captainName})`);

    const specialtyCaptains = await page.evaluate(() => {
        GameState.gamePhase = 'playing';
        const cleanDoctrine = {
            startGold: 0,
            startLives: 0,
            interestRateDelta: 0,
            interestCapDelta: 0,
            abilityCooldownMult: 1,
            globalDamageMult: 1,
            eliteBossDamageMult: 1,
        };
        GameState.doctrineEffects = { ...cleanDoctrine };
        GameState.globalDmgBuff = 0;
        GameState.researchBonuses = {};
        WaveSystem.currentTacticalWaveModifiers = WaveSystem._getDefaultTacticalModifiers();

        const veilCaptain = new Enemy('stealth', 1);
        veilCaptain.x = 320;
        veilCaptain.y = 320;
        veilCaptain.alive = true;
        WaveSystem._applyCaptainProfile(veilCaptain, 'veil_ambusher');

        const stealthAlly = new Enemy('stealth', 1);
        stealthAlly.x = 360;
        stealthAlly.y = 320;
        stealthAlly.alive = true;
        stealthAlly.invisible = true;
        stealthAlly.stealthTimer = 0.01;

        GameState.enemies = [veilCaptain, stealthAlly];
        WaveSystem._applyCaptainAuras();
        stealthAlly.update(0.02);
        const veilCooldown = stealthAlly.stealthCooldown;

        const blightCaptain = new Enemy('healer', 1);
        blightCaptain.x = 500;
        blightCaptain.y = 320;
        blightCaptain.alive = true;
        WaveSystem._applyCaptainProfile(blightCaptain, 'blight_matron');

        const healerAlly = new Enemy('healer', 1);
        healerAlly.x = 540;
        healerAlly.y = 320;
        healerAlly.alive = true;
        healerAlly.hp = Math.max(1, healerAlly.maxHp * 0.5);
        healerAlly.healCooldown = 1.2;

        const plainHealer = new Enemy('healer', 1);
        plainHealer.x = 740;
        plainHealer.y = 320;
        plainHealer.alive = true;
        plainHealer.hp = Math.max(1, plainHealer.maxHp * 0.5);
        plainHealer.healCooldown = 1.2;

        GameState.enemies = [blightCaptain, healerAlly];
        WaveSystem._applyCaptainAuras();
        healerAlly.update(0.5);

        GameState.enemies = [plainHealer];
        plainHealer.update(0.5);

        return {
            veilCooldown,
            blightRegenRate: healerAlly.captainRegenRate,
            blightSupportCastRate: healerAlly.captainSupportCastRate,
            blightCooldownAfterTick: healerAlly.healCooldown,
            plainCooldownAfterTick: plainHealer.healCooldown,
        };
    });

    assert(specialtyCaptains.veilCooldown > 0 && specialtyCaptains.veilCooldown < 3, `Veil ambush aura should shorten stealth recycle (got ${specialtyCaptains.veilCooldown})`);
    assert(specialtyCaptains.blightRegenRate > 0, `Blight matron aura should add regen rate (got ${specialtyCaptains.blightRegenRate})`);
    assert(specialtyCaptains.blightSupportCastRate > 1, `Blight matron aura should accelerate support cast rate (got ${specialtyCaptains.blightSupportCastRate})`);
    assert(specialtyCaptains.blightCooldownAfterTick < specialtyCaptains.plainCooldownAfterTick, `Blight support aura should reduce healer cooldown faster (${specialtyCaptains.blightCooldownAfterTick} vs ${specialtyCaptains.plainCooldownAfterTick})`);

    await browser.close();
    console.log('PASS: Faction wave and captain aura behavior validated.');
}

run().catch((err) => {
    console.error('FAIL:', err.message);
    process.exit(1);
});
