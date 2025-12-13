// src/world/factory.js
import { createDefaultRegistry } from './entities/EntityRegistry.js';
import { createEntityResources } from './entities/resources.js';

export class ObjectFactory {
    constructor(scene) {
        this.scene = scene;
        this.resources = createEntityResources();
        this.registry = createDefaultRegistry({ scene, resources: this.resources });
    }

    createObject(type, params) {
        return this.registry.create(type, params);
    }

    createFromSerialized(data) {
        return this.registry.fromSerialized(data);
    }

    createSkyscraper(params) { return this.createObject('skyscraper', params); }
    createShop(params) { return this.createObject('shop', params); }
    createHouse(params) { return this.createObject('house', params); }
    createRoad(params) { return this.createObject('road', params); }
    createBicycle(params) { return this.createObject('bicycle', params); }
    createOrangeTree(params) { return this.createObject('orangeTree', params); }
    createBird(params) { return this.createObject('bird', params); }
    createBush(params) { return this.createObject('bush', params); }
    createCar(params) { return this.createObject('car', params); }
}
