// src/ui/hud.js
export class HUD {
    constructor() {
        this.elements = {};
        this.onPause = null;
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
                 <div class="hud-resource" id="hud-health">
                     <div class="resource-label" id="health-label">HEALTH</div>
                     <div class="resource-bar-bg" role="progressbar" aria-labelledby="health-label" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100" id="hud-health-bg">
                         <div class="resource-bar-fill" id="hud-health-fill"></div>
                     </div>
                     <div class="resource-text" id="hud-health-text" aria-hidden="true">100%</div>
                 </div>
                 <div class="hud-resource" id="hud-battery">
                     <div class="resource-label" id="batt-label">BATTERY</div>
                     <div class="resource-bar-bg" role="progressbar" aria-labelledby="batt-label" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100" id="hud-batt-bg">
                         <div class="resource-bar-fill" id="hud-batt-fill"></div>
                     </div>
                     <div class="resource-text" id="hud-batt-text" aria-hidden="true">100%</div>
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
        this.elements.healthContainer = container.querySelector('#hud-health');
        this.elements.healthBg = container.querySelector('#hud-health-bg');
        this.elements.healthFill = container.querySelector('#hud-health-fill');
        this.elements.healthText = container.querySelector('#hud-health-text');
        this.elements.batteryContainer = container.querySelector('#hud-battery');
        this.elements.battBg = container.querySelector('#hud-batt-bg');
        this.elements.battFill = container.querySelector('#hud-batt-fill');
        this.elements.battText = container.querySelector('#hud-batt-text');
        this.elements.msg = container.querySelector('#hud-msg');
        this.elements.pauseBtn = container.querySelector('#btn-pause');

        this.elements.pauseBtn.onclick = () => {
            if (this.onPause) this.onPause();
            this.elements.pauseBtn.blur();
        };
    }

    setVisible(visible) {
        if (visible) this.elements.container.classList.remove('hidden');
        else this.elements.container.classList.add('hidden');
    }

    update(data) {
        if (data.altitude !== undefined) this.elements.alt.innerText = `${data.altitude.toFixed(1)}m`;
        if (data.speed !== undefined) this.elements.spd.innerText = `${data.speed.toFixed(1)}m/s`;
        if (data.rings !== undefined) this.elements.rings.innerText = `${data.rings}`;

        const showHealth = data.showHealth ?? data.health !== undefined;
        this._setResourceVisibility(this.elements.healthContainer, showHealth);
        if (data.health !== undefined) {
            this._updateResourceBar(
                this.elements.healthFill,
                this.elements.healthText,
                this.elements.healthBg,
                data.health,
                { low: '#ff4444', medium: '#ffaa22', high: '#22ffaa' }
            );
        }

        const showBattery = data.showBattery ?? data.battery !== undefined;
        this._setResourceVisibility(this.elements.batteryContainer, showBattery);
        if (data.battery !== undefined) {
            this._updateResourceBar(
                this.elements.battFill,
                this.elements.battText,
                this.elements.battBg,
                data.battery,
                { low: '#ff2222', medium: '#ffaa22', high: '#22ffaa' }
            );
        }

        if (data.message !== undefined) {
            this.elements.msg.innerText = data.message;
            this.elements.msg.style.opacity = data.message ? 1 : 0;
        }
    }

    _setResourceVisibility(element, visible) {
        if (!element) return;
        element.classList.toggle('hidden', !visible);
    }

    _updateResourceBar(fill, text, bg, value, colors) {
        const pct = Math.max(0, Math.min(100, value));
        const pctInt = pct.toFixed(0);
        fill.style.width = `${pct}%`;
        text.innerText = `${pctInt}%`;
        bg.setAttribute('aria-valuenow', pctInt);
        bg.setAttribute('aria-valuetext', `${pctInt}%`);

        if (pct < 20) fill.style.backgroundColor = colors.low;
        else if (pct < 50) fill.style.backgroundColor = colors.medium;
        else fill.style.backgroundColor = colors.high;
    }
}
