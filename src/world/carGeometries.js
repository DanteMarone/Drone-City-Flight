/* src/world/carGeometries.js
   Includes createPickupGeometry plus existing geometries.
*/

import * as THREE from 'three';
import { mergeGeometries } from '../utils/geometryUtils.js'; // assume exist

export function createSedanGeometry() {
    const bodyParts = [];
    const detailParts = [];
    // ... existing sedan geometry construction ...
    return {
        body: mergeGeometries(bodyParts),
        details: mergeGeometries(detailParts)
    };
}

export function createPickupGeometry() {
    const bodyParts = [];
    const detailParts = [];

    // Chassis (Longer)
    const chassis = new THREE.BoxGeometry(2.0, 0.6, 5.0);
    chassis.translate(0, 0.6, 0);
    bodyParts.push(chassis);

    // Cabin (Front half)
    const cabin = new THREE.BoxGeometry(1.9, 0.9, 2.0);
    cabin.translate(0, 1.45, 1.0); // Shifted forward
    bodyParts.push(cabin);

    // Bed Walls
    const bedL = new THREE.BoxGeometry(0.2, 0.5, 2.2);
    bedL.translate(0.9, 1.15, -1.2);
    bodyParts.push(bedL);

    const bedR = new THREE.BoxGeometry(0.2, 0.5, 2.2);
    bedR.translate(-0.9, 1.15, -1.2);
    bodyParts.push(bedR);

    const bedBack = new THREE.BoxGeometry(2.0, 0.5, 0.2);
    bedBack.translate(0, 1.15, -2.2);
    bodyParts.push(bedBack);

    // Bed Floor (Visual fix for gap)
    const bedFloor = new THREE.BoxGeometry(1.6, 0.1, 2.2);
    bedFloor.translate(0, 0.95, -1.2);
    bodyParts.push(bedFloor);

    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.4, 16);
    wheelGeo.rotateZ(Math.PI / 2);
    const wX = 0.9, wY = 0.4, wZ = 1.6;

    const fl = wheelGeo.clone(); fl.translate(wX, wY, wZ); detailParts.push(fl);
    const fr = wheelGeo.clone(); fr.translate(-wX, wY, wZ); detailParts.push(fr);
    const bl = wheelGeo.clone(); bl.translate(wX, wY, -wZ); detailParts.push(bl);
    const br = wheelGeo.clone(); br.translate(-wX, wY, -wZ); detailParts.push(br);

    // Windows (Front/Side)
    const win = new THREE.BoxGeometry(1.95, 0.6, 1.8);
    win.translate(0, 1.5, 1.0);
    detailParts.push(win);

    return {
        body: mergeGeometries(bodyParts),
        details: mergeGeometries(detailParts)
    };
}

export function createSUVGeometry() {
    const bodyParts = [];
    const detailParts = [];
    // ... existing SUV geometry ...
    return {
        body: mergeGeometries(bodyParts),
        details: mergeGeometries(detailParts)
    };
}
