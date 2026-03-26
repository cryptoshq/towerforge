// ===== ACHIEVEMENT SYSTEM — FULL OVERHAUL =====
const AchievementSystem = {
    checkTimer: 0,
    currentCategory: 'all',

    // Achievement categories
    categories: [
        { id: 'all', name: 'All', icon: '\u{1F3C6}' },
        { id: 'combat', name: 'Combat', icon: '\u{2694}\uFE0F' },
        { id: 'economy', name: 'Economy', icon: '\u{1F4B0}' },
        { id: 'mastery', name: 'Mastery', icon: '\u{2B50}' },
        { id: 'completion', name: 'Completion', icon: '\u{1F3C1}' },
    ],

    update(dt) {
        this.checkTimer -= dt;
        if (this.checkTimer > 0) return;
        this.checkTimer = 1.0; // Check every second

        for (const ach of ACHIEVEMENTS) {
            if (GameState.achievementsUnlocked.has(ach.id)) continue;
            if (ach.check(GameState.stats)) {
                this.unlock(ach);
            }
        }
    },

    unlock(ach) {
        if (GameState.achievementsUnlocked.has(ach.id)) return;
        GameState.achievementsUnlocked.add(ach.id);

        // Research point bonus
        if (GameState.researchBonuses.achievementRP) {
            GameState.researchPoints++;
        }

        // Show popup
        this.showPopup(ach);
        Audio.play('achievement');

        // Save
        SaveSystem.savePersistent();
    },

    showPopup(ach) {
        const popup = document.getElementById('achievement-popup');
        if (!popup) return;

        const iconEl = document.getElementById('achieve-toast-icon');
        if (iconEl) iconEl.textContent = ach.icon || '\uD83C\uDFC6';
        document.getElementById('achievement-name').textContent = ach.name;

        if (this._popupHideTimer) clearTimeout(this._popupHideTimer);
        if (this._popupExitTimer) clearTimeout(this._popupExitTimer);

        popup.style.display = 'flex';
        popup.classList.remove('is-exiting', 'is-visible');
        popup.offsetHeight;
        popup.classList.add('is-visible');

        this._popupExitTimer = setTimeout(() => {
            popup.classList.remove('is-visible');
            popup.classList.add('is-exiting');
        }, 3000);

        this._popupHideTimer = setTimeout(() => {
            popup.classList.remove('is-exiting');
            popup.style.display = 'none';
        }, 3250);
    },

    getCategory(ach) {
        // Determine category from achievement characteristics
        const id = ach.id || '';
        if (id.includes('kill') || id.includes('boss') || id.includes('damage') || id.includes('combo')) return 'combat';
        if (id.includes('gold') || id.includes('economy') || id.includes('sell') || id.includes('interest')) return 'economy';
        if (id.includes('mastery') || id.includes('tier') || id.includes('research') || id.includes('speed')) return 'mastery';
        if (id.includes('map') || id.includes('wave') || id.includes('perfect') || id.includes('complete')) return 'completion';
        return 'combat'; // default
    },

    getRarity(ach) {
        // Estimate rarity based on difficulty
        const desc = (ach.desc || '').toLowerCase();
        if (desc.includes('500') || desc.includes('1000') || desc.includes('all ') || desc.includes('mythic')) return 'legendary';
        if (desc.includes('300') || desc.includes('speed') || desc.includes('perfect') || desc.includes('tier 5')) return 'epic';
        if (desc.includes('100') || desc.includes('150') || desc.includes('boss')) return 'rare';
        return 'common';
    },

    getProgress(ach) {
        // Try to determine progress for numeric achievements
        const stats = GameState.stats;
        const id = ach.id || '';

        // Extract target number from description
        const numMatch = (ach.desc || '').match(/(\d+)/);
        const target = numMatch ? parseInt(numMatch[1]) : null;
        if (!target) return null;

        let current = 0;
        if (id.includes('kill') && !id.includes('boss')) {
            current = stats.totalKills || 0;
        } else if (id.includes('boss')) {
            current = stats.bossKills || 0;
        } else if (id.includes('gold')) {
            current = stats.maxGold || 0;
        } else if (id.includes('wave')) {
            current = stats.wavesCompleted || 0;
        } else if (id.includes('tower') && id.includes('type')) {
            current = stats.towerTypesBuilt || 0;
        } else if (id.includes('mastery')) {
            current = stats.maxMastery || 0;
        } else if (id.includes('tier')) {
            current = stats.maxTier || 0;
        } else if (id.includes('research')) {
            current = stats.researchCount || 0;
        } else if (id.includes('combo')) {
            current = stats.maxCombo || 0;
        } else if (id.includes('perfect')) {
            current = stats.perfectWaves || 0;
        }

        if (current > 0 || target > 0) {
            return { current: Math.min(current, target), target };
        }
        return null;
    },

    renderScreen() {
        const container = document.getElementById('achievements-screen');

        // Clear everything except the header
        const header = container.querySelector('.screen-header');
        container.innerHTML = '';
        container.appendChild(header);

        // Stats bar
        const totalAch = ACHIEVEMENTS.length;
        const unlockedCount = GameState.achievementsUnlocked.size;
        const pct = totalAch > 0 ? Math.round((unlockedCount / totalAch) * 100) : 0;

        const statsBar = document.createElement('div');
        statsBar.className = 'achievements-header-stats';
        statsBar.innerHTML = `
            <div class="ach-stat">
                <div class="ach-stat-value">${unlockedCount}/${totalAch}</div>
                <div class="ach-stat-label">UNLOCKED</div>
            </div>
            <div class="ach-stat">
                <div class="ach-stat-value">${pct}%</div>
                <div class="ach-stat-label">COMPLETE</div>
            </div>
            <div class="ach-stat">
                <div class="ach-stat-value" style="color:${this._getRarityColor('legendary')}">${this._countByRarity('legendary')}</div>
                <div class="ach-stat-label">LEGENDARY</div>
            </div>
            <div class="ach-stat">
                <div class="ach-stat-value" style="color:${this._getRarityColor('epic')}">${this._countByRarity('epic')}</div>
                <div class="ach-stat-label">EPIC</div>
            </div>
        `;
        container.appendChild(statsBar);

        // Overall progress bar
        const progressWrap = document.createElement('div');
        progressWrap.style.cssText = 'padding:0 30px 10px;';
        progressWrap.innerHTML = `
            <div style="height:6px;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden">
                <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#5858cc,#f5cc50);border-radius:3px;transition:width 0.5s"></div>
            </div>
        `;
        container.appendChild(progressWrap);

        // Category tabs
        const catBar = document.createElement('div');
        catBar.className = 'achievements-categories';
        for (const cat of this.categories) {
            const btn = document.createElement('button');
            btn.className = `ach-category-btn ${this.currentCategory === cat.id ? 'active' : ''}`;
            btn.textContent = `${cat.icon} ${cat.name}`;
            btn.addEventListener('click', () => {
                this.currentCategory = cat.id;
                this.renderScreen();
                Audio.play('click');
            });
            catBar.appendChild(btn);
        }
        container.appendChild(catBar);

        // Achievement grid
        const grid = document.createElement('div');
        grid.className = 'achievements-grid';
        grid.id = 'achievements-grid';

        // Filter and sort achievements
        let filtered = [...ACHIEVEMENTS];
        if (this.currentCategory !== 'all') {
            filtered = filtered.filter(ach => this.getCategory(ach) === this.currentCategory);
        }

        // Sort: unlocked first, then by rarity (legendary > epic > rare > common)
        const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 };
        filtered.sort((a, b) => {
            const aUnlocked = GameState.achievementsUnlocked.has(a.id);
            const bUnlocked = GameState.achievementsUnlocked.has(b.id);
            if (aUnlocked !== bUnlocked) return aUnlocked ? -1 : 1;
            return (rarityOrder[this.getRarity(a)] || 3) - (rarityOrder[this.getRarity(b)] || 3);
        });

        for (const ach of filtered) {
            const unlocked = GameState.achievementsUnlocked.has(ach.id);
            const rarity = this.getRarity(ach);
            const progress = unlocked ? null : this.getProgress(ach);

            const card = document.createElement('div');
            card.className = `achievement-card ${unlocked ? 'unlocked' : 'locked'}`;

            let progressHTML = '';
            if (progress && !unlocked) {
                const pctVal = Math.round((progress.current / progress.target) * 100);
                progressHTML = `
                    <div class="ach-progress">
                        <div class="ach-progress-bar">
                            <div class="ach-progress-fill" style="width:${pctVal}%"></div>
                        </div>
                        <div class="ach-progress-text">${progress.current} / ${progress.target}</div>
                    </div>
                `;
            }

            card.innerHTML = `
                <div class="ach-icon">${unlocked ? ach.icon : '\u{1F512}'}</div>
                <div class="ach-info">
                    <div class="ach-name">${unlocked ? ach.name : '???'}</div>
                    <div class="ach-desc">${ach.desc}</div>
                    ${progressHTML}
                </div>
                <span class="ach-rarity ${rarity}">${rarity.toUpperCase()}</span>
            `;

            grid.appendChild(card);
        }

        container.appendChild(grid);
    },

    _countByRarity(rarity) {
        let count = 0;
        for (const ach of ACHIEVEMENTS) {
            if (this.getRarity(ach) === rarity && GameState.achievementsUnlocked.has(ach.id)) {
                count++;
            }
        }
        return count;
    },

    _getRarityColor(rarity) {
        switch (rarity) {
            case 'legendary': return '#f5cc50';
            case 'epic': return '#c080ff';
            case 'rare': return '#50b0ff';
            default: return '#aaa';
        }
    },
};
