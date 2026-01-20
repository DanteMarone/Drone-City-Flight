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
        // Curve parameters
        // Default: A simple S-curve if no params provided
        const p0 = new THREE.Vector3(0, 0, 0); // Local origin
        const p1 = params.p1 ? new THREE.Vector3(params.p1.x, params.p1.y, params.p1.z) : new THREE.Vector3(10, 0, 0);
        const p2 = params.p2 ? new THREE.Vector3(params.p2.x, params.p2.y, params.p2.z) : new THREE.Vector3(20, 0, 10);
        const p3 = params.p3 ? new THREE.Vector3(params.p3.x, params.p3.y, params.p3.z) : new THREE.Vector3(30, 0, 10);

        this.curve = new THREE.CubicBezierCurve3(p0, p1, p2, p3);

        // Save control points for serialization/editing
        this.params.p1 = { x: p1.x, y: p1.y, z: p1.z };
        this.params.p2 = { x: p2.x, y: p2.y, z: p2.z };
        this.params.p3 = { x: p3.x, y: p3.y, z: p3.z };

        const width = params.width || 10;
        this.params.width = width;
        const resolution = 20; // Number of segments

        const geometry = this.createRibbonGeometry(this.curve, resolution, width);

        const tex = TextureGenerator.createAsphalt();
        const length = this.curve.getLength();

        // UV Scale:
        // u: 1 (across width)
        // v: length / 10 (along curve, repeats every ~10 units)
        tex.repeat.set(1, Math.max(1, length / 10));
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;

        const mat = new THREE.MeshStandardMaterial({
            map: tex,
            roughness: 0.9,
            color: 0xffffff,
            side: THREE.DoubleSide // Important so we see it from both sides if slightly elevated
        });

        const mesh = new THREE.Mesh(geometry, mat);
        mesh.receiveShadow = true;

        // Lift slightly to avoid z-fighting with ground
        mesh.position.y = 0.05;

        // Store the curve length for updates
        this.curveLength = length;

        return mesh;
    }

    createRibbonGeometry(curve, segments, width) {
        const geometry = new THREE.BufferGeometry();
        const points = curve.getSpacedPoints(segments);
        const count = points.length;

        const vertices = [];
        const uvs = [];
        const indices = [];

        const up = new THREE.Vector3(0, 1, 0);
        const tangent = new THREE.Vector3();
        const binormal = new THREE.Vector3();

        // Total length approximation for UV mapping
        let totalLen = 0;
        const dists = [0];
        for (let i = 1; i < count; i++) {
            const d = points[i].distanceTo(points[i-1]);
            totalLen += d;
            dists.push(totalLen);
        }

        for (let i = 0; i < count; i++) {
            const pt = points[i];

            // Get tangent
            if (i < count - 1) {
                tangent.subVectors(points[i+1], pt).normalize();
            } else {
                tangent.subVectors(pt, points[i-1]).normalize();
            }

            // Calculate binormal (right vector)
            binormal.crossVectors(tangent, up).normalize();

            // Vertices
            // Left:  P + binormal * w/2 (since binormal points Left/(-X))
            // Right: P - binormal * w/2
            vertices.push(
                pt.x + binormal.x * width * 0.5,
                pt.y,
                pt.z + binormal.z * width * 0.5
            );

            vertices.push(
                pt.x - binormal.x * width * 0.5,
                pt.y,
                pt.z - binormal.z * width * 0.5
            );

            // UVs
            const v = dists[i] / totalLen; // Normalize 0..1, material handles repeat
            uvs.push(0, v);
            uvs.push(1, v);
        }

        // Indices
        for (let i = 0; i < count - 1; i++) {
            const base = i * 2;
            // Triangle 1: base (Left_i), base+2 (Left_i+1), base+1 (Right_i)
            // Vector 1: Left_i -> Left_i+1 (Forward Z)
            // Vector 2: Left_i -> Right_i (Right X)
            // Cross(Z, X) = Up (Y)
            indices.push(base, base + 2, base + 1);

            // Triangle 2: base+1 (Right_i), base+2 (Left_i+1), base+3 (Right_i+1)
            // Vector 1: Right_i -> Left_i+1 (Forward Z + Left -X) -> Diagonal
            // Vector 2: Right_i -> Right_i+1 (Forward Z)
            // Let's verify:
            // Triangle 2: base+1 -> base+2 -> base+3
            // V1 = base+2 - base+1 (Forward Z - Right X)
            // V2 = base+3 - base+1 (Forward Z)
            // Cross( (Z-X), Z ) = ZxZ - XxZ = 0 - (-Y) = Y.
            // Correct.
            indices.push(base + 1, base + 2, base + 3);
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();

        return geometry;
    }
}

EntityRegistry.register('curve_road', CurveRoadEntity);
