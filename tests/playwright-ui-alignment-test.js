const { chromium } = require('playwright');

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

async function checkViewport(page, viewport) {
    await page.setViewportSize(viewport);
    await page.goto(process.env.BASE_URL || 'http://localhost:3000');
    await page.waitForFunction(() => typeof startGame === 'function');

    // Menu alignment + continue label overflow check
    await page.evaluate(() => {
        const payload = {
            _version: SaveSystem.SAVE_VERSION,
            _timestamp: Date.now() - 12 * 60 * 1000,
            mapIndex: 0,
            difficulty: 'nightmare',
            endlessMode: true,
            activeChallenges: ['half_gold', 'speed_run', 'tower_limit'],
            wave: 28,
            gold: 900,
            lives: 9,
            score: 3000,
            time: 1420,
            towers: [],
            stats: {},
        };
        localStorage.setItem(SaveSystem.GAME_KEY, SaveSystem._wrapWithChecksum(payload));
        MenuSystem.showScreen('menu');
        MenuSystem._updateContinueButton();
    });

    const continueLayout = await page.evaluate(() => {
        const btn = document.getElementById('btn-continue');
        const subtitle = btn ? btn.querySelector('.btn-subtitle') : null;
        if (!btn || !subtitle) return { ok: false, reason: 'missing continue subtitle' };
        return {
            ok: true,
            btnScrollW: btn.scrollWidth,
            btnClientW: btn.clientWidth,
            subScrollW: subtitle.scrollWidth,
            subClientW: subtitle.clientWidth,
        };
    });
    assert(continueLayout.ok, `Continue subtitle missing @${viewport.width}x${viewport.height}`);
    assert(
        continueLayout.subScrollW <= continueLayout.subClientW + 2,
        `Continue subtitle overflows button @${viewport.width}x${viewport.height}`
    );

    await page.evaluate(() => {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById('game-screen').classList.add('active');
        startGame(0);
        GameState.settings.autoStart = false;
        if (WaveSystem.cancelCountdown) WaveSystem.cancelCountdown();
        GameState.gamePhase = 'idle';
        GameState.wave = 4;
        UIRenderer.lastWave = -1;
        UIRenderer.lastThreatHint = null;
        UIRenderer.updateHUD();
        const startBtn = document.getElementById('btn-start-wave');
        const skipBtn = document.getElementById('btn-skip-wave');
        if (startBtn) startBtn.classList.remove('hidden');
        if (skipBtn) skipBtn.style.display = 'none';
        WaveSystem._showSkipReadyPrompt();
    });

    // Path-choice modal layout check
    await page.evaluate(() => {
        GameState.gold = 99999;
        const tower = new Tower('arrow', 260, 260);
        tower.tier = 2;
        tower._applyTierStats();
        UIRenderer.showPathChoice(tower);
    });

    await page.waitForFunction(() => {
        const modal = document.querySelector('#path-choice-modal .path-modal');
        return !!modal && getComputedStyle(modal).display !== 'none';
    });

    const pathModalLayout = await page.evaluate(() => {
        const modal = document.querySelector('#path-choice-modal .path-modal');
        const cardA = document.getElementById('path-a-card');
        const cardB = document.getElementById('path-b-card');
        const badgeA = cardA ? cardA.querySelector('.path-card-cost-badge') : null;
        const badgeB = cardB ? cardB.querySelector('.path-card-cost-badge') : null;
        if (!modal || !cardA || !cardB || !badgeA || !badgeB) {
            return { ok: false };
        }
        const m = modal.getBoundingClientRect();
        const a = cardA.getBoundingClientRect();
        const b = cardB.getBoundingClientRect();
        const ba = badgeA.getBoundingClientRect();
        const bb = badgeB.getBoundingClientRect();
        return {
            ok: true,
            modal: { left: m.left, top: m.top, right: m.right, bottom: m.bottom, width: m.width, height: m.height },
            cardA: { top: a.top, bottom: a.bottom, width: a.width },
            cardB: { top: b.top, bottom: b.bottom, width: b.width },
            badgeA: { bottom: ba.bottom, cardBottom: a.bottom },
            badgeB: { bottom: bb.bottom, cardBottom: b.bottom },
            viewportW: window.innerWidth,
            viewportH: window.innerHeight,
        };
    });
    assert(pathModalLayout.ok, `Path modal elements missing @${viewport.width}x${viewport.height}`);
    assert(pathModalLayout.modal.left >= 4 && pathModalLayout.modal.right <= pathModalLayout.viewportW - 4, `Path modal overflows horizontally @${viewport.width}x${viewport.height}`);
    assert(pathModalLayout.modal.top >= 4 && pathModalLayout.modal.bottom <= pathModalLayout.viewportH - 4, `Path modal overflows vertically @${viewport.width}x${viewport.height}`);
    assert(Math.abs(pathModalLayout.cardA.top - pathModalLayout.cardB.top) <= 2, `Path cards top misaligned @${viewport.width}x${viewport.height}`);
    assert(Math.abs(pathModalLayout.cardA.bottom - pathModalLayout.cardB.bottom) <= 4, `Path cards bottom misaligned @${viewport.width}x${viewport.height}`);
    assert(Math.abs(pathModalLayout.cardA.width - pathModalLayout.cardB.width) <= 4, `Path cards width mismatch @${viewport.width}x${viewport.height}`);
    assert(pathModalLayout.badgeA.bottom <= pathModalLayout.badgeA.cardBottom + 1, `Path A cost badge overflows card @${viewport.width}x${viewport.height}`);
    assert(pathModalLayout.badgeB.bottom <= pathModalLayout.badgeB.cardBottom + 1, `Path B cost badge overflows card @${viewport.width}x${viewport.height}`);

    await page.evaluate(() => {
        const overlay = document.getElementById('path-choice-modal');
        if (overlay) overlay.style.display = 'none';
    });

    await page.waitForFunction(() => {
        const startBtn = document.getElementById('btn-start-wave');
        const skipBtn = document.getElementById('btn-skip-wave');
        return !!startBtn && !!skipBtn && getComputedStyle(startBtn).display !== 'none';
    });

    await page.evaluate(() => {
        WaveSystem.startCountdown(6, () => {});
    });

    await page.waitForFunction(() => {
        const b = UIRenderer && UIRenderer._lastCountdownBounds;
        return !!(b && Number.isFinite(b.x) && Number.isFinite(b.y) && Number.isFinite(b.radius));
    });

    const countdownLayout = await page.evaluate(() => {
        const countdown = UIRenderer._lastCountdownBounds;
        if (!countdown || typeof logicalToScreen !== 'function') return { ok: false };

        const toVisibleRect = (el) => {
            if (!el) return null;
            const style = getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity || '1') <= 0.01) {
                return null;
            }
            const r = el.getBoundingClientRect();
            return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
        };

        const startRect = toVisibleRect(document.getElementById('btn-start-wave'));
        const skipRect = toVisibleRect(document.getElementById('btn-skip-wave'));
        const targets = [startRect, skipRect].filter(Boolean);
        if (targets.length === 0) return { ok: false };

        const center = logicalToScreen(countdown.x, countdown.y);
        const scale = typeof renderScale !== 'undefined' ? renderScale : 1;
        const radiusPx = (countdown.radius + 6) * scale;
        const circle = {
            left: center.x - radiusPx,
            right: center.x + radiusPx,
            top: center.y - radiusPx,
            bottom: center.y + radiusPx,
        };

        const overlaps = targets.some((r) => {
            return !(circle.right < r.left || circle.left > r.right || circle.bottom < r.top || circle.top > r.bottom);
        });

        return { ok: true, overlaps };
    });
    assert(countdownLayout.ok, `Countdown layout data missing @${viewport.width}x${viewport.height}`);
    assert(!countdownLayout.overlaps, `Countdown overlaps start/skip controls @${viewport.width}x${viewport.height}`);

    await page.evaluate(() => {
        if (WaveSystem.cancelCountdown) WaveSystem.cancelCountdown();
    });

    const data = await page.evaluate(() => {
        const rectOf = (id) => {
            const el = document.getElementById(id);
            if (!el) return null;
            const r = el.getBoundingClientRect();
            return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
        };

        const root = getComputedStyle(document.documentElement);
        const sidebarW = parseFloat(root.getPropertyValue('--sidebar-w')) || 220;
        const expectedCenterX = (window.innerWidth - sidebarW) / 2;

        const bar = document.getElementById('ability-bar');
        const abilityButtons = bar ? [...bar.querySelectorAll('.ability-btn')] : [];
        const barRect = bar ? bar.getBoundingClientRect() : null;

        return {
            hud: document.querySelector('.game-hud-top')?.getBoundingClientRect().toJSON(),
            hudWave: document.getElementById('hud-wave')?.getBoundingClientRect().toJSON(),
            sidebar: document.getElementById('tower-sidebar')?.getBoundingClientRect().toJSON(),
            canvas: document.getElementById('game-canvas')?.getBoundingClientRect().toJSON(),
            startBtn: rectOf('btn-start-wave'),
            skipBtn: rectOf('btn-skip-wave'),
            banner: rectOf('wave-banner'),
            towerInfo: rectOf('tower-info'),
            abilityBar: barRect ? { left: barRect.left, right: barRect.right, top: barRect.top, bottom: barRect.bottom } : null,
            abilityButtons: abilityButtons.map(b => {
                const r = b.getBoundingClientRect();
                return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
            }),
            hudThreat: (() => {
                const el = document.getElementById('hud-threat-val');
                const waveEl = document.getElementById('hud-wave');
                if (!el) return null;
                const r = el.getBoundingClientRect();
                const wr = waveEl ? waveEl.getBoundingClientRect() : null;
                return {
                    text: el.textContent || '',
                    left: r.left,
                    right: r.right,
                    waveLeft: wr ? wr.left : 0,
                    waveRight: wr ? wr.right : 0,
                };
            })(),
            expectedCenterX,
            viewportW: window.innerWidth,
            viewportH: window.innerHeight,
        };
    });

    assert(data.hud && data.sidebar && data.canvas, `Missing critical game layout elements @${viewport.width}x${viewport.height}`);
    assert(Math.abs(data.sidebar.top - data.hud.bottom) <= 2, `Sidebar top misaligned with HUD bottom @${viewport.width}x${viewport.height}`);
    assert(data.sidebar.right <= data.viewportW + 1, `Sidebar exceeds viewport @${viewport.width}x${viewport.height}`);

    const centerChecks = [
        ['start button', data.startBtn],
        ['skip button', data.skipBtn],
        ['wave banner', data.banner],
    ];
    for (const [name, rect] of centerChecks) {
        assert(rect, `Missing ${name} @${viewport.width}x${viewport.height}`);
        const cx = rect.left + rect.width / 2;
        assert(Math.abs(cx - data.expectedCenterX) <= 2, `${name} center misaligned by ${Math.abs(cx - data.expectedCenterX).toFixed(2)}px @${viewport.width}x${viewport.height}`);
    }

    assert(data.abilityBar, `Ability bar missing @${viewport.width}x${viewport.height}`);
    for (const b of data.abilityButtons) {
        assert(b.left >= data.abilityBar.left - 1, `Ability button overflows left @${viewport.width}x${viewport.height}`);
        assert(b.right <= data.abilityBar.right + 1, `Ability button overflows right @${viewport.width}x${viewport.height}`);
    }

    const buttonRows = new Set(data.abilityButtons.map(b => Math.round(b.top))).size;
    assert(buttonRows === 1, `Ability bar should stay one row @${viewport.width}x${viewport.height}`);

    assert(data.hudWave && data.hudThreat, `Wave HUD threat element missing @${viewport.width}x${viewport.height}`);
    assert(data.hudThreat.text.length > 0, `Wave HUD threat text empty @${viewport.width}x${viewport.height}`);
    assert(data.hudThreat.left >= data.hudThreat.waveLeft - 1, `Wave HUD threat left overflow @${viewport.width}x${viewport.height}`);
    assert(data.hudThreat.right <= data.hudThreat.waveRight + 1, `Wave HUD threat right overflow @${viewport.width}x${viewport.height}`);
}

async function run() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    const viewports = [
        { width: 1920, height: 1080 },
        { width: 1600, height: 900 },
        { width: 1366, height: 768 },
        { width: 1280, height: 720 },
    ];

    for (const vp of viewports) {
        await checkViewport(page, vp);
    }

    await browser.close();
    console.log('PASS: UI alignment checks passed across target viewports.');
}

run().catch((err) => {
    console.error('FAIL:', err.message);
    process.exit(1);
});
