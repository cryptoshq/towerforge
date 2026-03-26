// ===== DEBUG / DEVELOPER TOOLS SYSTEM =====
// Press ~ (tilde) or F12 to toggle the debug panel.
// Provides performance monitoring, game state inspection, cheat commands,
// an in-game console logger, and visual debug overlays.

// ---- Debug Log (static, can be called from anywhere) ----
const DebugLog = {
    _entries: [],
    _maxEntries: 20,
    _listeners: [],

    CATEGORIES: {
        combat:  { label: 'COMBAT',  color: '#ff6666' },
        economy: { label: 'ECON',    color: '#ffcc44' },
        wave:    { label: 'WAVE',    color: '#66bbff' },
        system:  { label: 'SYSTEM',  color: '#aaaaaa' },
    },

    log(category, message) {
        const cat = this.CATEGORIES[category] || this.CATEGORIES.system;
        const entry = {
            time: performance.now(),
            gameTime: (typeof GameState !== 'undefined') ? GameState.time : 0,
            category,
            label: cat.label,
            color: cat.color,
            message,
        };
        this._entries.push(entry);
        if (this._entries.length > this._maxEntries) {
            this._entries.shift();
        }
        for (const fn of this._listeners) {
            try { fn(entry); } catch (_) { /* ignore */ }
        }
    },

    getEntries() {
        return this._entries;
    },

    onEntry(fn) {
        this._listeners.push(fn);
    },

    clear() {
        this._entries = [];
    },
};

// ---- Performance Monitor ----
const PerfMonitor = {
    _frameTimes: [],       // raw ms per frame (last 120)
    _fpsHistory: [],       // computed fps per second (last 120)
    _maxSamples: 120,
    _lastTimestamp: 0,
    _frameAccum: 0,
    _frameCnt: 0,
    _currentFps: 0,
    _currentFrameTime: 0,

    reset() {
        this._frameTimes = [];
        this._fpsHistory = [];
        this._lastTimestamp = performance.now();
        this._frameAccum = 0;
        this._frameCnt = 0;
    },

    tick(timestamp) {
        if (!this._lastTimestamp) {
            this._lastTimestamp = timestamp;
            return;
        }
        const dt = timestamp - this._lastTimestamp;
        this._lastTimestamp = timestamp;
        this._currentFrameTime = dt;

        // Store raw frame time
        this._frameTimes.push(dt);
        if (this._frameTimes.length > this._maxSamples) this._frameTimes.shift();

        // Compute rolling FPS once per second
        this._frameAccum += dt;
        this._frameCnt++;
        if (this._frameAccum >= 1000) {
            this._currentFps = Math.round((this._frameCnt / this._frameAccum) * 1000);
            this._fpsHistory.push(this._currentFps);
            if (this._fpsHistory.length > this._maxSamples) this._fpsHistory.shift();
            this._frameAccum = 0;
            this._frameCnt = 0;
        }
    },

    getFps()       { return this._currentFps; },
    getFrameMs()   { return this._currentFrameTime.toFixed(1); },
    getFpsHistory() { return this._fpsHistory; },
    getFrameTimes() { return this._frameTimes; },
};

// ---- Debug Overlay Flags ----
const DebugOverlays = {
    showGrid: false,
    showWaypoints: false,
    showAllRanges: false,
    showEnemyHealth: false,
    showProjectileTrails: false,
    showFPS: false,
    showPathVisualization: false,
};

// ---- Debug Cheats State ----
const DebugCheats = {
    invincible: false,
};

// ---- DebugPanel (main UI) ----
const DebugPanel = {
    _visible: false,
    _el: null,
    _styleInjected: false,
    _sections: {},
    _fpsCanvas: null,
    _fpsCtx: null,
    _consoleEl: null,
    _dragState: null,
    _posX: 10,
    _posY: 10,

    // ---- Initialization ----
    init() {
        if (this._el) return; // already created
        this._injectCSS();
        this._buildPanel();
        this._bindKeys();
        this._hookGameEvents();
        PerfMonitor.reset();
        DebugLog.log('system', 'Debug panel initialized');
    },

    // ---- Toggle visibility ----
    toggle() {
        this._visible = !this._visible;
        if (this._el) {
            this._el.style.display = this._visible ? 'flex' : 'none';
        }
    },

    // ---- Per-frame update (call from game loop) ----
    update(timestamp) {
        PerfMonitor.tick(timestamp);
        if (!this._visible) return;
        this._updatePerformance();
        this._updateGameState();
        this._updateConsole();
        this._drawFpsGraph();
    },

    // ===================== PRIVATE =====================

    _injectCSS() {
        if (this._styleInjected) return;
        this._styleInjected = true;
        const style = document.createElement('style');
        style.textContent = `
            #debug-panel {
                position: fixed;
                top: 10px;
                right: 10px;
                width: 340px;
                max-height: 92vh;
                background: rgba(12,12,20,0.92);
                border: 1px solid #444;
                border-radius: 6px;
                color: #ccc;
                font-family: 'Share Tech Mono', 'Courier New', monospace;
                font-size: 11px;
                z-index: 99999;
                display: none;
                flex-direction: column;
                overflow: hidden;
                box-shadow: 0 4px 24px rgba(0,0,0,0.6);
                user-select: none;
            }
            #debug-panel .dp-header {
                background: #1a1a2e;
                padding: 5px 10px;
                font-weight: bold;
                font-size: 13px;
                color: #0f0;
                cursor: move;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid #333;
            }
            #debug-panel .dp-header .dp-close {
                cursor: pointer;
                color: #f44;
                font-size: 16px;
                line-height: 1;
                padding: 0 4px;
            }
            #debug-panel .dp-body {
                overflow-y: auto;
                padding: 6px 8px;
                flex: 1;
            }
            #debug-panel .dp-section {
                margin-bottom: 8px;
            }
            #debug-panel .dp-section-title {
                color: #0cf;
                font-size: 11px;
                font-weight: bold;
                margin-bottom: 3px;
                border-bottom: 1px solid #222;
                padding-bottom: 2px;
                text-transform: uppercase;
            }
            #debug-panel .dp-row {
                display: flex;
                justify-content: space-between;
                padding: 1px 0;
            }
            #debug-panel .dp-row .dp-label { color: #888; }
            #debug-panel .dp-row .dp-value { color: #eee; text-align: right; }
            #debug-panel .dp-btn {
                background: #222;
                color: #ccc;
                border: 1px solid #444;
                padding: 3px 8px;
                margin: 2px;
                cursor: pointer;
                font-family: inherit;
                font-size: 10px;
                border-radius: 3px;
                transition: background 0.15s;
            }
            #debug-panel .dp-btn:hover { background: #383838; color: #fff; }
            #debug-panel .dp-btn.active { background: #0a5; color: #fff; border-color: #0c8; }
            #debug-panel .dp-btn-row {
                display: flex;
                flex-wrap: wrap;
                gap: 2px;
                margin: 3px 0;
            }
            #debug-panel .dp-checkbox-row {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 2px 0;
            }
            #debug-panel .dp-checkbox-row input { margin: 0; cursor: pointer; }
            #debug-panel .dp-checkbox-row label { cursor: pointer; color: #aaa; }
            #debug-panel canvas.dp-fps-graph {
                width: 100%;
                height: 40px;
                background: #111;
                border: 1px solid #333;
                border-radius: 3px;
                margin: 3px 0;
            }
            #debug-panel .dp-console {
                background: #0a0a14;
                border: 1px solid #333;
                border-radius: 3px;
                max-height: 140px;
                overflow-y: auto;
                padding: 4px;
                margin-top: 3px;
                font-size: 10px;
                line-height: 1.4;
            }
            #debug-panel .dp-console-entry {
                white-space: pre-wrap;
                word-break: break-all;
            }
            #debug-panel .dp-console-entry .dp-cat {
                font-weight: bold;
                margin-right: 4px;
            }
            #debug-panel .dp-console-entry .dp-time {
                color: #555;
                margin-right: 4px;
            }
        `;
        document.head.appendChild(style);
    },

    _buildPanel() {
        const panel = document.createElement('div');
        panel.id = 'debug-panel';

        // Header (draggable)
        const header = document.createElement('div');
        header.className = 'dp-header';
        header.innerHTML = '<span>DEBUG TOOLS</span>';
        const closeBtn = document.createElement('span');
        closeBtn.className = 'dp-close';
        closeBtn.textContent = '\u00D7';
        closeBtn.addEventListener('click', () => this.toggle());
        header.appendChild(closeBtn);
        panel.appendChild(header);

        // Make panel draggable from header
        this._initDrag(header, panel);

        // Body
        const body = document.createElement('div');
        body.className = 'dp-body';

        // 1. Performance Monitor section
        body.appendChild(this._buildPerfSection());

        // 2. Game State Inspector section
        body.appendChild(this._buildStateSection());

        // 3. Cheat / Debug Commands section
        body.appendChild(this._buildCheatsSection());

        // 4. Visual Debug Overlays section
        body.appendChild(this._buildOverlaysSection());

        // 5. Console Logger section
        body.appendChild(this._buildConsoleSection());

        panel.appendChild(body);
        document.body.appendChild(panel);
        this._el = panel;
    },

    // ---- Drag logic ----
    _initDrag(handle, panel) {
        let startX, startY, origLeft, origTop;
        const onMouseDown = (e) => {
            if (e.target.closest('.dp-close')) return;
            e.preventDefault();
            const rect = panel.getBoundingClientRect();
            startX = e.clientX;
            startY = e.clientY;
            origLeft = rect.left;
            origTop = rect.top;
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        };
        const onMouseMove = (e) => {
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            panel.style.left = (origLeft + dx) + 'px';
            panel.style.top = (origTop + dy) + 'px';
            panel.style.right = 'auto';
        };
        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        handle.addEventListener('mousedown', onMouseDown);
    },

    // ---- Build: Performance Monitor ----
    _buildPerfSection() {
        const sec = this._makeSection('Performance');
        // FPS graph canvas
        const fpsCanvas = document.createElement('canvas');
        fpsCanvas.className = 'dp-fps-graph';
        fpsCanvas.width = 320;
        fpsCanvas.height = 40;
        this._fpsCanvas = fpsCanvas;
        this._fpsCtx = fpsCanvas.getContext('2d');
        sec.appendChild(fpsCanvas);

        // Stat rows
        this._sections.perfFps = this._addRow(sec, 'FPS', '—');
        this._sections.perfFrameMs = this._addRow(sec, 'Frame Time', '— ms');
        this._sections.perfEnemies = this._addRow(sec, 'Enemies', '0');
        this._sections.perfProjectiles = this._addRow(sec, 'Projectiles', '0');
        this._sections.perfParticles = this._addRow(sec, 'Particles', '0');
        this._sections.perfTowers = this._addRow(sec, 'Towers', '0');
        this._sections.perfBeams = this._addRow(sec, 'Beams', '0');
        this._sections.perfFloating = this._addRow(sec, 'Floating Texts', '0');
        this._sections.perfMemory = this._addRow(sec, 'Memory (MB)', '—');
        return sec;
    },

    // ---- Build: Game State Inspector ----
    _buildStateSection() {
        const sec = this._makeSection('Game State');
        this._sections.stPhase = this._addRow(sec, 'Phase', '—');
        this._sections.stWave = this._addRow(sec, 'Wave', '—');
        this._sections.stGold = this._addRow(sec, 'Gold', '—');
        this._sections.stLives = this._addRow(sec, 'Lives', '—');
        this._sections.stScore = this._addRow(sec, 'Score', '—');
        this._sections.stSpeed = this._addRow(sec, 'Game Speed', '—');
        this._sections.stTime = this._addRow(sec, 'Time Elapsed', '—');
        this._sections.stMouse = this._addRow(sec, 'Mouse (px)', '—');
        this._sections.stMouseGrid = this._addRow(sec, 'Mouse (grid)', '—');
        this._sections.stSelected = this._addRow(sec, 'Selected Tower', '—');
        return sec;
    },

    // ---- Build: Cheat / Debug Commands ----
    _buildCheatsSection() {
        const sec = this._makeSection('Cheats / Commands');

        // Gold buttons
        const goldRow = this._makeBtnRow(sec);
        this._addBtn(goldRow, '+100 Gold', () => { GameState.gold += 100; DebugLog.log('economy', 'Cheat: +100 gold'); });
        this._addBtn(goldRow, '+1000 Gold', () => { GameState.gold += 1000; DebugLog.log('economy', 'Cheat: +1000 gold'); });

        // Research points
        const rpRow = this._makeBtnRow(sec);
        this._addBtn(rpRow, '+10 RP', () => { GameState.researchPoints += 10; DebugLog.log('economy', 'Cheat: +10 research points'); });
        this._addBtn(rpRow, '+100 RP', () => { GameState.researchPoints += 100; DebugLog.log('economy', 'Cheat: +100 research points'); });

        // Wave controls
        const waveRow = this._makeBtnRow(sec);
        this._addBtn(waveRow, 'Skip to Next Wave', () => {
            if (typeof WaveSystem !== 'undefined') {
                // Kill remaining enemies, finish current wave
                GameState.enemies.forEach(e => { e.alive = false; e.hp = 0; });
                GameState.enemies = [];
                GameState.waveEnemies = [];
                GameState.enemiesAlive = 0;
                GameState.gamePhase = 'idle';
                DebugLog.log('wave', 'Cheat: Skipped to next wave');
                if (typeof UIRenderer !== 'undefined') UIRenderer.updateHUD();
                const btn = document.getElementById('btn-start-wave');
                if (btn) btn.classList.remove('hidden');
            }
        });

        // Kill all enemies
        const killRow = this._makeBtnRow(sec);
        this._addBtn(killRow, 'Kill All Enemies', () => {
            const killed = GameState.enemies.length;
            GameState.enemies.forEach(e => {
                e.hp = 0;
                e.alive = false;
                GameState.gold += e.reward || 0;
                GameState.score += e.reward || 0;
            });
            GameState.enemies = [];
            GameState.enemiesAlive = 0;
            DebugLog.log('combat', `Cheat: Killed ${killed} enemies`);
        });

        // Invincibility toggle
        const invRow = this._makeBtnRow(sec);
        this._invBtn = this._addBtn(invRow, 'Invincible: OFF', () => {
            DebugCheats.invincible = !DebugCheats.invincible;
            this._invBtn.textContent = DebugCheats.invincible ? 'Invincible: ON' : 'Invincible: OFF';
            if (DebugCheats.invincible) {
                this._invBtn.classList.add('active');
            } else {
                this._invBtn.classList.remove('active');
            }
            DebugLog.log('system', 'Cheat: Invincible = ' + DebugCheats.invincible);
        });

        // Spawn enemy buttons
        const spawnLabel = document.createElement('div');
        spawnLabel.style.cssText = 'color:#888; margin-top:4px; font-size:10px;';
        spawnLabel.textContent = 'Spawn Enemy:';
        sec.appendChild(spawnLabel);
        const spawnRow = this._makeBtnRow(sec);
        const enemyTypes = ['basic', 'fast', 'heavy', 'healer', 'shield', 'swarm', 'stealth', 'boss'];
        for (const etype of enemyTypes) {
            this._addBtn(spawnRow, etype, () => {
                if (typeof Enemy !== 'undefined' && GameState.waypoints && GameState.waypoints.length > 0) {
                    const e = new Enemy(etype, 1 + (GameState.wave - 1) * 0.12);
                    GameState.enemies.push(e);
                    GameState.enemiesAlive++;
                    DebugLog.log('wave', `Cheat: Spawned ${etype}`);
                } else {
                    DebugLog.log('system', 'Cannot spawn — no active game map');
                }
            });
        }

        // Max upgrade selected tower
        const towerRow = this._makeBtnRow(sec);
        this._addBtn(towerRow, 'Max Upgrade Tower', () => {
            const tower = GameState.selectedTower;
            if (!tower) {
                DebugLog.log('system', 'No tower selected');
                return;
            }
            // Upgrade to tier 5 — pick path A if no path chosen yet
            while (tower.tier < 5) {
                if (tower.tier === 2 && !tower.path) {
                    tower.path = 'A';
                }
                tower.tier++;
                tower._applyTierStats();
            }
            DebugLog.log('combat', `Cheat: Maxed tower ${tower.type} to tier 5`);
            if (typeof UIRenderer !== 'undefined') UIRenderer.updateHUD();
        });

        // Game speed controls
        const speedLabel = document.createElement('div');
        speedLabel.style.cssText = 'color:#888; margin-top:4px; font-size:10px;';
        speedLabel.textContent = 'Game Speed:';
        sec.appendChild(speedLabel);
        const speedRow = this._makeBtnRow(sec);
        for (const spd of [0.5, 1, 2, 5, 10]) {
            this._addBtn(speedRow, spd + 'x', () => {
                GameState.gameSpeed = spd;
                DebugLog.log('system', `Cheat: Speed set to ${spd}x`);
                const btn = document.getElementById('btn-speed');
                if (btn) btn.textContent = spd + 'x';
            });
        }

        // Unlock all maps
        const miscRow = this._makeBtnRow(sec);
        this._addBtn(miscRow, 'Unlock All Maps', () => {
            for (let i = 0; i < GameState.unlockedMaps.length; i++) {
                GameState.unlockedMaps[i] = true;
            }
            DebugLog.log('system', 'Cheat: All maps unlocked');
            if (typeof SaveSystem !== 'undefined') SaveSystem.savePersistent();
        });

        // Toggle show all range circles
        this._rangeBtn = this._addBtn(miscRow, 'All Ranges: OFF', () => {
            DebugOverlays.showAllRanges = !DebugOverlays.showAllRanges;
            this._rangeBtn.textContent = DebugOverlays.showAllRanges ? 'All Ranges: ON' : 'All Ranges: OFF';
            if (DebugOverlays.showAllRanges) {
                this._rangeBtn.classList.add('active');
            } else {
                this._rangeBtn.classList.remove('active');
            }
            DebugLog.log('system', 'Overlay: All ranges = ' + DebugOverlays.showAllRanges);
        });

        // Toggle path visualization
        this._pathBtn = this._addBtn(miscRow, 'Path Vis: OFF', () => {
            DebugOverlays.showPathVisualization = !DebugOverlays.showPathVisualization;
            this._pathBtn.textContent = DebugOverlays.showPathVisualization ? 'Path Vis: ON' : 'Path Vis: OFF';
            if (DebugOverlays.showPathVisualization) {
                this._pathBtn.classList.add('active');
            } else {
                this._pathBtn.classList.remove('active');
            }
            DebugLog.log('system', 'Overlay: Path vis = ' + DebugOverlays.showPathVisualization);
        });

        return sec;
    },

    // ---- Build: Visual Debug Overlays ----
    _buildOverlaysSection() {
        const sec = this._makeSection('Visual Overlays');

        const overlayDefs = [
            { key: 'showGrid',            label: 'Grid Coordinates' },
            { key: 'showWaypoints',       label: 'Path Waypoints' },
            { key: 'showAllRanges',       label: 'All Tower Ranges' },
            { key: 'showEnemyHealth',     label: 'Enemy HP Values' },
            { key: 'showProjectileTrails',label: 'Projectile Trails' },
            { key: 'showFPS',             label: 'FPS Counter (HUD)' },
            { key: 'showPathVisualization',label: 'Path Visualization' },
        ];

        for (const def of overlayDefs) {
            const row = document.createElement('div');
            row.className = 'dp-checkbox-row';
            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.id = 'dbg-overlay-' + def.key;
            cb.checked = DebugOverlays[def.key];
            cb.addEventListener('change', () => {
                DebugOverlays[def.key] = cb.checked;
                // Sync FPS overlay with game setting
                if (def.key === 'showFPS' && typeof GameState !== 'undefined') {
                    GameState.showFPS = cb.checked;
                    if (GameState.settings) GameState.settings.showFPS = cb.checked;
                }
                DebugLog.log('system', `Overlay: ${def.label} = ${cb.checked}`);
            });
            const lbl = document.createElement('label');
            lbl.htmlFor = cb.id;
            lbl.textContent = def.label;
            row.appendChild(cb);
            row.appendChild(lbl);
            sec.appendChild(row);
        }

        return sec;
    },

    // ---- Build: Console Logger ----
    _buildConsoleSection() {
        const sec = this._makeSection('Console');

        const consoleDiv = document.createElement('div');
        consoleDiv.className = 'dp-console';
        this._consoleEl = consoleDiv;
        sec.appendChild(consoleDiv);

        // Clear button
        const clearRow = this._makeBtnRow(sec);
        this._addBtn(clearRow, 'Clear Console', () => {
            DebugLog.clear();
            this._consoleEl.innerHTML = '';
        });

        // Auto-scroll on new entries
        DebugLog.onEntry(() => {
            if (this._visible) this._renderConsoleEntry();
        });

        return sec;
    },

    // ---- Key bindings ----
    _bindKeys() {
        document.addEventListener('keydown', (e) => {
            // ~ (Backquote) toggles debug panel
            if (e.code === 'Backquote') {
                e.preventDefault();
                this.toggle();
                return;
            }
            // F12 also toggles (we intercept but don't block default fully)
            if (e.code === 'F12' && e.shiftKey) {
                e.preventDefault();
                this.toggle();
                return;
            }
        });
    },

    // ---- Hook into game events for automatic logging ----
    _hookGameEvents() {
        // Patch into life-loss to enforce invincibility
        const origLivesDesc = Object.getOwnPropertyDescriptor(GameState, 'lives');
        let _livesVal = GameState.lives;
        Object.defineProperty(GameState, 'lives', {
            get() { return _livesVal; },
            set(v) {
                if (DebugCheats.invincible && v < _livesVal) {
                    // Block life loss
                    return;
                }
                _livesVal = v;
            },
            configurable: true,
            enumerable: true,
        });
    },

    // ---- Update helpers ----
    _updatePerformance() {
        const s = this._sections;
        s.perfFps.textContent = PerfMonitor.getFps();
        s.perfFrameMs.textContent = PerfMonitor.getFrameMs() + ' ms';
        s.perfEnemies.textContent = GameState.enemies ? GameState.enemies.length : 0;
        s.perfProjectiles.textContent = GameState.projectiles ? GameState.projectiles.length : 0;
        s.perfParticles.textContent = GameState.particles ? GameState.particles.length : 0;
        s.perfTowers.textContent = GameState.towers ? GameState.towers.length : 0;
        s.perfBeams.textContent = GameState.beams ? GameState.beams.length : 0;
        s.perfFloating.textContent = GameState.floatingTexts ? GameState.floatingTexts.length : 0;

        // Memory (Chrome only)
        if (performance.memory) {
            const mb = (performance.memory.usedJSHeapSize / (1024 * 1024)).toFixed(1);
            const total = (performance.memory.totalJSHeapSize / (1024 * 1024)).toFixed(1);
            s.perfMemory.textContent = `${mb} / ${total}`;
        } else {
            s.perfMemory.textContent = 'N/A';
        }
    },

    _updateGameState() {
        const s = this._sections;
        s.stPhase.textContent = GameState.gamePhase || '—';
        s.stWave.textContent = `${GameState.wave} / ${GameState.maxWave}`;
        s.stGold.textContent = Math.floor(GameState.gold);
        s.stLives.textContent = `${GameState.lives} / ${GameState.maxLives}`;
        s.stScore.textContent = GameState.score;
        s.stSpeed.textContent = GameState.gameSpeed + 'x';

        // Time elapsed formatted
        const t = GameState.time || 0;
        const mins = Math.floor(t / 60);
        const secs = Math.floor(t % 60);
        s.stTime.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;

        // Mouse position
        s.stMouse.textContent = `${Math.round(GameState.mouseX)}, ${Math.round(GameState.mouseY)}`;
        s.stMouseGrid.textContent = `col ${GameState.mouseGridCol}, row ${GameState.mouseGridRow}`;

        // Selected tower
        if (GameState.selectedTower) {
            const tw = GameState.selectedTower;
            s.stSelected.textContent = `${tw.type} T${tw.tier} (${Math.round(tw.x)},${Math.round(tw.y)})`;
        } else {
            s.stSelected.textContent = 'none';
        }
    },

    _updateConsole() {
        // Handled on-entry; no-op per frame
    },

    _renderConsoleEntry() {
        if (!this._consoleEl) return;
        const entries = DebugLog.getEntries();
        // Rebuild (simple approach for up to 20 entries)
        this._consoleEl.innerHTML = '';
        for (const entry of entries) {
            const div = document.createElement('div');
            div.className = 'dp-console-entry';
            const gt = entry.gameTime || 0;
            const m = Math.floor(gt / 60);
            const sec = Math.floor(gt % 60);
            div.innerHTML = `<span class="dp-time">${m}:${sec.toString().padStart(2,'0')}</span>` +
                `<span class="dp-cat" style="color:${entry.color}">[${entry.label}]</span>` +
                `<span>${this._escapeHtml(entry.message)}</span>`;
            this._consoleEl.appendChild(div);
        }
        this._consoleEl.scrollTop = this._consoleEl.scrollHeight;
    },

    // ---- Draw FPS graph ----
    _drawFpsGraph() {
        const ctx = this._fpsCtx;
        const c = this._fpsCanvas;
        if (!ctx || !c) return;
        const w = c.width;
        const h = c.height;

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#0a0a14';
        ctx.fillRect(0, 0, w, h);

        const data = PerfMonitor.getFrameTimes();
        if (data.length < 2) return;

        // Draw frame time graph (lower is better)
        const maxMs = 50; // Cap at 50ms for graph scale
        const step = w / (120 - 1);

        // 60fps and 30fps reference lines
        ctx.strokeStyle = '#1a3a1a';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        // 16.67ms line (60fps)
        const y60 = h - (16.67 / maxMs) * h;
        ctx.beginPath(); ctx.moveTo(0, y60); ctx.lineTo(w, y60); ctx.stroke();
        // 33.33ms line (30fps)
        const y30 = h - (33.33 / maxMs) * h;
        ctx.strokeStyle = '#3a1a1a';
        ctx.beginPath(); ctx.moveTo(0, y30); ctx.lineTo(w, y30); ctx.stroke();
        ctx.setLineDash([]);

        // Frame time line
        ctx.beginPath();
        ctx.strokeStyle = '#0f0';
        ctx.lineWidth = 1;
        const startIdx = Math.max(0, data.length - 120);
        for (let i = startIdx; i < data.length; i++) {
            const x = (i - startIdx) * step;
            const val = Math.min(data[i], maxMs);
            const y = h - (val / maxMs) * h;
            if (i === startIdx) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // FPS label
        ctx.fillStyle = '#0f0';
        ctx.font = '9px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('60', 2, y60 - 2);
        ctx.fillStyle = '#f44';
        ctx.fillText('30', 2, y30 - 2);

        // Current FPS top-right
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(PerfMonitor.getFps() + ' FPS', w - 4, 12);
    },

    // ---- DOM helpers ----
    _makeSection(title) {
        const sec = document.createElement('div');
        sec.className = 'dp-section';
        const h = document.createElement('div');
        h.className = 'dp-section-title';
        h.textContent = title;
        sec.appendChild(h);
        return sec;
    },

    _addRow(parent, label, defaultValue) {
        const row = document.createElement('div');
        row.className = 'dp-row';
        const lblEl = document.createElement('span');
        lblEl.className = 'dp-label';
        lblEl.textContent = label;
        const valEl = document.createElement('span');
        valEl.className = 'dp-value';
        valEl.textContent = defaultValue;
        row.appendChild(lblEl);
        row.appendChild(valEl);
        parent.appendChild(row);
        return valEl;
    },

    _makeBtnRow(parent) {
        const row = document.createElement('div');
        row.className = 'dp-btn-row';
        parent.appendChild(row);
        return row;
    },

    _addBtn(parent, label, onClick) {
        const btn = document.createElement('button');
        btn.className = 'dp-btn';
        btn.textContent = label;
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            onClick();
        });
        parent.appendChild(btn);
        return btn;
    },

    _escapeHtml(str) {
        const d = document.createElement('div');
        d.textContent = str;
        return d.innerHTML;
    },
};

// ---- Visual Debug Overlay Renderer ----
// Call DebugOverlayRenderer.draw(ctx) at the end of renderGame().
const DebugOverlayRenderer = {
    draw(ctx) {
        if (!ctx) return;
        const ts = CONFIG.TILE_SIZE;

        // Show grid coordinates
        if (DebugOverlays.showGrid && GameState.grid) {
            ctx.save();
            ctx.font = '8px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const rows = GameState.grid.length;
            const cols = GameState.grid[0] ? GameState.grid[0].length : 0;
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const x = c * ts + ts / 2;
                    const y = r * ts + ts / 2;
                    ctx.fillStyle = 'rgba(255,255,255,0.25)';
                    ctx.fillText(`${c},${r}`, x, y);
                }
            }
            ctx.restore();
        }

        // Show path waypoints
        if (DebugOverlays.showWaypoints && GameState.waypoints) {
            ctx.save();
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#ff0';
            ctx.fillStyle = '#ff0';
            ctx.setLineDash([6, 4]);
            ctx.beginPath();
            for (let i = 0; i < GameState.waypoints.length; i++) {
                const wp = GameState.waypoints[i];
                if (i === 0) ctx.moveTo(wp.x, wp.y);
                else ctx.lineTo(wp.x, wp.y);
            }
            ctx.stroke();
            ctx.setLineDash([]);
            // Draw waypoint dots with index
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            for (let i = 0; i < GameState.waypoints.length; i++) {
                const wp = GameState.waypoints[i];
                ctx.beginPath();
                ctx.arc(wp.x, wp.y, 5, 0, Math.PI * 2);
                ctx.fillStyle = i === 0 ? '#0f0' : (i === GameState.waypoints.length - 1 ? '#f00' : '#ff0');
                ctx.fill();
                ctx.fillStyle = '#000';
                ctx.fillText(String(i), wp.x, wp.y);
            }
            ctx.restore();
        }

        // Show path visualization (detailed path)
        if (DebugOverlays.showPathVisualization && GameState.detailedPath && GameState.detailedPath.length > 1) {
            ctx.save();
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'rgba(0,255,200,0.35)';
            ctx.beginPath();
            ctx.moveTo(GameState.detailedPath[0].x, GameState.detailedPath[0].y);
            for (let i = 1; i < GameState.detailedPath.length; i++) {
                ctx.lineTo(GameState.detailedPath[i].x, GameState.detailedPath[i].y);
            }
            ctx.stroke();
            ctx.restore();
        }

        // Show all tower range circles
        if (DebugOverlays.showAllRanges && GameState.towers) {
            ctx.save();
            for (const tower of GameState.towers) {
                const range = tower.range || (tower.getEffectiveRange ? tower.getEffectiveRange() : 0);
                if (range <= 0) continue;
                ctx.beginPath();
                ctx.arc(tower.x, tower.y, range, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(100,200,255,0.35)';
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.fillStyle = 'rgba(100,200,255,0.06)';
                ctx.fill();
            }
            ctx.restore();
        }

        // Show enemy health values
        if (DebugOverlays.showEnemyHealth && GameState.enemies) {
            ctx.save();
            ctx.font = '9px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            for (const enemy of GameState.enemies) {
                if (!enemy.alive) continue;
                const pct = (enemy.hp / enemy.maxHp * 100).toFixed(0);
                const hpText = `${Math.ceil(enemy.hp)}/${Math.ceil(enemy.maxHp)} (${pct}%)`;
                ctx.fillStyle = 'rgba(0,0,0,0.6)';
                const tw = ctx.measureText(hpText).width;
                ctx.fillRect(enemy.x - tw / 2 - 2, enemy.y - enemy.size - 14, tw + 4, 12);
                ctx.fillStyle = enemy.hp / enemy.maxHp > 0.5 ? '#8f8' : (enemy.hp / enemy.maxHp > 0.25 ? '#ff8' : '#f66');
                ctx.fillText(hpText, enemy.x, enemy.y - enemy.size - 3);
            }
            ctx.restore();
        }

        // Show projectile trajectories (lines from origin to current position)
        if (DebugOverlays.showProjectileTrails && GameState.projectiles) {
            ctx.save();
            ctx.lineWidth = 1;
            for (const proj of GameState.projectiles) {
                if (proj.startX !== undefined && proj.startY !== undefined) {
                    ctx.strokeStyle = 'rgba(255,160,60,0.4)';
                    ctx.beginPath();
                    ctx.moveTo(proj.startX, proj.startY);
                    ctx.lineTo(proj.x, proj.y);
                    ctx.stroke();
                } else if (proj.x !== undefined && proj.y !== undefined) {
                    // Just draw a small marker at the projectile position
                    ctx.fillStyle = 'rgba(255,160,60,0.6)';
                    ctx.beginPath();
                    ctx.arc(proj.x, proj.y, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
                // Draw target line if target exists
                if (proj.target && proj.target.alive && proj.x !== undefined) {
                    ctx.strokeStyle = 'rgba(255,60,60,0.25)';
                    ctx.setLineDash([3, 3]);
                    ctx.beginPath();
                    ctx.moveTo(proj.x, proj.y);
                    ctx.lineTo(proj.target.x, proj.target.y);
                    ctx.stroke();
                    ctx.setLineDash([]);
                }
            }
            ctx.restore();
        }
    },
};

if (typeof window !== 'undefined') {
    window.DebugLog = DebugLog;
    window.PerfMonitor = PerfMonitor;
    window.DebugOverlays = DebugOverlays;
    window.DebugCheats = DebugCheats;
    window.DebugPanel = DebugPanel;
}

// ---- Monkey-patch the game loop to feed the debug panel ----
// We wrap requestAnimationFrame's callback via a self-patching approach.
(function patchGameLoop() {
    const _origRAF = window.requestAnimationFrame;
    window.requestAnimationFrame = function(cb) {
        return _origRAF.call(window, function(timestamp) {
            // Feed performance monitor and update panel
            DebugPanel.update(timestamp);
            // Call original callback
            cb(timestamp);
        });
    };
})();

let _debugRenderPatched = false;

function patchRenderGameWithDebugOverlay() {
    if (_debugRenderPatched) return true;
    if (typeof renderGame !== 'function') return false;

    const _origRender = renderGame;
    window.renderGame = function() {
        _origRender();
        // Draw debug overlays on the game canvas
        if (typeof ctx !== 'undefined' && ctx) {
            ctx.save();
            if (typeof applyRenderTransform === 'function') {
                applyRenderTransform(ctx);
            }
            DebugOverlayRenderer.draw(ctx);
            ctx.restore();
        }
    };

    _debugRenderPatched = true;
    return true;
}

function initDebugStartupHooks() {
    // Delay init slightly so main.js initGame() runs first
    setTimeout(() => {
        DebugPanel.init();
    }, 100);

    // Wait for renderGame to exist, then patch overlays once.
    setTimeout(() => {
        if (patchRenderGameWithDebugOverlay()) return;

        let attempts = 0;
        const maxAttempts = 40;
        const retryId = setInterval(() => {
            attempts += 1;
            if (patchRenderGameWithDebugOverlay() || attempts >= maxAttempts) {
                clearInterval(retryId);
            }
        }, 100);
    }, 200);
}

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initDebugStartupHooks, { once: true });
} else {
    initDebugStartupHooks();
}
