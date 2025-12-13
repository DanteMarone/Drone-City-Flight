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

export function createPickupGeometry() {
    const bodyParts = [];
    const detailParts = [];

    // Chassis
    const chassis = new THREE.BoxGeometry(2.0, 0.6, 4.8);
    chassis.translate(0, 0.7, 0); // High clearance
    bodyParts.push(chassis);

    // Cabin (Front half only)
    const cabin = new THREE.BoxGeometry(1.9, 0.75, 1.8);
    cabin.translate(0, 1.35, 0.8); // Forward
    bodyParts.push(cabin);

    // Bed Walls
    // Left
    const bedL = new THREE.BoxGeometry(0.15, 0.5, 2.0);
    bedL.translate(0.9, 1.2, -1.3);
    bodyParts.push(bedL);
    // Right
    const bedR = new THREE.BoxGeometry(0.15, 0.5, 2.0);
    bedR.translate(-0.9, 1.2, -1.3);
    bodyParts.push(bedR);
    // Back (Tailgate)
    const bedB = new THREE.BoxGeometry(1.9, 0.5, 0.15);
    bedB.translate(0, 1.2, -2.3);
    bodyParts.push(bedB);
    // Front of bed (behind cabin)
    const bedF = new THREE.BoxGeometry(1.9, 0.5, 0.15);
    bedF.translate(0, 1.2, -0.2);
    bodyParts.push(bedF);

    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.5, 16);
    wheelGeo.rotateZ(Math.PI / 2);
    const wX = 0.9, wY = 0.42, wZ = 1.6;

    const fl = wheelGeo.clone(); fl.translate(wX, wY, wZ); detailParts.push(fl);
    const fr = wheelGeo.clone(); fr.translate(-wX, wY, wZ); detailParts.push(fr);
    const bl = wheelGeo.clone(); bl.translate(wX, wY, -wZ); detailParts.push(bl);
    const br = wheelGeo.clone(); br.translate(-wX, wY, -wZ); detailParts.push(br);

    // Windows / Windshield
    const windShield = new THREE.BoxGeometry(1.7, 0.5, 0.1);
    windShield.rotateX(-Math.PI / 6);
    windShield.translate(0, 1.4, 1.65);
    detailParts.push(windShield);

    return {
        body: mergeGeometries(bodyParts),
        details: mergeGeometries(detailParts)
    };
}

export function createBicycleMesh() {
    const group = new THREE.Group();

    // Materials
    const frameMat = new THREE.MeshStandardMaterial({ color: 0xaa0000, roughness: 0.5, metalness: 0.8 });
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });
    const riderMat = new THREE.MeshStandardMaterial({ color: 0x224488, roughness: 0.8 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xffccaa, roughness: 0.8 });

    // --- Bicycle ---
    // Wheels (Thin cylinders)
    const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.05, 16);
    wheelGeo.rotateZ(Math.PI / 2);

    const wheelFront = new THREE.Mesh(wheelGeo, wheelMat);
    wheelFront.position.set(0, 0.35, 0.7);
    group.add(wheelFront);

    const wheelBack = new THREE.Mesh(wheelGeo, wheelMat);
    wheelBack.position.set(0, 0.35, -0.7);
    group.add(wheelBack);

    // Frame (Simple lines/boxes)
    const frameGeo = new THREE.BoxGeometry(0.05, 0.05, 1.4); // Main bar
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.set(0, 0.6, 0);
    group.add(frame);

    const seatPostGeo = new THREE.BoxGeometry(0.05, 0.6, 0.05);
    const seatPost = new THREE.Mesh(seatPostGeo, frameMat);
    seatPost.position.set(0, 0.6, -0.3);
    seatPost.rotation.x = -0.2;
    group.add(seatPost);

    const forkGeo = new THREE.BoxGeometry(0.05, 0.6, 0.05);
    const fork = new THREE.Mesh(forkGeo, frameMat);
    fork.position.set(0, 0.5, 0.7);
    fork.rotation.x = 0.2;
    group.add(fork);

    // Handlebars
    const handleGeo = new THREE.BoxGeometry(0.6, 0.05, 0.05);
    const handle = new THREE.Mesh(handleGeo, frameMat);
    handle.position.set(0, 0.9, 0.65);
    group.add(handle);

    // --- Rider ---
    const riderGroup = new THREE.Group();
    riderGroup.position.set(0, 0.8, -0.3); // Seat position

    // Torso
    const torsoGeo = new THREE.BoxGeometry(0.4, 0.5, 0.2);
    const torso = new THREE.Mesh(torsoGeo, riderMat);
    torso.position.y = 0.25;
    torso.rotation.x = 0.2; // Leaning forward slightly
    riderGroup.add(torso);

    // Head
    const headGeo = new THREE.BoxGeometry(0.2, 0.25, 0.2);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.set(0, 0.6, 0.1);
    riderGroup.add(head);

    // Arms (Simple boxes reaching to handlebars)
    const armGeo = new THREE.BoxGeometry(0.1, 0.4, 0.1);
    const leftArm = new THREE.Mesh(armGeo, skinMat);
    leftArm.position.set(0.25, 0.4, 0.3);
    leftArm.rotation.x = -0.8; // Reach forward
    leftArm.rotation.z = -0.2;
    riderGroup.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, skinMat);
    rightArm.position.set(-0.25, 0.4, 0.3);
    rightArm.rotation.x = -0.8;
    rightArm.rotation.z = 0.2;
    riderGroup.add(rightArm);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.12, 0.5, 0.12);
    const leftLeg = new THREE.Mesh(legGeo, riderMat);
    leftLeg.position.set(0.15, -0.1, 0.1);
    leftLeg.rotation.x = -0.2;
    riderGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, riderMat);
    rightLeg.position.set(-0.15, -0.1, 0.1);
    rightLeg.rotation.x = -0.2;
    riderGroup.add(rightLeg);

    group.add(riderGroup);

    return group;
}
