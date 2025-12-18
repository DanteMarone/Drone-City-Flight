
import * as THREE from 'three';
import { WaterSystem } from '../src/world/water.js';

// Mock Scene
class MockScene {
    constructor() {
        this.children = [];
    }
    add(obj) {
        this.children.push(obj);
    }
    remove(obj) {
        const index = this.children.indexOf(obj);
        if (index > -1) this.children.splice(index, 1);
    }
}

// Verification Script
async function verify() {
    console.log("Verifying WaterSystem...");

    const scene = new MockScene();

    // Test Instantiation
    const water = new WaterSystem(scene);

    if (!water) {
        console.error("FAILED: WaterSystem failed to instantiate.");
        process.exit(1);
    }
    console.log("WaterSystem instantiated.");

    // Test Geometry Creation
    if (!water.mesh) {
        console.error("FAILED: Water mesh not created.");
        process.exit(1);
    }
    console.log("Water mesh created.");

    // Verify Mesh in Scene
    if (scene.children.indexOf(water.mesh) === -1) {
        console.error("FAILED: Water mesh not added to scene.");
        process.exit(1);
    }
    console.log("Water mesh added to scene.");

    // Verify Uniforms
    if (!water.mesh.material.uniforms.uTime) {
         console.error("FAILED: uTime uniform missing.");
         process.exit(1);
    }
    console.log("Shader uniforms verified.");

    // Verify Update
    water.update(0.1);
    if (water.mesh.material.uniforms.uTime.value !== 0.1) {
        console.error("FAILED: Update did not increment time.");
        process.exit(1);
    }
    console.log("Update loop verified.");

    console.log("SUCCESS: WaterSystem verification passed.");
}

verify().catch(err => {
    console.error(err);
    process.exit(1);
});
