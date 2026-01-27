
import * as THREE from 'three';
import { StreetLightEntity } from '../world/entities/streetLight.js';
import { EntityRegistry } from '../world/entities/registry.js';

// Mock window.app for postInit
global.window = {
    app: {
        world: {
            lightSystem: {
                register: () => ({ parentMesh: null, intensity: 1 })
            }
        }
    }
};

const COUNT = 1000;

console.log(`Creating ${COUNT} StreetLightEntity instances...`);

const start = performance.now();
const entities = [];
for (let i = 0; i < COUNT; i++) {
    const entity = EntityRegistry.create('streetLight', {
        x: i * 10,
        y: 0,
        z: 0,
        poleHeight: 7 + Math.random() * 2,
        armLength: 2 + Math.random() * 0.5,
        poleRadius: 0.15,
        seed: i
    });
    // Simulate adding to scene (which triggers matrix updates often)
    entity.mesh.updateMatrixWorld();
    entities.push(entity);
}
const end = performance.now();

console.log(`Created ${COUNT} entities in ${(end - start).toFixed(2)}ms`);

// Approximate memory usage check (very rough)
// Count unique geometries and materials
const geometries = new Set();
const materials = new Set();

entities.forEach(e => {
    e.mesh.traverse(c => {
        if (c.isMesh) {
            if (c.geometry) geometries.add(c.geometry.uuid);
            if (c.material) materials.add(c.material.uuid);
        }
    });
});

console.log(`Unique Geometries: ${geometries.size}`);
console.log(`Unique Materials: ${materials.size}`);

// Verify expectations
if (geometries.size > 100) {
    console.log("FAIL: Too many unique geometries. Optimization needed.");
} else {
    console.log("PASS: Geometry count is low.");
}

if (materials.size > 100) {
    console.log("FAIL: Too many unique materials. Optimization needed.");
} else {
    console.log("PASS: Material count is low.");
}
