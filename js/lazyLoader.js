(function initTowerForgeLazyLoader(globalScope) {
    const scriptPromises = new Map();
    const multiplayerVersionTag = '20260325e';
    let multiplayerStackPromise = null;

    function getBaseUrl() {
        const candidate = typeof globalScope.TowerForgeAppBaseUrl === 'string'
            ? globalScope.TowerForgeAppBaseUrl
            : document.baseURI;
        try {
            return new URL(candidate, document.baseURI).href;
        } catch (_) {
            return document.baseURI;
        }
    }

    function resolveScriptUrl(path) {
        const trimmed = path.trim();
        return new URL(trimmed, getBaseUrl()).href;
    }

    function withVersion(path, versionTag) {
        if (!versionTag) return path;
        const separator = path.includes('?') ? '&' : '?';
        return `${path}${separator}v=${encodeURIComponent(versionTag)}`;
    }

    function loadScript(src) {
        if (typeof src !== 'string' || !src.trim()) {
            return Promise.reject(new Error('TowerForgeLazyLoader.loadScript requires a non-empty src'));
        }

        const key = resolveScriptUrl(src);
        if (scriptPromises.has(key)) {
            return scriptPromises.get(key);
        }

        const promise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = key;
            script.async = false;
            script.defer = false;
            script.onload = () => resolve();
            script.onerror = () => {
                scriptPromises.delete(key);
                reject(new Error(`Failed to load script: ${key}`));
            };
            document.body.appendChild(script);
        });

        scriptPromises.set(key, promise);
        return promise;
    }

    function isMultiplayerReady() {
        return typeof globalScope.Multiplayer !== 'undefined'
            && typeof globalScope.MultiplayerUI !== 'undefined';
    }

    async function ensureMultiplayerStack() {
        if (isMultiplayerReady()) {
            return;
        }

        if (multiplayerStackPromise) {
            return multiplayerStackPromise;
        }

        multiplayerStackPromise = (async () => {
            await loadScript(withVersion('js/vendor/peerjs.min.js', multiplayerVersionTag));
            await loadScript(withVersion('js/multiplayer.js', multiplayerVersionTag));
            await loadScript(withVersion('js/multiplayerUI.js', multiplayerVersionTag));
        })();

        try {
            await multiplayerStackPromise;
        } catch (error) {
            multiplayerStackPromise = null;
            throw error;
        }
    }

    globalScope.TowerForgeLazyLoader = Object.freeze({
        loadScript,
        ensureMultiplayerStack,
        isMultiplayerReady,
    });
})(window);
