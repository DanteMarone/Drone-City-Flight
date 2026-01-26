import { JSDOM } from 'jsdom';
import assert from 'assert';
import * as THREE from 'three';

// Mock DOM
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;
global.HTMLCanvasElement = dom.window.HTMLCanvasElement;

// Mock Canvas getContext
HTMLCanvasElement.prototype.getContext = () => {
    return {
        fillRect: () => {},
        fillStyle: '',
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        stroke: () => {},
        strokeStyle: '',
        lineWidth: 0,
        bezierCurveTo: () => {},
    };
};

import { EntityRegistry } from '../world/entities/index.js';
import { CurveRoadEntity } from '../world/entities/curveRoad.js';

async function verify() {
    console.log('Verifying CurveRoadEntity...');

    // 1. Check Registration
    const RegisteredClass = EntityRegistry.get('curve_road');
    assert.ok(RegisteredClass, 'CurveRoadEntity should be registered as "curve_road"');
    assert.strictEqual(RegisteredClass, CurveRoadEntity, 'Registered class should be CurveRoadEntity');

    // 2. Instantiate
    const params = {
        x: 0, z: 0,
        endOffset: new THREE.Vector3(10, 0, 10),
        controlOffset: new THREE.Vector3(5, 0, 0)
    };

    const road = new CurveRoadEntity(params);
    road.init(); // BaseEntity requires init() call
    assert.ok(road, 'Should create an instance');
    assert.ok(road.mesh, 'Should have a mesh');
    assert.ok(road.box, 'Should have a collider');

    // 3. Verify Geometry
    const geo = road.mesh.geometry;
    assert.ok(geo.attributes.position, 'Geometry should have position attribute');
    assert.ok(geo.attributes.uv, 'Geometry should have uv attribute');

    // Check vertex count (segments * 2 + 2)
    // 20 segments -> 21 * 2 = 42 vertices
    assert.strictEqual(geo.attributes.position.count, 42, 'Should have 42 vertices for 20 segments');

    // 4. Verify Collider
    assert.ok(road.box.isGroup, 'Collider should be a Group');
    assert.strictEqual(road.box.children.length, 5, 'Collider should have 5 segments');

    console.log('CurveRoadEntity Verification Passed!');
}

verify().catch(err => {
    console.error(err);
    process.exit(1);
});
