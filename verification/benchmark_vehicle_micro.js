import * as THREE from 'three';

// Setup
const iterations = 100000; // High count to measure micro-ops
const localBox = new THREE.Box3(new THREE.Vector3(-1,-1,-1), new THREE.Vector3(1,1,1));
const worldBox = new THREE.Box3();

const localSphere = new THREE.Sphere(new THREE.Vector3(0,0,0), 1.732); // Radius ~ sqrt(3)
const worldSphere = new THREE.Sphere();

// Random matrix to simulate movement
const matrix = new THREE.Matrix4().makeRotationY(Math.PI/4).setPosition(10, 5, 20);

// Benchmark Box Update (Current)
const startBox = performance.now();
for(let i=0; i<iterations; i++) {
    // Simulate VehicleEntity update logic: Copy + ApplyMatrix4
    // Note: copy() is fast, applyMatrix4() transforms 8 points
    worldBox.copy(localBox).applyMatrix4(matrix);
}
const timeBox = performance.now() - startBox;

// Benchmark Sphere Update (Proposed)
const startSphere = performance.now();
for(let i=0; i<iterations; i++) {
    // Proposed Logic: Copy + ApplyMatrix4
    // Note: applyMatrix4() on Sphere transforms 1 point + 1 scale check
    worldSphere.copy(localSphere).applyMatrix4(matrix);
}
const timeSphere = performance.now() - startSphere;

console.log(`Iterations: ${iterations}`);
console.log(`Box3.applyMatrix4 (Current): ${timeBox.toFixed(3)}ms`);
console.log(`Sphere.applyMatrix4 (Proposed): ${timeSphere.toFixed(3)}ms`);
console.log(`Speedup: ${(timeBox/timeSphere).toFixed(2)}x`);
