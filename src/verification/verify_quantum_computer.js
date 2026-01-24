import assert from 'assert';
import * as THREE from 'three';
import { QuantumComputerEntity } from '../world/entities/quantumComputer.js';
import { EntityRegistry } from '../world/entities/registry.js';

console.log('Verifying QuantumComputerEntity...');

// 1. Check Class Registration
const registeredClass = EntityRegistry.get('quantumComputer');
assert.strictEqual(registeredClass, QuantumComputerEntity, 'Entity should be registered with type "quantumComputer"');
console.log('✅ Registration verified.');

// 2. Instantiate
const entity = new QuantumComputerEntity({ x: 10, y: 0, z: 10 });
assert.ok(entity, 'Entity instantiated');
assert.strictEqual(entity.type, 'quantumComputer');
console.log('✅ Instantiation verified.');

// 3. Create Mesh
// Note: We are in a headless environment. THREE.js objects usually work fine until you try to render.
const mesh = entity.createMesh({});
assert.ok(mesh instanceof THREE.Group, 'createMesh should return a THREE.Group');
assert.strictEqual(mesh.children.length, 2, 'Group should have 2 main children (Base, LevitationGroup)');

// Check Base
const base = mesh.children[0];
assert.ok(base instanceof THREE.Mesh, 'First child should be the Base Mesh');
assert.ok(base.geometry instanceof THREE.CylinderGeometry, 'Base should be CylinderGeometry');

// Check Levitation Group
const levGroup = mesh.children[1];
assert.ok(levGroup instanceof THREE.Group, 'Second child should be Levitation Group');
assert.strictEqual(levGroup.children.length, 4, 'Levitation Group should have 4 children (Core + 3 Rings)');

// Check Core
const core = levGroup.children[0];
assert.ok(core.geometry instanceof THREE.IcosahedronGeometry, 'First child of Levitation Group should be Core (Icosahedron)');

// Check Rings
const ring1 = levGroup.children[1];
assert.ok(ring1.geometry instanceof THREE.TorusGeometry, 'Second child should be a Ring (Torus)');

console.log('✅ Mesh hierarchy verified.');

// 4. Update
// Check that update doesn't crash
entity.init(); // Ensure internal references are set up
entity.update(0.16);
// We can check if rotation changed
const initialRotY = entity._outerRing.rotation.y;
entity.update(1.0);
assert.notStrictEqual(entity._outerRing.rotation.y, initialRotY, 'Outer ring should rotate');

console.log('✅ Update loop verified.');

console.log('All checks passed!');
