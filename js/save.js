// ===== SAVE/LOAD SYSTEM =====
const SaveSystem = {
    PERSIST_KEY: 'towerforge_persistent',
    GAME_KEY: 'towerforge_game',
    SAVE_VERSION: 6,
    MAX_SLOTS: 3,
    MAX_UNDO_SNAPSHOTS: 3,

    // Save statistics
    _saveStats: {
        lastSaveTime: null,
        totalSaves: 0,
        totalPlayTime: 0,
        sessionStartTime: Date.now(),
    },

    // Auto-save indicator
    _autoSaveIndicator: {
        visible: false,
        timer: 0,
        duration: 1.5,
    },

    // Undo system snapshots
    _undoSnapshots: [],

    // ===== SAVE VERSIONING & MIGRATION =====
    _migrateData(data, fromVersion) {
        // Migration from version 1 to 2: added mapWaveRecords
        if (fromVersion < 2) {
            if (!data.mapWaveRecords) {
                data.mapWaveRecords = [0, 0, 0, 0, 0];
            }
            if (!data.mapScores) {
                data.mapScores = [0, 0, 0, 0, 0];
            }
        }
        // Migration from version 2 to 3: added save stats and settings defaults
        if (fromVersion < 3) {
            if (!data.saveStats) {
                data.saveStats = {
                    lastSaveTime: null,
                    totalSaves: 0,
                    totalPlayTime: 0,
                    sessionStartTime: Date.now(),
                };
            }
            if (data.settings && data.settings.shakeIntensity === undefined) {
                data.settings.shakeIntensity = 1.0;
            }
        }
        // Migration from version 3 to 4: expand to 20 maps (4 difficulty groups of 5)
        if (fromVersion < 4) {
            // Expand unlockedMaps from 5 to 20, first map of each group always unlocked
            if (data.unlockedMaps && data.unlockedMaps.length < 20) {
                const old = data.unlockedMaps;
                data.unlockedMaps = new Array(20).fill(false);
                for (let i = 0; i < old.length && i < 20; i++) {
                    data.unlockedMaps[i] = old[i];
                }
                // Ensure first map of each group is unlocked
                data.unlockedMaps[0] = true;
                data.unlockedMaps[5] = true;
                data.unlockedMaps[10] = true;
                data.unlockedMaps[15] = true;
            }
            // Expand mapScores and mapWaveRecords
            if (data.mapScores && data.mapScores.length < 20) {
                while (data.mapScores.length < 20) data.mapScores.push(0);
            }
            if (data.mapWaveRecords && data.mapWaveRecords.length < 20) {
                while (data.mapWaveRecords.length < 20) data.mapWaveRecords.push(0);
            }
        }
        // Migration from version 4 to 5: add meta progression stats
        if (fromVersion < 5) {
            if (!data.metaProgress || typeof data.metaProgress !== 'object') {
                data.metaProgress = {
                    endlessBestDepthByMap: new Array(20).fill(0),
                    endlessMilestonesClaimed: {},
                    totalEndlessMilestones: 0,
                    challengeWinStreak: 0,
                    bestChallengeWinStreak: 0,
                    totalChallengeVictories: 0,
                    weeklyRecords: {},
                };
            }
        }
        // Migration from version 5 to 6: add weekly records meta block
        if (fromVersion < 6) {
            if (!data.metaProgress || typeof data.metaProgress !== 'object') {
                data.metaProgress = {};
            }
            if (!data.metaProgress.weeklyRecords || typeof data.metaProgress.weeklyRecords !== 'object') {
                data.metaProgress.weeklyRecords = {};
            }
        }
        data._version = this.SAVE_VERSION;
        return data;
    },

    _normalizeMetaProgress(metaProgress) {
        const base = {
            endlessBestDepthByMap: new Array(20).fill(0),
            endlessMilestonesClaimed: {},
            totalEndlessMilestones: 0,
            challengeWinStreak: 0,
            bestChallengeWinStreak: 0,
            totalChallengeVictories: 0,
            weeklyRecords: {},
        };
        if (!metaProgress || typeof metaProgress !== 'object') return base;

        const out = { ...base, ...metaProgress };
        if (!Array.isArray(out.endlessBestDepthByMap)) out.endlessBestDepthByMap = [...base.endlessBestDepthByMap];
        while (out.endlessBestDepthByMap.length < 20) out.endlessBestDepthByMap.push(0);
        out.endlessBestDepthByMap = out.endlessBestDepthByMap.slice(0, 20).map(v => Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0);
        if (!out.endlessMilestonesClaimed || typeof out.endlessMilestonesClaimed !== 'object') out.endlessMilestonesClaimed = {};
        out.totalEndlessMilestones = Number.isFinite(out.totalEndlessMilestones) ? Math.max(0, Math.floor(out.totalEndlessMilestones)) : 0;
        out.challengeWinStreak = Number.isFinite(out.challengeWinStreak) ? Math.max(0, Math.floor(out.challengeWinStreak)) : 0;
        out.bestChallengeWinStreak = Number.isFinite(out.bestChallengeWinStreak) ? Math.max(0, Math.floor(out.bestChallengeWinStreak)) : 0;
        out.totalChallengeVictories = Number.isFinite(out.totalChallengeVictories) ? Math.max(0, Math.floor(out.totalChallengeVictories)) : 0;
        if (!out.weeklyRecords || typeof out.weeklyRecords !== 'object') out.weeklyRecords = {};
        return out;
    },

    // ===== VALIDATION & CORRUPTION DETECTION =====
    _computeChecksum(str) {
        // Simple hash for corruption detection
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const ch = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + ch;
            hash = hash & hash; // Convert to 32-bit int
        }
        return hash;
    },

    _validateSaveData(data) {
        if (!data || typeof data !== 'object') return false;

        // Check required persistent fields
        if (data.researchPoints !== undefined) {
            if (typeof data.researchPoints !== 'number' || data.researchPoints < 0) return false;
            if (!Array.isArray(data.unlockedMaps)) return false;
            if (!Array.isArray(data.purchasedResearch)) return false;
        }

        // Check required game fields
        if (data.mapIndex !== undefined) {
            if (typeof data.mapIndex !== 'number' || data.mapIndex < 0) return false;
            if (typeof data.wave !== 'number' || data.wave < 0) return false;
            if (typeof data.gold !== 'number') return false;
            if (typeof data.lives !== 'number') return false;
        }

        return true;
    },

    _validateAndParse(raw) {
        if (!raw) return null;
        try {
            // Check for checksum wrapper
            let jsonStr = raw;
            let storedChecksum = null;

            if (raw.startsWith('{"_cs":')) {
                const wrapper = JSON.parse(raw);
                jsonStr = wrapper._data;
                storedChecksum = wrapper._cs;

                // Verify checksum
                const computedChecksum = this._computeChecksum(jsonStr);
                if (storedChecksum !== computedChecksum) {
                    console.warn('Save data checksum mismatch - possible corruption');
                    // Try to parse anyway, data might still be usable
                }
            }

            const data = JSON.parse(jsonStr);
            if (!this._validateSaveData(data)) {
                console.warn('Save data validation failed');
                return null;
            }
            return data;
        } catch (e) {
            console.warn('Failed to parse save data', e);
            return null;
        }
    },

    _wrapWithChecksum(data) {
        const jsonStr = JSON.stringify(data);
        const checksum = this._computeChecksum(jsonStr);
        return JSON.stringify({ _cs: checksum, _data: jsonStr });
    },

    // ===== SAVE SIZE TRACKING & OPTIMIZATION =====
    getSaveSize() {
        let totalSize = 0;
        const keys = [this.PERSIST_KEY, this.GAME_KEY];
        // Include slot keys
        for (let i = 0; i < this.MAX_SLOTS; i++) {
            keys.push(this.GAME_KEY + '_slot' + i);
        }
        for (const key of keys) {
            const val = localStorage.getItem(key);
            if (val) totalSize += val.length * 2; // approximate bytes (UTF-16)
        }
        return totalSize;
    },

    getSaveSizeFormatted() {
        const bytes = this.getSaveSize();
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    },

    _compressTowerData(towers) {
        // Compress tower data by omitting default values
        return towers.map(t => {
            const compressed = {
                t: t.type,
                c: t.gridCol,
                r: t.gridRow,
                x: Math.round(t.x),
                y: Math.round(t.y),
                i: t.tier,
            };
            if (t.path) compressed.p = t.path;
            if (t.kills > 0) compressed.k = t.kills;
            if (t.totalCost) compressed.$ = t.totalCost;
            if (t.targetMode !== 'first') compressed.m = t.targetMode;
            if (t.xp > 0) compressed.xp = Math.floor(t.xp);
            if (t.xpLevel > 0) compressed.xl = t.xpLevel;
            if (t.xpToNextLevel && t.xpToNextLevel !== 100) compressed.xt = t.xpToNextLevel;
            if (t.xpBonusDmg > 0) compressed.xd = t.xpBonusDmg;
            if (t.xpBonusRate > 0) compressed.xr = t.xpBonusRate;
            if (t.xpBonusRange > 0) compressed.xg = t.xpBonusRange;
            if (t.masteryLevel > 0) compressed.ml = t.masteryLevel;
            if (t.beamRamp > 0) compressed.br = t.beamRamp;
            if (t.stats) compressed.st = { ...t.stats };
            return compressed;
        });
    },

    _decompressTowerData(compressed) {
        if (!compressed || !Array.isArray(compressed)) return [];
        return compressed.map(c => {
            // Support both compressed and legacy format
            if (c.type !== undefined) return c; // Legacy format
            return {
                type: c.t,
                gridCol: c.c,
                gridRow: c.r,
                x: c.x,
                y: c.y,
                tier: c.i || 1,
                path: c.p || null,
                kills: c.k || 0,
                totalCost: c.$ || 0,
                targetMode: c.m || 'first',
                xp: c.xp || 0,
                xpLevel: c.xl || 0,
                xpToNextLevel: c.xt || 100,
                xpBonusDmg: c.xd || 0,
                xpBonusRate: c.xr || 0,
                xpBonusRange: c.xg || 0,
                masteryLevel: c.ml || 0,
                beamRamp: c.br || 0,
                stats: c.st || null,
            };
        });
    },

    // ===== PERSISTENT DATA =====
    savePersistent() {
        try {
            // Update save stats
            this._saveStats.totalSaves++;
            this._saveStats.lastSaveTime = Date.now();
            this._saveStats.totalPlayTime += (Date.now() - this._saveStats.sessionStartTime) / 1000;
            this._saveStats.sessionStartTime = Date.now();

            const data = {
                _version: this.SAVE_VERSION,
                researchPoints: GameState.researchPoints,
                purchasedResearch: [...GameState.purchasedResearch],
                unlockedMaps: GameState.unlockedMaps,
                achievementsUnlocked: [...GameState.achievementsUnlocked],
                mapScores: GameState.mapScores,
                mapWaveRecords: GameState.mapWaveRecords,
                metaProgress: this._normalizeMetaProgress(GameState.metaProgress),
                settings: GameState.settings,
                saveStats: { ...this._saveStats },
            };
            localStorage.setItem(this.PERSIST_KEY, this._wrapWithChecksum(data));
        } catch (e) {
            console.warn('Failed to save persistent data', e);
        }
    },

    loadPersistent() {
        try {
            const raw = localStorage.getItem(this.PERSIST_KEY);
            if (!raw) return;

            let data;
            // Support both legacy and checksummed format
            if (raw.startsWith('{"_cs":')) {
                data = this._validateAndParse(raw);
            } else {
                data = JSON.parse(raw);
            }

            if (!data) {
                console.warn('Persistent data could not be loaded');
                return;
            }

            // Run migrations if needed
            const version = data._version || 1;
            if (version < this.SAVE_VERSION) {
                data = this._migrateData(data, version);
                // Re-save with updated version
                localStorage.setItem(this.PERSIST_KEY, this._wrapWithChecksum(data));
            }

            GameState.researchPoints = data.researchPoints || 0;
            GameState.purchasedResearch = new Set(data.purchasedResearch || []);
            GameState.unlockedMaps = data.unlockedMaps || [true,false,false,false,false,true,false,false,false,false,true,false,false,false,false,true,false,false,false,false];
            GameState.achievementsUnlocked = new Set(data.achievementsUnlocked || []);
            GameState.mapScores = data.mapScores || [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
            GameState.mapWaveRecords = data.mapWaveRecords || [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
            GameState.metaProgress = this._normalizeMetaProgress(data.metaProgress);

            // Ensure arrays are long enough for 20 maps
            while (GameState.unlockedMaps.length < 20) GameState.unlockedMaps.push(false);
            while (GameState.mapScores.length < 20) GameState.mapScores.push(0);
            while (GameState.mapWaveRecords.length < 20) GameState.mapWaveRecords.push(0);
            // First map of each difficulty group is always unlocked
            GameState.unlockedMaps[0] = true;
            GameState.unlockedMaps[5] = true;
            GameState.unlockedMaps[10] = true;
            GameState.unlockedMaps[15] = true;

            if (data.settings) {
                Object.assign(GameState.settings, data.settings);
            }

            if (typeof Input !== 'undefined' && typeof Input.applySettingsHotkeys === 'function') {
                Input.applySettingsHotkeys();
            }

            // Restore save stats
            if (data.saveStats) {
                Object.assign(this._saveStats, data.saveStats);
                this._saveStats.sessionStartTime = Date.now();
            }

            GameState.computeResearchBonuses();
        } catch (e) {
            console.warn('Failed to load persistent data', e);
        }
    },

    // ===== GAME SAVE (auto-save + slot system) =====
    autoSave() {
        // Save game state for resume
        try {
            const data = this._buildGameSaveData();
            localStorage.setItem(this.GAME_KEY, this._wrapWithChecksum(data));

            // Show auto-save indicator
            this._showAutoSaveIndicator();

            // Update stats
            this._saveStats.totalSaves++;
            this._saveStats.lastSaveTime = Date.now();
        } catch (e) {
            console.warn('Failed to auto-save', e);
        }
    },

    _buildGameSaveData() {
        const weeklyRun = GameState.weeklyChallengeRun && GameState.weeklyChallengeRun.active
            ? {
                ...GameState.weeklyChallengeRun,
                modifiers: Array.isArray(GameState.weeklyChallengeRun.modifiers)
                    ? [...GameState.weeklyChallengeRun.modifiers]
                    : [],
            }
            : null;

        const waveState = (typeof WaveSystem !== 'undefined')
            ? {
                endlessDraftMutatorIds: Array.isArray(WaveSystem.endlessDraftMutatorIds)
                    ? [...WaveSystem.endlessDraftMutatorIds]
                    : [],
                endlessDraftedDepths: Array.isArray(WaveSystem.endlessDraftedDepths)
                    ? [...WaveSystem.endlessDraftedDepths]
                    : [],
            }
            : {
                endlessDraftMutatorIds: [],
                endlessDraftedDepths: [],
            };

        return {
            _version: this.SAVE_VERSION,
            _timestamp: Date.now(),
            mapIndex: GameState.mapIndex,
            difficulty: GameState.settings.difficulty || 'normal',
            endlessMode: !!(typeof WaveSystem !== 'undefined' && WaveSystem.endlessMode),
            activeChallenges: [...(GameState.activeChallenges || [])],
            weeklyChallengeRun: weeklyRun,
            waveState: waveState,
            wave: GameState.wave,
            gold: GameState.gold,
            lives: GameState.lives,
            score: GameState.score,
            time: GameState.time,
            towers: this._compressTowerData(GameState.towers),
            stats: {
                ...GameState.stats,
                towerTypesSet: [...(GameState.stats.towerTypesSet || [])],
                mapsCompleted: GameState.stats.mapsCompleted || [],
            },
        };
    },

    // ===== MULTIPLE SAVE SLOTS =====
    saveToSlot(slotIndex) {
        if (slotIndex < 0 || slotIndex >= this.MAX_SLOTS) {
            console.warn('Invalid slot index:', slotIndex);
            return false;
        }
        try {
            const data = this._buildGameSaveData();
            data._slotIndex = slotIndex;
            data._slotSavedAt = Date.now();
            const key = this.GAME_KEY + '_slot' + slotIndex;
            localStorage.setItem(key, this._wrapWithChecksum(data));
            this._showAutoSaveIndicator();
            return true;
        } catch (e) {
            console.warn('Failed to save to slot ' + slotIndex, e);
            return false;
        }
    },

    loadFromSlot(slotIndex) {
        if (slotIndex < 0 || slotIndex >= this.MAX_SLOTS) {
            console.warn('Invalid slot index:', slotIndex);
            return false;
        }
        try {
            const key = this.GAME_KEY + '_slot' + slotIndex;
            const raw = localStorage.getItem(key);
            if (!raw) return false;

            const data = this._validateAndParse(raw);
            if (!data) return false;

            // Run migrations
            const version = data._version || 1;
            if (version < this.SAVE_VERSION) {
                this._migrateData(data, version);
            }

            return this._restoreGameData(data);
        } catch (e) {
            console.warn('Failed to load from slot ' + slotIndex, e);
            return false;
        }
    },

    getSlotInfo(slotIndex) {
        if (slotIndex < 0 || slotIndex >= this.MAX_SLOTS) return null;
        try {
            const key = this.GAME_KEY + '_slot' + slotIndex;
            const raw = localStorage.getItem(key);
            if (!raw) return null;

            const data = this._validateAndParse(raw);
            if (!data) return null;

            return {
                slotIndex: slotIndex,
                mapIndex: data.mapIndex,
                wave: data.wave,
                gold: data.gold,
                lives: data.lives,
                score: data.score,
                savedAt: data._slotSavedAt || data._timestamp || null,
                version: data._version || 1,
            };
        } catch (e) {
            return null;
        }
    },

    getAllSlotInfo() {
        const slots = [];
        for (let i = 0; i < this.MAX_SLOTS; i++) {
            slots.push(this.getSlotInfo(i));
        }
        return slots;
    },

    clearSlot(slotIndex) {
        if (slotIndex < 0 || slotIndex >= this.MAX_SLOTS) return;
        const key = this.GAME_KEY + '_slot' + slotIndex;
        localStorage.removeItem(key);
    },

    // ===== EXPORT / IMPORT =====
    exportSave() {
        try {
            const exportData = {
                _exportVersion: this.SAVE_VERSION,
                _exportedAt: Date.now(),
                persistent: null,
                game: null,
                slots: [],
            };

            // Export persistent data
            const persistRaw = localStorage.getItem(this.PERSIST_KEY);
            if (persistRaw) {
                exportData.persistent = persistRaw;
            }

            // Export current game save
            const gameRaw = localStorage.getItem(this.GAME_KEY);
            if (gameRaw) {
                exportData.game = gameRaw;
            }

            // Export all slots
            for (let i = 0; i < this.MAX_SLOTS; i++) {
                const slotRaw = localStorage.getItem(this.GAME_KEY + '_slot' + i);
                exportData.slots.push(slotRaw || null);
            }

            const jsonStr = JSON.stringify(exportData);
            // Encode to base64 for easy sharing/backup
            return btoa(unescape(encodeURIComponent(jsonStr)));
        } catch (e) {
            console.warn('Failed to export save data', e);
            return null;
        }
    },

    importSave(base64String) {
        try {
            if (!base64String || typeof base64String !== 'string') {
                console.warn('Invalid import string');
                return false;
            }

            const jsonStr = decodeURIComponent(escape(atob(base64String.trim())));
            const exportData = JSON.parse(jsonStr);

            if (!exportData._exportVersion) {
                console.warn('Invalid export data format');
                return false;
            }

            // Restore persistent data
            if (exportData.persistent) {
                localStorage.setItem(this.PERSIST_KEY, exportData.persistent);
            }

            // Restore game save
            if (exportData.game) {
                localStorage.setItem(this.GAME_KEY, exportData.game);
            }

            // Restore slots
            if (Array.isArray(exportData.slots)) {
                for (let i = 0; i < Math.min(exportData.slots.length, this.MAX_SLOTS); i++) {
                    const key = this.GAME_KEY + '_slot' + i;
                    if (exportData.slots[i]) {
                        localStorage.setItem(key, exportData.slots[i]);
                    } else {
                        localStorage.removeItem(key);
                    }
                }
            }

            // Reload persistent data into game state
            this.loadPersistent();

            return true;
        } catch (e) {
            console.warn('Failed to import save data', e);
            return false;
        }
    },

    // ===== AUTO-SAVE INDICATOR =====
    _showAutoSaveIndicator() {
        this._autoSaveIndicator.visible = true;
        this._autoSaveIndicator.timer = this._autoSaveIndicator.duration;
    },

    updateAutoSaveIndicator(dt) {
        if (this._autoSaveIndicator.timer > 0) {
            this._autoSaveIndicator.timer -= dt;
            if (this._autoSaveIndicator.timer <= 0) {
                this._autoSaveIndicator.visible = false;
                this._autoSaveIndicator.timer = 0;
            }
        }
    },

    drawAutoSaveIndicator(ctx, canvasW) {
        if (!this._autoSaveIndicator.visible) return;

        const alpha = Math.min(1, this._autoSaveIndicator.timer / 0.3);
        ctx.save();
        ctx.globalAlpha = alpha * 0.8;
        ctx.font = '12px Orbitron, sans-serif';
        ctx.fillStyle = '#aaa';
        ctx.textAlign = 'right';
        ctx.fillText('Saving...', canvasW - 15, 25);

        // Small spinning icon
        const t = (this._autoSaveIndicator.duration - this._autoSaveIndicator.timer) * 4;
        const ix = canvasW - 70;
        const iy = 21;
        ctx.strokeStyle = '#aaa';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(ix, iy, 5, t, t + Math.PI * 1.5);
        ctx.stroke();
        ctx.restore();
    },

    // ===== UNDO SYSTEM (STATE SNAPSHOTS) =====
    pushUndoSnapshot() {
        try {
            const snapshot = this._buildGameSaveData();
            snapshot._undoTimestamp = Date.now();
            this._undoSnapshots.push(JSON.stringify(snapshot));

            // Limit number of snapshots
            while (this._undoSnapshots.length > this.MAX_UNDO_SNAPSHOTS) {
                this._undoSnapshots.shift();
            }
        } catch (e) {
            console.warn('Failed to push undo snapshot', e);
        }
    },

    canUndo() {
        return this._undoSnapshots.length > 0;
    },

    getUndoCount() {
        return this._undoSnapshots.length;
    },

    popUndoSnapshot() {
        if (this._undoSnapshots.length === 0) return false;
        try {
            const snapshotStr = this._undoSnapshots.pop();
            const data = JSON.parse(snapshotStr);
            return this._restoreGameData(data);
        } catch (e) {
            console.warn('Failed to restore undo snapshot', e);
            return false;
        }
    },

    clearUndoSnapshots() {
        this._undoSnapshots = [];
    },

    // ===== CLOUD SAVE PREPARATION =====
    getCloudSavePayload() {
        // Structure data for potential server sync
        return {
            version: this.SAVE_VERSION,
            timestamp: Date.now(),
            persistent: this._getCloudPersistentData(),
            gameState: this.hasSavedGame() ? this._buildGameSaveData() : null,
            slots: this.getAllSlotInfo(),
            stats: { ...this._saveStats },
            checksum: this._computeChecksum(JSON.stringify(GameState.researchPoints + '|' + GameState.score)),
        };
    },

    _getCloudPersistentData() {
        return {
            researchPoints: GameState.researchPoints,
            purchasedResearch: [...GameState.purchasedResearch],
            unlockedMaps: GameState.unlockedMaps,
            achievementsUnlocked: [...GameState.achievementsUnlocked],
            mapScores: GameState.mapScores,
            mapWaveRecords: GameState.mapWaveRecords,
            metaProgress: this._normalizeMetaProgress(GameState.metaProgress),
        };
    },

    restoreFromCloudPayload(payload) {
        if (!payload || payload.version === undefined) return false;
        try {
            if (payload.persistent) {
                GameState.researchPoints = payload.persistent.researchPoints || 0;
                GameState.purchasedResearch = new Set(payload.persistent.purchasedResearch || []);
                GameState.unlockedMaps = payload.persistent.unlockedMaps || [true, false, false, false, false];
                GameState.achievementsUnlocked = new Set(payload.persistent.achievementsUnlocked || []);
                GameState.mapScores = payload.persistent.mapScores || [0, 0, 0, 0, 0];
                GameState.mapWaveRecords = payload.persistent.mapWaveRecords || [0, 0, 0, 0, 0];
                GameState.metaProgress = this._normalizeMetaProgress(payload.persistent.metaProgress);
                GameState.computeResearchBonuses();
                this.savePersistent();
            }
            return true;
        } catch (e) {
            console.warn('Failed to restore from cloud payload', e);
            return false;
        }
    },

    // ===== SAVE STATISTICS =====
    getSaveStats() {
        return {
            lastSaveTime: this._saveStats.lastSaveTime,
            totalSaves: this._saveStats.totalSaves,
            totalPlayTime: this._saveStats.totalPlayTime + (Date.now() - this._saveStats.sessionStartTime) / 1000,
            saveSize: this.getSaveSizeFormatted(),
            undoAvailable: this._undoSnapshots.length,
        };
    },

    getFormattedPlayTime() {
        const totalSeconds = this._saveStats.totalPlayTime + (Date.now() - this._saveStats.sessionStartTime) / 1000;
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = Math.floor(totalSeconds % 60);
        if (hours > 0) {
            return hours + 'h ' + minutes + 'm ' + seconds + 's';
        }
        if (minutes > 0) {
            return minutes + 'm ' + seconds + 's';
        }
        return seconds + 's';
    },

    // ===== CORE LOAD/RESTORE =====
    hasSavedGame() {
        return !!localStorage.getItem(this.GAME_KEY);
    },

    getSavedGameInfo() {
        try {
            const raw = localStorage.getItem(this.GAME_KEY);
            if (!raw) return null;

            let data;
            if (raw.startsWith('{"_cs":')) {
                data = this._validateAndParse(raw);
            } else {
                data = JSON.parse(raw);
            }
            if (!data || typeof data !== 'object') return null;

            const rawMapIndex = Number.isFinite(data.mapIndex)
                ? data.mapIndex
                : Number.parseInt(data.mapIndex, 10);
            const mapIndex = Number.isFinite(rawMapIndex) ? rawMapIndex : -1;
            const mapDef = MAPS[mapIndex];

            const rawWave = Number.isFinite(data.wave) ? data.wave : Number.parseInt(data.wave, 10);
            const wave = Number.isFinite(rawWave) ? rawWave : 0;

            const difficultyKey = typeof data.difficulty === 'string' ? data.difficulty : (GameState.settings.difficulty || 'normal');
            const preset = CONFIG.DIFFICULTY_PRESETS[difficultyKey] || null;
            const difficultyName = preset ? preset.name : 'Unknown';
            const weekly = data.weeklyChallengeRun && typeof data.weeklyChallengeRun === 'object'
                ? data.weeklyChallengeRun
                : null;

            return {
                mapIndex,
                mapName: mapDef && mapDef.name ? mapDef.name : (mapIndex >= 0 ? `Map ${mapIndex + 1}` : 'Saved Run'),
                wave,
                difficultyKey,
                difficultyName,
                endlessMode: !!data.endlessMode,
                activeChallenges: Array.isArray(data.activeChallenges) ? data.activeChallenges : [],
                weeklyMode: !!(weekly && weekly.active),
                weeklyWeekId: weekly && typeof weekly.weekId === 'string' ? weekly.weekId : '',
                savedAt: Number.isFinite(data._timestamp) ? data._timestamp : null,
                elapsedTimeSec: Number.isFinite(data.time) ? data.time : 0,
            };
        } catch (e) {
            return null;
        }
    },

    loadGame() {
        try {
            const raw = localStorage.getItem(this.GAME_KEY);
            if (!raw) return false;

            let data;
            if (raw.startsWith('{"_cs":')) {
                data = this._validateAndParse(raw);
            } else {
                data = JSON.parse(raw);
            }

            if (!data) return false;

            // Run migrations
            const version = data._version || 1;
            if (version < this.SAVE_VERSION) {
                data = this._migrateData(data, version);
            }

            return this._restoreGameData(data);
        } catch (e) {
            console.warn('Failed to load game', e);
            return false;
        }
    },

    _restoreGameData(data) {
        try {
            GameState.mapIndex = data.mapIndex;
            MapSystem.init(data.mapIndex);
            WaveSystem.init(data.mapIndex);
            WaveSystem.endlessMode = !!data.endlessMode;

            if (data.waveState && typeof data.waveState === 'object') {
                WaveSystem.endlessDraftMutatorIds = Array.isArray(data.waveState.endlessDraftMutatorIds)
                    ? [...data.waveState.endlessDraftMutatorIds]
                    : [];
                WaveSystem.endlessDraftedDepths = Array.isArray(data.waveState.endlessDraftedDepths)
                    ? [...data.waveState.endlessDraftedDepths]
                    : [];
            }

            GameState.wave = data.wave;
            GameState.gold = data.gold;
            GameState.lives = data.lives;
            GameState.maxLives = data.lives;
            GameState.score = data.score;
            GameState.time = data.time || 0;
            GameState.activeChallenges = Array.isArray(data.activeChallenges) ? [...data.activeChallenges] : [];
            GameState.weeklyChallengeRun = (data.weeklyChallengeRun && typeof data.weeklyChallengeRun === 'object' && data.weeklyChallengeRun.active)
                ? {
                    ...data.weeklyChallengeRun,
                    modifiers: Array.isArray(data.weeklyChallengeRun.modifiers)
                        ? [...data.weeklyChallengeRun.modifiers]
                        : [],
                }
                : null;
            GameState.gamePhase = 'idle';

            if (typeof data.difficulty === 'string' && CONFIG.DIFFICULTY_PRESETS[data.difficulty]) {
                GameState.settings.difficulty = data.difficulty;
            }

            // Rebuild towers (support both compressed and legacy format)
            GameState.towers = [];
            const towerData = this._decompressTowerData(data.towers);
            for (const td of towerData) {
                const hasWorldPos = Number.isFinite(td.x) && Number.isFinite(td.y);
                const worldX = hasWorldPos ? td.x : ((td.gridCol + 0.5) * CONFIG.TILE_SIZE);
                const worldY = hasWorldPos ? td.y : ((td.gridRow + 0.5) * CONFIG.TILE_SIZE);
                const tower = new Tower(td.type, worldX, worldY);
                tower.tier = 1;
                tower.path = td.path;
                // Upgrade to saved tier
                while (tower.tier < td.tier) {
                    tower.tier++;
                    tower._applyTierStats();
                }
                tower.kills = td.kills || 0;
                tower.totalCost = td.totalCost || TOWERS[td.type].baseCost;
                tower.targetMode = td.targetMode || 'first';
                tower.masteryLevel = td.masteryLevel || 0;
                tower.xp = td.xp || 0;
                tower.xpLevel = td.xpLevel || 0;
                tower.xpToNextLevel = td.xpToNextLevel || 100;
                tower.xpBonusDmg = td.xpBonusDmg || 0;
                tower.xpBonusRate = td.xpBonusRate || 0;
                tower.xpBonusRange = td.xpBonusRange || 0;
                tower.beamRamp = td.beamRamp || 0;
                if (td.stats && typeof td.stats === 'object') {
                    tower.stats = {
                        ...tower.stats,
                        ...td.stats,
                    };
                }
                GameState.towers.push(tower);
            }

            // Restore stats
            if (data.stats) {
                GameState.stats = {
                    ...data.stats,
                    towerTypesSet: new Set(data.stats.towerTypesSet || []),
                };
            }

            return true;
        } catch (e) {
            console.warn('Failed to restore game data', e);
            return false;
        }
    },

    clearSavedGame() {
        localStorage.removeItem(this.GAME_KEY);
    },

    // ===== FULL RESET =====
    clearAllData() {
        localStorage.removeItem(this.PERSIST_KEY);
        localStorage.removeItem(this.GAME_KEY);
        for (let i = 0; i < this.MAX_SLOTS; i++) {
            localStorage.removeItem(this.GAME_KEY + '_slot' + i);
        }
        this._undoSnapshots = [];
        this._saveStats = {
            lastSaveTime: null,
            totalSaves: 0,
            totalPlayTime: 0,
            sessionStartTime: Date.now(),
        };
    },
};
