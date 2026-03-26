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

    const reservedKeyPolicy = await page.evaluate(() => ({
        digit8: Input._isReservedHotkeyCode('Digit8'),
        digit9: Input._isReservedHotkeyCode('Digit9'),
        digit0: Input._isReservedHotkeyCode('Digit0'),
        minus: Input._isReservedHotkeyCode('Minus'),
        equal: Input._isReservedHotkeyCode('Equal'),
        keyP: Input._isReservedHotkeyCode('KeyP'),
        hint: (document.querySelector('.settings-keybinds-hint') || {}).textContent || '',
    }));
    assert(reservedKeyPolicy.digit8, 'Digit8 should remain reserved for tower slots');
    assert(reservedKeyPolicy.digit9, 'Digit9 should be reserved for expanded tower slots');
    assert(reservedKeyPolicy.digit0, 'Digit0 should be reserved for expanded tower slots');
    assert(reservedKeyPolicy.minus, 'Minus should be reserved for expanded tower slots');
    assert(reservedKeyPolicy.equal, 'Equal should be reserved for expanded tower slots');
    assert(!reservedKeyPolicy.keyP, 'KeyP should remain bindable');
    assert(/1-0/.test(reservedKeyPolicy.hint), `Settings hint should mention expanded tower slot keys (got: ${reservedKeyPolicy.hint})`);

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

    // Remap start wave to Mouse Back (button 4) and verify mouse-button hotkey support.
    await page.evaluate(() => {
        MenuSystem.showScreen('settings');
        MenuSystem.loadSettings();
    });
    await page.waitForSelector('#settings-hotkey-grid .hotkey-bind-btn[data-action="startWave"]');
    await page.click('#settings-hotkey-grid .hotkey-bind-btn[data-action="startWave"]');
    await page.evaluate(() => {
        const ev = new MouseEvent('mousedown', {
            button: 3,
            bubbles: true,
            cancelable: true,
        });
        document.dispatchEvent(ev);
    });

    await page.waitForFunction(() => Input.getHotkeyCode('startWave') === 'MouseBack');

    const mouseRemapState = await page.evaluate(() => ({
        startWaveCode: Input.getHotkeyCode('startWave'),
        startWaveLabel: Input.getHotkeyLabel('startWave'),
    }));
    assert(mouseRemapState.startWaveCode === 'MouseBack', `Mouse remap code mismatch (${mouseRemapState.startWaveCode})`);
    assert(mouseRemapState.startWaveLabel === 'Mouse 4', `Mouse remap label mismatch (${mouseRemapState.startWaveLabel})`);

    await prepareIdleGame(page);
    await page.keyboard.press('KeyP');
    await waitTwoRafs(page);
    const phaseAfterOldKey = await page.evaluate(() => GameState.gamePhase);
    assert(phaseAfterOldKey === 'idle', `Old KeyP binding should not start wave after mouse remap (phase=${phaseAfterOldKey})`);

    await page.evaluate(() => {
        const canvas = document.getElementById('game-canvas');
        const ev = new MouseEvent('mousedown', {
            button: 3,
            bubbles: true,
            cancelable: true,
            clientX: 320,
            clientY: 240,
        });
        canvas.dispatchEvent(ev);
    });
    await page.waitForFunction(() => GameState.gamePhase === 'playing');

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof startGame === 'function' && typeof Input !== 'undefined');

    const persistedMouseCode = await page.evaluate(() => Input.getHotkeyCode('startWave'));
    assert(persistedMouseCode === 'MouseBack', `Mouse remapped hotkey did not persist after reload (${persistedMouseCode})`);

    const rightClickState = await page.evaluate(() => {
        MenuSystem.showScreen('game');
        startGame(0);
        GameState.settings.autoStart = false;
        if (WaveSystem.cancelCountdown) WaveSystem.cancelCountdown();
        GameState.gamePhase = 'idle';

        let placeX = null;
        let placeY = null;
        for (let r = 0; r < CONFIG.CANVAS_TILES_Y; r++) {
            for (let c = 0; c < CONFIG.CANVAS_TILES_X; c++) {
                if (MapSystem.canBuild(c, r)) {
                    const p = gridToWorld(c, r);
                    placeX = p.x;
                    placeY = p.y;
                    break;
                }
            }
            if (placeX !== null) break;
        }

        const tower = (placeX !== null) ? placeTower('arrow', placeX, placeY) : null;
        const canvas = document.getElementById('game-canvas');
        const menu = document.getElementById('tower-context-menu');
        const canvasRect = canvas.getBoundingClientRect();
        const screen = logicalToScreen(placeX, placeY);

        const ev = new MouseEvent('contextmenu', {
            bubbles: true,
            cancelable: true,
            clientX: canvasRect.left + screen.x,
            clientY: canvasRect.top + screen.y,
            button: 2,
        });
        canvas.dispatchEvent(ev);

        return {
            towerPlaced: !!tower,
            contextVisible: Input.contextMenuVisible,
            contextDisplay: menu ? getComputedStyle(menu).display : 'missing',
            contextText: menu ? menu.textContent || '' : '',
        };
    });

    assert(rightClickState.towerPlaced, 'Expected tower placement for right-click context-menu check');
    assert(rightClickState.contextVisible, `Right-click should open tower context menu (visible=${rightClickState.contextVisible})`);
    assert(rightClickState.contextDisplay === 'block', `Right-click menu should be visible (display=${rightClickState.contextDisplay})`);
    assert(/Relocate/i.test(rightClickState.contextText), `Tower context menu should include relocate action (text=${rightClickState.contextText})`);

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
