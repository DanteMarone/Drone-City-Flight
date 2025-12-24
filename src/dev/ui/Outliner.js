export class Outliner {
    constructor(container, devMode) {
        this.devMode = devMode;
        this.dom = document.createElement('div');
        this.dom.className = 'dev-panel dev-outliner';
        container.appendChild(this.dom);

        this._renderHeader();
        this._renderList();

        this.refreshInterval = setInterval(() => this.refresh(), 2000);
    }

    _renderHeader() {
        this.dom.innerHTML = `
            <div class="dev-panel-header">
                <span>World Outliner</span>
                <span id="outliner-count" style="font-weight:normal; color:#888; font-size:0.8em">0 items</span>
            </div>
            <div class="dev-panel-content" id="outliner-list"></div>
        `;
    }

    _renderList() {
    }

    refresh() {
        const list = this.dom.querySelector('#outliner-list');
        const count = this.dom.querySelector('#outliner-count');
        if (!list) return;

        const scrollTop = list.scrollTop;

        list.innerHTML = '';

        const entities = this.devMode.app.world.colliders;
        count.textContent = `${entities.length} items`;

        const groups = {
            'Vehicles': [],
            'Infrastructure': [],
            'Nature': [],
            'Props': [],
            'Other': []
        };

        entities.forEach(ent => {
            const type = ent.userData.type || 'unknown';
            if (ent.userData.isVehicle) {
                groups['Vehicles'].push(ent);
            } else if (['road', 'bridge', 'sidewalk', 'river'].includes(type)) {
                groups['Infrastructure'].push(ent);
            } else if (['tree', 'rock', 'cloud'].some(t => type.includes(t))) {
                groups['Nature'].push(ent);
            } else {
                groups['Other'].push(ent);
            }
        });

        const createItem = (ent, indent = 0) => {
            const el = document.createElement('div');
            el.className = 'dev-tree-item';

            const isSelected = this.devMode.selectedObjects.includes(ent);
            if (isSelected) el.classList.add('selected');

            const name = ent.userData.uuid ? `${ent.userData.type} (${ent.userData.uuid.substr(0,4)})` : ent.userData.type;

            el.innerHTML = `
                <span class="dev-tree-icon">${this._getIcon(ent.userData.type)}</span>
                <span>${name}</span>
                <span class="dev-tree-eye ${ent.visible ? '' : 'is-hidden'}">👁️</span>
            `;

            el.onclick = (e) => {
                if (e.target.classList.contains('dev-tree-eye')) {
                    ent.visible = !ent.visible;
                    e.target.classList.toggle('is-hidden', !ent.visible);

                    if (ent.userData.isVehicle && ent.userData.waypointGroup) {
                         ent.userData.waypointGroup.visible = ent.visible && this.devMode.enabled;
                    }

                    return;
                }

                if (e.shiftKey) {
                    const newSel = [...this.devMode.selectedObjects];
                    if (isSelected) {
                        const idx = newSel.indexOf(ent);
                        if (idx > -1) newSel.splice(idx, 1);
                    } else {
                        newSel.push(ent);
                    }
                    this.devMode.selectObjects(newSel);
                } else {
                    this.devMode.selectObjects([ent]);
                }
            };

            return el;
        };

        Object.entries(groups).forEach(([name, items]) => {
            if (items.length === 0) return;

            const groupHeader = document.createElement('div');
            groupHeader.className = 'dev-tree-item';
            groupHeader.style.fontWeight = 'bold';
            groupHeader.style.color = '#aaa';
            groupHeader.textContent = `▼ ${name} (${items.length})`;
            list.appendChild(groupHeader);

            items.forEach(ent => {
                const item = createItem(ent, 1);
                item.style.paddingLeft = '20px';
                list.appendChild(item);
            });
        });

        list.scrollTop = scrollTop;
    }

    _getIcon(type) {
        if (!type) return '📦';
        if (type.includes('vehicle') || type.includes('car')) return '🚗';
        if (type.includes('tree')) return '🌳';
        if (type.includes('road')) return '🛣️';
        if (type.includes('building') || type.includes('house')) return '🏠';
        return '📦';
    }

    updateSelection() {
        this.refresh();
    }
}
