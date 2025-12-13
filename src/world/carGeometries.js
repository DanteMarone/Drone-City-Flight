import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export function createSedanGeometry() {
    const bodyParts = [];
    const detailParts = [];

    // Chassis
    const chassis = new THREE.BoxGeometry(1.8, 0.5, 4.2);
    chassis.translate(0, 0.5, 0);
    bodyParts.push(chassis);

    // Cabin
    const cabin = new THREE.BoxGeometry(1.6, 0.6, 2.2);
    cabin.translate(0, 1.0, -0.2); // Shifted back slightly
    bodyParts.push(cabin);

    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.4, 16);
    wheelGeo.rotateZ(Math.PI / 2);
    const wX = 0.8, wY = 0.35, wZ = 1.3;

    const fl = wheelGeo.clone(); fl.translate(wX, wY, wZ); detailParts.push(fl);
    const fr = wheelGeo.clone(); fr.translate(-wX, wY, wZ); detailParts.push(fr);
    const bl = wheelGeo.clone(); bl.translate(wX, wY, -wZ); detailParts.push(bl);
    const br = wheelGeo.clone(); br.translate(-wX, wY, -wZ); detailParts.push(br);

    // Bumpers / Grill
    const bumper = new THREE.BoxGeometry(1.8, 0.3, 0.2);
    const frontB = bumper.clone(); frontB.translate(0, 0.4, 2.15); detailParts.push(frontB);
    const backB = bumper.clone(); backB.translate(0, 0.4, -2.15); detailParts.push(backB);

    // Windshield
    const windshield = new THREE.BoxGeometry(1.5, 0.5, 0.1);
    windshield.rotateX(-Math.PI / 6);
    windshield.translate(0, 1.05, 0.95);
    detailParts.push(windshield);

    return {
        body: mergeGeometries(bodyParts),
        details: mergeGeometries(detailParts)
    };
}

export function createSUVGeometry() {
    const bodyParts = [];
    const detailParts = [];

    // Chassis (Boxier)
    const chassis = new THREE.BoxGeometry(2.0, 0.7, 4.6);
    chassis.translate(0, 0.75, 0); // Higher ground clearance
    bodyParts.push(chassis);

    // Cabin (Full length almost)
    const cabin = new THREE.BoxGeometry(1.9, 0.8, 3.5);
    cabin.translate(0, 1.5, -0.2);
    bodyParts.push(cabin);

    // Wheels (Bigger)
    const wheelGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.5, 16);
    wheelGeo.rotateZ(Math.PI / 2);
    const wX = 0.9, wY = 0.45, wZ = 1.5;

    const fl = wheelGeo.clone(); fl.translate(wX, wY, wZ); detailParts.push(fl);
    const fr = wheelGeo.clone(); fr.translate(-wX, wY, wZ); detailParts.push(fr);
    const bl = wheelGeo.clone(); bl.translate(wX, wY, -wZ); detailParts.push(bl);
    const br = wheelGeo.clone(); br.translate(-wX, wY, -wZ); detailParts.push(br);

    // Windows
    const sideWin = new THREE.BoxGeometry(1.95, 0.6, 3.0);
    sideWin.translate(0, 1.5, -0.2);
    detailParts.push(sideWin);

    return {
        body: mergeGeometries(bodyParts),
        details: mergeGeometries(detailParts)
    };
}
