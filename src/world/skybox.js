import * as THREE from 'three';

export class Skybox {
    constructor(scene) {
        this.scene = scene;
        this.mesh = null;
        this._init();
    }

    _init() {
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load('sky.png', (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.mapping = THREE.EquirectangularReflectionMapping;
            texture.minFilter = THREE.LinearMipMapLinearFilter;
            texture.magFilter = THREE.LinearFilter;

            this.scene.background = texture;
        });
    }

    // Background textures follow the camera automatically
    // so no per-frame update is necessary.
    update() {}
}
