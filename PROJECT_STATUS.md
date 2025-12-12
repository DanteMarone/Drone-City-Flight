# Project Status & Requirements

## 1. Product Goals
- [x] 1.1 Single-player casual drone flight (Chrome/Edge/Firefox).
- [x] 1.2 Arcade-realistic feel.
- [x] 1.3 Core loops: explore, battery, rings, collisions.
- [x] 1.4 Alive world (traffic, audio, animation).

## 2. Hard Constraints
- [x] 2.1 Three.js (WebGL).
- [x] 2.2 Vite dev server.
- [x] 2.3 No paid assets.
- [x] 2.4 Custom physics + bounding volumes.
- [x] 2.5 Deterministic deltaTime behavior.
- [x] 2.6 Performance first (stable FPS, LOD, culling).

## 3. Minimum Viable Feature Set
### 3.1 World
- [x] 3.1.1 Cohesive open world (Downtown, Suburbs, Commercial).
- [x] 3.1.2 Smooth transitions (no loading screens).
- [x] 3.1.3 Spawn area.

### 3.2 Drone & Controls
- [x] 3.2.1 Movement (Takeoff, Yaw, Translate, Vertical).
- [x] 3.2.2 Input Mapping (WASD, Arrows, Q/E, C, Shift, R, Esc).
- [x] 3.2.3 Horizontal orientation constraint.
- [x] 3.2.4 Chase camera snap-behind.
- [ ] 3.2.5 Gamepad support (optional).

### 3.3 Collision
- [x] 3.3.1 Collisions with static world.
- [x] 3.3.2 Efficient detection (broadphase).
- [x] 3.3.3 Feedback (Particles, Audio).
- [x] 3.3.4 Response (Bounce).
- [x] 3.3.5 Reset available.

### 3.4 Battery
- [x] 3.4.1 Visible HUD.
- [x] 3.4.2 Drain rules (Hover=0, Move, Ascend>Descend, Boost).
- [x] 3.4.3 Depletion logic.

### 3.5 Rings
- [x] 3.5.1 Procedural spawning.
- [ ] 3.5.2 Valid placement checks (Basic Random for now).
- [x] 3.5.3 Trigger rewards (Battery, Audio).
- [x] 3.5.4 Lifecycle logic.

### 3.6 UI/HUD
- [x] 3.6.1 Readable UI.
- [x] 3.6.2 HUD Elements (Battery, Speed, Altitude, Rings, Status).
- [x] 3.6.3 Pause Menu.
- [x] 3.6.4 Accessibility (Settings toggles).

### 3.7 Audio
- [x] 3.7.1 Drone motor pitch.
- [ ] 3.7.2 Ambient beds.
- [x] 3.7.3 SFX (Pickup, Collision).
- [x] 3.7.4 Synthesis/Procedural.

### 3.8 Visual Polish
- [x] 3.8.1 Sunlight + Shadows.
- [x] 3.8.2 Atmosphere/Fog.
- [x] 3.8.3 Water material.
- [x] 3.8.4 Particles.
- [x] 3.8.5 Post-processing (Bloom).

## 4. New Features
- [x] 4.1 Interactive Tutorial.
- [ ] 4.2 Controls Overlay.
- [ ] 4.3 Key Rebinding UI.
- [x] 4.4 Sensitivity Controls.
- [x] 4.5 Snap-behind Tuning (via code/defaults).
- [ ] 4.6 Altitude Hold.
- [ ] 4.7 Heading Hold.
- [ ] 4.8 Wind System.
- [ ] 4.9 Minimap.
- [x] 4.10 Ring Compass.
- [ ] 4.11 Ring Chains.
- [ ] 4.12 Ring Rarity.
- [ ] 4.13 Battery Pickups.
- [ ] 4.14 Damage Levels.
- [ ] 4.15 Return-to-takeoff Assist.
- [ ] 4.16 Landing Pads.
- [ ] 4.17 Time-of-day.
- [ ] 4.18 Weather.
- [ ] 4.19 Traffic Density.
- [ ] 4.20 Ambient Life (Silhouettes).
- [ ] 4.21 Destructible Micro-props.
- [ ] 4.22 Photo Mode.
- [ ] 4.23 Flight Replay.
- [ ] 4.24 Challenge Modes.
- [ ] 4.25 Scoring.
- [ ] 4.26 Progression/Cosmetics.
- [x] 4.27 Accessibility Options.
- [ ] 4.28 Audio Mixer.
- [ ] 4.29 Performance HUD.
