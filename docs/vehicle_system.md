# Vehicle System

**Status:** Active
**Source:** `src/world/entities/vehicles.js`, `src/world/entities/bus.js`

## Overview
The vehicle system provides simple autonomous agents that follow defined paths. The core logic is handled by `VehicleEntity`, with specialized behaviors for different vehicle types (e.g., buses, trucks).

## Core Concepts

### Waypoints
Vehicles navigate using a list of 3D points (`waypoints`).
*   **Path:** The vehicle moves in a straight line from its current position to the next waypoint.
*   **Target Index:** The entity maintains `userData.targetIndex` to track the next destination.
*   **Looping:** By default, when a vehicle reaches the last waypoint, it loops back to the start (Index 0).

### Movement Logic
*   Vehicles move at `baseSpeed` * `dt`.
*   Rotation is updated to `lookAt` the target waypoint.
*   Movement is handled in `update(dt)`.

## Vehicle Types

### 1. Standard Vehicle (`CarEntity`, `BicycleEntity`)
*   **Behavior:** Continuous looping through waypoints.
*   **Speed:** Constant.
*   **Source:** `src/world/entities/vehicles.js`

### 2. Pickup Truck (`PickupTruckEntity`)
*   **Behavior:** "Ping-Pong" traversal.
    *   Traverses waypoints 0 -> N.
    *   At the end, waits for `waitTime`.
    *   Reverses direction (N -> 0).
    *   Waits at the start, then repeats.
*   **Params:** `params.waitTime` (default: 10s).
*   **Source:** `src/world/entities/vehicles.js`

### 3. Bus (`BusEntity`, `CityBusEntity`, `SchoolBusEntity`)
*   **Behavior:** "Stop-and-Go".
    *   Stops at **every** waypoint (simulating bus stops).
    *   Waits for `waitTime` before moving to the next.
    *   Loops back to start after the last waypoint.
*   **Params:** `params.waitTime` (default: 5s).
*   **Source:** `src/world/entities/bus.js`

## Data Model
Serialized entities include:
```json
{
  "type": "car",
  "params": {
    "waypoints": [{"x": 10, "y": 0, "z": 10}, ...],
    "waitTime": 5
  }
}
```
