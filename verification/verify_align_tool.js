
import * as THREE from 'three';
import { AlignTool } from '../src/dev/tools/alignTool.js';
import { TransformCommand } from '../src/dev/history.js';

// Mock DevMode
class MockDevMode {
    constructor() {
        this.selectedObjects = [];
        this.history = {
            push: (cmd) => {
                console.log(`History Push: ${cmd.description}`);
                // Execute immediately for mock test
                // cmd.execute() // Not needed for TransformCommand in test context as we applied manually in AlignTool
            }
        };
        this.app = { colliderSystem: { updateBody: () => {} } };
    }

    captureTransforms(objects) {
        return objects.map(o => ({
            object: o,
            position: o.position.clone(),
            rotation: o.rotation.clone(),
            scale: o.scale.clone()
        }));
    }

    applyTransformSnapshot(states) {
        // Mock
    }

    _transformsChanged() { return true; }
}

// Mock DOM
global.document = {
    createElement: (tag) => {
        return {
            className: '',
            style: {},
            appendChild: () => {},
            setAttribute: () => {},
            querySelector: () => null,
            classList: { add: () => {}, remove: () => {} }
        };
    },
    getElementById: () => null
};

// Test
console.log("Starting AlignTool Verification...");

const devMode = new MockDevMode();
const tool = new AlignTool(devMode);

// Create Objects
const obj1 = new THREE.Object3D();
obj1.position.set(0, 0, 0);
const obj2 = new THREE.Object3D();
obj2.position.set(10, 0, 0);
const obj3 = new THREE.Object3D();
obj3.position.set(20, 0, 0);

devMode.selectedObjects = [obj1, obj2, obj3];

console.log("Initial Positions:", obj1.position.x, obj2.position.x, obj3.position.x);

// Test 1: Align X Min (Should be 0)
tool.align('x', 'min');
if (obj1.position.x === 0 && obj2.position.x === 0 && obj3.position.x === 0) {
    console.log("PASS: Align X Min");
} else {
    console.error("FAIL: Align X Min", obj1.position.x, obj2.position.x, obj3.position.x);
}

// Reset
obj1.position.set(0, 0, 0);
obj2.position.set(10, 0, 0);
obj3.position.set(20, 0, 0);

// Test 2: Align X Max (Should be 20)
tool.align('x', 'max');
if (obj1.position.x === 20 && obj2.position.x === 20 && obj3.position.x === 20) {
    console.log("PASS: Align X Max");
} else {
    console.error("FAIL: Align X Max", obj1.position.x, obj2.position.x, obj3.position.x);
}

// Reset
obj1.position.set(0, 0, 0);
obj2.position.set(10, 0, 0);
obj3.position.set(20, 0, 0);

// Test 3: Align X Center (Should be 10)
tool.align('x', 'center');
if (obj1.position.x === 10 && obj2.position.x === 10 && obj3.position.x === 10) {
    console.log("PASS: Align X Center");
} else {
    console.error("FAIL: Align X Center", obj1.position.x, obj2.position.x, obj3.position.x);
}

console.log("Verification Complete.");
