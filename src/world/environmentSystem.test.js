
import { describe, it, beforeEach } from 'node:test';
import { strict as assert } from 'assert';
import * as THREE from 'three';
import { EnvironmentSystem } from './environmentSystem.js';
import { TimeCycle } from './timeCycle.js';

// -----------------------------------------------------------------------------
// Test Helpers
// -----------------------------------------------------------------------------

function createMockRenderer() {
    const scene = new THREE.Scene();
    return {
        scene: scene,
        add: function(obj) {
            this.scene.add(obj);
        }
    };
}

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('EnvironmentSystem', () => {

    describe('Initialization', () => {
        it('should initialize lights and sub-systems', () => {
            const renderer = createMockRenderer();
            const sys = new EnvironmentSystem(renderer);

            // Check Lights
            assert.ok(sys.ambientLight instanceof THREE.HemisphereLight, 'Ambient light created');
            assert.ok(sys.sunLight instanceof THREE.DirectionalLight, 'Sun light created');

            // Check if lights added to scene (via renderer.add)
            const lights = renderer.scene.children.filter(c => c.isLight);
            assert.ok(lights.includes(sys.ambientLight), 'Ambient light added to scene');
            assert.ok(lights.includes(sys.sunLight), 'Sun light added to scene');

            // Check Sub-systems
            assert.ok(sys.skybox, 'Skybox initialized');
            assert.ok(sys.cloudSystem, 'CloudSystem initialized');
        });
    });

    describe('Cycle and Lighting Update', () => {
        it('should update time cycle and sync lights', () => {
            const renderer = createMockRenderer();
            const sys = new EnvironmentSystem(renderer);
            const timeCycle = new TimeCycle();

            // Set specific time to predict values
            timeCycle.time = 12.0; // Noon
            const dt = 1.0;

            // Spy/Check initial state
            sys.sunLight.intensity = -1; // Force distinct value
            sys.ambientLight.intensity = -1;

            sys.updateCycleAndLighting(dt, timeCycle);

            // Check TimeCycle updated (it advances time if speed > 0, default 0)
            // But updateCycleAndLighting calls timeCycle.update(dt)
            // If speed is 0, time won't change, but sunPosition might be recalculated if needed
            // By default TimeCycle has speed 0.

            // Verify light properties synced with TimeCycle
            // TimeCycle.sunIntensity at noon is likely high
            assert.ok(sys.sunLight.intensity >= 0, 'Sun intensity updated');
            assert.ok(sys.ambientLight.intensity >= 0, 'Ambient intensity updated');

            // Check Color
            assert.ok(sys.sunLight.color instanceof THREE.Color);

            // Check Position
            // At noon, sun should be high.
            assert.ok(sys.sunLight.position.y > 0, 'Sun should be above horizon');
            assert.ok(Math.abs(sys.sunLight.position.x - timeCycle.sunPosition.x) < 0.001, 'Sun light position matches cycle');
        });

        it('should handle missing TimeCycle gracefully', () => {
             const renderer = createMockRenderer();
             const sys = new EnvironmentSystem(renderer);
             // Should not throw
             sys.updateCycleAndLighting(0.1, null);
        });
    });

    describe('Visuals Update', () => {
        it('should update skybox and clouds', () => {
            const renderer = createMockRenderer();
            const sys = new EnvironmentSystem(renderer);
            const timeCycle = new TimeCycle();

            // Ensure TimeCycle has valid sun position
            timeCycle.time = 12.0;
            timeCycle._updateSunPosition();

            const camera = new THREE.PerspectiveCamera();
            camera.position.set(100, 50, 100);

            const drone = { position: new THREE.Vector3(10, 20, 10) };
            const wind = { speed: 10, direction: 45 };

            // Initial state of CloudSystem uniforms
            const startCloudTime = sys.cloudSystem.uniforms.uTime.value;

            sys.updateVisuals(0.1, camera, drone, wind, timeCycle);

            // Verify Cloud System Update
            assert.ok(sys.cloudSystem.uniforms.uTime.value > startCloudTime, 'Cloud time advanced');
            assert.ok(Math.abs(sys.cloudSystem.mesh.position.x - camera.position.x) < 0.001, 'Clouds followed camera X');
            assert.ok(Math.abs(sys.cloudSystem.mesh.position.z - camera.position.z) < 0.001, 'Clouds followed camera Z');

            // Verify Skybox Update
            // Skybox sun mesh should follow camera
            // Distance is 400 (hardcoded in Skybox.js)
            const sunDist = sys.skybox.sunMesh.position.distanceTo(camera.position);
            assert.ok(Math.abs(sunDist - 400) < 1.0, 'Skybox sun maintained distance');
        });
    });

});
