// src/dev/devClipboardManager.js
import { EntityRegistry } from '../world/entities/index.js';
import { CreateObjectCommand, DeleteObjectCommand } from './history.js';

export class DevClipboardManager {
    constructor(devMode) {
        this.devMode = devMode;
        this.clipboard = null;
    }

    _deepClone(data) {
        if (!data) return data;
        if (typeof structuredClone === 'function') {
            return structuredClone(data);
        }
        return JSON.parse(JSON.stringify(data));
    }

    _findEntityByMesh(mesh) {
        if (!this.devMode?.app?.world?.colliders) return null;
        return this.devMode.app.world.colliders.find((entity) => entity.mesh === mesh) || null;
    }

    _serializeMesh(mesh) {
        if (!mesh) return null;

        const entity = this._findEntityByMesh(mesh);
        if (entity?.serialize) {
            return this._deepClone(entity.serialize());
        }

        if (mesh.userData?.type === 'ring') {
            return {
                type: 'ring',
                position: { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z },
                rotation: { x: mesh.rotation.x, y: mesh.rotation.y, z: mesh.rotation.z },
                scale: { x: mesh.scale.x, y: mesh.scale.y, z: mesh.scale.z }
            };
        }

        if (mesh.userData?.type) {
            const params = this._deepClone(mesh.userData.params || {});
            return {
                type: mesh.userData.type,
                params,
                position: { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z },
                rotation: { x: mesh.rotation.x, y: mesh.rotation.y, z: mesh.rotation.z },
                scale: { x: mesh.scale.x, y: mesh.scale.y, z: mesh.scale.z }
            };
        }

        return null;
    }

    _recordCreation(objects, description = 'Create object') {
        const serialized = (objects || [])
            .map(obj => this._serializeMesh(obj))
            .filter(Boolean);

        if (serialized.length) {
            this.devMode.history.push(new CreateObjectCommand(this.devMode, serialized, objects, description));
        }
    }

    _removeObjects(objects) {
        if (!objects) return;
        objects.forEach(obj => {
            if (!obj || obj.userData?.type === 'waypoint') return;

            if (obj.userData.waypointGroup) {
                this.devMode.app.renderer.scene.remove(obj.userData.waypointGroup);
            }
            this.devMode.app.renderer.scene.remove(obj);
            if (this.devMode.app.colliderSystem) {
                this.devMode.app.colliderSystem.remove(obj);
            }
            if (this.devMode.app.world) {
                this.devMode.app.world.removeEntity(obj);
            }
        });
    }

    copySelected() {
        if (!this.devMode.selectedObjects.length) return false;
        const serialized = this.devMode.selectedObjects
            .map(obj => this._serializeMesh(obj))
            .filter(Boolean);

        if (!serialized.length) return false;
        this.clipboard = serialized;
        return true;
    }

    _instantiateFromClipboard(data) {
        if (!data) return null;
        if (data.type === 'ring' && this.devMode.app?.rings) {
            const position = data.position || { x: 0, y: 0, z: 0 };
            const rotation = data.rotation || { x: 0, y: 0, z: 0 };
            this.devMode.app.rings.spawnRingAt(position, rotation);
            const spawned = this.devMode.app.rings.rings[this.devMode.app.rings.rings.length - 1];
            if (spawned?.mesh && data.scale) {
                spawned.mesh.scale.set(data.scale.x, data.scale.y, data.scale.z);
            }
            return spawned?.mesh || null;
        }

        const params = this._deepClone(data.params || {});
        // Ensure UUID is preserved or assigned
        if (!params.uuid && data.params?.uuid) {
            params.uuid = data.params.uuid;
        }

        if (data.position) {
            params.x = data.position.x;
            params.y = data.position.y;
            params.z = data.position.z;
        }
        if (data.rotation) {
            params.rotX = data.rotation.x;
            params.rotY = data.rotation.y;
            params.rotZ = data.rotation.z;
        }

        const entity = EntityRegistry.create(data.type, params);
        if (!entity || !entity.mesh) return null;

        if (data.scale) {
            entity.mesh.scale.set(data.scale.x, data.scale.y, data.scale.z);
            if (entity.box) {
                entity.box.setFromObject(entity.mesh);
            }
        }

        this.devMode.app.renderer.scene.add(entity.mesh);
        this.devMode.app.world.addEntity(entity);
        if (this.devMode.app.colliderSystem) {
            this.devMode.app.colliderSystem.addStatic([entity]);
        }

        if (entity.mesh.userData?.waypointGroup && this.devMode.enabled) {
            const wg = entity.mesh.userData.waypointGroup;
            wg.visible = true;
            if (wg.parent !== this.devMode.app.renderer.scene) {
                this.devMode.app.renderer.scene.add(wg);
            }
        }

        return entity.mesh;
    }

    pasteClipboard() {
        if (!this.clipboard) return null;

        const clipboardItems = Array.isArray(this.clipboard)
            ? this.clipboard
            : [this.clipboard];

        const newObjects = clipboardItems
            .map(item => this._instantiateFromClipboard(this._deepClone(item)))
            .filter(Boolean);

        if (newObjects.length > 0) {
            this.devMode.selectObjects(newObjects);
            this._recordCreation(newObjects, 'Paste objects');
            return newObjects;
        }

        return null;
    }

    duplicateSelected() {
        const copied = this.copySelected();
        if (!copied) return null;
        return this.pasteClipboard();
    }

    deleteSelected() {
        if (this.devMode.selectedObjects.length === 0) return;

        // Separate waypoints from regular objects
        const waypoints = this.devMode.selectedObjects.filter(o => o.userData.type === 'waypoint');
        const objects = this.devMode.selectedObjects.filter(o => o.userData.type !== 'waypoint');

        // Handle regular objects
        if (objects.length > 0) {
            const serialized = objects
                .map(obj => this._serializeMesh(obj))
                .filter(Boolean);

            if (serialized.length) {
                const command = new DeleteObjectCommand(this.devMode, serialized, 'Delete objects');
                this._removeObjects(objects);
                this.devMode.history.push(command);
            }
        }

        // Handle waypoints via WaypointManager
        if (waypoints.length > 0) {
            this.devMode.waypoints.delete(waypoints);
        }

        this.devMode.selectObject(null);
    }
}
