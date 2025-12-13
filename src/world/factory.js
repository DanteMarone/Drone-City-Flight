import * as THREE from 'three';
import { EntityRegistry } from './entities/index.js';

export class ObjectFactory {
    constructor(scene) {
        this.scene = scene;
        // Pre-register or ensure registry is loaded.
        // The import above handles registration via side-effects of module loading.
    }

    createObject(type, params) {
        const entity = EntityRegistry.create(type, params);
        if (entity) {
            // Entities are not automatically added to scene by BaseEntity
            // We must add them here to maintain ObjectFactory behavior
            if (entity.mesh) {
                this.scene.add(entity.mesh);
            }
            return entity; // Entity has { mesh, box } interface
        }
        console.warn('Unknown object type:', type);
        return null;
    }

    // Helper wrappers to maintain API compatibility if needed
    createSkyscraper(params) { return this.createObject('skyscraper', params); }
    createShop(params) { return this.createObject('shop', params); }
    createHouse(params) { return this.createObject('house', params); }
    createRoad(params) { return this.createObject('road', params); }
    createBicycle(params) { return this.createObject('bicycle', params); }
    createOrangeTree(params) { return this.createObject('orangeTree', params); }
    createBird(params) { return this.createObject('bird', params); }
    createBush(params) { return this.createObject('bush', params); }
    createCar(params) { return this.createObject('car', params); }
    createRiver(params) { return this.createObject('river', params); }
}
