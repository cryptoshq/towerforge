// ===== WEB AUDIO MANAGER WITH BRIGHT AMBIENT NATURE MUSIC =====
const Audio = {
    ctx: null,
    masterGain: null,
    sfxGain: null,
    musicGain: null,
    musicPlaying: false,
    _userActivated: false,
    _pendingMusicStart: false,
    musicNodes: [],
    currentChord: 0,
    _menuAnalyser: null,
    _menuFreqData: null,
    _menuReactiveSmooth: 0,

    // Sound pooling
    _soundPool: {},
    _poolSize: 5,
    _poolIndex: {},

    // Positional audio state
    _cameraX: 0,
    _cameraY: 0,
    _canvasW: 1200,
    _canvasH: 720,
    _positionalEnabled: true,

    // Dynamic music layer state
    _musicIntensity: 0,     // 0 = calm, 1 = max intensity
    _intensityTarget: 0,
    _intensitySmoothSpeed: 0.5,

    // Music transition / crossfade
    _currentMusicType: 'ambient', // ambient, combat, boss
    _crossfadeDuration: 2.0,

    // Ambient soundscapes
    _ambientLoop: null,
    _ambientGain: null,
    _ambientType: 'none',

    // Boss music
    _bossActive: false,
    _bossGain: null,
    _bossNodes: [],
    _bossBeatTimer: 0,

    // Pause filter
    _pauseFilter: null,
    _isPaused: false,

    // Volume ducking
    _duckGain: null,
    _duckTarget: 1.0,
    _isDucking: false,
    _duckTimer: 0,

    // ===== BRIGHT AMBIENT CHORD PROGRESSIONS =====
    // Warm, major key, meditative feel
    chords: [
        [261.63, 329.63, 392.00],           // C major
        [293.66, 392.00, 493.88],           // G/D (bright inversion)
        [349.23, 440.00, 523.25],           // F major
        [261.63, 329.63, 392.00, 493.88],   // Cmaj7 (warm, dreamy)
        [293.66, 369.99, 440.00],           // D major (bright lift)
        [329.63, 415.30, 493.88],           // E major (sunshine)
        [349.23, 440.00, 523.25],           // F major
        [392.00, 493.88, 587.33],           // G major (resolve)
    ],

    // Combat: still major, more motion/energy
    combatChords: [
        [261.63, 329.63, 392.00],           // C major
        [349.23, 440.00, 523.25],           // F major
        [392.00, 493.88, 587.33],           // G major
        [440.00, 523.25, 659.25],           // Am (adds gentle tension)
        [261.63, 329.63, 392.00, 493.88],   // Cmaj7
        [349.23, 440.00, 523.25, 659.25],   // Fmaj7 (warm energy)
        [392.00, 493.88, 587.33],           // G major
        [329.63, 392.00, 493.88],           // Em (gentle momentum)
    ],

    // Boss: epic adventure, heroic, mostly major
    bossChords: [
        [261.63, 329.63, 392.00, 523.25],   // C major (full, powerful)
        [349.23, 440.00, 523.25, 698.46],   // F major (wide voicing)
        [392.00, 493.88, 587.33, 783.99],   // G major (heroic)
        [329.63, 415.30, 493.88, 659.25],   // E major (triumphant)
        [261.63, 329.63, 392.00, 523.25],   // C major
        [293.66, 369.99, 440.00, 587.33],   // D major (epic lift)
        [349.23, 440.00, 523.25],           // F major
        [392.00, 493.88, 587.33, 783.99],   // G major (resolve)
    ],

    // Pentatonic melody notes for gentle arpeggios (C major pentatonic, octave 5)
    melodyNotes: [523.25, 587.33, 659.25, 783.99, 880.00],

    // Bird sound system state
    _birdTimers: [],
    _birdActive: false,
    _birdGain: null,

    // Nature wind pad state
    _naturePadNode: null,
    _naturePadGain: null,
    _naturePadActive: false,

    // Wind chime state
    _chimeTimer: null,
    _chimeActive: false,
    _chimeGain: null,

    // Sound variation tables for different sounds
    _pitchVariation: {
        arrow: 0.15,
        hit: 0.2,
        death: 0.1,
        explosion: 0.12,
        ice: 0.08,
        lightning: 0.15,
        cannon: 0.1,
    },

    _volumeVariation: {
        arrow: 0.15,
        hit: 0.2,
        death: 0.1,
        explosion: 0.08,
        ice: 0.1,
        lightning: 0.1,
        cannon: 0.1,
    },

    // SFX spam-control/mix stability state
    _sfxLimiterState: {},
    _sfxCategoryState: {},
    _sfxTypeCategory: {
        arrow: 'weapon',
        cannon: 'weapon',
        ice: 'weapon',
        lightning: 'weapon',
        sniper: 'weapon',
        laser: 'weapon',
        missile: 'weapon',
        hit: 'impact',
        explosion: 'impact',
        death: 'impact',
        leak: 'alert',
        boss: 'alert',
        ability: 'alert',
        wave_start: 'alert',
        wave_complete: 'alert',
        powerup: 'ui',
        achievement: 'ui',
        click: 'ui',
        hover: 'ui',
        place: 'ui',
        sell: 'ui',
        upgrade: 'ui',
    },
    _sfxCategoryPolicy: {
        weapon: { maxVoices: 10 },
        impact: { maxVoices: 9 },
        alert: { maxVoices: 6 },
        ui: { maxVoices: 5 },
        normal: { maxVoices: 8 },
    },
    _sfxPolicy: {
        // High-frequency combat sounds
        arrow:     { minInterval: 0.024, burstWindow: 0.24, softCap: 6, hardCap: 14, maxVoices: 6, voiceDuration: 0.08,  priority: 'combat' },
        hit:       { minInterval: 0.020, burstWindow: 0.20, softCap: 7, hardCap: 16, maxVoices: 7, voiceDuration: 0.06, priority: 'combat' },
        lightning: { minInterval: 0.032, burstWindow: 0.28, softCap: 4, hardCap: 10, maxVoices: 4, voiceDuration: 0.10, priority: 'combat' },
        cannon:    { minInterval: 0.065, burstWindow: 0.30, softCap: 3, hardCap: 6,  maxVoices: 3, voiceDuration: 0.24, priority: 'impact' },
        explosion: { minInterval: 0.078, burstWindow: 0.35, softCap: 3, hardCap: 6,  maxVoices: 3, voiceDuration: 0.35, priority: 'impact' },
        laser:     { minInterval: 0.050, burstWindow: 0.25, softCap: 3, hardCap: 8,  maxVoices: 3, voiceDuration: 0.18, priority: 'combat' },
        missile:   { minInterval: 0.065, burstWindow: 0.35, softCap: 4, hardCap: 8,  maxVoices: 4, voiceDuration: 0.30, priority: 'impact' },

        // Important but should still remain audible
        leak:      { minInterval: 0.080, burstWindow: 0.40, softCap: 2, hardCap: 4,  maxVoices: 2, voiceDuration: 0.30, priority: 'critical' },
        boss:      { minInterval: 0.150, burstWindow: 0.60, softCap: 1, hardCap: 2,  maxVoices: 2, voiceDuration: 0.60, priority: 'critical' },
        ability:   { minInterval: 0.050, burstWindow: 0.35, softCap: 4, hardCap: 10, maxVoices: 5, voiceDuration: 0.24, priority: 'critical' },
        achievement: { minInterval: 0.120, burstWindow: 0.80, softCap: 1, hardCap: 2, maxVoices: 2, voiceDuration: 0.35, priority: 'critical' },
        wave_complete: { minInterval: 0.200, burstWindow: 1.0, softCap: 1, hardCap: 1, maxVoices: 1, voiceDuration: 0.40, priority: 'critical' },
        wave_start: { minInterval: 0.200, burstWindow: 1.0, softCap: 1, hardCap: 1, maxVoices: 1, voiceDuration: 0.40, priority: 'critical' },
    },

    init() {
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();

            // Create pause low-pass filter (inserted before destination)
            this._pauseFilter = this.ctx.createBiquadFilter();
            this._pauseFilter.type = 'lowpass';
            this._pauseFilter.frequency.value = 20000; // fully open by default
            this._pauseFilter.Q.value = 0.5;
            this._pauseFilter.connect(this.ctx.destination);

            // Create duck gain node (inserted between master and pause filter)
            this._duckGain = this.ctx.createGain();
            this._duckGain.gain.value = 1.0;
            this._duckGain.connect(this._pauseFilter);

            this.masterGain.connect(this._duckGain);

            this.sfxGain = this.ctx.createGain();
            this.sfxGain.connect(this.masterGain);
            this.sfxGain.gain.value = GameState.settings.sfxVolume;

            this.musicGain = this.ctx.createGain();
            this.musicGain.connect(this.masterGain);
            this.musicGain.gain.value = GameState.settings.musicVolume;

            // Menu visualizer analyser (read-only side chain, no audible output)
            this._menuAnalyser = this.ctx.createAnalyser();
            this._menuAnalyser.fftSize = 256;
            this._menuAnalyser.smoothingTimeConstant = 0.72;
            this._menuFreqData = new Uint8Array(this._menuAnalyser.frequencyBinCount);
            this.masterGain.connect(this._menuAnalyser);

            // Boss music gain (connects to master)
            this._bossGain = this.ctx.createGain();
            this._bossGain.connect(this.masterGain);
            this._bossGain.gain.value = 0;

            // Ambient soundscape gain
            this._ambientGain = this.ctx.createGain();
            this._ambientGain.connect(this.masterGain);
            this._ambientGain.gain.value = 0;

            // Bird chirp gain (separate layer for bird ambience)
            this._birdGain = this.ctx.createGain();
            this._birdGain.connect(this.masterGain);
            this._birdGain.gain.value = 0;

            // Nature wind pad gain
            this._naturePadGain = this.ctx.createGain();
            this._naturePadGain.connect(this.masterGain);
            this._naturePadGain.gain.value = 0;

            // Wind chime gain
            this._chimeGain = this.ctx.createGain();
            this._chimeGain.connect(this.masterGain);
            this._chimeGain.gain.value = 0;

            // Initialize sound pools for frequently used sounds
            this._initSoundPools();

        } catch (e) {
            console.warn('Web Audio not available');
        }
    },

    resume() {
        if (!this.ctx || !this._userActivated) return;
        if (this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
    },

    unlockFromGesture() {
        this._userActivated = true;
        this.resume();

        if (this._pendingMusicStart && !this.musicPlaying) {
            this._pendingMusicStart = false;
            this.startMusic();
        }
    },

    setSfxVolume(v) {
        if (this.sfxGain) this.sfxGain.gain.value = v;
    },

    setMusicVolume(v) {
        if (this.musicGain) this.musicGain.gain.value = v;
        if (this._bossGain) this._bossGain.gain.value = this._bossActive ? v * 0.5 : 0;
        if (this._ambientGain) this._ambientGain.gain.value = v * 0.3;
        if (this._birdGain) this._birdGain.gain.value = this._birdActive ? v * 0.3 : 0;
        if (this._naturePadGain) this._naturePadGain.gain.value = this._naturePadActive ? v * 0.15 : 0;
        if (this._chimeGain) this._chimeGain.gain.value = this._chimeActive ? v * 0.12 : 0;
    },

    getMenuReactiveData() {
        const now = (typeof performance !== 'undefined' && performance.now)
            ? performance.now() * 0.001
            : Date.now() * 0.001;

        if (!this.ctx || !this._menuAnalyser || !this._menuFreqData || this.ctx.state !== 'running') {
            const idlePulse = 0.09 + Math.sin(now * 0.9) * 0.03;
            const musicBias = this.musicPlaying ? (0.08 + this._musicIntensity * 0.24) : 0;
            const target = Math.max(0, Math.min(1, idlePulse + musicBias));
            this._menuReactiveSmooth += (target - this._menuReactiveSmooth) * 0.14;
            const low = Math.max(0, Math.min(1, target * 0.95));
            const mid = Math.max(0, Math.min(1, target * 0.75));
            const high = Math.max(0, Math.min(1, target * 0.55));
            return {
                level: this._menuReactiveSmooth,
                low,
                mid,
                high,
            };
        }

        this._menuAnalyser.getByteFrequencyData(this._menuFreqData);
        const bins = this._menuFreqData;
        const len = bins.length;

        const avgBand = (startNorm, endNorm) => {
            const start = Math.max(0, Math.floor(len * startNorm));
            const end = Math.max(start + 1, Math.min(len, Math.floor(len * endNorm)));
            let sum = 0;
            for (let i = start; i < end; i++) sum += bins[i];
            return (sum / (end - start)) / 255;
        };

        const low = avgBand(0.01, 0.12);
        const mid = avgBand(0.12, 0.4);
        const high = avgBand(0.4, 0.9);

        const weighted = low * 0.48 + mid * 0.34 + high * 0.18;
        const intensityBias = this.musicPlaying ? (0.06 + this._musicIntensity * 0.18) : 0;
        const target = Math.max(0, Math.min(1, weighted * 1.45 + intensityBias));

        this._menuReactiveSmooth += (target - this._menuReactiveSmooth) * 0.24;

        return {
            level: this._menuReactiveSmooth,
            low,
            mid,
            high,
        };
    },

    // ===== SOUND POOLING =====
    _initSoundPools() {
        // Pre-create noise buffers for frequently used sound types
        const poolTypes = ['arrow', 'hit', 'cannon', 'explosion', 'ice', 'lightning'];
        for (const type of poolTypes) {
            this._soundPool[type] = [];
            this._poolIndex[type] = 0;
            for (let i = 0; i < this._poolSize; i++) {
                this._soundPool[type].push(this._createNoiseBuffer(0.3));
            }
        }
    },

    _createNoiseBuffer(duration) {
        if (!this.ctx) return null;
        const bufferSize = Math.floor(this.ctx.sampleRate * duration);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        return buffer;
    },

    _getPooledNoise(type) {
        if (!this._soundPool[type] || this._soundPool[type].length === 0) {
            return this._createNoiseBuffer(0.3);
        }
        const idx = this._poolIndex[type] % this._soundPool[type].length;
        this._poolIndex[type]++;
        return this._soundPool[type][idx];
    },

    // ===== POSITIONAL AUDIO =====
    setCameraPosition(x, y, canvasW, canvasH) {
        this._cameraX = x;
        this._cameraY = y;
        this._canvasW = canvasW || 1200;
        this._canvasH = canvasH || 720;
    },

    _getPositionalVolume(x, y) {
        if (!this._positionalEnabled || x === undefined || y === undefined) return 1.0;
        const centerX = this._cameraX + this._canvasW / 2;
        const centerY = this._cameraY + this._canvasH / 2;
        const dx = x - centerX;
        const dy = y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = Math.sqrt(this._canvasW * this._canvasW + this._canvasH * this._canvasH) / 2;
        return Math.max(0.3, 1.0 - (dist / maxDist) * 0.7);
    },

    _getPositionalPan(x) {
        if (!this._positionalEnabled || x === undefined) return 0;
        const centerX = this._cameraX + this._canvasW / 2;
        const pan = (x - centerX) / (this._canvasW / 2);
        return Math.max(-1, Math.min(1, pan * 0.5));
    },

    // ===== SOUND VARIATION =====
    _applyVariation(type, baseVolume) {
        const pitchVar = this._pitchVariation[type] || 0;
        const volVar = this._volumeVariation[type] || 0;
        return {
            pitchMult: 1.0 + (Math.random() - 0.5) * 2 * pitchVar,
            volumeMult: 1.0 + (Math.random() - 0.5) * 2 * volVar,
        };
    },

    _getSfxPolicy(type) {
        return this._sfxPolicy[type] || {
            minInterval: 0,
            burstWindow: 0.25,
            softCap: 8,
            hardCap: 18,
            maxVoices: 8,
            voiceDuration: 0.2,
            priority: 'normal',
        };
    },

    _getSfxLimiterState(type) {
        if (!this._sfxLimiterState[type]) {
            this._sfxLimiterState[type] = {
                lastPlay: -Infinity,
                recent: [],
                activeVoices: [],
            };
        }
        return this._sfxLimiterState[type];
    },

    _getSfxCategoryState(category) {
        if (!this._sfxCategoryState[category]) {
            this._sfxCategoryState[category] = {
                activeVoices: [],
            };
        }
        return this._sfxCategoryState[category];
    },

    _applySfxLimiter(type, now, requestedVol, pitchMult) {
        const policy = this._getSfxPolicy(type);
        const st = this._getSfxLimiterState(type);
        const category = this._sfxTypeCategory[type] || 'normal';
        const catPolicy = this._sfxCategoryPolicy[category] || this._sfxCategoryPolicy.normal;
        const catState = this._getSfxCategoryState(category);

        // Cleanup old timestamps/voices
        st.recent = st.recent.filter((t) => now - t <= policy.burstWindow);
        st.activeVoices = st.activeVoices.filter((t) => t > now);
        catState.activeVoices = catState.activeVoices.filter((t) => t > now);

        // Min interval gate for spam sounds
        const sinceLast = now - st.lastPlay;
        if (sinceLast < policy.minInterval && policy.priority !== 'critical') {
            return { allow: false, volume: 0, pitchMult, density: st.recent.length };
        }

        const active = st.activeVoices.length;
        const catActive = catState.activeVoices.length;
        const density = st.recent.length + 1;

        // Hard voice cap for non-critical sounds
        if (active >= policy.maxVoices && policy.priority !== 'critical') {
            return { allow: false, volume: 0, pitchMult, density };
        }
        if (catActive >= catPolicy.maxVoices && policy.priority !== 'critical') {
            return { allow: false, volume: 0, pitchMult, density };
        }

        // Burst hard cap
        if (density > policy.hardCap && policy.priority !== 'critical') {
            return { allow: false, volume: 0, pitchMult, density };
        }

        // Dynamic attenuation: preserve first impacts, reduce spam harshness
        let volume = requestedVol;
        const categoryUtil = catPolicy.maxVoices > 0 ? (catActive / catPolicy.maxVoices) : 0;
        if (density > policy.softCap) {
            const extra = density - policy.softCap;
            volume *= Math.pow(0.84, extra);
        }

        // As a category nears saturation, progressively attenuate non-critical tails.
        if (categoryUtil > 0.65 && policy.priority !== 'critical') {
            const over = (categoryUtil - 0.65) / 0.35;
            volume *= (1 - Math.min(over, 1) * 0.28);
        }

        // If voice count is high, damp additional voices a bit
        if (active >= Math.max(2, policy.maxVoices - 1)) {
            volume *= 0.78;
        }

        // Narrow pitch spread under density to avoid "nervous" random jitter
        const pitchTighten = Math.max(0.35, 1 - Math.max(0, density - policy.softCap) * 0.13);
        const adjustedPitch = 1 + (pitchMult - 1) * pitchTighten;

        // High-frequency damping under heavy repetition to reduce harshness
        const extra = Math.max(0, density - policy.softCap);
        let brightnessMult = Math.max(0.48, 1 - extra * 0.1);
        if (categoryUtil > 0.65 && policy.priority !== 'critical') {
            const over = (categoryUtil - 0.65) / 0.35;
            brightnessMult *= (1 - Math.min(over, 1) * 0.22);
        }

        // Register voice slot
        st.lastPlay = now;
        st.recent.push(now);
        st.activeVoices.push(now + policy.voiceDuration);
        catState.activeVoices.push(now + policy.voiceDuration);

        return {
            allow: true,
            volume,
            pitchMult: adjustedPitch,
            density,
            brightnessMult,
        };
    },

    // ===== DYNAMIC MUSIC INTENSITY =====
    setMusicIntensity(intensity) {
        this._intensityTarget = Math.max(0, Math.min(1, intensity));
    },

    updateMusicIntensity(dt) {
        const diff = this._intensityTarget - this._musicIntensity;
        this._musicIntensity += diff * this._intensitySmoothSpeed * dt;
        this._musicIntensity = Math.max(0, Math.min(1, this._musicIntensity));
    },

    // ===== MUSIC TRANSITIONS & CROSSFADE =====
    transitionToMusic(type) {
        if (type === this._currentMusicType) return;
        this._currentMusicType = type;

        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const mv = GameState.settings.musicVolume;

        if (type === 'boss') {
            // Crossfade: normal music down, boss music up
            this.musicGain.gain.linearRampToValueAtTime(0.01, now + this._crossfadeDuration);
            this._bossGain.gain.linearRampToValueAtTime(mv * 0.5, now + this._crossfadeDuration);
            this._bossActive = true;
            this._startBossMusic();
            // Reduce birds during boss but keep wind
            if (this._birdGain) this._birdGain.gain.linearRampToValueAtTime(mv * 0.05, now + this._crossfadeDuration);
            // Reduce chimes during boss
            if (this._chimeGain) this._chimeGain.gain.linearRampToValueAtTime(mv * 0.03, now + this._crossfadeDuration);
        } else if (type === 'ambient') {
            // Fade in normal music, fade out boss
            this.musicGain.gain.linearRampToValueAtTime(mv, now + this._crossfadeDuration);
            if (this._bossActive) {
                this._bossGain.gain.linearRampToValueAtTime(0.01, now + this._crossfadeDuration);
                this._bossActive = false;
            }
            // Restore full bird + chime ambience for calm phases
            if (this._birdGain) this._birdGain.gain.linearRampToValueAtTime(mv * 0.3, now + this._crossfadeDuration);
            if (this._chimeGain) this._chimeGain.gain.linearRampToValueAtTime(mv * 0.12, now + this._crossfadeDuration);
            if (!this._birdActive) this.startBirdAmbience();
            if (!this._chimeActive) this.startWindChimes();
        } else if (type === 'combat') {
            // More energy but still pleasant
            this.musicGain.gain.linearRampToValueAtTime(mv, now + this._crossfadeDuration * 0.5);
            if (this._bossActive) {
                this._bossGain.gain.linearRampToValueAtTime(0.01, now + this._crossfadeDuration);
                this._bossActive = false;
            }
            this.setMusicIntensity(0.7);
            // Lower bird volume during combat but don't stop
            if (this._birdGain) this._birdGain.gain.linearRampToValueAtTime(mv * 0.1, now + this._crossfadeDuration);
            // Reduce chimes a bit during combat
            if (this._chimeGain) this._chimeGain.gain.linearRampToValueAtTime(mv * 0.06, now + this._crossfadeDuration);
        }
    },

    // ===== BOSS MUSIC (Epic Adventure, NOT Horror) =====
    _startBossMusic() {
        if (!this.ctx || !this._bossActive) return;
        this._playBossBeat();
    },

    _playBossBeat() {
        if (!this._bossActive || !this.ctx) return;
        const now = this.ctx.currentTime;
        const chord = this.bossChords[this._bossBeatTimer % this.bossChords.length];
        const beatDuration = 2.0; // Heroic pace, slightly faster than ambient

        // Warm sine pad chord (lower octave for depth)
        for (let i = 0; i < chord.length; i++) {
            const freq = chord[i] / 2;
            this._musicPadTo(this._bossGain, freq, now + i * 0.1, beatDuration + 0.8, 0.03, 'sine');
        }

        // Deep sub-bass root (epic feel, not scary)
        this._musicPadTo(this._bossGain, chord[0] / 4, now, beatDuration + 0.3, 0.025, 'sine');

        // Gentle rhythmic kick on downbeat
        if (this._bossBeatTimer % 2 === 0) {
            this._softKick(now, 0.02, this._bossGain);
        }
        // Light hi-hat on offbeat
        this._noiseHit(now + beatDuration * 0.5, 0.03, 0.01, 6000, this._bossGain);

        // Heroic ascending arpeggio (bright sine plucks)
        for (let i = 0; i < 4; i++) {
            const note = chord[i % chord.length] * (i < 2 ? 1 : 2);
            const delay = i * (beatDuration / 4);
            this._musicPluckTo(this._bossGain, note, now + delay, 0.8, 0.02);
        }

        // Occasional triumphant bell on strong beats
        if (this._bossBeatTimer % 4 === 0) {
            const bellNote = chord[0] * 2;
            this._musicBellTo(this._bossGain, bellNote, now + 0.05, 2.5, 0.015);
        }

        this._bossBeatTimer++;
        setTimeout(() => this._playBossBeat(), beatDuration * 1000);
    },

    // ===== AMBIENT SOUNDSCAPES =====
    startAmbientSoundscape(mapTheme) {
        if (!this.ctx) return;
        this._ambientType = mapTheme;
        this._stopAmbientSoundscape();

        this._ambientGain.gain.value = GameState.settings.musicVolume * 0.3;
        this._playAmbientLoop();
    },

    _stopAmbientSoundscape() {
        if (this._ambientLoop) {
            clearTimeout(this._ambientLoop);
            this._ambientLoop = null;
        }
    },

    _playAmbientLoop() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const loopDuration = 4.0;

        switch (this._ambientType) {
            case 'forest':
                this._ambientWind(now, loopDuration, 0.015);
                if (Math.random() < 0.4) {
                    this._ambientChirp(now + Math.random() * loopDuration, 0.01);
                }
                break;
            case 'desert':
                this._ambientWind(now, loopDuration, 0.01);
                if (Math.random() < 0.3) {
                    this._ambientGust(now + Math.random() * loopDuration, 0.008);
                }
                break;
            case 'ice':
                this._ambientWind(now, loopDuration, 0.012);
                if (Math.random() < 0.25) {
                    this._ambientCreak(now + Math.random() * loopDuration, 0.008);
                }
                break;
            case 'volcano':
                this._ambientRumble(now, loopDuration, 0.02);
                if (Math.random() < 0.5) {
                    this._ambientBubble(now + Math.random() * loopDuration, 0.01);
                }
                break;
            case 'shadow':
                this._ambientWind(now, loopDuration, 0.01);
                if (Math.random() < 0.3) {
                    this._ambientChirp(now + Math.random() * loopDuration, 0.006);
                }
                break;
        }

        this._ambientLoop = setTimeout(() => this._playAmbientLoop(), loopDuration * 1000);
    },

    // Ambient sound primitives
    _ambientWind(startTime, duration, volume) {
        if (!this.ctx) return;
        try {
            const bufferSize = Math.floor(this.ctx.sampleRate * duration);
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const source = this.ctx.createBufferSource();
            source.buffer = buffer;
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 400 + Math.random() * 200;
            filter.Q.value = 0.3;
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(volume, startTime + duration * 0.3);
            gain.gain.linearRampToValueAtTime(volume * 0.5, startTime + duration * 0.7);
            gain.gain.linearRampToValueAtTime(0.001, startTime + duration);
            source.connect(filter);
            filter.connect(gain);
            gain.connect(this._ambientGain);
            source.start(startTime);
            source.stop(startTime + duration + 0.1);
        } catch (e) {}
    },

    _ambientChirp(startTime, volume) {
        if (!this.ctx) return;
        try {
            const freq = 2000 + Math.random() * 2000;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, startTime);
            osc.frequency.linearRampToValueAtTime(freq * 1.2, startTime + 0.05);
            osc.frequency.linearRampToValueAtTime(freq * 0.9, startTime + 0.15);
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(volume, startTime + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);
            osc.connect(gain);
            gain.connect(this._ambientGain);
            osc.start(startTime);
            osc.stop(startTime + 0.25);
        } catch (e) {}
    },

    _ambientGust(startTime, volume) {
        if (!this.ctx) return;
        try {
            const bufferSize = Math.floor(this.ctx.sampleRate * 1.5);
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const source = this.ctx.createBufferSource();
            source.buffer = buffer;
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.value = 800;
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(volume, startTime + 0.3);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.4);
            source.connect(filter);
            filter.connect(gain);
            gain.connect(this._ambientGain);
            source.start(startTime);
            source.stop(startTime + 1.5);
        } catch (e) {}
    },

    _ambientCreak(startTime, volume) {
        if (!this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            const freq = 300 + Math.random() * 200;
            osc.frequency.setValueAtTime(freq, startTime);
            osc.frequency.linearRampToValueAtTime(freq * 1.3, startTime + 0.4);
            osc.frequency.linearRampToValueAtTime(freq * 0.9, startTime + 0.8);
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(volume, startTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.0);
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 500;
            filter.Q.value = 1;
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this._ambientGain);
            osc.start(startTime);
            osc.stop(startTime + 1.1);
        } catch (e) {}
    },

    _ambientRumble(startTime, duration, volume) {
        if (!this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = 30 + Math.random() * 20;
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(volume, startTime + 0.5);
            gain.gain.setValueAtTime(volume * 0.8, startTime + duration * 0.6);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
            osc.connect(gain);
            gain.connect(this._ambientGain);
            osc.start(startTime);
            osc.stop(startTime + duration + 0.1);
        } catch (e) {}
    },

    _ambientBubble(startTime, volume) {
        if (!this.ctx) return;
        try {
            const count = 2 + Math.floor(Math.random() * 3);
            for (let i = 0; i < count; i++) {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                const t = startTime + i * 0.15;
                const freq = 100 + Math.random() * 200;
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, t);
                osc.frequency.exponentialRampToValueAtTime(freq * 2, t + 0.08);
                gain.gain.setValueAtTime(0, t);
                gain.gain.linearRampToValueAtTime(volume, t + 0.01);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
                osc.connect(gain);
                gain.connect(this._ambientGain);
                osc.start(t);
                osc.stop(t + 0.15);
            }
        } catch (e) {}
    },

    // ===== PAUSE FILTER EFFECT =====
    setPaused(paused) {
        if (!this.ctx || !this._pauseFilter) return;
        this._isPaused = paused;
        const now = this.ctx.currentTime;
        if (paused) {
            this._pauseFilter.frequency.cancelScheduledValues(now);
            this._pauseFilter.frequency.setValueAtTime(this._pauseFilter.frequency.value, now);
            this._pauseFilter.frequency.linearRampToValueAtTime(400, now + 0.3);
            this.masterGain.gain.linearRampToValueAtTime(0.5, now + 0.3);
        } else {
            this._pauseFilter.frequency.cancelScheduledValues(now);
            this._pauseFilter.frequency.setValueAtTime(this._pauseFilter.frequency.value, now);
            this._pauseFilter.frequency.linearRampToValueAtTime(20000, now + 0.3);
            this.masterGain.gain.linearRampToValueAtTime(1.0, now + 0.3);
        }
    },

    // ===== VOLUME DUCKING =====
    duckMusic(durationSec, duckLevel) {
        if (!this.ctx || !this.musicGain) return;
        const now = this.ctx.currentTime;
        const level = duckLevel || 0.3;
        this.musicGain.gain.cancelScheduledValues(now);
        this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, now);
        this.musicGain.gain.linearRampToValueAtTime(GameState.settings.musicVolume * level, now + 0.2);
        this.musicGain.gain.linearRampToValueAtTime(GameState.settings.musicVolume, now + durationSec);
    },

    // ===================================================================
    // ===== BRIGHT AMBIENT NATURE MUSIC SYSTEM =====
    // ===================================================================

    startMusic() {
        if (!this.ctx || this.musicPlaying) return;
        if (!this._userActivated) {
            this._pendingMusicStart = true;
            return;
        }

        this.resume();
        this.musicPlaying = true;
        this.currentChord = 0;
        this._currentMusicType = 'ambient';
        this._playMusicLoop();
        // Start nature layers
        this.startBirdAmbience();
        this.startNaturePad();
        this.startWindChimes();
    },

    stopMusic() {
        this.musicPlaying = false;
        this._bossActive = false;
        this._stopAmbientSoundscape();
        this.stopBirdAmbience();
        this.stopNaturePad();
        this.stopWindChimes();
        // Fade out any playing music nodes
        for (const node of this.musicNodes) {
            try {
                if (node.gain) {
                    node.gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 2);
                }
                if (node.osc) {
                    node.osc.stop(this.ctx.currentTime + 2.1);
                }
            } catch (e) {}
        }
        // Fade out boss nodes
        for (const node of this._bossNodes) {
            try {
                if (node.gain) node.gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 2);
                if (node.osc) node.osc.stop(this.ctx.currentTime + 2.1);
            } catch (e) {}
        }
        this.musicNodes = [];
        this._bossNodes = [];
    },

    // ===== MAIN MUSIC LOOP =====
    // Generates warm, bright ambient music with gentle chord pads,
    // soft arpeggios, and optional light percussion based on intensity.
    _playMusicLoop() {
        if (!this.musicPlaying || !this.ctx) return;

        const now = this.ctx.currentTime;

        // Select chord progression based on current music type / intensity
        let chordSet = this.chords;
        if (this._musicIntensity > 0.5 || this._currentMusicType === 'combat') {
            chordSet = this.combatChords;
        }
        const chord = chordSet[this.currentChord % chordSet.length];

        // Very slow, meditative tempo for ambient; slightly faster for combat
        const baseTempo = 5.0;
        const beatDuration = baseTempo - this._musicIntensity * 1.2; // 5.0s down to 3.8s

        // === LAYER 1: Warm sine pad (main chord tones, low register) ===
        const padVol = 0.022 - this._musicIntensity * 0.004;
        for (let i = 0; i < chord.length; i++) {
            const freq = chord[i] / 2; // One octave lower for warmth
            this._musicPad(freq, now + i * 0.3, beatDuration + 2.0, Math.max(0.008, padVol));
        }

        // === LAYER 2: Chorus shimmer (detuned pair for width and dreaminess) ===
        for (let i = 0; i < Math.min(chord.length, 3); i++) {
            const freq = chord[i] / 2;
            this._musicChorusPad(freq, now + i * 0.35, beatDuration + 2.5, Math.max(0.004, padVol * 0.4));
        }

        // === LAYER 3: Gentle sub-bass root ===
        this._musicPad(chord[0] / 4, now, beatDuration + 0.5, 0.015, 'sine');

        // === LAYER 4: Soft percussion (only at higher intensity, e.g. combat) ===
        if (this._musicIntensity > 0.3) {
            const percVol = 0.006 + this._musicIntensity * 0.008;
            // Soft kick (sine thump at 80Hz with fast decay)
            this._softKick(now, percVol, this.musicGain);
            if (this._musicIntensity > 0.5) {
                // Light hi-hat on offbeat (high-filtered noise burst)
                this._noiseHit(now + beatDuration * 0.5, 0.03, percVol * 0.4, 6000, this.musicGain);
            }
            if (this._musicIntensity > 0.6) {
                // Second soft kick for gentle rhythm
                this._softKick(now + beatDuration * 0.5, percVol * 0.6, this.musicGain);
            }
        }

        // === LAYER 5: Soft arpeggio plucks (warm sine with gentle decay) ===
        const arpNotes = this._shuffleArrSubset(chord, 3);
        const arpCount = this._musicIntensity > 0.4 ? 4 : 2;
        for (let i = 0; i < arpCount; i++) {
            const note = arpNotes[i % arpNotes.length];
            const octave = Math.random() < 0.3 ? 2 : 1;
            const delay = i * (beatDuration / arpCount) + (Math.random() * 0.2);
            const arpVol = 0.012 + Math.random() * 0.006 + this._musicIntensity * 0.004;
            this._musicPluck(note * octave, now + delay, 2.5 + Math.random(), arpVol);
        }

        // === LAYER 6: Occasional bell melody note (bright, warm) ===
        if (Math.random() < 0.35) {
            const melNote = this.melodyNotes[Math.floor(Math.random() * this.melodyNotes.length)];
            const melDelay = Math.random() * beatDuration * 0.5;
            this._musicBell(melNote, now + melDelay, 3.5 + Math.random(), 0.01);
        }

        // === LAYER 7: Rare high shimmer sparkle ===
        if (Math.random() < 0.15) {
            const shimFreq = this.melodyNotes[Math.floor(Math.random() * this.melodyNotes.length)] * 2;
            this._musicShimmer(shimFreq, now + Math.random() * beatDuration, 4.5, 0.004);
        }

        this.currentChord++;

        // Update music intensity
        this.updateMusicIntensity(beatDuration);

        // Schedule next beat
        setTimeout(() => {
            this._playMusicLoop();
        }, beatDuration * 1000);
    },

    // ===== MUSIC PRIMITIVES =====

    // Warm sine pad with slow attack and release
    _musicPad(freq, startTime, duration, volume, type = 'sine') {
        this._musicPadTo(this.musicGain, freq, startTime, duration, volume, type);
    },

    _musicPadTo(destGain, freq, startTime, duration, volume, type = 'sine') {
        if (!this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            osc.type = 'sine'; // Always sine for warm, non-scary sound
            osc.frequency.value = freq;
            // Gentle detuning for natural warmth
            osc.detune.value = (Math.random() - 0.5) * 8;

            filter.type = 'lowpass';
            filter.frequency.value = 900; // Open enough for brightness, not harsh
            filter.Q.value = 0.3;

            // Very slow attack (1.5s) for gentle, meditative onset
            const attack = 1.5;
            const release = Math.min(2.0, duration * 0.3);
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(volume, startTime + attack);
            gain.gain.setValueAtTime(volume, startTime + duration - release);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(destGain);

            osc.start(startTime);
            osc.stop(startTime + duration + 0.1);

            const nodeList = destGain === this._bossGain ? this._bossNodes : this.musicNodes;
            nodeList.push({ osc, gain });

            osc.onended = () => {
                const idx = nodeList.findIndex(n => n.osc === osc);
                if (idx >= 0) nodeList.splice(idx, 1);
            };
        } catch (e) {}
    },

    // Chorus pad: detuned sine pair for dreamy width
    _musicChorusPad(freq, startTime, duration, volume) {
        if (!this.ctx) return;
        try {
            const osc1 = this.ctx.createOscillator();
            const osc2 = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            osc1.type = 'sine';
            osc1.frequency.value = freq;
            osc1.detune.value = 7;

            osc2.type = 'sine';
            osc2.frequency.value = freq;
            osc2.detune.value = -7;

            filter.type = 'lowpass';
            filter.frequency.value = 800;
            filter.Q.value = 0.2;

            // Very gentle slow envelope
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(volume, startTime + 2.0);
            gain.gain.setValueAtTime(volume, startTime + duration - 2.5);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

            osc1.connect(filter);
            osc2.connect(filter);
            filter.connect(gain);
            gain.connect(this.musicGain);

            osc1.start(startTime);
            osc1.stop(startTime + duration + 0.1);
            osc2.start(startTime);
            osc2.stop(startTime + duration + 0.1);

            this.musicNodes.push({ osc: osc1, gain });
            osc1.onended = () => {
                const idx = this.musicNodes.findIndex(n => n.osc === osc1);
                if (idx >= 0) this.musicNodes.splice(idx, 1);
            };
        } catch (e) {}
    },

    // Soft pluck: sine with gentle attack and long decay (like a soft harp)
    _musicPluck(freq, startTime, duration, volume) {
        this._musicPluckTo(this.musicGain, freq, startTime, duration, volume);
    },

    _musicPluckTo(destGain, freq, startTime, duration, volume) {
        if (!this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            osc.type = 'sine';
            osc.frequency.value = freq;
            osc.detune.value = (Math.random() - 0.5) * 6;

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1200, startTime);
            filter.frequency.exponentialRampToValueAtTime(400, startTime + duration * 0.5);

            // Soft attack (0.06s), long gentle decay
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(volume, startTime + 0.06);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(destGain);

            osc.start(startTime);
            osc.stop(startTime + duration + 0.1);

            const nodeList = destGain === this._bossGain ? this._bossNodes : this.musicNodes;
            nodeList.push({ osc, gain });
            osc.onended = () => {
                const idx = nodeList.findIndex(n => n.osc === osc);
                if (idx >= 0) nodeList.splice(idx, 1);
            };
        } catch (e) {}
    },

    // Bell tone: fundamental + inharmonic partial for gentle bell character
    _musicBell(freq, startTime, duration, volume) {
        this._musicBellTo(this.musicGain, freq, startTime, duration, volume);
    },

    _musicBellTo(destGain, freq, startTime, duration, volume) {
        if (!this.ctx) return;
        try {
            const fundamental = this.ctx.createOscillator();
            const harmonic = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const gain2 = this.ctx.createGain();

            fundamental.type = 'sine';
            fundamental.frequency.value = freq;
            harmonic.type = 'sine';
            harmonic.frequency.value = freq * 2.76; // Inharmonic partial for bell character

            // Soft attack for gentle onset
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(volume, startTime + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

            gain2.gain.setValueAtTime(0, startTime);
            gain2.gain.linearRampToValueAtTime(volume * 0.15, startTime + 0.1);
            gain2.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 0.4);

            fundamental.connect(gain);
            harmonic.connect(gain2);
            gain.connect(destGain);
            gain2.connect(destGain);

            fundamental.start(startTime);
            fundamental.stop(startTime + duration + 0.1);
            harmonic.start(startTime);
            harmonic.stop(startTime + duration * 0.4 + 0.1);

            const nodeList = destGain === this._bossGain ? this._bossNodes : this.musicNodes;
            nodeList.push({ osc: fundamental, gain });
            fundamental.onended = () => {
                const idx = nodeList.findIndex(n => n.osc === fundamental);
                if (idx >= 0) nodeList.splice(idx, 1);
            };
        } catch (e) {}
    },

    // Shimmer: very high, quiet detuned sine pair for sparkle
    _musicShimmer(freq, startTime, duration, volume) {
        if (!this.ctx) return;
        try {
            const osc1 = this.ctx.createOscillator();
            const osc2 = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc1.type = 'sine';
            osc1.frequency.value = freq;
            osc2.type = 'sine';
            osc2.frequency.value = freq * 1.003; // Very slight detune for shimmer

            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(volume, startTime + 1.5);
            gain.gain.setValueAtTime(volume, startTime + duration - 2.0);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(this.musicGain);

            osc1.start(startTime);
            osc1.stop(startTime + duration + 0.1);
            osc2.start(startTime);
            osc2.stop(startTime + duration + 0.1);

            this.musicNodes.push({ osc: osc1, gain });
            osc1.onended = () => {
                const idx = this.musicNodes.findIndex(n => n.osc === osc1);
                if (idx >= 0) this.musicNodes.splice(idx, 1);
            };
        } catch (e) {}
    },

    // Soft kick: sine thump at 80Hz with very fast decay (not boomy/scary)
    _softKick(startTime, volume, destGain) {
        if (!this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(80, startTime);
            osc.frequency.exponentialRampToValueAtTime(40, startTime + 0.15);
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(volume, startTime + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);
            osc.connect(gain);
            gain.connect(destGain || this.musicGain);
            osc.start(startTime);
            osc.stop(startTime + 0.25);
        } catch (e) {}
    },

    // ===== BIRD CHIRP AMBIENT LAYER =====
    // Creates realistic bird-like chirps using sine oscillators with frequency sweeps.
    // Multiple "voices" at different pitch ranges for variety.
    startBirdAmbience() {
        if (!this.ctx || this._birdActive) return;
        this._birdActive = true;
        if (this._birdGain) {
            const now = this.ctx.currentTime;
            this._birdGain.gain.setValueAtTime(0, now);
            this._birdGain.gain.linearRampToValueAtTime(GameState.settings.musicVolume * 0.3, now + 2.0);
        }
        // Start multiple bird voices with different pitch ranges
        this._startBirdVoice(0, 1800, 2800); // Robin-like (melodic, mid-high)
        this._startBirdVoice(1, 2400, 3600); // Sparrow-like (bright chirps)
        this._startBirdVoice(2, 3000, 4200); // Wren-like (high, fast trills)
    },

    stopBirdAmbience() {
        this._birdActive = false;
        for (const timer of this._birdTimers) {
            clearTimeout(timer);
        }
        this._birdTimers = [];
        if (this._birdGain && this.ctx) {
            const now = this.ctx.currentTime;
            this._birdGain.gain.linearRampToValueAtTime(0.001, now + 1.5);
        }
    },

    _startBirdVoice(voiceId, minFreq, maxFreq) {
        if (!this._birdActive || !this.ctx) return;

        const scheduleNext = () => {
            if (!this._birdActive) return;
            // Random delay between chirps: 3-8 seconds during idle
            // Slightly less frequent during combat (handled by gain, not timing)
            const delay = 3000 + Math.random() * 5000;
            const timer = setTimeout(() => {
                if (!this._birdActive || !this.ctx) return;
                this._playBirdChirp(minFreq, maxFreq);
                scheduleNext();
            }, delay);
            this._birdTimers.push(timer);
        };

        // Initial random delay so birds don't all start at once
        const initDelay = 500 + Math.random() * 4000;
        const timer = setTimeout(() => {
            if (!this._birdActive) return;
            this._playBirdChirp(minFreq, maxFreq);
            scheduleNext();
        }, initDelay);
        this._birdTimers.push(timer);
    },

    // Generates a bird chirp: sine oscillator sweeping from ~2000-4000Hz rapidly
    // Duration 0.05-0.15s per note, 1-4 notes per chirp phrase
    _playBirdChirp(minFreq, maxFreq) {
        if (!this.ctx || !this._birdGain) return;
        try {
            const now = this.ctx.currentTime;
            // Each chirp is a series of 1-4 quick notes (a phrase)
            const noteCount = 1 + Math.floor(Math.random() * 4);
            const baseFreq = minFreq + Math.random() * (maxFreq - minFreq);

            for (let i = 0; i < noteCount; i++) {
                const chirpStart = now + i * (0.07 + Math.random() * 0.05);
                const chirpDuration = 0.05 + Math.random() * 0.1; // 50-150ms
                const freq = baseFreq * (0.9 + Math.random() * 0.2); // Slight random pitch variation
                // Frequency sweep direction: ascending or descending randomly
                const sweepDir = Math.random() < 0.6 ? 1.3 : 0.7;
                const endFreq = freq * sweepDir;

                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, chirpStart);
                osc.frequency.linearRampToValueAtTime(endFreq, chirpStart + chirpDuration);

                // Quick fade in, gentle fade out
                const chirpVol = 0.015 + Math.random() * 0.012;
                gain.gain.setValueAtTime(0, chirpStart);
                gain.gain.linearRampToValueAtTime(chirpVol, chirpStart + 0.005);
                gain.gain.exponentialRampToValueAtTime(0.001, chirpStart + chirpDuration);

                osc.connect(gain);
                gain.connect(this._birdGain);
                osc.start(chirpStart);
                osc.stop(chirpStart + chirpDuration + 0.01);
            }
        } catch (e) {}
    },

    // ===== NATURE WIND PAD (constant gentle breeze) =====
    // Uses brownian noise filtered to sound like a soft, continuous breeze
    startNaturePad() {
        if (!this.ctx || this._naturePadActive) return;
        this._naturePadActive = true;

        try {
            const now = this.ctx.currentTime;

            // Create a long noise buffer for continuous wind
            const bufferDuration = 4.0;
            const bufferSize = Math.floor(this.ctx.sampleRate * bufferDuration);
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            // Brownian noise (smoother than white noise, sounds like gentle wind)
            let lastVal = 0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                lastVal = (lastVal + 0.02 * white) / 1.02;
                data[i] = lastVal * 3.5;
            }

            const source = this.ctx.createBufferSource();
            source.buffer = buffer;
            source.loop = true;

            // Band-pass filter to shape as gentle breeze
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 400; // Low-mid wind frequency
            filter.Q.value = 0.15; // Very wide band for natural, airy sound

            // Second filter for extra smoothness
            const filter2 = this.ctx.createBiquadFilter();
            filter2.type = 'lowpass';
            filter2.frequency.value = 700;
            filter2.Q.value = 0.2;

            // Gentle fade in
            this._naturePadGain.gain.setValueAtTime(0, now);
            this._naturePadGain.gain.linearRampToValueAtTime(GameState.settings.musicVolume * 0.15, now + 4.0);

            source.connect(filter);
            filter.connect(filter2);
            filter2.connect(this._naturePadGain);
            source.start(now);

            this._naturePadNode = source;
        } catch (e) {
            this._naturePadActive = false;
        }
    },

    stopNaturePad() {
        this._naturePadActive = false;
        if (this._naturePadNode && this.ctx) {
            try {
                const now = this.ctx.currentTime;
                this._naturePadGain.gain.linearRampToValueAtTime(0.001, now + 2.0);
                this._naturePadNode.stop(now + 2.1);
                this._naturePadNode = null;
            } catch (e) {}
        }
    },

    // ===== WIND CHIMES LAYER =====
    // High sine tones with fast decay, randomly triggered for a peaceful garden feel
    startWindChimes() {
        if (!this.ctx || this._chimeActive) return;
        this._chimeActive = true;

        if (this._chimeGain) {
            const now = this.ctx.currentTime;
            this._chimeGain.gain.setValueAtTime(0, now);
            this._chimeGain.gain.linearRampToValueAtTime(GameState.settings.musicVolume * 0.12, now + 3.0);
        }

        this._scheduleNextChime();
    },

    stopWindChimes() {
        this._chimeActive = false;
        if (this._chimeTimer) {
            clearTimeout(this._chimeTimer);
            this._chimeTimer = null;
        }
        if (this._chimeGain && this.ctx) {
            const now = this.ctx.currentTime;
            this._chimeGain.gain.linearRampToValueAtTime(0.001, now + 1.5);
        }
    },

    _scheduleNextChime() {
        if (!this._chimeActive) return;
        // Random interval: 4-12 seconds
        const delay = 4000 + Math.random() * 8000;
        this._chimeTimer = setTimeout(() => {
            if (!this._chimeActive || !this.ctx) return;
            this._playWindChime();
            this._scheduleNextChime();
        }, delay);
    },

    _playWindChime() {
        if (!this.ctx || !this._chimeGain) return;
        try {
            const now = this.ctx.currentTime;
            // Wind chimes: 1-3 high-pitched tones in quick succession
            const count = 1 + Math.floor(Math.random() * 3);
            // Pentatonic-friendly frequencies for pleasant chimes (C major pentatonic, octave 6-7)
            const chimeFreqs = [1046.50, 1174.66, 1318.51, 1567.98, 1760.00, 2093.00, 2349.32];

            for (let i = 0; i < count; i++) {
                const freq = chimeFreqs[Math.floor(Math.random() * chimeFreqs.length)];
                const t = now + i * (0.08 + Math.random() * 0.12);
                const duration = 1.5 + Math.random() * 2.0; // 1.5-3.5s ring

                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'sine';
                osc.frequency.value = freq;
                // Very slight detune for natural metallic feel
                osc.detune.value = (Math.random() - 0.5) * 10;

                const vol = 0.015 + Math.random() * 0.01;
                gain.gain.setValueAtTime(0, t);
                gain.gain.linearRampToValueAtTime(vol, t + 0.005); // Very fast attack
                gain.gain.exponentialRampToValueAtTime(0.001, t + duration); // Long ring-out

                osc.connect(gain);
                gain.connect(this._chimeGain);
                osc.start(t);
                osc.stop(t + duration + 0.1);
            }
        } catch (e) {}
    },

    // Noise hit primitive for percussion
    _noiseHit(startTime, duration, volume, filterFreq, destGain) {
        if (!this.ctx) return;
        try {
            const bufferSize = Math.floor(this.ctx.sampleRate * duration);
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const source = this.ctx.createBufferSource();
            source.buffer = buffer;
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = filterFreq;
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(volume, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
            source.connect(filter);
            filter.connect(gain);
            gain.connect(destGain || this.musicGain);
            source.start(startTime);
            source.stop(startTime + duration + 0.01);
        } catch (e) {}
    },

    _shuffleArrSubset(arr, count) {
        const shuffled = [...arr].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    },

    // ===== SOUND EFFECTS =====
    play(type, opts = {}) {
        if (!this.ctx) return;
        this.resume();
        if (this.ctx.state !== 'running') return;
        const now = this.ctx.currentTime;
        const vol = opts.volume || 0.3;

        // Apply positional audio if position is provided
        const posVol = this._getPositionalVolume(opts.x, opts.y);
        const effectiveVol = vol * posVol;

        // Apply sound variation for repeating sounds
        const variation = this._applyVariation(type, effectiveVol);
        let pitchMult = variation.pitchMult;
        let volMult = variation.volumeMult;

        // Anti-spam limiter and adaptive attenuation
        const limited = this._applySfxLimiter(type, now, effectiveVol * volMult, pitchMult);
        if (!limited.allow) return;

        pitchMult = limited.pitchMult;
        const brightnessMult = limited.brightnessMult || 1;
        const safeBase = Math.max(0.001, effectiveVol || 0);
        volMult = Math.max(0.15, limited.volume / safeBase);

        switch (type) {
            case 'click':
                this._tone(800 * pitchMult, 0.05, effectiveVol * 0.5 * volMult, 'square');
                break;
            case 'hover':
                this._tone(600 * pitchMult, 0.03, effectiveVol * 0.2 * volMult, 'sine');
                break;
            case 'place':
                this._tone(300 * pitchMult, 0.1, effectiveVol * volMult, 'triangle');
                this._tone(500 * pitchMult, 0.1, effectiveVol * 0.7 * volMult, 'triangle', 0.05);
                break;
            case 'sell':
                this._tone(800 * pitchMult, 0.05, effectiveVol * volMult, 'square');
                this._tone(1000 * pitchMult, 0.05, effectiveVol * 0.8 * volMult, 'square', 0.05);
                this._tone(1200 * pitchMult, 0.05, effectiveVol * 0.6 * volMult, 'square', 0.1);
                break;
            case 'upgrade':
                this._tone(400 * pitchMult, 0.1, effectiveVol * volMult, 'sine');
                this._tone(600 * pitchMult, 0.1, effectiveVol * volMult, 'sine', 0.08);
                this._tone(800 * pitchMult, 0.15, effectiveVol * volMult, 'sine', 0.16);
                break;
            case 'arrow':
                this._noisePooled('arrow', 0.06, effectiveVol * 0.4 * volMult, 1200 * pitchMult * brightnessMult);
                break;
            case 'cannon':
                this._noisePooled('cannon', 0.15, effectiveVol * volMult, 300 * pitchMult * brightnessMult);
                this._tone(80 * pitchMult, 0.2, effectiveVol * 0.8 * volMult, 'sine');
                break;
            case 'ice':
                this._tone(2000 * pitchMult, 0.1, effectiveVol * 0.5 * volMult, 'sine');
                this._noisePooled('ice', 0.08, effectiveVol * 0.3 * volMult, 3000 * pitchMult * brightnessMult);
                break;
            case 'lightning':
                this._noisePooled('lightning', 0.08, effectiveVol * 0.6 * volMult, 2000 * pitchMult * brightnessMult);
                this._tone(150 * pitchMult, 0.05, effectiveVol * 0.4 * volMult, 'sawtooth');
                break;
            case 'sniper':
                this._noise(0.12, effectiveVol * 0.8 * volMult, 800 * pitchMult * brightnessMult);
                this._tone(100 * pitchMult, 0.15, effectiveVol * 0.5 * volMult, 'sine');
                break;
            case 'laser':
                this._tone(440 * pitchMult, 0.3, effectiveVol * 0.3 * volMult, 'sawtooth');
                break;
            case 'missile':
                this._noise(0.2, effectiveVol * 0.5 * volMult, 500 * pitchMult * brightnessMult);
                this._tone(200 * pitchMult, 0.3, effectiveVol * 0.4 * volMult, 'sine');
                break;
            case 'explosion':
                this._noisePooled('explosion', 0.3, effectiveVol * volMult, 200 * pitchMult * brightnessMult);
                this._tone(60 * pitchMult, 0.3, effectiveVol * 0.8 * volMult, 'sine');
                break;
            case 'hit':
                this._noisePooled('hit', 0.04, effectiveVol * 0.3 * volMult, 800 * pitchMult * brightnessMult);
                break;
            case 'death':
                this._tone(600 * pitchMult, 0.05, effectiveVol * 0.4 * volMult, 'square');
                this._tone(400 * pitchMult, 0.05, effectiveVol * 0.3 * volMult, 'square', 0.03);
                break;
            case 'wave_start':
                this._tone(200, 0.3, effectiveVol * 0.6, 'sawtooth');
                this._tone(250, 0.3, effectiveVol * 0.5, 'sawtooth', 0.1);
                this._tone(300, 0.4, effectiveVol * 0.4, 'sawtooth', 0.2);
                break;
            case 'wave_complete':
                this._tone(500, 0.1, effectiveVol, 'sine');
                this._tone(700, 0.1, effectiveVol, 'sine', 0.1);
                this._tone(900, 0.15, effectiveVol, 'sine', 0.2);
                this.duckMusic(2.0, 0.4);
                break;
            case 'boss':
                this._tone(80, 0.5, effectiveVol, 'sawtooth');
                this._tone(60, 0.5, effectiveVol * 0.8, 'sine', 0.2);
                break;
            case 'ability':
                this._tone(600, 0.1, effectiveVol, 'sine');
                this._tone(900, 0.15, effectiveVol * 0.8, 'sine', 0.05);
                this._tone(1200, 0.2, effectiveVol * 0.6, 'sine', 0.1);
                break;
            case 'freeze':
                this._tone(3000 * pitchMult, 0.15, effectiveVol * 0.4 * volMult, 'sine');
                this._tone(2500 * pitchMult, 0.1, effectiveVol * 0.3 * volMult, 'sine', 0.05);
                break;
            case 'crit':
                this._tone(1000 * pitchMult, 0.08, effectiveVol * 0.6 * volMult, 'square');
                this._noise(0.05, effectiveVol * 0.4 * volMult, 2000 * pitchMult * brightnessMult);
                break;
            case 'nuke':
                this._noise(0.5, effectiveVol, 100);
                this._tone(40, 0.5, effectiveVol, 'sine');
                this._tone(30, 0.8, effectiveVol * 0.6, 'sine', 0.3);
                this.duckMusic(3.0, 0.2);
                break;
            case 'achievement':
                this._tone(800, 0.1, effectiveVol, 'sine');
                this._tone(1000, 0.1, effectiveVol, 'sine', 0.1);
                this._tone(1200, 0.15, effectiveVol, 'sine', 0.2);
                this._tone(1600, 0.2, effectiveVol * 0.8, 'sine', 0.3);
                break;
            case 'gameover':
                this._tone(300, 0.3, effectiveVol, 'sine');
                this._tone(250, 0.3, effectiveVol, 'sine', 0.3);
                this._tone(200, 0.5, effectiveVol * 0.8, 'sine', 0.6);
                this.duckMusic(4.0, 0.15);
                break;
            case 'victory':
                [500, 600, 700, 800, 1000].forEach((f, i) => {
                    this._tone(f, 0.15, effectiveVol * (1 - i * 0.1), 'sine', i * 0.12);
                });
                this.duckMusic(3.0, 0.3);
                break;
            case 'leak':
                this._tone(200 * pitchMult, 0.2, effectiveVol * 0.6 * volMult, 'sawtooth');
                this._tone(150 * pitchMult, 0.3, effectiveVol * 0.3 * volMult, 'sine', 0.05);
                break;
            case 'shield':
                this._tone(600 * pitchMult, 0.08, effectiveVol * 0.4 * volMult, 'sine');
                this._tone(800 * pitchMult, 0.06, effectiveVol * 0.3 * volMult, 'sine', 0.04);
                break;
            case 'powerup':
                [400, 500, 600, 800].forEach((f, i) => {
                    this._tone(f * pitchMult, 0.1, effectiveVol * 0.4 * volMult, 'sine', i * 0.08);
                });
                break;
        }
    },

    _tone(freq, duration, volume, type, delay = 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, this.ctx.currentTime + delay);
        gain.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + delay + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + delay + duration);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(this.ctx.currentTime + delay);
        osc.stop(this.ctx.currentTime + delay + duration + 0.01);
    },

    _noise(duration, volume, filterFreq) {
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = filterFreq;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        source.start();
        source.stop(this.ctx.currentTime + duration + 0.01);
    },

    // Pooled noise - reuses pre-created buffers to avoid allocation overhead
    _noisePooled(type, duration, volume, filterFreq) {
        const buffer = this._getPooledNoise(type);
        if (!buffer) {
            this._noise(duration, volume, filterFreq);
            return;
        }
        try {
            const source = this.ctx.createBufferSource();
            source.buffer = buffer;
            const bufDuration = buffer.duration;
            if (duration < bufDuration) {
                source.playbackRate.value = bufDuration / duration;
            }
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = filterFreq;
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(volume, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
            source.connect(filter);
            filter.connect(gain);
            gain.connect(this.sfxGain);
            source.start();
            source.stop(this.ctx.currentTime + duration + 0.01);
        } catch (e) {
            this._noise(duration, volume, filterFreq);
        }
    },

    // ===== ADAPTIVE MUSIC STATE SYSTEM =====
    // Tracks current game state and smoothly transitions music accordingly.
    // Called from main game loop each frame.
    _adaptiveMusicState: 'idle',
    _adaptiveDangerOsc: null,
    _adaptiveDangerGain: null,
    _dangerActive: false,

    updateMusicState(state) {
        // state: 'idle', 'combat', 'boss', 'danger'
        if (!this.ctx) return;

        // Handle danger urgency layer independently (overlays on any state)
        if (state === 'danger' && !this._dangerActive) {
            this._startDangerLayer();
        } else if (state !== 'danger' && this._dangerActive) {
            this._stopDangerLayer();
        }

        // Map state to music type and intensity
        const musicState = (state === 'danger') ? this._adaptiveMusicState : state;

        if (musicState === this._adaptiveMusicState && state !== 'danger') return;

        if (state !== 'danger') {
            this._adaptiveMusicState = musicState;
        }

        switch (musicState) {
            case 'idle':
                this.transitionToMusic('ambient');
                this.setMusicIntensity(0.1);
                break;
            case 'combat':
                this.transitionToMusic('combat');
                this.setMusicIntensity(0.7);
                break;
            case 'boss':
                this.transitionToMusic('boss');
                this.setMusicIntensity(1.0);
                break;
        }
    },

    // ===== DANGER LAYER (Exciting/Tense, NOT Scary) =====
    // Heartbeat-like low pulse with gentle urgency, overlays on current music
    _startDangerLayer() {
        if (!this.ctx || this._dangerActive) return;
        this._dangerActive = true;

        try {
            const now = this.ctx.currentTime;
            this._adaptiveDangerGain = this.ctx.createGain();
            this._adaptiveDangerGain.gain.setValueAtTime(0.001, now);
            this._adaptiveDangerGain.gain.linearRampToValueAtTime(0.035, now + 1.0);
            this._adaptiveDangerGain.connect(this.musicGain);

            // Heartbeat-like sub-bass pulse (warm sine, not harsh)
            this._adaptiveDangerOsc = this.ctx.createOscillator();
            this._adaptiveDangerOsc.type = 'sine';
            this._adaptiveDangerOsc.frequency.value = 55; // Low A - warm, not ominous

            // LFO for heartbeat pulsing effect (~1.2Hz = ~72 BPM heartbeat)
            const lfo = this.ctx.createOscillator();
            const lfoGain = this.ctx.createGain();
            lfo.type = 'sine';
            lfo.frequency.value = 1.2; // Heartbeat rate
            lfoGain.gain.value = 0.025;
            lfo.connect(lfoGain);
            lfoGain.connect(this._adaptiveDangerGain.gain);
            lfo.start(now);
            this._adaptiveDangerLfo = lfo;

            // Gentle urgency tone (warm C3 sine, not harsh)
            const tensionOsc = this.ctx.createOscillator();
            tensionOsc.type = 'sine';
            tensionOsc.frequency.value = 130.81; // C3
            const tensionFilter = this.ctx.createBiquadFilter();
            tensionFilter.type = 'lowpass';
            tensionFilter.frequency.value = 250;
            tensionFilter.Q.value = 0.3;
            const tensionGain = this.ctx.createGain();
            tensionGain.gain.value = 0.008;
            tensionOsc.connect(tensionFilter);
            tensionFilter.connect(tensionGain);
            tensionGain.connect(this._adaptiveDangerGain);
            tensionOsc.start(now);
            this._adaptiveDangerTension = tensionOsc;

            // Slightly faster rhythmic pulse for urgency (not scary, more like adventure)
            const pulseOsc = this.ctx.createOscillator();
            pulseOsc.type = 'sine';
            pulseOsc.frequency.value = 82.41; // E2 - adds gentle motion
            const pulseGain = this.ctx.createGain();
            pulseGain.gain.value = 0.006;
            const pulseLfo = this.ctx.createOscillator();
            pulseLfo.type = 'sine';
            pulseLfo.frequency.value = 2.4; // Slightly faster pulse for excitement
            const pulseLfoGain = this.ctx.createGain();
            pulseLfoGain.gain.value = 0.005;
            pulseLfo.connect(pulseLfoGain);
            pulseLfoGain.connect(pulseGain.gain);
            pulseOsc.connect(pulseGain);
            pulseGain.connect(this._adaptiveDangerGain);
            pulseOsc.start(now);
            pulseLfo.start(now);
            this._adaptiveDangerPulse = pulseOsc;
            this._adaptiveDangerPulseLfo = pulseLfo;

            this._adaptiveDangerOsc.connect(this._adaptiveDangerGain);
            this._adaptiveDangerOsc.start(now);
        } catch (e) {
            this._dangerActive = false;
        }
    },

    _stopDangerLayer() {
        if (!this.ctx || !this._dangerActive) return;
        this._dangerActive = false;

        const now = this.ctx.currentTime;
        try {
            if (this._adaptiveDangerGain) {
                this._adaptiveDangerGain.gain.linearRampToValueAtTime(0.001, now + 1.5);
            }
            if (this._adaptiveDangerOsc) {
                this._adaptiveDangerOsc.stop(now + 2.0);
                this._adaptiveDangerOsc = null;
            }
            if (this._adaptiveDangerLfo) {
                this._adaptiveDangerLfo.stop(now + 2.0);
                this._adaptiveDangerLfo = null;
            }
            if (this._adaptiveDangerTension) {
                this._adaptiveDangerTension.stop(now + 2.0);
                this._adaptiveDangerTension = null;
            }
            if (this._adaptiveDangerPulse) {
                this._adaptiveDangerPulse.stop(now + 2.0);
                this._adaptiveDangerPulse = null;
            }
            if (this._adaptiveDangerPulseLfo) {
                this._adaptiveDangerPulseLfo.stop(now + 2.0);
                this._adaptiveDangerPulseLfo = null;
            }
        } catch (e) {}
    },
};
