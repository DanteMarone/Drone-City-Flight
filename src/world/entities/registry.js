export class EntityRegistry {
    static registry = new Map();

    static register(type, cls) {
        this.registry.set(type, cls);
    }

    static get(type) {
        return this.registry.get(type);
    }

    static create(type, params) {
        const Cls = this.registry.get(type);
        if (!Cls) {
            console.warn(`EntityRegistry: Unknown type '${type}'`);
            return null;
        }
        const entity = new Cls(params);
        entity.init();
        return entity;
    }
}
