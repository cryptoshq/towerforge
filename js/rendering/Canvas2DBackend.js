import { RenderBackend } from './RenderBackend.js';

export class Canvas2DBackend extends RenderBackend {
    constructor() {
        super();
        this.canvas = null;
        this.ctx = null;
    }

    async init(canvasElement) {
        if (!canvasElement) {
            throw new Error('Canvas2DBackend.init requires a canvas element');
        }

        this.canvas = canvasElement;
        this.ctx = canvasElement.getContext('2d');
        return this;
    }

    resize(width, height) {
        if (!this.canvas) return;
        this.canvas.width = Math.max(1, Math.floor(width));
        this.canvas.height = Math.max(1, Math.floor(height));
    }

    getContext() {
        return this.ctx;
    }

    getRenderer() {
        return this.ctx;
    }

    destroy() {
        this.canvas = null;
        this.ctx = null;
    }
}
