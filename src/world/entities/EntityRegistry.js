import { SkyscraperEntity } from './SkyscraperEntity.js';
import { ShopEntity } from './ShopEntity.js';
import { HouseEntity } from './HouseEntity.js';
import { RoadEntity } from './RoadEntity.js';
import { OrangeTreeEntity } from './OrangeTreeEntity.js';
import { BushEntity } from './BushEntity.js';
import { BirdEntity } from './BirdEntity.js';
import { CarEntity } from './CarEntity.js';
import { BicycleEntity } from './BicycleEntity.js';

export class EntityRegistry {
    constructor(context) {
        this.context = context;
        this.entities = new Map();
    }

    register(EntityClass) {
        this.entities.set(EntityClass.type, EntityClass);
    }

    create(type, params = {}) {
        const EntityClass = this.entities.get(type);
        if (!EntityClass) {
            console.warn('Unknown object type:', type);
            return null;
        }
        return EntityClass.create(this.context, params);
    }

    fromSerialized(data) {
        const EntityClass = this.entities.get(data.type);
        if (!EntityClass) {
            console.warn('Unknown object type:', data.type);
            return null;
        }
        return EntityClass.fromSerialized(this.context, data);
    }
}

export function createDefaultRegistry(context) {
    const registry = new EntityRegistry(context);
    [
        SkyscraperEntity,
        ShopEntity,
        HouseEntity,
        RoadEntity,
        OrangeTreeEntity,
        BushEntity,
        BirdEntity,
        CarEntity,
        BicycleEntity
    ].forEach(cls => registry.register(cls));
    return registry;
}
