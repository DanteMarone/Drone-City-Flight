# Street Sweeper Entity

## Overview
The **Street Sweeper** is a utility vehicle designed to clean the city streets. It features a compact cab, a rear debris tank, and animated rotating brushes. It moves at a slower pace than standard vehicles, emphasizing its functional role in the urban environment.

## Visuals
The mesh is constructed using a composite of Three.js primitives:
- **Chassis:** A robust BoxGeometry base.
- **Cab:** A BoxGeometry with window cutouts represented by transparent materials.
- **Tank:** A CylinderGeometry representing the water/debris storage.
- **Brushes:** Two front disc brushes and one rear roller brush, all animated to spin during movement.
- **Wheels:** Industrial-style CylinderGeometry wheels.
- **Beacon:** An orange emissive beacon on the roof.

## Functionality
- **Movement:** Extends `VehicleEntity`, allowing it to follow road waypoints.
- **Animation:** The `update(dt)` method rotates the front brushes inward and the rear roller brush against the ground to simulate sweeping action.
- **Speed:** Moves significantly slower than regular traffic (`0.4x` base speed).

## Key Parameters
- `color`: Primary paint color (defaults to White).
- `baseSpeed`: Derived from `CONFIG.DRONE.MAX_SPEED` but scaled down.

## Dependencies
- `VehicleEntity` (Parent Class)
- `THREE.Group`, `THREE.Mesh`, `THREE.BoxGeometry`, `THREE.CylinderGeometry`
