
import { describe, it } from 'node:test';
import { strict as assert } from 'assert';
import * as THREE from 'three';
import { EnvironmentSystem } from './environmentSystem.js';

// Mock Renderer
class MockRenderer {
    constructor() {
        this.scene = new THREE.Scene();
        this.addedObjects = [];
    }

    add(obj) {
        this.scene.add(obj);
        this.addedObjects.push(obj);
    }
}

// Mock TimeCycle
class MockTimeCycle {
    constructor() {
        this.time = 12.0;
        this.sunPosition = new THREE.Vector3(100, 100, 0);
        this.sunColor = new THREE.Color(0xffaa00);
        this.ambientColor = new THREE.Color(0x444444);
        this.sunIntensity = 1.2;
        this.ambientIntensity = 0.5;
        this.fogColor = new THREE.Color(0xabcdef);
        this.skyColor = new THREE.Color(0x88ccff);
        this.updateCalled = false;
    }

    update(dt) {
        this.updateCalled = true;
    }
}

describe('EnvironmentSystem', () => {

    describe('Initialization', () => {
        it('should initialize lights and systems', () => {
            const renderer = new MockRenderer();
            const env = new EnvironmentSystem(renderer);

            assert.ok(env.ambientLight, 'Ambient light should be created');
            assert.ok(env.sunLight, 'Sun light should be created');
            assert.ok(env.skybox, 'Skybox should be created');
            assert.ok(env.cloudSystem, 'CloudSystem should be created');

            // Verify lights are added to scene/renderer
            const ambientInScene = renderer.addedObjects.includes(env.ambientLight);
            const sunInScene = renderer.addedObjects.includes(env.sunLight);

            assert.ok(ambientInScene, 'Ambient light should be added to renderer');
            assert.ok(sunInScene, 'Sun light should be added to renderer');
        });
    });

    describe('updateCycleAndLighting', () => {
        it('should update time cycle and lighting properties', () => {
            const renderer = new MockRenderer();
            const env = new EnvironmentSystem(renderer);
            const timeCycle = new MockTimeCycle();

            // Set some initial values differently to verify update
            env.sunLight.intensity = 0;
            env.ambientLight.intensity = 0;

            env.updateCycleAndLighting(0.1, timeCycle);

            assert.ok(timeCycle.updateCalled, 'TimeCycle.update should be called');

            // Check Sun Light
            assert.ok(env.sunLight.position.equals(timeCycle.sunPosition), 'Sun position should match TimeCycle');
            assert.ok(env.sunLight.color.equals(timeCycle.sunColor), 'Sun color should match TimeCycle');
            assert.equal(env.sunLight.intensity, timeCycle.sunIntensity, 'Sun intensity should match TimeCycle');

            // Check Ambient Light
            assert.ok(env.ambientLight.color.equals(timeCycle.ambientColor), 'Ambient color should match TimeCycle');
            assert.equal(env.ambientLight.intensity, timeCycle.ambientIntensity, 'Ambient intensity should match TimeCycle');

            // Check Fog (if scene has fog)
            if (renderer.scene.fog) {
                assert.ok(renderer.scene.fog.color.equals(timeCycle.fogColor), 'Fog color should match TimeCycle');
            }
        });

        it('should handle missing TimeCycle gracefully', () => {
             const renderer = new MockRenderer();
             const env = new EnvironmentSystem(renderer);
             // Should not throw
             env.updateCycleAndLighting(0.1, null);
        });
    });

    describe('updateVisuals', () => {
        it('should run updateVisuals without error', () => {
            const renderer = new MockRenderer();
            const env = new EnvironmentSystem(renderer);
            const timeCycle = new MockTimeCycle();

            const camera = new THREE.PerspectiveCamera();
            const drone = new THREE.Mesh(); // Mock drone
            const wind = { speed: 10, direction: 45 };

            // We can't easily mock Skybox/CloudSystem internal updates without mocking dependencies,
            // but we can ensure the orchestration doesn't crash.

            try {
                env.updateVisuals(0.1, camera, drone, wind, timeCycle);
                assert.ok(true);
            } catch (e) {
                assert.fail('updateVisuals threw error: ' + e.message);
            }
        });
    });

});
