import * as THREE from 'three';

export class LightSystem {
    constructor(scene) {
        this.scene = scene;
        this.maxLights = 12; // Hard limit for performance
        this.virtualLights = []; // { pos, color, intensity, range }
        this.realLights = [];

        this._initPool();

        // Cached vector for distance calculations
        this._tempVec = new THREE.Vector3();

        // Optimization: Throttle sorting
        this._frameCount = 4; // Start at 4 so first update (5) triggers sort
        this._sortInterval = 5; // Sort every 5 frames
    }

    _initPool() {
        for (let i = 0; i < this.maxLights; i++) {
            const light = new THREE.PointLight(0xffffff, 0, 50);
            light.castShadow = false; // Shadows are too expensive for these
            light.decay = 2;
            this.scene.add(light);
            this.realLights.push(light);
        }
    }

    /**
     * Registers a virtual light source.
     * @param {THREE.Vector3} position
     * @param {THREE.Color|number|string} color
     * @param {number} intensity
     * @param {number} range
     */
    register(position, color, intensity = 1, range = 50) {
        const source = {
            pos: position.clone(),
            color: new THREE.Color(color),
            intensity,
            range,
            _distSq: Infinity // Initialize to avoid hidden class change
        };
        this.virtualLights.push(source);
        return source;
    }

    /**
     * Clears all virtual lights. Call this when clearing the map.
     */
    clear() {
        this.virtualLights = [];
        // Reset real lights
        this.realLights.forEach(l => l.intensity = 0);
    }

    update(dt, camera, timeCycle) {
        if (!camera) return;

        // 1. Global Intensity Check (Day/Night)
        // If sun is up, lights are off.
        // timeCycle.sunIntensity is 1.0 at noon, 0.0 at night.
        // We want lights ON when sunIntensity is low.
        // Let's say lights start fading in when sunIntensity < 0.5.

        // globalDim: 1.0 (Full Night) -> 0.0 (Full Day)
        // sunIntensity: 0.0 (Night) -> 1.0 (Day)
        const globalDim = 1.0 - Math.min(1.0, timeCycle.sunIntensity * 2.0);

        if (globalDim <= 0.01) {
            // It's bright day, hide all lights
            for (let i = 0; i < this.realLights.length; i++) {
                this.realLights[i].intensity = 0;
            }
            return;
        }

        const cameraPos = camera.position;
        this._frameCount++;

        // 2. Sort Virtual Lights by distance to Camera
        // Optimization: Only sort every N frames to save CPU.
        // During the intervals, we just update the assigned lights.
        const shouldSort = (this._frameCount % this._sortInterval === 0);

        if (shouldSort) {
            const len = this.virtualLights.length;
            for (let i = 0; i < len; i++) {
                const vl = this.virtualLights[i];
                // Update position if attached to a mesh
                if (vl.parentMesh) {
                    // Optimization: Remove forced updateMatrixWorld().
                    // Rely on the scene graph to have updated matrices (or use previous frame's).
                    // This avoids traversing the hierarchy or recomposing matrices for hundreds of lights per frame.
                    vl.pos.setFromMatrixPosition(vl.parentMesh.matrixWorld);
                }
                vl._distSq = vl.pos.distanceToSquared(cameraPos);
            }

            this.virtualLights.sort((a, b) => a._distSq - b._distSq);
        }

        // 3. Assign Real Lights to the closest Virtual Lights
        // We iterate through the top K sorted lights.
        // Even if we didn't sort this frame, the list is roughly sorted from previous frames.

        for (let i = 0; i < this.maxLights; i++) {
            const real = this.realLights[i];
            const virtual = this.virtualLights[i];

            if (virtual) {
                // If we skipped sorting, we should still update the position of the *active* lights
                // so they don't lag behind moving objects (like cars).
                if (!shouldSort && virtual.parentMesh) {
                     virtual.pos.setFromMatrixPosition(virtual.parentMesh.matrixWorld);
                     // We could re-check distSq here to see if it's still valid,
                     // but for 5 frames it's fine.
                }

                // Check if it's within a reasonable render distance (e.g. 500)
                // 500^2 = 250000
                // If we didn't sort, _distSq is stale, but we can recompute it just for the check
                // or just trust the stale value. Let's recompute for accuracy on the active ones.
                const distSq = (!shouldSort) ? virtual.pos.distanceToSquared(cameraPos) : virtual._distSq;

                if (distSq < 250000) {
                    real.position.copy(virtual.pos);
                    real.color.copy(virtual.color);
                    real.intensity = virtual.intensity * globalDim;
                    real.distance = virtual.range;
                } else {
                    real.intensity = 0;
                }
            } else {
                real.intensity = 0;
            }
        }
    }

    /**
     * Helper to make a mesh look like a light source and register it.
     * @param {THREE.Mesh} mesh
     * @param {Object} options
     */
    createLightSource(mesh, options = {}) {
        const color = options.color || 0xffffaa;
        const intensity = options.intensity !== undefined ? options.intensity : 1;
        const range = options.range || 20;

        // 1. Make mesh emissive
        if (mesh.material) {
            // Clone material to avoid affecting shared materials
            const mat = mesh.material.clone();

            // If it's a Standard/Physical material
            if (mat.emissive !== undefined) {
                mat.emissive = new THREE.Color(color);
                mat.emissiveIntensity = 10; // High intensity for bloom
                mat.toneMapped = false; // Essential for bright glow
            } else {
                // If it's Basic, just set color (Basic doesn't have emissive usually,
                // but we can assume it acts as emissive if we set color high? No, Basic is just color)
                // Actually MeshBasicMaterial is unlit, so it is "emissive" by nature.
                mat.color = new THREE.Color(color);
                mat.toneMapped = false;
            }

            mesh.material = mat;
        }

        // 2. Register with system
        const source = {
            pos: new THREE.Vector3(), // Placeholder, updated below
            color: new THREE.Color(color),
            intensity,
            range,
            parentMesh: mesh,
            _distSq: Infinity
        };

        // Initial position
        mesh.updateMatrixWorld();
        source.pos.setFromMatrixPosition(mesh.matrixWorld);

        this.virtualLights.push(source);
    }
}
