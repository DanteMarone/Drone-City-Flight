import * as THREE from 'three';
import { BaseEntity } from './base.js';
import { EntityRegistry } from './registry.js';

export class IndustrialGeneratorEntity extends BaseEntity {
    constructor(params = {}) {
        super(params);
        this.type = 'industrialGenerator';
        this._time = Math.random() * 100;
        this._exhaustFlap = null;
        this._fanGroup = null;
        this._statusLightMat = null;
    }

    static get displayName() { return 'Industrial Generator'; }

    createMesh(params) {
        const group = new THREE.Group();

        const length = 3.2;
        const width = 1.4;
        const height = 1.8;

        // Materials
        const mainColor = params.color || 0xdcb439; // Industrial Yellow
        const metalColor = 0x333333;
        const grilleColor = 0x222222;

        const enclosureMat = new THREE.MeshStandardMaterial({
            color: mainColor,
            roughness: 0.6,
            metalness: 0.3
        });

        const darkMetalMat = new THREE.MeshStandardMaterial({
            color: metalColor,
            roughness: 0.7,
            metalness: 0.6
        });

        const grilleMat = new THREE.MeshStandardMaterial({
            color: grilleColor,
            roughness: 0.8,
            metalness: 0.2
        });

        // 1. Skid (Base)
        const beamGeo = new THREE.BoxGeometry(length + 0.4, 0.2, 0.2);
        const beamLeft = new THREE.Mesh(beamGeo, darkMetalMat);
        beamLeft.position.set(0, 0.1, width / 2 - 0.1);
        beamLeft.castShadow = true;
        beamLeft.receiveShadow = true;
        group.add(beamLeft);

        const beamRight = beamLeft.clone();
        beamRight.position.z = -width / 2 + 0.1;
        group.add(beamRight);

        // Cross members
        const crossGeo = new THREE.BoxGeometry(0.2, 0.15, width - 0.4);
        const cross1 = new THREE.Mesh(crossGeo, darkMetalMat);
        cross1.position.set(-length/2 + 0.2, 0.15, 0);
        group.add(cross1);
        const cross2 = cross1.clone();
        cross2.position.x = length/2 - 0.2;
        group.add(cross2);

        // 2. Enclosure (Main Body)
        // Main block
        const bodyGeo = new THREE.BoxGeometry(length, height, width);
        const body = new THREE.Mesh(bodyGeo, enclosureMat);
        body.position.set(0, 0.2 + height / 2, 0);
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);

        // 3. Details (Doors/Access Panels)
        // Add slightly extruded planes for doors on sides
        const doorGeo = new THREE.PlaneGeometry(length / 3 - 0.1, height - 0.4);
        const doorMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(mainColor).offsetHSL(0, 0, -0.05),
            roughness: 0.7,
            metalness: 0.3,
            side: THREE.DoubleSide
        });

        [-1, 1].forEach(side => {
            for(let i=0; i<3; i++) {
                const door = new THREE.Mesh(doorGeo, doorMat);
                door.position.set(
                    (i - 1) * (length/3),
                    body.position.y,
                    (width/2 + 0.01) * side
                );
                if (side === 1) door.rotation.y = 0; // Front
                else door.rotation.y = Math.PI;      // Back
                group.add(door);

                // Handle
                const handle = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.2, 0.05), darkMetalMat);
                handle.position.set(
                    door.position.x + 0.3,
                    door.position.y,
                    door.position.z + 0.02 * side
                );
                group.add(handle);
            }
        });

        // 4. Radiator Grille (Front Z+) -> Actually let's put it on X+ end
        // Recess for radiator
        // We'll just put a box on the end
        const radiatorBox = new THREE.Mesh(new THREE.BoxGeometry(0.1, height - 0.2, width - 0.2), grilleMat);
        radiatorBox.position.set(length/2 + 0.05, body.position.y, 0);
        group.add(radiatorBox);

        // Fan (Behind Grille - implied or simple visible fan)
        this._fanGroup = new THREE.Group();
        this._fanGroup.position.set(length/2 + 0.06, body.position.y, 0);
        this._fanGroup.rotation.y = Math.PI / 2;
        group.add(this._fanGroup);

        const bladeGeo = new THREE.BoxGeometry(0.1, 1.0, 0.02);
        const blade1 = new THREE.Mesh(bladeGeo, darkMetalMat);
        const blade2 = blade1.clone();
        blade2.rotation.z = Math.PI / 2;
        this._fanGroup.add(blade1, blade2);

        // 5. Control Panel (Back X-)
        const panelBox = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.8, 0.6), darkMetalMat);
        panelBox.position.set(-length/2 - 0.15, body.position.y + 0.2, 0);
        panelBox.castShadow = true;
        panelBox.receiveShadow = true;
        group.add(panelBox);

        // Screen (Emissive)
        const screenGeo = new THREE.PlaneGeometry(0.4, 0.25);
        this._statusLightMat = new THREE.MeshStandardMaterial({
            color: 0x00ff00,
            emissive: 0x00ff00,
            emissiveIntensity: 1.0,
            roughness: 0.2
        });
        const screen = new THREE.Mesh(screenGeo, this._statusLightMat);
        screen.rotation.y = -Math.PI / 2;
        screen.position.set(-length/2 - 0.31, body.position.y + 0.35, 0);
        group.add(screen);

        // 6. Exhaust Stack
        const pipeRadius = 0.12;
        const pipeHeight = 0.8;
        const pipeGeo = new THREE.CylinderGeometry(pipeRadius, pipeRadius, pipeHeight, 16);
        const pipeMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.5, metalness: 0.7 });

        const exhaustGroup = new THREE.Group();
        exhaustGroup.position.set(-length/3, body.position.y + height/2, width/4);
        group.add(exhaustGroup);

        const pipe = new THREE.Mesh(pipeGeo, pipeMat);
        pipe.position.y = pipeHeight / 2;
        exhaustGroup.add(pipe);

        // Elbow
        // Let's make a simple bent pipe using another cylinder rotated
        const pipeTop = new THREE.Mesh(new THREE.CylinderGeometry(pipeRadius, pipeRadius, 0.4, 16), pipeMat);
        pipeTop.rotation.z = Math.PI / 2;
        pipeTop.position.set(0.2, pipeHeight, 0);
        exhaustGroup.add(pipeTop);

        // Flap
        const flapGeo = new THREE.CylinderGeometry(pipeRadius * 1.1, pipeRadius * 1.1, 0.05, 16);
        this._exhaustFlap = new THREE.Mesh(flapGeo, darkMetalMat);
        // Hinge point
        this._exhaustFlap.geometry.translate(0, 0, -pipeRadius * 0.5); // Move center to edge
        this._exhaustFlap.rotation.z = Math.PI / 2;
        this._exhaustFlap.position.set(0.41, pipeHeight, pipeRadius * 0.5);
        exhaustGroup.add(this._exhaustFlap);

        // 7. Lifting Lugs
        const lugGeo = new THREE.TorusGeometry(0.1, 0.03, 8, 16);
        const lugMat = darkMetalMat;
        [
            [-length/2 + 0.2, width/2 - 0.2],
            [length/2 - 0.2, width/2 - 0.2],
            [-length/2 + 0.2, -width/2 + 0.2],
            [length/2 - 0.2, -width/2 + 0.2]
        ].forEach(([x, z]) => {
            const lug = new THREE.Mesh(lugGeo, lugMat);
            lug.rotation.x = Math.PI / 2;
            lug.position.set(x, body.position.y + height/2, z);
            group.add(lug);
        });

        return group;
    }

    update(dt) {
        this._time += dt;

        // Fan rotation
        if (this._fanGroup) {
            this._fanGroup.rotation.z -= dt * 10;
        }

        // Exhaust Flap Vibration
        if (this._exhaustFlap) {
            // Random jitter + opened angle based on "load" (constant for now)
            const baseAngle = 0.8; // Open
            const jitter = Math.sin(this._time * 40) * 0.1 + Math.sin(this._time * 23) * 0.05;
            this._exhaustFlap.rotation.x = -Math.PI / 2 + baseAngle + jitter;
        }

        // Status Light Blink
        if (this._statusLightMat) {
            const blink = Math.floor(this._time * 2) % 2 === 0;
            this._statusLightMat.emissiveIntensity = blink ? 1.0 : 0.2;
        }
    }
}

EntityRegistry.register('industrialGenerator', IndustrialGeneratorEntity);
