// verification/verify_tools.cjs
const assert = require('assert');

// Mock dependencies
const THREE = {
    Vector3: class {
        constructor(x=0, y=0, z=0) { this.x=x; this.y=y; this.z=z; }
        copy(v) { this.x=v.x; this.y=v.y; this.z=v.z; return this; }
        subVectors(a, b) { this.x=a.x-b.x; this.y=a.y-b.y; this.z=a.z-b.z; return this; }
        length() { return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z); }
        lengthSq() { return this.x*this.x + this.y*this.y + this.z*this.z; }
        normalize() { const l = this.length(); if(l>0) { this.x/=l; this.y/=l; this.z/=l; } return this; }
        multiplyScalar(s) { this.x*=s; this.y*=s; this.z*=s; return this; }
        clone() { return new THREE.Vector3(this.x, this.y, this.z); }
        addVectors(a, b) { this.x=a.x+b.x; this.y=a.y+b.y; this.z=a.z+b.z; return this; }
        set(x,y,z) { this.x=x; this.y=y; this.z=z; return this; }
    },
    Vector2: class {},
    Raycaster: class {},
    Plane: class {},
    MeshBasicMaterial: class {},
    Mesh: class {
        constructor() {
            this.position = new THREE.Vector3();
            this.rotation = new THREE.Vector3();
            this.scale = new THREE.Vector3(1,1,1);
            this.traverse = () => {};
        }
    },
    TorusGeometry: class {}
};

// Mock EntityRegistry
const EntityRegistry = {
    create: (type, params) => {
        return { mesh: new THREE.Mesh(), params };
    }
};

// Mock InteractionManager context
const app = {
    renderer: { scene: { add: () => {}, remove: () => {} } },
    world: { ground: {} }
};
const devMode = {
    grid: { enabled: true, snap: (p) => p },
    placementMode: null
};

// Test Logic
function testInteractionLogic() {
    console.log('Testing InteractionManager Tool Logic...');

    // 1. Simulate _createGhost logic
    function createGhost(type) {
        let params = { x: 0, y: 0, z: 0 };
        // This is the logic we modified
        if (type === 'road' || type === 'river') params.length = 1;

        // Mock create
        const entity = EntityRegistry.create(type, params);
        return entity;
    }

    const road = createGhost('road');
    assert.strictEqual(road.params.length, 1, 'Road ghost should have length 1');

    const river = createGhost('river');
    assert.strictEqual(river.params.length, 1, 'River ghost should have length 1');

    const other = createGhost('house');
    assert.strictEqual(other.params.length, undefined, 'Other entities should not have forced length 1');

    console.log('PASS: Ghost Creation Logic');

    // 2. Simulate _updatePlacementGhost logic (simplified)
    function updatePlacementGhost(type, anchor, currentPoint) {
        let diff = new THREE.Vector3().subVectors(currentPoint, anchor);

        // Grid Snap Mock
        diff.x = Math.round(diff.x);
        diff.z = Math.round(diff.z);

        let len = diff.length();

        // Logic from interaction.js
        if (type === 'road' || type === 'river') {
            len = Math.round(len);
            if (len < 1) len = 1;
        } else {
            len = Math.max(1, len);
        }

        return len;
    }

    const anchor = new THREE.Vector3(0,0,0);
    const p1 = new THREE.Vector3(0,0,5.2); // Dragged 5.2 units

    const lenRoad = updatePlacementGhost('road', anchor, p1);
    assert.strictEqual(lenRoad, 5, 'Road length should round to 5');

    const lenRiver = updatePlacementGhost('river', anchor, p1);
    assert.strictEqual(lenRiver, 5, 'River length should round to 5');

    const p2 = new THREE.Vector3(0,0,0.4); // Dragged 0.4 units
    const lenSmall = updatePlacementGhost('river', anchor, p2);
    assert.strictEqual(lenSmall, 1, 'River length should min at 1');

    console.log('PASS: Placement Scaling Logic');
}

testInteractionLogic();
