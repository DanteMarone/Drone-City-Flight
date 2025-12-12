# Project Status & Requirements

## 1. Product Goals
- [ ] 1.1 Single-player casual drone flight (Chrome/Edge/Firefox).
- [ ] 1.2 Arcade-realistic feel.
- [ ] 1.3 Core loops: explore, battery, rings, collisions.
- [ ] 1.4 Alive world (traffic, audio, animation).

## 2. Hard Constraints
- [x] 2.1 Three.js (WebGL).
- [x] 2.2 Vite dev server.
- [x] 2.3 No paid assets.
- [ ] 2.4 Custom physics + bounding volumes.
- [ ] 2.5 Deterministic deltaTime behavior.
- [ ] 2.6 Performance first (stable FPS, LOD, culling).

## 3. Minimum Viable Feature Set
### 3.1 World
- [ ] 3.1.1 Cohesive open world (Downtown, Suburbs, Commercial, Parks, Forest, Water, Roads).
- [ ] 3.1.2 Smooth transitions (no loading screens).
- [ ] 3.1.3 Spawn area.

### 3.2 Drone & Controls
- [ ] 3.2.1 Movement (Takeoff, Yaw, Translate, Vertical).
- [ ] 3.2.2 Input Mapping (WASD, Arrows, Q/E, C, Shift, R, Esc).
- [ ] 3.2.3 Horizontal orientation constraint.
- [ ] 3.2.4 Chase camera snap-behind.
- [ ] 3.2.5 Gamepad support (optional).

### 3.3 Collision
- [ ] 3.3.1 Collisions with static world & cars.
- [ ] 3.3.2 Efficient detection (broadphase).
- [ ] 3.3.3 Feedback (Particles, Audio, Shake).
- [ ] 3.3.4 Response (Bounce/Crash).
- [ ] 3.3.5 Reset available.

### 3.4 Battery
- [ ] 3.4.1 Visible HUD.
- [ ] 3.4.2 Drain rules (Hover=0, Move, Ascend>Descend, Boost).
- [ ] 3.4.3 Depletion logic.

### 3.5 Rings
- [ ] 3.5.1 Procedural spawning.
- [ ] 3.5.2 Valid placement checks.
- [ ] 3.5.3 Trigger rewards (Battery, Audio, Particles).
- [ ] 3.5.4 Lifecycle logic.

### 3.6 UI/HUD
- [ ] 3.6.1 Readable UI.
- [ ] 3.6.2 HUD Elements (Battery, Speed, Altitude, Rings, Status).
- [ ] 3.6.3 Pause Menu.
- [ ] 3.6.4 Accessibility (Remap, Shake toggle).

### 3.7 Audio
- [ ] 3.7.1 Drone motor pitch.
- [ ] 3.7.2 Ambient beds.
- [ ] 3.7.3 SFX (Pickup, Collision).
- [ ] 3.7.4 Synthesis/Procedural.

### 3.8 Visual Polish
- [ ] 3.8.1 Sunlight + Shadows.
- [ ] 3.8.2 Atmosphere/Fog.
- [ ] 3.8.3 Water material.
- [ ] 3.8.4 Particles.
- [ ] 3.8.5 Post-processing (Bloom).

## 4. New Features
- [ ] 4.1 Interactive Tutorial.
- [ ] 4.2 Controls Overlay.
- [ ] 4.3 Key Rebinding UI.
- [ ] 4.4 Sensitivity Controls.
- [ ] 4.5 Snap-behind Tuning.
- [ ] 4.6 Altitude Hold.
- [ ] 4.7 Heading Hold.
- [ ] 4.8 Wind System.
- [ ] 4.9 Minimap.
- [ ] 4.10 Ring Compass.
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
- [ ] 4.27 Accessibility Options.
- [ ] 4.28 Audio Mixer.
- [ ] 4.29 Performance HUD.
