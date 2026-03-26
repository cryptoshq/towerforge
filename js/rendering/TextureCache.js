export class TextureCache {
    constructor(renderer) {
        this.renderer = renderer;
        this.cache = new Map();
        this.canvasPool = [];
        const runtime = (typeof window !== 'undefined' && window.PIXI)
            ? window.PIXI
            : (typeof globalThis !== 'undefined' ? globalThis.PIXI : null);
        this.TextureClass = runtime && runtime.Texture ? runtime.Texture : null;
    }

    fromCanvasDraw(key, width, height, drawFn) {
        if (this.cache.has(key)) return this.cache.get(key);

        const canvas = this._acquireCanvas(width, height);
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawFn(ctx, canvas.width, canvas.height);

        if (!this.TextureClass) {
            throw new Error('PIXI runtime not available for TextureCache');
        }
        const texture = this.TextureClass.from(canvas);
        this.cache.set(key, texture);
        return texture;
    }

    fromGraphics(key, graphics) {
        if (this.cache.has(key)) return this.cache.get(key);
        if (!this.renderer || typeof this.renderer.generateTexture !== 'function') {
            throw new Error('TextureCache.fromGraphics requires a Pixi renderer with generateTexture()');
        }

        const texture = this.renderer.generateTexture(graphics);
        this.cache.set(key, texture);
        return texture;
    }

    invalidate(prefix = '') {
        const keyPrefix = String(prefix || '');
        for (const [key, texture] of this.cache.entries()) {
            if (!key.startsWith(keyPrefix)) continue;
            if (texture && typeof texture.destroy === 'function') {
                texture.destroy(true);
            }
            this.cache.delete(key);
        }
    }

    clear() {
        for (const texture of this.cache.values()) {
            if (texture && typeof texture.destroy === 'function') {
                texture.destroy(true);
            }
        }
        this.cache.clear();
    }

    _acquireCanvas(width, height) {
        const w = Math.max(1, Math.floor(width || 1));
        const h = Math.max(1, Math.floor(height || 1));
        const canvas = this.canvasPool.pop() || document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        return canvas;
    }
}
