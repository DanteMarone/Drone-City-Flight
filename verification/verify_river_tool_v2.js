
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

console.log("Starting River Tool Verification 2...");

// 1. Create River
const river = new RiverEntity({ x: 0, y: 0, z: 0 });
river.init();
river.postInit();

// 2. Check Visibility (Enabled)
if (river.waypointGroup.visible !== true) {
    console.error("FAIL: Waypoint group should be visible in DevMode");
    process.exit(1);
} else {
    console.log("PASS: Waypoint group is visible in DevMode");
}

// 3. Check Visibility (Disabled)
global.window.app.devMode.enabled = false;
river._refreshWaypointVisuals(); // Trigger refresh
if (river.waypointGroup.visible !== false) {
    console.error("FAIL: Waypoint group should be hidden when DevMode is disabled");
    process.exit(1);
} else {
    console.log("PASS: Waypoint group is hidden in Normal Mode");
}

// Reset DevMode
global.window.app.devMode.enabled = true;
river._refreshWaypointVisuals();

// 4. Test Deletion Logic (Mocking DevMode behavior)
// DevMode.deleteSelected handles splicing and rebuilding.
// Since we don't have full DevMode loaded here (it has many deps),
// we verified the code logic in DevMode.js previously.
// But we can check if `rebuildGeometry` actually works with removed points.

console.log("Waypoints before:", river.mesh.userData.waypoints.length);
const originalGeo = river.mesh.geometry;

// Remove a point manually (simulating what DevMode does)
river.mesh.userData.waypoints.pop();
console.log("Waypoints after pop:", river.mesh.userData.waypoints.length);

river.rebuildGeometry();

if (river.mesh.geometry === originalGeo) {
     // Actually it assigns a new geometry object
     console.error("FAIL: Geometry was not updated (ref equality check)");
} else {
     console.log("PASS: Geometry regenerated");
}

console.log("Verification 2 Complete.");
