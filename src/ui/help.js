// src/ui/help.js

export class HelpSystem {
    constructor(app) {
        this.app = app;
        this.visible = false;
        this.activeTab = 'gameplay'; // 'gameplay' or 'dev'

        this._createDOM();
        this._bindEvents();
    }

    _createDOM() {
        const layer = document.getElementById('ui-layer');

        const container = document.createElement('div');
        container.id = 'help-modal';
        container.className = 'menu-overlay'; // Reuse menu overlay base styles if compatible, or own class
        container.setAttribute('role', 'dialog');
        container.setAttribute('aria-modal', 'true');
        container.setAttribute('aria-labelledby', 'help-title');

        container.innerHTML = `
            <div class="help-box">
                <div class="help-header">
                    <h2 id="help-title">CONTROLS</h2>
                    <button class="help-close-btn" aria-label="Close Help">×</button>
                </div>

                <div class="help-tabs" role="tablist">
                    <button class="help-tab active" role="tab" aria-selected="true" data-tab="gameplay">GAMEPLAY</button>
                    <button class="help-tab" role="tab" aria-selected="false" data-tab="dev">DEV MODE</button>
                </div>

                <div class="help-content-scroll">
                    <!-- Gameplay Content -->
                    <div id="help-panel-gameplay" class="help-panel active" role="tabpanel">
                        <div class="help-grid">
                            <div class="help-row">
                                <span class="help-action">Move / Steer</span>
                                <div class="help-keys">
                                    <span class="help-key">W</span><span class="help-key">A</span><span class="help-key">S</span><span class="help-key">D</span>
                                    <span class="help-or">or</span>
                                    <span class="help-key">↑</span><span class="help-key">←</span><span class="help-key">↓</span><span class="help-key">→</span>
                                </div>
                            </div>
                            <div class="help-row">
                                <span class="help-action">Ascend / Descend</span>
                                <div class="help-keys">
                                    <span class="help-key">W</span> / <span class="help-key">S</span> <span class="help-note">(Pitch)</span>
                                </div>
                            </div>
                            <div class="help-row">
                                <span class="help-action">Camera Tilt</span>
                                <div class="help-keys">
                                    <span class="help-key">Q</span> / <span class="help-key">E</span>
                                </div>
                            </div>
                            <div class="help-row">
                                <span class="help-action">Boost</span>
                                <div class="help-keys"><span class="help-key">Shift</span></div>
                            </div>
                            <div class="help-row">
                                <span class="help-action">Reset Drone</span>
                                <div class="help-keys"><span class="help-key">R</span></div>
                            </div>
                            <div class="help-row">
                                <span class="help-action">Toggle Camera</span>
                                <div class="help-keys"><span class="help-key">C</span></div>
                            </div>
                            <div class="help-row">
                                <span class="help-action">Photo Mode</span>
                                <div class="help-keys"><span class="help-key">P</span></div>
                            </div>
                             <div class="help-row">
                                <span class="help-action">Pause Menu</span>
                                <div class="help-keys"><span class="help-key">Esc</span></div>
                            </div>
                        </div>
                    </div>

                    <!-- Dev Mode Content -->
                    <div id="help-panel-dev" class="help-panel" role="tabpanel">
                        <div class="help-grid">
                            <div class="help-row">
                                <span class="help-action">Toggle Dev Mode</span>
                                <div class="help-keys"><span class="help-key">~</span></div>
                            </div>
                            <div class="help-row">
                                <span class="help-action">Multi-Select</span>
                                <div class="help-keys"><span class="help-key">Shift</span> + Click</div>
                            </div>
                            <div class="help-row">
                                <span class="help-action">Delete Object</span>
                                <div class="help-keys"><span class="help-key">Del</span></div>
                            </div>
                            <div class="help-row">
                                <span class="help-action">Undo / Redo</span>
                                <div class="help-keys">
                                    <span class="help-key">Ctrl</span> + <span class="help-key">Z</span> / <span class="help-key">Y</span>
                                </div>
                            </div>
                             <div class="help-row">
                                <span class="help-action">Copy / Paste</span>
                                <div class="help-keys">
                                    <span class="help-key">Ctrl</span> + <span class="help-key">C</span> / <span class="help-key">V</span>
                                </div>
                            </div>
                            <div class="help-row">
                                <span class="help-action">Duplicate</span>
                                <div class="help-keys">
                                    <span class="help-key">Ctrl</span> + <span class="help-key">D</span>
                                </div>
                            </div>
                            <div class="help-row">
                                <span class="help-action">Cancel / Deselect</span>
                                <div class="help-keys"><span class="help-key">Esc</span></div>
                            </div>
                             <div class="help-row">
                                <span class="help-action">Camera Move</span>
                                <div class="help-keys">
                                    <span class="help-key">Right Click</span> + Drag
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        layer.appendChild(container);
        this.dom = {
            container: container,
            box: container.querySelector('.help-box'),
            closeBtn: container.querySelector('.help-close-btn'),
            tabs: container.querySelectorAll('.help-tab'),
            panels: {
                gameplay: container.querySelector('#help-panel-gameplay'),
                dev: container.querySelector('#help-panel-dev')
            }
        };
    }

    _bindEvents() {
        // Close
        this.dom.closeBtn.onclick = () => this.hide();

        // Tabs
        this.dom.tabs.forEach(tab => {
            tab.onclick = () => {
                const target = tab.dataset.tab;
                this._switchTab(target);
            };
        });

        // Keyboard / Focus Trap
        this.dom.container.addEventListener('keydown', (e) => {
            if (!this.visible) return;
            if (e.key === 'Escape') this.hide();
            // Basic focus trap could be added here similar to MenuSystem
        });
    }

    _switchTab(tabName) {
        this.activeTab = tabName;

        // Update Tabs
        this.dom.tabs.forEach(t => {
            const isActive = t.dataset.tab === tabName;
            t.classList.toggle('active', isActive);
            t.setAttribute('aria-selected', isActive);
        });

        // Update Panels
        Object.values(this.dom.panels).forEach(p => {
            p.classList.remove('active');
            p.style.display = 'none'; // Explicit hide
        });

        const activePanel = this.dom.panels[tabName];
        if (activePanel) {
            activePanel.classList.add('active');
            activePanel.style.display = 'block';
        }
    }

    show(defaultTab = 'gameplay') {
        this.visible = true;
        this.dom.container.classList.add('visible');
        this.activeTab = defaultTab;
        this._switchTab(defaultTab);

        // Ensure app is paused if not already
        // But if we opened from menu, menu.hide() unpaused.
        // We must re-pause or rely on App.paused state.
        // Let's force pause.
        if (this.app.paused === false) {
             this.app.paused = true;
             this.wasPausedByHelp = true;
        }

        // Focus close button
        requestAnimationFrame(() => this.dom.closeBtn.focus());
    }

    hide() {
        this.visible = false;
        this.dom.container.classList.remove('visible');

        // Unpause if we paused it
        if (this.wasPausedByHelp) {
            this.app.paused = false;
            this.wasPausedByHelp = false;
        }

        // If menu was open (conceptually), maybe we should re-open it?
        // But current flow is Menu -> Controls -> Game (if closed).
        // Or Menu -> Controls -> Menu?
        // Ideally: Menu -> Controls -> Menu.
        // So let's re-open menu if we are not in dev mode.
        // But if we are in Dev Mode, we might access help too?

        // Simplest: Just close. If user wants menu, they press Esc.
    }
}
