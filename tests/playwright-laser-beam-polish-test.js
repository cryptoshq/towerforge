const { chromium } = require('playwright');

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

async function run() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });

    await page.goto(process.env.BASE_URL || 'http://localhost:3000');
    await page.waitForFunction(() => typeof startGame === 'function' && typeof LASER_BEAM_VISUALS !== 'undefined');

    const result = await page.evaluate(() => {
        MenuSystem.showScreen('game');
        startGame(0);
        GameState.settings.autoStart = false;
        if (WaveSystem.cancelCountdown) WaveSystem.cancelCountdown();
        GameState.gamePhase = 'idle';
        GameState.beams = [];

        const enemy = new Enemy('basic', 1);
        enemy.pathIndex = 0;
        enemy.progress = 0;
        enemy.x = 300;
        enemy.y = 210;
        enemy.renderX = enemy.x;
        enemy.renderY = enemy.y;
        enemy.prevX = enemy.x;
        enemy.prevY = enemy.y;
        enemy.alive = true;
        GameState.enemies = [enemy];

        const focused = new Tower('laser', 200, 200);
        focused.path = 'A';
        focused.tier = 5;
        focused.special = {
            ...focused.special,
            beam: true,
            dps: 90,
            rampRate: 0.12,
            rampMax: 1.5,
        };
        focused.beamRamp = 0.9;

        const prism = new Tower('laser', 200, 230);
        prism.path = 'B';
        prism.tier = 5;
        prism.special = {
            ...prism.special,
            beam: true,
            dps: 20,
            beamSplit: 5,
            splitDmg: 0.5,
            rampRate: 0,
            rampMax: 1,
        };
        prism.beamRamp = 0.35;

        const focusedMain = focused._getLaserBeamProfile('main');
        const prismMain = prism._getLaserBeamProfile('main');
        const prismSplit = prism._getLaserBeamProfile('split');
        const focusedDeath = focused._getLaserBeamProfile('deathRay', 0.9);

        focused._spawnLaserBeam(enemy.x, enemy.y, 'main', 0.05, 1.0);
        const focusedBeam = GameState.beams[GameState.beams.length - 1];

        prism._spawnLaserBeam(enemy.x + 20, enemy.y + 5, 'split', 0.05, 0.9);
        const splitBeam = GameState.beams[GameState.beams.length - 1];

        focused._spawnLaserBeam(enemy.x - 10, enemy.y - 5, 'deathRay', 0.06, 1.05, 0.9);
        const deathBeam = GameState.beams[GameState.beams.length - 1];

        return {
            focusedMain,
            prismMain,
            prismSplit,
            focusedDeath,
            focusedBeam,
            splitBeam,
            deathBeam,
        };
    });

    assert(result.focusedMain && result.focusedMain.style, 'Focused laser profile should include beam style');
    assert(result.prismMain && result.prismMain.style, 'Prism laser profile should include beam style');
    assert(result.focusedMain.style.outerColor !== result.prismMain.style.outerColor, 'Focused and prism main beam colors should differ');

    assert(result.prismSplit.style.dual, 'Prism split profile should use dual beam rendering');
    assert(result.focusedDeath.style.dual, 'Death ray profile should use dual beam rendering');
    assert(result.focusedDeath.width > result.focusedMain.width, `Death ray should be wider than main beam (${result.focusedDeath.width} vs ${result.focusedMain.width})`);

    assert(result.focusedBeam.coreColor && result.focusedBeam.glowColor, 'Focused spawned beam should persist styled core/glow colors');
    assert(result.splitBeam.dual, 'Split spawned beam should persist dual rendering flag');
    assert(result.deathBeam.dual && result.deathBeam.width > result.focusedBeam.width, 'Death ray spawned beam should be dual and wider than focused main beam');

    await browser.close();
    console.log('PASS: Laser beam polish profiles and styled beam rendering validated.');
}

run().catch((err) => {
    console.error('FAIL:', err.message);
    process.exit(1);
});
