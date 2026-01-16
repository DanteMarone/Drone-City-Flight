import * as THREE from 'three';

let idCounter = 0;

export function createVectorInput(label, vec, callback, isEuler = false) {
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
        inp.id = `insp-${label}-${axis}`; // Note: ID collision risk if multiple same-label vectors exist, but acceptable for now
        inp.setAttribute('aria-label', `${label} ${axis.toUpperCase()}`);

        let val = vec[axis];
        if (isEuler) val = THREE.MathUtils.radToDeg(val);
        inp.value = val.toFixed(2);

        inp.onchange = (e) => {
            const n = parseFloat(e.target.value);
            const current = isEuler ? THREE.MathUtils.radToDeg(vec[axis]) : vec[axis];
            if (Math.abs(n - current) < 0.001) return;

            const newVec = vec.clone();
            if (isEuler) {
                const eClone = vec.clone();
                if (axis === 'x') eClone.x = THREE.MathUtils.degToRad(n);
                if (axis === 'y') eClone.y = THREE.MathUtils.degToRad(n);
                if (axis === 'z') eClone.z = THREE.MathUtils.degToRad(n);
                callback(eClone);
            } else {
                newVec[axis] = n;
                callback(newVec);
            }
        };
        div.appendChild(inp);
    });
    row.appendChild(div);
    return row;
}

export function createScaleInput(obj, lockScale, onLockChange, onScaleChange, isProxy = false) {
    const label = 'Scale';
    const vec = obj.scale;
    let currentLock = lockScale;

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
    check.checked = currentLock;
    check.style.width = '10px';
    check.style.height = '10px';
    check.setAttribute('aria-label', 'Lock Aspect Ratio');
    check.onchange = (e) => {
        currentLock = e.target.checked;
        onLockChange(currentLock);
    };
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

            if (currentLock) {
                const newVec = new THREE.Vector3(n, n, n);
                onScaleChange(newVec);
            } else {
                const newVec = vec.clone();
                newVec[axis] = n;
                onScaleChange(newVec);
            }
        };
        div.appendChild(inp);
    });
    row.appendChild(div);
    return row;
}

export function createNumberInput(key, val, cb) {
    const id = `prop-num-${idCounter++}`;
    const row = document.createElement('div');
    row.className = 'dev-prop-row';

    const l = document.createElement('label');
    l.className = 'dev-prop-label';
    l.textContent = key;
    l.htmlFor = id;
    row.appendChild(l);

    const inp = document.createElement('input');
    inp.id = id;
    inp.type = 'number';
    inp.className = 'dev-prop-input';
    inp.value = val;
    inp.onchange = (e) => cb(parseFloat(e.target.value));
    row.appendChild(inp);
    return row;
}

export function createTextInput(key, val, cb) {
    const id = `prop-text-${idCounter++}`;
    const row = document.createElement('div');
    row.className = 'dev-prop-row';

    const l = document.createElement('label');
    l.className = 'dev-prop-label';
    l.textContent = key;
    l.htmlFor = id;
    row.appendChild(l);

    const inp = document.createElement('input');
    inp.id = id;
    inp.type = 'text';
    inp.className = 'dev-prop-input';
    inp.value = val;
    inp.onchange = (e) => cb(e.target.value);
    row.appendChild(inp);
    return row;
}

export function createCheckbox(key, val, cb) {
    const id = `prop-bool-${idCounter++}`;
    const row = document.createElement('div');
    row.className = 'dev-prop-row';

    const l = document.createElement('label');
    l.className = 'dev-prop-label';
    l.textContent = key;
    l.htmlFor = id;
    row.appendChild(l);

    const inp = document.createElement('input');
    inp.id = id;
    inp.type = 'checkbox';
    inp.checked = val;
    inp.onchange = (e) => cb(e.target.checked);
    row.appendChild(inp);
    return row;
}
