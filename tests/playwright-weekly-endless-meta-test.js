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
        MenuSystem.showScreen('menu');
        MenuSystem._updateWeeklyChallengeButton();
    });

    const weeklyButtonText = await page.locator('#btn-weekly').innerText();
    assert(/WEEKLY CHALLENGE/i.test(weeklyButtonText), 'Weekly challenge button should be visible on main menu');
    assert(/W\d{2}/i.test(weeklyButtonText), `Weekly button subtitle should include week id (got: ${weeklyButtonText})`);

    await page.click('#btn-weekly');
    await page.waitForFunction(() => GameState.screen === 'game' && !!GameState.weeklyChallengeRun && GameState.weeklyChallengeRun.active);

    const weeklyRun = await page.evaluate(() => ({
        active: !!(GameState.weeklyChallengeRun && GameState.weeklyChallengeRun.active),
        weekId: GameState.weeklyChallengeRun ? GameState.weeklyChallengeRun.weekId : '',
        modifiers: GameState.weeklyChallengeRun ? GameState.weeklyChallengeRun.modifiers.length : 0,
        activeChallenges: GameState.activeChallenges.length,
        mapIndex: GameState.mapIndex,
        difficulty: GameState.settings.difficulty,
    }));
    assert(weeklyRun.active, 'Weekly challenge run should be active after clicking weekly button');
    assert(weeklyRun.modifiers >= 2, `Weekly challenge should roll at least 2 modifiers (got ${weeklyRun.modifiers})`);
    assert(weeklyRun.activeChallenges === weeklyRun.modifiers, 'Weekly challenge modifiers should be applied as active challenges');
    assert(typeof weeklyRun.weekId === 'string' && weeklyRun.weekId.length > 0, 'Weekly challenge week id should be set');

    await page.evaluate(() => {
        WaveSystem.endlessMode = true;
        GameState.gamePhase = 'idle';
        WaveSystem.endlessDraftMutatorIds = [];
        WaveSystem.endlessDraftedDepths = [];
        WaveSystem._openEndlessMutatorDraft(1);
    });

    await page.waitForFunction(() => WaveSystem.endlessDraftModalOpen === true);
    const choiceCount = await page.locator('#endless-draft-choices .endless-draft-card').count();
    assert(choiceCount >= 1, `Endless draft should present choices (got ${choiceCount})`);

    await page.keyboard.press('Digit1');
    await page.waitForFunction(() => WaveSystem.endlessDraftModalOpen === false);

    const draftState = await page.evaluate(() => ({
        selectedCount: WaveSystem.endlessDraftMutatorIds.length,
        selectedId: WaveSystem.endlessDraftMutatorIds[0] || null,
        draftedDepths: [...WaveSystem.endlessDraftedDepths],
    }));
    assert(draftState.selectedCount === 1, `Draft pick should add one mutator (got ${draftState.selectedCount})`);
    assert(!!draftState.selectedId, 'Draft pick should persist selected mutator id');
    assert(draftState.draftedDepths.includes(1), 'Draft depth should be marked as claimed');

    const researchReshape = await page.evaluate(() => {
        const byId = (rows, id) => {
            for (const row of rows) {
                for (const node of row) {
                    if (node.id === id) return node;
                }
            }
            return null;
        };

        const blueprint = byId(RESEARCH.knowledge.nodes, 'blueprint');
        const mapmastery = byId(RESEARCH.knowledge.nodes, 'mapmastery');
        const tactical = byId(RESEARCH.knowledge.nodes, 'tactical');
        const orbcollect = byId(RESEARCH.knowledge.nodes, 'orbcollect');

        // Validate milestone boost mechanic is actually applied.
        const prevRP = GameState.researchPoints;
        const prevGold = GameState.gold;
        const prevBonuses = { ...GameState.researchBonuses };
        const prevMap = GameState.mapIndex;
        const prevWave = GameState.wave;
        const prevEndless = WaveSystem.endlessMode;
        const prevClaimed = GameState.metaProgress.endlessMilestonesClaimed;

        GameState.mapIndex = 0;
        GameState.wave = GameState.maxWave + 10;
        WaveSystem.endlessMode = true;

        GameState.researchPoints = 0;
        GameState.gold = 0;
        GameState.researchBonuses = {};
        GameState.metaProgress.endlessMilestonesClaimed = { '0': [] };
        WaveSystem._processEndlessMilestones();
        const baseRP = GameState.researchPoints;
        const baseGold = GameState.gold;

        GameState.researchPoints = 0;
        GameState.gold = 0;
        GameState.researchBonuses = { endlessMilestoneBoost: 0.5 };
        GameState.metaProgress.endlessMilestonesClaimed = { '0': [] };
        WaveSystem._processEndlessMilestones();
        const boostedRP = GameState.researchPoints;
        const boostedGold = GameState.gold;

        GameState.researchPoints = prevRP;
        GameState.gold = prevGold;
        GameState.researchBonuses = prevBonuses;
        GameState.mapIndex = prevMap;
        GameState.wave = prevWave;
        WaveSystem.endlessMode = prevEndless;
        GameState.metaProgress.endlessMilestonesClaimed = prevClaimed;

        return {
            blueprintHasDraftReroll: !!(blueprint && blueprint.effect && blueprint.effect.draftReroll === 1),
            mapmasteryHasMilestoneBoost: !!(mapmastery && mapmastery.effect && mapmastery.effect.endlessMilestoneBoost === 0.5),
            tacticalHasWeeklyBonus: !!(tactical && tactical.effect && tactical.effect.weeklyRpMult === 0.5),
            orbcollectHasCdReward: !!(orbcollect && orbcollect.effect && orbcollect.effect.abilityCdOnEliteKill === 0.6),
            baseRP,
            boostedRP,
            baseGold,
            boostedGold,
        };
    });

    assert(researchReshape.blueprintHasDraftReroll, 'Research reshape: blueprint node should grant draft reroll');
    assert(researchReshape.mapmasteryHasMilestoneBoost, 'Research reshape: mapmastery node should boost endless milestones');
    assert(researchReshape.tacticalHasWeeklyBonus, 'Research reshape: tactical node should boost weekly RP');
    assert(researchReshape.orbcollectHasCdReward, 'Research reshape: orbcollect node should grant cooldown reduction on elite/boss kills');
    assert(researchReshape.boostedRP > researchReshape.baseRP, 'Endless milestone RP should increase with reshaped research bonus');
    assert(researchReshape.boostedGold > researchReshape.baseGold, 'Endless milestone gold should increase with reshaped research bonus');

    await browser.close();
    console.log('PASS: Weekly challenge, endless mutator draft, and research reshape behavior validated.');
}

run().catch((err) => {
    console.error('FAIL:', err.message);
    process.exit(1);
});
