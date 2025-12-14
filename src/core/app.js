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
import { MenuSystem } from '../ui/menu.js';
import { RingCompass } from '../ui/compass.js';
import { BatteryManager } from '../drone/battery.js';
import { RingManager } from '../gameplay/rings.js';
import { TutorialManager } from '../gameplay/tutorial.js';
import { AudioManager } from '../audio/audio.js';
import { ParticleSystem } from '../fx/particles.js';
import { PostProcessing } from '../fx/post.js';
import { CONFIG } from '../config.js';
import { BuildMode } from '../dev/buildMode.js';
import { Skybox } from '../world/skybox.js';
import { CloudSystem } from '../world/clouds.js';

export class App {
    constructor() {
        this.container = document.getElementById('game-container');
        this.lastTime = 0;
        this.running = false;
        this.paused = false;
    }

    init() {
        console.log('App: Initializing...');

        this.renderer = new Renderer(this.container);
        this.input = new InputManager();
        this.hud = new HUD();
        this.menu = new MenuSystem(this);
        this.audio = new AudioManager();

        this._setupLights();
        this.world = new World(this.renderer.scene);
        this.particles = new ParticleSystem(this.renderer.scene);

        this.colliderSystem = new ColliderSystem();
        this.colliderSystem.addStatic(this.world.getStaticColliders());
        this.physics = new PhysicsEngine(this.colliderSystem);

        this.drone = new Drone(this.renderer.scene);
        this.battery = new BatteryManager();

        // Pass drone to world for BirdSystem
        this.world.birdSystem.setDrone(this.drone);
        // Also attach battery for drain
        this.drone.battery = this.battery;

        this.rings = new RingManager(this.renderer.scene, this.drone);

        this.tutorial = new TutorialManager(this);
        this.compass = new RingCompass(this.renderer.scene, this.drone, this.rings); // New

        this.skybox = new Skybox(this.renderer.scene);
        this.cloudSystem = new CloudSystem(this.renderer.scene);

        this.cameraController = new CameraController(this.renderer.camera, this.drone);

        this.post = new PostProcessing(this.renderer.threeRenderer, this.renderer.scene, this.renderer.camera);
        window.addEventListener('renderer-resize', (e) => {
            this.post.setSize(e.detail.width, e.detail.height);
        });

        this.buildMode = new BuildMode(this);

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
        // Build Mode Handling
        if (this.buildMode && this.buildMode.enabled) {
            this.buildMode.update(dt);
            // Allow basic input processing if needed, but skip game logic
            this.input.resetFrame();
            return;
        }

        const events = this.input.getEvents();
        if (events.pause) {
            this.menu.toggle();
        }

        // Menu Pause Handling
        if (this.paused) {
            this.input.resetFrame();
            return;
        }

        const move = this.input.getMovementInput();
        move.toggleCamera = events.toggleCamera;
        move.cameraUp = this.input.actions.cameraUp;
        move.cameraDown = this.input.actions.cameraDown;

        if (events.reset) {
            this._resetGame();
        }

        if (this.drone) {
            this.tutorial.update(dt, move);

            this.battery.update(dt, this.drone.velocity, move);
            if (this.battery.depleted) {
                move.y = -1; move.x = 0; move.z = 0;
            }

            this.world.update(dt); // Birds & Vehicles
            this.particles.update(dt);

            this.drone.update(dt, move);

            // Collisions
            const ringColliders = this.rings.rings.map(r => ({
                type: 'ring',
                mesh: r.mesh,
                box: null // Special handling
            }));

            const dynamicColliders = [...ringColliders];

            const collided = this.physics.resolveCollisions(this.drone, dynamicColliders);

            if (collided) {
                if (this.drone.velocity.length() > 1.0) {
                     this.audio.playImpact();
                     this.particles.emit(this.drone.position, 10, 0xff0000);
                }
            }

            const collected = this.rings.update(dt);
            if (collected) {
                this.battery.add(CONFIG.BATTERY.REWARD);
                this.audio.playCollect();
                this.particles.emit(this.drone.position, 20, 0xffff00);
            }

            const speed = this.drone.velocity.length();
            this.audio.update(speed);

            const alt = this.drone.position.y;
            let statusMsg = "";
            if (this.battery.depleted) {
                if (speed < 0.1 && alt < 1.0) {
                    statusMsg = "BATTERY EMPTY. PRESS R TO RESET.";
                } else {
                    statusMsg = "BATTERY EMPTY - LANDING";
                }
            }

            this.hud.update({
                speed: speed,
                altitude: alt,
                battery: this.battery.current,
                rings: this.rings.collectedCount,
                message: statusMsg
            });

            this.compass.update(dt); // New
        }

        if (this.cameraController) {
            this.cameraController.update(dt, move);
        }

        if (this.skybox) {
            this.skybox.update(this.renderer.camera.position);
        }

        if (this.cloudSystem) {
            this.cloudSystem.update(dt, this.drone.position, this.renderer.camera);
        }

        this.input.resetFrame();
    }

    _resetGame() {
        this.drone.position.set(0, 5, 0);
        this.drone.velocity.set(0, 0, 0);
        this.drone.yaw = 0;
        this.battery.reset();
        this.rings.reset();
        this.tutorial.reset();
    }

    loadMap(data) {
        console.log("Loading Map...", data);
        // Reset Game State
        this._resetGame();

        // Load World
        this.world.loadMap(data);

        // Load Rings
        if (data.rings) {
            this.rings.loadRings(data.rings);
        }

        // Re-inject static colliders into physics system
        this.colliderSystem.clear();
        this.colliderSystem.addStatic(this.world.getStaticColliders());

        // Refresh BuildMode if active (to show new visuals)
        if (this.buildMode && this.buildMode.enabled) {
            this.buildMode.refreshVisibility();
        }
    }

    animate(timestamp) {
        if (!this.running) return;
        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
        this.lastTime = timestamp;

        this.update(dt);
        this.post.render(dt);

        requestAnimationFrame(this.animate);
    }
}
