
import assert from 'node:assert';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';
import * as THREE from 'three';

test('PulseReactorEntity texture duplication check', async (t) => {
    // Mock DOM and Canvas
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.window = dom.window;
    global.document = dom.window.document;
    global.HTMLCanvasElement = dom.window.HTMLCanvasElement;

    // Mock Canvas Context
    const mockContext = {
        fillRect: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        stroke: () => {},
        createLinearGradient: () => ({ addColorStop: () => {} }),
    };
    HTMLCanvasElement.prototype.getContext = () => mockContext;

    // Load module
    // We need to use dynamic import after mocking globals
    const { PulseReactorEntity } = await import('../world/entities/pulseReactor.js');

    const reactor1 = new PulseReactorEntity();
    const mesh1 = reactor1.createMesh({});

    const reactor2 = new PulseReactorEntity();
    const mesh2 = reactor2.createMesh({});

    // Find textures
    // createMesh adds children to group. We need to find the mesh with the texture.
    // In createMesh:
    // const coreMat = ... map: coreTexture
    // core is added to group.

    // Helper to find texture in group
    function findTexture(group) {
        let found = null;
        group.traverse((obj) => {
            if (obj.isMesh && obj.material.map && !found) {
                // We are looking for the procedural texture, let's assume it's one of them.
                // The base has concreteTex, which comes from TextureGenerator (which is likely cached).
                // The core has coreTexture (createEnergyTexture).
                // The beam has beamTexture (createBeamTexture).

                // Let's look for the core texture specifically.
                // The core cylinder is added after the base.
                // It has emissive color 0x37f5ff
                if (obj.material.emissive && obj.material.emissive.getHex() === 0x37f5ff) {
                    found = obj.material.map;
                }
            }
        });
        return found;
    }

    const tex1 = findTexture(mesh1);
    const tex2 = findTexture(mesh2);

    assert.ok(tex1, 'Reactor 1 should have a core texture');
    assert.ok(tex2, 'Reactor 2 should have a core texture');

    // Check if the source image (canvas) is the same object
    const isSameSource = tex1.image === tex2.image;

    if (isSameSource) {
        console.log('Textures share the same source canvas. Optimization present.');
    } else {
        console.log('Textures use DIFFERENT source canvases. Optimization MISSING.');
    }

    // We expect this to pass if optimization is present.
    assert.strictEqual(isSameSource, true, 'Expected textures to share source in optimized code');
});
