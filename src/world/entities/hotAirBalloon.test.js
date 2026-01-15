import { describe, it } from 'node:test';
import assert from 'node:assert';
import * as THREE from 'three';
import { HotAirBalloonEntity } from './hotAirBalloon.js';

// Mock DOM for CanvasTexture in Node.js environment
if (typeof document === 'undefined') {
    global.document = {
        createElement: (tag) => {
            if (tag === 'canvas') {
                return {
                    width: 0,
                    height: 0,
                    getContext: (type) => ({
                        fillStyle: '',
                        fillRect: () => {},
                        beginPath: () => {},
                        moveTo: () => {},
                        lineTo: () => {},
                        stroke: () => {},
                        globalAlpha: 1,
                    })
                };
            }
            return {};
        }
    };

    // Stub HTMLImageElement if needed by three.js internals (though CanvasTexture usually fine)
    global.HTMLImageElement = class {};
    global.HTMLCanvasElement = class {};
}

describe('HotAirBalloonEntity', () => {
    it('should initialize correctly', () => {
        const params = { x: 10, y: 0, z: 5 };
        const entity = new HotAirBalloonEntity(params);
        entity.init();

        assert.strictEqual(entity.type, 'hotAirBalloon');
        assert.ok(entity.mesh, 'Mesh should be created');

        // Check structure
        const root = entity.mesh;
        assert.ok(root.children.length > 0, 'Should have children (visual group)');
        const visualGroup = root.children[0];

        // We expect: Balloon, Basket, RopeGroup, Burner
        // That is at least 3 or 4 children
        assert.ok(visualGroup.children.length >= 3, 'Visual group should have components');

        assert.strictEqual(entity.mesh.position.x, 10);
        assert.strictEqual(entity.mesh.position.z, 5);
    });

    it('should update and animate', () => {
        const entity = new HotAirBalloonEntity();
        entity.init();
        const visualGroup = entity.mesh.children[0];

        const initialY = visualGroup.position.y;

        // Update with some time
        entity.update(1.0);

        assert.notEqual(visualGroup.position.y, initialY, 'Should animate position (bob)');
    });
});
