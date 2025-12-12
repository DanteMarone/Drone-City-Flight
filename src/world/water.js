// src/world/water.js
import * as THREE from 'three';

export class WaterSystem {
    constructor(scene) {
        this.scene = scene;
        this.mesh = null;
        this.time = 0;

        this._init();
    }

    _init() {
        const geo = new THREE.PlaneGeometry(300, 300, 10, 10);

        const uniforms = {
            uTime: { value: 0 },
            uColor: { value: new THREE.Color(0x0088ff) }
        };

        const mat = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: `
                varying vec2 vUv;
                uniform float uTime;

                void main() {
                    vUv = uv;
                    vec3 pos = position;
                    // Simple sine wave
                    pos.z += sin(pos.x * 0.1 + uTime) * 1.0;
                    pos.z += cos(pos.y * 0.1 + uTime * 0.5) * 0.5;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                varying vec2 vUv;
                uniform float uTime;
                uniform vec3 uColor;

                void main() {
                    // Scrolling noise
                    float noise = sin(vUv.x * 20.0 + uTime) * sin(vUv.y * 20.0 + uTime * 0.5);
                    vec3 color = uColor + noise * 0.1;
                    gl_FragColor = vec4(color, 0.8);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide
        });

        this.mesh = new THREE.Mesh(geo, mat);
        this.mesh.rotation.x = -Math.PI / 2;
        this.mesh.position.set(250, -1, 250); // Place somewhere

        this.scene.add(this.mesh);

        // Add River
        // For MVP, just this lake mesh
    }

    update(dt) {
        this.time += dt;
        if (this.mesh) {
            this.mesh.material.uniforms.uTime.value = this.time;
        }
    }
}
