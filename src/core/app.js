// src/core/app.js
import * as THREE from 'three';
import { Renderer } from './renderer.js';
import { InputManager } from './input.js';
import { Drone } from '../drone/drone.js';
import { CameraController } from '../drone/camera.js';
import { World } from '../world/world.js';
import { ColliderSystem } from '../world/colliders.js';
import { PhysicsEngine } from '../drone/physics.js';
import { HUD } from '../ui/hud.js';
import { BatteryManager } from '../drone/battery.js';
import { RingManager } from '../gameplay/rings.js';
import { AudioManager } from '../audio/audio.js';
import { CONFIG } from '../config.js';

export class App {
    constructor() {
        this.container = document.getElementById('game-container');
        this.lastTime = 0;
        this.running = false;
    }

    init() {
        console.log('App: Initializing...');

        this.renderer = new Renderer(this.container);
        this.input = new InputManager();
        this.hud = new HUD();
        this.audio = new AudioManager(); // New

        this._setupLights();
        this.world = new World(this.renderer.scene);

        this.colliderSystem = new ColliderSystem();
        this.colliderSystem.addStatic(this.world.getStaticColliders());
        this.physics = new PhysicsEngine(this.colliderSystem);

        this.drone = new Drone(this.renderer.scene);
        this.battery = new BatteryManager();
        this.rings = new RingManager(this.renderer.scene, this.drone);

        this.cameraController = new CameraController(this.renderer.camera, this.drone);

        this.running = true;
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    _setupLights() {
        const ambient = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
        this.renderer.add(ambient);
        const sun = new THREE.DirectionalLight(0xffffff, 1.0);
        sun.position.set(50, 80, 50);
        sun.castShadow = true;
        sun.shadow.mapSize.width = 2048;
        sun.shadow.mapSize.height = 2048;
        sun.shadow.camera.near = 0.5;
        sun.shadow.camera.far = 500;
        const d = 100;
        sun.shadow.camera.left = -d;
        sun.shadow.camera.right = d;
        sun.shadow.camera.top = d;
        sun.shadow.camera.bottom = -d;
        this.renderer.add(sun);
    }

    update(dt) {
        const move = this.input.getMovementInput();
        const events = this.input.getEvents();
        move.toggleCamera = events.toggleCamera;
        move.cameraUp = this.input.actions.cameraUp;
        move.cameraDown = this.input.actions.cameraDown;

        if (events.reset) {
            this._resetGame();
        }

        if (this.drone) {
            // Battery
            this.battery.update(dt, this.drone.velocity, move);
            if (this.battery.depleted) {
                move.y = -1;
                move.x = 0;
                move.z = 0;
            }

            // Physics
            this.drone.update(dt, move);
            const collided = this.physics.resolveCollisions(this.drone);
            if (collided) {
                // Limit impact sound frequency? For now simple.
                // Only play if speed was high enough?
                if (this.drone.velocity.length() > 1.0) {
                     this.audio.playImpact();
                }
            }

            // Rings
            const collected = this.rings.update(dt);
            if (collected) {
                this.battery.add(CONFIG.BATTERY.REWARD);
                this.audio.playCollect();
            }

            // Audio Engine Update
            const speed = this.drone.velocity.length();
            this.audio.update(speed);

            // HUD
            const alt = this.drone.position.y;
            let statusMsg = this.battery.depleted ? "BATTERY EMPTY - LANDING" : "";

            this.hud.update({
                speed: speed,
                altitude: alt,
                battery: this.battery.current,
                rings: this.rings.collectedCount,
                message: statusMsg
            });
        }

        if (this.cameraController) {
            this.cameraController.update(dt, move);
        }

        this.input.resetFrame();
    }

    _resetGame() {
        this.drone.position.set(0, 5, 0);
        this.drone.velocity.set(0, 0, 0);
        this.drone.yaw = 0;
        this.battery.reset();
        this.rings.reset();
    }

    animate(timestamp) {
        if (!this.running) return;
        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
        this.lastTime = timestamp;
        this.update(dt);
        this.renderer.render();
        requestAnimationFrame(this.animate);
    }
}
