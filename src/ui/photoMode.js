import * as THREE from 'three';
import { CONFIG } from '../config.js';

export class PhotoMode {
    constructor(app) {
        this.app = app;
        this.enabled = false;

        // Camera State
        this.cameraPos = new THREE.Vector3();
        this.cameraRot = new THREE.Euler(0, 0, 0, 'YXZ');
        this.originalFov = 75;
        this.fov = 75;
        this.roll = 0;

        // Input State
        this.move = { x: 0, y: 0, z: 0 };
        this.rotate = { x: 0, y: 0 };
        this.speed = 20.0;
        this.keys = { w: false, a: false, s: false, d: false, q: false, e: false, shift: false };
        this.isDragging = false;
        this.lastMouse = { x: 0, y: 0 };

        this._createUI();
        this._bindInput();
    }

    _createUI() {
        const layer = document.getElementById('ui-layer');
        const ui = document.createElement('div');
        ui.className = 'photo-mode-ui hidden';
        ui.innerHTML = `
            <div class="photo-controls">
                <div class="photo-header">
                    <h2>PHOTO MODE</h2>
                    <button id="pm-close" class="pm-btn-icon" aria-label="Close">✕</button>
                </div>

                <div class="photo-hints">
                    <p>WASD to Move • Mouse to Look • Q/E Roll • Shift for Speed</p>
                </div>

                <div class="photo-settings">
                    <div class="pm-control">
                        <label>Field of View <span id="pm-fov-val">75</span></label>
                        <input type="range" id="pm-fov" min="30" max="120" value="75">
                    </div>
                    <div class="pm-control">
                        <label>Roll <span id="pm-roll-val">0</span></label>
                        <input type="range" id="pm-roll" min="-180" max="180" value="0">
                    </div>
                </div>

                <div class="photo-actions">
                    <button id="pm-snap" class="pm-btn-primary">📸 TAKE PHOTO</button>
                </div>
            </div>
            <div id="pm-flash" class="photo-flash"></div>
        `;
        layer.appendChild(ui);

        this.ui = {
            container: ui,
            close: ui.querySelector('#pm-close'),
            snap: ui.querySelector('#pm-snap'),
            fov: ui.querySelector('#pm-fov'),
            fovVal: ui.querySelector('#pm-fov-val'),
            roll: ui.querySelector('#pm-roll'),
            rollVal: ui.querySelector('#pm-roll-val'),
            flash: ui.querySelector('#pm-flash')
        };
    }

    _bindInput() {
        // UI Events
        this.ui.close.onclick = () => this.disable();
        this.ui.snap.onclick = () => this.takePhoto();

        this.ui.fov.oninput = (e) => {
            this.fov = parseFloat(e.target.value);
            this.ui.fovVal.innerText = this.fov;
            this.app.renderer.camera.fov = this.fov;
            this.app.renderer.camera.updateProjectionMatrix();
        };

        this.ui.roll.oninput = (e) => {
            this.roll = parseFloat(e.target.value);
            this.ui.rollVal.innerText = this.roll;
        };

        // Keyboard & Mouse (Only active when enabled)
        window.addEventListener('keydown', (e) => this._onKey(e, true));
        window.addEventListener('keyup', (e) => this._onKey(e, false));

        window.addEventListener('mousedown', (e) => {
            if (!this.enabled) return;
            // Only drag if not clicking UI
            if (e.target.closest('.photo-mode-ui')) return;
            this.isDragging = true;
            this.lastMouse.x = e.clientX;
            this.lastMouse.y = e.clientY;
        });

        window.addEventListener('mouseup', () => this.isDragging = false);

        window.addEventListener('mousemove', (e) => {
            if (!this.enabled || !this.isDragging) return;
            const sensitivity = 0.002;
            const dx = e.clientX - this.lastMouse.x;
            const dy = e.clientY - this.lastMouse.y;

            this.cameraRot.y -= dx * sensitivity;
            this.cameraRot.x -= dy * sensitivity;
            this.cameraRot.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.cameraRot.x));

            this.lastMouse.x = e.clientX;
            this.lastMouse.y = e.clientY;
        });
    }

    _onKey(e, down) {
        if (!this.enabled) return;
        const key = e.key.toLowerCase();
        if (this.keys.hasOwnProperty(key)) this.keys[key] = down;
        if (key === 'shift') this.keys.shift = down;

        // ESC to close
        if (down && e.key === 'Escape') this.disable();
    }

    enable() {
        this.enabled = true;
        this.app.paused = true;
        this.app.menu.hide(); // Hide pause menu if open
        this.app.hud.setVisible(false); // Hide HUD

        // Setup Camera
        const cam = this.app.renderer.camera;
        this.cameraPos.copy(cam.position);
        this.cameraRot.copy(cam.rotation);
        this.originalFov = cam.fov;
        this.fov = this.originalFov;
        this.roll = 0;

        // Reset controls
        this.ui.fov.value = this.fov;
        this.ui.fovVal.innerText = this.fov;
        this.ui.roll.value = 0;
        this.ui.rollVal.innerText = 0;

        this.ui.container.classList.remove('hidden');
    }

    disable() {
        this.enabled = false;
        this.app.paused = false; // Resume game
        this.app.hud.setVisible(true);
        this.ui.container.classList.add('hidden');

        // Restore Camera
        const cam = this.app.renderer.camera;
        cam.fov = this.originalFov;
        cam.updateProjectionMatrix();
        // Position/Rotation will be reset by CameraController next frame
    }

    update(dt) {
        if (!this.enabled) return;

        // Movement
        const speed = this.keys.shift ? this.speed * 2.5 : this.speed;
        const moveStep = speed * dt;

        const forward = new THREE.Vector3(0, 0, -1).applyEuler(this.cameraRot);
        const right = new THREE.Vector3(1, 0, 0).applyEuler(this.cameraRot);
        const up = new THREE.Vector3(0, 1, 0); // World Up for vertical movement logic? Or camera up?
        // Let's use Camera Up for "Space/Ctrl" but we mapped Q/E to Roll.
        // Actually, let's map Q/E to Up/Down for free cam if we want, but UI says Q/E Roll.
        // Let's use R/F for Up/Down? Or Space/Ctrl?
        // Let's imply Standard FPS: WASD move, Mouse look.
        // Roll is just an effect.

        if (this.keys.w) this.cameraPos.addScaledVector(forward, moveStep);
        if (this.keys.s) this.cameraPos.addScaledVector(forward, -moveStep);
        if (this.keys.a) this.cameraPos.addScaledVector(right, -moveStep);
        if (this.keys.d) this.cameraPos.addScaledVector(right, moveStep);

        // Apply Transform
        const cam = this.app.renderer.camera;
        cam.position.copy(this.cameraPos);
        cam.rotation.copy(this.cameraRot);
        cam.rotation.z = this.roll * (Math.PI / 180);
    }

    takePhoto() {
        // Hide UI
        this.ui.container.classList.add('hidden');

        // Render Frame immediately
        this.app.post.render(0); // Use 0 dt just to draw

        // Capture
        try {
            const dataURL = this.app.renderer.domElement.toDataURL('image/png');

            // Download
            const link = document.createElement('a');
            const date = new Date().toISOString().slice(0,19).replace(/[:T]/g,'-');
            link.download = `drone-city-${date}.png`;
            link.href = dataURL;
            link.click();

            // Flash Effect
            this.ui.flash.style.opacity = 1;
            setTimeout(() => this.ui.flash.style.opacity = 0, 100);

        } catch (e) {
            console.error("Photo Capture Failed:", e);
        }

        // Restore UI
        this.ui.container.classList.remove('hidden');
    }
}
