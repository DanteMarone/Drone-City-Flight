import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import * as THREE from 'three';

describe('CurveRoadEntity', () => {
    let CurveRoadEntity;

    before(async () => {
         // Mock DOM for TextureGenerator
         if (typeof document === 'undefined') {
            global.document = {
                createElement: (tag) => {
                    if (tag === 'canvas') {
                        return {
                            width: 0,
                            height: 0,
                            getContext: () => ({
                                fillStyle: '',
                                fillRect: () => {},
                                strokeStyle: '',
                                lineWidth: 1,
                                beginPath: () => {},
                                moveTo: () => {},
                                lineTo: () => {},
                                stroke: () => {},
                                bezierCurveTo: () => {},
                            }),
                        };
                    }
                    return {};
                }
            };
            // TextureLoader might need window or Image, but CanvasTexture uses canvas.
            global.window = {};
            global.Image = class {};
        }

        const module = await import('./curveRoad.js');
        CurveRoadEntity = module.CurveRoadEntity;
    });

    it('should create a mesh with correct geometry type', () => {
        const entity = new CurveRoadEntity({
            p1: {x:10, y:0, z:0},
            p2: {x:10, y:0, z:10},
            p3: {x:20, y:0, z:10},
            width: 5
        });
        entity.init();

        const mesh = entity.mesh;
        assert.ok(mesh);
        assert.ok(mesh.geometry);
        // It returns a generic BufferGeometry
        assert.strictEqual(mesh.geometry.type, 'BufferGeometry');

        // Check attributes
        assert.ok(mesh.geometry.attributes.position);
        assert.ok(mesh.geometry.attributes.uv);

        // Check that vertices count > 0
        assert.ok(mesh.geometry.attributes.position.count > 0);
    });

    it('should have correct parameters stored', () => {
         const p1 = new THREE.Vector3(10, 0, 0);
         const entity = new CurveRoadEntity({
            p1: p1
         });
         entity.init();

         assert.strictEqual(entity.params.p1.x, 10);
    });

    it('should scale UVs based on length', () => {
        const entity = new CurveRoadEntity({});
        entity.init();
        const mesh = entity.mesh;
        const repeatY = mesh.material.map.repeat.y;

        // Default curve length is approx...
        // p0(0,0,0) -> p1(0,0,10) -> p2(10,0,10) -> p3(10,0,20)
        // Length should be roughly 20-25ish?
        // 10 units straight, turn, 10 units straight.

        // We set repeat to length / 10.
        // So repeatY should be > 1.
        assert.ok(repeatY > 1);
    });
});
