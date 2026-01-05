// src/core/app.js
import { Renderer } from './renderer.js';
import { InputManager } from './input.js';
import { Drone } from '../drone/drone.js';
import { CameraController } from '../drone/camera.js';
import { Person } from '../person/person.js';
import { PersonCameraController } from '../person/camera.js';
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
import { DevMode } from '../dev/devMode.js';
import { PhotoMode } from '../ui/photoMode.js';
import { NotificationSystem } from '../ui/notifications.js';
import { HelpSystem } from '../ui/help.js';
import { Minimap } from '../ui/minimap.js';
import { EnvironmentSystem } from '../world/environmentSystem.js';

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
        this.notifications = new NotificationSystem(); // Init Notification System
        this.hud = new HUD();
        this.help = new HelpSystem(this);
        this.menu = new MenuSystem(this);
        this.hud.onPause = () => this.menu.toggle();
        this.audio = new AudioManager();

        this.world = new World(this.renderer.scene);
        this.particles = new ParticleSystem(this.renderer.scene);

        this.colliderSystem = new ColliderSystem();
        this.colliderSystem.addStatic(this.world.getStaticColliders());
        this.physics = new PhysicsEngine(this.colliderSystem);

        this.drone = new Drone(this.renderer.scene);
        this.battery = new BatteryManager();
        this.person = new Person(this.renderer.scene);
        this.person.setVisible(true);
        this.mode = 'person';
        this.drone.mesh.visible = false;

        // Pass drone to world for BirdSystem
        this.world.birdSystem.setDrone(this.drone);
        // Also attach battery for drain
        this.drone.battery = this.battery;

        this.rings = new RingManager(this.renderer.scene, this.drone, this.colliderSystem);

        this.tutorial = new TutorialManager(this);
        this.compass = new RingCompass(this.renderer.scene, this.drone, this.rings);
        this.minimap = new Minimap(this.renderer.scene, this.drone, this.world, this.rings);

        this.environment = new EnvironmentSystem(this.renderer);

        this.cameraController = new CameraController(this.renderer.camera, this.drone);
        this.personCamera = new PersonCameraController(this.renderer.camera, this.person);

        this.post = new PostProcessing(this.renderer.threeRenderer, this.renderer.scene, this.renderer.camera);
        window.addEventListener('renderer-resize', (e) => {
            this.post.setSize(e.detail.width, e.detail.height);
        });

        this.devMode = new DevMode(this);
        this.photoMode = new PhotoMode(this);

        this.notifications.show("System Initialized", "info", 2000);

        this.running = true;
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    update(dt) {
        // Photo Mode Handling
        if (this.photoMode && this.photoMode.enabled) {
            this.photoMode.update(dt);
            this.input.resetFrame();
            return;
        }

        // Update environment first (Time Cycle)
        if (this.environment) {
            this.environment.updateCycleAndLighting(dt, this.world?.timeCycle);
        }

        // Dev Mode Handling
        if (this.devMode && this.devMode.enabled) {
            this.devMode.update(dt);
            // Even in Dev Mode, we want to update environment visuals
            if (this.environment) {
                this.environment.updateVisuals(
                    dt,
                    this.renderer.camera,
                    this.drone,
                    this.world.wind,
                    this.world.timeCycle
                );
            }
            // Update light system even in Dev Mode for accurate visuals
            if (this.world) {
                // We use world.update's signature, but in Dev Mode main world update is skipped.
                // We should manually update lightSystem if needed, or allow it to update.
                // However, world.update(dt) updates all entities which we might want paused.
                // So we explicitly call lightSystem update here.
                if (this.world.lightSystem) {
                    this.world.lightSystem.update(dt, this.renderer.camera, this.world.timeCycle);
                }
            }

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
        move.jump = this.input.actions.jump;

        if (events.reset) {
            this._resetGame();
        }

        if (events.summonDrone && this.mode === 'person') {
            this._enterDroneMode({ summon: true });
        }

        if (this.mode === 'person') {
            this.world.update(dt, this.renderer.camera);
            this.particles.update(dt);
            this.rings.update(dt);

            const ringColliders = this.rings.rings.map(r => ({
                type: 'ring',
                mesh: r.mesh,
                box: null
            }));

            this.person.update(dt, move, this.colliderSystem, ringColliders);

            const speed = this.person.velocity.length();
            const alt = this.person.position.y;

            this.hud.update({
                speed: speed,
                altitude: alt,
                rings: this.rings.collectedCount,
                battery: this.person.life.current,
                resourceLabel: 'HEALTH',
                showSecondary: false,
                message: ""
            });
        } else if (this.drone) {
            this.tutorial.update(dt, move);

            this.battery.update(dt, this.drone.velocity, move);
            if (this.battery.depleted) {
                move.y = -1; move.x = 0; move.z = 0;
            }

            this.world.update(dt, this.renderer.camera); // Birds & Vehicles & Lights
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

            // Landing Pad Recharge Logic
            // Relaxed check: Prioritize height over strict velocity to handle micro-bounces
            // Bolt Optimization: Iterate only landingPads instead of all world.colliders
            this.world.landingPads.forEach(entity => {
                if (entity.mesh) {
                    const localPos = this.drone.position.clone();
                    entity.mesh.worldToLocal(localPos);

                    // Local bounds: X:[-4,4], Z:[-4,4]
                    if (Math.abs(localPos.x) < 3.8 && Math.abs(localPos.z) < 3.8) {
                        // Vertical Check:
                        // Pad Surface is at Local Y = 0.5.
                        // Drone Physics Radius is 0.5.
                        // Ideally, Drone Center sits at Y = 1.0 (0.5 + 0.5).
                        // Allow generous window [0.5, 1.5] to handle penetration (held down) or bounces.
                        if (localPos.y > 0.5 && localPos.y < 1.5) {
                            this.battery.add(CONFIG.BATTERY.RECHARGE_RATE * dt);
                        }
                    }
                }
            });
            const speed = this.drone.velocity.length();
            this.audio.update(speed);

            const alt = this.drone.position.y;
            let statusMsg = "";
            let autoDisembark = false;
            if (this.battery.depleted) {
                if (speed < 0.1 && alt < 1.0) {
                    statusMsg = "BATTERY EMPTY - DISEMBARKING";
                    autoDisembark = true;
                } else {
                    statusMsg = "BATTERY EMPTY - LANDING";
                }
            }

            if (autoDisembark) {
                this._enterPersonMode();
                this.hud.update({
                    speed: 0,
                    altitude: this.person.position.y,
                    rings: this.rings.collectedCount,
                    battery: this.person.life.current,
                    resourceLabel: 'HEALTH',
                    showSecondary: false,
                    message: ""
                });
            } else {
                this.hud.update({
                    speed: speed,
                    altitude: alt,
                    battery: this.battery.current,
                    rings: this.rings.collectedCount,
                    resourceLabel: 'BATTERY',
                    secondaryLabel: 'HEALTH',
                    secondaryBattery: this.person.life.current,
                    showSecondary: true,
                    message: statusMsg
                });

                this.compass.update(dt);
                this.minimap.update();
            }
        }

        if (this.mode === 'person') {
            if (this.personCamera) {
                this.personCamera.update(dt);
            }
        } else if (this.cameraController) {
            this.cameraController.update(dt, move);
        }

        // Environment update is now handled at start of frame
        if (this.environment) {
            this.environment.updateVisuals(
                dt,
                this.renderer.camera,
                this.drone,
                this.world.wind,
                this.world.timeCycle
            );
        }

        this.input.resetFrame();
    }

    _enterPersonMode() {
        this.mode = 'person';
        this.drone.mesh.visible = false;
        this.person.setVisible(true);
        this.drone.resetAltitudeEffects();
        this.person.position.copy(this.drone.position);
        this.person.yaw = this.drone.yaw;
        this.person.velocity.set(0, 0, 0);
    }

    _enterDroneMode({ summon = false } = {}) {
        this.mode = 'drone';
        this.person.setVisible(false);
        this.drone.mesh.visible = true;

        if (summon) {
            const spawnPosition = this.person.position.clone();
            spawnPosition.y = Math.max(spawnPosition.y + 1.5, 2);
            this.drone.position.copy(spawnPosition);
            this.drone.yaw = this.person.yaw;
            this.drone.velocity.set(0, 0, 0);
            this.drone.tilt = { pitch: 0, roll: 0 };

            this.drone.mesh.position.copy(this.drone.position);
            this.drone.mesh.rotation.y = this.drone.yaw;
            this.drone.tiltGroup.rotation.set(0, 0, 0);
        } else {
            this.drone.position.copy(this.person.position);
            this.drone.yaw = this.person.yaw;
            this.drone.mesh.position.copy(this.drone.position);
            this.drone.mesh.rotation.y = this.drone.yaw;
        }
    }

    _resetGame() {
        // Check for Player Start points
        const starts = this.world.colliders.filter(e => e.type === 'playerStart');
        let spawnPosition = new THREE.Vector3(0, 5, 0);
        let spawnYaw = 0;

        if (starts.length > 0) {
            const start = starts[Math.floor(Math.random() * starts.length)];
            // Use the mesh position to ensure we get the world transform
            spawnPosition = start.mesh.position.clone();
            spawnYaw = start.mesh.rotation.y;
        } else {
            spawnPosition.set(0, 5, 0);
            spawnYaw = 0;
        }

        this.drone.position.copy(spawnPosition);
        this.drone.yaw = spawnYaw;
        this.drone.velocity.set(0, 0, 0);
        this.drone.tilt = { pitch: 0, roll: 0 };

        // Sync visual mesh immediately to avoid one-frame jumps
        this.drone.mesh.position.copy(this.drone.position);
        this.drone.mesh.rotation.y = this.drone.yaw;
        this.drone.tiltGroup.rotation.set(0, 0, 0);

        const personSpawn = spawnPosition.clone();
        if (starts.length === 0) {
            personSpawn.y = 1;
        }
        this.person.position.copy(personSpawn);
        this.person.yaw = spawnYaw;
        this.person.velocity.set(0, 0, 0);
        this.person.life.reset();

        this.battery.reset();
        this.rings.reset();
        this.tutorial.reset();
    }

    loadMap(data) {
        console.log("Loading Map...", data);
        this.notifications.show("Loading Map...", "info");

        // Load World First (Base/Legacy Objects) so objects exist before reset checks for PlayerStart

        // Step 1: Handle History / Hybrid Loading
        // We need to decide which objects from data.objects to load.
        // If history exists, we should NOT load objects that are created by the history to avoid duplicates.
        let objectsToLoad = data.objects || [];
        let historyCommands = [];

        if (data.history && Array.isArray(data.history) && data.history.length > 0) {
             console.log("History found. Analyzing for hybrid load...");

             // Extract UUIDs created in history
             const createdUUIDs = new Set();
             data.history.forEach(cmd => {
                 if (cmd.type === 'CreateObject' && cmd.serializedData) {
                     cmd.serializedData.forEach(obj => {
                         if (obj.params?.uuid) createdUUIDs.add(obj.params.uuid);
                     });
                 }
             });

             // Filter objects: Keep only those NOT created in history (Legacy/Base objects)
             objectsToLoad = objectsToLoad.filter(obj => {
                 const uuid = obj.params?.uuid;
                 return !uuid || !createdUUIDs.has(uuid);
             });

             historyCommands = data.history;
        }

        // Load World (Base/Legacy Objects)
        // We temporarily modify data.objects to pass to world.loadMap
        const filteredData = { ...data, objects: objectsToLoad };
        this.world.loadMap(filteredData);

        // Load Rings
        if (data.rings) {
            this.rings.loadRings(data.rings);
        }

        // Re-inject static colliders into physics system (for base objects)
        this.colliderSystem.clear();
        this.colliderSystem.addStatic(this.world.getStaticColliders());

        // Step 2: Replay History
        if (this.devMode && historyCommands.length > 0) {
            console.log(`Replaying ${historyCommands.length} history commands...`);

            // Reconstruct History Stack
            const CommandManager = this.devMode.history.constructor;
            const newHistory = CommandManager.fromJSON(historyCommands, this.devMode);

            // Execute Replay
            // We iterate the reconstructed undoStack and execute each command
            // Since fromJSON populates the undoStack, we can just iterate it.
            // CAUTION: 'execute' is usually 'redo'.

            // Clear current history before replay
            this.devMode.history.undoStack = [];
            this.devMode.history.redoStack = [];

            if (newHistory && newHistory.undoStack) {
                newHistory.undoStack.forEach(cmd => {
                     // Execute the command to apply changes to the world
                     if (cmd.execute) cmd.execute();
                     else if (cmd.redo) cmd.redo();

                     // Push to the REAL history stack so user can Undo
                     this.devMode.history.undoStack.push(cmd);
                });
            }

            // After replay, update physics again for new objects
            this.colliderSystem.clear(); // Rebuild fully to be safe
            this.colliderSystem.addStatic(this.world.getStaticColliders());
        }

        // Refresh DevMode if active (to show new visuals)
        if (this.devMode && this.devMode.enabled) {
            this.devMode.refreshVisibility();
        }

        // Reset Game State AFTER loading objects, so PlayerStart can be found
        this._resetGame();

        this.notifications.show("Map Loaded Successfully", "success");
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
