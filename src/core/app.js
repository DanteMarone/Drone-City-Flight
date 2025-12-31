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
import { DevMode } from '../dev/devMode.js';
import { Skybox } from '../world/skybox.js';
import { CloudSystem } from '../world/clouds.js';
import { PhotoMode } from '../ui/photoMode.js';
import { NotificationSystem } from '../ui/notifications.js';

export class App {
    constructor() {
        this.container = document.getElementById('game-container');
        this.lastTime = 0;
        this.running = false;
        this.paused = false;

        // Ambient System helpers
        this._ambienceTimer = 0;
        this._natureFactor = 0;
        // Optimized set for O(1) nature checks
        this._natureTypes = new Set([
            'oakTree', 'pineTree', 'willowTree', 'palmTree', 'cherryBlossomTree',
            'parkNatureSmall', 'parkPlaysetSmall', 'parkWaterLarge', 'gazebo',
            'lilyPond', 'lotusPond', 'mushroomPatch'
        ]);
    }

    init() {
        console.log('App: Initializing...');

        this.renderer = new Renderer(this.container);
        this.input = new InputManager();
        this.notifications = new NotificationSystem(); // Init Notification System
        this.hud = new HUD();
        this.menu = new MenuSystem(this);
        this.hud.onPause = () => this.menu.toggle();
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

        this.rings = new RingManager(this.renderer.scene, this.drone, this.colliderSystem);

        this.tutorial = new TutorialManager(this);
        this.compass = new RingCompass(this.renderer.scene, this.drone, this.rings); // New

        this.skybox = new Skybox(this.renderer.scene);
        this.cloudSystem = new CloudSystem(this.renderer.scene);

        this.cameraController = new CameraController(this.renderer.camera, this.drone);

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

    _setupLights() {
        this.ambientLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
        this.renderer.add(this.ambientLight);

        this.sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
        this.sunLight.position.set(50, 80, 50);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 500;

        // Slightly larger shadow frustum for long shadows
        const d = 120;
        this.sunLight.shadow.camera.left = -d;
        this.sunLight.shadow.camera.right = d;
        this.sunLight.shadow.camera.top = d;
        this.sunLight.shadow.camera.bottom = -d;
        this.renderer.add(this.sunLight);
    }

    update(dt) {
        // Photo Mode Handling
        if (this.photoMode && this.photoMode.enabled) {
            this.photoMode.update(dt);
            this.input.resetFrame();
            return;
        }

        // Update environment first (Time Cycle)
        this._updateEnvironment(dt);

        // Dev Mode Handling
        if (this.devMode && this.devMode.enabled) {
            this.devMode.update(dt);
            // Even in Dev Mode, we want to update environment visuals
            if (this.skybox) {
                this.skybox.update(this.renderer.camera.position, this.world.timeCycle);
            }
            if (this.cloudSystem) {
                this.cloudSystem.update(dt, this.drone.position, this.renderer.camera, this.world.wind, this.world.timeCycle);
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

        if (events.reset) {
            this._resetGame();
        }

        if (this.drone) {
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
            this.world.colliders.forEach(entity => {
                if (entity.type === 'landingPad' && entity.mesh) {
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
            this._updateAmbience(dt);

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

        // Environment update is now handled at start of frame

        if (this.skybox) {
            // Skybox needs to know time/sun info
            this.skybox.update(this.renderer.camera.position, this.world.timeCycle);
        }

        if (this.cloudSystem) {
            this.cloudSystem.update(dt, this.drone.position, this.renderer.camera, this.world.wind, this.world.timeCycle);
        }

        this.input.resetFrame();
    }

    _updateAmbience(dt) {
        if (!this.audio || !this.drone || !this.colliderSystem) return;

        // 1. Calculate Altitude Factor
        // 0 to 60m: 0.0
        // 60 to 120m: 0.0 -> 1.0
        const alt = Math.max(0, this.drone.position.y);
        const altThreshold = 60.0;
        const altMax = 120.0;
        let altFactor = 0;

        if (alt > altThreshold) {
            altFactor = Math.min((alt - altThreshold) / (altMax - altThreshold), 1.0);
        }

        // 2. Calculate Nature Factor (Park vs City)
        // Check surrounding entities every 1s (60 frames approx, or use dt accumulator)
        this._ambienceTimer += dt;
        if (this._ambienceTimer > 1.0) {
            this._ambienceTimer = 0;

            // Query nearby objects (radius 50m matches bird chase radius)
            // Spatial Hash returns a list of objects in the same cell(s)
            // Cell size is 100. Let's just query current cell.
            const nearby = this.colliderSystem.spatialHash.query(this.drone.position.x, this.drone.position.z);

            let natureCount = 0;
            let totalCount = 0;

            // Sample up to 20 objects to keep it cheap
            const sample = nearby.length > 20 ? nearby.slice(0, 20) : nearby;

            for (const obj of sample) {
                // Ignore roads/ground/rings for ratio calculation to focus on "landmarks"
                if (obj.type === 'road' || obj.type === 'ring' || obj.type === 'ground') continue;

                totalCount++;
                if (this._natureTypes.has(obj.type)) {
                    natureCount++;
                }
            }

            // Smooth transition for nature factor?
            // Actually, we just update the target value, let audio manager fade it.
            // If totalCount is low (empty space), default to City (0) or neutral?
            // Let's say empty space = City (distant traffic/rumble default).
            if (totalCount > 0) {
                this._natureFactor = natureCount / totalCount;
            } else {
                this._natureFactor = 0; // Default to city if empty
            }

            // Debug:
            // console.log(`Ambience: Alt=${altFactor.toFixed(2)}, Nature=${this._natureFactor.toFixed(2)}`);
        }

        this.audio.updateAmbience(dt, {
            altitudeFactor: altFactor,
            natureFactor: this._natureFactor
        });
    }

    _resetGame() {
        // Check for Player Start points
        const starts = this.world.colliders.filter(e => e.type === 'playerStart');

        if (starts.length > 0) {
            const start = starts[Math.floor(Math.random() * starts.length)];
            // Use the mesh position to ensure we get the world transform
            this.drone.position.copy(start.mesh.position);
            this.drone.yaw = start.mesh.rotation.y;
        } else {
            this.drone.position.set(0, 5, 0);
            this.drone.yaw = 0;
        }

        this.drone.velocity.set(0, 0, 0);
        this.drone.tilt = { pitch: 0, roll: 0 };

        // Sync visual mesh immediately to avoid one-frame jumps
        this.drone.mesh.position.copy(this.drone.position);
        this.drone.mesh.rotation.y = this.drone.yaw;
        this.drone.tiltGroup.rotation.set(0, 0, 0);

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

    _updateEnvironment(dt) {
        if (this.world && this.world.timeCycle) {
            const cycle = this.world.timeCycle;

            // Update cycle logic
            cycle.update(dt);

            // Apply Sun Position
            if (this.sunLight) {
                // Keep sun relative to drone/center to maximize shadow resolution near player
                // But the cycle calculates global orbit.
                // If we want shadows to work everywhere, sun needs to be far away or follow player.
                // DirectionalLight position matters for shadow camera box.
                // Let's keep sun "at infinity" direction-wise, but move position to follow drone x/z
                // to keep shadow map centered?
                // For now, let's just use the computed position from TimeCycle (relative to 0,0,0)
                // and maybe offset by drone pos if needed.
                // TimeCycle gives position on a sphere of radius 100.

                this.sunLight.position.copy(cycle.sunPosition);

                // Update Color & Intensity
                this.sunLight.color.copy(cycle.sunColor);
                this.sunLight.intensity = cycle.sunIntensity;
            }

            // Apply Ambient
            if (this.ambientLight) {
                this.ambientLight.color.copy(cycle.ambientColor);
                this.ambientLight.groundColor.setHex(0x111111); // Dark ground
                this.ambientLight.intensity = cycle.ambientIntensity;
            }

            // Fog (if enabled in scene, though config says density 0)
            if (this.renderer.scene.fog) {
                this.renderer.scene.fog.color.copy(cycle.fogColor);
            }
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
