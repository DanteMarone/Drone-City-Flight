// src/core/input.js
import { CONFIG } from '../config.js';

export class InputManager {
    constructor() {
        this.keys = {}; // Current state of keys (true = pressed)
        this.bindings = CONFIG.INPUT.KEYBOARD;

        // Actions state (abstracted from keys)
        this.actions = {
            ascend: false,
            descend: false,
            yawLeft: false,
            yawRight: false,
            forward: false,
            backward: false,
            left: false,
            right: false,
            jump: false,
            cameraUp: false,
            cameraDown: false,
            boost: false
        };

        // One-shot events
        this.events = {
            toggleCamera: false,
            reset: false,
            pause: false
        };

        this._onKeyDown = this._onKeyDown.bind(this);
        this._onKeyUp = this._onKeyUp.bind(this);

        window.addEventListener('keydown', this._onKeyDown);
        window.addEventListener('keyup', this._onKeyUp);
    }

    _onKeyDown(e) {
        this.keys[e.code] = true;
        this._updateActions();

        // Handle triggers
        if (e.code === this.bindings.TOGGLE_CAMERA) this.events.toggleCamera = true;
        if (e.code === this.bindings.RESET) this.events.reset = true;
        if (e.code === this.bindings.PAUSE) this.events.pause = true;
    }

    _onKeyUp(e) {
        this.keys[e.code] = false;
        this._updateActions();
    }

    _updateActions() {
        const b = this.bindings;
        const k = this.keys;

        this.actions.ascend = !!k[b.ASCEND];
        this.actions.descend = !!k[b.DESCEND];
        this.actions.yawLeft = !!k[b.YAW_LEFT];
        this.actions.yawRight = !!k[b.YAW_RIGHT];
        this.actions.forward = !!k[b.FORWARD] || !!k[b.FORWARD_ALT];
        this.actions.backward = !!k[b.BACKWARD] || !!k[b.BACKWARD_ALT];
        this.actions.left = !!k[b.LEFT] || !!k[b.LEFT_ALT];
        this.actions.right = !!k[b.RIGHT] || !!k[b.RIGHT_ALT];
        this.actions.jump = !!k[b.JUMP];
        this.actions.cameraUp = !!k[b.CAMERA_UP];
        this.actions.cameraDown = !!k[b.CAMERA_DOWN];
        this.actions.boost = !!k[b.BOOST] || !!k['ShiftRight'];
    }

    // Called at end of frame to clear one-shot events
    resetFrame() {
        this.events.toggleCamera = false;
        this.events.reset = false;
        this.events.pause = false;
    }

    getEvents() {
        return this.events;
    }

    // Get a vector representation of direction inputs
    getMovementInput() {
        const x = (this.actions.right ? 1 : 0) - (this.actions.left ? 1 : 0);
        const z = (this.actions.backward ? 1 : 0) - (this.actions.forward ? 1 : 0);
        const y = (this.actions.ascend ? 1 : 0) - (this.actions.descend ? 1 : 0);
        const yaw = (this.actions.yawLeft ? 1 : 0) - (this.actions.yawRight ? 1 : 0);
        return { x, y, z, yaw };
    }
}
