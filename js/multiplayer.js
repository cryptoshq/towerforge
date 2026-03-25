// ===== MULTIPLAYER SYSTEM — PeerJS P2P with Short Room Codes =====

const Multiplayer = {
    active: false,
    isHost: false,
    connected: false,
    peer: null,
    conn: null,

    // Opponent status (updated via data channel)
    opponentStatus: { lives: 0, score: 0, wave: 0, gold: 0, gamePhase: 'idle', towersPlaced: 0 },

    // Sync
    syncInterval: null,
    SYNC_RATE_MS: 500,
    PEER_OPEN_TIMEOUT_MS: 12000,
    CONNECT_TIMEOUT_MS: 15000,

    // ICE servers for better NAT traversal reliability
    ICE_SERVERS: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:openrelay.metered.ca:80' },
        {
            urls: 'turn:openrelay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject',
        },
        {
            urls: 'turn:openrelay.metered.ca:80?transport=tcp',
            username: 'openrelayproject',
            credential: 'openrelayproject',
        },
        {
            urls: 'turn:openrelay.metered.ca:443',
            username: 'openrelayproject',
            credential: 'openrelayproject',
        },
        {
            urls: 'turn:openrelay.metered.ca:443?transport=tcp',
            username: 'openrelayproject',
            credential: 'openrelayproject',
        },
        {
            urls: 'turns:openrelay.metered.ca:443?transport=tcp',
            username: 'openrelayproject',
            credential: 'openrelayproject',
        },
    ],

    // Session config (set by host, sent to peer)
    sessionConfig: { mapIndex: 0, difficulty: 'normal', doctrineId: null, maxWave: 30 },

    // Ready system
    localReady: false,
    remoteReady: false,

    // Game result
    localResult: null,  // 'lost' | 'survived'
    remoteResult: null,
    matchEnded: false,

    // Room code prefix to avoid collisions with other PeerJS apps
    _prefix: 'TF-',

    // ===== ROOM CODE GENERATION =====

    _generateCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1 to avoid confusion
        let code = '';
        for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
        return code;
    },

    _createPeerOptions(iceTransportPolicy = 'all') {
        return {
            host: '0.peerjs.com',
            port: 443,
            path: '/',
            secure: true,
            pingInterval: 5000,
            debug: 1,
            config: {
                iceServers: this.ICE_SERVERS,
                iceCandidatePoolSize: 8,
                iceTransportPolicy: iceTransportPolicy,
            },
        };
    },

    _formatPeerError(err) {
        if (!err) return 'Connection failed.';

        switch (err.type) {
            case 'peer-unavailable':
                return 'Room not found. Check the code and try again.';
            case 'network':
            case 'socket-error':
            case 'socket-closed':
                return 'Could not reach multiplayer service. Check your network and retry.';
            case 'webrtc':
                return 'Unable to establish a direct multiplayer link. Try again in a few seconds.';
            case 'browser-incompatible':
                return 'This browser does not fully support multiplayer.';
            default:
                return err.message || 'Connection failed.';
        }
    },

    _canRetryJoinError(type) {
        return type === 'timeout'
            || type === 'network'
            || type === 'socket-error'
            || type === 'socket-closed'
            || type === 'webrtc'
            || type === 'close-before-open'
            || type === 'disconnected-before-join';
    },

    // ===== CONNECTION SETUP =====

    async createRoom(config) {
        this.isHost = true;
        this.sessionConfig = { ...config };
        this._resetState();

        const code = this._generateCode();
        const peerId = this._prefix + code;

        return new Promise((resolve, reject) => {
            let settled = false;
            const openTimeout = setTimeout(() => {
                if (settled) return;
                settled = true;
                if (this.peer) {
                    try { this.peer.destroy(); } catch (e) {}
                    this.peer = null;
                }
                reject(new Error('Timed out while creating room. Please check your network and try again.'));
            }, this.PEER_OPEN_TIMEOUT_MS);

            const peer = new Peer(peerId, this._createPeerOptions());
            this.peer = peer;

            peer.on('open', () => {
                if (settled) return;
                settled = true;
                clearTimeout(openTimeout);
                console.log('[Multiplayer] Room created:', code);

                // Listen for incoming connection
                peer.on('connection', (conn) => {
                    this.conn = conn;
                    this._setupConnection(conn);
                });

                resolve(code);
            });

            peer.on('error', (err) => {
                if (settled) return;
                settled = true;
                clearTimeout(openTimeout);
                console.error('[Multiplayer] Peer error:', err);
                if (err.type === 'unavailable-id') {
                    // Code collision — try again
                    this.peer = null;
                    this.createRoom(config).then(resolve).catch(reject);
                } else {
                    reject(new Error(this._formatPeerError(err)));
                }
            });
        });
    },

    async joinRoom(roomCode) {
        this.isHost = false;
        this._resetState();

        const code = roomCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
        const peerId = this._prefix + code;

        try {
            await this._joinRoomAttempt(peerId, code, 'all');
            return;
        } catch (firstErr) {
            if (!this._canRetryJoinError(firstErr && firstErr.type)) {
                throw firstErr;
            }
            console.warn('[Multiplayer] Retrying join with relay-only ICE policy:', firstErr.type || firstErr.message || firstErr);
        }

        try {
            await this._joinRoomAttempt(peerId, code, 'relay');
            return;
        } catch (secondErr) {
            const err = secondErr instanceof Error ? secondErr : new Error('Connection failed.');
            throw new Error(`${err.message} If this keeps happening, one player network is likely blocking P2P relay traffic.`);
        }
    },

    _joinRoomAttempt(peerId, code, iceTransportPolicy) {
        return new Promise((resolve, reject) => {
            let settled = false;
            let timeoutId = null;

            const clearJoinTimeout = () => {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                    timeoutId = null;
                }
            };

            const failJoin = (message, type = 'unknown') => {
                if (settled) return;
                settled = true;
                clearJoinTimeout();
                this.connected = false;
                if (this.conn) {
                    try { this.conn.close(); } catch (e) {}
                    this.conn = null;
                }
                if (this.peer) {
                    try { this.peer.destroy(); } catch (e) {}
                    this.peer = null;
                }
                const err = new Error(message);
                err.type = type;
                reject(err);
            };

            const completeJoin = () => {
                if (settled) return;
                settled = true;
                clearJoinTimeout();
                resolve();
            };

            const peer = new Peer(null, this._createPeerOptions(iceTransportPolicy));
            this.peer = peer;

            timeoutId = setTimeout(() => {
                failJoin('Connection timed out. Ask your friend to keep the room open and try again.', 'timeout');
            }, this.CONNECT_TIMEOUT_MS);

            peer.on('open', () => {
                console.log('[Multiplayer] Connecting to room:', code);

                const conn = peer.connect(peerId, {
                    reliable: true,
                    serialization: 'json',
                });
                this.conn = conn;

                conn.on('open', () => {
                    completeJoin();
                });

                conn.on('close', () => {
                    if (!this.connected) {
                        failJoin('Connection closed before joining. Ask the host to recreate the room and try again.', 'close-before-open');
                    }
                });

                conn.on('error', (err) => {
                    console.error('[Multiplayer] Connection error:', err);
                    failJoin(this._formatPeerError(err), (err && err.type) || 'conn-error');
                });

                this._setupConnection(conn);
            });

            peer.on('error', (err) => {
                console.error('[Multiplayer] Peer error:', err);
                failJoin(this._formatPeerError(err), (err && err.type) || 'peer-error');
            });

            peer.on('disconnected', () => {
                failJoin('Disconnected from multiplayer service before joining. Please retry.', 'disconnected-before-join');
            });
        });
    },

    // ===== CONNECTION HANDLING =====

    _setupConnection(conn) {
        conn.on('open', () => {
            console.log('[Multiplayer] Connected!');
            this.connected = true;

            // Host sends config immediately
            if (this.isHost) {
                this.send({ type: 'config', ...this.sessionConfig });
            }

            if (typeof MultiplayerUI !== 'undefined') {
                MultiplayerUI.onConnected();
            }
        });

        conn.on('data', (data) => {
            this._onMessage(data);
        });

        conn.on('close', () => {
            console.log('[Multiplayer] Connection closed');
            this.handleDisconnect();
        });

        conn.on('error', (err) => {
            console.error('[Multiplayer] Connection error:', err);
        });
    },

    // ===== MESSAGING =====

    send(data) {
        if (this.conn && this.conn.open) {
            this.conn.send(data);
        }
    },

    _onMessage(msg) {
        switch (msg.type) {
            case 'config':
                this.sessionConfig = {
                    mapIndex: msg.mapIndex,
                    difficulty: msg.difficulty,
                    doctrineId: msg.doctrineId,
                    maxWave: msg.maxWave,
                };
                if (typeof MultiplayerUI !== 'undefined') {
                    MultiplayerUI.onConfigReceived(this.sessionConfig);
                }
                break;

            case 'status':
                this.opponentStatus = {
                    lives: msg.lives,
                    score: msg.score,
                    wave: msg.wave,
                    gold: msg.gold,
                    gamePhase: msg.gamePhase,
                    towersPlaced: msg.towersPlaced,
                };
                if (typeof MultiplayerUI !== 'undefined') {
                    MultiplayerUI.updateOpponentHUD();
                }
                break;

            case 'wave_start':
                if (!this.isHost) {
                    this._startWaveFromRemote(msg);
                }
                break;

            case 'ready':
                this.remoteReady = true;
                if (typeof MultiplayerUI !== 'undefined') {
                    MultiplayerUI.updateReadyState();
                }
                if (this.isHost && this.localReady && this.remoteReady) {
                    this._hostStartWave();
                }
                break;

            case 'game_end':
                this.remoteResult = msg.result;
                this._checkMatchEnd();
                break;

            case 'start_game':
                if (!this.isHost) {
                    this._peerStartGame();
                }
                break;

            case 'disconnect':
                this.handleDisconnect();
                break;
        }
    },

    // ===== WAVE SYNCHRONIZATION =====

    _hostStartWave() {
        this.localReady = false;
        this.remoteReady = false;

        WaveSystem.startWave();

        const waveData = {
            type: 'wave_start',
            waveNumber: GameState.wave,
            waveEnemies: GameState.waveEnemies.map(e => ({
                type: e.type,
                hpMult: e.hpMult,
                delay: e.delay,
                count: e.count,
                isElite: e.isElite || false,
                eliteVariant: e.eliteVariant || null,
            })),
            isBonusWave: WaveSystem.isBonusWave,
            difficultyScale: WaveSystem.difficultyScale,
        };
        this.send(waveData);
    },

    _startWaveFromRemote(msg) {
        if (GameState.gamePhase !== 'idle') return;

        this.localReady = false;
        this.remoteReady = false;

        GameState.wave = msg.waveNumber;
        GameState.gamePhase = 'playing';
        GameState.stats.wavesCompleted = GameState.wave;

        WaveSystem.difficultyScale = msg.difficultyScale || 1;
        WaveSystem.isBonusWave = msg.isBonusWave || false;
        WaveSystem.activeModifiers = [];

        GameState.waveEnemies = msg.waveEnemies || [];
        GameState.totalEnemiesInWave = 0;
        for (const entry of GameState.waveEnemies) {
            GameState.totalEnemiesInWave += entry.count || 1;
        }

        showWaveBanner(`WAVE ${GameState.wave}`);

        const waveBtn = document.getElementById('btn-start-wave');
        if (waveBtn) waveBtn.classList.add('hidden');

        if (typeof MultiplayerUI !== 'undefined') {
            MultiplayerUI.updateReadyState();
        }
    },

    // ===== READY SYSTEM =====

    setReady() {
        this.localReady = true;
        this.send({ type: 'ready', wave: GameState.wave });

        if (typeof MultiplayerUI !== 'undefined') {
            MultiplayerUI.updateReadyState();
        }

        if (this.isHost && this.localReady && this.remoteReady) {
            this._hostStartWave();
        }
    },

    // ===== GAME LIFECYCLE =====

    startMultiplayerGame() {
        this.active = true;
        this.matchEnded = false;
        this.localResult = null;
        this.remoteResult = null;

        const config = this.sessionConfig;
        GameState.selectedDifficulty = config.difficulty;
        GameState.settings.difficulty = config.difficulty;
        GameState.activeDoctrineId = config.doctrineId;

        startGame(config.mapIndex);

        // Lock speed to 1x in multiplayer
        GameState.gameSpeed = 1;
        const speedBtn = document.getElementById('btn-speed');
        if (speedBtn) speedBtn.textContent = '1x';

        this.startStatusSync();

        if (typeof MultiplayerUI !== 'undefined') {
            MultiplayerUI.showOpponentHUD();
            MultiplayerUI.showReadyButton();
        }
    },

    _peerStartGame() {
        this.startMultiplayerGame();
    },

    hostLaunchGame() {
        this.send({ type: 'start_game' });
        this.startMultiplayerGame();
    },

    // ===== STATUS SYNC =====

    startStatusSync() {
        this.stopStatusSync();
        this.syncInterval = setInterval(() => {
            this.send({
                type: 'status',
                lives: GameState.lives,
                score: GameState.score,
                wave: GameState.wave,
                gold: GameState.gold,
                gamePhase: GameState.gamePhase,
                towersPlaced: GameState.towers.length,
            });
        }, this.SYNC_RATE_MS);
    },

    stopStatusSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    },

    // ===== GAME END =====

    reportGameEnd(result) {
        this.localResult = result;
        this.send({
            type: 'game_end',
            result: result,
            finalScore: GameState.score,
            finalWave: GameState.wave,
            finalKills: GameState.stats.totalKills,
        });
        this._checkMatchEnd();
    },

    _checkMatchEnd() {
        if (this.matchEnded) return;

        if (this.remoteResult === 'lost' && !this.localResult) {
            this.matchEnded = true;
            if (typeof MultiplayerUI !== 'undefined') {
                MultiplayerUI.showMatchResult('win', 'Opponent defeated!');
            }
            return;
        }

        if (this.localResult === 'lost') {
            this.matchEnded = true;
            if (typeof MultiplayerUI !== 'undefined') {
                MultiplayerUI.showMatchResult('lose', 'You were defeated!');
            }
            return;
        }

        if (this.localResult === 'survived' && this.remoteResult === 'survived') {
            this.matchEnded = true;
            const myScore = GameState.score;
            const theirScore = this.opponentStatus.score;
            let result, message;
            if (myScore > theirScore) {
                result = 'win';
                message = `You win! ${myScore} vs ${theirScore}`;
            } else if (theirScore > myScore) {
                result = 'lose';
                message = `Opponent wins! ${theirScore} vs ${myScore}`;
            } else {
                result = 'draw';
                message = `It's a draw! Both scored ${myScore}`;
            }
            if (typeof MultiplayerUI !== 'undefined') {
                MultiplayerUI.showMatchResult(result, message);
            }
        }
    },

    // ===== DISCONNECTION =====

    handleDisconnect() {
        if (!this.active) return;
        this.connected = false;
        this.stopStatusSync();

        if (!this.matchEnded) {
            this.matchEnded = true;
            if (typeof MultiplayerUI !== 'undefined') {
                MultiplayerUI.showMatchResult('win', 'Opponent disconnected!');
            }
        }
    },

    // ===== CLEANUP =====

    destroy() {
        this.stopStatusSync();
        if (this.conn) {
            try { this.conn.close(); } catch (e) {}
            this.conn = null;
        }
        if (this.peer) {
            try { this.peer.destroy(); } catch (e) {}
            this.peer = null;
        }
        this._resetState();
    },

    _resetState() {
        this.active = false;
        this.connected = false;
        this.localReady = false;
        this.remoteReady = false;
        this.localResult = null;
        this.remoteResult = null;
        this.matchEnded = false;
        this.opponentStatus = { lives: 0, score: 0, wave: 0, gold: 0, gamePhase: 'idle', towersPlaced: 0 };
    },
};
