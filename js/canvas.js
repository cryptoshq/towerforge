// ===== CANVAS SETUP & DYNAMIC SCALING =====
// The game uses a logical coordinate system based on CONFIG.TILE_SIZE (40px per tile).
// A render scale transform is applied to fill the screen while maintaining aspect ratio.
// All game logic operates in logical coordinates. Only rendering and input convert.

let canvas, ctx;
let canvasWidth, canvasHeight;
let renderScale = 1;
let gridOffsetX = 0;
let gridOffsetY = 0;
let logicalWidth = 0;
let logicalHeight = 0;

// Off-screen buffers for performance
let bgBuffer = null;
let bgBufferCtx = null;
let bgDirty = true;

// Pixi bridge state (phase-0 migration path)
let renderBackend = null;
let canvasBridgeLower = null;
let canvasBridgeUpper = null;
let usingPixiBridge = false;

// Native Pixi map layer (phase-1 extraction)
let pixiMapCanvas = null;
let pixiMapCtx = null;
let pixiMapTexture = null;
let pixiMapSprite = null;
let pixiMapReady = false;
let pixiMapIndex = -1;
let pixiMapResolution = 1;

// Native Pixi particle layer (phase-2 scaffold)
let pixiParticleLayer = null;
let pixiParticleReady = false;
let pixiParticlesEnabled = false;
let bridgeResolution = 1;

// Debounce resize to avoid excessive recalculation
let resizeTimeout = null;
let resizeListenerBound = false;

async function initCanvas() {
    canvas = document.getElementById('game-canvas');
    if (!canvas) {
        throw new Error('Canvas element #game-canvas not found');
    }

    pixiParticlesEnabled = !(typeof window !== 'undefined' && window.__towerforgeDisablePixiParticles === true);

    _computeCanvasMetrics();
    bridgeResolution = _computeBridgeResolution();

    const pixiReady = await _tryInitPixiBridge();
    if (!pixiReady) {
        _initCanvas2DContext();
    }

    _ensureBackgroundBuffers();
    _syncBackgroundBufferSize();

    if (!resizeListenerBound) {
        window.addEventListener('resize', debounceResize);
        resizeListenerBound = true;
    }
}

function _computeCanvasMetrics() {
    const sidebarW = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sidebar-w')) || 220;
    const hudH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--hud-h')) || 52;

    canvasWidth = window.innerWidth - sidebarW;
    canvasHeight = window.innerHeight - hudH;

    // Ensure minimum size
    canvasWidth = Math.max(canvasWidth, 400);
    canvasHeight = Math.max(canvasHeight, 300);

    // Calculate logical game area in base coordinates
    logicalWidth = CONFIG.CANVAS_TILES_X * CONFIG.TILE_SIZE;
    logicalHeight = CONFIG.CANVAS_TILES_Y * CONFIG.TILE_SIZE;

    // Calculate render scale to FILL canvas (no black bars)
    // Using Math.max means the game area covers the entire canvas,
    // with some edges potentially clipped rather than showing black bars
    const scaleX = canvasWidth / logicalWidth;
    const scaleY = canvasHeight / logicalHeight;
    renderScale = Math.max(scaleX, scaleY);

    // Center the game area in the canvas (negative offsets clip edges evenly)
    gridOffsetX = Math.floor((canvasWidth - logicalWidth * renderScale) / 2);
    gridOffsetY = Math.floor((canvasHeight - logicalHeight * renderScale) / 2);
}

function _computeBridgeResolution() {
    const scaleFactor = Number.isFinite(renderScale) ? renderScale : 1;
    // Increase backing resolution when world is upscaled to reduce blur
    // while keeping memory bounded.
    return Math.max(1, Math.min(2.25, scaleFactor));
}

function _initCanvas2DContext() {
    usingPixiBridge = false;
    renderBackend = null;
    canvasBridgeLower = null;
    canvasBridgeUpper = null;
    _resetPixiMapLayer();
    _resetPixiParticleLayer();

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;

    ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Failed to acquire 2D canvas context');
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
}

function _ensureBackgroundBuffers() {
    if (!bgBuffer) {
        bgBuffer = document.createElement('canvas');
    }
    if (!bgBufferCtx) {
        bgBufferCtx = bgBuffer.getContext('2d');
    }
}

function _syncBackgroundBufferSize() {
    if (!bgBuffer) return;
    bgBuffer.width = canvasWidth;
    bgBuffer.height = canvasHeight;
    bgDirty = true;
}

function _resetPixiMapLayer() {
    if (pixiMapSprite && pixiMapSprite.parent) {
        pixiMapSprite.parent.removeChild(pixiMapSprite);
    }
    if (pixiMapSprite && typeof pixiMapSprite.destroy === 'function') {
        pixiMapSprite.destroy();
    }
    if (pixiMapTexture && typeof pixiMapTexture.destroy === 'function') {
        pixiMapTexture.destroy(true);
    }
    pixiMapSprite = null;
    pixiMapTexture = null;
    pixiMapCanvas = null;
    pixiMapCtx = null;
    pixiMapReady = false;
    pixiMapIndex = -1;
    pixiMapResolution = 1;
}

function _resetPixiParticleLayer() {
    if (pixiParticleLayer && typeof pixiParticleLayer.destroy === 'function') {
        pixiParticleLayer.destroy();
    }
    pixiParticleLayer = null;
    pixiParticleReady = false;
}

function _readScreenEffectsForMapTransform() {
    let zoom = 1;
    let zoomCenterX = logicalWidth / 2;
    let zoomCenterY = logicalHeight / 2;
    let totalShakeX = 0;
    let totalShakeY = 0;

    if (typeof ScreenEffects !== 'undefined') {
        if (Number.isFinite(ScreenEffects.cameraZoom)) {
            zoom = ScreenEffects.cameraZoom;
        }
        if (zoom !== 1.0) {
            zoomCenterX = ScreenEffects.cameraZoomCenterX || logicalWidth / 2;
            zoomCenterY = ScreenEffects.cameraZoomCenterY || logicalHeight / 2;
        }
        if (Number.isFinite(ScreenEffects.shakeX)) totalShakeX += ScreenEffects.shakeX;
        if (Number.isFinite(ScreenEffects.shakeY)) totalShakeY += ScreenEffects.shakeY;
    }

    if (typeof shakeX !== 'undefined' && Number.isFinite(shakeX)) totalShakeX += shakeX;
    if (typeof shakeY !== 'undefined' && Number.isFinite(shakeY)) totalShakeY += shakeY;

    return {
        zoom,
        zoomCenterX,
        zoomCenterY,
        shakeX: totalShakeX,
        shakeY: totalShakeY,
    };
}

function _ensurePixiParticleLayer() {
    if (!pixiParticlesEnabled) return false;
    if (!usingPixiBridge || !renderBackend || !canvasBridgeLower) return false;
    if (pixiParticleReady && pixiParticleLayer) return true;

    const renderingRuntime = (typeof window !== 'undefined') ? window.TowerForgeRendering : null;
    if (!renderingRuntime || typeof renderingRuntime.PixiParticleLayer !== 'function') {
        return false;
    }

    try {
        pixiParticleLayer = new renderingRuntime.PixiParticleLayer(renderBackend);
        pixiParticleReady = !!pixiParticleLayer.init();
    } catch (error) {
        console.warn('[TowerForge] Failed to initialize Pixi particle layer:', error);
        pixiParticleReady = false;
        pixiParticleLayer = null;
    }

    return pixiParticleReady;
}

function syncPixiWorldTransform() {
    if (!usingPixiBridge || !renderBackend || typeof renderBackend.applyWorldTransform !== 'function') {
        return false;
    }

    const fx = _readScreenEffectsForMapTransform();
    renderBackend.applyWorldTransform(
        gridOffsetX,
        gridOffsetY,
        renderScale,
        fx.shakeX,
        fx.shakeY,
        fx.zoom,
        fx.zoomCenterX,
        fx.zoomCenterY
    );
    return true;
}

function _rebuildPixiMapLayer() {
    if (!usingPixiBridge || !renderBackend || typeof window === 'undefined' || !window.PIXI) {
        pixiMapReady = false;
        return false;
    }
    if (typeof MapSystem === 'undefined' || !MAPS[GameState.mapIndex]) {
        pixiMapReady = false;
        return false;
    }

    const mapW = Math.max(1, Math.floor(logicalWidth));
    const mapH = Math.max(1, Math.floor(logicalHeight));
    const mapResolution = bridgeResolution;
    const backingW = Math.max(1, Math.floor(mapW * mapResolution));
    const backingH = Math.max(1, Math.floor(mapH * mapResolution));
    if (!pixiMapCanvas) {
        pixiMapCanvas = document.createElement('canvas');
        pixiMapCtx = pixiMapCanvas.getContext('2d');
    }

    const sizeChanged = pixiMapCanvas.width !== backingW || pixiMapCanvas.height !== backingH;
    const resolutionChanged = Math.abs(pixiMapResolution - mapResolution) > 0.001;
    if (sizeChanged || resolutionChanged) {
        pixiMapCanvas.width = backingW;
        pixiMapCanvas.height = backingH;
        if (typeof pixiMapCtx.setTransform === 'function') {
            pixiMapCtx.setTransform(mapResolution, 0, 0, mapResolution, 0, 0);
        }
    }

    pixiMapResolution = mapResolution;

    pixiMapCtx.clearRect(0, 0, mapW, mapH);
    if (typeof MapSystem.drawStatic === 'function') {
        MapSystem.drawStatic(pixiMapCtx);
    } else {
        MapSystem.draw(pixiMapCtx);
    }

    const Texture = window.PIXI.Texture;
    const Sprite = window.PIXI.Sprite;
    if (!Texture || !Sprite) {
        pixiMapReady = false;
        return false;
    }

    if (!pixiMapTexture || sizeChanged || resolutionChanged) {
        if (pixiMapTexture && typeof pixiMapTexture.destroy === 'function') {
            pixiMapTexture.destroy(true);
        }
        pixiMapTexture = Texture.from(pixiMapCanvas);
    } else {
        const source = pixiMapTexture.source;
        if (source && typeof source.update === 'function') {
            source.update();
        } else {
            pixiMapTexture = Texture.from(pixiMapCanvas);
        }
    }

    if (!pixiMapSprite) {
        pixiMapSprite = new Sprite(pixiMapTexture);
        pixiMapSprite.zIndex = 0;
        pixiMapSprite.position.set(0, 0);
        const inv = 1 / mapResolution;
        pixiMapSprite.scale.set(inv, inv);
    } else {
        pixiMapSprite.texture = pixiMapTexture;
        if (resolutionChanged) {
            const inv = 1 / mapResolution;
            pixiMapSprite.scale.set(inv, inv);
        }
    }

    const mapLayer = renderBackend.getLayer('map') || renderBackend.getStage();
    if (mapLayer && pixiMapSprite.parent !== mapLayer) {
        if (pixiMapSprite.parent) pixiMapSprite.parent.removeChild(pixiMapSprite);
        mapLayer.addChildAt(pixiMapSprite, 0);
    }

    pixiMapIndex = GameState.mapIndex;
    pixiMapReady = true;
    bgDirty = false;
    syncPixiWorldTransform();
    return true;
}

async function _tryInitPixiBridge() {
    if (typeof window === 'undefined' || typeof window.WebGLRenderingContext === 'undefined') {
        return false;
    }

    if (!window.PIXI || !window.PIXI.Application) {
        return false;
    }

    const renderingRuntime = window.TowerForgeRendering;
    if (!renderingRuntime || typeof renderingRuntime.PixiBackend !== 'function' || typeof renderingRuntime.CanvasBridge !== 'function') {
        console.warn('[TowerForge] TowerForgeRendering runtime is missing; falling back to Canvas 2D');
        return false;
    }

    try {
        const { PixiBackend, CanvasBridge } = renderingRuntime;

        const backend = new PixiBackend();
        await backend.init(canvas.parentElement || document.body, {
            canvas,
            width: canvasWidth,
            height: canvasHeight,
            antialias: true,
            preference: 'webgl',
        });

        const lowerBridge = new CanvasBridge(logicalWidth, logicalHeight, { resolution: bridgeResolution });
        const upperBridge = new CanvasBridge(logicalWidth, logicalHeight, { resolution: bridgeResolution });

        const lowerLayer = backend.getLayer('vfx') || backend.getStage();
        const upperLayer = backend.getLayer('juice') || backend.getStage();
        if (lowerLayer && typeof lowerLayer.addChild === 'function') {
            const lowerSprite = lowerBridge.getSprite();
            lowerSprite.zIndex = 0;
            lowerLayer.addChild(lowerSprite);
        }
        if (upperLayer && typeof upperLayer.addChild === 'function') {
            const upperSprite = upperBridge.getSprite();
            upperSprite.zIndex = 2;
            upperLayer.addChild(upperSprite);
        }

        renderBackend = backend;
        canvasBridgeLower = lowerBridge;
        canvasBridgeUpper = upperBridge;
        usingPixiBridge = true;
        _resetPixiParticleLayer();

        ctx = lowerBridge.getContext();
        if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
        }

        canvas.style.width = `${canvasWidth}px`;
        canvas.style.height = `${canvasHeight}px`;

        return true;
    } catch (error) {
        console.warn('[TowerForge] Pixi bridge init failed, falling back to Canvas 2D:', error);
        if (renderBackend && typeof renderBackend.destroy === 'function') {
            renderBackend.destroy();
        }
        renderBackend = null;
        canvasBridgeLower = null;
        canvasBridgeUpper = null;
        usingPixiBridge = false;
        _resetPixiMapLayer();
        _resetPixiParticleLayer();
        return false;
    }
}

function debounceResize() {
    if (resizeTimeout) clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        resizeCanvas();
        bgDirty = true; // Force background redraw
    }, 50);
}

function resizeCanvas() {
    if (!canvas) return;

    _computeCanvasMetrics();
    bridgeResolution = _computeBridgeResolution();

    if (usingPixiBridge && renderBackend && canvasBridgeLower && canvasBridgeUpper) {
        if (typeof renderBackend.resize === 'function') {
            renderBackend.resize(canvasWidth, canvasHeight);
        }
        if (typeof canvasBridgeLower.resize === 'function') {
            canvasBridgeLower.resize(logicalWidth, logicalHeight, bridgeResolution);
            ctx = canvasBridgeLower.getContext();
        }
        if (typeof canvasBridgeUpper.resize === 'function') {
            canvasBridgeUpper.resize(logicalWidth, logicalHeight, bridgeResolution);
        }
        syncPixiWorldTransform();
        canvas.style.width = `${canvasWidth}px`;
        canvas.style.height = `${canvasHeight}px`;
    } else {
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        canvas.style.width = `${canvasWidth}px`;
        canvas.style.height = `${canvasHeight}px`;
        if (!ctx) {
            ctx = canvas.getContext('2d');
        }
    }

    _syncBackgroundBufferSize();
}

function isPixiBridgeActive() {
    return !!(usingPixiBridge && renderBackend && canvasBridgeLower && canvasBridgeUpper);
}

function getRenderBackend() {
    return renderBackend;
}

function getCanvasBridge() {
    return canvasBridgeLower;
}

function getCanvasBridgeLower() {
    return canvasBridgeLower;
}

function getCanvasBridgeUpper() {
    return canvasBridgeUpper;
}

function syncPixiMapLayer() {
    if (!usingPixiBridge || !renderBackend || !canvasBridgeLower || !canvasBridgeUpper) return false;

    const needRebuild = !!bgDirty
        || !pixiMapReady
        || pixiMapIndex !== GameState.mapIndex
        || !pixiMapSprite;

    if (needRebuild) {
        return _rebuildPixiMapLayer();
    }

    syncPixiWorldTransform();
    return true;
}

function hasPixiMapLayer() {
    return !!(usingPixiBridge && pixiMapReady && pixiMapSprite);
}

function syncPixiParticleLayer() {
    if (!_ensurePixiParticleLayer()) return false;
    if (!pixiParticleLayer || typeof pixiParticleLayer.sync !== 'function') return false;
    pixiParticleLayer.sync(GameState.particles);
    return true;
}

function hasPixiParticleLayer() {
    return !!(pixiParticleReady && pixiParticleLayer);
}

// Convert screen (pixel) coordinates to logical game coordinates
function screenToLogical(screenX, screenY) {
    return {
        x: (screenX - gridOffsetX) / renderScale,
        y: (screenY - gridOffsetY) / renderScale,
    };
}

// Convert logical game coordinates to screen (pixel) coordinates
function logicalToScreen(logX, logY) {
    return {
        x: logX * renderScale + gridOffsetX,
        y: logY * renderScale + gridOffsetY,
    };
}

// Apply the rendering transform to the context
function applyRenderTransform(context) {
    context.translate(gridOffsetX, gridOffsetY);
    context.scale(renderScale, renderScale);
}

// Get the current tile size in screen pixels (for UI elements)
function getScreenTileSize() {
    return CONFIG.TILE_SIZE * renderScale;
}

// Check if a screen point is within the game grid
function isInGameArea(screenX, screenY) {
    const logical = screenToLogical(screenX, screenY);
    return logical.x >= 0 && logical.x < logicalWidth
        && logical.y >= 0 && logical.y < logicalHeight;
}
