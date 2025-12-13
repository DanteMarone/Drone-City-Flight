import * as THREE from 'three';

export class Skybox {
    constructor(scene) {
        this.scene = scene;
        this.mesh = null;
        this._init();
    }

    _init() {
        const textureLoader = new THREE.TextureLoader();
        const texture = textureLoader.load('sky.png');
        texture.colorSpace = THREE.SRGBColorSpace;

        // High segment count for smooth curvature
        const geometry = new THREE.SphereGeometry(900, 60, 40);

        const material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.BackSide, // Render on the inside
            depthWrite: false,    // Don't write to depth buffer (background)
            fog: false            // Ignore fog
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.renderOrder = -1; // Render before other transparent objects

        this.scene.add(this.mesh);
    }

    update(cameraPosition) {
        if (this.mesh) {
            this.mesh.position.copy(cameraPosition);
        }
    }
}
