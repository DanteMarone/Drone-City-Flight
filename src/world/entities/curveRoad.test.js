
import { test, describe, it } from 'node:test';
import assert from 'node:assert';
import * as THREE from 'three';

// Mock DOM elements
class Canvas {
    constructor() {
        this.width = 1024;
        this.height = 1024;
    }
    getContext() {
        return {
            fillRect: () => {},
            fillStyle: '',
            beginPath: () => {},
            moveTo: () => {},
            lineTo: () => {},
            stroke: () => {},
            strokeStyle: '',
            lineWidth: 1,
            bezierCurveTo: () => {}
        };
    }
}
global.document = {
    createElement: (tag) => {
        if (tag === 'canvas') return new Canvas();
        return {};
    }
};

// Import code under test
import { CurveRoadEntity } from './curveRoad.js';

describe('CurveRoadEntity', () => {
    it('initializes with default parameters', () => {
        const entity = new CurveRoadEntity({});
        entity.init();
        assert.ok(entity.mesh, 'Mesh should be created');
        assert.strictEqual(entity.type, 'curve_road');
        assert.ok(entity.curve instanceof THREE.CubicBezierCurve3);
    });

    it('generates correct geometry', () => {
        const entity = new CurveRoadEntity({
            width: 5,
            p1: {x: 10, y: 0, z: 0},
            p2: {x: 20, y: 0, z: 10},
            p3: {x: 30, y: 0, z: 10}
        });
        entity.init();
        const geo = entity.mesh.geometry;

        assert.ok(geo.getAttribute('position'), 'Should have position attribute');
        assert.ok(geo.getAttribute('uv'), 'Should have uv attribute');
        assert.ok(geo.index, 'Should have index');

        // Resolution 20 segments -> 21 points * 2 vertices per point = 42 vertices
        const posCount = geo.getAttribute('position').count;
        assert.strictEqual(posCount, 42);

        // Check first vertices width
        // p0=(0,0,0), p1=(10,0,0) -> initial tangent roughly X+
        // Binormal roughly Z- (Tangent X x Up Y = Z)
        // Vertices at X=0 should be +/- width/2 in Z
        const positions = geo.getAttribute('position').array;

        // v0 (left)
        const x0 = positions[0];
        const y0 = positions[1];
        const z0 = positions[2];

        // v1 (right)
        const x1 = positions[3];
        const y1 = positions[4];
        const z1 = positions[5];

        assert.ok(Math.abs(z0 - (-2.5)) < 0.1 || Math.abs(z0 - 2.5) < 0.1, 'Z width check 1');
        assert.ok(Math.abs(z1 - (-2.5)) < 0.1 || Math.abs(z1 - 2.5) < 0.1, 'Z width check 2');
        assert.notStrictEqual(z0, z1, 'Left and right should differ');
    });

    it('calculates UVs based on length', () => {
        const entity = new CurveRoadEntity({ width: 10 });
        entity.init();
        const mesh = entity.mesh;
        const uvs = mesh.geometry.getAttribute('uv');

        // Check last UV v-coordinate (should be close to 1, as we normalize it in geometry,
        // but material handles repeat)
        // Wait, in my implementation: uvs.push(0, v); uvs.push(1, v);
        // v = dist / totalLen. So last v should be 1.0.

        const lastV = uvs.getY(uvs.count - 1);
        assert.ok(Math.abs(lastV - 1.0) < 0.001, 'Last V should be 1.0');

        // Check texture repeat
        const repeatY = mesh.material.map.repeat.y;
        const length = entity.curveLength;
        assert.ok(Math.abs(repeatY - length/10) < 0.001, 'Texture repeat should be length/10');
    });
});
