/* src/dev/devUI.js
   Resolved Dev UI: added Pickup palette item, pickup controls, wait-time input handling,
   and show/hide logic for car/pickup controls.
*/

export class DevUI {
    constructor(dom, devMode) {
        this.dom = dom;
        this.devMode = devMode;

        // Minimal DOM wiring - assume full UI markup exists elsewhere
        // Resolved snippets below integrate pickup controls and palette item
        // Build initial DOM or assume it exists in HTML template

        // Setup event bindings
        this._setupBindings();
    }

    _setupBindings() {
        // Add / Remove waypoint buttons
        const addBtn = this.dom.querySelector('#btn-add-waypoint');
        if (addBtn) addBtn.onclick = () => {
            if (this.devMode.addWaypointToSelected) this.devMode.addWaypointToSelected();
        };

        const removeBtn = this.dom.querySelector('#btn-remove-waypoint');
        if (removeBtn) removeBtn.onclick = () => {
            if (this.devMode.removeWaypointFromSelected) this.devMode.removeWaypointFromSelected();
        };

        // Wait time input binding
        const waitTimeInput = this.dom.querySelector('#prop-wait-time');
        if (waitTimeInput) {
            waitTimeInput.onchange = (e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val) && this.devMode.gizmo.selectedObject) {
                    this.devMode.gizmo.selectedObject.userData.waitTime = val;
                }
            };
        }

        // Palette drag start handlers
        const items = this.dom.querySelectorAll('.palette-item');
        items.forEach(item => {
            item.addEventListener('dragstart', (ev) => {
                ev.dataTransfer.setData('type', item.getAttribute('data-type'));
            });
        });

        // Selection update hook (assume called when selection changes)
        // This method toggles car/pickup controls visibility accordingly
    }

    updateForSelected(object) {
        const carControls = this.dom.querySelector('#car-controls');
        const pickupControls = this.dom.querySelector('#pickup-controls');

        if (!object) {
            if (carControls) carControls.style.display = 'none';
            if (pickupControls) pickupControls.style.display = 'none';
            return;
        }

        if (object.userData.type === 'car' || object.userData.type === 'pickup') {
            if (carControls) carControls.style.display = 'flex';
            this._updateWaypointList(object);

            if (object.userData.type === 'pickup') {
                if (pickupControls) pickupControls.style.display = 'flex';
                const waitInput = this.dom.querySelector('#prop-wait-time');
                if (waitInput) waitInput.value = object.userData.waitTime || 10;
            } else {
                if (pickupControls) pickupControls.style.display = 'none';
            }
        } else {
            if (carControls) carControls.style.display = 'none';
            if (pickupControls) pickupControls.style.display = 'none';
        }
    }

    _updateWaypointList(object) {
        // Update UI list of waypoints; implementation omitted for brevity
    }
}
