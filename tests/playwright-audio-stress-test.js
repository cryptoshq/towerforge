const { chromium } = require('playwright');

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

function createScenarios() {
    const swarm = [];
    for (let i = 0; i < 260; i++) {
        const t = 10 + i * 0.008;
        swarm.push({ type: 'arrow', t });
        if (i % 2 === 0) swarm.push({ type: 'hit', t: t + 0.001 });
    }

    const artillery = [];
    for (let i = 0; i < 120; i++) {
        const t = 20 + i * 0.03;
        artillery.push({ type: 'cannon', t });
        artillery.push({ type: 'explosion', t: t + 0.008 });
        if (i % 2 === 0) artillery.push({ type: 'missile', t: t + 0.015 });
    }

    const mixed = [];
    for (let i = 0; i < 300; i++) {
        const t = 30 + i * 0.01;
        const types = ['arrow', 'hit', 'lightning', 'cannon', 'explosion', 'laser', 'missile'];
        mixed.push({ type: types[i % types.length], t });
        if (i % 12 === 0) mixed.push({ type: 'boss', t: t + 0.002 });
        if (i % 15 === 0) mixed.push({ type: 'leak', t: t + 0.003 });
        if (i % 20 === 0) mixed.push({ type: 'ability', t: t + 0.004 });
    }

    return { swarm, artillery, mixed };
}

async function run() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    const url = process.env.BASE_URL || 'http://localhost:3000';
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof Audio !== 'undefined');

    const scenarios = createScenarios();

    const result = await page.evaluate((input) => {
        const runScenario = (events) => {
            Audio._sfxLimiterState = {};
            Audio._sfxCategoryState = {};

            let allowed = 0;
            let blocked = 0;
            let bright = 0;
            let vol = 0;
            const critical = { total: 0, allowed: 0 };

            for (const ev of events) {
                const r = Audio._applySfxLimiter(ev.type, ev.t, 0.3, 1.0);
                const isCritical = ev.type === 'boss' || ev.type === 'leak' || ev.type === 'ability';
                if (isCritical) critical.total++;

                if (r.allow) {
                    allowed++;
                    bright += r.brightnessMult || 1;
                    vol += r.volume || 0;
                    if (isCritical) critical.allowed++;
                } else {
                    blocked++;
                }
            }

            return {
                allowed,
                blocked,
                allowRate: allowed / Math.max(1, allowed + blocked),
                avgBrightness: allowed > 0 ? bright / allowed : 0,
                avgVolume: allowed > 0 ? vol / allowed : 0,
                criticalAllowRate: critical.total > 0 ? critical.allowed / critical.total : 1,
            };
        };

        return {
            swarm: runScenario(input.swarm),
            artillery: runScenario(input.artillery),
            mixed: runScenario(input.mixed),
        };
    }, scenarios);

    assert(result.swarm.allowRate >= 0.25 && result.swarm.allowRate <= 0.50, `Swarm allow-rate out of target band: ${result.swarm.allowRate.toFixed(3)}`);
    assert(result.artillery.allowRate >= 0.25 && result.artillery.allowRate <= 0.50, `Artillery allow-rate out of target band: ${result.artillery.allowRate.toFixed(3)}`);
    assert(result.mixed.allowRate >= 0.60 && result.mixed.allowRate <= 0.88, `Mixed allow-rate out of target band: ${result.mixed.allowRate.toFixed(3)}`);

    assert(result.swarm.avgBrightness < 0.96, `Swarm brightness not damped enough: ${result.swarm.avgBrightness.toFixed(3)}`);
    assert(result.mixed.avgBrightness < 0.93, `Mixed brightness not damped enough: ${result.mixed.avgBrightness.toFixed(3)}`);
    assert(result.mixed.criticalAllowRate >= 0.92, `Critical cue pass-through too low: ${result.mixed.criticalAllowRate.toFixed(3)}`);

    console.log('PASS: Audio stress presets tuned and validated.');
    console.log(JSON.stringify(result, null, 2));

    await browser.close();
}

run().catch((err) => {
    console.error('FAIL:', err.message);
    process.exit(1);
});
