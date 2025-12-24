
import * as THREE from 'three';
import { TransformCommand } from '../history.js';

export class AlignTool {
    constructor(devMode) {
        this.devMode = devMode;
        this.dom = null;
    }

    createUI() {
        const container = document.createElement('div');
        container.className = 'dev-align-tool';
        // Note: Styles moved to src/style.css to avoid inline styles

        container.innerHTML = `
            <div class="dev-align-label">Align Objects</div>
            <div class="align-row">
                <button class="align-btn" data-axis="x" data-type="min" aria-label="Align Left (X Min)">←</button>
                <button class="align-btn" data-axis="x" data-type="center" aria-label="Align Center X">↔</button>
                <button class="align-btn" data-axis="x" data-type="max" aria-label="Align Right (X Max)">→</button>
            </div>
            <div class="align-row">
                <button class="align-btn" data-axis="z" data-type="min" aria-label="Align Back (Z Min)">↑</button>
                <button class="align-btn" data-axis="z" data-type="center" aria-label="Align Center Z">↕</button>
                <button class="align-btn" data-axis="z" data-type="max" aria-label="Align Front (Z Max)">↓</button>
            </div>
             <div class="align-row">
                <button class="align-btn" data-axis="y" data-type="min" aria-label="Align Bottom (Y Min)">_</button>
                <button class="align-btn" data-axis="y" data-type="center" aria-label="Align Center Y">=</button>
                <button class="align-btn" data-axis="y" data-type="max" aria-label="Align Top (Y Max)">¯</button>
            </div>
        `;

        // Bind events
        container.querySelectorAll('.align-btn').forEach(btn => {
            btn.onclick = () => {
                this.align(btn.dataset.axis, btn.dataset.type);
            };
        });

        this.dom = container;
        return container;
    }

    align(axis, type) {
        const selection = this.devMode.selectedObjects;
        if (!selection || selection.length < 2) {
            console.warn("AlignTool: Need at least 2 objects selected.");
            return;
        }

        // Capture state for Undo
        const beforeStates = this.devMode.captureTransforms(selection);

        // 1. Calculate Bounds of the Selection Group
        const groupBox = new THREE.Box3();
        const objBox = new THREE.Box3();

        selection.forEach(obj => {
            // Ensure world matrix is up to date
            obj.updateMatrixWorld(true);

            // Get bounding box of the mesh
            if (obj.geometry) {
                if (!obj.geometry.boundingBox) obj.geometry.computeBoundingBox();
                objBox.copy(obj.geometry.boundingBox).applyMatrix4(obj.matrixWorld);
            } else {
                objBox.setFromObject(obj);
            }
            groupBox.union(objBox);
        });

        // 2. Determine Target Value
        let targetVal = 0;
        if (axis === 'x') {
            if (type === 'min') targetVal = groupBox.min.x;
            else if (type === 'max') targetVal = groupBox.max.x;
            else if (type === 'center') targetVal = (groupBox.min.x + groupBox.max.x) / 2;
        } else if (axis === 'y') {
            if (type === 'min') targetVal = groupBox.min.y;
            else if (type === 'max') targetVal = groupBox.max.y;
            else if (type === 'center') targetVal = (groupBox.min.y + groupBox.max.y) / 2;
        } else if (axis === 'z') {
            if (type === 'min') targetVal = groupBox.min.z;
            else if (type === 'max') targetVal = groupBox.max.z;
            else if (type === 'center') targetVal = (groupBox.min.z + groupBox.max.z) / 2;
        }

        // 3. Apply Alignment
        selection.forEach(obj => {
            // We align based on the object's center or bounds edge?
            // Usually "Align Left" means the object's left edge touches the target line.
            // "Align Center" means the object's center touches the target line.

            // Re-calculate this object's world bounds
            if (obj.geometry) {
                objBox.copy(obj.geometry.boundingBox).applyMatrix4(obj.matrixWorld);
            } else {
                objBox.setFromObject(obj);
            }

            const objCenter = new THREE.Vector3();
            objBox.getCenter(objCenter);
            const objSize = new THREE.Vector3();
            objBox.getSize(objSize);

            let offset = 0;

            if (type === 'min') {
                // We want objBox.min[axis] to equal targetVal
                // objBox.min = center - size/2
                // current min = objBox.min[axis]
                // shift = targetVal - currentMin

                // However, since we are moving the object position, we need to know the relationship
                // between position and bounds.
                // easiest: calculate shift required.
                const currentMin = objBox.min[axis];
                offset = targetVal - currentMin;
            } else if (type === 'max') {
                const currentMax = objBox.max[axis];
                offset = targetVal - currentMax;
            } else if (type === 'center') {
                const currentCenter = objCenter.getComponent(['x', 'y', 'z'].indexOf(axis));
                offset = targetVal - currentCenter;
            }

            // Apply offset to position
            if (axis === 'x') obj.position.x += offset;
            if (axis === 'y') obj.position.y += offset;
            if (axis === 'z') obj.position.z += offset;

            obj.updateMatrixWorld(true);

            // Update physics body
            if (this.devMode.app.colliderSystem) {
                this.devMode.app.colliderSystem.updateBody(obj);
            }
        });

        // 4. Sync Gizmo
        if (this.devMode.gizmo) {
            this.devMode.gizmo.syncProxyToObjects(); // This re-centers the gizmo on the new group center
        }

        // 5. Push History
        const afterStates = this.devMode.captureTransforms(selection);
        this.devMode.history.push(new TransformCommand(this.devMode, beforeStates, afterStates, `Align ${axis.toUpperCase()} ${type}`));
    }
}
