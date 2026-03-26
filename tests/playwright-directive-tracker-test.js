const { chromium } = require('playwright');

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

async function run() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    await page.goto(process.env.BASE_URL || 'http://localhost:3000');
    await page.waitForFunction(() => typeof startGame === 'function' && typeof ProgressionSystem !== 'undefined');

    const result = await page.evaluate(() => {
        MenuSystem.showScreen('game');
        startGame(0);

        const enemy = new Enemy('basic');
        enemy.reward = 0;
        enemy.maxHp = 9999;
        enemy.hp = 9999;
        enemy.applyFreeze(1.2);
        enemy.applyBurn(18, 2.5);
        enemy.applyPoison(11, 2.5, {});
        enemy.update(1);
        enemy.isCaptain = true;
        enemy.die();

        const trackedFreezeAfterApply = GameState.stats.freezeApplications;
        const trackedBurnAfterTick = GameState.stats.burnDamageDealt;
        const trackedPoisonAfterTick = GameState.stats.poisonDamageDealt;
        const trackedCaptainAfterKill = GameState.stats.captainKillsThisRun;

        GameState.stats.freezeApplications = 12;
        GameState.mapIndex = 0;
        GameState.gamePhase = 'idle';
        UIRenderer.updateDirectiveTracker(true);
        const hudText0 = (document.getElementById('directive-hud') || {}).textContent || '';

        GameState.stats.burnDamageDealt = 1800;
        GameState.mapIndex = 3;
        UIRenderer.updateDirectiveTracker(true);
        const hudText3 = (document.getElementById('directive-hud') || {}).textContent || '';

        GameState.stats.captainKillsThisRun = 1;
        GameState.mapIndex = 10;
        UIRenderer.updateDirectiveTracker(true);
        togglePause();
        const pauseText = (document.getElementById('pause-directive-panel') || {}).textContent || '';
        togglePause();

        return {
            trackedFreezeAfterApply,
            trackedBurnAfterTick,
            trackedPoisonAfterTick,
            trackedCaptainAfterKill,
            hudText0,
            hudText3,
            pauseText,
        };
    });

    assert(result.trackedFreezeAfterApply >= 1, `Expected freeze application counter to increment (got ${result.trackedFreezeAfterApply})`);
    assert(result.trackedBurnAfterTick > 0, `Expected burn damage tracker to accumulate tick damage (got ${result.trackedBurnAfterTick})`);
    assert(result.trackedPoisonAfterTick > 0, `Expected poison damage tracker to accumulate tick damage (got ${result.trackedPoisonAfterTick})`);
    assert(result.trackedCaptainAfterKill >= 1, `Expected captain kill tracker to increment (got ${result.trackedCaptainAfterKill})`);
    assert(/Frost Lock/i.test(result.hudText0), 'Expected HUD tracker to show the frost directive on map 1');
    assert(/12\/20/i.test(result.hudText0), `Expected HUD tracker to show freeze progress (got: ${result.hudText0})`);
    assert(/Burn Scar/i.test(result.hudText3), 'Expected HUD tracker to show the burn directive on map 4');
    assert(/1800\/2500/i.test(result.hudText3), `Expected HUD tracker to show burn progress (got: ${result.hudText3})`);
    assert(/Captain Breaker/i.test(result.pauseText), 'Expected pause panel to mirror captain directive details');
    assert(/1\/1/i.test(result.pauseText), `Expected pause panel to show captain progress (got: ${result.pauseText})`);

    await browser.close();
    console.log('PASS: directive trackers and themed progression counters validated.');
}

run().catch((err) => {
    console.error('FAIL:', err.message);
    process.exit(1);
});
