// src/core/renderer.js
import * as THREE from 'three';
import { CONFIG } from '../config.js';

export class Renderer {
    constructor(container) {
        this.container = container;

        this.scene = new THREE.Scene();
        if (CONFIG.WORLD.FOG_DENSITY > 0) {
            this.scene.fog = new THREE.FogExp2(CONFIG.WORLD.FOG_COLOR, CONFIG.WORLD.FOG_DENSITY);
            this.scene.background = new THREE.Color(CONFIG.WORLD.FOG_COLOR);
        }

        this.camera = new THREE.PerspectiveCamera(
            CONFIG.CAMERA.FOV,
            window.innerWidth / window.innerHeight,
            CONFIG.CAMERA.NEAR,
            CONFIG.CAMERA.FAR
        );

        this.threeRenderer = new THREE.WebGLRenderer({
            antialias: false, // PP handles AA or we disable for perf
            powerPreference: "high-performance",
            stencil: false,
            depth: true
        });
        this.threeRenderer.setSize(window.innerWidth, window.innerHeight);
        this.threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.threeRenderer.shadowMap.enabled = true;
        this.threeRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.threeRenderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.threeRenderer.toneMappingExposure = 1.0;

        container.appendChild(this.threeRenderer.domElement);

        this._onResize = this._onResize.bind(this);
        window.addEventListener('resize', this._onResize);
    }

    // Accessor for post-processing wrapper
    get domElement() {
        return this.threeRenderer.domElement;
    }

    // If using PostProcessing, we don't call this directly from App
    // But we keep it for fallback
    render(scene = this.scene, camera = this.camera) {
        this.threeRenderer.render(scene, camera);
    }

    _onResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        this.threeRenderer.setSize(width, height);
        // Dispatch event for App to update Composer
        window.dispatchEvent(new CustomEvent('renderer-resize', { detail: { width, height } }));
    }

    add(object) {
        this.scene.add(object);
    }
}
