import * as THREE from 'three';

export class GridSystem {
    constructor(scene, size = 1000, divisions = 100) {
        this.scene = scene;
        this.size = size;
        this.divisions = divisions;
        this.enabled = false;

        // Helper
        this.helper = new THREE.GridHelper(size, divisions, 0x888888, 0x444444);
        this.helper.visible = false;
        this.helper.position.y = 0.1; // Slightly above ground to avoid Z-fighting with asphalt
        scene.add(this.helper);

        this.cellSize = size / divisions;
    }

    setEnabled(enabled) {
        this.enabled = enabled;
        this.helper.visible = enabled;
    }

    setSnapSize(size) {
        this.size = size * this.divisions; // Keep helper size logic consistent? No, helper size is scene size
        // Actually user wants "grid unit snap size".
        // The helper visualization relies on size/divisions.
        // If we change snap size, we should probably update helper divisions to match visually.
        // But simply updating this.cellSize is enough for logic.
        this.cellSize = size;

        // Update Helper visual if possible
        // Helper doesn't support dynamic updates easily, recreate it
        this.scene.remove(this.helper);
        const divisions = Math.floor(this.size / this.cellSize);
        this.helper = new THREE.GridHelper(this.size, divisions, 0x888888, 0x444444);
        this.helper.visible = this.enabled;
        this.helper.position.y = 0.1;
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
        // Return radians, e.g., 15 degrees
        return this.enabled ? Math.PI / 12 : null;
    }
}
