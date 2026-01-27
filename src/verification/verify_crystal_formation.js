import { JSDOM } from 'jsdom';
import * as THREE from 'three';
import { CrystalFormationEntity } from '../world/entities/crystalFormation.js';

// Setup Mock Environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;

// Mock window.app
global.window.app = {
    world: {
        lightSystem: {
            register: (pos, color, intensity, dist) => {
                console.log(`[Mock] Light registered at y=${pos.y.toFixed(2)}, Color: ${color.toString(16)}`);
                return { intensity: intensity }; // Mock handle
            }
        }
    },
    particles: {
        emit: (pos, count, color) => {
            console.log(`[Mock] Particles emitted at y=${pos.y.toFixed(2)}, Count: ${count}`);
        }
    }
};

// Test
console.log('--- Verifying CrystalFormationEntity ---');
const entity = new CrystalFormationEntity({ seed: 'test-seed' });

console.log('Initializing...');
entity.init();

if (!entity.mesh) {
    console.error('FAIL: Mesh not created.');
    process.exit(1);
}

if (!(entity.mesh instanceof THREE.Group)) {
    console.error('FAIL: Mesh is not a THREE.Group');
    process.exit(1);
}

const children = entity.mesh.children;
console.log(`Mesh has ${children.length} children.`);

// Expect at least 1 base + 5 crystals = 6 children
if (children.length < 6) {
    console.error('FAIL: Too few children (expected >= 6).');
    process.exit(1);
}

console.log('Running update(0.1)...');
try {
    entity.update(0.1);
    console.log('Update successful.');
} catch (e) {
    console.error('FAIL: Update threw error:', e);
    process.exit(1);
}

console.log('Checking displayName...');
if (CrystalFormationEntity.displayName !== 'Crystal Geode') {
    console.error(`FAIL: displayName is ${CrystalFormationEntity.displayName}`);
    process.exit(1);
}

console.log('SUCCESS: CrystalFormationEntity verified.');
