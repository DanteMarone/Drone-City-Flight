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
        // Note: 'hidden' class is no longer needed as default state is visibility:hidden in CSS
        menu.className = 'menu-overlay';

        // Icons
        const iconPlay = `<svg class="menu-icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`;
        const iconReset = `<svg class="menu-icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>`;
        const iconCamera = `<svg class="menu-icon" aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.2"/><path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/></svg>`;
        const iconCode = `<svg class="menu-icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>`;
        const iconFolder = `<svg class="menu-icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/></svg>`;

        menu.innerHTML = `
            <div class="menu-box" role="dialog" aria-modal="true" aria-labelledby="menu-title">
                <h1 id="menu-title">PAUSED</h1>

                <button id="btn-resume">
                    <span class="menu-btn-content">${iconPlay} RESUME</span>
                </button>
                <button id="btn-reset">
                    <span class="menu-btn-content">${iconReset} RESET DRONE</span>
                </button>

                <hr>
                <button id="btn-photo">
                    <span class="menu-btn-content">${iconCamera} PHOTO MODE</span>
                </button>
                <button id="btn-dev">
                    <span class="menu-btn-content">${iconCode} DEVELOPER MODE</span>
                </button>
                <label class="btn-like" tabindex="0" role="button" aria-label="Load Custom Map">
                    <span class="menu-btn-content">${iconFolder} LOAD CUSTOM MAP</span>
                    <input type="file" id="btn-load-map" accept=".json" class="visually-hidden" tabindex="-1">
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
            box: menu.querySelector('.menu-box'),
            resume: menu.querySelector('#btn-resume'),
            reset: menu.querySelector('#btn-reset'),
            photo: menu.querySelector('#btn-photo'),
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

        this.dom.photo.onclick = () => {
            this.hide();
            if (this.app.photoMode) this.app.photoMode.enable();
        };

        this.dom.dev.onclick = () => {
            this.hide();
            // Start Dev Mode
            if (this.app.devMode) this.app.devMode.enable();
        };

        // Accessibility: Allow keyboard activation for file input label
        const loadLabel = this.dom.loadMap.parentElement;
        loadLabel.onkeydown = (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.dom.loadMap.click();
            }
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

        // Focus Trap Listener
        this.dom.menu.addEventListener('keydown', (e) => {
            if (!this.visible) return;
            if (e.key === 'Tab') {
                const focusable = this.dom.box.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                const first = focusable[0];
                const last = focusable[focusable.length - 1];

                if (e.shiftKey) {
                    if (document.activeElement === first) {
                        e.preventDefault();
                        last.focus();
                    }
                } else {
                    if (document.activeElement === last) {
                        e.preventDefault();
                        first.focus();
                    }
                }
            }
            if (e.key === 'Escape') {
                this.hide();
            }
        });
    }

    toggle() {
        if (this.visible) this.hide();
        else this.show();
    }

    show() {
        this.visible = true;
        this.dom.menu.classList.add('visible');
        this.app.paused = true; // Pause Loop

        // Trap Focus
        this.lastFocused = document.activeElement;

        // Ensure initial focus
        // We use requestAnimationFrame to wait for the transition/visibility update
        requestAnimationFrame(() => {
            this.dom.resume.focus();
        });
    }

    hide() {
        this.visible = false;
        this.dom.menu.classList.remove('visible');
        this.app.paused = false;

        // Restore Focus
        if (this.lastFocused && document.body.contains(this.lastFocused)) {
            this.lastFocused.focus();
        } else {
            // If previous element is gone, focus body to prevent focus loss
            document.body.focus();
            if (document.activeElement !== document.body) {
                document.activeElement.blur();
            }
        }
    }
}
