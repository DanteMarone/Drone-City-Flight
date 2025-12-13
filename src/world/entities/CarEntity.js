import * as THREE from 'three';
import { createSedanGeometry } from '../carGeometries.js';
import { VehicleEntity } from './BuildingEntity.js';

export class CarEntity extends VehicleEntity {
    static type = 'car';

    createMesh() {
        const { x = 0, z = 0 } = this.params;
        const geoData = createSedanGeometry();

        const group = new THREE.Group();

        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xff0000, roughness: 0.2, metalness: 0.6 });
        const detailMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8, metalness: 0.2 });

        const body = new THREE.Mesh(geoData.body, bodyMat);
        const details = new THREE.Mesh(geoData.details, detailMat);

        body.castShadow = true;
        details.castShadow = true;

        group.add(body);
        group.add(details);

        group.position.set(x, 0, z);
        return group;
    }
}
