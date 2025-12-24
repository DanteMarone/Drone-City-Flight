import { TransformCommand, PropertyChangeCommand, WaypointCommand, cloneWaypointState } from '../history.js';

export class Inspector {
    constructor(container, devMode) {
        this.devMode = devMode;
        this.dom = document.createElement('div');
        this.dom.className = 'dev-panel dev-inspector';
        container.appendChild(this.dom);

        this.currentUUIDs = [];
        this._renderBase();
    }

    _renderBase() {
        this.dom.innerHTML = `
            <div class="dev-panel-header">Inspector</div>
            <div class="dev-panel-content" id="insp-content">
                <div style="color:#888; text-align:center; padding:20px;">No Selection</div>
            </div>
        `;
    }

    update(objects) {
        const content = this.dom.querySelector('#insp-content');
        if (!objects || objects.length === 0) {
            content.innerHTML = '<div style="color:#888; text-align:center; padding:20px;">No Selection</div>';
            this.currentUUIDs = [];
            return;
        }

        const isMulti = objects.length > 1;
        const target = objects[0];
        const type = isMulti ? 'Multi-Selection' : (target.userData.type || 'Object');
        const uuid = isMulti ? `${objects.length} items` : (target.userData.uuid ? target.userData.uuid.substr(0,8) : 'N/A');

        content.innerHTML = '';

        const info = document.createElement('div');
        info.style.marginBottom = '10px';
        info.innerHTML = `
            <div style="font-size:1.1em; font-weight:bold; color:white;">${type}</div>
            <div style="font-size:0.8em; color:#666;">ID: ${uuid}</div>
        `;
        content.appendChild(info);

        this._renderTransform(content, objects);

        if (!isMulti && target.userData.params) {
            this._renderDynamicParams(content, target);
        }

        if (!isMulti && (target.userData.isVehicle || target.userData.type === 'waypoint')) {
            const vehicle = target.userData.type === 'waypoint' ? target.userData.vehicle : target;
            if (vehicle) this._renderVehicleControls(content, vehicle);
        }

        const actions = document.createElement('div');
        actions.className = 'dev-prop-section';
        actions.innerHTML = `
            <button class="dev-btn dev-btn-danger" style="width:100%" id="insp-delete">Delete Object</button>
        `;
        actions.querySelector('#insp-delete').onclick = () => this.devMode.deleteSelected();
        content.appendChild(actions);
    }

    _renderTransform(parent, objects) {
        const section = document.createElement('div');
        section.className = 'dev-prop-section';

        const proxy = this.devMode.gizmo.proxy;
        const target = (objects.length > 0 && proxy) ? proxy : objects[0];

        const createRow = (label, axis, value, step=1, callback) => {
            const row = document.createElement('div');
            row.className = 'dev-prop-row';
            row.innerHTML = `<label>${label}</label>`;

            const input = document.createElement('input');
            input.type = 'number';
            input.className = 'dev-prop-input';
            input.step = step;
            input.value = (value !== undefined) ? value.toFixed(2) : 0;

            input.onfocus = () => {
                this.devMode.captureTransforms(objects);
            };

            input.onchange = (e) => {
                const val = parseFloat(e.target.value);
                if (isNaN(val)) return;
                callback(val);

                if (this.devMode.gizmo) {
                    this.devMode.gizmo.syncProxyToObjects();
                    this.devMode.app.colliderSystem.updateBody(objects[0]);
                }
            };

            row.appendChild(input);
            return row;
        };

        const toDeg = (r) => r * (180/Math.PI);
        const toRad = (d) => d * (Math.PI/180);

        section.appendChild(createRow('Position X', 'x', target.position.x, 1, v => target.position.x = v));
        section.appendChild(createRow('Position Y', 'y', target.position.y, 1, v => target.position.y = v));
        section.appendChild(createRow('Position Z', 'z', target.position.z, 1, v => target.position.z = v));

        section.appendChild(createRow('Rotation X', 'rx', toDeg(target.rotation.x), 1, v => target.rotation.x = toRad(v)));
        section.appendChild(createRow('Rotation Y', 'ry', toDeg(target.rotation.y), 1, v => target.rotation.y = toRad(v)));
        section.appendChild(createRow('Rotation Z', 'rz', toDeg(target.rotation.z), 1, v => target.rotation.z = toRad(v)));

        section.appendChild(createRow('Scale X', 'sx', target.scale.x, 0.1, v => target.scale.x = v));
        section.appendChild(createRow('Scale Y', 'sy', target.scale.y, 0.1, v => target.scale.y = v));
        section.appendChild(createRow('Scale Z', 'sz', target.scale.z, 0.1, v => target.scale.z = v));

        parent.appendChild(section);
    }

    _renderDynamicParams(parent, object) {
        const params = object.userData.params;
        const keys = Object.keys(params).filter(k => !['uuid', 'type', 'isVehicle'].includes(k));

        if (keys.length === 0) return;

        const section = document.createElement('div');
        section.className = 'dev-prop-section';
        section.innerHTML = '<div style="margin-bottom:5px; color:#aaa; font-weight:bold;">Parameters</div>';

        keys.forEach(key => {
            const val = params[key];
            const type = typeof val;

            const row = document.createElement('div');
            row.className = 'dev-prop-row';

            const labelStr = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            row.innerHTML = `<label title="${key}">${labelStr}</label>`;

            if (type === 'number') {
                const input = document.createElement('input');
                input.type = 'number';
                input.className = 'dev-prop-input';
                input.value = val;
                input.step = val % 1 !== 0 ? 0.1 : 1;

                let startVal = null;
                input.onfocus = () => startVal = params[key];
                input.onchange = (e) => {
                    const next = parseFloat(e.target.value);
                    params[key] = next;
                    this.devMode.history.push(new PropertyChangeCommand(
                        this.devMode, object.userData.uuid, key, startVal, next, `Change ${key}`
                    ));
                    startVal = null;
                };
                row.appendChild(input);
            } else if (type === 'boolean') {
                const input = document.createElement('input');
                input.type = 'checkbox';
                input.checked = val;
                input.onchange = (e) => {
                    const next = e.target.checked;
                    params[key] = next;
                };
                row.appendChild(input);
            } else {
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'dev-prop-input';
                input.value = val;
                input.onchange = (e) => {
                     params[key] = e.target.value;
                };
                row.appendChild(input);
            }

            section.appendChild(row);
        });

        parent.appendChild(section);
    }

    _renderVehicleControls(parent, vehicle) {
        const section = document.createElement('div');
        section.className = 'dev-prop-section';
        section.innerHTML = '<div style="margin-bottom:5px; color:#aaa; font-weight:bold;">Vehicle Path</div>';

        const btnRow = document.createElement('div');
        btnRow.style.display = 'flex';
        btnRow.style.gap = '5px';
        btnRow.style.marginBottom = '10px';

        const addBtn = document.createElement('button');
        addBtn.className = 'dev-btn';
        addBtn.textContent = '+ Add Node';
        addBtn.style.flex = '1';
        addBtn.onclick = () => this.devMode.addWaypointToSelected();

        const delBtn = document.createElement('button');
        delBtn.className = 'dev-btn';
        delBtn.textContent = '- Last Node';
        delBtn.style.flex = '1';
        delBtn.onclick = () => this.devMode.removeWaypointFromSelected();

        btnRow.appendChild(addBtn);
        btnRow.appendChild(delBtn);
        section.appendChild(btnRow);

        if (vehicle.userData.waypoints) {
            vehicle.userData.waypoints.forEach((wp, idx) => {
                const row = document.createElement('div');
                row.style.cssText = 'display:flex; gap:2px; margin-bottom:2px; align-items:center;';
                row.innerHTML = `<span style="width:15px; color:#666; font-size:0.8em;">${idx}</span>`;

                ['x', 'y', 'z'].forEach(axis => {
                    const inp = document.createElement('input');
                    inp.type = 'number';
                    inp.className = 'dev-prop-input';
                    inp.style.width = '30px';
                    inp.value = wp[axis].toFixed(1);
                    inp.onchange = (e) => {
                        wp[axis] = parseFloat(e.target.value);
                        if (this.devMode._syncWaypointVisuals) this.devMode._syncWaypointVisuals(vehicle);
                        if (this.devMode.app.colliderSystem) this.devMode.app.colliderSystem.updateBody(vehicle);
                    };
                    row.appendChild(inp);
                });
                section.appendChild(row);
            });
        }

        parent.appendChild(section);
    }
}
