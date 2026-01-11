export class HUD {
    constructor() {
        this.elements = {};
        this.onPause = null;
        this._createDOM();
    }

    _createDOM() {
        const layer = document.getElementById('ui-layer');

        // Main Container
        const container = document.createElement('div');
        container.className = 'hud-container';

        // HTML Structure
        container.innerHTML = `
            <!-- Top Right: Status Bars & Pause -->
            <div class="hud-top-right" style="position: absolute; top: 20px; right: 20px; display: flex; flex-direction: column; align-items: flex-end; gap: 10px; pointer-events: auto;">

                <!-- Pause Button -->
                <button id="btn-pause" class="pm-btn-icon" aria-label="Pause Game" style="margin-bottom: 10px;">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                    </svg>
                </button>

                <!-- Drone Battery -->
                <div class="hud-stat-bar-container" style="display: flex; align-items: center; gap: 10px;">
                    <span class="hud-stat-label" style="font-size: 12px; font-weight: bold; color: #0ff;">BATTERY</span>
                    <div class="hud-stat-bar" style="width: 150px; height: 8px; background: rgba(0,0,0,0.5); border: 1px solid rgba(0,255,255,0.3); position: relative;">
                         <div id="hud-bar-battery" style="width: 100%; height: 100%; background: #0ff; box-shadow: 0 0 5px #0ff;"></div>
                    </div>
                </div>

                <!-- Pilot Health (Mock) -->
                <div class="hud-stat-bar-container" style="display: flex; align-items: center; gap: 10px;">
                    <span class="hud-stat-label" style="font-size: 12px; font-weight: bold; color: #f00;">PILOT</span>
                    <div class="hud-stat-bar" style="width: 150px; height: 8px; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,0,0,0.3); position: relative;">
                         <div id="hud-bar-health" style="width: 100%; height: 100%; background: #f00; box-shadow: 0 0 5px #f00;"></div>
                    </div>
                </div>

            </div>

            <!-- Bottom Left: Telemetry -->
            <div class="telemetry">
                <div class="telemetry-row">
                    <span class="telemetry-label">ALT</span>
                    <span class="telemetry-value" id="hud-alt">000m</span>
                </div>
                <div class="telemetry-row">
                    <span class="telemetry-label">SPD</span>
                    <span class="telemetry-value" id="hud-spd">000</span>
                </div>
                <div class="telemetry-row">
                    <span class="telemetry-label">RNG</span>
                    <span class="telemetry-value" id="hud-rings">0</span>
                </div>
            </div>

            <!-- Bottom Right: Radar -->
            <div class="radar-container">
                <div class="radar-grid"></div>
                <div class="radar-sweep"></div>
            </div>

            <!-- Center Message -->
            <div class="hud-center-message" id="hud-msg"></div>
        `;

        layer.appendChild(container);

        // Cache elements
        this.elements.container = container;
        this.elements.alt = container.querySelector('#hud-alt');
        this.elements.spd = container.querySelector('#hud-spd');
        this.elements.rings = container.querySelector('#hud-rings');
        this.elements.msg = container.querySelector('#hud-msg');
        this.elements.pauseBtn = container.querySelector('#btn-pause');

        // Bars
        this.elements.barBattery = container.querySelector('#hud-bar-battery');
        this.elements.barHealth = container.querySelector('#hud-bar-health');

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
        if (data.altitude !== undefined) this.elements.alt.innerText = `${data.altitude.toFixed(0)}m`;
        if (data.speed !== undefined) this.elements.spd.innerText = `${data.speed.toFixed(0)}`;
        if (data.rings !== undefined) this.elements.rings.innerText = `${data.rings}`;

        // Update Battery
        if (data.battery !== undefined) {
            const pct = Math.max(0, Math.min(100, data.battery));
            this.elements.barBattery.style.width = `${pct}%`;

            // Color logic
            if (pct < 20) {
                this.elements.barBattery.style.backgroundColor = '#f00';
                this.elements.barBattery.style.boxShadow = '0 0 5px #f00';
            } else {
                this.elements.barBattery.style.backgroundColor = '#0ff';
                this.elements.barBattery.style.boxShadow = '0 0 5px #0ff';
            }
        }

        if (data.message !== undefined) {
            this.elements.msg.innerText = data.message;
            this.elements.msg.style.opacity = data.message ? 1 : 0;
        }
    }
}
