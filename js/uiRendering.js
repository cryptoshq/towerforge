// ===== UI RENDERING — HUD UPDATES, SIDEBAR, TOOLTIPS =====
const UIRenderer = {
    lastGold: -1,
    lastLives: -1,
    lastWave: -1,
    lastScore: -1,
    lastThreatHint: null,
    interestPreviewEl: null,
    _lastNextWavePreviewBounds: null,
    _lastCountdownBounds: null,
    _lastTowerInfoStateKey: '',
    _lastDirectiveTrackerKey: '',
    _pathPreviewAnimIds: [],

    _stopPathPreviewAnimations() {
        if (!this._pathPreviewAnimIds || this._pathPreviewAnimIds.length === 0) return;
        for (const item of this._pathPreviewAnimIds) {
            if (typeof item === 'number') {
                cancelAnimationFrame(item);
            } else if (item && Number.isFinite(item.id)) {
                item.stopped = true;
                cancelAnimationFrame(item.id);
            }
        }
        this._pathPreviewAnimIds = [];
    },

    _isElementVisible(el) {
        if (!el) return false;
        const style = getComputedStyle(el);
        return style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            parseFloat(style.opacity || '1') > 0.02;
    },

    _getCountdownAnchor() {
        const fallback = {
            x: logicalWidth / 2,
            y: logicalHeight - 128,
        };

        const canvasEl = document.getElementById('game-canvas');
        if (!canvasEl || typeof screenToLogical !== 'function') return fallback;

        const startBtn = document.getElementById('btn-start-wave');
        const skipBtn = document.getElementById('btn-skip-wave');
        const targetBtn = this._isElementVisible(skipBtn)
            ? skipBtn
            : (this._isElementVisible(startBtn) ? startBtn : null);
        if (!targetBtn) return fallback;

        const canvasRect = canvasEl.getBoundingClientRect();
        const btnRect = targetBtn.getBoundingClientRect();

        const screenX = (btnRect.left + btnRect.width / 2) - canvasRect.left;
        const screenY = (btnRect.top - 20) - canvasRect.top;
        const logical = screenToLogical(screenX, screenY);

        if (!logical || !Number.isFinite(logical.x) || !Number.isFinite(logical.y)) {
            return fallback;
        }

        const viewLeft = typeof gridOffsetX !== 'undefined' && typeof renderScale !== 'undefined'
            ? -gridOffsetX / renderScale
            : 0;
        const viewTop = typeof gridOffsetY !== 'undefined' && typeof renderScale !== 'undefined'
            ? -gridOffsetY / renderScale
            : 0;
        const viewRight = typeof canvasWidth !== 'undefined' && typeof renderScale !== 'undefined'
            ? viewLeft + canvasWidth / renderScale
            : logicalWidth;
        const viewBottom = typeof canvasHeight !== 'undefined' && typeof renderScale !== 'undefined'
            ? viewTop + canvasHeight / renderScale
            : logicalHeight;

        return {
            x: clamp(logical.x, viewLeft + 36, viewRight - 36),
            y: clamp(logical.y, viewTop + 36, viewBottom - 36),
        };
    },

    updateHUD() {
        // Only update DOM when values change (performance optimization)
        if (GameState.gold !== this.lastGold) {
            const el = document.getElementById('hud-gold-val');
            const oldGold = this.lastGold;
            el.textContent = formatGold(GameState.gold);
            this.lastGold = GameState.gold;

            // Animated pop + color flash on gold change
            if (oldGold >= 0) {
                el.classList.remove('hud-val-pop', 'hud-val-flash-gold');
                void el.offsetWidth; // force reflow to restart animation
                el.classList.add('hud-val-pop', 'hud-val-flash-gold');
            }
        }
        if (GameState.lives !== this.lastLives) {
            const el = document.getElementById('hud-lives-val');
            const oldLives = this.lastLives;
            el.textContent = GameState.lives;

            // Animated pop + color flash on lives change
            if (oldLives >= 0) {
                el.classList.remove('hud-val-pop', 'hud-val-flash-red');
                void el.offsetWidth;
                el.classList.add('hud-val-pop', 'hud-val-flash-red');
            }

            if (GameState.lives <= 5) {
                el.style.color = '#ff4040';
                el.style.animation = 'pulse-glow 0.5s infinite';
            } else if (GameState.lives <= 10) {
                el.style.color = '#ffaa00';
                el.style.animation = 'none';
            } else {
                el.style.color = '#ff6060';
                el.style.animation = 'none';
            }
            this.lastLives = GameState.lives;
        }
        if (GameState.wave !== this.lastWave) {
            const el = document.getElementById('hud-wave-val');
            el.textContent = `${GameState.wave} / ${GameState.maxWave}`;
            if (this.lastWave >= 0) {
                el.classList.remove('hud-val-pop');
                void el.offsetWidth;
                el.classList.add('hud-val-pop');
            }
            this.lastWave = GameState.wave;
        }
        if (GameState.score !== this.lastScore) {
            const el = document.getElementById('hud-score-val');
            el.textContent = GameState.score;
            if (this.lastScore >= 0) {
                el.classList.remove('hud-val-pop', 'hud-val-flash-gold');
                void el.offsetWidth;
                el.classList.add('hud-val-pop', 'hud-val-flash-gold');
            }
            this.lastScore = GameState.score;
        }

        const threatHint = this._getWaveThreatHint();
        if (threatHint !== this.lastThreatHint) {
            const threatEl = document.getElementById('hud-threat-val');
            if (threatEl) {
                threatEl.textContent = threatHint;
                threatEl.title = threatHint || '';
            }
            this.lastThreatHint = threatHint;
        }

        // Real-time upgrade button affordability check
        if (GameState.selectedTower && GameState.gold !== this._lastUpgradeCheckGold) {
            this._lastUpgradeCheckGold = GameState.gold;
            const upgradeBtn = document.getElementById('btn-upgrade-tower');
            if (upgradeBtn && !upgradeBtn.classList.contains('path-choose-btn')) {
                const selectedTower = GameState.selectedTower;
                const info = selectedTower.getUpgradeCost();

                let upgradeCost = null;
                if (info && info.cost !== undefined) {
                    upgradeCost = info.cost;
                } else if (
                    selectedTower.tier >= 5
                    && typeof TowerUltimates !== 'undefined'
                    && TowerUltimates.canUpgradeToUltimate(selectedTower)
                ) {
                    upgradeCost = TowerUltimates.getUpgradeCost(selectedTower);
                }

                if (upgradeCost !== null && upgradeCost !== undefined) {
                    const canAfford = GameState.gold >= upgradeCost;
                    upgradeBtn.classList.toggle('cant-afford', !canAfford);
                }
            }
        }

        const towerInfoPanel = document.getElementById('tower-info');
        if (GameState.selectedTower && this._isElementVisible(towerInfoPanel)) {
            const selectedTower = GameState.selectedTower;
            const batchCount = (typeof Input !== 'undefined'
                && Input.isMultiSelected
                && Input.getMultiSelectCount
                && Input.isMultiSelected(selectedTower))
                ? Input.getMultiSelectCount()
                : 1;
            const panelStateKey = [
                selectedTower.id,
                selectedTower.tier,
                selectedTower.path || '-',
                selectedTower.sellConfirmActive ? 1 : 0,
                Math.ceil(selectedTower.sellConfirmTimer || 0),
                selectedTower.isBeingMoved ? 1 : 0,
                selectedTower.linkMode ? 1 : 0,
                selectedTower.links.length,
                selectedTower.overclocked ? 1 : 0,
                selectedTower.disabled ? 1 : 0,
                selectedTower.targetMode,
                batchCount,
                GameState.gold >= selectedTower.getMoveCost() ? 1 : 0,
                GameState.gold >= CONFIG.LINK_COST ? 1 : 0,
            ].join('|');
            if (panelStateKey !== this._lastTowerInfoStateKey) {
                this._lastTowerInfoStateKey = panelStateKey;
                this.showTowerInfo(selectedTower);
            }
        } else if (this._lastTowerInfoStateKey) {
            this._lastTowerInfoStateKey = '';
        }

        this.updateDirectiveTracker();
    },

    _buildDirectiveTrackerHTML(data, compact = false) {
        if (!data) return '';
        const markChips = [
            { label: 'Clear', cls: data.clearEarned ? 'done' : '' },
            { label: 'Perfect', cls: data.perfectEarned ? 'done' : (data.perfectFailed ? 'failed' : '') },
            { label: 'Directive', cls: data.directiveEarned ? 'done' : (data.directiveReady ? 'done' : '') },
        ];
        return `
            <div class="directive-hud-title">Mission Directive</div>
            <div class="directive-hud-name">${data.directive.name}</div>
            <div class="directive-hud-desc">${data.directive.desc}</div>
            <div class="directive-mark-row">
                ${markChips.map((chip) => `<span class="directive-mark-chip ${chip.cls}">${chip.label}</span>`).join('')}
            </div>
            <div class="directive-progress-list">
                ${data.lines.map((line) => `<div class="directive-progress-line ${line.met ? 'done' : ''}"><span>${line.text}</span><strong>${line.met ? 'READY' : 'LIVE'}</strong></div>`).join('')}
            </div>
        `;
    },

    updateDirectiveTracker(force = false) {
        const hudEl = document.getElementById('directive-hud');
        const pauseEl = document.getElementById('pause-directive-panel');
        if (typeof ProgressionSystem === 'undefined' || !hudEl) return;

        const onGameScreen = GameState.screen === 'game';
        const validPhase = ['idle', 'playing', 'paused'].includes(GameState.gamePhase);
        if (!onGameScreen || !validPhase) {
            hudEl.style.display = 'none';
            if (pauseEl) pauseEl.innerHTML = '';
            this._lastDirectiveTrackerKey = '';
            return;
        }

        const tracker = ProgressionSystem.getActiveDirectiveTrackerData();
        if (!tracker) {
            hudEl.style.display = 'none';
            if (pauseEl) pauseEl.innerHTML = '';
            this._lastDirectiveTrackerKey = '';
            return;
        }

        if (force || tracker.stateKey !== this._lastDirectiveTrackerKey) {
            hudEl.innerHTML = this._buildDirectiveTrackerHTML(tracker, true);
            if (pauseEl) {
                pauseEl.innerHTML = this._buildDirectiveTrackerHTML(tracker, false);
            }
            this._lastDirectiveTrackerKey = tracker.stateKey;
        }

        hudEl.style.display = (GameState.gamePhase === 'paused') ? 'none' : 'block';
        if (pauseEl && GameState.gamePhase !== 'paused') {
            pauseEl.innerHTML = this._buildDirectiveTrackerHTML(tracker, false);
        }
    },

    _getWaveThreatHint() {
        if (typeof WaveSystem === 'undefined') return '';

        if (WaveSystem.tacticalEventModalOpen) {
            return 'TACTICAL DIRECTIVE READY';
        }

        if (GameState.gamePhase === 'idle') {
            const nextWave = GameState.wave + 1;
            const preview = WaveSystem.getWavePreview(nextWave);
            if (preview && preview.primaryIdentity) {
                return `NEXT: ${preview.primaryIdentity.toUpperCase()}`;
            }
            const tags = preview && Array.isArray(preview.threatTags) ? preview.threatTags : [];
            if (tags.length > 0) {
                return `NEXT: ${tags.join(' • ')}`;
            }

            if (preview && preview.isBonus && preview.bonusInfo && preview.bonusInfo.name) {
                return `NEXT BONUS: ${preview.bonusInfo.name.toUpperCase()}`;
            }

            if (WaveSystem.endlessMode && nextWave > GameState.maxWave) {
                return 'NEXT: ENDLESS SPIKE';
            }

            return '';
        }

        if (GameState.gamePhase === 'playing') {
            if (WaveSystem.isBonusWave && typeof WaveSystem.getBonusObjectiveDisplay === 'function') {
                const bonusObj = WaveSystem.getBonusObjectiveDisplay();
                if (bonusObj) {
                    if (bonusObj.type === 'priority_target') {
                        return `BONUS OBJ: TARGETS ${bonusObj.remainingTargets}/${bonusObj.requiredTargets} • ${bonusObj.timeRemaining}s`;
                    }
                    return `BONUS OBJ: SURVIVE ${bonusObj.timeRemaining}s`;
                }
            }

            if (Array.isArray(GameState.enemies) && GameState.enemies.some(enemy => enemy.alive && enemy.isCaptain)) {
                return 'CAPTAIN AURA ACTIVE';
            }

            const activeMods = WaveSystem.getActiveModifiers ? WaveSystem.getActiveModifiers() : [];
            if (activeMods.length > 0) {
                return `MOD: ${activeMods[0].name.toUpperCase()}`;
            }
            if (GameState.lastStandTimer > 0) {
                return 'LAST STAND ACTIVE';
            }
        }

        return '';
    },

    updateInterestPreview() {
        // Show interest preview between waves
        const de = GameState.doctrineEffects || {};
        const tacticalProjected = (typeof WaveSystem !== 'undefined' && typeof WaveSystem.getProjectedTacticalModifiers === 'function')
            ? WaveSystem.getProjectedTacticalModifiers()
            : { interestRateDelta: 0, interestCapDelta: 0 };
        const interestRate = Math.max(0, CONFIG.INTEREST_RATE + (GameState.researchBonuses.interestRate || 0) + (de.interestRateDelta || 0) + (tacticalProjected.interestRateDelta || 0));
        const interestCap = Math.max(0, CONFIG.INTEREST_CAP + (GameState.researchBonuses.interestCap || 0) + (de.interestCapDelta || 0) + (tacticalProjected.interestCapDelta || 0));
        const interest = Math.min(Math.floor(GameState.gold * interestRate), interestCap);
        const el = document.getElementById('hud-gold-val');
        if (interest > 0 && GameState.gamePhase === 'idle') {
            el.textContent = `${formatGold(GameState.gold)} (+${interest})`;
        }
    },

    buildSidebar() {
        const list = document.getElementById('tower-list');
        list.innerHTML = '';

        for (const [type, def] of Object.entries(TOWERS)) {
            const towerMeta = (typeof ProgressionSystem !== 'undefined' && typeof ProgressionSystem.getTowerCardMeta === 'function')
                ? ProgressionSystem.getTowerCardMeta(type)
                : { unlocked: true, text: '', detail: '' };
            const btn = document.createElement('div');
            btn.className = 'tower-btn';
            btn.dataset.type = type;
            if (!towerMeta.unlocked) btn.classList.add('locked');

            let cost = this._getTowerCost(type);
            const disabled = GameState.gold < cost;
            if (disabled) btn.classList.add('disabled');

            // Use canvas-drawn icon
            const iconCanvas = TowerIcons.getIcon(type);
            const iconContainer = document.createElement('div');
            iconContainer.className = 'tb-icon';
            iconContainer.style.background = colorAlpha(def.iconColor, 0.15);
            iconContainer.style.border = `1px solid ${def.iconColor}`;
            if (iconCanvas) {
                iconCanvas.style.cssText = 'width:100%;height:100%;display:block;';
                iconContainer.appendChild(iconCanvas);
            }

            const info = document.createElement('div');
            info.className = 'tb-info';
            info.innerHTML = `
                <span class="tb-name">${def.nickname}</span>
                <span class="tb-cost">${cost}g</span>
                <span class="tb-desc">${def.description}</span>
                ${towerMeta.unlocked ? '' : `<span class="tb-lock">${towerMeta.text}</span><span class="tb-lock-detail">${towerMeta.detail}</span>`}
            `;

            const key = document.createElement('span');
            key.className = 'tb-key';
            key.textContent = def.key;

            btn.appendChild(iconContainer);
            btn.appendChild(info);
            btn.appendChild(key);

            // Tooltip on hover
            btn.addEventListener('mouseenter', () => {
                this._showSidebarTooltip(btn, type, def);
            });
            btn.addEventListener('mouseleave', () => {
                this._hideSidebarTooltip();
            });

            btn.addEventListener('click', () => {
                if (typeof ProgressionSystem !== 'undefined' && typeof ProgressionSystem.tryToggleTowerSelection === 'function') {
                    const result = ProgressionSystem.tryToggleTowerSelection(type, { requireGold: true });
                    if (result.ok) {
                        Audio.play('click');
                    }
                } else if (GameState.gold >= cost) {
                    if (GameState.selectedTowerType === type) {
                        GameState.selectedTowerType = null;
                    } else {
                        GameState.selectedTowerType = type;
                        GameState.selectedTower = null;
                        document.getElementById('tower-info').style.display = 'none';
                    }
                    this._updateSidebarSelection();
                    Audio.play('click');
                }
            });

            list.appendChild(btn);
        }

        this._buildAbilityBar();
    },

    _getTowerCost(type) {
        const def = TOWERS[type];
        let cost = def.baseCost;
        const rb = GameState.researchBonuses;
        cost = Math.floor(cost * (1 - Math.min(rb.costReduce || 0, 0.5)));
        if (rb.costMult) cost = Math.floor(cost * (1 + rb.costMult));
        return cost;
    },

    _showSidebarTooltip(btn, type, def) {
        let tooltip = document.getElementById('sidebar-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'sidebar-tooltip';
            tooltip.className = 'sidebar-tooltip';
            document.body.appendChild(tooltip);
        }

        const t1 = def.tiers[1];
        const dps = t1.fireRate > 0 ? (t1.damage / t1.fireRate).toFixed(1) : (t1.special?.dps || t1.damage).toFixed(1);

        tooltip.innerHTML = `
            <div class="stt-name" style="color:${def.iconColor}">${def.name}</div>
            <div class="stt-desc">${def.description}</div>
            <div class="stt-stats">
                <span>DMG: ${t1.damage}</span>
                <span>RNG: ${t1.range}</span>
                <span>RATE: ${t1.fireRate > 0 ? t1.fireRate + 's' : 'Beam'}</span>
                <span>DPS: ${dps}</span>
            </div>
            <div class="stt-paths">
                <div style="color:#40a0ff">Path A: ${def.pathA.name} — ${def.pathA.desc}</div>
                <div style="color:#ff8040">Path B: ${def.pathB.name} — ${def.pathB.desc}</div>
            </div>
            ${typeof ProgressionSystem !== 'undefined' && !ProgressionSystem.isTowerUnlocked(type)
                ? `<div class="stt-lock">LOCKED: ${ProgressionSystem.getTowerLockSummary(type)}</div>`
                : ''}
        `;

        const rect = btn.getBoundingClientRect();
        tooltip.style.display = 'block';
        tooltip.style.left = (rect.left - tooltip.offsetWidth - 10) + 'px';
        tooltip.style.top = rect.top + 'px';
    },

    _hideSidebarTooltip() {
        const tooltip = document.getElementById('sidebar-tooltip');
        if (tooltip) tooltip.style.display = 'none';
    },

    _updateSidebarSelection() {
        const btns = document.querySelectorAll('.tower-btn');
        btns.forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.type === GameState.selectedTowerType);
        });
    },

    updateSidebarCosts() {
        const btns = document.querySelectorAll('.tower-btn');
        btns.forEach(btn => {
            const type = btn.dataset.type;
            const cost = this._getTowerCost(type);
            const locked = typeof ProgressionSystem !== 'undefined' && !ProgressionSystem.isTowerUnlocked(type);
            const disabled = GameState.gold < cost;
            btn.classList.toggle('disabled', disabled);
            btn.classList.toggle('locked', locked);
            const costEl = btn.querySelector('.tb-cost');
            if (costEl) costEl.textContent = cost + 'g';
            const lockEl = btn.querySelector('.tb-lock-detail');
            if (lockEl && typeof ProgressionSystem !== 'undefined') {
                const meta = ProgressionSystem.getTowerCardMeta(type);
                lockEl.textContent = meta.detail;
            }
        });
    },

    _getAbilityHotkeyLabel(index, ability) {
        if (typeof Input !== 'undefined' && typeof Input.getAbilityHotkeyLabel === 'function') {
            return Input.getAbilityHotkeyLabel(index);
        }
        return ability && ability.key ? ability.key : '';
    },

    _buildAbilityBar() {
        const bar = document.getElementById('ability-bar');
        if (!bar) return;
        bar.innerHTML = '';

        for (let i = 0; i < GameState.abilities.length; i++) {
            const ab = GameState.abilities[i];
            const btn = document.createElement('div');
            btn.className = 'ability-btn';
            btn.dataset.index = i;

            const keyLabel = this._getAbilityHotkeyLabel(i, ab);

            btn.innerHTML = `
                <div class="ab-icon">${ab.icon}</div>
                <div class="cd-overlay" style="height:0%"></div>
                <span class="ab-cd"></span>
                <span class="ab-key">${keyLabel}</span>
                <span class="ab-name">${ab.name}</span>
            `;

            // Tooltip
            btn.title = `${ab.name}: ${ab.desc} (${keyLabel}) — CD: ${ab.cooldown}s`;

            btn.addEventListener('click', () => {
                if (ab.ready && GameState.gamePhase === 'playing') {
                    AbilitySystem.useAbility(i, GameState.mouseX, GameState.mouseY);
                }
            });

            bar.appendChild(btn);
        }
    },

    refreshAbilityHotkeys() {
        const btns = document.querySelectorAll('.ability-btn');
        for (let i = 0; i < btns.length; i++) {
            const ability = GameState.abilities[i] || PLAYER_ABILITIES[i];
            if (!ability) continue;

            const keyLabel = this._getAbilityHotkeyLabel(i, ability);
            const keyEl = btns[i].querySelector('.ab-key');
            if (keyEl) keyEl.textContent = keyLabel;
            btns[i].title = `${ability.name}: ${ability.desc} (${keyLabel}) — CD: ${ability.cooldown}s`;
        }
    },

    updateAbilityBar() {
        const btns = document.querySelectorAll('.ability-btn');
        for (let i = 0; i < btns.length; i++) {
            const ab = GameState.abilities[i];
            if (!ab) continue;
            const overlay = btns[i].querySelector('.cd-overlay');
            const cdText = btns[i].querySelector('.ab-cd');
            const canUseNow = GameState.gamePhase === 'playing';

            if (ab.ready) {
                overlay.style.height = '0%';
                btns[i].classList.remove('on-cooldown');
                btns[i].classList.add('ready');
                if (cdText) cdText.textContent = '';
            } else {
                const pct = (ab.cooldownTimer / ab.cooldown) * 100;
                overlay.style.height = pct + '%';
                btns[i].classList.add('on-cooldown');
                btns[i].classList.remove('ready');
                if (cdText) cdText.textContent = Math.ceil(ab.cooldownTimer).toString();
            }

            btns[i].classList.toggle('disabled', !canUseNow);
            if (!canUseNow && ab.ready && cdText) cdText.textContent = '';
        }
    },

    showTowerInfo(tower) {
        const panel = document.getElementById('tower-info');
        panel.style.display = 'block';
        GameState.selectedTower = tower;
        GameState.selectedTowerType = null;
        this._updateSidebarSelection();

        const def = TOWERS[tower.type];
        const multiSelectCount = (typeof Input !== 'undefined'
            && Input.isMultiSelected
            && Input.getMultiSelectCount
            && Input.isMultiSelected(tower))
            ? Input.getMultiSelectCount()
            : 1;
        const targetModeAppliesToGroup = multiSelectCount > 1 && tower.type !== 'boost';

        // Header
        document.getElementById('info-name').textContent = def.name;
        const tierEl = document.getElementById('info-tier');
        tierEl.textContent = `T${tower.tier}`;
        tierEl.className = 'tip2-tier tier-' + tower.tier;

        // Path
        const pathEl = document.getElementById('info-path');
        if (tower.path) {
            const pathDef = tower.path === 'A' ? def.pathA : def.pathB;
            pathEl.innerHTML = `<span class="tip2-path-badge" style="border-color:${def.iconColor}">${pathDef.icon} ${pathDef.name}</span>`;
        } else if (tower.tier >= 2) {
            pathEl.innerHTML = '<span class="tip2-path-hint">Pick a path at T3</span>';
        } else {
            pathEl.innerHTML = '';
        }

        // Stats — with upgrade diff preview when an upgrade is available
        const stats = document.getElementById('info-stats');
        const effDmg = tower.getEffectiveDamage();
        const effRange = tower.getEffectiveRange();
        const effRate = tower.getEffectiveFireRate();
        const dps = effRate > 0 ? (effDmg / effRate).toFixed(1) : (tower.special.dps || 0).toFixed(1);
        const boost = tower.getBoostBuff();
        const formation = tower.getFormationBonus();
        const linkNet = tower.getLinkBonuses();
        const progression = tower.getProgressionData();

        // Get next tier data for diff preview
        const upgInfo = tower.getUpgradeCost();
        let nextDmg = null, nextRange = null, nextRate = null, nextDps = null;
        if (upgInfo && !upgInfo.needsPath) {
            // Look up next tier's base stats
            const d = TOWERS[tower.type];
            let nextTier = null;
            if (upgInfo.nextTier <= 2) {
                nextTier = d.tiers[upgInfo.nextTier];
            } else if (tower.path) {
                const pd = tower.path === 'A' ? d.pathA : d.pathB;
                nextTier = pd.tiers[upgInfo.nextTier];
            }
            if (nextTier) {
                nextDmg = nextTier.damage;
                nextRange = nextTier.range;
                nextRate = nextTier.fireRate;
                nextDps = nextRate > 0 ? (nextDmg / nextRate).toFixed(1) : (nextTier.special?.dps || nextDmg).toFixed(1);
            }
        }

        const diffArrow = (cur, next) => {
            if (next === null || next === undefined) return '';
            const diff = next - cur;
            if (Math.abs(diff) < 0.01) return '';
            const isUp = diff > 0;
            const color = isUp ? '#40ff80' : '#ff6060';
            return ` <span style="color:${color};font-size:11px">\u2192 ${Math.floor(next)} <span style="font-size:9px">(${isUp ? '+' : ''}${diff > 0 ? Math.floor(diff) : diff.toFixed(1)})</span></span>`;
        };
        const rateDiff = (cur, next) => {
            if (next === null || next === undefined) return '';
            if (cur === 0 && next === 0) return '';
            const diff = next - cur;
            if (Math.abs(diff) < 0.001) return '';
            const isDown = diff < 0; // Lower fire rate = faster = better
            const color = isDown ? '#40ff80' : '#ff6060';
            return ` <span style="color:${color};font-size:11px">\u2192 ${next > 0 ? next.toFixed(2) + 's' : 'Beam'}</span>`;
        };

        const baseDmg = tower.damage;
        const baseRange = tower.range;
        const baseRate = tower.fireRate;
        // Primary stats strip
        let statsHTML = `<div class="tip2-primary">
            <div class="tip2-pstat"><div class="tip2-pval">${Math.floor(effDmg)}${diffArrow(baseDmg, nextDmg)}</div><div class="tip2-plbl">DMG</div></div>
            <div class="tip2-pstat"><div class="tip2-pval">${Math.floor(effRange)}${diffArrow(baseRange, nextRange)}</div><div class="tip2-plbl">RNG</div></div>
            <div class="tip2-pstat"><div class="tip2-pval">${effRate > 0 ? effRate.toFixed(2) + 's' : 'Beam'}${rateDiff(baseRate, nextRate)}</div><div class="tip2-plbl">RATE</div></div>
            <div class="tip2-pstat tip2-pstat-hl"><div class="tip2-pval">${dps}${nextDps !== null ? diffArrow(parseFloat(dps), parseFloat(nextDps)) : ''}</div><div class="tip2-plbl">DPS</div></div>
        </div>`;

        // Secondary stats row
        statsHTML += `<div class="tip2-secondary">
            <span class="tip2-sstat">${tower.kills} kills</span>
            <span class="tip2-sstat">${linkNet.count}/${CONFIG.MAX_LINKS_PER_TOWER} links</span>
            <span class="tip2-sstat tip2-gold">${tower.getSellValue()}g value</span>
        </div>`;

        // Bonus indicators
        const bonuses = [];
        if (boost.dmg > 0) bonuses.push(`<span class="bonus-tag buff">+${Math.round(boost.dmg * 100)}% Buff</span>`);
        if (formation.dmg > 0 || formation.rate > 0) bonuses.push(`<span class="bonus-tag combo">FORMATION ${formation.count}</span>`);
        if (linkNet.count > 0) bonuses.push(`<span class="bonus-tag buff">LINK NET ${linkNet.count}</span>`);
        if (tower.overclocked) bonuses.push(`<span class="bonus-tag overclock">OVERCLOCKED</span>`);
        if (tower.disabled) bonuses.push(`<span class="bonus-tag disabled">DISABLED</span>`);

        if (bonuses.length > 0) {
            statsHTML += `<div class="stat-bonuses">${bonuses.join(' ')}</div>`;
        }

        // Special abilities text
        if (tower.special) {
            const specials = [];
            if (tower.special.critChance) specials.push(`Crit: ${Math.round(tower.special.critChance * 100)}% (${tower.special.critMult || 2}x)`);
            if (tower.special.slow) specials.push(`Slow: ${Math.round(tower.special.slow * 100)}% for ${tower.special.slowDuration}s`);
            if (tower.special.freezeChance) specials.push(`Freeze: ${Math.round(tower.special.freezeChance * 100)}% for ${tower.special.freezeDuration}s`);
            if (tower.special.chains) specials.push(`Chain Lightning: ${tower.special.chains} targets`);
            if (tower.special.armorPierce) specials.push(`Armor Pierce: ${Math.round(tower.special.armorPierce * 100)}%`);
            if (tower.special.multishot || tower.special.multiShot) specials.push(`Multi-shot: ${tower.special.multishot || tower.special.multiShot} targets`);
            if (tower.special.multiMissile) specials.push(`Missiles: ${tower.special.multiMissile} per volley`);
            if (tower.special.homing) specials.push('Homing projectiles');
            if (tower.special.beam) specials.push('Continuous beam');
            if (tower.special.beamSplit) specials.push(`Beam Split: ${tower.special.beamSplit} targets`);
            if (tower.special.rampRate) specials.push(`Ramp: +${Math.round(tower.special.rampRate * 100)}%/s (max ${Math.round((tower.special.rampMax || 1) * 100)}%)`);
            if (tower.special.burnDPS) specials.push(`Burn: ${tower.special.burnDPS} DPS for ${tower.special.burnDuration}s`);
            if (tower.special.stunChance) specials.push(`Stun: ${Math.round(tower.special.stunChance * 100)}% for ${tower.special.stunDuration}s`);
            if (tower.special.instantKill) specials.push(`Execute: ${Math.round(tower.special.instantKill * 100)}% chance`);
            if (tower.special.aura) {
                const buffParts = [];
                if (tower.special.dmgBuff) buffParts.push(`+${Math.round(tower.special.dmgBuff * 100)}% dmg`);
                if (tower.special.rateBuff) buffParts.push(`+${Math.round(tower.special.rateBuff * 100)}% rate`);
                if (tower.special.rangeBuff) buffParts.push(`+${Math.round(tower.special.rangeBuff * 100)}% range`);
                if (tower.special.critBuff) buffParts.push(`+${Math.round(tower.special.critBuff * 100)}% crit`);
                specials.push(`Aura: ${buffParts.join(', ')}`);
            }
            if (tower.special.goldPerWave) specials.push(`+${tower.special.goldPerWave} gold/wave`);
            if (tower.special.upgradeDiscount) specials.push(`-${Math.round(tower.special.upgradeDiscount * 100)}% upgrade cost`);
            if (tower.special.markVuln) specials.push(`Mark: +${Math.round(tower.special.markVuln * 100)}% dmg for ${tower.special.markDuration}s`);
            if (tower.special.seeInvisible) specials.push('Detects invisible');
            if (formation.count >= 2) specials.push(`Formation: ${formation.count}-tower local cluster`);
            if (linkNet.count > 0) specials.push(`Links: ${linkNet.linkedNames.join(', ')}`);

            if (specials.length > 0) {
                statsHTML += `<div class="stat-specials">`;
                for (const s of specials) {
                    statsHTML += `<div class="special-line">${s}</div>`;
                }
                statsHTML += `</div>`;
            }
        }

        stats.innerHTML = statsHTML;

        // Mastery
        const masteryEl = document.getElementById('info-mastery');
        const mastery = progression.mastery;
        const nextMastery = progression.nextMastery;
        const progress = clamp(progression.percent, 0, 1);

        let masteryBonusText = '';
        if (mastery) {
            const bonusParts = [];
            if (mastery.dmgBonus) bonusParts.push(`+${Math.round(mastery.dmgBonus * 100)}% dmg`);
            if (mastery.rateBonus) bonusParts.push(`+${Math.round(mastery.rateBonus * 100)}% rate`);
            if (mastery.rangeBonus) bonusParts.push(`+${Math.round(mastery.rangeBonus * 100)}% range`);
            masteryBonusText = bonusParts.join(', ');
        }

        // Rank stars based on mastery level
        const masteryIdx = mastery ? CONFIG.MASTERY.indexOf(mastery) : -1;
        const stars = '\u2605'.repeat(masteryIdx + 1) + '\u2606'.repeat(Math.max(0, 4 - masteryIdx));
        const isMaxRank = mastery && !nextMastery;
        const scoreToNext = nextMastery ? progression.scoreToNext : 0;

        masteryEl.innerHTML = `
            <div class="mastery-section${isMaxRank ? ' mastery-mythic' : ''}">
                <div class="mastery-rank-badge" style="color:${mastery ? mastery.color : '#555'}">
                    <span class="mastery-stars">${mastery ? stars : '\u2606\u2606\u2606\u2606\u2606'}</span>
                    <span class="mastery-rank-name">${mastery ? mastery.title.toUpperCase() : 'NOVICE'}</span>
                </div>
                <div class="mastery-progress-wrap">
                    <div class="mastery-bar-large"><div class="mastery-fill-large" style="width:${progress * 100}%;background:linear-gradient(90deg, ${mastery ? mastery.color : '#555'}, ${mastery ? mastery.color + 'cc' : '#666'})"></div></div>
                    <span class="mastery-kill-count">score ${progression.score} | kills ${progression.kills} | sync +${progression.xpContribution}</span>
                </div>
                ${masteryBonusText ? `<div class="mastery-active-bonuses">${masteryBonusText}</div>` : ''}
                ${nextMastery ? `<div class="mastery-next-info">${scoreToNext} more score to <span style="color:${nextMastery.color}">${nextMastery.title}</span> · next sync point in ${progression.xpToNextScore} xp</div>` : `<div class="mastery-next-info" style="color:#a040ff">\u2728 Maximum Rank Achieved</div>`}
            </div>
        `;

        // Targeting
        const targetEl = document.getElementById('info-targeting');
        if (tower.type !== 'boost') {
            let targetHTML = `<div class="targeting-header">Targeting Priority${targetModeAppliesToGroup ? ` <span class="targeting-batch-note">(${multiSelectCount} towers)</span>` : ''}</div><div class="targeting-btns">`;
            for (const mode of CONFIG.TARGETING_MODES) {
                const isActive = tower.targetMode === mode;
                const icons = {
                    closest: '\u{1F3AF}', strongest: '\u{1F4AA}', weakest: '\u{1F494}',
                    first: '\u{23E9}', last: '\u{23EA}', fastest: '\u{26A1}'
                };
                targetHTML += `<button class="target-btn ${isActive ? 'active' : ''}" data-mode="${mode}" title="${mode}">
                    ${icons[mode] || ''} ${mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>`;
            }
            targetHTML += '</div>';
            targetEl.innerHTML = targetHTML;

            // Bind targeting buttons
            targetEl.querySelectorAll('.target-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    TowerCommands.setTargetMode(tower, btn.dataset.mode);
                    this.showTowerInfo(tower);
                    Audio.play('click');
                });
            });
        } else {
            targetEl.innerHTML = '';
        }

        // Actions
        const actionsEl = document.getElementById('info-actions');
        const actionRows = [];
        const actionHints = [];

        const upgradeChips = [];
        const pushUpgradeChip = (label, curV, newV, invertBetter = false, formatter = (v) => Math.floor(v)) => {
            if (newV === null || newV === undefined) return;
            const diff = newV - curV;
            if (Math.abs(diff) < 0.001) return;
            const better = invertBetter ? diff < 0 : diff > 0;
            const cls = better ? 'positive' : 'negative';
            const pct = curV !== 0 ? Math.round((Math.abs(diff) / Math.abs(curV)) * 100) : 0;
            const sign = diff > 0 ? '+' : '-';
            upgradeChips.push(`<span class="tip2-upgrade-chip ${cls}">${label} ${formatter(newV)} ${sign}${pct}%</span>`);
        };

        let primaryUpgradeHTML = '';
        if (upgInfo) {
            if (upgInfo.needsPath) {
                primaryUpgradeHTML = `<button class="action-btn upgrade path-choose-btn tip2-upgrade-primary" id="btn-upgrade-tower">
                    <span class="tip2-action-kicker">SPECIALIZE</span>
                    <span class="tip2-action-main"><span class="action-icon">\u{2B06}</span> CHOOSE PATH</span>
                    <span class="action-hint">Tier 3 unlock: choose Branch A or B</span>
                </button>`;
            } else {
                const canAfford = GameState.gold >= upgInfo.cost;
                pushUpgradeChip('DMG', baseDmg, nextDmg);
                pushUpgradeChip('RNG', baseRange, nextRange);
                pushUpgradeChip('RATE', baseRate, nextRate, true, (v) => v > 0 ? `${v.toFixed(2)}s` : 'Beam');
                if (nextDps !== null && nextDps !== undefined) {
                    pushUpgradeChip('DPS', parseFloat(dps), parseFloat(nextDps), false, (v) => Number(v).toFixed(1));
                }

                primaryUpgradeHTML = `<button class="action-btn upgrade tip2-upgrade-primary ${canAfford ? '' : 'cant-afford'}" id="btn-upgrade-tower">
                    <span class="tip2-action-kicker">NEXT UPGRADE</span>
                    <span class="tip2-action-main"><span class="action-icon">\u{2B06}</span> T${upgInfo.nextTier} <span class="action-cost">${upgInfo.cost}g</span></span>
                    ${upgradeChips.length > 0
                        ? `<span class="tip2-upgrade-preview">${upgradeChips.join('')}</span>`
                        : '<span class="action-hint">Applies next tier combat stats</span>'}
                </button>`;
            }
        } else if (tower.tier >= 5) {
            if (typeof TowerUltimates !== 'undefined' && TowerUltimates.canUpgradeToUltimate(tower)) {
                const ultDef = TowerUltimates.getUltimateDef(tower.type, tower.path);
                const ultCost = TowerUltimates.getUpgradeCost(tower);
                const canAfford = GameState.gold >= ultCost;
                primaryUpgradeHTML = `<button class="action-btn upgrade ultimate-upgrade tip2-upgrade-primary ${canAfford ? '' : 'cant-afford'}" id="btn-upgrade-tower">
                    <span class="tip2-action-kicker">ASCENSION</span>
                    <span class="tip2-action-main"><span class="action-icon">\u2B50</span> ULTIMATE: ${ultDef.name.toUpperCase()} <span class="action-cost">${ultCost}g</span></span>
                    <div class="ultimate-desc">${ultDef.desc}</div>
                </button>`;
            } else if (tower.tier === 6) {
                primaryUpgradeHTML = `<div class="max-tier-badge">\u{1F451} ULTIMATE TIER \u{1F451}<div class="max-tier-sub">This tower has reached its ultimate form</div></div>`;
            } else {
                primaryUpgradeHTML = `<div class="max-tier-badge">\u2B50 MAX TIER REACHED \u2B50<div class="max-tier-sub">This tower is fully upgraded</div></div>`;
            }
        } else if (tower.tier === 2 && !tower.path) {
            primaryUpgradeHTML = `<button class="action-btn upgrade path-choose-btn tip2-upgrade-primary" id="btn-upgrade-tower">
                <span class="tip2-action-kicker">SPECIALIZE</span>
                <span class="tip2-action-main"><span class="action-icon">\u{2B06}</span> CHOOSE PATH</span>
                <span class="action-hint">Tier 3 unlock: choose Branch A or B</span>
            </button>`;
        }
        if (primaryUpgradeHTML) {
            actionRows.push(`<div class="tip2-action-row tip2-action-row-upgrade">${primaryUpgradeHTML}</div>`);
        }

        const utilityButtons = [];
        if (tower.type !== 'boost') {
            if (tower.overclocked) {
                utilityButtons.push(`<button class="action-btn overclock active" disabled>
                    <span class="action-icon">\u{26A1}</span> OVERCLOCKED
                </button>`);
            } else if (tower.disabled) {
                utilityButtons.push(`<button class="action-btn overclock" disabled>
                    <span class="action-icon">\u{23F3}</span> COOLING DOWN
                </button>`);
            } else {
                utilityButtons.push(`<button class="action-btn overclock" id="btn-overclock-tower">
                    <span class="action-icon">\u{26A1}</span> OVERCLOCK
                </button>`);
            }
        }

        const moveCost = tower.getMoveCost();
        if (tower.isBeingMoved) {
            utilityButtons.push(`<button class="action-btn move active" id="btn-move-tower">
                <span class="action-icon">\u2716</span> CANCEL MOVE
                <span class="action-hint">Click a build tile to relocate</span>
            </button>`);
        } else {
            const canAffordMove = GameState.gold >= moveCost;
            utilityButtons.push(`<button class="action-btn move ${canAffordMove ? '' : 'cant-afford'}" id="btn-move-tower">
                <span class="action-icon">\u21F2</span> MOVE <span class="action-cost">${moveCost}g</span>
            </button>`);
        }

        if (tower.linkMode) {
            utilityButtons.push(`<button class="action-btn link active" id="btn-link-tower">
                <span class="action-icon">\u26D3</span> CANCEL LINK
                <span class="action-hint">Click another tower to link or unlink</span>
            </button>`);
        } else {
            const linkCapReached = linkNet.count >= CONFIG.MAX_LINKS_PER_TOWER;
            utilityButtons.push(`<button class="action-btn link ${linkCapReached ? 'cant-afford' : ''}" id="btn-link-tower">
                <span class="action-icon">\u26D3</span> LINK <span class="action-cost">${CONFIG.LINK_COST}g</span>
                <span class="action-hint">${linkCapReached ? 'Link cap reached' : `${linkNet.count}/${CONFIG.MAX_LINKS_PER_TOWER} active`}</span>
            </button>`);
        }
        actionRows.push(`<div class="tip2-action-row tip2-action-row-utility">${utilityButtons.join('')}</div>`);

        const sellAction = `<button class="action-btn sell ${tower.sellConfirmActive ? 'confirm' : ''}" id="btn-sell-tower">
            <span class="action-icon">\u{1F4B0}</span> ${tower.sellConfirmActive ? 'CONFIRM SELL' : 'SELL'} <span class="action-cost">${tower.getSellValue()}g</span>
            ${tower.sellConfirmActive ? `<span class="action-hint">${Math.max(1, Math.ceil(tower.sellConfirmTimer || 0))}s remaining</span>` : ''}
        </button>`;
        actionRows.push(`<div class="tip2-action-row tip2-action-row-economy">${sellAction}</div>`);

        if (targetModeAppliesToGroup) {
            actionHints.push(`Targeting changes apply to ${multiSelectCount} selected towers.`);
        }
        if (tower.isBeingMoved) {
            actionHints.push('Relocation preview uses current tower range and move cost.');
        }
        if (tower.linkMode) {
            actionHints.push(`Links cost ${CONFIG.LINK_COST}g, require ${CONFIG.LINK_RANGE}px range, and can be toggled by clicking another tower.`);
        } else if (linkNet.count > 0) {
            actionHints.push(`Link network: +${Math.round(linkNet.dmg * 100)}% dmg, +${Math.round(linkNet.rate * 100)}% rate, +${Math.round(linkNet.range * 100)}% range.`);
        }

        actionsEl.innerHTML = actionRows.join('') + (actionHints.length
            ? `<div class="tip2-action-notes">${actionHints.map((line) => `<div class="action-hint-line">${line}</div>`).join('')}</div>`
            : '');

        // Bind action buttons
        const upgradeBtn = document.getElementById('btn-upgrade-tower');
        if (upgradeBtn) {
            upgradeBtn.addEventListener('click', () => {
                // Tier 6 Ultimate upgrade
                if (tower.tier >= 5 && typeof TowerUltimates !== 'undefined' && TowerUltimates.canUpgradeToUltimate(tower)) {
                    if (TowerUltimates.applyUltimate(tower)) {
                        this.showTowerInfo(tower);
                        this.updateSidebarCosts();
                    }
                } else {
                    TowerCommands.upgradeTower(tower);
                    this.showTowerInfo(tower);
                    this.updateSidebarCosts();
                }
            });
        }

        const overclockBtn = document.getElementById('btn-overclock-tower');
        if (overclockBtn) {
            overclockBtn.addEventListener('click', () => {
                TowerCommands.overclockTower(tower);
                this.showTowerInfo(tower);
                if (tower.overclocked) {
                    Effects.spawnExplosion(tower.x, tower.y, '#ff8040', 12, { speed: 2, glow: true });
                }
            });
        }

        const moveBtn = document.getElementById('btn-move-tower');
        if (moveBtn) {
            moveBtn.addEventListener('click', () => {
                if (tower.isBeingMoved) {
                    TowerCommands.cancelMoveTower(tower);
                } else {
                    const moveResult = TowerCommands.beginMoveTower(tower);
                    if (!moveResult.ok && moveResult.reason === 'gold') {
                        Effects.addFloatingText(tower.x, tower.y - 26, `NEED ${moveResult.cost}g`, '#ff8800', 11);
                        Audio.play('error');
                    }
                }
                this.showTowerInfo(tower);
                this.updateSidebarCosts();
            });
        }

        const linkBtn = document.getElementById('btn-link-tower');
        if (linkBtn) {
            linkBtn.addEventListener('click', () => {
                if (tower.linkMode) {
                    TowerCommands.cancelLinkMode(tower);
                } else {
                    TowerCommands.beginLinkMode(tower);
                }
                this.showTowerInfo(tower);
            });
        }

        const sellBtn = document.getElementById('btn-sell-tower');
        if (sellBtn) {
            sellBtn.addEventListener('click', () => {
                const sellResult = TowerCommands.requestSellTower(tower);
                if (sellResult.sold) {
                    panel.style.display = 'none';
                } else {
                    this.showTowerInfo(tower);
                }
                this.updateSidebarCosts();
            });
        }
    },

    showPathChoice(tower) {
        const modal = document.getElementById('path-choice-modal');
        const def = TOWERS[tower.type];
        this._stopPathPreviewAnimations();
        modal.style.display = 'flex';

        document.getElementById('path-tower-name').textContent = def.name;

        const cur = { dmg: tower.damage, rng: tower.range, rate: tower.fireRate, splash: tower.splash || 0 };
        const curDps = cur.rate > 0 ? cur.dmg / cur.rate : 0;

        const fmt = (v, isRate) => {
            if (!Number.isFinite(v)) return '-';
            if (isRate) return v > 0 ? v.toFixed(2) + 's' : 'Beam';
            return Math.abs(v) >= 100 ? Math.round(v).toString() : Math.abs(v) >= 10 ? v.toFixed(1) : Number(v.toFixed(2)).toString();
        };

        const statRow = (label, oldV, newV, isRate) => {
            const diff = newV - oldV;
            if (isRate && (newV === 0 || oldV === 0)) {
                return `<div class="spec-stat"><span class="spec-stat-label">${label}</span><span class="spec-stat-value">Beam</span></div>`;
            }
            const better = isRate ? diff < 0 : diff > 0;
            const same = Math.abs(diff) < 0.001;
            const cls = same ? 'neutral' : (better ? 'up' : 'down');
            const pct = oldV !== 0 ? Math.round(Math.abs(diff) / Math.abs(oldV) * 100) : 0;
            const sign = diff > 0 ? '+' : '\u2212';
            return `<div class="spec-stat">
                <span class="spec-stat-label">${label}</span>
                <span class="spec-stat-value">${fmt(oldV, isRate)} <span class="arrow">\u2192</span> <span class="new-val ${cls}">${fmt(newV, isRate)}</span>${same ? '' : `<span class="delta ${cls}">${sign}${pct}%</span>`}</span>
            </div>`;
        };

        const buildStats = (tier3) => {
            let h = '';
            h += statRow('DMG', cur.dmg, tier3.damage, false);
            h += statRow('RNG', cur.rng, tier3.range, false);
            h += statRow('RATE', cur.rate, tier3.fireRate, true);
            if (tier3.splash || cur.splash) h += statRow('SPLASH', cur.splash, tier3.splash || 0, false);
            const nDps = tier3.fireRate > 0 ? tier3.damage / tier3.fireRate : tier3.damage;
            if (curDps > 0 && nDps > 0) {
                const cls = nDps >= curDps ? 'up' : 'down';
                h += `<div class="spec-stat spec-stat-dps"><span class="spec-stat-label">DPS</span><span class="spec-stat-value">${fmt(curDps, false)} <span class="arrow">\u2192</span> <span class="new-val ${cls}">${fmt(nDps, false)}</span></span></div>`;
            }
            return h;
        };

        const buildAbilities = (pathDef, tier3) => {
            let h = '';
            if (tier3.desc) h += `<div class="spec-ability"><span class="spec-ability-tier t3">T3</span>${tier3.desc}</div>`;
            const t4 = pathDef.tiers[4];
            if (t4 && t4.desc) h += `<div class="spec-ability"><span class="spec-ability-tier t4">T4</span>${t4.desc}</div>`;
            const t5 = pathDef.tiers[5];
            if (t5 && t5.desc) h += `<div class="spec-ability"><span class="spec-ability-tier t5">T5</span>${t5.desc}</div>`;
            return h;
        };

        const renderPreview = (containerId, path) => {
            const container = document.getElementById(containerId);
            if (!container) return;
            container.innerHTML = '';
            const sz = 80;
            const canvas = document.createElement('canvas');
            canvas.width = sz; canvas.height = sz;
            canvas.style.width = sz + 'px'; canvas.style.height = sz + 'px';
            container.appendChild(canvas);
            const ctx = canvas.getContext('2d');
            const pathDef = def['path' + path];
            const t3 = pathDef.tiers[3] || {};
            const fake = {
                type: tower.type, tier: 3, path,
                x: sz / 2, y: sz / 2, gridCol: 0, gridRow: 0,
                angle: -Math.PI / 4, fireTimer: 0, kills: 0,
                overclock: false, overclockTimer: 0, selected: false,
                damage: t3.damage || 0, range: t3.range || 100, fireRate: t3.fireRate || 1,
                splash: 0, stats: { totalDamageDealt: 0 },
                getEffectiveRange() { return this.range; },
                getEffectiveFireRate() { return this.fireRate; },
                getMasteryData() { return null; },
                getMasteryLevel() { return 0; },
            };
            const anim = { id: 0, stopped: false };
            this._pathPreviewAnimIds.push(anim);
            const draw = (ms) => {
                if (anim.stopped) return;
                const s = ms / 1000;
                const tx = sz / 2 + Math.cos(s * 1.5) * 18;
                const ty = sz / 2 + Math.sin(s * 1.2) * 12;
                fake.angle = Math.atan2(ty - sz / 2, tx - sz / 2);
                const phase = (s % 0.8) / 0.8;
                fake.fireTimer = phase < 0.12 ? 0 : 0.2;
                ctx.clearRect(0, 0, sz, sz);
                try { TowerRenderer.draw(ctx, fake); } catch (e) {}
                anim.id = requestAnimationFrame(draw);
            };
            anim.id = requestAnimationFrame(draw);
        };

        const populateCard = (path, pathDef) => {
            const p = path.toLowerCase();
            const tier3 = pathDef.tiers[3];
            const canAfford = GameState.gold >= tier3.cost;

            document.getElementById(`path-${p}-icon`).textContent = pathDef.icon || '';
            document.getElementById(`path-${p}-name`).textContent = pathDef.name;
            document.getElementById(`path-${p}-desc`).textContent = pathDef.desc;
            document.getElementById(`path-${p}-stats`).innerHTML = buildStats(tier3);
            document.getElementById(`path-${p}-abilities`).innerHTML = buildAbilities(pathDef, tier3);
            renderPreview(`path-${p}-preview`, path);

            const actionEl = document.getElementById(`path-${p}-action`);
            if (canAfford) {
                actionEl.className = 'spec-card-action';
                actionEl.innerHTML = `<span class="path-card-cost-badge">${tier3.cost}g</span> \u2014 SPECIALIZE`;
            } else {
                actionEl.className = 'spec-card-action locked';
                actionEl.innerHTML = `<span class="path-card-cost-badge locked">${tier3.cost}g</span> \u2014 Need ${Math.ceil(tier3.cost - GameState.gold)}g more`;
            }

            const card = document.getElementById(`path-${p}-card`);
            card.classList.toggle('cant-afford', !canAfford);
            return { card, canAfford, tier3 };
        };

        const a = populateCard('A', def.pathA);
        const b = populateCard('B', def.pathB);

        const closePathChoice = () => {
            this._stopPathPreviewAnimations();
            modal.style.display = 'none';
        };

        const shakeCard = (card) => {
            card.classList.remove('spec-shake');
            void card.offsetWidth;
            card.classList.add('spec-shake');
        };

        const choose = (path, canAfford, card) => {
            if (!canAfford) { shakeCard(card); Audio.play('error'); return; }
            if (tower.upgrade(path)) {
                closePathChoice();
                this.showTowerInfo(tower);
                this.updateSidebarCosts();
                Audio.play('upgrade');
            }
        };

        a.card.onclick = () => choose('A', a.canAfford, a.card);
        b.card.onclick = () => choose('B', b.canAfford, b.card);

        document.getElementById('btn-close-path-choice').onclick = closePathChoice;
        modal.onclick = (e) => { if (e.target === modal) closePathChoice(); };
    },

    hideTowerInfo() {
        document.getElementById('tower-info').style.display = 'none';
        GameState.selectedTower = null;
        this._lastTowerInfoStateKey = '';
    },

    drawCanvasUI(ctx) {
        this._lastCountdownBounds = null;

        // Wave progress bar — positioned below the HUD area in logical coords
        if (GameState.gamePhase === 'playing' && GameState.totalEnemiesInWave > 0) {
            const barW = 300;
            const barH = 6;
            const barX = (logicalWidth - barW) / 2;
            const barY = 8;
            const progress = (GameState.enemiesSpawned - GameState.enemiesAlive) / GameState.totalEnemiesInWave;

            // Background
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            this._roundRect(ctx, barX - 2, barY - 2, barW + 4, barH + 4, 4);
            ctx.fill();

            // Track
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            this._roundRect(ctx, barX, barY, barW, barH, 3);
            ctx.fill();

            // Fill
            const gradient = ctx.createLinearGradient(barX, 0, barX + barW, 0);
            gradient.addColorStop(0, '#40ff80');
            gradient.addColorStop(1, '#20c060');
            ctx.fillStyle = gradient;
            this._roundRect(ctx, barX, barY, barW * clamp(progress, 0, 1), barH, 3);
            ctx.fill();

            // Wave text
            ctx.font = '10px "Share Tech Mono"';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#aaa';
            ctx.fillText(`WAVE ${GameState.wave} — ${Math.round(progress * 100)}%`, logicalWidth / 2, barY + barH + 14);
        }

        // Auto-start countdown timer display
        if (WaveSystem.countdownActive) {
            const countdown = WaveSystem.getCountdownDisplay();
            if (countdown) {
                ctx.save();

                const anchor = this._getCountdownAnchor();
                const cx = anchor.x;
                const cy = anchor.y;
                const radius = 24;
                const now = performance.now();

                this._lastCountdownBounds = {
                    x: cx,
                    y: cy,
                    radius,
                };

                // Pulsing animation: scale oscillates between 1.0 and 1.12
                const pulse = 1.0 + 0.12 * Math.sin(now * 0.008);
                // Pulsing glow alpha
                const glowAlpha = 0.3 + 0.2 * Math.sin(now * 0.006);

                ctx.translate(cx, cy);
                ctx.scale(pulse, pulse);

                // Outer glow
                ctx.beginPath();
                ctx.arc(0, 0, radius + 6, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 215, 0, ${glowAlpha})`;
                ctx.fill();

                // Dark background circle
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
                ctx.fill();

                // Arc track (dim)
                ctx.beginPath();
                ctx.arc(0, 0, radius, -Math.PI / 2, Math.PI * 1.5);
                ctx.lineWidth = 4;
                ctx.strokeStyle = 'rgba(255, 215, 0, 0.2)';
                ctx.stroke();

                // Depleting arc — fraction goes from 1.0 down to 0.0
                const arcEnd = -Math.PI / 2 + Math.PI * 2 * countdown.fraction;
                ctx.beginPath();
                ctx.arc(0, 0, radius, -Math.PI / 2, arcEnd);
                ctx.lineWidth = 4;
                ctx.strokeStyle = '#ffd700';
                ctx.shadowColor = '#ffd700';
                ctx.shadowBlur = 8;
                ctx.stroke();
                ctx.shadowBlur = 0;

                // Number text (3, 2, 1)
                ctx.font = 'bold 22px "Share Tech Mono"';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = '#ffd700';
                ctx.fillText(countdown.remaining, 0, 1);

                // "AUTO" label below the circle
                ctx.font = '9px "Share Tech Mono"';
                ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
                ctx.fillText('AUTO', 0, radius + 16);

                ctx.restore();
            }
        }

        this._lastNextWavePreviewBounds = null;


        this._drawTowerLinks(ctx);

        // Placement preview (ghost tower + range circle)
        // PlacementPreview from juiceFeatures already renders the modern preview.
        // Keep this as a fallback only to avoid double circles.
        const hasJuicePlacementPreview = (typeof PlacementPreview !== 'undefined' && PlacementPreview.active);
        if (GameState.selectedTowerType && GameState.mouseX > 0) {
            if (!hasJuicePlacementPreview) {
                this._drawPlacementPreview(ctx);
            }
        } else if (GameState.selectedTower && GameState.selectedTower.isBeingMoved && GameState.mouseX > 0) {
            this._drawRelocationPreview(ctx, GameState.selectedTower);
        } else if (GameState.selectedTower && GameState.selectedTower.linkMode) {
            this._drawLinkPreview(ctx, GameState.selectedTower);
        }

        // Tower hover tooltip on canvas
        if (Input.hoveredTower && !GameState.selectedTowerType) {
            this._drawTowerHoverTooltip(ctx, Input.hoveredTower);
        }

        // Low lives warning vignette
        if (GameState.lives <= 5 && GameState.lives > 0) {
            const intensity = 0.15 + Math.sin(GameState.time * 4) * 0.05;
            const gradient = ctx.createRadialGradient(
                logicalWidth / 2, logicalHeight / 2, logicalWidth * 0.3,
                logicalWidth / 2, logicalHeight / 2, logicalWidth * 0.6
            );
            gradient.addColorStop(0, 'rgba(255,0,0,0)');
            gradient.addColorStop(1, `rgba(255,0,0,${intensity})`);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, logicalWidth, logicalHeight);
        }

        // Global buff overlays
        if (GameState.globalSlowTimer > 0) {
            ctx.fillStyle = 'rgba(64,128,255,0.05)';
            ctx.fillRect(0, 0, logicalWidth, logicalHeight);
        }
        if (GameState.globalDmgBuffTimer > 0) {
            ctx.fillStyle = 'rgba(255,128,64,0.05)';
            ctx.fillRect(0, 0, logicalWidth, logicalHeight);
        }
    },

    _drawPlacementPreview(ctx) {
        const ts = CONFIG.TILE_SIZE;
        const type = GameState.selectedTowerType;
        const def = TOWERS[type];

        // Free placement: follow mouse exactly
        const x = GameState.mouseX;
        const y = GameState.mouseY;
        if (x <= 0 || y <= 0) return;
        const canBuild = GameState.placementValid;

        // Range circle
        const range = def.tiers[1].range;
        ctx.save();
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = canBuild ? def.iconColor : '#ff4040';
        ctx.beginPath();
        ctx.arc(x, y, range, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = canBuild ? def.iconColor : '#ff4040';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // Ghost tower (circular footprint for free placement)
        ctx.save();
        const footprint = CONFIG.TOWER_FOOTPRINT || 14;
        ctx.globalAlpha = canBuild ? 0.6 : 0.3;
        ctx.fillStyle = canBuild ? def.color : '#ff4040';
        ctx.beginPath();
        ctx.arc(x, y, footprint, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = canBuild ? def.iconColor : '#ff4040';
        ctx.lineWidth = 2;
        ctx.globalAlpha = canBuild ? 0.8 : 0.5;
        ctx.stroke();
        ctx.restore();

        // Cost label
        let cost = def.baseCost;
        const rb = GameState.researchBonuses;
        cost = Math.floor(cost * (1 - Math.min(rb.costReduce || 0, 0.5)));
        const canAfford = GameState.gold >= cost;

        ctx.save();
        ctx.font = 'bold 10px "Share Tech Mono"';
        ctx.textAlign = 'center';
        ctx.fillStyle = canAfford ? '#ffd700' : '#ff4040';
        ctx.fillText(`${cost}g`, x, y + ts / 2 + 12);
        ctx.restore();

        // Invalid placement X
        if (!canBuild) {
            ctx.save();
            ctx.strokeStyle = '#ff4040';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x - 8, y - 8);
            ctx.lineTo(x + 8, y + 8);
            ctx.moveTo(x + 8, y - 8);
            ctx.lineTo(x - 8, y + 8);
            ctx.stroke();
            ctx.restore();
        }
    },

    _drawRelocationPreview(ctx, tower) {
        if (!tower) return;
        const x = GameState.mouseX;
        const y = GameState.mouseY;
        if (x <= 0 || y <= 0) return;

        const canMove = GameState.placementValid;
        const moveCost = tower.getMoveCost();
        const canAfford = GameState.gold >= moveCost;
        const color = (canMove && canAfford) ? (TOWERS[tower.type].iconColor || '#80d0ff') : '#ff4040';
        const footprint = CONFIG.TOWER_FOOTPRINT || 14;
        const range = tower.getEffectiveRange();

        ctx.save();
        ctx.globalAlpha = 0.14;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, range, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.45;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 4]);
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.globalAlpha = canMove && canAfford ? 0.55 : 0.28;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, footprint, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.9;
        ctx.lineWidth = 2;
        ctx.strokeStyle = color;
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.globalAlpha = 0.28;
        ctx.strokeStyle = '#ffd070';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(tower.x, tower.y, footprint + 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(tower.x, tower.y);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.font = 'bold 10px "Share Tech Mono"';
        ctx.textAlign = 'center';
        ctx.fillStyle = canAfford ? '#ffd070' : '#ff4040';
        const moveLabel = canMove ? `MOVE ${moveCost}g` : (canAfford ? 'INVALID TILE' : `NEED ${moveCost}g`);
        ctx.fillText(moveLabel, x, y + CONFIG.TILE_SIZE / 2 + 12);
        ctx.restore();
    },

    _drawTowerLinks(ctx) {
        const drawn = new Set();
        for (const tower of GameState.towers) {
            const linked = tower.getLinkedTowers ? tower.getLinkedTowers() : [];
            for (const other of linked) {
                const key = tower.id < other.id ? `${tower.id}-${other.id}` : `${other.id}-${tower.id}`;
                if (drawn.has(key)) continue;
                drawn.add(key);

                ctx.save();
                ctx.globalAlpha = 0.45;
                ctx.strokeStyle = '#7dc7ff';
                ctx.lineWidth = (GameState.selectedTower && (GameState.selectedTower === tower || GameState.selectedTower === other)) ? 2.5 : 1.5;
                ctx.setLineDash([6, 4]);
                ctx.beginPath();
                ctx.moveTo(tower.x, tower.y);
                ctx.lineTo(other.x, other.y);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.restore();
            }
        }
    },

    _drawLinkPreview(ctx, tower) {
        if (!tower) return;
        const hovered = Input && Input.hoveredTower ? Input.hoveredTower : null;
        const target = hovered && hovered !== tower ? hovered : null;

        ctx.save();
        ctx.globalAlpha = 0.35;
        ctx.strokeStyle = '#7dc7ff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(tower.x, tower.y, CONFIG.LINK_RANGE, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        if (!target) return;

        const valid = tower.hasLinkTo(target) || tower.canLinkTo(target);
        ctx.save();
        ctx.globalAlpha = 0.65;
        ctx.strokeStyle = valid ? '#7dc7ff' : '#ff6060';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(tower.x, tower.y);
        ctx.lineTo(target.x, target.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
    },

    _drawTowerHoverTooltip(ctx, tower) {
        const def = TOWERS[tower.type];
        const x = tower.x;
        const y = tower.y - CONFIG.TILE_SIZE - 10;

        ctx.save();
        ctx.font = '10px "Share Tech Mono"';
        const name = `${def.nickname} T${tower.tier}`;
        const w = ctx.measureText(name).width + 16;
        const h = 18;

        // Background
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        this._roundRect(ctx, x - w / 2, y - h / 2, w, h, 4);
        ctx.fill();
        ctx.strokeStyle = def.iconColor;
        ctx.lineWidth = 1;
        this._roundRect(ctx, x - w / 2, y - h / 2, w, h, 4);
        ctx.stroke();

        // Text
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText(name, x, y + 4);
        ctx.restore();
    },

    _roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    },
};
