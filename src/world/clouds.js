import * as THREE from 'three';

export class CloudSystem {
    constructor(scene) {
        this.scene = scene;
        this.clouds = [];
        this.texture = new THREE.TextureLoader().load('textures/cloud.png');
        this.texture.colorSpace = THREE.SRGBColorSpace;

        this.maxClouds = 20;
        this.spawnTimer = 0;
        this.spawnInterval = 2.0; // Seconds between potential spawns
    }

    update(dt, playerPosition, camera) {
        this.spawnTimer += dt;
        if (this.spawnTimer > this.spawnInterval) {
            this.spawnTimer = 0;
            if (this.clouds.length < this.maxClouds) {
                this._spawnCloud(playerPosition);
            }
        }

        // Update clouds
        for (let i = this.clouds.length - 1; i >= 0; i--) {
            const cloud = this.clouds[i];

            // Move
            cloud.mesh.position.add(cloud.velocity.clone().multiplyScalar(dt));

            // Billboard
            cloud.mesh.lookAt(camera.position);

            // Life and Distance check
            cloud.life -= dt;
            const dist = cloud.mesh.position.distanceTo(playerPosition);

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

        const geometry = new THREE.PlaneGeometry(100, 50); // Large clouds
        const material = new THREE.MeshBasicMaterial({
            map: this.texture,
            transparent: true,
            opacity: 0.5 + Math.random() * 0.5,
            depthWrite: false
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, z);

        // Random scale
        const scale = 1 + Math.random() * 2;
        mesh.scale.set(scale, scale, scale);

        // Velocity: Drift slowly
        const speed = 2 + Math.random() * 5;
        // Direction: maybe all clouds move roughly same way (wind) or random?
        // Let's do random drift for now, or fixed wind.
        // "Fly high above the player" suggests maybe moving relative to player?
        // "Slowly fly high above". I'll implement a global wind direction.
        const windDir = new THREE.Vector3(1, 0, 0.5).normalize();
        const velocity = windDir.multiplyScalar(speed);

        this.scene.add(mesh);

        this.clouds.push({
            mesh: mesh,
            velocity: velocity,
            life: 60 + Math.random() * 60 // Long life
        });
    }

    _removeCloud(index) {
        const cloud = this.clouds[index];
        this.scene.remove(cloud.mesh);
        cloud.mesh.geometry.dispose();
        cloud.mesh.material.dispose();
        this.clouds.splice(index, 1);
    }
}
