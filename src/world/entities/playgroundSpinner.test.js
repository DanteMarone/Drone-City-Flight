import { describe, it } from 'node:test';
import assert from 'node:assert';
import * as THREE from 'three';
import { PlaygroundSpinnerEntity } from './playgroundSpinner.js';

describe('PlaygroundSpinnerEntity', () => {
    it('should initialize correctly', () => {
        const entity = new PlaygroundSpinnerEntity({ x: 10, y: 0, z: 10 });
        entity.init();

        assert.ok(entity.mesh, 'Mesh should be created');
        assert.equal(entity.type, 'PlaygroundSpinnerEntity');
        assert.ok(entity.spinnerGroup, 'Spinner group should be created');
    });

    it('should update rotation', () => {
        const entity = new PlaygroundSpinnerEntity({});
        entity.init();

        const initialRotation = entity.spinnerGroup.rotation.y;
        entity.update(1.0); // 1 second

        assert.ok(entity.spinnerGroup.rotation.y > initialRotation, 'Should rotate over time');
    });
});
