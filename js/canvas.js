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

function initCanvas() {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Create background buffer
    bgBuffer = document.createElement('canvas');
    bgBufferCtx = bgBuffer.getContext('2d');

    resizeCanvas();
    window.addEventListener('resize', debounceResize);
}

// Debounce resize to avoid excessive recalculation
let resizeTimeout = null;
function debounceResize() {
    if (resizeTimeout) clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        resizeCanvas();
        bgDirty = true; // Force background redraw
    }, 50);
}

function resizeCanvas() {
    const sidebarW = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sidebar-w')) || 220;
    const hudH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--hud-h')) || 52;

    canvasWidth = window.innerWidth - sidebarW;
    canvasHeight = window.innerHeight - hudH;

    // Ensure minimum size
    canvasWidth = Math.max(canvasWidth, 400);
    canvasHeight = Math.max(canvasHeight, 300);

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    canvas.style.width = canvasWidth + 'px';
    canvas.style.height = canvasHeight + 'px';

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

    // Resize background buffer to match canvas
    bgBuffer.width = canvasWidth;
    bgBuffer.height = canvasHeight;
    bgDirty = true;
}

// Convert screen (pixel) coordinates to logical game coordinates
function screenToLogical(screenX, screenY) {
    return {
        x: (screenX - gridOffsetX) / renderScale,
        y: (screenY - gridOffsetY) / renderScale
    };
}

// Convert logical game coordinates to screen (pixel) coordinates
function logicalToScreen(logX, logY) {
    return {
        x: logX * renderScale + gridOffsetX,
        y: logY * renderScale + gridOffsetY
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
    return logical.x >= 0 && logical.x < logicalWidth &&
           logical.y >= 0 && logical.y < logicalHeight;
}
