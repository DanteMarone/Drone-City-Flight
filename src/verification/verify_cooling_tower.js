import assert from 'assert';
import { JSDOM } from 'jsdom';
import * as THREE from 'three';

// Mock DOM
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.HTMLCanvasElement = dom.window.HTMLCanvasElement;

// Mock Canvas Context
// TextureGenerator calls getContext('2d')
HTMLCanvasElement.prototype.getContext = function () {
    return {
        fillRect: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        stroke: () => {},
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 1,
        createLinearGradient: () => ({ addColorStop: () => {} }),
        bezierCurveTo: () => {}
    };
};

// Import Entity after mocking
import { CoolingTowerEntity } from '../world/entities/coolingTower.js';
import { EntityRegistry } from '../world/entities/registry.js';

console.log('Verifying CoolingTowerEntity...');

// Test Instantiation
const tower = new CoolingTowerEntity({ height: 30, baseRadius: 10 });
assert.strictEqual(tower.type, 'coolingTower', 'Type should be coolingTower');
assert.strictEqual(tower.params.height, 30, 'Params should be passed correctly');

// Test Mesh Creation
tower.init();
assert.ok(tower.mesh, 'Mesh should be created');
assert.ok(tower.mesh instanceof THREE.Group, 'Mesh should be a THREE.Group');

// Check Children
const children = tower.mesh.children;
console.log(`Mesh has ${children.length} children`);
assert.ok(children.length > 0, 'Mesh should have children');

// Verify Lathe Geometry (The main tower)
const mainTower = children.find(c => c.geometry && c.geometry.type === 'LatheGeometry');
assert.ok(mainTower, 'Should have a LatheGeometry mesh');

// Verify Particles
assert.ok(tower.steamParticles.length > 0, 'Should have steam particles initialized');

// Test Update
try {
    tower.update(0.1);
    console.log('Update loop ran successfully');
} catch (e) {
    console.error('Update loop failed:', e);
    process.exit(1);
}

console.log('CoolingTowerEntity verification passed!');
