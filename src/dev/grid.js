import * as THREE from 'three';

export class GridSystem {
    constructor(scene) {
        this.scene = scene;
        this.cellSize = 1; // Fixed size
        this.divisions = 1000; // Large area covered
        this.size = this.divisions * this.cellSize;
        this.enabled = true;

        this.colors = {
            axis: new THREE.Color(0xff0000),
            tenUnit: new THREE.Color(0xadd8e6),
            fiveUnit: new THREE.Color(0xffffff),
            base: new THREE.Color(0x444444)
        };

        this.helper = this._createHelper();
        this.helper.visible = false;
        scene.add(this.helper);
    }

    _createHelper() {
        const helper = new THREE.LineSegments(
            this._buildGridGeometry(),
            new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.9 })
        );
        helper.position.y = 0.1;
        return helper;
    }

    _buildGridGeometry() {
        const halfSize = this.size / 2;
        const step = this.cellSize;
        const vertices = [];
        const colors = [];

        for (let i = -halfSize; i <= halfSize; i += step) {
            const color = this._getLineColor(i);
            this._addLine(vertices, colors, -halfSize, 0, i, halfSize, 0, i, color);
            this._addLine(vertices, colors, i, 0, -halfSize, i, 0, halfSize, color);
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.computeBoundingSphere();
        return geometry;
    }

    _addLine(vertices, colors, x1, y1, z1, x2, y2, z2, color) {
        vertices.push(x1, y1, z1, x2, y2, z2);
        colors.push(color.r, color.g, color.b, color.r, color.g, color.b);
    }

    _getLineColor(position) {
        const rounded = Math.round(position);
        if (rounded === 0) return this.colors.axis;
        if (rounded % 10 === 0) return this.colors.tenUnit;
        if (rounded % 5 === 0) return this.colors.fiveUnit;
        return this.colors.base;
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
