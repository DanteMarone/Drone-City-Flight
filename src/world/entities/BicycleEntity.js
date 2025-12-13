import { createBicycleMesh } from '../carGeometries.js';
import { VehicleEntity } from './BuildingEntity.js';

export class BicycleEntity extends VehicleEntity {
    static type = 'bicycle';

    createMesh() {
        const { x = 0, z = 0 } = this.params;
        const group = createBicycleMesh();
        group.position.set(x, 0, z);
        return group;
    }
}
