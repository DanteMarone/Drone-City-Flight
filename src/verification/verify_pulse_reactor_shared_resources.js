import { JSDOM } from 'jsdom';
import * as THREE from 'three';
import { PulseReactorEntity } from '../world/entities/pulseReactor.js';

// Mock DOM
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;
global.HTMLCanvasElement = dom.window.HTMLCanvasElement;

// Mock 2D Context for CanvasTexture
const originalGetContext = window.HTMLCanvasElement.prototype.getContext;
window.HTMLCanvasElement.prototype.getContext = function (contextType) {
    if (contextType === '2d') {
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
            save: () => {},
            restore: () => {},
            translate: () => {},
            rotate: () => {},
            scale: () => {},
            arc: () => {},
            fill: () => {},
            measureText: () => ({ width: 0 }),
            fillText: () => {},
            // Add other methods as needed by TextureGenerator or PulseReactor
        };
    }
    return originalGetContext.apply(this, arguments);
};

// Run check
try {
    console.log('Instantiating Reactor 1...');
    const r1 = new PulseReactorEntity({ x: 0, y: 0, z: 0 });
    r1.init();

    console.log('Instantiating Reactor 2...');
    const r2 = new PulseReactorEntity({ x: 10, y: 0, z: 0 });
    r2.init();

    // PulseReactor puts beamMat and coreMat into _glowMaterials
    // Index 0 is beamMat, Index 1 is coreMat (pushed in that order: "this._glowMaterials.push(beamMat, coreMat);")

    const tex1_beam = r1._glowMaterials[0].map;
    const tex1_core = r1._glowMaterials[1].map;

    const tex2_beam = r2._glowMaterials[0].map;
    const tex2_core = r2._glowMaterials[1].map;

    console.log('Checking Beam Texture identity...');
    if (tex1_beam === tex2_beam) {
        console.log('✅ Beam Textures are shared (Optimization active).');
    } else {
        console.log('❌ Beam Textures are different objects (Optimization MISSING).');
        // Check if underlying image/canvas is shared
        if (tex1_beam.image === tex2_beam.image) {
             console.log('   (Underlying canvas is shared, but Texture objects are different)');
        } else {
             console.log('   (Underlying canvas is duplicated)');
        }
    }

    console.log('Checking Core Texture identity...');
    if (tex1_core === tex2_core) {
        console.log('✅ Core Textures are shared (Optimization active).');
    } else {
        console.log('❌ Core Textures are different objects (Optimization MISSING).');
         if (tex1_core.image === tex2_core.image) {
             console.log('   (Underlying canvas is shared, but Texture objects are different)');
        } else {
             console.log('   (Underlying canvas is duplicated)');
        }
    }

} catch (err) {
    console.error('Error during reproduction:', err);
    process.exit(1);
}
