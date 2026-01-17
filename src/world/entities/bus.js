import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { VehicleEntity } from './vehicles.js';
import { EntityRegistry } from './registry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { CONFIG } from '../../config.js';

// Scratch vectors for vehicle updates to prevent GC
// Note: We can re-use the ones from vehicles.js ideally, but they are not exported.
// Creating local scratch vectors for BusEntity.
const _targetPos = new THREE.Vector3();
const _localTarget = new THREE.Vector3();
const _currentLocal = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _diff = new THREE.Vector3();

export class BusEntity extends VehicleEntity {
    constructor(params) {
        super(params);
        this.type = 'bus'; // Default, overwritten by subclasses
        this.baseSpeed = (CONFIG.DRONE.MAX_SPEED || 18.0) * 0.6; // Slower than car

        this.waitTime = params?.waitTime ?? 5; // Seconds to wait at each stop
        this.waitTimer = 0;
        this.isWaiting = false;
    }

    postInit() {
        super.postInit();
        if (this.mesh) {
            this.mesh.userData.waitTime = this.waitTime;
            this.mesh.userData.isWaiting = false;
            this.mesh.userData.waitTimer = 0;
        }
    }

    update(dt) {
        if (!this.mesh) return;

        const modelGroup = this.mesh.getObjectByName('modelGroup');
        if (!modelGroup) return;

        // Note: Creating array `path` here [mesh.pos, ...waypoints] is expensive!
        // Optimization: Use index logic like VehicleEntity instead of creating array.
        // VehicleEntity uses:
        //  0 -> mesh.position (Spawn Point)
        //  1 -> waypoints[0]
        //  ...

        const waypoints = this.waypoints;
        const totalPoints = 1 + waypoints.length;

        if (totalPoints < 2) return;

        // Sync params
        const currentWait = this.mesh.userData.waitTime ?? this.waitTime;
        this.waitTime = currentWait;

        // Handle Waiting
        if (this.isWaiting) {
            this.waitTimer -= dt;
            if (this.waitTimer <= 0) {
                this.isWaiting = false;

                // Advance to next waypoint
                let nextIdx = this.mesh.userData.targetIndex + 1;
                if (nextIdx >= totalPoints) {
                    nextIdx = 0; // Loop back to start (Spawn point)
                }
                this.mesh.userData.targetIndex = nextIdx;
            }
            return; // Don't move while waiting
        }

        // Handle Movement
        let targetIdx = this.mesh.userData.targetIndex;
        if (targetIdx === undefined) targetIdx = 1;
        targetIdx = THREE.MathUtils.clamp(targetIdx, 0, totalPoints - 1);

        // Get target position without allocation
        if (targetIdx === 0) {
            _targetPos.copy(this.mesh.position);
        } else {
            _targetPos.copy(waypoints[targetIdx - 1]);
        }

        // Convert Target (World) to Local Space of Vehicle Mesh (Parent)
        _localTarget.copy(_targetPos);
        this.mesh.worldToLocal(_localTarget);

        _currentLocal.copy(modelGroup.position);

        const speed = Math.max(0, this.baseSpeed);
        const moveAmount = speed * dt;
        const moveAmountSq = moveAmount * moveAmount;

        // Bolt Optimization: Use Squared Distance
        _diff.subVectors(_localTarget, _currentLocal);
        const distSq = _diff.lengthSq();

        if (distSq > moveAmountSq) {
             const dist = Math.sqrt(distSq);
             _dir.copy(_diff).multiplyScalar(1 / dist); // Normalize

            modelGroup.position.addScaledVector(_dir, moveAmount);

            // Look at target
            modelGroup.lookAt(_targetPos);

        } else {
            // Arrived
            modelGroup.position.copy(_localTarget);

            // Start Waiting
            this.isWaiting = true;
            this.waitTimer = currentWait;

            // Do NOT increment targetIndex here; wait logic does it.
        }

        // Update Collider Box
        if (this.box || this.boundingSphere) {
            modelGroup.updateMatrixWorld();

            if (this.boundingSphere && this._localSphere) {
                this.boundingSphere.copy(this._localSphere).applyMatrix4(modelGroup.matrixWorld);
            } else if (this.box) {
                if (this._localBox) {
                    this.box.copy(this._localBox).applyMatrix4(modelGroup.matrixWorld);
                } else {
                    this.box.makeEmpty();
                    this.box.expandByObject(modelGroup);
                }
            }
        }
    }

    serialize() {
        const data = super.serialize();
        data.params.waitTime = this.waitTime;
        return data;
    }
}

export class CityBusEntity extends BusEntity {
    constructor(params) {
        super(params);
        this.type = 'cityBus';
    }

    static get displayName() { return 'City Bus'; }

    createMesh(params) {
        const bodyParts = [];
        const detailParts = [];
        const glassParts = [];

        // Colors
        const primaryColor = 0x1E90FF; // Dodger Blue
        const whiteColor = 0xFFFFFF;
        const glassColor = 0x88CCFF;

        // Dimensions
        const width = 2.6;
        const height = 3.2;
        const length = 10.0;
        const wheelY = 0.5;

        // 1. Chassis/Body (Box)
        const bodyGeo = new THREE.BoxGeometry(width, height - 1.0, length);
        bodyGeo.translate(0, 1.0 + (height - 1.0) / 2, 0); // Lift up
        bodyParts.push(bodyGeo);

        // 2. Roof (White top)
        const roofGeo = new THREE.BoxGeometry(width, 0.2, length);
        roofGeo.translate(0, height + 0.1, 0);
        detailParts.push(roofGeo);

        // 3. Windows (Indentations or black/blue strips)
        // Side windows
        const sideWindowGeo = new THREE.BoxGeometry(width + 0.1, 1.2, length - 2.0);
        sideWindowGeo.translate(0, 2.2, 0);
        glassParts.push(sideWindowGeo);

        // Front Windshield
        const frontGlass = new THREE.BoxGeometry(width - 0.2, 1.5, 0.1);
        frontGlass.translate(0, 2.0, length / 2 + 0.05);
        glassParts.push(frontGlass);

        // 4. Wheels
        const wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.6, 16);
        wheelGeo.rotateZ(Math.PI / 2);
        const wX = width / 2 - 0.3;
        const wY = wheelY;
        const wZFront = length / 2 - 1.5;
        const wZBack = -length / 2 + 1.5;

        const fl = wheelGeo.clone(); fl.translate(wX, wY, wZFront); detailParts.push(fl);
        const fr = wheelGeo.clone(); fr.translate(-wX, wY, wZFront); detailParts.push(fr);
        const bl = wheelGeo.clone(); bl.translate(wX, wY, wZBack); detailParts.push(bl);
        const br = wheelGeo.clone(); br.translate(-wX, wY, wZBack); detailParts.push(br);

        // 5. Materials
        const bodyMat = new THREE.MeshStandardMaterial({ color: primaryColor, roughness: 0.4 });
        const detailMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });
        const glassMat = new THREE.MeshStandardMaterial({ color: glassColor, roughness: 0.1, metalness: 0.8 });

        // Merge
        const bodyMesh = new THREE.Mesh(mergeGeometries(bodyParts), bodyMat);
        const detailMesh = new THREE.Mesh(mergeGeometries(detailParts), detailMat);
        const glassMesh = new THREE.Mesh(mergeGeometries(glassParts), glassMat);

        bodyMesh.castShadow = true;
        detailMesh.castShadow = true;

        const modelGroup = new THREE.Group();
        modelGroup.name = 'modelGroup';
        modelGroup.add(bodyMesh);
        modelGroup.add(detailMesh);
        modelGroup.add(glassMesh);

        // Wrapper
        const group = new THREE.Group();
        group.add(modelGroup);
        return group;
    }
}

export class SchoolBusEntity extends BusEntity {
    constructor(params) {
        super(params);
        this.type = 'schoolBus';
    }

    static get displayName() { return 'School Bus'; }

    createMesh(params) {
        const yellowParts = [];
        const blackParts = [];
        const glassParts = [];

        const busYellow = 0xFFD700; // Gold
        const bumperBlack = 0x222222;

        const width = 2.5;
        const height = 3.0;
        const length = 9.0;

        // 1. Main Body
        const bodyGeo = new THREE.BoxGeometry(width, 2.2, length - 1.5);
        bodyGeo.translate(0, 1.6, -0.5); // Shift back for hood
        yellowParts.push(bodyGeo);

        // 2. Hood (Front)
        const hoodGeo = new THREE.BoxGeometry(width - 0.4, 1.2, 1.5);
        hoodGeo.translate(0, 1.1, length / 2 - 0.75);
        yellowParts.push(hoodGeo);

        // 3. Roof Rounded bumps (simple scaling)
        // Skipping complex curves, just standard box for now.

        // 4. Black Stripes
        const stripeGeo = new THREE.BoxGeometry(width + 0.05, 0.2, length - 1.4);
        stripeGeo.translate(0, 1.8, -0.5);
        blackParts.push(stripeGeo);

        // 5. Bumpers
        const bumperGeo = new THREE.BoxGeometry(width, 0.4, 0.3);
        const frontB = bumperGeo.clone(); frontB.translate(0, 0.6, length / 2 + 0.1); blackParts.push(frontB);
        const rearB = bumperGeo.clone(); rearB.translate(0, 0.6, -length / 2 + 0.1); blackParts.push(rearB);

        // 6. Stop Sign (Paddle on left)
        const paddleGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.05, 8);
        paddleGeo.rotateZ(Math.PI / 2); // Flat facing side
        // paddleGeo.rotateY(Math.PI / 6); // Folded out slightly? Or flush. Let's make it flush.
        paddleGeo.translate(width / 2 + 0.05, 2.0, 1.0);
        // We'll make it red later, but for now let's just add it to black parts or separate?
        // Let's make a separate red material for it.

        // 7. Wheels
        const wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.6, 16);
        wheelGeo.rotateZ(Math.PI / 2);
        const wX = width / 2 - 0.3;
        const wY = 0.5;
        const wZFront = length / 2 - 2.0;
        const wZBack = -length / 2 + 1.2;

        const fl = wheelGeo.clone(); fl.translate(wX, wY, wZFront); blackParts.push(fl);
        const fr = wheelGeo.clone(); fr.translate(-wX, wY, wZFront); blackParts.push(fr);
        const bl = wheelGeo.clone(); bl.translate(wX, wY, wZBack); blackParts.push(bl);
        const br = wheelGeo.clone(); br.translate(-wX, wY, wZBack); blackParts.push(br);

        // 8. Windows
        const sideWinGeo = new THREE.BoxGeometry(width + 0.1, 0.8, length - 2.0);
        sideWinGeo.translate(0, 2.4, -0.5);
        glassParts.push(sideWinGeo);

        const frontWinGeo = new THREE.BoxGeometry(width - 0.5, 0.8, 0.1);
        frontWinGeo.translate(0, 2.4, length/2 - 1.5 + 0.75 + 0.1); // Back of hood
        glassParts.push(frontWinGeo);


        // Materials
        const yellowMat = new THREE.MeshStandardMaterial({ color: busYellow, roughness: 0.5 });
        const blackMat = new THREE.MeshStandardMaterial({ color: bumperBlack, roughness: 0.9 });
        const glassMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.2 });
        const redMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });

        const yellowMesh = new THREE.Mesh(mergeGeometries(yellowParts), yellowMat);
        const blackMesh = new THREE.Mesh(mergeGeometries(blackParts), blackMat);
        const glassMesh = new THREE.Mesh(mergeGeometries(glassParts), glassMat);
        const stopSign = new THREE.Mesh(paddleGeo, redMat);

        yellowMesh.castShadow = true;
        blackMesh.castShadow = true;

        const modelGroup = new THREE.Group();
        modelGroup.name = 'modelGroup';
        modelGroup.add(yellowMesh);
        modelGroup.add(blackMesh);
        modelGroup.add(glassMesh);
        modelGroup.add(stopSign);

        const group = new THREE.Group();
        group.add(modelGroup);
        return group;
    }
}

EntityRegistry.register('cityBus', CityBusEntity);
EntityRegistry.register('schoolBus', SchoolBusEntity);
