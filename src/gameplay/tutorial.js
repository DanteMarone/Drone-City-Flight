// src/gameplay/tutorial.js
import { CONFIG } from '../config.js';

export class TutorialManager {
    constructor(app) {
        this.app = app;
        this.active = true;
        this.step = 0;
        this.timer = 0;

        // Steps definition
        this.steps = [
            {
                id: 'welcome',
                text: "Welcome Pilot! Use W/S to Ascend/Descend.",
                check: (input, drone) => input.y !== 0
            },
            {
                id: 'yaw',
                text: "Use A/D to Rotate (Yaw).",
                check: (input, drone) => input.yaw !== 0
            },
            {
                id: 'move',
                text: "Use Arrows or I/J/K/L to Move Horizontally.",
                check: (input, drone) => Math.abs(input.x) > 0 || Math.abs(input.z) > 0
            },
            {
                id: 'camera',
                text: "Use Q/E to Tilt Camera. C for FPV.",
                check: (input, drone) => input.cameraUp || input.cameraDown || input.toggleCamera
            },
            {
                id: 'collect',
                text: "Fly through a Ring to recharge battery!",
                check: (input, drone) => this.app.rings.collectedCount > 0
            },
            {
                id: 'done',
                text: "Tutorial Complete! Fly Safe.",
                check: () => false // End state
            }
        ];

        // Check localStorage
        if (localStorage.getItem('tutorial_complete') === 'true') {
            this.active = false;
            this.step = this.steps.length - 1; // Jump to end
        }

        this._createDOM();
    }

    _createDOM() {
        const layer = document.getElementById('ui-layer');
        this.box = document.createElement('div');
        this.box.className = 'tutorial-box hidden';
        layer.appendChild(this.box);
    }

    update(dt, input) {
        if (!this.active || this.step >= this.steps.length) return;

        const currentStep = this.steps[this.step];

        // Show box
        this.box.innerText = currentStep.text;
        this.box.classList.remove('hidden');

        // Special handling for last step (Done)
        if (this.step === this.steps.length - 1) {
            this.timer += dt;
            if (this.timer > 4.0) {
                this.complete();
            }
            return;
        }

        // Check condition
        if (currentStep.check(input, this.app.drone)) {
            this.timer += dt;
            if (this.timer > 1.0) { // Hold for 1s to confirm
                this._nextStep();
            }
        } else {
            this.timer = 0;
        }
    }

    _nextStep() {
        this.step++;
        this.timer = 0;
        // Pulse effect or sound?
        console.log("Tutorial Step Complete");
    }

    complete() {
        this.active = false;
        this.box.classList.add('hidden');
        localStorage.setItem('tutorial_complete', 'true');
    }

    reset() {
        this.active = true;
        this.step = 0;
        this.timer = 0;
        localStorage.removeItem('tutorial_complete');
    }
}
