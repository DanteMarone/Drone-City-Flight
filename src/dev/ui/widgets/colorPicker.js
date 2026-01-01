import * as THREE from 'three';

export class ColorPickerWidget {
    constructor(label, value, onChange) {
        this.label = label;
        this.value = value; // Can be number (0xff0000) or string ('#ff0000')
        this.onChange = onChange;
        this.element = this._createUI();
    }

    _createUI() {
        const row = document.createElement('div');
        row.className = 'dev-prop-row';

        const labelEl = document.createElement('label');
        labelEl.className = 'dev-prop-label';
        labelEl.textContent = this.label;
        row.appendChild(labelEl);

        const container = document.createElement('div');
        container.className = 'dev-color-picker-container';
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.gap = '8px';
        container.style.flex = '1';

        // 1. Native Input (Hidden but clickable via label/swatch)
        const input = document.createElement('input');
        input.type = 'color';
        input.className = 'dev-color-input-native visually-hidden';
        input.id = `color-${Math.random().toString(36).substr(2, 9)}`;
        input.value = this._toHexString(this.value);

        // 2. Swatch (Visual trigger)
        const swatch = document.createElement('div');
        swatch.className = 'dev-color-swatch';
        swatch.style.backgroundColor = input.value;
        swatch.style.width = '24px';
        swatch.style.height = '24px';
        swatch.style.borderRadius = '4px';
        swatch.style.border = '1px solid #555';
        swatch.style.cursor = 'pointer';

        // Link swatch to input
        swatch.onclick = () => input.click();

        // 3. Text Input (Hex)
        const textInput = document.createElement('input');
        textInput.type = 'text';
        textInput.className = 'dev-prop-input';
        textInput.style.flex = '1';
        textInput.value = input.value;
        textInput.spellcheck = false;

        // Events
        input.addEventListener('input', (e) => {
            const hex = e.target.value;
            swatch.style.backgroundColor = hex;
            textInput.value = hex;
            this._triggerChange(hex);
        });

        textInput.addEventListener('change', (e) => {
            let hex = e.target.value;
            if (!hex.startsWith('#')) hex = '#' + hex;
            if (/^#[0-9A-F]{6}$/i.test(hex)) {
                input.value = hex;
                swatch.style.backgroundColor = hex;
                this._triggerChange(hex);
            }
        });

        container.appendChild(input);
        container.appendChild(swatch);
        container.appendChild(textInput);
        row.appendChild(container);

        return row;
    }

    _toHexString(val) {
        if (typeof val === 'number') {
            return '#' + new THREE.Color(val).getHexString();
        }
        if (typeof val === 'string') {
            return val.startsWith('#') ? val : '#' + val;
        }
        return '#ffffff';
    }

    _triggerChange(hexString) {
        // If original was number, convert back to number
        if (typeof this.value === 'number') {
            const intVal = parseInt(hexString.replace('#', ''), 16);
            this.onChange(intVal);
        } else {
            this.onChange(hexString);
        }
    }
}
