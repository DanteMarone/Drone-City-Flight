import * as THREE from 'three';
import { EntityRegistry } from '../../world/entities/index.js';

export class ThumbnailRenderer {
    constructor() {
        this.width = 128;
        this.height = 128;
        this.renderer = null;
        this.scene = null;
        this.camera = null;
        this.queue = [];
        this.cache = new Map();
        this.isProcessing = false;

        this._init();
    }

    _init() {
        try {
            this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
            this.renderer.setSize(this.width, this.height);
            this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        } catch (e) {
            console.warn("ThumbnailRenderer: Could not create WebGLRenderer", e);
            return;
        }

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x222222);

        const amb = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(amb);
        const dir = new THREE.DirectionalLight(0xffffff, 1.5);
        dir.position.set(5, 10, 7);
        this.scene.add(dir);

        this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    }

    queueThumbnail(type, callback) {
        if (this.cache.has(type)) {
            callback(this.cache.get(type));
            return;
        }
        this.queue.push({ type, callback });
        this._processQueue();
    }

    async _processQueue() {
        if (this.isProcessing || this.queue.length === 0 || !this.renderer) return;
        this.isProcessing = true;

        const requestIdleCallback = window.requestIdleCallback || (cb => setTimeout(cb, 50));

        requestIdleCallback(async () => {
            const item = this.queue.shift();
            if (item) {
                const { type, callback } = item;
                const dataUrl = await this._render(type);
                this.cache.set(type, dataUrl);
                callback(dataUrl);

                this.isProcessing = false;
                if (this.queue.length > 0) this._processQueue();
            }
        });
    }

    async _render(type) {
        const ClassRef = EntityRegistry.get(type);
        if (!ClassRef) return null;

        let mesh;
        try {
            const instance = new ClassRef({});
            if (instance.createMesh) {
                mesh = instance.createMesh({});
            } else {
                return null;
            }
        } catch (e) {
            console.warn(`ThumbnailRenderer: Failed to render ${type}`, e);
            return null;
        }

        if (!mesh) return null;

        this.scene.add(mesh);

        const box = new THREE.Box3().setFromObject(mesh);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);

        mesh.position.sub(center);

        const dist = maxDim * 2.0;
        this.camera.position.set(dist, dist * 0.8, dist);
        this.camera.lookAt(0, 0, 0);

        this.renderer.render(this.scene, this.camera);
        const url = this.renderer.domElement.toDataURL('image/png');

        this.scene.remove(mesh);
        mesh.traverse(o => {
            if (o.geometry) o.geometry.dispose();
        });

        return url;
    }
}
