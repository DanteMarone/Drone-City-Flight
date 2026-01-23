
export class Minimap {
    constructor(app) {
        this.app = app;
        this.enabled = true;
        this.range = 150; // Meters radius
        this.size = 200; // Pixels
        this.canvas = null;
        this.ctx = null;
        this.elements = {};

        this._createDOM();
    }

    _createDOM() {
        const layer = document.getElementById('ui-layer');
        if (!layer) return;

        const container = document.createElement('div');
        container.className = 'minimap-container';

        const canvas = document.createElement('canvas');
        canvas.className = 'minimap-canvas';
        canvas.width = this.size;
        canvas.height = this.size;

        container.appendChild(canvas);
        layer.appendChild(container);

        this.elements.container = container;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    setVisible(visible) {
        this.enabled = visible;
        if (this.elements.container) {
            this.elements.container.style.display = visible ? 'block' : 'none';
        }
    }

    update(dt) {
        if (!this.enabled || !this.ctx || !this.app) return;

        // Determine active player entity
        let player = this.app.drone;
        if (this.app.mode === 'person') {
            player = this.app.person;
        }

        if (!player || !player.position) return;

        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const cx = w / 2;
        const cy = h / 2;
        const scale = (w / 2) / this.range;

        // Clear
        ctx.clearRect(0, 0, w, h);

        // Draw Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, w, h); // Fill for better visibility

        // Radar Rings
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
        ctx.lineWidth = 1;

        // Outer Ring
        ctx.beginPath();
        ctx.arc(cx, cy, w / 2 - 1, 0, Math.PI * 2);
        ctx.stroke();

        // Inner Ring (50%)
        ctx.beginPath();
        ctx.arc(cx, cy, w / 4, 0, Math.PI * 2);
        ctx.stroke();

        // Crosshairs
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.moveTo(0, cy);
        ctx.lineTo(w, cy);
        ctx.moveTo(cx, 0);
        ctx.lineTo(cx, h);
        ctx.stroke();

        // Entities
        const entities = this.app.world ? this.app.world.getStaticColliders() : [];
        const playerPos = player.position;
        // Use player yaw for rotation.
        // We rotate the WORLD around the player, so we subtract player yaw.
        // Assuming yaw 0 is North (-Z), we want North to be UP (-Y on canvas).
        // Standard 2D rotation:
        // x' = x cos a - y sin a
        // y' = x sin a + y cos a

        // We want to rotate by -playerYaw.
        const angle = -player.yaw;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        for (const entity of entities) {
            if (!entity.mesh) continue;

            const pos = entity.mesh.position;

            // Relative Position (World Space)
            const dx = pos.x - playerPos.x;
            const dz = pos.z - playerPos.z;

            // Rotate into Player Space (where +Z is forward? No, usually -Z is forward in Three.js)
            // If Player Yaw=0 (Facing -Z), and Object is at (0, -10) (-Z), dx=0, dz=-10.
            // We want it at (0, -10) on canvas (UP).
            // Canvas Y is Down (+), so UP is (-). So -10 maps to -10 pixels (scaled).

            // If Player Rotates 90 deg Left (Yaw = +PI/2, facing +X).
            // Object is still at (0, -10) world.
            // Relative: (0, -10).
            // Player is facing +X. Object is to his Right (Relative +Z in player frame? No, relative -X in player frame).

            // Let's stick to standard math:
            // x_screen = dx * cos(a) - dz * sin(a)
            // z_screen = dx * sin(a) + dz * cos(a)

            const rx = dx * cos - dz * sin;
            const rz = dx * sin + dz * cos;

            // Map to Canvas
            // Canvas X = cx + rx * scale
            // Canvas Y = cy + rz * scale
            const canvasX = cx + rx * scale;
            const canvasY = cy + rz * scale;

            // Clip to circle
            const distSq = (canvasX - cx)**2 + (canvasY - cy)**2;
            if (distSq > (w/2 - 2)**2) continue;

            // Determine Style
            let color = '#aaaaaa';
            let size = 2;

            if (entity.type === 'landingPad') {
                color = '#00ff00';
                size = 3;
            } else if (entity.type === 'building') {
                color = '#6666ff';
            } else if (entity.type === 'road' || entity.type === 'sidewalk') {
                color = '#444444';
                size = 1.5;
            } else if (entity.type === 'enemy') {
                color = '#ff0000';
                size = 3;
            }

            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(canvasX, canvasY, size, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw Player (Always Center, Always Facing Up)
        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        // Arrow pointing UP (-Y)
        ctx.moveTo(cx, cy - 6);
        ctx.lineTo(cx - 5, cy + 5);
        ctx.lineTo(cx + 5, cy + 5);
        ctx.fill();
    }
}
