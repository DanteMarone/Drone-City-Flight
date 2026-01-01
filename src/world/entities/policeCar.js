import * as THREE from 'three';
import { VehicleEntity } from './vehicles.js';
import { EntityRegistry } from './registry.js';
import { createSedanGeometry } from '../carGeometries.js';
import { CONFIG } from '../../config.js';

export class PoliceCarEntity extends VehicleEntity {
    constructor(params) {
        super(params);
        this.type = 'policeCar';
        this.baseSpeed = (CONFIG.DRONE.MAX_SPEED || 18.0) + 2.0; // Faster than normal cars
        this.flashTimer = 0;
        this.flashState = false;
    }

    static get displayName() { return 'Police Car'; }

    createMesh(params) {
        const geoData = createSedanGeometry();

        const modelGroup = new THREE.Group();
        modelGroup.name = 'modelGroup';

        // Police Car Paint (White with Black details)
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.2,
            metalness: 0.6
        });

        const detailMat = new THREE.MeshStandardMaterial({
            color: 0x111111,
            roughness: 0.5,
            metalness: 0.5
        });

        const body = new THREE.Mesh(geoData.body, bodyMat);
        const details = new THREE.Mesh(geoData.details, detailMat);

        body.castShadow = true;
        details.castShadow = true;

        modelGroup.add(body);
        modelGroup.add(details);

        // --- Light Bar ---
        const lightBarGroup = new THREE.Group();
        lightBarGroup.position.set(0, 1.35, 0); // On roof

        // Center Support
        const supportGeo = new THREE.BoxGeometry(1.2, 0.1, 0.15);
        const support = new THREE.Mesh(supportGeo, new THREE.MeshStandardMaterial({ color: 0x222222 }));
        lightBarGroup.add(support);

        // Red Light (Left)
        const redGeo = new THREE.BoxGeometry(0.4, 0.15, 0.25);
        this.redMat = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 0,
            roughness: 0.2,
            toneMapped: false
        });
        const redLight = new THREE.Mesh(redGeo, this.redMat);
        redLight.position.x = 0.4;
        lightBarGroup.add(redLight);

        // Blue Light (Right)
        const blueGeo = new THREE.BoxGeometry(0.4, 0.15, 0.25);
        this.blueMat = new THREE.MeshStandardMaterial({
            color: 0x0000ff,
            emissive: 0x0000ff,
            emissiveIntensity: 0,
            roughness: 0.2,
            toneMapped: false
        });
        const blueLight = new THREE.Mesh(blueGeo, this.blueMat);
        blueLight.position.x = -0.4;
        lightBarGroup.add(blueLight);

        modelGroup.add(lightBarGroup);

        // --- Side Text ("POLICE") ---
        // Simple plane with text texture
        // Since we don't have a text generator ready for this specifically,
        // let's use a procedural texture or just simple geometry stripes.
        // Let's create a "stripe" for now.
        const stripeGeo = new THREE.PlaneGeometry(2.0, 0.3);
        const stripeMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });

        const rightStripe = new THREE.Mesh(stripeGeo, stripeMat);
        rightStripe.position.set(0.91, 0.8, 0); // Slightly outside body width (1.8/2 = 0.9)
        rightStripe.rotation.y = Math.PI / 2;
        modelGroup.add(rightStripe);

        const leftStripe = new THREE.Mesh(stripeGeo, stripeMat);
        leftStripe.position.set(-0.91, 0.8, 0);
        leftStripe.rotation.y = -Math.PI / 2;
        modelGroup.add(leftStripe);

        const group = new THREE.Group();
        group.add(modelGroup);

        return group;
    }

    update(dt) {
        // Call VehicleEntity update for movement
        super.update(dt);

        // Flashing Lights Logic
        this.flashTimer += dt;
        if (this.flashTimer > 0.4) { // Flash every 0.4s
            this.flashTimer = 0;
            this.flashState = !this.flashState;

            // Alternating pattern: Red-Blue
            if (this.redMat && this.blueMat) {
                this.redMat.emissiveIntensity = this.flashState ? 2.0 : 0.0;
                this.blueMat.emissiveIntensity = this.flashState ? 0.0 : 2.0;
            }
        }
    }
}

EntityRegistry.register('policeCar', PoliceCarEntity);
