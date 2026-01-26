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
        // Params expect:
        // x, y, z (Start Point / Origin)
        // end (Vector3 - World Space) or endOffset (Vector3 - Local Space)
        // control (Vector3 - World Space) or controlOffset (Vector3 - Local Space)
        // width (default 10)

        const width = params.width || 10;
        this.params.width = width;

        // Determine local control points
        // The mesh origin is at (0,0,0) in local space, which corresponds to params.x,y,z in world space
        const p0 = new THREE.Vector3(0, 0, 0);
        let p1, p2;

        const startPos = new THREE.Vector3(params.x || 0, params.y || 0, params.z || 0);

        if (params.controlOffset) {
            p1 = params.controlOffset.clone();
        } else if (params.control) {
            p1 = new THREE.Vector3().subVectors(params.control, startPos);
        } else {
            p1 = new THREE.Vector3(5, 0, 5); // Default
        }

        if (params.endOffset) {
            p2 = params.endOffset.clone();
        } else if (params.end) {
            p2 = new THREE.Vector3().subVectors(params.end, startPos);
        } else {
            p2 = new THREE.Vector3(10, 0, 10); // Default
        }

        // Store offsets for serialization/reconstruction if needed
        this.params.controlOffset = p1;
        this.params.endOffset = p2;

        const segments = 20;
        const vertices = [];
        const uvs = [];
        const indices = [];

        // Generate Ribbon
        let totalLen = 0;
        let prevPoint = p0.clone();

        // We need to calculate length first for UV mapping?
        // Or we can just sum distance as we go.
        // Better to have arc length parameterization, but simple distance sum is okay for V1.

        for (let i = 0; i <= segments; i++) {
            const t = i / segments;

            // Quadratic Bezier: (1-t)^2 * P0 + 2(1-t)t * P1 + t^2 * P2
            // P0 is (0,0,0), so first term vanishes
            // B(t) = 2(1-t)t * P1 + t^2 * P2

            // Wait, P0 is (0,0,0).
            const invT = 1 - t;
            const pt = new THREE.Vector3()
                .addScaledVector(p0, invT * invT) // 0
                .addScaledVector(p1, 2 * invT * t)
                .addScaledVector(p2, t * t);

            // Calculate Tangent (Derivative)
            // B'(t) = 2(1-t)(P1-P0) + 2t(P2-P1)
            // Since P0=0: 2(1-t)P1 + 2t(P2-P1)
            const tangent = new THREE.Vector3()
                .addScaledVector(new THREE.Vector3().subVectors(p1, p0), 2 * invT)
                .addScaledVector(new THREE.Vector3().subVectors(p2, p1), 2 * t)
                .normalize();

            // Normal (Perpendicular in XZ plane)
            // If tangent is (tx, 0, tz), normal is (-tz, 0, tx)
            const normal = new THREE.Vector3(-tangent.z, 0, tangent.x);

            // Add width offsets
            const left = pt.clone().addScaledVector(normal, width / 2);
            const right = pt.clone().addScaledVector(normal, -width / 2);

            // Lift slightly to avoid z-fighting with ground
            left.y = 0.05;
            right.y = 0.05;

            vertices.push(left.x, left.y, left.z);
            vertices.push(right.x, right.y, right.z);

            // UVs
            // Calculate distance for V coordinate
            if (i > 0) {
                totalLen += pt.distanceTo(prevPoint);
            }
            prevPoint = pt;

            // U: 0 (left), 1 (right)
            // V: distance along curve
            uvs.push(0, totalLen);
            uvs.push(1, totalLen);
        }

        // Indices
        for (let i = 0; i < segments; i++) {
            const base = i * 2;
            // Triangle 1: Base, Base+1, Base+2
            indices.push(base, base + 1, base + 2);
            // Triangle 2: Base+1, Base+3, Base+2
            indices.push(base + 1, base + 3, base + 2);
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geo.setIndex(indices);
        geo.computeVertexNormals();

        const tex = TextureGenerator.createAsphalt();
        // Adjust repeat based on length
        // We set V in UVs to be absolute distance.
        // Texture repeats every 10 units?
        // If we set map.repeat.y = 1/10, then V=10 maps to 1.
        tex.repeat.set(1, 0.1);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;

        const mat = new THREE.MeshStandardMaterial({
            map: tex,
            roughness: 0.9,
            color: 0xffffff
        });

        const mesh = new THREE.Mesh(geo, mat);
        mesh.receiveShadow = true;

        // Store curve data on mesh for raycasting/interaction potentially
        mesh.userData.curveData = { p0, p1, p2, width };

        return mesh;
    }

    createCollider() {
        // Approximate collision with multiple boxes
        // Since physics engine might not support MeshCollider or it's expensive
        const group = new THREE.Group();
        const p0 = new THREE.Vector3(0, 0, 0);
        const p1 = this.params.controlOffset || new THREE.Vector3(5,0,5);
        const p2 = this.params.endOffset || new THREE.Vector3(10,0,10);
        const width = this.params.width || 10;

        const segments = 5; // Coarse approximation for physics

        for (let i = 0; i < segments; i++) {
            const t0 = i / segments;
            const t1 = (i + 1) / segments;
            const tMid = (t0 + t1) / 2;

            // Sample midpoint for position
            const invT = 1 - tMid;
            const pos = new THREE.Vector3()
                .addScaledVector(p0, invT * invT)
                .addScaledVector(p1, 2 * invT * tMid)
                .addScaledVector(p2, tMid * tMid);

            // Sample tangent for rotation
            const tangent = new THREE.Vector3()
                .addScaledVector(new THREE.Vector3().subVectors(p1, p0), 2 * invT)
                .addScaledVector(new THREE.Vector3().subVectors(p2, p1), 2 * tMid)
                .normalize();

            const angle = Math.atan2(tangent.x, tangent.z);

            // Calculate segment length (approx linear distance between t0 and t1)
            // Point at t0
            const pt0 = new THREE.Vector3()
                .addScaledVector(p0, (1-t0)**2)
                .addScaledVector(p1, 2*(1-t0)*t0)
                .addScaledVector(p2, t0*t0);

            // Point at t1
            const pt1 = new THREE.Vector3()
                .addScaledVector(p0, (1-t1)**2)
                .addScaledVector(p1, 2*(1-t1)*t1)
                .addScaledVector(p2, t1*t1);

            const len = pt0.distanceTo(pt1);

            const collider = new THREE.Mesh(
                new THREE.BoxGeometry(width, 1, len), // Height 1 for collider
                new THREE.MeshBasicMaterial({ visible: false })
            );
            collider.position.copy(pos);
            collider.position.y = 0.5; // Center vertically
            collider.rotation.y = angle;

            // We need to add userData to collider so physics system picks it up?
            // BaseEntity usually returns a single mesh or object.
            // If createCollider returns a Group, the physics system needs to handle it.
            // Looking at `base.js` or physics implementation would be good,
            // but for now returning a Group is standard Three.js hierarchy.
            // If the physics system only looks at the root entity.box, we might need to handle this.
            // Assuming `app.colliderSystem` can handle children or we add them individually.

            group.add(collider);
        }

        return group;
    }
}

EntityRegistry.register('curve_road', CurveRoadEntity);
