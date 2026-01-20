import { test, describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import { JSDOM } from 'jsdom';
import { Minimap } from './minimap.js';

describe('Minimap', () => {
    let dom;
    let window;
    let document;

    beforeEach(() => {
        dom = new JSDOM('<!DOCTYPE html><div id="ui-layer"></div>');
        window = dom.window;
        document = window.document;
        global.document = document;
        global.window = window;
        global.HTMLElement = window.HTMLElement;
    });

    it('should initialize correctly', () => {
        const world = { colliders: [] };
        const drone = { position: { x: 0, y: 0, z: 0 }, mesh: { visible: true } };
        const person = { position: { x: 0, y: 0, z: 0 } };

        const minimap = new Minimap(world, drone, person);
        assert.ok(minimap.container, 'Container should be created');
        assert.ok(minimap.canvas, 'Canvas should be created');
    });

    it('should update without errors', () => {
        const world = { colliders: [] };
        const drone = { position: { x: 0, y: 0, z: 0 }, mesh: { visible: true }, yaw: 0 };
        const person = { position: { x: 0, y: 0, z: 0 } };

        const minimap = new Minimap(world, drone, person);

        // Mock context because JSDOM canvas context might be limited or we want to verify calls
        minimap.ctx = {
            clearRect: mock.fn(),
            fillRect: mock.fn(),
            save: mock.fn(),
            restore: mock.fn(),
            translate: mock.fn(),
            rotate: mock.fn(),
            scale: mock.fn(),
            beginPath: mock.fn(),
            moveTo: mock.fn(),
            lineTo: mock.fn(),
            fill: mock.fn(),
            stroke: mock.fn(),
            arc: mock.fn()
        };
        minimap.ctx.strokeStyle = '';
        minimap.ctx.lineWidth = 1;
        minimap.ctx.fillStyle = '';

        minimap.update();
        assert.strictEqual(minimap.ctx.save.mock.calls.length, 1);
        assert.strictEqual(minimap.ctx.restore.mock.calls.length, 1);
    });
});
