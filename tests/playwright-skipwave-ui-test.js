const path = require('path');
const { chromium } = require('playwright');

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

async function run() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });

    const fileUrl = `file:///${path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/')}`;
    const targetUrl = process.env.BASE_URL || fileUrl;
    await page.goto(targetUrl);

    await page.waitForFunction(() => typeof startGame === 'function' && typeof WaveSystem !== 'undefined');

    const pathShapeCheck = await page.evaluate(() => {
        MenuSystem.showScreen('game');
        startGame(0);

        const ts = CONFIG.TILE_SIZE;
        const path = GameState.detailedPath || [];
        const wp = MAPS[0].waypoints.map(([c, r]) => gridToWorld(c, r));
        const start = wp[0];
        const firstCorner = wp[1];
        const secondCorner = wp[2];

        let maxEarlyDeviation = 0;
        for (const pt of path) {
            if (pt.x > start.x + ts && pt.x < firstCorner.x - ts * 0.8) {
                maxEarlyDeviation = Math.max(maxEarlyDeviation, Math.abs(pt.y - start.y));
            }
        }

        let maxVerticalDeviation = 0;
        for (const pt of path) {
            if (
                pt.y < firstCorner.y - ts &&
                pt.y > secondCorner.y + ts * 0.8 &&
                Math.abs(pt.x - firstCorner.x) < ts * 1.5
            ) {
                maxVerticalDeviation = Math.max(maxVerticalDeviation, Math.abs(pt.x - firstCorner.x));
            }
        }

        return {
            maxEarlyDeviation,
            maxVerticalDeviation,
        };
    });
    assert(pathShapeCheck.maxEarlyDeviation <= 1.5, `Path should stay straight before first corner (deviation=${pathShapeCheck.maxEarlyDeviation.toFixed(2)})`);
    assert(pathShapeCheck.maxVerticalDeviation <= 1.5, `Path should stay straight between corners (deviation=${pathShapeCheck.maxVerticalDeviation.toFixed(2)})`);

    const saveFidelity = await page.evaluate(() => {
        startGame(0);
        GameState.settings.difficulty = 'hard';
        GameState.activeChallenges = ['half_gold', 'speed_run'];
        WaveSystem.endlessMode = true;
        GameState.wave = 12;
        GameState.time = 495;

        const tower = new Tower('arrow', 286, 318);
        tower.path = 'B';
        tower.tier = 4;
        tower._applyTierStats();
        tower.kills = 23;
        tower.masteryLevel = 2;
        tower.xp = 37;
        tower.xpLevel = 3;
        tower.xpToNextLevel = 180;
        tower.xpBonusDmg = 0.03;
        tower.xpBonusRate = 0.015;
        tower.xpBonusRange = 0.009;
        tower.targetMode = 'strongest';
        tower.beamRamp = 0.21;
        tower.stats.totalDamageDealt = 2222;
        GameState.towers = [tower];

        SaveSystem.autoSave();
        const infoBefore = SaveSystem.getSavedGameInfo();
        const loaded = SaveSystem.loadGame();
        const restored = GameState.towers[0];

        return {
            loaded,
            infoBefore,
            towerCount: GameState.towers.length,
            restored: restored ? {
                x: restored.x,
                y: restored.y,
                tier: restored.tier,
                path: restored.path,
                kills: restored.kills,
                masteryLevel: restored.masteryLevel,
                xp: restored.xp,
                xpLevel: restored.xpLevel,
                xpToNextLevel: restored.xpToNextLevel,
                targetMode: restored.targetMode,
                damageStat: restored.stats.totalDamageDealt,
            } : null,
            restoredDiff: GameState.settings.difficulty,
            restoredEndless: WaveSystem.endlessMode,
            restoredChallenges: [...GameState.activeChallenges],
        };
    });

    assert(saveFidelity.loaded, 'SaveSystem.loadGame should succeed for active run restore');
    assert(saveFidelity.towerCount === 1, `Expected 1 restored tower, got ${saveFidelity.towerCount}`);
    assert(!!saveFidelity.restored, 'Restored tower data missing');
    assert(saveFidelity.restored.tier === 4, `Tower tier restore mismatch: ${saveFidelity.restored.tier}`);
    assert(saveFidelity.restored.path === 'B', `Tower path restore mismatch: ${saveFidelity.restored.path}`);
    assert(saveFidelity.restored.targetMode === 'strongest', `Tower targeting restore mismatch: ${saveFidelity.restored.targetMode}`);
    assert(Math.abs(saveFidelity.restored.x - 286) <= 1, `Tower X restore drifted: ${saveFidelity.restored.x}`);
    assert(Math.abs(saveFidelity.restored.y - 318) <= 1, `Tower Y restore drifted: ${saveFidelity.restored.y}`);
    assert(saveFidelity.restored.xpLevel === 3, `Tower XP level restore mismatch: ${saveFidelity.restored.xpLevel}`);
    assert(saveFidelity.restoredDiff === 'hard', `Difficulty restore mismatch: ${saveFidelity.restoredDiff}`);
    assert(saveFidelity.restoredEndless === true, 'Endless mode restore mismatch');
    assert(saveFidelity.restoredChallenges.length === 2, `Challenge restore mismatch: ${saveFidelity.restoredChallenges}`);

    await page.evaluate(() => {
        MenuSystem.showScreen('menu');
        MenuSystem._updateContinueButton();
    });

    const continueText = await page.locator('#btn-continue').innerText();
    assert(!/unknown/i.test(continueText), `Continue button should not show Unknown (got: ${continueText})`);
    assert(/hard/i.test(continueText), `Continue button should show difficulty (got: ${continueText})`);
    assert(/endless/i.test(continueText), `Continue button should show mode (got: ${continueText})`);

    const menuProgressPanel = await page.evaluate(() => {
        GameState.metaProgress = {
            endlessBestDepthByMap: [3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 12, 0, 0, 0, 0, 6, 0, 0, 0, 0],
            endlessMilestonesClaimed: { '0': [5], '10': [5, 10] },
            totalEndlessMilestones: 3,
            challengeWinStreak: 2,
            bestChallengeWinStreak: 4,
            totalChallengeVictories: 5,
        };
        MenuSystem._updateMetaProgressPanel();
        const panel = document.getElementById('menu-meta-progress');
        return {
            exists: !!panel,
            text: panel ? panel.textContent : '',
        };
    });
    assert(menuProgressPanel.exists, 'Menu meta progress panel should exist');
    assert(/Best Endless Depth/i.test(menuProgressPanel.text), 'Menu panel should show endless depth summary');
    assert(/Challenge Streak/i.test(menuProgressPanel.text), 'Menu panel should show challenge streak summary');

    await page.evaluate(() => {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById('research-screen').classList.add('active');
        ResearchSystem.init();
    });

    await page.waitForFunction(() => document.querySelectorAll('.research-node').length > 0);

    const researchOverlap = await page.evaluate(() => {
        const nodes = [...document.querySelectorAll('.research-node')].map(el => {
            const r = el.getBoundingClientRect();
            return {
                id: el.dataset.nodeId || '',
                left: r.left,
                top: r.top,
                right: r.right,
                bottom: r.bottom,
            };
        });

        let overlaps = 0;
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const a = nodes[i];
                const b = nodes[j];
                const x = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
                const y = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
                if (x > 1 && y > 1) overlaps++;
            }
        }

        return { nodeCount: nodes.length, overlaps };
    });
    assert(
        researchOverlap.overlaps === 0,
        `Research upgrades overlap detected (${researchOverlap.overlaps} intersections across ${researchOverlap.nodeCount} nodes)`
    );

    const researchLabelAlignment = await page.evaluate(() => {
        const off = document.querySelector('.research-branch-label.branch-offense');
        const def = document.querySelector('.research-branch-label.branch-defense');
        const eco = document.querySelector('.research-branch-label.branch-economy');
        const knw = document.querySelector('.research-branch-label.branch-knowledge');
        if (!off || !def || !eco || !knw) return { ok: false };

        const ro = off.getBoundingClientRect();
        const rd = def.getBoundingClientRect();
        const re = eco.getBoundingClientRect();
        const rk = knw.getBoundingClientRect();

        const labels = [ro, rd, re, rk];
        const nodes = [...document.querySelectorAll('.research-node')].map(el => el.getBoundingClientRect());

        let overlaps = 0;
        for (const l of labels) {
            for (const n of nodes) {
                const x = Math.max(0, Math.min(l.right, n.right) - Math.max(l.left, n.left));
                const y = Math.max(0, Math.min(l.bottom, n.bottom) - Math.max(l.top, n.top));
                if (x > 1 && y > 1) overlaps++;
            }
        }

        return {
            ok: true,
            overlaps,
            minSeparationToNodes: Math.min(
                ...labels.map(l => {
                    let minD = Infinity;
                    for (const n of nodes) {
                        const dx = Math.max(n.left - l.right, l.left - n.right, 0);
                        const dy = Math.max(n.top - l.bottom, l.top - n.bottom, 0);
                        const d = Math.hypot(dx, dy);
                        minD = Math.min(minD, d);
                    }
                    return minD;
                })
            ),
        };
    });
    assert(researchLabelAlignment.ok, 'Research branch labels not found for alignment check');
    assert(researchLabelAlignment.overlaps === 0, `Research branch labels overlap nodes (${researchLabelAlignment.overlaps} overlaps)`);
    assert(researchLabelAlignment.minSeparationToNodes >= 4, `Research branch labels too close to nodes (min separation ${researchLabelAlignment.minSeparationToNodes.toFixed(2)}px)`);

    await page.evaluate(() => {
        const screens = document.querySelectorAll('.screen');
        for (const s of screens) s.classList.remove('active');
        document.getElementById('game-screen').classList.add('active');
        startGame(0);
        GameState.settings.autoStart = false;
        if (WaveSystem.cancelCountdown) WaveSystem.cancelCountdown();
        GameState.gamePhase = 'idle';
        const startBtn = document.getElementById('btn-start-wave');
        const skipBtn = document.getElementById('btn-skip-wave');
        if (startBtn) startBtn.classList.remove('hidden');
        if (skipBtn) skipBtn.style.display = 'none';
    });

    await page.waitForFunction(() => {
        const btn = document.getElementById('btn-start-wave');
        return !!btn && getComputedStyle(btn).display !== 'none';
    });

    const abilityBarState = await page.evaluate(() => {
        const bar = document.getElementById('ability-bar');
        const title = [...document.querySelectorAll('.sidebar-title')].find(el => el.textContent.trim() === 'ABILITIES');
        return {
            barVisible: !!bar && getComputedStyle(bar).display !== 'none',
            titleVisible: !!title && getComputedStyle(title).display !== 'none',
            buttonCount: bar ? bar.querySelectorAll('.ability-btn').length : 0,
        };
    });
    assert(abilityBarState.barVisible, 'Ability bar should be visible in sidebar');
    assert(abilityBarState.titleVisible, 'Ability title should be visible in sidebar');
    assert(abilityBarState.buttonCount === 5, `Expected 5 ability buttons, got ${abilityBarState.buttonCount}`);

    const pathPreviewRotationCheck = await page.evaluate(async () => {
        // Open path choice with a tier-2 tower
        const t = new Tower('arrow', 260, 260);
        t.tier = 2;
        t._applyTierStats();
        GameState.gold = 99999;
        UIRenderer.showPathChoice(t);

        const canvas = document.querySelector('.path-tower-preview canvas');
        if (!canvas) return { ok: false };

        const ctx = canvas.getContext('2d');
        const sample = () => {
            const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
            let sum = 0;
            for (let i = 0; i < d.length; i += 16) sum += d[i] + d[i + 1] + d[i + 2];
            return sum;
        };

        const a = sample();
        await new Promise(r => setTimeout(r, 140));
        const b = sample();

        const runningAnim = Array.isArray(UIRenderer._pathPreviewAnimIds) && UIRenderer._pathPreviewAnimIds.length > 0;

        if (UIRenderer._stopPathPreviewAnimations) UIRenderer._stopPathPreviewAnimations();
        const modal = document.getElementById('path-choice-modal');
        if (modal) modal.style.display = 'none';

        return {
            ok: true,
            changed: a !== b,
            runningAnim,
        };
    });
    assert(pathPreviewRotationCheck.ok, 'Path preview modal should render tower model canvases');
    assert(pathPreviewRotationCheck.runningAnim, 'Path preview animation loop should be active');
    assert(pathPreviewRotationCheck.changed, 'Tower model preview should animate/rotate toward target');

    const hudThreatState = await page.evaluate(() => {
        GameState.wave = 7;
        UIRenderer.lastWave = -1;
        UIRenderer.lastThreatHint = null;
        UIRenderer.updateHUD();
        const el = document.getElementById('hud-threat-val');
        const preview = WaveSystem.getWavePreview(8);
        if (!el) return { exists: false, text: '' };
        return {
            exists: true,
            text: el.textContent || '',
            hasScenario: !!(preview && preview.scenario && preview.scenario.name),
            hasScenarioTag: !!(preview && Array.isArray(preview.threatTags) && preview.threatTags.length > 0),
            hasMapPressure: !!(preview && preview.mapPressure && preview.mapPressure.name),
        };
    });
    assert(hudThreatState.exists, 'HUD threat hint element is missing');
    assert(hudThreatState.text.length > 0, 'HUD threat hint should show next-wave warning text');
    assert(hudThreatState.hasScenario, 'Wave preview should include scenario metadata on scenario waves');
    assert(hudThreatState.hasScenarioTag, 'Wave preview should include scenario/encounter threat tags');
    assert(hudThreatState.hasMapPressure, 'Wave preview should include map pressure metadata');

    const startButtonAlignment = await page.evaluate(() => {
        const btn = document.getElementById('btn-start-wave');
        const root = getComputedStyle(document.documentElement);
        const sidebarW = parseFloat(root.getPropertyValue('--sidebar-w')) || 220;
        const expectedCenterX = (window.innerWidth - sidebarW) / 2;
        const rect = btn.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const styles = getComputedStyle(btn);
        return {
            centerX,
            expectedCenterX,
            delta: Math.abs(centerX - expectedCenterX),
            visible: styles.display !== 'none' && styles.visibility !== 'hidden' && parseFloat(styles.opacity || '1') > 0,
        };
    });

    assert(startButtonAlignment.visible, 'Start wave button is not visible in idle state');
    assert(
        startButtonAlignment.delta <= 2,
        `Start wave button misaligned by ${startButtonAlignment.delta.toFixed(2)}px`
    );

    await page.waitForFunction(() => {
        return !!(UIRenderer && UIRenderer._lastNextWavePreviewBounds);
    });

    const previewBoundsCheck = await page.evaluate(() => {
        const b = UIRenderer._lastNextWavePreviewBounds;
        const viewTop = (typeof gridOffsetY !== 'undefined' && typeof renderScale !== 'undefined')
            ? -gridOffsetY / renderScale
            : 0;
        return {
            y: b ? b.y : -1,
            h: b ? b.height : -1,
            minY: viewTop + 6,
        };
    });
    assert(
        previewBoundsCheck.y >= previewBoundsCheck.minY,
        `Next wave preview is vertically clipped (y=${previewBoundsCheck.y.toFixed(2)}, min=${previewBoundsCheck.minY.toFixed(2)})`
    );

    const scoutingPreviewCheck = await page.evaluate(async () => {
        GameState.researchBonuses.scoutingReport = false;
        await new Promise(resolve => requestAnimationFrame(() => resolve()));
        const noScoutH = UIRenderer._lastNextWavePreviewBounds ? UIRenderer._lastNextWavePreviewBounds.height : 0;

        GameState.researchBonuses.scoutingReport = true;
        await new Promise(resolve => requestAnimationFrame(() => resolve()));
        const scoutH = UIRenderer._lastNextWavePreviewBounds ? UIRenderer._lastNextWavePreviewBounds.height : 0;

        return { noScoutH, scoutH };
    });
    assert(
        scoutingPreviewCheck.scoutH > scoutingPreviewCheck.noScoutH,
        `Scouting preview should show expanded info panel (base=${scoutingPreviewCheck.noScoutH}, scouting=${scoutingPreviewCheck.scoutH})`
    );

    const researchMechanicsCheck = await page.evaluate(() => {
        const originalBonuses = { ...GameState.researchBonuses };

        // Last Stand + Invulnerability window
        GameState.researchBonuses = { ...originalBonuses, lastStand: true, invulnWindow: 10 };
        GameState.lastStandTimer = 0;
        GameState.invulnTimer = 0;
        GameState.lives = 6;
        handleEnemyLeak({ isBoss: false, type: 'test' });
        const afterFirstLeakLives = GameState.lives;
        const lastStandTriggered = GameState.lastStandTimer > 0;
        const invulnStarted = GameState.invulnTimer > 0;
        handleEnemyLeak({ isBoss: false, type: 'test' });
        const secondLeakBlocked = GameState.lives === afterFirstLeakLives;

        // Frost Armor + Kill Gold Bonus
        GameState.researchBonuses = { ...originalBonuses, frostArmor: true, killGoldBonus: 0.5 };
        const t = new Tower('arrow', 240, 260);
        t.kills = 120;
        const e = new Enemy('basic');
        const baseReward = e.reward;
        const goldBefore = GameState.gold;
        e.takeDamage(9999, t);
        const rewardAwarded = GameState.gold - goldBefore;
        const frostApplied = e.slow > 0;
        const bonusApplied = rewardAwarded > baseReward;

        // Ultimate cooldown reduction
        GameState.researchBonuses = { ...originalBonuses, ultimateCdr: 0.25 };
        const ultTower = new Tower('arrow', 320, 320);
        ultTower.path = 'B';
        ultTower.tier = 5;
        ultTower._applyTierStats();
        const baseCd = ultTower.special.volleyCd || 0;
        const used = ultTower.useAbility();
        const cooldownReduced = used && baseCd > 0 && ultTower.abilityCooldown < baseCd;

        GameState.researchBonuses = originalBonuses;

        return {
            lastStandTriggered,
            invulnStarted,
            secondLeakBlocked,
            frostApplied,
            bonusApplied,
            cooldownReduced,
        };
    });
    assert(researchMechanicsCheck.lastStandTriggered, 'Last Stand should trigger at critical lives');
    assert(researchMechanicsCheck.invulnStarted, 'Invulnerability window should start after leak');
    assert(researchMechanicsCheck.secondLeakBlocked, 'Invulnerability window should block subsequent leak damage');
    assert(researchMechanicsCheck.frostApplied, 'Frost Armor should apply slow from tower hits');
    assert(researchMechanicsCheck.bonusApplied, 'Kill Gold Bonus should increase reward for veteran tower kills');
    assert(researchMechanicsCheck.cooldownReduced, 'Ultimate Calibration should reduce Tier 5 ability cooldown');

    const bossDepthCheck = await page.evaluate(() => {
        const originalMap = GameState.mapIndex;
        const names = [];
        const groups = [0, 5, 10, 15];
        for (const mapIdx of groups) {
            GameState.mapIndex = mapIdx;
            const p = WaveSystem._getBossProfileForWave(10);
            names.push(p.name);
        }
        GameState.mapIndex = originalMap;

        const uniqueNames = new Set(names);

        const preview = WaveSystem.getWavePreview(10);
        const hasBossPreviewName = !!(preview && preview.bossName);

        const boss = new Enemy('boss', 1);
        GameState.mapIndex = 15;
        boss.setBossProfile(WaveSystem._getBossProfileForWave(10));
        boss.bossAbilityCooldown = 0;
        boss._updateBossAbilities(0.016);
        const castStarted = boss.bossCastTimer > 0 && !!boss.bossPendingAbility && !!boss.bossCastLabel;
        boss._updateBossAbilities(10);
        const abilityResolved = boss.bossPendingAbility === null;

        GameState.mapIndex = originalMap;

        return {
            uniqueBosses: uniqueNames.size,
            hasBossPreviewName,
            castStarted,
            abilityResolved,
        };
    });
    assert(bossDepthCheck.uniqueBosses >= 4, `Expected 4 boss archetypes across difficulties, got ${bossDepthCheck.uniqueBosses}`);
    assert(bossDepthCheck.hasBossPreviewName, 'Boss wave preview should include boss name');
    assert(bossDepthCheck.castStarted, 'Boss ability should enter cast/telegraph state');
    assert(bossDepthCheck.abilityResolved, 'Boss ability should resolve after cast timer elapses');

    const phase4EnemyPackCheck = await page.evaluate(() => {
        const hardWaves = generateWaves(10, 14);
        const wave6 = hardWaves[5] || { enemies: [] };
        const wave9 = hardWaves[8] || { enemies: [] };
        const hasDisruptorInPreview = !!wave6.enemies.find(e => e.type === 'disruptor');
        const hasToxicInPreview = !!wave9.enemies.find(e => e.type === 'toxic');

        const startPt = (GameState.detailedPath && GameState.detailedPath[0]) || { x: 40, y: 360 };
        const tower = new Tower('arrow', startPt.x + 24, startPt.y);
        GameState.towers.push(tower);
        const disruptor = new Enemy('disruptor', 1);
        disruptor.x = disruptor.renderX = startPt.x;
        disruptor.y = disruptor.renderY = startPt.y;
        disruptor.disruptCooldown = 0;
        disruptor.update(0.016);
        const castTelegraph = disruptor.disruptCastTimer > 0;
        disruptor.update(1.0);
        const applied = tower.disabled && tower.disabledTimer > 0;

        const toxic = new Enemy('toxic', 1);
        toxic.x = toxic.renderX = startPt.x;
        toxic.y = toxic.renderY = startPt.y;
        toxic.toxicCooldown = 0;
        const baseTowerDamage = tower.getEffectiveDamage();
        toxic.update(0.016);
        const toxicTelegraph = toxic.toxicCastTimer > 0;
        toxic.update(1.0);
        const toxicApplied = tower.damageDebuffTimer > 0 && tower.damageDebuffMult < 1;
        const debuffedTowerDamage = tower.getEffectiveDamage();

        GameState.towers = GameState.towers.filter(t => t !== tower);

        return {
            hasDisruptorInPreview,
            hasToxicInPreview,
            castTelegraph,
            applied,
            toxicTelegraph,
            toxicApplied,
            damageReduced: debuffedTowerDamage < baseTowerDamage,
        };
    });
    assert(phase4EnemyPackCheck.hasDisruptorInPreview, 'Phase 4 disruptor should appear in hard-wave preview');
    assert(phase4EnemyPackCheck.hasToxicInPreview, 'Phase 4 toxic carrier should appear in hard-wave preview');
    assert(phase4EnemyPackCheck.castTelegraph, 'Disruptor should telegraph EMP pulse before cast');
    assert(phase4EnemyPackCheck.applied, 'Disruptor EMP should disable nearby tower');
    assert(phase4EnemyPackCheck.toxicTelegraph, 'Toxic carrier should telegraph toxic pulse before cast');
    assert(phase4EnemyPackCheck.toxicApplied, 'Toxic carrier pulse should apply tower damage debuff');
    assert(phase4EnemyPackCheck.damageReduced, 'Tower effective damage should be reduced by toxic debuff');

    const enemyTelegraphCheck = await page.evaluate(() => {
        const healer = new Enemy('healer', 1);
        const ally = new Enemy('basic', 1);
        healer.x = healer.renderX = 300;
        healer.y = healer.renderY = 300;
        healer.frozen = true;
        ally.x = ally.renderX = 320;
        ally.y = ally.renderY = 300;
        ally.hp = Math.max(1, ally.maxHp - 20);
        GameState.enemies.push(healer, ally);
        GameState.enemiesAlive += 2;

        healer.healCooldown = 0;
        healer.update(0.016);
        const healerTelegraph = healer.healCastTimer > 0;
        const hpBeforeHeal = ally.hp;
        healer.update(2.0);
        const healerApplied = ally.hp > hpBeforeHeal;

        const shielder = new Enemy('shield', 1);
        const ally2 = new Enemy('basic', 1);
        shielder.x = shielder.renderX = 400;
        shielder.y = shielder.renderY = 300;
        shielder.frozen = true;
        ally2.x = ally2.renderX = 430;
        ally2.y = ally2.renderY = 300;
        ally2.shielded = false;
        GameState.enemies.push(shielder, ally2);
        GameState.enemiesAlive += 2;

        shielder.shieldAuraCooldown = 0;
        shielder.update(0.016);
        const shieldTelegraph = shielder.shieldAuraCastTimer > 0;
        shielder.update(2.0);
        const shieldApplied = ally2.shielded && ally2.shieldHp > 0;

        const stealth = new Enemy('stealth', 1);
        stealth.x = stealth.renderX = 500;
        stealth.y = stealth.renderY = 300;
        stealth.stealthCooldown = 0;
        stealth.invisible = false;
        stealth.update(0.016);
        const stealthTelegraph = stealth.stealthPrepTimer > 0;
        stealth.update(1.0);
        const stealthPhased = stealth.invisible;

        GameState.enemies = GameState.enemies.filter(e => ![healer, ally, shielder, ally2, stealth].includes(e));
        GameState.enemiesAlive = Math.max(0, GameState.enemiesAlive - 5);

        return {
            healerTelegraph,
            healerApplied,
            shieldTelegraph,
            shieldApplied,
            stealthTelegraph,
            stealthPhased,
        };
    });
    assert(enemyTelegraphCheck.healerTelegraph, 'Healer should telegraph before healing pulse');
    assert(enemyTelegraphCheck.healerApplied, 'Healer pulse should heal nearby allies');
    assert(enemyTelegraphCheck.shieldTelegraph, 'Shield enemy should telegraph before aura pulse');
    assert(enemyTelegraphCheck.shieldApplied, 'Shield aura pulse should apply shields to allies');
    assert(enemyTelegraphCheck.stealthTelegraph, 'Stealth enemy should telegraph before phasing');
    assert(enemyTelegraphCheck.stealthPhased, 'Stealth enemy should phase after telegraph');

    const phase3ProgressionCheck = await page.evaluate(() => {
        if (!GameState.metaProgress || typeof GameState.metaProgress !== 'object') {
            GameState.metaProgress = {
                endlessBestDepthByMap: new Array(20).fill(0),
                endlessMilestonesClaimed: {},
                totalEndlessMilestones: 0,
                challengeWinStreak: 0,
                bestChallengeWinStreak: 0,
                totalChallengeVictories: 0,
            };
        }

        GameState.mapIndex = 0;
        GameState.maxWave = 30;
        WaveSystem.endlessMode = true;
        GameState.wave = 40; // depth +10
        GameState.researchPoints = 0;
        GameState.gold = 0;
        GameState.metaProgress.endlessBestDepthByMap = new Array(20).fill(0);
        GameState.metaProgress.endlessMilestonesClaimed = {};
        GameState.metaProgress.totalEndlessMilestones = 0;

        WaveSystem._updateEndlessRecords();
        WaveSystem._processEndlessMilestones();

        const bestDepth = GameState.metaProgress.endlessBestDepthByMap[0] || 0;
        const claimed = GameState.metaProgress.endlessMilestonesClaimed['0'] || [];

        const rpAfterFirst = GameState.researchPoints;
        const goldAfterFirst = GameState.gold;

        WaveSystem._processEndlessMilestones();

        return {
            bestDepth,
            claimedCount: claimed.length,
            rpAfterFirst,
            goldAfterFirst,
            rpAfterSecond: GameState.researchPoints,
            goldAfterSecond: GameState.gold,
            totalMilestones: GameState.metaProgress.totalEndlessMilestones,
            persistedMeta: (() => {
                SaveSystem.savePersistent();
                const raw = localStorage.getItem(SaveSystem.PERSIST_KEY);
                if (!raw) return false;
                const parsed = SaveSystem._validateAndParse(raw);
                return !!(parsed && parsed.metaProgress && Array.isArray(parsed.metaProgress.endlessBestDepthByMap));
            })(),
        };
    });
    assert(phase3ProgressionCheck.bestDepth >= 10, `Endless best depth record should update (got ${phase3ProgressionCheck.bestDepth})`);
    assert(phase3ProgressionCheck.claimedCount >= 2, `Expected multiple endless milestones claimed at depth 10 (got ${phase3ProgressionCheck.claimedCount})`);
    assert(phase3ProgressionCheck.rpAfterFirst > 0, 'Endless milestones should grant RP');
    assert(phase3ProgressionCheck.goldAfterFirst > 0, 'Endless milestones should grant gold');
    assert(phase3ProgressionCheck.rpAfterSecond === phase3ProgressionCheck.rpAfterFirst, 'Endless milestone rewards should not duplicate on re-check');
    assert(phase3ProgressionCheck.goldAfterSecond === phase3ProgressionCheck.goldAfterFirst, 'Endless milestone gold should not duplicate on re-check');
    assert(phase3ProgressionCheck.totalMilestones >= 2, 'Endless milestone counter should increment');
    assert(phase3ProgressionCheck.persistedMeta, 'Meta progression should persist into persistent save data');

    const backgroundSimCheck = await page.evaluate(() => {
        MenuSystem.showScreen('game');
        startGame(0);
        GameState.settings.autoStart = false;
        if (WaveSystem.cancelCountdown) WaveSystem.cancelCountdown();
        GameState.gamePhase = 'playing';

        const before = GameState.time;
        runSimulationUntil(performance.now() + 500);
        const after = GameState.time;

        const beforeCatchup = GameState.time;
        runSimulationUntil(performance.now() + 15000, {
            maxCatchupMs: 10 * 60 * 1000,
            stepMs: 100,
        });
        const afterCatchup = GameState.time;

        return {
            advancedBy: after - before,
            backgroundCatchupBy: afterCatchup - beforeCatchup,
        };
    });
    assert(backgroundSimCheck.advancedBy > 0.2, `Background simulation fallback should advance time (delta=${backgroundSimCheck.advancedBy.toFixed(3)})`);
    assert(backgroundSimCheck.backgroundCatchupBy >= 10, `Background catch-up path should advance significant elapsed time (delta=${backgroundSimCheck.backgroundCatchupBy.toFixed(3)})`);

    const sfxLimiterCheck = await page.evaluate(() => {
        Audio._sfxLimiterState = {};
        Audio._sfxCategoryState = {};

        const now = 10;
        let allowed = 0;
        let blocked = 0;
        let lastBrightness = 1;

        for (let i = 0; i < 30; i++) {
            const r = Audio._applySfxLimiter('hit', now + i * 0.008, 0.3, 1.0);
            if (r.allow) {
                allowed++;
                lastBrightness = r.brightnessMult;
            } else {
                blocked++;
            }
        }

        return {
            allowed,
            blocked,
            lastBrightness,
        };
    });
    assert(sfxLimiterCheck.allowed > 0, 'SFX limiter should allow baseline hit sounds');
    assert(sfxLimiterCheck.blocked > 0, 'SFX limiter should block excessive spam sounds');
    assert(sfxLimiterCheck.lastBrightness < 1, `SFX limiter should damp brightness under density (brightness=${sfxLimiterCheck.lastBrightness})`);

    await page.evaluate(() => showWaveBanner('ANIMATION CHECK'));
    await page.waitForFunction(() => {
        const banner = document.getElementById('wave-banner');
        if (!banner) return false;
        const s = getComputedStyle(banner);
        return banner.classList.contains('is-visible') && s.display !== 'none';
    });

    const waveBannerAnimIn = await page.evaluate(() => {
        const banner = document.getElementById('wave-banner');
        return getComputedStyle(banner).animationName;
    });
    assert(
        waveBannerAnimIn.includes('bannerIn'),
        `Wave banner missing enter animation (got: ${waveBannerAnimIn})`
    );

    await page.waitForFunction(() => {
        const banner = document.getElementById('wave-banner');
        return !!banner && banner.classList.contains('is-exiting');
    }, null, { timeout: 2800 });

    const waveBannerAnimOut = await page.evaluate(() => {
        const banner = document.getElementById('wave-banner');
        return getComputedStyle(banner).animationName;
    });
    assert(
        waveBannerAnimOut.includes('bannerOut'),
        `Wave banner missing exit animation (got: ${waveBannerAnimOut})`
    );

    await page.waitForFunction(() => {
        const banner = document.getElementById('wave-banner');
        return !!banner && getComputedStyle(banner).display === 'none';
    }, null, { timeout: 3200 });

    await page.evaluate(() => AchievementSystem.showPopup({ name: 'ANIMATION CHECK' }));
    await page.waitForFunction(() => {
        const popup = document.getElementById('achievement-popup');
        if (!popup) return false;
        return popup.classList.contains('is-visible') && getComputedStyle(popup).display !== 'none';
    });

    const achieveAnimIn = await page.evaluate(() => {
        const popup = document.getElementById('achievement-popup');
        return getComputedStyle(popup).animationName;
    });
    assert(
        achieveAnimIn.includes('achieveIn'),
        `Achievement popup missing enter animation (got: ${achieveAnimIn})`
    );

    await page.waitForFunction(() => {
        const popup = document.getElementById('achievement-popup');
        return !!popup && popup.classList.contains('is-exiting');
    }, null, { timeout: 3200 });

    const achieveAnimOut = await page.evaluate(() => {
        const popup = document.getElementById('achievement-popup');
        return getComputedStyle(popup).animationName;
    });
    assert(
        achieveAnimOut.includes('achieveOut'),
        `Achievement popup missing exit animation (got: ${achieveAnimOut})`
    );

    await page.waitForFunction(() => {
        const popup = document.getElementById('achievement-popup');
        return !!popup && getComputedStyle(popup).display === 'none';
    }, null, { timeout: 3500 });

    await page.click('#btn-start-wave');
    await page.waitForFunction(() => GameState.gamePhase === 'playing');

    const skipStateBeforeReady = await page.evaluate(() => {
        const skipBtn = document.getElementById('btn-skip-wave');
        return getComputedStyle(skipBtn).display;
    });
    assert(skipStateBeforeReady === 'none', 'Skip wave button should stay hidden until final spawn');

    const preSkipState = await page.evaluate(() => {
        GameState.waveEnemies = [];
        GameState.enemiesAlive = Math.max(2, GameState.enemiesAlive);
        WaveSystem._showSkipReadyPrompt();

        const skipBtn = document.getElementById('btn-skip-wave');
        const root = getComputedStyle(document.documentElement);
        const sidebarW = parseFloat(root.getPropertyValue('--sidebar-w')) || 220;
        const expectedCenterX = (window.innerWidth - sidebarW) / 2;
        const rect = skipBtn.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;

        return {
            waveBefore: GameState.wave,
            aliveBefore: GameState.enemiesAlive,
            skipDisplay: getComputedStyle(skipBtn).display,
            delta: Math.abs(centerX - expectedCenterX),
            width: rect.width,
        };
    });

    assert(preSkipState.skipDisplay !== 'none', 'Skip wave button did not appear when ready');
    assert(preSkipState.delta <= 2, `Skip wave button misaligned by ${preSkipState.delta.toFixed(2)}px`);
    assert(preSkipState.width >= 250, `Skip wave button should be bigger (width: ${preSkipState.width.toFixed(1)}px)`);

    await page.click('#btn-skip-wave');
    await page.waitForFunction(() => GameState.gamePhase === 'playing' && GameState.wave >= 2);

    const postSkipState = await page.evaluate(() => ({
        waveAfter: GameState.wave,
        aliveAfter: GameState.enemiesAlive,
        phaseAfter: GameState.gamePhase,
    }));

    assert(postSkipState.waveAfter === preSkipState.waveBefore + 1, 'Skip did not force-start next wave');
    assert(
        postSkipState.aliveAfter >= preSkipState.aliveBefore,
        'Skip removed current enemies; previous wave mobs should remain active'
    );
    assert(postSkipState.phaseAfter === 'playing', 'Game phase should remain playing after skip');

    await browser.close();
    console.log('PASS: Playwright verified save-restore fidelity, phase-3 progression persistence, phase-4 enemy pack behavior, research mechanic wiring, boss archetype depth, scenario wave identity, continue metadata, ability bar visibility, research layout, notification animations, button layout, and skip-wave behavior.');
}

run().catch(err => {
    console.error('FAIL:', err.message);
    process.exit(1);
});
