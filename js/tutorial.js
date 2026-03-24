// ===== INTERACTIVE TUTORIAL SYSTEM =====
const Tutorial = {
    shown: false,
    active: false,
    currentStep: 0,
    overlay: null,
    tipQueue: [],
    shownTips: new Set(),
    contextualEnabled: true,

    // Tutorial steps for first-time players
    steps: [
        {
            id: 'welcome',
            title: 'Welcome to TowerForge!',
            text: 'Enemies march along the path. Build towers to defeat them before they reach the exit!',
            highlight: null,
            position: 'center',
        },
        {
            id: 'sidebar',
            title: 'Tower Selection',
            text: 'Click a tower type in the sidebar to select it, then click on the map to place it. Each tower has unique strengths!',
            highlight: '#tower-sidebar',
            position: 'left',
        },
        {
            id: 'placement',
            title: 'Placing Towers',
            text: 'Towers can only be placed on green buildable tiles. The path and decorations are blocked. Watch your gold!',
            highlight: '#game-canvas',
            position: 'center',
        },
        {
            id: 'waves',
            title: 'Starting Waves',
            text: 'Press SPACE or click the green button to start a wave of enemies. Defeat all enemies to complete the wave!',
            highlight: '#btn-start-wave',
            position: 'top',
        },
        {
            id: 'upgrading',
            title: 'Upgrading Towers',
            text: 'Click a placed tower to see its info. Upgrade it to increase damage, range, and unlock special abilities!',
            highlight: '#tower-info',
            position: 'right',
        },
        {
            id: 'paths',
            title: 'Dual Path System',
            text: 'At Tier 3, you choose between two upgrade paths. This choice is permanent! Path A focuses on single-target power, Path B on area/utility.',
            highlight: null,
            position: 'center',
        },
        {
            id: 'abilities',
            title: 'Player Abilities',
            text: 'Use Q, W, E, R, T for powerful abilities. Air Strike deals AOE damage, Reinforce adds lives, and more!',
            highlight: '#ability-bar',
            position: 'left',
        },
        {
            id: 'economy',
            title: 'Economy Tips',
            text: 'Between waves you earn interest on your gold (5%, max 50g). Saving gold early can pay off! Sell towers for 70% refund.',
            highlight: '#hud-gold',
            position: 'bottom',
        },
        {
            id: 'mastery',
            title: 'Tower Mastery',
            text: 'Towers that get many kills earn mastery bonuses — extra damage, range, and fire rate. Protect your veterans!',
            highlight: null,
            position: 'center',
        },
        {
            id: 'done',
            title: 'Ready to Defend!',
            text: 'Good luck, Commander! Remember: you can overclock towers with right-click for a burst of power, and check the Research Lab for permanent upgrades!',
            highlight: null,
            position: 'center',
        },
    ],

    // Contextual tips triggered during gameplay
    contextualTips: {
        firstTowerPlaced: {
            title: 'Tower Placed!',
            text: 'Great! Click your tower anytime to see its stats, change targeting, or upgrade it.',
            icon: '\u{1F3F0}',
        },
        firstUpgrade: {
            title: 'Tower Upgraded!',
            text: 'Nice upgrade! Keep leveling your towers. At Tier 3, you\'ll need to choose an upgrade path.',
            icon: '\u{2B06}',
        },
        firstPathChoice: {
            title: 'Path Decision Time!',
            text: 'Read both paths carefully. Path A usually focuses on single-target damage, Path B on area effects. This choice is permanent!',
            icon: '\u{1F500}',
        },
        lowGold: {
            title: 'Low on Gold',
            text: 'Consider selling a tower (70% refund) or waiting for interest between waves. Don\'t forget wave bonus gold!',
            icon: '\u{1F4B0}',
        },
        lowLives: {
            title: 'Lives Critical!',
            text: 'You\'re running low on lives! Focus towers near the exit, use abilities, or overclock key towers.',
            icon: '\u{2764}\uFE0F',
        },
        firstBossWave: {
            title: 'Boss Incoming!',
            text: 'Bosses have massive HP and are worth more gold. Focus fire with your strongest towers and use abilities!',
            icon: '\u{1F47E}',
        },
        firstSell: {
            title: 'Tower Sold',
            text: 'Selling returns 70% of total investment. Repositioning towers is a valid strategy!',
            icon: '\u{1F4B8}',
        },
        towerOverclock: {
            title: 'Overclock Active!',
            text: 'Overclocked tower fires 50% faster for 10 seconds, then cools down for 5 seconds. Use it during tough waves!',
            icon: '\u{26A1}',
        },
        waveComplete: {
            title: 'Wave Complete!',
            text: 'Well done! You earned interest on your gold. Upgrade or reposition before the next wave.',
            icon: '\u{2705}',
        },
        synergy: {
            title: 'Synergy Zone!',
            text: 'Three towers of the same type near each other create a synergy zone with area effects!',
            icon: '\u{1F300}',
        },
        maxTier: {
            title: 'Max Tier Reached!',
            text: 'This tower is fully upgraded! Its mastery will continue to grow with kills.',
            icon: '\u{2B50}',
        },
        firstAbility: {
            title: 'Ability Used!',
            text: 'Abilities have cooldowns shown on the ability bar. Plan when to use them for maximum impact!',
            icon: '\u{1F4A5}',
        },
    },

    // Check if tutorial should show on first play
    checkFirstPlay() {
        try {
            if (localStorage.getItem('towerforge_tutorial_shown')) {
                this.shown = true;
                return;
            }
            this.shown = false;
        } catch {
            this.shown = false;
        }

        // Load which contextual tips have been shown
        try {
            const shownData = localStorage.getItem('towerforge_tips_shown');
            if (shownData) {
                this.shownTips = new Set(JSON.parse(shownData));
            }
        } catch {}
    },

    markShown() {
        try {
            localStorage.setItem('towerforge_tutorial_shown', '1');
        } catch {}
        this.shown = true;
    },

    _saveShownTips() {
        try {
            localStorage.setItem('towerforge_tips_shown', JSON.stringify([...this.shownTips]));
        } catch {}
    },

    // Start the interactive tutorial
    startTutorial() {
        this.active = true;
        this.currentStep = 0;
        this._createOverlay();
        this._showStep(0);
    },

    // Stop and dismiss tutorial
    stopTutorial() {
        this.active = false;
        this.markShown();
        this._removeOverlay();
    },

    // Show a specific step
    _showStep(index) {
        if (index >= this.steps.length) {
            this.stopTutorial();
            return;
        }

        this.currentStep = index;
        const step = this.steps[index];

        // Update overlay content
        if (!this.overlay) this._createOverlay();

        const content = this.overlay.querySelector('.tutorial-content');
        content.innerHTML = `
            <div class="tutorial-step-indicator">
                ${this.steps.map((_, i) => `<span class="step-dot ${i === index ? 'active' : i < index ? 'done' : ''}"></span>`).join('')}
            </div>
            <h3 class="tutorial-title">${step.title}</h3>
            <p class="tutorial-text">${step.text}</p>
            <div class="tutorial-buttons">
                ${index > 0 ? '<button class="tutorial-btn tutorial-prev">Back</button>' : ''}
                ${index < this.steps.length - 1 ?
                    '<button class="tutorial-btn tutorial-next primary">Next</button>' :
                    '<button class="tutorial-btn tutorial-next primary">Got it!</button>'
                }
                <button class="tutorial-btn tutorial-skip">Skip Tutorial</button>
            </div>
        `;

        // Position based on step
        this._positionOverlay(step);

        // Bind buttons
        const nextBtn = content.querySelector('.tutorial-next');
        const prevBtn = content.querySelector('.tutorial-prev');
        const skipBtn = content.querySelector('.tutorial-skip');

        if (nextBtn) nextBtn.onclick = () => this._showStep(index + 1);
        if (prevBtn) prevBtn.onclick = () => this._showStep(index - 1);
        if (skipBtn) skipBtn.onclick = () => this.stopTutorial();

        // Highlight element
        this._highlightElement(step.highlight);
    },

    _createOverlay() {
        if (this.overlay) return;

        this.overlay = document.createElement('div');
        this.overlay.className = 'tutorial-overlay';
        this.overlay.innerHTML = `
            <div class="tutorial-backdrop"></div>
            <div class="tutorial-panel">
                <div class="tutorial-content"></div>
            </div>
        `;

        // Add styles
        const style = document.createElement('style');
        style.id = 'tutorial-styles';
        style.textContent = `
            .tutorial-overlay {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                z-index: 1000; pointer-events: none;
            }
            .tutorial-backdrop {
                position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.5); pointer-events: auto;
            }
            .tutorial-panel {
                position: absolute; z-index: 1001;
                background: linear-gradient(135deg, #1e1e40, #262650);
                border: 2px solid #5858cc;
                border-radius: 14px; padding: 24px;
                min-width: 360px; max-width: 450px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.6), 0 0 30px rgba(88,88,204,0.3);
                pointer-events: auto;
                animation: tutorialIn 0.3s ease-out;
            }
            @keyframes tutorialIn {
                from { transform: scale(0.9); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
            }
            .tutorial-step-indicator {
                display: flex; gap: 6px; justify-content: center; margin-bottom: 16px;
            }
            .step-dot {
                width: 8px; height: 8px; border-radius: 50%;
                background: rgba(255,255,255,0.15); transition: all 0.3s;
            }
            .step-dot.active { background: #f5cc50; transform: scale(1.3); }
            .step-dot.done { background: #50ff90; }
            .tutorial-title {
                font-family: 'Orbitron', sans-serif;
                font-size: 18px; font-weight: 700;
                color: #f5cc50; margin-bottom: 12px;
                letter-spacing: 1px;
            }
            .tutorial-text {
                font-size: 14px; color: #ccc;
                line-height: 1.6; margin-bottom: 20px;
            }
            .tutorial-buttons {
                display: flex; gap: 8px; justify-content: flex-end;
            }
            .tutorial-btn {
                font-family: 'Orbitron', sans-serif;
                font-size: 11px; font-weight: 600;
                padding: 8px 16px; border-radius: 6px;
                border: 1px solid #3a3a70; background: #262650;
                color: #aab; cursor: pointer; letter-spacing: 1px;
                transition: all 0.2s;
            }
            .tutorial-btn:hover { border-color: #5858cc; color: #fff; }
            .tutorial-btn.primary {
                background: linear-gradient(135deg, #3a3aa0, #5050cc);
                border-color: #6060dd; color: #fff;
            }
            .tutorial-btn.primary:hover {
                background: linear-gradient(135deg, #4a4abc, #6060dd);
            }
            .tutorial-skip { color: #666; border-color: #333; }
            .tutorial-highlight {
                position: fixed; z-index: 999;
                border: 3px solid #f5cc50;
                border-radius: 8px;
                box-shadow: 0 0 20px rgba(245,204,80,0.4);
                pointer-events: none;
                animation: highlightPulse 1.5s ease-in-out infinite;
            }
            @keyframes highlightPulse {
                0%, 100% { box-shadow: 0 0 20px rgba(245,204,80,0.4); }
                50% { box-shadow: 0 0 40px rgba(245,204,80,0.6); }
            }
            .contextual-tip {
                position: fixed; z-index: 200;
                background: linear-gradient(135deg, #1e1e40, #262650);
                border: 1px solid #5858cc;
                border-radius: 10px; padding: 14px 18px;
                max-width: 320px;
                box-shadow: 0 12px 40px rgba(0,0,0,0.5);
                animation: tipSlideIn 0.3s ease-out;
                pointer-events: auto;
            }
            @keyframes tipSlideIn {
                from { transform: translateY(10px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            .contextual-tip .tip-header {
                display: flex; align-items: center; gap: 8px; margin-bottom: 8px;
            }
            .contextual-tip .tip-icon { font-size: 22px; }
            .contextual-tip .tip-title {
                font-family: 'Orbitron', sans-serif;
                font-size: 13px; font-weight: 600; color: #f5cc50;
            }
            .contextual-tip .tip-text {
                font-size: 12px; color: #bbb; line-height: 1.5;
            }
            .contextual-tip .tip-dismiss {
                display: block; margin-top: 10px; text-align: right;
                font-size: 10px; color: #666; cursor: pointer;
                font-family: 'Share Tech Mono', monospace;
            }
            .contextual-tip .tip-dismiss:hover { color: #aaa; }
        `;

        if (!document.getElementById('tutorial-styles')) {
            document.head.appendChild(style);
        }
        document.body.appendChild(this.overlay);
    },

    _removeOverlay() {
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
        // Remove any highlights
        document.querySelectorAll('.tutorial-highlight').forEach(el => el.remove());
    },

    _positionOverlay(step) {
        const panel = this.overlay.querySelector('.tutorial-panel');
        if (!panel) return;

        switch (step.position) {
            case 'center':
                panel.style.left = '50%';
                panel.style.top = '50%';
                panel.style.transform = 'translate(-50%, -50%)';
                break;
            case 'left':
                panel.style.left = '20px';
                panel.style.top = '50%';
                panel.style.transform = 'translateY(-50%)';
                break;
            case 'right':
                panel.style.right = '240px';
                panel.style.top = '50%';
                panel.style.transform = 'translateY(-50%)';
                panel.style.left = 'auto';
                break;
            case 'top':
                panel.style.left = '50%';
                panel.style.top = '100px';
                panel.style.transform = 'translateX(-50%)';
                break;
            case 'bottom':
                panel.style.left = '50%';
                panel.style.bottom = '100px';
                panel.style.top = 'auto';
                panel.style.transform = 'translateX(-50%)';
                break;
        }
    },

    _highlightElement(selector) {
        // Remove old highlights
        document.querySelectorAll('.tutorial-highlight').forEach(el => el.remove());

        if (!selector) return;

        const target = document.querySelector(selector);
        if (!target) return;

        const rect = target.getBoundingClientRect();
        const highlight = document.createElement('div');
        highlight.className = 'tutorial-highlight';
        highlight.style.left = (rect.left - 4) + 'px';
        highlight.style.top = (rect.top - 4) + 'px';
        highlight.style.width = (rect.width + 8) + 'px';
        highlight.style.height = (rect.height + 8) + 'px';
        document.body.appendChild(highlight);
    },

    // === CONTEXTUAL TIPS SYSTEM ===

    // Trigger a contextual tip by key
    showContextualTip(key) {
        if (!this.contextualEnabled) return;
        if (this.shownTips.has(key)) return;
        if (this.active) return; // Don't show during tutorial

        const tipData = this.contextualTips[key];
        if (!tipData) return;

        this.shownTips.add(key);
        this._saveShownTips();

        this._displayContextualTip(tipData);
    },

    _displayContextualTip(tipData) {
        // Remove any existing tip
        document.querySelectorAll('.contextual-tip').forEach(el => el.remove());

        const tip = document.createElement('div');
        tip.className = 'contextual-tip';
        tip.innerHTML = `
            <div class="tip-header">
                <span class="tip-icon">${tipData.icon}</span>
                <span class="tip-title">${tipData.title}</span>
            </div>
            <div class="tip-text">${tipData.text}</div>
            <span class="tip-dismiss">Click to dismiss</span>
        `;

        // Position in bottom-left, above tower info panel
        tip.style.left = '20px';
        tip.style.bottom = '360px';

        tip.querySelector('.tip-dismiss').onclick = () => tip.remove();

        document.body.appendChild(tip);

        // Auto-dismiss after 8 seconds
        setTimeout(() => {
            if (tip.parentNode) {
                tip.style.opacity = '0';
                tip.style.transition = 'opacity 0.5s';
                setTimeout(() => tip.remove(), 500);
            }
        }, 8000);
    },

    // Integration points — call these from other systems
    onTowerPlaced() {
        this.showContextualTip('firstTowerPlaced');
    },

    onTowerUpgraded(tower) {
        if (tower.tier === 2) {
            this.showContextualTip('firstUpgrade');
        }
        if (tower.tier >= 5) {
            this.showContextualTip('maxTier');
        }
    },

    onPathChoice() {
        this.showContextualTip('firstPathChoice');
    },

    onTowerSold() {
        this.showContextualTip('firstSell');
    },

    onOverclock() {
        this.showContextualTip('towerOverclock');
    },

    onAbilityUsed() {
        this.showContextualTip('firstAbility');
    },

    onWaveComplete() {
        if (GameState.wave <= 3) {
            this.showContextualTip('waveComplete');
        }
    },

    onBossWave() {
        this.showContextualTip('firstBossWave');
    },

    onSynergyCreated() {
        this.showContextualTip('synergy');
    },

    // Check game state for contextual tips
    checkGameState() {
        if (GameState.gold < 30 && GameState.towers.length > 0) {
            this.showContextualTip('lowGold');
        }
        if (GameState.lives <= 5 && GameState.lives > 0) {
            this.showContextualTip('lowLives');
        }
    },

    // Reset tips (for testing)
    resetTips() {
        this.shownTips.clear();
        this._saveShownTips();
        try { localStorage.removeItem('towerforge_tutorial_shown'); } catch {}
        this.shown = false;
    },
};
