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
}

export class TransformCommand extends BaseCommand {
    constructor(devMode, beforeStates, afterStates, description = 'Transform change') {
        super(description);
        this.devMode = devMode;
        this.beforeStates = beforeStates;
        this.afterStates = afterStates;
    }

    undo() {
        this.devMode.applyTransformSnapshot(this.beforeStates);
    }

    redo() {
        this.devMode.applyTransformSnapshot(this.afterStates);
    }
}

export class ValueChangeCommand extends BaseCommand {
    constructor(applyFn, beforeValue, afterValue, description = 'Value change') {
        super(description);
        this.applyFn = applyFn;
        this.beforeValue = beforeValue;
        this.afterValue = afterValue;
    }

    undo() {
        this.applyFn(this.beforeValue);
    }

    redo() {
        this.applyFn(this.afterValue);
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
            .map(data => this.devMode._instantiateFromClipboard(this.devMode._deepClone(data)))
            .filter(Boolean);
        this.objects = recreated;
        if (recreated.length > 0) {
            this.devMode.selectObjects(recreated);
        }
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
            .map(data => this.devMode._instantiateFromClipboard(this.devMode._deepClone(data)))
            .filter(Boolean);
        this.objects = recreated;
        if (recreated.length > 0) {
            this.devMode.selectObjects(recreated);
        }
    }

    redo() {
        if (this.objects.length === 0) {
            // If redo happens before undo, there is nothing to remove
            this.objects = this.serializedData
                .map(data => this.devMode._instantiateFromClipboard(this.devMode._deepClone(data)))
                .filter(Boolean);
        }
        this.devMode._removeObjects(this.objects);
        this.objects = [];
        this.devMode.selectObject(null);
    }
}

export class WaypointCommand extends BaseCommand {
    constructor(devMode, statesBefore, statesAfter, description = 'Waypoint change') {
        super(description);
        this.devMode = devMode;
        this.statesBefore = statesBefore;
        this.statesAfter = statesAfter;
    }

    undo() {
        this.devMode.applyWaypointSnapshot(this.statesBefore);
    }

    redo() {
        this.devMode.applyWaypointSnapshot(this.statesAfter);
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
