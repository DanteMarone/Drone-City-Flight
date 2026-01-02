// src/dev/devSelectionManager.js
export class DevSelectionManager {
    constructor(devMode) {
        this.devMode = devMode;
    }

    selectObject(object, shiftKey = false) {
        if (!object) {
            this.selectObjects([]);
            return;
        }

        let nextSelection = [];

        if (shiftKey) {
            const idx = this.devMode.selectedObjects.indexOf(object);
            if (idx !== -1) {
                nextSelection = [
                    ...this.devMode.selectedObjects.slice(0, idx),
                    ...this.devMode.selectedObjects.slice(idx + 1),
                ];
            } else {
                nextSelection = [...this.devMode.selectedObjects, object];
            }
        } else {
            nextSelection = [object];
        }

        this.selectObjects(nextSelection);
    }

    selectObjects(objects) {
        this.devMode.selectedObjects = objects || [];

        if (this.devMode.selectedObjects.length === 0) {
            this.devMode.gizmo.detach();
        } else {
            this.devMode.gizmo.attach(this.devMode.selectedObjects);
        }

        if (this.devMode.ui && this.devMode.ui.onSelectionChanged) {
            this.devMode.ui.onSelectionChanged();
        }
    }
}
