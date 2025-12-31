import * as THREE from 'three';

const vertexShader = `
varying vec2 vUv;
varying vec3 vWorldPosition;

void main() {
    vUv = uv;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`;

const fragmentShader = `
uniform float uTime;
uniform vec3 uSunPosition;
uniform vec3 uSunColor;
uniform vec3 uAmbientColor;
uniform vec2 uWind;
uniform vec3 uCloudColor;
uniform float uCover; // 0.0 (clear) to 1.0 (overcast)
uniform vec3 uCameraPosition;

varying vec2 vUv;
varying vec3 vWorldPosition;

// 2D Hash
float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

// 2D Value Noise
float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float res = mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), f.x),
                    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
    return res;
}

// FBM
float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
    for (int i = 0; i < 5; i++) {
        v += a * noise(p);
        p = rot * p * 2.0 + 10.0;
        a *= 0.5;
    }
    return v;
}

void main() {
    // Coordinate for noise
    // Scale noise for the huge plane
    vec2 coord = vWorldPosition.xz * 0.002;

    // Add Wind scroll
    coord += uWind * uTime * 0.05;

    // FBM Noise
    float n = fbm(coord);

    // Shape the clouds
    // uCover varies from 0.0 (sunny) to 1.0 (overcast)
    // We map uCover to the threshold.
    // Sunny (0.0) -> threshold 1.0 (no clouds)
    // Cloudy (0.5) -> threshold 0.5
    // Overcast (1.0) -> threshold 0.2

    float threshold = mix(1.2, 0.3, uCover); // 1.2 ensures clear sky at uCover=0

    // Smoothstep for density
    float density = smoothstep(threshold - 0.1, threshold + 0.1, n);

    // Soft edges
    if (density < 0.01) discard;

    // Lighting
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    vec3 sunDir = normalize(uSunPosition);

    // Lighting Mix
    vec3 lighting = uAmbientColor + uSunColor * 0.8;

    // Sun Scatter
    float sunDot = max(0.0, dot(viewDir, sunDir));
    float scatter = pow(sunDot, 12.0);
    vec3 scatterColor = uSunColor * scatter * 2.0;

    // Distance Fade
    float dist = distance(vWorldPosition.xz, cameraPosition.xz);
    float fadeRadius = 1500.0;
    float distFade = smoothstep(fadeRadius + 400.0, fadeRadius, dist);

    vec3 finalColor = uCloudColor * lighting + scatterColor;

    // Alpha
    float alpha = density * distFade * 0.9;

    gl_FragColor = vec4(finalColor, alpha);
}
`;

export class CloudSystem {
    constructor(scene) {
        this.scene = scene;
        this.currentCover = 0.5;
        this.targetCover = 0.5;
        this.currentCloudColor = new THREE.Color(1, 1, 1);
        this.targetCloudColor = new THREE.Color(1, 1, 1);

        // Overhead Plane
        this.geometry = new THREE.PlaneGeometry(4000, 4000);

        this.uniforms = {
            uTime: { value: 0 },
            uSunPosition: { value: new THREE.Vector3(0, 100, 0) },
            uSunColor: { value: new THREE.Color(1, 1, 1) },
            uAmbientColor: { value: new THREE.Color(0.5, 0.5, 0.5) },
            uWind: { value: new THREE.Vector2(0.1, 0) },
            uCloudColor: { value: new THREE.Color(1.0, 1.0, 1.0) },
            uCover: { value: 0.5 }
        };

        this.material = new THREE.ShaderMaterial({
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            uniforms: this.uniforms,
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false
        });

        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.frustumCulled = false;
        this.mesh.rotation.x = -Math.PI / 2;

        this.scene.add(this.mesh);
    }

    setWeather(type) {
        // WEATHER_TYPES strings match logic in WeatherSystem
        switch (type) {
            case 'Sunny':
                this.targetCover = 0.0;
                this.targetCloudColor.setHex(0xffffff);
                break;
            case 'Cloudy':
                this.targetCover = 0.6;
                this.targetCloudColor.setHex(0xffffff);
                break;
            case 'Rainy':
                this.targetCover = 0.8;
                this.targetCloudColor.setHex(0x555555); // Dark grey
                break;
            case 'Snowy':
                this.targetCover = 0.8;
                this.targetCloudColor.setHex(0xaaaaaa); // Light grey
                break;
        }
    }

    update(dt, playerPosition, camera, windConfig, timeCycle) {
        // Lerp Cover and Color
        const lerpSpeed = dt * 0.5; // Slow transition
        this.currentCover = THREE.MathUtils.lerp(this.currentCover, this.targetCover, lerpSpeed);
        this.currentCloudColor.lerp(this.targetCloudColor, lerpSpeed);

        this.uniforms.uCover.value = this.currentCover;
        this.uniforms.uCloudColor.value.copy(this.currentCloudColor);

        // Update Time
        this.uniforms.uTime.value += dt;

        // Update Wind
        if (windConfig) {
             const rad = windConfig.direction * (Math.PI / 180);
             const speed = Math.max(windConfig.speed, 5);
             const wx = Math.sin(rad) * (speed / 20.0);
             const wy = -Math.cos(rad) * (speed / 20.0);
             this.uniforms.uWind.value.set(wx, wy);
        }

        // Update Lighting
        if (timeCycle) {
            this.uniforms.uSunPosition.value.copy(timeCycle.sunPosition).normalize();
            this.uniforms.uSunColor.value.copy(timeCycle.sunColor);
            this.uniforms.uAmbientColor.value.copy(timeCycle.ambientColor);
        }

        // Follow camera
        this.mesh.position.set(camera.position.x, 200, camera.position.z);
    }
}
