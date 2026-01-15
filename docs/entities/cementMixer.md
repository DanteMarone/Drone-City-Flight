# Cement Mixer Entity

**File:** `src/world/entities/cementMixer.js`
**Extends:** `PickupTruckEntity` (from `src/world/entities/vehicles.js`)

## Overview
The `CementMixerEntity` is a specialized heavy vehicle that simulates a construction cement mixer. It inherits path-following capabilities (ping-pong movement) from `PickupTruckEntity` and adds a custom composite geometry with a rotating mixing drum animation.

## Visual Structure
The entity is procedurally generated using standard Three.js geometries grouped into a `modelGroup`:

1.  **Chassis**: A metal `BoxGeometry` forming the base.
2.  **Cab**: An industrial yellow (`0xFFC107`) cabin with glass windows and headlights.
3.  **Mixer Drum**:
    *   Main body: A `CylinderGeometry` tilted upwards.
    *   Rear cap: A `ConeGeometry`.
    *   **Animation**: The entire `drumPivot` group rotates around its local Z-axis to simulate mixing.
    *   Visual aids: Torus stripes added to the drum to make rotation visible.
4.  **Wheels**: Three axles (1 front, 2 rear) using black cylinders.
5.  **Discharge Chute**: A metal chute at the rear.

## Behavior & Logic

### Movement
*   **Pathing**: Inherits "Ping-Pong" behavior from `PickupTruckEntity`. It travels to the end of a path, waits, reverses, and returns.
*   **Speed**: Slower than standard vehicles.
    *   `baseSpeed`: Calculated as `CONFIG.DRONE.MAX_SPEED * 0.6` (approx 10.8 units/sec).

### Animation
*   **Drum Rotation**: The drum rotates continuously in `update(dt)`.
    *   `drumSpeed`: Fixed at `2.0` radians/second.

## Configuration & Parameters

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `type` | String | `'cementMixer'` | Entity registry key. |
| `baseSpeed` | Number | `~10.8` | Movement speed along the path. |
| `drumSpeed` | Number | `2.0` | Rotation speed of the mixer drum. |

## Dependencies
*   **`src/world/entities/vehicles.js`**: Provides the base `PickupTruckEntity` class for movement logic.
*   **`src/world/entities/registry.js`**: Registers the entity for use in the system.
*   **`src/config.js`**: Supplies `CONFIG.DRONE.MAX_SPEED` for speed calculation.
