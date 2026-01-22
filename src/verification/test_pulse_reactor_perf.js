
import { JSDOM } from 'jsdom';
import * as THREE from 'three';
import { strict as assert } from 'assert';

// Setup JSDOM
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;
global.HTMLCanvasElement = dom.window.HTMLCanvasElement;

// Mock Canvas 2D Context
class MockContext2D {
    constructor() {
        this.fillStyle = '';
        this.strokeStyle = '';
        this.lineWidth = 1;
    }
    fillRect() {}
    clearRect() {}
    beginPath() {}
    moveTo() {}
    lineTo() {}
    stroke() {}
    createLinearGradient() {
        return { addColorStop: () => {} };
    }
    createRadialGradient() {
         return { addColorStop: () => {} };
    }
    arc() {}
    bezierCurveTo() {}
}

global.HTMLCanvasElement.prototype.getContext = function() {
    return new MockContext2D();
};

// Import PulseReactorEntity
const { PulseReactorEntity } = await import('../world/entities/pulseReactor.js');

console.log('🔍 Starting Pulse Reactor Performance Test...');

function countUniqueCanvases(entities) {
    const canvases = new Set();
    let textureCount = 0;

    entities.forEach(entity => {
        entity._glowMaterials.forEach(mat => {
            if (mat.map && mat.map.image instanceof global.HTMLCanvasElement) {
                canvases.add(mat.map.image);
                textureCount++;
            }
        });
    });

    return { unique: canvases.size, total: textureCount };
}

// Instantiate 50 entities
const entities = [];
const COUNT = 50;

console.log(`Creating ${COUNT} PulseReactorEntity instances...`);

for (let i = 0; i < COUNT; i++) {
    const entity = new PulseReactorEntity({});
    // We need to call createMesh to generate the textures
    entity.createMesh({});
    entities.push(entity);
}

const result = countUniqueCanvases(entities);
console.log(`📊 Results:`);
console.log(`   Total Textures Found: ${result.total}`);
console.log(`   Unique Canvases: ${result.unique}`);

// Expectation for UNOPTIMIZED code:
// Each entity creates 2 custom textures (beam, energy) -> 2 * 50 = 100 unique canvases.
if (result.unique >= COUNT * 2) {
    console.log('❌ BOTTLENECK CONFIRMED: High number of unique canvases detected.');
} else if (result.unique <= 2) {
    console.log('✅ OPTIMIZED: Low number of unique canvases detected.');
} else {
    console.log(`⚠️ UNEXPECTED: Intermediate number of canvases: ${result.unique}`);
}
