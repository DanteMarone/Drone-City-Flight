
export class Minimap {
    constructor(app) {
        this.app = app;
        this.size = 200; // px
        this.zoom = 1.0; // scale
        this.range = 300; // world units visible radius
        this.elements = {};
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

        this.elements.container = container;
        this.elements.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    setVisible(visible) {
        if (visible) {
            this.elements.container.classList.remove('hidden');
        } else {
            this.elements.container.classList.add('hidden');
        }
    }

    update(dt) {
        if (!this.app.drone) return;
        if (this.elements.container.classList.contains('hidden')) return;

        const ctx = this.ctx;
        const width = this.elements.canvas.width;
        const height = this.elements.canvas.height;
        const halfW = width / 2;
        const halfH = height / 2;

        // Clear
        ctx.clearRect(0, 0, width, height);

        // Save context
        ctx.save();

        // 1. Clip to Circle
        ctx.beginPath();
        ctx.arc(halfW, halfH, halfW - 2, 0, Math.PI * 2);
        ctx.clip();

        // Background
        ctx.fillStyle = 'rgba(0, 20, 30, 0.8)';
        ctx.fill();

        // 2. Transform: Center is Drone
        // Rotating Map: World rotates opposite to Drone Yaw
        const dronePos = this.app.drone.position;
        const droneYaw = this.app.drone.yaw;

        ctx.translate(halfW, halfH);
        ctx.rotate(droneYaw); // Rotate canvas to align world to drone (drone points UP)

        // Scale: Map Range to Canvas Size
        // If range is 300m, and canvas is 200px, scale = 200 / (300*2) ? No.
        // Scale factor: pixels per meter.
        // width = 200px. range = radius 300m? No, diameter?
        // Let's say range is the "radius" from center to edge.
        const scale = halfW / this.range;
        ctx.scale(scale, scale);
        ctx.translate(-dronePos.x, -dronePos.z);

        // 3. Draw World Objects
        // Optimization: Only iterate objects within range
        const objects = this.app.world.colliders;

        // Render Static Geometry (simplified)
        // We can cache this if performance is bad, but for < 1000 objects it's fine
        for (const obj of objects) {
            // Cull
            const dx = obj.mesh.position.x - dronePos.x;
            const dz = obj.mesh.position.z - dronePos.z;
            if (dx*dx + dz*dz > this.range * this.range) continue;

            this._drawObject(ctx, obj);
        }

        // Render Rings (Objectives)
        // Only draw uncollected rings
        this.app.rings.rings.forEach(ring => {
            if (ring.collected) return;
            const pos = ring.mesh.position;
             // Cull
            const dx = pos.x - dronePos.x;
            const dz = pos.z - dronePos.z;
            if (dx*dx + dz*dz > this.range * this.range) return;

            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(pos.x, pos.z, 8, 0, Math.PI * 2); // 8m radius visual
            ctx.fill();
        });

        // 4. Draw Landing Pads
        this.app.world.landingPads.forEach(pad => {
             const pos = pad.mesh.position;
             const dx = pos.x - dronePos.x;
             const dz = pos.z - dronePos.z;
             if (dx*dx + dz*dz > this.range * this.range) return;

             ctx.fillStyle = '#00FF00';
             ctx.fillRect(pos.x - 4, pos.z - 4, 8, 8);
        });

        // Restore context to draw static overlays (Drone Icon)
        ctx.restore();

        // 5. Draw Drone Icon (Always Center, Pointing Up)
        ctx.save();
        ctx.translate(halfW, halfH);
        // No rotation needed because we rotated the world. Drone is always "Forward" relative to screen.
        // Actually, if we rotated the context by +Yaw, then "Up" on screen is "-Z" in world relative to drone?
        // Wait.
        // World coordinates: +Z is South, -Z is North.
        // Drone Yaw 0 faces -Z (North).
        // If Drone Yaw is 0: ctx.rotate(0). World is drawn as-is. -Z is Up. Correct.
        // If Drone Yaw is 90 (West): We want World +X (East) to be Down.
        // ctx.rotate(90). +X axis rotates 90deg clockwise. +X becomes Down. Correct.

        // Draw Drone Arrow
        ctx.fillStyle = '#00FFFF';
        ctx.beginPath();
        ctx.moveTo(0, -8); // Tip
        ctx.lineTo(6, 6);
        ctx.lineTo(0, 3);
        ctx.lineTo(-6, 6);
        ctx.closePath();
        ctx.fill();

        // 6. Draw Border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, halfW - 2, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }

    _drawObject(ctx, obj) {
        const type = obj.userData?.type || 'unknown';
        const pos = obj.mesh.position;

        if (type === 'road') {
            ctx.fillStyle = '#555';
            // Need accurate dimensions. Box?
            const w = obj.box ? (obj.box.max.x - obj.box.min.x) : 10;
            const h = obj.box ? (obj.box.max.z - obj.box.min.z) : 10;

            ctx.save();
            ctx.translate(pos.x, pos.z);
            ctx.rotate(-obj.mesh.rotation.y); // Object rotation
            ctx.fillRect(-w/2, -h/2, w, h);
            ctx.restore();
        } else if (type === 'building' || type === 'house' || type.includes('Park')) {
             ctx.fillStyle = type.includes('Park') ? '#2E8B57' : '#888';
             const w = obj.box ? (obj.box.max.x - obj.box.min.x) : 10;
             const h = obj.box ? (obj.box.max.z - obj.box.min.z) : 10;

             ctx.save();
             ctx.translate(pos.x, pos.z);
             ctx.rotate(-obj.mesh.rotation.y);
             ctx.fillRect(-w/2, -h/2, w, h);
             ctx.restore();
        } else if (type === 'river') {
            ctx.fillStyle = '#4444ff';
            ctx.beginPath();
            ctx.arc(pos.x, pos.z, 5, 0, Math.PI * 2); // Simple representation for now
            ctx.fill();
        }
    }
}
