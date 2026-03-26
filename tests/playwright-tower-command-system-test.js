const { chromium } = require('playwright');

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

async function run() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });

    const targetUrl = process.env.BASE_URL || 'http://localhost:3000';
    await page.goto(targetUrl);
    await page.waitForFunction(() => typeof startGame === 'function' && typeof TowerCommands !== 'undefined');

    const setup = await page.evaluate(() => {
        MenuSystem.showScreen('game');
        startGame(0);
        GameState.settings.autoStart = false;
        if (WaveSystem.cancelCountdown) WaveSystem.cancelCountdown();
        GameState.gamePhase = 'idle';
        GameState.gold = 1200;

        const buildTiles = [];
        for (let r = 0; r < CONFIG.CANVAS_TILES_Y; r++) {
            for (let c = 0; c < CONFIG.CANVAS_TILES_X; c++) {
                if (!MapSystem.canBuild(c, r)) continue;
                buildTiles.push({ col: c, row: r, pos: gridToWorld(c, r) });
                if (buildTiles.length >= 5) break;
            }
            if (buildTiles.length >= 5) break;
        }

        const towerA = placeTower('arrow', buildTiles[0].pos.x, buildTiles[0].pos.y);
        const towerB = placeTower('arrow', buildTiles[1].pos.x, buildTiles[1].pos.y);
        const towerC = placeTower('lightning', buildTiles[2].pos.x, buildTiles[2].pos.y);
        UIRenderer.showTowerInfo(towerA);
        Input.multiSelectedTowers = [towerA, towerB];

        towerA.kills = 24;
        towerA.addXP(CONFIG.MASTERY_XP_PER_SCORE);

        return {
            towerAId: towerA.id,
            towerBId: towerB.id,
            towerCId: towerC.id,
            moveTarget: logicalToScreen(buildTiles[3].pos.x, buildTiles[3].pos.y),
            moveTargetCol: buildTiles[3].col,
            moveTargetRow: buildTiles[3].row,
            linkTarget: logicalToScreen(buildTiles[2].pos.x, buildTiles[2].pos.y),
            moveCost: towerA.getMoveCost(),
            linkCost: CONFIG.LINK_COST,
            sellValue: towerB.getSellValue(),
            goldAfterBuild: GameState.gold,
        };
    });

    const progressionState = await page.evaluate(({ towerAId }) => {
        const towerA = GameState.towers.find(t => t.id === towerAId);
        return towerA ? {
            score: towerA.getProgressionScore(),
            mastery: towerA.getMasteryData() ? towerA.getMasteryData().title : null,
            xpContribution: towerA.getXPScoreContribution(),
        } : null;
    }, { towerAId: setup.towerAId });

    assert(!!progressionState, 'Tower progression probe missing');
    assert(progressionState.score === 25, `Merged progression score should combine kills + xp contribution (got ${progressionState.score})`);
    assert(progressionState.mastery === 'Veteran', `Merged progression should unlock Veteran rank via combined score (got ${progressionState.mastery})`);
    assert(progressionState.xpContribution === 1, `Progression XP contribution mismatch (${progressionState.xpContribution})`);

    const formationState = await page.evaluate(({ towerAId }) => {
        const towerA = GameState.towers.find(t => t.id === towerAId);
        const formation = towerA ? towerA.getFormationBonus() : null;
        return formation ? { count: formation.count, dmg: formation.dmg } : null;
    }, { towerAId: setup.towerAId });

    assert(!!formationState, 'Tower formation probe missing');
    assert(formationState.count >= 2, `Local formation should count nearby same-type towers (got ${formationState.count})`);
    assert(formationState.dmg > 0, `Local formation should grant a damage bonus (got ${formationState.dmg})`);

    await page.click('#info-targeting .target-btn[data-mode="strongest"]');

    const targetingState = await page.evaluate(({ towerAId, towerBId }) => {
        const towerA = GameState.towers.find(t => t.id === towerAId);
        const towerB = GameState.towers.find(t => t.id === towerBId);
        return {
            towerAMode: towerA ? towerA.targetMode : null,
            towerBMode: towerB ? towerB.targetMode : null,
        };
    }, { towerAId: setup.towerAId, towerBId: setup.towerBId });

    assert(targetingState.towerAMode === 'strongest', `Primary selected tower target mode mismatch (${targetingState.towerAMode})`);
    assert(targetingState.towerBMode === 'strongest', `Batch target mode should apply to multi-selection (${targetingState.towerBMode})`);

    await page.evaluate(({ towerAId }) => {
        const towerA = GameState.towers.find(t => t.id === towerAId);
        Input.multiSelectedTowers = [];
        UIRenderer.showTowerInfo(towerA);
    }, { towerAId: setup.towerAId });

    await page.click('#btn-move-tower');
    await page.locator('#game-canvas').click({ position: setup.moveTarget });

    const moveState = await page.evaluate(({ towerAId, moveTargetCol, moveTargetRow, moveCost, goldAfterBuild }) => {
        const towerA = GameState.towers.find(t => t.id === towerAId);
        return {
            exists: !!towerA,
            col: towerA ? towerA.gridCol : null,
            row: towerA ? towerA.gridRow : null,
            moveMode: towerA ? towerA.isBeingMoved : null,
            goldDelta: goldAfterBuild - GameState.gold,
            moveTargetCol,
            moveTargetRow,
            moveCost,
        };
    }, {
        towerAId: setup.towerAId,
        moveTargetCol: setup.moveTargetCol,
        moveTargetRow: setup.moveTargetRow,
        moveCost: setup.moveCost,
        goldAfterBuild: setup.goldAfterBuild,
    });

    assert(moveState.exists, 'Moved tower should still exist');
    assert(moveState.col === moveState.moveTargetCol && moveState.row === moveState.moveTargetRow, `Tower move landed on wrong tile (${moveState.col},${moveState.row})`);
    assert(moveState.moveMode === false, 'Tower should exit move mode after successful relocation');
    assert(moveState.goldDelta === moveState.moveCost, `Move should spend exact move cost (${moveState.goldDelta} vs ${moveState.moveCost})`);

    await page.evaluate(({ towerAId }) => {
        const towerA = GameState.towers.find(t => t.id === towerAId);
        UIRenderer.showTowerInfo(towerA);
    }, { towerAId: setup.towerAId });

    const goldBeforeLink = await page.evaluate(() => GameState.gold);
    await page.click('#btn-link-tower');
    await page.locator('#game-canvas').click({ position: setup.linkTarget });

    const linkState = await page.evaluate(({ towerAId, towerCId, goldBeforeLink }) => {
        const towerA = GameState.towers.find(t => t.id === towerAId);
        const towerC = GameState.towers.find(t => t.id === towerCId);
        const bonuses = towerA ? towerA.getLinkBonuses() : null;
        return {
            linkExists: !!towerA && !!towerC && towerA.hasLinkTo(towerC),
            towerALinks: towerA ? towerA.links.length : 0,
            towerCLinks: towerC ? towerC.links.length : 0,
            goldDelta: goldBeforeLink - GameState.gold,
            rangeBonus: bonuses ? bonuses.range : 0,
            dmgBonus: bonuses ? bonuses.dmg : 0,
        };
    }, { towerAId: setup.towerAId, towerCId: setup.towerCId, goldBeforeLink });

    assert(linkState.linkExists, 'Tower link should connect selected tower to clicked target');
    assert(linkState.towerALinks === 1 && linkState.towerCLinks === 1, `Linked towers should each track one link (${linkState.towerALinks}/${linkState.towerCLinks})`);
    assert(linkState.goldDelta === setup.linkCost, `Link should spend exact link cost (${linkState.goldDelta} vs ${setup.linkCost})`);
    assert(linkState.rangeBonus > 0 || linkState.dmgBonus > 0, 'Link network should grant an active bonus');

    await page.evaluate(({ towerBId }) => {
        const towerB = GameState.towers.find(t => t.id === towerBId);
        UIRenderer.showTowerInfo(towerB);
    }, { towerBId: setup.towerBId });

    await page.click('#btn-sell-tower');

    const pendingSellState = await page.evaluate(({ towerBId }) => {
        const towerB = GameState.towers.find(t => t.id === towerBId);
        const sellBtn = document.getElementById('btn-sell-tower');
        return {
            stillExists: !!towerB,
            confirmArmed: !!towerB && towerB.sellConfirmActive,
            buttonText: sellBtn ? sellBtn.textContent || '' : '',
        };
    }, { towerBId: setup.towerBId });

    assert(pendingSellState.stillExists, 'First sell press should not immediately remove tower');
    assert(pendingSellState.confirmArmed, 'Sell confirmation should arm after first press');
    assert(/CONFIRM SELL/i.test(pendingSellState.buttonText), `Sell button should switch to confirm state (${pendingSellState.buttonText})`);

    const goldBeforeSell = await page.evaluate(() => GameState.gold);
    await page.click('#btn-sell-tower');

    const soldState = await page.evaluate(({ towerBId, goldBeforeSell }) => ({
        towerRemoved: !GameState.towers.some(t => t.id === towerBId),
        goldGain: GameState.gold - goldBeforeSell,
    }), { towerBId: setup.towerBId, goldBeforeSell });

    assert(soldState.towerRemoved, 'Second sell press should remove the tower');
    assert(soldState.goldGain === setup.sellValue, `Sell should refund exact tower sell value (${soldState.goldGain} vs ${setup.sellValue})`);

    await browser.close();
    console.log('PASS: Tower progression, formation, links, relocate flow, and sell confirmation validated.');
}

run().catch((err) => {
    console.error('FAIL:', err.message);
    process.exit(1);
});
