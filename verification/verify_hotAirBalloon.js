
import { HotAirBalloonEntity } from '../src/world/entities/hotAirBalloon.js';
import * as THREE from 'three';

// Mock window.app
global.window = {
    app: {
        world: {
            lightSystem: {
                register: (config) => {
                    console.log('Light registered:', config);
                    return { intensity: 1 };
                }
            }
        },
        colliderSystem: {
            addStatic: () => {}
        }
    }
};

// Mock document and canvas
global.document = {
    createElement: (tag) => {
        if (tag === 'canvas') {
            return {
                width: 0,
                height: 0,
                getContext: () => ({
                    fillStyle: '',
                    fillRect: () => {},
                    strokeStyle: '',
                    beginPath: () => {},
                    moveTo: () => {},
                    lineTo: () => {},
                    stroke: () => {},
                })
            };
        }
        return {};
    }
};

try {
    const entity = new HotAirBalloonEntity({ x: 0, y: 10, z: 0 });
    entity.init();

    if (entity.type !== 'hotAirBalloon') throw new Error('Incorrect type');
    if (!entity.mesh) throw new Error('Mesh not created');
    if (entity.mesh.children.length < 3) throw new Error('Mesh missing parts');

    console.log('HotAirBalloonEntity verified successfully.');

    // Test update
    entity.update(0.1);
    console.log('Update verified.');

} catch (e) {
    console.error('Verification failed:', e);
    process.exit(1);
}
