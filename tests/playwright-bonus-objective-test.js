const { chromium } = require('playwright');

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

async function run() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });

    await page.goto(process.env.BASE_URL || 'http://localhost:3000');
    await page.waitForFunction(() => typeof startGame === 'function' && typeof WaveSystem !== 'undefined');

    // --- Survival objective bonus wave ---
    const survival = await page.evaluate(() => {
        MenuSystem.showScreen('game');
        startGame(0);
        GameState.settings.autoStart = false;

        GameState.wave = 9;
        GameState.gamePhase = 'idle';
        WaveSystem.startWave();

        const template = WaveSystem.currentBonusWave;
        const beforeBonusGold = WaveSystem.waveStats.totalBonusGoldEarned;

        // Force the objective to resolve on timer without waiting real time.
        GameState.waveEnemies = [];
        GameState.enemies = [];
        GameState.enemiesAlive = 0;
        WaveSystem.bonusWaveTimer = 0.01;
        WaveSystem.update(0.05);

        const afterBonusGold = WaveSystem.waveStats.totalBonusGoldEarned;

        return {
            startedAsBonus: !!WaveSystem.isBonusWave,
            objectiveType: template && template.objective ? template.objective.type : null,
            waveAfterResolve: GameState.wave,
            gamePhase: GameState.gamePhase,
            bonusRewardDelta: afterBonusGold - beforeBonusGold,
            expectedReward: template ? template.bonusGold : 0,
        };
    });

    assert(survival.startedAsBonus, 'Wave 10 should be treated as a bonus wave');
    assert(survival.objectiveType === 'survival_timer', `Wave 10 should use survival objective (got ${survival.objectiveType})`);
    assert(survival.waveAfterResolve === 10, `Expected wave 10 after bonus resolve (got ${survival.waveAfterResolve})`);
    assert(survival.gamePhase === 'idle', `Game should return to idle after survival objective resolve (got ${survival.gamePhase})`);
    assert(survival.bonusRewardDelta === survival.expectedReward, `Survival objective should grant full bonus reward (${survival.expectedReward}), got ${survival.bonusRewardDelta}`);

    // --- Priority target objective success path ---
    const prioritySuccess = await page.evaluate(() => {
        MenuSystem.showScreen('game');
        startGame(0);
        GameState.settings.autoStart = false;

        GameState.wave = 19;
        GameState.gamePhase = 'idle';
        WaveSystem.startWave();

        const template = WaveSystem.currentBonusWave;
        const objective = WaveSystem.bonusObjectiveState;
        const required = objective ? objective.requiredTargets : 0;
        const beforeBonusGold = WaveSystem.waveStats.totalBonusGoldEarned;

        for (let i = 0; i < required; i++) {
            WaveSystem.recordKill({ isObjectiveTarget: true, isElite: true });
        }
        WaveSystem.update(0.01);

        const afterBonusGold = WaveSystem.waveStats.totalBonusGoldEarned;

        return {
            objectiveType: template && template.objective ? template.objective.type : null,
            required,
            waveAfterResolve: GameState.wave,
            gamePhase: GameState.gamePhase,
            bonusRewardDelta: afterBonusGold - beforeBonusGold,
            expectedReward: template ? template.bonusGold : 0,
        };
    });

    assert(prioritySuccess.objectiveType === 'priority_target', `Wave 20 should use priority objective (got ${prioritySuccess.objectiveType})`);
    assert(prioritySuccess.required > 0, `Priority objective should require at least one target (got ${prioritySuccess.required})`);
    assert(prioritySuccess.waveAfterResolve === 20, `Expected wave 20 after priority objective resolve (got ${prioritySuccess.waveAfterResolve})`);
    assert(prioritySuccess.gamePhase === 'idle', `Game should return to idle after priority objective resolve (got ${prioritySuccess.gamePhase})`);
    assert(prioritySuccess.bonusRewardDelta === prioritySuccess.expectedReward, `Priority objective success should grant full bonus reward (${prioritySuccess.expectedReward}), got ${prioritySuccess.bonusRewardDelta}`);

    // --- Priority target objective fail path ---
    const priorityFail = await page.evaluate(() => {
        MenuSystem.showScreen('game');
        startGame(0);
        GameState.settings.autoStart = false;

        GameState.wave = 19;
        GameState.gamePhase = 'idle';
        WaveSystem.startWave();

        const template = WaveSystem.currentBonusWave;
        const beforeBonusGold = WaveSystem.waveStats.totalBonusGoldEarned;

        WaveSystem.recordLeak({ isObjectiveTarget: true });
        WaveSystem.update(0.01);

        const afterBonusGold = WaveSystem.waveStats.totalBonusGoldEarned;

        return {
            waveAfterResolve: GameState.wave,
            gamePhase: GameState.gamePhase,
            bonusRewardDelta: afterBonusGold - beforeBonusGold,
            expectedReward: template ? template.bonusGold : 0,
        };
    });

    assert(priorityFail.waveAfterResolve === 20, `Expected wave 20 after failed priority objective (got ${priorityFail.waveAfterResolve})`);
    assert(priorityFail.gamePhase === 'idle', `Game should return to idle after failed priority objective (got ${priorityFail.gamePhase})`);
    assert(priorityFail.bonusRewardDelta === 0, `Priority objective fail should grant zero bonus reward (got ${priorityFail.bonusRewardDelta})`);

    // --- Preview wiring ---
    const previewCheck = await page.evaluate(() => {
        startGame(0);
        GameState.wave = 9;
        const preview = WaveSystem.getWavePreview(10);
        return {
            hasBonusInfo: !!(preview && preview.bonusInfo),
            objectiveType: preview && preview.bonusInfo ? preview.bonusInfo.objectiveType : null,
            objectiveTitle: preview && preview.bonusInfo ? preview.bonusInfo.objectiveTitle : '',
            threatTags: preview && Array.isArray(preview.threatTags) ? preview.threatTags : [],
        };
    });

    assert(previewCheck.hasBonusInfo, 'Bonus wave preview should include bonus info');
    assert(!!previewCheck.objectiveType, 'Bonus wave preview should expose objective type');
    assert(!!previewCheck.objectiveTitle, 'Bonus wave preview should expose objective title');
    assert(previewCheck.threatTags.includes('BONUS OBJECTIVE'), 'Bonus wave preview should include BONUS OBJECTIVE threat tag');

    await browser.close();
    console.log('PASS: Objective-based bonus wave behavior validated (survival + priority target).');
}

run().catch((err) => {
    console.error('FAIL:', err.message);
    process.exit(1);
});
