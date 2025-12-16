import * as THREE from 'three';

export class CloudSystem {
    constructor(scene) {
        this.scene = scene;
        this.clouds = [];
        this.texture = new THREE.TextureLoader().load('textures/cloud.png');
        this.texture.colorSpace = THREE.SRGBColorSpace;

        // Shared geometry for all clouds to reduce allocation
        this.geometry = new THREE.PlaneGeometry(100, 50);

        this.maxClouds = 20;
        this.spawnTimer = 0;
        this.spawnInterval = 2.0; // Seconds between potential spawns
    }

    update(dt, playerPosition, camera, windConfig) {
        this.spawnTimer += dt;
        if (this.spawnTimer > this.spawnInterval) {
            this.spawnTimer = 0;
            if (this.clouds.length < this.maxClouds) {
                this._spawnCloud(playerPosition);
            }
        }

        // Calculate Wind Velocity Vector
        // Standard wind: 0 degrees = Blows North (towards -Z) or from North?
        // Let's assume 0 deg = +Z direction for simplicity, or match standard compass.
        // Trig standard: 0 = +X. Compass: 0 = North (-Z).
        // Let's use standard trig for now: angle in degrees.
        // Actually, let's map it: speed is magnitude.

        let windVec = new THREE.Vector3(1, 0, 0); // Default fallback
        if (windConfig) {
            // Convert deg to rad
            const rad = windConfig.direction * (Math.PI / 180);
            // Calculate direction.
            // If 0 is North (-Z), 90 is East (+X), 180 is South (+Z), 270 is West (-X).
            // x = sin(rad), z = -cos(rad) gives 0 -> (0, -1) North.
            const wx = Math.sin(rad);
            const wz = -Math.cos(rad);

            windVec.set(wx, 0, wz).normalize();

            // Speed scaling is now decoupled from wind speed as per user feedback.
        }

        // Update clouds
        for (let i = this.clouds.length - 1; i >= 0; i--) {
            const cloud = this.clouds[i];

            // Use stored inherent speed, independent of wind speed setting
            // Fallback for older clouds or initialization
            if (!cloud.speed) {
                 cloud.speed = 2 + Math.random() * 5;
            }

            const speed = cloud.speed;

            // Move
            cloud.mesh.position.addScaledVector(windVec, speed * dt);

            // Billboard
            cloud.mesh.lookAt(camera.position);

            // Life and Distance check
            cloud.life -= dt;
            const dist = cloud.mesh.position.distanceTo(playerPosition);

            // Opacity Logic
            // Fade in over 5s, fade out over last 5s
            const age = cloud.maxLife - cloud.life;
            const fadeIn = Math.min(age / 5.0, 1.0);
            const fadeOut = Math.min(cloud.life / 5.0, 1.0);
            const opacityFactor = Math.min(fadeIn, fadeOut);

            cloud.mesh.material.opacity = cloud.targetOpacity * opacityFactor;

            if (cloud.life <= 0 || dist > 1500) {
                this._removeCloud(i);
            }
        }
    }

    _spawnCloud(centerPos) {
        // Spawn parameters
        const distance = 300 + Math.random() * 200; // Far away
        const angle = Math.random() * Math.PI * 2;
        const height = 100 + Math.random() * 100; // High above

        const x = centerPos.x + Math.cos(angle) * distance;
        const z = centerPos.z + Math.sin(angle) * distance;
        const y = height; // Absolute height, assuming flat world mostly

        // Use shared geometry
        const targetOpacity = 0.5 + Math.random() * 0.5;
        const material = new THREE.MeshBasicMaterial({
            map: this.texture,
            transparent: true,
            opacity: 0, // Start invisible
            depthWrite: false
        });

        const mesh = new THREE.Mesh(this.geometry, material);
        mesh.position.set(x, y, z);

        // Random scale
        const scale = 1 + Math.random() * 2;
        mesh.scale.set(scale, scale, scale);

        // Velocity is now dynamic based on wind direction, but speed is inherent
        const speed = 2 + Math.random() * 5;

        this.scene.add(mesh);

        const life = 60 + Math.random() * 60; // Long life

        this.clouds.push({
            mesh: mesh,
            speed: speed,
            life: life,
            maxLife: life,
            targetOpacity: targetOpacity
        });
    }

    _removeCloud(index) {
        const cloud = this.clouds[index];
        this.scene.remove(cloud.mesh);
        // Do NOT dispose shared geometry
        cloud.mesh.material.dispose();
        this.clouds.splice(index, 1);
    }
}
