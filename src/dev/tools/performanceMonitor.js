export class PerformanceMonitor {
    constructor(app) {
        this.app = app;
        this.element = null;
        this.visible = false;

        // Stats
        this.lastTime = performance.now();
        this.frames = 0;
        this.fps = 0;

        this.updateInterval = 500; // Update DOM every 500ms
        this.timer = 0;

        this.init();
    }

    init() {
        this.element = document.createElement('div');
        this.element.className = 'perf-monitor';
        this.element.style.display = 'none';

        // Structure
        this.element.innerHTML = `
            <div class="perf-row"><span class="perf-label">FPS</span><span class="perf-value" id="perf-fps">--</span></div>
            <div class="perf-row"><span class="perf-label">Entities</span><span class="perf-value" id="perf-entities">--</span></div>
            <div class="perf-row"><span class="perf-label">Draw Calls</span><span class="perf-value" id="perf-calls">--</span></div>
            <div class="perf-row"><span class="perf-label">Triangles</span><span class="perf-value" id="perf-tris">--</span></div>
        `;

        document.body.appendChild(this.element);
    }

    toggle() {
        this.visible = !this.visible;
        this.element.style.display = this.visible ? 'block' : 'none';
        if (this.visible) {
             this.app.notifications.show("Performance Stats: ON", "info", 1000);
        } else {
             this.app.notifications.show("Performance Stats: OFF", "info", 1000);
        }
    }

    update(dt) {
        if (!this.visible) return;

        this.frames++;
        this.timer += dt * 1000;

        if (this.timer >= this.updateInterval) {
            this.fps = Math.round((this.frames * 1000) / this.timer);
            this._updateDOM();

            this.frames = 0;
            this.timer = 0;
        }
    }

    _updateDOM() {
        const info = this.app.renderer.threeRenderer.info;
        const memory = info.memory;
        const render = info.render;

        // Count Entities (approximate based on world colliders or scene children)
        // Using world.colliders gives game objects
        const entities = this.app.world.colliders.length;

        document.getElementById('perf-fps').textContent = this.fps;
        document.getElementById('perf-entities').textContent = entities;
        document.getElementById('perf-calls').textContent = render.calls;
        document.getElementById('perf-tris').textContent = this._formatNumber(render.triangles);
    }

    _formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
        return num;
    }
}
