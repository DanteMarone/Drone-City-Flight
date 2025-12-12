// src/fx/post.js
import * as THREE from 'three';
import { EffectComposer, RenderPass, EffectPass, BloomEffect } from 'postprocessing';

export class PostProcessing {
    constructor(renderer, scene, camera) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;
        this.enabled = true;

        this.composer = new EffectComposer(renderer);
        this.composer.addPass(new RenderPass(scene, camera));

        this.bloom = new BloomEffect({
            luminanceThreshold: 0.8,
            intensity: 1.0,
            radius: 0.5
        });

        const effectPass = new EffectPass(camera, this.bloom);
        this.composer.addPass(effectPass);
    }

    setSize(width, height) {
        this.composer.setSize(width, height);
    }

    render(dt) {
        if (this.enabled) {
            this.composer.render(dt);
        } else {
            this.renderer.render(this.scene, this.camera);
        }
    }

    toggle() {
        this.enabled = !this.enabled;
    }
}
