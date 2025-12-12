// src/core/renderer.js
import * as THREE from 'three';
import { CONFIG } from '../config.js';

export class Renderer {
    constructor(container) {
        this.container = container;

        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(CONFIG.WORLD.FOG_COLOR, CONFIG.WORLD.FOG_DENSITY);
        this.scene.background = new THREE.Color(CONFIG.WORLD.FOG_COLOR);

        this.camera = new THREE.PerspectiveCamera(
            CONFIG.CAMERA.FOV,
            window.innerWidth / window.innerHeight,
            CONFIG.CAMERA.NEAR,
            CONFIG.CAMERA.FAR
        );

        this.threeRenderer = new THREE.WebGLRenderer({ antialias: true });
        this.threeRenderer.setSize(window.innerWidth, window.innerHeight);
        this.threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Performance cap
        this.threeRenderer.shadowMap.enabled = true;
        this.threeRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.threeRenderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.threeRenderer.toneMappingExposure = 1.0;

        container.appendChild(this.threeRenderer.domElement);

        this._onResize = this._onResize.bind(this);
        window.addEventListener('resize', this._onResize);
    }

    render() {
        this.threeRenderer.render(this.scene, this.camera);
    }

    _onResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        this.threeRenderer.setSize(width, height);
    }

    // Helper to add stuff
    add(object) {
        this.scene.add(object);
    }
}
