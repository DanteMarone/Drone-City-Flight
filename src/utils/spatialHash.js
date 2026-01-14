// src/utils/spatialHash.js

export class SpatialHash {
    constructor(cellSize) {
        this.cellSize = cellSize;
        this.cells = new Map();
    }

    _getKey(x, z) {
        // Sherlock Fix: Use template strings to avoid hash collisions at large coordinates (> 65k)
        // Previous bit-packing (xi << 16 | zi & 0xFFFF) aliased every 65536 units.
        const xi = Math.floor(x / this.cellSize);
        const zi = Math.floor(z / this.cellSize);
        return `${xi}:${zi}`;
    }

    insert(client, aabb) {
        const minX = Math.floor(aabb.min.x / this.cellSize);
        const maxX = Math.floor(aabb.max.x / this.cellSize);
        const minZ = Math.floor(aabb.min.z / this.cellSize);
        const maxZ = Math.floor(aabb.max.z / this.cellSize);

        for (let x = minX; x <= maxX; x++) {
            for (let z = minZ; z <= maxZ; z++) {
                // Sherlock Fix: Use string keys to prevent aliasing
                const key = `${x}:${z}`;

                if (!this.cells.has(key)) {
                    this.cells.set(key, []);
                }
                this.cells.get(key).push(client);
            }
        }
    }

    query(x, z) {
        const key = this._getKey(x, z);
        return this.cells.get(key) || [];
    }

    clear() {
        this.cells.clear();
    }
}
