(function initTowerForgeRenderingRuntime(globalScope) {
    class PixiBackend {
        constructor() {
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

            const runtime = globalScope.PIXI;
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
                resolution: options.resolution || (globalScope.devicePixelRatio || 1),
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

            this._initLayers(options.layerDefs || [
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
            ]);

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

            this.worldContainer.scale.set(scale, scale);
        }

        getStage() {
            return this.app ? this.app.stage : null;
        }

        getLayer(name) {
            return this.layers[name] || null;
        }

        render() {
            if (!this.app || !this.app.renderer) return;
            if (typeof this.app.render === 'function') {
                this.app.render();
            } else {
                this.app.renderer.render({ container: this.app.stage });
            }
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

    class CanvasBridge {
        constructor(width, height, options = {}) {
            const runtime = globalScope.PIXI;
            if (!runtime || !runtime.Sprite || !runtime.Texture) {
                throw new Error('PIXI runtime not available on window.PIXI');
            }

            const { Sprite, Texture } = runtime;
            this.TextureClass = Texture;
            this.logicalWidth = Math.max(1, Math.floor(width || 1));
            this.logicalHeight = Math.max(1, Math.floor(height || 1));
            this.resolution = this._normalizeResolution(options.resolution);
            this.canvas = globalScope.document.createElement('canvas');
            this.ctx = this.canvas.getContext('2d');
            this._resizeBackingStore();
            this._applyContextTransform();

            this.texture = Texture.from(this.canvas);
            this.sprite = new Sprite(this.texture);
            this.sprite.zIndex = 0;
            this._applySpriteScale();
        }

        _normalizeResolution(value) {
            const n = Number(value);
            if (!Number.isFinite(n) || n <= 0) return 1;
            return Math.max(1, Math.min(3, n));
        }

        _resizeBackingStore() {
            const w = Math.max(1, Math.floor(this.logicalWidth * this.resolution));
            const h = Math.max(1, Math.floor(this.logicalHeight * this.resolution));
            this.canvas.width = w;
            this.canvas.height = h;
        }

        _applyContextTransform() {
            if (!this.ctx || typeof this.ctx.setTransform !== 'function') return;
            this.ctx.setTransform(this.resolution, 0, 0, this.resolution, 0, 0);
        }

        _applySpriteScale() {
            if (!this.sprite || !this.sprite.scale || typeof this.sprite.scale.set !== 'function') return;
            const inv = 1 / this.resolution;
            this.sprite.scale.set(inv, inv);
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

        resize(width, height, resolution = this.resolution) {
            const logicalW = Math.max(1, Math.floor(width || 1));
            const logicalH = Math.max(1, Math.floor(height || 1));
            const nextResolution = this._normalizeResolution(resolution);
            if (this.logicalWidth === logicalW && this.logicalHeight === logicalH && this.resolution === nextResolution) {
                return;
            }

            this.logicalWidth = logicalW;
            this.logicalHeight = logicalH;
            this.resolution = nextResolution;
            this._resizeBackingStore();
            this._applyContextTransform();

            this.texture = this.TextureClass.from(this.canvas);
            this.sprite.texture = this.texture;
            this._applySpriteScale();
        }

        getResolution() {
            return this.resolution;
        }
    }

    class PixiParticleLayer {
        constructor(backend) {
            this.backend = backend;
            this.layer = null;
            this.baseSize = 32;
            this.textures = null;
            this.pool = [];
            this.bindings = new Map();
            this.blendModes = (globalScope.PIXI && globalScope.PIXI.BLEND_MODES)
                ? globalScope.PIXI.BLEND_MODES
                : null;
        }

        init() {
            if (!this.backend) return false;
            this.layer = this.backend.getLayer('vfx') || this.backend.getStage();
            if (!this.layer) return false;
            this._ensureTextures();
            return true;
        }

        _ensureTextures() {
            if (this.textures) return;
            this.textures = {
                circle: this._makeShapeTexture('circle'),
                square: this._makeShapeTexture('square'),
                triangle: this._makeShapeTexture('triangle'),
                star: this._makeShapeTexture('star'),
            };
        }

        _makeShapeTexture(shape) {
            const runtime = globalScope.PIXI;
            if (!runtime || !runtime.Texture) {
                throw new Error('PIXI runtime not available for PixiParticleLayer texture generation');
            }

            const canvas = globalScope.document.createElement('canvas');
            canvas.width = this.baseSize;
            canvas.height = this.baseSize;

            const ctx = canvas.getContext('2d');
            const c = this.baseSize / 2;
            const r = this.baseSize * 0.42;

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();

            if (shape === 'square') {
                const side = r * 1.6;
                const half = side / 2;
                ctx.rect(c - half, c - half, side, side);
            } else if (shape === 'triangle') {
                ctx.moveTo(c, c - r);
                ctx.lineTo(c - r * 0.86, c + r * 0.72);
                ctx.lineTo(c + r * 0.86, c + r * 0.72);
                ctx.closePath();
            } else if (shape === 'star') {
                for (let i = 0; i < 5; i++) {
                    const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
                    const outerX = c + Math.cos(angle) * r;
                    const outerY = c + Math.sin(angle) * r;
                    if (i === 0) ctx.moveTo(outerX, outerY);
                    else ctx.lineTo(outerX, outerY);
                    const innerAngle = angle + Math.PI / 5;
                    ctx.lineTo(
                        c + Math.cos(innerAngle) * r * 0.4,
                        c + Math.sin(innerAngle) * r * 0.4
                    );
                }
                ctx.closePath();
            } else {
                ctx.arc(c, c, r, 0, Math.PI * 2);
            }

            ctx.fill();
            return runtime.Texture.from(canvas);
        }

        _acquireSprite() {
            const runtime = globalScope.PIXI;
            if (!runtime || !runtime.Sprite) {
                throw new Error('PIXI runtime not available for PixiParticleLayer sprites');
            }

            const sprite = this.pool.pop() || new runtime.Sprite(this.textures.circle);
            if (sprite.anchor && typeof sprite.anchor.set === 'function') {
                sprite.anchor.set(0.5, 0.5);
            }
            sprite.zIndex = 1;
            sprite.visible = true;
            this.layer.addChild(sprite);
            return sprite;
        }

        _releaseSprite(sprite) {
            if (!sprite) return;
            if (sprite.parent) sprite.parent.removeChild(sprite);
            sprite.visible = false;
            sprite.alpha = 1;
            sprite.rotation = 0;
            if (sprite.scale && typeof sprite.scale.set === 'function') {
                sprite.scale.set(1, 1);
            }
            this.pool.push(sprite);
        }

        _toTint(color) {
            if (typeof color === 'string' && color[0] === '#') {
                const parsed = Number.parseInt(color.slice(1), 16);
                if (Number.isFinite(parsed)) return parsed;
            }
            return 0xffffff;
        }

        _clamp(v, lo, hi) {
            return Math.max(lo, Math.min(hi, v));
        }

        sync(particles) {
            if (!this.layer && !this.init()) return false;
            this._ensureTextures();

            const list = Array.isArray(particles) ? particles : [];
            const seen = new Set();

            for (const p of list) {
                if (!p || !Number.isFinite(p.maxLife) || p.maxLife <= 0) continue;

                const lifeRatio = this._clamp(p.life / p.maxLife, 0, 1);
                let alpha = lifeRatio;

                if (p.fadeIn) {
                    const elapsed = p.maxLife - p.life;
                    const fadeInDuration = Number.isFinite(p.fadeInDuration) ? p.fadeInDuration : 0.1;
                    if (elapsed < fadeInDuration) {
                        alpha = this._clamp(elapsed / fadeInDuration, 0, 1) * lifeRatio;
                    }
                }

                const baseSize = Number.isFinite(p.size) ? p.size : 3;
                const size = p.shrink !== false ? baseSize * lifeRatio : baseSize;
                const drawSize = p.scaleUp ? size * (1 + (1 - lifeRatio) * 0.5) : size;
                if (drawSize < 0.3 || alpha <= 0) {
                    continue;
                }

                const shape = this.textures[p.shape] ? p.shape : 'circle';
                let sprite = this.bindings.get(p);
                if (!sprite) {
                    sprite = this._acquireSprite();
                    this.bindings.set(p, sprite);
                }

                const texture = this.textures[shape] || this.textures.circle;
                if (sprite.texture !== texture) {
                    sprite.texture = texture;
                }

                sprite.position.set(p.x, p.y);
                sprite.rotation = Number.isFinite(p.rotation) ? p.rotation : 0;
                sprite.tint = this._toTint(p.color);
                sprite.alpha = alpha;

                const scale = this._clamp((drawSize * 2) / this.baseSize, 0.01, 12);
                sprite.scale.set(scale, scale);

                if (this.blendModes) {
                    sprite.blendMode = p.glow
                        ? (this.blendModes.ADD || this.blendModes.NORMAL)
                        : this.blendModes.NORMAL;
                }

                seen.add(p);
            }

            for (const [particle, sprite] of this.bindings.entries()) {
                if (seen.has(particle)) continue;
                this._releaseSprite(sprite);
                this.bindings.delete(particle);
            }

            return true;
        }

        destroy() {
            for (const sprite of this.bindings.values()) {
                this._releaseSprite(sprite);
            }
            this.bindings.clear();

            while (this.pool.length > 0) {
                const sprite = this.pool.pop();
                if (sprite && typeof sprite.destroy === 'function') {
                    sprite.destroy();
                }
            }

            if (this.textures) {
                for (const texture of Object.values(this.textures)) {
                    if (texture && typeof texture.destroy === 'function') {
                        texture.destroy(true);
                    }
                }
            }

            this.textures = null;
            this.layer = null;
        }
    }

    globalScope.TowerForgeRendering = Object.assign({}, globalScope.TowerForgeRendering, {
        PixiBackend,
        CanvasBridge,
        PixiParticleLayer,
    });
})(typeof window !== 'undefined' ? window : globalThis);
