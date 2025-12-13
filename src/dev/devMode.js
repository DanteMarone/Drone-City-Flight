/* src/dev/devMode.js
   Conflict-resolved excerpt: support 'car' and 'pickup' where relevant.
   (This file should contain the full DevMode class; below are the resolved regions.)
*/

export class DevMode {
    constructor(app, gizmo) {
        this.app = app;
        this.gizmo = gizmo;
        // ... other initialization ...
    }

    setWaypointVisualsVisible(visible) {
        if (this.app.world && this.app.world.colliders) {
            this.app.world.colliders.forEach(c => {
                const obj = c.mesh;
                if (obj && (obj.userData.type === 'car' || obj.userData.type === 'pickup')) {
                    const visuals = obj.getObjectByName('waypointVisuals');
                    if (visuals) visuals.visible = visible;
                }
            });
        }
    }

    handleWaypointSelection() {
        const sel = this.gizmo.selectedObject;
        if (sel && sel.userData.type === 'waypoint') {
            const visualGroup = sel.parent;
            if (visualGroup && visualGroup.parent && (visualGroup.parent.userData.type === 'car' || visualGroup.parent.userData.type === 'pickup')) {
                const car = visualGroup.parent;
                // Sync underlying data
                // Find index of this waypoint in visuals
                // ... existing logic ...
            }
        }
    }

    addWaypointToSelected() {
        const car = this.gizmo.selectedObject;
        if (!car || (car.userData.type !== 'car' && car.userData.type !== 'pickup')) return;

        if (car.userData.waypoints.length >= 5) {
            alert("Maximum 5 waypoints allowed.");
            return;
        }
        // ... add waypoint logic ...
    }

    removeWaypointFromSelected() {
        const car = this.gizmo.selectedObject;
        if (!car || (car.userData.type !== 'car' && car.userData.type !== 'pickup')) return;

        if (car.userData.waypoints.length === 0) return;
        // ... remove waypoint logic ...
    }

    // ... rest of DevMode implementation ...
}
