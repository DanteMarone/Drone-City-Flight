import * as THREE from 'three';
import { VehicleEntity } from './vehicles.js';
import { EntityRegistry } from './registry.js';
import { createDeliveryVanGeometry } from '../../world/carGeometries.js';
import { CONFIG } from '../../config.js';

export class DeliveryVanEntity extends VehicleEntity {
    constructor(params) {
        super(params);
        this.type = 'deliveryVan';
        this.baseSpeed = (CONFIG.DRONE.MAX_SPEED || 18.0) - 2.0; // Slower than sedan
        this.waitTime = params?.waitTime ?? 5; // Shorter stops
        this.waitTimer = 0;
        this.direction = 1;
    }

    static get displayName() { return 'Delivery Van'; }

    createMesh(params) {
        const geoData = createDeliveryVanGeometry();

        const modelGroup = new THREE.Group();
        modelGroup.name = 'modelGroup';

        // White or Generic Commercial Color
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.4,
            metalness: 0.3
        });

        const detailMat = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.8,
            metalness: 0.2
        });

        const body = new THREE.Mesh(geoData.body, bodyMat);
        const details = new THREE.Mesh(geoData.details, detailMat);

        body.castShadow = true;
        details.castShadow = true;

        modelGroup.add(body);
        modelGroup.add(details);

        // Add procedural logo?
        // Simple colored rectangle on side
        const logoGeo = new THREE.PlaneGeometry(1.2, 0.6);
        const logoMat = new THREE.MeshStandardMaterial({ color: 0xff8800, roughness: 0.8 });

        const leftLogo = new THREE.Mesh(logoGeo, logoMat);
        leftLogo.position.set(1.16, 1.8, -0.5);
        leftLogo.rotation.y = Math.PI / 2;
        modelGroup.add(leftLogo);

        const rightLogo = new THREE.Mesh(logoGeo, logoMat);
        rightLogo.position.set(-1.16, 1.8, -0.5);
        rightLogo.rotation.y = -Math.PI / 2;
        modelGroup.add(rightLogo);

        const group = new THREE.Group();
        group.add(modelGroup);

        return group;
    }
}

EntityRegistry.register('deliveryVan', DeliveryVanEntity);
