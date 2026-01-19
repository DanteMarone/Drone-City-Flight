// src/world/environmentSystem.js
import * as THREE from 'three';
import { Skybox } from './skybox.js';
import { CloudSystem } from './clouds.js';
import { TimeCycle } from './timeCycle.js';

export class EnvironmentSystem {
    constructor(renderer) {
        this.renderer = renderer;
        this.scene = renderer.scene;

        this.timeCycle = new TimeCycle();

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

    update(dt, camera, drone, wind) {
        // 1. Update Time Cycle
        if (this.timeCycle) {
            this.timeCycle.update(dt);
        }

        // 2. Apply Global Lighting
        this._updateLighting();

        // 3. Update Visuals
        if (this.skybox) {
            this.skybox.update(camera.position, this.timeCycle);
        }

        if (this.cloudSystem) {
            this.cloudSystem.update(dt, drone.position, camera, wind, this.timeCycle);
        }
    }

    _updateLighting() {
        const timeCycle = this.timeCycle;
        if (!timeCycle) return;

        // Apply Sun Position
        if (this.sunLight) {
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

        // Fog
        if (this.scene.fog) {
            this.scene.fog.color.copy(timeCycle.fogColor);
        }
    }
}
