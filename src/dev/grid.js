import * as THREE from 'three';

export class GridSystem {
    constructor(scene) {
        this.scene = scene;
        this.cellSize = 1; // Fixed size
        this.divisions = 1000; // Large area covered
        this.size = this.divisions * this.cellSize;
        this.enabled = true;

        this.helper = this._createHelper();
        this.helper.visible = false;
        scene.add(this.helper);
    }

    _createHelper() {
        // GridHelper(size, divisions)
        // We want lines every 1 unit.
        // size = 1000, divisions = 1000 -> 1 unit per cell.
        const helper = new THREE.GridHelper(this.size, this.divisions, 0x888888, 0x222222);
        helper.position.y = 0.1;
        return helper;
    }

    setEnabled(enabled) {
        this.enabled = enabled;
        this.helper.visible = enabled;
    }

    snap(position) {
        if (!this.enabled) return position;

        const snapped = position.clone();
        snapped.x = Math.round(position.x / this.cellSize) * this.cellSize;
        snapped.y = Math.round(position.y / this.cellSize) * this.cellSize;
        snapped.z = Math.round(position.z / this.cellSize) * this.cellSize;
        return snapped;
    }

    getRotationSnap() {
        return this.enabled ? Math.PI / 12 : null;
    }

    update(camera) {
        if (!this.enabled || !this.helper) return;

        // "Infinite" Grid: Snap helper position to camera position
        const x = Math.round(camera.position.x / this.cellSize) * this.cellSize;
        const z = Math.round(camera.position.z / this.cellSize) * this.cellSize;

        this.helper.position.x = x;
        this.helper.position.z = z;
    }
}
