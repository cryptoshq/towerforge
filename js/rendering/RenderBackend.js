export class RenderBackend {
    async init(canvasOrParentElement, options = {}) {
        throw new Error('RenderBackend.init() must be implemented by subclasses');
    }

    resize(width, height) {
        throw new Error('RenderBackend.resize() must be implemented by subclasses');
    }

    getStage() {
        return null;
    }

    getRenderer() {
        return null;
    }

    getLayer(name) {
        return null;
    }

    render() {
        // Optional override
    }

    destroy() {
        // Optional override
    }
}
