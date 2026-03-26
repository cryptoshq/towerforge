export class CanvasBridge {
    constructor(width, height) {
        const runtime = (typeof window !== 'undefined' && window.PIXI)
            ? window.PIXI
            : (typeof globalThis !== 'undefined' ? globalThis.PIXI : null);
        if (!runtime || !runtime.Sprite || !runtime.Texture) {
            throw new Error('PIXI runtime not available on window.PIXI');
        }

        const { Sprite, Texture } = runtime;
        this.TextureClass = Texture;
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = Math.max(1, Math.floor(width || 1));
        this.canvas.height = Math.max(1, Math.floor(height || 1));

        this.texture = Texture.from(this.canvas);
        this.sprite = new Sprite(this.texture);
        this.sprite.zIndex = 0;
    }

    getContext() {
        return this.ctx;
    }

    getSprite() {
        return this.sprite;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    updateTexture() {
        if (!this.texture) return;
        const source = this.texture.source;
        if (source && typeof source.update === 'function') {
            source.update();
            return;
        }

        this.texture = this.TextureClass.from(this.canvas);
        this.sprite.texture = this.texture;
    }

    resize(width, height) {
        const w = Math.max(1, Math.floor(width || 1));
        const h = Math.max(1, Math.floor(height || 1));
        if (this.canvas.width === w && this.canvas.height === h) return;

        this.canvas.width = w;
        this.canvas.height = h;
        this.texture = this.TextureClass.from(this.canvas);
        this.sprite.texture = this.texture;
    }
}
