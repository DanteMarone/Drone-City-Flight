import * as THREE from 'three';

export class Minimap {
    constructor(app) {
        this.app = app;
        this.enabled = true; // Default state
        this.scale = 2.0; // Zoom level (pixels per meter, effectively)
        this.size = 200; // Map size in pixels

        this.canvas = null;
        this.ctx = null;
        this.container = null;

        // Static Cache
        this.staticCanvas = null;
        this.staticCtx = null;
        this.worldOffset = 2000; // Offset to handle negative coordinates on static canvas
        this.staticSize = 4000; // Total size of static canvas

        this._init();
    }

    _init() {
        // Create DOM
        const layer = document.getElementById('ui-layer') || document.body;

        this.container = document.createElement('div');
        this.container.className = 'minimap-container';

        this.canvas = document.createElement('canvas');
        this.canvas.width = this.size;
        this.canvas.height = this.size;
        this.container.appendChild(this.canvas);

        layer.appendChild(this.container);

        this.ctx = this.canvas.getContext('2d');

        // Create Static Cache Canvas (Offscreen)
        this.staticCanvas = document.createElement('canvas');
        this.staticCanvas.width = this.staticSize;
        this.staticCanvas.height = this.staticSize;
        this.staticCtx = this.staticCanvas.getContext('2d');

        // Input Listener
        window.addEventListener('keydown', (e) => {
             // Only toggle if not in an input field
             if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;

             if (e.code === 'KeyM') {
                 this.toggle();
             }
        });
    }

    toggle() {
        this.enabled = !this.enabled;
        this.container.style.display = this.enabled ? 'block' : 'none';
    }

    refreshStatic(world) {
        if (!world) return;

        const ctx = this.staticCtx;
        const w = this.staticCanvas.width;
        const h = this.staticCanvas.height;
        const cx = this.worldOffset;
        const cy = this.worldOffset;

        // Clear
        ctx.clearRect(0, 0, w, h);

        // Background (Dark)
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, w, h);

        // Draw entities
        world.colliders.forEach(entity => {
            if (!entity.mesh) return;
            const pos = entity.mesh.position;
            const rot = entity.mesh.rotation.y;

            // Transform to canvas space
            // World (+X is Right, +Z is Down/South)
            // Canvas (+X is Right, +Y is Down)
            // We map World X -> Canvas X, World Z -> Canvas Y

            const x = cx + pos.x;
            const y = cy + pos.z;

            // Check bounds to avoid drawing outside
            if (x < -100 || x > w + 100 || y < -100 || y > h + 100) return;

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(-rot); // ThreeJS +Y is CCW, Canvas is CW. -rot aligns them.

            // Determine Size
            let width = 0;
            let depth = 0;

            // Try params first
            if (entity.params) {
                width = entity.params.width;
                depth = entity.params.depth || entity.params.height; // sometimes height is used for depth in 2D layout logic
            }

            // Fallback to Box3 if params missing
            if (!width || !depth) {
                if (entity.box) {
                    const s = new THREE.Vector3();
                    entity.box.getSize(s);
                    // This is world aligned box size, not local.
                    // But for square-ish things it's ok.
                    // For rotated things, world box is bigger.
                    // We can try to approximate.
                    width = s.x;
                    depth = s.z;
                } else {
                    width = 10;
                    depth = 10;
                }
            }

            // Draw based on type
            if (entity.type === 'road' || entity.type === 'intersection') {
                 ctx.fillStyle = '#555'; // Road Color
                 ctx.fillRect(-width/2, -depth/2, width, depth);
            } else if (entity.type === 'building' || entity.type === 'tower' || entity.type.includes('residential') || entity.type.includes('industrial')) {
                 ctx.fillStyle = '#3498db'; // Building Color
                 ctx.fillRect(-width/2, -depth/2, width, depth);
            } else if (entity.type === 'landingPad') {
                 ctx.fillStyle = '#2ecc71'; // Pad Color
                 ctx.beginPath();
                 ctx.arc(0, 0, width/2, 0, Math.PI * 2);
                 ctx.fill();
                 // H
                 ctx.fillStyle = '#000';
                 ctx.font = `${width/2}px Arial`;
                 ctx.textAlign = 'center';
                 ctx.textBaseline = 'middle';
                 ctx.fillText('H', 0, 0);
            } else if (entity.type === 'park' || entity.type === 'tree') {
                 ctx.fillStyle = '#27ae60';
                 ctx.beginPath();
                 ctx.arc(0, 0, (width || 5)/2, 0, Math.PI * 2);
                 ctx.fill();
            }

            ctx.restore();
        });
    }

    update(dt) {
        if (!this.enabled) return;
        if (!this.app) return;

        const ctx = this.ctx;
        const size = this.size;

        // Target (Player/Drone)
        let target = this.app.drone;
        if (this.app.mode === 'person') target = this.app.person;

        const pos = target.position;
        const yaw = target.yaw;

        // Clear Main Canvas
        ctx.clearRect(0, 0, size, size);

        // Circular Mask
        ctx.save();
        ctx.beginPath();
        ctx.arc(size/2, size/2, size/2, 0, Math.PI * 2);
        ctx.clip();

        // Background
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, size, size);

        // Calculate source rectangle from static canvas
        // Center of map in static canvas coords
        const smCx = this.worldOffset + pos.x;
        const smCy = this.worldOffset + pos.z;

        // Dimensions to sample
        const sSize = size / this.scale;
        const sx = smCx - sSize/2;
        const sy = smCy - sSize/2;

        // Draw Static Map
        if (this.staticCanvas) {
            ctx.drawImage(this.staticCanvas,
                sx, sy, sSize, sSize,
                0, 0, size, size
            );
        }

        // Draw Dynamic Entities (Other than player) could go here

        // Draw Player Arrow
        ctx.translate(size/2, size/2);
        ctx.rotate(-yaw);

        ctx.fillStyle = '#ffcc00';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.lineTo(6, 8);
        ctx.lineTo(0, 5);
        ctx.lineTo(-6, 8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore(); // Restore clip

        // Border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(size/2, size/2, size/2 - 1.5, 0, Math.PI * 2);
        ctx.stroke();
    }
}
