# Tugboat Entity

## Title/Overview
**Tugboat** (`tugboat`)
A robust, industrial-style work boat designed for river patrol and harbor operations. It adds maritime activity to the river system and can function as a dynamic vehicle or a static prop.

## Visuals
The Tugboat is constructed using composite primitives to ensure a distinct silhouette without external assets:
*   **Hull:** A composite of `BoxGeometry` (Main Hull) and `ConeGeometry` (Bow), creating a tapered front and stable rear. Colored in classic "Oxide Red".
*   **Deck:** Grey decking with a raised pilot house section.
*   **Cabin:** White superstructure with a distinct upper "Pilot House" featuring dark windows.
*   **Smokestack:** A rear-leaning black cylinder (`CylinderGeometry`) mimicking diesel exhaust stacks.
*   **Details:**
    *   **Tire Bumpers:** Black `TorusGeometry` rings hanging along the port and starboard sides.
    *   **Life Ring:** A safety orange `TorusGeometry` mounted on the rear cabin wall.

## Key Parameters
*   **Speed:** `5.4` (approx. 30% of standard car speed), reflecting its heavy displacement nature.
*   **Bobbing Animation:** Implements a custom sine-wave animation on the `hullGroup` child object, simulating buoyancy (Heave, Pitch, and Roll) independent of the path movement.

## Dependencies
*   **Parent Class:** `VehicleEntity` (inherits pathfinding and waypoint logic).
*   **Geometries:** `BoxGeometry`, `ConeGeometry`, `CylinderGeometry`, `TorusGeometry`.
*   **Materials:** `MeshStandardMaterial` for realistic lighting interaction.

## Usage
1.  **Placement:** Select "Tugboat" from the "Vehicles" palette.
2.  **Pathing:** Drag the "Add Waypoint" handle to create a patrol route along the river surface.
3.  **Behavior:** The tugboat will move between waypoints and loop or reverse based on standard vehicle logic, while continuously bobbing in the water.
