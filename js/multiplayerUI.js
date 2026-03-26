// ===== MULTIPLAYER UI — LOBBY, HUD, READY BUTTON & RESULT OVERLAY =====

const MultiplayerUI = {

    // ===== LOBBY SCREEN =====

    renderLobby() {
        const container = document.getElementById('mp-lobby-content');
        if (!container) return;

        const signaling = (typeof Multiplayer !== 'undefined' && typeof Multiplayer.getSignalingConfig === 'function')
            ? Multiplayer.getSignalingConfig()
            : { mode: 'cloud', host: '0.peerjs.com', port: 443, path: '/', secure: true };
        const escapedHost = this._escapeHtml(signaling.host || '');
        const escapedPath = this._escapeHtml(signaling.path || '/');

        container.innerHTML = `
            <div class="mp-hero">
                <div class="mp-hero-icon">
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                        <circle cx="16" cy="20" r="8" stroke="#70ccff" stroke-width="2" fill="none"/>
                        <circle cx="32" cy="20" r="8" stroke="#50ff90" stroke-width="2" fill="none"/>
                        <path d="M16 30c-6 0-12 4-12 10h24c0-6-6-10-12-10z" stroke="#70ccff" stroke-width="1.5" fill="none" opacity="0.6"/>
                        <path d="M32 30c-6 0-12 4-12 10h24c0-6-6-10-12-10z" stroke="#50ff90" stroke-width="1.5" fill="none" opacity="0.6"/>
                        <line x1="22" y1="18" x2="26" y2="18" stroke="#ffd700" stroke-width="2" stroke-dasharray="2 2">
                            <animate attributeName="stroke-dashoffset" values="0;-4" dur="0.6s" repeatCount="indefinite"/>
                        </line>
                        <line x1="22" y1="22" x2="26" y2="22" stroke="#ffd700" stroke-width="2" stroke-dasharray="2 2">
                            <animate attributeName="stroke-dashoffset" values="0;4" dur="0.6s" repeatCount="indefinite"/>
                        </line>
                    </svg>
                </div>
                <h2 class="mp-hero-title">MULTIPLAYER</h2>
                <p class="mp-hero-sub">Share a 6-digit code to play with a friend</p>
            </div>
            <div class="mp-network-panel">
                <div class="mp-network-header">
                    <span class="mp-network-title">SIGNALING</span>
                    <div class="mp-network-header-actions">
                        <button type="button" class="mp-network-copy-btn" id="mp-btn-copy-endpoint">COPY VPN ENDPOINT</button>
                        <span class="mp-network-status" id="mp-network-status"></span>
                    </div>
                </div>
                <div class="mp-network-grid">
                    <div class="mp-field">
                        <label>Mode</label>
                        <select id="mp-signal-mode" class="mp-select">
                            <option value="cloud" ${signaling.mode === 'cloud' ? 'selected' : ''}>Cloud (Default)</option>
                            <option value="vpn" ${signaling.mode === 'vpn' ? 'selected' : ''}>Radmin VPN / LAN</option>
                            <option value="custom" ${signaling.mode === 'custom' ? 'selected' : ''}>Custom Server</option>
                        </select>
                    </div>
                    <div class="mp-field mp-network-wide">
                        <label>Server Host</label>
                        <input type="text" id="mp-signal-host" class="mp-signal-input" value="${escapedHost}" spellcheck="false" autocomplete="off">
                    </div>
                    <div class="mp-field">
                        <label>Port</label>
                        <input type="number" id="mp-signal-port" class="mp-signal-input" min="1" max="65535" value="${signaling.port}">
                    </div>
                    <div class="mp-field">
                        <label>Path</label>
                        <input type="text" id="mp-signal-path" class="mp-signal-input" value="${escapedPath}" spellcheck="false" autocomplete="off">
                    </div>
                    <label class="mp-signal-secure" id="mp-signal-secure-row">
                        <input type="checkbox" id="mp-signal-secure" ${signaling.secure ? 'checked' : ''}>
                        Use TLS (wss)
                    </label>
                </div>
                <p class="mp-network-hint" id="mp-network-hint"></p>
            </div>
            <div class="mp-choice">
                <button class="mp-choice-btn mp-choice-host" id="mp-btn-host">
                    <span class="mp-choice-icon">+</span>
                    <span class="mp-choice-label">HOST</span>
                    <span class="mp-choice-desc">Create a room</span>
                </button>
                <div class="mp-choice-divider"><span>or</span></div>
                <button class="mp-choice-btn mp-choice-join" id="mp-btn-join">
                    <span class="mp-choice-icon">&rarr;</span>
                    <span class="mp-choice-label">JOIN</span>
                    <span class="mp-choice-desc">Enter a code</span>
                </button>
            </div>
            <div id="mp-flow"></div>
        `;

        document.getElementById('mp-btn-host').addEventListener('click', () => {
            Audio.play('click');
            this._showHostFlow();
        });
        document.getElementById('mp-btn-join').addEventListener('click', () => {
            Audio.play('click');
            this._showJoinFlow();
        });

        this._initNetworkConfigForm();
    },

    _escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },

    _formatEndpoint(config) {
        if (!config) return '';
        const scheme = config.secure ? 'wss' : 'ws';
        return `${scheme}://${config.host}:${config.port}${config.path}`;
    },

    _buildEndpointShareText(config) {
        const endpoint = this._formatEndpoint(config);
        const gameUrl = `${window.location.protocol}//${window.location.host}`;
        return [
            'TowerForge Multiplayer Endpoint',
            `Signal: ${endpoint}`,
            `Game URL: ${gameUrl}`,
        ].join('\n');
    },

    _copyCurrentEndpoint() {
        if (typeof Multiplayer === 'undefined') return;

        if (!this._applyNetworkConfigFromForm(true)) {
            return;
        }

        const config = Multiplayer.getSignalingConfig();
        if (!config || config.mode === 'cloud') {
            this._toast('Switch to Radmin VPN / LAN or Custom mode first.');
            return;
        }

        const payload = this._buildEndpointShareText(config);
        navigator.clipboard.writeText(payload)
            .then(() => this._toast('VPN endpoint copied'))
            .catch(() => this._toast(payload));
    },

    _updateNetworkHint(message, isError = false) {
        const hint = document.getElementById('mp-network-hint');
        if (!hint) return;
        hint.textContent = message;
        hint.classList.toggle('mp-network-hint-error', isError);
    },

    _collectNetworkFormConfig() {
        const modeEl = document.getElementById('mp-signal-mode');
        const hostEl = document.getElementById('mp-signal-host');
        const portEl = document.getElementById('mp-signal-port');
        const pathEl = document.getElementById('mp-signal-path');
        const secureEl = document.getElementById('mp-signal-secure');
        if (!modeEl || !hostEl || !portEl || !pathEl || !secureEl) {
            return { ok: false, message: 'Missing network controls.' };
        }

        const mode = modeEl.value;
        if (mode === 'cloud') {
            return { ok: true, config: { mode: 'cloud' } };
        }

        const host = hostEl.value.trim();
        if (!host) {
            return { ok: false, message: 'Enter the signaling host (use the host PC Radmin VPN IP).' };
        }

        const port = Number.parseInt(portEl.value, 10);
        if (!Number.isFinite(port) || port < 1 || port > 65535) {
            return { ok: false, message: 'Port must be between 1 and 65535.' };
        }

        const pathRaw = pathEl.value.trim();
        const path = pathRaw ? (pathRaw.startsWith('/') ? pathRaw : `/${pathRaw}`) : '/peerjs';
        const secure = !!secureEl.checked;

        if (window.location.protocol === 'https:' && !secure) {
            return {
                ok: false,
                message: 'HTTPS pages block ws:// signaling. For Radmin mode open the game via http://<host-vpn-ip>:3000.',
            };
        }

        return {
            ok: true,
            config: { mode, host, port, path, secure },
        };
    },

    _applyNetworkConfigFromForm(showErrorToast = true) {
        if (typeof Multiplayer === 'undefined') return false;

        const result = this._collectNetworkFormConfig();
        if (!result.ok) {
            if (showErrorToast) this._toast(result.message);
            return false;
        }

        if (result.config.mode === 'cloud') {
            Multiplayer.applySignalingPreset('cloud');
        } else {
            Multiplayer.setSignalingConfig(result.config);
        }
        return true;
    },

    _refreshNetworkFormState() {
        const modeEl = document.getElementById('mp-signal-mode');
        const hostEl = document.getElementById('mp-signal-host');
        const portEl = document.getElementById('mp-signal-port');
        const pathEl = document.getElementById('mp-signal-path');
        const secureEl = document.getElementById('mp-signal-secure');
        const secureRow = document.getElementById('mp-signal-secure-row');
        const statusEl = document.getElementById('mp-network-status');
        const copyBtn = document.getElementById('mp-btn-copy-endpoint');
        if (!modeEl || !hostEl || !portEl || !pathEl || !secureEl || !secureRow || !statusEl) return;

        const mode = modeEl.value;
        const cloudMode = mode === 'cloud';

        hostEl.disabled = cloudMode;
        portEl.disabled = cloudMode;
        pathEl.disabled = cloudMode;
        secureEl.disabled = cloudMode;
        secureRow.classList.toggle('is-disabled', cloudMode);

        const validation = this._collectNetworkFormConfig();
        if (!validation.ok) {
            statusEl.textContent = 'INVALID';
            statusEl.className = 'mp-network-status mp-network-status-invalid';
            if (copyBtn) {
                copyBtn.disabled = true;
            }
            this._updateNetworkHint(validation.message, true);
            return;
        }

        const config = validation.config.mode === 'cloud'
            ? Multiplayer.getSignalingConfig()
            : validation.config;

        if (cloudMode) {
            statusEl.textContent = 'CLOUD';
            statusEl.className = 'mp-network-status mp-network-status-cloud';
            if (copyBtn) {
                copyBtn.disabled = true;
                copyBtn.textContent = 'COPY VPN ENDPOINT';
            }
            this._updateNetworkHint('Public signaling on 0.peerjs.com. Fast to start, may fail on strict networks.', false);
            return;
        }

        statusEl.textContent = 'CUSTOM';
        statusEl.className = 'mp-network-status mp-network-status-custom';
        if (copyBtn) {
            copyBtn.disabled = false;
            copyBtn.textContent = mode === 'vpn' ? 'COPY VPN ENDPOINT' : 'COPY ENDPOINT';
        }
        if (mode === 'vpn') {
            this._updateNetworkHint(`Radmin mode endpoint: ${this._formatEndpoint(config)}. Host runs npm run peerserver.`, false);
        } else {
            this._updateNetworkHint(`Custom endpoint: ${this._formatEndpoint(config)}`, false);
        }
    },

    _initNetworkConfigForm() {
        const modeEl = document.getElementById('mp-signal-mode');
        const hostEl = document.getElementById('mp-signal-host');
        const portEl = document.getElementById('mp-signal-port');
        const pathEl = document.getElementById('mp-signal-path');
        const secureEl = document.getElementById('mp-signal-secure');
        const copyBtn = document.getElementById('mp-btn-copy-endpoint');
        if (!modeEl || !hostEl || !portEl || !pathEl || !secureEl || typeof Multiplayer === 'undefined') return;

        modeEl.addEventListener('change', () => {
            const mode = modeEl.value;
            if (mode === 'cloud') {
                Multiplayer.applySignalingPreset('cloud');
            } else if (mode === 'vpn') {
                Multiplayer.applySignalingPreset('vpn');
            } else {
                const current = Multiplayer.getSignalingConfig();
                const defaultHost = (window.location && window.location.hostname) ? window.location.hostname : '127.0.0.1';
                Multiplayer.setSignalingConfig({
                    mode: 'custom',
                    host: current.mode === 'cloud' ? defaultHost : current.host,
                    port: current.mode === 'cloud' ? 9000 : current.port,
                    path: current.mode === 'cloud' ? '/peerjs' : current.path,
                    secure: current.mode === 'cloud' ? (window.location.protocol === 'https:') : current.secure,
                });
            }

            const cfg = Multiplayer.getSignalingConfig();
            hostEl.value = cfg.host;
            portEl.value = String(cfg.port);
            pathEl.value = cfg.path;
            secureEl.checked = cfg.secure;
            this._refreshNetworkFormState();
        });

        const updateConfig = () => {
            this._applyNetworkConfigFromForm(false);
            this._refreshNetworkFormState();
        };

        hostEl.addEventListener('input', updateConfig);
        portEl.addEventListener('input', updateConfig);
        pathEl.addEventListener('input', updateConfig);
        secureEl.addEventListener('change', updateConfig);

        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                this._copyCurrentEndpoint();
            });
        }

        this._applyNetworkConfigFromForm(false);
        this._refreshNetworkFormState();
    },

    // ===== HOST FLOW =====

    _showHostFlow() {
        const flow = document.getElementById('mp-flow');
        if (!flow) return;

        flow.innerHTML = `
            <div class="mp-steps">
                <div class="mp-step mp-step-active" id="mp-step-1">
                    <div class="mp-step-num">1</div>
                    <div class="mp-step-body">
                        <h3>Configure Match</h3>
                        <div class="mp-fields">
                            <div class="mp-field">
                                <label>Map</label>
                                <select id="mp-host-map" class="mp-select">
                                    ${MAPS.map((m, i) => `<option value="${i}">${m.name}</option>`).join('')}
                                </select>
                            </div>
                            <div class="mp-field">
                                <label>Difficulty</label>
                                <select id="mp-host-diff" class="mp-select">
                                    <option value="easy">Easy</option>
                                    <option value="normal" selected>Normal</option>
                                    <option value="hard">Hard</option>
                                    <option value="nightmare">Nightmare</option>
                                </select>
                            </div>
                        </div>
                        <button class="mp-action-btn" id="mp-btn-create">CREATE ROOM</button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('mp-btn-create').addEventListener('click', async () => {
            if (!this._applyNetworkConfigFromForm(true)) return;

            const btn = document.getElementById('mp-btn-create');
            btn.disabled = true;
            btn.innerHTML = '<span class="mp-spinner"></span> CREATING...';

            const mapIndex = parseInt(document.getElementById('mp-host-map').value);
            const difficulty = document.getElementById('mp-host-diff').value;
            const config = {
                mapIndex, difficulty,
                doctrineId: null,
                maxWave: MAPS[mapIndex].waves || 30,
            };

            try {
                const code = await Multiplayer.createRoom(config);
                this._showHostWaiting(code);
            } catch (e) {
                btn.disabled = false;
                btn.innerHTML = 'CREATE ROOM';
                this._toast('Error: ' + e.message);
            }
        });
    },

    _showHostWaiting(code) {
        const flow = document.getElementById('mp-flow');
        const stepsEl = flow.querySelector('.mp-steps');

        // Dim step 1
        const step1 = document.getElementById('mp-step-1');
        if (step1) step1.classList.add('mp-step-done');

        const html = `
            <div class="mp-step mp-step-active" id="mp-step-2">
                <div class="mp-step-num">2</div>
                <div class="mp-step-body">
                    <h3>Share Code</h3>
                    <div class="mp-room-code-display" id="mp-room-code">
                        ${code.split('').map(c => `<span class="mp-code-char">${c}</span>`).join('')}
                    </div>
                    <div class="mp-signal-summary" id="mp-host-signal"></div>
                    <button class="mp-copy-code-btn" id="mp-btn-copy-code">COPY CODE</button>
                    <div class="mp-waiting">
                        <span class="mp-waiting-dot"></span>
                        Waiting for friend to join...
                    </div>
                </div>
            </div>
        `;
        stepsEl.insertAdjacentHTML('beforeend', html);

        const signalInfo = document.getElementById('mp-host-signal');
        if (signalInfo && typeof Multiplayer !== 'undefined' && typeof Multiplayer.getSignalingConfig === 'function') {
            const cfg = Multiplayer.getSignalingConfig();
            signalInfo.textContent = `Signal: ${cfg.mode === 'cloud' ? 'Cloud (0.peerjs.com)' : this._formatEndpoint(cfg)}`;
        }

        document.getElementById('mp-btn-copy-code').addEventListener('click', () => {
            navigator.clipboard.writeText(code).then(() => {
                this._toast('Copied!');
                const btn = document.getElementById('mp-btn-copy-code');
                if (btn) { btn.textContent = 'COPIED!'; setTimeout(() => { if (btn) btn.textContent = 'COPY CODE'; }, 2000); }
            }).catch(() => this._toast(code));
        });
    },

    // ===== JOIN FLOW =====

    _showJoinFlow() {
        const flow = document.getElementById('mp-flow');
        if (!flow) return;

        flow.innerHTML = `
            <div class="mp-steps">
                <div class="mp-step mp-step-active" id="mp-step-j1">
                    <div class="mp-step-num">1</div>
                    <div class="mp-step-body">
                        <h3>Enter Room Code</h3>
                        <div class="mp-code-input-wrap">
                            <input type="text" class="mp-code-input-field" id="mp-join-code"
                                   maxlength="6" placeholder="------" autocomplete="off" spellcheck="false">
                        </div>
                        <button class="mp-action-btn" id="mp-btn-join-go">JOIN</button>
                        <div id="mp-join-status"></div>
                    </div>
                </div>
            </div>
        `;

        const input = document.getElementById('mp-join-code');
        input.addEventListener('input', () => {
            input.value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
            // Visual feedback when code is complete
            if (input.value.length === 6) {
                input.classList.add('code-complete');
                document.getElementById('mp-btn-join-go').focus();
            } else {
                input.classList.remove('code-complete');
            }
        });

        document.getElementById('mp-btn-join-go').addEventListener('click', async () => {
            const code = document.getElementById('mp-join-code').value.trim();
            if (code.length !== 6) { this._toast('Enter a 6-character code'); return; }
            if (!this._applyNetworkConfigFromForm(true)) return;

            const btn = document.getElementById('mp-btn-join-go');
            btn.disabled = true;
            btn.innerHTML = '<span class="mp-spinner"></span> JOINING...';

            const statusEl = document.getElementById('mp-join-status');
            if (statusEl) {
                const cfg = typeof Multiplayer !== 'undefined' && typeof Multiplayer.getSignalingConfig === 'function'
                    ? Multiplayer.getSignalingConfig()
                    : null;
                const endpoint = cfg && cfg.mode !== 'cloud' ? this._formatEndpoint(cfg) : 'Cloud (0.peerjs.com)';
                statusEl.innerHTML = `<div class="mp-waiting"><span class="mp-waiting-dot"></span> Connecting via ${this._escapeHtml(endpoint)}...</div>`;
            }

            try {
                await Multiplayer.joinRoom(code);
                // Connection will trigger onConnected callback
            } catch (e) {
                btn.disabled = false;
                btn.innerHTML = 'JOIN';
                if (statusEl) statusEl.innerHTML = '';
                this._toast(e.message);
            }
        });
    },

    // ===== TOAST =====

    _toast(msg) {
        let toast = document.getElementById('mp-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'mp-toast';
            toast.className = 'mp-toast';
            document.body.appendChild(toast);
        }
        toast.textContent = msg;
        toast.classList.remove('mp-toast-show');
        void toast.offsetWidth;
        toast.classList.add('mp-toast-show');
        clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(() => toast.classList.remove('mp-toast-show'), 2500);
    },
    _toastTimer: null,

    // ===== CONNECTION EVENTS =====

    onConnected() {
        Audio.play('wave_complete');

        const flow = document.getElementById('mp-flow');
        if (!flow) return;

        if (Multiplayer.isHost) {
            flow.innerHTML = `
                <div class="mp-connected-card">
                    <div class="mp-connected-badge">
                        <span class="mp-dot mp-dot-green"></span>
                        CONNECTED
                    </div>
                    <p class="mp-connected-info">Both players play the same waves independently.<br>Highest score wins!</p>
                    <button class="mp-launch-btn" id="mp-btn-launch">LAUNCH GAME</button>
                </div>
            `;
            document.getElementById('mp-btn-launch').addEventListener('click', () => {
                Audio.play('click');
                Multiplayer.hostLaunchGame();
            });
        } else {
            flow.innerHTML = `
                <div class="mp-connected-card">
                    <div class="mp-connected-badge">
                        <span class="mp-dot mp-dot-green"></span>
                        CONNECTED
                    </div>
                    <div class="mp-waiting">
                        <span class="mp-waiting-dot"></span>
                        Waiting for host to launch...
                    </div>
                </div>
            `;
        }
    },

    onConfigReceived(config) {
        const mapName = MAPS[config.mapIndex] ? MAPS[config.mapIndex].name : `Map ${config.mapIndex}`;
        this._toast(`${mapName} | ${config.difficulty}`);
    },

    // ===== OPPONENT HUD =====

    showOpponentHUD() {
        const hud = document.getElementById('opponent-hud');
        if (hud) hud.style.display = 'flex';
    },

    hideOpponentHUD() {
        const hud = document.getElementById('opponent-hud');
        if (hud) hud.style.display = 'none';
    },

    updateOpponentHUD() {
        const s = Multiplayer.opponentStatus;
        const el = (id) => document.getElementById(id);

        const livesEl = el('opp-lives');
        const scoreEl = el('opp-score');
        const waveEl = el('opp-wave');
        const goldEl = el('opp-gold');
        const phaseEl = el('opp-phase');
        const towersEl = el('opp-towers');

        if (livesEl) livesEl.textContent = s.lives;
        if (scoreEl) scoreEl.textContent = s.score;
        if (waveEl) waveEl.textContent = s.wave;
        if (goldEl) goldEl.textContent = s.gold;
        if (towersEl) towersEl.textContent = s.towersPlaced;
        if (phaseEl) {
            const phaseText = s.gamePhase === 'playing' ? 'IN WAVE' : s.gamePhase === 'idle' ? 'BUILDING' : s.gamePhase.toUpperCase();
            phaseEl.textContent = phaseText;
            phaseEl.className = 'opp-phase opp-phase-' + s.gamePhase;
        }
    },

    // ===== READY BUTTON =====

    showReadyButton() {
        const readyBtn = document.getElementById('mp-ready-btn');
        if (readyBtn) readyBtn.style.display = 'block';
    },

    hideReadyButton() {
        const readyBtn = document.getElementById('mp-ready-btn');
        if (readyBtn) readyBtn.style.display = 'none';
    },

    updateReadyState() {
        const readyBtn = document.getElementById('mp-ready-btn');
        if (!readyBtn) return;

        if (Multiplayer.localReady && Multiplayer.remoteReady) {
            readyBtn.textContent = 'BOTH READY — STARTING...';
            readyBtn.classList.add('mp-ready-both');
            readyBtn.disabled = true;
        } else if (Multiplayer.localReady) {
            readyBtn.textContent = 'WAITING FOR OPPONENT...';
            readyBtn.classList.add('mp-ready-local');
            readyBtn.disabled = true;
        } else {
            readyBtn.textContent = 'READY [SPACE]';
            readyBtn.classList.remove('mp-ready-local', 'mp-ready-both');
            readyBtn.disabled = false;
        }
    },

    resetReadyButton() {
        const readyBtn = document.getElementById('mp-ready-btn');
        if (!readyBtn) return;
        readyBtn.textContent = 'READY [SPACE]';
        readyBtn.classList.remove('mp-ready-local', 'mp-ready-both');
        readyBtn.disabled = false;
        readyBtn.style.display = 'block';
    },

    // ===== MATCH RESULT =====

    showMatchResult(result, message) {
        Multiplayer.stopStatusSync();

        const overlay = document.getElementById('mp-result-overlay');
        if (!overlay) return;

        const titleEl = document.getElementById('mp-result-title');
        const msgEl = document.getElementById('mp-result-message');
        const statsEl = document.getElementById('mp-result-stats');

        if (titleEl) {
            if (result === 'win') {
                titleEl.textContent = 'VICTORY!';
                titleEl.className = 'mp-result-title mp-result-win';
            } else if (result === 'lose') {
                titleEl.textContent = 'DEFEATED';
                titleEl.className = 'mp-result-title mp-result-lose';
            } else {
                titleEl.textContent = 'DRAW';
                titleEl.className = 'mp-result-title mp-result-draw';
            }
        }

        if (msgEl) msgEl.textContent = message;

        if (statsEl) {
            const opp = Multiplayer.opponentStatus;
            statsEl.innerHTML = `
                <div class="mp-result-compare">
                    <div class="mp-result-col">
                        <h4>YOU</h4>
                        <div class="stat-row"><span class="sr-label">Score</span><span class="sr-value">${GameState.score}</span></div>
                        <div class="stat-row"><span class="sr-label">Wave</span><span class="sr-value">${GameState.wave}</span></div>
                        <div class="stat-row"><span class="sr-label">Lives</span><span class="sr-value">${GameState.lives}</span></div>
                        <div class="stat-row"><span class="sr-label">Kills</span><span class="sr-value">${GameState.stats.totalKills}</span></div>
                        <div class="stat-row"><span class="sr-label">Towers</span><span class="sr-value">${GameState.towers.length}</span></div>
                    </div>
                    <div class="mp-result-vs">VS</div>
                    <div class="mp-result-col">
                        <h4>OPPONENT</h4>
                        <div class="stat-row"><span class="sr-label">Score</span><span class="sr-value">${opp.score}</span></div>
                        <div class="stat-row"><span class="sr-label">Wave</span><span class="sr-value">${opp.wave}</span></div>
                        <div class="stat-row"><span class="sr-label">Lives</span><span class="sr-value">${opp.lives}</span></div>
                        <div class="stat-row"><span class="sr-label">Towers</span><span class="sr-value">${opp.towersPlaced}</span></div>
                    </div>
                </div>
            `;
        }

        overlay.style.display = 'flex';
        Audio.play(result === 'win' ? 'victory' : 'gameover');
    },

    hideMatchResult() {
        const overlay = document.getElementById('mp-result-overlay');
        if (overlay) overlay.style.display = 'none';
    },

    // ===== CLEANUP =====

    cleanup() {
        this.hideOpponentHUD();
        this.hideReadyButton();
        this.hideMatchResult();
    },
};
