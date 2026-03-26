const { chromium } = require('playwright');

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

function approxEqual(a, b, epsilon = 0.0001) {
    return Math.abs(a - b) <= epsilon;
}

async function run() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });

    await page.goto(process.env.BASE_URL || 'http://localhost:3000');
    await page.waitForFunction(() => typeof startGame === 'function' && typeof WaveSystem !== 'undefined');

    const statusExpiry = await page.evaluate(() => {
        MenuSystem.showScreen('game');
        startGame(5);

        const enemy = new Enemy('basic', 1);
        enemy.pathIndex = 0;
        enemy.progress = 0;
        enemy.alive = true;
        enemy.x = GameState.detailedPath[0].x;
        enemy.y = GameState.detailedPath[0].y;
        enemy.renderX = enemy.x;
        enemy.renderY = enemy.y;
        enemy.prevX = enemy.x;
        enemy.prevY = enemy.y;

        enemy.applyFreeze(1.0, { ignoreBossImmunity: true });
        const freezeStart = { frozen: enemy.frozen, timer: enemy.freezeTimer };
        enemy.update(0.6);
        const freezeMid = { frozen: enemy.frozen, timer: enemy.freezeTimer };
        enemy.update(0.5);
        const freezeEnd = { frozen: enemy.frozen, timer: enemy.freezeTimer };

        enemy.applyBlind(1.0, 0.35);
        const blindStart = { blinded: enemy.blinded, timer: enemy.blindTimer, slowMult: enemy.blindSlowMult };
        enemy.update(0.6);
        const blindMid = { blinded: enemy.blinded, timer: enemy.blindTimer, slowMult: enemy.blindSlowMult };
        enemy.update(0.5);
        const blindEnd = { blinded: enemy.blinded, timer: enemy.blindTimer, slowMult: enemy.blindSlowMult };

        return { freezeStart, freezeMid, freezeEnd, blindStart, blindMid, blindEnd };
    });

    assert(statusExpiry.freezeStart.frozen, 'Freeze should apply immediately');
    assert(statusExpiry.freezeStart.timer > 0.9, `Freeze timer should initialize near duration (got ${statusExpiry.freezeStart.timer})`);
    assert(statusExpiry.freezeMid.frozen, 'Freeze should remain active before expiry');
    assert(!statusExpiry.freezeEnd.frozen, 'Freeze should expire after timer elapses');
    assert(statusExpiry.freezeEnd.timer === 0, `Freeze timer should clamp to zero (got ${statusExpiry.freezeEnd.timer})`);

    assert(statusExpiry.blindStart.blinded, 'Blind should apply immediately');
    assert(statusExpiry.blindStart.slowMult < 1, `Blind slow multiplier should be applied (<1), got ${statusExpiry.blindStart.slowMult}`);
    assert(statusExpiry.blindMid.blinded, 'Blind should remain active before expiry');
    assert(!statusExpiry.blindEnd.blinded, 'Blind should expire after timer elapses');
    assert(statusExpiry.blindEnd.timer === 0, `Blind timer should clamp to zero (got ${statusExpiry.blindEnd.timer})`);
    assert(statusExpiry.blindEnd.slowMult === 1, `Blind slow multiplier should reset to 1 on expiry (got ${statusExpiry.blindEnd.slowMult})`);

    const summonParity = await page.evaluate(() => {
        MenuSystem.showScreen('game');
        startGame(5);
        GameState.settings.difficulty = 'normal';
        WaveSystem.difficultyScale = WaveSystem._calculateDifficultyScale(GameState.wave || 1);
        WaveSystem.activeModifiers = [];
        WaveSystem.currentTacticalWaveModifiers = WaveSystem._getDefaultTacticalModifiers();

        const entry = { type: 'swarm', hpMult: 0.55, delay: 0, isElite: false };
        const base = WaveSystem.spawnEnemyFromEntry(entry, {
            pathIndex: 3,
            progress: 0.2,
            includeInWaveTotal: false,
            trackCounters: false,
        });
        const baseStats = {
            hp: base.maxHp,
            speed: base.baseSpeed,
            armor: base.armor,
            reward: base.reward,
        };

        GameState.enemies = [];
        GameState.enemiesAlive = 0;
        GameState.enemiesSpawned = 0;
        GameState.totalEnemiesInWave = 0;

        const boss = new Enemy('boss', 1);
        boss.pathIndex = 3;
        boss.progress = 0.2;
        boss.x = GameState.detailedPath[3].x;
        boss.y = GameState.detailedPath[3].y;
        boss.renderX = boss.x;
        boss.renderY = boss.y;
        boss.prevX = boss.x;
        boss.prevY = boss.y;
        boss.setBossProfile({
            id: 'test',
            name: 'Test Boss',
            abilityCycle: ['summon'],
            summonType: 'swarm',
            summonCountMin: 1,
            summonCountMax: 1,
            summonHpMult: 0.55,
        });
        GameState.enemies.push(boss);

        const randomBackup = Math.random;
        Math.random = () => 0;
        boss._bossSpawnMinions();
        Math.random = randomBackup;

        const summon = GameState.enemies.find(e => e !== boss);
        return {
            baseStats,
            summonStats: summon ? {
                hp: summon.maxHp,
                speed: summon.baseSpeed,
                armor: summon.armor,
                reward: summon.reward,
            } : null,
            counters: {
                alive: GameState.enemiesAlive,
                spawned: GameState.enemiesSpawned,
                total: GameState.totalEnemiesInWave,
            },
        };
    });

    assert(!!summonParity.summonStats, 'Boss summon should spawn at least one minion');
    assert(approxEqual(summonParity.baseStats.hp, summonParity.summonStats.hp, 0.01), `Summon HP should match WaveSystem scaling (${summonParity.baseStats.hp} vs ${summonParity.summonStats.hp})`);
    assert(approxEqual(summonParity.baseStats.speed, summonParity.summonStats.speed, 0.0001), `Summon speed should match WaveSystem scaling (${summonParity.baseStats.speed} vs ${summonParity.summonStats.speed})`);
    assert(approxEqual(summonParity.baseStats.armor, summonParity.summonStats.armor, 0.0001), `Summon armor should match WaveSystem scaling (${summonParity.baseStats.armor} vs ${summonParity.summonStats.armor})`);
    assert(summonParity.baseStats.reward === summonParity.summonStats.reward, `Summon reward should match WaveSystem scaling (${summonParity.baseStats.reward} vs ${summonParity.summonStats.reward})`);
    assert(summonParity.counters.alive >= 1, `Boss summon should increment enemiesAlive (got ${summonParity.counters.alive})`);
    assert(summonParity.counters.spawned >= 1, `Boss summon should increment enemiesSpawned (got ${summonParity.counters.spawned})`);
    assert(summonParity.counters.total >= 1, `Boss summon should increment totalEnemiesInWave (got ${summonParity.counters.total})`);

    await browser.close();
    console.log('PASS: Freeze/blind expiry and boss summon scaling parity validated.');
}

run().catch((err) => {
    console.error('FAIL:', err.message);
    process.exit(1);
});
