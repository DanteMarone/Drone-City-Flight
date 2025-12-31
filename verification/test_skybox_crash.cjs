
const { Skybox } = require('../src/world/skybox.js');
const THREE = require('three');

// Mock dependencies
const scene = new THREE.Scene();
const skybox = new Skybox(scene);

const camera = new THREE.PerspectiveCamera();
camera.position.set(10, 20, 30);

const timeCycle = {
    sunPosition: new THREE.Vector3(100, 100, 0),
    sunColor: new THREE.Color(1,1,1),
    skyColor: new THREE.Color(0,0,1)
};

// Test Update
try {
    skybox.update(0.1, camera, timeCycle);
    console.log("Skybox update success");
    if (skybox.sunMesh.position.y > 100) {
        console.log("Sun position updated");
    }
} catch (e) {
    console.error("Skybox update failed", e);
    process.exit(1);
}
