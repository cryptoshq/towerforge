const { chromium } = require('playwright');

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

async function run() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });

    await page.goto(process.env.BASE_URL || 'http://localhost:3000');
    await page.waitForFunction(() => typeof startGame === 'function' && typeof Projectile !== 'undefined' && typeof PROJECTILE_VISUALS !== 'undefined');

    const results = await page.evaluate(() => {
        MenuSystem.showScreen('game');
        startGame(0);

        const hasVisualDiff = (a, b) => {
            const keys = [
                'family',
                'bodyColor',
                'coreColor',
                'accentColor',
                'trailColor',
                'trailAccent',
                'impactStyle',
                'size',
                'length',
                'width',
                'trailMode',
            ];
            return keys.some((key) => (a && a[key]) !== (b && b[key]));
        };

        const projectileTypes = ['arrow', 'cannon', 'ice', 'lightning', 'sniper', 'missile', 'flame', 'venom', 'mortar', 'necro'];
        const report = [];

        for (const type of projectileTypes) {
            const tower = new Tower(type, 200, 200);
            const target = { x: 260, y: 200, alive: true, size: 10, isBoss: false, hp: 100, maxHp: 100 };

            tower.path = null;
            const baseProj = new Projectile({ x: tower.x, y: tower.y, target, damage: 10, tower, type, special: {} });

            tower.path = 'A';
            const pathAProj = new Projectile({ x: tower.x, y: tower.y, target, damage: 10, tower, type, special: {} });

            tower.path = 'B';
            const pathBProj = new Projectile({ x: tower.x, y: tower.y, target, damage: 10, tower, type, special: {} });

            const cfg = PROJECTILE_VISUALS[type];
            const baseVisual = baseProj.visual;
            const aVisual = pathAProj.visual;
            const bVisual = pathBProj.visual;

            let impactSpawnOk = true;
            try {
                baseProj._spawnImpactVisual(target, [target]);
                pathAProj._spawnImpactVisual(target, [target]);
                pathBProj._spawnImpactVisual(target, [target]);
            } catch (err) {
                impactSpawnOk = false;
            }

            report.push({
                type,
                hasConfig: !!cfg,
                baseFamily: baseVisual.family,
                baseHasBodyColor: !!baseVisual.bodyColor,
                baseNotGeneric: !(baseVisual.family === 'orb' && baseVisual.bodyColor === '#ffffff'),
                baseMatchesTypeConfig: cfg ? (baseVisual.family === cfg.base.family && baseVisual.bodyColor === cfg.base.bodyColor) : false,
                pathAHasOverride: hasVisualDiff(baseVisual, aVisual),
                pathBHasOverride: hasVisualDiff(baseVisual, bVisual),
                impactPresetExists: !!(baseVisual.impactStyle && PROJECTILE_IMPACT_PRESETS[baseVisual.impactStyle]),
                impactSpawnOk,
            });
        }

        return report;
    });

    for (const entry of results) {
        assert(entry.hasConfig, `Missing projectile visual config for ${entry.type}`);
        assert(entry.baseHasBodyColor, `Missing body color for ${entry.type}`);
        assert(entry.baseNotGeneric, `${entry.type} still resolves to generic projectile fallback`);
        assert(entry.baseMatchesTypeConfig, `${entry.type} base projectile does not resolve from PROJECTILE_VISUALS base layer`);
        assert(entry.pathAHasOverride, `${entry.type} path A visual does not differ from base`);
        assert(entry.pathBHasOverride, `${entry.type} path B visual does not differ from base`);
        assert(entry.impactPresetExists, `${entry.type} impact style is missing in PROJECTILE_IMPACT_PRESETS`);
        assert(entry.impactSpawnOk, `${entry.type} impact style handler threw during spawn`);
    }

    await browser.close();
    console.log('PASS: Projectile visual configs resolve for all 10 projectile towers with path overrides and impact styles.');
}

run().catch((err) => {
    console.error('FAIL:', err.message);
    process.exit(1);
});
