# Vehicle System Architecture

**Status:** Active
**Main Classes:** `VehicleEntity`, `BusEntity`, `PickupTruckEntity`
**Source:** `src/world/entities/vehicles.js`, `bus.js`, `deliveryVan.js`, etc.

## 1. Overview
The Vehicle System enables dynamic, path-following entities in the world. Unlike static props, vehicles update their position every frame based on a list of `waypoints`. They do not currently have complex collision avoidance (traffic logic), but they do respect speed limits, wait times, and loop/ping-pong behaviors.

## 2. Core Architecture

### `VehicleEntity` (Base Class)
*   **Pathing:** Stores a list of `waypoints` (Vector3).
*   **Movement:** Moves from `currentWaypointIndex` to the next.
    *   Interpolates position based on `baseSpeed`.
    *   Rotates to face the target waypoint.
*   **State:**
    *   `isMoving`: Boolean flag.
    *   `waitTime`: How long to pause at specific stops (e.g., Bus Stops).
    *   `loop`: Boolean. If true, loops back to start. If false, might reverse (ping-pong) or stop.

### Key Subclasses
*   **`BusEntity`**: Slower speed. Implements specific logic for stopping at `BusStopEntity` locations if integrated.
*   **`PickupTruckEntity`**: Implements "Ping-Pong" logic (reverses direction at the end of the path instead of teleporting to start).
*   **`PoliceCarEntity`**: Faster speed. Visuals include flashing lights (animated in `update()`).
*   **`CementMixerEntity`**: Animated drum rotation in `update()`.

## 3. Path Creation (Dev Mode)
*   **Waypoints:** Created via the "Add Waypoint" tool in Dev Mode (typically Shift+Click on a selected vehicle).
*   **Visualization:** Waypoints are rendered as small spheres connected by lines (Gizmos) when the vehicle is selected.
*   **Storage:** Waypoints are serialized in the `params.waypoints` array of the entity.

## 4. Current Limitations
*   **Collision:** Vehicles clip through each other. No local avoidance.
*   **Traffic Manager:** No central brain to spawn/despawn vehicles based on player proximity. All vehicles are persistent entities.
*   **Curved Paths:** Paths are strictly linear segments. "Organic Curve" support will require updating the interpolation logic to support splines.

## 5. Future Work
*   **Spline Support:** Integrate with `CurveRoadEntity` to follow smooth curves.
*   **Traffic System:** Implement a manager to handle density and intersections.
