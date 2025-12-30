
const { performance } = require('perf_hooks');

class SpatialHashString {
    constructor(cellSize) {
        this.cellSize = cellSize;
        this.cells = new Map();
    }

    _getKey(x, z) {
        const xi = Math.floor(x / this.cellSize);
        const zi = Math.floor(z / this.cellSize);
        return `${xi},${zi}`;
    }

    insert(client, aabb) {
        const minX = Math.floor(aabb.min.x / this.cellSize);
        const maxX = Math.floor(aabb.max.x / this.cellSize);
        const minZ = Math.floor(aabb.min.z / this.cellSize);
        const maxZ = Math.floor(aabb.max.z / this.cellSize);

        for (let x = minX; x <= maxX; x++) {
            for (let z = minZ; z <= maxZ; z++) {
                const key = this._getKey(x * this.cellSize, z * this.cellSize);
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
}

class SpatialHashInt {
    constructor(cellSize) {
        this.cellSize = cellSize;
        this.cells = new Map();
    }

    _getKey(x, z) {
        const xi = Math.floor(x / this.cellSize);
        const zi = Math.floor(z / this.cellSize);
        // Pack into 32-bit int: 16 bits for X, 16 bits for Z
        // Shift by 16 for X, mask 0xFFFF for Z
        // Note: bitwise ops in JS result in signed 32-bit int
        return (xi << 16) | (zi & 0xFFFF);
    }

    insert(client, aabb) {
        const minX = Math.floor(aabb.min.x / this.cellSize);
        const maxX = Math.floor(aabb.max.x / this.cellSize);
        const minZ = Math.floor(aabb.min.z / this.cellSize);
        const maxZ = Math.floor(aabb.max.z / this.cellSize);

        for (let x = minX; x <= maxX; x++) {
            for (let z = minZ; z <= maxZ; z++) {
                 // Inline key generation for speed in tight loop?
                 // Or just use _getKey but we need to pass world coords or pre-calculated indices.
                 // The original _getKey took world coords.
                 // Let's adapt _getKey to take indices for fairness or keep it same.
                 // To match original logic: _getKey takes world coords.

                 // But wait, the loop variables x, z ARE INDICES here.
                 // Original: this._getKey(x * this.cellSize, z * this.cellSize) is weird/redundant?
                 // Original _getKey does: floor( (x * cell) / cell ) = floor(x) = x.
                 // So we can pass indices directly if we overload or change _getKey.

                 // Let's stick to the method signature for now, but optimize internal.
                 const key = (x << 16) | (z & 0xFFFF);

                if (!this.cells.has(key)) {
                    this.cells.set(key, []);
                }
                this.cells.get(key).push(client);
            }
        }
    }

    query(x, z) {
        const xi = Math.floor(x / this.cellSize);
        const zi = Math.floor(z / this.cellSize);
        const key = (xi << 16) | (zi & 0xFFFF);
        return this.cells.get(key) || [];
    }
}

// Mock Three.js Box3
const mockBox = { min: { x: 0, z: 0 }, max: { x: 50, z: 50 } };

function runBenchmark() {
    const ITERATIONS = 100000;
    const INSERT_OPS = 1000;

    console.log(`Running Benchmark: ${ITERATIONS} queries, ${INSERT_OPS} inserts...`);

    // --- String Hash ---
    const shString = new SpatialHashString(100);
    const startString = performance.now();

    for (let i = 0; i < INSERT_OPS; i++) {
        // Random box
        const x = Math.random() * 10000;
        const z = Math.random() * 10000;
        const box = { min: { x: x, z: z }, max: { x: x + 50, z: z + 50 } };
        shString.insert({}, box);
    }

    for (let i = 0; i < ITERATIONS; i++) {
        shString.query(Math.random() * 10000, Math.random() * 10000);
    }

    const endString = performance.now();
    console.log(`String Key Time: ${(endString - startString).toFixed(2)}ms`);

    // --- Int Hash ---
    const shInt = new SpatialHashInt(100);
    const startInt = performance.now();

    for (let i = 0; i < INSERT_OPS; i++) {
        const x = Math.random() * 10000;
        const z = Math.random() * 10000;
        const box = { min: { x: x, z: z }, max: { x: x + 50, z: z + 50 } };
        shInt.insert({}, box);
    }

    for (let i = 0; i < ITERATIONS; i++) {
        shInt.query(Math.random() * 10000, Math.random() * 10000);
    }

    const endInt = performance.now();
    console.log(`Int Key Time: ${(endInt - startInt).toFixed(2)}ms`);

    console.log(`Improvement: ${((endString - startString) / (endInt - startInt)).toFixed(2)}x faster`);
}

runBenchmark();
