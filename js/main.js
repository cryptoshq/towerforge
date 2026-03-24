// ===== MAIN — GAME LOOP, INITIALIZATION & GAME MANAGEMENT =====
// Central orchestrator for the entire game lifecycle:
// Boot → Menu → Map Select → Game → Game Over/Victory → Menu
// Manages frame timing, update/render pipeline, game state transitions,
// pause/resume, speed control, and end-game scoring.

let lastFrameTime = 0;
let gameRunning = false;
let fpsCounter = 0;
let fpsTimer = 0;
let currentFPS = 60;
let frameTimeAccum = 0;
let frameCount = 0;

// Performance tracking
let updateTimeAvg = 0;
let renderTimeAvg = 0;
let gcPauseDetected = false;
let longFrameCount = 0;

// Simulation scheduler state
let simulationClockMs = 0;
let lastRafTimestampMs = 0;
let backgroundSimIntervalId = null;
const FIXED_STEP_MS = 1000 / 60;
const MAX_CATCHUP_MS = 2000;
const MAX_BACKGROUND_CATCHUP_MS = 10 * 60 * 1000;
const BACKGROUND_CATCHUP_STEP_MS = 100;

// Game session tracking
let sessionStartTime = 0;
let totalPauseTime = 0;
let pauseStartTime = 0;

function ensureWeeklyRecord(weekId) {
    if (!GameState.metaProgress || typeof GameState.metaProgress !== 'object') {
        GameState.metaProgress = {};
    }
    if (!GameState.metaProgress.weeklyRecords || typeof GameState.metaProgress.weeklyRecords !== 'object') {
        GameState.metaProgress.weeklyRecords = {};
    }

    if (!GameState.metaProgress.weeklyRecords[weekId]) {
        GameState.metaProgress.weeklyRecords[weekId] = {
            attempts: 0,
            victories: 0,
            bestScore: 0,
            bestWave: 0,
            bestEndlessDepth: 0,
            firstVictoryBonusClaimed: false,
            mapIndex: -1,
            difficulty: 'normal',
            modifiers: [],
        };
    }

    return GameState.metaProgress.weeklyRecords[weekId];
}

function processWeeklyChallengeResult(isVictory) {
    const run = GameState.weeklyChallengeRun;
    if (!run || !run.active || typeof run.weekId !== 'string') {
        return { active: false, bonusRp: 0, record: null };
    }

    const record = ensureWeeklyRecord(run.weekId);
    record.attempts = (record.attempts || 0) + 1;
    if (isVictory) {
        record.victories = (record.victories || 0) + 1;
    }
    record.bestScore = Math.max(record.bestScore || 0, GameState.score || 0);
    record.bestWave = Math.max(record.bestWave || 0, GameState.wave || 0);
    const endlessDepth = WaveSystem.endlessMode ? Math.max(0, GameState.wave - GameState.maxWave) : 0;
    record.bestEndlessDepth = Math.max(record.bestEndlessDepth || 0, endlessDepth);
    record.mapIndex = Number.isFinite(run.mapIndex) ? run.mapIndex : record.mapIndex;
    if (typeof run.difficulty === 'string') record.difficulty = run.difficulty;
    record.modifiers = Array.isArray(run.modifiers) ? [...run.modifiers] : [];

    let bonusRp = 0;
    if (isVictory && !record.firstVictoryBonusClaimed) {
        const bonusMult = 1 + (GameState.researchBonuses.weeklyRpMult || 0);
        bonusRp = Math.max(1, Math.ceil(4 * bonusMult));
        GameState.researchPoints += bonusRp;
        record.firstVictoryBonusClaimed = true;
    }

    return { active: true, bonusRp, record };
}

// ===== GAME INIT =====
function initGame() {
    console.log('%c[TowerForge] Initializing...', 'color: #ffd700; font-weight: bold');
    const initStart = performance.now();

    // Load persistent data (research, achievements, settings, unlocks)
    SaveSystem.loadPersistent();

    // Init audio system
    Audio.init();

    // Init canvas and rendering pipeline
    initCanvas();

    // Init menu system (DOM setup, button bindings)
    MenuSystem.init();

    // Init input handler (keyboard, mouse, touch)
    Input.init();

    // Pre-render tower icons to offscreen canvases
    TowerIcons.init();

    // Initialize tutorial system if available
    if (typeof TutorialSystem !== 'undefined') {
        TutorialSystem.init();
    }

    // Start on main menu
    MenuSystem.showScreen('menu');

    // Resume audio context on first user interaction (browser policy)
    const resumeAudio = () => Audio.unlockFromGesture();
    document.addEventListener('click', resumeAudio, { once: true, capture: true });
    document.addEventListener('keydown', resumeAudio, { once: true, capture: true });
    document.addEventListener('touchstart', resumeAudio, { once: true, capture: true });

    // Prevent context menu on game elements
    document.addEventListener('contextmenu', (e) => {
        if (e.target.closest('#game-screen')) e.preventDefault();
    });

    // Auto-pause on visibility change / blur is disabled so the game
    // continues running when the browser tab or window loses focus.
    const recoverBackgroundSimulation = () => {
        if (!gameRunning) return;
        if (GameState.screen !== 'game') return;
        const now = performance.now();
        runSimulationUntil(now, {
            maxCatchupMs: MAX_BACKGROUND_CATCHUP_MS,
            stepMs: BACKGROUND_CATCHUP_STEP_MS,
        });
        lastRafTimestampMs = now;
    };

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            recoverBackgroundSimulation();
        }
    });
    window.addEventListener('focus', recoverBackgroundSimulation);
    window.addEventListener('pageshow', recoverBackgroundSimulation);

    // Error boundary for game loop
    window.addEventListener('error', (e) => {
        console.error('[TowerForge] Uncaught error:', e.message, e.filename, e.lineno);
        if (typeof DebugLog !== 'undefined') {
            DebugLog.log('system', `ERROR: ${e.message} at ${e.filename}:${e.lineno}`);
        }
    });

    // Start render loop
    gameRunning = true;
    lastFrameTime = performance.now();
    simulationClockMs = lastFrameTime;
    lastRafTimestampMs = lastFrameTime;

    // Background simulation fallback:
    // requestAnimationFrame can throttle heavily when unfocused.
    if (backgroundSimIntervalId) clearInterval(backgroundSimIntervalId);
    backgroundSimIntervalId = setInterval(() => {
        if (!gameRunning) return;
        if (GameState.screen !== 'game') return;

        const now = performance.now();
        // RAF is still active and recent - avoid double-driving updates.
        if (now - lastRafTimestampMs < 140) return;

        runSimulationUntil(now, {
            maxCatchupMs: MAX_BACKGROUND_CATCHUP_MS,
            stepMs: BACKGROUND_CATCHUP_STEP_MS,
        });
    }, 100);

    requestAnimationFrame(gameLoop);

    const initTime = (performance.now() - initStart).toFixed(1);
    console.log(`%c[TowerForge] Ready in ${initTime}ms`, 'color: #40ff80; font-weight: bold');
}

// ===== START NEW GAME =====
function startGame(mapIndex) {
    console.log(`[TowerForge] Starting new game on map ${mapIndex}: ${MAPS[mapIndex].name}`);

    const isWeeklyRun = !!(GameState.weeklyChallengeRun && GameState.weeklyChallengeRun.active);
    if (isWeeklyRun) {
        GameState.activeDoctrineId = null;
    }
    GameState.pendingMapIndex = null;

    // Reset all game state
    GameState.reset();
    GameState.mapIndex = mapIndex;
    GameState.maxWave = MAPS[mapIndex].waves;

    if (isWeeklyRun) {
        GameState.activeChallenges = Array.isArray(GameState.weeklyChallengeRun.modifiers)
            ? [...GameState.weeklyChallengeRun.modifiers]
            : [];
    }

    // Initialize map (grid, path, decorations)
    MapSystem.init(mapIndex);

    // Initialize wave system
    WaveSystem.init(mapIndex);

    // Initialize environmental effects for this map
    if (typeof EnvironmentalParticles !== 'undefined') {
        const mapThemes = ['forest', 'desert', 'ice', 'fire', 'shadow'];
        EnvironmentalParticles.init(mapThemes[mapIndex] || 'forest');
    }

    // Initialize weather for this map
    if (typeof Weather !== 'undefined') {
        const weatherTypes = ['clear', 'sandstorm', 'snow', 'embers', 'fog'];
        Weather.init(weatherTypes[mapIndex] || 'clear');
    }

    // Init abilities
    GameState.abilities = PLAYER_ABILITIES.map(a => ({
        ...a, cooldownTimer: 0, ready: true,
    }));

    // Switch to game screen
    MenuSystem.showScreen('game');
    resizeCanvas();
    UIRenderer.buildSidebar();
    UIRenderer.updateHUD();

    // Force background redraw
    bgDirty = true;

    // Show start wave button
    const waveBtn = document.getElementById('btn-start-wave');
    if (waveBtn) waveBtn.classList.remove('hidden');
    const speedBtn = document.getElementById('btn-speed');
    if (speedBtn) speedBtn.textContent = '1x';

    // Clear any saved game (starting fresh)
    SaveSystem.clearSavedGame();

    // Reset session tracking
    sessionStartTime = performance.now();
    totalPauseTime = 0;
    simulationClockMs = performance.now();
    lastRafTimestampMs = simulationClockMs;

    // Apply research bonuses
    GameState.computeResearchBonuses();

    // Starting gold bonus from research
    if (GameState.researchBonuses.startGold) {
        GameState.gold += GameState.researchBonuses.startGold;
    }

    // Starting lives bonus from research
    if (GameState.researchBonuses.bonusLives) {
        GameState.lives += GameState.researchBonuses.bonusLives;
    }

    // Apply challenge modifiers
    if (GameState.activeChallenges.includes('half_gold')) {
        GameState.gold = Math.floor(GameState.gold * 0.5);
    }
    if (GameState.activeChallenges.includes('glass_cannon')) {
        GameState.lives = 5;
        GameState.maxLives = 5;
    }
    if (GameState.activeChallenges.includes('speed_run')) {
        GameState.gameSpeed = Math.max(GameState.gameSpeed, 2);
        const speedBtn2 = document.getElementById('btn-speed');
        if (speedBtn2) speedBtn2.textContent = GameState.gameSpeed + 'x';
    }

    const weeklyRun = GameState.weeklyChallengeRun;
    if (weeklyRun && weeklyRun.active) {
        const weekText = weeklyRun.weekId || 'WEEKLY';
        const challengeCount = Array.isArray(weeklyRun.modifiers) ? weeklyRun.modifiers.length : 0;
        showWaveBanner(`WEEKLY CHALLENGE ${weekText}`);
        Effects.addFloatingText(
            logicalWidth / 2,
            58,
            `${MAPS[mapIndex].name} | ${GameState.settings.difficulty.toUpperCase()} | ${challengeCount} MOD`,
            '#ffd27a',
            12
        );
    } else {
        const doctrine = GameState.getActiveDoctrine ? GameState.getActiveDoctrine() : null;
        if (doctrine) {
            showWaveBanner(doctrine.name.toUpperCase());
            Effects.addFloatingText(logicalWidth / 2, 58, doctrine.bonusText || '', '#8fd8ff', 12);
            if (doctrine.drawbackText) {
                Effects.addFloatingText(logicalWidth / 2, 76, doctrine.drawbackText, '#ffb3b3', 11);
            }
        }
    }

    // Log to debug
    if (typeof DebugLog !== 'undefined') {
        DebugLog.log('system', `Game started: ${MAPS[mapIndex].name}, ${GameState.maxWave} waves`);
        DebugLog.log('economy', `Starting gold: ${GameState.gold}, Lives: ${GameState.lives}`);
        if (GameState.activeChallenges.length > 0) {
            DebugLog.log('system', `Challenges: ${GameState.activeChallenges.join(', ')}`);
        }
        if (weeklyRun && weeklyRun.active) {
            DebugLog.log('system', `Weekly challenge: ${weeklyRun.weekId || 'unknown'} (${GameState.settings.difficulty})`);
        } else if (GameState.activeDoctrineId) {
            DebugLog.log('system', `Doctrine: ${GameState.activeDoctrineId}`);
        }
    }
}

// ===== LOAD SAVED GAME =====
function startGameFromSave() {
    if (SaveSystem.loadGame()) {
        console.log('[TowerForge] Loaded saved game');

        GameState.abilities = PLAYER_ABILITIES.map(a => ({
            ...a, cooldownTimer: 0, ready: true,
        }));

        // Recompute research bonuses
        GameState.computeResearchBonuses();

        MenuSystem.showScreen('game');
        resizeCanvas();
        UIRenderer.buildSidebar();
        UIRenderer.updateHUD();
        bgDirty = true;

        const waveBtn = document.getElementById('btn-start-wave');
        if (waveBtn) {
            const lockStartButton = !!(WaveSystem.endlessDraftModalOpen || WaveSystem.tacticalEventModalOpen);
            waveBtn.classList.toggle('hidden', lockStartButton);
        }
        const speedBtn = document.getElementById('btn-speed');
        if (speedBtn) speedBtn.textContent = GameState.gameSpeed + 'x';

        if (GameState.weeklyChallengeRun && GameState.weeklyChallengeRun.active) {
            showWaveBanner(`WEEKLY CHALLENGE ${GameState.weeklyChallengeRun.weekId || ''}`.trim());
        } else {
            const doctrine = GameState.getActiveDoctrine ? GameState.getActiveDoctrine() : null;
            if (doctrine) {
                showWaveBanner(doctrine.name.toUpperCase());
            }
        }

        sessionStartTime = performance.now();
        totalPauseTime = 0;
        simulationClockMs = performance.now();
        lastRafTimestampMs = simulationClockMs;

        if (typeof DebugLog !== 'undefined') {
            DebugLog.log('system', `Game loaded: Wave ${GameState.wave}/${GameState.maxWave}`);
        }
    } else {
        console.warn('[TowerForge] Failed to load saved game');
    }
}

// ===== RESTART CURRENT MAP =====
function restartGame() {
    const mapIndex = GameState.mapIndex;
    if (mapIndex >= 0 && mapIndex < MAPS.length) {
        // Hide end-game screens
        const goScreen = document.getElementById('gameover-screen');
        if (goScreen) goScreen.style.display = 'none';
        const vicScreen = document.getElementById('victory-screen');
        if (vicScreen) vicScreen.style.display = 'none';

        startGame(mapIndex);
    }
}

// ===== RETURN TO MENU =====
function returnToMenu() {
    // Hide all game-related overlays
    const overlays = ['gameover-screen', 'victory-screen', 'pause-screen', 'tower-info', 'endless-modal', 'endless-draft-modal', 'tactical-event-modal'];
    for (const id of overlays) {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    }

    // Reset game state
    GameState.gamePhase = 'idle';
    GameState.screen = 'menu';
    GameState.pendingMapIndex = null;
    simulationClockMs = performance.now();

    // Stop game-specific systems
    if (typeof Weather !== 'undefined') Weather.init('clear');

    // Show menu
    MenuSystem.showScreen('menu');
}

// ===== GAME LOOP =====
function runSimulationUntil(nowMs, options = {}) {
    if (simulationClockMs <= 0) {
        simulationClockMs = nowMs;
        return;
    }

    let elapsedMs = nowMs - simulationClockMs;
    if (elapsedMs <= 0) return;

    const maxCatchupMs = Number.isFinite(options.maxCatchupMs)
        ? Math.max(FIXED_STEP_MS, options.maxCatchupMs)
        : MAX_CATCHUP_MS;
    const stepMs = Number.isFinite(options.stepMs)
        ? Math.max(FIXED_STEP_MS, options.stepMs)
        : FIXED_STEP_MS;

    // Prevent giant update bursts after long browser throttles.
    elapsedMs = Math.min(elapsedMs, maxCatchupMs);

    let steps = 0;
    const maxSteps = Math.ceil(maxCatchupMs / stepMs);
    while (elapsedMs >= stepMs && steps < maxSteps) {
        updateGame(stepMs / 1000);
        simulationClockMs += stepMs;
        elapsedMs -= stepMs;
        steps++;
    }
}

function gameLoop(timestamp) {
    if (!gameRunning) return;

    lastRafTimestampMs = timestamp;

    const rawDt = (timestamp - lastFrameTime) / 1000;
    lastFrameTime = timestamp;

    // Detect GC pauses / long frames
    if (rawDt > 0.1) {
        longFrameCount++;
        gcPauseDetected = true;
        if (typeof DebugLog !== 'undefined') {
            DebugLog.log('system', `Long frame: ${(rawDt * 1000).toFixed(0)}ms`);
        }
    } else {
        gcPauseDetected = false;
    }

    // FPS tracking (rolling average)
    frameTimeAccum += rawDt;
    frameCount++;
    if (frameTimeAccum >= 1.0) {
        currentFPS = Math.round(frameCount / frameTimeAccum);
        frameCount = 0;
        frameTimeAccum = 0;
    }

    // Update and render based on current screen
    if (GameState.screen === 'game') {
        const updateStart = performance.now();
        runSimulationUntil(timestamp);
        const updateEnd = performance.now();

        renderGame();
        const renderEnd = performance.now();

        // Smooth average timing for debug display
        updateTimeAvg = updateTimeAvg * 0.95 + (updateEnd - updateStart) * 0.05;
        renderTimeAvg = renderTimeAvg * 0.95 + (renderEnd - updateEnd) * 0.05;
    }

    requestAnimationFrame(gameLoop);
}

// ===== GAME UPDATE =====
function updateGame(rawDt) {
    const phase = GameState.gamePhase;
    if (phase === 'paused' || phase === 'gameover' || phase === 'victory') {
        // Still update pause-time tracking
        if (phase === 'paused' && pauseStartTime === 0) {
            pauseStartTime = performance.now();
        }
        return;
    }

    // Resume from pause — track pause duration
    if (pauseStartTime > 0) {
        totalPauseTime += performance.now() - pauseStartTime;
        pauseStartTime = 0;
    }

    const dt = rawDt * GameState.gameSpeed;
    GameState.time += dt;

    // ===== WAVE SYSTEM =====
    WaveSystem.update(dt);

    // ===== ENEMIES =====
    for (let i = GameState.enemies.length - 1; i >= 0; i--) {
        const e = GameState.enemies[i];
        if (!e.update(dt)) {
            if (e.reached && !e.alive) {
                handleEnemyLeak(e);
            }
            if (!e.alive) {
                GameState.enemies.splice(i, 1);
            }
        }
    }

    // Shield enemy behavior (group shield aura)
    updateShieldEnemies();

    // Healer enemy behavior (heal nearby enemies)
    if (typeof updateHealerEnemies === 'function') {
        updateHealerEnemies();
    }

    // ===== TOWERS =====
    for (const tower of GameState.towers) {
        tower.update(dt);
    }

    // ===== PROJECTILES =====
    for (let i = GameState.projectiles.length - 1; i >= 0; i--) {
        if (!GameState.projectiles[i].update(dt)) {
            GameState.projectiles.splice(i, 1);
        }
    }

    // ===== ABILITIES =====
    AbilitySystem.update(dt);

    // ===== SYNERGIES =====
    SynergySystem.update(dt);

    // ===== EFFECTS (particles, floating text, beams) =====
    Effects.updateAll(dt);

    // ===== VFX SUB-SYSTEMS (weather, env particles, decals, ring waves) =====
    VFXRenderer.update(dt);

    // ===== SCREEN SHAKE =====
    updateScreenShake();

    // ===== BOSS INTRO =====
    if (GameState.bossIntro.active) {
        GameState.bossIntro.timer += dt;
        if (GameState.bossIntro.timer >= GameState.bossIntro.duration) {
            GameState.bossIntro.active = false;
        }
        // Sustained shake during intro
        if (GameState.bossIntro.timer < GameState.bossIntro.duration * 0.7) {
            addScreenShake(3);
        }
    }

    // ===== SCREEN FLASH =====
    if (GameState.screenFlash && GameState.screenFlash.timer > 0) {
        GameState.screenFlash.timer -= dt;
    }

    // ===== RESEARCH COMBAT TIMERS =====
    if (GameState.lastStandTimer > 0) {
        GameState.lastStandTimer = Math.max(0, GameState.lastStandTimer - dt);
    }
    if (GameState.invulnTimer > 0) {
        GameState.invulnTimer = Math.max(0, GameState.invulnTimer - dt);
    }

    // ===== ADAPTIVE MUSIC =====
    if (typeof Audio !== 'undefined' && Audio.updateMusicState) {
        let musicState = 'idle';
        if (GameState.gamePhase === 'playing') {
            const hasBoss = GameState.enemies.some(e => e.isBoss);
            if (hasBoss) {
                musicState = 'boss';
            } else {
                musicState = 'combat';
            }
        }
        // Override with danger if lives are critically low
        if (GameState.lives <= 5 && GameState.lives > 0 && GameState.gamePhase === 'playing') {
            musicState = 'danger';
        }
        Audio.updateMusicState(musicState);
    }

    // ===== ACHIEVEMENTS =====
    AchievementSystem.update(dt);

    // ===== TUTORIAL =====
    if (typeof TutorialSystem !== 'undefined' && TutorialSystem.checkGameState) {
        TutorialSystem.checkGameState();
    }

    // ===== UI UPDATES =====
    UIRenderer.updateHUD();
    UIRenderer.updateAbilityBar();

    // Periodically update sidebar costs (2x per second)
    if (Math.floor(GameState.time * 2) !== Math.floor((GameState.time - rawDt) * 2)) {
        UIRenderer.updateSidebarCosts();
    }

    // ===== AUTO-SAVE (every 30 seconds) =====
    if (Math.floor(GameState.time / 30) !== Math.floor((GameState.time - dt) / 30)) {
        SaveSystem.autoSave();
    }

    // ===== INTEREST DISPLAY (between waves) =====
    if (GameState.gamePhase === 'idle') {
        UIRenderer.updateInterestPreview();
    }

    // ===== ENTITY COUNT TRACKING (for debug) =====
    GameState.entityCounts = {
        enemies: GameState.enemies.length,
        towers: GameState.towers.length,
        projectiles: GameState.projectiles.length,
        particles: Effects.particles ? Effects.particles.length : 0,
    };
}

// ===== HANDLE ENEMY REACHING END =====
function handleEnemyLeak(enemy) {
    let lifeLoss = enemy.isBoss ? 3 : 1;
    const rb = GameState.researchBonuses;

    // Invulnerability window from research (after previous leak)
    if (GameState.invulnTimer > 0) {
        lifeLoss = 0;
        Effects.addFloatingText(
            logicalWidth - 130, 105,
            'INVULNERABLE', '#80d0ff', 12
        );
    }

    // Research: reduced leak damage
    if (rb.reducedLeak) {
        lifeLoss = Math.max(1, lifeLoss - rb.reducedLeak);
    }

    // Shield charges absorb leak
    if (GameState.shieldCharges > 0) {
        GameState.shieldCharges--;
        lifeLoss = 0;
        Effects.addFloatingText(
            logicalWidth - 100, 80,
            'SHIELDED!', '#4080ff', 14
        );
        Audio.play('shield');
    }

    GameState.lives -= lifeLoss;
    GameState.stats.leaksThisGame++;

    if (typeof WaveSystem !== 'undefined' && typeof WaveSystem.recordLeak === 'function') {
        WaveSystem.recordLeak(enemy);
    }

    if (lifeLoss > 0) {
        Effects.addFloatingText(
            logicalWidth / 2, logicalHeight / 2,
            `-${lifeLoss} LIFE`, '#ff4040', 20
        );
        addScreenShake(5);

        // Research: life insurance gold refund
        if (rb.lifeInsGold) {
            GameState.gold += rb.lifeInsGold;
            Effects.addFloatingText(
                logicalWidth / 2, logicalHeight / 2 + 25,
                `+${rb.lifeInsGold}g Insurance`, '#ffd700', 12
            );
        }

        // Flash screen red
        GameState.screenFlash = { color: '#ff0000', alpha: 0.3, timer: 0.5 };

        // Last Stand trigger: once health drops to 5 or below, grant timed global damage boost.
        if (rb.lastStand && GameState.lives <= 5 && GameState.lastStandTimer <= 0) {
            GameState.lastStandTimer = 30;
            Effects.addFloatingText(
                logicalWidth / 2, logicalHeight / 2 - 26,
                'LAST STAND ACTIVATED', '#ffb040', 15
            );
            Audio.play('powerup');
        }

        // Immortal Bastion: grant post-hit invulnerability window.
        if (rb.invulnWindow) {
            GameState.invulnTimer = Math.max(GameState.invulnTimer, rb.invulnWindow);
        }

        Audio.play('leak');
    }

    GameState.enemiesAlive--;

    // Check game over
    if (GameState.lives <= 0) {
        // Second chance (research unlock)
        if (rb.secondChance && !GameState.secondChanceUsed) {
            GameState.secondChanceUsed = true;
            GameState.lives = 1;
            Effects.addFloatingText(
                logicalWidth / 2, logicalHeight / 2,
                'SECOND CHANCE!', '#ffd700', 22
            );
            GameState.screenFlash = { color: '#ffd700', alpha: 0.5, timer: 1.0 };
            Audio.play('powerup');

            if (typeof DebugLog !== 'undefined') {
                DebugLog.log('system', 'Second chance activated!');
            }
        } else {
            gameOver();
        }
    }

    if (typeof DebugLog !== 'undefined') {
        DebugLog.log('combat', `Enemy leaked: ${enemy.type}, ${lifeLoss} life lost (${GameState.lives} remaining)`);
    }
}

// ===== RENDER PIPELINE =====
function renderGame() {
    if (!ctx) return;

    // Clear entire canvas
    ctx.fillStyle = '#101020';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    ctx.save();

    // Apply rendering transform: offset + scale to fill screen
    applyRenderTransform(ctx);

    // Apply screen effects transform (zoom, shake)
    if (typeof ScreenEffects !== 'undefined' && ScreenEffects.cameraZoom !== 1.0) {
        ScreenEffects.applyTransform(ctx, logicalWidth, logicalHeight);
    }

    // Apply screen shake offset
    ctx.translate(shakeX, shakeY);

    // === LAYER 1: Map (terrain, grid, path, decorations) ===
    MapSystem.draw(ctx);

    // === LAYER 2: Synergy zones (glowing areas under towers) ===
    SynergySystem.drawZones(ctx);

    // === LAYER 3: Tower range indicators (for selected tower) ===
    if (GameState.selectedTower) {
        drawTowerRange(ctx, GameState.selectedTower);
    }

    // === LAYER 4: Towers ===
    for (const tower of GameState.towers) {
        TowerRenderer.draw(ctx, tower);
    }

    // === LAYER 5: Enemies ===
    for (const enemy of GameState.enemies) {
        EnemyRenderer.draw(ctx, enemy);
    }

    // === LAYER 6: VFX (projectiles, particles, weather, overlays) ===
    VFXRenderer.draw(ctx);

    // === LAYER 7: Canvas-based UI (wave progress, tooltips, previews) ===
    UIRenderer.drawCanvasUI(ctx);

    // === LAYER 8: Screen flash effect ===
    if (GameState.screenFlash && GameState.screenFlash.timer > 0) {
        const flash = GameState.screenFlash;
        const alpha = flash.alpha * clamp(flash.timer / 0.5, 0, 1);
        ctx.fillStyle = colorAlpha(flash.color, Math.min(alpha, 0.4));
        ctx.fillRect(-50, -50, logicalWidth + 100, logicalHeight + 100);
    }

    // === LAYER 9: Boss intro overlay ===
    if (GameState.bossIntro.active) {
        const bi = GameState.bossIntro;
        const t = bi.timer;
        const dur = bi.duration;
        const cx = logicalWidth / 2;
        const cy = logicalHeight / 2;

        // Phase timing: fade in 0.3s, hold 1.5s, fade out 0.7s
        let overlayAlpha;
        if (t < 0.3) {
            overlayAlpha = t / 0.3;
        } else if (t < 1.8) {
            overlayAlpha = 1.0;
        } else {
            overlayAlpha = clamp(1.0 - (t - 1.8) / 0.7, 0, 1);
        }

        // Dark vignette overlay
        ctx.fillStyle = `rgba(0,0,0,${0.6 * overlayAlpha})`;
        ctx.fillRect(-50, -50, logicalWidth + 100, logicalHeight + 100);

        // Circular energy burst animation
        const burstProgress = clamp(t / 1.0, 0, 1);
        const burstRadius = burstProgress * 200;
        const burstAlpha = overlayAlpha * (1.0 - burstProgress) * 0.4;
        if (burstAlpha > 0.01) {
            const burstGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, burstRadius);
            burstGrad.addColorStop(0, `rgba(255,40,40,${burstAlpha})`);
            burstGrad.addColorStop(0.5, `rgba(200,20,20,${burstAlpha * 0.5})`);
            burstGrad.addColorStop(1, 'rgba(255,0,0,0)');
            ctx.fillStyle = burstGrad;
            ctx.beginPath();
            ctx.arc(cx, cy, burstRadius, 0, Math.PI * 2);
            ctx.fill();
        }

        // Secondary pulsing ring
        if (t > 0.2 && overlayAlpha > 0.01) {
            const ringT = (t - 0.2) * 2.5;
            const ringRadius = 60 + Math.sin(ringT) * 20;
            ctx.strokeStyle = `rgba(255,80,40,${0.4 * overlayAlpha})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2);
            ctx.stroke();

            // Outer expanding ring
            const outerRing = 100 + ringT * 15;
            if (outerRing < 300) {
                ctx.strokeStyle = `rgba(255,60,30,${0.2 * overlayAlpha * (1 - outerRing / 300)})`;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(cx, cy, outerRing, 0, Math.PI * 2);
                ctx.stroke();
            }
        }

        // Boss name in huge dramatic text with glow
        if (overlayAlpha > 0.01) {
            ctx.save();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Name glow
            ctx.shadowColor = '#ff2000';
            ctx.shadowBlur = 30 * overlayAlpha;
            ctx.fillStyle = `rgba(255,220,200,${overlayAlpha})`;
            ctx.font = 'bold 42px monospace';
            ctx.fillText(bi.name.toUpperCase(), cx, cy - 30);

            // Second pass for brighter center
            ctx.shadowBlur = 15 * overlayAlpha;
            ctx.shadowColor = '#ff6040';
            ctx.fillText(bi.name.toUpperCase(), cx, cy - 30);
            ctx.shadowBlur = 0;

            // "WARNING" subtitle
            const warningAlpha = overlayAlpha * (0.5 + Math.sin(t * 8) * 0.3);
            ctx.fillStyle = `rgba(255,60,40,${warningAlpha})`;
            ctx.font = 'bold 14px monospace';
            ctx.fillText('!! BOSS INCOMING !!', cx, cy - 65);

            // Abilities listed below the name
            ctx.font = '14px monospace';
            ctx.shadowColor = '#ff4020';
            ctx.shadowBlur = 8 * overlayAlpha;
            for (let i = 0; i < bi.abilities.length; i++) {
                const abilAlpha = overlayAlpha * clamp((t - 0.3 - i * 0.15) / 0.2, 0, 1);
                ctx.fillStyle = `rgba(255,180,120,${abilAlpha})`;
                ctx.fillText(bi.abilities[i], cx, cy + 10 + i * 22);
            }
            ctx.shadowBlur = 0;

            // Decorative lines flanking the name
            const lineW = 100 * overlayAlpha;
            ctx.strokeStyle = `rgba(255,80,40,${0.5 * overlayAlpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(cx - lineW - 120, cy - 30);
            ctx.lineTo(cx - 120, cy - 30);
            ctx.moveTo(cx + 120, cy - 30);
            ctx.lineTo(cx + lineW + 120, cy - 30);
            ctx.stroke();

            ctx.restore();
        }
    }

    ctx.restore();

    // === SCREEN-SPACE UI (not affected by game transform) ===

    // FPS counter
    if (GameState.settings && GameState.settings.showFPS) {
        ctx.save();
        ctx.fillStyle = '#0f0';
        ctx.font = '12px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`FPS: ${currentFPS}`, 5, 15);
        if (typeof DebugPanel !== 'undefined' && DebugPanel.visible) {
            ctx.fillText(`Update: ${updateTimeAvg.toFixed(1)}ms`, 5, 30);
            ctx.fillText(`Render: ${renderTimeAvg.toFixed(1)}ms`, 5, 45);
        }
        ctx.restore();
    }
}

// ===== DRAW TOWER RANGE =====
function drawTowerRange(ctx, tower) {
    if (!tower) return;
    const range = tower.getEffectiveRange();
    ctx.save();
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = TOWERS[tower.type].iconColor || '#ffffff';
    ctx.beginPath();
    ctx.arc(tower.x, tower.y, range, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.4;
    ctx.strokeStyle = TOWERS[tower.type].iconColor || '#ffffff';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
}

// ===== GAME OVER =====
function gameOver() {
    GameState.gamePhase = 'gameover';
    Audio.play('gameover');
    Audio.stopMusic();

    console.log(`[TowerForge] Game Over on wave ${GameState.wave}`);

    // Calculate research points earned
    let rp = 1; // Base RP for playing
    const rb = GameState.researchBonuses;
    rp += (rb.bonusRP || 0);

    const endlessDepth = WaveSystem.endlessMode
        ? Math.max(0, GameState.wave - GameState.maxWave)
        : 0;
    if (endlessDepth > 0) {
        rp += Math.floor(endlessDepth / 5);
    }

    // Bonus RP for waves survived
    rp += Math.floor(GameState.wave / 10);

    GameState.researchPoints += rp;
    const weeklyResult = processWeeklyChallengeResult(false);

    // Challenge streak tracking (phase 3 retention)
    if (GameState.activeChallenges.length > 0) {
        GameState.metaProgress.challengeWinStreak = 0;
    }

    // Update records
    const mapIdx = GameState.mapIndex;
    GameState.mapScores[mapIdx] = Math.max(GameState.mapScores[mapIdx] || 0, GameState.score);
    GameState.mapWaveRecords[mapIdx] = Math.max(GameState.mapWaveRecords[mapIdx] || 0, GameState.wave);

    // Calculate total gold earned
    const totalGoldEarned = GameState.stats.maxGold || 0;

    // Show game over screen
    const waveEl = document.getElementById('gameover-wave');
    if (waveEl) waveEl.textContent = `Defeated on Wave ${GameState.wave}`;

    const statsEl = document.getElementById('gameover-stats');
    if (statsEl) {
        const sessionTime = (performance.now() - sessionStartTime - totalPauseTime) / 1000;
        const endlessBest = (GameState.metaProgress.endlessBestDepthByMap || [])[GameState.mapIndex] || 0;
        statsEl.innerHTML = `
            <div class="stat-row"><span class="sr-label">Total Kills</span><span class="sr-value">${GameState.stats.totalKills}</span></div>
            <div class="stat-row"><span class="sr-label">Boss Kills</span><span class="sr-value">${GameState.stats.bossKills}</span></div>
            <div class="stat-row"><span class="sr-label">Towers Built</span><span class="sr-value">${GameState.towers.length}</span></div>
            <div class="stat-row"><span class="sr-label">Score</span><span class="sr-value">${GameState.score}</span></div>
            <div class="stat-row"><span class="sr-label">Game Time</span><span class="sr-value">${formatTime(GameState.time)}</span></div>
            <div class="stat-row"><span class="sr-label">Real Time</span><span class="sr-value">${formatTime(sessionTime)}</span></div>
            <div class="stat-row"><span class="sr-label">Gold Earned</span><span class="sr-value">${totalGoldEarned}</span></div>
            ${endlessDepth > 0 ? `<div class="stat-row"><span class="sr-label">Endless Depth</span><span class="sr-value">+${endlessDepth} (Best +${endlessBest})</span></div>` : ''}
            ${weeklyResult.active ? `<div class="stat-row"><span class="sr-label">Weekly Challenge</span><span class="sr-value">${GameState.weeklyChallengeRun.weekId || 'Active'} | Best ${weeklyResult.record.bestScore || 0}</span></div>` : ''}
            <div class="stat-row"><span class="sr-label">Leaks</span><span class="sr-value" style="color:#ff4040">${GameState.stats.leaksThisGame}</span></div>
        `;
    }

    const rpEl = document.getElementById('gameover-rp');
    if (rpEl) {
        const weeklyText = weeklyResult.active ? ' | Weekly Run' : '';
        rpEl.textContent = `+${rp} Research Points${weeklyText}`;
    }

    const goScreen = document.getElementById('gameover-screen');
    if (goScreen) goScreen.style.display = 'flex';

    // Save to leaderboard with extra data
    Leaderboard.addScore(mapIdx, GameState.score, GameState.wave, GameState.stats.totalKills, {
        time: GameState.time,
        towers: GameState.towers.length,
        maxTier: GameState.stats.maxTier,
        leaks: GameState.stats.leaksThisGame,
        bossKills: GameState.stats.bossKills,
        victory: false,
        goldEarned: totalGoldEarned,
        mode: WaveSystem.endlessMode ? 'endless' : 'campaign',
        endlessDepth,
        challengeCount: GameState.activeChallenges.length,
    });

    SaveSystem.savePersistent();
    SaveSystem.clearSavedGame();

    if (typeof DebugLog !== 'undefined') {
        DebugLog.log('system', `Game Over: Wave ${GameState.wave}, Score ${GameState.score}, RP +${rp}`);
    }
}

// ===== VICTORY =====
function victory() {
    GameState.gamePhase = 'victory';
    Audio.play('victory');

    console.log(`[TowerForge] Victory on ${MAPS[GameState.mapIndex].name}!`);

    // Calculate RP with bonuses
    let rp = 2; // Base for victory
    const rb = GameState.researchBonuses;
    rp += (rb.bonusRP || 0);

    const bonusParts = [];

    // Perfect game bonus (no leaks)
    if (GameState.stats.leaksThisGame === 0) {
        rp += 1;
        GameState.stats.perfectWaves++;
        bonusParts.push('Perfect');
    }

    // Speed run bonus
    const speedThreshold = MAPS[GameState.mapIndex].waves * 20;
    if (GameState.time < speedThreshold) {
        rp += 1;
        bonusParts.push('Speed');
    }

    // Boss slayer bonus (killed all bosses)
    if (GameState.stats.bossKills >= Math.floor(GameState.maxWave / 5)) {
        rp += 1;
        bonusParts.push('Boss Slayer');
    }

    // Efficiency bonus (high score per wave)
    if (GameState.score > GameState.maxWave * 100) {
        rp += 1;
        bonusParts.push('Efficient');
    }

    // Challenge modifier RP bonus
    let challengeRPMult = 1.0;
    for (const cid of GameState.activeChallenges) {
        const cmod = CONFIG.CHALLENGE_MODIFIERS.find(c => c.id === cid);
        if (cmod) challengeRPMult += cmod.rpBonus;
    }
    if (challengeRPMult > 1.0) {
        rp = Math.ceil(rp * challengeRPMult);
        bonusParts.push(`Challenge x${challengeRPMult.toFixed(1)}`);
    }

    GameState.researchPoints += rp;
    const weeklyResult = processWeeklyChallengeResult(true);
    if (weeklyResult.bonusRp > 0) {
        bonusParts.push(`Weekly +${weeklyResult.bonusRp} RP`);
    }

    // Challenge streak tracking (phase 3 retention)
    if (GameState.activeChallenges.length > 0) {
        GameState.metaProgress.challengeWinStreak = (GameState.metaProgress.challengeWinStreak || 0) + 1;
        GameState.metaProgress.bestChallengeWinStreak = Math.max(
            GameState.metaProgress.bestChallengeWinStreak || 0,
            GameState.metaProgress.challengeWinStreak
        );
        GameState.metaProgress.totalChallengeVictories = (GameState.metaProgress.totalChallengeVictories || 0) + 1;
    } else {
        GameState.metaProgress.challengeWinStreak = 0;
    }

    // Update records
    const mapIdx = GameState.mapIndex;
    GameState.mapScores[mapIdx] = Math.max(GameState.mapScores[mapIdx] || 0, GameState.score);
    GameState.mapWaveRecords[mapIdx] = Math.max(GameState.mapWaveRecords[mapIdx] || 0, GameState.wave);

    // Unlock next map (within the same difficulty group of 5)
    if (!GameState.stats.mapsCompleted.includes(mapIdx)) {
        GameState.stats.mapsCompleted.push(mapIdx);
    }
    const groupStart = Math.floor(mapIdx / 5) * 5;
    const groupEnd = groupStart + 5;
    const nextInGroup = mapIdx + 1;
    if (nextInGroup < groupEnd && nextInGroup < MAPS.length) {
        GameState.unlockedMaps[nextInGroup] = true;
    }

    // Total gold earned
    const totalGoldEarned = GameState.stats.maxGold || 0;
    const sessionTime = (performance.now() - sessionStartTime - totalPauseTime) / 1000;

    // Show victory screen
    const statsEl = document.getElementById('victory-stats');
    if (statsEl) {
        statsEl.innerHTML = `
            <div class="stat-row"><span class="sr-label">Total Kills</span><span class="sr-value">${GameState.stats.totalKills}</span></div>
            <div class="stat-row"><span class="sr-label">Boss Kills</span><span class="sr-value">${GameState.stats.bossKills}</span></div>
            <div class="stat-row"><span class="sr-label">Towers Built</span><span class="sr-value">${GameState.towers.length}</span></div>
            <div class="stat-row"><span class="sr-label">Max Tower Tier</span><span class="sr-value">${GameState.stats.maxTier}</span></div>
            <div class="stat-row"><span class="sr-label">Score</span><span class="sr-value">${GameState.score}</span></div>
            <div class="stat-row"><span class="sr-label">Game Time</span><span class="sr-value">${formatTime(GameState.time)}</span></div>
            <div class="stat-row"><span class="sr-label">Real Time</span><span class="sr-value">${formatTime(sessionTime)}</span></div>
            <div class="stat-row"><span class="sr-label">Gold Earned</span><span class="sr-value">${totalGoldEarned}</span></div>
            ${GameState.activeChallenges.length > 0 ? `<div class="stat-row"><span class="sr-label">Challenge Streak</span><span class="sr-value">${GameState.metaProgress.challengeWinStreak}</span></div>` : ''}
            ${weeklyResult.active ? `<div class="stat-row"><span class="sr-label">Weekly Challenge</span><span class="sr-value">${GameState.weeklyChallengeRun.weekId || 'Active'} | Best ${weeklyResult.record.bestScore || 0}</span></div>` : ''}
            <div class="stat-row"><span class="sr-label">Leaks</span><span class="sr-value" style="color:${GameState.stats.leaksThisGame === 0 ? '#40ff80' : '#ff4040'}">${GameState.stats.leaksThisGame}</span></div>
        `;
    }

    // RP display with bonuses
    let rpText = `+${rp} Research Points`;
    if (bonusParts.length > 0) {
        rpText += ` (${bonusParts.join(' + ')})`;
    }
    const rpEl = document.getElementById('victory-rp');
    if (rpEl) rpEl.textContent = rpText;

    const vicScreen = document.getElementById('victory-screen');
    if (vicScreen) vicScreen.style.display = 'flex';

    // Show/hide next map button (stay within difficulty group)
    const nextBtn = document.getElementById('btn-next-map');
    if (nextBtn) {
        if (weeklyResult.active) {
            nextBtn.style.display = 'none';
        } else {
        const nextMap = mapIdx + 1;
        const gEnd = Math.floor(mapIdx / 5) * 5 + 5;
        if (nextMap < gEnd && nextMap < MAPS.length && GameState.unlockedMaps[nextMap]) {
            nextBtn.style.display = 'block';
            nextBtn.textContent = `NEXT: ${MAPS[nextMap].name}`;
        } else {
            nextBtn.style.display = 'none';
        }
        }
    }

    // Save to leaderboard with extra data
    Leaderboard.addScore(mapIdx, GameState.score, GameState.wave, GameState.stats.totalKills, {
        time: GameState.time,
        towers: GameState.towers.length,
        maxTier: GameState.stats.maxTier,
        leaks: GameState.stats.leaksThisGame,
        bossKills: GameState.stats.bossKills,
        victory: true,
        goldEarned: totalGoldEarned,
        mode: WaveSystem.endlessMode ? 'endless' : 'campaign',
        endlessDepth: WaveSystem.endlessMode ? Math.max(0, GameState.wave - GameState.maxWave) : 0,
        challengeCount: GameState.activeChallenges.length,
    });

    SaveSystem.savePersistent();
    SaveSystem.clearSavedGame();

    if (typeof DebugLog !== 'undefined') {
        DebugLog.log('system', `Victory! Score ${GameState.score}, RP +${rp} [${bonusParts.join(', ')}]`);
    }
}

// ===== WAVE HELPERS =====
// Wave management is handled by WaveSystem.startWave() and WaveSystem.waveComplete()
// showWaveBanner() is defined in wave.js

// ===== GAME SPEED CONTROL =====
function cycleGameSpeed() {
    const speeds = CONFIG.GAME_SPEEDS;
    const currentIdx = speeds.indexOf(GameState.gameSpeed);
    GameState.gameSpeed = speeds[(currentIdx + 1) % speeds.length];

    const speedBtn = document.getElementById('btn-speed');
    if (speedBtn) speedBtn.textContent = GameState.gameSpeed + 'x';

    if (typeof DebugLog !== 'undefined') {
        DebugLog.log('system', `Speed: ${GameState.gameSpeed}x`);
    }
}

// ===== PERFORMANCE MONITORING =====
function getPerformanceStats() {
    return {
        fps: currentFPS,
        updateMs: updateTimeAvg.toFixed(2),
        renderMs: renderTimeAvg.toFixed(2),
        totalMs: (updateTimeAvg + renderTimeAvg).toFixed(2),
        entities: {
            enemies: GameState.enemies.length,
            towers: GameState.towers.length,
            projectiles: GameState.projectiles.length,
            particles: Effects.particles ? Effects.particles.length : 0,
        },
        longFrames: longFrameCount,
        gcDetected: gcPauseDetected,
    };
}

// ===== BOOT =====
window.addEventListener('DOMContentLoaded', initGame);
