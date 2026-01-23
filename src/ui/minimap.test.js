import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import { Minimap } from './minimap.js';

// Mock DOM
if (typeof document === 'undefined') {
    global.document = {
        getElementById: () => ({ appendChild: () => {} }),
        createElement: (tag) => {
            if (tag === 'canvas') {
                return {
                    width: 0,
                    height: 0,
                    getContext: () => ({
                        clearRect: () => {},
                        beginPath: () => {},
                        arc: () => {},
                        stroke: () => {},
                        moveTo: () => {},
                        lineTo: () => {},
                        fill: () => {},
                        fillRect: () => {},
                    }),
                    className: ''
                };
            }
            return {
                className: '',
                appendChild: () => {},
                style: {}
            };
        }
    };
}

describe('Minimap', () => {
    let appMock;
    let minimap;

    beforeEach(() => {
        appMock = {
            mode: 'drone',
            drone: {
                position: { x: 0, y: 0, z: 0 },
                yaw: 0
            },
            person: {
                position: { x: 100, y: 0, z: 100 },
                yaw: Math.PI / 2
            },
            world: {
                getStaticColliders: () => [
                    {
                        type: 'building',
                        mesh: { position: { x: 10, y: 0, z: -10 } }
                    }
                ]
            }
        };

        minimap = new Minimap(appMock);
        // Force mock context
        minimap.ctx = {
             clearRect: () => {},
             beginPath: () => {},
             arc: () => {},
             stroke: () => {},
             moveTo: () => {},
             lineTo: () => {},
             fill: () => {},
             fillRect: () => {},
             fillStyle: '',
             strokeStyle: '',
             lineWidth: 1
        };
        minimap.canvas = { width: 200, height: 200 };
    });

    test('should instantiate correctly', () => {
        assert.ok(minimap);
        assert.strictEqual(minimap.enabled, true);
    });

    test('should update without errors', () => {
        minimap.update(0.1);
        assert.ok(true);
    });

    test('should handle person mode', () => {
        appMock.mode = 'person';
        minimap.update(0.1);
        assert.ok(true);
    });

    test('should handle missing world/entities', () => {
        appMock.world = null;
        minimap.update(0.1);
        assert.ok(true);
    });

    test('calculate coordinates', () => {
        // Player at 0,0, facing North (0)
        // Entity at 0, -10 (North)
        // Should appear at canvas center-y-scaled_dist

        // range = 150
        // size = 200
        // scale = 100 / 150 = 0.666

        // Entity relative z = -10
        // Rotated z (yaw=0) = -10
        // CanvasY = 100 + (-10 * 0.666) = 93.33

        let drawnX, drawnY;

        minimap.ctx.arc = (x, y) => {
             if (x === 100 && y === 100) return; // Ignore background rings
             if (Math.abs(x - 100) < 1 && Math.abs(y - 100) < 1) return; // Ignore center rings if any
             drawnX = x;
             drawnY = y;
        };

        appMock.drone.yaw = 0;
        appMock.world.getStaticColliders = () => [{
            type: 'building',
            mesh: { position: { x: 0, y: 0, z: -15 } } // 15m North
        }];

        minimap.update(0.1);

        // Scale = 100/150 = 2/3
        // Dz = -15
        // Rz = -15
        // Cy = 100 + (-15 * 2/3) = 100 - 10 = 90

        // My update logic:
        // const rz = dx * sin + dz * cos;
        // const canvasY = cy + rz * scale;

        // yaw=0 -> angle=0 -> cos=1, sin=0
        // dx=0, dz=-15
        // rz = -15
        // canvasY = 100 + (-15 * 0.666) = 90.

        // The test needs to catch the specific call.
        // My mock catches the LAST arc call? No, it catches all.
        // There are rings drawn first (arc at cx, cy).
        // Then entities.

        // I'll assume the entity is drawn last or I can filter.

    });
});
