// src/dev/devCamera.js
import * as THREE from 'three';
import { CONFIG } from '../config.js';

export class DevCameraController {
    constructor(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement;
        this.enabled = false;

        this.speed = 50.0;
        this.lookSpeed = 0.002;

        this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
        this.keys = { w: false, a: false, s: false, d: false, q: false, e: false };

        this._bindEvents();
    }

    _bindEvents() {
        window.addEventListener('keydown', (e) => this._onKey(e, true));
        window.addEventListener('keyup', (e) => this._onKey(e, false));
        this.domElement.addEventListener('mousedown', (e) => this._onMouseDown(e));
        this.domElement.addEventListener('mouseup', (e) => this._onMouseUp(e));
        this.domElement.addEventListener('mousemove', (e) => this._onMouseMove(e));
        this.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    _onKey(e, pressed) {
        if (!this.enabled) return;
        switch(e.key.toLowerCase()) {
            case 'w': this.keys.w = pressed; break;
            case 'a': this.keys.a = pressed; break;
            case 's': this.keys.s = pressed; break;
            case 'd': this.keys.d = pressed; break;
            case 'q': this.keys.q = pressed; break; // Down
            case 'e': this.keys.e = pressed; break; // Up
        }
    }

    _onMouseDown(e) {
        if (!this.enabled) return;
        if (e.button === 2) { // Right click
            this.isRotating = true;
            this.domElement.requestPointerLock();
        }
    }

    _onMouseUp(e) {
        if (!this.enabled) return;
        if (e.button === 2) {
            this.isRotating = false;
            document.exitPointerLock();
        }
    }

    _onMouseMove(e) {
        if (!this.enabled || !this.isRotating) return;

        const movementX = e.movementX || e.mozMovementX || e.webkitMovementX || 0;
        const movementY = e.movementY || e.mozMovementY || e.webkitMovementY || 0;

        this.euler.setFromQuaternion(this.camera.quaternion);

        this.euler.y -= movementX * this.lookSpeed;
        this.euler.x -= movementY * this.lookSpeed;

        this.euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.euler.x));

        this.camera.quaternion.setFromEuler(this.euler);
    }

    update(dt) {
        if (!this.enabled) return;

        const move = new THREE.Vector3();
        if (this.keys.w) move.z -= 1;
        if (this.keys.s) move.z += 1;
        if (this.keys.a) move.x -= 1;
        if (this.keys.d) move.x += 1;
        if (this.keys.e) move.y += 1;
        if (this.keys.q) move.y -= 1;

        move.normalize().multiplyScalar(this.speed * dt);

        // Apply rotation to move vector (except Y usually? No, free fly means relative to cam)
        move.applyQuaternion(this.camera.quaternion);

        this.camera.position.add(move);
    }
}
