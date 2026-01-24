import { test, describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import * as THREE from 'three';
import { CurveRoadEntity } from '../curveRoad.js';
import { EntityRegistry } from '../registry.js';
import { TextureGenerator } from '../../../utils/textures.js';

describe('CurveRoadEntity', () => {
    let originalCreateAsphalt;

    before(() => {
        // Mock TextureGenerator to avoid Canvas usage in Node environment
        originalCreateAsphalt = TextureGenerator.createAsphalt;
        TextureGenerator.createAsphalt = () => {
            const tex = new THREE.Texture();
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.RepeatWrapping;
            return tex;
        };
    });

    after(() => {
        TextureGenerator.createAsphalt = originalCreateAsphalt;
    });

    it('should be registered', () => {
        // Force registration by importing (already done)
        const cls = EntityRegistry.get('curve_road');
        assert.ok(cls, 'CurveRoadEntity should be registered');
        assert.strictEqual(cls.displayName, 'Curve Road');
    });

    it('should create a mesh with correct geometry', () => {
        const entity = new CurveRoadEntity({
            x: 0, y: 0, z: 0,
            p1: { x: 0, y: 0, z: 5 },
            p2: { x: 10, y: 0, z: 5 },
            p3: { x: 10, y: 0, z: 10 }
        });

        // Mock app world/renderer for entity.init if needed?
        // BaseEntity.init() just calls createMesh and sets position.
        entity.init();

        assert.ok(entity.mesh);
        assert.ok(entity.mesh.geometry);
        assert.ok(entity.mesh.material);

        // Check geometry type - BufferGeometry (custom created)
        assert.strictEqual(entity.mesh.geometry.type, 'BufferGeometry');

        // Check attributes
        assert.ok(entity.mesh.geometry.attributes.position);
        assert.ok(entity.mesh.geometry.attributes.uv);

        // Check vertex count (segments=32 -> 33 points -> 33*2 = 66 vertices)
        // Actually getSpacedPoints(segments) returns segments+1 points.
        const expectedVertices = (32 + 1) * 2;
        assert.strictEqual(entity.mesh.geometry.attributes.position.count, expectedVertices);
    });

    it('should handle custom segments', () => {
         const entity = new CurveRoadEntity({
            segments: 10
        });
        entity.init();
        const expectedVertices = (10 + 1) * 2;
        assert.strictEqual(entity.mesh.geometry.attributes.position.count, expectedVertices);
    });
});
