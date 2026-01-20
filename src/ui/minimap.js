export class Minimap {
    constructor(world, drone, person) {
        this.world = world;
        this.drone = drone;
        this.person = person;
        this.ringManager = null;

        // Configuration
        this.zoom = 1.0;
        this.range = 200; // World units visible

        this.container = null;
        this.canvas = null;
        this.ctx = null;

        this._createDOM();
    }

    _createDOM() {
        const uiLayer = document.getElementById('ui-layer');
        if (!uiLayer) return;

        this.container = document.createElement('div');
        this.container.className = 'minimap-container';

        this.canvas = document.createElement('canvas');
        this.canvas.className = 'minimap-canvas';
        this.canvas.width = 200;
        this.canvas.height = 200;

        this.container.appendChild(this.canvas);
        uiLayer.appendChild(this.container);

        this.ctx = this.canvas.getContext('2d');
    }

    setRings(ringManager) {
        this.ringManager = ringManager;
    }

    update() {
        if (!this.ctx || !this.container) return;

        // Determine active player
        let player = this.drone;
        if (!this.drone.mesh.visible && this.person) {
            player = this.person;
        }

        const pos = player.position;
        const yaw = player.yaw || 0;

        const w = this.canvas.width;
        const h = this.canvas.height;
        const cx = w / 2;
        const cy = h / 2;
        const scale = (w / 2) / this.range;

        // Clear
        this.ctx.clearRect(0, 0, w, h);

        // Background
        this.ctx.fillStyle = 'rgba(0, 20, 0, 0.8)';
        this.ctx.fillRect(0, 0, w, h);

        // Save for World Transform
        this.ctx.save();

        // Center and Rotate
        // We translate to center, rotate, then scale
        this.ctx.translate(cx, cy);
        this.ctx.rotate(yaw);
        this.ctx.scale(scale, scale);
        this.ctx.translate(-pos.x, -pos.z);

        // 1. Draw Static Colliders (Buildings/Roads)
        // Optimization: Filter by range
        // We check if collider is within box [x-range, x+range], [z-range, z+range]
        if (this.world.colliders) {
            this.ctx.fillStyle = '#666'; // Buildings are gray
            const rangeSq = this.range * this.range * 1.5; // Slight buffer

            this.world.colliders.forEach(c => {
                 if (c.box) {
                     const min = c.box.min;
                     const max = c.box.max;

                     // Simple distance check (using center of box)
                     const bx = (min.x + max.x) / 2;
                     const bz = (min.z + max.z) / 2;
                     const dx = bx - pos.x;
                     const dz = bz - pos.z;

                     if (dx*dx + dz*dz < rangeSq) {
                         this.ctx.fillRect(min.x, min.z, max.x - min.x, max.z - min.z);
                     }
                 }
            });
        }

        // 2. Draw Rings
        if (this.ringManager && this.ringManager.rings) {
             this.ctx.fillStyle = '#ffd700'; // Gold
             this.ringManager.rings.forEach(r => {
                 const rp = r.mesh.position;
                 const dx = rp.x - pos.x;
                 const dz = rp.z - pos.z;
                 // Draw if in range
                 if (Math.abs(dx) < this.range && Math.abs(dz) < this.range) {
                      this.ctx.beginPath();
                      this.ctx.arc(rp.x, rp.z, 4, 0, Math.PI * 2); // 4 unit radius on map? No, 4 world units
                      this.ctx.fill();
                 }
             });
        }

        this.ctx.restore();

        // Draw Player Icon (Center)
        // Arrow pointing Up
        this.ctx.fillStyle = '#0f0';
        this.ctx.beginPath();
        this.ctx.moveTo(cx, cy - 8);
        this.ctx.lineTo(cx - 6, cy + 6);
        this.ctx.lineTo(cx, cy + 3); // Indent
        this.ctx.lineTo(cx + 6, cy + 6);
        this.ctx.fill();

        // Border
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, w/2 - 2, 0, Math.PI * 2);
        this.ctx.stroke();
    }
}
