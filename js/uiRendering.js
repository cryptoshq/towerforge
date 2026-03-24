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
            el.textContent = formatGold(GameState.gold);
            this.lastGold = GameState.gold;

            // Flash gold on change
            el.style.transition = 'none';
            el.style.textShadow = '0 0 10px #ffd700';
            requestAnimationFrame(() => {
                el.style.transition = 'text-shadow 0.5s';
                el.style.textShadow = 'none';
            });
        }
        if (GameState.lives !== this.lastLives) {
            const el = document.getElementById('hud-lives-val');
            el.textContent = GameState.lives;
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
            document.getElementById('hud-wave-val').textContent = `${GameState.wave} / ${GameState.maxWave}`;
            this.lastWave = GameState.wave;
        }
        if (GameState.score !== this.lastScore) {
            document.getElementById('hud-score-val').textContent = GameState.score;
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
                const info = GameState.selectedTower.getUpgradeCost();
                if (info && info.cost !== undefined) {
                    const canAfford = GameState.gold >= info.cost;
                    upgradeBtn.classList.toggle('cant-afford', !canAfford);
                }
            }
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
            if (preview && preview.bossName) {
                return `NEXT BOSS: ${preview.bossName.toUpperCase()}`;
            }
            if (preview && preview.scenario && preview.scenario.name) {
                return `NEXT SCENARIO: ${preview.scenario.name.toUpperCase()}`;
            }
            if (preview && preview.faction && preview.faction.name) {
                return `NEXT FACTION: ${preview.faction.name.toUpperCase()}`;
            }
            if (preview && preview.arc && preview.arc.name) {
                return `NEXT ARC: ${preview.arc.name.toUpperCase()}`;
            }
            if (preview && preview.mapPressure && preview.mapPressure.name) {
                return `MAP PRESSURE: ${preview.mapPressure.name.toUpperCase()}`;
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
            const btn = document.createElement('div');
            btn.className = 'tower-btn';
            btn.dataset.type = type;

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
                if (GameState.gold >= cost) {
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
            const disabled = GameState.gold < cost;
            btn.classList.toggle('disabled', disabled);
            const costEl = btn.querySelector('.tb-cost');
            if (costEl) costEl.textContent = cost + 'g';
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

        // Header
        document.getElementById('info-name').textContent = def.name;
        const tierEl = document.getElementById('info-tier');
        tierEl.textContent = `Tier ${tower.tier}`;
        tierEl.className = 'tower-info-tier tier-' + tower.tier;

        // Path
        const pathEl = document.getElementById('info-path');
        if (tower.path) {
            const pathDef = tower.path === 'A' ? def.pathA : def.pathB;
            pathEl.innerHTML = `
                <span class="path-badge" style="border-color:${def.iconColor}">
                    ${pathDef.icon} ${pathDef.name}
                </span>
                <span class="path-desc">${pathDef.desc}</span>
            `;
        } else if (tower.tier >= 2) {
            pathEl.innerHTML = '<span class="path-desc" style="color:#ffaa00">Choose a path at Tier 3</span>';
        } else {
            pathEl.innerHTML = '<span class="path-desc">Upgrade to unlock paths</span>';
        }

        // Stats — with upgrade diff preview when an upgrade is available
        const stats = document.getElementById('info-stats');
        const effDmg = tower.getEffectiveDamage();
        const effRange = tower.getEffectiveRange();
        const effRate = tower.getEffectiveFireRate();
        const dps = effRate > 0 ? (effDmg / effRate).toFixed(1) : (tower.special.dps || 0).toFixed(1);
        const boost = tower.getBoostBuff();
        const combo = tower.getComboBonus();

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

        // Show base stats on left, effective (with bonuses) in parentheses
        const baseDmg = tower.damage;
        const baseRange = tower.range;
        const baseRate = tower.fireRate;
        const hasBonus = Math.abs(effDmg - baseDmg) > 0.5 || Math.abs(effRange - baseRange) > 0.5;
        const bonusSuffix = (base, eff) => {
            if (Math.abs(eff - base) < 0.5) return '';
            return ` <span style="color:#80ff80;font-size:10px">(${Math.floor(eff)})</span>`;
        };

        let statsHTML = `
            <div class="stat-item"><span class="stat-label">Damage</span><span class="stat-value">${Math.floor(baseDmg)}${bonusSuffix(baseDmg, effDmg)}${diffArrow(baseDmg, nextDmg)}</span></div>
            <div class="stat-item"><span class="stat-label">Range</span><span class="stat-value">${Math.floor(baseRange)}${bonusSuffix(baseRange, effRange)}${diffArrow(baseRange, nextRange)}</span></div>
            <div class="stat-item"><span class="stat-label">Fire Rate</span><span class="stat-value">${baseRate > 0 ? baseRate.toFixed(2) + 's' : 'Beam'}${rateDiff(baseRate, nextRate)}</span></div>
            <div class="stat-item highlight"><span class="stat-label">DPS</span><span class="stat-value">${dps}${nextDps !== null ? diffArrow(parseFloat(dps), parseFloat(nextDps)) : ''}</span></div>
            <div class="stat-item"><span class="stat-label">Kills</span><span class="stat-value">${tower.kills}</span></div>
            <div class="stat-item"><span class="stat-label">Value</span><span class="stat-value gold">${tower.getSellValue()}g</span></div>
        `;

        // Bonus indicators
        const bonuses = [];
        if (boost.dmg > 0) bonuses.push(`<span class="bonus-tag buff">+${Math.round(boost.dmg * 100)}% Buff</span>`);
        if (combo.dmg > 0) bonuses.push(`<span class="bonus-tag combo">+${Math.round(combo.dmg * 100)}% Combo</span>`);
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
        const mastery = tower.getMasteryData();
        const kills = tower.kills + (GameState.researchBonuses.masteryBonus || 0);
        const nextMastery = CONFIG.MASTERY.find(m => m.kills > kills);
        const nextKills = nextMastery ? nextMastery.kills : CONFIG.MASTERY[CONFIG.MASTERY.length - 1].kills;
        const prevKills = mastery ? mastery.kills : 0;
        const progress = clamp((kills - prevKills) / Math.max(nextKills - prevKills, 1), 0, 1);

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
        const killsToNext = nextMastery ? (nextKills - kills) : 0;

        masteryEl.innerHTML = `
            <div class="mastery-section${isMaxRank ? ' mastery-mythic' : ''}">
                <div class="mastery-rank-badge" style="color:${mastery ? mastery.color : '#555'}">
                    <span class="mastery-stars">${mastery ? stars : '\u2606\u2606\u2606\u2606\u2606'}</span>
                    <span class="mastery-rank-name">${mastery ? mastery.title.toUpperCase() : 'NOVICE'}</span>
                </div>
                <div class="mastery-progress-wrap">
                    <div class="mastery-bar-large"><div class="mastery-fill-large" style="width:${progress * 100}%;background:linear-gradient(90deg, ${mastery ? mastery.color : '#555'}, ${mastery ? mastery.color + 'cc' : '#666'})"></div></div>
                    <span class="mastery-kill-count">${kills} kills</span>
                </div>
                ${masteryBonusText ? `<div class="mastery-active-bonuses">${masteryBonusText}</div>` : ''}
                ${nextMastery ? `<div class="mastery-next-info">${killsToNext} more kills to <span style="color:${nextMastery.color}">${nextMastery.title}</span></div>` : `<div class="mastery-next-info" style="color:#a040ff">\u2728 Maximum Rank Achieved</div>`}
            </div>
        `;

        // Targeting
        const targetEl = document.getElementById('info-targeting');
        if (tower.type !== 'boost') {
            let targetHTML = '<div class="targeting-header">Targeting Priority</div><div class="targeting-btns">';
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
                    tower.targetMode = btn.dataset.mode;
                    this.showTowerInfo(tower);
                    Audio.play('click');
                });
            });
        } else {
            targetEl.innerHTML = '';
        }

        // Actions
        const actionsEl = document.getElementById('info-actions');
        let actionsHTML = '';

        // Upgrade button (upgInfo already computed above for stat diff)
        if (upgInfo) {
            if (upgInfo.needsPath) {
                actionsHTML += `<button class="action-btn upgrade path-choose-btn" id="btn-upgrade-tower">
                    <span class="action-icon">\u{2B06}</span> CHOOSE PATH
                    <span class="action-hint">Pick your specialization!</span>
                </button>`;
            } else {
                const canAfford = GameState.gold >= upgInfo.cost;
                actionsHTML += `<button class="action-btn upgrade ${canAfford ? '' : 'cant-afford'}" id="btn-upgrade-tower">
                    <span class="action-icon">\u{2B06}</span> UPGRADE TO T${upgInfo.nextTier} <span class="action-cost">${upgInfo.cost}g</span>
                </button>`;
            }
        } else if (tower.tier >= 5) {
            actionsHTML += `<div class="max-tier-badge">\u2B50 MAX TIER REACHED \u2B50<div class="max-tier-sub">This tower is fully upgraded</div></div>`;
        } else if (tower.tier === 2 && !tower.path) {
            actionsHTML += `<button class="action-btn upgrade path-choose-btn" id="btn-upgrade-tower">
                <span class="action-icon">\u{2B06}</span> CHOOSE PATH
                <span class="action-hint">Pick your specialization!</span>
            </button>`;
        }

        // Overclock
        if (tower.type !== 'boost') {
            if (tower.overclocked) {
                actionsHTML += `<button class="action-btn overclock active" disabled>
                    <span class="action-icon">\u{26A1}</span> OVERCLOCKED
                </button>`;
            } else if (tower.disabled) {
                actionsHTML += `<button class="action-btn overclock" disabled>
                    <span class="action-icon">\u{23F3}</span> COOLING DOWN
                </button>`;
            } else {
                actionsHTML += `<button class="action-btn overclock" id="btn-overclock-tower">
                    <span class="action-icon">\u{26A1}</span> OVERCLOCK
                </button>`;
            }
        }

        // Sell
        actionsHTML += `<button class="action-btn sell" id="btn-sell-tower">
            <span class="action-icon">\u{1F4B0}</span> SELL <span class="action-cost">${tower.getSellValue()}g</span>
        </button>`;

        actionsEl.innerHTML = actionsHTML;

        // Bind action buttons
        const upgradeBtn = document.getElementById('btn-upgrade-tower');
        if (upgradeBtn) {
            upgradeBtn.addEventListener('click', () => {
                if (upgInfo.needsPath) {
                    this.showPathChoice(tower);
                } else if (GameState.gold >= upgInfo.cost) {
                    tower.upgrade();
                    this.showTowerInfo(tower);
                    this.updateSidebarCosts();
                }
            });
        }

        const overclockBtn = document.getElementById('btn-overclock-tower');
        if (overclockBtn) {
            overclockBtn.addEventListener('click', () => {
                tower.overclock();
                this.showTowerInfo(tower);
                Effects.spawnExplosion(tower.x, tower.y, '#ff8040', 12, { speed: 2, glow: true });
            });
        }

        const sellBtn = document.getElementById('btn-sell-tower');
        if (sellBtn) {
            sellBtn.addEventListener('click', () => {
                tower.sell();
                panel.style.display = 'none';
                this.updateSidebarCosts();
            });
        }
    },

    showPathChoice(tower) {
        const modal = document.getElementById('path-choice-modal');
        const def = TOWERS[tower.type];
        this._stopPathPreviewAnimations();
        modal.style.display = 'flex';

        document.getElementById('path-tower-name').textContent = def.name + ' \u2014 Tier 2 \u2192 Tier 3';

        // Current tower stats for comparison
        const curDmg = tower.damage;
        const curRange = tower.range;
        const curRate = tower.fireRate;
        const curSplash = tower.splash || 0;

        // Helper: build a stat comparison bar
        const buildStatBar = (label, oldVal, newVal, isFireRate) => {
            // For fire rate, lower is better (faster)
            const diff = newVal - oldVal;
            const isBeam = newVal === 0 || oldVal === 0;
            if (isBeam) {
                const cls = 'neutral';
                return `<div class="stat-bar-row">
                    <span class="stat-bar-label">${label}</span>
                    <span class="stat-bar-values">
                        <span class="stat-bar-old">${oldVal > 0 ? oldVal + 's' : 'Beam'}</span>
                        <span class="stat-bar-arrow">\u2192</span>
                        <span class="stat-bar-new ${cls}">${newVal > 0 ? newVal + 's' : 'Beam'}</span>
                        <span class="stat-change-pct ${cls}">\u2014</span>
                    </span>
                </div>`;
            }
            let positive;
            if (isFireRate) {
                positive = diff < 0; // lower fire rate = faster = better
            } else {
                positive = diff > 0;
            }
            const neutral = diff === 0;
            const cls = neutral ? 'neutral' : (positive ? 'positive' : 'negative');
            const pct = oldVal !== 0 ? Math.round(Math.abs(diff) / oldVal * 100) : 0;
            const sign = diff > 0 ? '+' : (diff < 0 ? '' : '');
            const arrow = neutral ? '\u2014' : (positive ? '\u25B2' : '\u25BC');
            const suffix = isFireRate ? 's' : '';
            // Bar fill percentage (relative scale)
            const maxStat = Math.max(oldVal, newVal);
            const fillPct = maxStat > 0 ? Math.round((newVal / maxStat) * 100) : 0;
            return `<div class="stat-bar-row">
                <span class="stat-bar-label">${label}</span>
                <span class="stat-bar-values">
                    <span class="stat-bar-old">${oldVal}${suffix}</span>
                    <span class="stat-bar-arrow">\u2192</span>
                    <span class="stat-bar-new ${cls}">${newVal}${suffix}</span>
                    <div class="stat-bar-track"><div class="stat-bar-fill ${cls}" style="width:${fillPct}%"></div></div>
                    <span class="stat-change-pct ${cls}">${sign}${pct}% ${arrow}</span>
                </span>
            </div>`;
        };

        // Helper: build sparkle particles HTML
        const sparklesHTML = '<div class="sparkle-container">' +
            '<div class="sparkle"></div><div class="sparkle"></div><div class="sparkle"></div><div class="sparkle"></div>' +
            '<div class="sparkle"></div><div class="sparkle"></div><div class="sparkle"></div><div class="sparkle"></div>' +
            '</div>';

        // Helper: extract ultimate ability name from tier 5 desc
        const getUltimateName = (tier5) => {
            if (!tier5 || !tier5.desc) return null;
            // Try to find a named ability (usually after a comma, or a capitalized phrase)
            const desc = tier5.desc;
            // Look for patterns like "Devastation Round", "Volley Storm", "Absolute Zero", etc.
            const patterns = [
                /,\s*([A-Z][a-z]+(?: [A-Z][a-z]+)+)/,
                /([A-Z][a-z]+(?: [A-Z][a-z]+)+)\s+every/,
                /([A-Z][a-z]+(?: [A-Z][a-z]+)+)$/,
            ];
            for (const pat of patterns) {
                const m = desc.match(pat);
                if (m) return m[1];
            }
            // Fallback: check for special keys
            if (tier5.special) {
                const abilityKeys = ['devastation', 'volleyStorm', 'absoluteZero', 'glacialLance',
                    'overload', 'thunderstorm', 'markedForDeath', 'designate', 'deathRay',
                    'solarFlare', 'tacticalNuke', 'rocketBarrage', 'supernova', 'blackMarket'];
                for (const key of abilityKeys) {
                    if (tier5.special[key]) {
                        return key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();
                    }
                }
            }
            return 'ULTIMATE POWER';
        };

        // Helper: build tier progression timeline
        const buildTierProgression = (pathDef) => {
            let html = '<div class="tier-progression"><div class="tier-progression-title">UPGRADE PATH PREVIEW</div>';
            for (let t = 3; t <= 5; t++) {
                const tierData = pathDef.tiers[t];
                if (!tierData) continue;
                const isUlt = t === 5;
                const stepClass = isUlt ? 'tier-step tier-step-ultimate' : 'tier-step';
                html += `<div class="${stepClass}">
                    <span class="tier-badge tier-badge-${t}">T${t}</span>
                    <span class="tier-step-desc">${tierData.desc || 'Enhanced stats'}</span>
                </div>`;
            }
            html += '</div>';
            return html;
        };

        // Helper: build ultimate showcase
        const buildUltimateShowcase = (pathDef) => {
            const t5 = pathDef.tiers[5];
            if (!t5) return '';
            const ultName = getUltimateName(t5);
            return `<div class="ultimate-showcase">
                <div class="ultimate-label">TIER 5 ULTIMATE</div>
                <div class="ultimate-name">\u2605 ${ultName ? ultName.toUpperCase() : 'ULTIMATE POWER'} \u2605</div>
                <div class="ultimate-desc">${t5.desc || ''}</div>
            </div>`;
        };

        // Helper: build a full path card's stats content
        const buildPathContent = (pathDef, canAfford, tier3) => {
            let html = '<div class="path-stats-preview">';
            html += '<div class="ps-section-title">STAT COMPARISON (TIER 2 \u2192 TIER 3)</div>';

            // Stat bars
            html += buildStatBar('Damage', curDmg, tier3.damage, false);
            html += buildStatBar('Range', curRange, tier3.range, false);
            html += buildStatBar('Fire Rate', curRate, tier3.fireRate, true);
            if (tier3.splash || curSplash) {
                html += buildStatBar('Splash', curSplash, tier3.splash || 0, false);
            }

            // Special ability for tier 3
            if (tier3.desc) {
                html += `<div class="ps-special">\u2726 ${tier3.desc}</div>`;
            }

            html += '</div>'; // close path-stats-preview

            // Tier progression timeline
            html += buildTierProgression(pathDef);

            // Ultimate showcase
            html += buildUltimateShowcase(pathDef);



            return html;
        };

        // Populate "CURRENT STATS" section (the "before")
        const currentStatsEl = document.getElementById('path-current-stats');
        const rateDisplay = curRate > 0 ? curRate + 's' : 'Beam';
        currentStatsEl.innerHTML = `
            <div class="pcs-title">CURRENT TOWER STATS (TIER 2)</div>
            <div class="pcs-row">
                <span class="pcs-stat"><span class="pcs-label">DMG:</span> <span class="pcs-val">${curDmg}</span></span>
                <span class="pcs-stat"><span class="pcs-label">RNG:</span> <span class="pcs-val">${curRange}</span></span>
                <span class="pcs-stat"><span class="pcs-label">RATE:</span> <span class="pcs-val">${rateDisplay}</span></span>
                ${curSplash ? `<span class="pcs-stat"><span class="pcs-label">SPLASH:</span> <span class="pcs-val">${curSplash}</span></span>` : ''}
            </div>`;

        // Path A
        const pa3 = def.pathA.tiers[3];
        const canAffordA = GameState.gold >= pa3.cost;
        document.getElementById('path-a-name').textContent = `${def.pathA.icon} ${def.pathA.name}`;
        document.getElementById('path-a-desc').textContent = def.pathA.desc;
        document.getElementById('path-a-stats').innerHTML = buildPathContent(def.pathA, canAffordA, pa3);

        // Path B
        const pb3 = def.pathB.tiers[3];
        const canAffordB = GameState.gold >= pb3.cost;
        document.getElementById('path-b-name').textContent = `${def.pathB.icon} ${def.pathB.name}`;
        document.getElementById('path-b-desc').textContent = def.pathB.desc;
        document.getElementById('path-b-stats').innerHTML = buildPathContent(def.pathB, canAffordB, pb3);

        // Tower visual preview — render what the tower will look like at T3 and T5
        const renderTowerPreview = (containerId, path) => {
            const container = document.getElementById(containerId);
            if (!container) return;
            // Remove any existing preview
            container.querySelectorAll('.path-tower-preview').forEach(el => el.remove());

            const previewDiv = document.createElement('div');
            previewDiv.className = 'path-tower-preview';

            // Create canvases for T3 and T5
            for (const tier of [3, 5]) {
                const wrap = document.createElement('div');
                wrap.className = 'ptv-tier-wrap';

                const canvas = document.createElement('canvas');
                canvas.width = 80;
                canvas.height = 80;
                const pCtx = canvas.getContext('2d');

                // Create a fake tower object for rendering
                const fakeTower = {
                    type: tower.type,
                    tier: tier,
                    path: path,
                    x: 40,
                    y: 40,
                    gridCol: 0,
                    gridRow: 0,
                    angle: -Math.PI / 4,
                    fireTimer: 0,
                    kills: 0,
                    overclock: false,
                    overclockTimer: 0,
                    selected: false,
                    damage: def['path' + path].tiers[tier] ? def['path' + path].tiers[tier].damage || 0 : 0,
                    range: def['path' + path].tiers[tier] ? def['path' + path].tiers[tier].range || 100 : 100,
                    fireRate: def['path' + path].tiers[tier] ? def['path' + path].tiers[tier].fireRate || 1 : 1,
                    splash: 0,
                    stats: { totalDamageDealt: 0 },
                    getEffectiveRange() { return this.range; },
                    getMasteryLevel() { return 0; },
                };

                const orbitR = tier === 5 ? 21 : 17;
                const cycle = tier === 5 ? 0.55 : 0.8;
                const animRef = { id: 0, stopped: false };
                this._pathPreviewAnimIds.push(animRef);

                const drawFrame = (ms) => {
                    if (animRef.stopped) return;
                    const sec = ms / 1000;
                    const enemyX = 40 + Math.cos(sec * (tier === 5 ? 1.9 : 1.5)) * orbitR;
                    const enemyY = 40 + Math.sin(sec * (tier === 5 ? 1.4 : 1.2)) * (orbitR * 0.75);

                    fakeTower.angle = Math.atan2(enemyY - fakeTower.y, enemyX - fakeTower.x);
                    const phase = (sec % cycle) / cycle;
                    fakeTower.fireTimer = phase < 0.12 ? 0 : 0.2;

                    pCtx.clearRect(0, 0, 80, 80);

                    // Draw dark background circle
                    pCtx.fillStyle = 'rgba(20,20,40,0.8)';
                    pCtx.beginPath();
                    pCtx.arc(40, 40, 36, 0, Math.PI * 2);
                    pCtx.fill();
                    pCtx.strokeStyle = 'rgba(100,100,200,0.3)';
                    pCtx.lineWidth = 1;
                    pCtx.stroke();

                    // Enemy marker in the model box
                    pCtx.fillStyle = '#ff7070';
                    pCtx.beginPath();
                    pCtx.arc(enemyX, enemyY, 2.5, 0, Math.PI * 2);
                    pCtx.fill();

                    // Shot tracer when firing
                    if (phase < 0.12) {
                        pCtx.strokeStyle = 'rgba(255, 220, 160, 0.7)';
                        pCtx.lineWidth = 1;
                        pCtx.beginPath();
                        pCtx.moveTo(40, 40);
                        pCtx.lineTo(enemyX, enemyY);
                        pCtx.stroke();
                    }

                    // Render the tower
                    try {
                        TowerRenderer.draw(pCtx, fakeTower);
                    } catch(e) {
                        pCtx.fillStyle = '#666';
                        pCtx.font = '12px monospace';
                        pCtx.textAlign = 'center';
                        pCtx.fillText('T' + tier, 40, 44);
                    }

                    animRef.id = requestAnimationFrame(drawFrame);
                };

                animRef.id = requestAnimationFrame(drawFrame);

                const label = document.createElement('div');
                label.className = 'ptv-label';
                label.textContent = tier === 3 ? 'TIER 3' : 'TIER 5';
                if (tier === 5) label.style.color = '#ffd700';

                wrap.appendChild(canvas);
                wrap.appendChild(label);
                previewDiv.appendChild(wrap);
            }

            // Insert before the stats section
            const statsEl = container.querySelector('.path-stats-preview') || container.querySelector('[id$="-stats"]');
            if (statsEl) {
                statsEl.parentNode.insertBefore(previewDiv, statsEl);
            } else {
                container.appendChild(previewDiv);
            }
        };

        renderTowerPreview('path-a-stats', 'A');
        renderTowerPreview('path-b-stats', 'B');

        // Inject sparkle particles into both cards
        ['path-a-card', 'path-b-card'].forEach(cardId => {
            const card = document.getElementById(cardId);
            // Remove old sparkle containers
            card.querySelectorAll('.sparkle-container').forEach(el => el.remove());
            card.insertAdjacentHTML('beforeend', sparklesHTML);
        });

        // Hide standalone choose buttons — clicking the card itself is the action
        const btnA = document.getElementById('btn-path-a');
        const btnB = document.getElementById('btn-path-b');
        btnA.style.display = 'none';
        btnB.style.display = 'none';

        // Handler for choosing Path A
        const choosePathA = () => {
            if (!canAffordA) {
                btnA.style.animation = 'none';
                btnA.offsetHeight;
                btnA.style.animation = 'shake 0.3s ease-out';
                Audio.play('click');
                return;
            }
            if (tower.upgrade('A')) {
                this._stopPathPreviewAnimations();
                modal.style.display = 'none';
                this.showTowerInfo(tower);
                this.updateSidebarCosts();
                Audio.play('upgrade');
            }
        };

        // Handler for choosing Path B
        const choosePathB = () => {
            if (!canAffordB) {
                btnB.style.animation = 'none';
                btnB.offsetHeight;
                btnB.style.animation = 'shake 0.3s ease-out';
                Audio.play('click');
                return;
            }
            if (tower.upgrade('B')) {
                this._stopPathPreviewAnimations();
                modal.style.display = 'none';
                this.showTowerInfo(tower);
                this.updateSidebarCosts();
                Audio.play('upgrade');
            }
        };

        // Bind buttons
        document.getElementById('btn-path-a').onclick = choosePathA;
        document.getElementById('btn-path-b').onclick = choosePathB;

        // Make entire card clickable
        const cardA = document.getElementById('path-a-card');
        const cardB = document.getElementById('path-b-card');
        cardA.onclick = choosePathA;
        cardB.onclick = choosePathB;

        // Add pointer cursor and cost badge to cards
        cardA.style.cursor = 'pointer';
        cardB.style.cursor = 'pointer';

        // Add clickable cost badge at bottom of each card
        const addCostBadge = (card, cost, canAfford) => {
            card.querySelectorAll('.path-card-cost-badge').forEach(el => el.remove());
            const badge = document.createElement('div');
            badge.className = 'path-card-cost-badge' + (canAfford ? '' : ' cant-afford');
            badge.innerHTML = canAfford
                ? `<span class="path-cost-text">CLICK TO CHOOSE \u2014 ${cost}g</span>`
                : `<span class="path-cost-text" style="color:#ff6060">NEED ${cost}g</span>`;
            card.appendChild(badge);
        };
        addCostBadge(cardA, pa3.cost, canAffordA);
        addCostBadge(cardB, pb3.cost, canAffordB);

        // Close modal button (click outside or escape)
        modal.onclick = (e) => {
            if (e.target === modal) {
                this._stopPathPreviewAnimations();
                modal.style.display = 'none';
            }
        };
    },

    hideTowerInfo() {
        document.getElementById('tower-info').style.display = 'none';
        GameState.selectedTower = null;
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

        // Next wave preview — positioned below any wave banner
        // Delay 3 seconds after wave complete so it doesn't overlap the "WAVE X COMPLETE" banner
        const previewReady = !WaveSystem.waveCompleteTimestamp ||
            (performance.now() - WaveSystem.waveCompleteTimestamp > 3000);
        this._lastNextWavePreviewBounds = null;
        if (GameState.gamePhase === 'idle' && GameState.wave < GameState.maxWave && previewReady) {
            const previewData = WaveSystem.getWavePreview(GameState.wave + 1);
            const preview = previewData ? (previewData.enemies || previewData) : null;
            if (preview && Array.isArray(preview) && preview.length > 0) {
                ctx.save();

                // Compute visible logical bounds in case the map is letterboxed/cropped by fill-scale.
                const viewLeft = typeof gridOffsetX !== 'undefined' && typeof renderScale !== 'undefined'
                    ? -gridOffsetX / renderScale
                    : 0;
                const viewTop = typeof gridOffsetY !== 'undefined' && typeof renderScale !== 'undefined'
                    ? -gridOffsetY / renderScale
                    : 0;
                const viewRight = typeof canvasWidth !== 'undefined' && typeof renderScale !== 'undefined'
                    ? viewLeft + canvasWidth / renderScale
                    : logicalWidth;

                // Header text
                let headerText = `NEXT: WAVE ${GameState.wave + 1}`;
                if (previewData.isBonus && previewData.bonusInfo) {
                    headerText = `BONUS: ${previewData.bonusInfo.name.toUpperCase()}`;
                } else if (previewData.hasModifier) {
                    headerText += ' \u26A0';
                }
                if (previewData.bossName) {
                    headerText = `BOSS AHEAD: ${previewData.bossName.toUpperCase()}`;
                } else if (previewData.scenario && previewData.scenario.name) {
                    headerText = `SCENARIO: ${previewData.scenario.name.toUpperCase()}`;
                } else if (previewData.faction && previewData.faction.name) {
                    headerText = `FACTION: ${previewData.faction.name.toUpperCase()}`;
                }

                // Calculate panel dimensions
                const colW = 90;
                const totalWidth = Math.max(preview.length * colW + 30, 220);
                const hasElite = previewData.eliteChance && previewData.eliteChance > 0.05;
                const threatTags = Array.isArray(previewData.threatTags) ? previewData.threatTags : [];
                const hasThreatTags = threatTags.length > 0;
                const objectiveLine = (previewData.isBonus && previewData.bonusInfo && previewData.bonusInfo.objectiveTitle)
                    ? `Objective: ${previewData.bonusInfo.objectiveTitle}`
                    : '';
                const hasObjectiveLine = !!objectiveLine;
                const showScouting = !!GameState.researchBonuses.scoutingReport;
                const basePanelH = showScouting
                    ? (hasElite ? 60 : 50)
                    : (hasElite ? 48 : 38);
                const panelH = basePanelH + (hasObjectiveLine ? 10 : 0) + (hasThreatTags ? 14 : 0);
                const minPanelX = viewLeft + 8;
                const maxPanelX = Math.max(minPanelX, viewRight - totalWidth - 8);
                const panelX = clamp((logicalWidth - totalWidth) / 2, minPanelX, maxPanelX);
                const previewY = Math.max(10, viewTop + 8);
                const panelCenterX = panelX + totalWidth / 2;

                this._lastNextWavePreviewBounds = {
                    x: panelX,
                    y: previewY,
                    width: totalWidth,
                    height: panelH,
                };

                // Background panel with rounded corners
                ctx.fillStyle = 'rgba(8,8,20,0.75)';
                this._roundRect(ctx, panelX, previewY, totalWidth, panelH, 6);
                ctx.fill();
                ctx.strokeStyle = 'rgba(60,60,120,0.4)';
                ctx.lineWidth = 1;
                this._roundRect(ctx, panelX, previewY, totalWidth, panelH, 6);
                ctx.stroke();

                // Header
                ctx.font = 'bold 10px "Orbitron"';
                ctx.textAlign = 'center';
                ctx.fillStyle = previewData.isBonus ? '#ffd700' : '#778';
                ctx.fillText(headerText, panelCenterX, previewY + 13);

                let infoLineY = previewY + 23;
                if (hasObjectiveLine) {
                    ctx.font = '8px "Share Tech Mono"';
                    ctx.textAlign = 'center';
                    ctx.fillStyle = '#ffe39a';
                    ctx.fillText(objectiveLine.toUpperCase(), panelCenterX, infoLineY);
                    infoLineY += 10;
                }

                if (hasThreatTags) {
                    const tagsText = threatTags.join('   ');
                    ctx.font = '8px "Share Tech Mono"';
                    ctx.textAlign = 'center';
                    ctx.fillStyle = '#9ba8c7';
                    ctx.fillText(tagsText, panelCenterX, infoLineY);
                }

                // Enemy groups — laid out horizontally
                let offsetX = panelX + Math.max(10, (totalWidth - preview.length * colW) / 2);
                ctx.font = '10px "Share Tech Mono"';
                const diffPreset = CONFIG.DIFFICULTY_PRESETS[GameState.settings.difficulty] || CONFIG.DIFFICULTY_PRESETS.normal;
                const groupsBaseY = previewY + 26 + (hasObjectiveLine ? 10 : 0) + (hasThreatTags ? 10 : 0);
                for (const group of preview) {
                    // Colored dot
                    ctx.fillStyle = group.color;
                    ctx.shadowColor = group.color;
                    ctx.shadowBlur = 4;
                    ctx.beginPath();
                    ctx.arc(offsetX + 6, groupsBaseY, 4, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                    // Text
                    ctx.fillStyle = '#bbb';
                    ctx.textAlign = 'left';
                    const label = `${group.count}x ${group.name}${group.isObjectiveTarget ? ' [TARGET]' : ''}`;
                    ctx.fillText(label, offsetX + 14, groupsBaseY + 3);

                    if (showScouting && group.type && ENEMIES[group.type]) {
                        const enemyDef = ENEMIES[group.type];
                        const hpScale = (previewData.difficultyScale?.hpMult || 1) * (group.hpMult || 1) * (diffPreset.enemyHpMult || 1);
                        const spdScale = (previewData.difficultyScale?.speedMult || 1) * (diffPreset.enemySpeedMult || 1);
                        const hp = Math.max(1, Math.round(enemyDef.hp * hpScale));
                        const spd = (enemyDef.speed * spdScale).toFixed(2);
                        ctx.font = '8px "Share Tech Mono"';
                        ctx.fillStyle = '#8ea0c2';
                        ctx.fillText(`HP ${hp} | SPD ${spd}`, offsetX + 14, groupsBaseY + 11);
                        ctx.font = '10px "Share Tech Mono"';
                    }
                    offsetX += colW;
                }

                // Elite chance on the same line, right-aligned inside the panel
                if (hasElite) {
                    ctx.font = '9px "Share Tech Mono"';
                    ctx.textAlign = 'center';
                    ctx.fillStyle = '#ffaa44';
                    ctx.fillText(`${Math.round(previewData.eliteChance * 100)}% elite chance`, panelCenterX, previewY + panelH - 3);
                }

                ctx.restore();
            }
        }

        // Placement preview (ghost tower + range circle)
        if (GameState.selectedTowerType && GameState.mouseX > 0) {
            this._drawPlacementPreview(ctx);
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
