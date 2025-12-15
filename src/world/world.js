// src/world/world.js
import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { DistrictGenerator } from './generation.js';
import { ObjectFactory } from './factory.js';
import { BirdSystem } from './birdSystem.js';
import { EntityRegistry } from './entities/index.js';

export class World {
    constructor(scene) {
        this.scene = scene;
        this.birdSystem = new BirdSystem(scene);

        // this.colliders now holds BaseEntity instances (which match {mesh, box} interface)
        this.colliders = [];
        this.ground = null;

        this.wind = { ...CONFIG.WORLD.WIND };

        this._initGround();
        this._generateWorld();
    }

    _initGround() {
        const geo = new THREE.PlaneGeometry(2000, 2000);
        const mat = new THREE.MeshStandardMaterial({
            color: 0x223322,
            roughness: 0.8,
            metalness: 0.1
        });
        this.ground = new THREE.Mesh(geo, mat);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.receiveShadow = true;
        this.scene.add(this.ground);
    }

    _generateWorld() {
        // Default to Blank Map.
        // No longer generating districts or roads by default.
        this.colliders = [];
    }

    update(dt) {
        if (this.birdSystem) this.birdSystem.update(dt);

        // Update all entities
        this.colliders.forEach(entity => {
            if (entity.update) entity.update(dt);
        });
    }

    // API for collisions
    getStaticColliders() {
        return this.colliders;
    }

    addEntity(entity) {
        if (!entity) return;
        this.colliders.push(entity);

        // Logic specific to types
        if (entity.type === 'bird' && this.birdSystem) {
            this.birdSystem.add(entity.mesh);
        }
    }

    clear() {
        this.colliders.forEach(c => {
            if (c.mesh) {
                this.scene.remove(c.mesh);
                // Clean up any auxiliary visuals like waypoints
                if (c.mesh.userData.waypointGroup) {
                    this.scene.remove(c.mesh.userData.waypointGroup);
                }
            }
        });
        this.colliders = [];
        if (this.birdSystem) this.birdSystem.clear();
    }

    loadMap(mapData) {
        this.clear();

        if (mapData.wind) {
            this.wind = { ...mapData.wind };
        } else {
            this.wind = { ...CONFIG.WORLD.WIND };
        }

        // We don't strictly need factory here if we use Registry,
        // but factory adds to scene.
        // Let's use Registry and manually add to scene/world to be explicit.

        if (mapData.objects) {
            mapData.objects.forEach(obj => {
                // Determine params
                const params = { ...(obj.params || obj.userData?.params || {}) };
                // Merge transform
                if (obj.position) {
                    params.x = obj.position.x;
                    params.y = obj.position.y;
                    params.z = obj.position.z;
                }
                if (obj.rotation) {
                    params.rotX = obj.rotation.x;
                    params.rotY = obj.rotation.y;
                    params.rotZ = obj.rotation.z;
                }

                const entity = EntityRegistry.create(obj.type, params);
                if (entity) {
                    this.scene.add(entity.mesh);
                    this.addEntity(entity);

                    // Restore exact transform if serialization was precise
                    // BaseEntity init sets position from params.
                    // Should be correct.
                    // But rotation?
                if (obj.rotation) {
                    entity.mesh.rotation.set(obj.rotation.x, obj.rotation.y, obj.rotation.z);
                }

                if (obj.scale) {
                    entity.mesh.scale.set(obj.scale.x, obj.scale.y, obj.scale.z);
                }

                // Recompute box in case rotation changed it
                if (entity.box) {
                     entity.box.setFromObject(entity.mesh);
                         // Handle house roof extension if needed?
                         // BaseEntity.createCollider handles it based on mesh state.
                         // But for HouseEntity, createCollider logic is specific.
                         // It should be fine as long as mesh structure is consistent.
                    }
                }
            });
        }
    }

    exportMap() {
        const objects = [];
        this.colliders.forEach(entity => {
            if (entity.serialize) {
                objects.push(entity.serialize());
            } else if (entity.mesh && entity.mesh.userData.type) {
                // Fallback for objects that might not be full Entities (if any exist)
                // But generator returns Entities now.
                // Just in case.
                console.warn("Non-entity found in colliders during export", entity);
            }
        });
        return {
            version: 1,
            wind: { ...this.wind },
            objects
        };
    }
}
