import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';
import { TextureGenerator } from '../../utils/textures.js';

export class CurveRoadEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'curve_road';

        // Points are expected to be relative to the entity position (which is at p0)
        // p0 is always (0,0,0) locally
        this.p0 = new THREE.Vector3(0, 0, 0);
        this.p1 = params.p1 ? new THREE.Vector3(params.p1.x, params.p1.y, params.p1.z) : new THREE.Vector3(0, 0, 5);
        this.p2 = params.p2 ? new THREE.Vector3(params.p2.x, params.p2.y, params.p2.z) : new THREE.Vector3(10, 0, 5);
        this.p3 = params.p3 ? new THREE.Vector3(params.p3.x, params.p3.y, params.p3.z) : new THREE.Vector3(10, 0, 10);

        this.width = params.width || 10;
        this.segments = params.segments || 32;
    }

    static get displayName() { return 'Curve Road'; }

    createMesh(params) {
        const curve = new THREE.CubicBezierCurve3(
            this.p0,
            this.p1,
            this.p2,
            this.p3
        );

        const geometry = this.createRoadGeometry(curve, this.width, this.segments);

        // Lift slightly to avoid z-fighting with ground
        geometry.translate(0, 0.05, 0);

        const tex = TextureGenerator.createAsphalt();
        tex.repeat.set(1, 1); // We handle V scaling in UV generation

        const material = new THREE.MeshStandardMaterial({
            map: tex,
            roughness: 0.9,
            color: 0xffffff,
            side: THREE.DoubleSide // Since it's a single face strip
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        return mesh;
    }

    createRoadGeometry(curve, width, segments) {
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        const uvs = [];
        const indices = [];

        // Use getSpacedPoints for uniform distribution (arc-length parameterization)
        const points = curve.getSpacedPoints(segments);

        const up = new THREE.Vector3(0, 1, 0);
        let currentLen = 0;

        for (let i = 0; i < points.length; i++) {
            const p = points[i];

            // Calculate tangent
            let tangent;
            if (i === 0) {
                tangent = new THREE.Vector3().subVectors(points[1], points[0]).normalize();
            } else if (i === points.length - 1) {
                tangent = new THREE.Vector3().subVectors(points[i], points[i-1]).normalize();
            } else {
                // Average tangent
                const t1 = new THREE.Vector3().subVectors(points[i], points[i-1]);
                const t2 = new THREE.Vector3().subVectors(points[i+1], points[i]);
                tangent = new THREE.Vector3().addVectors(t1, t2).normalize();
            }

            // Binormal (Right vector) = Up x Tangent
            // If tangent is up, this breaks, but roads are flat-ish.
            const binormal = new THREE.Vector3().crossVectors(up, tangent).normalize();

            const left = new THREE.Vector3().copy(p).addScaledVector(binormal, width / 2);
            const right = new THREE.Vector3().copy(p).addScaledVector(binormal, -width / 2);

            vertices.push(left.x, left.y, left.z);
            vertices.push(right.x, right.y, right.z);

            // UVs
            if (i > 0) {
                currentLen += points[i].distanceTo(points[i-1]);
            }
            // Scale V so that 10 units of length = 1 texture repeat
            const v = currentLen / 10;

            uvs.push(0, v);
            uvs.push(1, v);

            if (i < points.length - 1) {
                const base = i * 2;
                // Face 1 (Triangle 1)
                indices.push(base, base + 2, base + 1);
                // Face 2 (Triangle 2)
                indices.push(base + 1, base + 2, base + 3);
            }
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();

        return geometry;
    }
}

EntityRegistry.register('curve_road', CurveRoadEntity);
