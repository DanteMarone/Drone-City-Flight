import * as THREE from 'three';

export class Minimap {
    constructor(app) {
        this.app = app;
        this.canvas = null;
        this.ctx = null;
        this.cacheCanvas = null;
        this.cacheCtx = null;

        // Config
        this.scale = 1.0; // 1 World Unit = 1 Pixel
        this.worldSize = 2000; // Assumed world size
        this.viewRadius = 100; // View radius in world units
        this.containerSize = 200; // CSS size

        this._createDOM();

        // Initial cache
        this.refresh();
    }

    _createDOM() {
        const layer = document.getElementById('ui-layer');
        if (!layer) return;

        const container = document.createElement('div');
        container.className = 'minimap-container';

        this.canvas = document.createElement('canvas');
        this.canvas.width = this.containerSize;
        this.canvas.height = this.containerSize;
        this.canvas.className = 'minimap-canvas';

        container.appendChild(this.canvas);
        layer.appendChild(container);

        this.ctx = this.canvas.getContext('2d');
    }

    refresh() {
        if (!this.app.world) return;

        // Create offscreen canvas
        this.cacheCanvas = document.createElement('canvas');
        this.cacheCanvas.width = this.worldSize * this.scale;
        this.cacheCanvas.height = this.worldSize * this.scale;
        this.cacheCtx = this.cacheCanvas.getContext('2d');

        const ctx = this.cacheCtx;
        const cx = this.cacheCanvas.width / 2;
        const cy = this.cacheCanvas.height / 2;

        // Clear
        ctx.fillStyle = '#222'; // Background color for the world map
        ctx.fillRect(0, 0, this.cacheCanvas.width, this.cacheCanvas.height);

        // Draw Entities
        const entities = this.app.world.colliders;

        // Helper to transform world pos to map pos
        const toMap = (x, z) => ({
            x: cx + x * this.scale,
            y: cy + z * this.scale
        });

        entities.forEach(entity => {
            if (!entity.mesh) return;

            // Determine Style
            let color = '#555';
            if (entity.type === 'road' || entity.type === 'intersection' || entity.type === 'turn') color = '#666';
            else if (entity.type === 'river') color = '#3498db';
            else if (entity.type === 'sidewalk') color = '#444';
            else if (entity.type === 'building' || entity.type === 'residential' || entity.type === 'factory') color = '#888';
            else if (entity.type === 'tree') color = '#27ae60';

            ctx.fillStyle = color;
            ctx.save();

            // Transform
            const pos = entity.mesh.position;
            const rot = entity.mesh.rotation.y;
            const mapPos = toMap(pos.x, pos.z);

            ctx.translate(mapPos.x, mapPos.y);
            ctx.rotate(-rot); // Canvas rotation is clockwise, ThreeJS Y is counter-clockwise?
            // Actually ThreeJS Y rotation: positive is counter-clockwise around Y (Standard Right Hand).
            // Canvas rotation: positive is clockwise.
            // So we negate rot.

            // Dimensions
            let w = 10, l = 10;

            // Try to get dimensions from params
            if (entity.params) {
                if (entity.params.width) w = entity.params.width;
                if (entity.params.length) l = entity.params.length;
            }

            // Apply scale
            w *= entity.mesh.scale.x;
            l *= entity.mesh.scale.z; // Use Z for length

            // Fallback for non-param entities: Use Box
            if (!entity.params || (!entity.params.width && !entity.params.length)) {
                 if (entity.box) {
                     const size = new THREE.Vector3();
                     entity.box.getSize(size);
                     // If we use box size, it's AABB, so rotation is already baked in.
                     // BUT, we are drawing inside a rotated context.
                     // So we want LOCAL dimensions.
                     // Accessing geometry parameters is safer if available, but tricky.
                     // Simple fallback: 5x5 block
                     w = size.x;
                     l = size.z;
                     // If we rely on AABB size, we shouldn't rotate context.
                     // But let's assume simple boxes for fallback.
                 } else {
                     w = 5; l = 5;
                 }
            }

            // Draw Rect (Centered)
            ctx.fillRect(-w * this.scale / 2, -l * this.scale / 2, w * this.scale, l * this.scale);

            ctx.restore();
        });

        console.log("Minimap: World Cached");
    }

    update(dt) {
        if (!this.canvas || !this.cacheCanvas) return;
        if (!this.app.running) return;

        // Get Player (Drone or Person)
        const player = this.app.mode === 'drone' ? this.app.drone : this.app.person;
        if (!player) return;

        const pPos = player.position;
        const pYaw = player.yaw; // Radians

        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const cx = w / 2;
        const cy = h / 2;

        // Clear
        ctx.clearRect(0, 0, w, h);

        // Draw Background (Mask Circle)
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, w/2 - 2, 0, Math.PI * 2);
        ctx.clip();

        // Fill background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, w, h);

        // Draw Cached World
        // We want Player to be at (cx, cy).
        // Map is at (cacheCx, cacheCy).
        // Player in Map Space:
        const cacheW = this.cacheCanvas.width;
        const cacheH = this.cacheCanvas.height;
        const cacheCx = cacheW / 2;
        const cacheCy = cacheH / 2;

        const playerMapX = cacheCx + pPos.x * this.scale;
        const playerMapY = cacheCy + pPos.z * this.scale;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(pYaw); // Rotate map opposite to player rotation to keep "Up" = Forward
        // Wait, if player rotates left (positive yaw), map should rotate right (positive canvas rot).
        // If player looks North (0), map is normal.
        // If player looks East (-PI/2), map should rotate -PI/2?
        // Let's test. If I turn right, map world should turn left.

        ctx.translate(-playerMapX, -playerMapY);

        ctx.drawImage(this.cacheCanvas, 0, 0);
        ctx.restore();

        // Draw Player Icon
        ctx.fillStyle = '#0ff';
        ctx.beginPath();
        ctx.moveTo(cx, cy - 6);
        ctx.lineTo(cx - 5, cy + 6);
        ctx.lineTo(cx + 5, cy + 6);
        ctx.fill();

        ctx.restore(); // Restore clip

        // Border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, w/2 - 2, 0, Math.PI * 2);
        ctx.stroke();
    }
}
