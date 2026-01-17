
import { describe, it, beforeEach } from 'node:test';
import { strict as assert } from 'assert';
import { LightSystem } from './lightSystem.js';
import * as THREE from 'three';

// -----------------------------------------------------------------------------
// Test Helpers
// -----------------------------------------------------------------------------

function createMockTimeCycle() {
    return {
        sunIntensity: 0.0, // Night by default
        update: () => {}
    };
}

function createMockCamera() {
    return {
        position: new THREE.Vector3(0, 0, 0)
    };
}

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('LightSystem', () => {
    let scene;
    let lightSystem;

    beforeEach(() => {
        scene = new THREE.Scene();
        lightSystem = new LightSystem(scene);
    });

    describe('Initialization', () => {
        it('should create real lights pool', () => {
            assert.equal(lightSystem.realLights.length, lightSystem.maxLights);
            assert.equal(scene.children.length, lightSystem.maxLights); // Lights added to scene
        });

        it('should start with empty virtual lights', () => {
            assert.equal(lightSystem.virtualLights.length, 0);
        });
    });

    describe('Registration', () => {
        it('should register a virtual light', () => {
            const pos = new THREE.Vector3(10, 5, 10);
            const color = 0xff0000;

            const source = lightSystem.register(pos, color, 2.0, 30);

            assert.equal(lightSystem.virtualLights.length, 1);
            assert.deepEqual(source.pos, pos);
            assert.equal(source.intensity, 2.0);
            assert.equal(source.range, 30);
        });

        it('should create light source from mesh', () => {
            const mesh = new THREE.Mesh(new THREE.BoxGeometry(1,1,1));
            mesh.position.set(20, 0, 0);
            scene.add(mesh); // Add to scene to update matrix world properly? Or just manual update
            mesh.updateMatrixWorld();

            lightSystem.createLightSource(mesh, { color: 0x00ff00, intensity: 5 });

            assert.equal(lightSystem.virtualLights.length, 1);
            const vl = lightSystem.virtualLights[0];

            // Should match mesh position
            assert.equal(vl.pos.x, 20);
            assert.equal(vl.parentMesh, mesh);
        });
    });

    describe('Update Logic (Pooling)', () => {
        it('should assign closest virtual lights to real lights', () => {
            // Add 2 virtual lights: one close, one far
            lightSystem.register(new THREE.Vector3(10, 0, 0), 0xffffff, 1, 10); // Close
            lightSystem.register(new THREE.Vector3(100, 0, 0), 0xffffff, 1, 10); // Far

            const camera = createMockCamera();
            const timeCycle = createMockTimeCycle(); // Night

            lightSystem.update(0.16, camera, timeCycle);

            // Check real lights
            // Since we only have 2 virtual lights and maxLights is > 2 (12), both should be active
            const activeLights = lightSystem.realLights.filter(l => l.intensity > 0);
            assert.equal(activeLights.length, 2);

            // Sort order: closest first.
            // realLights[0] should be the close one (10,0,0)
            assert.equal(lightSystem.realLights[0].position.x, 10);
            assert.equal(lightSystem.realLights[1].position.x, 100);
        });

        it('should prioritize closest lights when exceeding pool size', () => {
            // Set maxLights to 2 for this test
            lightSystem.maxLights = 2;
            // Clear pool and re-init to respect new maxLights?
            // implementation does init in constructor.
            // We can just manually splice the arrays or mock it.
            // Easier: Just add MANY virtual lights and check the first N real lights.

            // Add 3 lights at distances 10, 20, 30
            lightSystem.register(new THREE.Vector3(10, 0, 0), 0xffffff, 1, 10);
            lightSystem.register(new THREE.Vector3(30, 0, 0), 0xffffff, 1, 10);
            lightSystem.register(new THREE.Vector3(20, 0, 0), 0xffffff, 1, 10);

            const camera = createMockCamera(); // at 0,0,0
            const timeCycle = createMockTimeCycle();

            lightSystem.update(0.16, camera, timeCycle);

            // Real lights should take the closest 2: (10,0,0) and (20,0,0)
            // The one at 30 should not be assigned to the first 2 slots (assuming maxLights is large enough to hold them,
            // but the system logic assigns realLights[i] = sortedVirtual[i]).

            // Wait, if maxLights is 12, then ALL 3 will be assigned.
            // To test prioritization, we need to check the ORDER of assignment.

            assert.equal(lightSystem.realLights[0].position.x, 10);
            assert.equal(lightSystem.realLights[1].position.x, 20);

            // The 3rd light (at 30) should NOT be in the first 2 slots.
            // Since we limited maxLights to 2, the loop stops there.
            // This proves that we picked the closest two (10 and 20) over the further one (30)
            // even though 30 was added before 20.
        });

        it('should handle more virtual lights than real lights', () => {
             // Create a new system with small limit to test limit logic easily,
             // but maxLights is hardcoded in constructor.
             // We can just check that realLights[maxLights-1] is assigned and correct.

             // Add maxLights + 1 virtual lights
             for(let i=0; i <= lightSystem.maxLights; i++) {
                 lightSystem.register(new THREE.Vector3(i * 10, 0, 0), 0xffffff, 1, 10);
             }

             const camera = createMockCamera();
             const timeCycle = createMockTimeCycle();

             lightSystem.update(0.16, camera, timeCycle);

             // The closest (0 * 10) to (maxLights-1 * 10) should be active.
             // The last one (maxLights * 10) should NOT be active in any real light slot.

             const lastRealLight = lightSystem.realLights[lightSystem.maxLights - 1];
             assert.equal(lastRealLight.position.x, (lightSystem.maxLights - 1) * 10);

             // Verify no real light has the position of the furthest virtual light
             const furthestPos = lightSystem.maxLights * 10;
             const found = lightSystem.realLights.find(l => l.position.x === furthestPos);

             // Note: realLights reuse objects. If it wasn't assigned, it keeps old state OR gets set to intensity 0.
             // The logic is: loop i < maxLights. if virtual[i] exists, assign. else intensity=0.
             // So realLights are exactly virtualLights[0..maxLights-1].
             // The furthest virtual light is at index maxLights, so it is never assigned.

             assert.equal(found, undefined, 'Furthest light should not be in realLights pool');
        });
    });

    describe('Day/Night Cycle', () => {
        it('should turn off lights during the day', () => {
            lightSystem.register(new THREE.Vector3(10, 0, 0), 0xffffff, 1, 10);

            const camera = createMockCamera();
            const timeCycle = { sunIntensity: 1.0 }; // Full Day

            lightSystem.update(0.16, camera, timeCycle);

            assert.equal(lightSystem.realLights[0].intensity, 0, 'Light should be off during day');
        });

        it('should dim lights during transition', () => {
            lightSystem.register(new THREE.Vector3(10, 0, 0), 0xffffff, 1.0, 10);

            const camera = createMockCamera();
            // sunIntensity 0.3 -> globalDim = 1 - 0.6 = 0.4
            const timeCycle = { sunIntensity: 0.3 };

            lightSystem.update(0.16, camera, timeCycle);

            const expectedIntensity = 1.0 * (1.0 - 0.6); // 0.4
            assert(Math.abs(lightSystem.realLights[0].intensity - expectedIntensity) < 0.001);
        });
    });

    describe('Dynamic Updates', () => {
        it('should update position from parent mesh', () => {
            const mesh = new THREE.Mesh();
            mesh.position.set(0, 0, 0);
            scene.add(mesh); // Matrix world update needs scene hierarchy or manual call?
            // In tests we often need manual updateMatrixWorld if not rendering.
            mesh.updateMatrixWorld();

            lightSystem.createLightSource(mesh, { color: 0xffffff });

            // Move mesh
            mesh.position.set(50, 50, 50);
            mesh.updateMatrixWorld();

            const camera = createMockCamera();
            const timeCycle = createMockTimeCycle();

            lightSystem.update(0.16, camera, timeCycle);

            // Check if virtual light pos updated (it does this in update loop)
            const vl = lightSystem.virtualLights[0];
            assert.equal(vl.pos.x, 50);
            assert.equal(vl.pos.y, 50);
            assert.equal(vl.pos.z, 50);

            // Check real light
            assert.equal(lightSystem.realLights[0].position.x, 50);
        });

        it('should handle removed parent meshes gracefully (optional but good practice)', () => {
             // The current implementation doesn't check if parentMesh is removed from scene,
             // but let's just ensure it doesn't crash if we try to update matrix of a detached mesh.
             // Three.js meshes can updateMatrixWorld even if detached.

             const mesh = new THREE.Mesh();
             lightSystem.createLightSource(mesh);

             mesh.position.set(100, 100, 100);
             // No crash expected
             const camera = createMockCamera();
             lightSystem.update(0.16, camera, createMockTimeCycle());

             assert.equal(lightSystem.virtualLights[0].pos.x, 100);
        });
    });
});
