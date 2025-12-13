// src/world/world.js
import * as THREE from 'three';
import { DistrictGenerator } from './generation.js';
import { ObjectFactory } from './factory.js';

export class World {
    constructor(scene) {
        this.scene = scene;
        this.colliders = [];
        this.ground = null;

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
        // Use the new generator
        const generator = new DistrictGenerator(this.scene);
        this.colliders = generator.generateCityLayout();
    }

    // API for collisions
    getStaticColliders() {
        return this.colliders;
    }

    clear() {
        // Remove static colliders/meshes
        // Since we didn't track meshes separately in array (other than colliders list which has {mesh, box})
        // We can iterate colliders.
        this.colliders.forEach(c => {
            if (c.mesh) {
                this.scene.remove(c.mesh);
                // Recursively dispose geometry/materials if we want to be clean,
                // but JS GC handles it if we drop references and remove from scene.
                // However, Three.js geometries need manual dispose for GPU memory.
                // For this MVP we'll skip deep dispose unless lag occurs.
            }
        });
        this.colliders = [];
    }

    loadMap(mapData) {
        this.clear();
        const factory = new ObjectFactory(this.scene);

        if (mapData.objects) {
            mapData.objects.forEach(obj => {
                const collider = factory.createObject(obj.type, obj.params || obj.userData?.params || {});
                if (collider) {
                    // Restore transform if provided
                    if (obj.position) collider.mesh.position.set(obj.position.x, obj.position.y, obj.position.z);
                    if (obj.rotation) collider.mesh.rotation.set(obj.rotation.x, obj.rotation.y, obj.rotation.z);
                    // Scale? Usually baked into params for buildings, but generic support:
                    // if (obj.scale) collider.mesh.scale.set(obj.scale.x, obj.scale.y, obj.scale.z);

                    this.colliders.push(collider);
                }
            });
        }
    }

    exportMap() {
        // Iterate colliders to get static objects
        const objects = [];
        this.colliders.forEach(c => {
            if (c.mesh && c.mesh.userData.type) {
                objects.push({
                    type: c.mesh.userData.type,
                    params: c.mesh.userData.params,
                    position: { x: c.mesh.position.x, y: c.mesh.position.y, z: c.mesh.position.z },
                    rotation: { x: c.mesh.rotation.x, y: c.mesh.rotation.y, z: c.mesh.rotation.z }
                });
            }
        });
        return { version: 1, objects };
    }
}
