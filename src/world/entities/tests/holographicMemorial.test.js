import { describe, it, before, after } from 'node:test';
import { strict as assert } from 'assert';
import { JSDOM } from 'jsdom';

// Setup JSDOM
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;
global.HTMLCanvasElement = dom.window.HTMLCanvasElement;

// Mock Canvas getContext
const originalCreateElement = global.document.createElement;
global.document.createElement = (tagName) => {
    if (tagName.toLowerCase() === 'canvas') {
        const canvas = originalCreateElement.call(global.document, tagName);
        canvas.getContext = (contextType) => {
            if (contextType === '2d') {
                return {
                    clearRect: () => {},
                    fillRect: () => {},
                    fillStyle: '',
                    createLinearGradient: () => ({ addColorStop: () => {} }),
                };
            }
            return null;
        };
        return canvas;
    }
    return originalCreateElement.call(global.document, tagName);
};

describe('HolographicMemorialEntity', () => {
    let HolographicMemorialEntity;
    let THREE;

    before(async () => {
        // Dynamic import to ensure mocks are active
        THREE = await import('three');
        const module = await import('../holographicMemorial.js');
        HolographicMemorialEntity = module.HolographicMemorialEntity;
    });

    it('should be defined', () => {
        assert.ok(HolographicMemorialEntity);
    });

    it('should instantiate and create mesh', () => {
        const entity = new HolographicMemorialEntity({ x: 0, y: 0, z: 0 });
        assert.equal(entity.type, 'holographicMemorial');

        entity.init();
        assert.ok(entity.mesh);
        assert.ok(entity.mesh instanceof THREE.Group);

        // Check for specific children
        const hologram = entity.mesh.getObjectByName('hologram');
        assert.ok(hologram, 'Should have a child named hologram');

        // Check update loop
        assert.doesNotThrow(() => entity.update(0.016));
    });

    it('should have a display name', () => {
        assert.equal(HolographicMemorialEntity.displayName, 'Holographic Memorial');
    });
});
