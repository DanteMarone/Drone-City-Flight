import * as THREE from 'three';

/**
 * Manages batches of InstancedMesh objects for high-performance rendering
 * of repetitive entities (trees, sidewalks, props).
 */
export class InstancedEntitySystem {
    constructor(scene) {
        this.scene = scene;
        this.batches = new Map(); // type -> InstancedBatch
    }

    /**
     * Prepares batches based on counts from the map data.
     * @param {Object} counts - Map of { type: count }
     */
    initBatches(counts) {
        for (const [type, count] of Object.entries(counts)) {
            // We only support types that are explicitly registered or suitable
            // This filtering logic can be expanded.
            // For now, World.js will decide what to pass here, or we filter here.
            if (this._isSupported(type)) {
                let batch = this.batches.get(type);
                if (!batch) {
                    batch = new InstancedBatch(type, this.scene);
                    this.batches.set(type, batch);
                }
                batch.resize(count);
            }
        }
    }

    _isSupported(type) {
        const whitelist = [
            'sidewalk',
            'pineTree',
            'oakTree',
            'modern_tower',
            'house_modern',
            'house_cottage',
            'constructionBarrier',
            'streetLight' // Maybe
        ];
        return whitelist.includes(type);
    }

    /**
     * Adds an entity to the instance batch.
     * @param {BaseEntity} entity
     * @returns {boolean} True if handled, False if not supported/full.
     */
    add(entity) {
        const type = entity.type;
        if (!this.batches.has(type)) return false;

        const batch = this.batches.get(type);

        // Ensure visual matrix is up to date
        entity.mesh.updateMatrixWorld();

        // If the batch doesn't have a template yet, capture this entity as the template
        if (!batch.hasTemplate()) {
            // We use the first entity as the visual template.
            // Note: This implies all instances will look like the first one
            // (ignoring internal random variations of subsequent entities).
            batch.setTemplate(entity.mesh);
        }

        batch.addInstance(entity.mesh.matrixWorld);
        return true;
    }

    update(dt) {
        // Optional: Animate instances?
        // InstancedMesh doesn't support individual animation easily without shader attributes.
        // We skip animation for static props.
    }

    clear() {
        this.batches.forEach(batch => batch.dispose());
        this.batches.clear();
    }
}

class InstancedBatch {
    constructor(type, scene) {
        this.type = type;
        this.scene = scene;
        this.parts = []; // Array of { mesh: InstancedMesh, localMatrix: Matrix4 }
        this.capacity = 0;
        this.count = 0;
        this.templateCaptured = false;
    }

    hasTemplate() {
        return this.templateCaptured;
    }

    setTemplate(rootObject) {
        if (this.templateCaptured) return;

        // Traverse the object to find all meshes
        rootObject.traverse((child) => {
            if (child.isMesh) {
                // Calculate local matrix relative to the rootObject
                // child.matrixWorld = root.matrixWorld * localPath
                // localPath = inverse(root.matrixWorld) * child.matrixWorld

                // However, matrixWorld might not be updated if we just created it.
                // Assuming updateMatrixWorld() was called on root.

                const rootInv = rootObject.matrixWorld.clone().invert();
                const localMatrix = child.matrixWorld.clone().premultiply(rootInv);

                // Clone geometry and material?
                // InstancedMesh needs shared geometry/material.
                // We use the one from the template.

                const part = {
                    geometry: child.geometry,
                    material: child.material,
                    localMatrix: localMatrix,
                    instancedMesh: null // Created on resize
                };
                this.parts.push(part);
            }
        });

        this.templateCaptured = true;
        // If we already have capacity (from initBatches), build meshes now
        if (this.capacity > 0) {
            this._buildMeshes();
        }
    }

    resize(newCapacity) {
        // Increase capacity.
        // Realistically, we usually get the total count upfront in loadMap.
        this.capacity = Math.max(this.capacity, newCapacity);
        if (this.templateCaptured) {
            this._buildMeshes();
        }
    }

    _buildMeshes() {
        // Discard old meshes if they exist (handling resize/rebuild)
        this.dispose();

        this.parts.forEach(part => {
            const im = new THREE.InstancedMesh(part.geometry, part.material, this.capacity);
            im.castShadow = true;
            im.receiveShadow = true;

            // Disable frustum culling for batches to ensure they are always rendered
            // regardless of where the camera is looking relative to the original geometry origin.
            // Since we consolidated thousands of draw calls into one,
            // the GPU overhead of drawing off-screen instances is negligible compared to
            // the CPU overhead of culling or the risk of pop-in.
            im.frustumCulled = false;

            this.scene.add(im);
            part.instancedMesh = im;
        });
    }

    addInstance(worldMatrix) {
        if (!this.templateCaptured) {
            console.warn(`InstancedBatch: Template not set for ${this.type}`);
            return;
        }
        if (this.count >= this.capacity) {
            console.warn(`InstancedBatch: Capacity overflow for ${this.type}`);
            return;
        }

        const i = this.count;
        const tmpMat = new THREE.Matrix4();

        this.parts.forEach(part => {
            if (part.instancedMesh) {
                // Instance Matrix = EntityWorldMatrix * PartLocalMatrix
                tmpMat.multiplyMatrices(worldMatrix, part.localMatrix);
                part.instancedMesh.setMatrixAt(i, tmpMat);
            }
        });

        this.count++;
        // We mark as needing update.
        // Optimization: Do this once at the end of loading?
        // But addInstance is called iteratively.
        this.parts.forEach(part => {
            if (part.instancedMesh) part.instancedMesh.instanceMatrix.needsUpdate = true;
        });
    }

    dispose() {
        this.parts.forEach(part => {
            if (part.instancedMesh) {
                this.scene.remove(part.instancedMesh);
                part.instancedMesh.dispose();
                part.instancedMesh = null;
            }
        });
        this.count = 0;
    }
}
