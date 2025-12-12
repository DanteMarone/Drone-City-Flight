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

                <div class="menu-section">
                    <h2>SETTINGS</h2>
                    <label>
                        Bloom
                        <input type="checkbox" id="opt-bloom" checked>
                    </label>
                    <label>
                        Camera Sensitivity
                        <input type="range" id="opt-sens" min="0.001" max="0.005" step="0.0001">
                    </label>
                </div>
            </div>
        `;

        layer.appendChild(menu);

        this.dom = {
            menu: menu,
            resume: menu.querySelector('#btn-resume'),
            reset: menu.querySelector('#btn-reset'),
            bloom: menu.querySelector('#opt-bloom'),
            sens: menu.querySelector('#opt-sens')
        };

        // Init values
        this.dom.sens.value = CONFIG.INPUT.SENSITIVITY.CHASE_MOUSE;
    }

    _bindEvents() {
        this.dom.resume.onclick = () => this.hide();
        this.dom.reset.onclick = () => {
            this.app._resetGame();
            this.hide();
        };

        this.dom.bloom.onchange = (e) => {
            if (this.app.post) this.app.post.enabled = e.target.checked;
        };

        this.dom.sens.oninput = (e) => {
            CONFIG.INPUT.SENSITIVITY.CHASE_MOUSE = parseFloat(e.target.value);
            if (this.app.cameraController) {
                this.app.cameraController.sensitivity = parseFloat(e.target.value);
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
