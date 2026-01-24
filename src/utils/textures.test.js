import { describe, it, before, after } from 'node:test';
import { strict as assert } from 'assert';
import { JSDOM } from 'jsdom';
import * as THREE from 'three';

describe('TextureGenerator', () => {
    let TextureGenerator;
    let cleanupGlobals;

    before(async () => {
        // -----------------------------------------------------------------------------
        // JSDOM Setup & Mocking
        // -----------------------------------------------------------------------------
        // Initialize JSDOM
        const dom = new JSDOM('<!DOCTYPE html><p>Hello world</p>');

        // Backup existing globals (if any) to restore later
        const originalWindow = global.window;
        const originalDocument = global.document;
        const originalHTMLCanvasElement = global.HTMLCanvasElement;

        // Set JSDOM globals
        global.window = dom.window;
        global.document = dom.window.document;
        global.HTMLCanvasElement = dom.window.HTMLCanvasElement;

        // Mock Canvas getContext ('2d')
        // JSDOM doesn't implement full Canvas API without the 'canvas' package.
        const originalGetContext = global.HTMLCanvasElement.prototype.getContext;
        global.HTMLCanvasElement.prototype.getContext = function (type) {
            if (type === '2d') {
                return {
                    fillStyle: '',
                    strokeStyle: '',
                    lineWidth: 1,
                    fillRect: () => {},
                    beginPath: () => {},
                    moveTo: () => {},
                    lineTo: () => {},
                    stroke: () => {},
                    bezierCurveTo: () => {},
                };
            }
            return originalGetContext ? originalGetContext.apply(this, arguments) : null;
        };

        // Define cleanup function
        cleanupGlobals = () => {
            if (originalWindow) global.window = originalWindow; else delete global.window;
            if (originalDocument) global.document = originalDocument; else delete global.document;
            if (originalHTMLCanvasElement) global.HTMLCanvasElement = originalHTMLCanvasElement; else delete global.HTMLCanvasElement;
        };

        // Import the module under test dynamically AFTER setting up globals
        // This ensures that if the module accesses DOM at top-level, it won't fail (though currently it doesn't).
        const module = await import('./textures.js');
        TextureGenerator = module.TextureGenerator;
    });

    after(() => {
        if (cleanupGlobals) cleanupGlobals();
    });

    it('createBuildingFacade should return a valid THREE.CanvasTexture', () => {
        const tex = TextureGenerator.createBuildingFacade({
            width: 256,
            height: 256,
            floors: 5,
            cols: 3
        });

        assert.ok(tex instanceof THREE.CanvasTexture, 'Should return an instance of THREE.CanvasTexture');
        assert.equal(tex.image.width, 256);
        assert.equal(tex.image.height, 256);
        assert.equal(tex.colorSpace, THREE.SRGBColorSpace);
    });

    it('createBuildingFacade should cache and clone textures for identical parameters', () => {
        const params = {
            width: 128,
            height: 128,
            floors: 2,
            cols: 2,
            color: '#ffffff'
        };

        const tex1 = TextureGenerator.createBuildingFacade(params);
        const tex2 = TextureGenerator.createBuildingFacade(params);

        assert.notEqual(tex1, tex2, 'Texture objects should be different (clones)');
        assert.equal(tex1.image, tex2.image, 'Underlying canvas (image) should be the same reference (cached)');

        // Verify different params produce different cache
        const paramsDifferent = { ...params, color: '#000000' };
        const tex3 = TextureGenerator.createBuildingFacade(paramsDifferent);
        assert.notEqual(tex1.image, tex3.image, 'Different parameters should generate a new canvas');
    });

    it('createSidewalk should return a valid THREE.CanvasTexture', () => {
        const tex = TextureGenerator.createSidewalk(128, 640);

        assert.ok(tex instanceof THREE.CanvasTexture);
        assert.equal(tex.image.width, 128);
        assert.equal(tex.image.height, 640);
    });

    it('createAsphalt should return a valid THREE.CanvasTexture', () => {
        const tex = TextureGenerator.createAsphalt();

        assert.ok(tex instanceof THREE.CanvasTexture);
        assert.equal(tex.image.width, 256);
        assert.equal(tex.image.height, 256);
    });

});
