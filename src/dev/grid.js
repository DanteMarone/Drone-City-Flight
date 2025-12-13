import * as THREE from 'three';

export class GridSystem {
    constructor(scene, snapSize = 10) {
        this.scene = scene;
        this.cellSize = snapSize;
        this.divisions = 200; // Keep visible grid density constant
        this.size = this.divisions * this.cellSize;
        this.enabled = false;

        this.helper = this._createHelper();
        this.helper.visible = false;
        scene.add(this.helper);
    }

    _createHelper() {
        const helper = new THREE.GridHelper(this.size, this.divisions, 0x888888, 0x444444);
        // Slightly above ground to avoid Z-fighting with asphalt
        helper.position.y = 0.1;
        return helper;
    }

    setEnabled(enabled) {
        this.enabled = enabled;
        this.helper.visible = enabled;
    }

    setSnapSize(size) {
        this.cellSize = size;
        this.size = this.divisions * this.cellSize;

        // Recreate helper
        this.scene.remove(this.helper);
        this.helper = this._createHelper();
        this.helper.visible = this.enabled;
        this.scene.add(this.helper);
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
        // This makes the grid travel with the camera
        const x = Math.round(camera.position.x / this.cellSize) * this.cellSize;
        const z = Math.round(camera.position.z / this.cellSize) * this.cellSize;

        this.helper.position.x = x;
        this.helper.position.z = z;
        // y stays at 0.1
    }
}
