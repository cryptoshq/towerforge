const { chromium } = require('playwright');

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

function normalizeEdge(a, b) {
    return a < b ? `${a}|${b}` : `${b}|${a}`;
}

async function run() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });

    const targetUrl = process.env.BASE_URL || 'http://localhost:3000';
    await page.goto(targetUrl);
    await page.waitForFunction(() => typeof startGame === 'function' && typeof SaveSystem !== 'undefined' && typeof TowerCommands !== 'undefined');

    const setup = await page.evaluate(() => {
        MenuSystem.showScreen('game');
        startGame(0);
        GameState.settings.autoStart = false;
        if (WaveSystem.cancelCountdown) WaveSystem.cancelCountdown();
        GameState.gamePhase = 'idle';
        GameState.gold = 5000;

        const buildTiles = [];
        for (let r = 0; r < CONFIG.CANVAS_TILES_Y; r++) {
            for (let c = 0; c < CONFIG.CANVAS_TILES_X; c++) {
                if (!MapSystem.canBuild(c, r)) continue;
                buildTiles.push({ col: c, row: r, pos: gridToWorld(c, r) });
            }
        }

        const anchorTile = buildTiles.find(tile =>
            buildTiles.filter(other =>
                other !== tile
                && Math.hypot(other.pos.x - tile.pos.x, other.pos.y - tile.pos.y) <= (CONFIG.LINK_RANGE - 8)
            ).length >= 2
        );
        if (!anchorTile) {
            return { ok: false, reason: 'No buildable tile with two in-range neighbors for link test.' };
        }

        const neighbors = buildTiles
            .filter(other =>
                other !== anchorTile
                && Math.hypot(other.pos.x - anchorTile.pos.x, other.pos.y - anchorTile.pos.y) <= (CONFIG.LINK_RANGE - 8)
            )
            .slice(0, 2);

        const towerA = placeTower('arrow', anchorTile.pos.x, anchorTile.pos.y);
        const towerB = placeTower('lightning', neighbors[0].pos.x, neighbors[0].pos.y);
        const towerC = placeTower('cannon', neighbors[1].pos.x, neighbors[1].pos.y);
        if (!towerA || !towerB || !towerC) {
            return { ok: false, reason: 'Failed to place towers for link save/load test.' };
        }

        const linkAB = TowerCommands.toggleLink(towerA, towerB);
        const linkAC = TowerCommands.toggleLink(towerA, towerC);
        if (!linkAB.ok || !linkAB.linked || !linkAC.ok || !linkAC.linked) {
            return { ok: false, reason: `Failed to create links (AB=${JSON.stringify(linkAB)}, AC=${JSON.stringify(linkAC)})` };
        }

        const keyFor = (tower) => `${tower.type}:${tower.gridCol}:${tower.gridRow}`;
        const edgeSet = new Set();
        for (const tower of [towerA, towerB, towerC]) {
            const sourceKey = keyFor(tower);
            for (const linked of tower.getLinkedTowers()) {
                edgeSet.add(sourceKey < keyFor(linked)
                    ? `${sourceKey}|${keyFor(linked)}`
                    : `${keyFor(linked)}|${sourceKey}`);
            }
        }

        SaveSystem.autoSave();

        const raw = localStorage.getItem(SaveSystem.GAME_KEY);
        const parsed = SaveSystem._validateAndParse(raw);
        const serializedHasLinks = !!(parsed
            && Array.isArray(parsed.towers)
            && parsed.towers.some(t => Array.isArray(t.ln) && t.ln.length > 0));

        const savedGold = GameState.gold;
        const savedWave = GameState.wave;
        const expectedEdges = [...edgeSet];

        // Corrupt live state to prove load restores link graph from save.
        for (const tower of GameState.towers) {
            tower.clearAllLinks();
        }
        GameState.towers = [];
        GameState.gold = 1;
        GameState.wave = 1;
        GameState.score = 0;

        const loaded = SaveSystem.loadGame();

        const loadedTowers = [...GameState.towers];
        const loadedByKey = new Map(loadedTowers.map(t => [`${t.type}:${t.gridCol}:${t.gridRow}`, t]));
        const loadedEdgeSet = new Set();
        for (const tower of loadedTowers) {
            const sourceKey = `${tower.type}:${tower.gridCol}:${tower.gridRow}`;
            for (const linked of tower.getLinkedTowers()) {
                const linkedKey = `${linked.type}:${linked.gridCol}:${linked.gridRow}`;
                loadedEdgeSet.add(sourceKey < linkedKey ? `${sourceKey}|${linkedKey}` : `${linkedKey}|${sourceKey}`);
            }
        }

        const anchorKey = `${towerA.type}:${towerA.gridCol}:${towerA.gridRow}`;
        const loadedAnchor = loadedByKey.get(anchorKey);
        const anchorLinkBonuses = loadedAnchor ? loadedAnchor.getLinkBonuses() : null;

        return {
            ok: true,
            loaded,
            serializedHasLinks,
            expectedEdgeCount: expectedEdges.length,
            expectedEdges,
            loadedEdges: [...loadedEdgeSet],
            loadedTowerCount: loadedTowers.length,
            savedGold,
            loadedGold: GameState.gold,
            savedWave,
            loadedWave: GameState.wave,
            anchorLinkCount: anchorLinkBonuses ? anchorLinkBonuses.count : 0,
            anchorLinkDamage: anchorLinkBonuses ? anchorLinkBonuses.dmg : 0,
        };
    });

    assert(setup.ok, setup.reason || 'Failed to set up linked tower save/load regression.');
    assert(setup.serializedHasLinks, 'Saved game payload should contain serialized tower links (ln).');
    assert(setup.loaded, 'SaveSystem.loadGame() should succeed for linked-tower save payload.');
    assert(setup.loadedTowerCount === 3, `Loaded tower count mismatch (${setup.loadedTowerCount}).`);
    assert(setup.loadedGold === setup.savedGold, `Loaded gold mismatch (${setup.loadedGold} vs ${setup.savedGold}).`);
    assert(setup.loadedWave === setup.savedWave, `Loaded wave mismatch (${setup.loadedWave} vs ${setup.savedWave}).`);
    assert(setup.expectedEdgeCount === 2, `Expected two saved links, got ${setup.expectedEdgeCount}.`);
    assert(setup.loadedEdges.length === setup.expectedEdges.length, `Loaded link count mismatch (${setup.loadedEdges.length} vs ${setup.expectedEdges.length}).`);
    for (const edge of setup.expectedEdges) {
        assert(setup.loadedEdges.includes(edge), `Missing restored link edge ${edge}.`);
    }
    assert(setup.anchorLinkCount === 2, `Anchor tower should restore two links (got ${setup.anchorLinkCount}).`);
    assert(setup.anchorLinkDamage > 0, `Anchor tower should have active link damage bonus (got ${setup.anchorLinkDamage}).`);

    await browser.close();
    console.log('PASS: Linked tower network serializes and restores correctly through SaveSystem.');
}

run().catch((err) => {
    console.error('FAIL:', err.message);
    process.exit(1);
});
