export class Minimap {
    constructor(app) {
        this.app = app;
        this.enabled = true;
        this.scale = 1.5; // Pixels per meter
        this.size = 200; // Widget size (px)
        this.range = this.size / this.scale / 2; // Radius in meters

        // Caching static world elements
        // We can't easily cache a moving window without a huge texture.
        // For now, we will render "static" objects every frame but optimized (simple rects).
        // If performance is an issue, we can implement a chunk system or large texture later.

        this._createDOM();
    }

    _createDOM() {
        const layer = document.getElementById('ui-layer');

        const container = document.createElement('div');
        container.className = 'minimap-container';

        const canvas = document.createElement('canvas');
        canvas.width = this.size;
        canvas.height = this.size;
        canvas.className = 'minimap-canvas';

        container.appendChild(canvas);
        layer.appendChild(container);

        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    refresh() {
        // Called when map loads.
        // We could pre-calculate bounds or cache static geometry here.
        // For this implementation, we just ensure it's visible.
        this.canvas.style.display = 'block';
    }

    update(dt) {
        if (!this.enabled || !this.app.running) return;

        // Clear
        this.ctx.clearRect(0, 0, this.size, this.size);

        // Background
        this.ctx.fillStyle = 'rgba(20, 30, 40, 0.6)';
        this.ctx.fillRect(0, 0, this.size, this.size);

        // Get Player Position
        let playerPos = { x: 0, z: 0, rot: 0 };
        if (this.app.mode === 'drone' && this.app.drone) {
            playerPos.x = this.app.drone.position.x;
            playerPos.z = this.app.drone.position.z;
            playerPos.rot = this.app.drone.yaw;
        } else if (this.app.person) {
            playerPos.x = this.app.person.position.x;
            playerPos.z = this.app.person.position.z;
            playerPos.rot = this.app.person.yaw;
        }

        // Draw World Objects
        // Optimization: Filter by distance
        const range = this.size / this.scale; // Viewport width in meters
        const halfRange = range * 0.7; // slightly larger to avoid pop-in

        this.ctx.save();
        // Center the context
        this.ctx.translate(this.size / 2, this.size / 2);

        // Rotate map to match player heading?
        // Usually minimap rotates so "Up" is "Forward".
        // Let's implement rotating map.
        this.ctx.rotate(playerPos.rot);
        this.ctx.scale(this.scale, this.scale);
        this.ctx.translate(-playerPos.x, -playerPos.z);

        // Draw Buildings/Static
        if (this.app.world && this.app.world.colliders) {
            this.ctx.fillStyle = '#8899aa';
            for (const entity of this.app.world.colliders) {
                if (entity.mesh && entity.box) {
                    // Culling
                    const ex = entity.mesh.position.x;
                    const ez = entity.mesh.position.z;
                    if (Math.abs(ex - playerPos.x) < halfRange && Math.abs(ez - playerPos.z) < halfRange) {
                        // Draw Rect (approximation)
                        // Ideally use box size.
                        const size = entity.box.getSize({x:0, y:0, z:0}); // Three.js Vector3
                        // Simple rect centered at pos
                        this.ctx.fillRect(ex - size.x/2, ez - size.z/2, size.x, size.z);
                    }
                }
            }
        }

        // Draw Rings (Objectives)
        if (this.app.rings && this.app.rings.rings) {
             this.ctx.fillStyle = '#ffaa00';
             for (const ring of this.app.rings.rings) {
                 if (!ring.collected) {
                     const rx = ring.mesh.position.x;
                     const rz = ring.mesh.position.z;
                     if (Math.abs(rx - playerPos.x) < halfRange && Math.abs(rz - playerPos.z) < halfRange) {
                         this.ctx.beginPath();
                         this.ctx.arc(rx, rz, 2, 0, Math.PI * 2);
                         this.ctx.fill();
                     }
                 }
             }
        }

        // Draw Other Players / Birds?

        this.ctx.restore();

        // Draw Player Icon (Center)
        this.ctx.fillStyle = '#00ff00';
        this.ctx.beginPath();
        this.ctx.moveTo(this.size/2, this.size/2 - 5);
        this.ctx.lineTo(this.size/2 - 4, this.size/2 + 5);
        this.ctx.lineTo(this.size/2 + 4, this.size/2 + 5);
        this.ctx.fill();
    }
}
