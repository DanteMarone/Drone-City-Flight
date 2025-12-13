
import * as THREE from 'three';
import { GridSystem } from '../src/dev/grid.js';
import { GizmoManager } from '../src/dev/gizmo.js';

// Mock dependencies
class MockScene {
    constructor() {
        this.children = [];
    }
    add(obj) { this.children.push(obj); }
    remove(obj) { this.children = this.children.filter(c => c !== obj); }
}

class MockCamera extends THREE.Camera {}
class MockRenderer {
    constructor() {
        this.domElement = {
            addEventListener: () => {},
            removeEventListener: () => {},
            getBoundingClientRect: () => ({ left:0, top:0, width:100, height:100 }),
            style: { touchAction: '' }, // Fix for TransformControls
            ownerDocument: {
                addEventListener: () => {},
                removeEventListener: () => {}
            }
        };
    }
}

async function verify() {
    console.log("Verifying Dev Mode Modules...");

    // 1. GridSystem
    const scene = new MockScene();
    const grid = new GridSystem(scene);
    if (!grid) throw new Error("Failed to create GridSystem");

    grid.setEnabled(true);
    const pos = new THREE.Vector3(12, 0, 8);
    const snapped = grid.snap(pos);
    if (snapped.x !== 10 || snapped.z !== 10) throw new Error(`Grid snap failed. Expected 10,10. Got ${snapped.x},${snapped.z}`);
    console.log("GridSystem: OK");

    // 2. GizmoManager
    try {
        const cam = new MockCamera();
        const renderer = new MockRenderer();
        const gizmo = new GizmoManager(scene, cam, renderer, null);
        if (!gizmo) throw new Error("Failed to create GizmoManager");
        console.log("GizmoManager: OK");
    } catch (e) {
        console.error("GizmoManager Error:", e);
        throw e;
    }

    console.log("Verification Passed!");
}

verify();
