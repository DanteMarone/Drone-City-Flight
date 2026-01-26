import { JSDOM } from 'jsdom';
import * as THREE from 'three';

// Setup JSDOM
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;
global.HTMLCanvasElement = dom.window.HTMLCanvasElement;

// Mock Canvas getContext
const originalGetContext = global.HTMLCanvasElement.prototype.getContext;
global.HTMLCanvasElement.prototype.getContext = function (type) {
    if (type === '2d') {
        return {
            fillRect: () => {},
            fillStyle: '',
            strokeStyle: '',
            lineWidth: 0,
            beginPath: () => {},
            moveTo: () => {},
            lineTo: () => {},
            stroke: () => {},
            createLinearGradient: () => ({ addColorStop: () => {} }),
        };
    }
    return originalGetContext.apply(this, arguments);
};

async function verify() {
    // Dynamic import to ensure globals are established before module code runs
    const { PulseReactorEntity } = await import('../world/entities/pulseReactor.js');

    console.log('Creating PulseReactorEntity instances...');
    const entity1 = new PulseReactorEntity();
    entity1.init(); // This calls createMesh which calls createEnergyTexture/createBeamTexture

    const entity2 = new PulseReactorEntity();
    entity2.init();

    // PulseReactorEntity stores emissive materials in _glowMaterials
    // Order of push in createMesh:
    // ...
    // this._glowMaterials.push(beamMat, coreMat);
    // ...

    const beamMat1 = entity1._glowMaterials[0];
    const coreMat1 = entity1._glowMaterials[1];

    const beamMat2 = entity2._glowMaterials[0];
    const coreMat2 = entity2._glowMaterials[1];

    if (!beamMat1 || !coreMat1 || !beamMat2 || !coreMat2) {
        console.error('Could not find materials in _glowMaterials');
        process.exit(1);
    }

    const beamTex1 = beamMat1.map;
    const coreTex1 = coreMat1.map;
    const beamTex2 = beamMat2.map;
    const coreTex2 = coreMat2.map;

    console.log('Checking Beam Texture Identity...');
    const beamShared = (beamTex1 === beamTex2);
    console.log(`Beam Shared: ${beamShared}`);

    console.log('Checking Core Texture Identity...');
    const coreShared = (coreTex1 === coreTex2);
    console.log(`Core Shared: ${coreShared}`);

    if (beamShared && coreShared) {
        console.log('SUCCESS: Textures are correctly shared/cached.');
        process.exit(0);
    } else {
        console.error('FAILURE: Textures are NOT shared (Duplication detected).');
        process.exit(1);
    }
}

verify().catch(err => {
    console.error(err);
    process.exit(1);
});
