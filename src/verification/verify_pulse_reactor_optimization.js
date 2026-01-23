
import assert from 'node:assert';
import { JSDOM } from 'jsdom';

// Setup JSDOM environment before importing modules that use document/window
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost/',
    resources: 'usable',
    runScripts: 'dangerously',
});

global.window = dom.window;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.HTMLCanvasElement = dom.window.HTMLCanvasElement;

// Mock canvas getContext since JSDOM doesn't implement full Canvas API
HTMLCanvasElement.prototype.getContext = function (type) {
    return {
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 1,
        fillRect: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        stroke: () => {},
        createLinearGradient: () => ({ addColorStop: () => {} }),
        measureText: () => ({ width: 0 }),
        fillText: () => {},
        save: () => {},
        restore: () => {},
        translate: () => {},
        rotate: () => {},
        scale: () => {},
        arc: () => {},
        fill: () => {},
        bezierCurveTo: () => {},
    };
};

// Now import the entity
// Note: We need to use dynamic import because static imports are evaluated before code execution
const { PulseReactorEntity } = await import('../world/entities/pulseReactor.js');
const THREE = await import('three');

async function runVerification() {
    console.log('⚡ Bolt: Verifying PulseReactorEntity Texture Caching...');

    // Create first instance
    const entity1 = new PulseReactorEntity({ x: 0, y: 0, z: 0 });
    entity1.init(); // This triggers createMesh -> createEnergyTexture/createBeamTexture

    // Create second instance
    const entity2 = new PulseReactorEntity({ x: 10, y: 0, z: 0 });
    entity2.init();

    // Helper to find texture in the mesh
    function findTexture(entity, textureNamePartial) {
        let foundTexture = null;
        entity.mesh.traverse((child) => {
            if (child.isMesh && child.material) {
                const mat = child.material;
                if (mat.map && mat.map.image) {
                    // We identify by assuming map exists.
                    // In PulseReactor, Energy texture is on 'core' (Cylinder)
                    // Beam texture is on 'beam' (Cylinder)
                    // We can check geometry type or just check if it's a CanvasTexture
                    if (mat.map.isCanvasTexture) {
                        // To distinguish, we might need more context, but
                        // let's just collect all canvas textures
                    }
                }
            }
        });
        return foundTexture;
    }

    // Inspect materials directly since we know the structure from reading code
    // entity._glowMaterials contains coreMat (index 1) which has energy texture
    // and beamMat (index 0) which has beam texture.

    // Wait, let's re-read createMesh to be sure of order.
    // _glowMaterials.push(beamMat, coreMat); -> beamMat is 0, coreMat is 1.

    const beamMat1 = entity1._glowMaterials[0];
    const coreMat1 = entity1._glowMaterials[1];

    const beamMat2 = entity2._glowMaterials[0];
    const coreMat2 = entity2._glowMaterials[1];

    assert(beamMat1 && beamMat1.map, 'Entity 1 should have beam map');
    assert(coreMat1 && coreMat1.map, 'Entity 1 should have core map');
    assert(beamMat2 && beamMat2.map, 'Entity 2 should have beam map');
    assert(coreMat2 && coreMat2.map, 'Entity 2 should have core map');

    const beamTexture1 = beamMat1.map;
    const coreTexture1 = coreMat1.map;

    const beamTexture2 = beamMat2.map;
    const coreTexture2 = coreMat2.map;

    console.log('Checking Beam Texture identity...');
    // We check if the underlying image (Canvas) is shared, even if the Texture object is cloned.
    if (beamTexture1.image === beamTexture2.image) {
        console.log('✅ Beam Textures share the same Canvas (Optimized)');
    } else {
        console.log('❌ Beam Textures use different Canvases (Not Optimized)');
    }

    console.log('Checking Core (Energy) Texture identity...');
    if (coreTexture1.image === coreTexture2.image) {
        console.log('✅ Core Textures share the same Canvas (Optimized)');
    } else {
        console.log('❌ Core Textures use different Canvases (Not Optimized)');
    }

    return {
        beamShared: beamTexture1.image === beamTexture2.image,
        coreShared: coreTexture1.image === coreTexture2.image
    };
}

const result = await runVerification();

// We want this script to fail if optimization is missing IF we are running it as a test of the optimization.
// But first I just want to run it to see.
// I'll make it exit with 0, but print the status.
