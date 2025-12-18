import * as THREE from 'three';

export class WaterSystem {
    constructor(scene) {
        this.scene = scene;
        this.mesh = null;
        this.time = 0;

        this._init();
    }

    _init() {
        // 1. Define Control Points for the River
        // Spanning Z -1000 to +1000 with a gentle S-curve
        const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(-100, 0, -1000),
            new THREE.Vector3(50, 0, 0),
            new THREE.Vector3(-100, 0, 1000)
        ]);

        // 2. Generate Custom Ribbon Geometry
        // Width ~50 units, high segment count for smooth curve
        const geometry = this._generateRibbonGeometry(curve, 50, 200);

        // 3. Shader Setup
        const uniforms = {
            uTime: { value: 0 },
            uSpeed: { value: 2.0 },
            uColorDeep: { value: new THREE.Color(0x004488) },
            uColorShallow: { value: new THREE.Color(0x0088ff) }
        };

        const material = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: `
                varying vec2 vUv;
                uniform float uTime;

                void main() {
                    vUv = uv;
                    vec3 pos = position;

                    // Vertex Undulation: subtle wave effect
                    float wave = sin(pos.z * 0.05 + uTime * 2.0) * 0.5;
                    pos.y += wave;

                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                varying vec2 vUv;
                uniform float uTime;
                uniform float uSpeed;
                uniform vec3 uColorDeep;
                uniform vec3 uColorShallow;

                // Simple pseudo-random noise
                float rand(vec2 n) {
                    return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
                }

                float noise(vec2 p) {
                    vec2 ip = floor(p);
                    vec2 u = fract(p);
                    u = u*u*(3.0-2.0*u);

                    float res = mix(
                        mix(rand(ip), rand(ip+vec2(1.0,0.0)), u.x),
                        mix(rand(ip+vec2(0.0,1.0)), rand(ip+vec2(1.0,1.0)), u.x), u.y);
                    return res*res;
                }

                void main() {
                    // Flow Logic: Scroll UVs along Y (length)
                    vec2 flowUv = vUv;
                    flowUv.y -= uTime * uSpeed * 0.1;

                    // Generate Ripples
                    // Combine sin waves and noise for water surface look
                    float ripples = sin(flowUv.y * 20.0 + sin(flowUv.x * 10.0));
                    float n = noise(flowUv * vec2(10.0, 1.0));

                    float detail = mix(ripples, n, 0.5);

                    // Edge Foam Logic
                    // UV.x goes 0..1 across width. 0 is Left Bank, 1 is Right Bank.
                    float edgeDist = abs(vUv.x - 0.5) * 2.0; // 0 at center, 1 at edges
                    float foam = smoothstep(0.85, 1.0, edgeDist); // Foam appears near banks

                    // Color Mixing
                    // Mix Deep and Shallow based on detail/noise
                    vec3 waterColor = mix(uColorDeep, uColorShallow, detail * 0.3 + 0.4);

                    // Apply Foam (White)
                    vec3 finalColor = mix(waterColor, vec3(1.0), foam);

                    gl_FragColor = vec4(finalColor, 0.9);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide
        });

        this.mesh = new THREE.Mesh(geometry, material);
        // Slight offset to avoid Z-fighting with ground plane (assuming ground at Y=0)
        this.mesh.position.y = 0.2;

        // Ensure the mesh is treated properly for raycasting/physics if needed later
        this.mesh.userData = { type: 'water' };

        this.scene.add(this.mesh);
    }

    _generateRibbonGeometry(curve, width, segments) {
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        const uvs = [];
        const indices = [];

        const points = curve.getSpacedPoints(segments);
        // We assume Up is Y-axis for a flat river on XZ plane
        const up = new THREE.Vector3(0, 1, 0);

        for (let i = 0; i < points.length; i++) {
            const p = points[i];

            // Calculate Tangent (Forward direction)
            let tangent;
            if (i < points.length - 1) {
                tangent = points[i+1].clone().sub(p).normalize();
            } else if (i > 0) {
                tangent = p.clone().sub(points[i-1]).normalize();
            } else {
                tangent = new THREE.Vector3(0, 0, 1);
            }

            // Calculate Binormal (Side vector)
            // Cross product of Up and Tangent gives vector pointing Right
            const side = new THREE.Vector3().crossVectors(up, tangent).normalize().multiplyScalar(width / 2);

            // Left Vertex (UV.x = 0)
            const v1 = p.clone().add(side);
            // Right Vertex (UV.x = 1)
            const v2 = p.clone().sub(side);

            vertices.push(v1.x, v1.y, v1.z);
            vertices.push(v2.x, v2.y, v2.z);

            // UVs
            const v = i / segments; // Lengthwise 0..1
            uvs.push(0, v);
            uvs.push(1, v);
        }

        // Generate Indices for Triangles
        for (let i = 0; i < segments; i++) {
            const a = i * 2;
            const b = i * 2 + 1;
            const c = (i + 1) * 2;
            const d = (i + 1) * 2 + 1;

            // Two triangles per segment
            // Triangle 1: a -> b -> c
            indices.push(a, b, c);
            // Triangle 2: b -> d -> c
            indices.push(b, d, c);
        }

        geometry.setIndex(indices);
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geometry.computeVertexNormals();

        return geometry;
    }

    update(dt) {
        this.time += dt;
        if (this.mesh) {
            this.mesh.material.uniforms.uTime.value = this.time;
        }
    }
}
