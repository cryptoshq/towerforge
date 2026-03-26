import { RenderBackend } from './RenderBackend.js';

const DEFAULT_LAYER_DEFS = [
    { name: 'map', zIndex: 10 },
    { name: 'synergy', zIndex: 20 },
    { name: 'towerPolish', zIndex: 25 },
    { name: 'towerRange', zIndex: 30 },
    { name: 'towers', zIndex: 40 },
    { name: 'towerOverlay', zIndex: 45 },
    { name: 'enemies', zIndex: 50 },
    { name: 'vfx', zIndex: 60 },
    { name: 'juice', zIndex: 65 },
    { name: 'canvasUI', zIndex: 70 },
    { name: 'screenFlash', zIndex: 80 },
    { name: 'bossIntro', zIndex: 90 },
];

export class PixiBackend extends RenderBackend {
    constructor() {
        super();
        this.app = null;
        this.layers = Object.create(null);
        this.worldContainer = null;
        this.screenContainer = null;
        this.ContainerClass = null;
    }

    async init(parentElement, options = {}) {
        if (!parentElement) {
            throw new Error('PixiBackend.init requires a parent element');
        }

        const runtime = (typeof window !== 'undefined' && window.PIXI)
            ? window.PIXI
            : (typeof globalThis !== 'undefined' ? globalThis.PIXI : null);
        if (!runtime || !runtime.Application || !runtime.Container) {
            throw new Error('PIXI runtime not available on window.PIXI');
        }

        const { Application, Container } = runtime;
        this.ContainerClass = Container;

        this.app = new Application();
        const initOptions = {
            width: Math.max(1, Math.floor(options.width || 1)),
            height: Math.max(1, Math.floor(options.height || 1)),
            backgroundColor: options.backgroundColor || 0x101020,
            antialias: options.antialias !== false,
            resolution: options.resolution || (typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1),
            autoDensity: options.autoDensity !== false,
            preference: options.preference || 'webgl',
            powerPreference: options.powerPreference || 'high-performance',
            autoStart: false,
            sharedTicker: false,
        };

        if (options.canvas) {
            initOptions.canvas = options.canvas;
            initOptions.view = options.canvas;
        }

        await this.app.init(initOptions);

        const view = this.app.canvas || this.app.view;
        if (!view) {
            throw new Error('Pixi backend failed to create a canvas view');
        }

        if (view.parentElement !== parentElement) {
            parentElement.appendChild(view);
        }

        this.app.stage.sortableChildren = true;

        this.worldContainer = new Container();
        this.worldContainer.sortableChildren = true;
        this.worldContainer.zIndex = 10;
        this.app.stage.addChild(this.worldContainer);

        this.screenContainer = new Container();
        this.screenContainer.sortableChildren = true;
        this.screenContainer.zIndex = 20;
        this.app.stage.addChild(this.screenContainer);

        this._initLayers(options.layerDefs || DEFAULT_LAYER_DEFS);
        return this;
    }

    _initLayers(layerDefs) {
        const Container = this.ContainerClass;
        if (!Container) return;
        this.layers = Object.create(null);
        for (const def of layerDefs) {
            const layer = new Container();
            layer.sortableChildren = true;
            layer.zIndex = Number.isFinite(def.zIndex) ? def.zIndex : 0;
            this.worldContainer.addChild(layer);
            this.layers[def.name] = layer;
        }
    }

    resize(width, height) {
        if (!this.app || !this.app.renderer) return;
        this.app.renderer.resize(Math.max(1, Math.floor(width)), Math.max(1, Math.floor(height)));
    }

    applyWorldTransform(gridOffsetX, gridOffsetY, renderScale, shakeX = 0, shakeY = 0, cameraZoom = 1.0, zoomCenterX = 0, zoomCenterY = 0) {
        if (!this.worldContainer) return;

        const zoom = Number.isFinite(cameraZoom) ? cameraZoom : 1.0;
        const baseScale = Number.isFinite(renderScale) ? renderScale : 1;
        const scale = baseScale * zoom;

        if (zoom !== 1.0) {
            this.worldContainer.pivot.set(zoomCenterX, zoomCenterY);
            this.worldContainer.position.set(
                gridOffsetX + shakeX + zoomCenterX * scale,
                gridOffsetY + shakeY + zoomCenterY * scale
            );
        } else {
            this.worldContainer.pivot.set(0, 0);
            this.worldContainer.position.set(gridOffsetX + shakeX, gridOffsetY + shakeY);
        }

        this.worldContainer.scale.set(scale);
    }

    getStage() {
        return this.app ? this.app.stage : null;
    }

    getRenderer() {
        return this.app ? this.app.renderer : null;
    }

    getLayer(name) {
        return this.layers[name] || null;
    }

    render() {
        if (!this.app || !this.app.renderer) return;
        if (typeof this.app.render === 'function') {
            this.app.render();
            return;
        }
        this.app.renderer.render({ container: this.app.stage });
    }

    destroy() {
        if (!this.app) return;
        this.app.destroy(true);
        this.app = null;
        this.worldContainer = null;
        this.screenContainer = null;
        this.ContainerClass = null;
        this.layers = Object.create(null);
    }
}
