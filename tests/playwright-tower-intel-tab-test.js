const { chromium } = require('playwright');

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

async function validateTowerIntel(page, viewport) {
    await page.setViewportSize(viewport);
    await page.goto(process.env.BASE_URL || 'http://localhost:3000');
    await page.waitForFunction(() => typeof MenuSystem !== 'undefined' && typeof TOWERS !== 'undefined');

    await page.click('#btn-towers');

    await page.waitForFunction(() => {
        const screen = document.getElementById('towers-screen');
        const list = document.querySelectorAll('.tc-nav-btn');
        const detail = document.querySelector('.tower-codex-detail .tower-codex-card');
        return !!screen && screen.classList.contains('active') && list.length > 0 && !!detail;
    });

    const state = await page.evaluate(() => {
        const towersScreen = document.getElementById('towers-screen');
        const menuScreen = document.getElementById('main-menu');
        const summary = document.getElementById('tower-codex-summary');
        const navButtons = Array.from(document.querySelectorAll('.tc-nav-btn'));
        const activeButtons = Array.from(document.querySelectorAll('.tc-nav-btn.active'));
        const detailCards = Array.from(document.querySelectorAll('.tower-codex-detail .tower-codex-card'));
        const detailCard = detailCards[0] || null;
        const detailName = detailCard && detailCard.querySelector('.tc-head-main h3')
            ? (detailCard.querySelector('.tc-head-main h3').textContent || '').trim()
            : '';
        const expectedCount = typeof TOWERS !== 'undefined' ? Object.keys(TOWERS).length : 0;

        const firstCols = detailCard ? Array.from(detailCard.querySelectorAll('.tc-tier-col')) : [];
        const firstTierLabels = detailCard
            ? Array.from(detailCard.querySelectorAll('.tc-tier-label')).map((el) => (el.textContent || '').trim())
            : [];
        const hasCoreT1 = firstTierLabels.includes('T1');
        const hasCoreT2 = firstTierLabels.includes('T2');
        const hasPathT3 = firstTierLabels.includes('T3');
        const hasPathT4 = firstTierLabels.includes('T4');
        const hasPathT5 = firstTierLabels.includes('T5');

        const lockPills = navButtons.filter((btn) => btn.classList.contains('locked')).length;
        const unlockedByProgression = navButtons.filter((btn) => {
            const pill = btn.classList.contains('starter') || btn.classList.contains('licensed');
            return !!pill;
        }).length;

        const contentRect = document.querySelector('.tower-codex-content')?.getBoundingClientRect();
        const detailRect = detailCard ? detailCard.getBoundingClientRect() : null;

        return {
            towersActive: !!towersScreen && towersScreen.classList.contains('active'),
            menuActive: !!menuScreen && menuScreen.classList.contains('active'),
            summaryChipCount: summary ? summary.querySelectorAll('.tcs-chip').length : 0,
            navCount: navButtons.length,
            activeNavCount: activeButtons.length,
            detailCardCount: detailCards.length,
            detailName,
            expectedCount,
            firstColCount: firstCols.length,
            hasCoreT1,
            hasCoreT2,
            hasPathT3,
            hasPathT4,
            hasPathT5,
            lockPills,
            unlockedByProgression,
            contentRect: contentRect
                ? { left: contentRect.left, right: contentRect.right, width: contentRect.width }
                : null,
            detailRect: detailRect
                ? { left: detailRect.left, right: detailRect.right, width: detailRect.width }
                : null,
            viewportW: window.innerWidth,
        };
    });

    assert(state.towersActive, `Tower intel screen not active @${viewport.width}x${viewport.height}`);
    assert(!state.menuActive, `Main menu should be inactive while viewing tower intel @${viewport.width}x${viewport.height}`);
    assert(state.summaryChipCount === 3, `Tower intel summary should render 3 chips @${viewport.width}x${viewport.height}`);
    assert(state.expectedCount > 0, 'Expected tower catalog count should be > 0');
    assert(state.navCount === state.expectedCount, `Tower intel list count mismatch (${state.navCount}/${state.expectedCount}) @${viewport.width}x${viewport.height}`);
    assert(state.activeNavCount === 1, `Tower intel should keep one active tower selection @${viewport.width}x${viewport.height}`);
    assert(state.detailCardCount === 1, `Tower intel detail pane should render one tower card @${viewport.width}x${viewport.height}`);
    assert(state.firstColCount === 3, `Each tower card should show 3 tier columns @${viewport.width}x${viewport.height}`);
    assert(state.hasCoreT1 && state.hasCoreT2, `Core tier labels missing in tower intel @${viewport.width}x${viewport.height}`);
    assert(state.hasPathT3 && state.hasPathT4 && state.hasPathT5, `Path tier labels missing in tower intel @${viewport.width}x${viewport.height}`);
    assert(state.unlockedByProgression + state.lockPills === state.navCount, `Tower status pills mismatch @${viewport.width}x${viewport.height}`);

    if (state.contentRect) {
        assert(state.contentRect.left >= -1, `Tower intel content overflows left edge @${viewport.width}x${viewport.height}`);
        assert(state.contentRect.right <= state.viewportW + 1, `Tower intel content overflows right edge @${viewport.width}x${viewport.height}`);
    }
    if (state.detailRect) {
        assert(state.detailRect.left >= -1, `Tower card overflows left edge @${viewport.width}x${viewport.height}`);
        assert(state.detailRect.right <= state.viewportW + 1, `Tower card overflows right edge @${viewport.width}x${viewport.height}`);
    }

    await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('.tc-nav-btn'));
        if (buttons.length > 1) {
            const active = document.querySelector('.tc-nav-btn.active');
            const fallback = buttons.find((btn) => btn !== active) || buttons[buttons.length - 1];
            if (fallback) fallback.click();
        }
    });

    if (state.expectedCount > 1) {
        await page.waitForFunction((previousName) => {
            const nameEl = document.querySelector('.tower-codex-detail .tc-head-main h3');
            if (!nameEl) return false;
            return (nameEl.textContent || '').trim() !== previousName;
        }, state.detailName);
    }

    await page.click('#btn-back-towers');
    await page.waitForFunction(() => {
        const menu = document.getElementById('main-menu');
        const towers = document.getElementById('towers-screen');
        return !!menu && menu.classList.contains('active') && !!towers && !towers.classList.contains('active');
    });
}

async function run() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await validateTowerIntel(page, { width: 1600, height: 900 });
    await validateTowerIntel(page, { width: 390, height: 844 });

    await browser.close();
    console.log('PASS: Tower Intel tab navigation, tier content, and responsive layout validated.');
}

run().catch((err) => {
    console.error('FAIL:', err.message);
    process.exit(1);
});
