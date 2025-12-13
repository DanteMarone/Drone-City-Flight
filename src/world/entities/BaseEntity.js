import * as THREE from 'three';

export class BaseEntity {
    constructor(context, params = {}) {
        this.context = context;
        this.scene = context?.scene;
        this.params = params;
        this.type = this.constructor.type;
        this.mesh = null;
        this.box = null;
        this.collider = null;
    }

    static get type() {
        throw new Error('type must be defined on entity classes');
    }

    static create(context, params = {}) {
        const instance = new this(context, params);
        instance.mesh = instance.createMesh();
        instance.applyDefaults();
        instance.box = instance.createCollider();
        instance.collider = instance.box;
        instance.onAfterCreate();
        return instance;
    }

    static fromSerialized(context, data) {
        const instance = this.create(context, data.params || {});
        if (data.position && instance.mesh) {
            instance.mesh.position.set(data.position.x ?? 0, data.position.y ?? 0, data.position.z ?? 0);
        }
        if (data.rotation && instance.mesh) {
            instance.mesh.rotation.set(data.rotation.x || 0, data.rotation.y || 0, data.rotation.z || 0);
        }
        instance.refreshCollider();
        return instance;
    }

    createMesh() {
        throw new Error('createMesh must be implemented by subclasses');
    }

    applyDefaults() {
        if (!this.mesh) return;
        this.mesh.userData.type = this.type;
        this.mesh.userData.params = { ...this.params };
        if (this.scene && this.mesh.parent !== this.scene) {
            this.scene.add(this.mesh);
        }
    }

    shouldCreateCollider() {
        return true;
    }

    createCollider() {
        if (!this.mesh || !this.shouldCreateCollider()) return null;
        this.mesh.updateMatrixWorld(true);
        return new THREE.Box3().setFromObject(this.mesh);
    }

    refreshCollider() {
        if (!this.mesh) return;
        if (this.box) {
            this.mesh.updateMatrixWorld(true);
            this.box.setFromObject(this.mesh);
        } else {
            this.box = this.createCollider();
            this.collider = this.box;
        }
    }

    onAfterCreate() {
        // Hook for subclasses
    }

    serialize() {
        return {
            type: this.type,
            params: this.serializeParams(),
            position: this.serializeVector(this.mesh?.position),
            rotation: this.serializeEuler(this.mesh?.rotation)
        };
    }

    serializeParams() {
        return { ...this.params };
    }

    serializeVector(vec) {
        if (!vec) return null;
        return { x: vec.x, y: vec.y, z: vec.z };
    }

    serializeEuler(euler) {
        if (!euler) return null;
        return { x: euler.x, y: euler.y, z: euler.z };
    }
}
