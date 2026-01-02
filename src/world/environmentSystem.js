// src/world/environmentSystem.js
import * as THREE from 'three';
import { Skybox } from './skybox.js';
import { CloudSystem } from './clouds.js';

export class EnvironmentSystem {
    constructor(renderer) {
        this.renderer = renderer;
        this.scene = renderer.scene;

        this._setupLights();
        this.skybox = new Skybox(this.scene);
        this.cloudSystem = new CloudSystem(this.scene);
    }

    _setupLights() {
        this.ambientLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
        this.renderer.add(this.ambientLight);

        this.sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
        this.sunLight.position.set(50, 80, 50);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 500;

        // Slightly larger shadow frustum for long shadows
        const d = 120;
        this.sunLight.shadow.camera.left = -d;
        this.sunLight.shadow.camera.right = d;
        this.sunLight.shadow.camera.top = d;
        this.sunLight.shadow.camera.bottom = -d;
        this.renderer.add(this.sunLight);
    }

    updateCycleAndLighting(dt, timeCycle) {
        if (!timeCycle) return;

        // Update cycle logic
        timeCycle.update(dt);

        // Apply Sun Position
        if (this.sunLight) {
            // Keep sun relative to drone/center to maximize shadow resolution near player
            // But the cycle calculates global orbit.
            // If we want shadows to work everywhere, sun needs to be far away or follow player.
            // DirectionalLight position matters for shadow camera box.
            // Let's keep sun "at infinity" direction-wise, but move position to follow drone x/z
            // to keep shadow map centered?
            // For now, let's just use the computed position from TimeCycle (relative to 0,0,0)
            // and maybe offset by drone pos if needed.
            // TimeCycle gives position on a sphere of radius 100.

            this.sunLight.position.copy(timeCycle.sunPosition);

            // Update Color & Intensity
            this.sunLight.color.copy(timeCycle.sunColor);
            this.sunLight.intensity = timeCycle.sunIntensity;
        }

        // Apply Ambient
        if (this.ambientLight) {
            this.ambientLight.color.copy(timeCycle.ambientColor);
            this.ambientLight.groundColor.setHex(0x111111); // Dark ground
            this.ambientLight.intensity = timeCycle.ambientIntensity;
        }

        // Fog (if enabled in scene, though config says density 0)
        if (this.scene.fog) {
            this.scene.fog.color.copy(timeCycle.fogColor);
        }
    }

    updateVisuals(dt, camera, drone, wind, timeCycle) {
        if (this.skybox) {
            // Skybox needs to know time/sun info
            this.skybox.update(camera.position, timeCycle);
        }

        if (this.cloudSystem) {
            this.cloudSystem.update(dt, drone.position, camera, wind, timeCycle);
        }
    }
}
