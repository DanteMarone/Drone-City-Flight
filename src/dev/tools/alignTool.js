import { TransformCommand } from '../history.js';

export class AlignTool {
    constructor(devMode) {
        this.devMode = devMode;
    }

    createUI() {
        const container = document.createElement('div');
        container.className = 'dev-panel dev-align-tool';
        container.id = 'dev-align-container';
        container.style.display = 'none';

        const title = document.createElement('div');
        title.className = 'dev-panel-title';
        title.textContent = 'Alignment';
        container.appendChild(title);

        const grid = document.createElement('div');
        grid.className = 'dev-align-grid';

        // X Axis
        this._createButton(grid, 'Align Left (X)', '⇤', () => this.align('x', 'min'));
        this._createButton(grid, 'Align Center X', '⇹', () => this.align('x', 'center'));
        this._createButton(grid, 'Align Right (X)', '⇥', () => this.align('x', 'max'));

        // Z Axis
        this._createButton(grid, 'Align Top (Z)', '⤒', () => this.align('z', 'min'));
        this._createButton(grid, 'Align Center Z', '⇕', () => this.align('z', 'center'));
        this._createButton(grid, 'Align Bottom (Z)', '⤓', () => this.align('z', 'max'));

        container.appendChild(grid);
        return container;
    }

    _createButton(parent, label, icon, onClick) {
        const btn = document.createElement('button');
        btn.className = 'dev-btn-icon';
        btn.setAttribute('aria-label', label);
        btn.title = label;
        btn.textContent = icon;
        btn.onclick = onClick;
        parent.appendChild(btn);
    }

    updateVisibility(selectedObjects) {
        const container = document.getElementById('dev-align-container');
        if (!container) return;

        // Only show if > 1 object is selected
        const visible = selectedObjects && selectedObjects.length > 1;
        container.style.display = visible ? 'block' : 'none';
    }

    align(axis, mode) {
        const objects = this.devMode.selectedObjects;
        if (!objects || objects.length < 2) return;

        // 1. Capture State Before
        const beforeStates = this.devMode.captureTransforms(objects);

        // 2. Calculate Bounds
        let min = Infinity;
        let max = -Infinity;
        objects.forEach(obj => {
            const val = obj.position[axis];
            if (val < min) min = val;
            if (val > max) max = val;
        });
        const center = (min + max) / 2;

        // 3. Apply Alignment
        objects.forEach(obj => {
            let newVal = obj.position[axis];
            if (mode === 'min') newVal = min;
            if (mode === 'max') newVal = max;
            if (mode === 'center') newVal = center;
            obj.position[axis] = newVal;
            obj.updateMatrixWorld();
        });

        // 4. Capture State After
        const afterStates = this.devMode.captureTransforms(objects);

        // 5. Update Physics/Gizmo
        this.devMode.applyTransformSnapshot(afterStates);

        // 6. Push to History
        this.devMode.history.push(
            new TransformCommand(this.devMode, beforeStates, afterStates, `Align ${axis.toUpperCase()} ${mode}`)
        );
    }
}
