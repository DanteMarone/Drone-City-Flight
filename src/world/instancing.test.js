import { describe, it } from 'node:test';
import { strict as assert } from 'assert';
import * as THREE from 'three';
import { InstancedEntitySystem } from './instancing.js';

// Mock Scene
class MockScene {
    constructor() {
        this.children = [];
    }
    add(obj) {
        this.children.push(obj);
    }
    remove(obj) {
        const idx = this.children.indexOf(obj);
        if (idx !== -1) this.children.splice(idx, 1);
    }
}

describe('InstancedEntitySystem', () => {

    describe('Initialization', () => {
        it('should create batches for supported types', () => {
            const scene = new MockScene();
            const sys = new InstancedEntitySystem(scene);

            const counts = {
                'pineTree': 10,
                'sidewalk': 5,
                'unsupported': 100
            };

            sys.initBatches(counts);

            assert.ok(sys.batches.has('pineTree'), 'Should have pineTree batch');
            assert.ok(sys.batches.has('sidewalk'), 'Should have sidewalk batch');
            assert.ok(!sys.batches.has('unsupported'), 'Should NOT have unsupported batch');

            const batch = sys.batches.get('pineTree');
            assert.equal(batch.capacity, 10, 'Should set correct capacity');
        });
    });

    describe('Instance Management', () => {
        it('should capture template from first entity', () => {
            const scene = new MockScene();
            const sys = new InstancedEntitySystem(scene);
            sys.initBatches({ 'pineTree': 2 });

            const geo = new THREE.BoxGeometry(1,1,1);
            const mat = new THREE.MeshBasicMaterial();
            const mesh = new THREE.Mesh(geo, mat);
            const entity = { type: 'pineTree', mesh };

            const added = sys.add(entity);
            assert.ok(added, 'Should return true for added entity');

            const batch = sys.batches.get('pineTree');
            assert.ok(batch.hasTemplate(), 'Should have captured template');
            assert.equal(batch.count, 1, 'Should have 1 instance');

            // Check if mesh is in scene
            assert.equal(scene.children.length, 1, 'Should have added InstancedMesh to scene');
            assert.ok(scene.children[0].isInstancedMesh, 'Child should be InstancedMesh');
        });

        it('should add subsequent instances', () => {
            const scene = new MockScene();
            const sys = new InstancedEntitySystem(scene);
            sys.initBatches({ 'pineTree': 2 });

            const geo = new THREE.BoxGeometry(1,1,1);
            const mat = new THREE.MeshBasicMaterial();

            // Entity 1
            const mesh1 = new THREE.Mesh(geo, mat);
            mesh1.position.set(10, 0, 10);
            mesh1.updateMatrixWorld();
            sys.add({ type: 'pineTree', mesh: mesh1 });

            // Entity 2
            const mesh2 = new THREE.Mesh(geo, mat);
            mesh2.position.set(20, 0, 20);
            mesh2.updateMatrixWorld();
            sys.add({ type: 'pineTree', mesh: mesh2 });

            const batch = sys.batches.get('pineTree');
            assert.equal(batch.count, 2, 'Should have 2 instances');

            // Check matrix of second instance
            const im = scene.children[0];
            const matCheck = new THREE.Matrix4();
            im.getMatrixAt(1, matCheck);

            // Decompose to check position
            const pos = new THREE.Vector3();
            const quat = new THREE.Quaternion();
            const scale = new THREE.Vector3();
            matCheck.decompose(pos, quat, scale);

            assert(Math.abs(pos.x - 20) < 0.001, 'Instance 2 X should be 20');
            assert(Math.abs(pos.z - 20) < 0.001, 'Instance 2 Z should be 20');
        });

        it('should handle hierarchy (Mesh inside Group)', () => {
             const scene = new MockScene();
            const sys = new InstancedEntitySystem(scene);
            sys.initBatches({ 'pineTree': 1 });

            // Group -> Mesh (offset by 2 in Y)
            const group = new THREE.Group();
            group.position.set(10, 0, 10);

            const geo = new THREE.BoxGeometry(1,1,1);
            const mat = new THREE.MeshBasicMaterial();
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(0, 2, 0); // Local offset
            group.add(mesh);

            group.updateMatrixWorld(true);

            sys.add({ type: 'pineTree', mesh: group });

            const batch = sys.batches.get('pineTree');
            assert.equal(batch.parts.length, 1, 'Should have 1 part (the mesh)');

            // Check instance matrix
            const im = scene.children[0];
            const matCheck = new THREE.Matrix4();
            im.getMatrixAt(0, matCheck);

            const pos = new THREE.Vector3();
            const quat = new THREE.Quaternion();
            const scale = new THREE.Vector3();
            matCheck.decompose(pos, quat, scale);

            assert(Math.abs(pos.x - 10) < 0.001);
            assert(Math.abs(pos.y - 2) < 0.001, `Expected Y=2, got ${pos.y}`);
            assert(Math.abs(pos.z - 10) < 0.001);
        });
    });

    describe('Lifecycle', () => {
        it('should clear and dispose', () => {
            const scene = new MockScene();
            const sys = new InstancedEntitySystem(scene);
            sys.initBatches({ 'pineTree': 1 });

            const mesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
            sys.add({ type: 'pineTree', mesh });

            assert.equal(scene.children.length, 1);

            // Mock dispose on the InstancedMesh
            let disposed = false;
            // The InstancedMesh is created inside the system. We access it from scene.
            scene.children[0].dispose = () => { disposed = true; };

            sys.clear();

            assert.equal(scene.children.length, 0, 'Should remove from scene');
            assert.ok(disposed, 'Should call dispose');
            assert.equal(sys.batches.size, 0, 'Should clear batches map');
        });

        it('should resize capacity', () => {
             const scene = new MockScene();
            const sys = new InstancedEntitySystem(scene);
            sys.initBatches({ 'pineTree': 1 });

             const mesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
            sys.add({ type: 'pineTree', mesh });

            const batch = sys.batches.get('pineTree');
            assert.equal(batch.capacity, 1);

            // Resize via initBatches
            sys.initBatches({ 'pineTree': 5 });

            assert.equal(batch.capacity, 5, 'Should update capacity');
            // Should have rebuilt mesh (old removed, new added)
            // Since we use MockScene, remove simply splices. Add pushes.
            // If add was called after remove, length is 1.
            assert.equal(scene.children.length, 1);

            // The InstancedMesh instance should be different if we were tracking references,
            // but checking count property (max instances) is enough.
            // In Three.js, InstancedMesh.count is actually the *active* count if not manually set?
            // No, constructor(geometry, material, count) -> count is stored in instanceMatrix size.
            // The property .count defaults to the max count passed in constructor.

            assert.equal(scene.children[0].count, 5);
        });
    });
});
