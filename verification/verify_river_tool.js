
import * as THREE from 'three';
import { RiverEntity } from '../src/world/entities/infrastructure.js';

// Mock window and app
global.window = {
    app: {
        devMode: {
            enabled: true
        },
        renderer: {
            scene: new THREE.Scene()
        }
    }
};

console.log("Starting River Tool Verification...");

// 1. Create River
const river = new RiverEntity({ x: 0, y: 0, z: 0 });
river.init(); // Calls createMesh
river.postInit(); // Calls _createWaypointVisuals

console.log("River created. Type:", river.type);
console.log("Is Path:", river.mesh.userData.isPath);

if (!river.mesh.userData.isPath) {
    console.error("FAIL: River should be marked as path");
    process.exit(1);
}

// 2. Check Visuals
if (!river.waypointGroup) {
    console.error("FAIL: Waypoint group not created");
    process.exit(1);
}

// Check visibility (mocked devMode.enabled = true)
if (river.waypointGroup.visible !== true) {
    console.error("FAIL: Waypoint group should be visible in DevMode");
    process.exit(1);
} else {
    console.log("PASS: Waypoint group is visible");
}

// 3. Add Waypoint
console.log("Adding waypoint...");
river.mesh.userData.waypoints.push(new THREE.Vector3(10, 0, 10));
river.rebuildGeometry();
river._refreshWaypointVisuals();

// Check marker count
// 1 initial waypoint (from default ctor if empty) + 1 added = 2 waypoints
// + 1 line
const markers = river.waypointGroup.children.filter(c => c.userData.type === 'waypoint');
console.log("Marker count:", markers.length);

if (markers.length !== river.mesh.userData.waypoints.length) {
     console.error(`FAIL: Marker count mismatch. Expected ${river.mesh.userData.waypoints.length}, got ${markers.length}`);
     // Debug: River ctor with empty params adds 1 default waypoint?
     // Yes: if (this.waypoints.length === 0) this.waypoints.push(...)
} else {
    console.log("PASS: Marker count matches waypoints");
}

// 4. Verify Marker Color (Cyan)
const orb = markers[0];
if (orb.material.color.getHex() !== 0x00ffff) {
    console.error("FAIL: Marker color is not Cyan (0x00ffff). Got:", orb.material.color.getHex().toString(16));
} else {
    console.log("PASS: Marker color is Cyan");
}

console.log("Verification Complete.");
