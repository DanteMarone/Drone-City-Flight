// src/core/app.js
import * as THREE from 'three';
import { Renderer } from './renderer.js';
import { InputManager } from './input.js';
import { Drone } from '../drone/drone.js';
import { CameraController } from '../drone/camera.js';
import { World } from '../world/world.js';
import { ColliderSystem } from '../world/colliders.js';
import { PhysicsEngine } from '../drone/physics.js';

export class App {
    constructor() {
        this.container = document.getElementById('game-container');
        this.lastTime = 0;
        this.running = false;
    }

    init() {
        console.log('App: Initializing...');

        // 1. Setup Renderer
        this.renderer = new Renderer(this.container);

        // 2. Setup Input
        this.input = new InputManager();

        // 3. Setup World
        this._setupLights();
        this.world = new World(this.renderer.scene);

        // 4. Setup Collision System
        this.colliderSystem = new ColliderSystem();
        // Register static world objects
        this.colliderSystem.addStatic(this.world.getStaticColliders());

        this.physics = new PhysicsEngine(this.colliderSystem);

        // 5. Setup Drone
        this.drone = new Drone(this.renderer.scene);

        // 6. Setup Camera Controller
        this.cameraController = new CameraController(this.renderer.camera, this.drone);

        // 7. Start Loop
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

        // Optimize shadow map
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
        // Input
        const move = this.input.getMovementInput();
        const events = this.input.getEvents();
        move.toggleCamera = events.toggleCamera;
        move.cameraUp = this.input.actions.cameraUp;
        move.cameraDown = this.input.actions.cameraDown;

        // Update Drone Physics Movement
        if (this.drone) {
            this.drone.update(dt, move);

            // Resolve Collisions (modifies drone position/velocity)
            const collided = this.physics.resolveCollisions(this.drone);
            if (collided) {
                // TODO: Play crash sound / particles
                // console.log('Bump!');
            }
        }

        // Update Camera
        if (this.cameraController) {
            this.cameraController.update(dt, move);
        }

        this.input.resetFrame();
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
