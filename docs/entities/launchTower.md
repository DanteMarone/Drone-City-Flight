# Launch Tower Entity

## Overview
The **Launch Tower** is a spaceport infrastructure prop that anchors rocket pads with a rotating service arm and a pulsing beacon. It adds a mechanical silhouette and active warning lighting to launch facilities.

## Visuals
The entity is constructed procedurally using `THREE.Group` and primitive geometries:
- **Concrete Base**: A large reinforced box platform.
- **Steel Tower**: Tall cylinder core with four angled struts.
- **Rotating Service Arm**: Caution-striped beam with a brace and torus service ring.
- **Fuel Tank**: Cylindrical tank with a rounded cap.
- **Beacon + Antenna**: Emissive sphere and slim antenna mast.

## Key Parameters
- **height**: Total tower height (default `9–12`).
- **armLength**: Length of the rotating service arm (default `4–6`).
- **beaconColor**: Hex color for the warning beacon (default `0xff6b6b`).
- **spinSpeed**: Rotation speed for the arm (default `0.3–0.55`).

## Usage
- **Class**: `LaunchTowerEntity`
- **Type Key**: `launchTower`
- **Registry**: Registered in `src/world/entities/index.js`.
- **Category**: Props / Infrastructure

## Dependencies
- Extends `BaseEntity`.
- Uses `TextureGenerator.createConcrete` and a custom `CanvasTexture` for caution stripes.
