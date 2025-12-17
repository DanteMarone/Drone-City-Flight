import * as THREE from 'three';

export class Skybox {
    constructor(scene) {
        this.scene = scene;
        this.mesh = null;
        this.sunMesh = null;
        this._init();
    }

    _init() {
        // Sun Mesh
        // Use a material that is unaffected by light (Basic) and bright
        const sunGeo = new THREE.SphereGeometry(15, 32, 32); // Larger sun
        const sunMat = new THREE.MeshBasicMaterial({ color: 0xffffaa, toneMapped: false });
        this.sunMesh = new THREE.Mesh(sunGeo, sunMat);
        this.scene.add(this.sunMesh);

        // Ensure background is a Color initially
        this.scene.background = new THREE.Color(0xaaccff);
    }

    update(camPos, timeCycle) {
        if (!timeCycle) return;

        // Position Sun
        // TimeCycle gives position relative to origin (radius 100).
        // Skybox elements should follow camera position to appear infinitely far.
        // Sun Position = CameraPos + (TimeCycle.SunPos normalized * Distance)

        const sunDir = timeCycle.sunPosition.clone().normalize();
        const dist = 400; // Far away, inside far clip plane (500)

        this.sunMesh.position.copy(camPos).add(sunDir.multiplyScalar(dist));

        // Update Sun Color (Visual)
        this.sunMesh.material.color.copy(timeCycle.sunColor);

        // Update Sky Background
        if (this.scene.background instanceof THREE.Color) {
             this.scene.background.copy(timeCycle.skyColor);
        } else {
             this.scene.background = new THREE.Color().copy(timeCycle.skyColor);
        }
    }
}
