import assert from 'assert';
import { JSDOM } from 'jsdom';
import * as THREE from 'three';

// Setup JSDOM first
const dom = new JSDOM(`<!DOCTYPE html><div id="ui-layer"></div>`);
global.document = dom.window.document;
global.window = dom.window;
global.HTMLElement = dom.window.HTMLElement;
global.HTMLCanvasElement = dom.window.HTMLCanvasElement;

// Mock Context
class ContextMock {
    constructor(canvas) {
        this.canvas = canvas;
        this.calls = [];
    }
    fillRect(x, y, w, h) { this.calls.push(['fillRect', x, y, w, h]); }
    clearRect(x, y, w, h) { this.calls.push(['clearRect', x, y, w, h]); }
    save() { this.calls.push(['save']); }
    restore() { this.calls.push(['restore']); }
    translate(x, y) { this.calls.push(['translate', x, y]); }
    rotate(angle) { this.calls.push(['rotate', angle]); }
    scale(x, y) { this.calls.push(['scale', x, y]); }
    beginPath() { this.calls.push(['beginPath']); }
    arc() { this.calls.push(['arc']); }
    clip() { this.calls.push(['clip']); }
    moveTo() { this.calls.push(['moveTo']); }
    lineTo() { this.calls.push(['lineTo']); }
    stroke() { this.calls.push(['stroke']); }
    fill() { this.calls.push(['fill']); }
    drawImage() { this.calls.push(['drawImage', ...arguments]); }
}

// Override getContext on the prototype
global.HTMLCanvasElement.prototype.getContext = function(type) {
    if (!this._ctx) {
        this._ctx = new ContextMock(this);
    }
    return this._ctx;
};

console.log("Verifying Minimap...");

async function run() {
    const { Minimap } = await import('../ui/minimap.js');

    // Mock App
    const app = {
        running: true,
        mode: 'drone',
        drone: {
            position: new THREE.Vector3(10, 0, 20),
            yaw: Math.PI / 4
        },
        world: {
            colliders: [
                {
                    type: 'road',
                    mesh: {
                        position: new THREE.Vector3(0, 0, 0),
                        rotation: new THREE.Euler(0, 0, 0),
                        scale: new THREE.Vector3(1, 1, 1)
                    },
                    params: { width: 10, length: 20 }
                }
            ]
        }
    };

    // Instantiate
    const minimap = new Minimap(app);

    // Verify DOM
    const container = document.getElementById('ui-layer').querySelector('.minimap-container');
    assert.ok(container, 'Minimap container created');
    assert.ok(minimap.canvas, 'Minimap canvas created');

    // Verify initial cache (triggered in constructor)
    assert.ok(minimap.cacheCanvas, 'Cache canvas created automatically');

    // Manually trigger refresh to test method
    minimap.refresh();

    const cacheCtx = minimap.cacheCtx; // This should be our mock
    assert.ok(cacheCtx instanceof ContextMock, 'Context should be mocked');

    const cacheCalls = cacheCtx.calls;
    const fillRects = cacheCalls.filter(c => c[0] === 'fillRect');

    // 1 background clear + 1 entity
    assert.strictEqual(fillRects.length, 2, 'Should draw background and 1 entity');

    // Trigger Update
    minimap.update(0.1);
    const mainCtx = minimap.ctx;
    const mainCalls = mainCtx.calls;
    const drawImageCalls = mainCalls.filter(c => c[0] === 'drawImage');
    assert.strictEqual(drawImageCalls.length, 1, 'Should call drawImage once');

    console.log("Minimap Verification Passed!");
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
