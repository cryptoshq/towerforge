export function installDebugHotkeyBootstrap(loadLegacyScript, options = {}) {
    if (typeof loadLegacyScript !== 'function') {
        throw new Error('installDebugHotkeyBootstrap requires a script loader function');
    }

    const debugScriptPath = typeof options.scriptPath === 'string' && options.scriptPath
        ? options.scriptPath
        : 'js/debug.js';

    let isLoading = false;
    let isReady = false;

    const shouldToggleDebug = (event) => {
        if (!event || event.repeat) return false;
        const code = event.code || '';
        return code === 'Backquote' || code === 'F12';
    };

    const removeBootstrapListener = () => {
        document.removeEventListener('keydown', onKeydown, true);
    };

    const resolveDebugPanel = () => {
        if (typeof globalThis.DebugPanel !== 'undefined') {
            return globalThis.DebugPanel;
        }
        return null;
    };

    const ensureRuntime = async () => {
        if (isReady && resolveDebugPanel()) {
            return resolveDebugPanel();
        }
        if (isLoading) {
            return null;
        }

        isLoading = true;
        try {
            await loadLegacyScript(debugScriptPath);
            const panel = resolveDebugPanel();
            if (panel && typeof panel.init === 'function') {
                panel.init();
            }
            isReady = !!panel;
            if (isReady) {
                removeBootstrapListener();
            }
            return panel;
        } catch (error) {
            console.error('[TowerForge] Failed to load debug runtime:', error);
            return null;
        } finally {
            isLoading = false;
        }
    };

    const toggleDebugPanel = async () => {
        const panel = await ensureRuntime();
        if (panel && typeof panel.toggle === 'function') {
            panel.toggle();
        }
    };

    const onKeydown = async (event) => {
        if (!shouldToggleDebug(event)) return;
        event.preventDefault();
        await toggleDebugPanel();
    };

    document.addEventListener('keydown', onKeydown, true);

    globalThis.TowerForgeDebugTools = Object.freeze({
        ensureRuntime,
        toggleDebugPanel,
    });
}
