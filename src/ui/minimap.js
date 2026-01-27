export class Minimap {
    constructor(app) {
        this.app = app;
        this.canvas = null;
        this.ctx = null;
        this.size = 200; // px
        this.range = 100; // meters (radius)
        this._initDOM();
    }

    _initDOM() {
        const layer = document.getElementById('ui-layer');
        if (!layer) return;

        const container = document.createElement('div');
        container.className = 'minimap-container';

        this.canvas = document.createElement('canvas');
        this.canvas.width = this.size;
        this.canvas.height = this.size;
        this.canvas.className = 'minimap-canvas';

        container.appendChild(this.canvas);
        layer.appendChild(container);

        this.ctx = this.canvas.getContext('2d');
    }

    update(dt) {
        if (!this.ctx) return;
        if (!this.app.world) return;

        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Clear
        ctx.clearRect(0, 0, width, height);

        // Player Pos
        let playerPos;
        let playerYaw = 0;
        if (this.app.mode === 'drone') {
            playerPos = this.app.drone.position;
            playerYaw = this.app.drone.yaw;
        } else {
            playerPos = this.app.person.position;
            playerYaw = this.app.person.yaw;
        }

        // Setup Transform
        // We want Player at Center (width/2, height/2).
        // World Coordinates: X is Right, Z is Down (Top-Down view).
        // Canvas Coordinates: X is Right, Y is Down.
        // Scale: width / (range * 2).
        const scale = width / (this.range * 2);

        ctx.save();
        ctx.translate(width / 2, height / 2);
        ctx.scale(scale, scale);
        ctx.translate(-playerPos.x, -playerPos.z);

        // Draw Colliders (Static)
        ctx.fillStyle = '#666'; // Gray for buildings
        const colliders = this.app.world.colliders;
        if (colliders) {
            colliders.forEach(c => {
                if (c.mesh) {
                    const dx = c.mesh.position.x - playerPos.x;
                    const dz = c.mesh.position.z - playerPos.z;
                    if (Math.abs(dx) > this.range || Math.abs(dz) > this.range) return;

                    if (c.box) {
                        const w = c.box.max.x - c.box.min.x;
                        const d = c.box.max.z - c.box.min.z;
                        ctx.fillRect(c.box.min.x, c.box.min.z, w, d);
                    } else {
                        // Fallback: 2x2 square centered
                         ctx.fillRect(c.mesh.position.x - 1, c.mesh.position.z - 1, 2, 2);
                    }
                }
            });
        }

        // Draw Landing Pads
        ctx.fillStyle = '#0f0'; // Green
        const pads = this.app.world.landingPads;
        if (pads) {
             pads.forEach(p => {
                 if (p.mesh) {
                     const dx = p.mesh.position.x - playerPos.x;
                     const dz = p.mesh.position.z - playerPos.z;
                     if (Math.abs(dx) > this.range || Math.abs(dz) > this.range) return;

                     if (p.box) {
                         const w = p.box.max.x - p.box.min.x;
                         const d = p.box.max.z - p.box.min.z;
                         ctx.fillRect(p.box.min.x, p.box.min.z, w, d);
                     }
                 }
             });
        }

        // Draw Rings
        ctx.fillStyle = '#ff0'; // Yellow
        if (this.app.rings && this.app.rings.rings) {
            this.app.rings.rings.forEach(r => {
                if (r.mesh) {
                    const dx = r.mesh.position.x - playerPos.x;
                    const dz = r.mesh.position.z - playerPos.z;
                    if (Math.abs(dx) > this.range || Math.abs(dz) > this.range) return;

                    ctx.beginPath();
                    ctx.arc(r.mesh.position.x, r.mesh.position.z, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
        }

        ctx.restore();

        // Draw Player (Center)
        ctx.save();
        ctx.translate(width / 2, height / 2);

        // Rotate arrow to show facing
        // ThreeJS rotation.y is CCW.
        // Canvas rotate is CW.
        // We want arrow (Up) to rotate with Yaw.
        // If Yaw=0, points Up.
        // If Yaw=90 (Left in World? No, Right usually).
        // Let's rely on standard map behavior: Rotates opposite to World Yaw if map is fixed.
        // Wait, if Map is FIXED North.
        // Player turns Right (Yaw -90?). Arrow should turn Right (+90).
        // If ThreeJS Yaw + is Left (CCW). Arrow should turn Left (CCW).
        // Canvas Rotate + is CW. So `rotate(-yaw)`.

        ctx.rotate(-playerYaw);

        ctx.fillStyle = '#0ff'; // Cyan
        ctx.beginPath();
        ctx.moveTo(0, -6);
        ctx.lineTo(4, 4);
        ctx.lineTo(-4, 4);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }
}
