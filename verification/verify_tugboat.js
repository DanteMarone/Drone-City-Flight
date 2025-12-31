
import * as THREE from 'three';
import { CONFIG } from '../config.js';

// Mock browser globals
global.THREE = THREE;
global.window = {
    app: {
        world: {
            addEntity: () => {}
        },
        colliderSystem: {
            addStatic: () => {}
        }
    }
};

// Import the entity - using absolute path relative to repo root for CJS/ESM interop in test
import { TugboatEntity } from '../world/entities/tugboat.js';

console.log('Verifying TugboatEntity...');

try {
    const boat = new TugboatEntity({
        uuid: 'test-uuid',
        waypoints: [{x:0, y:0, z:0}, {x:10, y:0, z:0}]
    });

    console.log('Instance created successfully.');

    // Init
    boat.init();
    console.log('Instance initialized.');

    // Check mesh structure
    if (!boat.mesh) throw new Error('Mesh not created');

    const modelGroup = boat.mesh.getObjectByName('modelGroup');
    if (!modelGroup) throw new Error('modelGroup missing');

    // Check bobbing group
    // In createMesh, I added _bobbingGroup to modelGroup.
    // I didn't name it explicitly, but I can check children.
    // modelGroup should have 1 child (bobbingGroup).
    if (modelGroup.children.length === 0) throw new Error('Bobbing group missing from modelGroup');

    const bobbingGroup = modelGroup.children[0];
    console.log('Bobbing group found with ' + bobbingGroup.children.length + ' children.');

    // Validate some children exist (Hull, Cabin, etc)
    // I didn't name them, but I can count.
    // Hull, Bow, Deck, BowDeck, Cabin, Pilot, Win, Stack, Tires(6), Ring -> ~15 children.
    if (bobbingGroup.children.length < 10) throw new Error('Mesh seems to lack details');

    // Check update
    boat.update(0.1);
    console.log('Update loop executed.');

    // Check type
    if (boat.type !== 'tugboat') throw new Error('Incorrect type: ' + boat.type);

    // Check displayName
    if (TugboatEntity.displayName !== 'Tugboat') throw new Error('Incorrect displayName');

    console.log('✅ TugboatEntity verification passed.');
} catch (e) {
    console.error('❌ Verification Failed:', e);
    process.exit(1);
}
