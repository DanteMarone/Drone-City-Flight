// src/dev/devUI.js
export class DevUI {
    constructor(devMode) {
        this.devMode = devMode;
        this.dom = null;
        this._init();
    }

    _init() {
        const div = document.createElement('div');
        div.id = 'dev-ui';
        div.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            bottom: 0;
            width: 200px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px;
            display: none;
            flex-direction: column;
            gap: 10px;
            overflow-y: auto;
            pointer-events: auto;
            z-index: 1000;
        `;

        div.innerHTML = `
            <h2>Dev Mode</h2>
            <button id="dev-exit">Exit Dev Mode</button>
            <hr style="width:100%">
            <h3>Map</h3>
            <button id="dev-clear">Clear Map</button>
            <button id="dev-save">Save Map</button>
            <label class="file-btn">
                Load Map
                <input type="file" id="dev-load" accept=".json" style="display:none">
            </label>
            <hr style="width:100%">
            <h3>Objects</h3>
            <div class="palette">
                <div class="palette-item" draggable="true" data-type="skyscraper">Skyscraper</div>
                <div class="palette-item" draggable="true" data-type="shop">Shop</div>
                <div class="palette-item" draggable="true" data-type="house">House</div>
                <div class="palette-item" draggable="true" data-type="road">Road</div>
                <div class="palette-item" draggable="true" data-type="ring">Ring</div>
            </div>
        `;

        // CSS for palette items
        const style = document.createElement('style');
        style.textContent = `
            .palette-item {
                background: #333;
                padding: 10px;
                margin-bottom: 5px;
                cursor: grab;
                border: 1px solid #555;
            }
            .palette-item:hover { background: #444; }
            .file-btn {
                background: #444;
                padding: 5px;
                text-align: center;
                cursor: pointer;
                border: 1px solid #666;
                display: block;
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(div);
        this.dom = div;

        this._bindEvents();
    }

    _bindEvents() {
        this.dom.querySelector('#dev-exit').onclick = () => this.devMode.disable();
        this.dom.querySelector('#dev-clear').onclick = () => this.devMode.clearMap();
        this.dom.querySelector('#dev-save').onclick = () => this.devMode.saveMap();
        this.dom.querySelector('#dev-load').onchange = (e) => {
            if (e.target.files.length > 0) {
                this.devMode.loadMap(e.target.files[0]);
                e.target.value = ''; // Reset
            }
        };

        // Drag Start
        const items = this.dom.querySelectorAll('.palette-item');
        items.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('type', item.dataset.type);
                this.devMode.interaction.onDragStart(item.dataset.type);
            });
        });
    }

    show() {
        this.dom.style.display = 'flex';
    }

    hide() {
        this.dom.style.display = 'none';
    }
}
