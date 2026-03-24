// ===== MENU SYSTEM — ALL SCREENS =====
const MenuSystem = {
    menuCanvas: null,
    menuCtx: null,
    menuParticles: [],
    menuAnimId: null,
    _hotkeyCaptureAction: null,
    _lastDoctrineSpotlightId: null,
    _doctrineSpotlightAnimTimer: null,
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

    init() {
        // Create animated menu background canvas
        this._initMenuBackground();

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
        document.getElementById('btn-back-howtoplay').addEventListener('click', () => {
            this.showScreen('menu');
            Audio.play('click');
        });
        document.getElementById('btn-back-settings').addEventListener('click', () => {
            SaveSystem.savePersistent();
            this.showScreen('menu');
            Audio.play('click');
        });

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

        // Settings panel close
        document.getElementById('btn-close-settings').addEventListener('click', () => {
            this.closeSettingsPanel();
            Audio.play('click');
        });

        // Settings panel controls
        this._initSettingsPanel();

        document.getElementById('btn-start-wave').addEventListener('click', () => {
            WaveSystem.startWave();
        });

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

        // Settings controls
        document.getElementById('music-volume').addEventListener('input', (e) => {
            const v = e.target.value / 100;
            GameState.settings.musicVolume = v;
            Audio.setMusicVolume(v);
            document.getElementById('music-vol-val').textContent = e.target.value + '%';
        });

        document.getElementById('sfx-volume').addEventListener('input', (e) => {
            const v = e.target.value / 100;
            GameState.settings.sfxVolume = v;
            Audio.setSfxVolume(v);
            document.getElementById('sfx-vol-val').textContent = e.target.value + '%';
        });

        document.getElementById('shake-intensity').addEventListener('input', (e) => {
            GameState.settings.shakeIntensity = e.target.value / 100;
            document.getElementById('shake-val').textContent = e.target.value + '%';
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
        const summaryEl = document.getElementById('doctrine-summary');
        const spotlightEl = document.getElementById('doctrine-spotlight');
        if (!cardsEl || !summaryEl || !spotlightEl) return;

        const mapIndex = Number.isFinite(GameState.pendingMapIndex) ? GameState.pendingMapIndex : GameState.mapIndex;
        const map = MAPS[mapIndex];
        const diffKey = GameState.settings.difficulty || 'normal';
        const diffPreset = CONFIG.DIFFICULTY_PRESETS[diffKey] || CONFIG.DIFFICULTY_PRESETS.normal;
        const challengeCount = Array.isArray(GameState._pendingChallenges) ? GameState._pendingChallenges.length : 0;

        this._doctrineSelectionContext = {
            diffPreset,
            map,
            challengeCount,
        };

        const mapName = map ? map.name : 'Unknown';
        const challengeText = challengeCount > 0 ? `+${challengeCount} active` : 'None';
        summaryEl.innerHTML = `
            <div class="doctrine-summary-head">
                <span class="d-summary-title">Mission Briefing</span>
                <span class="d-summary-note">Weekly uses fixed rules (no doctrine).</span>
            </div>
            <div class="doctrine-summary-grid">
                <div class="d-summary-chip"><span>Map</span><strong>${mapName}</strong></div>
                <div class="d-summary-chip"><span>Difficulty</span><strong>${diffPreset.name}</strong></div>
                <div class="d-summary-chip"><span>Challenges</span><strong>${challengeText}</strong></div>
                <div class="d-summary-chip"><span>Base Start</span><strong>${diffPreset.startingGold}g / ${diffPreset.startingLives} lives</strong></div>
            </div>
        `;

        cardsEl.innerHTML = '';
        const doctrineList = Array.isArray(CONFIG.DOCTRINES) ? CONFIG.DOCTRINES : [];
        if (doctrineList.length === 0) {
            cardsEl.innerHTML = '<div class="doctrine-summary">No doctrines configured.</div>';
            return;
        }

        let selectedId = GameState.pendingDoctrineId;
        if (!selectedId || !doctrineList.some(d => d.id === selectedId)) {
            selectedId = doctrineList[0].id;
            GameState.pendingDoctrineId = selectedId;
        }

        for (let idx = 0; idx < doctrineList.length; idx++) {
            const doctrine = doctrineList[idx];
            const card = document.createElement('div');
            card.className = 'doctrine-card';
            if (doctrine.id === selectedId) card.classList.add('is-selected');
            card.dataset.doctrineId = doctrine.id;
            card.style.background = doctrine.style && doctrine.style.gradient
                ? doctrine.style.gradient
                : 'linear-gradient(135deg, rgba(32,32,62,0.95), rgba(20,20,42,0.92))';
            card.style.setProperty('--doctrine-accent', doctrine.style && doctrine.style.accent ? doctrine.style.accent : '#aab4ff');
            card.style.setProperty('--doctrine-index', String(idx));

            const effects = doctrine.effects || {};
            const projectedGold = Math.max(0, Math.floor(diffPreset.startingGold + (effects.startGold || 0)));
            const projectedLives = Math.max(1, Math.floor(diffPreset.startingLives + (effects.startLives || 0)));

            const tags = [];
            if ((effects.startLives || 0) > 0) tags.push('DEFENSE');
            if ((effects.startGold || 0) < 0) tags.push('LOW SUPPLY');
            if ((effects.interestRateDelta || 0) > 0 || (effects.interestCapDelta || 0) > 0) tags.push('ECON');
            if ((effects.abilityCooldownMult || 1) < 1) tags.push('ABILITY');
            if ((effects.eliteBossDamageMult || 1) > 1) tags.push('BOSS');
            if ((effects.globalDamageMult || 1) < 1) tags.push('RISK');
            if (tags.length === 0) tags.push('BALANCED');
            const tagMarkup = tags.slice(0, 3)
                .map((tag) => `<span class="doctrine-tag">${tag}</span>`)
                .join('');

            const codeName = doctrine.id ? doctrine.id.replace(/_/g, '-').toUpperCase() : 'UNKNOWN';
            const selectedLabel = doctrine.id === selectedId ? 'SELECTED' : 'SELECT';

            card.innerHTML = `
                <div class="doctrine-card-head">
                    <div class="doctrine-icon">${doctrine.icon || ''}</div>
                    <div class="doctrine-title-wrap">
                        <div class="doctrine-name">${doctrine.name}</div>
                        <div class="doctrine-short">Code: ${codeName}</div>
                    </div>
                    <div class="doctrine-select-indicator">${selectedLabel}</div>
                </div>
                <div class="doctrine-summary-text">${doctrine.summary || ''}</div>
                <div class="doctrine-tag-row">${tagMarkup}</div>
                <div class="doctrine-start-stats">
                    <div class="d-start-stat">
                        <span class="d-start-label">Start Gold</span>
                        <span class="d-start-value">${projectedGold}g</span>
                    </div>
                    <div class="d-start-stat">
                        <span class="d-start-label">Start Lives</span>
                        <span class="d-start-value">${projectedLives}</span>
                    </div>
                </div>
                <div class="doctrine-effects">
                    <div class="doctrine-effect bonus">BONUS: ${doctrine.bonusText || 'None'}</div>
                    <div class="doctrine-effect drawback">DRAWBACK: ${doctrine.drawbackText || 'None'}</div>
                </div>
            `;

            card.addEventListener('click', () => {
                this._selectDoctrineInView(doctrine.id);
                Audio.play('click');
            });

            cardsEl.appendChild(card);
        }

        this._selectDoctrineInView(selectedId, { fromRender: true });
    },

    _updateDoctrineStartButton(doctrineId) {
        const startBtn = document.getElementById('btn-doctrine-start');
        if (!startBtn) return;

        const selectedDoctrine = this._getDoctrineById(doctrineId);
        const shortName = selectedDoctrine && typeof selectedDoctrine.name === 'string'
            ? selectedDoctrine.name.replace(/\s+Doctrine$/i, '').toUpperCase()
            : '';
        startBtn.textContent = shortName ? `START RUN (${shortName})` : 'START RUN';
    },

    _setDoctrineSelectedCardState(doctrineId) {
        const cards = document.querySelectorAll('.doctrine-card');
        cards.forEach((card) => {
            const isSelected = card.dataset.doctrineId === doctrineId;
            card.classList.toggle('is-selected', isSelected);
            const indicator = card.querySelector('.doctrine-select-indicator');
            if (indicator) indicator.textContent = isSelected ? 'SELECTED' : 'SELECT';
        });
    },

    _selectDoctrineInView(doctrineId, options = {}) {
        const doctrine = this._getDoctrineById(doctrineId);
        if (!doctrine) return;

        const prevDoctrineId = GameState.pendingDoctrineId;
        GameState.pendingDoctrineId = doctrine.id;
        this._setDoctrineSelectedCardState(doctrine.id);
        this._updateDoctrineStartButton(doctrine.id);

        const ctx = this._doctrineSelectionContext || {};
        this._renderDoctrineSpotlight(doctrine, ctx.diffPreset, ctx.map, ctx.challengeCount);

        if (options.fromRender) {
            this._lastDoctrineSpotlightId = doctrine.id;
        } else if (prevDoctrineId === doctrine.id) {
            return;
        }
    },

    _renderDoctrineSpotlight(doctrine, diffPreset, map, challengeCount) {
        const spotlightEl = document.getElementById('doctrine-spotlight');
        const nameEl = document.getElementById('doctrine-spotlight-name');
        const codeEl = document.getElementById('doctrine-spotlight-code');
        const emblemEl = document.getElementById('doctrine-spotlight-emblem');
        const summaryEl = document.getElementById('doctrine-spotlight-summary');
        const bonusEl = document.getElementById('doctrine-spotlight-bonus');
        const drawbackEl = document.getElementById('doctrine-spotlight-drawback');
        const metricsEl = document.getElementById('doctrine-spotlight-metrics');
        if (!spotlightEl || !nameEl || !codeEl || !emblemEl || !summaryEl || !bonusEl || !drawbackEl || !metricsEl) return;

        const doctrineId = doctrine && doctrine.id ? doctrine.id : 'none';
        const shouldAnimate = this._lastDoctrineSpotlightId !== null && this._lastDoctrineSpotlightId !== doctrineId;
        spotlightEl.dataset.doctrine = doctrineId;
        spotlightEl.style.setProperty('--spot-accent', doctrine.style && doctrine.style.accent ? doctrine.style.accent : '#90a2ff');
        spotlightEl.style.setProperty('--spot-gradient', doctrine.style && doctrine.style.gradient
            ? doctrine.style.gradient
            : 'linear-gradient(135deg, rgba(28, 34, 86, 0.95), rgba(18, 22, 58, 0.94))');

        const codeName = doctrineId.replace(/_/g, '-').toUpperCase();
        nameEl.textContent = doctrine.name || 'Doctrine';
        codeEl.textContent = `Code: ${codeName}`;
        emblemEl.textContent = doctrine.icon || '?';
        summaryEl.textContent = doctrine.summary || '';
        bonusEl.textContent = `BONUS: ${doctrine.bonusText || 'None'}`;
        drawbackEl.textContent = `DRAWBACK: ${doctrine.drawbackText || 'None'}`;

        const effects = doctrine.effects || {};
        const projectedGold = Math.max(0, Math.floor((diffPreset && diffPreset.startingGold ? diffPreset.startingGold : 0) + (effects.startGold || 0)));
        const projectedLives = Math.max(1, Math.floor((diffPreset && diffPreset.startingLives ? diffPreset.startingLives : 1) + (effects.startLives || 0)));

        const metrics = [];
        metrics.push({
            label: 'Projected Start',
            value: `${projectedGold}g / ${projectedLives} lives`,
        });

        if (Number.isFinite(effects.interestRateDelta) && effects.interestRateDelta !== 0) {
            const ratePct = (effects.interestRateDelta * 100).toFixed(1).replace(/\.0$/, '');
            metrics.push({
                label: 'Interest Rate',
                value: `${effects.interestRateDelta > 0 ? '+' : ''}${ratePct}%`,
            });
        }

        if (Number.isFinite(effects.interestCapDelta) && effects.interestCapDelta !== 0) {
            metrics.push({
                label: 'Interest Cap',
                value: `${effects.interestCapDelta > 0 ? '+' : ''}${Math.floor(effects.interestCapDelta)}`,
            });
        }

        if (Number.isFinite(effects.abilityCooldownMult) && effects.abilityCooldownMult !== 1) {
            metrics.push({
                label: 'Ability Cooldown',
                value: `x${effects.abilityCooldownMult.toFixed(2)}`,
            });
        }

        if (Number.isFinite(effects.globalDamageMult) && effects.globalDamageMult !== 1) {
            metrics.push({
                label: 'Global Damage',
                value: `x${effects.globalDamageMult.toFixed(2)}`,
            });
        }

        if (Number.isFinite(effects.eliteBossDamageMult) && effects.eliteBossDamageMult !== 1) {
            metrics.push({
                label: 'Elite/Boss Damage',
                value: `x${effects.eliteBossDamageMult.toFixed(2)}`,
            });
        }

        metrics.push({
            label: 'Mission Context',
            value: `${map && map.name ? map.name : 'Unknown'} | ${diffPreset && diffPreset.name ? diffPreset.name : 'Unknown'}`,
        });

        metrics.push({
            label: 'Challenge Pack',
            value: challengeCount > 0 ? `+${challengeCount} active` : 'None active',
        });

        metricsEl.innerHTML = metrics
            .map((item) => `<div class="d-metric-row"><span>${item.label}</span><strong>${item.value}</strong></div>`)
            .join('');

        if (shouldAnimate) {
            spotlightEl.classList.remove('is-switching');
            spotlightEl.offsetWidth;
            spotlightEl.classList.add('is-switching');
            if (this._doctrineSpotlightAnimTimer) clearTimeout(this._doctrineSpotlightAnimTimer);
            this._doctrineSpotlightAnimTimer = setTimeout(() => {
                spotlightEl.classList.remove('is-switching');
                this._doctrineSpotlightAnimTimer = null;
            }, 520);
        }

        this._lastDoctrineSpotlightId = doctrineId;
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

        panel.innerHTML = `
            <div class="mmp-title">COMMAND RECORD</div>
            <div class="mmp-row"><span>Best Endless Depth</span><span class="mmp-value">+${bestDepthOverall}</span></div>
            <div class="mmp-row"><span>Milestones Claimed</span><span class="mmp-value">${endlessMilestones}</span></div>
            <div class="mmp-row"><span>Weekly Best (${weekly.spec.weekId})</span><span class="mmp-value">${weeklyBest}</span></div>
            <div class="mmp-row"><span>Challenge Streak</span><span class="mmp-value">${challengeStreak}</span></div>
            <div class="mmp-row"><span>Best Challenge Streak</span><span class="mmp-value">${bestChallengeStreak}</span></div>
        `;
    },

    showScreen(screen) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));

        if (screen !== 'settings') {
            this._cancelHotkeyCapture();
        }

        GameState.screen = screen;

        if (screen !== 'doctrine') {
            this._lastDoctrineSpotlightId = null;
            if (this._doctrineSpotlightAnimTimer) {
                clearTimeout(this._doctrineSpotlightAnimTimer);
                this._doctrineSpotlightAnimTimer = null;
            }
            const spotlight = document.getElementById('doctrine-spotlight');
            if (spotlight) spotlight.classList.remove('is-switching');
        }

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
            case 'howtoplay':
                document.getElementById('howtoplay-screen').classList.add('active');
                break;
            case 'settings':
                document.getElementById('settings-screen').classList.add('active');
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
                bossAbilities: ['Summon Minions', 'Regenerate', 'Slow'],
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
                bossAbilities: ['High Armor', 'Stomp', 'Enrage'],
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
                bossAbilities: ['Fire Trail', 'Summon Berserkers', 'Enrage'],
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
                bossAbilities: ['Teleport', 'Shield', 'Mass Summon', 'Time Warp'],
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

            const threatScore = Math.round((p.enemyHpMult * 0.62 + p.enemySpeedMult * 0.38) * 100);
            const economyScore = Math.round((p.startingGold / Math.max(1, baseline.startingGold)) * 100);
            const survivalScore = Math.round((p.startingLives / Math.max(1, baseline.startingLives)) * 100);

            const threatFill = clampPct((threatScore / 210) * 100);
            const economyFill = clampPct((economyScore / 130) * 100);
            const survivalFill = clampPct((survivalScore / 130) * 100);

            const card = document.createElement('div');
            card.className = `diff-card diff-card-${key}`;
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
                <div class="diff-card-cta"><span>DEPLOY TO THIS THEATER</span><em>ENTER</em></div>
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
                icon: '\u{1F9E0}',
                doctrine: 'Training lanes reward clean tower fundamentals.',
                tags: ['ONBOARDING', 'LOW SWARM', 'ECON BOOST'],
            },
            normal: {
                boss: 'Stone Colossus',
                icon: '\u{1FAA8}',
                doctrine: 'Balanced fronts favor adaptive targeting and tempo.',
                tags: ['STANDARD LINE', 'ARMOR MIX', 'MID SPIKE'],
            },
            hard: {
                boss: 'Infernal Lord',
                icon: '\u{1F525}',
                doctrine: 'Aggressive waves punish slow setup and weak lanes.',
                tags: ['BURST ARC', 'STEALTH THREATS', 'MICRO TEST'],
            },
            nightmare: {
                boss: 'Void Emperor',
                icon: '\u{1F480}',
                doctrine: 'Endgame doctrine checks with sustained pressure loops.',
                tags: ['ELITE DENSITY', 'DOUBLE MOD', 'NO MISTAKES'],
            },
        };

        // Enemy pools per difficulty
        const diffEnemies = {
            easy:      [
                { name: 'Grunt', color: ENEMIES.basic.color },
                { name: 'Scout', color: ENEMIES.fast.color },
                { name: 'Swarmling', color: ENEMIES.swarm.color },
                { name: 'Medic', color: ENEMIES.healer.color },
                { name: 'Overlord', color: ENEMIES.boss.color },
            ],
            normal:    [
                { name: 'Grunt', color: ENEMIES.basic.color },
                { name: 'Brute', color: ENEMIES.heavy.color },
                { name: 'Guardian', color: ENEMIES.shield.color },
                { name: 'Medic', color: ENEMIES.healer.color },
                { name: 'Splitter', color: ENEMIES.splitter.color },
                { name: 'Overlord', color: ENEMIES.boss.color },
            ],
            hard:      [
                { name: 'Shadow', color: ENEMIES.stealth.color },
                { name: 'Phantom', color: ENEMIES.ghost.color },
                { name: 'Berserker', color: ENEMIES.berserker.color },
                { name: 'Brute', color: ENEMIES.heavy.color },
                { name: 'Buzzer', color: ENEMIES.swarmfast.color },
                { name: 'Overlord', color: ENEMIES.boss.color },
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
            progressEl.textContent = `${completed}/${total} COMPLETED`;
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
                bestHTML = `<div class="map-best locked-note">Clear previous sector</div>`;
            } else {
                bestHTML = `<div class="map-best pending-note">No clear record</div>`;
            }

            bodyDiv.innerHTML = `
                <div class="map-card-top">
                    <div class="map-name">${map.name}</div>
                    <div class="map-difficulty">${starsHTML}</div>
                </div>
                <div class="map-desc">${map.desc}</div>
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
            <h3>OBJECTIVE</h3>
            <p>Enemies march along the path toward your base. Build towers to stop them before they reach the exit. If too many get through, you lose!</p>

            <h3>PLACING TOWERS</h3>
            <p>Click a tower in the sidebar (or press <span class="key">1-8</span>) then click on a buildable tile. Towers cannot be placed on the path or decorations.</p>

            <h3>UPGRADING</h3>
            <p>Click a placed tower to see its info panel. Click <span class="key">UPGRADE</span> or press <span class="key">${hk('upgradeTower', 'U')}</span> to upgrade.</p>

            <h3>DUAL PATH SYSTEM</h3>
            <p>At <b>Tier 3</b>, you must choose between two upgrade paths. This choice is <b>permanent</b>! Each path leads to different Tier 4 and Tier 5 abilities.</p>
            <p><b>Path A</b> typically focuses on single-target power: critical hits, armor penetration, precision damage.</p>
            <p><b>Path B</b> typically focuses on area/utility effects: multi-shot, crowd control, support abilities.</p>
            <p>Read the path descriptions carefully before choosing. You'll see previews of Tier 4 and 5 abilities to help you decide.</p>

            <h3>TOWER TARGETING</h3>
            <p>Click a tower to change its targeting priority: Closest, Strongest, Weakest, First (nearest to exit), Last, or Fastest. Use <span class="key">Mouse Wheel</span> to cycle modes.</p>

            <h3>OVERCLOCK</h3>
            <p>Use the tower panel <span class="key">OVERCLOCK</span> action: +50% attack speed for 10 seconds, then disabled for 5 seconds. Save it for heavy pressure waves.</p>

            <h3>ABILITIES</h3>
            <p>Use <span class="key">${abilityHotkeys.join(' ')}</span> to activate powerful abilities with cooldowns:</p>
            <p><span class="key">${abilityHotkeys[0]}</span> Air Strike \u2014 AOE damage at cursor<br>
               <span class="key">${abilityHotkeys[1]}</span> Reinforce \u2014 Temporary extra lives<br>
               <span class="key">${abilityHotkeys[2]}</span> Gold Mine \u2014 Instant gold<br>
               <span class="key">${abilityHotkeys[3]}</span> Slow Field \u2014 Slow all enemies<br>
               <span class="key">${abilityHotkeys[4]}</span> Overcharge \u2014 Buff all tower damage</p>

            <h3>ECONOMY</h3>
            <p>Kill enemies to earn gold. Between waves you earn interest on your gold (5% up to 50g cap). Sell towers for 70% refund. Plan your economy!</p>

            <h3>SYNERGY ZONES</h3>
            <p>Place 3 towers of the same type in a triangle formation to create powerful synergy zones that affect enemies within the area!</p>

            <h3>MASTERY</h3>
            <p>Each tower tracks its kills and gains permanent bonuses at 25, 75, 150, 300, and 500 kills. Protect your veteran towers!</p>

            <h3>RESEARCH</h3>
            <p>Earn Research Points by completing maps. Spend them in the Research Lab \u2014 a visual skill tree with 4 branches: Offense, Defense, Economy, and Knowledge.</p>

            <h3>CONTROLS</h3>
            <p><span class="key">${hk('startWave', 'Space')}</span> Start next wave<br>
               <span class="key">1-8</span> Select tower type<br>
               <span class="key">${hk('sellTower', 'S')}</span> Sell selected tower<br>
               <span class="key">${hk('upgradeTower', 'U')}</span> Upgrade selected tower<br>
               <span class="key">${hk('cycleTower', 'Tab')}</span> Cycle through towers<br>
               <span class="key">${hk('toggleRanges', 'G')}</span> Toggle range circles<br>
               <span class="key">Del</span> Sell selected tower<br>
               <span class="key">${hk('pause', 'Esc')}</span> Deselect / Pause<br>
               <span class="key">${hk('speedUp', '+')}/${hk('speedReset', '-')}</span> Game speed</p>
        `;
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
        });

        // Screen shake
        document.getElementById('set-shake').addEventListener('input', (e) => {
            GameState.settings.shakeIntensity = e.target.value / 100;
            const mainSlider = document.getElementById('shake-intensity');
            if (mainSlider) mainSlider.value = e.target.value;
            const mainVal = document.getElementById('shake-val');
            if (mainVal) mainVal.textContent = e.target.value + '%';
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
