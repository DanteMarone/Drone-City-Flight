export class Minimap {
    constructor(app) {
        this.app = app;
        this.container = null;
        this.canvas = null;
        this.ctx = null;

        // Config
        this.size = 200; // px (Display size)
        this.renderSize = 400; // px (Internal resolution for sharpness)
        this.range = 200; // meters (Radius of view)
        this.visible = true;

        // Cache
        this.colors = {
            bg: 'rgba(0, 0, 0, 0.6)',
            border: 'rgba(255, 255, 255, 0.2)',
            player: '#ffffff',
            building: 'rgba(0, 255, 255, 0.4)',
            buildingOutline: 'rgba(0, 255, 255, 0.8)',
            ring: '#ffff00',
            landingPad: 'rgba(50, 255, 50, 0.6)',
            ground: '#223322'
        };

        this._init();
    }

    _init() {
        const layer = document.getElementById('ui-layer');
        if (!layer) return;

        this.container = document.createElement('div');
        this.container.className = 'minimap-container';

        this.canvas = document.createElement('canvas');
        this.canvas.className = 'minimap-canvas';
        this.canvas.width = this.renderSize;
        this.canvas.height = this.renderSize;

        this.container.appendChild(this.canvas);
        layer.appendChild(this.container);

        this.ctx = this.canvas.getContext('2d');
    }

    update(dt) {
        if (!this.visible || !this.app.running) return;

        // Get Player State
        let playerPos, playerYaw;
        if (this.app.mode === 'drone' && this.app.drone) {
            playerPos = this.app.drone.position;
            playerYaw = this.app.drone.yaw;
        } else if (this.app.mode === 'person' && this.app.person) {
            playerPos = this.app.person.position;
            playerYaw = this.app.person.yaw;
        } else {
            return;
        }

        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        const cx = width / 2;
        const cy = height / 2;
        const scale = (width / 2) / this.range; // px per meter

        // Clear
        ctx.clearRect(0, 0, width, height);

        // Background (Circular Clip)
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, width / 2 - 2, 0, Math.PI * 2);
        ctx.clip();

        ctx.fillStyle = this.colors.bg;
        ctx.fillRect(0, 0, width, height);

        // --- World Space Rendering ---
        ctx.save();

        // 1. Center Map on Canvas
        ctx.translate(cx, cy);

        // 2. Rotate Map so Player is facing Up (North-Up relative to Player)
        // Player Yaw: 0 = -Z (North).
        // We want -Z to be Up (0 deg in Canvas? No, usually -90 deg in Canvas is Up).
        // Canvas Coord: +X Right, +Y Down.
        // World Coord: +X Right, +Z Down (in 2D top down view).
        // If World Yaw = 0 (Facing -Z), we want Map rotated so -Z is Up (-Y).
        // Standard Map Projection: Map Z -> Canvas Y. Map X -> Canvas X.
        // If we rotate by -Yaw...
        // Let's deduce:
        // World (0, -10) is "Forward".
        // If Yaw=0, we want (0, -10) to be at (0, -Scale*10) on Canvas (Up).
        // Canvas Y is Down. So -10 is Up. Matches.
        // So default projection (X->X, Z->Y) works for Yaw=0.
        // Now if Yaw=90 (Facing +X). "Forward" is (+10, 0).
        // We want (+10, 0) to be Up (0, -Y).
        // We need to rotate the world -90 deg.
        // So Rotate(-Yaw).

        ctx.rotate(-playerYaw); // Rotate world opposite to player rotation

        // 3. Translate world so Player is at (0,0) (which is now at cx, cy)
        ctx.scale(scale, scale);
        ctx.translate(-playerPos.x, -playerPos.z);

        // Draw World Objects
        // Optimization: Cull objects outside range?
        // Simple dist check squared.
        const rangeSq = (this.range + 50) * (this.range + 50); // Buffer for large objects

        // Static Colliders (Buildings, etc)
        const colliders = this.app.world.colliders;
        if (colliders) {
            ctx.fillStyle = this.colors.building;
            ctx.strokeStyle = this.colors.buildingOutline;
            ctx.lineWidth = 2 / scale; // Constant line width in screen pixels

            colliders.forEach(entity => {
                if (!entity.mesh || !entity.mesh.visible) return;

                // Distance Check
                const dx = entity.mesh.position.x - playerPos.x;
                const dz = entity.mesh.position.z - playerPos.z;
                if (dx*dx + dz*dz > rangeSq) return;

                // Draw
                this._drawEntity(ctx, entity);
            });
        }

        // Landing Pads (Highlight)
        // They are in colliders usually, but we might want special color
        // If we iterate colliders, we can check type.
        // Assuming done in loop above or separately.
        // Let's refine the loop above to handle types.

        // Rings
        if (this.app.rings && this.app.rings.rings) {
            ctx.fillStyle = this.colors.ring;
            this.app.rings.rings.forEach(ring => {
                if (!ring.mesh.visible || ring.collected) return;

                const rPos = ring.mesh.position;
                 // Distance Check
                const dx = rPos.x - playerPos.x;
                const dz = rPos.z - playerPos.z;
                if (dx*dx + dz*dz > rangeSq) return;

                ctx.beginPath();
                ctx.arc(rPos.x, rPos.z, 3, 0, Math.PI * 2); // 3 meters radius visually
                ctx.fill();
            });
        }

        ctx.restore(); // End World Space

        // --- HUD Space Rendering (Player Marker) ---
        // Player is always at center (cx, cy), facing Up.
        ctx.fillStyle = this.colors.player;

        // Draw Arrow pointing Up
        ctx.beginPath();
        ctx.moveTo(cx, cy - 8); // Tip
        ctx.lineTo(cx - 6, cy + 8); // Bottom Left
        ctx.lineTo(cx, cy + 4); // Notch
        ctx.lineTo(cx + 6, cy + 8); // Bottom Right
        ctx.closePath();
        ctx.fill();

        ctx.restore(); // End Clip

        // Border
        ctx.strokeStyle = this.colors.border;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(cx, cy, width / 2 - 2, 0, Math.PI * 2);
        ctx.stroke();
    }

    _drawEntity(ctx, entity) {
        // Use box dimensions if available, else fallback
        let w = 5;
        let d = 5;

        if (entity.box) {
            w = entity.box.max.x - entity.box.min.x;
            d = entity.box.max.z - entity.box.min.z;
        } else if (entity.params) {
            w = entity.params.width || 5;
            d = entity.params.depth || 5;
        }

        // Use special colors
        if (entity.type === 'landingPad') {
            ctx.fillStyle = this.colors.landingPad;
        } else {
            ctx.fillStyle = this.colors.building;
        }

        ctx.save();
        ctx.translate(entity.mesh.position.x, entity.mesh.position.z);
        ctx.rotate(entity.mesh.rotation.y);
        ctx.fillRect(-w/2, -d/2, w, d);
        // Optional: Stroke
        // ctx.strokeRect(-w/2, -d/2, w, d);
        ctx.restore();
    }
}
