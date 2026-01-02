import * as THREE from 'three';

class BaseCommand {
    constructor(description = '') {
        this.description = description;
    }
}

export class CommandManager {
    constructor(devMode) {
        this.devMode = devMode;
        this.undoStack = [];
        this.redoStack = [];
    }

    push(command) {
        if (!command) return;
        this.undoStack.push(command);
        this.redoStack = [];
        if (command.description) {
            console.log(`Action: ${command.description}`);
        }
    }

    undo() {
        const command = this.undoStack.pop();
        if (!command || !command.undo) return;
        command.undo();
        this.redoStack.push(command);
        if (command.description) {
            console.log(`Undo: ${command.description}`);
        }
    }

    redo() {
        const command = this.redoStack.pop();
        if (!command || !command.redo) return;
        command.redo();
        this.undoStack.push(command);
        if (command.description) {
            console.log(`Redo: ${command.description}`);
        }
    }

    toJSON() {
        return this.undoStack.map(cmd => (cmd.toJSON ? cmd.toJSON() : null)).filter(Boolean);
    }

    static fromJSON(json, devMode) {
        if (!Array.isArray(json)) return;
        const manager = new CommandManager(devMode);
        json.forEach(cmdData => {
            let cmd = null;
            switch(cmdData.type) {
                case 'Transform': cmd = TransformCommand.fromJSON(cmdData, devMode); break;
                case 'PropertyChange': cmd = PropertyChangeCommand.fromJSON(cmdData, devMode); break;
                case 'CreateObject': cmd = CreateObjectCommand.fromJSON(cmdData, devMode); break;
                case 'DeleteObject': cmd = DeleteObjectCommand.fromJSON(cmdData, devMode); break;
                case 'Waypoint': cmd = WaypointCommand.fromJSON(cmdData, devMode); break;
            }
            if (cmd) manager.undoStack.push(cmd);
        });
        return manager;
    }
}

export class TransformCommand extends BaseCommand {
    constructor(devMode, beforeStates, afterStates, description = 'Transform change') {
        super(description);
        this.devMode = devMode;
        this.beforeStates = beforeStates;
        this.afterStates = afterStates;
    }

    _resolveStates(states) {
        return states.map(state => {
            // If state already has object resolved, return it
            if (state.object) return state;

            // Otherwise try to find it by UUID
            const entity = this.devMode.app.world.colliders.find(c => c.mesh && c.mesh.userData.uuid === state.objectUuid);
            const obj = entity ? entity.mesh : null;

            // We return a new state object with the resolved mesh
            return {
                ...state,
                object: obj
            };
        }).filter(s => s.object); // Filter out any that still can't be found
    }

    undo() {
        // Resolve objects lazily at execution time
        const resolved = this._resolveStates(this.beforeStates);
        if (resolved.length > 0) {
            this.devMode.applyTransformSnapshot(resolved);
        }
    }

    redo() {
        // Resolve objects lazily at execution time
        const resolved = this._resolveStates(this.afterStates);
        if (resolved.length > 0) {
            this.devMode.applyTransformSnapshot(resolved);
        }
    }

    toJSON() {
        return {
            type: 'Transform',
            description: this.description,
            beforeStates: this.beforeStates.map(serializeTransformState),
            afterStates: this.afterStates.map(serializeTransformState)
        };
    }

    static fromJSON(json, devMode) {
        // Deserialize data but DO NOT resolve objects yet
        const before = json.beforeStates.map(deserializeTransformStateData);
        const after = json.afterStates.map(deserializeTransformStateData);
        return new TransformCommand(devMode, before, after, json.description);
    }
}

export class PropertyChangeCommand extends BaseCommand {
    constructor(devMode, objectUuid, property, beforeValue, afterValue, description = 'Property change') {
        super(description);
        this.devMode = devMode;
        this.objectUuid = objectUuid;
        this.property = property;
        this.beforeValue = beforeValue;
        this.afterValue = afterValue;
    }

    _findObject() {
        // Find object by UUID in world
        const entity = this.devMode.app.world.colliders.find(c => c.mesh && c.mesh.userData.uuid === this.objectUuid);
        return entity ? entity.mesh : null;
    }

    undo() {
        const obj = this._findObject();
        if (obj) {
            this._apply(obj, this.beforeValue);
        }
    }

    redo() {
        const obj = this._findObject();
        if (obj) {
            this._apply(obj, this.afterValue);
        }
    }

    _apply(obj, value) {
        // Generic Property Application

        // 1. Direct assignment to userData (common for runtime flags)
        obj.userData[this.property] = value;

        // 2. Assignment to userData.params (common for serialization)
        if (obj.userData.params) {
            obj.userData.params[this.property] = value;
        }

        // 3. Update UI if selected
        if (this.devMode.selectedObjects.includes(obj)) {
            this.devMode.ui.updateProperties(obj);
        }
    }

    toJSON() {
        return {
            type: 'PropertyChange',
            description: this.description,
            objectUuid: this.objectUuid,
            property: this.property,
            beforeValue: this.beforeValue,
            afterValue: this.afterValue
        };
    }

    static fromJSON(json, devMode) {
        return new PropertyChangeCommand(
            devMode,
            json.objectUuid,
            json.property,
            json.beforeValue,
            json.afterValue,
            json.description
        );
    }
}

export class CreateObjectCommand extends BaseCommand {
    constructor(devMode, serializedData, createdObjects, description = 'Create object') {
        super(description);
        this.devMode = devMode;
        this.serializedData = serializedData;
        this.objects = createdObjects;
    }

    undo() {
        this.devMode._removeObjects(this.objects);
        this.objects = [];
        this.devMode.selectObject(null);
    }

    redo() {
        const recreated = this.serializedData
            .map(data => this.devMode.clipboardManager.instantiateFromData(this.devMode.clipboardManager.deepClone(data)))
            .filter(Boolean);
        this.objects = recreated;
        if (recreated.length > 0) {
            this.devMode.selectObjects(recreated);
        }
    }

    toJSON() {
        return {
            type: 'CreateObject',
            description: this.description,
            serializedData: this.serializedData
        };
    }

    static fromJSON(json, devMode) {
        // When deserializing, objects are not created yet. Redo (execute) will create them.
        return new CreateObjectCommand(devMode, json.serializedData, [], json.description);
    }

    execute() {
        this.redo();
    }
}

export class DeleteObjectCommand extends BaseCommand {
    constructor(devMode, serializedData, description = 'Delete object') {
        super(description);
        this.devMode = devMode;
        this.serializedData = serializedData;
        this.objects = [];
    }

    undo() {
        const recreated = this.serializedData
            .map(data => this.devMode.clipboardManager.instantiateFromData(this.devMode.clipboardManager.deepClone(data)))
            .filter(Boolean);
        this.objects = recreated;
        if (recreated.length > 0) {
            this.devMode.selectObjects(recreated);
        }
    }

    redo() {
        // To redo a delete, we must find the objects in the world that match the UUIDs
        if (this.objects.length === 0) {
             const uuids = this.serializedData.map(d => d.params?.uuid).filter(Boolean);
             this.objects = uuids.map(uuid => {
                 const c = this.devMode.app.world.colliders.find(x => x.mesh && x.mesh.userData.uuid === uuid);
                 return c ? c.mesh : null;
             }).filter(Boolean);
        }

        if (this.objects.length === 0) return; // Already deleted?

        this.devMode._removeObjects(this.objects);
        this.objects = [];
        this.devMode.selectObject(null);
    }

    toJSON() {
        return {
            type: 'DeleteObject',
            description: this.description,
            serializedData: this.serializedData
        };
    }

    static fromJSON(json, devMode) {
        return new DeleteObjectCommand(devMode, json.serializedData, json.description);
    }

    execute() {
        this.redo();
    }
}

export class WaypointCommand extends BaseCommand {
    constructor(devMode, statesBefore, statesAfter, description = 'Waypoint change') {
        super(description);
        this.devMode = devMode;
        this.statesBefore = statesBefore;
        this.statesAfter = statesAfter;
    }

    _resolveStates(states) {
        return states.map(state => {
            if (state.car) return state;
            const entity = this.devMode.app.world.colliders.find(c => c.mesh && c.mesh.userData.uuid === state.carUuid);
            const car = entity ? entity.mesh : null;
            return {
                ...state,
                car: car
            };
        }).filter(s => s.car);
    }

    undo() {
        const resolved = this._resolveStates(this.statesBefore);
        if (resolved.length > 0) {
            this.devMode.waypoints.applySnapshot(resolved);
        }
    }

    redo() {
        const resolved = this._resolveStates(this.statesAfter);
        if (resolved.length > 0) {
            this.devMode.waypoints.applySnapshot(resolved);
        }
    }

    toJSON() {
        return {
            type: 'Waypoint',
            description: this.description,
            statesBefore: this.statesBefore.map(serializeWaypointState),
            statesAfter: this.statesAfter.map(serializeWaypointState)
        };
    }

    static fromJSON(json, devMode) {
        const before = json.statesBefore.map(deserializeWaypointStateData);
        const after = json.statesAfter.map(deserializeWaypointStateData);
        return new WaypointCommand(devMode, before, after, json.description);
    }
}

export function cloneTransform(object) {
    return {
        object,
        position: object.position.clone(),
        rotation: object.rotation.clone(),
        scale: object.scale.clone(),
    };
}

export function cloneWaypointState(car) {
    return {
        car,
        waypoints: (car.userData.waypoints || []).map(wp => wp.clone()),
    };
}

// Helper functions for serialization
function serializeTransformState(state) {
    return {
        objectUuid: state.object ? state.object.userData.uuid : state.objectUuid,
        position: state.position,
        rotation: state.rotation,
        scale: state.scale
    };
}

function deserializeTransformStateData(data) {
    // Return pure data structure with UUID, no resolution yet
    return {
        objectUuid: data.objectUuid,
        position: new THREE.Vector3(data.position.x, data.position.y, data.position.z),
        rotation: new THREE.Euler(data.rotation._x, data.rotation._y, data.rotation._z, data.rotation._order),
        scale: new THREE.Vector3(data.scale.x, data.scale.y, data.scale.z)
    };
}

function serializeWaypointState(state) {
    return {
        carUuid: state.car ? state.car.userData.uuid : state.carUuid,
        waypoints: state.waypoints
    };
}

function deserializeWaypointStateData(data) {
    return {
        carUuid: data.carUuid,
        waypoints: data.waypoints.map(w => new THREE.Vector3(w.x, w.y, w.z))
    };
}
