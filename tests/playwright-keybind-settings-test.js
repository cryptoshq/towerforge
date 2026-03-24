const { chromium } = require('playwright');

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

async function waitTwoRafs(page) {
    await page.evaluate(() => new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
    }));
}

async function prepareIdleGame(page) {
    await page.evaluate(() => {
        MenuSystem.showScreen('game');
        startGame(0);
        GameState.settings.autoStart = false;
        if (WaveSystem.cancelCountdown) WaveSystem.cancelCountdown();
        GameState.gamePhase = 'idle';
        const startBtn = document.getElementById('btn-start-wave');
        if (startBtn) startBtn.classList.remove('hidden');
    });
}

async function run() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });

    const targetUrl = process.env.BASE_URL || 'http://localhost:3000';
    await page.goto(targetUrl);
    await page.waitForFunction(() => typeof startGame === 'function' && typeof Input !== 'undefined');

    await page.evaluate(() => {
        localStorage.clear();
        GameState.settings.hotkeys = { ...Input.defaultHotkeys };
        Input.applySettingsHotkeys();
        SaveSystem.savePersistent();
        MenuSystem.showScreen('settings');
        MenuSystem.loadSettings();
    });

    await page.waitForSelector('#settings-hotkey-grid .hotkey-bind-btn[data-action="startWave"]');
    await page.click('#settings-hotkey-grid .hotkey-bind-btn[data-action="startWave"]');
    await page.keyboard.press('KeyP');

    await page.waitForFunction(() => Input.getHotkeyCode('startWave') === 'KeyP');

    const remapState = await page.evaluate(() => ({
        startWaveCode: Input.getHotkeyCode('startWave'),
        startWaveLabel: Input.getHotkeyLabel('startWave'),
    }));
    assert(remapState.startWaveCode === 'KeyP', `Start-wave hotkey code mismatch (${remapState.startWaveCode})`);
    assert(remapState.startWaveLabel === 'P', `Start-wave hotkey label mismatch (${remapState.startWaveLabel})`);

    await prepareIdleGame(page);

    await page.keyboard.press('Space');
    await waitTwoRafs(page);
    const phaseAfterSpace = await page.evaluate(() => GameState.gamePhase);
    assert(phaseAfterSpace === 'idle', `Default Space key should not start wave after remap (phase=${phaseAfterSpace})`);

    await page.keyboard.press('KeyP');
    await page.waitForFunction(() => GameState.gamePhase === 'playing');

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof startGame === 'function' && typeof Input !== 'undefined');

    const persistedCode = await page.evaluate(() => Input.getHotkeyCode('startWave'));
    assert(persistedCode === 'KeyP', `Remapped hotkey did not persist after reload (${persistedCode})`);

    await prepareIdleGame(page);
    await page.keyboard.press('KeyP');
    await page.waitForFunction(() => GameState.gamePhase === 'playing');

    await page.evaluate(() => {
        Input.resetHotkeys();
        SaveSystem.savePersistent();
    });

    await browser.close();
    console.log('PASS: Keybind remapping updates gameplay input and persists.');
}

run().catch((err) => {
    console.error('FAIL:', err.message);
    process.exit(1);
});
