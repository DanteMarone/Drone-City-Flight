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
                 <div class="battery-label" id="batt-label">BATTERY</div>
                 <div class="battery-bar-bg" role="progressbar" aria-labelledby="batt-label" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100" id="hud-batt-bg">
                     <div class="battery-bar-fill" id="hud-batt-fill"></div>
                 </div>
                 <div class="battery-text" id="hud-batt-text" aria-hidden="true">100%</div>
            </div>

            <div class="hud-center-message" id="hud-msg"></div>
        `;

        layer.appendChild(container);

        // Cache elements
        this.elements.container = container;
        this.elements.alt = container.querySelector('#hud-alt');
        this.elements.spd = container.querySelector('#hud-spd');
        this.elements.rings = container.querySelector('#hud-rings');
        this.elements.battLabel = container.querySelector('#batt-label');
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

        if (data.batteryLabel !== undefined) {
            this.elements.battLabel.innerText = data.batteryLabel;
        }

        if (data.battery !== undefined) {
            const pct = Math.max(0, Math.min(100, data.battery));
            const pctInt = pct.toFixed(0);
            this.elements.battFill.style.width = `${pct}%`;
            this.elements.battText.innerText = `${pctInt}%`;
            this.elements.battBg.setAttribute('aria-valuenow', pctInt);
            this.elements.battBg.setAttribute('aria-valuetext', `${pctInt}%`);

            // Color feedback
            if (pct < 20) this.elements.battFill.style.backgroundColor = '#ff2222';
            else if (pct < 50) this.elements.battFill.style.backgroundColor = '#ffaa22';
            else this.elements.battFill.style.backgroundColor = '#22ffaa';
        }

        if (data.message !== undefined) {
            this.elements.msg.innerText = data.message;
            this.elements.msg.style.opacity = data.message ? 1 : 0;
        }
    }
}
