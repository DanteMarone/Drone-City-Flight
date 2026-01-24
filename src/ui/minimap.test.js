import { test, describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { JSDOM } from 'jsdom';
import * as THREE from 'three';
import { Minimap } from './minimap.js';

describe('Minimap', () => {
    let cleanup;

    beforeEach(() => {
        const dom = new JSDOM('<!DOCTYPE html><body><div id="ui-layer"></div></body>', {
            url: 'http://localhost'
        });
        global.document = dom.window.document;
        global.window = dom.window;
        global.HTMLElement = dom.window.HTMLElement;
        global.HTMLCanvasElement = dom.window.HTMLCanvasElement;

        // Mock Canvas Context
        global.HTMLCanvasElement.prototype.getContext = () => ({
            clearRect: () => {},
            fillRect: () => {},
            translate: () => {},
            rotate: () => {},
            save: () => {},
            restore: () => {},
            beginPath: () => {},
            arc: () => {},
            fill: () => {},
            stroke: () => {},
            clip: () => {},
            moveTo: () => {},
            lineTo: () => {},
            closePath: () => {},
            drawImage: () => {},
            scale: () => {},
            fillText: () => {},
        });

        cleanup = () => {
            delete global.document;
            delete global.window;
            delete global.HTMLElement;
            delete global.HTMLCanvasElement;
        };
    });

    afterEach(() => {
        if (cleanup) cleanup();
    });

    it('should initialize correctly', () => {
        const app = {};
        const minimap = new Minimap(app);
        assert.ok(minimap.canvas);
        assert.ok(minimap.staticCanvas);
    });

    it('should refresh static map', () => {
        const app = {};
        const minimap = new Minimap(app);

        const world = {
            colliders: [
                {
                    type: 'road',
                    mesh: {
                        position: new THREE.Vector3(10, 0, 10),
                        rotation: new THREE.Euler(0, 0, 0)
                    },
                    params: { width: 10, depth: 10 }
                }
            ]
        };

        minimap.refreshStatic(world);
        assert.ok(true);
    });
});
