
export class Minimap {
    constructor(scene, drone, world, ringsManager) {
        this.scene = scene;
        this.drone = drone;
        this.world = world;
        this.ringsManager = ringsManager;

        this.dom = null;
        this.canvas = null;
        this.ctx = null;
        this.size = 150; // Canvas size
        this.range = 200; // View radius in meters

        this._init();
    }

    _init() {
        const uiLayer = document.getElementById('ui-layer');

        this.dom = document.createElement('div');
        this.dom.className = 'minimap-container';
        // Force styles to ensure visibility if CSS fails to load/apply
        this.dom.style.position = 'absolute';
        this.dom.style.bottom = '20px';
        this.dom.style.right = '20px';
        this.dom.style.width = '150px';
        this.dom.style.height = '150px';
        this.dom.style.zIndex = '2000';
        this.dom.style.pointerEvents = 'none';

        this.canvas = document.createElement('canvas');
        this.canvas.width = this.size;
        this.canvas.height = this.size;
        this.canvas.className = 'minimap-canvas';

        this.dom.appendChild(this.canvas);
        uiLayer.appendChild(this.dom);

        this.ctx = this.canvas.getContext('2d');
    }

    update() {
        if (!this.drone || !this.drone.mesh.visible) {
            // Hide if not in drone mode? Or show for Person too?
            // "Person" also needs minimap.
            // But let's check App mode. App.mode is not passed.
            // Check drone visibility as proxy.
            if (!this.drone.mesh.visible) {
                // If person is visible?
                // For now, let's just assume we track the active camera target?
                // But we passed 'drone'.
                // If drone invisible, maybe use person pos?
                // Let's stick to Drone logic for now as it's a Flight Sim.
                // Or check if 'world.app.mode' is 'person'.
                // But we don't have app ref directly, only world.
            }
        }

        // In Person mode, get object by name since we don't have direct reference here easily
        // (Though App passes 'drone', we might need to find 'Person')
        // Actually, App.init passes 'this.drone' and 'this.world'.
        // World doesn't own Person. App does.
        // But the Person mesh is in the scene.

        let centerPos = this.drone.position;
        let yaw = this.drone.yaw;

        if (!this.drone.mesh.visible) {
             const person = this.scene.getObjectByName('Person');
             if (person) {
                 centerPos = person.position;
                 yaw = person.rotation.y;
             }
        }

        if (!centerPos) return;

        this.draw(centerPos, yaw);
    }

    draw(centerPos, yaw) {
        const ctx = this.ctx;
        const w = this.size;
        const h = this.size;
        const cx = w / 2;
        const cy = h / 2;
        const scale = (w / 2) / this.range; // pixels per meter

        // Clear
        ctx.clearRect(0, 0, w, h);

        // Background (Circular Mask)
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, w/2 - 2, 0, Math.PI * 2);
        ctx.clip();

        // Semi-transparent background
        ctx.fillStyle = 'rgba(0, 20, 40, 0.6)';
        ctx.fillRect(0, 0, w, h);

        // Grid / Circles
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, (w/2) * 0.5, 0, Math.PI * 2);
        ctx.stroke();

        // --- Draw World Objects ---
        // Transform: Translate World -> Relative -> Rotate -> Scale -> Canvas

        // Helper: World (x, z) to Canvas (x, y)
        // Map Orientation: Rotating Map (Forward is Up)
        // If Forward is Up (-Z), then World Z needs to align with Canvas -Y.
        // Rotated by Yaw.

        const drawObject = (x, z, color, size, shape = 'circle') => {
            // Relative pos
            const dx = x - centerPos.x;
            const dz = z - centerPos.z;

            // Rotate by Yaw (to align world with Drone Forward)
            // Drone Forward is -Z (if yaw=0).
            // Canvas Up is -Y.
            // If we want World -Z to be Canvas -Y:
            // rx = dx * cos(-yaw) - dz * sin(-yaw)
            // ry = dx * sin(-yaw) + dz * cos(-yaw)
            // Wait, Standard Rotation matrix:
            // x' = x cos θ - y sin θ
            // y' = x sin θ + y cos θ
            // Here "y" is z.
            // We rotate by +Yaw to counteract drone rotation?
            // If drone turns left (Yaw > 0), world should turn right.
            // So rotate by Yaw.

            const cos = Math.cos(yaw);
            const sin = Math.sin(yaw);

            // World relative coords
            // We want +Z (South) to be Down (+Y) if Yaw=0.
            // So raw mapping: mapX = dx, mapY = dz.

            // Apply Rotation
            const rx = dx * cos - dz * sin;
            const ry = dx * sin + dz * cos;

            // Apply Scale
            const sx = cx + rx * scale;
            const sy = cy + ry * scale;

            // Check bounds (roughly)
            if (sx < -10 || sx > w+10 || sy < -10 || sy > h+10) return;

            ctx.fillStyle = color;
            ctx.beginPath();
            if (shape === 'rect') {
                ctx.fillRect(sx - size/2, sy - size/2, size, size);
            } else {
                ctx.arc(sx, sy, size, 0, Math.PI * 2);
                ctx.fill();
            }
        };

        // Draw Rings
        if (this.ringsManager && this.ringsManager.rings) {
            this.ringsManager.rings.forEach(r => {
                if (!r.collected) {
                     drawObject(r.mesh.position.x, r.mesh.position.z, '#00ffff', 4, 'circle');
                }
            });
        }

        // Draw Landing Pads
        if (this.world.landingPads) {
            this.world.landingPads.forEach(pad => {
                 drawObject(pad.mesh.position.x, pad.mesh.position.z, '#44ff44', 6, 'rect');
            });
        }

        // Draw Player (Fixed Center)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        // Triangle pointing UP
        ctx.moveTo(cx, cy - 6);
        ctx.lineTo(cx - 5, cy + 5);
        ctx.lineTo(cx + 5, cy + 5);
        ctx.fill();

        // North Indicator (N)
        // North is World -Z.
        // We need to find where "North" is on the circle edge.
        // World Vector (0, 0, -1) -> Rotate by Yaw -> Canvas Vector.
        const northDist = (w/2) - 12;
        const cos = Math.cos(yaw);
        const sin = Math.sin(yaw);

        // North is (0, -1) in "World Map Space" (x, z)
        // Rotate (0, -1):
        // nx = 0*cos - (-1)*sin = sin
        // ny = 0*sin + (-1)*cos = -cos
        // So N pos relative to center: (sin * dist, -cos * dist)

        const nx = cx + sin * northDist;
        const ny = cy - cos * northDist;

        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('N', nx, ny);

        ctx.restore();

        // Border ring
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, w/2 - 2, 0, Math.PI * 2);
        ctx.stroke();
    }
}
