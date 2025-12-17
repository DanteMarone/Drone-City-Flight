import * as THREE from 'three';

export class TimeCycle {
    constructor() {
        this.time = 12.0; // Start at noon
        this.speed = 0.0; // Default static, changed by World/Config
        this.isLocked = false;

        // Configuration for visual cycle
        this.sunPosition = new THREE.Vector3();
        this.sunColor = new THREE.Color();
        this.skyColor = new THREE.Color();
        this.ambientColor = new THREE.Color();
        this.ambientIntensity = 0.6;
        this.sunIntensity = 1.0;
        this.fogColor = new THREE.Color();

        // Keyframes for interpolation
        this._keyframes = [
            { time: 0,  sun: 0x000000, sky: 0x000005, ambient: 0x000022, sunInt: 0.0, ambInt: 0.2 }, // Midnight
            { time: 5,  sun: 0x332200, sky: 0x111122, ambient: 0x111133, sunInt: 0.0, ambInt: 0.3 }, // Dawn
            { time: 6,  sun: 0xff6600, sky: 0xffaa00, ambient: 0x442200, sunInt: 0.5, ambInt: 0.4 }, // Sunrise
            { time: 8,  sun: 0xffddaa, sky: 0x88ccff, ambient: 0x666666, sunInt: 1.0, ambInt: 0.6 }, // Morning
            { time: 12, sun: 0xffffff, sky: 0xaaccff, ambient: 0x888888, sunInt: 1.2, ambInt: 0.7 }, // Noon
            { time: 16, sun: 0xffddaa, sky: 0x88ccff, ambient: 0x666666, sunInt: 1.0, ambInt: 0.6 }, // Afternoon
            { time: 18, sun: 0xff6600, sky: 0xffaa00, ambient: 0x442200, sunInt: 0.5, ambInt: 0.4 }, // Sunset
            { time: 19, sun: 0x332200, sky: 0x111122, ambient: 0x111133, sunInt: 0.0, ambInt: 0.3 }, // Dusk
            { time: 24, sun: 0x000000, sky: 0x000005, ambient: 0x000022, sunInt: 0.0, ambInt: 0.2 }  // Midnight loop
        ];
    }

    update(dt) {
        if (!this.isLocked && this.speed > 0) {
            // speed = 1 means 24 game hours = 24 real hours?
            // Requirement:
            // 0 = Static
            // 1 = Real-time (24h takes 24h) => 1 game hour per 1 real hour => 1/3600 game hours per second.
            // 60 = 1 game minute per real second => 60 game minutes per 1 real minute => 1 game hour per 1 real minute.
            // Wait, "60 = 1 game minute per real second".
            // Real second = 1s. Game minute = 1/60th of an hour.
            // So speed 60 => rate is (1/60) hours per second?

            // Let's redefine speed for easier calculation.
            // Let's say speed is "Game Seconds per Real Second".
            // If speed = 1, 1 game sec = 1 real sec.
            // 24 hours = 86400 seconds.
            // time is in Hours (0-24).

            // If input is "Day Speed", let's assume the user input 60 means "60x speed".
            // 1x = real time.
            // 60x = 1 real sec = 60 game secs = 1 game minute. This matches requirement.

            // Increase time (hours)
            // dt is in seconds.
            // hours_to_add = (dt * speed) / 3600.

            this.time += (dt * this.speed) / 3600.0;
            if (this.time >= 24) this.time -= 24;
        }

        this._updateSunPosition();
        this._updateLightingValues();
    }

    _updateSunPosition() {
        // Simple orbit: Rise in East (+X?), Set in West (-X?)
        // Noon is +Y.
        // Let's use standard trig.
        // Time 6 = 0 deg (Horizon).
        // Time 12 = 90 deg (Zenith).

        // Angle in radians
        // 0h = -90 deg (-PI/2) ? No, 0h is midnight.
        // Let's map 0..24 to 0..2PI.
        // But we want 12 to be top.
        // So offset by -PI/2?

        // Theta = (this.time / 24) * Math.PI * 2 - (Math.PI / 2);
        // If time=12: PI - PI/2 = PI/2. Sin(PI/2)=1 (Y). Cos(PI/2)=0. Correct.
        // If time=6: PI/2 - PI/2 = 0. Sin(0)=0. Cos(0)=1. Correct (X).
        // If time=18: 1.5PI - 0.5PI = PI. Sin(PI)=0. Cos(PI)=-1. Correct (-X).
        // If time=0: -PI/2. Sin=-1. Cos=0. Correct (-Y).

        const theta = (this.time / 24) * Math.PI * 2 - (Math.PI / 2);
        const radius = 100; // Distance of sun visual

        this.sunPosition.set(
            Math.cos(theta) * radius,
            Math.sin(theta) * radius,
            0 // Simple 2D orbit for now, maybe add Z tilt later
        );
    }

    _updateLightingValues() {
        // Find current keyframe segment
        // Handle wrap around (0 and 24 are same)
        let t = this.time;
        if (t >= 24) t -= 24; // safety

        let k1 = this._keyframes[0];
        let k2 = this._keyframes[this._keyframes.length - 1];

        for (let i = 0; i < this._keyframes.length - 1; i++) {
            if (t >= this._keyframes[i].time && t < this._keyframes[i+1].time) {
                k1 = this._keyframes[i];
                k2 = this._keyframes[i+1];
                break;
            }
        }

        const range = k2.time - k1.time;
        const alpha = (t - k1.time) / range;

        // Lerp Colors
        const cSun1 = new THREE.Color(k1.sun);
        const cSun2 = new THREE.Color(k2.sun);
        this.sunColor.copy(cSun1).lerp(cSun2, alpha);

        const cSky1 = new THREE.Color(k1.sky);
        const cSky2 = new THREE.Color(k2.sky);
        this.skyColor.copy(cSky1).lerp(cSky2, alpha);

        const cAmb1 = new THREE.Color(k1.ambient);
        const cAmb2 = new THREE.Color(k2.ambient);
        this.ambientColor.copy(cAmb1).lerp(cAmb2, alpha);

        // Fog matches Sky
        this.fogColor.copy(this.skyColor);

        // Lerp Intensities
        this.sunIntensity = THREE.MathUtils.lerp(k1.sunInt, k2.sunInt, alpha);
        this.ambientIntensity = THREE.MathUtils.lerp(k1.ambInt, k2.ambInt, alpha);
    }
}
