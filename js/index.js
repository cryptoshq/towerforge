import { installDebugHotkeyBootstrap } from './debugBootstrap.js';

const MODULE_URL = new URL(import.meta.url);
const APP_BASE_URL = new URL('..', new URL('.', MODULE_URL));

const LEGACY_BOOT_SCRIPTS_PRE_WAVE_MODULE = [
    'js/vendor/pixi.min.js',
    'js/utils.js',
    'js/lazyLoader.js',
    'js/gameState.js',
    'js/progression.js',
    'js/rendering/runtime.js',
    'js/canvas.js',
    'js/audio.js',
    'js/effects.js',
    'js/map.js',
    'js/enemy.js',
    'js/projectile.js',
    'js/tower.js',
];

const LEGACY_BOOT_SCRIPTS_POST_WAVE_PRE_MENU_MODULE = [
    'js/abilities.js',
    'js/synergy.js',
    'js/research.js',
    'js/achievements.js',
    'js/leaderboard.js',
    'js/save.js',
    'js/towerIcons.js',
    'js/towerRendering.js',
    'js/enemyRendering.js',
    'js/vfxRendering.js',
    'js/uiRendering.js',
    'js/input.js',
    'js/juiceFeatures.js',
    'js/towerPolish.js',
];

const LEGACY_BOOT_SCRIPTS_POST_MENU_MODULE = [
    'js/tutorial.js',
    'js/main.js',
];

const legacyScriptPromises = new Map();

function normalizePath(path) {
    if (typeof path !== 'string') {
        throw new Error('Legacy script path must be a string');
    }
    const trimmed = path.trim();
    if (!trimmed) {
        throw new Error('Legacy script path cannot be empty');
    }
    return trimmed;
}

function resolveRuntimeUrl(path) {
    const normalizedPath = normalizePath(path);
    return new URL(normalizedPath, APP_BASE_URL).href;
}

function loadLegacyScript(path) {
    const resolvedUrl = resolveRuntimeUrl(path);
    if (legacyScriptPromises.has(resolvedUrl)) {
        return legacyScriptPromises.get(resolvedUrl);
    }

    const loadPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = resolvedUrl;
        script.async = false;
        script.defer = false;
        script.onload = () => resolve();
        script.onerror = () => {
            legacyScriptPromises.delete(resolvedUrl);
            reject(new Error(`Failed to load legacy runtime script: ${resolvedUrl}`));
        };
        document.body.appendChild(script);
    });

    legacyScriptPromises.set(resolvedUrl, loadPromise);
    return loadPromise;
}

async function bootLegacyRuntime() {
    for (const scriptPath of LEGACY_BOOT_SCRIPTS_PRE_WAVE_MODULE) {
        await loadLegacyScript(scriptPath);
    }

    const { installLegacyWaveGlobals } = await import('./wave.js');
    if (typeof installLegacyWaveGlobals === 'function') {
        installLegacyWaveGlobals(globalThis);
    }

    for (const scriptPath of LEGACY_BOOT_SCRIPTS_POST_WAVE_PRE_MENU_MODULE) {
        await loadLegacyScript(scriptPath);
    }

    const { installLegacyMenuGlobals } = await import('./menu.js');
    if (typeof installLegacyMenuGlobals === 'function') {
        installLegacyMenuGlobals(globalThis);
    }

    for (const scriptPath of LEGACY_BOOT_SCRIPTS_POST_MENU_MODULE) {
        await loadLegacyScript(scriptPath);
    }
}

globalThis.TowerForgeLegacyLoader = Object.freeze({
    loadLegacyScript,
    resolveRuntimeUrl,
    baseUrl: APP_BASE_URL.href,
});
globalThis.TowerForgeAppBaseUrl = APP_BASE_URL.href;

const { installLegacyConfigGlobals } = await import('./config.js');
installLegacyConfigGlobals(globalThis);
installDebugHotkeyBootstrap(loadLegacyScript, { scriptPath: 'js/debug.js' });

await bootLegacyRuntime();
