export class LayerManager {
    constructor(parentContainer) {
        this.parentContainer = parentContainer;
        this.layers = Object.create(null);
        const runtime = (typeof window !== 'undefined' && window.PIXI)
            ? window.PIXI
            : (typeof globalThis !== 'undefined' ? globalThis.PIXI : null);
        this.ContainerClass = runtime && runtime.Container ? runtime.Container : null;
    }

    createLayer(name, zIndex = 0) {
        if (!this.ContainerClass) {
            throw new Error('PIXI runtime not available for LayerManager');
        }

        const Container = this.ContainerClass;
        const layer = new Container();
        layer.sortableChildren = true;
        layer.zIndex = zIndex;
        this.layers[name] = layer;
        this.parentContainer.addChild(layer);
        return layer;
    }

    getLayer(name) {
        return this.layers[name] || null;
    }

    clearLayer(name, destroyChildren = false) {
        const layer = this.layers[name];
        if (!layer) return;
        layer.removeChildren().forEach((child) => {
            if (destroyChildren && child && typeof child.destroy === 'function') {
                child.destroy();
            }
        });
    }

    destroy(destroyChildren = true) {
        for (const layer of Object.values(this.layers)) {
            layer.removeChildren().forEach((child) => {
                if (destroyChildren && child && typeof child.destroy === 'function') {
                    child.destroy();
                }
            });
            if (layer.parent) layer.parent.removeChild(layer);
            layer.destroy();
        }
        this.layers = Object.create(null);
    }
}
