import * as THREE from 'three';
import { VehicleEntity } from './vehicles.js';
import { CONFIG } from '../../config.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export class StreetSweeperEntity extends VehicleEntity {
    constructor(params) {
        super(params);
        this.type = 'streetSweeper';
        // Slower speed for sweeping action
        this.baseSpeed = (CONFIG.DRONE.MAX_SPEED || 18.0) * 0.4;

        // Animation state
        this.brushRotation = 0;
        this.brushes = [];
    }

    static get displayName() { return 'Street Sweeper'; }

    createMesh(params) {
        const modelGroup = new THREE.Group();
        modelGroup.name = 'streetSweeperModel';

        const bodyParts = [];
        const detailParts = [];
        const glassParts = [];

        // --- Materials ---
        const paintColor = params.color || 0xFFFFFF; // White/Clean look default
        const accentColor = 0x2ECC71; // Green for "Eco/Cleaning"

        const bodyMat = new THREE.MeshStandardMaterial({
            color: paintColor,
            roughness: 0.3,
            metalness: 0.2
        });

        const accentMat = new THREE.MeshStandardMaterial({
            color: accentColor,
            roughness: 0.4,
            metalness: 0.1
        });

        const darkMat = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.9,
            metalness: 0.1
        });

        const glassMat = new THREE.MeshStandardMaterial({
            color: 0x88CCFF,
            roughness: 0.1,
            metalness: 0.8,
            opacity: 0.6,
            transparent: true
        });

        const brushMat = new THREE.MeshStandardMaterial({
            color: 0x555555,
            roughness: 1.0
        });

        // --- Geometry Construction ---

        // 1. Main Chassis (Lower body, holding water tank/debris)
        const chassis = new THREE.BoxGeometry(2.0, 1.0, 3.5);
        chassis.translate(0, 0.8, -0.5); // Rear heavy
        bodyParts.push(chassis);

        // 2. Cab (Front)
        const cab = new THREE.BoxGeometry(1.8, 1.4, 1.5);
        cab.translate(0, 1.1, 1.8);
        bodyParts.push(cab);

        // Cab Roof
        const cabRoof = new THREE.BoxGeometry(1.85, 0.1, 1.55);
        cabRoof.translate(0, 1.85, 1.8);
        detailParts.push(cabRoof);

        // 3. Tank/Rear Unit (Rounded top)
        const tank = new THREE.CylinderGeometry(1.0, 1.0, 3.0, 16);
        tank.rotateZ(Math.PI / 2);
        tank.rotateY(Math.PI / 2); // Align with Z axis
        tank.translate(0, 1.3, -0.5);
        bodyParts.push(tank);

        // 4. Wheels (Small, industrial)
        const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.4, 16);
        wheelGeo.rotateZ(Math.PI / 2);

        const wY = 0.35;
        const wX = 0.9;

        // Front Wheels
        const fl = wheelGeo.clone(); fl.translate(wX, wY, 1.8); detailParts.push(fl);
        const fr = wheelGeo.clone(); fr.translate(-wX, wY, 1.8); detailParts.push(fr);

        // Rear Wheels (Dual axle look?)
        const bl = wheelGeo.clone(); bl.translate(wX, wY, -1.2); detailParts.push(bl);
        const br = wheelGeo.clone(); br.translate(-wX, wY, -1.2); detailParts.push(br);

        // 5. Windows
        // Front Windshield
        const windshield = new THREE.BoxGeometry(1.6, 0.8, 0.1);
        windshield.rotateX(-0.1);
        windshield.translate(0, 1.3, 2.56);
        glassParts.push(windshield);

        // Side Windows
        const sideWindow = new THREE.BoxGeometry(0.1, 0.6, 0.8);
        const swLeft = sideWindow.clone(); swLeft.translate(0.91, 1.3, 1.8); glassParts.push(swLeft);
        const swRight = sideWindow.clone(); swRight.translate(-0.91, 1.3, 1.8); glassParts.push(swRight);

        // --- Build Static Meshes ---
        if (bodyParts.length > 0) {
            const bodyMesh = new THREE.Mesh(mergeGeometries(bodyParts), bodyMat);
            bodyMesh.castShadow = true;
            bodyMesh.receiveShadow = true;
            modelGroup.add(bodyMesh);
        }

        if (detailParts.length > 0) {
            const detailMesh = new THREE.Mesh(mergeGeometries(detailParts), darkMat);
            detailMesh.castShadow = true;
            modelGroup.add(detailMesh);
        }

        if (glassParts.length > 0) {
            const glassMesh = new THREE.Mesh(mergeGeometries(glassParts), glassMat);
            modelGroup.add(glassMesh);
        }

        // --- Animated Parts: Brushes ---

        // Front Brushes (Spinning horizontal discs)
        const brushGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.2, 12);
        // Add bristles texture via geometry noise or just simple radial segments

        // Left Brush
        this.leftBrush = new THREE.Mesh(brushGeo, brushMat);
        this.leftBrush.position.set(1.1, 0.2, 2.6); // Stick out front-left
        modelGroup.add(this.leftBrush);
        this.brushes.push(this.leftBrush);

        // Right Brush
        this.rightBrush = new THREE.Mesh(brushGeo, brushMat);
        this.rightBrush.position.set(-1.1, 0.2, 2.6);
        modelGroup.add(this.rightBrush);
        this.brushes.push(this.rightBrush);

        // Roller Brush (Underneath/Rear)
        const rollerGeo = new THREE.CylinderGeometry(0.25, 0.25, 1.8, 12);
        rollerGeo.rotateZ(Math.PI / 2);
        this.rollerBrush = new THREE.Mesh(rollerGeo, brushMat);
        this.rollerBrush.position.set(0, 0.25, 0.5); // Between axles
        modelGroup.add(this.rollerBrush);
        this.brushes.push(this.rollerBrush);

        // --- Lights ---
        // Warning Beacon on top
        const beaconGeo = new THREE.CylinderGeometry(0.15, 0.2, 0.25, 8);
        const beaconMat = new THREE.MeshStandardMaterial({
            color: 0xFFAA00,
            emissive: 0xFF6600,
            emissiveIntensity: 1.0
        });
        const beacon = new THREE.Mesh(beaconGeo, beaconMat);
        beacon.position.set(0, 1.95, 1.5);
        modelGroup.add(beacon);


        return modelGroup;
    }

    update(dt) {
        super.update(dt);

        // Animate Brushes
        const spinSpeed = 10.0;

        if (this.leftBrush) {
            this.leftBrush.rotation.y -= spinSpeed * dt; // Spin inward
        }

        if (this.rightBrush) {
            this.rightBrush.rotation.y += spinSpeed * dt; // Spin inward
        }

        if (this.rollerBrush) {
            this.rollerBrush.rotation.x -= spinSpeed * dt; // Roll against ground
        }
    }
}
