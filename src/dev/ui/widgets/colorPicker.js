import * as THREE from 'three';

// Module-level shared state
const SHARED_HISTORY = [];
const PRESETS = [
    '#ff0000', '#00ff00', '#0000ff',
    '#ffff00', '#00ffff', '#ff00ff',
    '#ffffff', '#000000'
];

export class ColorPickerWidget {
    constructor(label, value, onChange) {
        this.label = label;
        this.value = value; // Can be number (0xff0000) or string ('#ff0000')
        this.onChange = onChange;
        this.element = this._createUI();
    }

    _createUI() {
        // Wrapper for the entire widget (Label + Input + Palette)
        const wrapper = document.createElement('div');
        wrapper.className = 'dev-color-wrapper';

        // 1. Top Row: Label + Input
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

        // Native Input (Hidden)
        const input = document.createElement('input');
        input.type = 'color';
        input.className = 'dev-color-input-native visually-hidden';
        input.id = `color-${Math.random().toString(36).substr(2, 9)}`;
        input.value = this._toHexString(this.value);

        // Swatch (Visual trigger)
        const swatch = document.createElement('div');
        swatch.className = 'dev-color-swatch';
        swatch.style.backgroundColor = input.value;
        swatch.style.width = '24px';
        swatch.style.height = '24px';
        swatch.style.borderRadius = '4px';
        swatch.style.border = '1px solid #555';
        swatch.style.cursor = 'pointer';
        swatch.onclick = () => input.click();

        // Text Input (Hex)
        const textInput = document.createElement('input');
        textInput.type = 'text';
        textInput.className = 'dev-prop-input';
        textInput.style.flex = '1';
        textInput.value = input.value;
        textInput.spellcheck = false;

        // Events
        input.addEventListener('input', (e) => {
            const hex = e.target.value;
            this._updateUI(hex, swatch, textInput);
            this._triggerChange(hex);
        });

        // Commit history on change (end of drag/selection)
        input.addEventListener('change', (e) => {
            this._addToHistory(e.target.value);
        });

        textInput.addEventListener('change', (e) => {
            let hex = e.target.value;
            if (!hex.startsWith('#')) hex = '#' + hex;
            if (/^#[0-9A-F]{6}$/i.test(hex)) {
                input.value = hex;
                this._updateUI(hex, swatch, textInput);
                this._triggerChange(hex);
                this._addToHistory(hex);
            }
        });

        container.appendChild(input);
        container.appendChild(swatch);
        container.appendChild(textInput);
        row.appendChild(container);
        wrapper.appendChild(row);

        // 2. Palette Section
        this.paletteContainer = document.createElement('div');
        this.paletteContainer.className = 'dev-color-palette';
        this._renderPalette(input, swatch, textInput);
        wrapper.appendChild(this.paletteContainer);

        return wrapper;
    }

    _updateUI(hex, swatch, textInput) {
        swatch.style.backgroundColor = hex;
        textInput.value = hex;
    }

    _renderPalette(input, swatch, textInput) {
        this.paletteContainer.innerHTML = '';

        // Presets
        const presetsRow = document.createElement('div');
        presetsRow.className = 'dev-color-row';

        const preLabel = document.createElement('div');
        preLabel.className = 'dev-color-section-label';
        preLabel.textContent = 'PRESETS';
        presetsRow.appendChild(preLabel);

        PRESETS.forEach(color => {
            const s = this._createMiniSwatch(color, input, swatch, textInput);
            presetsRow.appendChild(s);
        });
        this.paletteContainer.appendChild(presetsRow);

        // History
        const histRow = document.createElement('div');
        histRow.className = 'dev-color-row';

        const histLabel = document.createElement('div');
        histLabel.className = 'dev-color-section-label';
        histLabel.textContent = 'RECENT';
        histRow.appendChild(histLabel);

        if (SHARED_HISTORY.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'dev-color-history-empty';
            empty.textContent = 'None';
            histRow.appendChild(empty);
        } else {
            SHARED_HISTORY.forEach(color => {
                const s = this._createMiniSwatch(color, input, swatch, textInput);
                histRow.appendChild(s);
            });
        }
        this.paletteContainer.appendChild(histRow);
    }

    _createMiniSwatch(color, input, swatch, textInput) {
        const d = document.createElement('div');
        d.className = 'dev-color-mini-swatch';
        d.style.backgroundColor = color;
        d.title = color;
        d.onclick = () => {
            input.value = color;
            this._updateUI(color, swatch, textInput);
            this._triggerChange(color);
            // Clicking a preset/history also adds to history (bubbles it to top)
            this._addToHistory(color);
        };
        return d;
    }

    _addToHistory(hex) {
        // Remove existing if present (to bubble up)
        const idx = SHARED_HISTORY.findIndex(c => c.toLowerCase() === hex.toLowerCase());
        if (idx !== -1) {
            SHARED_HISTORY.splice(idx, 1);
        }

        // Add to front
        SHARED_HISTORY.unshift(hex);

        // Limit to 8
        if (SHARED_HISTORY.length > 8) {
            SHARED_HISTORY.pop();
        }

        // Re-render
        const input = this.element.querySelector('input[type="color"]');
        const swatch = this.element.querySelector('.dev-color-swatch');
        const textInput = this.element.querySelector('input[type="text"]');
        this._renderPalette(input, swatch, textInput);
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
        if (typeof this.value === 'number') {
            const intVal = parseInt(hexString.replace('#', ''), 16);
            this.onChange(intVal);
        } else {
            this.onChange(hexString);
        }
    }
}
