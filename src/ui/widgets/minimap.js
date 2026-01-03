export class Minimap {
    constructor() {
        this.container = null;
        this.canvas = null;
        this.ctx = null;
        this.size = 200; // px
        this.range = 250; // meters radius

        this._createDOM();
    }

    _createDOM() {
        this.container = document.createElement('div');
        this.container.className = 'hud-minimap';

        this.canvas = document.createElement('canvas');
        this.canvas.width = this.size;
        this.canvas.height = this.size;
        this.ctx = this.canvas.getContext('2d');

        const border = document.createElement('div');
        border.className = 'hud-minimap-border';

        this.container.appendChild(this.canvas);
        this.container.appendChild(border);
    }

    /**
     * Update the minimap
     * @param {THREE.Vector3} playerPos
     * @param {number} playerRotationY
     * @param {Array} entities - List of entities to render
     */
    update(playerPos, playerRotationY, entities) {
        if (!this.ctx || !entities) return;

        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        const center = width / 2;
        const scale = (width / 2) / this.range; // pixels per meter

        // Clear
        ctx.clearRect(0, 0, width, height);

        // Draw Radar Gradient Background
        const gradient = ctx.createRadialGradient(center, center, 5, center, center, center);
        gradient.addColorStop(0, 'rgba(0, 20, 0, 0.8)');
        gradient.addColorStop(1, 'rgba(0, 40, 0, 0.9)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Draw Grid Rings
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(center, center, width * 0.25, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(center, center, width * 0.45, 0, Math.PI * 2);
        ctx.stroke();

        // North-Up Orientation
        // The map itself is static (North is Up), only the player cursor rotates.

        // Draw Entities relative to player
        // We only draw entities within range
        const pX = playerPos.x;
        const pZ = playerPos.z;

        entities.forEach(ent => {
            if (!ent.mesh) return;

            const dx = ent.mesh.position.x - pX;
            const dz = ent.mesh.position.z - pZ;

            // Distance check
            const distSq = dx*dx + dz*dz;
            if (distSq > this.range * this.range) return;

            // Map to canvas
            // North (Negative Z) should be Up (Negative Y)
            const mapX = center + dx * scale;
            const mapY = center + dz * scale;

            // Type based styling
            const type = ent.mesh.userData.type || 'unknown';

            ctx.fillStyle = this._getColorForType(type);

            // Draw dot
            const size = this._getSizeForType(type);
            ctx.beginPath();
            if (type.includes('building') || type.includes('factory')) {
                ctx.fillRect(mapX - size/2, mapY - size/2, size, size);
            } else {
                ctx.arc(mapX, mapY, size, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        // Draw Player Arrow
        ctx.save();
        ctx.translate(center, center);
        ctx.rotate(-playerRotationY); // Rotate arrow to match player heading
        ctx.fillStyle = '#0ff';
        ctx.beginPath();
        ctx.moveTo(0, -6);
        ctx.lineTo(4, 4);
        ctx.lineTo(0, 2);
        ctx.lineTo(-4, 4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    _getColorForType(type) {
        if (type.includes('building')) return '#888';
        if (type === 'road') return '#333';
        if (type === 'river') return '#44f';
        if (type === 'tree') return '#282';
        if (type === 'vehicle' || type.includes('car')) return '#fa0';
        if (type === 'landingPad') return '#0f0';
        return '#aaa';
    }

    _getSizeForType(type) {
        if (type.includes('building')) return 6;
        if (type === 'tree') return 2;
        if (type === 'vehicle') return 3;
        if (type === 'landingPad') return 5;
        return 2;
    }
}
