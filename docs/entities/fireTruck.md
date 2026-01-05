# Fire Truck

## Overview
The **Fire Truck** is a specialized emergency vehicle designed for the Infrastructure district. It extends the standard `VehicleEntity`, allowing it to follow waypoint paths and navigate the city streets.

## Visuals
The model is a **Composite Geometry** constructed entirely from primitives, avoiding external assets:
- **Chassis**: A Red `BoxGeometry` forms the main water tank and equipment storage.
- **Cab**: A separate Red `BoxGeometry` with a blue `Window` material.
- **Wheels**: Six `CylinderGeometry` meshes arranged in a 3-axle configuration.
- **Ladder**: A `Group` containing rotated `BoxGeometry` rails and `CylinderGeometry` rungs, simulating a hydraulic ladder angled upwards.
- **Lights**: Emissive boxes that toggle intensity in real-time.

## Functionality
- **Movement**: Inherits waypoint following from `VehicleEntity`.
- **Animation**: Implements a custom `update(dt)` loop to oscillate the emissive intensity of its roof lights, simulating a siren flash pattern (Red/White alternating).
- **Physics**: Uses a simplified Box Collider encompassing the entire truck for efficient collision detection.

## Parameters
- **Base Speed**: 12.0 (Slower than standard cars due to weight).
- **Waypoints**: Configurable path points via Dev Mode or `params`.

## Dependencies
- `src/world/entities/vehicles.js` (VehicleEntity)
- `src/world/entities/registry.js` (EntityRegistry)
