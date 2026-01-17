import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

export class CurveRoadEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'curve_road';
    }

    static get displayName() { return 'Curve Road'; }

    createMesh(params) {
        // Points are relative to the entity anchor (0,0,0)
        // Default curve: A 90 degree turn to the right
        const p0 = new THREE.Vector3(0, 0, 0);
        const p1 = params.p1 ? new THREE.Vector3(params.p1.x, params.p1.y, params.p1.z) : new THREE.Vector3(0, 0, 10);
        const p2 = params.p2 ? new THREE.Vector3(params.p2.x, params.p2.y, params.p2.z) : new THREE.Vector3(10, 0, 10);
        const p3 = params.p3 ? new THREE.Vector3(params.p3.x, params.p3.y, params.p3.z) : new THREE.Vector3(10, 0, 20);

        const curve = new THREE.CubicBezierCurve3(p0, p1, p2, p3);

        const width = params.width || 10;
        const resolution = params.resolution || 20;
        const tubularSegments = Math.max(2, Math.floor(curve.getLength() / 2)); // Dynamic resolution based on length? Or fixed.
        // Let's use fixed or at least sufficient segments.
        const segments = resolution;

        const geometry = new THREE.BufferGeometry();
        const points = curve.getSpacedPoints(segments);
        // Note: computeFrenetFrames is available on the curve, but we want fixed Up vector.

        const vertices = [];
        const uvs = [];
        const indices = [];

        const halfWidth = width / 2;
        const up = new THREE.Vector3(0, 1, 0);

        // Accumulate length for accurate UV mapping (Arc Length Parameterization)
        let totalLength = 0;
        const dists = [0];
        for (let i = 1; i < points.length; i++) {
            const d = points[i].distanceTo(points[i-1]);
            totalLength += d;
            dists.push(totalLength);
        }

        for (let i = 0; i < points.length; i++) {
            const p = points[i];

            // Calculate Tangent
            // For endpoints, we need careful handling, but getSpacedPoints usually gives good results.
            // We can approximate tangent by next/prev points.
            const tangent = new THREE.Vector3();
            if (i < points.length - 1) {
                tangent.subVectors(points[i+1], p).normalize();
            } else {
                tangent.subVectors(p, points[i-1]).normalize();
            }
            // Average tangent for internal points for smoothness?
            if (i > 0 && i < points.length - 1) {
                const t1 = new THREE.Vector3().subVectors(points[i+1], p).normalize();
                const t2 = new THREE.Vector3().subVectors(p, points[i-1]).normalize();
                tangent.addVectors(t1, t2).normalize();
            }

            const side = new THREE.Vector3().crossVectors(up, tangent).normalize();

            const left = new THREE.Vector3().copy(p).addScaledVector(side, halfWidth);
            const right = new THREE.Vector3().copy(p).addScaledVector(side, -halfWidth);

            vertices.push(left.x, left.y + 0.05, left.z); // Lift slightly above ground
            vertices.push(right.x, right.y + 0.05, right.z);

            // UVs
            // U: 0 (Left) to 1 (Right)
            // V: Length along curve
            const v = dists[i] / totalLength;
            uvs.push(0, v);
            uvs.push(1, v);
        }

        for (let i = 0; i < segments; i++) {
            const a = i * 2;
            const b = i * 2 + 1;
            const c = (i + 1) * 2;
            const d = (i + 1) * 2 + 1;

            // Face 1
            indices.push(a, b, d);
            // Face 2
            indices.push(a, d, c);
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();

        const tex = TextureGenerator.createAsphalt();
        // Repeat Y based on real length (e.g., 10 units per repeat)
        tex.repeat.set(1, totalLength / 10);

        const mat = new THREE.MeshStandardMaterial({
            map: tex,
            roughness: 0.9,
            side: THREE.DoubleSide
        });

        const mesh = new THREE.Mesh(geometry, mat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        // Store curve parameters for later editing/serialization
        this.params.p1 = p1;
        this.params.p2 = p2;
        this.params.p3 = p3;
        this.params.width = width;

        return mesh;
    }
}

EntityRegistry.register('curve_road', CurveRoadEntity);
