// ===== CAMPAIGN PROGRESSION SYSTEM =====
const ProgressionSystem = {
    MARK_CLEAR: 1,
    MARK_PERFECT: 2,
    MARK_DIRECTIVE: 4,
    BAND_ORDER: ['easy', 'normal', 'hard', 'nightmare'],

    _getConfig() {
        return CONFIG.PROGRESSION || {};
    },

    _ensureMeta() {
        if (!GameState.metaProgress || typeof GameState.metaProgress !== 'object') {
            GameState.metaProgress = {};
        }
        const meta = GameState.metaProgress;
        if (!Array.isArray(meta.mapMarkBits)) meta.mapMarkBits = new Array(MAPS.length).fill(0);
        while (meta.mapMarkBits.length < MAPS.length) meta.mapMarkBits.push(0);
        meta.mapMarkBits = meta.mapMarkBits.slice(0, MAPS.length).map((value) => Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0);
        meta.commandMarks = Number.isFinite(meta.commandMarks) ? Math.max(0, Math.floor(meta.commandMarks)) : 0;
        if (!meta.towerLicenses || typeof meta.towerLicenses !== 'object') meta.towerLicenses = {};
        meta.progressionVersion = Number.isFinite(meta.progressionVersion) ? Math.max(1, Math.floor(meta.progressionVersion)) : 1;
        meta.legacyProgressionBackfillDone = !!meta.legacyProgressionBackfillDone;
        meta.lifetimeMapsCleared = Number.isFinite(meta.lifetimeMapsCleared) ? Math.max(0, Math.floor(meta.lifetimeMapsCleared)) : 0;
        meta.lifetimePerfectClears = Number.isFinite(meta.lifetimePerfectClears) ? Math.max(0, Math.floor(meta.lifetimePerfectClears)) : 0;
        meta.lifetimeDirectiveClears = Number.isFinite(meta.lifetimeDirectiveClears) ? Math.max(0, Math.floor(meta.lifetimeDirectiveClears)) : 0;
        meta.lifetimeBossKills = Number.isFinite(meta.lifetimeBossKills) ? Math.max(0, Math.floor(meta.lifetimeBossKills)) : 0;
        meta.lifetimeCaptainKills = Number.isFinite(meta.lifetimeCaptainKills) ? Math.max(0, Math.floor(meta.lifetimeCaptainKills)) : 0;
        return meta;
    },

    _countBits(value) {
        let n = Math.max(0, Math.floor(value || 0));
        let out = 0;
        while (n > 0) {
            out += n & 1;
            n >>= 1;
        }
        return out;
    },

    recalculateCommandMarks() {
        const meta = this._ensureMeta();
        meta.commandMarks = meta.mapMarkBits.reduce((sum, bits) => sum + this._countBits(bits), 0);
        return meta.commandMarks;
    },

    getCommandMarks() {
        return this.recalculateCommandMarks();
    },

    getMapMarkBits(mapIndex) {
        const meta = this._ensureMeta();
        return meta.mapMarkBits[mapIndex] || 0;
    },

    getMapMarkCount(mapIndex) {
        return this._countBits(this.getMapMarkBits(mapIndex));
    },

    hasMapMark(mapIndex, markBit) {
        return !!(this.getMapMarkBits(mapIndex) & markBit);
    },

    getMapDirective(mapIndex) {
        const directives = this._getConfig().MAP_DIRECTIVES || [];
        return directives[mapIndex] || null;
    },

    isStarterTower(type) {
        return (this._getConfig().STARTER_TOWERS || []).includes(type);
    },

    getTowerLicenseDef(type) {
        return (this._getConfig().TOWER_LICENSES || {})[type] || null;
    },

    isTowerUnlocked(type) {
        if (!type || !TOWERS[type]) return false;
        if (this.isStarterTower(type)) return true;
        const meta = this._ensureMeta();
        return !!meta.towerLicenses[type];
    },

    _getClearedMapCount() {
        return GameState.mapScores.reduce((sum, score) => sum + (score > 0 ? 1 : 0), 0);
    },

    _isDifficultyBandCleared(diffKey) {
        const group = this.BAND_ORDER.indexOf(diffKey);
        if (group < 0) return false;
        const start = group * 5;
        const end = Math.min(MAPS.length, start + 5);
        for (let i = start; i < end; i++) {
            if ((GameState.mapScores[i] || 0) <= 0) return false;
        }
        return true;
    },

    _getBestEndlessDepth() {
        const meta = this._ensureMeta();
        const values = Array.isArray(meta.endlessBestDepthByMap) ? meta.endlessBestDepthByMap : [];
        let best = 0;
        for (const value of values) {
            if (Number.isFinite(value)) best = Math.max(best, Math.floor(value));
        }
        return best;
    },

    _hasLegacyProgressEvidence() {
        const meta = this._ensureMeta();
        const hasMapClears = Array.isArray(GameState.mapScores)
            && GameState.mapScores.some((score) => Number.isFinite(score) && score > 0);
        const hasResearch = GameState.purchasedResearch instanceof Set
            ? GameState.purchasedResearch.size > 0
            : false;
        const hasAchievements = GameState.achievementsUnlocked instanceof Set
            ? GameState.achievementsUnlocked.size > 0
            : false;
        const hasLifetimeTotals = [
            meta.lifetimeMapsCleared,
            meta.lifetimePerfectClears,
            meta.lifetimeDirectiveClears,
            meta.lifetimeBossKills,
            meta.lifetimeCaptainKills,
        ].some((value) => Number.isFinite(value) && value > 0);

        return hasMapClears || hasResearch || hasAchievements || hasLifetimeTotals;
    },

    _findAchievementName(id) {
        const ach = Array.isArray(ACHIEVEMENTS) ? ACHIEVEMENTS.find((item) => item.id === id) : null;
        return ach ? ach.name : id;
    },

    _getPersistentContext(runContext = null) {
        const meta = this._ensureMeta();
        const currentRun = runContext || null;
        return {
            marks: this.recalculateCommandMarks(),
            clearedMaps: this._getClearedMapCount(),
            researchNodes: GameState.purchasedResearch.size,
            achievementsUnlocked: GameState.achievementsUnlocked,
            bestEndlessDepth: this._getBestEndlessDepth(),
            lifetimeBossKills: Math.max(0, (meta.lifetimeBossKills || 0) + (currentRun ? currentRun.bossKills : 0)),
            lifetimeCaptainKills: Math.max(0, (meta.lifetimeCaptainKills || 0) + (currentRun ? currentRun.captainKills : 0)),
            run: currentRun,
        };
    },

    _getRunSnapshot() {
        const stats = GameState.stats || {};
        const currentTier5 = GameState.towers.filter((tower) => tower && tower.tier >= 5).length;
        return {
            towerTypesBuilt: stats.towerTypesBuilt || 0,
            maxGold: stats.maxGold || 0,
            overclockUses: stats.overclockUses || 0,
            peakLinks: stats.maxActiveLinks || 0,
            peakTier5: Math.max(stats.tier5CountPeak || 0, currentTier5),
            abilitiesUsed: stats.abilitiesUsed || 0,
            towersPlaced: stats.towersPlacedThisRun || 0,
            noSell: !!stats.towersNeverSold,
            noLeaks: (stats.leaksThisGame || 0) === 0,
            bossKills: stats.bossKills || 0,
            freezeApplications: stats.freezeApplications || 0,
            burnDamage: stats.burnDamageDealt || 0,
            poisonDamage: stats.poisonDamageDealt || 0,
            captainKills: stats.captainKillsThisRun || 0,
        };
    },

    _evaluateRequirement(requirement, context) {
        if (!requirement) return { met: true, lines: [] };

        if (Array.isArray(requirement.and)) {
            const parts = requirement.and.map((item) => this._evaluateRequirement(item, context));
            return {
                met: parts.every((part) => part.met),
                lines: parts.flatMap((part) => part.lines),
            };
        }

        if (Array.isArray(requirement.or)) {
            const parts = requirement.or.map((item) => this._evaluateRequirement(item, context));
            return {
                met: parts.some((part) => part.met),
                lines: [{ text: `Any of: ${parts.map((part) => part.lines[0] ? part.lines[0].text : 'Requirement').join(' / ')}`, met: parts.some((part) => part.met) }],
            };
        }

        if (Number.isFinite(requirement.marksAtLeast)) {
            const target = Math.max(0, Math.floor(requirement.marksAtLeast));
            const current = context.marks || 0;
            return { met: current >= target, lines: [{ text: `Command Marks ${current}/${target}`, met: current >= target }] };
        }

        if (Number.isFinite(requirement.clearMap)) {
            const mapIndex = Math.max(0, Math.floor(requirement.clearMap));
            const cleared = (GameState.mapScores[mapIndex] || 0) > 0;
            return { met: cleared, lines: [{ text: `Clear ${MAPS[mapIndex] ? MAPS[mapIndex].name : `Map ${mapIndex + 1}`}`, met: cleared }] };
        }

        if (typeof requirement.clearDifficultyBand === 'string') {
            const bandKey = requirement.clearDifficultyBand;
            const cleared = this._isDifficultyBandCleared(bandKey);
            const gate = (this._getConfig().BAND_GATES || {})[bandKey];
            const label = gate && gate.label ? gate.label : bandKey;
            return { met: cleared, lines: [{ text: `Clear ${label}`, met: cleared }] };
        }

        if (Number.isFinite(requirement.mapsClearedAtLeast)) {
            const target = Math.max(0, Math.floor(requirement.mapsClearedAtLeast));
            const current = context.clearedMaps || 0;
            return { met: current >= target, lines: [{ text: `Map clears ${current}/${target}`, met: current >= target }] };
        }

        if (Number.isFinite(requirement.researchNodesAtLeast)) {
            const target = Math.max(0, Math.floor(requirement.researchNodesAtLeast));
            const current = context.researchNodes || 0;
            return { met: current >= target, lines: [{ text: `Research nodes ${current}/${target}`, met: current >= target }] };
        }

        if (typeof requirement.achievementUnlocked === 'string') {
            const id = requirement.achievementUnlocked;
            const unlocked = GameState.achievementsUnlocked.has(id);
            return { met: unlocked, lines: [{ text: `Achievement: ${this._findAchievementName(id)}`, met: unlocked }] };
        }

        if (Number.isFinite(requirement.endlessDepthAtLeast)) {
            const target = Math.max(0, Math.floor(requirement.endlessDepthAtLeast));
            const current = context.bestEndlessDepth || 0;
            return { met: current >= target, lines: [{ text: `Endless depth ${current}/${target}`, met: current >= target }] };
        }

        if (Number.isFinite(requirement.bossKillsAtLeast)) {
            const target = Math.max(0, Math.floor(requirement.bossKillsAtLeast));
            const current = context.lifetimeBossKills || 0;
            return { met: current >= target, lines: [{ text: `Boss kills ${current}/${target}`, met: current >= target }] };
        }

        const run = context.run || {};

        if (Number.isFinite(requirement.towerTypesAtLeast)) {
            const target = Math.max(0, Math.floor(requirement.towerTypesAtLeast));
            const current = run.towerTypesBuilt || 0;
            return { met: current >= target, lines: [{ text: `Tower types ${current}/${target}`, met: current >= target }] };
        }

        if (Number.isFinite(requirement.maxGoldAtLeast)) {
            const target = Math.max(0, Math.floor(requirement.maxGoldAtLeast));
            const current = run.maxGold || 0;
            return { met: current >= target, lines: [{ text: `Peak gold ${Math.floor(current)}/${target}`, met: current >= target }] };
        }

        if (Number.isFinite(requirement.overclockUsesAtLeast)) {
            const target = Math.max(0, Math.floor(requirement.overclockUsesAtLeast));
            const current = run.overclockUses || 0;
            return { met: current >= target, lines: [{ text: `Overclocks ${current}/${target}`, met: current >= target }] };
        }

        if (Number.isFinite(requirement.peakLinksAtLeast)) {
            const target = Math.max(0, Math.floor(requirement.peakLinksAtLeast));
            const current = run.peakLinks || 0;
            return { met: current >= target, lines: [{ text: `Peak links ${current}/${target}`, met: current >= target }] };
        }

        if (Number.isFinite(requirement.peakTier5AtLeast)) {
            const target = Math.max(0, Math.floor(requirement.peakTier5AtLeast));
            const current = run.peakTier5 || 0;
            return { met: current >= target, lines: [{ text: `Peak Tier 5 count ${current}/${target}`, met: current >= target }] };
        }

        if (Number.isFinite(requirement.freezeApplicationsAtLeast)) {
            const target = Math.max(0, Math.floor(requirement.freezeApplicationsAtLeast));
            const current = run.freezeApplications || 0;
            return { met: current >= target, lines: [{ text: `Freeze applications ${current}/${target}`, met: current >= target }] };
        }

        if (Number.isFinite(requirement.burnDamageAtLeast)) {
            const target = Math.max(0, Math.floor(requirement.burnDamageAtLeast));
            const current = Math.floor(run.burnDamage || 0);
            return { met: current >= target, lines: [{ text: `Burn damage ${current}/${target}`, met: current >= target }] };
        }

        if (Number.isFinite(requirement.poisonDamageAtLeast)) {
            const target = Math.max(0, Math.floor(requirement.poisonDamageAtLeast));
            const current = Math.floor(run.poisonDamage || 0);
            return { met: current >= target, lines: [{ text: `Poison damage ${current}/${target}`, met: current >= target }] };
        }

        if (Number.isFinite(requirement.captainKillsAtLeast)) {
            const target = Math.max(0, Math.floor(requirement.captainKillsAtLeast));
            const current = run && Object.keys(run).length > 0
                ? (run.captainKills || 0)
                : (context.lifetimeCaptainKills || 0);
            return { met: current >= target, lines: [{ text: `Captain kills ${current}/${target}`, met: current >= target }] };
        }

        if (Number.isFinite(requirement.abilitiesUsedAtLeast)) {
            const target = Math.max(0, Math.floor(requirement.abilitiesUsedAtLeast));
            const current = run.abilitiesUsed || 0;
            return { met: current >= target, lines: [{ text: `Abilities used ${current}/${target}`, met: current >= target }] };
        }

        if (Number.isFinite(requirement.towersPlacedAtMost)) {
            const target = Math.max(0, Math.floor(requirement.towersPlacedAtMost));
            const current = run.towersPlaced || 0;
            return { met: current <= target, lines: [{ text: `Towers placed ${current}/${target}`, met: current <= target }] };
        }

        if (requirement.noSell) {
            const met = !!run.noSell;
            return { met, lines: [{ text: 'Do not sell any tower', met }] };
        }

        if (requirement.noLeaks) {
            const met = !!run.noLeaks;
            return { met, lines: [{ text: 'Clear with no leaks', met }] };
        }

        return { met: true, lines: [] };
    },

    evaluateDirective(mapIndex) {
        const directive = this.getMapDirective(mapIndex);
        if (!directive) return { met: true, directive: null, lines: [] };
        const result = this._evaluateRequirement(directive.requirement, this._getPersistentContext(this._getRunSnapshot()));
        return {
            met: result.met,
            directive,
            lines: result.lines,
        };
    },

    getActiveDirectiveTrackerData() {
        const mapIndex = Number.isFinite(GameState.mapIndex) ? GameState.mapIndex : 0;
        const directive = this.getMapDirective(mapIndex);
        if (!directive) return null;

        const run = this._getRunSnapshot();
        const result = this._evaluateRequirement(directive.requirement, this._getPersistentContext(run));
        const markBits = this.getMapMarkBits(mapIndex);
        const leaks = GameState.stats ? (GameState.stats.leaksThisGame || 0) : 0;

        return {
            mapIndex,
            directive,
            lines: result.lines,
            directiveReady: result.met,
            clearEarned: !!(markBits & this.MARK_CLEAR),
            perfectEarned: !!(markBits & this.MARK_PERFECT),
            directiveEarned: !!(markBits & this.MARK_DIRECTIVE),
            perfectFailed: leaks > 0 && !(markBits & this.MARK_PERFECT),
            stateKey: [
                mapIndex,
                markBits,
                leaks,
                run.freezeApplications,
                Math.floor(run.burnDamage),
                Math.floor(run.poisonDamage),
                run.captainKills,
                run.overclockUses,
                run.peakLinks,
                run.peakTier5,
                run.abilitiesUsed,
                run.towersPlaced,
                run.noSell ? 1 : 0,
            ].join('|'),
        };
    },

    getTowerRequirementStatus(type, runContext = null) {
        const license = this.getTowerLicenseDef(type);
        if (!license) return { unlocked: true, lines: [] };
        const result = this._evaluateRequirement(license.requires, this._getPersistentContext(runContext));
        return {
            unlocked: this.isTowerUnlocked(type),
            metNow: result.met,
            lines: result.lines,
        };
    },

    getTowerLockSummary(type) {
        const status = this.getTowerRequirementStatus(type, null);
        const unmet = status.lines.filter((line) => !line.met);
        if (unmet.length === 0) return 'License pending';
        return unmet.slice(0, 2).map((line) => line.text).join(' | ');
    },

    getBandStatus(diffKey) {
        const band = (this._getConfig().BAND_GATES || {})[diffKey];
        const group = this.BAND_ORDER.indexOf(diffKey);
        const start = group >= 0 ? group * 5 : -1;
        const end = start >= 0 ? Math.min(MAPS.length, start + 5) : -1;
        const grandfathered = start >= 0 && GameState.mapScores.slice(start, end).some((score) => score > 0);
        if (!band || !band.requires) {
            return {
                key: diffKey,
                label: band && band.label ? band.label : diffKey,
                unlocked: true,
                lines: [],
            };
        }

        const result = this._evaluateRequirement(band.requires, this._getPersistentContext(null));
        return {
            key: diffKey,
            label: band.label || diffKey,
            unlocked: grandfathered || result.met,
            lines: result.lines,
        };
    },

    refreshUnlockedMaps() {
        const unlocked = new Array(MAPS.length).fill(false);
        unlocked[0] = true;

        for (let group = 0; group < this.BAND_ORDER.length; group++) {
            const diffKey = this.BAND_ORDER[group];
            const start = group * 5;
            const end = Math.min(MAPS.length, start + 5);
            const bandHasClear = GameState.mapScores.slice(start, end).some((score) => score > 0);
            const bandOpen = group === 0 || bandHasClear || this.getBandStatus(diffKey).unlocked;
            if (!bandOpen) continue;

            unlocked[start] = true;
            let furthest = start;
            for (let i = start; i < end; i++) {
                if ((GameState.mapScores[i] || 0) > 0) {
                    furthest = Math.max(furthest, Math.min(end - 1, i + 1));
                }
            }
            for (let i = start; i <= furthest; i++) {
                unlocked[i] = true;
            }
        }

        const before = JSON.stringify(GameState.unlockedMaps || []);
        GameState.unlockedMaps = unlocked;
        return before !== JSON.stringify(unlocked);
    },

    unlockTowerLicense(type, options = {}) {
        if (!type || this.isStarterTower(type)) return false;
        const meta = this._ensureMeta();
        if (meta.towerLicenses[type]) return false;
        meta.towerLicenses[type] = true;

        if (!options.silent) {
            const label = TOWERS[type] ? TOWERS[type].name : type;
            if (typeof showWaveBanner === 'function') {
                showWaveBanner(`UNLOCKED: ${label.toUpperCase()}`);
            }
            if (typeof Effects !== 'undefined' && Effects.addFloatingText) {
                Effects.addFloatingText(logicalWidth / 2, 64, `${label} online`, '#ffd670', 14);
            }
            if (typeof Audio !== 'undefined' && Audio.play) {
                Audio.play('achievement');
            }
        }
        return true;
    },

    refreshTowerLicenses(options = {}) {
        const config = this._getConfig();
        const licenseDefs = config.TOWER_LICENSES || {};
        const runContext = options.runContext || null;
        const allowLegacyProof = !!options.allowLegacyProof;
        const newlyUnlocked = [];

        for (const type of Object.keys(licenseDefs)) {
            if (this.isTowerUnlocked(type)) continue;

            const requirement = this._evaluateRequirement(licenseDefs[type].requires, this._getPersistentContext(runContext));
            const legacyMet = allowLegacyProof && !!licenseDefs[type].legacyProof
                ? this._evaluateRequirement(licenseDefs[type].legacyProof, this._getPersistentContext(null)).met
                : false;
            if (requirement.met || legacyMet) {
                if (this.unlockTowerLicense(type, { silent: options.silent })) {
                    newlyUnlocked.push(type);
                }
            }
        }

        return newlyUnlocked;
    },

    _setMapMark(mapIndex, bit) {
        const meta = this._ensureMeta();
        const before = meta.mapMarkBits[mapIndex] || 0;
        if (before & bit) return false;
        meta.mapMarkBits[mapIndex] = before | bit;
        this.recalculateCommandMarks();
        return true;
    },

    recordRunOutcome(options = {}) {
        const meta = this._ensureMeta();
        const bossKills = Number.isFinite(GameState.stats.bossKills) ? Math.max(0, Math.floor(GameState.stats.bossKills)) : 0;
        const captainKills = Number.isFinite(GameState.stats.captainKillsThisRun) ? Math.max(0, Math.floor(GameState.stats.captainKillsThisRun)) : 0;
        if (bossKills > 0) {
            meta.lifetimeBossKills += bossKills;
        }
        if (captainKills > 0) {
            meta.lifetimeCaptainKills += captainKills;
        }
        return bossKills;
    },

    applyCampaignVictoryProgress(mapIndex) {
        const directiveResult = this.evaluateDirective(mapIndex);
        const gainedBits = [];

        if (this._setMapMark(mapIndex, this.MARK_CLEAR)) {
            gainedBits.push(this.MARK_CLEAR);
            GameState.metaProgress.lifetimeMapsCleared++;
        }
        if ((GameState.stats.leaksThisGame || 0) === 0 && this._setMapMark(mapIndex, this.MARK_PERFECT)) {
            gainedBits.push(this.MARK_PERFECT);
            GameState.metaProgress.lifetimePerfectClears++;
        }
        if (directiveResult.met && this._setMapMark(mapIndex, this.MARK_DIRECTIVE)) {
            gainedBits.push(this.MARK_DIRECTIVE);
            GameState.metaProgress.lifetimeDirectiveClears++;
        }

        this.recordRunOutcome({ victory: true });
        const newlyUnlockedTowers = this.refreshTowerLicenses({ silent: false, runContext: this._getRunSnapshot() });
        this.refreshUnlockedMaps();

        return {
            markBits: gainedBits,
            marksEarned: gainedBits.length,
            directive: directiveResult.directive,
            directiveCompleted: directiveResult.met,
            newlyUnlockedTowers,
            totalMarks: this.getCommandMarks(),
            nextTower: this.getNextTowerUnlock(),
            nextBand: this.getNextBandUnlock(),
        };
    },

    grandfatherUnlockedTowerTypesFromRun(towers, options = {}) {
        const list = Array.isArray(towers) ? towers : [];
        const unlocked = [];
        for (const tower of list) {
            if (!tower || !tower.type || this.isStarterTower(tower.type) || this.isTowerUnlocked(tower.type)) continue;
            if (this.unlockTowerLicense(tower.type, { silent: true })) {
                unlocked.push(tower.type);
            }
        }
        if (unlocked.length > 0 && options.save !== false && typeof SaveSystem !== 'undefined' && typeof SaveSystem.savePersistent === 'function') {
            SaveSystem.savePersistent();
        }
        return unlocked;
    },

    syncPersistentProgress(options = {}) {
        const meta = this._ensureMeta();
        const before = JSON.stringify(meta);
        const allowLegacyProof = !meta.legacyProgressionBackfillDone && this._hasLegacyProgressEvidence();

        if (!meta.legacyProgressionBackfillDone) {
            for (let i = 0; i < MAPS.length; i++) {
                if ((GameState.mapScores[i] || 0) > 0) {
                    this._setMapMark(i, this.MARK_CLEAR);
                }
            }

            meta.lifetimeMapsCleared = Math.max(meta.lifetimeMapsCleared || 0, meta.mapMarkBits.filter((bits) => bits & this.MARK_CLEAR).length);

            if (GameState.achievementsUnlocked.has('boss5')) {
                meta.lifetimeBossKills = Math.max(meta.lifetimeBossKills || 0, 5);
            }
            if (GameState.achievementsUnlocked.has('boss20')) {
                meta.lifetimeBossKills = Math.max(meta.lifetimeBossKills || 0, 20);
            }

            meta.legacyProgressionBackfillDone = true;
        }

        const newlyUnlockedTowers = this.refreshTowerLicenses({
            silent: options.silent !== false,
            allowLegacyProof,
        });
        this.refreshUnlockedMaps();
        this.recalculateCommandMarks();

        const after = JSON.stringify(this._ensureMeta());
        return {
            changed: before !== after,
            newlyUnlockedTowers,
        };
    },

    getNextTowerUnlock() {
        const order = this._getConfig().LICENSE_ORDER || [];
        for (const type of order) {
            if (this.isTowerUnlocked(type)) continue;
            const def = TOWERS[type];
            return {
                type,
                label: def ? def.name : type,
                status: this.getTowerRequirementStatus(type, null),
            };
        }
        return null;
    },

    getNextBandUnlock() {
        for (const key of this.BAND_ORDER) {
            const status = this.getBandStatus(key);
            if (!status.unlocked) return status;
        }
        return null;
    },

    getOverviewSummary() {
        const marks = this.getCommandMarks();
        const nextTower = this.getNextTowerUnlock();
        const nextBand = this.getNextBandUnlock();
        return {
            marks,
            nextTowerText: nextTower ? `${nextTower.label}: ${this.getTowerLockSummary(nextTower.type)}` : 'All tower licenses unlocked',
            nextBandText: nextBand ? `${nextBand.label}: ${nextBand.lines.filter((line) => !line.met).map((line) => line.text).join(' | ')}` : 'All difficulty bands unlocked',
        };
    },

    getMapDirectiveSummary(mapIndex) {
        const directive = this.getMapDirective(mapIndex);
        if (!directive) return 'No directive';
        return directive.desc;
    },

    getTowerCardMeta(type) {
        if (this.isTowerUnlocked(type)) {
            return { unlocked: true, text: 'Licensed', detail: '' };
        }
        const status = this.getTowerRequirementStatus(type, this._getRunSnapshot());
        const unmet = status.lines.filter((line) => !line.met);
        return {
            unlocked: false,
            text: 'Locked',
            detail: unmet.slice(0, 2).map((line) => line.text).join(' | '),
        };
    },

    tryToggleTowerSelection(type, options = {}) {
        if (!this.isTowerUnlocked(type)) {
            const label = TOWERS[type] ? TOWERS[type].name : type;
            const summary = this.getTowerLockSummary(type);
            if (typeof Effects !== 'undefined' && Effects.addFloatingText) {
                Effects.addFloatingText(logicalWidth / 2, logicalHeight - 90, `${label} locked`, '#ff8b8b', 13);
                if (summary) {
                    Effects.addFloatingText(logicalWidth / 2, logicalHeight - 72, summary, '#ffd0a0', 10);
                }
            }
            if (typeof Audio !== 'undefined' && Audio.play) Audio.play('error');
            return { ok: false, reason: 'locked' };
        }

        if (options.requireGold) {
            const cost = typeof UIRenderer !== 'undefined' && typeof UIRenderer._getTowerCost === 'function'
                ? UIRenderer._getTowerCost(type)
                : TOWERS[type].baseCost;
            if (GameState.gold < cost) {
                return { ok: false, reason: 'gold', cost };
            }
        }

        if (GameState.selectedTowerType === type) {
            GameState.selectedTowerType = null;
        } else {
            GameState.selectedTowerType = type;
            GameState.selectedTower = null;
            const towerInfo = document.getElementById('tower-info');
            if (towerInfo) towerInfo.style.display = 'none';
        }
        if (typeof UIRenderer !== 'undefined' && typeof UIRenderer._updateSidebarSelection === 'function') {
            UIRenderer._updateSidebarSelection();
        }
        return { ok: true, reason: 'selected' };
    },

    buildVictoryProgressHTML(summary) {
        if (!summary) return '';
        const marksText = summary.marksEarned > 0 ? `+${summary.marksEarned} Command Marks` : 'No new Command Marks';
        const markLabels = [];
        if (summary.markBits.includes(this.MARK_CLEAR)) markLabels.push('Clear');
        if (summary.markBits.includes(this.MARK_PERFECT)) markLabels.push('Perfect');
        if (summary.markBits.includes(this.MARK_DIRECTIVE)) markLabels.push('Directive');
        const towerLine = summary.newlyUnlockedTowers.length > 0
            ? summary.newlyUnlockedTowers.map((type) => TOWERS[type].name).join(', ')
            : 'None';
        const nextTowerText = summary.nextTower
            ? `${summary.nextTower.label} - ${this.getTowerLockSummary(summary.nextTower.type)}`
            : 'All tower licenses unlocked';
        const nextBandText = summary.nextBand
            ? `${summary.nextBand.label} - ${summary.nextBand.lines.filter((line) => !line.met).map((line) => line.text).join(' | ')}`
            : 'All difficulty bands unlocked';

        return `
            <div class="victory-progress-block">
                <div class="vpb-title">Campaign Progress</div>
                <div class="stat-row"><span class="sr-label">Command Marks</span><span class="sr-value">${summary.totalMarks}</span></div>
                <div class="stat-row"><span class="sr-label">This Victory</span><span class="sr-value">${marksText}</span></div>
                <div class="stat-row"><span class="sr-label">Mark Types</span><span class="sr-value">${markLabels.length > 0 ? markLabels.join(', ') : '--'}</span></div>
                <div class="stat-row"><span class="sr-label">Tower Unlocks</span><span class="sr-value">${towerLine}</span></div>
                <div class="vpb-next">Next tower: ${nextTowerText}</div>
                <div class="vpb-next">Next band: ${nextBandText}</div>
            </div>
        `;
    },
};
