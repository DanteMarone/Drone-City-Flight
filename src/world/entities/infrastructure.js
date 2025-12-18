import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

export class RoadEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'road';
    }

    static get displayName() { return 'Road'; }

    createMesh(params) {
        const w = params.width || 10;
        const l = params.length || 10;
        this.params.width = w;
        this.params.length = l;

        const tex = TextureGenerator.createAsphalt();
        tex.repeat.set(1, 1);

        const mat = new THREE.MeshStandardMaterial({
            map: tex,
            roughness: 0.9,
            color: 0xffffff
        });

        const geo = new THREE.PlaneGeometry(w, l);
        geo.rotateX(-Math.PI / 2);
        geo.translate(0, 0.05, 0);

        const mesh = new THREE.Mesh(geo, mat);
        mesh.receiveShadow = true;

        this.updateTexture(mesh);

        return mesh;
    }

    updateTexture(mesh) {
        if (mesh && mesh.material.map) {
            const totalLength = this.params.length * mesh.scale.z;
            mesh.material.map.repeat.y = Math.max(1, totalLength / 10);
        }
    }

    update(dt) {
        if (this.mesh) {
            this.updateTexture(this.mesh);
        }
    }
}

export class RiverEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'river';
        this.waypoints = (params.waypoints || []).map(w => new THREE.Vector3(w.x, w.y, w.z));

        // Ensure we have at least one waypoint to form a segment (Mesh Pos -> Waypoint 0)
        if (this.waypoints.length === 0) {
            // Default segment length 50 along Z
            const x = params.x || 0;
            const y = params.y || 0;
            const z = params.z || 0;
            this.waypoints.push(new THREE.Vector3(x, y, z + 50));
        }

        this.time = 0;
    }

    static get displayName() { return 'River'; }

    createMesh(params) {
        const geometry = new THREE.BufferGeometry();

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

                    // Vertex Undulation
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
                    vec2 flowUv = vUv;
                    flowUv.y -= uTime * uSpeed * 0.1;

                    float ripples = sin(flowUv.y * 20.0 + sin(flowUv.x * 10.0));
                    float n = noise(flowUv * vec2(10.0, 1.0));

                    float detail = mix(ripples, n, 0.5);
                    float edgeDist = abs(vUv.x - 0.5) * 2.0;
                    float foam = smoothstep(0.85, 1.0, edgeDist);

                    vec3 waterColor = mix(uColorDeep, uColorShallow, detail * 0.3 + 0.4);
                    vec3 finalColor = mix(waterColor, vec3(1.0), foam);

                    gl_FragColor = vec4(finalColor, 0.9);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide
        });

        const mesh = new THREE.Mesh(geometry, material);
        return mesh;
    }

    postInit() {
        if (this.mesh) {
            // Setup for DevMode interactions
            this.mesh.userData.waypoints = this.waypoints;
            this.mesh.userData.isPath = true;

            // Initial build
            this.rebuildGeometry();

            // Visual helpers
            this._createWaypointVisuals();
        }
    }

    _createWaypointVisuals() {
        this.waypointGroup = new THREE.Group();
        this.waypointGroup.name = 'waypointVisuals_WorldSpace';
        this.waypointGroup.visible = false;
        this.mesh.userData.waypointGroup = this.waypointGroup;

        this._refreshWaypointVisuals();
    }

    _refreshWaypointVisuals() {
        if (!this.waypointGroup) return;
        while(this.waypointGroup.children.length > 0) {
            this.waypointGroup.remove(this.waypointGroup.children[0]);
        }

        // Use 0.5 radius to match DevMode defaults for consistency
        const orbGeo = new THREE.SphereGeometry(0.5, 16, 16);
        const orbMat = new THREE.MeshBasicMaterial({ color: 0x00ffff }); // Cyan

        this.waypoints.forEach((pos, i) => {
            const orb = new THREE.Mesh(orbGeo, orbMat);
            orb.position.copy(pos);
            orb.userData = { type: 'waypoint', isHelper: true, index: i, vehicle: this.mesh };
            this.waypointGroup.add(orb);
        });

        // Add line
        if (this.waypoints.length > 0) {
             const points = [this.mesh.position.clone(), ...this.waypoints];
             const geometry = new THREE.BufferGeometry().setFromPoints(points);
             const material = new THREE.LineBasicMaterial({ color: 0x00ffff });
             const line = new THREE.Line(geometry, material);
             line.name = 'pathLine';
             this.waypointGroup.add(line);
        }
    }

    rebuildGeometry() {
        if (!this.mesh) return;

        const worldPoints = [this.mesh.position.clone(), ...(this.mesh.userData.waypoints || this.waypoints)];

        if (worldPoints.length < 2) {
            return;
        }

        const points = worldPoints.map(p => p.clone().sub(this.mesh.position));

        const curve = new THREE.CatmullRomCurve3(points);
        const width = this.params.width || 40;
        const segments = Math.max(20, points.length * 20);

        const geometry = this._generateRibbonGeometry(curve, width, segments);

        if (this.mesh.geometry) this.mesh.geometry.dispose();
        this.mesh.geometry = geometry;
    }

    _generateRibbonGeometry(curve, width, segments) {
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        const uvs = [];
        const indices = [];

        const points = curve.getSpacedPoints(segments);
        const up = new THREE.Vector3(0, 1, 0);

        for (let i = 0; i < points.length; i++) {
            const p = points[i];

            let tangent;
            if (i < points.length - 1) {
                tangent = points[i+1].clone().sub(p).normalize();
            } else if (i > 0) {
                tangent = p.clone().sub(points[i-1]).normalize();
            } else {
                tangent = new THREE.Vector3(0, 0, 1);
            }

            const side = new THREE.Vector3().crossVectors(up, tangent).normalize().multiplyScalar(width / 2);

            const v1 = p.clone().add(side);
            const v2 = p.clone().sub(side);

            const yOffset = 1.0;

            vertices.push(v1.x, v1.y + yOffset, v1.z);
            vertices.push(v2.x, v2.y + yOffset, v2.z);

            const v = i / segments;
            uvs.push(0, v);
            uvs.push(1, v);
        }

        for (let i = 0; i < segments; i++) {
            const a = i * 2;
            const b = i * 2 + 1;
            const c = (i + 1) * 2;
            const d = (i + 1) * 2 + 1;

            indices.push(a, b, c);
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
        if (this.mesh && this.mesh.material.uniforms) {
            this.mesh.material.uniforms.uTime.value = this.time;
        }
    }

    serialize() {
        const data = super.serialize();
        data.params.waypoints = this.mesh?.userData?.waypoints || this.waypoints;
        return data;
    }
}

export class SidewalkEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'sidewalk';
    }

    static get displayName() { return 'Sidewalk'; }

    createMesh(params) {
        const w = 1;
        const l = 5;
        const h = 0.2;

        const geo = new THREE.BoxGeometry(w, h, l);
        geo.translate(0, h / 2, 0);

        const concreteTex = TextureGenerator.createConcrete();
        const sidewalkTex = TextureGenerator.createSidewalk();

        const materials = [
            new THREE.MeshStandardMaterial({ map: concreteTex, color: 0xaaaaaa, roughness: 0.8 }),
            new THREE.MeshStandardMaterial({ map: concreteTex, color: 0xaaaaaa, roughness: 0.8 }),
            new THREE.MeshStandardMaterial({ map: sidewalkTex, color: 0xffffff, roughness: 0.8 }),
            new THREE.MeshStandardMaterial({ map: concreteTex, color: 0xaaaaaa, roughness: 0.8 }),
            new THREE.MeshStandardMaterial({ map: concreteTex, color: 0xaaaaaa, roughness: 0.8 }),
            new THREE.MeshStandardMaterial({ map: concreteTex, color: 0xaaaaaa, roughness: 0.8 }),
        ];

        const mesh = new THREE.Mesh(geo, materials);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return mesh;
    }
}

EntityRegistry.register('road', RoadEntity);
EntityRegistry.register('river', RiverEntity);
EntityRegistry.register('sidewalk', SidewalkEntity);
