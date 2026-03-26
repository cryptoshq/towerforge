// ===== INPUT HANDLING — MOUSE, KEYBOARD, TOUCH & ADVANCED INTERACTIONS =====
const Input = {
    // Track raw screen mouse position for UI elements
    screenMouseX: 0,
    screenMouseY: 0,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    hoveredTower: null,
    lastClickTime: 0,

    // Multi-select state
    multiSelectedTowers: [],
    isShiftHeld: false,
    isCtrlHeld: false,

    // Drag-and-drop tower placement
    dragPlacing: false,
    dragPlaceType: null,
    dragPlacePreviewX: 0,
    dragPlacePreviewY: 0,

    // Camera panning
    cameraPanX: 0,
    cameraPanY: 0,
    isPanning: false,
    panStartX: 0,
    panStartY: 0,
    panVelocityX: 0,
    panVelocityY: 0,
    arrowKeysHeld: { up: false, down: false, left: false, right: false },
    cameraPanSpeed: 300,

    // Context menu state
    contextMenuVisible: false,
    contextMenuX: 0,
    contextMenuY: 0,
    contextMenuTower: null,

    // Input buffering
    actionQueue: [],
    maxQueueSize: 8,
    isAnimating: false,

    // Mouse trail state
    mouseTrail: [],
    mouseTrailMaxLength: 20,
    mouseTrailEnabled: true,

    // Hover tooltip state
    hoverTooltipTimer: 0,
    hoverTooltipDelay: 0.4,
    hoverTooltipVisible: false,
    hoverTooltipX: 0,
    hoverTooltipY: 0,
    hoverTooltipTargetX: 0,
    hoverTooltipTargetY: 0,
    tooltipSmoothSpeed: 12,

    // Shortcut overlay state
    shortcutOverlayVisible: false,

    // Touch: pinch-to-zoom state
    pinchStartDist: 0,
    pinchStartZoom: 1,
    currentZoom: 1,
    minZoom: 0.5,
    maxZoom: 2.0,

    // Touch: long-press state
    longPressTimer: null,
    longPressDuration: 600,
    longPressTriggered: false,

    // Configurable hotkeys
    defaultHotkeys: {
        startWave: 'Space',
        pause: 'Escape',
        sellTower: 'KeyS',
        upgradeTower: 'KeyU',
        cycleTower: 'Tab',
        toggleRanges: 'KeyG',
        speedUp: 'Equal',
        speedReset: 'Minus',
        showShortcuts: 'Slash',
        toggleFPS: 'KeyF',
        selectAll: 'KeyA',
        ability1: 'KeyQ',
        ability2: 'KeyW',
        ability3: 'KeyE',
        ability4: 'KeyR',
        ability5: 'KeyT',
    },
    hotkeyActionMeta: [
        { id: 'startWave', label: 'Start Wave' },
        { id: 'pause', label: 'Pause / Deselect' },
        { id: 'sellTower', label: 'Sell Tower' },
        { id: 'upgradeTower', label: 'Upgrade Tower' },
        { id: 'cycleTower', label: 'Cycle Tower' },
        { id: 'toggleRanges', label: 'Toggle Ranges' },
        { id: 'speedUp', label: 'Increase Speed' },
        { id: 'speedReset', label: 'Reset Speed' },
        { id: 'toggleFPS', label: 'Toggle FPS' },
        { id: 'showShortcuts', label: 'Show Shortcuts' },
        { id: 'ability1', label: 'Ability Slot 1' },
        { id: 'ability2', label: 'Ability Slot 2' },
        { id: 'ability3', label: 'Ability Slot 3' },
        { id: 'ability4', label: 'Ability Slot 4' },
        { id: 'ability5', label: 'Ability Slot 5' },
    ],
    hotkeys: {},

    init() {
        this.applySettingsHotkeys();

        const gameCanvas = document.getElementById('game-canvas');

        // Mouse move — convert screen to logical coordinates
        gameCanvas.addEventListener('mousemove', (e) => {
            const rect = gameCanvas.getBoundingClientRect();
            const screenX = e.clientX - rect.left;
            const screenY = e.clientY - rect.top;

            // Store screen coords for UI
            this.screenMouseX = screenX;
            this.screenMouseY = screenY;

            // Convert to logical game coordinates
            const logical = screenToLogical(screenX, screenY);
            GameState.mouseX = logical.x;
            GameState.mouseY = logical.y;

            const grid = worldToGrid(GameState.mouseX, GameState.mouseY);
            GameState.mouseGridCol = grid.col;
            GameState.mouseGridRow = grid.row;

            if (GameState.selectedTower && GameState.selectedTower.isBeingMoved) {
                GameState.selectedTower.setMovePreview(grid.col, grid.row);
                GameState.placementValid = GameState.selectedTower.canMoveTo(grid.col, grid.row);
            } else {
                GameState.placementValid = MapSystem.canBuildAt(GameState.mouseX, GameState.mouseY);
            }

            // Track hovered tower for tooltips
            this.hoveredTower = null;
            for (const t of GameState.towers) {
                if (dist({x: GameState.mouseX, y: GameState.mouseY}, t) < (CONFIG.TOWER_FOOTPRINT || 14) + 6) {
                    this.hoveredTower = t;
                    break;
                }
            }

            if (GameState.selectedTower && GameState.selectedTower.linkMode) {
                GameState.selectedTower.linkPreviewTargetId = this.hoveredTower && this.hoveredTower !== GameState.selectedTower
                    ? this.hoveredTower.id
                    : null;
            }

            // Update hover tooltip
            if (this.hoveredTower) {
                this.hoverTooltipTargetX = screenX + 15;
                this.hoverTooltipTargetY = screenY - 10;
                if (!this.hoverTooltipVisible) {
                    this.hoverTooltipTimer += 0.016;
                    if (this.hoverTooltipTimer >= this.hoverTooltipDelay) {
                        this.hoverTooltipVisible = true;
                        this.hoverTooltipX = this.hoverTooltipTargetX;
                        this.hoverTooltipY = this.hoverTooltipTargetY;
                    }
                }
            } else {
                this.hoverTooltipTimer = 0;
                this.hoverTooltipVisible = false;
            }

            // Update tower placement ghost preview
            if (GameState.selectedTowerType && typeof PlacementPreview !== 'undefined') {
                PlacementPreview.show(GameState.selectedTowerType, GameState.mouseX, GameState.mouseY, GameState.placementValid);
            } else if (typeof PlacementPreview !== 'undefined') {
                PlacementPreview.hide();
            }

            // Update mouse trail during tower placement
            if (GameState.selectedTowerType && this.mouseTrailEnabled) {
                this.mouseTrail.push({ x: screenX, y: screenY, alpha: 1.0, time: performance.now() });
                if (this.mouseTrail.length > this.mouseTrailMaxLength) {
                    this.mouseTrail.shift();
                }
            }

            // Camera panning with middle mouse button
            if (this.isPanning) {
                const dx = screenX - this.panStartX;
                const dy = screenY - this.panStartY;
                this.cameraPanX += dx;
                this.cameraPanY += dy;
                this.panStartX = screenX;
                this.panStartY = screenY;
                this.panVelocityX = dx;
                this.panVelocityY = dy;
            }

            // Drag-and-drop tower placement preview
            if (this.dragPlacing && this.dragPlaceType) {
                this.dragPlacePreviewX = grid.col;
                this.dragPlacePreviewY = grid.row;
            }
        });

        // Mouse leave — clear hover state
        gameCanvas.addEventListener('mouseleave', () => {
            GameState.mouseGridCol = -1;
            GameState.mouseGridRow = -1;
            GameState.placementValid = false;
            this.hoveredTower = null;
            this.hoverTooltipVisible = false;
            this.hoverTooltipTimer = 0;
            this._hideContextMenu();
        });

        // Middle mouse button for panning
        gameCanvas.addEventListener('mousedown', (e) => {
            if (this._handleMouseHotkey(e)) {
                return;
            }

            if (e.button === 1) {
                // Middle mouse button — start panning
                e.preventDefault();
                this.isPanning = true;
                this.panStartX = e.clientX - gameCanvas.getBoundingClientRect().left;
                this.panStartY = e.clientY - gameCanvas.getBoundingClientRect().top;
                gameCanvas.style.cursor = 'grabbing';
            }
        });

        gameCanvas.addEventListener('mouseup', (e) => {
            if (e.button === 1) {
                // Middle mouse button — stop panning
                this.isPanning = false;
                gameCanvas.style.cursor = '';
            }

            // Handle drag-and-drop tower release
            if (this.dragPlacing && e.button === 0) {
                this._completeDragPlacement();
            }
        });

        // Mouse click — place tower or select
        gameCanvas.addEventListener('click', (e) => {
            const rect = gameCanvas.getBoundingClientRect();
            const screenX = e.clientX - rect.left;
            const screenY = e.clientY - rect.top;

            // Convert to logical coordinates
            const logical = screenToLogical(screenX, screenY);
            const mx = logical.x;
            const my = logical.y;
            const grid = worldToGrid(mx, my);

            // Check if click is within game area
            if (!isInGameArea(screenX, screenY)) return;

            // Hide context menu on left click
            this._hideContextMenu();

            // Double-click detection for quick upgrade
            const now = Date.now();
            const isDoubleClick = (now - this.lastClickTime) < 350;
            this.lastClickTime = now;

            // If placing a tower
            if (GameState.selectedTowerType) {
                if (MapSystem.canBuildAt(GameState.mouseX, GameState.mouseY)) {
                    const tower = placeTower(GameState.selectedTowerType, GameState.mouseX, GameState.mouseY);
                    if (tower) {
                        UIRenderer.updateSidebarCosts();
                        if (GameState.wave > 0) {
                            SaveSystem.autoSave();
                        }
                    } else {
                        // Placement failed — likely can't afford
                        if (typeof EconomyVisibility !== 'undefined') {
                            EconomyVisibility.showCantAfford(GameState.selectedTowerType);
                        }
                    }
                }
                return;
            }

            if (GameState.selectedTower && GameState.selectedTower.isBeingMoved) {
                const moveResult = TowerCommands.confirmMoveTower(GameState.selectedTower, grid.col, grid.row);
                if (moveResult.ok) {
                    UIRenderer.showTowerInfo(GameState.selectedTower);
                    UIRenderer.updateSidebarCosts();
                    if (GameState.wave > 0) {
                        SaveSystem.autoSave();
                    }
                } else if (moveResult.reason === 'gold') {
                    Effects.addFloatingText(GameState.mouseX, GameState.mouseY - 20, `NEED ${moveResult.cost}g`, '#ff8800', 11);
                    Audio.play('error');
                } else {
                    Audio.play('error');
                }
                return;
            }

            // Click on existing tower (distance-based)
            let clickedTower = null;
            let clickDist = Infinity;
            for (const t of GameState.towers) {
                const d = dist({x: GameState.mouseX, y: GameState.mouseY}, t);
                if (d < (CONFIG.TOWER_FOOTPRINT || 14) + 8 && d < clickDist) {
                    clickedTower = t;
                    clickDist = d;
                }
            }

            if (GameState.selectedTower && GameState.selectedTower.linkMode) {
                if (clickedTower && clickedTower !== GameState.selectedTower) {
                    const linkResult = TowerCommands.toggleLink(GameState.selectedTower, clickedTower);
                    if (linkResult.ok) {
                        const msg = linkResult.linked ? 'LINKED' : 'UNLINKED';
                        const color = linkResult.linked ? '#7dc7ff' : '#ffd070';
                        Effects.addFloatingText(clickedTower.x, clickedTower.y - 20, msg, color, 10);
                        Audio.play(linkResult.linked ? 'powerup' : 'click');
                    } else if (linkResult.reason === 'gold') {
                        Effects.addFloatingText(clickedTower.x, clickedTower.y - 20, `NEED ${linkResult.cost}g`, '#ff8800', 11);
                        Audio.play('error');
                    } else {
                        Audio.play('error');
                    }
                }
                UIRenderer.showTowerInfo(GameState.selectedTower);
                UIRenderer.updateSidebarCosts();
                return;
            }

            if (clickedTower) {
                // Multi-select with shift held
                if (this.isShiftHeld) {
                    this._toggleMultiSelect(clickedTower);
                    return;
                }

                // Double-click to upgrade
                if (isDoubleClick && GameState.selectedTower === clickedTower) {
                    TowerCommands.upgradeTower(clickedTower);
                    UIRenderer.showTowerInfo(clickedTower);
                    UIRenderer.updateSidebarCosts();
                } else {
                    // Clear multi-select when clicking without shift
                    this.multiSelectedTowers = [];
                    UIRenderer.showTowerInfo(clickedTower);
                }
                Audio.play('click');
            } else {
                // Deselect
                UIRenderer.hideTowerInfo();
                GameState.selectedTower = null;
                this.multiSelectedTowers = [];
            }
        });

        gameCanvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();

            const rect = gameCanvas.getBoundingClientRect();
            const screenX = e.clientX - rect.left;
            const screenY = e.clientY - rect.top;
            if (!isInGameArea(screenX, screenY)) {
                this._hideContextMenu();
                return;
            }

            if (GameState.selectedTower && GameState.selectedTower.isBeingMoved) {
                TowerCommands.cancelMoveTower(GameState.selectedTower);
                UIRenderer.showTowerInfo(GameState.selectedTower);
                this._hideContextMenu();
                return;
            }

            if (GameState.selectedTower && GameState.selectedTower.linkMode) {
                TowerCommands.cancelLinkMode(GameState.selectedTower);
                UIRenderer.showTowerInfo(GameState.selectedTower);
                this._hideContextMenu();
                return;
            }

            const logical = screenToLogical(screenX, screenY);
            let clickedTower = null;
            let clickDist = Infinity;
            for (const tower of GameState.towers) {
                const d = dist({ x: logical.x, y: logical.y }, tower);
                if (d < (CONFIG.TOWER_FOOTPRINT || 14) + 8 && d < clickDist) {
                    clickedTower = tower;
                    clickDist = d;
                }
            }

            if (!clickedTower) {
                this._hideContextMenu();
                return;
            }

            if (!this.isShiftHeld) {
                this.multiSelectedTowers = [];
                UIRenderer.showTowerInfo(clickedTower);
            }
            this._showContextMenu(e.clientX, e.clientY, clickedTower);
        });

        // Mouse wheel — zoom (future feature) or cycle targeting
        gameCanvas.addEventListener('wheel', (e) => {
            if (GameState.selectedTower) {
                e.preventDefault();
                const modes = CONFIG.TARGETING_MODES;
                const current = modes.indexOf(GameState.selectedTower.targetMode);
                const nextMode = e.deltaY > 0
                    ? modes[(current + 1) % modes.length]
                    : modes[(current - 1 + modes.length) % modes.length];
                TowerCommands.setTargetMode(GameState.selectedTower, nextMode);
                UIRenderer.showTowerInfo(GameState.selectedTower);
                Audio.play('click');
            }
        });

        // Track modifier keys
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Shift') this.isShiftHeld = true;
            if (e.key === 'Control') this.isCtrlHeld = true;
        });

        document.addEventListener('keyup', (e) => {
            if (e.key === 'Shift') this.isShiftHeld = false;
            if (e.key === 'Control') this.isCtrlHeld = false;

            // Arrow keys for camera panning
            if (e.code === 'ArrowUp') this.arrowKeysHeld.up = false;
            if (e.code === 'ArrowDown') this.arrowKeysHeld.down = false;
            if (e.code === 'ArrowLeft') this.arrowKeysHeld.left = false;
            if (e.code === 'ArrowRight') this.arrowKeysHeld.right = false;
        });

        // ESC key for navigating back from non-game screens
        document.addEventListener('keydown', (e) => {
            if (e.code !== 'Escape') return;
            const screen = GameState.screen;
            if (screen === 'research' || screen === 'achievements' || screen === 'howtoplay' || screen === 'difficulty') {
                MenuSystem.showScreen('menu');
                Audio.play('click');
            } else if (screen === 'settings') {
                MenuSystem.showScreen('menu');
                Audio.play('click');
                SaveSystem.savePersistent();
            } else if (screen === 'mapselect') {
                MenuSystem.showScreen('difficulty');
                Audio.play('click');
            } else if (screen === 'doctrine') {
                MenuSystem.showScreen('mapselect');
                Audio.play('click');
            }
        });

        // Keyboard
        document.addEventListener('keydown', (e) => {
            if (GameState.screen !== 'game') return;

            if (typeof WaveSystem !== 'undefined' && WaveSystem.endlessDraftModalOpen) {
                if (e.code === 'Digit1') {
                    e.preventDefault();
                    WaveSystem.pickEndlessDraftChoice(0);
                } else if (e.code === 'Digit2') {
                    e.preventDefault();
                    WaveSystem.pickEndlessDraftChoice(1);
                } else if (e.code === 'Digit3') {
                    e.preventDefault();
                    WaveSystem.pickEndlessDraftChoice(2);
                } else if (e.code === 'KeyR') {
                    e.preventDefault();
                    WaveSystem.rerollEndlessMutatorDraft();
                }
                return;
            }

            if (typeof WaveSystem !== 'undefined' && WaveSystem.tacticalEventModalOpen) {
                if (e.code === 'Digit1') {
                    e.preventDefault();
                    WaveSystem.pickTacticalChoice(0);
                } else if (e.code === 'Digit2') {
                    e.preventDefault();
                    WaveSystem.pickTacticalChoice(1);
                } else if (e.code === 'Digit3') {
                    e.preventDefault();
                    WaveSystem.pickTacticalChoice(2);
                }
                return;
            }

            // Arrow keys for camera panning
            if (e.code === 'ArrowUp') { this.arrowKeysHeld.up = true; e.preventDefault(); }
            if (e.code === 'ArrowDown') { this.arrowKeysHeld.down = true; e.preventDefault(); }
            if (e.code === 'ArrowLeft') { this.arrowKeysHeld.left = true; e.preventDefault(); }
            if (e.code === 'ArrowRight') { this.arrowKeysHeld.right = true; e.preventDefault(); }

            // Show shortcut overlay hotkey
            const showShortcutPressed = this._isShowShortcutsHotkey(e);
            if (showShortcutPressed) {
                e.preventDefault();
                this._toggleShortcutOverlay();
                return;
            }

            // Close shortcut overlay on any other key
            if (this.shortcutOverlayVisible && !showShortcutPressed && !this._matchesHotkey(e, 'pause')) {
                this._hideShortcutOverlay();
            }

            // A/B keys — choose path when path-choice modal is open
            if (document.getElementById('path-choice-modal').style.display === 'flex') {
                if (e.key.toLowerCase() === 'a') {
                    const cardA = document.getElementById('path-a-card');
                    if (cardA) cardA.click();
                    return;
                }
                if (e.key.toLowerCase() === 'b') {
                    const cardB = document.getElementById('path-b-card');
                    if (cardB) cardB.click();
                    return;
                }
            }

            // Start wave / Ready (multiplayer)
            if (this._matchesHotkey(e, 'startWave')) {
                e.preventDefault();
                if (typeof Multiplayer !== 'undefined' && Multiplayer.active) {
                    // Multiplayer: SPACE = ready up
                    if (GameState.gamePhase === 'idle' && !Multiplayer.localReady) {
                        Multiplayer.setReady();
                    }
                } else if (GameState.gamePhase === 'idle') {
                    WaveSystem.startWave();
                }
            }

            // Skip wave (send next wave early)
            if (e.key.toLowerCase() === 'n' && GameState.gamePhase === 'playing') {
                const skipBtn = document.getElementById('btn-skip-wave');
                if (skipBtn && skipBtn.style.display !== 'none') {
                    e.preventDefault();
                    WaveSystem.skipWave();
                }
            }

            // Pause / deselect
            if (this._matchesHotkey(e, 'pause')) {
                this._handlePauseHotkeyAction();
            }

            // Tower hotkeys — 1-9, 0, -, = map to tower indices 0-11
            const towerKeyMap = { '1': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, '7': 6, '8': 7, '9': 8, '0': 9, '-': 10, '=': 11 };
            if (towerKeyMap.hasOwnProperty(e.key)) {
                const idx = towerKeyMap[e.key];
                const types = Object.keys(TOWERS);
                if (idx < types.length) {
                    const type = types[idx];
                    if (typeof ProgressionSystem !== 'undefined' && typeof ProgressionSystem.tryToggleTowerSelection === 'function') {
                        ProgressionSystem.tryToggleTowerSelection(type);
                    } else {
                        if (GameState.selectedTowerType === type) {
                            GameState.selectedTowerType = null;
                        } else {
                            GameState.selectedTowerType = type;
                            GameState.selectedTower = null;
                            document.getElementById('tower-info').style.display = 'none';
                        }
                        UIRenderer._updateSidebarSelection();
                    }
                }
            }

            // Ability hotkeys
            for (let i = 0; i < 5; i++) {
                if (this._matchesHotkey(e, `ability${i + 1}`) && GameState.gamePhase === 'playing') {
                    e.preventDefault();
                    AbilitySystem.useAbility(i, GameState.mouseX, GameState.mouseY);
                    return;
                }
            }

            // Speed control
            if (this._matchesHotkey(e, 'speedUp')) {
                e.preventDefault();
                cycleSpeed();
            }
            if (this._matchesHotkey(e, 'speedReset')) {
                e.preventDefault();
                GameState.gameSpeed = GameState.activeChallenges.includes('speed_run') ? 2 : 1;
                document.getElementById('btn-speed').textContent = GameState.gameSpeed + 'x';
            }

            // Sell selected tower (or multi-sell)
            if (this._matchesHotkey(e, 'sellTower') && !this.isCtrlHeld) {
                if (this.multiSelectedTowers.length > 0) {
                    this._multiSell();
                } else if (GameState.selectedTower) {
                    const sellResult = TowerCommands.requestSellTower(GameState.selectedTower);
                    if (sellResult.sold) {
                        document.getElementById('tower-info').style.display = 'none';
                    } else {
                        UIRenderer.showTowerInfo(GameState.selectedTower);
                    }
                    UIRenderer.updateSidebarCosts();
                }
            }

            // Upgrade selected tower (or multi-upgrade)
            if (this._matchesHotkey(e, 'upgradeTower')) {
                if (this.multiSelectedTowers.length > 0) {
                    this._multiUpgrade();
                } else if (GameState.selectedTower) {
                    TowerCommands.upgradeTower(GameState.selectedTower);
                    UIRenderer.showTowerInfo(GameState.selectedTower);
                    UIRenderer.updateSidebarCosts();
                }
            }

            // Cycle selected tower
            if (this._matchesHotkey(e, 'cycleTower') && GameState.towers.length > 0) {
                e.preventDefault();
                const current = GameState.selectedTower;
                const idx = current ? GameState.towers.indexOf(current) : -1;
                const next = GameState.towers[(idx + 1) % GameState.towers.length];
                UIRenderer.showTowerInfo(next);
            }

            // Toggle range display
            if (this._matchesHotkey(e, 'toggleRanges')) {
                GameState.settings.showRanges = !GameState.settings.showRanges;
                if (typeof Menu !== 'undefined' && Menu._hudToggleSync) Menu._hudToggleSync();
            }

            // Toggle FPS counter
            if (this._matchesHotkey(e, 'toggleFPS') && !this.isCtrlHeld) {
                GameState.settings.showFPS = !GameState.settings.showFPS;
            }

            // Delete key — sell selected tower
            if (e.key === 'Delete' && GameState.selectedTower) {
                const sellResult = TowerCommands.requestSellTower(GameState.selectedTower);
                if (sellResult.sold) {
                    document.getElementById('tower-info').style.display = 'none';
                } else {
                    UIRenderer.showTowerInfo(GameState.selectedTower);
                }
                UIRenderer.updateSidebarCosts();
            }

            // Ctrl + Select-All hotkey
            if (this.isCtrlHeld && this._matchesHotkey(e, 'selectAll')) {
                e.preventDefault();
                this._selectAllTowers();
            }
        });

        // Close tower info
        document.getElementById('btn-close-info').addEventListener('click', () => {
            UIRenderer.hideTowerInfo();
        });

        // Touch support for mobile
        this._initTouchHandlers(gameCanvas);

        // Initialize context menu DOM
        this._initContextMenu();

        // Initialize shortcut overlay DOM
        this._initShortcutOverlay();
    },

    // ===== HOTKEY CONFIGURATION =====
    applySettingsHotkeys() {
        const fromSettings = GameState.settings && GameState.settings.hotkeys && typeof GameState.settings.hotkeys === 'object'
            ? GameState.settings.hotkeys
            : {};

        const merged = {};
        const seen = new Set();

        for (const [actionId, defaultCode] of Object.entries(this.defaultHotkeys)) {
            const candidate = this._normalizeHotkeyCode(fromSettings[actionId]) || defaultCode;
            const finalCode = (this._isHotkeyCodeBindable(candidate) && !seen.has(candidate))
                ? candidate
                : defaultCode;
            merged[actionId] = finalCode;
            seen.add(finalCode);
        }

        this.hotkeys = merged;
        GameState.settings.hotkeys = { ...merged };
    },

    getRemappableHotkeyActions() {
        return this.hotkeyActionMeta.slice();
    },

    getHotkeyCode(actionId) {
        return this.hotkeys[actionId] || this.defaultHotkeys[actionId] || '';
    },

    getHotkeyLabel(actionId) {
        return this._formatHotkeyCode(this.getHotkeyCode(actionId));
    },

    getAbilityHotkeyLabel(index) {
        return this.getHotkeyLabel(`ability${index + 1}`);
    },

    setHotkey(actionId, code) {
        if (!Object.prototype.hasOwnProperty.call(this.defaultHotkeys, actionId)) {
            return { ok: false, reason: 'unknown-action' };
        }

        const normalized = this._normalizeHotkeyCode(code);
        if (!this._isHotkeyCodeBindable(normalized)) {
            return { ok: false, reason: 'invalid-key' };
        }

        const previous = this.getHotkeyCode(actionId);
        let swappedAction = null;
        for (const [otherAction, otherCode] of Object.entries(this.hotkeys)) {
            if (otherAction !== actionId && otherCode === normalized) {
                swappedAction = otherAction;
                break;
            }
        }

        this.hotkeys[actionId] = normalized;
        if (swappedAction) {
            this.hotkeys[swappedAction] = previous;
        }

        GameState.settings.hotkeys = { ...this.hotkeys };
        return { ok: true, swappedAction };
    },

    resetHotkeys() {
        this.hotkeys = { ...this.defaultHotkeys };
        GameState.settings.hotkeys = { ...this.hotkeys };
    },

    _normalizeHotkeyCode(code) {
        if (typeof code !== 'string') return '';
        const v = code.trim();
        if (!v) return '';
        return v;
    },

    _isModifierCode(code) {
        return code === 'ShiftLeft' || code === 'ShiftRight' ||
            code === 'ControlLeft' || code === 'ControlRight' ||
            code === 'AltLeft' || code === 'AltRight' ||
            code === 'MetaLeft' || code === 'MetaRight';
    },

    _isDisallowedMouseHotkeyCode(code) {
        return code === 'MouseLeft';
    },

    _isHotkeyCodeBindable(code) {
        return !!code && !this._isModifierCode(code) && !this._isReservedHotkeyCode(code) && !this._isDisallowedMouseHotkeyCode(code);
    },

    _isReservedHotkeyCode(code) {
        return /^Digit[0-9]$/.test(code) || code === 'Minus' || code === 'Equal';
    },

    mouseButtonToHotkeyCode(button) {
        switch (button) {
            case 0: return 'MouseLeft';
            case 1: return 'MouseMiddle';
            case 2: return 'MouseRight';
            case 3: return 'MouseBack';
            case 4: return 'MouseForward';
            default:
                return Number.isFinite(button) && button > 4 ? `MouseButton${button + 1}` : '';
        }
    },

    _eventToHotkeyCode(e) {
        if (!e) return '';
        if (typeof e.code === 'string' && e.code) return this._normalizeHotkeyCode(e.code);
        if (typeof e.button === 'number') return this.mouseButtonToHotkeyCode(e.button);
        if (typeof e.hotkeyCode === 'string' && e.hotkeyCode) return this._normalizeHotkeyCode(e.hotkeyCode);
        return '';
    },

    _isMouseHotkeyCode(code) {
        return typeof code === 'string' && code.startsWith('Mouse');
    },

    getHotkeyActionForCode(code) {
        const normalized = this._normalizeHotkeyCode(code);
        if (!normalized) return null;
        for (const [actionId, actionCode] of Object.entries(this.hotkeys)) {
            if (actionCode === normalized) return actionId;
        }
        return null;
    },

    _matchesHotkey(e, actionId) {
        return this._eventToHotkeyCode(e) === this.getHotkeyCode(actionId);
    },

    _isShowShortcutsHotkey(e) {
        const code = this.getHotkeyCode('showShortcuts');
        if (e.code !== code) return false;
        if (code === 'Slash') return !!e.shiftKey;
        return true;
    },

    _handlePauseHotkeyAction() {
        if (this.shortcutOverlayVisible) {
            this._hideShortcutOverlay();
        } else if (this.contextMenuVisible) {
            this._hideContextMenu();
        } else if (GameState.selectedTowerType) {
            GameState.selectedTowerType = null;
            UIRenderer._updateSidebarSelection();
        } else if (GameState.selectedTower && GameState.selectedTower.isBeingMoved) {
            TowerCommands.cancelMoveTower(GameState.selectedTower);
            UIRenderer.showTowerInfo(GameState.selectedTower);
        } else if (GameState.selectedTower && GameState.selectedTower.linkMode) {
            TowerCommands.cancelLinkMode(GameState.selectedTower);
            UIRenderer.showTowerInfo(GameState.selectedTower);
        } else if (GameState.selectedTower) {
            UIRenderer.hideTowerInfo();
        } else if (document.getElementById('path-choice-modal').style.display === 'flex') {
            if (UIRenderer._stopPathPreviewAnimations) {
                UIRenderer._stopPathPreviewAnimations();
            }
            document.getElementById('path-choice-modal').style.display = 'none';
        } else {
            togglePause();
        }
    },

    _handleMouseHotkey(e) {
        if (GameState.screen !== 'game') return false;
        if (typeof e.button !== 'number') return false;

        const code = this.mouseButtonToHotkeyCode(e.button);
        if (!code || !this._isMouseHotkeyCode(code)) return false;

        const actionId = this.getHotkeyActionForCode(code);
        if (!actionId) return false;

        e.preventDefault();
        e.stopPropagation();

        if (actionId === 'showShortcuts') {
            this._toggleShortcutOverlay();
            return true;
        }

        if (actionId === 'pause') {
            this._handlePauseHotkeyAction();
            return true;
        }

        if (actionId === 'startWave') {
            if (typeof Multiplayer !== 'undefined' && Multiplayer.active) {
                if (GameState.gamePhase === 'idle' && !Multiplayer.localReady) {
                    Multiplayer.setReady();
                }
            } else if (GameState.gamePhase === 'idle') {
                WaveSystem.startWave();
            }
            return true;
        }

        if (actionId.startsWith('ability')) {
            if (GameState.gamePhase === 'playing') {
                const idx = Number.parseInt(actionId.slice('ability'.length), 10) - 1;
                if (Number.isFinite(idx) && idx >= 0) {
                    AbilitySystem.useAbility(idx, GameState.mouseX, GameState.mouseY);
                }
            }
            return true;
        }

        if (actionId === 'speedUp') {
            cycleSpeed();
            return true;
        }

        if (actionId === 'speedReset') {
            GameState.gameSpeed = GameState.activeChallenges.includes('speed_run') ? 2 : 1;
            document.getElementById('btn-speed').textContent = GameState.gameSpeed + 'x';
            return true;
        }

        if (actionId === 'sellTower') {
            if (this.multiSelectedTowers.length > 0) {
                this._multiSell();
            } else if (GameState.selectedTower) {
                GameState.selectedTower.sell();
                document.getElementById('tower-info').style.display = 'none';
                UIRenderer.updateSidebarCosts();
            }
            return true;
        }

        if (actionId === 'upgradeTower') {
            if (this.multiSelectedTowers.length > 0) {
                this._multiUpgrade();
            } else if (GameState.selectedTower) {
                const upgInfo = GameState.selectedTower.getUpgradeCost();
                if (upgInfo) {
                    if (upgInfo.needsPath) {
                        UIRenderer.showPathChoice(GameState.selectedTower);
                    } else if (GameState.gold >= upgInfo.cost) {
                        GameState.selectedTower.upgrade();
                        UIRenderer.showTowerInfo(GameState.selectedTower);
                        UIRenderer.updateSidebarCosts();
                    }
                }
            }
            return true;
        }

        if (actionId === 'cycleTower') {
            if (GameState.towers.length > 0) {
                const current = GameState.selectedTower;
                const idx = current ? GameState.towers.indexOf(current) : -1;
                const next = GameState.towers[(idx + 1) % GameState.towers.length];
                UIRenderer.showTowerInfo(next);
            }
            return true;
        }

        if (actionId === 'toggleRanges') {
            GameState.settings.showRanges = !GameState.settings.showRanges;
            return true;
        }

        if (actionId === 'toggleFPS') {
            GameState.settings.showFPS = !GameState.settings.showFPS;
            return true;
        }

        if (actionId === 'selectAll') {
            this._selectAllTowers();
            return true;
        }

        return false;
    },

    _formatHotkeyCode(code) {
        if (!code) return '—';

        if (code === 'Space') return 'Space';
        if (code === 'Escape') return 'Esc';
        if (code === 'Equal') return '+';
        if (code === 'Minus') return '-';
        if (code === 'Backquote') return '`';
        if (code === 'BracketLeft') return '[';
        if (code === 'BracketRight') return ']';
        if (code === 'Backslash') return '\\';
        if (code === 'Semicolon') return ';';
        if (code === 'Quote') return '\'';
        if (code === 'Comma') return ',';
        if (code === 'Period') return '.';
        if (code === 'Slash') return '?';
        if (code === 'Tab') return 'Tab';
        if (code === 'Enter') return 'Enter';
        if (code === 'Delete') return 'Del';
        if (code === 'Backspace') return 'Backspace';
        if (code === 'MouseRight') return 'Mouse RMB';
        if (code === 'MouseMiddle') return 'Mouse MMB';
        if (code === 'MouseBack') return 'Mouse 4';
        if (code === 'MouseForward') return 'Mouse 5';
        if (code === 'MouseButton6') return 'Mouse 6';
        if (code === 'MouseButton7') return 'Mouse 7';

        if (code.startsWith('Key')) return code.slice(3);
        if (code.startsWith('Digit')) return code.slice(5);
        if (code.startsWith('Numpad')) return 'Num ' + code.slice(6);
        if (code.startsWith('MouseButton')) return 'Mouse ' + code.replace('MouseButton', '');
        if (code.startsWith('Arrow')) return code.slice(5);

        return code;
    },

    // ===== MULTI-SELECT SYSTEM =====
    _toggleMultiSelect(tower) {
        const idx = this.multiSelectedTowers.indexOf(tower);
        if (idx >= 0) {
            this.multiSelectedTowers.splice(idx, 1);
        } else {
            this.multiSelectedTowers.push(tower);
        }
        // Show info for the last selected tower
        if (this.multiSelectedTowers.length > 0) {
            const last = this.multiSelectedTowers[this.multiSelectedTowers.length - 1];
            UIRenderer.showTowerInfo(last);
        }
    },

    _selectAllTowers() {
        this.multiSelectedTowers = [...GameState.towers];
        if (this.multiSelectedTowers.length > 0) {
            UIRenderer.showTowerInfo(this.multiSelectedTowers[0]);
        }
    },

    _multiSell() {
        const towers = [...this.multiSelectedTowers];
        TowerCommands.sellSelection(towers);
        this.multiSelectedTowers = [];
        document.getElementById('tower-info').style.display = 'none';
        UIRenderer.updateSidebarCosts();
    },

    _multiUpgrade() {
        TowerCommands.upgradeSelection(this.multiSelectedTowers);
        UIRenderer.updateSidebarCosts();
        if (this.multiSelectedTowers.length > 0) {
            UIRenderer.showTowerInfo(this.multiSelectedTowers[0]);
        }
    },

    isMultiSelected(tower) {
        return this.multiSelectedTowers.includes(tower);
    },

    getMultiSelectCount() {
        return this.multiSelectedTowers.length;
    },

    // ===== DRAG-AND-DROP TOWER PLACEMENT =====
    startDragPlacement(towerType) {
        this.dragPlacing = true;
        this.dragPlaceType = towerType;
        GameState.selectedTowerType = towerType;
        UIRenderer._updateSidebarSelection();
    },

    _completeDragPlacement() {
        if (!this.dragPlacing || !this.dragPlaceType) return;

        if (MapSystem.canBuildAt(GameState.mouseX, GameState.mouseY)) {
            const tower = placeTower(this.dragPlaceType, GameState.mouseX, GameState.mouseY);
            if (tower) {
                UIRenderer.updateSidebarCosts();
                if (GameState.wave > 0) {
                    SaveSystem.autoSave();
                }
            }
        }

        this.dragPlacing = false;
        this.dragPlaceType = null;
        GameState.selectedTowerType = null;
        UIRenderer._updateSidebarSelection();
    },

    cancelDragPlacement() {
        this.dragPlacing = false;
        this.dragPlaceType = null;
        GameState.selectedTowerType = null;
        UIRenderer._updateSidebarSelection();
    },

    // ===== CONTEXT MENU =====
    _initContextMenu() {
        // Create context menu DOM element if it doesn't exist
        let menu = document.getElementById('tower-context-menu');
        if (!menu) {
            menu = document.createElement('div');
            menu.id = 'tower-context-menu';
            menu.style.cssText = 'display:none;position:absolute;z-index:1000;background:#1a1a2e;border:1px solid #444;border-radius:6px;padding:4px 0;min-width:160px;box-shadow:0 4px 12px rgba(0,0,0,0.5);font-family:inherit;';
            document.body.appendChild(menu);
        }

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#tower-context-menu')) {
                this._hideContextMenu();
            }
        });
    },

    _showContextMenu(screenX, screenY, tower) {
        this.contextMenuTower = tower;
        this.contextMenuVisible = true;

        const menu = document.getElementById('tower-context-menu');
        if (!menu) return;

        const upgInfo = tower.getUpgradeCost();
        const canUpgrade = upgInfo && !upgInfo.needsPath && GameState.gold >= upgInfo.cost;
        const needsPath = upgInfo && upgInfo.needsPath;
        const moveCost = tower.getMoveCost();
        const canMove = GameState.gold >= moveCost;

        let html = '';

        // Upgrade option
        if (needsPath) {
            html += this._contextMenuItem('Choose Path...', 'path', true);
        } else if (canUpgrade) {
            html += this._contextMenuItem(`Upgrade (${upgInfo.cost}g)`, 'upgrade', true);
        } else if (upgInfo) {
            html += this._contextMenuItem(`Upgrade (${upgInfo.cost}g)`, 'upgrade', false);
        }

        // Move option
        if (tower.isBeingMoved) {
            html += this._contextMenuItem('Cancel Relocate', 'move_cancel', true);
        } else {
            html += this._contextMenuItem(`Relocate (${moveCost}g)`, 'move', canMove);
        }

        if (tower.linkMode) {
            html += this._contextMenuItem('Cancel Link Mode', 'link_cancel', true);
        } else {
            const linkCapReached = tower.links.length >= CONFIG.MAX_LINKS_PER_TOWER;
            html += this._contextMenuItem(`Link (${CONFIG.LINK_COST}g)`, 'link', !linkCapReached);
        }

        // Sell option
        const sellValue = tower.getSellValue();
        html += this._contextMenuItem(
            tower.sellConfirmActive ? `Confirm Sell (+${sellValue}g)` : `Sell (+${sellValue}g)`,
            'sell',
            true,
            tower.sellConfirmActive ? '#ffd070' : null
        );

        // Divider
        html += '<div style="height:1px;background:#333;margin:4px 0;"></div>';

        // Target mode options
        html += '<div style="padding:4px 12px;color:#888;font-size:11px;">Target Mode</div>';
        for (const mode of CONFIG.TARGETING_MODES) {
            const isActive = tower.targetMode === mode;
            html += this._contextMenuItem(
                `${isActive ? '> ' : '  '}${mode.charAt(0).toUpperCase() + mode.slice(1)}`,
                'target_' + mode,
                true,
                isActive ? '#60d0e0' : null
            );
        }

        // Divider
        html += '<div style="height:1px;background:#333;margin:4px 0;"></div>';

        // Overclock option
        const canOverclock = !tower.overclocked && (!tower.overclockCooldown || tower.overclockCooldown <= 0);
        html += this._contextMenuItem(
            tower.overclocked ? 'Overclocked!' : 'Overclock',
            'overclock',
            canOverclock
        );

        menu.innerHTML = html;
        menu.style.display = 'block';

        // Position the menu near the click, keeping it on screen
        const menuRect = menu.getBoundingClientRect();
        let left = screenX + window.scrollX;
        let top = screenY + window.scrollY;
        if (left + 170 > window.innerWidth) left = window.innerWidth - 175;
        if (top + menuRect.height > window.innerHeight) top = window.innerHeight - menuRect.height - 5;
        menu.style.left = left + 'px';
        menu.style.top = top + 'px';

        // Attach event listeners
        menu.querySelectorAll('[data-action]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                this._handleContextAction(item.dataset.action);
            });
        });
    },

    _contextMenuItem(label, action, enabled, color) {
        const style = enabled
            ? `cursor:pointer;padding:6px 12px;color:${color || '#ddd'};font-size:13px;`
            : 'padding:6px 12px;color:#555;font-size:13px;cursor:default;';
        const hover = enabled ? 'onmouseover="this.style.background=\'#2a2a4e\'" onmouseout="this.style.background=\'none\'"' : '';
        return `<div data-action="${action}" style="${style}" ${hover} ${!enabled ? 'data-disabled="true"' : ''}>${label}</div>`;
    },

    _handleContextAction(action) {
        const tower = this.contextMenuTower;
        if (!tower) return;

        if (action === 'upgrade') {
            TowerCommands.upgradeTower(tower);
            UIRenderer.showTowerInfo(tower);
            UIRenderer.updateSidebarCosts();
        } else if (action === 'path') {
            UIRenderer.showPathChoice(tower);
        } else if (action === 'sell') {
            const sellResult = TowerCommands.requestSellTower(tower);
            if (sellResult.sold) {
                document.getElementById('tower-info').style.display = 'none';
            } else {
                UIRenderer.showTowerInfo(tower);
            }
            UIRenderer.updateSidebarCosts();
        } else if (action === 'move') {
            const moveResult = TowerCommands.beginMoveTower(tower);
            if (moveResult.ok) {
                UIRenderer.showTowerInfo(tower);
                Effects.addFloatingText(tower.x, tower.y - 26, 'RELOCATE', '#80d0ff', 11);
            } else if (moveResult.reason === 'gold') {
                Effects.addFloatingText(tower.x, tower.y - 26, `NEED ${moveResult.cost}g`, '#ff8800', 11);
                Audio.play('error');
            }
        } else if (action === 'move_cancel') {
            TowerCommands.cancelMoveTower(tower);
            UIRenderer.showTowerInfo(tower);
        } else if (action === 'link') {
            TowerCommands.beginLinkMode(tower);
            UIRenderer.showTowerInfo(tower);
        } else if (action === 'link_cancel') {
            TowerCommands.cancelLinkMode(tower);
            UIRenderer.showTowerInfo(tower);
        } else if (action === 'overclock') {
            TowerCommands.overclockTower(tower);
            if (GameState.selectedTower === tower) {
                UIRenderer.showTowerInfo(tower);
            }
            if (tower.overclocked) {
                Effects.spawnExplosion(tower.x, tower.y, '#ff8040', 12, { speed: 2, glow: true });
                Effects.addFloatingText(tower.x, tower.y - 25, 'OVERCLOCKED!', '#ff8040', 13);
                Audio.play('overclock');
            }
        } else if (action.startsWith('target_')) {
            const mode = action.replace('target_', '');
            TowerCommands.setTargetMode(tower, mode);
            if (GameState.selectedTower === tower) {
                UIRenderer.showTowerInfo(tower);
            }
            Audio.play('click');
        }

        this._hideContextMenu();
    },

    _hideContextMenu() {
        this.contextMenuVisible = false;
        this.contextMenuTower = null;
        const menu = document.getElementById('tower-context-menu');
        if (menu) menu.style.display = 'none';
    },

    // ===== INPUT BUFFERING =====
    queueAction(action) {
        if (this.actionQueue.length < this.maxQueueSize) {
            this.actionQueue.push({ action, timestamp: Date.now() });
        }
    },

    processActionQueue() {
        if (this.isAnimating || this.actionQueue.length === 0) return;

        const now = Date.now();
        // Remove stale actions (older than 3 seconds)
        this.actionQueue = this.actionQueue.filter(a => now - a.timestamp < 3000);

        if (this.actionQueue.length > 0) {
            const next = this.actionQueue.shift();
            if (typeof next.action === 'function') {
                next.action();
            }
        }
    },

    setAnimating(val) {
        this.isAnimating = val;
        if (!val) {
            this.processActionQueue();
        }
    },

    // ===== MOUSE TRAIL EFFECT =====
    updateMouseTrail(dt) {
        for (let i = this.mouseTrail.length - 1; i >= 0; i--) {
            this.mouseTrail[i].alpha -= dt * 3;
            if (this.mouseTrail[i].alpha <= 0) {
                this.mouseTrail.splice(i, 1);
            }
        }
    },

    drawMouseTrail(ctx) {
        if (!GameState.selectedTowerType || this.mouseTrail.length < 2) return;

        const towerDef = TOWERS[GameState.selectedTowerType];
        if (!towerDef) return;

        ctx.save();
        for (let i = 1; i < this.mouseTrail.length; i++) {
            const prev = this.mouseTrail[i - 1];
            const curr = this.mouseTrail[i];
            ctx.beginPath();
            ctx.moveTo(prev.x, prev.y);
            ctx.lineTo(curr.x, curr.y);
            ctx.strokeStyle = `rgba(${this._hexToRgb(towerDef.color)}, ${curr.alpha * 0.5})`;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        ctx.restore();
    },

    _hexToRgb(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `${r},${g},${b}`;
    },

    // ===== SHORTCUT OVERLAY =====
    _initShortcutOverlay() {
        let overlay = document.getElementById('shortcut-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'shortcut-overlay';
            overlay.style.cssText = 'display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.75);z-index:2000;justify-content:center;align-items:center;';
            overlay.innerHTML = `<div id="shortcut-overlay-content" style="background:#1a1a2e;border:2px solid #444;border-radius:12px;padding:24px 32px;max-width:500px;color:#ddd;font-family:inherit;"></div>`;
            document.body.appendChild(overlay);
            overlay.addEventListener('click', () => this._hideShortcutOverlay());
        }

        this.refreshShortcutOverlay();
    },

    refreshShortcutOverlay() {
        const content = document.getElementById('shortcut-overlay-content');
        if (!content) return;

        const abilityKeys = [0, 1, 2, 3, 4].map(i => this.getAbilityHotkeyLabel(i)).join('/');
        const rows = [
            [this.getHotkeyLabel('startWave'), 'Start Wave'],
            [this.getHotkeyLabel('pause'), 'Pause / Deselect'],
            ['1-0 / - / =', 'Select Tower Type'],
            [abilityKeys, 'Abilities'],
            [this.getHotkeyLabel('sellTower'), 'Sell Tower'],
            [this.getHotkeyLabel('upgradeTower'), 'Upgrade Tower'],
            [this.getHotkeyLabel('cycleTower'), 'Cycle Towers'],
            [this.getHotkeyLabel('toggleRanges'), 'Toggle Ranges'],
            [this.getHotkeyLabel('toggleFPS'), 'Toggle FPS'],
            [this.getHotkeyLabel('speedUp') + '/' + this.getHotkeyLabel('speedReset'), 'Speed Up / Reset'],
            ['Del', 'Sell Tower'],
            ['Shift+Click', 'Multi-select'],
            ['Ctrl+' + this.getHotkeyLabel('selectAll'), 'Select All Towers'],
            ['Arrows', 'Pan Camera'],
            ['Middle Mouse', 'Pan Camera'],
            ['Tower Panel', 'Overclock Button'],
            ['Scroll Wheel', 'Cycle Target Mode'],
            ['Double Click', 'Quick Upgrade'],
        ];

        const rowHtml = rows
            .map(([key, label]) => `<div><kbd style="color:#60d0e0;">${key}</kbd> ${label}</div>`)
            .join('');

        content.innerHTML = `
            <h2 style="margin:0 0 16px;color:#fff;text-align:center;">Keyboard Shortcuts</h2>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px;">
                ${rowHtml}
            </div>
            <p style="text-align:center;margin:16px 0 0;color:#888;font-size:12px;">Press ${this.getHotkeyLabel('showShortcuts')} or ${this.getHotkeyLabel('pause')} to close</p>
        `;
    },

    _toggleShortcutOverlay() {
        if (this.shortcutOverlayVisible) {
            this._hideShortcutOverlay();
        } else {
            this._showShortcutOverlay();
        }
    },

    _showShortcutOverlay() {
        this.shortcutOverlayVisible = true;
        this.refreshShortcutOverlay();
        const overlay = document.getElementById('shortcut-overlay');
        if (overlay) overlay.style.display = 'flex';
    },

    _hideShortcutOverlay() {
        this.shortcutOverlayVisible = false;
        const overlay = document.getElementById('shortcut-overlay');
        if (overlay) overlay.style.display = 'none';
    },

    // ===== HOVER TOOLTIP SMOOTHING =====
    updateTooltipPosition(dt) {
        if (!this.hoverTooltipVisible) return;

        // Smooth interpolation toward target position
        const speed = this.tooltipSmoothSpeed * dt;
        this.hoverTooltipX += (this.hoverTooltipTargetX - this.hoverTooltipX) * Math.min(speed, 1);
        this.hoverTooltipY += (this.hoverTooltipTargetY - this.hoverTooltipY) * Math.min(speed, 1);
    },

    getTooltipPosition() {
        return {
            x: this.hoverTooltipX,
            y: this.hoverTooltipY,
            visible: this.hoverTooltipVisible,
            tower: this.hoveredTower
        };
    },

    // ===== CAMERA PANNING =====
    updateCameraPan(dt) {
        const speed = this.cameraPanSpeed * dt;

        if (this.arrowKeysHeld.up) this.cameraPanY += speed;
        if (this.arrowKeysHeld.down) this.cameraPanY -= speed;
        if (this.arrowKeysHeld.left) this.cameraPanX += speed;
        if (this.arrowKeysHeld.right) this.cameraPanX -= speed;

        // Apply inertia friction when not actively panning
        if (!this.isPanning) {
            this.panVelocityX *= 0.9;
            this.panVelocityY *= 0.9;
            this.cameraPanX += this.panVelocityX * 0.3;
            this.cameraPanY += this.panVelocityY * 0.3;

            if (Math.abs(this.panVelocityX) < 0.1) this.panVelocityX = 0;
            if (Math.abs(this.panVelocityY) < 0.1) this.panVelocityY = 0;
        }

        // Clamp camera pan to reasonable bounds
        const maxPan = 200;
        this.cameraPanX = Math.max(-maxPan, Math.min(maxPan, this.cameraPanX));
        this.cameraPanY = Math.max(-maxPan, Math.min(maxPan, this.cameraPanY));
    },

    resetCameraPan() {
        this.cameraPanX = 0;
        this.cameraPanY = 0;
        this.panVelocityX = 0;
        this.panVelocityY = 0;
    },

    // ===== TOUCH HANDLERS =====
    _initTouchHandlers(gameCanvas) {
        let touchStartTime = 0;
        let touchStartPos = { x: 0, y: 0 };

        gameCanvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = gameCanvas.getBoundingClientRect();
            touchStartTime = Date.now();
            this.longPressTriggered = false;
            touchStartPos = {
                x: touch.clientX - rect.left,
                y: touch.clientY - rect.top
            };

            // Update mouse position for placement preview
            const logical = screenToLogical(touchStartPos.x, touchStartPos.y);
            GameState.mouseX = logical.x;
            GameState.mouseY = logical.y;
            const grid = worldToGrid(logical.x, logical.y);
            GameState.mouseGridCol = grid.col;
            GameState.mouseGridRow = grid.row;
            GameState.placementValid = MapSystem.canBuildAt(logical.x, logical.y);

            // Start long-press timer for tower selection
            if (this.longPressTimer) clearTimeout(this.longPressTimer);
            this.longPressTimer = setTimeout(() => {
                this.longPressTriggered = true;
                // Long-press selects the tower under touch
                for (const t of GameState.towers) {
                    if (dist({x: logical.x, y: logical.y}, t) < (CONFIG.TOWER_FOOTPRINT || 14) + 8) {
                        UIRenderer.showTowerInfo(t);
                        Audio.play('click');
                        break;
                    }
                }
            }, this.longPressDuration);

            // Handle pinch-to-zoom with two fingers
            if (e.touches.length === 2) {
                if (this.longPressTimer) clearTimeout(this.longPressTimer);
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                this.pinchStartDist = this._getTouchDistance(touch1, touch2);
                this.pinchStartZoom = this.currentZoom;
            }
        }, { passive: false });

        gameCanvas.addEventListener('touchmove', (e) => {
            e.preventDefault();

            // Cancel long-press if finger moves too much
            if (e.touches.length === 1) {
                const touch = e.touches[0];
                const rect = gameCanvas.getBoundingClientRect();
                const screenX = touch.clientX - rect.left;
                const screenY = touch.clientY - rect.top;

                const dx = screenX - touchStartPos.x;
                const dy = screenY - touchStartPos.y;
                if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
                    if (this.longPressTimer) clearTimeout(this.longPressTimer);
                }

                const logical = screenToLogical(screenX, screenY);
                GameState.mouseX = logical.x;
                GameState.mouseY = logical.y;
                const grid = worldToGrid(logical.x, logical.y);
                GameState.mouseGridCol = grid.col;
                GameState.mouseGridRow = grid.row;
                GameState.placementValid = MapSystem.canBuildAt(logical.x, logical.y);
            }

            // Pinch-to-zoom with two fingers
            if (e.touches.length === 2) {
                if (this.longPressTimer) clearTimeout(this.longPressTimer);
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                const currentDist = this._getTouchDistance(touch1, touch2);
                const scale = currentDist / this.pinchStartDist;
                this.currentZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.pinchStartZoom * scale));
            }
        }, { passive: false });

        gameCanvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (this.longPressTimer) clearTimeout(this.longPressTimer);

            // Don't process tap if long-press was triggered
            if (this.longPressTriggered) {
                this.longPressTriggered = false;
                return;
            }

            const duration = Date.now() - touchStartTime;

            // Treat as click if short tap
            if (duration < 300) {
                // Simulate click event
                const clickEvent = new MouseEvent('click', {
                    clientX: touchStartPos.x + gameCanvas.getBoundingClientRect().left,
                    clientY: touchStartPos.y + gameCanvas.getBoundingClientRect().top,
                });
                gameCanvas.dispatchEvent(clickEvent);
            }
            // Long press = right click (overclock)
            else if (duration > 600 && !this.longPressTriggered) {
                const contextEvent = new MouseEvent('contextmenu', {
                    clientX: touchStartPos.x + gameCanvas.getBoundingClientRect().left,
                    clientY: touchStartPos.y + gameCanvas.getBoundingClientRect().top,
                });
                gameCanvas.dispatchEvent(contextEvent);
            }
        }, { passive: false });
    },

    _getTouchDistance(touch1, touch2) {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    },

    // ===== UPDATE (called each frame) =====
    update(dt) {
        this.updateCameraPan(dt);
        this.updateMouseTrail(dt);
        this.updateTooltipPosition(dt);
        this.processActionQueue();
    },

    // ===== CLEANUP =====
    destroy() {
        this.multiSelectedTowers = [];
        this.mouseTrail = [];
        this.actionQueue = [];
        this._hideContextMenu();
        this._hideShortcutOverlay();
        this.resetCameraPan();
        if (this.longPressTimer) clearTimeout(this.longPressTimer);
    },
};

function cycleSpeed() {
    // Disable speed changes in multiplayer
    if (typeof Multiplayer !== 'undefined' && Multiplayer.active) return;

    const speeds = CONFIG.GAME_SPEEDS;
    const idx = speeds.indexOf(GameState.gameSpeed);
    GameState.gameSpeed = speeds[(idx + 1) % speeds.length];

    // Challenge: speed_run — minimum 2x speed
    if (GameState.activeChallenges.includes('speed_run')) {
        GameState.gameSpeed = Math.max(GameState.gameSpeed, 2);
    }

    document.getElementById('btn-speed').textContent = GameState.gameSpeed + 'x';
    if (GameState.gameSpeed >= 3) GameState.stats.usedSpeed3 = true;
}

function togglePause() {
    // Disable pause in multiplayer
    if (typeof Multiplayer !== 'undefined' && Multiplayer.active) return;

    if (GameState.gamePhase === 'playing' || GameState.gamePhase === 'idle') {
        GameState.gamePhase = 'paused';
        document.getElementById('pause-menu').style.display = 'flex';
        if (typeof UIRenderer !== 'undefined' && typeof UIRenderer.updateDirectiveTracker === 'function') {
            UIRenderer.updateDirectiveTracker(true);
        }
    } else if (GameState.gamePhase === 'paused') {
        GameState.gamePhase = GameState.enemies.length > 0 ? 'playing' : 'idle';
        document.getElementById('pause-menu').style.display = 'none';
        if (typeof UIRenderer !== 'undefined' && typeof UIRenderer.updateDirectiveTracker === 'function') {
            UIRenderer.updateDirectiveTracker(true);
        }
    }
}
