export class DevTransformManager {
    constructor(devMode) {
        this.devMode = devMode;
    }

    captureTransforms(targets = this.devMode.selectedObjects) {
        if (!targets) return [];
        return targets.map(obj => cloneTransform(obj));
    }

    transformsChanged(before, after) {
        if (!before || !after || before.length !== after.length) return true;
        for (let i = 0; i < before.length; i++) {
            const b = before[i];
            const a = after[i];
            if (!b.object || !a.object) return true;
            if (!b.position.equals(a.position)) return true;
            if (!b.rotation.equals(a.rotation)) return true;
            if (!b.scale.equals(a.scale)) return true;
        }
        return false;
    }

    applyTransformSnapshot(states) {
        if (!states || states.length === 0) return;
        const toUpdate = new Set();

        states.forEach(state => {
            const obj = state.object;
            if (!obj) return;

            obj.position.copy(state.position);
            obj.rotation.copy(state.rotation);
            obj.scale.copy(state.scale);
            obj.updateMatrixWorld();

            if (obj.userData?.type === 'waypoint') {
                const vehicle = obj.userData.vehicle;
                const idx = obj.userData.index;
                if (vehicle && idx !== undefined && vehicle.userData?.waypoints?.[idx]) {
                    vehicle.userData.waypoints[idx].copy(obj.position);
                    this.devMode.waypoints.updateLine(vehicle);
                    toUpdate.add(vehicle);
                }
            } else if (obj.userData?.isVehicle) {
                this.devMode.waypoints.updateLine(obj);
                toUpdate.add(obj);
            } else {
                toUpdate.add(obj);
            }
        });

        if (this.devMode.app.colliderSystem) {
            toUpdate.forEach(obj => this.devMode.app.colliderSystem.updateBody(obj));
        }

        if (this.devMode.selectedObjects.length > 0) {
            this.devMode.gizmo.attach(this.devMode.selectedObjects);
        }

        if (this.devMode.selectedObjects.length === 1) {
            this.devMode.ui.updateProperties(this.devMode.selectedObjects[0]);
        } else if (this.devMode.selectedObjects.length > 1) {
            this.devMode.ui.updateProperties(this.devMode.gizmo.proxy);
        }
    }
}

export function cloneTransform(object) {
    return {
        object,
        position: object.position.clone(),
        rotation: object.rotation.clone(),
        scale: object.scale.clone(),
    };
}
