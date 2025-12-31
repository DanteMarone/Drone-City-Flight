import * as THREE from 'three';

export const WEATHER_TYPES = {
    SUNNY: 'Sunny',
    CLOUDY: 'Cloudy',
    RAINY: 'Rainy',
    SNOWY: 'Snowy'
};

export class WeatherSystem {
    constructor(world) {
        this.world = world;
        this.scene = world.scene;

        // Configuration
        this.currentWeather = WEATHER_TYPES.SUNNY;
        this.selectedPatterns = new Set([WEATHER_TYPES.SUNNY]);
        this.cycleDuration = 600; // Seconds (10 minutes default)
        this.cycleTimer = 0;

        // Particles
        this.rainSystem = null;
        this.snowSystem = null;

        this._initParticles();
    }

    _initParticles() {
        // --- Rain ---
        const rainCount = 15000;
        const rainGeo = new THREE.BufferGeometry();
        const rainPos = [];
        const rainVel = [];

        for (let i = 0; i < rainCount; i++) {
            rainPos.push(
                (Math.random() - 0.5) * 400,
                Math.random() * 200,
                (Math.random() - 0.5) * 400
            );
            rainVel.push(0, -10 - Math.random() * 5, 0); // Falling down
        }

        rainGeo.setAttribute('position', new THREE.Float32BufferAttribute(rainPos, 3));
        rainGeo.setAttribute('velocity', new THREE.Float32BufferAttribute(rainVel, 3));

        const rainMat = new THREE.PointsMaterial({
            color: 0xaaaaaa,
            size: 0.5,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.rainSystem = new THREE.Points(rainGeo, rainMat);
        this.rainSystem.visible = false;
        // Attach to camera or scene? If scene, need to move with camera.
        // Attaching to scene and updating position in update() is better to avoid jitter.
        this.scene.add(this.rainSystem);


        // --- Snow ---
        const snowCount = 15000;
        const snowGeo = new THREE.BufferGeometry();
        const snowPos = [];
        const snowVel = [];

        for (let i = 0; i < snowCount; i++) {
            snowPos.push(
                (Math.random() - 0.5) * 400,
                Math.random() * 200,
                (Math.random() - 0.5) * 400
            );
            snowVel.push(
                (Math.random() - 0.5) * 2, // Drift X
                -2 - Math.random() * 2,    // Falling
                (Math.random() - 0.5) * 2  // Drift Z
            );
        }

        snowGeo.setAttribute('position', new THREE.Float32BufferAttribute(snowPos, 3));
        snowGeo.setAttribute('velocity', new THREE.Float32BufferAttribute(snowVel, 3));

        const snowMat = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.8,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.snowSystem = new THREE.Points(snowGeo, snowMat);
        this.snowSystem.visible = false;
        this.scene.add(this.snowSystem);
    }

    update(dt, camera) {
        // Handle Cycling
        if (this.selectedPatterns.size > 1) {
            this.cycleTimer += dt;
            if (this.cycleTimer >= this.cycleDuration) {
                this.cycleTimer = 0;
                this._cycleNext();
            }
        }

        // Update Particles
        if (this.currentWeather === WEATHER_TYPES.RAINY) {
            this._updateParticles(this.rainSystem, dt, camera, 200);
        } else if (this.currentWeather === WEATHER_TYPES.SNOWY) {
            this._updateParticles(this.snowSystem, dt, camera, 200);
        }
    }

    _cycleNext() {
        const types = Array.from(this.selectedPatterns);
        if (types.length === 0) return;

        let idx = types.indexOf(this.currentWeather);
        idx = (idx + 1) % types.length;
        this.setWeather(types[idx]);
    }

    setWeather(type) {
        if (!Object.values(WEATHER_TYPES).includes(type)) return;
        this.currentWeather = type;

        // Reset visibility
        this.rainSystem.visible = (type === WEATHER_TYPES.RAINY);
        this.snowSystem.visible = (type === WEATHER_TYPES.SNOWY);

        // Update Clouds
        if (this.world.clouds) {
            this.world.clouds.setWeather(type);
        }

        // Update Skybox/Fog if needed?
        // Let's assume CloudSystem handles the main visual "mood" for now via cloud cover.
        // Ideally we'd darken the ambient light too, but let's start here.
    }

    setCycleDuration(seconds) {
        this.cycleDuration = Math.max(30, Math.min(3600, seconds));
    }

    togglePattern(type, enabled) {
        if (enabled) {
            this.selectedPatterns.add(type);
        } else {
            this.selectedPatterns.delete(type);
            // Don't allow empty set, default to Sunny
            if (this.selectedPatterns.size === 0) {
                this.selectedPatterns.add(WEATHER_TYPES.SUNNY);
            }
        }

        // If current weather is no longer selected, switch
        if (!this.selectedPatterns.has(this.currentWeather)) {
            this.setWeather(Array.from(this.selectedPatterns)[0]);
        }
    }

    _updateParticles(system, dt, camera, heightRange) {
        const positions = system.geometry.attributes.position.array;
        const velocities = system.geometry.attributes.velocity.array;

        // Move with camera (infinite field logic)
        // Center the particle field on the camera's XZ
        const cx = camera.position.x;
        const cy = camera.position.y;
        const cz = camera.position.z;

        for (let i = 0; i < positions.length; i += 3) {
            // Apply velocity
            positions[i] += velocities[i] * dt;
            positions[i + 1] += velocities[i + 1] * dt;
            positions[i + 2] += velocities[i + 2] * dt;

            // Wrap around
            // Relative to camera
            const x = positions[i];
            const y = positions[i + 1];
            const z = positions[i + 2];

            // Wrap X
            if (x < cx - 200) positions[i] += 400;
            if (x > cx + 200) positions[i] -= 400;

            // Wrap Z
            if (z < cz - 200) positions[i + 2] += 400;
            if (z > cz + 200) positions[i + 2] -= 400;

            // Wrap Y (Height)
            // Rain falls from above camera to below
            // Keep particles within [cy - 50, cy + 150] roughly?
            // Or just fixed world height? Fixed world height is bad if drone flies high.
            // Let's wrap relative to camera Y.
            if (y < cy - 50) positions[i + 1] += 200;
            // Also clamp if it gets too high (unlikely with gravity)
            if (y > cy + 150) positions[i + 1] -= 200;
        }

        system.geometry.attributes.position.needsUpdate = true;

        // Center the whole system? No, we modify vertices directly to wrap around camera.
        // So mesh position can stay at 0,0,0
    }
}
