// src/ui/menu.js
import { CONFIG } from '../config.js';

export class MenuSystem {
    constructor(app) {
        this.app = app;
        this.visible = false;

        this._createDOM();
        this._bindEvents();
    }

    _createDOM() {
        const layer = document.getElementById('ui-layer');

        const menu = document.createElement('div');
        menu.id = 'pause-menu';
        menu.className = 'menu-overlay hidden';
        menu.innerHTML = `
            <div class="menu-box">
                <h1>PAUSED</h1>
                <button id="btn-resume">RESUME</button>
                <button id="btn-reset">RESET DRONE</button>

                <hr>
                <button id="btn-dev">DEVELOPER MODE</button>
                <label class="btn-like">
                    LOAD CUSTOM MAP
                    <input type="file" id="btn-load-map" accept=".json" class="visually-hidden">
                </label>
                <hr>

                <div class="menu-section">
                    <h2>SETTINGS</h2>
                    <label>
                        Bloom
                        <input type="checkbox" id="opt-bloom" checked>
                    </label>
                    <label for="opt-sens">
                        Camera Sensitivity <span id="opt-sens-val" style="font-weight:bold; margin-left:8px;"></span>
                    </label>
                    <input type="range" id="opt-sens" min="0.001" max="0.005" step="0.0001" aria-label="Camera Sensitivity">
                </div>
            </div>
        `;

        layer.appendChild(menu);

        this.dom = {
            menu: menu,
            resume: menu.querySelector('#btn-resume'),
            reset: menu.querySelector('#btn-reset'),
            dev: menu.querySelector('#btn-dev'),
            loadMap: menu.querySelector('#btn-load-map'),
            bloom: menu.querySelector('#opt-bloom'),
            sens: menu.querySelector('#opt-sens'),
            sensVal: menu.querySelector('#opt-sens-val')
        };

        // Init values
        this.dom.sens.value = CONFIG.INPUT.SENSITIVITY.CHASE_MOUSE;
        this.dom.sensVal.innerText = (CONFIG.INPUT.SENSITIVITY.CHASE_MOUSE * 10000).toFixed(0);
    }

    _bindEvents() {
        this.dom.resume.onclick = () => this.hide();
        this.dom.reset.onclick = () => {
            this.app._resetGame();
            this.hide();
        };

        this.dom.dev.onclick = () => {
            this.hide();
            // Start Dev Mode
            if (this.app.devMode) this.app.devMode.enable();
        };

        this.dom.loadMap.onchange = (e) => {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                const reader = new FileReader();
                reader.onload = (ev) => {
                    try {
                        const data = JSON.parse(ev.target.result);
                        this.app.loadMap(data);
                        this.hide();
                    } catch (err) {
                        alert("Error loading map");
                    }
                };
                reader.readAsText(file);
                e.target.value = '';
            }
        };

        this.dom.bloom.onchange = (e) => {
            if (this.app.post) this.app.post.enabled = e.target.checked;
        };

        this.dom.sens.oninput = (e) => {
            const val = parseFloat(e.target.value);
            CONFIG.INPUT.SENSITIVITY.CHASE_MOUSE = val;
            this.dom.sensVal.innerText = (val * 10000).toFixed(0);
            if (this.app.cameraController) {
                this.app.cameraController.sensitivity = val;
            }
        };
    }

    toggle() {
        if (this.visible) this.hide();
        else this.show();
    }

    show() {
        this.visible = true;
        this.dom.menu.classList.remove('hidden');
        this.app.paused = true; // Pause Loop
    }

    hide() {
        this.visible = false;
        this.dom.menu.classList.add('hidden');
        this.app.paused = false;
    }
}
