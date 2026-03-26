const { chromium } = require('playwright');

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

async function run() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

    await page.goto(process.env.BASE_URL || 'http://localhost:3000');
    await page.waitForFunction(() => typeof ProgressionSystem !== 'undefined' && typeof startGame === 'function');

    const result = await page.evaluate(() => {
        const resetPersistent = () => {
            GameState.researchPoints = 0;
            GameState.purchasedResearch = new Set();
            GameState.achievementsUnlocked = new Set();
            GameState.mapScores = new Array(MAPS.length).fill(0);
            GameState.mapWaveRecords = new Array(MAPS.length).fill(0);
            GameState.unlockedMaps = [true, ...new Array(MAPS.length - 1).fill(false)];
            GameState.metaProgress = SaveSystem._normalizeMetaProgress({});
            ProgressionSystem.syncPersistentProgress({ silent: true });
        };

        resetPersistent();
        MenuSystem.showScreen('difficulty');
        const normalCardInitiallyLocked = !!document.querySelector('.diff-card-normal.locked');

        MenuSystem.showScreen('game');
        startGame(0);
        UIRenderer.buildSidebar();

        const flameCardBefore = document.querySelector('.tower-btn[data-type="flame"]');
        const arrowCard = document.querySelector('.tower-btn[data-type="arrow"]');
        const selectionBlocked = ProgressionSystem.tryToggleTowerSelection('flame');

        GameState.mapScores[0] = 1200;
        GameState.stats.freezeApplications = 20;
        GameState.stats.leaksThisGame = 0;
        const victorySummary = ProgressionSystem.applyCampaignVictoryProgress(0);
        UIRenderer.buildSidebar();

        const flameCardAfter = document.querySelector('.tower-btn[data-type="flame"]');

        resetPersistent();
        GameState.mapScores[1] = 600;
        GameState.metaProgress = SaveSystem._normalizeMetaProgress({ legacyProgressionBackfillDone: true });
        ProgressionSystem.syncPersistentProgress({ silent: true });
        const strictVenomLocked = !ProgressionSystem.isTowerUnlocked('venom');

        resetPersistent();
        for (let i = 0; i < 5; i++) {
            GameState.mapScores[i] = 1000 + i;
            GameState.metaProgress.mapMarkBits[i] = 7;
        }
        ProgressionSystem.syncPersistentProgress({ silent: true });
        const normalBandUnlockedAfter = ProgressionSystem.getBandStatus('normal').unlocked;

        resetPersistent();
        GameState.mapScores[0] = 500;
        GameState.mapScores[1] = 600;
        GameState.achievementsUnlocked = new Set(['boss5']);
        GameState.purchasedResearch = new Set(['sharp', 'quick', 'criteye', 'heavy', 'rapid']);
        GameState.metaProgress = SaveSystem._normalizeMetaProgress({ legacyProgressionBackfillDone: false });
        const backfill = ProgressionSystem.syncPersistentProgress({ silent: true });

        return {
            normalCardInitiallyLocked,
            arrowUnlocked: arrowCard && !arrowCard.classList.contains('locked'),
            flameLockedBefore: flameCardBefore && flameCardBefore.classList.contains('locked'),
            flameSelectionBlocked: !selectionBlocked.ok && selectionBlocked.reason === 'locked',
            victoryMarksEarned: victorySummary.marksEarned,
            victoryUnlockedFlame: victorySummary.newlyUnlockedTowers.includes('flame'),
            flameUnlockedAfter: flameCardAfter && !flameCardAfter.classList.contains('locked'),
            strictVenomLocked,
            normalBandUnlockedAfter,
            backfillMarks: ProgressionSystem.getCommandMarks(),
            backfillUnlockedVenom: ProgressionSystem.isTowerUnlocked('venom'),
            backfillUnlockedBoost: ProgressionSystem.isTowerUnlocked('boost'),
            backfillUnlockedMissile: ProgressionSystem.isTowerUnlocked('missile'),
            backfillChanged: backfill.changed,
        };
    });

    assert(result.normalCardInitiallyLocked, 'Expected Normal difficulty card to start locked');
    assert(result.arrowUnlocked, 'Expected Arrow tower to remain in the starter roster');
    assert(result.flameLockedBefore, 'Expected Flame tower to be locked on a fresh profile');
    assert(result.flameSelectionBlocked, 'Expected locked tower selection to be blocked');
    assert(result.victoryMarksEarned === 3, 'Expected first perfect directive clear to award 3 marks');
    assert(result.victoryUnlockedFlame, 'Expected Flame tower license to unlock after first marked clear');
    assert(result.flameUnlockedAfter, 'Expected Flame tower sidebar card to unlock after progression award');
    assert(result.strictVenomLocked, 'Expected tower license checks to require full requirements in non-legacy progression');
    assert(result.normalBandUnlockedAfter, 'Expected Normal band to unlock after enough marks and Shadow Realm clear proof');
    assert(result.backfillChanged, 'Expected legacy progression sync to modify fresh backfill data');
    assert(result.backfillMarks === 2, 'Expected legacy backfill to award clear marks for cleared maps');
    assert(result.backfillUnlockedVenom, 'Expected Venom tower to unlock from legacy clear proof');
    assert(result.backfillUnlockedBoost, 'Expected Boost tower to unlock from legacy progression proof');
    assert(result.backfillUnlockedMissile, 'Expected Missile tower to unlock from legacy boss proof');

    await browser.close();
    console.log('PASS: progression marks, tower licenses, band gates, and legacy backfill verified.');
}

run().catch((err) => {
    console.error('FAIL:', err.message);
    process.exit(1);
});
