const { chromium } = require('playwright');

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

async function run() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });

    await page.goto(process.env.BASE_URL || 'http://localhost:3000');
    await page.waitForFunction(() => typeof startGame === 'function' && typeof MenuSystem !== 'undefined');

    await page.evaluate(() => {
        localStorage.clear();
        GameState.purchasedResearch = new Set();
        GameState.researchPoints = 0;
        GameState.computeResearchBonuses();

        GameState.settings.difficulty = 'normal';
        GameState._pendingChallenges = [];
        MenuSystem.showScreen('mapselect');
    });

    await page.locator('#map-cards .map-card:not(.locked)').first().hover();
    await page.waitForTimeout(120);

    const hoverPreviewExists = await page.evaluate(() => !!document.getElementById('map-hover-preview'));
    assert(!hoverPreviewExists, 'Map hover preview should be disabled on map select screen');

    await page.locator('#map-cards .map-card:not(.locked)').first().click();
    await page.waitForFunction(() => GameState.screen === 'doctrine');

    const doctrineScreen = await page.evaluate(() => {
        const cards = [...document.querySelectorAll('.doctrine-card')];
        const selected = document.querySelector('.doctrine-card.is-selected');
        return {
            count: cards.length,
            selectedExists: !!selected,
            summary: (document.getElementById('doctrine-summary') || {}).textContent || '',
        };
    });

    assert(doctrineScreen.count === 4, `Doctrine screen should show 4 doctrines (got ${doctrineScreen.count})`);
    assert(doctrineScreen.selectedExists, 'Doctrine screen should have a selected doctrine');
    assert(/weekly uses fixed rules/i.test(doctrineScreen.summary), 'Doctrine summary should mention weekly fixed rules');

    await page.locator('.doctrine-card', { hasText: 'Greed Doctrine' }).click();
    await page.click('#btn-doctrine-start');

    await page.waitForFunction(() => GameState.screen === 'game' && GameState.activeDoctrineId === 'greed');

    const doctrineRun = await page.evaluate(() => ({
        mapIndex: GameState.mapIndex,
        activeDoctrineId: GameState.activeDoctrineId,
        lives: GameState.lives,
        gold: GameState.gold,
        effects: { ...GameState.doctrineEffects },
    }));

    assert(doctrineRun.mapIndex === 5, `Normal map selection should launch first normal map (expected 5, got ${doctrineRun.mapIndex})`);
    assert(doctrineRun.activeDoctrineId === 'greed', `Expected active doctrine 'greed', got '${doctrineRun.activeDoctrineId}'`);
    assert(doctrineRun.lives === 17, `Greed doctrine should start with 17 lives on Normal (got ${doctrineRun.lives})`);
    assert(doctrineRun.gold === 200, `Greed doctrine should keep Normal starting gold at 200 (got ${doctrineRun.gold})`);
    assert(Math.abs(doctrineRun.effects.interestRateDelta - 0.02) < 0.0001, 'Greed doctrine interest rate delta mismatch');
    assert(doctrineRun.effects.interestCapDelta === 25, 'Greed doctrine interest cap delta mismatch');

    const interestCheck = await page.evaluate(() => {
        GameState.gamePhase = 'idle';
        GameState.wave = 2;
        GameState.gold = 500;
        GameState.researchBonuses = {};
        GameState.towers = [];
        GameState.activeChallenges = [];
        if (WaveSystem.cancelCountdown) WaveSystem.cancelCountdown();

        const before = GameState.gold;
        WaveSystem.startWave();
        const after = GameState.gold;

        return {
            delta: after - before,
            waveNow: GameState.wave,
        };
    });

    assert(interestCheck.waveNow === 3, `Wave should advance to 3 in interest check (got ${interestCheck.waveNow})`);
    assert(interestCheck.delta === 55, `Greed doctrine should grant 35 interest + 20 wave bonus (delta 55), got ${interestCheck.delta}`);

    await browser.close();
    console.log('PASS: Doctrine selection flow and doctrine effects validated.');
}

run().catch((err) => {
    console.error('FAIL:', err.message);
    process.exit(1);
});
