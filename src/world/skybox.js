import * as THREE from 'three';

export class Skybox {
    constructor(scene) {
        this.scene = scene;
        this.sunMesh = null;
        this.moonMesh = null;
        this.starSystem = null;
        this._init();
    }

    _init() {
        // 1. Sun
        // Use a material that is unaffected by light (Basic) and bright
        const sunGeo = new THREE.SphereGeometry(20, 32, 32);
        const sunMat = new THREE.MeshBasicMaterial({ color: 0xffffaa, toneMapped: false });
        this.sunMesh = new THREE.Mesh(sunGeo, sunMat);
        this.scene.add(this.sunMesh);

        // 2. Moon (Dynamic)
        // Standard material to react to light (Phases)
        const moonGeo = new THREE.SphereGeometry(15, 32, 32);
        const moonMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.8,
            metalness: 0.1
        });
        this.moonMesh = new THREE.Mesh(moonGeo, moonMat);
        this.scene.add(this.moonMesh);

        // 3. Stars (Procedural)
        const starCount = 1500;
        const starGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);

        const radius = 450; // Just inside typical far clip (500), far enough to look like sky
        for (let i = 0; i < starCount; i++) {
            // Random point on sphere surface
            const theta = 2 * Math.PI * Math.random();
            const phi = Math.acos(2 * Math.random() - 1);
            const x = radius * Math.sin(phi) * Math.cos(theta);
            const y = radius * Math.sin(phi) * Math.sin(theta);
            const z = radius * Math.cos(phi);

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;

            // Initialize color to white
            colors[i * 3] = 1;
            colors[i * 3 + 1] = 1;
            colors[i * 3 + 2] = 1;
        }

        starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const starMat = new THREE.PointsMaterial({
            size: 2.0,
            sizeAttenuation: true,
            vertexColors: true,
            transparent: true,
            opacity: 1.0,
            depthWrite: false,
            fog: false
        });

        this.starSystem = new THREE.Points(starGeo, starMat);
        this.scene.add(this.starSystem);

        // Ensure background is a Color initially
        this.scene.background = new THREE.Color(0xaaccff);
    }

    update(camPos, timeCycle) {
        if (!timeCycle) return;

        const dist = 400; // Visual distance for Sun/Moon

        // --- Sun ---
        // TimeCycle gives local sun pos (radius 100), normalize for direction
        const sunDir = timeCycle.sunPosition.clone().normalize();
        this.sunMesh.position.copy(camPos).add(sunDir.clone().multiplyScalar(dist));
        this.sunMesh.material.color.copy(timeCycle.sunColor);

        // --- Moon ---
        // Opposite to Sun
        const moonDir = sunDir.clone().negate();
        this.moonMesh.position.copy(camPos).add(moonDir.multiplyScalar(dist));

        // --- Stars ---
        this.starSystem.position.copy(camPos);

        // Star Visibility (Night only)
        // sunIntensity 0 (Night) -> Visibility 1
        // sunIntensity 1 (Day) -> Visibility 0
        // Use a multiplier to fade out quickly at dawn
        const baseOpacity = THREE.MathUtils.clamp(1.0 - (timeCycle.sunIntensity * 1.5), 0, 1);

        if (baseOpacity > 0.01) {
            this.starSystem.visible = true;
            // Twinkle Effect: Modulate vertex colors
            const colors = this.starSystem.geometry.attributes.color;
            const time = Date.now() * 0.003;

            for (let i = 0; i < colors.count; i++) {
                // Pseudo-random offset based on index
                const offset = i * 0.1;
                // Sine wave 0.5 to 1.0 intensity modulation
                const twinkle = 0.7 + 0.3 * Math.sin(time + offset);

                const val = baseOpacity * twinkle;
                colors.setXYZ(i, val, val, val);
            }
            colors.needsUpdate = true;
        } else {
            this.starSystem.visible = false;
        }

        // --- Background ---
        if (this.scene.background instanceof THREE.Color) {
            this.scene.background.copy(timeCycle.skyColor);
        } else {
            this.scene.background = new THREE.Color().copy(timeCycle.skyColor);
        }
    }
}
