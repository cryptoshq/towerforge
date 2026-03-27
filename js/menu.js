// ===== MENU SYSTEM — ALL SCREENS =====
const MenuSystem = {
    menuCanvas: null,
    menuCtx: null,
    menuParticles: [],
    menuAnimId: null,
    _hotkeyCaptureAction: null,
    _doctrineSelectionContext: null,
    _menuReactiveLevel: 0,
    _menuReactiveLow: 0,
    _menuReactiveMid: 0,
    _menuReactiveHigh: 0,
    _menuBeatPulse: 0,
    _menuMotionPhase: 0,
    _menuPrevReactive: 0,
    _menuLastFrameMs: 0,
    _menuPointerX: 0,
    _menuPointerY: 0,
    _menuPointerTargetX: 0,
    _menuPointerTargetY: 0,
    _towerCodexSelectedType: null,
    _towerCodexSelectedTab: 'overview',
    _towerCodexFilter: 'all',
    _towerCodexKeyBound: false,
    _hoverSfxBound: false,
    _hoverSfxPerTarget: null,
    _hoverSfxLastGlobal: 0,
    _multiplayerStackLoading: false,

    init() {
        // Create animated menu background canvas
        this._initMenuBackground();
        this._initHoverButtonSfx();

        // Main menu buttons
        document.getElementById('btn-play').addEventListener('click', () => {
            this.showScreen('difficulty');
            Audio.play('click');
        });

        const weeklyBtn = document.getElementById('btn-weekly');
        if (weeklyBtn) {
            weeklyBtn.addEventListener('click', () => {
                this.startWeeklyChallenge();
                Audio.play('click');
            });
        }

        document.getElementById('btn-continue').addEventListener('click', () => {
            if (SaveSystem.hasSavedGame()) {
                this.showScreen('game');
                startGameFromSave();
            }
            Audio.play('click');
        });

        document.getElementById('btn-research').addEventListener('click', () => {
            this.showScreen('research');
            ResearchSystem.init();
            Audio.play('click');
        });

        document.getElementById('btn-achievements').addEventListener('click', () => {
            this.showScreen('achievements');
            AchievementSystem.renderScreen();
            Audio.play('click');
        });

        const towersBtn = document.getElementById('btn-towers');
        if (towersBtn) {
            towersBtn.addEventListener('click', () => {
                this.showScreen('towers');
                this.renderTowerCodex();
                Audio.play('click');
            });
        }

        document.getElementById('btn-howtoplay').addEventListener('click', () => {
            this.showScreen('howtoplay');
            this.renderHowToPlay();
            Audio.play('click');
        });

        document.getElementById('btn-settings').addEventListener('click', () => {
            this.showScreen('settings');
            this.loadSettings();
            Audio.play('click');
        });

        // Multiplayer button
        const mpBtn = document.getElementById('btn-multiplayer');
        if (mpBtn) {
            mpBtn.addEventListener('click', async () => {
                Audio.play('click');
                await this.openMultiplayerScreen();
            });
        }

        // Back buttons
        document.getElementById('btn-back-difficulty').addEventListener('click', () => {
            this.showScreen('menu');
            Audio.play('click');
        });
        document.getElementById('btn-back-maps').addEventListener('click', () => {
            this.showScreen('difficulty');
            Audio.play('click');
        });
        document.getElementById('btn-back-doctrines').addEventListener('click', () => {
            this.showScreen('mapselect');
            Audio.play('click');
        });
        document.getElementById('btn-back-research').addEventListener('click', () => {
            this.showScreen('menu');
            Audio.play('click');
        });
        document.getElementById('btn-back-achievements').addEventListener('click', () => {
            this.showScreen('menu');
            Audio.play('click');
        });
        const backTowersBtn = document.getElementById('btn-back-towers');
        if (backTowersBtn) {
            backTowersBtn.addEventListener('click', () => {
                this.showScreen('menu');
                Audio.play('click');
            });
        }
        document.getElementById('btn-back-howtoplay').addEventListener('click', () => {
            this.showScreen('menu');
            Audio.play('click');
        });
        document.getElementById('btn-back-settings').addEventListener('click', () => {
            SaveSystem.savePersistent();
            this.showScreen('menu');
            Audio.play('click');
        });

        // Multiplayer back button
        const mpBackBtn = document.getElementById('btn-back-multiplayer');
        if (mpBackBtn) {
            mpBackBtn.addEventListener('click', () => {
                // Clean up any pending connection
                if (typeof Multiplayer !== 'undefined' && !Multiplayer.active) {
                    Multiplayer.destroy();
                }
                this.showScreen('menu');
                Audio.play('click');
            });
        }

        // Game HUD buttons
        document.getElementById('btn-speed').addEventListener('click', () => {
            cycleSpeed();
            Audio.play('click');
        });

        document.getElementById('btn-pause').addEventListener('click', () => {
            togglePause();
            Audio.play('click');
        });

        document.getElementById('btn-menu-ingame').addEventListener('click', () => {
            togglePause();
            Audio.play('click');
        });

        // In-game settings gear button
        document.getElementById('btn-settings-ingame').addEventListener('click', () => {
            this.openSettingsPanel();
            Audio.play('click');
        });

        // HUD visual toggles
        this._initHudToggles();

        // Settings panel close
        document.getElementById('btn-close-settings').addEventListener('click', () => {
            this.closeSettingsPanel();
            Audio.play('click');
        });

        // Settings panel controls
        this._initSettingsPanel();

        const startWaveBtn = document.getElementById('btn-start-wave');
        if (startWaveBtn) {
            const triggerStartWave = (event) => {
                if (event && event.type === 'pointerup' && event.button !== 0) return;
                WaveSystem.startWave();
            };
            startWaveBtn.addEventListener('click', triggerStartWave);
            startWaveBtn.addEventListener('pointerup', triggerStartWave);
        }

        document.getElementById('btn-skip-wave').addEventListener('click', () => {
            WaveSystem.skipWave();
            Audio.play('click');
        });

        // Pause menu
        document.getElementById('btn-resume').addEventListener('click', () => {
            togglePause();
            Audio.play('click');
        });

        document.getElementById('btn-restart').addEventListener('click', () => {
            document.getElementById('pause-menu').style.display = 'none';
            startGame(GameState.mapIndex);
            Audio.play('click');
        });

        document.getElementById('btn-quit').addEventListener('click', () => {
            document.getElementById('pause-menu').style.display = 'none';
            this.showScreen('menu');
            Audio.play('click');
        });

        // Game over
        document.getElementById('btn-retry').addEventListener('click', () => {
            document.getElementById('gameover-screen').style.display = 'none';
            startGame(GameState.mapIndex);
            Audio.play('click');
        });

        document.getElementById('btn-gameover-menu').addEventListener('click', () => {
            document.getElementById('gameover-screen').style.display = 'none';
            this.showScreen('menu');
            Audio.play('click');
        });

        // Victory
        document.getElementById('btn-next-map').addEventListener('click', () => {
            document.getElementById('victory-screen').style.display = 'none';
            const next = GameState.mapIndex + 1;
            const gEnd = Math.floor(GameState.mapIndex / 5) * 5 + 5;
            if (next < gEnd && next < MAPS.length && GameState.unlockedMaps[next]) {
                startGame(next);
            } else {
                this.showScreen('menu');
            }
            Audio.play('click');
        });

        document.getElementById('btn-play-again').addEventListener('click', () => {
            document.getElementById('victory-screen').style.display = 'none';
            startGame(GameState.mapIndex);
            Audio.play('click');
        });

        document.getElementById('btn-victory-menu').addEventListener('click', () => {
            document.getElementById('victory-screen').style.display = 'none';
            this.showScreen('menu');
            Audio.play('click');
        });

        // Multiplayer result buttons
        const mpRematchBtn = document.getElementById('mp-btn-rematch');
        if (mpRematchBtn) {
            mpRematchBtn.addEventListener('click', () => {
                Audio.play('click');
                if (typeof MultiplayerUI !== 'undefined') MultiplayerUI.hideMatchResult();
                // Restart the multiplayer game with same config
                if (typeof Multiplayer !== 'undefined' && Multiplayer.connected) {
                    Multiplayer.startMultiplayerGame();
                } else {
                    returnToMenu();
                }
            });
        }
        const mpQuitBtn = document.getElementById('mp-btn-quit-mp');
        if (mpQuitBtn) {
            mpQuitBtn.addEventListener('click', () => {
                Audio.play('click');
                returnToMenu();
            });
        }

        // Multiplayer ready button
        const mpReadyBtn = document.getElementById('mp-ready-btn');
        if (mpReadyBtn) {
            mpReadyBtn.addEventListener('click', () => {
                if (typeof Multiplayer !== 'undefined' && Multiplayer.active && !Multiplayer.localReady) {
                    Multiplayer.setReady();
                    Audio.play('click');
                }
            });
        }

        // Endless mode buttons
        document.getElementById('btn-endless-yes').addEventListener('click', () => {
            document.getElementById('endless-modal').style.display = 'none';
            WaveSystem.endlessMode = true;
            GameState.gamePhase = 'idle';
            showWaveBanner('ENDLESS MODE ACTIVATED!');
            Effects.addFloatingText(logicalWidth / 2, logicalHeight / 2, 'Waves will keep scaling...', '#ff80ff', 14);
            document.getElementById('btn-start-wave').classList.remove('hidden');
            Audio.play('powerup');
        });

        document.getElementById('btn-endless-no').addEventListener('click', () => {
            document.getElementById('endless-modal').style.display = 'none';
            victory();
            Audio.play('click');
        });

        const doctrineStartBtn = document.getElementById('btn-doctrine-start');
        if (doctrineStartBtn) {
            doctrineStartBtn.addEventListener('click', () => {
                this.startRunWithDoctrine();
                Audio.play('click');
            });
        }

        // Slider track fill helper
        function updateSliderFill(el) {
            const min = parseFloat(el.min) || 0;
            const max = parseFloat(el.max) || 100;
            const pct = ((el.value - min) / (max - min)) * 100;
            el.style.setProperty('--fill', pct + '%');
        }

        // Settings controls
        document.getElementById('music-volume').addEventListener('input', (e) => {
            const v = e.target.value / 100;
            GameState.settings.musicVolume = v;
            Audio.setMusicVolume(v);
            document.getElementById('music-vol-val').textContent = e.target.value + '%';
            updateSliderFill(e.target);
        });

        document.getElementById('sfx-volume').addEventListener('input', (e) => {
            const v = e.target.value / 100;
            GameState.settings.sfxVolume = v;
            Audio.setSfxVolume(v);
            document.getElementById('sfx-vol-val').textContent = e.target.value + '%';
            updateSliderFill(e.target);
        });

        document.getElementById('shake-intensity').addEventListener('input', (e) => {
            GameState.settings.shakeIntensity = e.target.value / 100;
            document.getElementById('shake-val').textContent = e.target.value + '%';
            updateSliderFill(e.target);
        });

        document.getElementById('show-ranges').addEventListener('change', (e) => {
            GameState.settings.showRanges = e.target.checked;
        });

        document.getElementById('auto-start').addEventListener('change', (e) => {
            GameState.settings.autoStart = e.target.checked;
        });

        const resetHotkeysBtn = document.getElementById('btn-reset-hotkeys');
        if (resetHotkeysBtn) {
            resetHotkeysBtn.addEventListener('click', () => {
                if (typeof Input === 'undefined' || typeof Input.resetHotkeys !== 'function') return;
                this._cancelHotkeyCapture();
                Input.resetHotkeys();
                this._renderHotkeySettings();
                this._refreshHotkeyDependentUI();
                SaveSystem.savePersistent();
                Audio.play('click');
            });
        }

        const resetAllDataBtn = document.getElementById('btn-reset-all-data');
        if (resetAllDataBtn) {
            resetAllDataBtn.addEventListener('click', () => {
                if (typeof Audio !== 'undefined' && typeof Audio.play === 'function') {
                    Audio.play('click');
                }

                const confirmed = typeof window !== 'undefined' && typeof window.confirm === 'function'
                    ? window.confirm('This will permanently delete all local progress, unlocks, settings, and saves. Continue?')
                    : true;
                if (!confirmed) return;

                if (typeof SaveSystem !== 'undefined' && typeof SaveSystem.clearAllData === 'function') {
                    SaveSystem.clearAllData();
                }

                if (typeof window !== 'undefined' && typeof window.location !== 'undefined') {
                    window.location.reload();
                }
            });
        }

        document.addEventListener('keydown', (e) => {
            this._handleHotkeyCaptureKeydown(e);
        }, true);
        document.addEventListener('mousedown', (e) => {
            this._handleHotkeyCaptureMousedown(e);
        }, true);

        // Show continue button if save exists
        this._updateContinueButton();

        // Close info panel
        const closeBtn = document.getElementById('btn-close-info');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                UIRenderer.hideTowerInfo();
            });
        }
    },

    async openMultiplayerScreen() {
        if (this._multiplayerStackLoading) {
            return;
        }

        if (typeof Multiplayer !== 'undefined' && typeof MultiplayerUI !== 'undefined') {
            this.showScreen('multiplayer');
            return;
        }

        const loader = typeof TowerForgeLazyLoader !== 'undefined'
            ? TowerForgeLazyLoader
            : null;

        this._multiplayerStackLoading = true;
        this._setMultiplayerButtonLoading(true);
        this.showScreen('multiplayer');
        this._renderMultiplayerLobbyPlaceholder('Loading multiplayer runtime...');

        try {
            if (!loader || typeof loader.ensureMultiplayerStack !== 'function') {
                throw new Error('TowerForgeLazyLoader is unavailable');
            }

            await loader.ensureMultiplayerStack();

            if (GameState.screen === 'multiplayer' && typeof MultiplayerUI !== 'undefined') {
                MultiplayerUI.renderLobby();
            }
        } catch (error) {
            console.error('[TowerForge] Failed to load multiplayer runtime:', error);
            if (GameState.screen === 'multiplayer') {
                this._renderMultiplayerLobbyPlaceholder(
                    'Failed to load multiplayer runtime. Return to menu and retry.',
                    true
                );
            }
        } finally {
            this._multiplayerStackLoading = false;
            this._setMultiplayerButtonLoading(false);
        }
    },

    _setMultiplayerButtonLoading(isLoading) {
        const button = document.getElementById('btn-multiplayer');
        if (!button) return;

        if (isLoading) {
            if (!button.dataset.labelHtml) {
                button.dataset.labelHtml = button.innerHTML;
            }
            button.disabled = true;
            button.innerHTML = 'MULTIPLAYER<span class="btn-subtitle">Loading network runtime...</span>';
            return;
        }

        button.disabled = false;
        if (button.dataset.labelHtml) {
            button.innerHTML = button.dataset.labelHtml;
        }
    },

    _renderMultiplayerLobbyPlaceholder(message, isError = false) {
        const container = document.getElementById('mp-lobby-content');
        if (!container) return;

        const card = document.createElement('div');
        card.textContent = message;
        card.style.padding = '24px 20px';
        card.style.borderRadius = '12px';
        card.style.border = isError
            ? '1px solid rgba(255, 90, 90, 0.45)'
            : '1px solid rgba(90, 180, 255, 0.35)';
        card.style.background = isError
            ? 'rgba(80, 18, 18, 0.6)'
            : 'rgba(18, 26, 46, 0.6)';
        card.style.color = isError ? '#ffb4b4' : '#b4deff';
        card.style.fontWeight = '600';
        card.style.textAlign = 'center';
        card.style.letterSpacing = '0.01em';

        container.replaceChildren(card);
    },

    _initMenuBackground() {
        // Create canvas for animated particles
        const existing = document.getElementById('menu-canvas-bg');
        if (existing) existing.remove();

        const existingMotion = document.getElementById('menu-motion-layer');
        if (existingMotion) existingMotion.remove();

        const canvas = document.createElement('canvas');
        canvas.id = 'menu-canvas-bg';
        const menuEl = document.getElementById('main-menu');
        const bgEl = menuEl.querySelector('.menu-bg') || menuEl;
        bgEl.appendChild(canvas);

        const motionLayer = document.createElement('div');
        motionLayer.id = 'menu-motion-layer';
        motionLayer.innerHTML = `
            <span class="menu-aurora menu-aurora-a" aria-hidden="true"></span>
            <span class="menu-aurora menu-aurora-b" aria-hidden="true"></span>
            <span class="menu-aurora menu-aurora-c" aria-hidden="true"></span>
            <span class="menu-grid-sweep" aria-hidden="true"></span>
        `;
        bgEl.appendChild(motionLayer);

        this.menuCanvas = canvas;
        this.menuCtx = canvas.getContext('2d');

        // Resize handler
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        window.addEventListener('pointermove', (event) => {
            const nx = ((event.clientX / Math.max(1, window.innerWidth)) - 0.5) * 2;
            const ny = ((event.clientY / Math.max(1, window.innerHeight)) - 0.5) * 2;
            this._menuPointerTargetX = Math.max(-1, Math.min(1, nx));
            this._menuPointerTargetY = Math.max(-1, Math.min(1, ny));
        }, { passive: true });

        window.addEventListener('pointerleave', () => {
            this._menuPointerTargetX = 0;
            this._menuPointerTargetY = 0;
        });

        // Create particles
        this.menuParticles = [];
        for (let i = 0; i < 60; i++) {
            this.menuParticles.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                vx: (Math.random() - 0.5) * 0.3,
                vy: -Math.random() * 0.4 - 0.1,
                size: Math.random() * 3 + 1,
                alpha: Math.random() * 0.5 + 0.1,
                hue: Math.random() * 60 + 220, // Blue to purple range
                pulse: Math.random() * Math.PI * 2,
                pulseSpeed: Math.random() * 0.5 + 0.5,
            });
        }

        // Add some larger "orb" particles
        for (let i = 0; i < 8; i++) {
            this.menuParticles.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                vx: (Math.random() - 0.5) * 0.15,
                vy: (Math.random() - 0.5) * 0.15,
                size: Math.random() * 40 + 20,
                alpha: Math.random() * 0.04 + 0.02,
                hue: Math.random() * 40 + 230,
                pulse: Math.random() * Math.PI * 2,
                pulseSpeed: Math.random() * 0.3 + 0.2,
                isOrb: true,
            });
        }

        this._animateMenu();
    },

    _updateMenuReactiveState(dt, tSec) {
        const metrics = (typeof Audio !== 'undefined' && typeof Audio.getMenuReactiveData === 'function')
            ? Audio.getMenuReactiveData()
            : null;

        const fallbackLevel = 0.08 + Math.sin(tSec * 0.8) * 0.03;
        const targetLevel = metrics && Number.isFinite(metrics.level) ? metrics.level : fallbackLevel;
        const targetLow = metrics && Number.isFinite(metrics.low) ? metrics.low : targetLevel * 0.8;
        const targetMid = metrics && Number.isFinite(metrics.mid) ? metrics.mid : targetLevel * 0.7;
        const targetHigh = metrics && Number.isFinite(metrics.high) ? metrics.high : targetLevel * 0.55;

        const lerpK = Math.min(1, dt * 7.5);
        this._menuReactiveLevel += (targetLevel - this._menuReactiveLevel) * lerpK;
        this._menuReactiveLow += (targetLow - this._menuReactiveLow) * lerpK;
        this._menuReactiveMid += (targetMid - this._menuReactiveMid) * lerpK;
        this._menuReactiveHigh += (targetHigh - this._menuReactiveHigh) * lerpK;

        const rise = this._menuReactiveLevel - this._menuPrevReactive;
        if (rise > 0.02) {
            this._menuBeatPulse = Math.min(1, this._menuBeatPulse + rise * 10);
        }
        this._menuBeatPulse = Math.max(0, this._menuBeatPulse - dt * 1.7);
        this._menuPrevReactive = this._menuReactiveLevel;

        this._menuMotionPhase += dt * (0.35 + this._menuReactiveMid * 0.9);
        this._menuPointerX += (this._menuPointerTargetX - this._menuPointerX) * Math.min(1, dt * 4.5);
        this._menuPointerY += (this._menuPointerTargetY - this._menuPointerY) * Math.min(1, dt * 4.5);

        const idleX = Math.sin(this._menuMotionPhase * 1.07) * (5 + this._menuReactiveLow * 8);
        const idleY = Math.cos(this._menuMotionPhase * 0.84) * (4 + this._menuReactiveMid * 6);
        const motionX = idleX + this._menuPointerX * 8;
        const motionY = idleY + this._menuPointerY * 5;

        const style = document.getElementById('main-menu')?.style;
        if (style) {
            const overlayOpacity = 0.74 + this._menuReactiveMid * 0.35;
            const vignetteOpacity = 0.92 + this._menuBeatPulse * 0.25;
            const canvasOpacity = 0.68 + this._menuReactiveLevel * 0.24;
            const auroraOpacity = 0.11 + this._menuReactiveLevel * 0.18 + this._menuBeatPulse * 0.18;
            const gridOpacity = 0.22 + this._menuReactiveHigh * 0.22 + this._menuBeatPulse * 0.16;
            const panelGlowOpacity = 0.28 + this._menuReactiveLevel * 0.4 + this._menuBeatPulse * 0.22;
            const saturation = 0.96 + this._menuReactiveLevel * 0.36;

            style.setProperty('--menu-reactive', this._menuReactiveLevel.toFixed(4));
            style.setProperty('--menu-bass', this._menuReactiveLow.toFixed(4));
            style.setProperty('--menu-mid', this._menuReactiveMid.toFixed(4));
            style.setProperty('--menu-treble', this._menuReactiveHigh.toFixed(4));
            style.setProperty('--menu-beat', this._menuBeatPulse.toFixed(4));
            style.setProperty('--menu-motion-x', `${motionX.toFixed(2)}px`);
            style.setProperty('--menu-motion-y', `${motionY.toFixed(2)}px`);
            style.setProperty('--menu-motion-x-soft', `${(motionX * 0.2).toFixed(2)}px`);
            style.setProperty('--menu-motion-y-soft', `${(motionY * 0.12).toFixed(2)}px`);
            style.setProperty('--menu-motion-x-panel', `${(motionX * 0.16).toFixed(2)}px`);
            style.setProperty('--menu-motion-y-panel', `${(motionY * 0.12).toFixed(2)}px`);
            style.setProperty('--menu-overlay-opacity', overlayOpacity.toFixed(3));
            style.setProperty('--menu-vignette-opacity', vignetteOpacity.toFixed(3));
            style.setProperty('--menu-canvas-opacity', canvasOpacity.toFixed(3));
            style.setProperty('--menu-aurora-opacity', auroraOpacity.toFixed(3));
            style.setProperty('--menu-grid-opacity', gridOpacity.toFixed(3));
            style.setProperty('--menu-panel-glow-opacity', panelGlowOpacity.toFixed(3));
            style.setProperty('--menu-sat', saturation.toFixed(3));
        }
    },

    _animateMenu() {
        if (GameState.screen !== 'menu') {
            this.menuAnimId = requestAnimationFrame(() => this._animateMenu());
            return;
        }

        const ctx = this.menuCtx;
        const w = this.menuCanvas.width;
        const h = this.menuCanvas.height;
        const nowMs = (typeof performance !== 'undefined' && performance.now)
            ? performance.now()
            : Date.now();
        const dt = this._menuLastFrameMs > 0
            ? Math.max(0.001, Math.min(0.05, (nowMs - this._menuLastFrameMs) / 1000))
            : (1 / 60);
        this._menuLastFrameMs = nowMs;

        this._updateMenuReactiveState(dt, nowMs * 0.001);

        ctx.clearRect(0, 0, w, h);

        const centerX = w * 0.5 + this._menuPointerX * 24;
        const centerY = h * 0.42 + this._menuPointerY * 18;
        const glowRadius = Math.max(w, h) * (0.46 + this._menuReactiveLow * 0.12 + this._menuBeatPulse * 0.06);
        const bgGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowRadius);
        bgGlow.addColorStop(0, `rgba(108,132,255,${0.08 + this._menuReactiveLevel * 0.18 + this._menuBeatPulse * 0.14})`);
        bgGlow.addColorStop(1, 'rgba(10,14,44,0)');
        ctx.fillStyle = bgGlow;
        ctx.fillRect(0, 0, w, h);

        // Draw connection lines between nearby particles (not orbs)
        const smallParticles = this.menuParticles.filter(p => !p.isOrb);
        const linkDist = 150 + this._menuReactiveLow * 42;
        const linkAlphaBase = 0.045 + this._menuReactiveHigh * 0.06 + this._menuBeatPulse * 0.04;
        for (let i = 0; i < smallParticles.length; i++) {
            for (let j = i + 1; j < smallParticles.length; j++) {
                const a = smallParticles[i];
                const b = smallParticles[j];
                const dx = a.x - b.x;
                const dy = a.y - b.y;
                const d = Math.sqrt(dx * dx + dy * dy);
                if (d < linkDist) {
                    const alpha = (1 - d / linkDist) * linkAlphaBase;
                    ctx.strokeStyle = `rgba(126,142,255,${alpha})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.stroke();
                }
            }
        }

        // Draw and update particles
        for (const p of this.menuParticles) {
            const speedMult = 1 + this._menuReactiveLevel * 0.75;
            const driftX = Math.sin(p.pulse * 0.75 + this._menuMotionPhase) * 0.06 * (this._menuReactiveMid + 0.08);
            const driftY = Math.cos(p.pulse * 0.62 + this._menuMotionPhase * 0.8) * 0.06 * (this._menuReactiveHigh + 0.06);
            p.x += p.vx * speedMult + driftX;
            p.y += p.vy * speedMult + driftY;
            p.pulse += p.pulseSpeed * (0.015 + this._menuReactiveHigh * 0.014);

            // Wrap around
            if (p.x < -50) p.x = w + 50;
            if (p.x > w + 50) p.x = -50;
            if (p.y < -50) p.y = h + 50;
            if (p.y > h + 50) p.y = -50;

            const pulseAlpha = p.alpha * (0.66 + Math.sin(p.pulse) * 0.34) * (0.84 + this._menuReactiveLevel * 0.55);

            if (p.isOrb) {
                // Large soft orbs
                const orbRadius = p.size * (1 + this._menuReactiveLow * 0.11 + Math.sin(p.pulse * 0.85) * 0.04);
                const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, orbRadius);
                gradient.addColorStop(0, `hsla(${p.hue},60%,60%,${pulseAlpha})`);
                gradient.addColorStop(1, `hsla(${p.hue},60%,60%,0)`);
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(p.x, p.y, orbRadius, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Small bright dots
                ctx.fillStyle = `hsla(${p.hue},70%,75%,${pulseAlpha})`;
                ctx.shadowColor = `hsla(${p.hue},70%,75%,${pulseAlpha * 0.5})`;
                ctx.shadowBlur = 4 + this._menuReactiveHigh * 6;
                ctx.beginPath();
                const dotSize = p.size * (1 + this._menuReactiveHigh * 0.18);
                ctx.arc(p.x, p.y, dotSize, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }

        this.menuAnimId = requestAnimationFrame(() => this._animateMenu());
    },

    _updateContinueButton() {
        const btn = document.getElementById('btn-continue');
        if (SaveSystem.hasSavedGame()) {
            btn.style.display = 'block';

            // Try to load save info to show details
            try {
                const info = SaveSystem.getSavedGameInfo ? SaveSystem.getSavedGameInfo() : null;
                if (!info) {
                    btn.textContent = 'CONTINUE';
                    return;
                }

                const modeText = info.weeklyMode
                    ? `WEEKLY${info.weeklyWeekId ? ` ${info.weeklyWeekId}` : ''}`
                    : (info.endlessMode ? 'ENDLESS' : 'CAMPAIGN');
                const doctrineText = info.doctrineName ? ` | ${info.doctrineName}` : '';
                const challengeText = info.activeChallenges.length > 0
                    ? ` +${info.activeChallenges.length} MOD`
                    : '';
                const when = this._formatRelativeTime(info.savedAt);
                const elapsed = this._formatClock(info.elapsedTimeSec);

                btn.innerHTML = `CONTINUE<span class="btn-subtitle">${info.mapName} — Wave ${info.wave} | ${info.difficultyName} | ${modeText}${doctrineText}${challengeText}${elapsed ? ` | ${elapsed}` : ''}${when ? ` | ${when}` : ''}</span>`;
            } catch (e) {
                btn.textContent = 'CONTINUE';
            }
        } else {
            btn.style.display = 'none';
        }
    },

    _formatClock(totalSeconds) {
        const sec = Number.isFinite(totalSeconds) ? Math.max(0, Math.floor(totalSeconds)) : 0;
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;
        if (h > 0) return `${h}h ${m}m`;
        if (m > 0) return `${m}m ${s}s`;
        return `${s}s`;
    },

    _formatRelativeTime(timestamp) {
        if (!Number.isFinite(timestamp) || timestamp <= 0) return '';
        const deltaSec = Math.floor((Date.now() - timestamp) / 1000);
        if (deltaSec < 0) return '';
        if (deltaSec < 60) return 'just now';
        const min = Math.floor(deltaSec / 60);
        if (min < 60) return `${min}m ago`;
        const hr = Math.floor(min / 60);
        if (hr < 24) return `${hr}h ago`;
        const day = Math.floor(hr / 24);
        return `${day}d ago`;
    },

    _getWeeklyChallengeSpec() {
        const weekInfo = getIsoWeekInfo(new Date());
        const seed = hashStringToSeed(`towerforge:${weekInfo.id}`);
        const rng = createSeededRng(seed);

        const difficultyKeys = Object.keys(CONFIG.DIFFICULTY_PRESETS);
        const difficulty = difficultyKeys[Math.floor(rng() * difficultyKeys.length)] || 'normal';

        const diffGroupMap = { easy: 0, normal: 1, hard: 2, nightmare: 3 };
        const group = diffGroupMap[difficulty] || 0;
        const mapOffset = Math.floor(rng() * 5);
        const mapIndex = Math.min(MAPS.length - 1, group * 5 + mapOffset);

        const pool = [...CONFIG.CHALLENGE_MODIFIERS];
        const modCount = 2 + (rng() > 0.7 ? 1 : 0);
        const modifiers = [];
        while (modifiers.length < modCount && pool.length > 0) {
            const idx = Math.floor(rng() * pool.length);
            modifiers.push(pool.splice(idx, 1)[0].id);
        }

        return {
            weekId: weekInfo.id,
            seed,
            mapIndex,
            difficulty,
            modifiers,
        };
    },

    _getCurrentWeeklyRecord() {
        const spec = this._getWeeklyChallengeSpec();
        const records = GameState.metaProgress && typeof GameState.metaProgress.weeklyRecords === 'object'
            ? GameState.metaProgress.weeklyRecords
            : {};
        const record = records[spec.weekId] || null;
        return { spec, record };
    },

    _updateWeeklyChallengeButton() {
        const btn = document.getElementById('btn-weekly');
        if (!btn) return;

        const { spec, record } = this._getCurrentWeeklyRecord();
        const mapName = MAPS[spec.mapIndex] ? MAPS[spec.mapIndex].name : `Map ${spec.mapIndex + 1}`;
        const diffPreset = CONFIG.DIFFICULTY_PRESETS[spec.difficulty] || CONFIG.DIFFICULTY_PRESETS.normal;
        const bestScore = record && Number.isFinite(record.bestScore) ? record.bestScore : 0;
        const attempts = record && Number.isFinite(record.attempts) ? record.attempts : 0;

        btn.innerHTML = `WEEKLY CHALLENGE<span class="btn-subtitle">${spec.weekId} | ${mapName} | ${diffPreset.name} | ${spec.modifiers.length} MOD | Best ${bestScore} | Attempts ${attempts}</span>`;
    },

    startWeeklyChallenge() {
        const spec = this._getWeeklyChallengeSpec();

        GameState.settings.difficulty = spec.difficulty;
        GameState.activeDoctrineId = null;
        GameState.pendingMapIndex = null;
        GameState.pendingDoctrineId = null;
        GameState.weeklyChallengeRun = {
            active: true,
            weekId: spec.weekId,
            seed: spec.seed,
            mapIndex: spec.mapIndex,
            difficulty: spec.difficulty,
            modifiers: [...spec.modifiers],
            startedAt: Date.now(),
        };

        SaveSystem.savePersistent();
        startGame(spec.mapIndex);
    },

    _getDoctrineById(doctrineId) {
        if (!doctrineId || !Array.isArray(CONFIG.DOCTRINES)) return null;
        return CONFIG.DOCTRINES.find(d => d.id === doctrineId) || null;
    },

    openDoctrineSelect(mapIndex) {
        if (!Number.isFinite(mapIndex) || mapIndex < 0 || mapIndex >= MAPS.length) return;

        GameState.pendingMapIndex = mapIndex;
        GameState.weeklyChallengeRun = null;

        const doctrineList = Array.isArray(CONFIG.DOCTRINES) ? CONFIG.DOCTRINES : [];
        if (doctrineList.length === 0) {
            GameState.activeDoctrineId = null;
            startGame(mapIndex);
            return;
        }

        const currentId = GameState.pendingDoctrineId || GameState.activeDoctrineId;
        const hasCurrent = doctrineList.some(d => d.id === currentId);
        GameState.pendingDoctrineId = hasCurrent ? currentId : doctrineList[0].id;

        this.showScreen('doctrine');
    },

    renderDoctrineSelect() {
        const cardsEl = document.getElementById('doctrine-cards');
        if (!cardsEl) return;

        cardsEl.innerHTML = '';
        const doctrineList = Array.isArray(CONFIG.DOCTRINES) ? CONFIG.DOCTRINES : [];

        let selectedId = GameState.pendingDoctrineId || 'none';

        // --- "No Doctrine" skip card ---
        const skipCard = document.createElement('div');
        skipCard.className = 'dv2-card dv2-skip';
        if (selectedId === 'none') skipCard.classList.add('is-selected');
        skipCard.dataset.doctrineId = 'none';
        skipCard.innerHTML = `
            <div class="dv2-icon">&#9654;</div>
            <div class="dv2-name">No Doctrine</div>
            <div class="dv2-summary">Standard start. No bonuses, no drawbacks.</div>
        `;
        skipCard.addEventListener('click', () => {
            this._selectDoctrineInView('none');
            Audio.play('click');
        });
        cardsEl.appendChild(skipCard);

        // --- Doctrine cards ---
        for (const doctrine of doctrineList) {
            const card = document.createElement('div');
            card.className = 'dv2-card';
            if (doctrine.id === selectedId) card.classList.add('is-selected');
            card.dataset.doctrineId = doctrine.id;
            const accent = doctrine.style?.accent || '#aab4ff';
            card.style.setProperty('--doctrine-accent', accent);
            card.style.borderColor = doctrine.id === selectedId ? accent : '';

            card.innerHTML = `
                <div class="dv2-icon">${doctrine.icon || ''}</div>
                <div class="dv2-name">${doctrine.name}</div>
                <div class="dv2-summary">${doctrine.summary || ''}</div>
                <div class="dv2-bonus">${doctrine.bonusText || ''}</div>
                <div class="dv2-drawback">${doctrine.drawbackText || ''}</div>
            `;

            card.addEventListener('click', () => {
                this._selectDoctrineInView(doctrine.id);
                Audio.play('click');
            });

            cardsEl.appendChild(card);
        }

        this._selectDoctrineInView(selectedId, { fromRender: true });
    },

    _selectDoctrineInView(doctrineId, options = {}) {
        // 'none' means no doctrine — allow it
        if (doctrineId !== 'none') {
            const doctrine = this._getDoctrineById(doctrineId);
            if (!doctrine) return;
        }

        GameState.pendingDoctrineId = doctrineId === 'none' ? null : doctrineId;

        // Update card selected state
        const cardsEl = document.getElementById('doctrine-cards');
        if (cardsEl) {
            cardsEl.querySelectorAll('.dv2-card').forEach(card => {
                const isSelected = card.dataset.doctrineId === doctrineId;
                card.classList.toggle('is-selected', isSelected);
                const doctrine = this._getDoctrineById(card.dataset.doctrineId);
                card.style.borderColor = isSelected && doctrine?.style?.accent ? doctrine.style.accent : '';
            });
        }

        // Update start button
        const startBtn = document.getElementById('btn-doctrine-start');
        if (startBtn) {
            if (doctrineId === 'none') {
                startBtn.textContent = 'START RUN';
            } else {
                const doctrine = this._getDoctrineById(doctrineId);
                const name = doctrine?.name?.replace(/\s+Doctrine$/i, '').toUpperCase() || '';
                startBtn.textContent = name ? `START RUN (${name})` : 'START RUN';
            }
        }
    },

    startRunWithDoctrine() {
        const mapIndex = Number.isFinite(GameState.pendingMapIndex) ? GameState.pendingMapIndex : null;
        if (mapIndex === null || mapIndex < 0 || mapIndex >= MAPS.length) {
            this.showScreen('mapselect');
            return;
        }

        const doctrine = this._getDoctrineById(GameState.pendingDoctrineId);
        GameState.activeDoctrineId = doctrine ? doctrine.id : null;
        if (doctrine) {
            GameState.pendingDoctrineId = doctrine.id;
        }

        startGame(mapIndex);
    },

    _updateMetaProgressPanel() {
        const panel = document.getElementById('menu-meta-progress');
        if (!panel) return;

        const mp = GameState.metaProgress || {};
        const bestDepthByMap = Array.isArray(mp.endlessBestDepthByMap) ? mp.endlessBestDepthByMap : [];
        const bestDepthOverall = bestDepthByMap.reduce((m, v) => Math.max(m, Number.isFinite(v) ? v : 0), 0);
        const endlessMilestones = Number.isFinite(mp.totalEndlessMilestones) ? mp.totalEndlessMilestones : 0;
        const challengeStreak = Number.isFinite(mp.challengeWinStreak) ? mp.challengeWinStreak : 0;
        const bestChallengeStreak = Number.isFinite(mp.bestChallengeWinStreak) ? mp.bestChallengeWinStreak : 0;
        const weekly = this._getCurrentWeeklyRecord();
        const weeklyBest = weekly.record && Number.isFinite(weekly.record.bestScore)
            ? weekly.record.bestScore
            : 0;
        const compact = typeof window !== 'undefined' && window.innerWidth <= 720;

        const rows = [
            { label: 'Best Endless Depth', value: `+${bestDepthOverall}` },
            { label: 'Milestones Claimed', value: `${endlessMilestones}` },
            { label: `Weekly Best (${weekly.spec.weekId})`, value: `${weeklyBest}` },
            { label: 'Challenge Streak', value: `${challengeStreak}` },
            { label: 'Best Challenge Streak', value: `${bestChallengeStreak}` },
        ];
        const rowsToRender = compact ? [rows[0], rows[2], rows[4]] : rows;

        panel.innerHTML = `
            <div class="mmp-title">COMMAND RECORD</div>
            ${rowsToRender.map((row) => `<div class="mmp-row"><span>${row.label}</span><span class="mmp-value">${row.value}</span></div>`).join('')}
        `;
    },

    showScreen(screen) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));

        if (screen !== 'settings') {
            this._cancelHotkeyCapture();
        }

        GameState.screen = screen;

        switch (screen) {
            case 'menu':
                document.getElementById('main-menu').classList.add('active');
                GameState.pendingMapIndex = null;
                this._updateContinueButton();
                this._updateWeeklyChallengeButton();
                this._updateMetaProgressPanel();
                // Start/resume music
                Audio.startMusic();
                break;
            case 'difficulty':
                document.getElementById('difficulty-select').classList.add('active');
                this.renderDifficultySelect();
                break;
            case 'mapselect':
                document.getElementById('map-select').classList.add('active');
                this.renderMapSelect();
                break;
            case 'doctrine':
                document.getElementById('doctrine-select').classList.add('active');
                this.renderDoctrineSelect();
                break;
            case 'research':
                document.getElementById('research-screen').classList.add('active');
                break;
            case 'achievements':
                document.getElementById('achievements-screen').classList.add('active');
                break;
            case 'towers':
                document.getElementById('towers-screen').classList.add('active');
                this.renderTowerCodex();
                break;
            case 'howtoplay':
                document.getElementById('howtoplay-screen').classList.add('active');
                break;
            case 'settings':
                document.getElementById('settings-screen').classList.add('active');
                break;
            case 'multiplayer':
                document.getElementById('multiplayer-screen').classList.add('active');
                if (typeof MultiplayerUI !== 'undefined') {
                    MultiplayerUI.renderLobby();
                } else if (this._multiplayerStackLoading) {
                    this._renderMultiplayerLobbyPlaceholder('Loading multiplayer runtime...');
                } else {
                    this._renderMultiplayerLobbyPlaceholder('Multiplayer runtime is not loaded. Return to menu and try again.', true);
                }
                break;
            case 'game':
                document.getElementById('game-screen').classList.add('active');
                break;
        }
    },

    // ===== DIFFICULTY SELECT SCREEN =====
    renderDifficultySelect() {
        const container = document.getElementById('difficulty-cards');
        container.innerHTML = '';

        if (typeof ProgressionSystem !== 'undefined' && typeof ProgressionSystem.refreshUnlockedMaps === 'function') {
            ProgressionSystem.refreshUnlockedMaps();
        }

        const difficultyScreen = document.getElementById('difficulty-select');
        if (difficultyScreen && !difficultyScreen.dataset.pointerReactiveBound) {
            difficultyScreen.dataset.pointerReactiveBound = '1';
            difficultyScreen.addEventListener('pointermove', (event) => {
                const rect = difficultyScreen.getBoundingClientRect();
                if (rect.width <= 0 || rect.height <= 0) return;
                const x = ((event.clientX - rect.left) / rect.width) * 100;
                const y = ((event.clientY - rect.top) / rect.height) * 100;
                difficultyScreen.style.setProperty('--diff-pointer-x', `${Math.max(0, Math.min(100, x)).toFixed(2)}%`);
                difficultyScreen.style.setProperty('--diff-pointer-y', `${Math.max(0, Math.min(100, y)).toFixed(2)}%`);
            }, { passive: true });
            difficultyScreen.addEventListener('pointerleave', () => {
                difficultyScreen.style.setProperty('--diff-pointer-x', '50%');
                difficultyScreen.style.setProperty('--diff-pointer-y', '38%');
            });
        }

        const diffData = {
            easy: {
                icon: '\u{1F6E1}', // shield
                title: 'TRAINING GROUNDS',
                story: '"Once a peaceful meadow, now the first line of defense. The creatures here are young and weak \u2014 perfect for learning the art of tower placement. But do not be deceived: even the weakest enemy can slip through."',
                rank: 'TIER I',
                pressure: 'LOW PRESSURE',
                boss: 'Grub King',
                bossAbilities: ['Brood Call', 'Skitter Rush', 'Quake Slow'],
                enemyPool: ['Grunt', 'Scout', 'Swarmling', 'Medic'],
                gradient: 'linear-gradient(135deg, #1a3a1a 0%, #0a2a0a 100%)',
                border: '#40e080',
            },
            normal: {
                icon: '\u{2694}', // swords
                title: 'THE BATTLEFIELD',
                story: '"The scars of ancient wars mark this terrain. Heavy infantry marches in formation, shielded soldiers advance under cover, and battle-hardened medics keep the ranks alive. Strategy meets survival."',
                rank: 'TIER II',
                pressure: 'BALANCED FRONTS',
                boss: 'Stone Colossus',
                bossAbilities: ['Bastion Shield', 'Ground Slam', 'EMP Pulse'],
                enemyPool: ['Grunt', 'Scout', 'Brute', 'Guardian', 'Medic', 'Splitter'],
                gradient: 'linear-gradient(135deg, #2a2a1a 0%, #1a1a0a 100%)',
                border: '#e0c040',
            },
            hard: {
                icon: '\u{1F525}', // fire
                title: 'THE GAUNTLET',
                story: '"They call it the Gauntlet because you must run it alone. Shadows strike from nowhere, spirits phase through your attacks, and berserkers grow stronger as they bleed. You will lose towers. You will lose lives."',
                rank: 'TIER III',
                pressure: 'SPIKE WAVES',
                boss: 'Infernal Lord',
                bossAbilities: ['Blazing Sprint', 'Hellspawn Call', 'Overheat EMP'],
                enemyPool: ['Shadow', 'Phantom', 'Berserker', 'Brute', 'Guardian', 'Buzzer'],
                gradient: 'linear-gradient(135deg, #3a1a0a 0%, #2a0a0a 100%)',
                border: '#e06040',
            },
            nightmare: {
                icon: '\u{1F480}', // skull
                title: 'THE VOID',
                story: '"We do not speak of what dwells in the Void. It has no name \u2014 only hunger. Ancient dragons wake from eternal slumber. If you face the Nightmare, you have already lost everything worth protecting."',
                rank: 'TIER IV',
                pressure: 'SUSTAINED OVERLOAD',
                boss: 'Void Emperor',
                bossAbilities: ['Void Step', 'Aegis Rift', 'Mass Summon'],
                enemyPool: ['All enemy types', 'Elite variants', 'Double modifiers'],
                gradient: 'linear-gradient(135deg, #2a0a3a 0%, #0a0a1a 100%)',
                border: '#c020e0',
            },
        };

        const presets = CONFIG.DIFFICULTY_PRESETS;
        const baseline = presets.easy || {
            enemyHpMult: 1,
            enemySpeedMult: 1,
            startingLives: 30,
            startingGold: 300,
        };

        const clampPct = (v) => Math.max(6, Math.min(100, Math.round(v)));

        let idx = 0;
        for (const key of Object.keys(presets)) {
            const p = presets[key];
            const d = diffData[key];
            if (!d) continue;
            const bandStatus = (typeof ProgressionSystem !== 'undefined' && typeof ProgressionSystem.getBandStatus === 'function')
                ? ProgressionSystem.getBandStatus(key)
                : { unlocked: true, lines: [] };

            const threatScore = Math.round((p.enemyHpMult * 0.62 + p.enemySpeedMult * 0.38) * 100);
            const economyScore = Math.round((p.startingGold / Math.max(1, baseline.startingGold)) * 100);
            const survivalScore = Math.round((p.startingLives / Math.max(1, baseline.startingLives)) * 100);

            const threatFill = clampPct((threatScore / 210) * 100);
            const economyFill = clampPct((economyScore / 130) * 100);
            const survivalFill = clampPct((survivalScore / 130) * 100);

            const card = document.createElement('div');
            card.className = `diff-card diff-card-${key}`;
            if (!bandStatus.unlocked) card.classList.add('locked');
            card.style.background = d.gradient;
            card.style.borderColor = d.border;
            card.style.setProperty('--diff-accent', d.border);
            card.style.setProperty('--diff-gradient', d.gradient);
            card.style.setProperty('--card-index', String(idx));
            idx++;

            card.innerHTML = `
                <div class="diff-card-fx" aria-hidden="true">
                    <span class="diff-fx-grid"></span>
                    <span class="diff-fx-scan"></span>
                </div>
                <div class="diff-card-header">
                    <div class="diff-card-rank">${d.rank || ''}</div>
                    <span class="diff-card-icon">${d.icon}</span>
                    <div class="diff-card-title" style="color:${d.border}">${d.title}</div>
                    <div class="diff-card-subtitle">${p.name} Difficulty</div>
                </div>
                <div class="diff-card-story">${d.story}</div>
                <div class="diff-card-pressure">
                    <span class="diff-pressure-label">Threat Profile</span>
                    <span class="diff-pressure-value">${d.pressure || p.name}</span>
                </div>
                <div class="diff-card-section">
                    <div class="diff-card-label">BOSS: ${d.boss}</div>
                    <div class="diff-card-tags">${d.bossAbilities.map(a => `<span class="diff-tag">${a}</span>`).join('')}</div>
                </div>
                <div class="diff-card-section">
                    <div class="diff-card-label">ENEMIES</div>
                    <div class="diff-card-tags">${d.enemyPool.map(e => `<span class="diff-tag enemy-tag">${e}</span>`).join('')}</div>
                </div>
                <div class="diff-card-stats">
                    <div class="diff-stat"><span class="diff-stat-label">Enemy HP</span><span class="diff-stat-val">${Math.round(p.enemyHpMult * 100)}%</span></div>
                    <div class="diff-stat"><span class="diff-stat-label">Speed</span><span class="diff-stat-val">${Math.round(p.enemySpeedMult * 100)}%</span></div>
                    <div class="diff-stat"><span class="diff-stat-label">Lives</span><span class="diff-stat-val">${p.startingLives}</span></div>
                    <div class="diff-stat"><span class="diff-stat-label">Gold</span><span class="diff-stat-val">${p.startingGold}</span></div>
                </div>
                <div class="diff-card-meter">
                    <div class="diff-meter-row">
                        <span>THREAT</span>
                        <div class="diff-meter-track"><i class="diff-meter-fill" style="width:${threatFill}%"></i></div>
                        <b>${threatScore}</b>
                    </div>
                    <div class="diff-meter-row">
                        <span>SUPPLY</span>
                        <div class="diff-meter-track"><i class="diff-meter-fill" style="width:${economyFill}%"></i></div>
                        <b>${economyScore}</b>
                    </div>
                    <div class="diff-meter-row">
                        <span>SURVIVAL</span>
                        <div class="diff-meter-track"><i class="diff-meter-fill" style="width:${survivalFill}%"></i></div>
                        <b>${survivalScore}</b>
                    </div>
                </div>
                <div class="diff-card-cta"><span>${bandStatus.unlocked ? 'DEPLOY TO THIS THEATER' : 'CAMPAIGN GATE LOCKED'}</span><em>${bandStatus.unlocked ? 'ENTER' : 'LOCKED'}</em></div>
                ${bandStatus.unlocked ? '' : `<div class="diff-card-locknote">${bandStatus.lines.filter(line => !line.met).map(line => line.text).join(' | ')}</div>`}
            `;

            card.addEventListener('mousemove', (event) => {
                const rect = card.getBoundingClientRect();
                if (rect.width <= 0 || rect.height <= 0) return;
                const nx = (event.clientX - rect.left) / rect.width;
                const ny = (event.clientY - rect.top) / rect.height;
                const tiltX = (0.5 - ny) * 8;
                const tiltY = (nx - 0.5) * 10;
                card.style.setProperty('--tilt-x', `${tiltX.toFixed(2)}deg`);
                card.style.setProperty('--tilt-y', `${tiltY.toFixed(2)}deg`);
                card.style.setProperty('--diff-hover-x', `${(nx * 100).toFixed(2)}%`);
                card.style.setProperty('--diff-hover-y', `${(ny * 100).toFixed(2)}%`);
            });
            card.addEventListener('mouseleave', () => {
                card.style.setProperty('--tilt-x', '0deg');
                card.style.setProperty('--tilt-y', '0deg');
                card.style.setProperty('--diff-hover-x', '50%');
                card.style.setProperty('--diff-hover-y', '50%');
            });

            card.addEventListener('click', () => {
                if (!bandStatus.unlocked) {
                    if (typeof Effects !== 'undefined' && Effects.addFloatingText) {
                        Effects.addFloatingText(logicalWidth / 2, 54, `${d.title} locked`, '#ff8b8b', 14);
                    }
                    Audio.play('error');
                    return;
                }
                GameState.settings.difficulty = key;
                SaveSystem.savePersistent();
                this.showScreen('mapselect');
                Audio.play('click');
            });

            container.appendChild(card);
        }
    },

    renderMapSelect() {
        const container = document.getElementById('map-cards');
        container.innerHTML = '';
        this._hideMapHoverPreview();

        if (typeof ProgressionSystem !== 'undefined' && typeof ProgressionSystem.refreshUnlockedMaps === 'function') {
            ProgressionSystem.refreshUnlockedMaps();
        }

        // Determine which maps to show based on selected difficulty
        const diffKey = GameState.settings.difficulty || 'easy';
        const diffGroupMap = { easy: 0, normal: 1, hard: 2, nightmare: 3 };
        const group = diffGroupMap[diffKey] || 0;
        const startIdx = group * 5;
        const endIdx = startIdx + 5;

        // Difficulty theme data
        const diffThemes = {
            easy:      { accent: '#40e080', label: 'TRAINING GROUNDS', subtitle: 'Learn the ropes against weaker foes', icon: '\u{1F6E1}' },
            normal:    { accent: '#e0c040', label: 'THE BATTLEFIELD',  subtitle: 'Standard combat against organized forces', icon: '\u{2694}' },
            hard:      { accent: '#e06040', label: 'THE GAUNTLET',     subtitle: 'Relentless enemies with deadly abilities', icon: '\u{1F525}' },
            nightmare: { accent: '#c020e0', label: 'THE VOID',         subtitle: 'Face the ultimate horrors of the abyss', icon: '\u{1F480}' },
        };

        const diffIntel = {
            easy: {
                boss: 'Grub King',
                icon: '\u{1F41B}',
                doctrine: 'Training lanes reward clean tower fundamentals.',
                tags: ['BROOD CALL', 'SKITTER RUSH', 'QUAKE SLOW'],
            },
            normal: {
                boss: 'Stone Colossus',
                icon: '\u{1FAA8}',
                doctrine: 'Balanced fronts favor adaptive targeting and tempo.',
                tags: ['BASTION SHIELD', 'GROUND SLAM', 'EMP PULSE'],
            },
            hard: {
                boss: 'Infernal Lord',
                icon: '\u{1F525}',
                doctrine: 'Aggressive waves punish slow setup and weak lanes.',
                tags: ['BLAZING SPRINT', 'HELLSPAWN CALL', 'OVERHEAT EMP'],
            },
            nightmare: {
                boss: 'Void Emperor',
                icon: '\u{1F480}',
                doctrine: 'Endgame doctrine checks with sustained pressure loops.',
                tags: ['VOID STEP', 'AEGIS RIFT', 'MASS SUMMON'],
            },
        };

        // Enemy pools per difficulty
        const diffEnemies = {
            easy:      [
                { name: 'Grunt', color: ENEMIES.basic.color },
                { name: 'Scout', color: ENEMIES.fast.color },
                { name: 'Swarmling', color: ENEMIES.swarm.color },
                { name: 'Medic', color: ENEMIES.healer.color },
                { name: 'Grub King', color: ENEMIES.boss.color },
            ],
            normal:    [
                { name: 'Grunt', color: ENEMIES.basic.color },
                { name: 'Brute', color: ENEMIES.heavy.color },
                { name: 'Guardian', color: ENEMIES.shield.color },
                { name: 'Medic', color: ENEMIES.healer.color },
                { name: 'Splitter', color: ENEMIES.splitter.color },
                { name: 'Stone Colossus', color: ENEMIES.boss.color },
            ],
            hard:      [
                { name: 'Shadow', color: ENEMIES.stealth.color },
                { name: 'Phantom', color: ENEMIES.ghost.color },
                { name: 'Berserker', color: ENEMIES.berserker.color },
                { name: 'Brute', color: ENEMIES.heavy.color },
                { name: 'Buzzer', color: ENEMIES.swarmfast.color },
                { name: 'Infernal Lord', color: ENEMIES.boss.color },
            ],
            nightmare: [
                { name: 'All Types', color: '#ff50ff' },
                { name: 'Elite Variants', color: '#ff2020' },
                { name: 'Double Modifiers', color: '#c020e0' },
                { name: 'Void Emperor', color: '#8000ff' },
            ],
        };

        const theme = diffThemes[diffKey] || diffThemes.easy;
        const enemies = diffEnemies[diffKey] || diffEnemies.easy;
        const intel = diffIntel[diffKey] || diffIntel.easy;
        const bandStatus = (typeof ProgressionSystem !== 'undefined' && typeof ProgressionSystem.getBandStatus === 'function')
            ? ProgressionSystem.getBandStatus(diffKey)
            : { unlocked: true, lines: [] };
        const progressionSummary = (typeof ProgressionSystem !== 'undefined' && typeof ProgressionSystem.getOverviewSummary === 'function')
            ? ProgressionSystem.getOverviewSummary()
            : { marks: 0, nextTowerText: '', nextBandText: '' };
        const compactNumber = (value) => {
            if (!Number.isFinite(value) || value <= 0) return '--';
            if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
            if (value >= 10000) return `${Math.round(value / 1000)}K`;
            if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
            return `${Math.floor(value)}`;
        };

        // Apply theme accent as CSS variable
        const mapSelect = document.getElementById('map-select');
        mapSelect.style.setProperty('--map-accent', theme.accent);
        mapSelect.style.setProperty('--map-accent-soft', `color-mix(in srgb, ${theme.accent} 26%, #7f8fff)`);
        mapSelect.classList.remove('map-select-theme-easy', 'map-select-theme-normal', 'map-select-theme-hard', 'map-select-theme-nightmare');
        mapSelect.classList.add(`map-select-theme-${diffKey}`);

        // Update header
        const titleEl = document.getElementById('map-select-title');
        const subtitleEl = document.getElementById('map-select-subtitle');
        if (titleEl) titleEl.textContent = `${theme.icon} ${theme.label}`;
        if (subtitleEl) subtitleEl.textContent = theme.subtitle;

        // Progress
        const progressEl = document.getElementById('map-select-progress');
        let completed = 0;
        let unlockedCount = 0;
        let totalBestScore = 0;
        for (let i = startIdx; i < endIdx && i < MAPS.length; i++) {
            if (GameState.mapScores[i] > 0) completed++;
            if (GameState.unlockedMaps[i]) unlockedCount++;
            if (Number.isFinite(GameState.mapScores[i])) totalBestScore += Math.max(0, GameState.mapScores[i]);
        }
        const total = Math.min(endIdx, MAPS.length) - startIdx;
        if (progressEl) {
            progressEl.textContent = `${progressionSummary.marks}/60 MARKS`;
        }

        const totalMaps = total;
        const completionPct = totalMaps > 0 ? (completed / totalMaps) * 100 : 0;

        // Enemy bar
        let enemyBar = document.getElementById('map-select-enemies');
        if (!enemyBar) {
            enemyBar = document.createElement('div');
            enemyBar.className = 'map-select-enemies';
            enemyBar.id = 'map-select-enemies';
            const header = document.getElementById('map-select-header');
            header.parentNode.insertBefore(enemyBar, header.nextSibling);
        }
        enemyBar.innerHTML = `<span class="map-select-enemies-label">Threat Feed</span>` +
            enemies.map(e => `<span class="map-enemy-chip"><span class="map-enemy-dot" style="background:${e.color};box-shadow:0 0 6px ${e.color}"></span>${e.name}</span>`).join('');

        // Operations overview panel
        let overview = document.getElementById('map-select-overview');
        if (!overview) {
            overview = document.createElement('div');
            overview.id = 'map-select-overview';
            overview.className = 'map-select-overview';
            enemyBar.parentNode.insertBefore(overview, enemyBar.nextSibling);
        }
        overview.innerHTML = `
            <div class="mso-main">
                <div class="mso-kicker">Operations Brief</div>
                <h3 class="mso-title">${theme.label}</h3>
                <p class="mso-copy">${intel.doctrine}</p>
                <div class="mso-progress-wrap">
                    <div class="mso-progress-track"><span style="width:${completionPct.toFixed(1)}%"></span></div>
                    <div class="mso-progress-meta">
                        <span>${completed}/${totalMaps} sectors secured</span>
                        <span>${unlockedCount}/${totalMaps} unlocked</span>
                    </div>
                </div>
                <div class="mso-progression-lines">
                    <div class="mso-progress-line"><span>Command Marks</span><strong>${progressionSummary.marks}</strong></div>
                    <div class="mso-progress-line"><span>Next Tower</span><strong>${progressionSummary.nextTowerText || 'All tower licenses unlocked'}</strong></div>
                    <div class="mso-progress-line"><span>Next Band</span><strong>${progressionSummary.nextBandText || 'All difficulty bands unlocked'}</strong></div>
                    ${bandStatus.unlocked ? '' : `<div class="mso-progress-line gate"><span>This Theater</span><strong>${bandStatus.lines.filter(line => !line.met).map(line => line.text).join(' | ')}</strong></div>`}
                </div>
            </div>
            <aside class="mso-boss">
                <div class="mso-boss-emblem">${intel.icon}</div>
                <div class="mso-boss-name">${intel.boss}</div>
                <div class="mso-boss-sub">Prime Target</div>
                <div class="mso-boss-tags">
                    ${(intel.tags || []).map(tag => `<span class="mso-tag">${tag}</span>`).join('')}
                </div>
                <div class="mso-boss-score">Group Best ${compactNumber(totalBestScore)} pts</div>
            </aside>
        `;

        // Render map cards for this difficulty group only
        for (let i = startIdx; i < endIdx && i < MAPS.length; i++) {
            const map = MAPS[i];
            const unlocked = GameState.unlockedMaps[i];
            const mapNum = i - startIdx + 1;
            const markBits = typeof ProgressionSystem !== 'undefined' ? ProgressionSystem.getMapMarkBits(i) : 0;
            const directive = typeof ProgressionSystem !== 'undefined' ? ProgressionSystem.getMapDirective(i) : null;
            const directiveDone = !!(markBits & 4);

            const card = document.createElement('div');
            card.className = `map-card ${unlocked ? 'is-ready' : 'locked'}`;
            card.style.setProperty('--map-order', String(mapNum));

            // Mini map preview
            const previewDiv = document.createElement('div');
            previewDiv.className = 'map-preview';

            if (unlocked) {
                const previewCanvas = document.createElement('canvas');
                previewCanvas.width = 280;
                previewCanvas.height = 160;
                const previewCtx = previewCanvas.getContext('2d');
                MapSystem.drawMiniMap(previewCtx, i, 280, 160);
                previewDiv.appendChild(previewCanvas);
                const overlay = document.createElement('div');
                overlay.className = 'map-preview-overlay';
                overlay.innerHTML = `<span class="map-preview-wave">${map.waves} waves</span>`;
                previewDiv.appendChild(overlay);
            } else {
                previewDiv.innerHTML = `<div class="map-lock">\u{1F512}</div>`;
                previewDiv.style.background = map.bgColor;
            }

            // Stars
            let starsHTML = '';
            for (let s = 0; s < 5; s++) {
                starsHTML += `<span class="map-star ${s < map.difficulty ? '' : 'empty'}">\u2605</span>`;
            }

            const bestScore = GameState.mapScores[i];
            const bestWave = GameState.mapWaveRecords[i];
            const markPips = `
                <div class="map-mark-pips">
                    <span class="map-mark-pip ${markBits & 1 ? 'earned' : ''}" title="Clear mark"></span>
                    <span class="map-mark-pip ${markBits & 2 ? 'earned' : ''}" title="Perfect mark"></span>
                    <span class="map-mark-pip ${markBits & 4 ? 'earned' : ''}" title="Directive mark"></span>
                </div>`;

            const statusHtml = unlocked
                ? (bestScore > 0
                    ? '<div class="map-card-status cleared">CLEARED</div>'
                    : '<div class="map-card-status ready">READY</div>')
                : '<div class="map-card-status locked">LOCKED</div>';

            // Number badge + theme badge
            const numberBadge = `<div class="map-card-number">${mapNum}</div>`;
            const themeBadge = `<div class="map-card-theme">${map.theme}</div>`;

            card.innerHTML = numberBadge + themeBadge + statusHtml;
            card.appendChild(previewDiv);

            const bodyDiv = document.createElement('div');
            bodyDiv.className = 'map-card-body';

            let bestHTML = '';
            if (bestScore > 0) {
                bestHTML = `<div class="map-best"><span class="best-score">${compactNumber(bestScore)} pts</span><span class="best-wave">W${bestWave}</span></div>`;
            } else if (!unlocked) {
                bestHTML = `<div class="map-best locked-note">${bandStatus.unlocked ? 'Clear previous sector' : 'Meet theater gate'}</div>`;
            } else {
                bestHTML = `<div class="map-best pending-note">No clear record</div>`;
            }

            bodyDiv.innerHTML = `
                <div class="map-card-top">
                    <div class="map-name">${map.name}</div>
                    <div class="map-difficulty">${starsHTML}</div>
                </div>
                ${markPips}
                <div class="map-desc">${map.desc}</div>
                <div class="map-directive ${directiveDone ? 'complete' : ''}">
                    <span class="map-directive-kicker">Directive</span>
                    <strong>${directive ? directive.name : 'No directive'}</strong>
                    <span>${directive ? directive.desc : 'No directive assigned.'}</span>
                </div>
                <div class="map-card-metrics">
                    <div class="map-metric"><span class="map-metric-label">Waves</span><strong>${map.waves}</strong></div>
                    <div class="map-metric"><span class="map-metric-label">Best Wave</span><strong>${bestWave > 0 ? bestWave : '--'}</strong></div>
                    <div class="map-metric"><span class="map-metric-label">Best Score</span><strong>${bestScore > 0 ? compactNumber(bestScore) : '--'}</strong></div>
                </div>
                <div class="map-card-footer">
                    <div class="map-meta">Sector ${mapNum}</div>
                    ${bestHTML}
                </div>
            `;
            card.appendChild(bodyDiv);

            // Play hint overlay
            if (unlocked) {
                const hint = document.createElement('div');
                hint.className = 'map-card-play-hint';
                hint.textContent = 'PLAY';
                card.appendChild(hint);
            }

            if (unlocked) {
                card.addEventListener('click', () => {
                    this._hideMapHoverPreview();
                    this.openDoctrineSelect(i);
                    Audio.play('click');
                });
            }

            container.appendChild(card);
        }

        // ===== CHALLENGE MODIFIERS SECTION =====
        let challengeSection = document.getElementById('challenge-modifiers-section');
        if (!challengeSection) {
            challengeSection = document.createElement('div');
            challengeSection.className = 'challenge-modifiers-section';
            challengeSection.id = 'challenge-modifiers-section';
            container.parentNode.appendChild(challengeSection);
        }

        // Initialize pending challenges if needed
        if (!GameState._pendingChallenges) GameState._pendingChallenges = [];

        const renderChallengeChips = () => {
            let totalBonus = 0;
            for (const cid of GameState._pendingChallenges) {
                const cmod = CONFIG.CHALLENGE_MODIFIERS.find(c => c.id === cid);
                if (cmod) totalBonus += cmod.rpBonus;
            }
            const multText = totalBonus > 0 ? `${(1 + totalBonus).toFixed(1)}x` : '1.0x';

            let html = `<div class="challenge-header">
                <span class="challenge-title">CHALLENGE MODIFIERS</span>
                <span class="challenge-rp-bonus">RP Bonus: ${multText}</span>
            </div>
            <div class="challenge-chips">`;

            for (const mod of CONFIG.CHALLENGE_MODIFIERS) {
                const active = GameState._pendingChallenges.includes(mod.id);
                html += `<div class="challenge-mod-chip${active ? ' active' : ''}" data-challenge="${mod.id}" title="${mod.desc}">
                    <span class="challenge-chip-icon">${mod.icon}</span>
                    <span class="challenge-chip-name">${mod.name}</span>
                    <span class="challenge-chip-bonus">+${(mod.rpBonus * 100).toFixed(0)}%</span>
                </div>`;
            }

            html += '</div>';
            challengeSection.innerHTML = html;

            // Bind click handlers
            challengeSection.querySelectorAll('.challenge-mod-chip').forEach(chip => {
                chip.addEventListener('click', () => {
                    const cid = chip.dataset.challenge;
                    const idx = GameState._pendingChallenges.indexOf(cid);
                    if (idx >= 0) {
                        GameState._pendingChallenges.splice(idx, 1);
                    } else {
                        GameState._pendingChallenges.push(cid);
                    }
                    renderChallengeChips();
                    Audio.play('click');
                });
            });
        };

        renderChallengeChips();
    },

    _showMapHoverPreview(mapIndex, cardEl) {
        this._hideMapHoverPreview();
        const map = MAPS[mapIndex];
        const diffGroup = Math.floor(mapIndex / 5);
        const diffNames = ['Easy', 'Normal', 'Hard', 'Nightmare'];
        const diffColors = ['#40e080', '#e0c040', '#e06040', '#c020e0'];

        const popup = document.createElement('div');
        popup.id = 'map-hover-preview';
        popup.className = 'map-hover-preview';

        // Large map canvas
        const previewCanvas = document.createElement('canvas');
        previewCanvas.width = 480;
        previewCanvas.height = 270;
        const previewCtx = previewCanvas.getContext('2d');
        MapSystem.drawMiniMap(previewCtx, mapIndex, 480, 270);
        popup.appendChild(previewCanvas);

        // Info overlay
        const info = document.createElement('div');
        info.className = 'map-hover-info';
        const waypoints = map.waypoints.length;
        const pathLength = waypoints > 1 ? Math.round(waypoints * 40 * 0.7) : '?';
        info.innerHTML = `
            <div class="mhp-name">${map.name}</div>
            <div class="mhp-theme" style="color:${diffColors[diffGroup]}">${map.theme} — ${diffNames[diffGroup]}</div>
            <div class="mhp-stats">
                <span class="mhp-stat">${map.waves} waves</span>
                <span class="mhp-stat">${waypoints} turns</span>
            </div>
            <div class="mhp-desc">${map.desc}</div>
        `;
        popup.appendChild(info);

        // Position relative to card
        const rect = cardEl.getBoundingClientRect();
        const containerRect = document.getElementById('map-select').getBoundingClientRect();
        popup.style.position = 'fixed';
        popup.style.zIndex = '9999';

        // Place above the card if there's room, otherwise below
        const popupHeight = 340;
        if (rect.top - containerRect.top > popupHeight + 20) {
            popup.style.bottom = (window.innerHeight - rect.top + 10) + 'px';
        } else {
            popup.style.top = (rect.bottom + 10) + 'px';
        }
        popup.style.left = Math.max(10, rect.left + rect.width / 2 - 250) + 'px';

        document.body.appendChild(popup);
        requestAnimationFrame(() => popup.classList.add('visible'));
    },

    _hideMapHoverPreview() {
        const existing = document.getElementById('map-hover-preview');
        if (existing) existing.remove();
    },

    loadSettings() {
        const s = GameState.settings;
        document.getElementById('music-volume').value = s.musicVolume * 100;
        document.getElementById('music-vol-val').textContent = Math.round(s.musicVolume * 100) + '%';
        document.getElementById('sfx-volume').value = s.sfxVolume * 100;
        document.getElementById('sfx-vol-val').textContent = Math.round(s.sfxVolume * 100) + '%';
        document.getElementById('shake-intensity').value = s.shakeIntensity * 100;
        document.getElementById('shake-val').textContent = Math.round(s.shakeIntensity * 100) + '%';
        document.getElementById('show-ranges').checked = s.showRanges;
        document.getElementById('auto-start').checked = s.autoStart;

        // Update slider track fills
        document.querySelectorAll('input[type="range"]').forEach(el => {
            const min = parseFloat(el.min) || 0;
            const max = parseFloat(el.max) || 100;
            const pct = ((el.value - min) / (max - min)) * 100;
            el.style.setProperty('--fill', pct + '%');
        });

        // Build/refresh main menu difficulty selector
        this._buildMainDifficultySelector();
        this._renderHotkeySettings();
    },

    _buildMainDifficultySelector() {
        const selector = document.getElementById('main-difficulty-selector');
        if (!selector) return;
        selector.innerHTML = '';
        const presets = CONFIG.DIFFICULTY_PRESETS;
        for (const key of Object.keys(presets)) {
            const p = presets[key];
            const btn = document.createElement('button');
            btn.className = 'diff-btn' + (GameState.settings.difficulty === key ? ' active' : '');
            btn.dataset.diff = key;
            btn.style.setProperty('--diff-color', p.color);
            btn.innerHTML = `<span class="diff-name" style="color:${p.color}">${p.name}</span><span class="diff-desc">${p.description}</span>`;
            btn.addEventListener('click', () => {
                GameState.settings.difficulty = key;
                selector.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                // Sync in-game difficulty selector too
                const ingame = document.getElementById('difficulty-selector');
                if (ingame) {
                    ingame.querySelectorAll('.diff-btn').forEach(b => {
                        b.classList.toggle('active', b.dataset.diff === key);
                    });
                }
                SaveSystem.savePersistent();
                Audio.play('click');
            });
            selector.appendChild(btn);
        }
    },

    _renderHotkeySettings() {
        const grid = document.getElementById('settings-hotkey-grid');
        if (!grid || typeof Input === 'undefined' || typeof Input.getRemappableHotkeyActions !== 'function') {
            return;
        }

        const actions = Input.getRemappableHotkeyActions();
        grid.innerHTML = '';

        for (const action of actions) {
            const row = document.createElement('div');
            row.className = 'settings-hotkey-row';

            const name = document.createElement('span');
            name.className = 'settings-hotkey-name';
            name.textContent = action.label;

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'hotkey-bind-btn';
            btn.dataset.action = action.id;

            const isCapturing = this._hotkeyCaptureAction === action.id;
            btn.textContent = isCapturing ? 'PRESS KEY/MOUSE...' : Input.getHotkeyLabel(action.id);
            if (isCapturing) btn.classList.add('is-capturing');

            btn.addEventListener('click', () => {
                this._hotkeyCaptureAction = isCapturing ? null : action.id;
                this._renderHotkeySettings();
            });

            row.appendChild(name);
            row.appendChild(btn);
            grid.appendChild(row);
        }
    },

    _handleHotkeyCaptureKeydown(e) {
        if (!this._hotkeyCaptureAction) return;
        if (GameState.screen !== 'settings') {
            this._cancelHotkeyCapture();
            return;
        }

        e.preventDefault();
        e.stopPropagation();
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();

        if (e.code === 'Escape') {
            this._cancelHotkeyCapture();
            Audio.play('click');
            return;
        }

        if (typeof Input === 'undefined' || typeof Input.setHotkey !== 'function') {
            this._cancelHotkeyCapture();
            return;
        }

        const result = Input.setHotkey(this._hotkeyCaptureAction, e.code);
        if (!result || !result.ok) return;

        this._hotkeyCaptureAction = null;
        this._renderHotkeySettings();
        this._refreshHotkeyDependentUI();
        SaveSystem.savePersistent();
        Audio.play('click');
    },

    _handleHotkeyCaptureMousedown(e) {
        if (!this._hotkeyCaptureAction) return;
        if (GameState.screen !== 'settings') {
            this._cancelHotkeyCapture();
            return;
        }

        if (typeof Input === 'undefined' || typeof Input.setHotkey !== 'function' || typeof Input.mouseButtonToHotkeyCode !== 'function') {
            this._cancelHotkeyCapture();
            return;
        }

        const mouseCode = Input.mouseButtonToHotkeyCode(e.button);
        if (!mouseCode) return;

        e.preventDefault();
        e.stopPropagation();
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();

        const result = Input.setHotkey(this._hotkeyCaptureAction, mouseCode);
        if (!result || !result.ok) return;

        this._hotkeyCaptureAction = null;
        this._renderHotkeySettings();
        this._refreshHotkeyDependentUI();
        SaveSystem.savePersistent();
        Audio.play('click');
    },

    _cancelHotkeyCapture() {
        if (!this._hotkeyCaptureAction) return;
        this._hotkeyCaptureAction = null;
        if (GameState.screen === 'settings') {
            this._renderHotkeySettings();
        }
    },

    _refreshHotkeyDependentUI() {
        if (typeof Input !== 'undefined' && typeof Input.refreshShortcutOverlay === 'function') {
            Input.refreshShortcutOverlay();
        }
        if (typeof UIRenderer !== 'undefined' && typeof UIRenderer.refreshAbilityHotkeys === 'function') {
            UIRenderer.refreshAbilityHotkeys();
        }
        if (GameState.screen === 'howtoplay') {
            this.renderHowToPlay();
        }
    },

    _initHoverButtonSfx() {
        if (this._hoverSfxBound || typeof document === 'undefined') return;
        this._hoverSfxBound = true;
        this._hoverSfxPerTarget = new WeakMap();

        const hoverSelector = [
            '.menu-btn',
            '.back-btn',
            '.tc-nav-btn',
            '.tc-tab-btn',
            '.tc-cycle-btn',
            '.tc-filter-btn',
            '.diff-btn',
            '.dv2-card',
            '.hud-btn',
            '.hud-toggle',
            '.action-btn',
            '.keybind-reset-btn',
            '.map-card',
            '.map-nav-btn',
            '.weekly-play-btn',
        ].join(',');

        document.addEventListener('pointerover', (event) => {
            if (event.pointerType && event.pointerType !== 'mouse') return;
            const target = event.target && event.target.closest
                ? event.target.closest(hoverSelector)
                : null;
            if (!target || target.disabled || target.classList.contains('disabled')) return;

            const related = event.relatedTarget;
            if (related && target.contains(related)) return;

            const now = (typeof performance !== 'undefined' && performance.now)
                ? performance.now()
                : Date.now();
            const lastTargetAt = this._hoverSfxPerTarget.get(target) || 0;
            if ((now - lastTargetAt) < 140) return;
            if ((now - this._hoverSfxLastGlobal) < 45) return;

            this._hoverSfxPerTarget.set(target, now);
            this._hoverSfxLastGlobal = now;
            if (typeof Audio !== 'undefined' && typeof Audio.play === 'function') {
                Audio.play('hover', { volume: 0.24 });
            }
        }, true);
    },

    _getTowerCodexEntries() {
        if (typeof TOWERS === 'undefined') return [];
        const keyOrder = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='];
        return Object.entries(TOWERS).sort(([, defA], [, defB]) => {
            const a = keyOrder.indexOf(defA.key || '');
            const b = keyOrder.indexOf(defB.key || '');
            if (a === -1 && b === -1) return 0;
            if (a === -1) return 1;
            if (b === -1) return -1;
            return a - b;
        });
    },

    _cycleTowerCodexSelection(step) {
        const towerEntries = this._getTowerCodexEntries();
        if (towerEntries.length === 0) return;
        const typeOrder = towerEntries.map(([type]) => type);
        const current = typeOrder.includes(this._towerCodexSelectedType)
            ? this._towerCodexSelectedType
            : typeOrder[0];
        const currentIndex = typeOrder.indexOf(current);
        const delta = Number.isFinite(step) ? Math.trunc(step) : 1;
        const nextIndex = ((currentIndex + delta) % typeOrder.length + typeOrder.length) % typeOrder.length;
        const nextType = typeOrder[nextIndex];
        this._towerCodexSelectedType = nextType;
        this.renderTowerCodex(nextType);
        if (typeof Audio !== 'undefined' && typeof Audio.play === 'function') {
            Audio.play('click');
        }
    },

    renderTowerCodex(preferredType = null) {
        const summaryEl = document.getElementById('tower-codex-summary');
        const workspaceEl = document.getElementById('tower-codex-grid');
        if (!summaryEl || !workspaceEl || typeof TOWERS === 'undefined') return;

        const towerEntries = this._getTowerCodexEntries();

        if (towerEntries.length === 0) {
            summaryEl.innerHTML = '';
            workspaceEl.innerHTML = '<div class="tower-codex-empty">No tower intel available.</div>';
            return;
        }

        const hasProgression = typeof ProgressionSystem !== 'undefined';
        const licenseOrder = (CONFIG.PROGRESSION && Array.isArray(CONFIG.PROGRESSION.LICENSE_ORDER))
            ? CONFIG.PROGRESSION.LICENSE_ORDER
            : [];
        const unlockedCount = towerEntries.reduce((count, [type]) => {
            if (!hasProgression) return count + 1;
            return count + (ProgressionSystem.isTowerUnlocked(type) ? 1 : 0);
        }, 0);
        const marks = hasProgression ? ProgressionSystem.getCommandMarks() : 0;
        const nextTower = hasProgression ? ProgressionSystem.getNextTowerUnlock() : null;

        const typeOrder = towerEntries.map(([type]) => type);
        const candidateType = typeof preferredType === 'string' && preferredType
            ? preferredType
            : this._towerCodexSelectedType;
        let selectedType = typeOrder.includes(candidateType) ? candidateType : null;

        if (!selectedType) {
            const firstUnlocked = hasProgression
                ? towerEntries.find(([type]) => ProgressionSystem.isTowerUnlocked(type))
                : null;
            selectedType = firstUnlocked ? firstUnlocked[0] : towerEntries[0][0];
        }

        const navItems = towerEntries.map(([type, def]) => {
            const starter = hasProgression ? ProgressionSystem.isStarterTower(type) : true;
            const unlocked = hasProgression ? ProgressionSystem.isTowerUnlocked(type) : true;
            const statusClass = starter ? 'starter' : (unlocked ? 'licensed' : 'locked');
            const statusLabel = starter ? 'Starter' : (unlocked ? 'Licensed' : 'Locked');
            const reqStatus = hasProgression
                ? ProgressionSystem.getTowerRequirementStatus(type, null)
                : { lines: [] };
            const reqLines = Array.isArray(reqStatus.lines) ? reqStatus.lines : [];
            const reqTotal = reqLines.length > 0 ? reqLines.length : 1;
            const reqMet = reqLines.length > 0
                ? reqLines.filter((line) => line && line.met).length
                : (starter || unlocked ? 1 : 0);
            const reqProgress = Math.max(0, Math.min(100, Math.round((reqMet / reqTotal) * 100)));
            const stageIndex = licenseOrder.indexOf(type);
            const stageLabel = starter
                ? 'Starter'
                : (stageIndex >= 0 ? `Stage ${stageIndex + 1}` : 'Special');
            const navIcon = def.pathA && def.pathA.icon ? def.pathA.icon : 'O';

            const html = `
                <button type="button" class="tc-nav-btn ${statusClass}" data-tower-type="${type}">
                    <span class="tc-nav-top">
                        <span class="tc-nav-icon" style="color:${def.iconColor || '#dbe5ff'}">${navIcon}</span>
                        <span class="tc-nav-name">${def.name}</span>
                        <span class="tc-nav-key">${def.key || '?'}</span>
                    </span>
                    <span class="tc-nav-meta">${statusLabel} - ${stageLabel}</span>
                    <span class="tc-nav-progress"><span>${reqMet}/${reqTotal} checks</span><em>${starter || unlocked ? 'ready' : `${reqProgress}%`}</em></span>
                    <span class="tc-nav-track"><i style="width:${reqProgress}%"></i></span>
                </button>
            `;
            return {
                type,
                starter,
                unlocked,
                statusClass,
                reqProgress,
                html,
            };
        });

        const allowedFilters = ['all', 'ready', 'locked'];
        const activeFilter = allowedFilters.includes(this._towerCodexFilter)
            ? this._towerCodexFilter
            : 'all';
        this._towerCodexFilter = activeFilter;

        let filteredItems = navItems;
        if (activeFilter === 'ready') {
            filteredItems = navItems.filter((item) => item.starter || item.unlocked);
        } else if (activeFilter === 'locked') {
            filteredItems = navItems.filter((item) => !item.starter && !item.unlocked);
        }

        if (filteredItems.length > 0 && !filteredItems.some((item) => item.type === selectedType)) {
            const fallbackItem = filteredItems[0];
            selectedType = fallbackItem ? fallbackItem.type : selectedType;
        }
        if (filteredItems.length === 0) {
            selectedType = null;
        }

        this._towerCodexSelectedType = selectedType;
        const selectedDef = selectedType ? TOWERS[selectedType] : null;
        const selectedStatus = selectedType
            ? (hasProgression
                ? (ProgressionSystem.isStarterTower(selectedType)
                    ? 'Starter'
                    : (ProgressionSystem.isTowerUnlocked(selectedType) ? 'Licensed' : 'Locked'))
                : 'Open')
            : 'No Match';

        const readyCount = navItems.filter((item) => item.starter || item.unlocked).length;
        const lockedCount = Math.max(0, navItems.length - readyCount);

        summaryEl.innerHTML = `
            <div class="tcs-chip">
                <span class="tcs-label">Licenses Online</span>
                <strong>${unlockedCount}/${towerEntries.length}</strong>
            </div>
            <div class="tcs-chip">
                <span class="tcs-label">Command Marks</span>
                <strong>${marks}</strong>
            </div>
            <div class="tcs-chip tcs-chip-wide">
                <span class="tcs-label">Selected Tower</span>
                <strong>${selectedDef ? selectedDef.name : 'Unknown'} - ${selectedStatus}</strong>
                <span class="tcs-subline">${nextTower ? `Next unlock: ${nextTower.label}` : 'All tower licenses unlocked'}</span>
            </div>
        `;

        const navHtml = filteredItems
            .map((item) => item.type === selectedType
                ? item.html.replace('class="tc-nav-btn ', 'class="tc-nav-btn active ')
                : item.html)
            .join('');

        const compact = typeof window !== 'undefined' && window.innerWidth <= 640;
        const allowedTabs = ['overview', 'tiers', 'unlock'];
        const activeTab = allowedTabs.includes(this._towerCodexSelectedTab)
            ? this._towerCodexSelectedTab
            : 'overview';
        this._towerCodexSelectedTab = activeTab;

        const cardHtml = selectedDef
            ? this._buildTowerCodexCard(selectedType, selectedDef, { compact, tab: activeTab })
            : `
                <article class="tower-codex-card tower-codex-card-empty">
                    <div class="tc-empty-title">No towers in this filter</div>
                    <p class="tc-empty-copy">Switch to <strong>All</strong> or <strong>Ready</strong> to continue browsing tower intel.</p>
                </article>
            `;

        const selectedIndex = Math.max(0, filteredItems.findIndex((item) => item.type === selectedType));
        const filteredCount = filteredItems.length;
        const currentPos = filteredCount > 0
            ? `${selectedIndex + 1}/${filteredCount}${filteredCount !== navItems.length ? ` · ${navItems.length} total` : ''}`
            : `0/0 · ${navItems.length} total`;

        workspaceEl.innerHTML = `
            <section class="tower-codex-selector" aria-label="Tower selector">
                <div class="tower-codex-nav">
                    <div class="tc-nav-header">Select Tower <span>${currentPos}</span></div>
                    <div class="tc-filter-row" role="group" aria-label="Tower filter">
                        <button type="button" class="tc-filter-btn${activeFilter === 'all' ? ' active' : ''}" data-filter="all">All <em>${navItems.length}</em></button>
                        <button type="button" class="tc-filter-btn${activeFilter === 'ready' ? ' active' : ''}" data-filter="ready">Ready <em>${readyCount}</em></button>
                        <button type="button" class="tc-filter-btn${activeFilter === 'locked' ? ' active' : ''}" data-filter="locked">Locked <em>${lockedCount}</em></button>
                    </div>
                    <div class="tower-codex-list" role="listbox" aria-label="Tower list">${navHtml || '<div class="tc-nav-empty">No towers in this filter.</div>'}</div>
                </div>
            </section>
            <section class="tower-codex-detail">${cardHtml}</section>
        `;

        workspaceEl.querySelectorAll('.tc-nav-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                const towerType = btn.dataset.towerType;
                if (!towerType || towerType === this._towerCodexSelectedType) return;
                this._towerCodexSelectedType = towerType;
                this.renderTowerCodex(towerType);
                if (typeof Audio !== 'undefined' && typeof Audio.play === 'function') {
                    Audio.play('click');
                }
            });
        });

        workspaceEl.querySelectorAll('.tc-filter-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                const filter = btn.dataset.filter;
                if (!allowedFilters.includes(filter) || filter === this._towerCodexFilter) return;
                this._towerCodexFilter = filter;
                this.renderTowerCodex(this._towerCodexSelectedType);
                if (typeof Audio !== 'undefined' && typeof Audio.play === 'function') {
                    Audio.play('click');
                }
            });
        });

        const listEl = workspaceEl.querySelector('.tower-codex-list');
        if (listEl) {
            const activeBtn = listEl.querySelector('.tc-nav-btn.active');
            if (activeBtn && typeof activeBtn.scrollIntoView === 'function') {
                activeBtn.scrollIntoView({ block: 'nearest', inline: 'nearest' });
            }
        }

        workspaceEl.querySelectorAll('.tc-tab-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                if (!tab || tab === this._towerCodexSelectedTab) return;
                this._towerCodexSelectedTab = tab;

                workspaceEl.querySelectorAll('.tc-tab-btn').forEach((tabBtn) => {
                    tabBtn.classList.toggle('active', tabBtn.dataset.tab === tab);
                });
                workspaceEl.querySelectorAll('.tc-tab-panel').forEach((panel) => {
                    panel.classList.toggle('active', panel.dataset.tab === tab);
                });

                if (typeof Audio !== 'undefined' && typeof Audio.play === 'function') {
                    Audio.play('click');
                }
            });
        });
    },

    _buildTowerCodexCard(type, def, options = {}) {
        if (!def) {
            return '<article class="tower-codex-card"><p>Tower intel unavailable.</p></article>';
        }

        const compact = !!options.compact;
        const activeTab = ['overview', 'tiers', 'unlock'].includes(options.tab)
            ? options.tab
            : 'overview';
        const hasProgression = typeof ProgressionSystem !== 'undefined';
        const starter = hasProgression ? ProgressionSystem.isStarterTower(type) : true;
        const unlocked = hasProgression ? ProgressionSystem.isTowerUnlocked(type) : true;
        const reqStatus = hasProgression
            ? ProgressionSystem.getTowerRequirementStatus(type, null)
            : { lines: [] };

        const licenseOrder = (CONFIG.PROGRESSION && Array.isArray(CONFIG.PROGRESSION.LICENSE_ORDER))
            ? CONFIG.PROGRESSION.LICENSE_ORDER
            : [];
        const stageIndex = licenseOrder.indexOf(type);
        const stageLabel = starter
            ? 'Starter Arsenal'
            : (stageIndex >= 0 ? `License Stage ${stageIndex + 1}/${licenseOrder.length}` : 'Special License');

        const statusClass = starter ? 'starter' : (unlocked ? 'licensed' : 'locked');
        const statusLabel = starter ? 'Starter' : (unlocked ? 'Licensed' : 'Locked');

        const reqRows = !starter && reqStatus.lines.length > 0
            ? reqStatus.lines
            : [{ text: 'Starter access - available from campaign start.', met: true }];
        const reqMetCount = reqRows.filter((line) => line.met).length;
        const reqUnmetCount = Math.max(0, reqRows.length - reqMetCount);
        const unmetRows = reqRows.filter((line) => !line.met);
        const compactRows = compact
            ? (unmetRows.length > 0 ? unmetRows : reqRows).slice(0, 2)
            : reqRows;
        const hiddenReqCount = compact ? Math.max(0, reqRows.length - compactRows.length) : 0;
        const reqLines = compactRows
            .map((line) => `<li class="tc-req-item ${line.met ? 'met' : 'unmet'}">${line.met ? 'OK' : '...'} ${line.text}</li>`)
            .join('');
        const reqMoreLine = hiddenReqCount > 0
            ? `<li class="tc-req-item ${unmetRows.length > 0 ? 'unmet' : 'met'}">+${hiddenReqCount} more checkpoints</li>`
            : '';

        const totalA = typeof getTowerTotalCost === 'function' ? getTowerTotalCost(type, 5, 'A') : null;
        const totalB = typeof getTowerTotalCost === 'function' ? getTowerTotalCost(type, 5, 'B') : null;

        const coreCol = [
            this._buildTowerTierCell(1, def.tiers[1], def.baseCost, 'Core platform stats.', { compact }),
            this._buildTowerTierCell(2, def.tiers[2], def.tiers[2] ? def.tiers[2].cost : null, 'Tier 2 power spike and scaling.', { compact }),
        ].join('');

        const pathACol = [3, 4, 5]
            .map((tier) => this._buildTowerTierCell(tier, def.pathA && def.pathA.tiers ? def.pathA.tiers[tier] : null, null, 'Path A specialization tier.', { compact }))
            .join('');

        const pathBCol = [3, 4, 5]
            .map((tier) => this._buildTowerTierCell(tier, def.pathB && def.pathB.tiers ? def.pathB.tiers[tier] : null, null, 'Path B specialization tier.', { compact }))
            .join('');

        const cardDesc = compact ? this._truncateText(def.description, 110) : def.description;
        const pathADesc = compact
            ? this._truncateText(def.pathA && def.pathA.desc ? def.pathA.desc : '', 68)
            : (def.pathA && def.pathA.desc ? def.pathA.desc : '');
        const pathBDesc = compact
            ? this._truncateText(def.pathB && def.pathB.desc ? def.pathB.desc : '', 68)
            : (def.pathB && def.pathB.desc ? def.pathB.desc : '');
        const stagePill = compact ? '' : `<span class="tc-pill">${stageLabel}</span>`;

        const tier1Facts = this._collectTierFacts(def.tiers[1] || {}).slice(0, 3);
        const tier2Facts = this._collectTierFacts(def.tiers[2] || {}).slice(0, 3);
        const overviewFacts = [...new Set([...tier1Facts, ...tier2Facts])].slice(0, compact ? 4 : 6);
        const unlockSummary = starter
            ? 'Starter tower. Available from the beginning of campaign mode.'
            : (unlocked
                ? 'License complete. This tower is fully available in deployment loadouts.'
                : (reqUnmetCount > 0
                    ? `${reqUnmetCount} requirement${reqUnmetCount === 1 ? '' : 's'} remaining before license activation.`
                    : 'All checks met. Win a qualifying run to confirm unlock.'));

        const overviewChips = [
            `Base ${Number.isFinite(def.baseCost) ? `${Math.floor(def.baseCost)}g` : '--'}`,
            `Tier 2 ${def.tiers[2] && Number.isFinite(def.tiers[2].cost) ? `${Math.floor(def.tiers[2].cost)}g` : '--'}`,
            `Path A ${Number.isFinite(totalA) ? `${Math.floor(totalA)}g` : '--'}`,
            `Path B ${Number.isFinite(totalB) ? `${Math.floor(totalB)}g` : '--'}`,
            ...overviewFacts,
        ].slice(0, compact ? 6 : 9);

        return `
            <article class="tower-codex-card ${statusClass}${compact ? ' compact' : ''}">
                <header class="tc-head">
                    <div class="tc-head-main">
                        <span class="tc-icon" style="color:${def.iconColor || '#dbe5ff'}">${def.pathA && def.pathA.icon ? def.pathA.icon : 'O'}</span>
                        <div>
                            <h3>${def.name}</h3>
                            <p>${cardDesc}</p>
                        </div>
                    </div>
                    <div class="tc-meta">
                        <span class="tc-pill tc-pill-${statusClass}">${statusLabel}</span>
                        <span class="tc-pill">Key ${def.key || '?'}</span>
                        ${stagePill}
                        <span class="tc-pill">Path Totals ${Number.isFinite(totalA) ? totalA : '--'}g / ${Number.isFinite(totalB) ? totalB : '--'}g</span>
                    </div>
                </header>

                <div class="tc-tabbar" role="tablist" aria-label="Tower intel view">
                    <button type="button" class="tc-tab-btn${activeTab === 'overview' ? ' active' : ''}" data-tab="overview">Overview</button>
                    <button type="button" class="tc-tab-btn${activeTab === 'tiers' ? ' active' : ''}" data-tab="tiers">Tier Matrix</button>
                    <button type="button" class="tc-tab-btn${activeTab === 'unlock' ? ' active' : ''}" data-tab="unlock">Unlock Flow</button>
                </div>

                <section class="tc-tab-panel${activeTab === 'overview' ? ' active' : ''}" data-tab="overview" role="tabpanel">
                    <div class="tc-overview-grid">
                        <article class="tc-overview-block">
                            <div class="tc-overview-title">Combat Profile</div>
                            <p class="tc-overview-copy">${cardDesc}</p>
                            <div class="tc-overview-chips">${overviewChips.map((chip) => `<span>${chip}</span>`).join('')}</div>
                        </article>
                        <article class="tc-overview-block">
                            <div class="tc-overview-title">Path Roles</div>
                            <div class="tc-path-grid">
                                <div class="tc-path-card">
                                    <div class="tc-path-head"><span>Path A</span><strong>${def.pathA && def.pathA.name ? def.pathA.name : 'Alpha'}</strong></div>
                                    <p>${pathADesc || 'No path notes available.'}</p>
                                    <div class="tc-path-cost">Full Route: ${Number.isFinite(totalA) ? `${Math.floor(totalA)}g` : '--'}</div>
                                </div>
                                <div class="tc-path-card">
                                    <div class="tc-path-head"><span>Path B</span><strong>${def.pathB && def.pathB.name ? def.pathB.name : 'Beta'}</strong></div>
                                    <p>${pathBDesc || 'No path notes available.'}</p>
                                    <div class="tc-path-cost">Full Route: ${Number.isFinite(totalB) ? `${Math.floor(totalB)}g` : '--'}</div>
                                </div>
                            </div>
                        </article>
                    </div>
                </section>

                <section class="tc-tab-panel${activeTab === 'tiers' ? ' active' : ''}" data-tab="tiers" role="tabpanel">
                    <div class="tc-tier-grid">
                        <section class="tc-tier-col">
                            <div class="tc-tier-col-title">Core Tiers</div>
                            ${coreCol}
                        </section>
                        <section class="tc-tier-col">
                            <div class="tc-tier-col-title">Path A - ${def.pathA && def.pathA.name ? def.pathA.name : 'Alpha'}</div>
                            <div class="tc-tier-col-sub">${pathADesc}</div>
                            ${pathACol}
                        </section>
                        <section class="tc-tier-col">
                            <div class="tc-tier-col-title">Path B - ${def.pathB && def.pathB.name ? def.pathB.name : 'Beta'}</div>
                            <div class="tc-tier-col-sub">${pathBDesc}</div>
                            ${pathBCol}
                        </section>
                    </div>
                </section>

                <section class="tc-tab-panel${activeTab === 'unlock' ? ' active' : ''}" data-tab="unlock" role="tabpanel">
                    <div class="tc-unlock-summary">${unlockSummary}</div>
                    <div class="tc-license-box">
                        <div class="tc-license-title">Unlock Progression</div>
                        <div class="tc-unlock-metric">${reqMetCount}/${reqRows.length} checks complete</div>
                        <ul class="tc-req-list">${reqLines}${reqMoreLine}</ul>
                    </div>
                </section>
            </article>
        `;
    },

    _buildTowerTierCell(tier, tierData, fallbackCost, fallbackText, options = {}) {
        const compact = !!options.compact;
        if (!tierData) {
            return `
                <div class="tc-tier-cell tc-tier-cell-empty">
                    <div class="tc-tier-row"><span class="tc-tier-label">T${tier}</span><span class="tc-tier-cost">--</span></div>
                    <p class="tc-tier-desc">No data available.</p>
                </div>
            `;
        }

        const cost = Number.isFinite(tierData.cost) ? tierData.cost : fallbackCost;
        const facts = this._collectTierFacts(tierData);
        const desc = tierData.desc || this._summarizeTierSpecial(tierData.special) || fallbackText;
        const visibleFacts = compact ? facts.slice(0, 3) : facts;
        const visibleDesc = compact ? this._truncateText(desc, 84) : desc;

        return `
            <div class="tc-tier-cell">
                <div class="tc-tier-row">
                    <span class="tc-tier-label">T${tier}</span>
                    <span class="tc-tier-cost">${Number.isFinite(cost) ? `${Math.floor(cost)}g` : 'Base'}</span>
                </div>
                <div class="tc-tier-facts">${visibleFacts.map((fact) => `<span>${fact}</span>`).join('')}</div>
                <p class="tc-tier-desc">${visibleDesc}</p>
            </div>
        `;
    },

    _collectTierFacts(tierData) {
        if (!tierData || typeof tierData !== 'object') return [];
        const out = [];
        const special = tierData.special || {};

        if (Number.isFinite(tierData.damage) && tierData.damage > 0) {
            out.push(`${Math.round(tierData.damage)} dmg`);
        } else if (Number.isFinite(special.dps)) {
            out.push(`${Math.round(special.dps)} dps`);
        }

        if (Number.isFinite(tierData.range)) out.push(`${Math.round(tierData.range)} range`);

        if (Number.isFinite(tierData.fireRate)) {
            if (tierData.fireRate > 0) out.push(`${tierData.fireRate.toFixed(2)}s atk`);
            else out.push('beam mode');
        }

        if (Number.isFinite(tierData.splash) && tierData.splash > 0) {
            out.push(`${Math.round(tierData.splash)} splash`);
        }

        if (Number.isFinite(special.critChance)) out.push(`${Math.round(special.critChance * 100)}% crit`);
        if (Number.isFinite(special.slow)) out.push(`${Math.round(special.slow * 100)}% slow`);

        const multi = special.multishot || special.multiShot || special.multiMissile;
        if (Number.isFinite(multi)) out.push(`x${Math.floor(multi)} shots`);

        if (Number.isFinite(special.chains)) out.push(`${Math.floor(special.chains)} chains`);
        if (Number.isFinite(special.burnDPS)) out.push(`${Math.round(special.burnDPS)}/s burn`);
        if (Number.isFinite(special.poisonDPS)) out.push(`${Math.round(special.poisonDPS)}/s poison`);
        if (special.homing) out.push('homing');
        if (special.aura) out.push('aura');

        return out.slice(0, 6);
    },

    _summarizeTierSpecial(special) {
        if (!special || typeof special !== 'object') return '';

        const notes = [];
        if (Number.isFinite(special.critChance)) notes.push(`${Math.round(special.critChance * 100)}% critical chance`);
        if (Number.isFinite(special.critMult)) notes.push(`${special.critMult}x critical damage`);
        if (Number.isFinite(special.slow)) notes.push(`${Math.round(special.slow * 100)}% slow`);
        if (Number.isFinite(special.freezeChance)) notes.push(`${Math.round(special.freezeChance * 100)}% freeze proc`);
        if (Number.isFinite(special.stunChance)) notes.push(`${Math.round(special.stunChance * 100)}% stun chance`);
        if (Number.isFinite(special.chains)) notes.push(`hits ${Math.floor(special.chains)} chained targets`);
        if (special.homing) notes.push('homing projectile tracking');
        if (special.aura) notes.push('persistent aura support field');
        if (Number.isFinite(special.burnDPS)) notes.push(`burning for ${Math.round(special.burnDPS)} damage per second`);
        if (Number.isFinite(special.poisonDPS)) notes.push(`poisoning for ${Math.round(special.poisonDPS)} damage per second`);

        if (notes.length > 0) return notes.slice(0, 3).join(' | ');

        const fallback = Object.entries(special)
            .slice(0, 3)
            .map(([key, value]) => `${this._humanizeTierKey(key)} ${typeof value === 'number' ? (Number.isInteger(value) ? value : value.toFixed(2)) : (value === true ? 'enabled' : String(value))}`);
        return fallback.join(' | ');
    },

    _humanizeTierKey(key) {
        return String(key || '')
            .replace(/([A-Z])/g, ' $1')
            .replace(/_/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();
    },

    _truncateText(text, maxLen) {
        const raw = String(text || '').trim();
        if (!raw || !Number.isFinite(maxLen) || maxLen < 8 || raw.length <= maxLen) return raw;
        return `${raw.slice(0, maxLen - 3).trimEnd()}...`;
    },

    renderHowToPlay() {
        const content = document.getElementById('howtoplay-content');
        const hk = (actionId, fallback) => {
            if (typeof Input !== 'undefined' && typeof Input.getHotkeyLabel === 'function') {
                return Input.getHotkeyLabel(actionId);
            }
            return fallback;
        };
        const abilityHotkeys = [0, 1, 2, 3, 4].map((i) => {
            if (typeof Input !== 'undefined' && typeof Input.getAbilityHotkeyLabel === 'function') {
                return Input.getAbilityHotkeyLabel(i);
            }
            return PLAYER_ABILITIES[i] && PLAYER_ABILITIES[i].key ? PLAYER_ABILITIES[i].key : '?';
        });
        content.innerHTML = `
            <div class="howtoplay-section">
                <h3>OBJECTIVE</h3>
                <p>Enemies march along the path toward your base. Build towers to stop them before they reach the exit. If too many get through, you lose!</p>
            </div>

            <div class="howtoplay-section">
                <h3>PLACING TOWERS</h3>
                <p>Click a tower in the sidebar (or press <span class="key">1-0 - =</span>) then click on a buildable tile. Towers cannot be placed on the path or decorations.</p>
            </div>

            <div class="howtoplay-section">
                <h3>UPGRADING</h3>
                <p>Click a placed tower to see its info panel. Click <span class="key">UPGRADE</span> or press <span class="key">${hk('upgradeTower', 'U')}</span> to upgrade.</p>
            </div>

            <div class="howtoplay-section">
                <h3>DUAL PATH SYSTEM</h3>
                <p>At <b>Tier 3</b>, you must choose between two upgrade paths. This choice is <b>permanent</b>! Each path leads to different Tier 4 and Tier 5 abilities.</p>
                <p><b>Path A</b> typically focuses on single-target power: critical hits, armor penetration, precision damage.</p>
                <p><b>Path B</b> typically focuses on area/utility effects: multi-shot, crowd control, support abilities.</p>
                <p>Read the path descriptions carefully before choosing. You'll see previews of Tier 4 and 5 abilities to help you decide.</p>
            </div>

            <div class="howtoplay-section">
                <h3>TOWER TARGETING</h3>
                <p>Click a tower to change its targeting priority: Closest, Strongest, Weakest, First (nearest to exit), Last, or Fastest. Use <span class="key">Mouse Wheel</span> to cycle modes.</p>
            </div>

            <div class="howtoplay-section">
                <h3>OVERCLOCK</h3>
                <p>Use the tower panel <span class="key">OVERCLOCK</span> action: +50% attack speed for 10 seconds, then disabled for 5 seconds. Save it for heavy pressure waves.</p>
            </div>

            <div class="howtoplay-section">
                <h3>ABILITIES</h3>
                <p>Use <span class="key">${abilityHotkeys.join(' ')}</span> to activate powerful abilities with cooldowns:</p>
                <ul>
                    <li><span class="key">${abilityHotkeys[0]}</span> Air Strike \u2014 AOE damage at cursor</li>
                    <li><span class="key">${abilityHotkeys[1]}</span> Reinforce \u2014 Temporary extra lives</li>
                    <li><span class="key">${abilityHotkeys[2]}</span> Gold Mine \u2014 Instant gold</li>
                    <li><span class="key">${abilityHotkeys[3]}</span> Slow Field \u2014 Slow all enemies</li>
                    <li><span class="key">${abilityHotkeys[4]}</span> Overcharge \u2014 Buff all tower damage</li>
                </ul>
            </div>

            <div class="howtoplay-section">
                <h3>ECONOMY</h3>
                <p>Kill enemies to earn gold. Between waves you earn interest on your gold (5% up to 50g cap). Sell towers for 70% refund. Plan your economy!</p>
            </div>

            <div class="howtoplay-section">
                <h3>SYNERGY ZONES</h3>
                <p>Place 3 towers of the same type in a triangle formation to create powerful synergy zones that affect enemies within the area!</p>
            </div>

            <div class="howtoplay-section">
                <h3>MASTERY</h3>
                <p>Each tower tracks its kills and gains permanent bonuses at 25, 75, 150, 300, and 500 kills. Protect your veteran towers!</p>
            </div>

            <div class="howtoplay-section">
                <h3>RESEARCH</h3>
                <p>Earn Research Points by completing maps. Spend them in the Research Lab \u2014 a visual skill tree with 4 branches: Offense, Defense, Economy, and Knowledge.</p>
            </div>

            <div class="howtoplay-section">
                <h3>CONTROLS</h3>
                <ul>
                    <li><span class="key">${hk('startWave', 'Space')}</span> Start next wave</li>
                    <li><span class="key">1-0 - =</span> Select tower type</li>
                    <li><span class="key">${hk('sellTower', 'S')}</span> Sell selected tower</li>
                    <li><span class="key">${hk('upgradeTower', 'U')}</span> Upgrade selected tower</li>
                    <li><span class="key">${hk('cycleTower', 'Tab')}</span> Cycle through towers</li>
                    <li><span class="key">${hk('toggleRanges', 'G')}</span> Toggle range circles</li>
                    <li><span class="key">Del</span> Sell selected tower</li>
                    <li><span class="key">${hk('pause', 'Esc')}</span> Deselect / Pause</li>
                    <li><span class="key">${hk('speedUp', '+')}/${hk('speedReset', '-')}</span> Game speed</li>
                </ul>
            </div>
        `;
    },

    // ===== HUD VISUAL TOGGLES =====
    _initHudToggles() {
        const sync = () => {
            const s = GameState.settings;
            document.getElementById('tog-ranges').classList.toggle('active', !!s.showRanges);
            document.getElementById('tog-hpbars').classList.toggle('active', s.showHealthBars !== false);
            document.getElementById('tog-dmgnum').classList.toggle('active', s.showDamageNumbers !== false);
        };
        sync();
        document.getElementById('tog-ranges').addEventListener('click', () => {
            GameState.settings.showRanges = !GameState.settings.showRanges;
            sync(); Audio.play('click');
        });
        document.getElementById('tog-hpbars').addEventListener('click', () => {
            GameState.settings.showHealthBars = !GameState.settings.showHealthBars;
            sync(); Audio.play('click');
        });
        document.getElementById('tog-dmgnum').addEventListener('click', () => {
            GameState.settings.showDamageNumbers = !GameState.settings.showDamageNumbers;
            sync(); Audio.play('click');
        });
        // Keep range toggle in sync with hotkey (G)
        this._hudToggleSync = sync;
    },

    // ===== IN-GAME SETTINGS PANEL =====
    _initSettingsPanel() {
        // Build difficulty selector buttons
        const selector = document.getElementById('difficulty-selector');
        if (!selector) return;
        const presets = CONFIG.DIFFICULTY_PRESETS;
        for (const key of Object.keys(presets)) {
            const p = presets[key];
            const btn = document.createElement('button');
            btn.className = 'diff-btn' + (GameState.settings.difficulty === key ? ' active' : '');
            btn.dataset.diff = key;
            btn.style.setProperty('--diff-color', p.color);
            btn.innerHTML = `<span class="diff-name" style="color:${p.color}">${p.name}</span><span class="diff-desc">${p.description}</span>`;
            btn.addEventListener('click', () => {
                // Only allow difficulty change before game starts (wave 0)
                if (GameState.wave > 0) {
                    return;
                }
                GameState.settings.difficulty = key;
                selector.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                SaveSystem.savePersistent();
                Audio.play('click');
            });
            selector.appendChild(btn);
        }

        // In-game slider fill sync helper
        function syncSliderFills(...els) {
            for (const el of els) {
                if (!el) continue;
                const min = parseFloat(el.min) || 0;
                const max = parseFloat(el.max) || 100;
                const pct = ((el.value - min) / (max - min)) * 100;
                el.style.setProperty('--fill', pct + '%');
            }
        }

        // Music volume
        document.getElementById('set-music').addEventListener('input', (e) => {
            const v = e.target.value / 100;
            GameState.settings.musicVolume = v;
            Audio.setMusicVolume(v);
            // Sync main settings screen
            const mainSlider = document.getElementById('music-volume');
            if (mainSlider) mainSlider.value = e.target.value;
            const mainVal = document.getElementById('music-vol-val');
            if (mainVal) mainVal.textContent = e.target.value + '%';
            syncSliderFills(e.target, mainSlider);
        });

        // SFX volume
        document.getElementById('set-sfx').addEventListener('input', (e) => {
            const v = e.target.value / 100;
            GameState.settings.sfxVolume = v;
            Audio.setSfxVolume(v);
            const mainSlider = document.getElementById('sfx-volume');
            if (mainSlider) mainSlider.value = e.target.value;
            const mainVal = document.getElementById('sfx-vol-val');
            if (mainVal) mainVal.textContent = e.target.value + '%';
            syncSliderFills(e.target, mainSlider);
        });

        // Screen shake
        document.getElementById('set-shake').addEventListener('input', (e) => {
            GameState.settings.shakeIntensity = e.target.value / 100;
            const mainSlider = document.getElementById('shake-intensity');
            if (mainSlider) mainSlider.value = e.target.value;
            const mainVal = document.getElementById('shake-val');
            if (mainVal) mainVal.textContent = e.target.value + '%';
            syncSliderFills(e.target, mainSlider);
        });

        // Show ranges
        document.getElementById('set-show-ranges').addEventListener('change', (e) => {
            GameState.settings.showRanges = e.target.checked;
            const mainCheck = document.getElementById('show-ranges');
            if (mainCheck) mainCheck.checked = e.target.checked;
        });

        // Auto-start waves
        document.getElementById('set-auto-start').addEventListener('change', (e) => {
            GameState.settings.autoStart = e.target.checked;
            const mainCheck = document.getElementById('auto-start');
            if (mainCheck) mainCheck.checked = e.target.checked;
        });

        // Show FPS
        document.getElementById('set-show-fps').addEventListener('change', (e) => {
            GameState.showFPS = e.target.checked;
        });
    },

    openSettingsPanel() {
        const panel = document.getElementById('settings-panel');
        if (!panel) return;

        // Sync current values to in-game settings controls
        const s = GameState.settings;
        document.getElementById('set-music').value = Math.round(s.musicVolume * 100);
        document.getElementById('set-sfx').value = Math.round(s.sfxVolume * 100);
        document.getElementById('set-shake').value = Math.round(s.shakeIntensity * 100);
        document.getElementById('set-show-ranges').checked = s.showRanges;
        document.getElementById('set-auto-start').checked = s.autoStart;
        document.getElementById('set-show-fps').checked = GameState.showFPS || false;

        // Update difficulty selector active state
        const selector = document.getElementById('difficulty-selector');
        if (selector) {
            selector.querySelectorAll('.diff-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.diff === s.difficulty);
                // Disable difficulty change if game is mid-wave
                if (GameState.wave > 0) {
                    btn.classList.add('disabled');
                } else {
                    btn.classList.remove('disabled');
                }
            });
        }

        panel.style.display = 'flex';

        // Soft-pause the game while settings are open (without showing pause menu)
        if (GameState.gamePhase === 'playing') {
            this._wasPausedBeforeSettings = false;
            GameState.gamePhase = 'paused';
        } else if (GameState.gamePhase === 'paused') {
            this._wasPausedBeforeSettings = true;
        } else {
            this._wasPausedBeforeSettings = false;
        }
    },

    closeSettingsPanel() {
        const panel = document.getElementById('settings-panel');
        if (!panel) return;
        panel.style.display = 'none';
        SaveSystem.savePersistent();

        // Resume if we soft-paused for settings
        if (!this._wasPausedBeforeSettings && GameState.gamePhase === 'paused') {
            GameState.gamePhase = 'playing';
        }
    },
};

function installLegacyMenuGlobals(globalScope = globalThis) {
    if (!globalScope || typeof globalScope !== 'object') return;
    globalScope.MenuSystem = MenuSystem;
}

installLegacyMenuGlobals(globalThis);

export {
    MenuSystem,
    installLegacyMenuGlobals,
};
