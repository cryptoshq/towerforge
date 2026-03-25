const { PeerServer } = require('peer');

function toInt(value, fallback) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 65535) {
        return fallback;
    }
    return parsed;
}

function normalizePath(pathValue) {
    const raw = typeof pathValue === 'string' ? pathValue.trim() : '';
    if (!raw) return '/peerjs';
    return raw.startsWith('/') ? raw : `/${raw}`;
}

function clientIdFromEvent(client) {
    if (!client) return 'unknown';
    if (typeof client.getId === 'function') return client.getId();
    if (typeof client.id === 'string') return client.id;
    return 'unknown';
}

const host = process.env.PEER_HOST || '0.0.0.0';
const port = toInt(process.env.PEER_PORT || process.env.PORT, 9000);
const path = normalizePath(process.env.PEER_PATH || '/peerjs');
const key = process.env.PEER_KEY || 'peerjs';
const allowDiscovery = String(process.env.PEER_DISCOVERY || 'false').toLowerCase() === 'true';

const peerServer = PeerServer({
    host,
    port,
    path,
    key,
    proxied: true,
    allow_discovery: allowDiscovery,
});

console.log(`[PeerServer] listening on http://${host}:${port}${path}`);
console.log(`[PeerServer] key=${key} discovery=${allowDiscovery ? 'on' : 'off'}`);

peerServer.on('connection', (client) => {
    console.log(`[PeerServer] connected: ${clientIdFromEvent(client)}`);
});

peerServer.on('disconnect', (client) => {
    console.log(`[PeerServer] disconnected: ${clientIdFromEvent(client)}`);
});

peerServer.on('error', (err) => {
    console.error('[PeerServer] error:', err && err.message ? err.message : err);
});

const shutdown = () => {
    console.log('[PeerServer] shutting down');
    try {
        if (peerServer && typeof peerServer.close === 'function') {
            peerServer.close(() => process.exit(0));
            return;
        }
    } catch (err) {
        console.error('[PeerServer] shutdown error:', err && err.message ? err.message : err);
    }
    process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
