// src/ui/hud.js
import { Minimap } from './widgets/minimap.js';

export class HUD {
    constructor() {
        this.elements = {};
        this.onPause = null;
        this.minimap = null;
        this._createDOM();
    }

    _createDOM() {
        const layer = document.getElementById('ui-layer');

        // Container
        const container = document.createElement('div');
        container.className = 'hud-container';
        container.innerHTML = `
            <div class="hud-top-left">
                <div class="hud-row">
                    <span class="hud-label">ALTITUDE</span>
                    <span class="hud-value" id="hud-alt">0m</span>
                </div>
                <div class="hud-row">
                    <span class="hud-label">SPEED</span>
                    <span class="hud-value" id="hud-spd">0m/s</span>
                </div>
                <div class="hud-row">
                    <span class="hud-label">RINGS</span>
                    <span class="hud-value" id="hud-rings">0</span>
                </div>
            </div>

            <div class="hud-top-right">
                <button id="btn-pause" class="pm-btn-icon" aria-label="Pause Game">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                    </svg>
                </button>
            </div>

            <div class="hud-bottom-center">
                 <div class="resource-group" id="hud-primary-group">
                     <div class="battery-label" id="hud-primary-label">BATTERY</div>
                     <div class="battery-bar-bg" role="progressbar" aria-labelledby="hud-primary-label" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100" id="hud-primary-bg">
                         <div class="battery-bar-fill" id="hud-primary-fill"></div>
                     </div>
                     <div class="battery-text" id="hud-primary-text" aria-hidden="true">100%</div>
                 </div>
                 <div class="resource-group hidden" id="hud-secondary-group">
                     <div class="battery-label" id="hud-secondary-label">HEALTH</div>
                     <div class="battery-bar-bg" role="progressbar" aria-labelledby="hud-secondary-label" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100" id="hud-secondary-bg">
                         <div class="battery-bar-fill" id="hud-secondary-fill"></div>
                     </div>
                     <div class="battery-text" id="hud-secondary-text" aria-hidden="true">100%</div>
                 </div>
            </div>

            <div class="hud-center-message" id="hud-msg"></div>
        `;

        layer.appendChild(container);

        // Cache elements
        this.elements.container = container;
        this.elements.alt = container.querySelector('#hud-alt');
        this.elements.spd = container.querySelector('#hud-spd');
        this.elements.rings = container.querySelector('#hud-rings');
        this.elements.primaryGroup = container.querySelector('#hud-primary-group');
        this.elements.primaryBg = container.querySelector('#hud-primary-bg');
        this.elements.primaryFill = container.querySelector('#hud-primary-fill');
        this.elements.primaryText = container.querySelector('#hud-primary-text');
        this.elements.primaryLabel = container.querySelector('#hud-primary-label');
        this.elements.secondaryGroup = container.querySelector('#hud-secondary-group');
        this.elements.secondaryBg = container.querySelector('#hud-secondary-bg');
        this.elements.secondaryFill = container.querySelector('#hud-secondary-fill');
        this.elements.secondaryText = container.querySelector('#hud-secondary-text');
        this.elements.secondaryLabel = container.querySelector('#hud-secondary-label');
        this.elements.msg = container.querySelector('#hud-msg');
        this.elements.pauseBtn = container.querySelector('#btn-pause');

        this.elements.pauseBtn.onclick = () => {
            if (this.onPause) this.onPause();
            this.elements.pauseBtn.blur();
        };

        // Initialize Minimap
        this.minimap = new Minimap();
        this.elements.container.appendChild(this.minimap.container);
    }

    setVisible(visible) {
        if (visible) this.elements.container.classList.remove('hidden');
        else this.elements.container.classList.add('hidden');
    }

    updateMinimap(playerPos, playerRotationY, entities) {
        if (this.minimap) {
            this.minimap.update(playerPos, playerRotationY, entities);
        }
    }

    update(data) {
        if (data.altitude !== undefined) this.elements.alt.innerText = `${data.altitude.toFixed(1)}m`;
        if (data.speed !== undefined) this.elements.spd.innerText = `${data.speed.toFixed(1)}m/s`;
        if (data.rings !== undefined) this.elements.rings.innerText = `${data.rings}`;

        if (data.resourceLabel !== undefined) {
            this.elements.primaryLabel.innerText = data.resourceLabel;
        }

        if (data.battery !== undefined) {
            this._updateBar(this.elements.primaryBg, this.elements.primaryFill, this.elements.primaryText, data.battery);
        }

        if (data.secondaryLabel !== undefined) {
            this.elements.secondaryLabel.innerText = data.secondaryLabel;
        }

        if (data.secondaryBattery !== undefined) {
            this._updateBar(this.elements.secondaryBg, this.elements.secondaryFill, this.elements.secondaryText, data.secondaryBattery);
        }

        if (data.showSecondary !== undefined) {
            if (data.showSecondary) this.elements.secondaryGroup.classList.remove('hidden');
            else this.elements.secondaryGroup.classList.add('hidden');
        }

        if (data.message !== undefined) {
            this.elements.msg.innerText = data.message;
            this.elements.msg.style.opacity = data.message ? 1 : 0;
        }
    }

    _updateBar(background, fill, text, value) {
        const pct = Math.max(0, Math.min(100, value));
        const pctInt = pct.toFixed(0);
        fill.style.width = `${pct}%`;
        text.innerText = `${pctInt}%`;
        background.setAttribute('aria-valuenow', pctInt);
        background.setAttribute('aria-valuetext', `${pctInt}%`);

        if (pct < 20) fill.style.backgroundColor = '#ff2222';
        else if (pct < 50) fill.style.backgroundColor = '#ffaa22';
        else fill.style.backgroundColor = '#22ffaa';
    }
}
