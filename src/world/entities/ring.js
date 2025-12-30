import * as THREE from 'three';
import { VehicleEntity } from './vehicles.js';
import { EntityRegistry } from './registry.js';
import { CONFIG } from '../../config.js';

export class RingEntity extends VehicleEntity {
    constructor(params) {
        super(params);
        this.type = 'ring';
        // Same speed as bicycle: (MAX_SPEED or 18.0) / 2
        this.baseSpeed = (CONFIG.DRONE.MAX_SPEED || 18.0) / 2;
    }

    static get displayName() { return 'Ring'; }

    createMesh(params) {
        // Match geometry from RingManager: TorusGeometry(1.5, 0.2, 8, 16)
        // Match material from RingManager: MeshBasicMaterial({ color: 0xffff00 })
        const geo = new THREE.TorusGeometry(1.5, 0.2, 8, 16);
        const mat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        const mesh = new THREE.Mesh(geo, mat);

        mesh.castShadow = false;
        mesh.receiveShadow = false;

        const modelGroup = new THREE.Group();
        modelGroup.name = 'modelGroup';
        modelGroup.add(mesh);

        const group = new THREE.Group();
        group.add(modelGroup);

        return group;
    }

    // Override init to prevent BaseEntity from creating the default collider
    init(...args) {
        super.init(...args);
        // After super.init() creates the collider, force it to null
        this.box = null;
    }

    postInit() {
        super.postInit();

        // Allow speed override via params
        if (this.params && this.params.speed !== undefined) {
            this.baseSpeed = this.params.speed;
        }

        // Disable local box calculation to prevent VehicleEntity.update from creating a box
        this._localBox = null;
        this.box = null;

        if (typeof window !== 'undefined' && window.app && window.app.rings) {
            window.app.rings.add(this);
        }
    }

    dispose() {
        if (typeof window !== 'undefined' && window.app && window.app.rings) {
            window.app.rings.remove(this);
        }
        super.dispose ? super.dispose() : null;
    }

    update(dt) {
        super.update(dt);
        // Force box to null after super.update potentially recreated it
        this.box = null;
    }
}

EntityRegistry.register('ring', RingEntity);
