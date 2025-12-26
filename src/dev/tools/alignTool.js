import * as THREE from 'three';
import { TransformCommand } from '../history.js';

export class AlignTool {
    constructor(devMode) {
        this.devMode = devMode;
    }

    align(axis, mode) {
        const objects = this.devMode.selectedObjects;
        if (objects.length < 2) return;

        // Capture state for undo
        const beforeStates = this.devMode.captureTransforms(objects);

        // Calculate bounds based on objects position
        let min = Infinity, max = -Infinity;
        const centers = [];

        objects.forEach(obj => {
             const val = obj.position[axis];
             if (val < min) min = val;
             if (val > max) max = val;
             centers.push(val);
        });

        const avg = centers.reduce((a,b)=>a+b, 0) / centers.length;

        let targetVal;
        if (mode === 'min') targetVal = min;
        if (mode === 'max') targetVal = max;
        if (mode === 'center') targetVal = avg;

        objects.forEach(obj => {
            obj.position[axis] = targetVal;
            // Update physics/collider body
            if (this.devMode.app.colliderSystem) {
                this.devMode.app.colliderSystem.updateBody(obj);
            }
        });

        // Sync Gizmo
        if (this.devMode.gizmo) {
            this.devMode.gizmo.syncProxyToObjects();
        }

        // Push to history
        const afterStates = this.devMode.captureTransforms(objects);
        this.devMode.history.push(new TransformCommand(this.devMode, beforeStates, afterStates, `Align ${axis.toUpperCase()} ${mode}`));
    }
}
