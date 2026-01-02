# Person Mode

## Overview
Person Mode introduces an on-foot character controller alongside the existing drone. The player can toggle between **Drone** and **Person** modes, with the HUD switching from a battery bar to a life bar (0–100).

## Controls
- **Move:** Arrow keys or **I/J/K/L**
- **Turn:** **A / D**
- **Jump:** **Space**
- **Toggle Mode:** **M**

## Implementation Notes
- **Controller:** `src/person/person.js` defines the kinematic movement, turning, gravity, and jumping.
- **Life:** `src/person/life.js` tracks life (0–100) and powers the HUD bar.
- **Mode Switching:** `src/core/app.js` manages active mode, camera target swapping, and HUD label updates.
- **Camera:** `src/drone/camera.js` now follows a generic target (drone or person).
- **HUD:** `src/ui/hud.js` supports switching the bar label between **BATTERY** and **LIFE**.

## Dependencies
- `CONFIG.PERSON` in `src/config.js` defines movement, gravity, and collision settings.
- Collision detection uses the shared `PhysicsEngine` and `ColliderSystem` pipeline.
