# Drone System

## Overview

The Drone is the primary player-controlled entity in *Drone City Flight*. It is a custom physics-driven character controller that combines kinematic movement with arcade-style flight dynamics.

## Architecture

The Drone is implemented in `src/drone/drone.js` and does not inherit from `BaseEntity`. Instead, it is managed directly by the `App` and `World` classes.

### Component Structure

The visual representation uses a hierarchical `THREE.Group` structure to separate flight physics (Yaw/Position) from visual banking (Pitch/Roll).

```mermaid
graph TD
    A[Drone.mesh (Parent Group)] -->|Controls Position & Yaw| B
    B[TiltGroup (Child Group)] -->|Controls Pitch & Roll| C
    C[Fuselage]
    C[Arms]
    C[Motors & Propellers]
    C[Camera Gimbal]
```

### Visual Effects

- **Whiteout / Altitude Ceiling**: As the drone approaches the maximum altitude (`CONFIG.DRONE.MAX_ALTITUDE` = 120m), a whiteout effect is applied using a full-screen DOM overlay (`div`) and scene fog to simulate cloud cover.
- **Propellers**: Rotated continuously in `_updateVisuals` based on current velocity.
- **Tilt**: The `TiltGroup` rotates locally based on input velocity to simulate banking without affecting the actual movement vector.

## Physics & Movement

Physics are handled in `_updatePhysics(dt, input)`. The system uses a pseudo-kinematic approach:

1. **Acceleration**: Input is converted to a world-space acceleration vector, rotated by the current Yaw.
2. **Velocity**: Integrated over time, with separate Drag coefficients for horizontal (`DRAG`) and vertical (`VERTICAL_DRAG`) axes.
3. **Collision**: Resolved via `PhysicsEngine` (`src/drone/physics.js`), which handles sphere-based collision responses (Bounce + Slide).
4. **Wind**: External wind forces from `World.wind` are applied as additive velocity.

### Configuration (`src/config.js`)

| Parameter | Key | Default | Description |
|---|---|---|---|
| Max Speed | `MAX_SPEED` | 18.0 | Maximum horizontal velocity (m/s). |
| Acceleration | `ACCELERATION` | 26.0 | Movement force. |
| Drag | `DRAG` | 2.8 | Air resistance. |
| Max Altitude | `MAX_ALTITUDE` | 120 | Ceiling height in meters. |
| Tilt Max | `TILT_MAX` | 0.3 | Max visual banking angle (radians). |

## Battery System

The drone's energy is managed by `BatteryManager` (`src/drone/battery.js`).

- **Drain**: Occurs when `speed > 0.1` (Hovering drains 0). Rate: `CONFIG.BATTERY.DRAIN_RATE`.
- **Recharge**: Occurs when landed on a `LandingPadEntity`. Rate: `CONFIG.BATTERY.RECHARGE_RATE`.
- **Depletion**: Triggers game over or forced landing (gameplay dependent).

## Controls

Inputs are mapped in `src/core/input.js` and passed to `Drone.update`.

- **W/S (or I/K)**: Ascend / Descend
- **A/D (or J/L)**: Yaw Left / Right
- **Arrows**: Horizontal Movement (Forward/Back/Left/Right)
- **Q/E**: Camera Tilt (Handled by CameraController, not Drone)
