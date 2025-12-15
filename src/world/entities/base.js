import * as THREE from 'three';

export class BaseEntity {
    constructor(params = {}) {
        this.params = params;
        this.type = 'base';
        this.mesh = null;
        this.box = null;

        // Ensure params has position/rotation if provided
        this.position = new THREE.Vector3(params.x || 0, params.y || 0, params.z || 0);
        this.rotation = new THREE.Euler(params.rotX || 0, params.rotY || 0, params.rotZ || 0);
    }

    /**
     * Initializes the entity: creates mesh and collider.
     * Must be called after construction.
     */
    init() {
        this.mesh = this.createMesh(this.params);
        if (this.mesh) {
            this.mesh.userData.type = this.type;
            this.mesh.userData.params = this.params;

            // Apply Transform
            this.mesh.position.copy(this.position);
            this.mesh.rotation.copy(this.rotation);

            // Allow subclasses to perform post-creation logic (e.g. adding children)
            this.postInit();

            this.box = this.createCollider();
        }
    }

    /**
     * Abstract method to create the mesh.
     * @param {Object} params
     * @returns {THREE.Object3D}
     */
    createMesh(params) {
        console.warn('createMesh not implemented for', this.type);
        return new THREE.Group();
    }

    /**
     * Hook for post-mesh creation logic (e.g. creating visuals)
     */
    postInit() {}

    /**
     * Creates the collider box.
     * @returns {THREE.Box3}
     */
    createCollider() {
        if (!this.mesh) return null;
        this.mesh.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(this.mesh);
        return box;
    }

    /**
     * Updates the entity logic.
     * @param {number} dt Delta time in seconds.
     */
    update(dt) {}

    /**
     * Serializes the entity to a plain object.
     * @returns {Object}
     */
    serialize() {
        if (!this.mesh) return null;

        // Update params from userData if they were modified (e.g. via DevMode)
        const currentParams = this.mesh.userData.params || this.params;

        return {
            type: this.type,
            params: currentParams,
            position: { x: this.mesh.position.x, y: this.mesh.position.y, z: this.mesh.position.z },
            rotation: { x: this.mesh.rotation.x, y: this.mesh.rotation.y, z: this.mesh.rotation.z },
            scale: { x: this.mesh.scale.x, y: this.mesh.scale.y, z: this.mesh.scale.z }
        };
    }

    static get displayName() {
        return this.type || this.name || 'Unknown Object';
    }

    static fromSerialized(data) {
        // This will be handled by Registry to instantiate the class
        // and then we call init()
        // But the class itself doesn't need a static method if Registry handles it.
        // We will stick to the pattern: new Class(data.params).init();
        return null;
    }
}
