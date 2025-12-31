import * as THREE from 'three';
import { WaypointCommand, cloneWaypointState } from './history.js';

export class WaypointManager {
    constructor(devMode) {
        this.devMode = devMode;
    }

    get app() {
        return this.devMode.app;
    }

    get selectedObjects() {
        return this.devMode.selectedObjects;
    }

    update(dt) {
        if (!this.devMode.enabled) return;

        // Update Line Visuals if a waypoint is being moved
        this.selectedObjects.forEach(sel => {
            if (sel.userData.type === 'waypoint') {
                const vehicle = sel.userData.vehicle;
                if (vehicle) {
                    const idx = sel.userData.index;
                    if (idx !== undefined && vehicle.userData.waypoints) {
                         vehicle.userData.waypoints[idx].copy(sel.position);
                         this.updateLine(vehicle);
                    }
                }
            } else if (sel.userData.isVehicle) {
                this.updateLine(sel);
            }
        });
    }

    setVisibility(visible) {
        if (this.app.world && this.app.world.colliders) {
            this.app.world.colliders.forEach(c => {
                const obj = c.mesh;
                if (obj && obj.userData.waypointGroup) {
                    obj.userData.waypointGroup.visible = visible;
                    // Ensure they are in scene
                    if (visible && obj.userData.waypointGroup.parent !== this.app.renderer.scene) {
                        this.app.renderer.scene.add(obj.userData.waypointGroup);
                    } else if (!visible && obj.userData.waypointGroup.parent === this.app.renderer.scene) {
                        this.app.renderer.scene.remove(obj.userData.waypointGroup);
                    }
                }
            });
        }
    }

    updateLine(vehicleMesh) {
        const visualGroup = vehicleMesh.userData.waypointGroup;
        if (!visualGroup) return;

        const line = visualGroup.getObjectByName('pathLine');
        if (line) {
             // Path: Vehicle Position -> Waypoint 1 -> ...
             const points = [vehicleMesh.position.clone(), ...vehicleMesh.userData.waypoints];
             line.geometry.dispose();
             line.geometry = new THREE.BufferGeometry().setFromPoints(points);
        }
    }

    syncVisuals(car) {
        const visualGroup = car.userData.waypointGroup;
        if (!visualGroup) return;

        const oldLine = visualGroup.getObjectByName('pathLine');
        if (oldLine) {
            oldLine.geometry.dispose();
            visualGroup.remove(oldLine);
        }

        const oldWaypoints = visualGroup.children.filter(c => c.userData?.type === 'waypoint');
        oldWaypoints.forEach(c => visualGroup.remove(c));

        const orbGeo = new THREE.SphereGeometry(0.5, 16, 16);
        const orbMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

        (car.userData.waypoints || []).forEach((wp, idx) => {
            const orb = new THREE.Mesh(orbGeo, orbMat);
            orb.position.copy(wp);
            orb.userData = { type: 'waypoint', isHelper: true, index: idx, vehicle: car };
            visualGroup.add(orb);
        });

        if (car.userData.waypoints?.length) {
            const material = new THREE.LineBasicMaterial({ color: 0xffffff });
            const points = [car.position.clone(), ...car.userData.waypoints];
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, material);
            line.name = 'pathLine';
            visualGroup.add(line);
        }

        if (this.devMode.enabled) {
            visualGroup.visible = true;
            if (visualGroup.parent !== this.app.renderer.scene) {
                this.app.renderer.scene.add(visualGroup);
            }
        } else {
            visualGroup.visible = false;
            if (visualGroup.parent === this.app.renderer.scene) {
                this.app.renderer.scene.remove(visualGroup);
            }
        }
    }

    add() {
        const waypoints = this.selectedObjects.filter(o => o.userData.type === 'waypoint');
        const cars = this.selectedObjects.filter(o => o.userData.isVehicle);

        // Combine cars and unique cars derived from selected waypoints
        const targets = new Map();

        cars.forEach(car => targets.set(car.uuid, { car, index: -1 })); // -1 means append
        waypoints.forEach(wp => {
            const car = wp.userData.vehicle;
            if (car) {
                targets.set(car.uuid, { car, index: wp.userData.index });
            }
        });

        if (targets.size === 0) return;

        const carList = Array.from(targets.values()).map(t => t.car);
        const beforeStates = carList.map(cloneWaypointState);
        let changed = false;
        let newSelection = [];

        targets.forEach(({ car, index }) => {
            if (car.userData.waypoints.length >= 10) { // Limit reasonable number
                console.warn(`Car ${car.uuid} max waypoints reached.`);
                return;
            }

            changed = true;

            let insertIndex;
            let refPos;

            const wpCount = car.userData.waypoints.length;
            const isLast = (index === -1) || (index === wpCount - 1);

            if (isLast) {
                insertIndex = wpCount;
                if (wpCount > 0) {
                    refPos = car.userData.waypoints[wpCount - 1];
                } else {
                    refPos = car.position.clone();
                }
            } else {
                insertIndex = index + 1;
                refPos = car.userData.waypoints[index];
            }

            const newPos = refPos.clone().add(new THREE.Vector3(10, 0, 0));

            car.userData.waypoints.splice(insertIndex, 0, newPos);

            this.syncVisuals(car);
            if (this.app.colliderSystem) this.app.colliderSystem.updateBody(car);

            // Find the new waypoint orb to select it
            if (car.userData.waypointGroup) {
                const orb = car.userData.waypointGroup.children.find(c =>
                    c.userData.type === 'waypoint' && c.userData.index === insertIndex
                );
                if (orb) newSelection.push(orb);
            }
        });

        if (changed) {
            const afterStates = carList.map(cloneWaypointState);
            this.devMode.history.push(new WaypointCommand(this.devMode, beforeStates, afterStates, 'Add waypoint'));

            if (newSelection.length > 0) {
                this.devMode.selectObjects(newSelection);
            } else if (this.selectedObjects.length === 1) {
                this.devMode.ui.updateProperties(this.selectedObjects[0]);
            }
        }
    }

    remove() {
        const cars = this.selectedObjects.filter(o => o.userData.isVehicle);

        const beforeStates = cars.map(cloneWaypointState);
        let changed = false;

        cars.forEach(car => {
            if (car.userData.waypoints.length === 0) return;

            changed = true;

            car.userData.waypoints.pop();
            this.syncVisuals(car);
            if (this.app.colliderSystem) this.app.colliderSystem.updateBody(car);
        });

        if (this.selectedObjects.length === 1) {
            this.devMode.ui.updateProperties(this.selectedObjects[0]);
        }

        if (changed) {
            const afterStates = cars.map(cloneWaypointState);
            this.devMode.history.push(new WaypointCommand(this.devMode, beforeStates, afterStates, 'Remove waypoint'));
        }
    }

    delete(waypoints) {
        if (!waypoints || waypoints.length === 0) return;

        // Group by vehicle
        const targets = new Map();
        waypoints.forEach(wp => {
            const car = wp.userData.vehicle;
            if (car) {
                if (!targets.has(car.uuid)) {
                    targets.set(car.uuid, { car, indices: [] });
                }
                targets.get(car.uuid).indices.push(wp.userData.index);
            }
        });

        const cars = Array.from(targets.values()).map(t => t.car);
        const beforeStates = cars.map(cloneWaypointState);
        let changed = false;

        targets.forEach(({ car, indices }) => {
            if (!car.userData.waypoints) return;

            // Sort indices descending to remove safely
            indices.sort((a, b) => b - a);

            indices.forEach(idx => {
                if (idx >= 0 && idx < car.userData.waypoints.length) {
                        car.userData.waypoints.splice(idx, 1);
                        changed = true;
                }
            });

            this.syncVisuals(car);
            if (this.app.colliderSystem) this.app.colliderSystem.updateBody(car);
        });

        if (changed) {
            const afterStates = cars.map(cloneWaypointState);
            this.devMode.history.push(new WaypointCommand(this.devMode, beforeStates, afterStates, 'Delete waypoint'));
        }
    }

    applySnapshot(states) {
        if (!states || states.length === 0) return;

        states.forEach(state => {
            if (!state.car) return;
            state.car.userData.waypoints = state.waypoints.map(wp => wp.clone());
            this.syncVisuals(state.car);
            if (this.app.colliderSystem) {
                this.app.colliderSystem.updateBody(state.car);
            }
        });

        if (this.selectedObjects.length === 1) {
            this.devMode.ui.updateProperties(this.selectedObjects[0]);
        }
    }
}
