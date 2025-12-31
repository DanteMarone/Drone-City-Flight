export class Minimap {
    constructor(app) {
        this.app = app;
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');

        // Config
        this.size = 200; // px
        this.zoom = 5; // Pixels per meter (world units)
        this.range = 200; // Meters to show

        this._createDOM();
    }

    _createDOM() {
        // Container
        this.container = document.createElement('div');
        this.container.className = 'minimap-container';

        // Canvas Setup
        this.canvas.width = this.size;
        this.canvas.height = this.size;
        this.container.appendChild(this.canvas);

        // Labels
        const label = document.createElement('div');
        label.className = 'minimap-label';
        label.textContent = 'RADAR';
        this.container.appendChild(label);

        document.getElementById('ui-layer').appendChild(this.container);
    }

    setVisible(visible) {
        this.container.style.display = visible ? 'block' : 'none';
    }

    update(dt) {
        if (!this.app.drone || !this.app.drone.mesh) return;

        const dronePos = this.app.drone.mesh.position;
        // Drone rotation (Y-axis)
        // Note: Three.js rotation is radians. A standard rotation of 0 usually faces -Z or +Z depending on model.
        // The drone model usually faces -Z.
        // We want "Forward" to be UP on the minimap.
        // If Drone faces -Z, and we want that to be -Y (Up on canvas),
        // We need to rotate the world by +Rotation around the center.

        const droneRot = this.app.drone.mesh.rotation.y;

        // Clear
        this.ctx.fillStyle = 'rgba(0, 10, 20, 0.8)';
        this.ctx.fillRect(0, 0, this.size, this.size);

        this.ctx.save();

        // Center of canvas
        const cx = this.size / 2;
        const cy = this.size / 2;

        // Translate to center
        this.ctx.translate(cx, cy);

        // Rotate the Map so Drone is always facing Up
        // If drone rotates left (positive Y), map must rotate right (positive) to compensate?
        // Wait, if I turn Left, the world moves Right relative to me.
        this.ctx.rotate(droneRot);

        // Scale for Zoom
        const scale = this.size / (this.range * 2); // Map width = 2 * range
        this.ctx.scale(scale, scale);

        // Translate world relative to drone
        this.ctx.translate(-dronePos.x, -dronePos.z);

        // Draw World Objects
        // Optimization: Filter by distance
        const objects = this.app.world.colliders; // Array of BaseEntity
        const rangeSq = this.range * this.range * 1.5; // Slight overdraw buffer

        for (const obj of objects) {
            if (!obj.mesh) continue;

            const dx = obj.mesh.position.x - dronePos.x;
            const dz = obj.mesh.position.z - dronePos.z;

            if (dx*dx + dz*dz > rangeSq) continue;

            this._drawObject(this.ctx, obj);
        }

        // Restore to draw HUD elements (Drone icon) fixed in center
        this.ctx.restore();

        // Draw Drone (Fixed Center, Facing Up)
        this.ctx.fillStyle = '#0ff';
        this.ctx.beginPath();
        this.ctx.moveTo(cx, cy - 6);
        this.ctx.lineTo(cx - 5, cy + 6);
        this.ctx.lineTo(cx + 5, cy + 6);
        this.ctx.fill();
    }

    _drawObject(ctx, obj) {
        const type = obj.mesh.userData.type || 'unknown';
        const x = obj.mesh.position.x;
        const y = obj.mesh.position.z; // World Z is 2D Y

        // Simple shape logic
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-obj.mesh.rotation.y); // Rotate object local

        // Determine style
        if (type.includes('road')) {
            ctx.fillStyle = '#444';
            ctx.fillRect(-5, -5, 10, 10); // Approximation
            // Ideally use box size
        } else if (type.includes('building') || type.includes('house')) {
             ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
             ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
             ctx.lineWidth = 1;

             // Get dimensions if possible, else default
             // Using box if available
             const w = (obj.box && (obj.box.max.x - obj.box.min.x)) || 10;
             const d = (obj.box && (obj.box.max.z - obj.box.min.z)) || 10;

             ctx.fillRect(-w/2, -d/2, w, d);
             ctx.strokeRect(-w/2, -d/2, w, d);
        } else if (type === 'river') {
            ctx.fillStyle = '#22a';
            ctx.beginPath();
            ctx.arc(0, 0, 8, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Generic
            ctx.fillStyle = '#666';
            ctx.fillRect(-2, -2, 4, 4);
        }

        ctx.restore();
    }
}
