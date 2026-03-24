// ===== LEADERBOARD — LOCAL STORAGE HIGH SCORE SYSTEM =====
// Tracks per-map scores, global statistics, run history, and achievements.
// Provides rich UI rendering with animated entries, rank badges, and graphs.

const Leaderboard = {
    KEY: 'towerforge_scores',
    STATS_KEY: 'towerforge_globalstats',
    HISTORY_KEY: 'towerforge_history',
    MAX_ENTRIES: 20,
    MAX_HISTORY: 50,

    // ===== CORE SCORE MANAGEMENT =====

    getScores(mapIndex) {
        try {
            const data = JSON.parse(localStorage.getItem(this.KEY) || '{}');
            return (data[mapIndex] || [])
                .sort((a, b) => b.score - a.score)
                .slice(0, this.MAX_ENTRIES);
        } catch {
            return [];
        }
    },

    getAllScores() {
        try {
            return JSON.parse(localStorage.getItem(this.KEY) || '{}');
        } catch {
            return {};
        }
    },

    addScore(mapIndex, score, wave, kills, extraData = {}) {
        try {
            const data = JSON.parse(localStorage.getItem(this.KEY) || '{}');
            if (!data[mapIndex]) data[mapIndex] = [];

            const entry = {
                score,
                wave,
                kills,
                date: new Date().toISOString(),
                dateFormatted: new Date().toLocaleDateString(),
                time: extraData.time || 0,
                timeFormatted: extraData.time ? this._formatDuration(extraData.time) : '--',
                towers: extraData.towers || 0,
                maxTier: extraData.maxTier || 0,
                leaks: extraData.leaks || 0,
                bossKills: extraData.bossKills || 0,
                perfect: (extraData.leaks || 0) === 0,
                victory: extraData.victory || false,
                goldEarned: extraData.goldEarned || 0,
                dps: extraData.dps || 0,
                mode: extraData.mode || 'campaign',
                endlessDepth: extraData.endlessDepth || 0,
                challengeCount: extraData.challengeCount || 0,
                mapName: (MAPS && MAPS[mapIndex]) ? MAPS[mapIndex].name : `Map ${mapIndex + 1}`,
            };

            // Check if this is a new high score
            const isNewHigh = data[mapIndex].length === 0 || score > data[mapIndex][0].score;
            entry.isNewHigh = isNewHigh;

            data[mapIndex].push(entry);
            data[mapIndex].sort((a, b) => b.score - a.score);
            data[mapIndex] = data[mapIndex].slice(0, this.MAX_ENTRIES);
            localStorage.setItem(this.KEY, JSON.stringify(data));

            // Update global statistics
            this._updateGlobalStats(entry, mapIndex);

            // Add to run history
            this._addToHistory(entry, mapIndex);

            return { rank: data[mapIndex].findIndex(e => e === entry) + 1, isNewHigh };
        } catch (e) {
            console.warn('Failed to save score', e);
            return { rank: -1, isNewHigh: false };
        }
    },

    removeScore(mapIndex, scoreIndex) {
        try {
            const data = JSON.parse(localStorage.getItem(this.KEY) || '{}');
            if (data[mapIndex] && data[mapIndex][scoreIndex]) {
                data[mapIndex].splice(scoreIndex, 1);
                localStorage.setItem(this.KEY, JSON.stringify(data));
                return true;
            }
            return false;
        } catch {
            return false;
        }
    },

    clearMapScores(mapIndex) {
        try {
            const data = JSON.parse(localStorage.getItem(this.KEY) || '{}');
            delete data[mapIndex];
            localStorage.setItem(this.KEY, JSON.stringify(data));
        } catch (e) {
            console.warn('Failed to clear scores for map', mapIndex, e);
        }
    },

    clearAllScores() {
        localStorage.removeItem(this.KEY);
        localStorage.removeItem(this.STATS_KEY);
        localStorage.removeItem(this.HISTORY_KEY);
    },

    // ===== GLOBAL STATISTICS =====

    _updateGlobalStats(entry, mapIndex) {
        try {
            const stats = this.getGlobalStats();

            stats.totalGames++;
            stats.totalKills += entry.kills;
            stats.totalBossKills += entry.bossKills;
            stats.totalScore += entry.score;
            stats.totalPlayTime += entry.time;
            stats.totalGoldEarned += entry.goldEarned;

            if (entry.victory) stats.totalVictories++;
            if (entry.perfect) stats.totalPerfects++;

            // Best records
            if (entry.score > stats.bestScore) {
                stats.bestScore = entry.score;
                stats.bestScoreMap = mapIndex;
                stats.bestScoreDate = entry.date;
            }
            if (entry.kills > stats.bestKills) {
                stats.bestKills = entry.kills;
            }
            if (entry.wave > stats.bestWave) {
                stats.bestWave = entry.wave;
                stats.bestWaveMap = mapIndex;
            }
            if (entry.dps > stats.bestDPS) {
                stats.bestDPS = entry.dps;
            }

            // Streak tracking
            if (entry.victory) {
                stats.currentWinStreak++;
                stats.bestWinStreak = Math.max(stats.bestWinStreak, stats.currentWinStreak);
            } else {
                stats.currentWinStreak = 0;
            }

            // Per-map play counts
            if (!stats.mapPlayCounts[mapIndex]) stats.mapPlayCounts[mapIndex] = 0;
            stats.mapPlayCounts[mapIndex]++;

            // Average calculations
            stats.avgScore = Math.round(stats.totalScore / stats.totalGames);
            stats.avgKills = Math.round(stats.totalKills / stats.totalGames);
            stats.winRate = stats.totalGames > 0 ? Math.round((stats.totalVictories / stats.totalGames) * 100) : 0;

            // Time records
            if (entry.victory && entry.time > 0) {
                if (!stats.fastestVictory || entry.time < stats.fastestVictory) {
                    stats.fastestVictory = entry.time;
                    stats.fastestVictoryMap = mapIndex;
                }
            }

            localStorage.setItem(this.STATS_KEY, JSON.stringify(stats));
        } catch (e) {
            console.warn('Failed to update global stats', e);
        }
    },

    getGlobalStats() {
        try {
            const defaults = {
                totalGames: 0,
                totalKills: 0,
                totalBossKills: 0,
                totalScore: 0,
                totalPlayTime: 0,
                totalGoldEarned: 0,
                totalVictories: 0,
                totalPerfects: 0,
                bestScore: 0,
                bestScoreMap: 0,
                bestScoreDate: null,
                bestKills: 0,
                bestWave: 0,
                bestWaveMap: 0,
                bestDPS: 0,
                currentWinStreak: 0,
                bestWinStreak: 0,
                mapPlayCounts: {},
                avgScore: 0,
                avgKills: 0,
                winRate: 0,
                fastestVictory: null,
                fastestVictoryMap: 0,
            };
            const saved = JSON.parse(localStorage.getItem(this.STATS_KEY) || '{}');
            return { ...defaults, ...saved };
        } catch {
            return { totalGames: 0, totalKills: 0, totalScore: 0, totalPlayTime: 0 };
        }
    },

    // ===== RUN HISTORY =====

    _addToHistory(entry, mapIndex) {
        try {
            const history = this.getHistory();
            history.unshift({
                ...entry,
                mapIndex,
                id: Date.now() + Math.random().toString(36).slice(2, 8),
            });
            // Keep only last N runs
            while (history.length > this.MAX_HISTORY) history.pop();
            localStorage.setItem(this.HISTORY_KEY, JSON.stringify(history));
        } catch (e) {
            console.warn('Failed to save run history', e);
        }
    },

    getHistory() {
        try {
            return JSON.parse(localStorage.getItem(this.HISTORY_KEY) || '[]');
        } catch {
            return [];
        }
    },

    getRecentHistory(count = 10) {
        return this.getHistory().slice(0, count);
    },

    // ===== RANKING & ANALYSIS =====

    getRank(mapIndex, score) {
        const scores = this.getScores(mapIndex);
        if (scores.length === 0) return 1;
        for (let i = 0; i < scores.length; i++) {
            if (score >= scores[i].score) return i + 1;
        }
        return scores.length + 1;
    },

    getPersonalBest(mapIndex) {
        const scores = this.getScores(mapIndex);
        return scores.length > 0 ? scores[0] : null;
    },

    getRankBadge(rank) {
        if (rank === 1) return { icon: '\u{1F947}', label: '1st', color: '#ffd700', tier: 'gold' };
        if (rank === 2) return { icon: '\u{1F948}', label: '2nd', color: '#c0c0c0', tier: 'silver' };
        if (rank === 3) return { icon: '\u{1F949}', label: '3rd', color: '#cd7f32', tier: 'bronze' };
        if (rank <= 5) return { icon: '\u{2B50}', label: `${rank}th`, color: '#8888ff', tier: 'star' };
        return { icon: '#', label: `${rank}th`, color: '#666', tier: 'none' };
    },

    getMapCompletionStatus(mapIndex) {
        const scores = this.getScores(mapIndex);
        if (scores.length === 0) return { played: false, completed: false, perfected: false };
        return {
            played: true,
            completed: scores.some(s => s.victory),
            perfected: scores.some(s => s.perfect && s.victory),
            bestScore: scores[0].score,
            bestWave: Math.max(...scores.map(s => s.wave)),
            totalPlays: scores.length,
        };
    },

    // ===== LEADERBOARD UI RENDERING =====

    renderLeaderboardScreen(container) {
        if (!container) return;

        const stats = this.getGlobalStats();
        const allScores = this.getAllScores();

        let html = `
            <div class="lb-container">
                <h2 class="lb-title">LEADERBOARD</h2>

                <!-- Global Stats Banner -->
                <div class="lb-global-stats">
                    <div class="lb-stat-card">
                        <div class="lb-stat-value">${stats.totalGames}</div>
                        <div class="lb-stat-label">Games</div>
                    </div>
                    <div class="lb-stat-card">
                        <div class="lb-stat-value">${stats.winRate}%</div>
                        <div class="lb-stat-label">Win Rate</div>
                    </div>
                    <div class="lb-stat-card">
                        <div class="lb-stat-value">${this._formatNumber(stats.bestScore)}</div>
                        <div class="lb-stat-label">Best Score</div>
                    </div>
                    <div class="lb-stat-card">
                        <div class="lb-stat-value">${this._formatNumber(stats.totalKills)}</div>
                        <div class="lb-stat-label">Total Kills</div>
                    </div>
                    <div class="lb-stat-card">
                        <div class="lb-stat-value">${stats.bestWinStreak}</div>
                        <div class="lb-stat-label">Best Streak</div>
                    </div>
                    <div class="lb-stat-card">
                        <div class="lb-stat-value">${this._formatDuration(stats.totalPlayTime)}</div>
                        <div class="lb-stat-label">Play Time</div>
                    </div>
                </div>

                <!-- Map Tabs -->
                <div class="lb-tabs" id="lb-map-tabs">
                    <button class="lb-tab active" data-tab="all">All Maps</button>
        `;

        // Add tab for each map
        if (typeof MAPS !== 'undefined') {
            for (let i = 0; i < MAPS.length; i++) {
                html += `<button class="lb-tab" data-tab="${i}">${MAPS[i].name}</button>`;
            }
        }

        html += `
                    <button class="lb-tab" data-tab="history">History</button>
                </div>

                <!-- Score Table -->
                <div class="lb-content" id="lb-content">
                    ${this._renderAllMapsView(allScores)}
                </div>
            </div>
        `;

        container.innerHTML = html;

        // Bind tab switching
        container.querySelectorAll('.lb-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                container.querySelectorAll('.lb-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const tabId = tab.dataset.tab;
                const content = container.querySelector('#lb-content');
                if (tabId === 'all') {
                    content.innerHTML = this._renderAllMapsView(allScores);
                } else if (tabId === 'history') {
                    content.innerHTML = this._renderHistoryView();
                } else {
                    content.innerHTML = this._renderMapView(parseInt(tabId));
                }
            });
        });
    },

    _renderAllMapsView(allScores) {
        let html = '<div class="lb-all-maps">';

        if (typeof MAPS !== 'undefined') {
            for (let i = 0; i < MAPS.length; i++) {
                const scores = (allScores[i] || []).slice(0, 3);
                const status = this.getMapCompletionStatus(i);
                const statusIcon = status.perfected ? '\u2728' : status.completed ? '\u2705' : status.played ? '\u{1F3AE}' : '\u{1F512}';

                html += `
                    <div class="lb-map-card">
                        <div class="lb-map-header">
                            <span class="lb-map-icon">${statusIcon}</span>
                            <span class="lb-map-name">${MAPS[i].name}</span>
                            <span class="lb-map-plays">${status.totalPlays || 0} plays</span>
                        </div>
                `;

                if (scores.length === 0) {
                    html += `<div class="lb-no-scores">No scores yet</div>`;
                } else {
                    for (let j = 0; j < scores.length; j++) {
                        const s = scores[j];
                        const badge = this.getRankBadge(j + 1);
                        html += `
                            <div class="lb-score-row">
                                <span class="lb-rank" style="color:${badge.color}">${badge.icon}</span>
                                <span class="lb-score-val">${this._formatNumber(s.score)}</span>
                                <span class="lb-score-wave">W${s.wave}</span>
                                <span class="lb-score-kills">${s.kills} kills</span>
                                <span class="lb-score-date">${s.dateFormatted || s.date}</span>
                            </div>
                        `;
                    }
                }

                html += `</div>`;
            }
        }

        html += '</div>';
        return html;
    },

    _renderMapView(mapIndex) {
        const scores = this.getScores(mapIndex);
        const mapName = (typeof MAPS !== 'undefined' && MAPS[mapIndex]) ? MAPS[mapIndex].name : `Map ${mapIndex + 1}`;

        let html = `
            <div class="lb-map-detail">
                <h3 class="lb-map-detail-title">${mapName}</h3>
        `;

        if (scores.length === 0) {
            html += '<div class="lb-no-scores">No scores recorded for this map</div>';
        } else {
            html += '<div class="lb-score-table">';
            html += `
                <div class="lb-table-header">
                    <span class="lb-th-rank">Rank</span>
                    <span class="lb-th-score">Score</span>
                    <span class="lb-th-wave">Wave</span>
                    <span class="lb-th-kills">Kills</span>
                    <span class="lb-th-time">Time</span>
                    <span class="lb-th-date">Date</span>
                    <span class="lb-th-result">Result</span>
                </div>
            `;

            for (let i = 0; i < scores.length; i++) {
                const s = scores[i];
                const badge = this.getRankBadge(i + 1);
                const resultIcon = s.perfect ? '\u2728' : s.victory ? '\u2705' : '\u274C';
                const rowClass = i === 0 ? 'lb-row-first' : i < 3 ? 'lb-row-top' : '';

                html += `
                    <div class="lb-score-detail-row ${rowClass}" style="animation-delay:${i * 0.05}s">
                        <span class="lb-rank" style="color:${badge.color}">${badge.icon} ${badge.label}</span>
                        <span class="lb-score-val">${this._formatNumber(s.score)}</span>
                        <span class="lb-score-wave">W${s.wave}</span>
                        <span class="lb-score-kills">${s.kills}</span>
                        <span class="lb-score-time">${s.timeFormatted || '--'}</span>
                        <span class="lb-score-date">${s.dateFormatted || s.date}</span>
                        <span class="lb-score-result">${resultIcon}</span>
                    </div>
                `;
            }

            html += '</div>';

            // Map statistics summary
            const bestScore = scores[0];
            const totalKills = scores.reduce((sum, s) => sum + s.kills, 0);
            const victories = scores.filter(s => s.victory).length;
            const perfects = scores.filter(s => s.perfect).length;

            html += `
                <div class="lb-map-summary">
                    <div class="lb-summary-item"><span>Total Plays</span><span>${scores.length}</span></div>
                    <div class="lb-summary-item"><span>Victories</span><span>${victories}/${scores.length} (${Math.round(victories / scores.length * 100)}%)</span></div>
                    <div class="lb-summary-item"><span>Perfect Runs</span><span>${perfects}</span></div>
                    <div class="lb-summary-item"><span>Total Kills</span><span>${this._formatNumber(totalKills)}</span></div>
                    <div class="lb-summary-item"><span>Avg Score</span><span>${this._formatNumber(Math.round(scores.reduce((s, e) => s + e.score, 0) / scores.length))}</span></div>
                </div>
            `;
        }

        html += '</div>';
        return html;
    },

    _renderHistoryView() {
        const history = this.getHistory();

        let html = '<div class="lb-history">';
        html += '<h3 class="lb-history-title">Run History</h3>';

        if (history.length === 0) {
            html += '<div class="lb-no-scores">No runs recorded yet</div>';
        } else {
            for (let i = 0; i < history.length; i++) {
                const h = history[i];
                const resultIcon = h.perfect ? '\u2728' : h.victory ? '\u2705' : '\u274C';
                const resultText = h.perfect ? 'PERFECT' : h.victory ? 'VICTORY' : 'DEFEAT';
                const resultColor = h.perfect ? '#ffd700' : h.victory ? '#40ff80' : '#ff4040';

                html += `
                    <div class="lb-history-entry" style="animation-delay:${i * 0.03}s">
                        <div class="lb-history-main">
                            <span class="lb-history-result" style="color:${resultColor}">${resultIcon} ${resultText}</span>
                            <span class="lb-history-map">${h.mapName || 'Unknown'}</span>
                            <span class="lb-history-score">${this._formatNumber(h.score)} pts</span>
                        </div>
                        <div class="lb-history-details">
                            <span>Wave ${h.wave}</span>
                            <span>${h.kills} kills</span>
                            <span>${h.timeFormatted || '--'}</span>
                            <span>${h.dateFormatted || '--'}</span>
                        </div>
                    </div>
                `;
            }
        }

        html += '</div>';
        return html;
    },

    // ===== NOTIFICATION SYSTEM =====

    showNewHighScore(container, score, rank, mapName) {
        if (!container) return;

        const badge = this.getRankBadge(rank);
        const el = document.createElement('div');
        el.className = 'lb-new-high-notification';
        el.innerHTML = `
            <div class="lb-high-icon">${badge.icon}</div>
            <div class="lb-high-text">NEW HIGH SCORE!</div>
            <div class="lb-high-score">${this._formatNumber(score)}</div>
            <div class="lb-high-rank" style="color:${badge.color}">Rank ${badge.label} on ${mapName}</div>
        `;
        container.appendChild(el);

        // Auto-remove after animation
        setTimeout(() => {
            if (el.parentNode) el.parentNode.removeChild(el);
        }, 4000);
    },

    // ===== SCORE COMPARISON =====

    compareToPersonalBest(mapIndex, currentScore) {
        const pb = this.getPersonalBest(mapIndex);
        if (!pb) return { isFirst: true, diff: currentScore };

        return {
            isFirst: false,
            diff: currentScore - pb.score,
            isNewBest: currentScore > pb.score,
            percentChange: pb.score > 0 ? Math.round(((currentScore - pb.score) / pb.score) * 100) : 100,
        };
    },

    // ===== UTILITY =====

    _formatNumber(n) {
        if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
        if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
        return String(n);
    },

    _formatDuration(seconds) {
        if (!seconds || seconds <= 0) return '0s';
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        if (hrs > 0) return `${hrs}h ${mins}m`;
        if (mins > 0) return `${mins}m ${secs}s`;
        return `${secs}s`;
    },

    // ===== DATA EXPORT / IMPORT =====

    exportData() {
        try {
            return JSON.stringify({
                scores: JSON.parse(localStorage.getItem(this.KEY) || '{}'),
                stats: JSON.parse(localStorage.getItem(this.STATS_KEY) || '{}'),
                history: JSON.parse(localStorage.getItem(this.HISTORY_KEY) || '[]'),
                exportDate: new Date().toISOString(),
                version: '2.0',
            });
        } catch {
            return null;
        }
    },

    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (!data.version) return false;
            if (data.scores) localStorage.setItem(this.KEY, JSON.stringify(data.scores));
            if (data.stats) localStorage.setItem(this.STATS_KEY, JSON.stringify(data.stats));
            if (data.history) localStorage.setItem(this.HISTORY_KEY, JSON.stringify(data.history));
            return true;
        } catch {
            return false;
        }
    },

    // ===== CHALLENGE MODES (score multipliers) =====

    getChallengeMultiplier(modifiers) {
        let mult = 1.0;
        if (!modifiers) return mult;

        if (modifiers.noResearch) mult += 0.25;
        if (modifiers.halfLives) mult += 0.30;
        if (modifiers.noSelling) mult += 0.15;
        if (modifiers.limitedTowers) mult += 0.20;
        if (modifiers.speedOnly) mult += 0.10;
        if (modifiers.noPause) mult += 0.10;

        return mult;
    },

    applyChallenge(baseScore, modifiers) {
        return Math.round(baseScore * this.getChallengeMultiplier(modifiers));
    },
};
