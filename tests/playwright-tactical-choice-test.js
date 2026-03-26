const { chromium } = require('playwright');

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

async function run() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });

    await page.goto(process.env.BASE_URL || 'http://localhost:3000');
    await page.waitForFunction(() => typeof startGame === 'function' && typeof WaveSystem !== 'undefined');

    await page.evaluate(() => {
        localStorage.clear();
        MenuSystem.showScreen('game');
        startGame(5);
        GameState.settings.autoStart = false;
        GameState.weeklyChallengeRun = null;

        // Prepare deterministic wave-complete state for tactical trigger.
        GameState.wave = 3;
        GameState.gamePhase = 'playing';
        GameState.time = 120;
        WaveSystem.isBonusWave = false;
        WaveSystem.currentBonusWave = null;
        WaveSystem.waveStats.currentWaveStartTime = 100;
        WaveSystem.waveStats.currentWaveKills = 0;
        WaveSystem.waveStats.currentWaveDamageDealt = 0;
        WaveSystem.waveStats.enemiesLeakedThisWave = 0;
        WaveSystem.waveStats.elitesKilledThisWave = 0;
        WaveSystem._towerDamageSnapshot = {};
        GameState.totalEnemiesInWave = 1;

        WaveSystem.waveComplete();
    });

    await page.waitForFunction(() => WaveSystem.tacticalEventModalOpen === true);

    const modalState = await page.evaluate(() => ({
        choiceCount: WaveSystem.tacticalEventChoices.length,
        modalDisplay: getComputedStyle(document.getElementById('tactical-event-modal')).display,
        hasTempoChoice: WaveSystem.tacticalEventChoices.some(choice => Array.isArray(choice.tags) && choice.tags.includes('tempo')),
        firstChoice: WaveSystem.tacticalEventChoices[0]
            ? {
                id: WaveSystem.tacticalEventChoices[0].id,
                immediate: { ...(WaveSystem.tacticalEventChoices[0].immediate || {}) },
                timed: { ...(WaveSystem.tacticalEventChoices[0].timed || {}) },
                duration: WaveSystem.tacticalEventChoices[0].duration,
            }
            : null,
        beforeGold: GameState.gold,
        beforeLives: GameState.lives,
        maxLives: GameState.maxLives,
    }));

    assert(modalState.choiceCount === 3, `Tactical modal should show 3 options (got ${modalState.choiceCount})`);
    assert(modalState.modalDisplay === 'flex', `Tactical modal should be visible (display=${modalState.modalDisplay})`);
    assert(modalState.hasTempoChoice, 'Tactical modal should always offer at least one tempo directive');
    assert(!!modalState.firstChoice, 'Tactical modal should expose first choice data');

    await page.keyboard.press('Digit1');
    await page.waitForFunction(() => WaveSystem.tacticalEventModalOpen === false);

    const afterPick = await page.evaluate((expected) => {
        const active = WaveSystem.activeTacticalEffects.find(effect => effect.id === expected.id) || null;
        return {
            tacticalEventsTaken: WaveSystem.tacticalEventsTaken,
            activeId: active ? active.id : '',
            activeRemainingWaves: active ? active.remainingWaves : 0,
            gold: GameState.gold,
            lives: GameState.lives,
            expectedDuration: expected.duration,
            expectedImmediate: expected.immediate,
            maxLives: GameState.maxLives,
            startButtonHidden: document.getElementById('btn-start-wave').classList.contains('hidden'),
        };
    }, modalState.firstChoice);

    assert(afterPick.tacticalEventsTaken >= 1, 'Picking tactical choice should increment counter');
    assert(afterPick.activeId === modalState.firstChoice.id, `Picked tactical effect should be active (${afterPick.activeId})`);
    assert(afterPick.activeRemainingWaves === modalState.firstChoice.duration, `Active tactical duration should match choice (${afterPick.activeRemainingWaves})`);
    assert(!afterPick.startButtonHidden, 'Start wave button should be visible after tactical choice pick');

    const immediateGold = Number.isFinite(modalState.firstChoice.immediate.gold) ? Math.floor(modalState.firstChoice.immediate.gold) : 0;
    const immediateLives = Number.isFinite(modalState.firstChoice.immediate.lives) ? Math.floor(modalState.firstChoice.immediate.lives) : 0;
    const expectedGold = Math.max(0, Math.floor(modalState.beforeGold + immediateGold));
    const expectedLives = Math.max(1, Math.min(modalState.maxLives, Math.floor(modalState.beforeLives + immediateLives)));
    assert(afterPick.gold === expectedGold, `Immediate gold effect mismatch (expected ${expectedGold}, got ${afterPick.gold})`);
    assert(afterPick.lives === expectedLives, `Immediate lives effect mismatch (expected ${expectedLives}, got ${afterPick.lives})`);

    const afterStart = await page.evaluate((expected) => {
        GameState.gamePhase = 'idle';
        if (WaveSystem.cancelCountdown) WaveSystem.cancelCountdown();
        WaveSystem.startWave();

        const mods = WaveSystem.getCurrentTacticalModifiers();
        const active = WaveSystem.activeTacticalEffects.find(effect => effect.id === expected.id) || null;

        return {
            wave: GameState.wave,
            mods,
            remaining: active ? active.remainingWaves : 0,
            expectedTimed: expected.timed,
            expectedDuration: expected.duration,
        };
    }, modalState.firstChoice);

    assert(afterStart.wave === 4, `Wave should advance to 4 after startWave (got ${afterStart.wave})`);

    const timed = modalState.firstChoice.timed || {};
    for (const [key, value] of Object.entries(timed)) {
        if (!Number.isFinite(value)) continue;
        const actual = afterStart.mods[key];
        assert(Number.isFinite(actual), `Current tactical modifiers missing key '${key}'`);
        assert(Math.abs(actual - value) < 0.0001, `Tactical modifier '${key}' mismatch (expected ${value}, got ${actual})`);
    }

    const expectedRemaining = Math.max(0, Math.floor(modalState.firstChoice.duration - 1));
    assert(afterStart.remaining === expectedRemaining, `Tactical duration should decrement by one at wave start (expected ${expectedRemaining}, got ${afterStart.remaining})`);

    const weeklyBlock = await page.evaluate(() => {
        MenuSystem.showScreen('game');
        startGame(5);
        GameState.settings.autoStart = false;
        GameState.weeklyChallengeRun = {
            active: true,
            weekId: '2099-W01',
            seed: 1,
            mapIndex: 5,
            difficulty: 'normal',
            modifiers: ['speed_run'],
        };

        GameState.wave = 3;
        GameState.gamePhase = 'playing';
        GameState.time = 200;
        WaveSystem.isBonusWave = false;
        WaveSystem.currentBonusWave = null;
        WaveSystem.waveStats.currentWaveStartTime = 180;
        WaveSystem.waveStats.currentWaveKills = 0;
        WaveSystem.waveStats.currentWaveDamageDealt = 0;
        WaveSystem.waveStats.enemiesLeakedThisWave = 0;
        WaveSystem.waveStats.elitesKilledThisWave = 0;
        WaveSystem._towerDamageSnapshot = {};
        GameState.totalEnemiesInWave = 1;

        WaveSystem.waveComplete();
        return {
            tacticalOpen: WaveSystem.tacticalEventModalOpen,
        };
    });

    assert(!weeklyBlock.tacticalOpen, 'Weekly challenge runs should not open tactical choice events');

    await browser.close();
    console.log('PASS: Tactical choice event flow, modifiers, and weekly exclusion verified.');
}

run().catch((err) => {
    console.error('FAIL:', err.message);
    process.exit(1);
});
