import { describe, it } from 'node:test';
import { strict as assert } from 'assert';
import * as THREE from 'three';
import { LightSystem } from './lightSystem.js';

// Mocks
class MockScene {
    constructor() {
        this.children = [];
    }
    add(obj) {
        this.children.push(obj);
    }
}

// -----------------------------------------------------------------------------
// Suite: LightSystem
// -----------------------------------------------------------------------------
describe('LightSystem', () => {

    it('should initialize and create real lights pool', () => {
        const scene = new MockScene();
        const lightSystem = new LightSystem(scene);

        assert.equal(lightSystem.maxLights, 12, 'Should have 12 max lights');
        assert.equal(lightSystem.realLights.length, 12, 'Should create 12 real lights');
        assert.equal(scene.children.length, 12, 'Should add 12 lights to scene');
        assert.equal(lightSystem.virtualLights.length, 0, 'Should start with 0 virtual lights');

        // Check properties of a real light
        const light = lightSystem.realLights[0];
        assert.ok(light instanceof THREE.PointLight, 'Should be PointLight');
        assert.equal(light.intensity, 0, 'Should start turned off (intensity 0)');
    });

    it('should register virtual lights', () => {
        const scene = new MockScene();
        const lightSystem = new LightSystem(scene);
        const pos = new THREE.Vector3(10, 5, 0);

        const source = lightSystem.register(pos, 0xff0000, 2.0, 100);

        assert.equal(lightSystem.virtualLights.length, 1, 'Should have 1 virtual light');
        assert.ok(source.pos.equals(pos), 'Position should match');
        assert.equal(source.intensity, 2.0, 'Intensity should match');
        assert.equal(source.range, 100, 'Range should match');
        // Check color
        const expectedColor = new THREE.Color(0xff0000);
        assert.ok(source.color.equals(expectedColor), 'Color should match');
    });

    it('should update real lights based on proximity to camera', () => {
        const scene = new MockScene();
        const lightSystem = new LightSystem(scene);

        // Add 2 virtual lights
        // Light A: Close to camera (0,0,10)
        lightSystem.register(new THREE.Vector3(0, 0, 10), 0xffffff, 1, 50);
        // Light B: Far from camera (0,0,1000)
        lightSystem.register(new THREE.Vector3(0, 0, 1000), 0xffffff, 1, 50);

        const camera = new THREE.PerspectiveCamera();
        camera.position.set(0, 0, 0);

        // Mock TimeCycle (Night time, sunIntensity = 0)
        const timeCycle = { sunIntensity: 0.0 };

        lightSystem.update(0.1, camera, timeCycle);

        // Expect Light A to be active (assigned to a real light)
        // Expect Light B to be inactive (too far, usually cutoff is 500^2=250000)
        // 1000^2 = 1,000,000 > 250,000

        // Find the real light assigned to Light A
        const activeLights = lightSystem.realLights.filter(l => l.intensity > 0);

        assert.equal(activeLights.length, 1, 'Only 1 light should be active');
        assert.ok(activeLights[0].position.equals(new THREE.Vector3(0, 0, 10)), 'Active light should be at (0,0,10)');
    });

    it('should prioritize closest lights when exceeding maxLights', () => {
        const scene = new MockScene();
        const lightSystem = new LightSystem(scene);

        // Create 15 lights (max is 12) at increasing distances
        for (let i = 0; i < 15; i++) {
            // z = 10, 20, 30 ...
            lightSystem.register(new THREE.Vector3(0, 0, (i + 1) * 10), 0xffffff, 1, 50);
        }

        const camera = new THREE.PerspectiveCamera();
        camera.position.set(0, 0, 0);
        const timeCycle = { sunIntensity: 0.0 }; // Night

        lightSystem.update(0.1, camera, timeCycle);

        // The first 12 lights (closest) should be active
        // The last 3 (furthest) should be ignored

        const activeLights = lightSystem.realLights.filter(l => l.intensity > 0);
        assert.equal(activeLights.length, 12, 'Should utilize all 12 real lights');

        // Verify the furthest active light is at z=120
        // We can't guarantee order of realLights matches sorted order, but we can check positions
        const maxZ = Math.max(...activeLights.map(l => l.position.z));
        assert.equal(maxZ, 120, 'Furthest active light should be at z=120');
    });

    it('should turn off lights during the day', () => {
        const scene = new MockScene();
        const lightSystem = new LightSystem(scene);

        lightSystem.register(new THREE.Vector3(0, 0, 10), 0xffffff, 1, 50);

        const camera = new THREE.PerspectiveCamera();
        const timeCycle = { sunIntensity: 1.0 }; // Noon (Day)

        lightSystem.update(0.1, camera, timeCycle);

        const activeLights = lightSystem.realLights.filter(l => l.intensity > 0);
        assert.equal(activeLights.length, 0, 'No lights should be active during the day');
    });

    it('should clear virtual lights', () => {
        const scene = new MockScene();
        const lightSystem = new LightSystem(scene);

        lightSystem.register(new THREE.Vector3(0, 0, 10), 0xffffff, 1, 50);
        assert.equal(lightSystem.virtualLights.length, 1);

        lightSystem.clear();
        assert.equal(lightSystem.virtualLights.length, 0, 'Should clear virtual lights array');

        // Also check if real lights are reset (intensity 0)
        // We need to dirty one first
        lightSystem.realLights[0].intensity = 1;
        lightSystem.clear();
        assert.equal(lightSystem.realLights[0].intensity, 0, 'Should reset real lights intensity');
    });

    it('should create light source from mesh', () => {
        const scene = new MockScene();
        const lightSystem = new LightSystem(scene);

        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(),
            new THREE.MeshStandardMaterial({ color: 0x888888 })
        );
        // Position the mesh
        mesh.position.set(5, 5, 5);
        mesh.updateMatrixWorld(); // Important for getting world position

        lightSystem.createLightSource(mesh, {
            color: 0x00ff00,
            intensity: 3,
            range: 20
        });

        // 1. Check virtual light registration
        assert.equal(lightSystem.virtualLights.length, 1);
        const vl = lightSystem.virtualLights[0];
        assert.ok(vl.pos.equals(new THREE.Vector3(5, 5, 5)), 'Virtual light should take mesh position');
        assert.equal(vl.intensity, 3);

        // 2. Check mesh material update
        assert.ok(mesh.material.emissive, 'Material should have emissive property');
        assert.ok(mesh.material.emissive.equals(new THREE.Color(0x00ff00)), 'Emissive color should be set');
        assert.equal(mesh.material.emissiveIntensity, 10, 'Emissive intensity should be boosted');
        assert.equal(mesh.material.toneMapped, false, 'Tone mapping should be disabled');
    });
});
