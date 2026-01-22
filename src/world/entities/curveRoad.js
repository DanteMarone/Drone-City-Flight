import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { TextureGenerator } from '../../utils/textures.js';

export class CurveRoadEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'curve_road';
        // params: p1, p2, p3 (Vectors or objects {x,y,z})
        // width: road width
    }

    static get displayName() { return 'Curve Road'; }

    createMesh(params) {
        const p0 = new THREE.Vector3(0, 0, 0);
        const p1 = this._toVector(params.p1 || { x: 0, y: 0, z: 10 });
        const p2 = this._toVector(params.p2 || { x: 10, y: 0, z: 20 });
        const p3 = this._toVector(params.p3 || { x: 10, y: 0, z: 30 });

        const width = params.width || 10;
        const resolution = params.resolution || 20; // Segments

        const curve = new THREE.CubicBezierCurve3(p0, p1, p2, p3);

        // Generate Ribbon Geometry
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        const normals = [];
        const uvs = [];
        const indices = [];

        const points = curve.getPoints(resolution);
        const frenetFrames = curve.computeFrenetFrames(resolution, false);
        // Note: computeFrenetFrames returns { tangents, normals, binormals }
        // For a road flat on ground, we might want to enforce "Up" as (0,1,0)
        // instead of Frenet normal which twists.
        // Let's use a custom frame calculation where Up is always (0,1,0).

        let totalLength = 0;
        let prevPoint = points[0];

        for (let i = 0; i <= resolution; i++) {
            const point = points[i];

            // Calculate length for UV
            if (i > 0) {
                totalLength += point.distanceTo(prevPoint);
            }
            prevPoint = point;

            // Calculate Tangent
            let tangent;
            if (i < resolution) {
                tangent = new THREE.Vector3().subVectors(points[i+1], points[i]).normalize();
            } else {
                tangent = new THREE.Vector3().subVectors(points[i], points[i-1]).normalize();
            }

            // Enforce UP = Y-axis
            const up = new THREE.Vector3(0, 1, 0);

            // Binormal = Up x Tangent (Perpendicular to path, flat on ground)
            const binormal = new THREE.Vector3().crossVectors(up, tangent).normalize();

            // Vertices
            const left = new THREE.Vector3().copy(point).addScaledVector(binormal, width / 2);
            const right = new THREE.Vector3().copy(point).addScaledVector(binormal, -width / 2);

            // Add slight Y offset to avoid z-fighting with ground
            left.y += 0.05;
            right.y += 0.05;

            vertices.push(left.x, left.y, left.z);
            vertices.push(right.x, right.y, right.z);

            // Normals (Up)
            normals.push(0, 1, 0);
            normals.push(0, 1, 0);

            // UVs
            // v is along the road (length / scale)
            // u is across the road (0 to 1)
            const v = totalLength / 10; // 1 unit texture repeat = 10 units world
            uvs.push(0, v);
            uvs.push(1, v);

            // Indices
            if (i < resolution) {
                const base = i * 2;
                // Triangle 1
                indices.push(base, base + 2, base + 1);
                // Triangle 2
                indices.push(base + 1, base + 2, base + 3);
            }
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geometry.setIndex(indices);

        const tex = TextureGenerator.createAsphalt();
        // Set repeat.y to 1 initially, but UVs handle the scaling.
        // Actually, since we bake the scale into UVs (totalLength / 10),
        // we should keep tex.repeat.y = 1.
        tex.repeat.set(1, 1);

        const mat = new THREE.MeshStandardMaterial({
            map: tex,
            roughness: 0.9,
            color: 0xffffff,
            side: THREE.DoubleSide // Just in case
        });

        const mesh = new THREE.Mesh(geometry, mat);
        mesh.receiveShadow = true;

        // Store curve data for future editing
        mesh.userData.curveParams = { p0, p1, p2, p3 };

        return mesh;
    }

    _toVector(obj) {
        if (obj instanceof THREE.Vector3) return obj;
        return new THREE.Vector3(obj.x, obj.y, obj.z);
    }
}
