import * as THREE from 'three';

/**
 * Shared UI Widget Factories
 * Used by Inspector, WorldPanel, etc.
 */
export class InputWidgets {
    static createVectorInput(label, vec, callback, isEuler = false) {
        const row = document.createElement('div');
        row.className = 'dev-prop-row';
        const l = document.createElement('div');
        l.className = 'dev-prop-label';
        l.textContent = label;
        row.appendChild(l);

        const div = document.createElement('div');
        div.className = 'dev-prop-vector';

        ['x', 'y', 'z'].forEach(axis => {
            const inp = document.createElement('input');
            inp.type = 'number';
            inp.step = isEuler ? '1' : '0.1';
            inp.className = 'dev-prop-input';
            inp.id = `insp-${label}-${axis}`; // Note: ID uniqueness might be an issue if multiple identical vectors exist
            inp.setAttribute('aria-label', `${label} ${axis.toUpperCase()}`);

            let val = vec[axis];
            if (isEuler) val = THREE.MathUtils.radToDeg(val);
            inp.value = val.toFixed(2);

            inp.onchange = (e) => {
                const n = parseFloat(e.target.value);
                const current = isEuler ? THREE.MathUtils.radToDeg(vec[axis]) : vec[axis];
                if (Math.abs(n - current) < 0.001) return;

                // Create a clean new vector for the callback
                if (isEuler) {
                    const eClone = vec.clone();
                    if (axis === 'x') eClone.x = THREE.MathUtils.degToRad(n);
                    if (axis === 'y') eClone.y = THREE.MathUtils.degToRad(n);
                    if (axis === 'z') eClone.z = THREE.MathUtils.degToRad(n);
                    callback(eClone);
                } else {
                    const newVec = vec.clone();
                    newVec[axis] = n;
                    callback(newVec);
                }
            };
            div.appendChild(inp);
        });
        row.appendChild(div);
        return row;
    }

    static createScaleInput(obj, lockScale, setLockScaleCallback, callback) {
        const label = 'Scale';
        const vec = obj.scale;

        const row = document.createElement('div');
        row.className = 'dev-prop-row';

        // Label + Lock Checkbox
        const labelDiv = document.createElement('div');
        labelDiv.className = 'dev-prop-label';
        labelDiv.style.display = 'flex';
        labelDiv.style.flexDirection = 'column';

        const txt = document.createElement('span');
        txt.textContent = label;
        labelDiv.appendChild(txt);

        const lockLabel = document.createElement('label');
        lockLabel.className = 'dev-prop-checkbox-label';

        const check = document.createElement('input');
        check.type = 'checkbox';
        check.checked = lockScale;
        check.style.width = '10px';
        check.style.height = '10px';
        check.setAttribute('aria-label', 'Lock Aspect Ratio');
        check.onchange = (e) => setLockScaleCallback(e.target.checked);
        lockLabel.appendChild(check);
        lockLabel.appendChild(document.createTextNode('Lock'));
        labelDiv.appendChild(lockLabel);

        row.appendChild(labelDiv);

        const div = document.createElement('div');
        div.className = 'dev-prop-vector';

        ['x', 'y', 'z'].forEach(axis => {
            const inp = document.createElement('input');
            inp.type = 'number';
            inp.step = '0.1';
            inp.className = 'dev-prop-input';
            inp.id = `insp-${label}-${axis}`;
            inp.setAttribute('aria-label', `${label} ${axis.toUpperCase()}`);
            inp.value = vec[axis].toFixed(2);

            inp.onchange = (e) => {
                const n = parseFloat(e.target.value);
                if (Math.abs(n - vec[axis]) < 0.001) return;

                // We need to fetch the current lock state fresh or pass it in closure?
                // Passed as arg 'lockScale' is value at creation time.
                // We should probably rely on the callback to handle logic, or assume the parent updates us.
                // But here we are static.
                // Let's change the design: callback receives (axis, value) and handles logic?
                // Or we pass a getter for lockScale?
                // For now, let's assume the caller passes a specialized callback or we handle simple logic.

                // Refactored to let caller handle the complexity:
                callback(axis, n);
            };
            div.appendChild(inp);
        });
        row.appendChild(div);
        return row;
    }

    // Simpler signature for Scale if we want to contain logic here:
    // Actually, `Inspector` logic for scale was complex (proxy vs direct, lock vs unlock).
    // I will keep the logic in Inspector for now or make a specialized helper.
    // Let's stick to simple widgets.

    static createNumberInput(label, val, callback, idPrefix = 'prop-num-') {
        const id = `${idPrefix}${Math.floor(Math.random()*10000)}`;
        const row = document.createElement('div');
        row.className = 'dev-prop-row';

        const l = document.createElement('label');
        l.className = 'dev-prop-label';
        l.textContent = label;
        l.htmlFor = id;
        row.appendChild(l);

        const inp = document.createElement('input');
        inp.id = id;
        inp.type = 'number';
        inp.className = 'dev-prop-input';
        inp.value = val;
        inp.onchange = (e) => callback(parseFloat(e.target.value));
        row.appendChild(inp);
        return row;
    }

    static createTextInput(label, val, callback, idPrefix = 'prop-text-') {
        const id = `${idPrefix}${Math.floor(Math.random()*10000)}`;
        const row = document.createElement('div');
        row.className = 'dev-prop-row';

        const l = document.createElement('label');
        l.className = 'dev-prop-label';
        l.textContent = label;
        l.htmlFor = id;
        row.appendChild(l);

        const inp = document.createElement('input');
        inp.id = id;
        inp.type = 'text';
        inp.className = 'dev-prop-input';
        inp.value = val;
        inp.onchange = (e) => callback(e.target.value);
        row.appendChild(inp);
        return row;
    }

    static createCheckbox(label, val, callback, idPrefix = 'prop-bool-') {
        const id = `${idPrefix}${Math.floor(Math.random()*10000)}`;
        const row = document.createElement('div');
        row.className = 'dev-prop-row';

        const l = document.createElement('label');
        l.className = 'dev-prop-label';
        l.textContent = label;
        l.htmlFor = id;
        row.appendChild(l);

        const inp = document.createElement('input');
        inp.id = id;
        inp.type = 'checkbox';
        inp.checked = val;
        inp.onchange = (e) => callback(e.target.checked);
        row.appendChild(inp);
        return row;
    }
}
