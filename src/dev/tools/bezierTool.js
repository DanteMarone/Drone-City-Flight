import * as THREE from 'three';
import { EntityRegistry } from '../../world/entities/index.js';

export class BezierTool {
    constructor(app, devMode) {
        this.app = app;
        this.devMode = devMode;

        this.state = 0; // 0: IDLE, 1: DRAG_START, 2: WAIT_END, 3: DRAG_END

        this.p0 = new THREE.Vector3();
        this.p1 = new THREE.Vector3();
        this.p2 = new THREE.Vector3();
        this.p3 = new THREE.Vector3();

        this.ghostMesh = null;
        this.helperGroup = new THREE.Group();
        this.app.renderer.scene.add(this.helperGroup);

        // Materials
        this.lineMat = new THREE.LineBasicMaterial({ color: 0xffff00, depthTest: false });
        this.previewMat = new THREE.MeshBasicMaterial({ color: 0x44ff44, transparent: true, opacity: 0.5 });
    }

    cancel() {
        this.state = 0;
        this.clearVisuals();
    }

    clearVisuals() {
        // Dispose geometries for helper lines
        this.helperGroup.children.forEach(child => {
            if (child.geometry) child.geometry.dispose();
        });
        this.helperGroup.clear();

        if (this.ghostMesh) {
            this.app.renderer.scene.remove(this.ghostMesh);
            if (this.ghostMesh.geometry) this.ghostMesh.geometry.dispose();
            this.ghostMesh = null;
        }
    }

    updateVisuals() {
        this.clearVisuals();

        // Draw Tangents
        if (this.state >= 1) {
            const geom = new THREE.BufferGeometry().setFromPoints([this.p0, this.p1]);
            const line = new THREE.Line(geom, this.lineMat);
            this.helperGroup.add(line);
        }

        if (this.state >= 3) {
             const geom = new THREE.BufferGeometry().setFromPoints([this.p3, this.p2]);
             const line = new THREE.Line(geom, this.lineMat);
             this.helperGroup.add(line);
        }

        // Draw Curve Preview
        if (this.state >= 2) {
            const curve = new THREE.CubicBezierCurve3(this.p0, this.p1, this.p2, this.p3);
            const tubeGeo = new THREE.TubeGeometry(curve, 32, 5, 4, false); // Radius 5 = width 10
            // Flatten to resemble road
            tubeGeo.scale(1, 0.05, 1);

            this.ghostMesh = new THREE.Mesh(tubeGeo, this.previewMat);
            this.app.renderer.scene.add(this.ghostMesh);
        }
    }

    getIntersect(raycaster) {
         // Raycast against ground
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const target = new THREE.Vector3();
        raycaster.ray.intersectPlane(plane, target);
        return target;
    }

    onMouseDown(e, raycaster) {
        if (e.button !== 0) return false;
        const point = this.getIntersect(raycaster);
        if (!point) return false;

        // Snap to grid
        if (this.devMode.grid && this.devMode.grid.enabled) {
            point.x = Math.round(point.x);
            point.z = Math.round(point.z);
        }

        if (this.state === 0) {
            this.p0.copy(point);
            this.p1.copy(point); // Init P1
            this.state = 1;
            return true;
        } else if (this.state === 2) {
            this.p3.copy(point);
            this.p2.copy(point); // Init P2
            this.state = 3;
            return true;
        }

        return false;
    }

    onMouseMove(e, raycaster) {
        if (this.state === 0) return false;

        const point = this.getIntersect(raycaster);
        if (!point) return false;

        if (this.devMode.grid && this.devMode.grid.enabled) {
            point.x = Math.round(point.x);
            point.z = Math.round(point.z);
        }

        if (this.state === 1) {
            this.p1.copy(point);
            this.updateVisuals();
        } else if (this.state === 2) {
            this.p3.copy(point);
            // Heuristic for P2 while moving P3:
            // P2 = P3 - (P1 - P0)
            const tangent = new THREE.Vector3().subVectors(this.p1, this.p0);
            this.p2.subVectors(this.p3, tangent);

            this.updateVisuals();
        } else if (this.state === 3) {
            this.p2.copy(point);
            this.updateVisuals();
        }

        return true;
    }

    onMouseUp(e) {
        if (this.state === 1) {
            // If user just clicked without dragging, p1 == p0.
            // Maybe set a default tangent?
            if (this.p1.distanceTo(this.p0) < 0.1) {
                // Default to +Z or something?
                // Or just keep it as is (straight line start)
                this.p1.copy(this.p0).add(new THREE.Vector3(0, 0, 5));
            }
            this.state = 2;
        } else if (this.state === 3) {
            this.finalize();
            this.state = 0;
            this.clearVisuals();
        }
    }

    finalize() {
        // Points relative to P0
        const relativeP1 = new THREE.Vector3().subVectors(this.p1, this.p0);
        const relativeP2 = new THREE.Vector3().subVectors(this.p2, this.p0);
        const relativeP3 = new THREE.Vector3().subVectors(this.p3, this.p0);

        const params = {
            x: this.p0.x,
            y: this.p0.y,
            z: this.p0.z,
            p1: relativeP1,
            p2: relativeP2,
            p3: relativeP3
        };

        const entity = EntityRegistry.create('curve_road', params);
        if (entity && entity.mesh) {
            this.app.renderer.scene.add(entity.mesh);
            this.app.world.addEntity(entity);

            // Note: Collider generation skipped for prototype

            this.devMode._recordCreation([entity.mesh], 'Place curve road');
        }
    }
}
